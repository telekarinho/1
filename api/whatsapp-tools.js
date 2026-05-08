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
const Customers = require("./whatsapp-customers.js");

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
// TOOL: listar_cardapio (compacto pra evitar 429 rate limit)
// ============================================
async function listar_cardapio({ franchiseeId }) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    const cardapio = await Cardapio.getCardapio(franchiseeId);
    return {
        ok: true,
        source: cardapio.source,
        totalProdutos: cardapio.produtos.length,
        // Resumo super compacto pra IA: só nome + preço
        produtos: cardapio.produtos.map(p => ({
            name: p.name,
            categoria: p.categoriaName || p.categoria,
            preco: p.priceDelivery || p.price
        })),
        adicionais: cardapio.adicionais.map(a => ({ name: a.name, preco: a.price })),
        bebidas: cardapio.bebidas.map(b => ({ name: b.name, preco: b.price }))
    };
}

// ============================================
// TOOL: criar_pedido (multi-item, com adicionais e delivery config real)
// ============================================
async function criar_pedido({
    franchiseeId,
    customerPhone,
    customerName,
    items,           // [{ sabor: 'amora', adicionais:[], qty, observacao }]
    tipo,            // 'delivery' | 'retirada'
    endereco,        // só se delivery
    pagamento,       // 'pix' | 'cartao' | 'dinheiro'
    troco_para,
    observacoes,
    recipient,       // { name, phone? } se outra pessoa for receber/retirar
    usar_endereco_anterior // true → puxa o último endereço do cliente
}) {
    if (!franchiseeId) return { error: "franchiseeId obrigatório" };
    if (!Array.isArray(items) || !items.length) return { error: "items[] obrigatório (pelo menos 1)" };
    if (!tipo || !["delivery", "retirada"].includes(tipo)) return { error: "tipo deve ser delivery ou retirada" };
    if (!pagamento || !["pix", "cartao", "dinheiro"].includes(pagamento)) return { error: "pagamento deve ser pix, cartao ou dinheiro" };

    // Se cliente disse "manda no endereço de sempre", puxa do perfil
    if (tipo === "delivery" && !endereco && usar_endereco_anterior) {
        const profile = await Customers.getCustomer(franchiseeId, customerPhone);
        if (profile?.lastAddress) endereco = profile.lastAddress;
    }
    if (tipo === "delivery" && !endereco) return { error: "delivery exige endereço (passe `endereco` ou `usar_endereco_anterior:true` se cliente já pediu antes)" };

    const cardapio = await Cardapio.getCardapio(franchiseeId);
    const deliveryCfg = await Cardapio.getDeliveryConfig(franchiseeId);

    // Resolve cada item contra o cardápio (busca fuzzy por nome)
    const resolvedItems = [];
    const errors = [];
    for (const raw of items) {
        const r = Cardapio.resolveItem(raw, cardapio);
        if (r.errors?.length || !r.item) {
            errors.push(...(r.errors || ["item não resolvido"]));
            continue;
        }
        resolvedItems.push({
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...r.item,
            price: r.item.unitPrice,
            total: r.item.unitPrice * r.item.qty
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
    const recipientClean = (recipient && recipient.name)
        ? { name: String(recipient.name).slice(0, 100), phone: recipient.phone ? String(recipient.phone).replace(/\D/g, "") : null }
        : null;

    const order = {
        id: orderId,
        items: resolvedItems,
        subtotal,
        deliveryFee,
        total,
        type: tipo === "delivery" ? "delivery_whatsapp" : "retirada",
        delivery: tipo === "delivery" ? { type: "delivery", address: endereco, fee: deliveryFee } : null,
        customer: { name: customerName || null, phone: customerPhone || null },
        recipient: recipientClean,   // {name,phone} se OUTRA pessoa vai receber/retirar
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

    // Atualiza perfil do cliente (memória pra próximos pedidos)
    try {
        await Customers.registerOrder(franchiseeId, customerPhone, order);
    } catch (e) {
        console.warn("[criar_pedido] customer registerOrder failed:", e.message);
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
        recipient: recipientClean,
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
