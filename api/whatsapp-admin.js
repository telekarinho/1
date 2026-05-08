/* ============================================
   MilkyPot — WhatsApp Admin Proxy (Vercel)
   ============================================
   Endpoint AUTENTICADO que faz proxy do painel admin pro gateway
   Baileys (zap.milkypot.com).

   Por que existe:
   - Gateway tem endpoints sensíveis (/qr, /status, /restart) que
     NÃO podem ser públicos (qualquer um sequestraria o WhatsApp).
   - Painel admin não pode embed o token de admin no JS client (any
     visitor inspecionaria o source).
   - Solução: Vercel valida Firebase ID token (super_admin/franchisee)
     e forwarda a chamada com header X-MP-Admin-Token.

   Auth flow:
   1. Painel admin obtém ID token via firebase.auth().currentUser.getIdToken()
   2. Painel chama /api/whatsapp-admin?action=qr com Authorization: Bearer <token>
   3. Vercel valida token via Firebase Identity Toolkit REST
   4. Vercel busca /users/{uid} no Firestore pra confirmar role
   5. Se OK, forwarda pro gateway com X-MP-Admin-Token (= MP_API_KEY)
   6. Devolve JSON pro painel

   Actions:
   - GET ?action=status   → estado do gateway (state, connectedNumber, hasQR)
   - GET ?action=qr       → QR data URL pra escanear
   - POST ?action=restart → reinicia o gateway (gera novo QR)
   - POST ?action=logout  → desconecta WhatsApp atual (precisa reconectar)
   ============================================ */

"use strict";

const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
const FIREBASE_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";
const GATEWAY_BASE = process.env.MP_GATEWAY_URL || "https://zap.milkypot.com";
const ADMIN_TOKEN = process.env.MP_API_KEY;

const ALLOWED_ROLES = new Set(["super_admin", "franchisee"]);

async function validateIdToken(idToken) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_KEY}`;
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const user = j.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
}

async function getUserRole(uid) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}?key=${FIREBASE_KEY}`;
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        return j.fields?.role?.stringValue || null;
    } catch (e) {
        return null;
    }
}

function setCors(res, origin) {
    const allowed = ["https://milkypot.com", "https://www.milkypot.com", "https://milkypot.vercel.app"];
    const ok = allowed.includes(origin) || (origin && origin.endsWith(".vercel.app"));
    res.setHeader("Access-Control-Allow-Origin", ok ? origin : "https://milkypot.com");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Vary", "Origin");
}

module.exports = async (req, res) => {
    setCors(res, req.headers.origin);

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (!ADMIN_TOKEN) {
        res.status(500).json({ error: "MP_API_KEY not configured" });
        return;
    }

    // 1. Auth header
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!idToken) {
        res.status(401).json({ error: "missing_token", hint: "send Authorization: Bearer <firebase_id_token>" });
        return;
    }

    // 2. Validate Firebase ID token
    const user = await validateIdToken(idToken);
    if (!user) {
        res.status(401).json({ error: "invalid_token" });
        return;
    }

    // 3. Check role
    const role = await getUserRole(user.uid);
    if (!ALLOWED_ROLES.has(role)) {
        console.warn("[whatsapp-admin] forbidden role:", role, "uid:", user.uid);
        res.status(403).json({ error: "forbidden", role: role || "unknown" });
        return;
    }

    // 4. Action
    const action = (req.query.action || "").toLowerCase();
    const headers = { "X-MP-Admin-Token": ADMIN_TOKEN, "Accept": "application/json" };

    try {
        if (action === "status" && req.method === "GET") {
            const r = await fetch(`${GATEWAY_BASE}/status`, { headers });
            const j = await r.json().catch(() => ({}));
            res.status(r.status).json(j);
            return;
        }
        if (action === "qr" && req.method === "GET") {
            const r = await fetch(`${GATEWAY_BASE}/qr-data`, { headers });
            const j = await r.json().catch(() => ({}));
            res.status(r.status).json(j);
            return;
        }
        if (action === "restart" && req.method === "POST") {
            const r = await fetch(`${GATEWAY_BASE}/restart`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        if (action === "logout" && req.method === "POST") {
            const r = await fetch(`${GATEWAY_BASE}/logout`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        res.status(400).json({ error: "invalid_action", actions: ["status", "qr", "restart", "logout"] });
    } catch (err) {
        console.error("[whatsapp-admin] proxy error:", err.message);
        res.status(502).json({ error: "gateway_unreachable", detail: err.message });
    }
};
