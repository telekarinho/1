/* ============================================
   MilkyPot — Service Worker registration (global)
   ============================================
   Registra o SW em qualquer página que inclua este script.
   Antes só PDV/TV/radio/promo registravam — outras páginas (pedidos,
   index, financeiro) ficavam SEM offline.
   ============================================ */
(function () {
    'use strict';
    if (!('serviceWorker' in navigator)) return;
    try {
        navigator.serviceWorker.register('/sw.js').then(function (reg) {
            console.log('[SW] registered:', reg.scope);
            // Replay offline queue quando volta online
            window.addEventListener('online', function () {
                if (reg.active) reg.active.postMessage({ type: 'REPLAY_OFFLINE_QUEUE' });
            });
            // Detecta nova versão do SW e força reload pra pegar JS novo
            reg.addEventListener('updatefound', function () {
                var nw = reg.installing;
                if (!nw) return;
                nw.addEventListener('statechange', function () {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SW] new version installed — will activate on next reload');
                    }
                });
            });
        }).catch(function (e) { console.warn('[SW] register failed:', e); });
    } catch (e) {
        console.warn('[SW] register error:', e);
    }
})();
