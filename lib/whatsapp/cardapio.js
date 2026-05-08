/* ============================================
   MilkyPot — Cardápio Loader (server-side pra Lulu IA)
   ============================================
   Lê catalog_config do Firestore (sincronizado do catalog_v2).
   Schema real:
     {
       sabores: {
         milkshake: { name, items: [{id, name, price, desc, available, disponibilidade}] },
         sundae:    { ... },
         picole:    { ... },
         buffet:    { ... },
         casquinha: { ... },
         acai:      { ... }
       },
       adicionais: {
         topping: { items: [{id, name, price}] }
       },
       bebidas: [{id, name, price}]
     }
   Cada produto tem preço próprio (vem do catalog_v2 com 'preços por canal').
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

async function fsGetCollectionData(name, franchiseeId) {
    const docName = franchiseeId ? `${name}_${franchiseeId}` : name;
    const doc = await fsGet(`datastore/${docName}`);
    if (!doc) return null;
    try {
        return JSON.parse(doc.fields?.value?.stringValue || "null");
    } catch (e) { return null; }
}

// ============================================
// API
// ============================================
async function getCardapio(franchiseeId) {
    // 1. catalog_v2_{fid} (raw schema)
    const v2 = await fsGetCollectionData("catalog_v2", franchiseeId);
    if (v2 && Array.isArray(v2.produtos) && v2.produtos.length) {
        return _normalizeFromV2(v2, franchiseeId);
    }
    // 2. catalog_config (sync legado, schema simplificado)
    const cfg = await fsGetCollectionData("catalog_config");
    if (cfg && cfg.sabores) {
        return _normalizeFromConfig(cfg, franchiseeId);
    }
    // 3. Fallback minimo
    return _emptyCardapio(franchiseeId);
}

// catalog_config (já tem `sabores` com items completos) — só normaliza
function _normalizeFromConfig(cfg, fid) {
    const c = {
        source: "catalog_config",
        franchiseeId: fid,
        categorias: [],
        produtos: [],
        adicionais: [],
        bebidas: []
    };

    // Sabores: cada categoria vira lista de produtos
    if (cfg.sabores && typeof cfg.sabores === "object") {
        for (const [catId, cat] of Object.entries(cfg.sabores)) {
            if (!cat?.items) continue;
            c.categorias.push({ id: catId, name: cat.name || catId, emoji: cat.icon || cat.emoji });
            for (const it of cat.items) {
                if (it.available === false) continue;
                if (it.disponibilidade && it.disponibilidade.delivery === false && it.disponibilidade.cardapio === false) continue;
                c.produtos.push({
                    id: it.id,
                    name: (it.name || "").replace(/^\d+\.\s*/, "").trim(), // remove "1. " do início
                    rawName: it.name,
                    desc: it.desc,
                    emoji: it.emoji,
                    price: Number(it.price) || 0,
                    priceDelivery: Number(it.priceDelivery || it.price) || 0,
                    categoria: catId,
                    categoriaName: cat.name,
                    aPartirDe: it.aPartirDe || false
                });
            }
        }
    }

    // Adicionais (toppings/coberturas)
    if (cfg.adicionais && typeof cfg.adicionais === "object") {
        const seen = new Set();
        for (const [k, cat] of Object.entries(cfg.adicionais)) {
            if (!cat?.items) continue;
            for (const it of cat.items) {
                if (it.available === false) continue;
                if (seen.has(it.id || it.name)) continue;
                seen.add(it.id || it.name);
                c.adicionais.push({
                    id: it.id,
                    name: (it.name || "").replace(/^\d+\.\s*/, "").trim(),
                    price: Number(it.price) || 0,
                    emoji: it.emoji
                });
            }
        }
    }

    // Bebidas
    if (Array.isArray(cfg.bebidas)) {
        for (const b of cfg.bebidas) {
            if (b.available === false) continue;
            c.bebidas.push({
                id: b.id,
                name: (b.name || "").replace(/^\d+\.\s*/, "").trim(),
                price: Number(b.price) || 0,
                emoji: b.emoji
            });
        }
    }

    return c;
}

