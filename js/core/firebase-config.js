/* ============================================
   MilkyPot - Firebase Configuration
   ============================================ */

// ============================================
// PROTEÇÃO DE DOMÍNIO (camada JavaScript)
// A restrição definitiva deve ser configurada
// em: console.cloud.google.com → APIs & Services
// → Credentials → editar a chave de API →
// "HTTP referrers (websites)" → adicionar:
//   milkypot.com/*
//   *.milkypot.com/*
//   localhost/* (apenas para desenvolvimento)
// ============================================
(function() {
    var ALLOWED_DOMAINS = [
        'milkypot.com',
        'www.milkypot.com',
        'milkypot-ad945.web.app',
        'milkypot-ad945.firebaseapp.com',
        'localhost',
        '127.0.0.1'
    ];
    var host = window.location.hostname.toLowerCase();
    var allowed = ALLOWED_DOMAINS.some(function(d) {
        return host === d || host.endsWith('.' + d);
    });
    if (!allowed) {
        console.error('[MilkyPot] Domínio não autorizado:', host);
        // Bloqueia silenciosamente — não expõe detalhes ao usuário
        window._mpDomainBlocked = true;
    }
})();

const firebaseConfig = {
    apiKey: "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA",
    authDomain: "milkypot-ad945.firebaseapp.com",
    projectId: "milkypot-ad945",
    storageBucket: "milkypot-ad945.firebasestorage.app",
    messagingSenderId: "859364650620",
    appId: "1:859364650620:web:aecf11f4cf99b7792463f9",
    measurementId: "G-N2B5V05MEN"
};

// Initialize Firebase (only once, only on allowed domains)
if (!firebase.apps.length && !window._mpDomainBlocked) {
    firebase.initializeApp(firebaseConfig);
}

// Enable Firestore offline persistence (IndexedDB cache).
// Allows reads/writes to work offline; writes are queued and synced when back online.
// Must be called BEFORE any Firestore operation. Only one tab can hold the cache at a time;
// failsafe = other tabs keep working via network-only reads.
if (typeof firebase.firestore === 'function' && !window._mpDomainBlocked && !window._mpFsPersistenceTried) {
    window._mpFsPersistenceTried = true;
    try {
        firebase.firestore().enablePersistence({ synchronizeTabs: true })
            .then(function() {
                window._mpFsOffline = true;
                console.log('[MilkyPot] Firestore offline persistence enabled');
            })
            .catch(function(err) {
                // failed-precondition = multiple tabs (ok), unimplemented = browser sem suporte
                if (err && err.code === 'failed-precondition') {
                    console.info('[MilkyPot] Firestore persistence: multi-tab fallback ativo');
                } else if (err && err.code === 'unimplemented') {
                    console.warn('[MilkyPot] Firestore persistence nao suportado neste navegador');
                } else {
                    console.warn('[MilkyPot] Firestore persistence:', err && err.message);
                }
            });
    } catch (e) {
        console.warn('[MilkyPot] Firestore persistence init falhou:', e && e.message);
    }
}

// Firebase Auth instance (only if firebase-auth-compat.js is loaded).
// Uses LOCAL persistence by default (IndexedDB) — user stays logged in offline.
const firebaseAuth = typeof firebase.auth === 'function' ? firebase.auth() : null;
if (firebaseAuth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
    try { firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e) {}
}
// Garante TODOS os emails transacionais em PT-BR (reset senha, verificação, etc.)
if (firebaseAuth) {
    try { firebaseAuth.languageCode = 'pt'; } catch (e) {}
}

// Google Auth Provider (only if firebase-auth-compat.js is loaded)
let googleProvider = null;
if (typeof firebase.auth === 'function') {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
}

// Initialize DataStore with Firestore
if (typeof DataStore !== 'undefined') {
    DataStore.init();
}

// Initialize Cloud Functions client
if (typeof CloudFunctions !== 'undefined') {
    CloudFunctions.init();
}
