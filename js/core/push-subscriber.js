/* ============================================================
   MilkyPot Push Subscriber — captura FCM token + permite envio
   ============================================================
   FCM (Firebase Cloud Messaging) requer:
     1. Client subscribe → recebe registration token
     2. Salva token no Firestore associado ao customer
     3. Server (Cloud Function ou admin manual) usa token pra enviar

   Esse módulo cobre passos 1-2 (client). Pra ENVIO server-side,
   instruções no PR description (deploy separado de Cloud Function).

   API:
     PushSubscriber.askPermission() → Notification.permission
     PushSubscriber.subscribe(customerPhone) → salva token no Firestore
     PushSubscriber.showOptInPrompt() → pede permissão no momento certo

   Timing: pedir permissão APÓS user adicionar 1º item no carrinho.
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpPushLoaded) return;
    global._mpPushLoaded = true;

    var VAPID_KEY = 'BAjJDEh3BZsxBDRlLXhLOZomMpCpv-FHsApsPGCvRcj3GjE3kF3Lfok4JgRs8Rdmpx3pq530i5ceVIsnngyyyBE';
    var FCM_LOADED = false;

    function _loadFCM() {
        if (FCM_LOADED || (global.firebase && global.firebase.messaging)) return Promise.resolve();
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js';
            s.onload = function () { FCM_LOADED = true; resolve(); };
            s.onerror = function () { resolve(); };
            document.head.appendChild(s);
        });
    }

    function askPermission() {
        if (!('Notification' in global)) return Promise.resolve('unsupported');
        if (Notification.permission === 'granted') return Promise.resolve('granted');
        if (Notification.permission === 'denied') return Promise.resolve('denied');
        return Notification.requestPermission();
    }

    function subscribe(customerPhone) {
        if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no SW'));
        if (typeof firebase === 'undefined') return Promise.reject(new Error('no firebase'));

        return _loadFCM().then(function () {
            if (!firebase.messaging) throw new Error('no FCM');
            var messaging = firebase.messaging();
            return navigator.serviceWorker.getRegistration().then(function (reg) {
                return messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
            }).then(function (token) {
                if (!token) throw new Error('no token');
                // Save token + customer no Firestore
                if (firebase.firestore) {
                    firebase.firestore().collection('push_subscriptions').doc(token).set({
                        token: token,
                        customerPhone: customerPhone || null,
                        userAgent: navigator.userAgent.slice(0, 200),
                        createdAt: new Date().toISOString(),
                        active: true
                    }, { merge: true }).catch(function(){});
                }
                if (global.MpAnalytics) global.MpAnalytics.track('push_subscribed', { has_phone: !!customerPhone });
                return token;
            });
        });
    }

    function showOptInPrompt(customerPhone) {
        if (sessionStorage.getItem('mp_push_optin_shown') === '1') return;
        if (!('Notification' in global)) return;
        if (Notification.permission !== 'default') return; // já decidiu

        sessionStorage.setItem('mp_push_optin_shown', '1');

        var prompt = document.createElement('div');
        prompt.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(120px);background:#fff;border-radius:16px;padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:380px;z-index:99990;transition:transform .4s cubic-bezier(.34,1.56,.64,1);display:flex;align-items:center;gap:14px;border:2px solid #EC4899';
        prompt.innerHTML =
            '<div style="font-size:32px">🔔</div>' +
            '<div style="flex:1">' +
              '<div style="font-weight:900;color:#831843;font-size:14px">Avisamos quando o pedido sair?</div>' +
              '<div style="font-size:12px;color:#6B7280;margin-top:2px">Notificação só quando o motoboy sair com seu MilkyPot 🛵</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
              '<button id="mpPushYes" style="background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:800;cursor:pointer;font-size:12px">Sim 🔔</button>' +
              '<button id="mpPushNo" style="background:transparent;color:#9CA3AF;border:0;cursor:pointer;font-size:11px">Não</button>' +
            '</div>';
        document.body.appendChild(prompt);
        setTimeout(function () { prompt.style.transform = 'translateX(-50%) translateY(0)'; }, 10);

        function close() {
            prompt.style.transform = 'translateX(-50%) translateY(120px)';
            setTimeout(function () { prompt.remove(); }, 400);
        }

        prompt.querySelector('#mpPushYes').onclick = function () {
            askPermission().then(function (result) {
                if (result === 'granted') {
                    subscribe(customerPhone).catch(function(e){ console.warn('[Push]', e.message); });
                }
                if (global.MpAnalytics) global.MpAnalytics.track('push_permission_response', { result: result });
                close();
            });
        };
        prompt.querySelector('#mpPushNo').onclick = function () {
            if (global.MpAnalytics) global.MpAnalytics.track('push_permission_declined_pre');
            close();
        };
    }

    // Auto-detect: cart tem itens → mostrar prompt depois de 5s
    function _autoShowOnCartActivity() {
        try {
            var cart = JSON.parse(localStorage.getItem('milkypot_cart') || '[]');
            if (cart.length > 0) {
                setTimeout(function () { showOptInPrompt(); }, 5000);
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoShowOnCartActivity);
    } else {
        _autoShowOnCartActivity();
    }

    global.PushSubscriber = {
        askPermission: askPermission,
        subscribe: subscribe,
        showOptInPrompt: showOptInPrompt,
        VERSION: 'mp-v257'
    };
})(typeof window !== 'undefined' ? window : this);
