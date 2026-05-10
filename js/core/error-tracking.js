/* ============================================================
   MilkyPot Error Tracking — captura erros em produção
   ============================================================
   Camadas:
   1. Queue localStorage (sempre)
   2. Firestore error_log (quando online)
   3. Sentry (opcional, se window.SENTRY_DSN configurado OU
      <meta name="sentry-dsn" content="https://..."> presente)

   Sentry alerta em tempo real (Slack/email) — substitui o
   error_log caseiro que ninguem monitora.

   Setup Sentry:
   - Crie projeto free em sentry.io (JavaScript / Browser)
   - Defina <meta name="sentry-dsn" content="<DSN>"> em
     index.html (ou window.SENTRY_DSN antes deste script)
   - SDK carregado on-demand do CDN da Sentry quando configurado.

   Uso: incluir script em qualquer página crítica.
   Auto-instala handlers na carga.
   ============================================================ */
(function(global){
    'use strict';
    if (global._mpErrorTrackingLoaded) return;
    global._mpErrorTrackingLoaded = true;

    const QUEUE_KEY = 'mp_error_queue';
    const MAX_QUEUE = 50;  // Limite local pra não estourar localStorage
    const SAMPLE_RATE = 1.0; // 100% — ajuste se virar caro

    // Sentry DSN: window.SENTRY_DSN tem prioridade; senao <meta name="sentry-dsn">
    function _resolveSentryDsn() {
        try {
            if (global.SENTRY_DSN) return global.SENTRY_DSN;
            const m = document.querySelector('meta[name="sentry-dsn"]');
            if (m && m.content && m.content.trim()) return m.content.trim();
        } catch(e) {}
        return null;
    }
    const _SENTRY_DSN = _resolveSentryDsn();

    // Carga lazy do Sentry SDK (CDN) — so quando DSN configurado.
    function _initSentry() {
        if (!_SENTRY_DSN || global.Sentry) return;
        const s = document.createElement('script');
        s.src = 'https://browser.sentry-cdn.com/8.20.0/bundle.tracing.min.js';
        s.crossOrigin = 'anonymous';
        s.async = true;
        s.onload = function() {
            try {
                global.Sentry.init({
                    dsn: _SENTRY_DSN,
                    environment: location.hostname.includes('localhost') ? 'dev' : 'prod',
                    tracesSampleRate: 0.1,
                    release: (global.MP && global.MP.CACHE_VERSION) || 'unknown',
                    beforeSend(event) {
                        // Adiciona contexto MilkyPot
                        try {
                            const s = global.Auth && global.Auth.getSession && global.Auth.getSession();
                            if (s) {
                                event.user = event.user || {};
                                event.user.id = s.uid || s.name;
                                event.user.role = s.role;
                                event.tags = event.tags || {};
                                event.tags.franchiseId = s.franchiseId;
                            }
                        } catch(_) {}
                        return event;
                    }
                });
            } catch(e) { console.warn('[ErrorTracking] Sentry init failed:', e); }
        };
        document.head.appendChild(s);
    }
    _initSentry();

    function _queue() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        } catch(e) { return []; }
    }

    function _push(err) {
        if (Math.random() > SAMPLE_RATE) return;
        const q = _queue();
        q.push(err);
        while (q.length > MAX_QUEUE) q.shift();
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch(e) {}
    }

    function _send(err) {
        _push(err);
        // Firestore se disponível
        try {
            if (global.firebase && global.firebase.firestore) {
                global.firebase.firestore().collection('error_log').add(err)
                    .catch(() => {}); // silent fail (não queremos loop de erros)
            }
        } catch(e) {}
        // Sentry se carregado (alerta em tempo real)
        try {
            if (global.Sentry && global.Sentry.captureException) {
                const e = new Error(err.message || 'unknown');
                if (err.stack) e.stack = err.stack;
                global.Sentry.withScope(scope => {
                    scope.setContext('milkypot', {
                        url: err.url, userId: err.userId,
                        role: err.role, franchiseId: err.franchiseId,
                        extra: err.extra
                    });
                    global.Sentry.captureException(e);
                });
            }
        } catch(_) {}
    }

    function capture(error, extra) {
        const info = {
            at: new Date().toISOString(),
            url: location.href,
            userAgent: navigator.userAgent,
            message: (error && (error.message || error.toString())) || 'unknown',
            stack: error && error.stack ? error.stack.slice(0, 2000) : null,
            extra: extra || null
        };
        try {
            const s = global.Auth && global.Auth.getSession && global.Auth.getSession();
            if (s) {
                info.userId = s.uid || s.name;
                info.role = s.role;
                info.franchiseId = s.franchiseId;
            }
        } catch(e) {}
        _send(info);
    }

    // Window error handler
    global.addEventListener('error', function(event) {
        capture(event.error || new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    // Unhandled promise rejections
    global.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        const err = reason instanceof Error ? reason : new Error(String(reason));
        capture(err, { type: 'unhandled-promise' });
    });

    global.ErrorTracking = {
        capture,
        getQueue: _queue,
        clear: () => { try { localStorage.removeItem(QUEUE_KEY); } catch(e) {} },
        flush: () => {
            const q = _queue();
            if (!q.length) return Promise.resolve({ flushed: 0 });
            // Flush para Firestore em batch
            if (!global.firebase || !global.firebase.firestore) return Promise.resolve({ flushed: 0, reason: 'no-firestore' });
            try {
                const db = global.firebase.firestore();
                const batch = db.batch();
                q.forEach(e => { batch.set(db.collection('error_log').doc(), e); });
                return batch.commit().then(() => {
                    localStorage.removeItem(QUEUE_KEY);
                    return { flushed: q.length };
                });
            } catch(e) {
                return Promise.resolve({ flushed: 0, error: e.message });
            }
        }
    };

    // Auto-flush a cada 5min
    setInterval(() => {
        if (navigator.onLine && _queue().length > 0) {
            global.ErrorTracking.flush();
        }
    }, 300000);
})(typeof window !== 'undefined' ? window : this);
