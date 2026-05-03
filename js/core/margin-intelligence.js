/* ============================================================
   MilkyPot — Intelligence Layer (SOMENTE LEITURA)
   ============================================================
   MÓDULO 1 — Margem por Produto
   MÓDULO 2 — Consumo de Insumos
   MÓDULO 3 — Alertas Operacionais
   getDashboardSummary — agrega os 3 módulos para o KPI panel

   ⚠️  READ-ONLY: nunca escreve em nenhuma collection.
       Dados devem bater com a DRE oficial (usa cmvSnapshot).
   ============================================================ */
(function(global) {
    'use strict';

    function DS() { return global.DataStore; }

    /* ---- Timezone helpers (Brasília = UTC-3, conforme memória) ---- */

    /** Data YYYY-MM-DD no fuso Brasília, timezone-safe após 21h local. */
    function todayBSB() {
        // Subtrai 3h do UTC antes de formatar
        return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
    }

    var VALID_STATUSES = ['confirmado', 'entregue', 'pago'];

    /** Filtra pedidos pelas últimas `days` horas. days=0 → todos. */
    function _filterOrders(orders, days) {
        if (!days || days <= 0) return orders;
        var since = new Date(Date.now() - days * 86400000);
        return orders.filter(function(o) {
            return o.createdAt && new Date(o.createdAt) >= since;
        });
    }

    /* ============================================================
       MÓDULO 1 — MARGEM POR PRODUTO
       Agrega orders por productId, usando vendas com CMV registrado.

       Regra DRE-first: se item.cmvSnapshot estiver vazio mas o pedido
       tem o.cmvTotal (calculado pelo PDV mas não persistido por item),
       fazemos rateio proporcional por receita pra GARANTIR que o
       totalCMV bata com a soma de o.cmvTotal — o que a DRE mostra.

       Pedidos sem cmvTotal nem item.cmvSnapshot continuam ignorados.
    ============================================================ */
    function getMargemPorProduto(fid, days) {
        days = (days !== undefined && days !== null) ? days : 30;

        var orders = _filterOrders(DS().getCollection('orders', fid) || [], days)
            .filter(function(o) { return VALID_STATUSES.indexOf(o.status) !== -1; });

        var byProduct = {};

        orders.forEach(function(o) {
            var items = o.items || [];
            // CMV total do pedido conforme DRE/Caixa
            var orderCmvTotal = Number(o.cmvTotal || 0);
            // Soma do que já está atribuído por item (preserva precisão)
            var resolvedCmv = items.reduce(function(s, i) {
                return s + Math.max(0, Number(i.cmvSnapshot || 0));
            }, 0);
            // CMV ainda não distribuído entre items
            var unresolvedCmv = Math.max(0, orderCmvTotal - resolvedCmv);
            // Receita dos items que NÃO têm cmvSnapshot (alvo do rateio)
            var unresolvedItemsRev = items.reduce(function(s, i) {
                if (Number(i.cmvSnapshot || 0) > 0) return s;
                var qty = Number(i.qty || i.quantity || 1);
                return s + Number(i.total || (Number(i.unitPrice || 0) * qty));
            }, 0);

            items.forEach(function(item) {
                var pid = item.productId
                    || ('_n_' + (item.name || item.sabor || '').trim().toLowerCase());
                var name = (item.name || item.sabor || 'Produto sem nome').trim();
                var qty  = Number(item.qty || item.quantity || 1);
                var receita = Number(item.total || (Number(item.unitPrice || 0) * qty));

                var cmv = Number(item.cmvSnapshot || 0);
                // Fallback: rateio proporcional por receita do unresolved
                if (cmv <= 0 && unresolvedCmv > 0 && unresolvedItemsRev > 0) {
                    cmv = unresolvedCmv * (receita / unresolvedItemsRev);
                }
                if (cmv <= 0) return; // truly sem CMV

                if (!byProduct[pid]) {
                    byProduct[pid] = {
                        productId: item.productId || null,
                        name: name,
                        totalVendido: 0,
                        receitaTotal: 0,
                        cmvTotal: 0
                    };
                }
                var p = byProduct[pid];
                p.totalVendido += qty;
                p.receitaTotal += receita;
                p.cmvTotal += cmv;
            });
        });

        var produtos = Object.values(byProduct).map(function(p) {
            p.receitaTotal = _r2(p.receitaTotal);
            p.cmvTotal     = _r2(p.cmvTotal);
            p.lucroTotal   = _r2(p.receitaTotal - p.cmvTotal);
            p.margemMedia  = p.receitaTotal > 0
                ? _r1(p.lucroTotal / p.receitaTotal * 100)
                : 0;

            if (p.margemMedia < 0)       { p.alerta = 'prejuizo'; p.alertaIcon = '🚨'; }
            else if (p.margemMedia < 30) { p.alerta = 'baixa';    p.alertaIcon = '⚠️'; }
            else                          { p.alerta = 'ok';       p.alertaIcon = '🟢'; }

            return p;
        });

        var sorted = produtos.slice().sort(function(a, b) { return b.lucroTotal - a.lucroTotal; });
        var byMargem = produtos.slice().sort(function(a, b) { return a.margemMedia - b.margemMedia; });

        var totalReceita = _r2(produtos.reduce(function(s, p) { return s + p.receitaTotal; }, 0));
        var totalCMV     = _r2(produtos.reduce(function(s, p) { return s + p.cmvTotal; }, 0));
        var totalLucro   = _r2(totalReceita - totalCMV);
        var margemGeral  = totalReceita > 0 ? _r1(totalLucro / totalReceita * 100) : 0;

        return {
            produtos: sorted,
            topLucrativos: sorted.slice(0, 10),
            menorMargem: byMargem.slice(0, 10),
            totalReceita: totalReceita,
            totalCMV: totalCMV,
            totalLucro: totalLucro,
            margemGeral: margemGeral,
            produtoMaisLucrativo: sorted[0] || null,
            ordensAnalisadas: orders.length
        };
    }

    /* ============================================================
       Helper: monta mapa productId → { name, receita[] }
       Dual-read: CatalogV2 > catalog_config legado
    ============================================================ */
    function _buildRecipeMap(fid) {
        var map = {};

        // 1) CatalogV2
        if (global.CatalogV2) {
            try {
                var lista = global.CatalogV2.listProdutos
                    ? global.CatalogV2.listProdutos(fid)
                    : (global.CatalogV2.getAll ? global.CatalogV2.getAll(fid) : []);
                (lista || []).forEach(function(p) {
                    if (!p || !p.id) return;
                    var ins = (p.custos && Array.isArray(p.custos.insumos)) ? p.custos.insumos : [];
                    var valid = ins.filter(function(r) { return r && r.insumoId && Number(r.qty) > 0 && r.unit; });
                    if (valid.length) map[p.id] = { name: p.name, receita: valid };
                });
            } catch(e) {}
        }

        // 2) catalog_config legado
        var cat = DS().get('catalog_config') || {};
        function _addLeg(g) {
            if (!g || !g.items) return;
            g.items.forEach(function(item) {
                if (!item || !item.id || map[item.id]) return;
                var rec = Array.isArray(item.receita) ? item.receita.filter(function(r) {
                    return r && r.insumoId && Number(r.qty) > 0 && r.unit;
                }) : [];
                if (rec.length) map[item.id] = { name: item.name, receita: rec };
            });
        }
        Object.values(cat.sabores    || {}).forEach(_addLeg);
        Object.values(cat.adicionais || {}).forEach(_addLeg);
        (cat.bebidas || []).forEach(function(i) {
            if (!i || !i.id || map[i.id]) return;
            var rec = Array.isArray(i.receita) ? i.receita.filter(function(r) {
                return r && r.insumoId && Number(r.qty) > 0 && r.unit;
            }) : [];
            if (rec.length) map[i.id] = { name: i.name, receita: rec };
        });

        return map;
    }

    /** Converte qty de fromUnit para toUnit. Retorna null se incompatível. */
    function _convertUnit(qty, fromUnit, toUnit) {
        if (fromUnit === toUnit) return qty;
        if (global.Units && global.Units.convert) {
            var r = global.Units.convert(qty, fromUnit, toUnit);
            return r.ok ? r.qty : null;
        }
        // Fallback para pares comuns
        if (fromUnit === 'kg'  && toUnit === 'g')  return qty * 1000;
        if (fromUnit === 'g'   && toUnit === 'kg') return qty / 1000;
        if (fromUnit === 'L'   && toUnit === 'ml') return qty * 1000;
        if (fromUnit === 'ml'  && toUnit === 'L')  return qty / 1000;
        return null;
    }

    /* ============================================================
       MÓDULO 2 — CONSUMO DE INSUMOS
       Cross-referencia orders + receitas para calcular consumo
       por insumo. Calcula diasRestantes baseado no consumo médio.
    ============================================================ */
    function getConsumoInsumos(fid, days) {
        days = (days !== undefined && days !== null) ? days : 7;

        var inventory   = DS().getCollection('inventory', fid) || [];
        var recipeMap   = _buildRecipeMap(fid);
        var allOrders   = DS().getCollection('orders', fid) || [];
        var todayStr    = todayBSB();
        var weekAgoMs   = Date.now() - 7 * 86400000;

        // Indexa insumos pelo id
        var insByID = {};
        inventory.forEach(function(i) { if (i && i.id) insByID[i.id] = i; });

        var periodOrders = _filterOrders(allOrders, days).filter(function(o) {
            return VALID_STATUSES.indexOf(o.status) !== -1;
        });

        var consumo = {}; // insumoId → acumuladores

        periodOrders.forEach(function(o) {
            var oDate  = o.createdAt ? o.createdAt.slice(0, 10) : '';
            var oMs    = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            var isHoje = oDate === todayStr;
            var isSem  = oMs >= weekAgoMs;

            (o.items || []).forEach(function(item) {
                var pid = item.productId;
                if (!pid) return;
                var recipe = recipeMap[pid];
                if (!recipe || !recipe.receita || !recipe.receita.length) return;
                var qty = Number(item.qty || item.quantity || 1);

                recipe.receita.forEach(function(r) {
                    var ins = insByID[r.insumoId];
                    if (!ins) return;

                    var conv = _convertUnit(Number(r.qty) * qty, r.unit, ins.unit);
                    if (conv === null) return; // unidades incompatíveis

                    if (!consumo[r.insumoId]) {
                        consumo[r.insumoId] = {
                            insumoId: r.insumoId,
                            nome: ins.name || r.insumoId,
                            unit: ins.unit,
                            consumoHoje: 0,
                            consumoSemana: 0,
                            consumoPeriodo: 0,
                            estoqueAtual: Number(ins.quantity || 0)
                        };
                    }
                    var c = consumo[r.insumoId];
                    c.consumoPeriodo += conv;
                    if (isHoje) c.consumoHoje += conv;
                    if (isSem)  c.consumoSemana += conv;
                });
            });
        });

        var insumos = Object.values(consumo).map(function(ins) {
            ins.consumoHoje    = _r3(ins.consumoHoje);
            ins.consumoSemana  = _r3(ins.consumoSemana);
            ins.consumoPeriodo = _r3(ins.consumoPeriodo);

            var diario = ins.consumoSemana / 7;
            ins.consumoMedioDiario = _r3(diario);
            ins.diasRestantes = diario > 0
                ? _r1(ins.estoqueAtual / diario)
                : null;

            if      (ins.diasRestantes !== null && ins.diasRestantes < 3) {
                ins.status = 'critico';   ins.statusIcon = '🔴';
            } else if (ins.diasRestantes !== null && ins.diasRestantes < 7) {
                ins.status = 'atencao';   ins.statusIcon = '🟡';
            } else if (ins.diasRestantes !== null) {
                ins.status = 'ok';        ins.statusIcon = '🟢';
            } else {
                ins.status = 'sem-dado';  ins.statusIcon = '⚪';
            }
            return ins;
        });

        // Ranking por consumo no período (mais consumido primeiro)
        insumos.sort(function(a, b) { return b.consumoPeriodo - a.consumoPeriodo; });

        return {
            insumos: insumos,
            alertasEstoque: insumos.filter(function(i) {
                return i.status === 'critico' || i.status === 'atencao';
            }),
            insumoMaisConsumido: insumos[0] || null,
            totalInsumos: insumos.length
        };
    }

    /* ============================================================
       MÓDULO 3 — ALERTAS OPERACIONAIS
       Detecta inconsistências nos dados (não modifica nada).
    ============================================================ */
    function getAlertasOperacionais(fid) {
        var allOrders = DS().getCollection('orders', fid) || [];
        var inventory = DS().getCollection('inventory', fid) || [];
        var recipeMap = _buildRecipeMap(fid);

        var alertas = [];

        /* --- 1. Estoque negativo --- */
        inventory.forEach(function(ins) {
            if (ins && Number(ins.quantity || 0) < 0) {
                alertas.push({
                    tipo: 'estoque_negativo',
                    nivel: 'critico',
                    icon: '🚨',
                    titulo: 'Estoque negativo',
                    mensagem: '"' + (ins.name || ins.id) + '" com estoque '
                              + ins.quantity + ' ' + (ins.unit || ''),
                    contexto: ins
                });
            }
        });

        /* --- 2. CMV inconsistente nos últimos 30 dias ---
           Distingue 2 casos:
           a) Item sem cmvSnapshot mas pedido tem cmvTotal → rateio funciona
              (info, persistência incompleta)
           b) Item sem cmvSnapshot E pedido sem cmvTotal → CMV de fato ausente
              (aviso, margem do produto não pode ser calculada) */
        var recent30 = _filterOrders(allOrders, 30).filter(function(o) {
            return VALID_STATUSES.indexOf(o.status) !== -1;
        });
        var cmvAusente = {};   // sem CMV em nenhum lugar
        var cmvRateado = {};   // pedido tem cmvTotal mas item não tem cmvSnapshot
        recent30.forEach(function(o) {
            var orderHasCmv = Number(o.cmvTotal || 0) > 0;
            (o.items || []).forEach(function(item) {
                if (Number(item.cmvSnapshot || 0) > 0) return;
                var pid = item.productId || (item.name || item.sabor || 'sem-id');
                var bucket = orderHasCmv ? cmvRateado : cmvAusente;
                if (!bucket[pid]) bucket[pid] = {
                    name: (item.name || item.sabor || pid), count: 0
                };
                bucket[pid].count++;
            });
        });
        Object.values(cmvAusente).forEach(function(p) {
            alertas.push({
                tipo: 'cmv_zero',
                nivel: 'aviso',
                icon: '⚠️',
                titulo: 'CMV ausente',
                mensagem: '"' + p.name + '" vendido ' + p.count
                          + 'x sem CMV registrado (margem não calculada)',
                contexto: p
            });
        });
        Object.values(cmvRateado).forEach(function(p) {
            alertas.push({
                tipo: 'cmv_rateado',
                nivel: 'info',
                icon: '📊',
                titulo: 'CMV calculado por rateio',
                mensagem: '"' + p.name + '" vendido ' + p.count
                          + 'x com CMV no pedido mas não persistido por item — rateio aplicado',
                contexto: p
            });
        });

        /* --- 3. Produto sem receita vendido (últimos 30 dias) --- */
        var semReceita = {};
        recent30.forEach(function(o) {
            (o.items || []).forEach(function(item) {
                var pid = item.productId;
                if (!pid) return;
                var temReceita = recipeMap[pid]
                    && recipeMap[pid].receita
                    && recipeMap[pid].receita.length > 0;
                if (!temReceita) {
                    if (!semReceita[pid]) semReceita[pid] = {
                        name: (item.name || item.sabor || pid), count: 0
                    };
                    semReceita[pid].count++;
                }
            });
        });
        Object.values(semReceita).forEach(function(p) {
            alertas.push({
                tipo: 'sem_receita',
                nivel: 'aviso',
                icon: '📋',
                titulo: 'Produto sem receita vendido',
                mensagem: '"' + p.name + '" vendido ' + p.count
                          + 'x sem composição (estoque não baixou)',
                contexto: p
            });
        });

        /* --- 4. Pedidos antigos sem histórico de CMV --- */
        var semCMVHistorico = allOrders.filter(function(o) {
            if (VALID_STATUSES.indexOf(o.status) === -1) return false;
            if (Number(o.cmvTotal || 0) > 0) return false;
            return !(o.items && o.items.some(function(i) {
                return Number(i.cmvSnapshot || 0) > 0;
            }));
        });
        if (semCMVHistorico.length > 0) {
            alertas.push({
                tipo: 'sem_cmv_historico',
                nivel: 'info',
                icon: '📊',
                titulo: 'Vendas sem histórico de CMV',
                mensagem: semCMVHistorico.length
                          + ' pedido(s) anteriores à implantação do CMV — excluídos do cálculo de margem',
                contexto: { count: semCMVHistorico.length }
            });
        }

        // Ordena: crítico → aviso → info
        var _lvl = { critico: 0, aviso: 1, info: 2 };
        alertas.sort(function(a, b) {
            return (_lvl[a.nivel] || 9) - (_lvl[b.nivel] || 9);
        });

        return {
            alertas: alertas,
            totalAlertas: alertas.length,
            criticos: alertas.filter(function(a) { return a.nivel === 'critico'; }).length,
            avisos:   alertas.filter(function(a) { return a.nivel === 'aviso'; }).length
        };
    }

    /* ============================================================
       DASHBOARD SUMMARY — alimenta os KPI cards
    ============================================================ */
    function getDashboardSummary(fid, days) {
        var margem  = getMargemPorProduto(fid, days);
        var insumos = getConsumoInsumos(fid, days);
        var alertas = getAlertasOperacionais(fid);
        return {
            lucroTotal:           margem.totalLucro,
            receitaTotal:         margem.totalReceita,
            margemGeral:          margem.margemGeral,
            produtoMaisLucrativo: margem.produtoMaisLucrativo,
            insumoMaisConsumido:  insumos.insumoMaisConsumido,
            totalAlertas:         alertas.totalAlertas,
            criticos:             alertas.criticos,
            ordensAnalisadas:     margem.ordensAnalisadas,
            margem:   margem,
            insumos:  insumos,
            alertas:  alertas
        };
    }

    /* ---- Util: arredondamento ---- */
    function _r2(n) { return Math.round(n * 100)  / 100; }
    function _r1(n) { return Math.round(n * 10)   / 10;  }
    function _r3(n) { return Math.round(n * 1000) / 1000;}

    /* ---- Export ---- */
    global.MarginIntelligence = {
        getMargemPorProduto:      getMargemPorProduto,
        getConsumoInsumos:        getConsumoInsumos,
        getAlertasOperacionais:   getAlertasOperacionais,
        getDashboardSummary:      getDashboardSummary
    };

})(typeof window !== 'undefined' ? window : this);
