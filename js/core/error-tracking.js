/* ============================================================
   MilkyPot Error Tracking — captura erros em produção
   ============================================================
   Sem Sentry pago: captura erros window e grava localmente +
   manda para Firestore quando online. Admin vê em /painel/auditoria.

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
