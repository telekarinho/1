/* ============================================================
   MilkyPot Desafio — Service Worker (offline-first)
   ============================================================
   Cache agressivo pra desafio.html funcionar sem internet.
   Estratégia:
     - HTML: network-first (pega atualização quando online, cache fallback)
     - JS/CSS/fonts/imagens: cache-first
     - Firestore API: network-only (nada de cache POST)
   ============================================================ */

const CACHE = 'milkypot-desafio-v4';
const APP_SHELL = [
    '/desafio.html',
    '/js/pages/desafio-tv-bridge.js',
    '/js/core/promocoes-copy.js',
    '/js/core/tv-promo-rotator.js',
    '/manifest.json',
    '/images/logo-milkypot.png',
    'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@600;700;800;900&family=Orbitron:wght@700;800;900&display=swap'
];

self.addEventListener('install', function(e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(function(c) { return c.addAll(APP_SHELL); }).catch(function(){})
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
        }).then(function(){ return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(e) {
    const req = e.request;
    const url = new URL(req.url);

    // Nunca cacheia POST/PATCH ou Firestore/Firebase
    if (req.method !== 'GET') return;
    if (url.hostname.indexOf('firestore') >= 0 || url.hostname.indexOf('firebase') >= 0) return;
    if (url.pathname.indexOf('/api/') === 0) return;

    // HTML: network-first
    if (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') >= 0) {
        e.respondWith(
            fetch(req).then(function(r){
                const copy = r.clone();
                caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
                return r;
            }).catch(function(){
                return caches.match(req).then(function(r){
                    return r || caches.match('/desafio.html');
                });
            })
        );
        return;
    }

    // Outros: cache-first
    e.respondWith(
        caches.match(req).then(function(hit){
            if (hit) return hit;
            return fetch(req).then(function(r){
                if (r && r.status === 200) {
                    const copy = r.clone();
                    caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
                }
                return r;
            }).catch(function(){ return new Response('', {status:504}); });
        })
    );
});
