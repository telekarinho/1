/* Service Worker — Portal do Colaborador MilkyPot
   Cache-first para assets, network-first para HTML, push notifications.
*/
const SW_VERSION = 'mp-colab-v2';
const CACHE_NAME = 'milkypot-colaborador-' + SW_VERSION;

const PRECACHE = [
    '/colaborador/',
    '/colaborador/index.html',
    '/colaborador/manifest.json',
    '/js/core/constants.js',
    '/js/core/utils.js',
    '/js/core/datastore.js',
    '/js/core/firebase-config.js',
    '/js/core/time-clock.js',
    '/js/core/staff-benefits.js',
    '/images/logo-milkypot.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(PRECACHE.map((u) => cache.add(u).catch(() => null)))
        )
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_NAME && n.startsWith('milkypot-colaborador-')).map((n) => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // Firebase API: passa direto (Firebase tem retry proprio)
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('cloudfunctions.net')) {
        return;
    }

    // HTML: network-first (sempre versao nova quando online)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                return res;
            }).catch(() =>
                caches.match(request).then((c) => c || caches.match('/colaborador/index.html'))
            )
        );
        return;
    }

    // Assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((res) => {
                if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                }
                return res;
            }).catch(() => caches.match(request));
        })
    );
});

// === PUSH NOTIFICATIONS (lembretes de bater ponto) ===
self.addEventListener('push', (event) => {
    let data = { title: 'MilkyPot', body: 'Lembrete do seu ponto', url: '/colaborador/' };
    try {
        if (event.data) data = Object.assign(data, event.data.json());
    } catch (e) {}

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/images/logo-milkypot.png',
            badge: '/images/logo-milkypot.png',
            data: { url: data.url || '/colaborador/' },
            vibrate: [200, 100, 200],
            tag: data.tag || 'mp-func',
            renotify: !!data.renotify,
            requireInteraction: !!data.requireInteraction,
            actions: [
                { action: 'open', title: 'Abrir e bater ponto' },
                { action: 'snooze', title: 'Daqui 10min' }
            ]
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'snooze') {
        // Agenda novo lembrete em 10min
        setTimeout(() => {
            self.registration.showNotification('MilkyPot — Lembrete', {
                body: 'Não esqueça de bater seu ponto!',
                icon: '/images/logo-milkypot.png',
                vibrate: [200, 100, 200]
            });
        }, 10 * 60 * 1000);
        return;
    }
    const url = event.notification.data?.url || '/colaborador/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((winClients) => {
            for (const client of winClients) {
                if (client.url.includes('/colaborador/') && 'focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});

// Suporta lembretes locais via setInterval no SW (limitado pelo SO)
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data?.type === 'SCHEDULE_REMINDER') {
        const { delayMs, body, tag } = event.data;
        setTimeout(() => {
            self.registration.showNotification('MilkyPot — Lembrete', {
                body: body || 'Não esqueça de bater seu ponto!',
                icon: '/images/logo-milkypot.png',
                badge: '/images/logo-milkypot.png',
                tag: tag || 'mp-func-reminder',
                vibrate: [200, 100, 200],
                actions: [
                    { action: 'open', title: 'Bater agora' },
                    { action: 'snooze', title: 'Daqui 10min' }
                ]
            });
        }, delayMs);
    }
});
