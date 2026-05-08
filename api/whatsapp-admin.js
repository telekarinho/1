/* ============================================
   MilkyPot — WhatsApp Admin Proxy (Vercel) — MULTI-TENANT
   ============================================
   Endpoint AUTENTICADO que faz proxy do painel admin pro gateway
   Baileys (zap.milkypot.com).

   Cada franquia tem sua sessão Baileys (accountId). Roles:
   - super_admin    → pode operar QUALQUER accountId
   - franchisee     → só pode operar accountId que está em
                      /users/{uid}.franchiseeIds (array de strings)

   Auth flow:
   1. Painel obtém ID token via firebase.auth().currentUser.getIdToken()
   2. Chama /api/whatsapp-admin?action=qr&accountId=matriz com Bearer token
   3. Vercel valida token + role + autorização sobre accountId
   4. Forwarda pro gateway com X-MP-Admin-Token = MP_API_KEY
   5. Devolve JSON pro painel

   Actions:
   - GET ?action=status&accountId=  → estado da sessão
   - GET ?action=status              → todas as sessões (super_admin)
   - GET ?action=qr&accountId=       → QR data URL pra escanear
   - GET ?action=accounts            → lista accountIds existentes
   - GET ?action=franchises          → lista franquias do Firestore /franchises
   - POST ?action=restart            → reinicia toda a app gateway
   - POST ?action=restart-session&accountId= → reinicia 1 sessão
   - POST ?action=logout&accountId=  → desconecta sessão
   - POST ?action=add-account        → cria nova sessão (super_admin only)
   - POST ?action=remove-account&accountId= → apaga sessão (super_admin only)
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

async function getUserDoc(uid, idToken) {
    // Firestore rules exigem auth pra ler /users/{uid}. Passamos o ID token
    // como Bearer (request.auth.uid == userId permite leitura do próprio doc).
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}?key=${FIREBASE_KEY}`;
    try {
        const r = await fetch(url, {
            headers: idToken ? { "Authorization": `Bearer ${idToken}` } : {}
        });
        if (!r.ok) {
            // Tenta sem auth como fallback (caso doc seja público)
            const r2 = await fetch(url);
            if (!r2.ok) return null;
            const j2 = await r2.json();
            return parseUserDoc(j2);
        }
        const j = await r.json();
        return parseUserDoc(j);
    } catch (e) {
        return null;
    }
}

function parseUserDoc(j) {
    const fields = j.fields || {};
    const role = fields.role?.stringValue || null;
    const franchiseeIds = (fields.franchiseeIds?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean);
    // Compat: alguns docs têm franchiseeId (singular) string
    const singleId = fields.franchiseeId?.stringValue;
    if (singleId && !franchiseeIds.includes(singleId)) franchiseeIds.push(singleId);
    return { role, franchiseeIds };
}

async function listFranchises() {
    // Lê /franchises do Firestore (REST, sem auth)
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/franchises?key=${FIREBASE_KEY}`;
    try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const j = await r.json();
        return (j.documents || []).map(doc => {
            const id = doc.name.split('/').pop();
            const f = doc.fields || {};
            return {
                accountId: id,
                name: f.name?.stringValue || id,
                whatsappNumber: f.whatsappNumber?.stringValue || null,
                address: f.address?.stringValue || null,
                hours: f.hours?.stringValue || null,
                active: f.active?.booleanValue !== false
            };
        });
    } catch (e) {
        return [];
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

function isAuthorized(role, franchiseeIds, requestedAccountId) {
    if (role === "super_admin") return true;
    if (role === "franchisee" && franchiseeIds.includes(requestedAccountId)) return true;
    return false;
}

module.exports = async (req, res) => {
    setCors(res, req.headers.origin);
    if (req.method === "OPTIONS") { res.status(204).end(); return; }

    if (!ADMIN_TOKEN) { res.status(500).json({ error: "MP_API_KEY not configured" }); return; }

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!idToken) {
        res.status(401).json({ error: "missing_token" });
        return;
    }

    const user = await validateIdToken(idToken);
    if (!user) { res.status(401).json({ error: "invalid_token" }); return; }

    const userDoc = await getUserDoc(user.uid, idToken);
    let role = userDoc?.role;
    let franchiseeIds = userDoc?.franchiseeIds || [];

    // Fallback: owner email é super_admin mesmo sem doc /users
    if (!role && user.email === "jocimarrodrigo@gmail.com") {
        role = "super_admin";
        console.log("[whatsapp-admin] fallback: owner email → super_admin");
    }

    if (!ALLOWED_ROLES.has(role)) {
        console.warn("[whatsapp-admin] forbidden role:", role, "uid:", user.uid, "email:", user.email);
        res.status(403).json({ error: "forbidden", role: role || "unknown", email: user.email });
        return;
    }

    const action = (req.query.action || "").toLowerCase();
    const accountId = (req.query.accountId || req.body?.accountId || "").toLowerCase().trim();
    const headers = { "X-MP-Admin-Token": ADMIN_TOKEN, "Accept": "application/json" };

    // Ações que precisam de accountId — valida autorização
    const ACTIONS_NEED_ACCOUNT = new Set(["qr", "restart-session", "logout", "remove-account"]);
    if (ACTIONS_NEED_ACCOUNT.has(action)) {
        if (!accountId) return res.status(400).json({ error: "accountId_required" });
        if (!isAuthorized(role, franchiseeIds, accountId)) {
            return res.status(403).json({ error: "forbidden_account", accountId });
        }
    }

    // Status com accountId específico → valida autorização
    if (action === "status" && accountId) {
        if (!isAuthorized(role, franchiseeIds, accountId)) {
            return res.status(403).json({ error: "forbidden_account", accountId });
        }
    }

    // Add-account é só super_admin
    if (action === "add-account" && role !== "super_admin") {
        return res.status(403).json({ error: "super_admin_only" });
    }

    try {
        if (action === "status" && req.method === "GET") {
            const url = accountId
                ? `${GATEWAY_BASE}/status?accountId=${encodeURIComponent(accountId)}`
                : `${GATEWAY_BASE}/status`;
            const r = await fetch(url, { headers });
            const j = await r.json().catch(() => ({}));
            // Se franchisee chamou sem accountId, filtra a lista pra só os dele
            if (!accountId && role === "franchisee" && Array.isArray(j.sessions)) {
                j.sessions = j.sessions.filter(s => franchiseeIds.includes(s.accountId));
                j.totalConnected = j.sessions.filter(s => s.state === "open").length;
                j.total = j.sessions.length;
            }
            res.status(r.status).json(j);
            return;
        }
        if (action === "qr" && req.method === "GET") {
            const r = await fetch(`${GATEWAY_BASE}/qr-data?accountId=${encodeURIComponent(accountId)}`, { headers });
            const j = await r.json().catch(() => ({}));
            res.status(r.status).json(j);
            return;
        }
        if (action === "accounts" && req.method === "GET") {
            const r = await fetch(`${GATEWAY_BASE}/accounts`, { headers });
            const j = await r.json().catch(() => ({}));
            // Filtra pra franchisee só ver os dele
            if (role === "franchisee" && Array.isArray(j.accounts)) {
                j.accounts = j.accounts.filter(a => franchiseeIds.includes(a));
            }
            res.status(r.status).json(j);
            return;
        }
        if (action === "franchises" && req.method === "GET") {
            const list = await listFranchises();
            const filtered = role === "franchisee"
                ? list.filter(f => franchiseeIds.includes(f.accountId))
                : list;
            res.status(200).json({ franchises: filtered });
            return;
        }
        if (action === "restart" && req.method === "POST") {
            if (role !== "super_admin") return res.status(403).json({ error: "super_admin_only" });
            const r = await fetch(`${GATEWAY_BASE}/restart`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        if (action === "restart-session" && req.method === "POST") {
            const r = await fetch(`${GATEWAY_BASE}/restart-session?accountId=${encodeURIComponent(accountId)}`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        if (action === "logout" && req.method === "POST") {
            const r = await fetch(`${GATEWAY_BASE}/logout?accountId=${encodeURIComponent(accountId)}`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        if (action === "add-account" && req.method === "POST") {
            const newId = (req.body?.accountId || "").toLowerCase().trim();
            if (!/^[a-z0-9-]{2,40}$/.test(newId)) return res.status(400).json({ error: "invalid_account_id" });
            const r = await fetch(`${GATEWAY_BASE}/accounts/add`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ accountId: newId })
            });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        if (action === "remove-account" && req.method === "POST") {
            if (role !== "super_admin") return res.status(403).json({ error: "super_admin_only" });
            const r = await fetch(`${GATEWAY_BASE}/accounts/remove?accountId=${encodeURIComponent(accountId)}`, { method: "POST", headers });
            const j = await r.json().catch(() => ({ ok: r.ok }));
            res.status(r.status).json(j);
            return;
        }
        res.status(400).json({ error: "invalid_action", actions: ["status", "qr", "accounts", "franchises", "restart", "restart-session", "logout", "add-account", "remove-account"] });
    } catch (err) {
        console.error("[whatsapp-admin] proxy error:", err.message);
        res.status(502).json({ error: "gateway_unreachable", detail: err.message });
    }
};
