/* ============================================================
   MilkyPot - Units helper
   ============================================================
   Padronização de unidades e conversões seguras.

   Unidades válidas:
     massa:     g, kg
     volume:    ml, L
     unidade:   unid

   Regras:
     - conversão automática entre g <-> kg e ml <-> L
     - nunca converte entre grupos (massa ≠ volume ≠ unidade)
     - se incompatível, retorna { ok: false, error }
   ============================================================ */
(function(global){
    'use strict';

    var GROUPS = {
        massa: { g: 1, kg: 1000 },      // fator pra converter pra base 'g'
        volume: { ml: 1, L: 1000 },     // base 'ml'
        unidade: { unid: 1 }
    };

    // Mapa inverso: unidade -> grupo
    var UNIT_TO_GROUP = {};
    Object.keys(GROUPS).forEach(function(g){
        Object.keys(GROUPS[g]).forEach(function(u){ UNIT_TO_GROUP[u] = g; });
    });

    function groupOf(unit){ return UNIT_TO_GROUP[unit] || null; }

    function isValidUnit(u){ return !!UNIT_TO_GROUP[u]; }

    function sameGroup(a, b){
        var ga = groupOf(a), gb = groupOf(b);
        return ga && gb && ga === gb;
    }

    // Converte qty de 'from' para 'to'. Retorna { ok, qty } ou { ok:false, error }.
    function convert(qty, from, to){
        if (!isValidUnit(from)) return { ok: false, error: 'Unidade inválida: ' + from };
        if (!isValidUnit(to))   return { ok: false, error: 'Unidade inválida: ' + to };
        if (from === to)        return { ok: true, qty: qty };
        if (!sameGroup(from, to)) return { ok: false, error: 'Não converte ' + from + ' para ' + to + ' (grupos diferentes)' };
        var group = groupOf(from);
        var factorFrom = GROUPS[group][from];
        var factorTo = GROUPS[group][to];
        return { ok: true, qty: qty * factorFrom / factorTo };
    }

    // Converte qty(from) pra base do grupo e retorna o numero (pra comparações).
    function toBase(qty, unit){
        if (!isValidUnit(unit)) return null;
        var group = groupOf(unit);
        return qty * GROUPS[group][unit];
    }

    // Formata pra display amigável (ex: 1500g -> "1,5 kg"; 300g -> "300 g")
    function format(qty, unit){
        if (!isValidUnit(unit)) return qty + ' ' + (unit || '');
        var group = groupOf(unit);
        // Tenta subir de unidade pra numero mais lido
        if (group === 'massa' && unit === 'g' && qty >= 1000) {
            return (qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2).replace('.', ',') + ' kg';
        }
        if (group === 'volume' && unit === 'ml' && qty >= 1000) {
            return (qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2).replace('.', ',') + ' L';
        }
        var displayQty = (qty % 1 === 0) ? qty : qty.toFixed(2).replace('.', ',');
        return displayQty + ' ' + unit;
    }

    // Lista pra selects — agrupado
    var VALID_UNITS = ['g', 'kg', 'ml', 'L', 'unid'];

    global.Units = {
        GROUPS: GROUPS,
        VALID_UNITS: VALID_UNITS,
        groupOf: groupOf,
        isValidUnit: isValidUnit,
        sameGroup: sameGroup,
        convert: convert,
        toBase: toBase,
        format: format
    };
})(typeof window !== 'undefined' ? window : this);
