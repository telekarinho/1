/* ============================================
   MilkyPot — Tools que a Lulu IA chama
   ============================================
   - listar_cardapio       → cardápio dinâmico do Firestore
   - criar_pedido          → grava pedido REAL (multi-item, adicionais)
   - consultar_pedido      → busca pedidos do cliente
   - listar_promocoes      → promoções vigentes
   - cotar_delivery        → calcula taxa real (Uber Direct ou flat)
   ============================================ */

"use strict";

const Cardapio = require("./whatsapp-cardapio.js");

const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
const FB_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";

async function fsGet(docPath) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}`;
    const r = await fetch(url);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`firestore get ${r.status}`);
    return await r.json();
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
    return await r.json();
}

// ============================================
// TOOL: listar_cardapio
// ============================================
async function listar_cardapio({ franchiseeId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const cardapio = await Cardapio.getCardapio(franchiseeId);
    return {
        ok: true,
        source: cardapio.source,
        resumo: Cardapio.summarizeForLulu(cardapio),
        bases: (cardapio.bases || []).filter(b => b.available !== false).map(b => ({ id: b.id, name: b.name, emoji: b.emoji })),
        formatos: (cardapio.formatos || []).filter(f => f.available !== false).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, compatibleBases: f.compatibleBases })),
        tamanhos: (cardapio.tamanhos || []).filter(t => t.available !== false).map(t => ({ id: t.id, name: t.name, ml: t.ml, price: t.price })),
        sabores: cardapio.sabores
            ? Object.entries(cardapio.sabores).map(([k, c]) => ({
                categoria: c.name,
                items: (c.items || []).filter(i => i.available !== false).map(i => ({ id: i.id, name: i.name }))
            }))
            : [],
        adicionais: cardapio.adicionais
            ? Object.entries(cardapio.adicionais).map(([k, c]) => ({
                categoria: c.name,
                items: (c.items || []).filter(i => i.available !== false).map(i => ({ id: i.id, name: i.name, price: i.price }))
            }))
            : [],
        bebidas: (cardapio.bebidas || []).filter(b => b.available !== false).map(b => ({ id: b.id, name: b.name, price: b.price }))
    };
}

// ============================================
// TOOL: criar_pedido (multi-item, com adicionais e delivery config real)
// ============================================
async function criar_pedido({
    franchiseeId,
    customerPhone,
    customerName,
    items,           // [{ base, formato, tamanho, sabor, adicionais:[], qty }] OU [{ sabor, tamanho, qty }] simples
    tipo,            // 'delivery' | 'retirada'
    endereco,        // só se delivery
    pagamento,       // 'pix' | 'cartao' | 'dinheiro'
    troco_para,
    observacoes
}) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    if (!Array.isArray(items) || !items.length) return { error: "items[] obrigatório (pelo menos 1)" };
    if (!tipo || !["delivery", "retirada"].includes(tipo)) return { error: "tipo deve ser delivery ou retirada" };
    if (tipo === "delivery" && !endereco) return { error: "delivery exige endereço" };
    if (!pagamento || !["pix", "cartao", "dinheiro"].includes(pagamento)) return { error: "pagamento deve ser pix, cartao ou dinheiro" };

    const cardapio = await Cardapio.getCardapio(franchiseeId);
    const deliveryCfg = await Cardapio.getDeliveryConfig(franchiseeId);

    // Resolve cada item contra o cardápio
    const resolvedItems = [];
    const errors = [];
    for (const raw of items) {
        const r = Cardapio.resolveItem(raw, cardapio, "delivery");
        if (r.errors?.length) {
            errors.push(...r.errors);
            continue;
        }
        const qty = Math.max(1, parseInt(raw.qty) || 1);
        resolvedItems.push({
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...r.item,
            qty,
            price: r.item.unitPrice,
            total: r.item.unitPrice * qty
        });
    }

    if (!resolvedItems.length) {
        return { error: "nenhum item válido. " + errors.join("; ") };
    }

    const subtotal = resolvedItems.reduce((s, i) => s + i.total, 0);
    let deliveryFee = 0;
    if (tipo === "delivery") {
        // Modo FRETE_GRATIS_TOTAL: se passou do mínimo, frete grátis
        if (deliveryCfg.modo_frete_delivery === "FRETE_GRATIS_TOTAL" && subtotal >= deliveryCfg.pedido_minimo_delivery) {
            deliveryFee = 0;
        } else {
            deliveryFee = deliveryCfg.deliveryFee || 5.90;
        }
    }
    const total = subtotal + deliveryFee;

    // Pedido mínimo pra delivery
    if (tipo === "delivery" && subtotal < deliveryCfg.pedido_minimo_delivery) {
        return {
            error: "pedido_minimo_nao_atingido",
            subtotal: subtotal.toFixed(2),
            minimo: deliveryCfg.pedido_minimo_delivery.toFixed(2),
            faltam: (deliveryCfg.pedido_minimo_delivery - subtotal).toFixed(2),
            mensagem: `Pedido mínimo pra delivery é R$ ${deliveryCfg.pedido_minimo_delivery.toFixed(2).replace('.', ',')}. Faltam R$ ${(deliveryCfg.pedido_minimo_delivery - subtotal).toFixed(2).replace('.', ',')} (ou pode pedir retirada na loja).`
        };
    }

    const orderId = `lulu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const order = {
        id: orderId,
        items: resolvedItems,
        subtotal,
        deliveryFee,
        total,
        type: tipo === "delivery" ? "delivery_whatsapp" : "retirada",
        delivery: tipo === "delivery" ? { type: "delivery", address: endereco, fee: deliveryFee } : null,
        customer: { name: customerName || null, phone: customerPhone || null },
        payments: [{
            method: pagamento,
            amount: total,
            trocoPara: pagamento === "dinheiro" && troco_para ? Number(troco_para) : null
        }],
        observacoes: observacoes || null,
        status: "novo",
        source: "whatsapp_lulu",
        franchiseeId,
        createdAt: new Date().toISOString(),
        createdBy: "lulu_ia",
        cardapio_source: cardapio.source
    };

    // Lê doc atual datastore/orders_{fid} (schema compatível com DataStore client)
    const docPath = `datastore/orders_${franchiseeId}`;
    let existing = [];
    try {
        const doc = await fsGet(docPath);
        if (doc) {
            const v = doc.fields?.value?.stringValue || "[]";
            existing = JSON.parse(v);
            if (!Array.isArray(existing)) existing = [];
        }
    } catch (e) { /* doc não existe ainda */ }

    existing.push(order);
    if (existing.length > 2000) existing = existing.slice(-2000);

    try {
        await fsPatch(
            docPath,
            {
                value: { stringValue: JSON.stringify(existing) },
                updatedAt: { timestampValue: new Date().toISOString() }
            },
            "updateMask.fieldPaths=value&updateMask.fieldPaths=updatedAt"
        );
    } catch (e) {
        console.error("[criar_pedido] erro gravando:", e.message);
        return { error: "falha gravando pedido: " + e.message };
    }

    return {
        ok: true,
        orderId,
        orderShortId: orderId.slice(-6).toUpperCase(),
        items: resolvedItems.map(i => `${i.qty}x ${i.name}`),
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        deliveryFeeNote: tipo === "delivery" && deliveryFee === 0 ? "Frete grátis (pedido acima do mínimo)" : null,
        total: total.toFixed(2),
        eta: tipo === "delivery" ? "30-50min" : "10-20min",
        status: "novo",
        warningsCardapio: errors.length ? errors : undefined
    };
}

