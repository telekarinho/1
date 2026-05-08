/* ============================================
   MilkyPot — Tools que a Lulu IA pode chamar
   ============================================
   Cada tool é uma função pura (input → output) que a IA invoca via
   tool calling do Llama 3.3 quando precisa interagir com o sistema.

   Tools disponíveis:
   - criar_pedido     → grava em orders_{franchiseeId} no Firestore
   - consultar_pedido → busca pedido pelo id ou phone
   - listar_promocoes → retorna promoções ativas (lê /promocoes_{id})
   ============================================ */

"use strict";

const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
const FB_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";

// ============================================
// Tabela de preços (matriz por enquanto — fase 2: ler /franchises/{id}/menu)
// ============================================
const PRECOS = {
    P: 9.99,
    M: 17.99,
    G: 21.99,
    GG: 29.99
};
const TAXA_DELIVERY = 5.90;

const SABORES_NORMALIZADOS = {
    "ninho": "Shake Ninho",
    "morango": "Shake de Morango",
    "ninho+morango": "Shake Ninho com Morango",
    "ninho com morango": "Shake Ninho com Morango",
    "nutella": "Shake Nutella",
    "oreo": "Shake Oreo",
    "amarula": "Shake Amarula (+18)",
    "baileys": "Shake Baileys (+18)",
    "açaí": "Açaí + Granola",
    "acai": "Açaí + Granola",
    "açaí+granola": "Açaí + Granola",
    "açaí+banana": "Açaí + Banana",
    "açaí+morango": "Açaí + Morango",
    "whey": "Shake Whey",
    "banana+whey": "Shake Banana + Whey",
    "pasta de amendoim": "Pasta de Amendoim",
    "sundae morango": "Sundae Gourmet Morango",
    "sundae nutella": "Sundae Gourmet Nutella",
    "sundae oreo": "Sundae Gourmet Oreo"
};

function normalizarSabor(sabor) {
    if (!sabor) return null;
    const k = String(sabor).toLowerCase().trim().replace(/[\s\-_]+/g, " ");
    return SABORES_NORMALIZADOS[k] || sabor;
}

function calcularPrecos(items) {
    return items.reduce((sum, it) => sum + (PRECOS[it.tamanho] || 0) * (it.qty || 1), 0);
}

// ============================================
// Helper: Firestore REST (collection orders_{id} estilo doc-as-array)
// As rules permitem write público pra orders_* (offline sync)
// ============================================
async function firestoreGet(docPath) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}`;
    const r = await fetch(url);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`firestore get failed: ${r.status}`);
    return await r.json();
}

async function firestorePatch(docPath, fields, mask) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}` +
        (mask ? `&${mask}` : "");
    const r = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`firestore patch failed: ${r.status} ${t.slice(0, 200)}`);
    }
    return await r.json();
}

// Converte JS object pra Firestore Value
function toFsValue(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "string") return { stringValue: v };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") {
        return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (Array.isArray(v)) {
        return { arrayValue: { values: v.map(toFsValue) } };
    }
    if (typeof v === "object") {
        const fields = {};
        for (const [k, val] of Object.entries(v)) fields[k] = toFsValue(val);
        return { mapValue: { fields } };
    }
    return { stringValue: String(v) };
}

function fromFsValue(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFsValue);
    if ("mapValue" in v) {
        const obj = {};
        for (const [k, val] of Object.entries(v.mapValue.fields || {})) obj[k] = fromFsValue(val);
        return obj;
    }
    return null;
}

