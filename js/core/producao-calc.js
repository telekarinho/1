/* ============================================================
   MilkyPot Produção Calc v2 — custo REAL completo por produto
   ============================================================
   Modelo: custeio por absorção, 2 bases de rateio (sugestão do
   Finance Tracker). Mostra TODOS os custos explícitos:

   BLOCO 1: CUSTO DIRETO (o que entra no produto)
     - insumos     : Σ (ingrediente × qtd × costUnit)
     - embalagem   : copo + tampa + colher
     - mao_obra    : tempo × custo_hora × (1 + encargos_pct)
                     (encargos CLT: +33% sobre salário — 13º, férias, FGTS, INSS)

   BLOCO 2: CUSTO INDIRETO (fatia da estrutura)
     - rateio_fixo     : custos fixos do mês ÷ RECEITA DO MÊS × preço loja
                         (base R$ receita — produto caro absorve mais)
     - rateio_variavel : custos variáveis do mês ÷ unidades vendidas
                         (base unidade — produto barato absorve igual)
     - das             : DAS Simples Anexo I (% do faturamento, default 4%)
     - pro_labore      : rateio pró-labore + INSS ÷ unidades
     - depreciacao     : depreciação equipamentos ÷ unidades
     - perdas          : % do CMV (quebra/derretimento, default 4%)
     - outros          : manual (user edita)

   BLOCO 3: CUSTO TOTAL = DIRETO + INDIRETO

   RAMP-UP: se a loja tem <200 pedidos/mês, usa META DE VENDAS em vez
   do realizado pra calcular rateio (senão primeiros produtos ficam
   absurdamente caros).

   Config (DataStore.producao_config_{fid}):
     {
       custoKwh, potenciaMediaKw,    // energia direta
       custoHora, encargosPct,        // mao-de-obra (encargos 0.33 CLT / 0 RPA)
       dasPct,                        // 4% Anexo I Simples
       proLabore,                     // R$/mês
       depreciacaoMensal,             // R$/mês (freezer+maquinário ÷ vida útil)
       perdasPct,                     // 4% (quebra/derretimento)
       metaVendasMes                  // R$ — fallback ramp-up
     }

   ============================================================ */
