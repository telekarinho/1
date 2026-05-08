/* ============================================
   MilkyPot — Cardápio Loader (server-side pra Lulu IA)
   ============================================
   Lê cardápio do Firestore na ordem:
   1. datastore/catalog_v2_{franchiseeId} (novo schema)
   2. datastore/catalog_config (legado, global)
   3. Fallback hardcoded (cópia do CARDAPIO_CONFIG)

   Também lê config de delivery da franquia:
   - taxa fixa (deliveryFee)
   - modo frete (FRETE_GRATIS_TOTAL / COBRAR_DIFERENCA / FRETE_NORMAL)
   - pedido mínimo
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

// Lê valor JSON-serializado (DataStore schema: doc.fields.value.stringValue = JSON)
async function fsGetCollection(name, franchiseeId) {
    const docName = franchiseeId ? `${name}_${franchiseeId}` : name;
    const doc = await fsGet(`datastore/${docName}`);
    if (!doc) return null;
    try {
        return JSON.parse(doc.fields?.value?.stringValue || "null");
    } catch (e) { return null; }
}

// ============================================
// FALLBACK HARDCODED — só se Firestore não tiver nada
// ============================================
const CARDAPIO_FALLBACK = {
    bases: [
        { id: 'ninho',    name: 'Milkypot Ninho',     emoji: '☁️', desc: 'Base cremosa de leite Ninho. A mais amada!', available: true },
        { id: 'zero-fit', name: 'Milkypot Zero / Fit', emoji: '💪', desc: 'Base zero açúcar com opções proteicas.',  available: true },
        { id: 'acai',     name: 'Milkypot Açaí',      emoji: '🫐', desc: 'Base de açaí puro e cremoso.',             available: true }
    ],
    formatos: [
        { id: 'shake',      name: 'Milkypot Shake',  emoji: '🥤', compatibleBases: ['ninho', 'zero-fit'], available: true },
        { id: 'sundae',     name: 'Sundae Gourmet',  emoji: '🍨', compatibleBases: ['ninho', 'zero-fit'], available: true },
        { id: 'acai-bowl',  name: 'Açaí Bowl',       emoji: '🥣', compatibleBases: ['acai'],             available: true },
        { id: 'acai-shake', name: 'Açaí Shake',      emoji: '🥤', compatibleBases: ['acai'],             available: true }
    ],
    tamanhos: [
        { id: 'mini',    name: 'Mini',    ml: 180, price: 10.00, available: true },
        { id: 'pequeno', name: 'Pequeno', ml: 300, price: 14.00, available: true },
        { id: 'medio',   name: 'Médio',   ml: 500, price: 18.00, available: true },
        { id: 'gigante', name: 'Gigante', ml: 700, price: 22.00, available: true }
    ],
    sabores: {
        classicos: { name: 'Clássicos', emoji: '⭐', compatibleBases: ['ninho'], items: [
            { id: 'morango',       name: 'Morango', emoji: '🍓', available: true },
            { id: 'ninho',         name: 'Ninho', emoji: '☁️', available: true },
            { id: 'ninho-morango', name: 'Ninho com Morango', emoji: '🍓', available: true },
            { id: 'nutella',       name: 'Nutella', emoji: '🍫', available: true },
            { id: 'oreo',          name: 'Oreo', emoji: '🍪', available: true }
        ]},
        adulto: { name: 'Adulto +18', emoji: '🔞', compatibleBases: ['ninho'], items: [
            { id: 'amarula-cream', name: 'Amarula Cream', emoji: '🥃', available: true },
            { id: 'baileys-cream', name: 'Baileys Cream', emoji: '🥃', available: true }
        ]},
        acai: { name: 'Açaí', emoji: '🫐', compatibleBases: ['acai'], items: [
            { id: 'acai-granola', name: 'Açaí + Granola', emoji: '🥣', available: true },
            { id: 'acai-banana',  name: 'Açaí + Banana',  emoji: '🍌', available: true },
            { id: 'acai-morango', name: 'Açaí + Morango', emoji: '🍓', available: true }
        ]},
        zero_fit: { name: 'Zero / Fit', emoji: '💪', compatibleBases: ['zero-fit'], items: [
            { id: 'whey',           name: 'Whey', emoji: '💪', available: true },
            { id: 'banana-whey',    name: 'Banana + Whey', emoji: '🍌', available: true },
            { id: 'pasta-amendoim', name: 'Pasta de Amendoim', emoji: '🥜', available: true }
        ]}
    },
    adicionais: {
        bordas: { name: 'Bordas Recheadas', emoji: '🔵', items: [
            { id: 'borda-nutella', name: 'Nutella', price: 4.00, emoji: '🍫', available: true },
            { id: 'borda-ninho',   name: 'Creme de Ninho', price: 4.00, emoji: '☁️', available: true },
            { id: 'borda-oreo',    name: 'Oreo', price: 4.00, emoji: '🍪', available: true }
        ]},
        frutas: { name: 'Frutas', emoji: '🍓', items: [
            { id: 'add-morango', name: 'Morango', price: 3.00, emoji: '🍓', available: true },
            { id: 'add-banana',  name: 'Banana',  price: 3.00, emoji: '🍌', available: true }
        ]},
        toppings: { name: 'Toppings', emoji: '🍪', items: [
            { id: 'add-granola',    name: 'Granola', price: 3.00, emoji: '🥣', available: true },
            { id: 'add-oreo',       name: 'Oreo',    price: 3.00, emoji: '🍪', available: true },
            { id: 'add-confete',    name: 'Confete', price: 2.00, emoji: '🎉', available: true },
            { id: 'add-condensado', name: 'Leite Condensado', price: 3.00, emoji: '🥛', available: true },
            { id: 'add-chocolate',  name: 'Chocolate', price: 3.00, emoji: '🍫', available: true }
        ]}
    },
    bebidas: [
        { id: 'agua',     name: 'Água',         price: 3.00, emoji: '💧', available: true },
        { id: 'agua-gas', name: 'Água com Gás', price: 4.00, emoji: '🫧', available: true }
    ]
};

const DELIVERY_DEFAULT = {
    deliveryFee: 5.90,
    pedido_minimo_delivery: 30,
    modo_frete_delivery: 'FRETE_GRATIS_TOTAL', // ou 'COBRAR_DIFERENCA' / 'FRETE_NORMAL'
    percentual_acrescimo_delivery: 30,
    taxa_uber_referencia: 10.50
};

// ============================================
// API
// ============================================
async function getCardapio(franchiseeId) {
    // 1. Tenta catalog_v2_{fid}
    const v2 = await fsGetCollection("catalog_v2", franchiseeId);
    if (v2 && Array.isArray(v2.produtos) && v2.produtos.length) {
        return { source: "catalog_v2", franchiseeId, ...v2 };
    }
    // 2. Tenta catalog_config (global)
    const config = await fsGetCollection("catalog_config");
    if (config && (config.bases || config.sabores || config.tamanhos)) {
        return { source: "catalog_config", franchiseeId, ...config };
    }
    // 3. Fallback hardcoded
    return { source: "fallback", franchiseeId, ...CARDAPIO_FALLBACK };
}

async function getDeliveryConfig(franchiseeId) {
    // Lê config_delivery do franchise doc + DELIVERY_DEFAULT
    try {
        const f = await fsGet(`franchises/${franchiseeId}`);
        if (!f?.fields) return DELIVERY_DEFAULT;
        const fields = f.fields;
        return {
            deliveryFee: Number(fields.deliveryFee?.stringValue || fields.deliveryFee?.doubleValue) || DELIVERY_DEFAULT.deliveryFee,
            pedido_minimo_delivery: Number(fields.pedido_minimo_delivery?.doubleValue || fields.pedido_minimo_delivery?.integerValue) || DELIVERY_DEFAULT.pedido_minimo_delivery,
            modo_frete_delivery: fields.modo_frete_delivery?.stringValue || DELIVERY_DEFAULT.modo_frete_delivery,
            percentual_acrescimo_delivery: Number(fields.percentual_acrescimo_delivery?.doubleValue || fields.percentual_acrescimo_delivery?.integerValue) || DELIVERY_DEFAULT.percentual_acrescimo_delivery,
            taxa_uber_referencia: Number(fields.taxa_uber_referencia?.doubleValue) || DELIVERY_DEFAULT.taxa_uber_referencia
        };
    } catch (e) { return DELIVERY_DEFAULT; }
}

// ============================================
// Resolve um item do pedido pelo cardápio (find by id ou nome fuzzy)
// Input: { base, formato, tamanho, sabor, adicionais[] }
// Output: { name, price, items resolvidos, total }
// ============================================
function fuzzyMatch(query, items, idKey = "id", nameKey = "name") {
    if (!query || !items || !items.length) return null;
    const q = String(query).toLowerCase().trim().replace(/[\s\-_]+/g, " ");
    // 1. Match exato por id
    let m = items.find(i => i[idKey] === query);
    if (m) return m;
    // 2. Match exato por name (lowercase)
    m = items.find(i => i[nameKey]?.toLowerCase() === q);
    if (m) return m;
    // 3. Contém
    m = items.find(i => i[nameKey]?.toLowerCase().includes(q) || q.includes(i[nameKey]?.toLowerCase()));
    if (m) return m;
    // 4. Match com underscore/hyphen variations
    m = items.find(i => {
        const norm = i[nameKey]?.toLowerCase().replace(/[\s\-_]+/g, " ");
        return norm === q || norm?.includes(q) || q.includes(norm);
    });
    return m || null;
}

function resolveItem({ base, formato, tamanho, sabor, adicionais = [] }, cardapio, channel = "delivery") {
    const errors = [];
    const found = {};

    // Tamanho é obrigatório (define preço base)
    found.tamanho = fuzzyMatch(tamanho, cardapio.tamanhos || [], "id", "name");
    if (!found.tamanho) errors.push(`tamanho "${tamanho}" não encontrado. Disponíveis: ${(cardapio.tamanhos || []).map(t => t.name).join(", ")}`);

    // Sabor (procura em todas as categorias)
    if (sabor) {
        const allSabores = [];
        for (const cat of Object.values(cardapio.sabores || {})) {
            if (Array.isArray(cat?.items)) allSabores.push(...cat.items);
        }
        found.sabor = fuzzyMatch(sabor, allSabores);
        if (!found.sabor) errors.push(`sabor "${sabor}" não encontrado`);
    }

    // Base (auto-detecta pela compatibilidade do sabor se não passou)
    if (base) {
        found.base = fuzzyMatch(base, cardapio.bases || []);
    } else if (found.sabor) {
        const compatBases = (Object.values(cardapio.sabores || {}).find(c =>
            (c.items || []).some(i => i.id === found.sabor.id)
        ) || {}).compatibleBases;
        if (compatBases?.length && cardapio.bases) {
            found.base = cardapio.bases.find(b => compatBases.includes(b.id)) || null;
        }
    }

    // Formato (auto se não passou — pega o primeiro compatível com a base)
    if (formato) {
        found.formato = fuzzyMatch(formato, cardapio.formatos || []);
    } else if (found.base) {
        found.formato = (cardapio.formatos || []).find(f =>
            (f.compatibleBases || []).includes(found.base.id) && f.available !== false
        ) || null;
    }

    // Adicionais (resolve cada um)
    found.adicionais = [];
    for (const addQuery of (adicionais || [])) {
        const allAdds = [];
        for (const cat of Object.values(cardapio.adicionais || {})) {
            if (Array.isArray(cat?.items)) allAdds.push(...cat.items);
        }
        const m = fuzzyMatch(addQuery, allAdds);
        if (m) found.adicionais.push(m);
    }

    // Calcula preço (delivery por default)
    if (errors.length || !found.tamanho) {
        return { errors, item: null };
    }

    const basePrice = found.tamanho.price || 0;
    const adicionaisPrice = found.adicionais.reduce((s, a) => s + (a.price || 0), 0);
    const totalUnit = basePrice + adicionaisPrice;

    const nameParts = [];
    if (found.formato) nameParts.push(found.formato.name);
    if (found.base) nameParts.push("(" + found.base.name + ")");
    if (found.sabor) nameParts.push(found.sabor.name);
    if (found.tamanho) nameParts.push(found.tamanho.name);
    const itemName = nameParts.join(" ").replace(/\s+/g, " ").trim() || (sabor || "Item");

    return {
        errors,
        item: {
            name: itemName,
            base: found.base?.id,
            formato: found.formato?.id,
            tamanho: found.tamanho?.id,
            sabor: found.sabor?.id,
            saborName: found.sabor?.name,
            adicionais: found.adicionais.map(a => ({ id: a.id, name: a.name, price: a.price })),
            unitPrice: totalUnit,
            tamanhoMl: found.tamanho.ml
        }
    };
}

// ============================================
// Cardápio resumido pra IA (texto curto)
// ============================================
function summarizeForLulu(cardapio) {
    const lines = [];
    lines.push("CARDÁPIO ATUAL DA FRANQUIA:");

    if (cardapio.bases?.length) {
        const ativas = cardapio.bases.filter(b => b.available !== false).map(b => `${b.emoji || ""} ${b.name}`).join(", ");
        lines.push(`Bases: ${ativas}`);
    }
    if (cardapio.formatos?.length) {
        const ativos = cardapio.formatos.filter(f => f.available !== false).map(f => `${f.emoji || ""} ${f.name}`).join(", ");
        lines.push(`Formatos: ${ativos}`);
    }
    if (cardapio.tamanhos?.length) {
        const tams = cardapio.tamanhos.filter(t => t.available !== false).map(t => `${t.name} ${t.ml}ml R$${t.price.toFixed(2).replace('.', ',')}`).join(" | ");
        lines.push(`Tamanhos: ${tams}`);
    }
    if (cardapio.sabores) {
        for (const [catId, cat] of Object.entries(cardapio.sabores)) {
            const items = (cat.items || []).filter(i => i.available !== false).map(i => i.name).join(", ");
            if (items) lines.push(`${cat.emoji || ""} ${cat.name}: ${items}`);
        }
    }
    if (cardapio.adicionais) {
        for (const cat of Object.values(cardapio.adicionais)) {
            const items = (cat.items || []).filter(i => i.available !== false).map(i => `${i.name} R$${(i.price || 0).toFixed(2).replace('.', ',')}`).join(", ");
            if (items) lines.push(`${cat.emoji || ""} ${cat.name}: ${items}`);
        }
    }
    if (cardapio.bebidas?.length) {
        const beb = cardapio.bebidas.filter(b => b.available !== false).map(b => `${b.name} R$${(b.price || 0).toFixed(2).replace('.', ',')}`).join(" | ");
        if (beb) lines.push(`🥤 Bebidas: ${beb}`);
    }

    return lines.join("\n");
}

module.exports = {
    getCardapio,
    getDeliveryConfig,
    resolveItem,
    summarizeForLulu,
    DELIVERY_DEFAULT
};
