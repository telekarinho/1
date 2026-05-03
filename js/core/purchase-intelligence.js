/* ============================================================
   MilkyPot — Purchase Intelligence (Fase 7)
   ============================================================
   Sugestão automática de compra de insumo, baseada no consumo real
   das vendas calculado pelo MarginIntelligence.

   Fórmula:
     diasRestantes = estoqueAtual / consumoMedioDiario
     quantidadeSugerida = consumoMedioDiario × diasCobertura − estoqueAtual

   Status:
     🔴 < 3 dias = crítico
     🟡 < 7 dias = atenção
     🟢 ≥ 7 dias = ok

   Garantias:
     - SUGERE, nunca compra automático
     - "Marcar como comprado" é uma ação manual: soma qty ao estoque
       + grava entry em purchase_orders_log_<fid> (append-only)
     - Histórico é audit-only — nunca apagado
   ============================================================ */
(function(global) {
    'use strict';

    function DS() { return global.DataStore; }

    /* ---- Util ---- */
    function _r2(n) { return Math.round(Number(n) * 100) / 100; }
    function _r1(n) { return Math.round(Number(n) * 10) / 10; }
    function _r3(n) { return Math.round(Number(n) * 1000) / 1000; }

    /**
     * Calcula sugestão de compra dado consumo médio + estoque + cobertura.
     * Retorna 0 se já há estoque suficiente. Nunca negativo.
     */
    function calcQuantidadeSugerida(consumoMedioDiario, estoqueAtual, diasCoberturaDesejados) {
        consumoMedioDiario = Number(consumoMedioDiario) || 0;
        estoqueAtual = Number(estoqueAtual) || 0;
        diasCoberturaDesejados = Number(diasCoberturaDesejados);
        if (!Number.isFinite(diasCoberturaDesejados) || diasCoberturaDesejados <= 0) {
            diasCoberturaDesejados = 7;
        }
        if (consumoMedioDiario <= 0) return 0; // sem consumo registrado → não sugere
        var alvo = consumoMedioDiario * diasCoberturaDesejados;
        var falta = alvo - estoqueAtual;
        return _r3(Math.max(0, falta));
    }

    /**
     * Retorna análise completa de UM insumo enriquecida com sugestão.
     * `insumoConsumo` deve vir do MarginIntelligence.getConsumoInsumos:
     *   { insumoId, nome, unit, consumoHoje, consumoSemana, consumoMedioDiario,
     *     consumoPeriodo, estoqueAtual, diasRestantes, status, statusIcon }
     */
    function getSugestaoInsumo(insumoConsumo, diasCoberturaDesejados) {
        diasCoberturaDesejados = Number(diasCoberturaDesejados);
        if (!Number.isFinite(diasCoberturaDesejados) || diasCoberturaDesejados <= 0) {
            diasCoberturaDesejados = 7;
        }
        var qtd = calcQuantidadeSugerida(
            insumoConsumo.consumoMedioDiario,
            insumoConsumo.estoqueAtual,
            diasCoberturaDesejados
        );
        return Object.assign({}, insumoConsumo, {
            diasCoberturaDesejados: diasCoberturaDesejados,
            quantidadeSugerida: qtd,
            // tag de prioridade pra ordenação UI
            prioridade: insumoConsumo.status === 'critico' ? 0
                      : insumoConsumo.status === 'atencao' ? 1
                      : insumoConsumo.status === 'ok' ? 2 : 3
        });
    }

    /**
     * Lista todos insumos da franquia com sugestão.
     * Reutiliza MarginIntelligence pra cálculo de consumo (single source of truth).
     *
     * opts: { diasCoberturaDesejados (7), days (30 = janela de análise),
     *         onlyAlertas (boolean), filtroStatus ('critico'|'atencao'|'ok'|'sem-dado') }
     */
    function listSugestoes(fid, opts) {
        opts = opts || {};
        var dias = Number(opts.diasCoberturaDesejados);
        if (!Number.isFinite(dias) || dias <= 0) dias = 7;

        var consumoData = null;
        if (global.MarginIntelligence && global.MarginIntelligence.getConsumoInsumos) {
            try { consumoData = global.MarginIntelligence.getConsumoInsumos(fid, opts.days || 30); }
            catch (e) { consumoData = null; }
        }
        var lista = (consumoData && consumoData.insumos) ? consumoData.insumos : [];

        // Pra insumos do inventory que NÃO foram consumidos no período (não aparecem em
        // consumoData.insumos), também queremos mostrar — só pra dar visibilidade do estoque.
        var inventory = DS().getCollection('inventory', fid) || [];
        var seenIds = {};
        lista.forEach(function(i) { seenIds[i.insumoId] = true; });
        inventory.forEach(function(ins) {
            if (!ins || !ins.id || seenIds[ins.id]) return;
            lista.push({
                insumoId: ins.id,
                nome: ins.name || ins.id,
                unit: ins.unit,
                consumoHoje: 0,
                consumoSemana: 0,
                consumoPeriodo: 0,
                consumoMedioDiario: 0,
                estoqueAtual: Number(ins.quantity || 0),
                diasRestantes: null,
                status: 'sem-dado',
                statusIcon: '⚪'
            });
        });

        var sugestoes = lista.map(function(i) { return getSugestaoInsumo(i, dias); });

        // Filtros
        if (opts.onlyAlertas) {
            sugestoes = sugestoes.filter(function(s) {
                return s.status === 'critico' || s.status === 'atencao';
            });
        }
        if (opts.filtroStatus) {
            sugestoes = sugestoes.filter(function(s) { return s.status === opts.filtroStatus; });
        }

        // Ordena por prioridade (crítico primeiro, depois atenção, etc.)
        sugestoes.sort(function(a, b) {
            if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
            // dentro do mesmo nível: maior sugestão primeiro
            return (b.quantidadeSugerida || 0) - (a.quantidadeSugerida || 0);
        });

        // Resumo
        var summary = {
            total: sugestoes.length,
            critico: sugestoes.filter(function(s) { return s.status === 'critico'; }).length,
            atencao: sugestoes.filter(function(s) { return s.status === 'atencao'; }).length,
            ok: sugestoes.filter(function(s) { return s.status === 'ok'; }).length,
            semDado: sugestoes.filter(function(s) { return s.status === 'sem-dado'; }).length,
            totalSugerido: _r3(sugestoes.reduce(function(s, i) { return s + (i.quantidadeSugerida || 0); }, 0))
        };

        return { sugestoes: sugestoes, summary: summary };
    }

    /**
     * Marca um insumo como comprado:
     *   - SOMA `quantidade` ao estoque atual do insumo (ins.quantity += qty)
     *   - Atualiza ins.cost se opts.custoUnit informado e diferente
     *   - Grava entry em purchase_orders_log_<fid>
     *
     * Retorna: { ok, estoqueAnterior, estoqueNovo, custoAtualizado, logEntryId }
     */
    function marcarComoComprado(fid, insumoId, quantidade, opts) {
        opts = opts || {};
        if (!fid || !insumoId) return { ok: false, error: 'fid e insumoId obrigatórios' };

        quantidade = Number(quantidade);
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            return { ok: false, error: 'quantidade inválida' };
        }

        var inventory = DS().getCollection('inventory', fid) || [];
        var idx = inventory.findIndex(function(i) { return i && i.id === insumoId; });
        if (idx === -1) return { ok: false, error: 'Insumo não encontrado: ' + insumoId };

        var ins = inventory[idx];
        var estoqueAnterior = Number(ins.quantity || 0);
        var estoqueNovo = _r3(estoqueAnterior + quantidade);
        var custoAnterior = Number(ins.cost || 0);
        var custoAtualizado = false;
        var custoNovo = custoAnterior;
        if (opts.custoUnit !== undefined && opts.custoUnit !== null && opts.custoUnit !== '') {
            var cu = Number(opts.custoUnit);
            if (Number.isFinite(cu) && cu > 0 && cu !== custoAnterior) {
                ins.cost = _r2(cu);
                custoNovo = ins.cost;
                custoAtualizado = true;
            }
        }
        ins.quantity = estoqueNovo;
        ins.lastPurchaseAt = new Date().toISOString();
        inventory[idx] = ins;
        DS().setCollection('inventory', fid, inventory);

        // Audit log
        var userId = null;
        try {
            if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
                var u = Auth.getCurrentUser();
                userId = u ? (u.uid || u.email || null) : null;
            }
        } catch (_) {}

        var logEntry = {
            id: 'po_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            insumoId: insumoId,
            insumoNome: ins.name || insumoId,
            unit: ins.unit,
            quantidade: _r3(quantidade),
            estoqueAnterior: _r3(estoqueAnterior),
            estoqueNovo: _r3(estoqueNovo),
            custoAnterior: _r2(custoAnterior),
            custoNovo: _r2(custoNovo),
            custoAtualizado: custoAtualizado,
            custoTotal: opts.custoUnit ? _r2(quantidade * Number(opts.custoUnit)) : null,
            fornecedor: opts.fornecedor || null,
            motivo: opts.motivo || 'compra registrada manualmente',
            sugerido: opts.sugerido !== undefined ? !!opts.sugerido : null,
            quantidadeSugerida: opts.quantidadeSugerida || null,
            userId: userId,
            createdAt: new Date().toISOString()
        };

        var log = DS().getCollection('purchase_orders_log', fid) || [];
        log.push(logEntry);
        DS().setCollection('purchase_orders_log', fid, log);

        return {
            ok: true,
            estoqueAnterior: estoqueAnterior,
            estoqueNovo: estoqueNovo,
            custoAtualizado: custoAtualizado,
            custoNovo: custoNovo,
            logEntryId: logEntry.id
        };
    }

    /** Lista histórico de compras. opts: { insumoId } */
    function getHistorico(fid, opts) {
        opts = opts || {};
        var log = DS().getCollection('purchase_orders_log', fid) || [];
        if (opts.insumoId) {
            log = log.filter(function(l) { return l.insumoId === opts.insumoId; });
        }
        return log.slice().sort(function(a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }

    global.PurchaseIntelligence = {
        calcQuantidadeSugerida: calcQuantidadeSugerida,
        getSugestaoInsumo: getSugestaoInsumo,
        listSugestoes: listSugestoes,
        marcarComoComprado: marcarComoComprado,
        getHistorico: getHistorico
    };

})(typeof window !== 'undefined' ? window : this);
