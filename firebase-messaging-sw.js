/* ============================================
   MilkyPot - Firebase Messaging Service Worker
   ============================================
   SW dedicado para Web Push do Firebase Cloud Messaging.
   Obrigatório na raiz pelo FCM (não substitui o sw.js do app).
   Não faz precache nem rotas — só background messages.
   ============================================ */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Mesma configuração do cliente (js/core/firebase-config.js)
firebase.initializeApp({
    apiKey: 'AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA',
    authDomain: 'milkypot-ad945.firebaseapp.com',
    projectId: 'milkypot-ad945',
    storageBucket: 'milkypot-ad945.firebasestorage.app',
    messagingSenderId: '859364650620',
    appId: '1:859364650620:web:aecf11f4cf99b7792463f9'
});

var messaging = firebase.messaging();

// Notificação em background — mostra manualmente pra controlar ícone/click.
messaging.onBackgroundMessage(function(payload) {
    try {
        var n = (payload && payload.notification) || {};
        var d = (payload && payload.data) || {};
        var title = n.title || 'MilkyClube';
        var options = {
            body: n.body || '',
            icon: '/images/logo-milkypot.png',
            badge: '/images/logo-milkypot.png',
            data: {
                url: d.url || n.click_action || '/clube.html'
            },
            tag: d.tag || 'milkyclube',
            renotify: false
        };
        return self.registration.showNotification(title, options);
    } catch (e) {
        // falha silenciosa
    }
});

// Clique na notificação — foca/abre o clube
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var targetUrl = (event.notification.data && event.notification.data.url) || '/clube.html';
    event.waitUntil((async function() {
        try {
            var all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (var i = 0; i < all.length; i++) {
                var c = all[i];
                if (c.url && c.url.indexOf('/clube') !== -1 && 'focus' in c) {
                    c.navigate(targetUrl);
                    return c.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        } catch (e) {}
    })());
});
