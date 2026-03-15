/* ============================================
   MilkyPot - Vercel Serverless API
   ============================================
   Substitui Firebase Cloud Functions.
   Usa Firebase Admin SDK para operacoes seguras.
   ============================================ */

const admin = require('firebase-admin');

// Inicializa Firebase Admin (usa env var FIREBASE_SERVICE_ACCOUNT)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const auth = admin.auth();

// ============================================
// Helper: verifica token do Firebase Auth
// ============================================
async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split('Bearer ')[1];
        return await auth.verifyIdToken(token);
    } catch (e) {
        return null;
    }
}

// ============================================
// Helper: gera senha aleatoria
// ============================================
function generatePassword(length = 12) {
    const crypto = require('crypto');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(bytes[i] % chars.length);
    }
    return password;
}

// ============================================
// Router principal
// ============================================
module.exports = async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    const { action, data } = req.body || {};

    if (!action) {
        return res.status(400).json({ success: false, error: 'action is required' });
    }

    // Verifica autenticacao
    const caller = await verifyAuth(req);
    if (!caller) {
        return res.status(401).json({ success: false, error: 'Autenticacao necessaria' });
    }

    try {
        switch (action) {
            case 'setUserRole':
                return await handleSetUserRole(req, res, caller, data);
            case 'setupOwner':
                return await handleSetupOwner(req, res, caller, data);
            case 'createUserWithRole':
                return await handleCreateUserWithRole(req, res, caller, data);
            case 'deleteUserAccount':
                return await handleDeleteUserAccount(req, res, caller, data);
            case 'getMyRole':
                return await handleGetMyRole(req, res, caller, data);
            default:
                return res.status(400).json({ success: false, error: `Action desconhecida: ${action}` });
        }
    } catch (error) {
        console.error(`API error (${action}):`, error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// 1. SET USER ROLE
// ============================================
async function handleSetUserRole(req, res, caller, data) {
    if (caller.role !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Apenas super_admin pode definir roles' });
    }

    const { uid, role, franchiseId } = data || {};
    if (!uid || !role) {
        return res.status(400).json({ success: false, error: 'uid e role sao obrigatorios' });
    }

    const validRoles = ['super_admin', 'franchisee', 'manager', 'staff'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, error: 'Role invalido: ' + role });
    }

    const claims = { role };
    if (franchiseId) claims.franchiseId = franchiseId;

    await auth.setCustomUserClaims(uid, claims);

    await db.collection('audit_log').add({
        event: 'auth.role_set',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: caller.uid,
        details: { targetUid: uid, role, franchiseId },
    });

    return res.json({ success: true, message: `Role ${role} definido para ${uid}` });
}

// ============================================
// 2. SETUP OWNER
// ============================================
async function handleSetupOwner(req, res, caller, data) {
    const OWNER_EMAIL = 'jocimarrodrigo@gmail.com';
    const user = await auth.getUser(caller.uid);

    if (user.email !== OWNER_EMAIL) {
        return res.status(403).json({ success: false, error: 'Apenas o owner pode executar o setup inicial' });
    }

    if (user.customClaims && user.customClaims.role === 'super_admin') {
        return res.json({ success: true, message: 'Owner ja configurado como super_admin' });
    }

    await auth.setCustomUserClaims(caller.uid, { role: 'super_admin' });

    await db.collection('audit_log').add({
        event: 'auth.owner_setup',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: caller.uid,
        details: { email: OWNER_EMAIL },
    });

    return res.json({ success: true, message: 'Owner configurado como super_admin. Faca logout e login novamente.' });
}

// ============================================
// 3. CREATE USER WITH ROLE
// ============================================
async function handleCreateUserWithRole(req, res, caller, data) {
    if (caller.role !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Apenas super_admin pode criar usuarios' });
    }

    const { email, name, password, role, franchiseId } = data || {};
    if (!email || !name || !role) {
        return res.status(400).json({ success: false, error: 'email, name e role sao obrigatorios' });
    }

    // Cria usuario no Firebase Auth
    const userRecord = await auth.createUser({
        email,
        displayName: name,
        password: password || generatePassword(),
        emailVerified: false,
    });

    // Define custom claims
    const claims = { role };
    if (franchiseId) claims.franchiseId = franchiseId;
    await auth.setCustomUserClaims(userRecord.uid, claims);

    // Salva perfil no Firestore
    await db.collection('users').doc(userRecord.uid).set({
        email,
        name,
        role,
        franchiseId: franchiseId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: caller.uid,
    });

    // Audit log
    await db.collection('audit_log').add({
        event: 'auth.user_created',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: caller.uid,
        details: { targetUid: userRecord.uid, email, role, franchiseId },
    });

    return res.json({
        success: true,
        uid: userRecord.uid,
        email,
        message: `Usuario ${email} criado com role ${role}`,
    });
}

// ============================================
// 4. DELETE USER ACCOUNT
// ============================================
async function handleDeleteUserAccount(req, res, caller, data) {
    if (caller.role !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Apenas super_admin pode deletar usuarios' });
    }

    const { uid } = data || {};
    if (!uid) {
        return res.status(400).json({ success: false, error: 'uid e obrigatorio' });
    }

    if (uid === caller.uid) {
        return res.status(400).json({ success: false, error: 'Nao e possivel deletar sua propria conta' });
    }

    const targetUser = await auth.getUser(uid);
    if (targetUser.customClaims && targetUser.customClaims.role === 'super_admin') {
        return res.status(400).json({ success: false, error: 'Nao e possivel deletar outro super_admin' });
    }

    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();

    await db.collection('audit_log').add({
        event: 'auth.user_deleted',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: caller.uid,
        details: { deletedUid: uid, deletedEmail: targetUser.email },
    });

    return res.json({ success: true, message: `Usuario ${targetUser.email} deletado` });
}

// ============================================
// 5. GET MY ROLE
// ============================================
async function handleGetMyRole(req, res, caller, data) {
    const user = await auth.getUser(caller.uid);
    return res.json({
        uid: user.uid,
        email: user.email,
        role: user.customClaims?.role || null,
        franchiseId: user.customClaims?.franchiseId || null,
    });
}