(function(global){
    'use strict';

    const DEFAULT_CONFIG = {
        custoKwh: 0.85,
        potenciaMediaKw: 1.5,
        custoHora: 8.50,
        encargosPct: 0.33,           // CLT: +33% sobre hora (13, férias, FGTS, INSS)
        dasPct: 0.04,                // 4% Simples Nacional Anexo I
        proLabore: 1685,             // R$/mês (R$1.518 + 11% INSS)
        depreciacaoMensal: 500,      // R$/mês (equipamentos ÷ 60 meses)
        perdasPct: 0.04,             // 4% quebra/derretimento
        metaVendasMes: 45000,        // meta ramp-up
        metaProdutosMes: 2000,       // meta unidades ramp-up
        minPedidosReal: 200          // abaixo disso usa meta
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
        if (global.DataStore.getCollection) return global.DataStore.getCollection('inventory', fid) || [];
        return global.DataStore.get('inventory_' + fid) || [];
    }

    // ============================================================
    // RECEITA
    // ============================================================
    function recipeCost(produto, inventory) {
        const recipe = (produto?.custos?.insumos) || [];
        const pkgIds = (produto?.custos?.embalagemIds) || [];
        inventory = inventory || [];
        const invMap = {};
        inventory.forEach(i => { invMap[i.id] = i; });

        let insumos = 0, embalagem = 0;
        const detalhes = [];

        recipe.forEach(r => {
            const ing = invMap[r.insumoId];
            if (!ing) { detalhes.push({ tipo: 'falta', insumoId: r.insumoId }); return; }
            const qty = Number(r.qty) || 0;
            const cost = _normalizeUsage(ing, qty, r.unit);
            insumos += cost;
            detalhes.push({ tipo: 'insumo', nome: ing.name, qty, unit: r.unit || ing.unit, custoUnit: ing.costUnit || 0, subtotal: Math.round(cost*100)/100 });
        });
        pkgIds.forEach(pid => {
            const ing = invMap[pid]; if (!ing) return;
            const cost = Number(ing.costUnit) || 0;
            embalagem += cost;
            detalhes.push({ tipo: 'embalagem', nome: ing.name, qty: 1, unit: ing.unit, custoUnit: cost, subtotal: Math.round(cost*100)/100 });
        });

        return {
            insumos: Math.round(insumos*100)/100,
            embalagem: Math.round(embalagem*100)/100,
            detalhes
        };
    }

    function _normalizeUsage(ing, qty, unitUsed) {
        const unitInv = (ing.unit || '').toLowerCase();
        const u = (unitUsed || unitInv).toLowerCase();
        const cost = Number(ing.costUnit) || 0;
        if (u === unitInv) return qty * cost;
        if (unitInv === 'kg' && u === 'g')   return (qty / 1000) * cost;
        if (unitInv === 'g'  && u === 'kg')  return (qty * 1000) * cost;
        if (unitInv === 'l'  && u === 'ml')  return (qty / 1000) * cost;
        if (unitInv === 'ml' && u === 'l')   return (qty * 1000) * cost;
        return qty * cost;
    }

    // ============================================================
    // CUSTO DIRETO (tempo × custos unitários)
    // ============================================================
    function directCost(produto, config) {
        const tempoMin = Number(produto?.tempoPreparoMin) || 0;
        if (tempoMin <= 0) return { mao_obra: 0, energia_direta: 0 };
        const h = tempoMin / 60;

        // Mao-de-obra com encargos CLT
        const custoHoraCheio = config.custoHora * (1 + (config.encargosPct || 0));
        const mao_obra = h * custoHoraCheio;

        // Energia direta só pra equipamentos acionados sob demanda (liquidificador ~500W × tempo)
        // Maior parte da energia (freezer 24h) vai pro rateio fixo.
        const energia_direta = h * config.custoKwh * (config.potenciaMediaKw * 0.33); // 1/3 é acionado sob demanda

        return {
            mao_obra: Math.round(mao_obra*100)/100,
            energia_direta: Math.round(energia_direta*100)/100
        };
    }

    // ============================================================
    // CUSTO INDIRETO (rateios + encargos sobre faturamento)
    // ============================================================
    /**
     * Calcula o contexto do mês: receita, pedidos, fixos, variáveis.
     * Se loja nova (<minPedidosReal), usa meta em vez de realizado.
     */
    function monthContext(fid, config) {
        const ctx = {
            periodKey: null,
            receitaReal: 0, qtdReal: 0,
            totalFixed: 0, totalVariable: 0,
            rampUp: true, disponivel: false,
            receitaBase: config.metaVendasMes || DEFAULT_CONFIG.metaVendasMes,
            qtdBase: config.metaProdutosMes || DEFAULT_CONFIG.metaProdutosMes
        };
        try {
            if (!global.DataStore || !fid) return ctx;
            let pk;
            if (global.Financas?.currentPeriodKey) pk = global.Financas.currentPeriodKey();
            else pk = new Date().toISOString().slice(0,7);
            ctx.periodKey = pk;

            if (global.Financas?.computeDRE) {
                try {
                    const dre = global.Financas.computeDRE(fid, pk);
                    if (dre) {
                        ctx.totalFixed = Number(dre.totalFixed) || 0;
                        ctx.totalVariable = Number(dre.totalVariable) || 0;
                        ctx.receitaReal = Number(dre.receitaLiquida) || 0;
                    }
                } catch(e){}
            }

            const orders = (global.DataStore.getCollection ? global.DataStore.getCollection('orders', fid) : null) || [];
            const [y, m] = pk.split('-').map(Number);
            orders.forEach(o => {
                if (!o.createdAt || !['confirmado','entregue','pago'].includes(o.status)) return;
                const d = new Date(o.createdAt);
                if (d.getFullYear() !== y || (d.getMonth()+1) !== m) return;
                (o.items || []).forEach(it => { ctx.qtdReal += Number(it.qty) || 1; });
            });

            // Se passou do threshold, usa real
            if (ctx.qtdReal >= (config.minPedidosReal || DEFAULT_CONFIG.minPedidosReal)) {
                ctx.rampUp = false;
                ctx.receitaBase = ctx.receitaReal;
                ctx.qtdBase = ctx.qtdReal;
                ctx.disponivel = true;
            } else if (ctx.totalFixed + ctx.totalVariable > 0) {
                ctx.disponivel = true;  // tem dados de custo mas poucos pedidos — usa meta
            }
        } catch(e) { console.warn('monthContext:', e); }
        return ctx;
    }

    /**
     * Rateio de custos fixos: base = R$ RECEITA (produto caro absorve mais).
     * Aplicado como % do PREÇO DE LOJA do produto.
     */
    function fixedOverhead(produto, ctx, config) {
        if (!ctx.receitaBase) return 0;
        const precoLoja = Number(produto?.precos?.loja?.real) || Number(produto?.precos?.loja?.recomendado) || 0;
        if (!precoLoja) return 0;
        // Se loja ainda nao tem despesas fixas cadastradas, usa estimativa conservadora
        const fixos = ctx.totalFixed > 0 ? ctx.totalFixed : _estimativaFixos(config);
        const pct = fixos / ctx.receitaBase;
        return Math.round(precoLoja * pct * 100) / 100;
    }

    function _estimativaFixos(config) {
        // Fallback quando loja não tem despesas cadastradas ainda.
        // Estimativa conservadora: aluguel 3500 + salários 3000 + utilidades 500 + contador+software 800
        return 7800 + (Number(config.depreciacaoMensal) || DEFAULT_CONFIG.depreciacaoMensal) + (Number(config.proLabore) || DEFAULT_CONFIG.proLabore);
    }

    /**
     * Rateio de custos variáveis: base = UNIDADES VENDIDAS (cada produto absorve igual).
     */
    function variableOverhead(ctx, config) {
        if (!ctx.qtdBase) return 0;
        const variaveis = ctx.totalVariable > 0 ? ctx.totalVariable : _estimativaVariaveis(config);
        return Math.round((variaveis / ctx.qtdBase) * 100) / 100;
    }

    function _estimativaVariaveis(config) {
        return 800; // marketing+manutenção+limpeza estimado conservador
    }

    // ============================================================
    // CUSTO TOTAL — principal API
    // ============================================================
    function totalCost(produto, fid) {
        const inventory = getInventory(fid);
        const config = getConfig(fid);
        const ctx = monthContext(fid, config);
        const recipe = recipeCost(produto, inventory);
        const direct = directCost(produto, config);

        const fixed = fixedOverhead(produto, ctx, config);
        const variableOv = variableOverhead(ctx, config);

        // DAS Simples (% do preço loja)
        const precoLoja = Number(produto?.precos?.loja?.real) || Number(produto?.precos?.loja?.recomendado) || 0;
        const das = Math.round((precoLoja * (config.dasPct || 0)) * 100) / 100;

        // Pró-labore rateado por unidade projetada
        const proLaboreUnit = ctx.qtdBase > 0 ? Math.round((config.proLabore / ctx.qtdBase) * 100) / 100 : 0;

        // Depreciação rateada por unidade
        const depreciacaoUnit = ctx.qtdBase > 0 ? Math.round((config.depreciacaoMensal / ctx.qtdBase) * 100) / 100 : 0;

        // Perdas (% do CMV)
        const cmv = recipe.insumos + recipe.embalagem;
        const perdas = Math.round((cmv * (config.perdasPct || 0)) * 100) / 100;

        const outros = Number(produto?.custos?.custoAdicional?.outros) || 0;

        const custoDireto = recipe.insumos + recipe.embalagem + direct.mao_obra + direct.energia_direta;
        const custoIndireto = fixed + variableOv + das + proLaboreUnit + depreciacaoUnit + perdas + outros;
        const total = custoDireto + custoIndireto;

        return {
            // BLOCO 1 — DIRETO
            insumos: recipe.insumos,
            embalagem: recipe.embalagem,
            mao_obra: direct.mao_obra,
            energia_direta: direct.energia_direta,
            subtotalDireto: Math.round(custoDireto * 100) / 100,
            // BLOCO 2 — INDIRETO
            rateioFixos: fixed,
            rateioVariaveis: variableOv,
            das: das,
            proLabore: proLaboreUnit,
            depreciacao: depreciacaoUnit,
            perdas: perdas,
            outros: outros,
            subtotalIndireto: Math.round(custoIndireto * 100) / 100,
            // TOTAL
            total: Math.round(total * 100) / 100,
            // Breakdown + contexto
            breakdown: recipe.detalhes,
            context: ctx,
            config,
            rampUp: ctx.rampUp
        };
    }

    /**
     * Aplica no produto os campos CUSTO DIRETO que precisam ser salvos.
     * Custos indiretos NÃO são persistidos (mudam conforme contexto da loja).
     */
    function applyToProduto(produto, fid) {
        const c = totalCost(produto, fid);
        produto.custos = produto.custos || {};
        produto.custos.custoInsumos = c.insumos;
        produto.custos.custoAdicional = Object.assign({}, produto.custos.custoAdicional || {}, {
            embalagem: c.embalagem,
            energia: c.energia_direta,
            mao_obra: c.mao_obra,
            outros: c.outros
        });
        // custoTotal guarda só o direto (indireto é dinâmico)
        produto.custos.custoTotal = c.subtotalDireto;
        produto._custosAutoCalculados = true;
        produto._custosCalculatedAt = new Date().toISOString();
        return produto;
    }

    /**
     * Calcula margem líquida REAL por canal (preço - custo total).
     * Retorna: { loja, delivery, ifood } cada um com { margem, margemPct, status }
     */
    function marginsReal(produto, fid) {
        const c = totalCost(produto, fid);
        const canais = ['loja','delivery','ifood'];
        const taxasCanal = (global.CostCalculator?.TAXAS) || { loja: 0.028, delivery: 0.075, ifood: 0.26 };
        const result = {};
        canais.forEach(ch => {
            const preco = Number(produto?.precos?.[ch]?.real) || 0;
            if (!preco) { result[ch] = { preco, margem: 0, margemPct: 0, status: 'sem-preco' }; return; }
            const taxa = taxasCanal[ch] || 0;
            // custo total específico por canal (rateio fixo usa preço desse canal)
            const prodCanal = Object.assign({}, produto, { precos: { [ch]: { real: preco } } });
            const cCanal = totalCost(prodCanal, fid);
            const margem = preco - cCanal.total - (preco * taxa);
            const margemPct = preco > 0 ? Math.round((margem / preco) * 100) : 0;
            let status = 'ideal';
            if (margem <= 0) status = 'prejuizo';
            else if (margemPct < 10) status = 'ruim';
            else if (margemPct < 20) status = 'aceitavel';
            result[ch] = {
                preco, custoTotal: cCanal.total, taxa: Math.round(preco * taxa * 100)/100,
                margem: Math.round(margem*100)/100, margemPct, status
            };
        });
        return result;
    }

    global.ProducaoCalc = {
        getConfig, setConfig,
        recipeCost, directCost, fixedOverhead, variableOverhead, monthContext,
        totalCost, applyToProduto, marginsReal,
        DEFAULT_CONFIG
    };

    if (typeof window !== 'undefined') window.ProducaoCalc = global.ProducaoCalc;
    if (typeof globalThis !== 'undefined') globalThis.ProducaoCalc = global.ProducaoCalc;
})(typeof window !== 'undefined' ? window : this);
