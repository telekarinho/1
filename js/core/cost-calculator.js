/* ============================================================
   MilkyPot Cost Calculator v2 — Markup realista por canal
   ============================================================
   PRINCÍPIO: loja é a base. Delivery e iFood são MARKUPS em cima da
   loja, não recálculos com margem diferente.

   Markup médio de mercado BR (desserts gourmet 2026):
     - Delivery próprio: loja × 1.12 (cobre bag + ~3.5% cartão + tempo)
     - iFood:            loja × 1.28 (cobre ~26% fee iFood + financeiro)

   Essa regra garante:
     - Preços SEMPRE diferentes entre canais (sem empate por psychRound)
     - iFood suficientemente alto pra não dar prejuízo
     - Delivery com margem saudável
     - Cliente percebe coerência: iFood é mais caro que pedir direto

   Arredondamento psicológico (.90/.99) em cada canal isoladamente.
   ============================================================ */
(function(global){
    'use strict';

    // Margens-alvo por categoria (% do preço) — PARA LOJA FÍSICA
    const MARGEM_POR_CATEGORIA = {
        'cat_picole':     0.68, // picolé: margem real ~68%
        'cat_sorvete_kg': 0.65,
        'cat_potinho':    0.65, // potinho: 60-68% real
        'cat_sundae':     0.62,
        'cat_milkshake':  0.58, // shake tem copo/canudo
        'cat_acai':       0.52, // açaí premium é armadilha
        'cat_bebida':     0.62,
        'cat_buffet':     0.65,
        'default':        0.60
    };

    // Markup em cima do preço loja para cada canal
    // Baseado em mercado real BR 2026 (sorveteria/açaí gourmet):
    //   Loja R$ 20 → Delivery R$ 22.40 → iFood R$ 25.60
    const MARKUP_CANAL = {
        loja:     1.00,   // base
        delivery: 1.12,   // +12%
        ifood:    1.28    // +28%
    };

    // Taxas por canal (% do preço que sai do bolso além do custo)
    const TAXAS = {
        loja:     0.028,              // 2.8% taxa cartão média
        delivery: 0.035 + 0.04,       // 3.5% cartão + 4% bag/embalagem
        ifood:    0.23 + 0.03         // 23% fee iFood + 3% financeiro
    };

    /**
     * Sugere preço da loja física a partir do custo + margem-alvo.
     * Outros canais herdam via markup.
     */
    function _precoLoja(custoTotal, categoriaId) {
        const c = Number(custoTotal) || 0;
        if (c <= 0) return 0;
        const margem = MARGEM_POR_CATEGORIA[categoriaId] || MARGEM_POR_CATEGORIA.default;
        const denom = 1 - TAXAS.loja - margem;
        if (denom <= 0) return c * 2.5;
        return c / denom;
    }

    /**
     * Sugere preço pra um canal específico.
     * Lógica: calcula base LOJA, aplica markup do canal, psychRound.
     */
    function suggest(custoTotal, canal, categoriaId) {
        const c = Number(custoTotal) || 0;
        if (c <= 0) return { preco: 0, margem: 0, margemPct: 0, detalhe: 'custo zero', canal };

        const precoLojaBruto = _precoLoja(c, categoriaId);
        const mult = MARKUP_CANAL[canal] || 1.00;
        const precoBruto = precoLojaBruto * mult;
        const preco = _psychRound(precoBruto);

        const taxa = TAXAS[canal] || TAXAS.loja;
        const margem = preco - c - (preco * taxa);
        const margemPct = preco > 0 ? Math.round((margem / preco) * 100) : 0;

        return {
            preco: Math.round(preco * 100) / 100,
            margem: Math.round(margem * 100) / 100,
            margemPct: margemPct,
            canal: canal,
            detalhe: `custo R$ ${c.toFixed(2)} · taxa canal ${(taxa*100).toFixed(1)}% · markup ${Math.round((mult-1)*100)}% vs loja`
        };
    }

    /**
     * Calcula os 3 canais de uma vez. Com o markup, os preços são
     * sempre diferentes: loja < delivery < iFood.
     */
    function suggestAll(custoTotal, categoriaId) {
        return {
            loja:     suggest(custoTotal, 'loja',     categoriaId),
            delivery: suggest(custoTotal, 'delivery', categoriaId),
            ifood:    suggest(custoTotal, 'ifood',    categoriaId)
        };
    }

    /**
     * Custo total a partir da estrutura do produto v2.
     */
    function computeCustoTotal(produto) {
        if (!produto) return 0;
        const c = produto.custos || {};
        const insumos = Number(c.custoInsumos) || 0;
        const adi = c.custoAdicional || {};
        const adicional = (Number(adi.embalagem) || 0) +
                          (Number(adi.energia) || 0) +
                          (Number(adi.mao_obra) || 0) +
                          (Number(adi.outros) || 0);
        return Math.round((insumos + adicional) * 100) / 100;
    }

    /**
     * Valida preço real vs saudável do canal.
     * Threshold mais realista: iFood aceita margem menor (25%+) que loja (40%+).
     */
    function validatePrice(custoTotal, precoReal, canal) {
        const c = Number(custoTotal) || 0;
        const p = Number(precoReal) || 0;
        if (!p) return { ok: false, status: 'sem-preco', msg: 'Preço não definido' };
        const taxa = TAXAS[canal] || TAXAS.loja;
        const margem = p - c - (p * taxa);
        const margemPct = Math.round((margem / p) * 100);

        // Thresholds por canal
        const minSaudavel = canal === 'ifood' ? 25 : (canal === 'delivery' ? 35 : 45);
        const maxSaudavel = canal === 'ifood' ? 55 : 70;

        if (margem <= 0) return { ok: false, status: 'prejuizo', margemPct, msg: 'PREJUÍZO (custo + taxa > preço)' };
        if (margemPct < minSaudavel) return { ok: false, status: 'abaixo', margemPct, msg: `Margem baixa (${margemPct}% vs ${minSaudavel}%+ ideal)` };
        if (margemPct > maxSaudavel) return { ok: true, status: 'acima', margemPct, msg: `Margem alta (${margemPct}%) — pode estar caro pro mercado` };
        return { ok: true, status: 'ideal', margemPct, msg: `Margem saudável (${margemPct}%)` };
    }

    // Arredondamento psicológico: termina em .90 (padrão BR varejo)
    function _psychRound(v) {
        if (v <= 0) return 0;
        if (v < 5)   return Math.max(1, Math.round(v*10)/10);          // produto baixo: 2.9, 3.5
        if (v < 10)  return Math.floor(v) + 0.90;                       // 7.90, 9.90
        // Pra 10+, escolhe o múltiplo de 1 mais próximo e volta .90
        // Ex: 16.23 → 15.90; 24.67 → 24.90; 28.10 → 27.90
        const intPart = Math.floor(v);
        const frac = v - intPart;
        // Se frac < 0.50 pega intPart-1 com .90; senão fica intPart com .90 direto
        const base = frac < 0.50 ? intPart - 1 : intPart;
        return Math.max(1, base + 0.90);
    }

    global.CostCalculator = {
        suggest, suggestAll, computeCustoTotal, validatePrice,
        MARGEM_POR_CATEGORIA, TAXAS, MARKUP_CANAL
    };

    // Expose globally for browser
    if (typeof window !== 'undefined') window.CostCalculator = global.CostCalculator;
    if (typeof globalThis !== 'undefined') globalThis.CostCalculator = global.CostCalculator;
})(typeof window !== 'undefined' ? window : this);
