/* ============================================
   MilkyPot - Admin Reset Password (direto, sem email)
   ============================================
   Super admin gera nova senha TEMPORÁRIA pra um user.
   Bypassa o fluxo de email (que é quebrado pelo Gmail
   pré-clicar o link de reset).

   POST /api/admin-reset-password
   Headers: Authorization: Bearer <Firebase ID Token do super_admin>
   Body: { uid: string } ou { email: string }
   Retorna: { success: true, password: "Temp1234!" }

   Env vars necessárias (Vercel):
     - FIREBASE_ADMIN_SA_JSON (JSON string do service account)
     - FIREBASE_WEB_API_KEY (p/ verificar ID token do caller)
   ============================================ */

const admin = require('firebase-admin');

// Init singleton — evita re-init em cold starts repetidos
let _app = null;
function getAdmin() {
    if (_app) return admin;
    const saJson = process.env.FIREBASE_ADMIN_SA_JSON;
    if (!saJson) throw new Error('FIREBASE_ADMIN_SA_JSON env var missing');
    let credential;
    try {
        const parsed = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
        credential = admin.credential.cert(parsed);
    } catch (e) {
        throw new Error('FIREBASE_ADMIN_SA_JSON is not valid JSON: ' + e.message);
    }
    _app = admin.initializeApp({ credential }, 'mp-admin-' + Date.now());
    return admin;
}

async function verifyCallerIsSuperAdmin(idToken) {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY missing');
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    });
    if (!r.ok) throw new Error('Token inválido');
    const data = await r.json();
    const user = data.users && data.users[0];
    if (!user) throw new Error('User not found');
    let claims = {};
    try { claims = JSON.parse(user.customAttributes || '{}'); } catch (e) {}
    if (claims.role !== 'super_admin') {
        const err = new Error('Apenas super_admin pode resetar senhas');
        err.code = 403;
        throw err;
    }
    return { uid: user.localId, email: user.email };
}

// Gera senha aleatória fácil de digitar mas segura (10 chars, alphanumeric+symbol)
function generateTempPassword() {
    const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';     // sem I, L, O
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums  = '23456789';                     // sem 0, 1
    const syms  = '!@#$';
    function pick(s) { return s[Math.floor(Math.random() * s.length)]; }
    const base = [pick(upper), pick(upper), pick(lower), pick(lower), pick(lower), pick(nums), pick(nums), pick(nums), pick(syms)];
    // embaralha
    for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
    }
    return base.join('');
}

const ALLOWED_ORIGINS = [
    'https://milkypot.com',
    'https://www.milkypot.com',
    'https://milkypot-ad945.web.app',
    'https://milkypot-ad945.firebaseapp.com',
    'https://milkypot.vercel.app',
    'http://localhost:8090',
    'http://localhost:3000'
];
function setCors(req, res) {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
}

module.exports = async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    // Auth
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) { res.status(401).json({ error: 'Autenticação requerida' }); return; }

    let caller;
    try {
        caller = await verifyCallerIsSuperAdmin(idToken);
    } catch (err) {
        res.status(err.code || 401).json({ error: err.message });
        return;
    }

    // Body
    const body = req.body || {};
    const { uid, email } = body;
    if (!uid && !email) { res.status(400).json({ error: 'Informe uid ou email' }); return; }

    let adminSDK;
    try {
        adminSDK = getAdmin();
    } catch (err) {
        console.error('init error:', err);
        res.status(500).json({ error: 'Config do servidor incompleta: ' + err.message });
        return;
    }

    try {
        // Resolve usuário
        let userRecord;
        if (uid) {
            userRecord = await adminSDK.auth().getUser(uid);
        } else {
            userRecord = await adminSDK.auth().getUserByEmail(email);
        }

        // Gera nova senha temporária e seta
        const newPassword = generateTempPassword();
        await adminSDK.auth().updateUser(userRecord.uid, { password: newPassword });

        // Audit log (se Firestore configurado)
        try {
            await adminSDK.firestore().collection('audit_log').add({
                event: 'auth.admin_reset_password',
                timestamp: adminSDK.firestore.FieldValue.serverTimestamp(),
                userId: caller.uid,
                details: { targetUid: userRecord.uid, targetEmail: userRecord.email, via: 'vercel-api' }
            });
        } catch (e) { /* audit opcional */ }

        res.status(200).json({
            success: true,
            uid: userRecord.uid,
            email: userRecord.email,
            password: newPassword,
            message: 'Senha temporária gerada. Copie e passe ao usuário via canal seguro (WhatsApp). Peça para ele trocar no primeiro login.'
        });
    } catch (err) {
        console.error('reset error:', err);
        res.status(500).json({ error: 'Erro ao resetar senha: ' + err.message });
    }
};
