/* ============================================================
   MilkyPot — Recipes / BoM helper
   ============================================================
   Uma receita vive no próprio item do catálogo:
     item.receita = [{ insumoId, qty, unit }, ...]

   Regras:
     • unidades válidas: g, kg, ml, L, unid
     • conversão automática só entre mesmo grupo (massa / volume / unidade)
     • custo do produto = soma dos insumos (receita) + ajuste manual opcional
     • produto sem receita continua disponível mas marcado receitaPendente
     • indisponível = qualquer insumo da receita sem estoque suficiente

   Este arquivo NÃO contém receitas hardcoded — cada franquia tem
   a sua no catalog_config. Este é só o mecanismo.
   ============================================================ */
(function(global){
    'use strict';

    if (!global.Units) {
        console.warn('Recipes: Units helper nao carregado. Carregue /js/core/units.js antes.');
    }
    var U = global.Units || {
        convert: function(q, f, t){ return f === t ? {ok:true, qty:q} : {ok:false, error:'Units helper ausente'}; },
        sameGroup: function(a,b){ return a === b; },
        isValidUnit: function(u){ return ['g','kg','ml','L','unid'].indexOf(u) >= 0; }
    };

    function hasRecipe(item) {
        return !!(item && Array.isArray(item.receita) && item.receita.some(function(r){ return r && r.insumoId && r.qty > 0 && r.unit; }));
    }

    // Custo base da receita (soma insumoCost*qty, com conversao de unidade).
    // Retorna { cost, valid, missing, mismatches, reason }
    function calcRecipeCost(item, inventory) {
        if (!hasRecipe(item)) {
            return { cost: 0, valid: false, missing: [], mismatches: [], reason: 'sem-receita' };
        }
        var byId = {};
        (inventory || []).forEach(function(i){ if (i && i.id) byId[i.id] = i; });

        var cost = 0;
        var missing = [];
        var mismatches = [];

        item.receita.forEach(function(r){
            var ins = byId[r.insumoId];
            if (!ins) { missing.push(r.insumoId); return; }
            if (!U.isValidUnit(r.unit) || !U.isValidUnit(ins.unit)) {
                mismatches.push({ insumoId: r.insumoId, reason: 'unidade-invalida' });
                return;
            }
            if (!U.sameGroup(r.unit, ins.unit)) {
                mismatches.push({ insumoId: r.insumoId, reason: 'grupos-diferentes', recipeUnit: r.unit, insumoUnit: ins.unit });
                return;
            }
            var conv = U.convert(r.qty, r.unit, ins.unit);
            if (!conv.ok) { mismatches.push({ insumoId: r.insumoId, reason: conv.error }); return; }
            var unitCost = Number(ins.cost || 0);
            cost += unitCost * conv.qty;
        });

        return {
            cost: Math.round(cost * 100) / 100,
            valid: missing.length === 0 && mismatches.length === 0,
            missing: missing,
            mismatches: mismatches,
            reason: (missing.length || mismatches.length) ? 'dados-incompletos' : 'ok'
        };
    }

    // Custo total = receita + ajuste manual
    function totalCost(item, inventory) {
        var base = calcRecipeCost(item, inventory).cost;
        var adjust = Number((item && item.costAdjust) || 0);
        return Math.round((base + adjust) * 100) / 100;
    }

    // { status: 'ok' | 'pendente' | 'indisponivel', faltando?: [...] }
    function availability(item, inventory) {
        if (!hasRecipe(item)) return { status: 'pendente', reason: 'receita-pendente' };
        var byId = {};
        (inventory || []).forEach(function(i){ if (i && i.id) byId[i.id] = i; });

        var faltando = [];
        item.receita.forEach(function(r){
            var ins = byId[r.insumoId];
            if (!ins) { faltando.push({ insumoId: r.insumoId, motivo: 'nao-cadastrado' }); return; }
            if (!U.sameGroup(r.unit, ins.unit)) { faltando.push({ insumoId: r.insumoId, motivo: 'unidade-incompativel' }); return; }
            var conv = U.convert(Number(r.qty) || 0, r.unit, ins.unit);
            if (!conv.ok) { faltando.push({ insumoId: r.insumoId, motivo: conv.error }); return; }
            var estoque = Number(ins.quantity || 0);
            if (estoque < conv.qty) {
                faltando.push({ insumoId: r.insumoId, motivo: 'sem-estoque', precisa: conv.qty, tem: estoque, unit: ins.unit });
            }
        });

        if (faltando.length) return { status: 'indisponivel', faltando: faltando };
        return { status: 'ok' };
    }

    // Deduz inventory por N unidades vendidas. Não persiste — caller grava.
    function deduct(item, qtdVendida, inventory) {
        if (!hasRecipe(item)) return { ok: true, inventoryAtualizado: inventory, deducted: [], skipped: 'sem-receita' };
        var clone = JSON.parse(JSON.stringify(inventory || []));
        var byId = {};
        clone.forEach(function(i){ if (i && i.id) byId[i.id] = i; });

        var deducted = [];
        for (var i = 0; i < item.receita.length; i++) {
            var r = item.receita[i];
            var ins = byId[r.insumoId];
            if (!ins) return { ok: false, error: 'Insumo não encontrado: ' + r.insumoId };
            if (!U.sameGroup(r.unit, ins.unit)) return { ok: false, error: 'Unidade incompatível: ' + r.unit + ' vs ' + ins.unit };
            var conv = U.convert(Number(r.qty) || 0, r.unit, ins.unit);
            if (!conv.ok) return { ok: false, error: conv.error };
            var consumir = conv.qty * qtdVendida;
            var novo = Math.max(0, Number(ins.quantity || 0) - consumir);
            ins.quantity = Math.round(novo * 1000) / 1000;
            deducted.push({ insumoId: r.insumoId, consumiu: consumir, unit: ins.unit, ficou: ins.quantity });
        }
        return { ok: true, inventoryAtualizado: clone, deducted: deducted };
    }

    function badge(item, inventory) {
        if (!hasRecipe(item)) return { label: 'Receita pendente', color: '#d97706', icon: '⚠️', tone: 'warn' };
        var av = availability(item, inventory);
        if (av.status === 'indisponivel') return { label: 'Indisponível', color: '#dc2626', icon: '⛔', tone: 'danger', faltando: av.faltando };
        return { label: 'Receita OK', color: '#16a34a', icon: '✅', tone: 'ok' };
    }

    // Wrapper de alto nível usado pelo PDV:
    // deduz insumos do inventory da franquia baseado nos items do order.
    // Retorna true se houve alguma deducao, false em erro.
    function deductFromInventory(franchiseId, order) {
        if (!franchiseId || !order || !order.items) return false;
        if (!global.DataStore) return false;
        var catalog = DataStore.get('catalog_config');
        if (!catalog) return false;

        var inventory = DataStore.getCollection('inventory', franchiseId) || [];
        if (!inventory.length) return false;

        // Indexa todos os items do catalogo por id, pra achar receitas
        var itemsById = {};
        function addGroup(g){ if(g && g.items) g.items.forEach(function(i){ itemsById[i.id] = i; }); }
        Object.keys(catalog.sabores || {}).forEach(function(k){ addGroup(catalog.sabores[k]); });
        Object.keys(catalog.adicionais || {}).forEach(function(k){ addGroup(catalog.adicionais[k]); });
        (catalog.bebidas || []).forEach(function(i){ itemsById[i.id] = i; });

        var workingInventory = inventory;
        var anyDeducted = false;
        var warnings = [];  // itens que NÃO deduziram — UI pode alertar operador
        (order.items || []).forEach(function(line){
            var produto = itemsById[line.productId || line.id];
            if (!produto) {
                // Item buffet/por_peso/legado sem productId reconhecido
                if (line.name) warnings.push('Item "' + line.name + '" sem produto vinculado — estoque NÃO deduzido');
                return;
            }
            if (!hasRecipe(produto)) {
                warnings.push('"' + (produto.name || produto.id) + '" sem receita configurada — estoque NÃO deduzido');
                return;
            }
            var qtd = Number(line.quantity || line.qty || 1);
            var result = deduct(produto, qtd, workingInventory);
            if (result && result.ok && result.inventoryAtualizado) {
                workingInventory = result.inventoryAtualizado;
                anyDeducted = true;
            } else if (result && !result.ok) {
                warnings.push('Falha ao deduzir "' + (produto.name || produto.id) + '": ' + (result.error || 'erro desconhecido'));
                console.warn('[Recipes] deduct falhou para', produto.id, result.error);
            }
        });

        if (anyDeducted) {
            DataStore.setCollection('inventory', franchiseId, workingInventory);
        }

        // Retorna warnings pra caller (PDV / pedidos.html) poder mostrar toast
        return { ok: true, deducted: anyDeducted, warnings: warnings };
        return anyDeducted;
    }

    global.Recipes = {
        hasRecipe: hasRecipe,
        calcRecipeCost: calcRecipeCost,
        totalCost: totalCost,
        availability: availability,
        deduct: deduct,
        deductFromInventory: deductFromInventory,
        badge: badge
    };
})(typeof window !== 'undefined' ? window : this);
