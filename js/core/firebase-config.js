/* ============================================
   MilkyPot - Firebase Configuration
   ============================================ */

const firebaseConfig = {
    apiKey: "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA",
    authDomain: "milkypot-ad945.firebaseapp.com",
    projectId: "milkypot-ad945",
    storageBucket: "milkypot-ad945.firebasestorage.app",
    messagingSenderId: "859364650620",
    appId: "1:859364650620:web:aecf11f4cf99b7792463f9",
    measurementId: "G-N2B5V05MEN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Auth instance
const firebaseAuth = firebase.auth();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
