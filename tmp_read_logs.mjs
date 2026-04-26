import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const config = {
    apiKey: "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA",
    authDomain: "milkypot-ad945.firebaseapp.com",
    projectId: "milkypot-ad945",
    storageBucket: "milkypot-ad945.firebasestorage.app",
    messagingSenderId: "859364650620",
    appId: "1:859364650620:web:aecf11f4cf99b7792463f9"
};
const app = initializeApp(config);
const db = getFirestore(app);

const sessions = [
    'fixlog_1777227789289_67ahzj', // PC2
    'fixlog_1777227819789_go3n0q'  // PC1
];

for (const sid of sessions) {
    console.log('\n' + '='.repeat(70));
    console.log('SESSION:', sid);
    console.log('='.repeat(70));
    const ref = doc(db, 'datastore', 'debug_' + sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        console.log('❌ DOC NÃO EXISTE — fix não chegou a salvar');
        continue;
    }
    const data = snap.data();
    let payload;
    try { payload = JSON.parse(data.value || '{}'); }
    catch(e) { console.log('Parse fail:', e.message); continue; }

    console.log('userAgent:', payload.userAgent);
    console.log('url:', payload.url);
    console.log('startedAt:', payload.startedAt);
    console.log('finishedAt:', payload.finishedAt);
    console.log('extra:', JSON.stringify(payload.extra, null, 2));
    console.log('\n--- LOGS ---');
    (payload.logs || []).forEach(l => {
        const tag = l.level !== 'info' ? '[' + l.level.toUpperCase() + ']' : '';
        console.log('  ' + l.ts.slice(11,19) + ' ' + tag + ' ' + l.msg);
    });
}

process.exit(0);
