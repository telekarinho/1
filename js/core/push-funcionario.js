/* MilkyPot — FCM push for portal do funcionario
   Subscribe + token salvo em fcm_subscriptions/{franchiseId}/{staffId}.
   Cloud Function `cron_remindPunch` (a criar) usa esses tokens. */
(function () {
    'use strict';

    var COLLECTION = 'fcm_subscriptions';

    function nowIso() { return new Date().toISOString(); }

    /**
     * Solicita permissao + obtem FCM token + salva no Firestore vinculado ao staffId.
     */
    async function subscribe(franchiseId, staffId) {
        if (!('Notification' in window)) return { success: false, error: 'Sem suporte a notificacoes' };
        if (typeof firebase === 'undefined' || !firebase.messaging) {
            // Fallback: pelo menos pede permissao pra notificacoes locais via SW
            var perm = await Notification.requestPermission();
            return { success: perm === 'granted', error: perm === 'granted' ? null : 'Permissao negada', mode: 'local_only' };
        }

        try {
            var perm = await Notification.requestPermission();
            if (perm !== 'granted') return { success: false, error: 'Permissao negada' };

            var messaging = firebase.messaging();
            // Tenta obter VAPID key do SW
            var swReg = await navigator.serviceWorker.getRegistration('/funcionario/');
            var token = null;
            try {
                token = await messaging.getToken({
                    vapidKey: window.MP_FCM_VAPID_KEY || 'BAjJDEh3BZsxBDRlLXhLOZomMpCpv-FHsApsPGCvRcj3GjE3kF3Lfok4JgRs8Rdmpx3pq530i5ceVIsnngyyyBE',
                    serviceWorkerRegistration: swReg
                });
            } catch (e) {
                // Token via getToken pode falhar — usa subscription manual
                console.warn('[FCM] getToken falhou:', e);
                return { success: false, error: 'Falha obter token: ' + (e.message || e) };
            }
            if (!token) return { success: false, error: 'Token vazio' };

            // Salva no Firestore via DataStore (sync com cloud)
            if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
                var existing = DataStore.getCollection(COLLECTION, franchiseId) || [];
                var prior = existing.find(function (e) { return e.staffId === staffId && e.token === token; });
                if (!prior) {
                    DataStore.addToCollection(COLLECTION, franchiseId, {
                        id: 'fcm_' + staffId + '_' + Date.now(),
                        staffId: staffId,
                        token: token,
                        device: navigator.userAgent.slice(0, 200),
                        platform: navigator.platform || '',
                        subscribedAt: nowIso(),
                        active: true
                    });
                }
            }

            // Onmessage handler — exibe notificacao quando push chega com app aberto
            messaging.onMessage(function (payload) {
                if (Notification.permission === 'granted') {
                    var n = payload.notification || {};
                    new Notification(n.title || 'MilkyPot', {
                        body: n.body || '',
                        icon: '/images/logo-milkypot.png',
                        vibrate: [200, 100, 200]
                    });
                }
            });

            return { success: true, token: token, mode: 'fcm' };
        } catch (e) {
            console.error('[FCM] subscribe error:', e);
            return { success: false, error: e.message || String(e) };
        }
    }

    function isSubscribed(franchiseId, staffId) {
        if (typeof DataStore === 'undefined') return false;
        var subs = DataStore.getCollection(COLLECTION, franchiseId) || [];
        return subs.some(function (s) { return s.staffId === staffId && s.active; });
    }

    async function unsubscribe(franchiseId, staffId) {
        if (typeof DataStore === 'undefined') return { success: false };
        var subs = DataStore.getCollection(COLLECTION, franchiseId) || [];
        var filtered = subs.filter(function (s) { return !(s.staffId === staffId); });
        if (typeof DataStore.saveCollection === 'function') {
            DataStore.saveCollection(COLLECTION, franchiseId, filtered);
        }
        return { success: true };
    }

    window.PushFuncionario = {
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        isSubscribed: isSubscribed
    };
})();
