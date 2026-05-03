/* ============================================================
   MilkyPot — Price Intelligence
   ============================================================
   Sugestão automática de preço baseada em CMV real + margem alvo.

   Fórmula:
     precoSugerido = custoTotal / (1 - margemAlvo/100)

   Exemplo:
     custoTotal R$ 5,20, margem alvo 50%
     precoSugerido = 5,20 / (1 - 0,50) = 5,20 / 0,50 = R$ 10,40

   Garantias:
     - calc/análise são puras (não escrevem nada)
     - aplicarPreco() escreve via CatalogV2 + grava histórico em
       price_changes_log_<fid>
     - histórico nunca é apagado (audit trail)
   ============================================================ */
(function(global) {
    'use strict';

    function DS() { return global.DataStore; }

    /* ---- Util ---- */
    function _r2(n) { return Math.round(Number(n) * 100) / 100; }
    function _r1(n) { return Math.round(Number(n) * 10) / 10; }

    /**
     * Fórmula pura: preço sugerido = custo / (1 - margem/100)
     * Retorna null se inputs inválidos.
     */
    function calcPrecoSugerido(custoTotal, margemAlvoPct) {
        custoTotal = Number(custoTotal) || 0;
        margemAlvoPct = Number(margemAlvoPct);
        if (!Number.isFinite(margemAlvoPct)) margemAlvoPct = 50;
        if (custoTotal <= 0) return null;
        if (margemAlvoPct >= 100 || margemAlvoPct < 0) return null;
        return _r2(custoTotal / (1 - margemAlvoPct / 100));
    }

    /**
     * Margem real dado custo + preço (em %).
     * Retorna null se inputs inválidos.
     */
    function calcMargemAtual(custoTotal, precoAtual) {
        custoTotal = Number(custoTotal) || 0;
        precoAtual = Number(precoAtual) || 0;
        if (precoAtual <= 0) return null;
        if (custoTotal <= 0) return null;
        return _r1((1 - custoTotal / precoAtual) * 100);
    }

    /**
     * Retorna análise completa de UM produto pra UM canal.
     */
    function getAnaliseProduto(produto, margemAlvoPct, canal) {
        canal = canal || 'loja';
        margemAlvoPct = Number(margemAlvoPct);
        if (!Number.isFinite(margemAlvoPct)) margemAlvoPct = 50;

        var custoTotal = (produto && produto.custos && Number(produto.custos.custoTotal)) || 0;
        var precoAtual = (produto && produto.precos && produto.precos[canal] && Number(produto.precos[canal].real)) || 0;

        var precoSugerido = calcPrecoSugerido(custoTotal, margemAlvoPct);
        var margemAtual = calcMargemAtual(custoTotal, precoAtual);
        var diferenca = (precoSugerido !== null && precoAtual > 0)
            ? _r2(precoSugerido - precoAtual) : null;
        var diferencaPct = (diferenca !== null && precoAtual > 0)
            ? _r1((diferenca / precoAtual) * 100) : null;

        // Alerta hierárquico
        var alerta = 'ok', alertaIcon = '🟢', alertaLabel = 'OK';
        if (custoTotal <= 0) {
            alerta = 'sem-custo'; alertaIcon = '⚪'; alertaLabel = 'Sem custo cadastrado';
        } else if (precoAtual <= 0) {
            alerta = 'sem-preco'; alertaIcon = '⚪'; alertaLabel = 'Sem preço cadastrado';
        } else if (margemAtual < 0) {
            alerta = 'prejuizo'; alertaIcon = '🚨'; alertaLabel = 'Prejuízo (margem negativa)';
        } else if (margemAtual < 30) {
            alerta = 'baixa'; alertaIcon = '⚠️'; alertaLabel = 'Margem baixa (<30%)';
        } else if (precoSugerido !== null && precoAtual < precoSugerido) {
            alerta = 'revisar'; alertaIcon = '📈'; alertaLabel = 'Revisar (abaixo do sugerido)';
        }

        return {
            productId: produto.id,
            name: produto.name,
            canal: canal,
            custoTotal: custoTotal,
            precoAtual: precoAtual,
            margemAtual: margemAtual,
            margemAlvoPct: margemAlvoPct,
            precoSugerido: precoSugerido,
            diferenca: diferenca,
            diferencaPct: diferencaPct,
            alerta: alerta,
            alertaIcon: alertaIcon,
            alertaLabel: alertaLabel
        };
    }

    /**
     * Lista análise de TODOS os produtos da franquia.
     * opts: { margemAlvoPct, canal, onlyAlertas, categoriaId }
     */
    function listAnalise(fid, opts) {
        opts = opts || {};
        var canal = opts.canal || 'loja';
        var margemAlvoPct = Number(opts.margemAlvoPct);
        if (!Number.isFinite(margemAlvoPct)) margemAlvoPct = 50;

        var lista = [];
        if (global.CatalogV2 && global.CatalogV2.listProdutos) {
            try {
                lista = global.CatalogV2.listProdutos(fid,
                    opts.categoriaId ? { categoriaId: opts.categoriaId } : null) || [];
            } catch (e) {}
        }

        var analise = lista.map(function(p) {
            return getAnaliseProduto(p, margemAlvoPct, canal);
        });

        if (opts.onlyAlertas) {
            return analise.filter(function(a) {
                return a.alerta !== 'ok' && a.alerta !== 'sem-custo' && a.alerta !== 'sem-preco';
            });
        }
        return analise;
    }

    /**
     * Aplica novo preço ao produto + grava histórico.
     * Retorna: { ok, precoAnterior, precoNovo, margemAnterior, margemNova, logEntryId }
     *
     * Segurança:
     *   - SÓ deve ser chamado por ação manual do usuário
     *   - Sempre loga em price_changes_log_<fid>
     *   - Histórico é append-only (nunca apagamos entries)
     */
    function aplicarPreco(fid, productId, novoPreco, opts) {
        opts = opts || {};
        if (!global.CatalogV2 || !global.CatalogV2.getProduto || !global.CatalogV2.saveProduto) {
            return { ok: false, error: 'CatalogV2 não disponível' };
        }
        if (!fid || !productId) return { ok: false, error: 'fid e productId obrigatórios' };

        novoPreco = Number(novoPreco);
        if (!Number.isFinite(novoPreco) || novoPreco <= 0) {
            return { ok: false, error: 'novoPreco inválido' };
        }

        var p = global.CatalogV2.getProduto(fid, productId);
        if (!p) return { ok: false, error: 'Produto não encontrado: ' + productId };

        var canal = opts.canal || 'loja';
        var custoAtual = (p.custos && Number(p.custos.custoTotal)) || 0;
        var precoAnterior = (p.precos && p.precos[canal] && Number(p.precos[canal].real)) || 0;
        var margemAnterior = calcMargemAtual(custoAtual, precoAnterior);
        var margemNova = calcMargemAtual(custoAtual, novoPreco);

        // Atualiza CatalogV2
        if (!p.precos) p.precos = {};
        if (!p.precos[canal]) p.precos[canal] = { recomendado: 0, real: 0 };
        p.precos[canal].real = _r2(novoPreco);
        if (!p.precos[canal].recomendado) p.precos[canal].recomendado = _r2(novoPreco);

        try { global.CatalogV2.saveProduto(fid, p); }
        catch (e) { return { ok: false, error: 'saveProduto falhou: ' + e.message }; }

        // Audit log em price_changes_log_<fid>
        var userId = null;
        try {
            if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
                var u = Auth.getCurrentUser();
                userId = u ? (u.uid || u.email || null) : null;
            }
        } catch (_) {}

        var logEntry = {
            id: 'pchg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            productId: productId,
            productName: p.name,
            canal: canal,
            precoAnterior: _r2(precoAnterior),
            precoNovo: _r2(novoPreco),
            diferenca: _r2(novoPreco - precoAnterior),
            custoAtual: _r2(custoAtual),
            margemAnterior: margemAnterior,
            margemNova: margemNova,
            motivo: opts.motivo || 'aplicação manual de preço sugerido',
            userId: userId,
            createdAt: new Date().toISOString()
        };

        var log = DS().getCollection('price_changes_log', fid) || [];
        log.push(logEntry);
        DS().setCollection('price_changes_log', fid, log);

        return {
            ok: true,
            precoAnterior: precoAnterior,
            precoNovo: _r2(novoPreco),
            margemAnterior: margemAnterior,
            margemNova: margemNova,
            logEntryId: logEntry.id
        };
    }

    /**
     * Lista histórico de mudanças de preço.
     * opts: { productId } — filtra por produto se informado
     */
    function getHistorico(fid, opts) {
        opts = opts || {};
        var log = DS().getCollection('price_changes_log', fid) || [];
        if (opts.productId) {
            log = log.filter(function(l) { return l.productId === opts.productId; });
        }
        // Mais recente primeiro
        return log.slice().sort(function(a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }

    /* ---- Export ---- */
    global.PriceIntelligence = {
        calcPrecoSugerido: calcPrecoSugerido,
        calcMargemAtual: calcMargemAtual,
        getAnaliseProduto: getAnaliseProduto,
        listAnalise: listAnalise,
        aplicarPreco: aplicarPreco,
        getHistorico: getHistorico
    };

})(typeof window !== 'undefined' ? window : this);
