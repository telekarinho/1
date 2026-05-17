/* ============================================
   MilkyPot — Customer Memory (perfil do cliente)
   ============================================
   Armazena perfil de cada cliente que falou com a Lulu, persistente
   por franquia. Schema:

   datastore/customers_{franchiseeId} = [
     {
       phone: '5543...',
       name: 'Maria',
       lastAddress: 'rua das flores 100',
       addressHistory: ['rua das flores 100', 'av paulista 200'],
       lastPaymentMethod: 'pix',
       lastRecipient: null | { name, phone },
       favoriteFlavors: ['Amora Apaixonada', 'Blue Ice'],   // top 3
       ordersCount: 5,
       totalSpent: 199.50,
       firstSeenAt: '...',
       lastSeenAt: '...'
     }
   ]

   - getCustomer(franchiseeId, phone) → perfil atual ou null
   - upsertCustomer(franchiseeId, profile) → cria/atualiza
   - registerOrder(franchiseeId, phone, order) → atualiza após pedido
   ============================================ */

"use strict";

const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
const FB_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";

async function fsGet(docPath) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}`;
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

async function fsPatch(docPath, fields, mask) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}` +
        (mask ? `&${mask}` : "");
    const r = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`firestore patch ${r.status} ${t.slice(0, 200)}`);
    }
}

function _normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

async function _readCustomers(franchiseeId) {
    const docPath = `datastore/customers_${franchiseeId}`;
    const doc = await fsGet(docPath);
    if (!doc) return [];
    try {
        const arr = JSON.parse(doc.fields?.value?.stringValue || "[]");
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

async function _writeCustomers(franchiseeId, list) {
    const docPath = `datastore/customers_${franchiseeId}`;
    if (list.length > 5000) list = list.slice(-5000); // limita
    await fsPatch(
        docPath,
        {
            value: { stringValue: JSON.stringify(list) },
            updatedAt: { timestampValue: new Date().toISOString() }
        },
        "updateMask.fieldPaths=value&updateMask.fieldPaths=updatedAt"
    );
}

async function getCustomer(franchiseeId, phone) {
    if (!franchiseeId || !phone) return null;
    const phoneClean = _normalizePhone(phone);
    if (!phoneClean) return null;
    const list = await _readCustomers(franchiseeId);
    return list.find(c => _normalizePhone(c.phone) === phoneClean) || null;
}

// Upsert: cria/atualiza o perfil do cliente
async function upsertCustomer(franchiseeId, profile) {
    if (!franchiseeId || !profile?.phone) return null;
    const phoneClean = _normalizePhone(profile.phone);
    const list = await _readCustomers(franchiseeId);
    const idx = list.findIndex(c => _normalizePhone(c.phone) === phoneClean);
    const now = new Date().toISOString();

    if (idx >= 0) {
        const existing = list[idx];
        list[idx] = {
            ...existing,
            ...profile,
            phone: phoneClean,
            lastSeenAt: now,
            firstSeenAt: existing.firstSeenAt || now
        };
    } else {
        list.push({
            phone: phoneClean,
            ordersCount: 0,
            totalSpent: 0,
            firstSeenAt: now,
            lastSeenAt: now,
            ...profile
        });
    }
    try {
        await _writeCustomers(franchiseeId, list);
    } catch (e) {
        console.warn("[upsertCustomer] write failed:", e.message);
    }
    return idx >= 0 ? list[idx] : list[list.length - 1];
}

// Registra um pedido fechado: atualiza addressHistory, ordersCount, totalSpent
async function registerOrder(franchiseeId, phone, order) {
    if (!franchiseeId || !phone) return null;
    const phoneClean = _normalizePhone(phone);
    const existing = await getCustomer(franchiseeId, phoneClean) || { phone: phoneClean, ordersCount: 0, totalSpent: 0 };

    // Address history (mantém últimos 5 únicos)
    const addr = order?.delivery?.address;
    let addressHistory = existing.addressHistory || [];
    if (addr && typeof addr === "string") {
        addressHistory = [addr, ...addressHistory.filter(a => a !== addr)].slice(0, 5);
    }

    // Top 3 favoriteFlavors
    const favs = { ...(existing.favoriteFavorsCount || {}) };
    for (const item of (order?.items || [])) {
        const n = item.name;
        if (n) favs[n] = (favs[n] || 0) + (item.qty || 1);
    }
    const favoriteFlavors = Object.entries(favs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k);

    const updated = {
        ...existing,
        phone: phoneClean,
        name: order?.customer?.name || existing.name || null,
        lastAddress: addr || existing.lastAddress || null,
        addressHistory,
        lastPaymentMethod: order?.payments?.[0]?.method || existing.lastPaymentMethod || null,
        lastRecipient: order?.recipient || null,
        favoriteFavorsCount: favs,
        favoriteFlavors,
        ordersCount: (existing.ordersCount || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + (Number(order?.total) || 0),
        lastOrderId: order?.id,
        lastOrderAt: order?.createdAt || new Date().toISOString()
    };

    return await upsertCustomer(franchiseeId, updated);
}

// Resumo curto pro contexto da Lulu
function summarizeCustomer(customer) {
    if (!customer) return null;
    const lines = [];
    if (customer.name) lines.push(`Nome: ${customer.name}`);
    if (customer.ordersCount) lines.push(`Já fez ${customer.ordersCount} pedidos (total R$ ${(customer.totalSpent || 0).toFixed(2).replace('.', ',')})`);
    if (customer.lastAddress) lines.push(`Último endereço: "${customer.lastAddress}"`);
    if (customer.lastPaymentMethod) lines.push(`Última forma pagamento: ${customer.lastPaymentMethod}`);
    if (customer.favoriteFlavors?.length) lines.push(`Sabores favoritos: ${customer.favoriteFlavors.join(", ")}`);
    if (customer.lastRecipient?.name) lines.push(`Última vez quem retirou foi: ${customer.lastRecipient.name}`);
    return lines.length ? lines.join("\n") : null;
}

// ============================================
// Extrai NOME do cliente a partir do texto da mensagem
// "meu nome é João", "sou a Maria", "me chamo X", "X falando", etc
// Retorna { name } ou null
// ============================================
const NAME_PATTERNS = [
    /\b(?:meu\s+nome\s+(?:e|é)|me\s+chamo|sou\s+(?:a|o|eu)?|aqui\s+(?:e|é)|aqui\s+quem\s+fala\s+(?:e|é)|fala\s+(?:a|o))\s+([A-ZÀ-Ý][a-zà-ÿ]{1,20}(?:\s+[A-ZÀ-Ý][a-zà-ÿ]{1,20})?)/i,
    /^([A-ZÀ-Ý][a-zà-ÿ]{2,20})\s+(?:falando|aqui|na\s+linha)\b/i,
    /\beu\s+sou\s+(?:a|o)\s+([A-ZÀ-Ý][a-zà-ÿ]{2,20})\b/i
];

function extractName(text) {
    if (!text || text.length > 300) return null;
    for (const pattern of NAME_PATTERNS) {
        const m = text.match(pattern);
        if (m && m[1]) {
            let name = m[1].trim();
            // Capitaliza primeira letra
            name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            // Filtra falsos positivos (palavras comuns)
            const blacklist = ["Cliente", "Aqui", "Voce", "Você", "Bom", "Boa", "Quem", "Falando", "Lulu", "Dono", "Atendente"];
            if (blacklist.includes(name)) return null;
            if (name.length < 2 || name.length > 40) return null;
            return name;
        }
    }
    return null;
}

module.exports = {
    getCustomer,
    upsertCustomer,
    registerOrder,
    summarizeCustomer,
    extractName
};