// ============================================
// TOOL: criar_pedido
// ============================================
async function criar_pedido({
    franchiseeId,
    customerPhone,
    customerName,
    sabor,
    tamanho,
    tipo,           // 'delivery' | 'retirada'
    endereco,
    pagamento,      // 'pix' | 'cartao' | 'dinheiro'
    troco_para,
    observacoes,
    qty = 1
}) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    if (!sabor || !tamanho) return { error: "sabor e tamanho obrigatórios" };
    if (!["P", "M", "G", "GG"].includes(tamanho)) return { error: "tamanho inválido (P/M/G/GG)" };
    if (!tipo || !["delivery", "retirada"].includes(tipo)) return { error: "tipo deve ser delivery ou retirada" };
    if (tipo === "delivery" && !endereco) return { error: "delivery exige endereço" };

    const itemNome = normalizarSabor(sabor) + " " + tamanho;
    const items = [{
        id: `item_${Date.now()}`,
        name: itemNome,
        sabor: normalizarSabor(sabor),
        tamanho,
        qty,
        price: PRECOS[tamanho],
        total: PRECOS[tamanho] * qty
    }];

    const subtotal = calcularPrecos(items);
    const fee = tipo === "delivery" ? TAXA_DELIVERY : 0;
    const total = subtotal + fee;

    const orderId = `lulu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const order = {
        id: orderId,
        items,
        subtotal,
        deliveryFee: fee,
        total,
        type: tipo === "delivery" ? "delivery_whatsapp" : "retirada",
        delivery: tipo === "delivery" ? { type: "delivery", address: endereco, fee } : null,
        customer: {
            name: customerName || null,
            phone: customerPhone || null
        },
        payments: [{
            method: pagamento || "pix",
            amount: total,
            trocoPara: pagamento === "dinheiro" && troco_para ? Number(troco_para) : null
        }],
        observacoes: observacoes || null,
        status: "novo",
        source: "whatsapp_lulu",
        franchiseeId,
        createdAt: new Date().toISOString(),
        createdBy: "lulu_ia"
    };

    // Schema real do projeto: coleção 'datastore', doc 'orders_{franchiseeId}',
    // field 'value' é JSON STRING (não array Firestore) — pra ser compatível
    // com DataStore.setCollection() do client.
    const docPath = `datastore/orders_${franchiseeId}`;
    let existingOrders = [];
    try {
        const existing = await firestoreGet(docPath);
        if (existing) {
            const valueStr = existing.fields?.value?.stringValue || "[]";
            existingOrders = JSON.parse(valueStr);
            if (!Array.isArray(existingOrders)) existingOrders = [];
        }
    } catch (e) {
        console.warn("[criar_pedido] doc não existe, criando novo:", e.message);
    }

    existingOrders.push(order);
    if (existingOrders.length > 2000) existingOrders = existingOrders.slice(-2000);

    const fields = {
        value: { stringValue: JSON.stringify(existingOrders) },
        updatedAt: { timestampValue: new Date().toISOString() }
    };
    const mask = "updateMask.fieldPaths=value&updateMask.fieldPaths=updatedAt";

    try {
        await firestorePatch(docPath, fields, mask);
    } catch (e) {
        console.error("[criar_pedido] erro gravando:", e.message);
        return { error: "falha gravando pedido: " + e.message };
    }

    return {
        ok: true,
        orderId,
        orderShortId: orderId.slice(-6).toUpperCase(),
        item: itemNome,
        subtotal: subtotal.toFixed(2),
        deliveryFee: fee.toFixed(2),
        total: total.toFixed(2),
        eta: tipo === "delivery" ? "25-40min" : "10-15min",
        status: "novo"
    };
}

// ============================================
// TOOL: consultar_pedido (busca por phone — últimos 5 pedidos)
// ============================================
async function consultar_pedido({ franchiseeId, customerPhone, orderId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const docPath = `datastore/orders_${franchiseeId}`;
    let allOrders = [];
    try {
        const doc = await firestoreGet(docPath);
        if (!doc) return { found: false, message: "nenhum pedido nessa franquia ainda" };
        const valueStr = doc.fields?.value?.stringValue || "[]";
        allOrders = JSON.parse(valueStr);
        if (!Array.isArray(allOrders)) allOrders = [];
    } catch (e) {
        return { error: e.message };
    }

    let matched = [];
    if (orderId) {
        const id = String(orderId).toLowerCase();
        matched = allOrders.filter(o => o.id?.toLowerCase().includes(id) || o.id?.endsWith(id));
    } else if (customerPhone) {
        const phone = String(customerPhone).replace(/\D/g, "");
        matched = allOrders.filter(o => {
            const p = (o.customer?.phone || "").replace(/\D/g, "");
            return p && (p === phone || p.endsWith(phone) || phone.endsWith(p));
        });
    }

    if (!matched.length) return { found: false };

    return {
        found: true,
        count: matched.length,
        orders: matched.slice(-5).map(o => ({
            id: o.id?.slice(-6)?.toUpperCase(),
            status: o.status,
            total: o.total,
            items: (o.items || []).map(i => `${i.qty}x ${i.name}`).join(", "),
            createdAt: o.createdAt
        }))
    };
}

// ============================================
// TOOL: listar_promocoes
// ============================================
async function listar_promocoes({ franchiseeId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const docPath = `franchises/${franchiseeId}`;
    try {
        const doc = await firestoreGet(docPath);
        if (!doc) return { promocoes: [] };
        const f = doc.fields || {};
        const promo = f.promocaoAtiva?.stringValue;
        const horarioEspecial = f.horarioHoje?.stringValue;
        return {
            promocoes: promo ? [promo] : [],
            horarioEspecial: horarioEspecial || null
        };
    } catch (e) {
        return { promocoes: [], error: e.message };
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    criar_pedido,
    consultar_pedido,
    listar_promocoes,
    PRECOS,
    TAXA_DELIVERY
};
