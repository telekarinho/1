/* ============================================================
   MilkyPot — Finance Realtime
   ============================================================
   Calcula CMV REAL e margem por produto usando vendas do período +
   custos cadastrados em catalog_v2. Serve como source of truth pra
   DRE em vez de depender de lançamentos manuais.

   API:
     FinanceRealtime.computeCMV(fid, periodKey)
       → { receita, custo, cmvPct, porProduto[], porCategoria[] }
     FinanceRealtime.compareCatalogsMatch(fid)  // quais vendas não
       acharam produto no catalog_v2
     FinanceRealtime.autoImportToFinanceCost(fid, periodKey)
       → registra custo variável automatico no Financas

   Dependências: DataStore, CatalogV2, CostCalculator, Financas
   ============================================================ */
(function(global){
    'use strict';

    function parsePeriodKey(pk) {
        if (!pk) {
            const d = new Date();
            return { year: d.getFullYear(), month: d.getMonth() + 1 };
        }
        const [y, m] = pk.split('-').map(Number);
        return { year: y, month: m };
    }

    function isInPeriod(iso, pk) {
        try {
            const d = new Date(iso);
            const p = parsePeriodKey(pk);
            return d.getFullYear() === p.year && (d.getMonth() + 1) === p.month;
        } catch(e) { return false; }
    }

    // Procura produto v2 por ID/nome — fallback fuzzy
    function findProductV2(catalog, rawItem) {
        if (!catalog) return null;
        const id = rawItem.productId || rawItem.id;
        if (id) {
            const byId = catalog.produtos.find(p => p.id === id);
            if (byId) return byId;
        }
        const name = String(rawItem.name || rawItem.sabor || '').trim().toLowerCase();
        if (!name) return null;
        return catalog.produtos.find(p => p.name && p.name.toLowerCase() === name) ||
               catalog.produtos.find(p => p.name && p.name.toLowerCase().includes(name.slice(0, 12)));
    }

    /**
     * CMV real do período baseado em vendas + catalog_v2.
     */
    function computeCMV(fid, periodKey) {
        if (!global.DataStore) return { receita: 0, custo: 0, cmvPct: 0, porProduto: [], porCategoria: [] };

        const orders = DataStore.getCollection('orders', fid) || [];
        const catalog = (global.CatalogV2 && global.CatalogV2.load)
            ? global.CatalogV2.load(fid)
            : { produtos: [] };

        const periodOrders = orders.filter(o =>
            o && o.createdAt && isInPeriod(o.createdAt, periodKey) &&
            ['confirmado', 'entregue', 'pago'].includes(o.status)
        );

        const byProduct = new Map();
        const byCategoria = new Map();
        let receita = 0, custo = 0;
        let vendasOrfas = 0;  // vendas sem match no catalog

        periodOrders.forEach(o => {
            (o.items || []).forEach(it => {
                const qty = Number(it.qty || 1);
                const receitaLinha = Number(it.total || (it.unitPrice || 0) * qty);
                receita += receitaLinha;

                const p = findProductV2(catalog, it);
                if (!p) { vendasOrfas += qty; return; }

                const custoUnit = global.CostCalculator ? global.CostCalculator.computeCustoTotal(p) : 0;
                const custoLinha = custoUnit * qty;
                custo += custoLinha;

                // Por produto
                if (!byProduct.has(p.id)) {
                    byProduct.set(p.id, { id: p.id, name: p.name, categoria: p.categoriaId, qty: 0, receita: 0, custo: 0 });
                }
                const pr = byProduct.get(p.id);
                pr.qty += qty; pr.receita += receitaLinha; pr.custo += custoLinha;

                // Por categoria
                const catKey = p.categoriaId || 'sem-categoria';
                if (!byCategoria.has(catKey)) {
                    byCategoria.set(catKey, { id: catKey, qty: 0, receita: 0, custo: 0 });
                }
                const cc = byCategoria.get(catKey);
                cc.qty += qty; cc.receita += receitaLinha; cc.custo += custoLinha;
            });
        });

        const porProduto = Array.from(byProduct.values()).map(x => ({
            ...x,
            margem: x.receita - x.custo,
            margemPct: x.receita > 0 ? Math.round((1 - x.custo / x.receita) * 100) : 0,
            cmvPct: x.receita > 0 ? Math.round(x.custo / x.receita * 100) : 0
        })).sort((a, b) => b.receita - a.receita);

        const porCategoria = Array.from(byCategoria.values()).map(x => ({
            ...x,
            margem: x.receita - x.custo,
            margemPct: x.receita > 0 ? Math.round((1 - x.custo / x.receita) * 100) : 0,
            cmvPct: x.receita > 0 ? Math.round(x.custo / x.receita * 100) : 0
        }));

        return {
            receita: Math.round(receita * 100) / 100,
            custo: Math.round(custo * 100) / 100,
            margem: Math.round((receita - custo) * 100) / 100,
            cmvPct: receita > 0 ? Math.round((custo / receita) * 100) : 0,
            margemPct: receita > 0 ? Math.round((1 - custo / receita) * 100) : 0,
            porProduto, porCategoria,
            ordersAnalisados: periodOrders.length,
            vendasOrfas,
            periodKey
        };
    }

    /**
     * Registra automaticamente o CMV como custo variável no Financas.
     * Usa a categoria 'compras_insumos' com descrição auto-CMV.
     * Evita duplicar: se já tem lançamento com source="auto-cmv", atualiza.
     */
    function autoImportToFinanceCost(fid, periodKey) {
        if (!global.Financas || !global.Financas.addCost) return { ok: false, error: 'Financas indisponível' };

        const cmv = computeCMV(fid, periodKey);
        if (cmv.receita === 0) return { ok: false, error: 'Sem vendas no período' };

        // Remove lançamento auto anterior (evita duplicar)
        const costs = DataStore.getCollection ? DataStore.getCollection('finance_costs', fid) || [] : [];
        const filtered = costs.filter(c => !(c.source === 'auto-cmv' && c.periodKey === periodKey));
        if (filtered.length !== costs.length) {
            DataStore.setCollection('finance_costs', fid, filtered);
        }

        // Adiciona novo
        const r = global.Financas.addCost(fid, {
            kind: 'variable',
            periodKey: periodKey,
            categoria: 'compras_insumos',
            descricao: `CMV auto-calculado de ${cmv.ordersAnalisados} venda(s) — ${cmv.cmvPct}%`,
            valor: cmv.custo,
            source: 'auto-cmv',
            auto: true
        });

        return { ok: r && r.success, cmv, costId: r && r.cost && r.cost.id };
    }

    /**
     * Análise de discrepância entre CMV real e lançado manualmente.
     */
    function analyzeDiscrepancy(fid, periodKey) {
        const real = computeCMV(fid, periodKey);
        let manual = 0;
        try {
            if (global.Financas && global.Financas.computeDRE) {
                const dre = global.Financas.computeDRE(fid, periodKey);
                manual = Number(dre.totalVariable || 0);
            }
        } catch(e){}
        const diff = manual - real.custo;
        return {
            real: real,
            manual: manual,
            diff: Math.round(diff * 100) / 100,
            diffPct: real.custo > 0 ? Math.round(Math.abs(diff) / real.custo * 100) : 0,
            status: Math.abs(diff) < 50 ? 'match' : (diff > 0 ? 'manual-alto' : 'manual-baixo')
        };
    }

    global.FinanceRealtime = {
        computeCMV, autoImportToFinanceCost, analyzeDiscrepancy
    };
})(typeof window !== 'undefined' ? window : this);
