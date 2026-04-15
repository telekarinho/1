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

// Firebase Auth instance (only if firebase-auth-compat.js is loaded)
const firebaseAuth = typeof firebase.auth === 'function' ? firebase.auth() : null;

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
