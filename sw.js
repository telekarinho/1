const CACHE_VERSION = 'mp-v70';
const CACHE_NAME = 'milkypot-v70';

// Critical local assets that must be available offline
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/cardapio.html',
    '/desafio.html',
    // MilkyClube (PWA cliente final + landing viral)
    '/clube.html',
    '/clube/',
    '/regulamento-milkyclube.html',
    '/js/core/milkyclub.js',
    '/js/core/milkyclub-push.js',
    '/firebase-messaging-sw.js',
    '/manifest-clube.json',
    // Franqueado panel pages (PDV + pages they might navigate to after login)
    '/painel/index.html',
    '/painel/pdv.html',
    '/painel/pedidos.html',
    '/painel/produtos.html',
    '/painel/financeiro.html',
    '/painel/fiscal.html',
    '/painel/entregas.html',
    '/painel/equipe.html',
    '/painel/fidelidade.html',
    '/painel/ifood.html',
    '/painel/marketing.html',
    '/painel/despesas.html',
    '/painel/configuracoes.html',
    '/painel/finance-os.html',
    // (rotas de TV/Radio sao deliberadamente fora do precache — nunca devem cachear)
    '/manifest-tv.json',
    // Styles
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/css/mobile-app.css',
    '/css/shared-panel.css',
    '/css/tv-slides.css',
    // Core JS
    '/js/core/constants.js',
    '/js/core/i18n.js',
    '/js/core/utils.js',
    '/js/core/datastore.js',
    '/js/core/firebase-config.js',
    '/js/core/cloud-functions.js',
    '/js/core/auth.js',
    '/js/core/audit.js',
    '/js/core/notifications.js',
    '/js/core/copilot-transport.js',
    '/js/core/belinha-page-scanners.js',
    '/js/core/belinha-widget.js',
    '/js/core/raspinha-engine.js',
    // Feature JS
    '/js/cardapio.js',
    '/js/cardapio-data.js',
    '/js/chat-ai.js',
    // Desafio — copies rotativas (Desafio 10s + Acertou Ganhou 300g)
    '/js/core/promocoes-copy.js',
    '/js/core/tv-promo-rotator.js',
    '/js/pages/desafio-tv-bridge.js',
    // Assets
    '/images/logo-milkypot.png',
    '/manifest.json',
    // Franquia landing pages (apenas unidades reais)
    '/f/muffato-quintino/'
];

// External CDN assets (Firebase SDK + Google Fonts) — cached on first successful fetch,
// then served from cache. Version-locked in URLs so they're safe to cache aggressively.
const CDN_PRECACHE_URLS = [
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js'
];

const OFFLINE_QUEUE_KEY = 'milkypot-offline-queue';

// Install: precache key files
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Precache local files — fail if any are missing
            const localPromise = cache.addAll(PRECACHE_URLS);
            // Precache CDN files — tolerate individual failures (they'll be cached on first use)
            const cdnPromise = Promise.allSettled(
                CDN_PRECACHE_URLS.map(u => fetch(u, { mode: 'cors' })
                    .then(r => r.ok ? cache.put(u, r) : null)
                    .catch(() => null))
            );
            return Promise.all([localPromise, cdnPromise]);
        })
    );
});

// Activate: clean old caches + force-reload controlled tabs so they pick up new JS.
// Sem isso, tabs abertas continuam executando o bundle velho do SW anterior
// (cache-first em .js) até o usuário fechar e abrir. O reload aqui é idempotente
// — só roda uma vez quando uma NOVA versão do SW ativa (skipWaiting + claim).
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
        .then(() => self.clients.claim())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then(windowClients => {
            windowClients.forEach(client => {
                // client.navigate(url) re-navega a aba — força re-fetch via novo SW.
                // Evita bounce em rotas sensíveis (TV/radio indoor) que não devem piscar.
                try {
                    const u = new URL(client.url);
                    const bypass = /\/(tv|radio|t|tv-indoor|radio-indoor)(\.html)?$/.test(u.pathname)
                                   || /^\/tv\d+(\.html)?$/.test(u.pathname);
                    if (bypass) return;
                    if (typeof client.navigate === 'function') {
                        client.navigate(client.url);
                    } else {
                        client.postMessage({ type: 'SW_ACTIVATED_RELOAD' });
                    }
                } catch(e) {}
            });
        })
    );
});

