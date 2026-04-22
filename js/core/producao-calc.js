/* ============================================================
   MilkyPot Produção Calc — custo real de cada produto
   ============================================================
   Calcula o custo TOTAL de fabricar um produto baseado em:

   1. INSUMOS (receita): SUM(ingrediente.costUnit × qtd_usada)
      Ex: Milkshake = 80g leite ninho (R$ 85/kg) + 40g pasta Oreo + 1 copo
   2. EMBALAGEM: custo dos itens de embalagem do produto
      Ex: Copo 300ml (R$ 0,28) + Tampa (R$ 0,12) + Colher (R$ 0,08)
   3. ENERGIA: tempo_preparo × kWh × potência_estimada
      Modelo simplificado: 0.8 kWh × 1.5 (1500W blender) × (min/60)
   4. MÃO DE OBRA: tempo_preparo × custo_hora_operador
      Modelo: R$ 8.50/h (salário mínimo/h proporcional + encargos)

   Config global da loja:
     DataStore.get('producao_config_' + fid) = {
       custoKwh: 0.80,           // R$/kWh (Copel Londrina ~0.85)
       potenciaMediaKw: 1.5,     // kW blender + vitrine freezer
       custoHora: 8.50,          // R$/h (inclui encargos simples)
       mesesReuso: 1             // pra amortizar equipamentos (placeholder)
     }

   API:
     ProducaoCalc.recipeCost(produto, inventory)
       → { total, insumos, embalagem, detalhes }
     ProducaoCalc.operationalCost(produto, config)
       → { total, energia, maoObra }
     ProducaoCalc.totalCost(produto, inventory, config)
       → { insumos, embalagem, energia, mao_obra, total, breakdown }

   Usado em: produtos.html (modal + recalc) e finance-realtime (CMV real).
   ============================================================ */