// ============================================
// TOOL: consultar_pedido
// ============================================
async function consultar_pedido({ franchiseeId, customerPhone, orderId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const docPath = `datastore/orders_${franchiseeId}`;
    let allOrders = [];
    try {
        const doc = await fsGet(docPath);
        if (!doc) return { found: false, message: "nenhum pedido nessa franquia ainda" };
        const v = doc.fields?.value?.stringValue || "[]";
        allOrders = JSON.parse(v);
        if (!Array.isArray(allOrders)) allOrders = [];
    } catch (e) {
        return { error: e.message };
    }

    let matched = [];
    if (orderId) {
        const id = String(orderId).toLowerCase().replace(/[^a-z0-9]/g, "");
        matched = allOrders.filter(o => {
            const oid = (o.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return oid.includes(id) || oid.endsWith(id);
        });
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
        orders: matched.slice(-5).reverse().map(o => ({
            id: (o.id || "").slice(-6).toUpperCase(),
            status: o.status,
            total: Number(o.total).toFixed(2),
            items: (o.items || []).map(i => `${i.qty || 1}x ${i.name}`).join(", "),
            createdAt: o.createdAt
        }))
    };
}

// ============================================
// TOOL: listar_promocoes
// ============================================
async function listar_promocoes({ franchiseeId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    try {
        const f = await fsGet(`franchises/${franchiseeId}`);
        if (!f) return { promocoes: [] };
        const fields = f.fields || {};
        const promos = [];
        if (fields.promocaoAtiva?.stringValue) promos.push(fields.promocaoAtiva.stringValue);
        if (fields.horarioHoje?.stringValue) promos.push("Horário hoje: " + fields.horarioHoje.stringValue);
        return { promocoes: promos };
    } catch (e) {
        return { promocoes: [], error: e.message };
    }
}

// ============================================
// TOOL: cotar_delivery (estima taxa pelo endereço — fase futura usa Uber Direct)
// Por agora retorna a taxa fixa configurada da franquia
// ============================================
async function cotar_delivery({ franchiseeId, endereco }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const cfg = await Cardapio.getDeliveryConfig(franchiseeId);
    return {
        ok: true,
        deliveryFee: cfg.deliveryFee,
        deliveryFeeBRL: `R$ ${cfg.deliveryFee.toFixed(2).replace('.', ',')}`,
        modo: cfg.modo_frete_delivery,
        pedidoMinimo: cfg.pedido_minimo_delivery,
        eta: "30-50min",
        observacao: cfg.modo_frete_delivery === "FRETE_GRATIS_TOTAL"
            ? `Frete grátis em pedidos a partir de R$ ${cfg.pedido_minimo_delivery.toFixed(2).replace('.', ',')}`
            : null
    };
}

module.exports = {
    listar_cardapio,
    criar_pedido,
    consultar_pedido,
    listar_promocoes,
    cotar_delivery
};
