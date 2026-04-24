/* ============================================
   MilkyPot - MilkyClube Push (FCM)
   ============================================
   Envolve Firebase Cloud Messaging para Web Push.
   Exige:
   - firebase-messaging-compat.js carregado.
   - firebase-messaging-sw.js registrado na raiz.
   - VAPID key em window.MILKYPOT_VAPID_KEY (ver README do clube).
   ============================================ */

(function() {
    'use strict';

    var state = {
        messaging: null,
        swRegistration: null,
        lastToken: null,
        lastPlatform: null,
        initialized: false
    };

    function log() {
        try { console.log.apply(console, ['[MilkyClubePush]'].concat([].slice.call(arguments))); } catch(e){}
    }
    function warn() {
        try { console.warn.apply(console, ['[MilkyClubePush]'].concat([].slice.call(arguments))); } catch(e){}
    }

    function detectPlatform() {
        var ua = (navigator.userAgent || '').toLowerCase();
        if (/android/.test(ua)) return 'android';
        if (/iphone|ipad|ipod/.test(ua)) return 'ios';
        return 'web';
    }

    function isSupported() {
        if (typeof window === 'undefined') return false;
        if (!('serviceWorker' in navigator)) return false;
        if (!('Notification' in window)) return false;
        if (!('PushManager' in window)) return false;
        if (typeof firebase === 'undefined' || !firebase.messaging) return false;
        return true;
    }

    async function ensureServiceWorker() {
        if (state.swRegistration) return state.swRegistration;
        try {
            // FCM exige SW dedicado na raiz.
            var reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            state.swRegistration = reg;
            return reg;
        } catch(e) {
            warn('registro do SW de messaging falhou:', e && e.message);
            throw e;
        }
    }

    function callable(name) {
        if (typeof CloudFunctions !== 'undefined' && CloudFunctions && typeof CloudFunctions.call === 'function') {
            return function(data) { return CloudFunctions.call(name, data || {}); };
        }
        if (typeof firebase !== 'undefined' && firebase.functions) {
            var fns = firebase.app().functions('southamerica-east1');
            var fn = fns.httpsCallable(name);
            return function(data) {
                return fn(data || {}).then(function(r) { return r && r.data; });
            };
        }
        return function() { return Promise.reject(new Error('Functions indisponível')); };
    }

    var MilkyClubePush = {

        async init() {
            if (state.initialized) return;
            if (!isSupported()) {
                warn('navegador não suporta Web Push');
                state.initialized = true;
                return;
            }
            try {
                state.messaging = firebase.messaging();
                // Foreground — notificações quando o app está aberto
                state.messaging.onMessage(function(payload) {
                    try {
                        var n = (payload && payload.notification) || {};
                        var title = n.title || 'MilkyClube';
                        var body = n.body || '';
                        if (typeof Utils !== 'undefined' && Utils.showToast) {
                            Utils.showToast(title + (body ? ' — ' + body : ''), 'info');
                        } else {
                            log('fg message:', title, body);
                        }
                    } catch(e) { warn('onMessage erro:', e && e.message); }
                });
            } catch(e) {
                warn('init messaging falhou:', e && e.message);
            }
            state.initialized = true;
        },

        /**
         * Pede permissão + getToken + registra via Cloud Function.
         */
        async requestAndRegister() {
            await this.init();
            if (!isSupported()) {
                throw new Error('Notificações não suportadas neste navegador.');
            }
            var vapid = window.MILKYPOT_VAPID_KEY;
            if (!vapid || vapid === 'YOUR_VAPID_KEY') {
                throw new Error('VAPID key não configurada. Defina window.MILKYPOT_VAPID_KEY.');
            }
            // Permissão
            var perm = Notification.permission;
            if (perm === 'default') {
                perm = await Notification.requestPermission();
            }
            if (perm !== 'granted') {
                throw new Error('Permissão negada.');
            }
            var reg = await ensureServiceWorker();
            var token;
            try {
                token = await state.messaging.getToken({
                    vapidKey: vapid,
                    serviceWorkerRegistration: reg
                });
            } catch(e) {
                warn('getToken erro:', e && e.message);
                throw new Error('Não foi possível gerar token de notificação.');
            }
            if (!token) throw new Error('Token vazio.');
            state.lastToken = token;
            state.lastPlatform = detectPlatform();
            // Registra no backend (idempotente no backend)
            try {
                var fn = callable('clubRegisterFcmToken');
                await fn({ token: token, platform: state.lastPlatform, userAgent: navigator.userAgent || '' });
            } catch(e) {
                warn('registro do token no backend falhou:', e && e.message);
                // Mesmo sem backend, o token é útil pra debug — não explode
            }
            return { token: token };
        },

        /**
         * Remove token atual e avisa o backend.
         */
        async unregister() {
            if (!state.messaging) return;
            try {
                if (state.lastToken) {
                    await state.messaging.deleteToken();
                    try {
                        var fn = callable('clubUnregisterFcmToken');
                        await fn({ token: state.lastToken });
                    } catch(e) {}
                    state.lastToken = null;
                }
            } catch(e) {
                warn('unregister erro:', e && e.message);
            }
        },

        isSupported: isSupported,
        detectPlatform: detectPlatform,
        getLastToken: function() { return state.lastToken; }
    };

    window.MilkyClubePush = MilkyClubePush;

})();