(function(global){
    'use strict';

    const DEFAULT_CONFIG = {
        custoKwh: 0.85,          // Londrina-PR: R$ 0,80-0,95
        potenciaMediaKw: 1.5,    // blender + freezer + iluminação rateada
        custoHora: 8.50,         // salário + 40% encargos / 200h mês
        mesesReuso: 1
    };

    function getConfig(fid) {
        if (!global.DataStore || !fid) return Object.assign({}, DEFAULT_CONFIG);
        const saved = global.DataStore.get('producao_config_' + fid);
        return Object.assign({}, DEFAULT_CONFIG, saved || {});
    }

    function setConfig(fid, cfg) {
        if (!global.DataStore || !fid) return;
        const merged = Object.assign({}, getConfig(fid), cfg);
        global.DataStore.set('producao_config_' + fid, merged);
        return merged;
    }

    function getInventory(fid) {
        if (!global.DataStore) return [];
        if (global.DataStore.getCollection) {
            return global.DataStore.getCollection('inventory', fid) || [];
        }
        return global.DataStore.get('inventory_' + fid) || [];
    }

    /**
     * Calcula custo dos insumos + embalagem baseado na receita do produto.
     * @param produto { custos: { insumos: [{ insumoId, qty, unit }], embalagemIds: [...] } }
     * @param inventory Array de ingredientes
     */
    function recipeCost(produto, inventory) {
        const recipe = (produto && produto.custos && produto.custos.insumos) || [];
        const pkgIds = (produto && produto.custos && produto.custos.embalagemIds) || [];
        inventory = inventory || [];
        const invMap = {};
        inventory.forEach(i => { invMap[i.id] = i; });

        let insumos = 0;
        let embalagem = 0;
        const detalhes = [];

        recipe.forEach(r => {
            const ing = invMap[r.insumoId];
            if (!ing) {
                detalhes.push({ tipo: 'falta', insumoId: r.insumoId, msg: 'Ingrediente não encontrado' });
                return;
            }
            const qty = Number(r.qty) || 0;
            const cost = _normalizeUsage(ing, qty, r.unit);
            insumos += cost;
            detalhes.push({
                tipo: 'insumo', nome: ing.name, qty, unit: r.unit || ing.unit,
                custoUnit: ing.costUnit || 0, subtotal: Math.round(cost*100)/100
            });
        });

        pkgIds.forEach(pid => {
            const ing = invMap[pid];
            if (!ing) return;
            const cost = Number(ing.costUnit) || 0;
            embalagem += cost;
            detalhes.push({
                tipo: 'embalagem', nome: ing.name, qty: 1, unit: ing.unit,
                custoUnit: cost, subtotal: Math.round(cost*100)/100
            });
        });

        return {
            insumos: Math.round(insumos*100)/100,
            embalagem: Math.round(embalagem*100)/100,
            detalhes
        };
    }

    /**
     * Converte quantidade usada na receita pro mesmo "custUnit" do inventário.
     * Ex: inv tem R$85/kg e receita usa 80g → 0.08 kg × 85 = R$6,80
     * Suporta conversões: kg↔g, L↔ml, un, pct, cx (passa direto).
     */
    function _normalizeUsage(ing, qty, unitUsed) {
        const unitInv = (ing.unit || '').toLowerCase();
        const u = (unitUsed || unitInv).toLowerCase();
        const cost = Number(ing.costUnit) || 0;
        if (u === unitInv) return qty * cost;
        // Conversões comuns
        if (unitInv === 'kg' && u === 'g')   return (qty / 1000) * cost;
        if (unitInv === 'g'  && u === 'kg')  return (qty * 1000) * cost;
        if (unitInv === 'l'  && u === 'ml')  return (qty / 1000) * cost;
        if (unitInv === 'ml' && u === 'l')   return (qty * 1000) * cost;
        // Fallback: assume qty já está na unidade do inv
        return qty * cost;
    }

    /**
     * Calcula custos operacionais (energia + mão-de-obra) do produto.
     * Usa tempo_preparo_min do produto + config da loja.
     */
    function operationalCost(produto, config) {
        const tempoMin = Number(produto && produto.tempoPreparoMin) || 0;
        if (tempoMin <= 0) return { total: 0, energia: 0, mao_obra: 0 };
        const h = tempoMin / 60;

        const energia = h * (config.custoKwh || DEFAULT_CONFIG.custoKwh) * (config.potenciaMediaKw || DEFAULT_CONFIG.potenciaMediaKw);
        const mao_obra = h * (config.custoHora || DEFAULT_CONFIG.custoHora);

        return {
            energia: Math.round(energia*100)/100,
            mao_obra: Math.round(mao_obra*100)/100,
            total: Math.round((energia + mao_obra)*100)/100
        };
    }

    /**
     * Custo TOTAL de produção (insumos + embalagem + energia + mão-obra).
     * É esse valor que deve popular custos.custoInsumos e custoAdicional.
     */
    function totalCost(produto, fid) {
        const inventory = getInventory(fid);
        const config = getConfig(fid);
        const recipe = recipeCost(produto, inventory);
        const op = operationalCost(produto, config);

        return {
            insumos: recipe.insumos,
            embalagem: recipe.embalagem,
            energia: op.energia,
            mao_obra: op.mao_obra,
            outros: Number(produto && produto.custos && produto.custos.custoAdicional && produto.custos.custoAdicional.outros) || 0,
            total: Math.round((recipe.insumos + recipe.embalagem + op.energia + op.mao_obra) * 100) / 100,
            breakdown: recipe.detalhes,
            config
        };
    }

    /**
     * Aplica o custo calculado dentro da estrutura do produto.
     * Chamar depois de editar receita → salva no formato v2 padrão.
     */
    function applyToProduto(produto, fid) {
        const c = totalCost(produto, fid);
        produto.custos = produto.custos || {};
        produto.custos.custoInsumos = c.insumos;
        produto.custos.custoAdicional = Object.assign({}, produto.custos.custoAdicional || {}, {
            embalagem: c.embalagem,
            energia: c.energia,
            mao_obra: c.mao_obra,
            outros: c.outros
        });
        produto.custos.custoTotal = c.total;
        produto._custosAutoCalculados = true;
        produto._custosCalculatedAt = new Date().toISOString();
        return produto;
    }

    global.ProducaoCalc = {
        getConfig, setConfig, recipeCost, operationalCost, totalCost, applyToProduto,
        DEFAULT_CONFIG
    };

    if (typeof window !== 'undefined') window.ProducaoCalc = global.ProducaoCalc;
    if (typeof globalThis !== 'undefined') globalThis.ProducaoCalc = global.ProducaoCalc;
})(typeof window !== 'undefined' ? window : this);
