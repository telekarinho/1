/* ============================================================
   MilkyPot — Catalog Sync (server-side)
   ============================================================
   Cloud Function trigger: quando datastore/catalog_v2_<fid> ou
   datastore/inventory_<fid> muda, recompõe o datastore/catalog_config
   no servidor — eliminando race condition entre PCs.

   Também recalcula custoTotal de cada produto baseado no inventory:
     custoInsumos = sum(insumo.cost × qty_convertida)
     custoTotal   = custoInsumos + custos.custoAdicional.embalagem + ...
   ============================================================ */

const admin = require("firebase-admin");

const EXCLUIR_SABORES = ["cat_bebida", "cat_topping"];

function _r2(n) { return Math.round(Number(n) * 100) / 100; }
function _r3(n) { return Math.round(Number(n) * 1000) / 1000; }

/** Conversão simples entre unidades */
function _convertUnit(qty, fromUnit, toUnit) {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === "kg" && toUnit === "g") return qty * 1000;
    if (fromUnit === "g" && toUnit === "kg") return qty / 1000;
    if (fromUnit === "L" && toUnit === "ml") return qty * 1000;
    if (fromUnit === "ml" && toUnit === "L") return qty / 1000;
    return null;
}

/** Lê doc datastore e parse JSON value */
async function _readDS(db, docId) {
    const snap = await db.collection("datastore").doc(docId).get();
    if (!snap.exists) return null;
    try { return JSON.parse(snap.data().value); }
    catch (e) { return null; }
}

/** Escreve doc datastore com timestamp + audit tag */
async function _writeDS(db, docId, value, audit) {
    await db.collection("datastore").doc(docId).set({
        value: JSON.stringify(value),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _updatedBy: audit || "catalog-sync-fn",
    });
}

/**
 * Recalcula custoInsumos + custoTotal de UM produto baseado em inventory.
 * Mutates `produto.custos` in place.
 * Retorna { custoInsumosOld, custoInsumosNew, custoTotalOld, custoTotalNew, changed }
 */
function recomputeProductCost(produto, inventoryById) {
    const insumos = (produto.custos && Array.isArray(produto.custos.insumos)) ? produto.custos.insumos : [];
    let custoInsumos = 0;
    insumos.forEach((r) => {
        if (!r || !r.insumoId || !r.qty || !r.unit) return;
        const ins = inventoryById[r.insumoId];
        if (!ins || !ins.unit) return;
        const conv = _convertUnit(Number(r.qty), r.unit, ins.unit);
        if (conv === null) return; // unidades incompatíveis
        const cost = Number(ins.cost || 0);
        custoInsumos += cost * conv;
    });
    custoInsumos = _r2(custoInsumos);

    const custoAdicional = (produto.custos && produto.custos.custoAdicional) || {};
    const adicional = (Number(custoAdicional.embalagem) || 0)
        + (Number(custoAdicional.energia) || 0)
        + (Number(custoAdicional.mao_obra) || 0)
        + (Number(custoAdicional.outros) || 0);
    const custoTotal = _r2(custoInsumos + adicional);

    const old = produto.custos || {};
    const oldInsumos = Number(old.custoInsumos || 0);
    const oldTotal = Number(old.custoTotal || 0);

    if (!produto.custos) produto.custos = {};
    produto.custos.custoInsumos = custoInsumos;
    produto.custos.custoTotal = custoTotal;

    return {
        custoInsumosOld: oldInsumos,
        custoInsumosNew: custoInsumos,
        custoTotalOld: oldTotal,
        custoTotalNew: custoTotal,
        changed: oldInsumos !== custoInsumos || oldTotal !== custoTotal,
    };
}

/**
 * Reconstrói catalog_config a partir do v2.
 * Porta direta de catalog-v2.js syncToLegacy() pra Node.
 */
