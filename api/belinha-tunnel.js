/**
 * MilkyPot — Belinha Tunnel Registry
 *
 * Servidor local MilkyPot (Autopilot) inicia cloudflared tunnel e POST aqui
 * com a URL publica. Salvamos no Firestore em `datastore/belinha_tunnel_global`
 * para que o painel (qualquer PC) leia e use o servidor local via HTTPS.
 *
 * Fluxo:
 *   1. User abre Belinha-Iniciar.bat no PC dele
 *   2. server.js inicia `cloudflared tunnel --url http://localhost:5757`
 *   3. Captura URL (ex: https://xxx.trycloudflare.com) do stderr
 *   4. POST aqui com { url }
 *   5. Salvamos no Firestore
 *   6. Qualquer painel Belinha em milkypot.com le do Firestore e usa
 *
 * Resultado: Belinha funciona em milkypot.com usando Claude CLI local R$0,00.
 *
 * POST /api/belinha-tunnel
 *   body: { url, secret? }
 *   returns: { ok: true, url }
 *
 * GET /api/belinha-tunnel
 *   returns: { url, updatedAt } ou null
 *
 * Env vars:
 *   FIREBASE_ADMIN_SA_JSON — service account do Firebase
 *   BELINHA_TUNNEL_SECRET (opcional) — se setado, exige body.secret == env
 */

const admin = require('firebase-admin');

let _app = null;
function getAdmin() {
    if (_app) return _app;
    const saJson = process.env.FIREBASE_ADMIN_SA_JSON
        || process.env.FIREBASE_SERVICE_ACCOUNT
        || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!saJson) throw new Error('FIREBASE service account env var missing (FIREBASE_ADMIN_SA_JSON ou FIREBASE_SERVICE_ACCOUNT)');
    const parsed = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
    // Reusa default app se ja existir (evita erro em cold start com reuse)
    try {
        _app = admin.app();
    } catch (_) {
        _app = admin.initializeApp({ credential: admin.credential.cert(parsed) });
    }
    return _app;
}

function corsHeaders(req, res) {
    const origin = req.headers.origin || '';
    const allowed = [
        'https://milkypot.com',
        'https://www.milkypot.com',
        'https://milkypot.vercel.app'
    ];
    const isAllowed = allowed.includes(origin)
        || origin.endsWith('.vercel.app')
        || origin.endsWith('.trycloudflare.com')
        || origin.startsWith('http://localhost:')
        || origin.startsWith('http://127.0.0.1:');
    res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : 'https://milkypot.com');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async function handler(req, res) {
    corsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const app = getAdmin();
        const db = app.firestore();
        const docRef = db.collection('datastore').doc('belinha_tunnel_global');

        if (req.method === 'GET') {
            const snap = await docRef.get();
            if (!snap.exists) return res.status(200).json({ url: null });
            const data = snap.data();
            let parsed = data.value;
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
            }
            return res.status(200).json(parsed || { url: null });
        }

        if (req.method === 'POST') {
            const { url, secret } = req.body || {};
            // Valida formato esperado do tunnel cloudflared (sem permitir arbitrarios)
            if (!url || typeof url !== 'string') {
                return res.status(400).json({ error: 'url_missing' });
            }
            if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?$/i.test(url.trim())) {
                return res.status(400).json({
                    error: 'invalid_tunnel_url',
                    hint: 'Esperado https://<subdomain>.trycloudflare.com'
                });
            }
            const expectedSecret = process.env.BELINHA_TUNNEL_SECRET;
            if (expectedSecret && secret !== expectedSecret) {
                return res.status(401).json({ error: 'invalid_secret' });
            }

            const payload = {
                url: url.trim().replace(/\/$/, ''),
                updatedAt: new Date().toISOString()
            };
            await docRef.set({ value: JSON.stringify(payload) });
            return res.status(200).json({ ok: true, url: payload.url });
        }

        return res.status(405).json({ error: 'method_not_allowed' });
    } catch (e) {
        console.error('[belinha-tunnel] error:', e);
        return res.status(500).json({ error: 'internal', message: e.message });
    }
};