// catalog_v2 raw — converte pra mesmo schema unificado
function _normalizeFromV2(v2, fid) {
    const c = {
        source: "catalog_v2",
        franchiseeId: fid,
        categorias: (v2.categorias || []).filter(c => c.active !== false).map(c => ({ id: c.id, name: c.name, emoji: c.icon })),
        produtos: [],
        adicionais: [],
        bebidas: []
    };

    for (const p of (v2.produtos || [])) {
        if (p.active === false) continue;
        if (p.canal === "loja") continue; // só pega delivery/ambos
        const price = p.precos?.delivery?.real || p.precos?.delivery?.recomendado || p.precos?.loja?.real || 0;
        if (p.categoriaId === "cat_topping") {
            c.adicionais.push({
                id: p.id,
                name: (p.name || "").replace(/^\d+\.\s*/, "").trim(),
                price: Number(price) || 0,
                emoji: p.midia?.emoji
            });
        } else if (p.categoriaId === "cat_bebida") {
            c.bebidas.push({
                id: p.id,
                name: (p.name || "").replace(/^\d+\.\s*/, "").trim(),
                price: Number(price) || 0,
                emoji: p.midia?.emoji
            });
        } else {
            c.produtos.push({
                id: p.id,
                name: (p.name || "").replace(/^\d+\.\s*/, "").trim(),
                rawName: p.name,
                desc: p.desc,
                emoji: p.midia?.emoji,
                price: Number(price) || 0,
                priceDelivery: Number(price) || 0,
                categoria: p.categoriaId,
                categoriaName: c.categorias.find(cat => cat.id === p.categoriaId)?.name
            });
        }
    }

    return c;
}

function _emptyCardapio(fid) {
    return { source: "empty", franchiseeId: fid, categorias: [], produtos: [], adicionais: [], bebidas: [] };
}

// ============================================
// Delivery config
// ============================================
const DELIVERY_DEFAULT = {
    deliveryFee: 5.90,
    pedido_minimo_delivery: 30,
    modo_frete_delivery: 'FRETE_GRATIS_TOTAL',
    percentual_acrescimo_delivery: 30,
    taxa_uber_referencia: 10.50
};

async function getDeliveryConfig(franchiseeId) {
    try {
        // Tenta delivery_rules_{fid} primeiro (dedicated)
        const rules = await fsGetCollectionData("delivery_rules", franchiseeId);
        if (rules && typeof rules === "object") {
            return { ...DELIVERY_DEFAULT, ...rules };
        }
        // Fallback: doc /franchises/{id}
        const f = await fsGet(`franchises/${franchiseeId}`);
        if (f?.fields) {
            const fields = f.fields;
            return {
                deliveryFee: Number(fields.deliveryFee?.doubleValue || fields.deliveryFee?.stringValue) || DELIVERY_DEFAULT.deliveryFee,
                pedido_minimo_delivery: Number(fields.pedido_minimo_delivery?.doubleValue || fields.pedido_minimo_delivery?.integerValue) || DELIVERY_DEFAULT.pedido_minimo_delivery,
                modo_frete_delivery: fields.modo_frete_delivery?.stringValue || DELIVERY_DEFAULT.modo_frete_delivery,
                percentual_acrescimo_delivery: Number(fields.percentual_acrescimo_delivery?.doubleValue) || DELIVERY_DEFAULT.percentual_acrescimo_delivery
            };
        }
    } catch (e) { /* ignore */ }
    return DELIVERY_DEFAULT;
}