function buildCatalogConfigFromV2(v2) {
    const cats = (v2.categorias || []).filter((c) => c.active !== false);
    const produtos = v2.produtos || [];
    const toppings = v2.toppings || [];

    const legacy = {};
    const hasProdutos = produtos.length > 0;
    if (hasProdutos) {
        legacy.bases = null;
        legacy.tamanhos = null;
        legacy.formatos = null;
    }
    legacy.sabores = {};

    cats.forEach((cat) => {
        if (EXCLUIR_SABORES.includes(cat.id)) return;
        const prods = produtos.filter((p) => p.categoriaId === cat.id && p.active !== false);
        if (!prods.length) return;
        const legacyKey = cat.id.replace("cat_", "");
        legacy.sabores[legacyKey] = {
            name: cat.name,
            icon: cat.icon || "",
            color: cat.color || "",
            items: prods.map((p) => {
                const hasBuffet = p.buffet && p.buffet.ativo;
                const tipoVenda = (cat.id === "cat_sorvete_kg" || cat.id === "cat_buffet" || hasBuffet)
                    ? "por_peso" : "unitario";
                let price = 0;
                if (hasBuffet && Number(p.buffet.precoPorKg)) price = Number(p.buffet.precoPorKg);
                else price = Number((p.precos && p.precos.loja && (p.precos.loja.real || p.precos.loja.recomendado)) || 0);
                if (!price && p.variantes && p.variantes.length) {
                    const variantePrices = p.variantes.map((v) => Number(v.precoLoja || 0)).filter((v) => v > 0);
                    if (variantePrices.length) price = Math.min.apply(null, variantePrices);
                }
                const cost = Number((p.custos && p.custos.custoTotal) || 0);
                let porcoes = null;
                if (tipoVenda === "por_peso") {
                    if (p.variantes && p.variantes.length) {
                        porcoes = p.variantes
                            .filter((v) => v.gramas && Number(v.gramas) > 0)
                            .map((v) => ({ label: v.name, peso: Number(v.gramas) }));
                    }
                    if (!porcoes || !porcoes.length) {
                        porcoes = [
                            { label: "250g",  peso: 250 },
                            { label: "350g",  peso: 350 },
                            { label: "500g",  peso: 500 },
                            { label: "750g",  peso: 750 },
                            { label: "1kg",   peso: 1000 },
                        ];
                    }
                }
                const hasVariantes = p.variantes && p.variantes.length > 1;
                return {
                    id: p.id,
                    name: p.name,
                    emoji: (p.midia && p.midia.emoji) || cat.icon || "🍨",
                    desc: p.desc || "",
                    price: price,
                    cost: cost,
                    costAdjust: 0,
                    available: p.active !== false,
                    tipoVenda: tipoVenda,
                    porcoes: porcoes,
                    canalVenda: p.canal || "ambos",
                    disponibilidade: p.disponibilidade || { pdv: true, delivery: true, cardapio: true, tv: true },
                    modoMontagem: "montado",
                    commissionRate: 5,
                    badge: p.badge || "",
                    aPartirDe: hasVariantes,
                    order: typeof p.order === "number" ? p.order : 999,
                    receita: ((p.custos && p.custos.insumos) || [])
                        .filter((r) => r.insumoId && r.qty)
                        .map((r) => ({ insumoId: r.insumoId, qty: r.qty, unit: r.unit || "unid" })),
                    _v2: {
                        precos: p.precos,
                        kits: p.kits,
                        variantes: p.variantes,
                        toppingsIds: p.toppingsIds,
                        buffet: p.buffet,
                    },
                };
            }),
        };
    });

    // Bebidas
    const bebidas = produtos.filter((p) => p.categoriaId === "cat_bebida" && p.active !== false);
    if (bebidas.length) {
        legacy.bebidas = bebidas.map((p) => ({
            id: p.id,
            name: p.name,
            emoji: (p.midia && p.midia.emoji) || "🧃",
            price: Number((p.precos && p.precos.loja && (p.precos.loja.real || p.precos.loja.recomendado)) || 0),
            priceDelivery: Number((p.precos && p.precos.delivery && (p.precos.delivery.real || p.precos.delivery.recomendado)) || 0),
            cost: Number((p.custos && p.custos.custoTotal) || 0),
            available: p.active !== false,
            canalVenda: p.canal || "ambos",
            disponibilidade: p.disponibilidade || { pdv: true, delivery: true, cardapio: true, tv: true },
        }));
    }

    // Toppings
    if (toppings.length) {
        legacy.adicionais = {};
        legacy.adicionais.coberturas = {
            name: "Coberturas & Toppings",
            items: toppings.filter((t) => t.active !== false).map((t) => ({
                id: t.id, name: t.name, emoji: "✨",
                price: Number(t.precoExtra || 0),
                cost: Number(t.custo || 0),
                available: true,
                commissionRate: 5,
            })),
        };
        legacy.adicionais.geral = legacy.adicionais.coberturas;
    }

    if (hasProdutos) legacy._fromV2 = true;
    legacy._serverSyncedAt = new Date().toISOString();
    return legacy;
}

