const CACHE_VERSION = 'mp-v2';
const CACHE_NAME = 'milkypot-v2';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/cardapio.html',
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/css/mobile-app.css',
    '/css/shared-panel.css',
    '/js/core/constants.js',
    '/js/core/utils.js',
    '/js/core/datastore.js',
    '/js/core/firebase-config.js',
    '/js/core/auth.js',
    '/js/cardapio.js',
    '/js/cardapio-data.js',
    '/images/logo-milkypot.png',
    '/manifest.json'
];

const OFFLINE_QUEUE_KEY = 'milkypot-offline-queue';

// Install: precache key files
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Cache First for static assets, Network First for API/Firestore
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests — queue failed writes for offline
    if (request.method !== 'GET') {
        event.respondWith(
            fetch(request).catch(() => {
                return enqueueOfflineRequest(request).then(() => {
                    return new Response(
                        JSON.stringify({ queued: true, message: 'Request queued for retry when online' }),
                        { status: 202, headers: { 'Content-Type': 'application/json' } }
                    );
                });
            })
        );
        return;
    }

    // Network First for API / Firestore requests
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache First for static assets (CSS, JS, images, fonts)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Default: Network First for HTML pages
    event.respondWith(networkFirst(request));
});

// Listen for online event to replay queued requests
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'REPLAY_OFFLINE_QUEUE') {
        replayOfflineQueue();
    }
});

// --- Strategy helpers ---

function cacheFirst(request) {
    return caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
            if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        });
    }).catch(() => caches.match(request));
}

function networkFirst(request) {
    return fetch(request).then(response => {
        if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
    }).catch(() => {
        return caches.match(request).then(cached => {
            if (cached) return cached;
            // Offline fallback for navigation requests
            if (request.mode === 'navigate') {
                return caches.match('/login.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    });
}

// --- Utility helpers ---

function isApiRequest(url) {
    return url.hostname.includes('firestore.googleapis.com') ||
           url.hostname.includes('firebase') ||
           url.hostname.includes('googleapis.com') ||
           url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
    return /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|otf)(\?.*)?$/i.test(url.pathname);
}

// --- Offline Queue ---

async function enqueueOfflineRequest(request) {
    try {
        const body = await request.clone().text();
        const entry = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: body,
            timestamp: Date.now()
        };

        const cache = await caches.open(CACHE_NAME);
        const queueResponse = await cache.match(OFFLINE_QUEUE_KEY);
        let queue = [];
        if (queueResponse) {
            queue = await queueResponse.json();
        }
        queue.push(entry);
        await cache.put(
            OFFLINE_QUEUE_KEY,
            new Response(JSON.stringify(queue), { headers: { 'Content-Type': 'application/json' } })
        );
    } catch (e) {
        console.error('Failed to queue offline request:', e);
    }
}

async function replayOfflineQueue() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const queueResponse = await cache.match(OFFLINE_QUEUE_KEY);
        if (!queueResponse) return;

        const queue = await queueResponse.json();
        if (!queue.length) return;

        const remaining = [];
        for (const entry of queue) {
            try {
                await fetch(entry.url, {
                    method: entry.method,
                    headers: entry.headers,
                    body: entry.method !== 'GET' ? entry.body : undefined
                });
            } catch (e) {
                remaining.push(entry);
            }
        }

        if (remaining.length) {
            await cache.put(
                OFFLINE_QUEUE_KEY,
                new Response(JSON.stringify(remaining), { headers: { 'Content-Type': 'application/json' } })
            );
        } else {
            await cache.delete(OFFLINE_QUEUE_KEY);
        }
    } catch (e) {
        console.error('Failed to replay offline queue:', e);
    }
}

// --- Push Notifications ---
self.addEventListener('push', event => {
    let data = { title: 'MilkyPot', body: 'Novidade pra você!', icon: '/images/logo-milkypot.png', url: '/' };
    try {
        if (event.data) data = Object.assign(data, event.data.json());
    } catch (e) {}

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/images/logo-milkypot.png',
            badge: '/images/logo-milkypot.png',
            data: { url: data.url || '/' },
            vibrate: [200, 100, 200],
            actions: [
                { action: 'open', title: 'Abrir' },
                { action: 'close', title: 'Fechar' }
            ]
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});
