/* ============================================================
   MilkyPot Cost Calculator
   ============================================================
   Dado o custo total de um produto, calcula preço recomendado por
   canal (loja física, delivery próprio, iFood) com base em margens-alvo
   específicas MilkyPot + taxas reais de mercado.

   Benchmarks do brain:
     - Loja física: margem bruta alvo 62-68% (depende de categoria)
     - Delivery próprio: 5-7% a menos de margem (taxa entrega + bag/embalagem)
     - iFood: taxa ~23% receita + 3% financeiro = -26% margem.
              Pra manter margem líquida ok, preço iFood precisa subir ~25-30%

   Fórmula base:
     preço = custoTotal / (1 - margemAlvo - taxasCanal)
   ============================================================ */
(function(global){
    'use strict';

    // Margens-alvo por categoria (% do preço) — PARA CANAL LOJA
    const MARGEM_POR_CATEGORIA = {
        'cat_picole':     0.75, // picolé: 72-78% margem
        'cat_sorvete_kg': 0.70,
        'cat_potinho':    0.68,
        'cat_sundae':     0.65,
        'cat_milkshake':  0.58,  // shake tem armadilha de copo/canudo
        'cat_acai':       0.52,  // açaí é a maior armadilha
        'cat_bebida':     0.65,
        'cat_buffet':     0.70,
        'default':        0.60
    };

    // Ajuste de margem por canal — canais com taxa alta ACEITAM margem menor.
    // Sem isso, iFood explode preço (ex: potinho R$ 80 em vez de R$ 24).
    // Delivery perde 5pp, iFood perde 20pp em margem alvo (cliente NÃO paga pelo iFood).
    const AJUSTE_MARGEM_POR_CANAL = {
        loja:     0,      // mantém margem alvo
        delivery: -0.05,  // aceita 5pp a menos (taxa de entrega)
        ifood:    -0.20   // aceita 20pp a menos (iFood come margem)
    };

    // Multiplicador máximo sobre preço loja — evita preço absurdo no iFood.
    const MAX_MULT_VS_LOJA = {
        loja:     1.00,
        delivery: 1.18,   // delivery até 18% acima da loja
        ifood:    1.30    // iFood até 30% acima (compensa parte da taxa)
    };

    // Taxas por canal (% adicionais sobre o preço que saem do bolso)
    const TAXAS = {
        loja:     0.028,                      // 2.8% taxa cartão média
        delivery: 0.035 + 0.04,               // 3.5% cartão + 4% bag/embalagem/tempo entrega
        ifood:    0.23 + 0.03                 // 23% fee + 3% financeiro
    };

    /**
     * Sugere preço pra um canal.
     * @param {number} custoTotal — R$ do custo total do produto
     * @param {string} canal — 'loja' | 'delivery' | 'ifood'
     * @param {string} categoriaId — usa margem ideal da categoria
     * @returns {object} { preco, margem, margemPct, detalhe }
     */
    function suggest(custoTotal, canal, categoriaId) {
        const c = Number(custoTotal) || 0;
        if (c <= 0) return { preco: 0, margem: 0, margemPct: 0, detalhe: 'custo zero' };

        const margemBase = MARGEM_POR_CATEGORIA[categoriaId] || MARGEM_POR_CATEGORIA.default;
        const ajuste = AJUSTE_MARGEM_POR_CANAL[canal] || 0;
        const margemAlvo = Math.max(0.25, margemBase + ajuste);  // mínimo 25% de margem
        const taxaCanal = TAXAS[canal] || TAXAS.loja;

        const denom = 1 - taxaCanal - margemAlvo;
        if (denom <= 0) return { preco: 0, margem: 0, margemPct: 0, detalhe: 'margem+taxa > 100%' };

        let preco = c / denom;
        preco = _psychRound(preco);

        // Limite máximo: não deixar delivery/ifood ficar absurdamente acima da loja
        if (canal !== 'loja') {
            const precoLoja = _calcLoja(c, categoriaId);
            const maxMult = MAX_MULT_VS_LOJA[canal] || 1.3;
            const precoMax = _psychRound(precoLoja * maxMult);
            if (preco > precoMax) preco = precoMax;
        }

        const margem = preco - c - (preco * taxaCanal);
        const margemPct = Math.round((margem / preco) * 100);

        return {
            preco: Math.round(preco * 100) / 100,
            margem: Math.round(margem * 100) / 100,
            margemPct: margemPct,
            canal: canal,
            detalhe: `custo R$ ${c.toFixed(2)} · taxa ${(taxaCanal*100).toFixed(1)}% · margem alvo ${(margemAlvo*100).toFixed(0)}%`
        };
    }

    // helper interno: calcula preço canal loja sem recursão
    function _calcLoja(c, categoriaId) {
        const m = MARGEM_POR_CATEGORIA[categoriaId] || MARGEM_POR_CATEGORIA.default;
        const denom = 1 - TAXAS.loja - m;
        if (denom <= 0) return c * 2;
        return _psychRound(c / denom);
    }

    /**
     * Calcula para os 3 canais de uma vez.
     */
    function suggestAll(custoTotal, categoriaId) {
        return {
            loja:     suggest(custoTotal, 'loja', categoriaId),
            delivery: suggest(custoTotal, 'delivery', categoriaId),
            ifood:    suggest(custoTotal, 'ifood', categoriaId)
        };
    }

    /**
     * Calcula custo total a partir da estrutura do produto v2.
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
     * Valida preço atual vs sugerido. Retorna:
     *   { ok, margemReal, status: 'ideal'|'abaixo'|'acima'|'prejuizo' }
     */
    function validatePrice(custoTotal, precoReal, canal) {
        const c = Number(custoTotal) || 0;
        const p = Number(precoReal) || 0;
        if (!p) return { ok: false, status: 'sem-preco', msg: 'Preço não definido' };
        const taxa = TAXAS[canal] || TAXAS.loja;
        const margemReal = p - c - (p * taxa);
        const margemPct = Math.round((margemReal / p) * 100);
        if (margemReal <= 0) return { ok: false, status: 'prejuizo', margemPct, msg: 'Preço menor que custo + taxa — PREJUÍZO' };
        if (margemPct < 40) return { ok: false, status: 'abaixo', margemPct, msg: 'Margem baixa (' + margemPct + '%)' };
        if (margemPct > 75) return { ok: true, status: 'acima', margemPct, msg: 'Margem muito alta (' + margemPct + '%) — pode estar caro pro mercado' };
        return { ok: true, status: 'ideal', margemPct, msg: 'Margem saudável (' + margemPct + '%)' };
    }

    // Arredondamento psicológico: prefere .90, .99, acabar em 5 ou 0
    function _psychRound(v) {
        if (v < 10) return Math.floor(v) + 0.90;
        const intPart = Math.floor(v);
        const modEnd = intPart % 10;
        // Aproxima pro .90 mais próximo
        let base;
        if (modEnd < 5) base = intPart - modEnd;           // vai pra .90 do múltiplo abaixo
        else base = intPart - modEnd + 10;                  // sobe pro próximo múltiplo
        return Math.max(1, base - 0.10);                    // ex: 17 → 16.90; 24 → 24.90
    }

    global.CostCalculator = {
        suggest, suggestAll, computeCustoTotal, validatePrice,
        MARGEM_POR_CATEGORIA, TAXAS
    };
})(typeof window !== 'undefined' ? window : this);