// ============================================
// Resolve produto pelo cardápio (fuzzy match)
// Input: { sabor, qty } — sabor é nome/parte do nome (ex: "amora", "blue ice")
// ============================================
function _normalizeText(s) {
    return String(s || "").toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
        .replace(/[^a-z0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buscarProduto(query, cardapio) {
    if (!query || !cardapio?.produtos?.length) return null;
    const q = _normalizeText(query);
    if (!q) return null;
    const produtos = cardapio.produtos;

    // 1. ID exato
    let m = produtos.find(p => p.id === query);
    if (m) return m;

    // 2. Nome normalizado exato
    m = produtos.find(p => _normalizeText(p.name) === q);
    if (m) return m;

    // 3. Nome contém todas as palavras da query
    const words = q.split(" ").filter(w => w.length >= 2);
    if (words.length) {
        m = produtos.find(p => {
            const norm = _normalizeText(p.name);
            return words.every(w => norm.includes(w));
        });
        if (m) return m;
    }

    // 4. Query contém parte do nome (ex: "amora" matches "Milkshake Amora Apaixonada")
    m = produtos.find(p => {
        const norm = _normalizeText(p.name);
        return q.includes(norm) || norm.includes(q);
    });
    if (m) return m;

    return null;
}

function buscarAdicional(query, cardapio) {
    if (!query || !cardapio?.adicionais?.length) return null;
    const q = _normalizeText(query);
    let m = cardapio.adicionais.find(a => a.id === query);
    if (m) return m;
    m = cardapio.adicionais.find(a => _normalizeText(a.name) === q);
    if (m) return m;
    m = cardapio.adicionais.find(a => _normalizeText(a.name).includes(q) || q.includes(_normalizeText(a.name)));
    return m || null;
}

// ============================================
// Resolve item pra criar_pedido
// Input: { sabor (query), adicionais: [queries], qty }
// ============================================
function resolveItem({ sabor, adicionais = [], qty = 1, observacao }, cardapio) {
    const errors = [];
    const produto = buscarProduto(sabor, cardapio);
    if (!produto) {
        errors.push(`Produto "${sabor}" não encontrado no cardápio. Tente: ${cardapio.produtos.slice(0, 5).map(p => p.name).join(" | ")}...`);
        return { errors, item: null };
    }

    const addsResolved = [];
    for (const adq of adicionais) {
        const a = buscarAdicional(adq, cardapio);
        if (a) addsResolved.push(a);
    }

    const basePrice = produto.priceDelivery || produto.price || 0;
    const adicionaisPrice = addsResolved.reduce((s, a) => s + (a.price || 0), 0);
    const unitPrice = basePrice + adicionaisPrice;

    return {
        errors: [],
        item: {
            productId: produto.id,
            name: produto.name,
            categoria: produto.categoriaName || produto.categoria,
            adicionais: addsResolved.map(a => ({ id: a.id, name: a.name, price: a.price })),
            unitPrice,
            basePrice,
            adicionaisPrice,
            qty: Math.max(1, parseInt(qty) || 1),
            observacao: observacao || null
        }
    };
}

// ============================================
// Resumo COMPACTO pra LLM (evita 429 rate limit)
// Mostra produtos AGRUPADOS por categoria, só nome + preço
// ============================================
function summarizeForLulu(cardapio) {
    if (!cardapio?.produtos?.length) return "(cardápio vazio)";

    const lines = [];
    const byCategoria = {};
    for (const p of cardapio.produtos) {
        const cat = p.categoriaName || p.categoria || "Outros";
        if (!byCategoria[cat]) byCategoria[cat] = [];
        byCategoria[cat].push(p);
    }

    for (const [cat, items] of Object.entries(byCategoria)) {
        const list = items.slice(0, 30).map(p => {
            const price = `R$${(p.priceDelivery || p.price || 0).toFixed(2).replace('.', ',')}`;
            return `${p.name} (${price})`;
        }).join(" | ");
        lines.push(`${cat}: ${list}`);
    }

    if (cardapio.adicionais.length) {
        const adds = cardapio.adicionais.slice(0, 20).map(a =>
            `${a.name} (R$${(a.price || 0).toFixed(2).replace('.', ',')})`
        ).join(", ");
        lines.push(`Adicionais: ${adds}`);
    }

    if (cardapio.bebidas.length) {
        const beb = cardapio.bebidas.map(b =>
            `${b.name} R$${(b.price || 0).toFixed(2).replace('.', ',')}`
        ).join(" | ");
        lines.push(`Bebidas: ${beb}`);
    }

    return lines.join("\n");
}

module.exports = {
    getCardapio,
    getDeliveryConfig,
    resolveItem,
    buscarProduto,
    buscarAdicional,
    summarizeForLulu,
    DELIVERY_DEFAULT
};