// Fetch: Cache First for static assets, Stale-While-Revalidate for CDN libs,
// Network First for API/Firestore and HTML
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

    // TV routes: bypass total — sempre rede, nunca cache.
    // (/t, /t.html, /tv.html, /tv1, /tv2, ..., /tvN ou /tvN.html, /painel/tv-indoor.html)
    if (isTvRoute(url)) {
        event.respondWith(
            fetch(request, { cache: 'no-store' })
                .catch(() => caches.match(request).then(c => c || new Response('Offline', { status: 503 })))
        );
        return;
    }

    // Firebase SDK + Google Fonts: Cache-First (version-locked URLs)
    if (isVersionLockedCdn(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Google Fonts CSS: Stale-While-Revalidate (CSS URL is stable but content may change)
    if (isGoogleFontsCss(url)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Firestore / Firebase Auth / Functions: Network First
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets (CSS, JS, images, fonts): Cache First
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
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// --- Strategy helpers ---

function cacheFirst(request) {
    return caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
            if (response && (response.status === 200 || response.type === 'opaque')) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        });
    }).catch(() => caches.match(request));
}

function staleWhileRevalidate(request) {
    return caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cached => {
            const fetchPromise = fetch(request).then(response => {
                if (response && (response.status === 200 || response.type === 'opaque')) {
                    cache.put(request, response.clone());
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        });
    });
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
                return new Response(
                    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>MilkyPot - Offline</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F0F7FF;color:#333;text-align:center}div{padding:2rem}h1{color:#42A5F5}p{margin-top:1rem;font-size:1.1rem}button{margin-top:1.5rem;padding:.75rem 1.5rem;background:#42A5F5;color:#fff;border:0;border-radius:8px;font-size:1rem;cursor:pointer}</style></head><body><div><h1>MilkyPot</h1><p>Voce esta offline no momento.</p><p>Verifique sua conexao e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></div></body></html>',
                    { status: 503, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
                );
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    });
}

// --- Utility helpers ---

function isTvRoute(url) {
    const p = url.pathname;
    // /t, /t.html, /tv.html, /tv1, /tv2, ..., /tv1.html (qualquer nN), /painel/tv-indoor.html, /painel/radio-indoor.html, /radio.html
    if (p === '/t' || p === '/t.html') return true;
    if (p === '/tv.html' || p === '/radio.html') return true;
    if (/^\/tv\d+(\.html)?$/.test(p)) return true;
    if (p === '/painel/tv-indoor.html' || p === '/painel/radio-indoor.html') return true;
    return false;
}

function isApiRequest(url) {
    return url.hostname.includes('firestore.googleapis.com') ||
           url.hostname.includes('identitytoolkit.googleapis.com') ||
           url.hostname.includes('securetoken.googleapis.com') ||
           url.hostname.includes('cloudfunctions.net') ||
           url.hostname === 'api.milkypot.com' ||
           url.pathname.startsWith('/api/');
}

function isVersionLockedCdn(url) {
    // Firebase SDK uses version-locked URLs like /firebasejs/10.12.0/...
    if (url.hostname === 'www.gstatic.com' && /\/firebasejs\/\d+\.\d+\.\d+\//.test(url.pathname)) {
        return true;
    }
    // Google Fonts static files (fonts.gstatic.com) are hashed — safe to cache forever
    if (url.hostname === 'fonts.gstatic.com') {
        return true;
    }
    return false;
}

function isGoogleFontsCss(url) {
    return url.hostname === 'fonts.googleapis.com';
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
// Bug I — Verificar se push está configurado antes de registrar subscription
if (typeof VAPID_PUBLIC_KEY !== 'undefined' && VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY !== 'YOUR_VAPID_KEY') {
  // lógica de subscription (VAPID configurado)
} else {
  console.info('[SW] Push notifications desativadas — VAPID key não configurada');
}

self.addEventListener('push', event => {
    // Bug I — não processar push se VAPID não estiver configurado
    if (typeof VAPID_PUBLIC_KEY === 'undefined' || !VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_KEY') {
        console.info('[SW] Push recebido mas VAPID não configurado — ignorando');
        return;
    }

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