/**
 * Sync direto: lê catalog_v2_<fid> + inventory_<fid> + recompõe catalog_config.
 * Recalcula custos com base no inventory atual antes de gerar o legacy.
 */
async function syncCatalogConfigForFranchise(db, franchiseId) {
    const v2 = await _readDS(db, "catalog_v2_" + franchiseId);
    if (!v2 || !Array.isArray(v2.produtos)) {
        return { fid: franchiseId, skipped: "no-catalog-v2" };
    }
    const inventory = (await _readDS(db, "inventory_" + franchiseId)) || [];
    const inventoryById = {};
    inventory.forEach((i) => { if (i && i.id) inventoryById[i.id] = i; });

    // Recalcula custoInsumos+custoTotal de cada produto a partir do inventory atual
    let produtosUpdated = 0;
    v2.produtos.forEach((p) => {
        const r = recomputeProductCost(p, inventoryById);
        if (r.changed) produtosUpdated++;
    });

    // Persiste v2 atualizado se algo mudou (não corre risco de race porque é trigger
    // server-side em onWrite — vai disparar de novo mas idempotente)
    if (produtosUpdated > 0) {
        await _writeDS(db, "catalog_v2_" + franchiseId, v2, "catalog-sync-recompute");
    }

    // Gera legacy
    const legacy = buildCatalogConfigFromV2(v2);
    legacy._fid = franchiseId;
    legacy._serverSyncedAt = new Date().toISOString();

    // FIX (Fase 8.3): grava em catalog_config_<fid> (per-franchise — sem race
    // entre franquias). Mantém escrita no global pra retrocompat — DataStore
    // do client prefere o per-franchise quando ambos existem.
    await _writeDS(db, "catalog_config_" + franchiseId, legacy, "catalog-sync-from-v2:" + franchiseId);
    await _writeDS(db, "catalog_config", legacy, "catalog-sync-from-v2:" + franchiseId);

    return {
        fid: franchiseId,
        produtos: v2.produtos.length,
        produtosCustoRecalculado: produtosUpdated,
        sync_ok: true,
        wroteTo: ["catalog_config_" + franchiseId, "catalog_config"],
    };
}

/**
 * Roda sync pra todas franquias — usado por trigger global e callable manual.
 */
async function syncAllFranchises(db) {
    const fSnap = await db.collection("datastore").doc("franchises").get();
    if (!fSnap.exists) return { error: "no franchises" };
    const list = JSON.parse(fSnap.data().value || "[]");
    if (!Array.isArray(list)) return { error: "franchises not array" };
    const results = [];
    for (const f of list) {
        if (!f || !f.id) continue;
        try {
            const r = await syncCatalogConfigForFranchise(db, f.id);
            results.push(r);
        } catch (e) {
            results.push({ fid: f.id, error: e.message });
        }
    }
    return { count: list.length, results };
}

module.exports = {
    syncCatalogConfigForFranchise,
    syncAllFranchises,
    recomputeProductCost,
    buildCatalogConfigFromV2,
};
