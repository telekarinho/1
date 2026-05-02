/* ============================================
   MilkyPot - Módulo de Caixa (PDV auditável)
   ============================================
   Event-log de movimentos por turno, por franquia.
   Cada movimento é imutável; correções geram novo
   movimento type='ajuste'. Toda mutação passa por
   AuditLog. Venda é disparada automaticamente pelo
   pedidos.html quando pedido vira 'entregue'.

   Movimento:
   {
     id, turnoId, dateKey, type, valor, metodo,
     orderId, descricao, motivo, createdAt,
     createdBy, createdByEmail, createdByRole,
     saldoEsperadoNaHora (para auditoria)
   }

   Tipos: abertura | venda | sangria | reforco |
          ajuste | fechamento
   ============================================ */

const Caixa = (function () {
    'use strict';

    const COLLECTION = 'caixa';

    /* ============================================
       HORÁRIO COMERCIAL — validação de abertura/fechamento
       ============================================
       Default: shopping mall hours (10h-22h). Configurável por loja
       via localStorage mp_business_hours_<fid> = {open:"HH:MM", close:"HH:MM"}.
       Tolerância: abrir até 60min antes ou 120min depois sem justificar.
       Fora dessa janela, exige motivo no openShift/closeShift.
       ============================================ */
    const DEFAULT_BUSINESS_HOURS = { open: '10:00', close: '22:00' };
    const TOLERANCE_OPEN_BEFORE_MIN = 60;   // 1h antes da abertura: ok
    const TOLERANCE_OPEN_AFTER_MIN = 120;   // 2h depois da abertura: ok
    const TOLERANCE_CLOSE_BEFORE_MIN = 60;  // 1h antes do fechamento: ok
    const TOLERANCE_CLOSE_AFTER_MIN = 120;  // 2h depois do fechamento: ok

    function getBusinessHours(franchiseId) {
        try {
            var raw = localStorage.getItem('mp_business_hours_' + franchiseId);
            if (raw) {
                var cfg = JSON.parse(raw);
                if (cfg && cfg.open && cfg.close) return cfg;
            }
        } catch(e) {}
        return Object.assign({}, DEFAULT_BUSINESS_HOURS);
    }

    function _hhmmToMinutes(s) {
        var p = (s || '00:00').split(':');
        return (parseInt(p[0],10) || 0) * 60 + (parseInt(p[1],10) || 0);
    }

    // Retorna { ok, reason, currentHHMM, expectedOpen, expectedClose }
    // ok=true se está dentro da janela de tolerância.
    // Fora dela, modal pede justificativa (ver showOpenModal/showCloseModal).
    // Pra desabilitar totalmente: localStorage.setItem('mp_validate_business_hours_<fid>','0')
    function checkBusinessHours(franchiseId, kind /* 'open'|'close' */) {
        var hours = getBusinessHours(franchiseId);
        var now = new Date();
        var hh = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        // Permite desabilitar via flag (escape hatch pra emergência)
        try {
            var disabled = localStorage.getItem('mp_validate_business_hours_' + franchiseId) === '0';
            if (disabled) {
                return { ok: true, currentHHMM: hh, expectedOpen: hours.open, expectedClose: hours.close, validationDisabled: true };
            }
        } catch(_e) {}

        var nowMin = now.getHours() * 60 + now.getMinutes();
        var openMin = _hhmmToMinutes(hours.open);
        var closeMin = _hhmmToMinutes(hours.close);

        if (kind === 'open') {
            var earliest = openMin - TOLERANCE_OPEN_BEFORE_MIN;
            var latest = openMin + TOLERANCE_OPEN_AFTER_MIN;
            if (nowMin >= earliest && nowMin <= latest) {
                return { ok: true, currentHHMM: hh, expectedOpen: hours.open, expectedClose: hours.close };
            }
            var msg = nowMin < earliest
                ? 'Você está abrindo o caixa MUITO ANTES do horário (' + hours.open + '). Agora são ' + hh + '.'
                : 'Você está abrindo o caixa FORA do horário previsto (' + hours.open + '). Agora são ' + hh + '.';
            return { ok: false, reason: msg, currentHHMM: hh, expectedOpen: hours.open, expectedClose: hours.close };
        }
        // kind === 'close'
        var earliest2 = closeMin - TOLERANCE_CLOSE_BEFORE_MIN;
        var latest2 = closeMin + TOLERANCE_CLOSE_AFTER_MIN;
        if (nowMin >= earliest2 && nowMin <= latest2) {
            return { ok: true, currentHHMM: hh, expectedOpen: hours.open, expectedClose: hours.close };
        }
        var msg2 = nowMin < earliest2
            ? 'Você está fechando o caixa ANTES do horário (' + hours.close + '). Agora são ' + hh + '.'
            : 'Você está fechando o caixa MUITO DEPOIS do horário (' + hours.close + '). Agora são ' + hh + '.';
        return { ok: false, reason: msg2, currentHHMM: hh, expectedOpen: hours.open, expectedClose: hours.close };
    }

    /* ============================================
       Cálculo de estado do turno
       ============================================ */
    // Data LOCAL (UTC-3 Brasília) — toISOString() em UTC fazia o caixa
    // "rolar" pra amanhã às 21h locais, bloqueando reabertura no dia seguinte.
    function todayKey() {
        const d = new Date();
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    }

    function turnoIdForDate(dateKey) {
        return 'T-' + (dateKey || todayKey());
    }

    function loadMovements(franchiseId) {
        if (typeof DataStore === 'undefined' || !DataStore.getCollection) return [];
        return DataStore.getCollection(COLLECTION, franchiseId) || [];
    }

    function byDate(moves, dateKey) {
        return moves.filter(m => {
            if (m.dateKey !== dateKey) return false;
            // DEFESA: alguns lançamentos legados foram salvos com dateKey errado
            // (UTC em vez de Brasília) antes do fix de timezone. O createdAt em ISO
            // é sempre confiável — se o local-date dele não bate com o dateKey
            // declarado, filtra fora pra não confundir o caixa do dia.
            if (m.createdAt && typeof Utils !== 'undefined' && Utils && Utils.localDateOf) {
                try {
                    var realLocalDate = Utils.localDateOf(m.createdAt);
                    if (realLocalDate && realLocalDate !== dateKey) return false;
                } catch (e) { /* sem Utils -> confia no dateKey */ }
            }
            return true;
        });
    }

    function getTurnoState(franchiseId, dateKey) {
        dateKey = dateKey || todayKey();
        const all = loadMovements(franchiseId);
        const moves = byDate(all, dateKey).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        const abertura = moves.find(m => m.type === 'abertura');
        const fechamento = moves.find(m => m.type === 'fechamento');
        const vendas = moves.filter(m => m.type === 'venda');
        const sangrias = moves.filter(m => m.type === 'sangria');
        const reforcos = moves.filter(m => m.type === 'reforco');
        const ajustes = moves.filter(m => m.type === 'ajuste');

        // Saldo em dinheiro esperado
        const valorAbertura = abertura ? Number(abertura.valor || 0) : 0;
        const vendasDinheiro = vendas
            .filter(m => m.metodo === 'dinheiro')
            .reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalSangria = sangrias.reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalReforco = reforcos.reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalAjuste = ajustes.reduce((s, m) => s + Number(m.valor || 0), 0);

        const saldoEsperadoDinheiro = valorAbertura + vendasDinheiro + totalReforco - totalSangria + totalAjuste;

        // Faturamento bruto (todos os métodos)
        const faturamentoBruto = vendas.reduce((s, m) => s + Number(m.valor || 0), 0);
        const porMetodo = vendas.reduce((acc, m) => {
            const k = m.metodo || 'nao_informado';
            acc[k] = (acc[k] || 0) + Number(m.valor || 0);
            return acc;
        }, {});

        let status;
        if (!abertura) status = 'nao_aberto';
        else if (fechamento) status = 'fechado';
        else status = 'aberto';

        return {
            dateKey: dateKey,
            turnoId: turnoIdForDate(dateKey),
            status: status,
            abertura: abertura || null,
            fechamento: fechamento || null,
            moves: moves,
            vendas: vendas,
            sangrias: sangrias,
            reforcos: reforcos,
            ajustes: ajustes,
            valorAbertura: valorAbertura,
            vendasDinheiro: vendasDinheiro,
            totalSangria: totalSangria,
            totalReforco: totalReforco,
            totalAjuste: totalAjuste,
            saldoEsperadoDinheiro: saldoEsperadoDinheiro,
            faturamentoBruto: faturamentoBruto,
            porMetodo: porMetodo,
            valorContado: fechamento ? Number(fechamento.valor || 0) : null,
            diferenca: fechamento ? (Number(fechamento.valor || 0) - saldoEsperadoDinheiro) : null,
            motivoQuebra: fechamento ? (fechamento.motivo || '') : ''
        };
    }

    function isShiftOpen(franchiseId) {
        return getTurnoState(franchiseId).status === 'aberto';
    }

    /* ============================================
       Criação de movimentos (imutáveis)
       ============================================ */
    function sessionInfo() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            if (s) return { id: s.userId, name: s.name, email: s.email, role: s.role };
        }
        return { id: 'anonymous', name: 'Sistema', email: null, role: null };
    }

    function createMovement(franchiseId, partial) {
        if (typeof DataStore === 'undefined' || !DataStore.addToCollection) {
            return { success: false, error: 'DataStore indisponível.' };
        }
        const now = new Date();
        const dateKey = partial.dateKey || todayKey();
        const user = sessionInfo();
        const state = getTurnoState(franchiseId, dateKey);

        const move = {
            id: (typeof Utils !== 'undefined' ? Utils.generateId() : Date.now().toString(36)),
            turnoId: turnoIdForDate(dateKey),
            dateKey: dateKey,
            type: partial.type,
            valor: Number(partial.valor || 0),
            metodo: partial.metodo || null,
            orderId: partial.orderId || null,
            descricao: partial.descricao || '',
            motivo: partial.motivo || '',
            createdAt: now.toISOString(),
            createdBy: user.id,
            createdByName: user.name,
            createdByEmail: user.email,
            createdByRole: user.role,
            saldoEsperadoAntes: state.saldoEsperadoDinheiro
        };

        DataStore.addToCollection(COLLECTION, franchiseId, move);
        return { success: true, move: move };
    }

    function audit(event, franchiseId, details) {
        try {
            if (typeof AuditLog !== 'undefined' && AuditLog.log) {
                AuditLog.log(event, details || {}, franchiseId);
            }
        } catch (e) {}
    }

    /* ============================================
       API pública — operações
       ============================================ */
    function openShift(franchiseId, valorAbertura, motivoForaHorario) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        const st = getTurnoState(franchiseId);
        if (st.status === 'aberto') return { success: false, error: 'Já existe um caixa aberto hoje.' };
        if (st.status === 'fechado') return { success: false, error: 'O caixa de hoje já foi fechado. Peça ao gerente para abrir um novo turno.' };
        if (isNaN(valorAbertura) || valorAbertura < 0) return { success: false, error: 'Valor de abertura inválido.' };

        // === HORÁRIO COMERCIAL ===
        var hourCheck = checkBusinessHours(franchiseId, 'open');
        if (!hourCheck.ok) {
            if (!motivoForaHorario || !motivoForaHorario.trim()) {
                return {
                    success: false,
                    error: hourCheck.reason,
                    requiresReason: true,
                    reasonField: 'motivoForaHorario',
                    hourCheck: hourCheck
                };
            }
            // Justificativa fornecida — registra
            audit('CAIXA_OPENED_OFF_HOURS', franchiseId, {
                hora: hourCheck.currentHHMM,
                horarioPrevisto: hourCheck.expectedOpen,
                motivo: motivoForaHorario
            });
        }

        const r = createMovement(franchiseId, {
            type: 'abertura',
            valor: valorAbertura,
            descricao: 'Abertura de caixa' + (motivoForaHorario ? ' (fora do horário · ' + motivoForaHorario + ')' : ''),
            motivo: motivoForaHorario || ''
        });
        if (!r.success) return r;
        audit(AuditLog.EVENTS.CAIXA_OPENED, franchiseId, { valor: valorAbertura, turnoId: r.move.turnoId, motivoForaHorario: motivoForaHorario || null });

        if (typeof Motivacional !== 'undefined' && Motivacional.toastCaixaAberto) {
            Motivacional.toastCaixaAberto();
        }
        return r;
    }

    /**
     * Fecha o turno do dia.
     * @param {string} franchiseId
     * @param {number} valorContado - dinheiro fisico contado (sem troco)
     * @param {string} motivoQuebra - obrigatorio se |diff|>5
     * @param {string} motivoForaHorario - obrigatorio se fora do horario
     * @param {object} [extras] - opcional: breakdown completo conferido pelo
     *   operador (pix, cartoes por maquininha, dinheiro, troco). NAO altera
     *   contrato de retorno; eh apenas anexado ao audit e ao email.
     *   { conferidoPix, conferidoCredito, conferidoDebito, maquininhas: [{label,credito,debito}],
     *     dinheiroContadoTotal, troco, sangrias, observacoes }
     */
    function closeShift(franchiseId, valorContado, motivoQuebra, motivoForaHorario, extras) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        const st = getTurnoState(franchiseId);
        if (st.status === 'nao_aberto') return { success: false, error: 'Nenhum caixa aberto hoje.' };
        if (st.status === 'fechado') return { success: false, error: 'O caixa de hoje já foi fechado.' };

        // === HORÁRIO COMERCIAL ===
        var hourCheck = checkBusinessHours(franchiseId, 'close');
        if (!hourCheck.ok) {
            if (!motivoForaHorario || !motivoForaHorario.trim()) {
                return {
                    success: false,
                    error: hourCheck.reason,
                    requiresReason: true,
                    reasonField: 'motivoForaHorario',
                    hourCheck: hourCheck
                };
            }
            audit('CAIXA_CLOSED_OFF_HOURS', franchiseId, {
                hora: hourCheck.currentHHMM,
                horarioPrevisto: hourCheck.expectedClose,
                motivo: motivoForaHorario
            });
        }

        // AUTO-FINALIZAR pedidos de DIAS ANTERIORES — quando opera-
        // dor fecha o caixa, tudo que ficou aberto de outros dias eh
        // marcado como 'entregue' silenciosamente. Operador pediu:
        // "ja era passou ao finalizar caixa devem sumir, ficar so no
        // historico". Pedidos de HOJE seguem bloqueando (precisa
        // finalizar manual ou via "Encerrar Dia").
        const orders = DataStore.getCollection('orders', franchiseId) || [];
        const today = new Date(Date.now() - new Date().getTimezoneOffset()*60000)
            .toISOString().slice(0,10);
        function _localDateOf(iso) {
            if (!iso) return '';
            try {
                var d = new Date(iso);
                if (isNaN(d.getTime())) return '';
                return new Date(d.getTime() - d.getTimezoneOffset()*60000)
                    .toISOString().slice(0,10);
            } catch(e) { return ''; }
        }
        const openStatuses = ['novo','confirmado','preparando','pronto','em_entrega'];
        let autoFinalizedCount = 0;
        const tsAutoFinalize = new Date().toISOString();
        orders.forEach(function(o, idx) {
            if (!o || o.deleted) return;
            if (!openStatuses.includes(o.status)) return;
            var localCreated = _localDateOf(o.createdAt);
            // So finaliza pedidos de DIAS ANTERIORES (createdAt < hoje)
            if (!localCreated || localCreated >= today) return;
            orders[idx].status = 'entregue';
            orders[idx].updatedAt = tsAutoFinalize;
            orders[idx].finalizedByCaixaClose = true;
            orders[idx].finalizedAt = tsAutoFinalize;
            autoFinalizedCount++;
        });
        if (autoFinalizedCount > 0) {
            DataStore.set('orders_' + franchiseId, orders);
            try { audit('ORDERS_AUTO_FINALIZED_ON_CLOSE', franchiseId, {
                count: autoFinalizedCount, today: today
            }); } catch(e){}
        }

        // REGRA DE SEGURANÇA: Bloquear se houver pedidos pendentes de HOJE
        // (operador deve finalizar manualmente ou via "Encerrar Dia").
        // Pedidos de DIAS ANTERIORES ja foram auto-finalizados acima.
        const pendingOrders = orders.filter(o => {
            if (!o) return false;
            if (o.deleted) return false;
            if (o.status === 'entregue' || o.status === 'cancelado') return false;
            if (o.status === 'aguardando_pagamento') return false;
            var lc = _localDateOf(o.createdAt);
            // BUG-FIX: pedidos sem createdAt (lc='') eram contados como
            // pendentes — geralmente sao seeds antigos / lixo no localStorage.
            // Agora ignoramos: se nao tem data, nao bloqueia o fechamento.
            if (!lc) return false;
            if (lc !== today) return false;
            return true;
        });
        if (pendingOrders.length > 0) {
            // Lista os pedidos pendentes pra o operador identificar (ate 5)
            const lista = pendingOrders.slice(0, 5).map(o => {
                const seq = o.dailySeq ? '#' + o.dailySeq : '#' + String(o.id || '').slice(-6);
                const cliente = (o.customer && o.customer.name) || 'Balcao';
                const status = o.status || '?';
                const valor = formatBRL(o.total || 0);
                return '  • ' + seq + ' (' + status + ') · ' + cliente + ' · ' + valor;
            }).join('\n');
            const extra = pendingOrders.length > 5 ? '\n  ...e mais ' + (pendingOrders.length - 5) : '';
            return {
                success: false,
                error: '⚠️ ' + pendingOrders.length + ' pedido(s) pendente(s) HOJE bloqueando o fechamento:\n' + lista + extra +
                       '\n\nVá em Pedidos (F9) e marque como Entregue ou Cancelado, depois feche o caixa.',
                pendingOrders: pendingOrders.map(o => ({ id: o.id, dailySeq: o.dailySeq, status: o.status, total: o.total, customer: (o.customer || {}).name }))
            };
        }

        // REGRA DE SEGURANÇA: Bloquear se houver comandas/contas abertas
        // Le do pdv_tabs_FID (chave real usada pelo PDV) — filtra tombstones
        // (deleted: true). open_tabs_FID era chave legada, ficava sempre vazia.
        const openTabsAll = DataStore.get('pdv_tabs_' + franchiseId) || [];
        const openTabs = openTabsAll.filter(function(t){ return t && !t.deleted; });
        if (openTabs.length > 0) {
            return {
                success: false,
                error: `⚠️ Existem ${openTabs.length} conta(s) aberta(s). Feche todas antes de encerrar o turno.`
            };
        }

        if (isNaN(valorContado) || valorContado < 0) return { success: false, error: 'Valor contado inválido.' };

        const diff = valorContado - st.saldoEsperadoDinheiro;
        if (Math.abs(diff) > 5 && !(motivoQuebra && motivoQuebra.trim())) {
            return { success: false, error: '⚠️ Diferença maior que R$ 5,00 exige justificativa obrigatória.', diff: diff, esperado: st.saldoEsperadoDinheiro };
        }

        const r = createMovement(franchiseId, {
            type: 'fechamento',
            valor: valorContado,
            descricao: 'Fechamento de caixa · esperado ' + formatBRL(st.saldoEsperadoDinheiro),
            motivo: motivoQuebra || ''
        });
        if (!r.success) return r;
        audit(AuditLog.EVENTS.CAIXA_CLOSED, franchiseId, {
            valorContado: valorContado,
            saldoEsperado: st.saldoEsperadoDinheiro,
            diferenca: diff,
            motivo: motivoQuebra || '',
            extras: extras || null
        });

        if (typeof Motivacional !== 'undefined' && Motivacional.toastCaixaFechado) {
            Motivacional.toastCaixaFechado();
        }

        // Trigger Automated Report via Cloud Functions (3 emails fixos:
        // milkypot.com / jocimarrodrigo / joseanemse — definidos em
        // cloud-functions.js sendClosingReport)
        try {
            if (typeof CloudFunctions !== 'undefined' && CloudFunctions.sendClosingReport) {
                const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
                CloudFunctions.sendClosingReport(franchiseId, {
                    operatorName: session ? session.name : 'Operador Desconhecido',
                    operatorEmail: session ? session.email : '',
                    valorContado: valorContado,
                    saldoEsperado: st.saldoEsperadoDinheiro,
                    diferenca: diff,
                    motivo: motivoQuebra,
                    fechamentoDate: new Date().toISOString(),
                    // Dados extras conferidos pelo operador (opcional — vem do
                    // novo modal interativo). Backward-compatible: se null,
                    // o relatorio funciona como antes.
                    porMetodoEsperado: st.porMetodo || {},
                    faturamentoBruto: st.faturamentoBruto || 0,
                    valorAbertura: st.valorAbertura || 0,
                    vendasDinheiro: st.vendasDinheiro || 0,
                    totalSangria: st.totalSangria || 0,
                    totalReforco: st.totalReforco || 0,
                    breakdownConferido: extras || null
                });
            }
        } catch (e) {
            console.error('Falha ao acionar CloudFunctions (sendClosingReport):', e);
        }

        return Object.assign({}, r, { diff: diff, esperado: st.saldoEsperadoDinheiro });
    }

    function registerSale(franchiseId, order) {
        if (!franchiseId || !order) return { success: false, error: 'Dados inválidos.' };
        // Evita duplicidade: se já existe venda com este orderId, ignora
        const existing = loadMovements(franchiseId).find(m => m.type === 'venda' && m.orderId === order.id);
        if (existing) return { success: true, move: existing, alreadyRegistered: true };

        const metodo = normalizeMetodo(order.payment);
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') {
            // registra mesmo assim, mas sinaliza
            const r = createMovement(franchiseId, {
                type: 'venda',
                valor: Number(order.total || 0),
                metodo: metodo,
                orderId: order.id,
                descricao: 'Venda pedido #' + String(order.id).slice(-6) + ' (caixa não aberto)',
                motivo: 'Pedido entregue fora de turno aberto'
            });
            audit(AuditLog.EVENTS.CAIXA_SALE, franchiseId, {
                orderId: order.id, valor: order.total, metodo: metodo,
                warn: 'caixa_nao_aberto'
            });
            return Object.assign({}, r, { warn: 'caixa_nao_aberto' });
        }

        const r = createMovement(franchiseId, {
            type: 'venda',
            valor: Number(order.total || 0),
            metodo: metodo,
            orderId: order.id,
            descricao: 'Venda pedido #' + String(order.id).slice(-6)
        });
        audit(AuditLog.EVENTS.CAIXA_SALE, franchiseId, {
            orderId: order.id, valor: order.total, metodo: metodo
        });
        return r;
    }

    function registerSangria(franchiseId, valor, motivo) {
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') return { success: false, error: 'Abra o caixa antes de lançar uma sangria.' };
        if (isNaN(valor) || valor <= 0) return { success: false, error: 'Valor inválido.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório.' };
        if (valor > st.saldoEsperadoDinheiro) return { success: false, error: 'Sangria maior que o saldo em dinheiro esperado (' + formatBRL(st.saldoEsperadoDinheiro) + ').' };

        const r = createMovement(franchiseId, {
            type: 'sangria',
            valor: valor,
            descricao: 'Sangria · ' + motivo,
            motivo: motivo
        });
        audit(AuditLog.EVENTS.CAIXA_SANGRIA, franchiseId, { valor: valor, motivo: motivo });
        return r;
    }

    function registerReforco(franchiseId, valor, motivo) {
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') return { success: false, error: 'Abra o caixa antes de lançar um reforço.' };
        if (isNaN(valor) || valor <= 0) return { success: false, error: 'Valor inválido.' };

        const r = createMovement(franchiseId, {
            type: 'reforco',
            valor: valor,
            descricao: 'Reforço · ' + (motivo || 'Troco'),
            motivo: motivo || ''
        });
        audit(AuditLog.EVENTS.CAIXA_REFORCO, franchiseId, { valor: valor, motivo: motivo || '' });
        return r;
    }

    function registerAjuste(franchiseId, valor, motivo) {
        // Somente super_admin / manager pode ajustar
        const user = sessionInfo();
        const allowedRoles = ['super_admin', 'manager', 'franchisee'];
        if (allowedRoles.indexOf(user.role) === -1) return { success: false, error: 'Sem permissão para ajuste.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório para ajuste.' };
        if (isNaN(valor)) return { success: false, error: 'Valor inválido.' };

        const r = createMovement(franchiseId, {
            type: 'ajuste',
            valor: valor,
            descricao: 'Ajuste · ' + motivo,
            motivo: motivo
        });
        audit(AuditLog.EVENTS.CAIXA_AJUSTE, franchiseId, { valor: valor, motivo: motivo });
        return r;
    }

    /* ============================================
       UI — modais próprios (sem prompt())
       ============================================ */
    function ensureModalStyles() {
        if (document.getElementById('caixaModalStyles')) return;
        const css = `
.caixa-modal-overlay { position: fixed; inset: 0; background: rgba(45,27,78,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: caixaFadeIn .18s ease-out; }
.caixa-modal { background: #fff; border-radius: 16px; max-width: 440px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden; animation: caixaSlideUp .2s ease-out; }
.caixa-modal-header { padding: 18px 22px; background: linear-gradient(135deg,#E91E63,#D4A5FF); color: #fff; display: flex; justify-content: space-between; align-items: center; }
.caixa-modal-header h3 { margin: 0; font-size: 1.05rem; font-family: 'Baloo 2', cursive; font-weight: 700; }
.caixa-modal-close { background: rgba(255,255,255,.2); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; }
.caixa-modal-body { padding: 20px 22px; }
.caixa-modal-body label { display: block; font-size: .8rem; font-weight: 600; color: #555; margin-bottom: 6px; margin-top: 12px; }
.caixa-modal-body label:first-child { margin-top: 0; }
.caixa-modal-body input, .caixa-modal-body select, .caixa-modal-body textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; box-sizing: border-box; }
.caixa-modal-body input:focus, .caixa-modal-body select:focus, .caixa-modal-body textarea:focus { outline: none; border-color: #E91E63; }
.caixa-modal-body textarea { min-height: 70px; resize: vertical; }
.caixa-modal-body .caixa-brl { font-size: 1.5rem; text-align: center; font-weight: 700; color: #2E7D32; }
.caixa-modal-body .caixa-info { background: #F8F9FA; border-left: 3px solid #E91E63; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #555; margin-top: 10px; }
.caixa-modal-body .caixa-warn { background: #FFF3CD; border-left: 3px solid #F59E0B; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #92400E; margin-top: 10px; }
.caixa-modal-body .caixa-danger { background: #FEE2E2; border-left: 3px solid #DC2626; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #991B1B; margin-top: 10px; }
.caixa-modal-footer { display: flex; gap: 10px; padding: 14px 22px; border-top: 1px solid #eee; background: #fafafa; }
.caixa-modal-footer button { flex: 1; padding: 11px 16px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: .92rem; }
.caixa-modal-footer .caixa-btn-primary { background: #E91E63; color: #fff; }
.caixa-modal-footer .caixa-btn-danger { background: #DC2626; color: #fff; }
.caixa-modal-footer .caixa-btn-secondary { background: #eee; color: #333; }
@keyframes caixaFadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes caixaSlideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`;
        const style = document.createElement('style');
        style.id = 'caixaModalStyles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function openModal(html, onConfirm) {
        ensureModalStyles();
        const overlay = document.createElement('div');
        overlay.className = 'caixa-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('[data-caixa-close]').forEach(el => el.addEventListener('click', close));

        const firstInput = overlay.querySelector('input[data-caixa-brl], input[type="text"], select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 50);

        // máscara BRL
        overlay.querySelectorAll('input[data-caixa-brl]').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const digits = (e.target.value || '').replace(/\D/g, '');
                const cents = parseInt(digits || '0', 10);
                const reais = cents / 100;
                e.target.value = formatBRL(reais);
            });
            if (!inp.value) inp.value = formatBRL(0);
        });

        const confirmBtn = overlay.querySelector('[data-caixa-confirm]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const data = {};
                overlay.querySelectorAll('[data-name]').forEach(el => {
                    const name = el.dataset.name;
                    let v;
                    // Checkbox e radio: usa .checked (booleano), nao .value (sempre 'on')
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        v = !!el.checked;
                    } else {
                        v = el.value;
                        if (el.dataset.caixaBrl !== undefined) v = parseBRL(v);
                    }
                    data[name] = v;
                });
                const res = onConfirm && onConfirm(data);
                if (res !== false) close();
            });
        }

        return { close: close, overlay: overlay };
    }

    function showOpenModal(franchiseId, cb) {
        // Se houver checklist configurado e ainda não executado hoje, exibe antes
        if (shouldShowChecklist('abertura', franchiseId)) {
            return showChecklistModal(franchiseId, 'abertura', () => {
                showOpenModal(franchiseId, cb);
            });
        }

        // Pre-check do horário: se fora, já mostra textarea de justificativa
        var hourCheck = checkBusinessHours(franchiseId, 'open');
        var offHoursWarning = !hourCheck.ok ? `
            <div style="background:#FFF3E0;border:2px solid #FB8C00;color:#E65100;padding:12px;border-radius:8px;margin:10px 0;font-weight:600">
                ⏰ <strong>Fora do horário comercial</strong><br>
                <small style="font-weight:400">${hourCheck.reason || 'Horário previsto: ' + hourCheck.expectedOpen}</small>
            </div>
            <label style="margin-top:8px"><strong>Justificativa (obrigatória)</strong></label>
            <textarea data-name="motivoForaHorario" placeholder="Ex: shopping abriu mais cedo, evento, treinamento..." rows="2" style="width:100%;padding:10px;border:2px solid #FB8C00;border-radius:8px;font-family:inherit;font-size:14px"></textarea>
        ` : '';

        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Abrir caixa">
              <div class="caixa-modal-header">
                <h3>💰 Abrir caixa</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Valor de abertura (troco inicial)</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric" placeholder="R$ 0,00">
                <div class="caixa-info">💡 Registre o valor em dinheiro no caixa antes de começar o turno. Esse será o saldo inicial para conferência no fechamento.</div>
                ${offHoursWarning}
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Abrir caixa</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            // Se fora do horário e textarea vazia, bloqueia
            if (!hourCheck.ok) {
                var motivo = (data.motivoForaHorario || '').trim();
                if (motivo.length < 3) {
                    const err = modal.overlay.querySelector('[data-caixa-error]');
                    err.textContent = '⚠️ Justificativa obrigatória (mínimo 3 caracteres).';
                    err.style.display = 'block';
                    return false;
                }
                var r = openShift(franchiseId, data.valor, motivo);
            } else {
                var r = openShift(franchiseId, data.valor);
            }
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    function shouldShowChecklist(phase, franchiseId) {
        if (typeof AdminConfig === 'undefined') return false;
        const tpls = AdminConfig.getChecklistTemplates(franchiseId);
        if (!tpls[phase] || tpls[phase].length === 0) return false;
        const exec = AdminConfig.getTodayChecklistExec(franchiseId, phase);
        return !exec; // só mostra se ainda não foi executado hoje
    }

    function showChecklistModal(franchiseId, phase, onDone) {
        const tpls = AdminConfig.getChecklistTemplates(franchiseId);
        const items = (tpls[phase] || []).map(i => Object.assign({}, i, { done: false }));
        const isAbertura = phase === 'abertura';
        const headerGradient = isAbertura
            ? 'linear-gradient(135deg,#10B981,#059669)'
            : 'linear-gradient(135deg,#DC2626,#991B1B)';
        const headerIcon = isAbertura ? '🟢' : '🔴';
        const headerTitle = isAbertura ? 'Checklist de abertura' : 'Checklist de fechamento';

        const rowsHtml = items.map((it, i) => `
            <label style="display:flex;gap:10px;padding:10px 12px;align-items:center;background:#FAFAFA;border:1px solid #eee;border-radius:8px;margin-bottom:6px;cursor:pointer">
              <input type="checkbox" data-idx="${i}" ${it.required ? 'data-required="1"' : ''} style="width:18px;height:18px;cursor:pointer">
              <span style="flex:1">${(typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml(it.text) : it.text}${it.required ? ' <small style="color:#DC2626">*</small>' : ''}</span>
            </label>
        `).join('');

        const html = `
            <div class="caixa-modal" role="dialog" style="max-width:520px">
              <div class="caixa-modal-header" style="background:${headerGradient}">
                <h3>${headerIcon} ${headerTitle}</h3>
                <button class="caixa-modal-close" data-caixa-close>✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-info">Marque o que já foi feito. Itens com <strong style="color:#DC2626">*</strong> são obrigatórios e ficam registrados na auditoria.</div>
                <div style="margin-top:12px" id="checklistItems">${rowsHtml}</div>
                <div class="caixa-warn" data-checklist-warn style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" id="checklistConfirmBtn">Continuar</button>
              </div>
            </div>`;

        ensureModalStyles();
        const overlay = document.createElement('div');
        overlay.className = 'caixa-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('[data-caixa-close]').forEach(el => el.addEventListener('click', close));
        overlay.querySelector('#checklistConfirmBtn').addEventListener('click', () => {
            const boxes = Array.from(overlay.querySelectorAll('#checklistItems input[type=checkbox]'));
            const result = boxes.map((b, i) => Object.assign({}, items[i], { done: b.checked }));
            const missingRequired = result.filter(r => r.required && !r.done);
            
            if (missingRequired.length > 0) {
                const warn = overlay.querySelector('[data-checklist-warn]');
                warn.innerHTML = '⚠️ Faltam itens obrigatórios: <strong>' + missingRequired.map(r => r.text).join(', ') + '</strong>.';
                warn.style.display = 'block';
                
                const userSession = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
                const role = userSession ? userSession.role : 'operator';
                
                if (role !== 'super_admin' && role !== 'franchisee' && role !== 'manager') {
                    alert('❌ AÇÃO BLOQUEADA\nVocê não concluiu todos os itens obrigatórios do checklist. Apenas o gerente pode forçar este avanço.');
                    return;
                } else {
                    const justificativa = prompt('⚠️ AUTORIZAÇÃO DE GERÊNCIA\n\nExistem ' + missingRequired.length + ' item(ns) obrigatório(s) pendente(s).\n\nInforme o motivo para forçar o fechamento/avanço:');
                    if (!justificativa || justificativa.trim().length < 3) {
                        alert('Justificativa obrigatória cancelada.');
                        return;
                    }
                    if (typeof AuditLog !== 'undefined') {
                        AuditLog.log('CHECKLIST_BYPASSED', { phase, justificativa, missingCount: missingRequired.length, missingItems: missingRequired.map(r => r.text) }, franchiseId);
                    }
                }
            }
            AdminConfig.recordChecklistExec(franchiseId, phase, result);
            close();
            if (onDone) onDone();
        });
    }

    // Labels amigaveis pros metodos de pagamento (chaves vindas do PDV)
    function _metodoLabel(k) {
        const map = {
            dinheiro: '💵 Dinheiro',
            pix: '📱 PIX',
            cartao_credito: '💳 Cartão Crédito',
            credito: '💳 Cartão Crédito',
            cartao_debito: '💳 Cartão Débito',
            debito: '💳 Cartão Débito',
            cartao: '💳 Cartão',
            voucher: '🎟️ Voucher',
            cortesia: '🎁 Cortesia',
            ifood: '🛵 iFood',
            nao_informado: '❓ Não informado'
        };
        return map[k] || ('💼 ' + k);
    }

    // Renderiza HTML com breakdown de vendas por metodo de pagamento.
    // Usado tanto no modal inicial quanto na confirmacao dupla.
    function _renderPagamentosBreakdown(st) {
        const metodos = Object.keys(st.porMetodo || {});
        if (!metodos.length) {
            return '<div style="padding:10px;color:#999;text-align:center;font-style:italic">Nenhuma venda registrada hoje</div>';
        }
        // Ordena: dinheiro primeiro, depois decrescente por valor
        metodos.sort((a, b) => {
            if (a === 'dinheiro') return -1;
            if (b === 'dinheiro') return 1;
            return (st.porMetodo[b] || 0) - (st.porMetodo[a] || 0);
        });
        const rows = metodos.map(k => {
            const v = st.porMetodo[k] || 0;
            return '<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:14px">' +
                '<span>' + _metodoLabel(k) + '</span>' +
                '<strong style="color:#2E7D32">' + formatBRL(v) + '</strong>' +
                '</div>';
        }).join('');
        return '<div style="border:1px solid #e0e0e0;border-radius:8px;background:#fafafa;margin:8px 0">' +
            rows +
            '<div style="display:flex;justify-content:space-between;padding:10px;background:#E8F5E9;border-top:2px solid #4CAF50;font-weight:700;font-size:15px">' +
              '<span>TOTAL FATURADO</span>' +
              '<span style="color:#1B5E20">' + formatBRL(st.faturamentoBruto) + '</span>' +
            '</div></div>';
    }

    function showCloseModal(franchiseId, cb) {
        // Checklist de fechamento antes do modal de valor
        if (shouldShowChecklist('fechamento', franchiseId)) {
            return showChecklistModal(franchiseId, 'fechamento', () => {
                showCloseModal(franchiseId, cb);
            });
        }
        return _showCloseModalV2(franchiseId, cb);
    }

    /* ============================================
       V2 (modal interativo) — substitui o modal antigo de fechamento.
       Mantem a mesma assinatura externa (showCloseModal), apenas troca a UI:
         - Inputs editaveis por metodo (PIX, Credito M1, Credito M2, Debito M1,
           Debito M2, Dinheiro contado, Troco)
         - Mostra esperado vs contado em tempo real e calcula diferenca
         - Justificativa so eh obrigatoria quando ha diferenca > R$ 5
         - Apos confirmar, dispara closeShift normalmente + envia relatorio
           (tenta CloudFunctions, salva sempre no Firestore audit, e tem
           fallback mailto: pra abrir o cliente de email do operador)
       ============================================ */
    function _showCloseModalV2(franchiseId, cb) {
        const st = getTurnoState(franchiseId);
        const hourCheckClose = checkBusinessHours(franchiseId, 'close');

        // Agrega valores esperados normalizando TODAS as chaves de porMetodo.
        // Antes: chaves com acento ('crédito') nao batiam com lookup ('credito')
        // -> esperado aparecia R$ 0,00 e operador nao confiava.
        function _aggExpected(porMetodo) {
            const agg = { cartao: 0, pix: 0, dinheiro: 0, _outros: 0 };
            Object.keys(porMetodo || {}).forEach(k => {
                const v = Number(porMetodo[k] || 0);
                const norm = normalizeMetodo(k);
                if (norm === 'pix') agg.pix += v;
                else if (norm === 'dinheiro') agg.dinheiro += v;
                else if (norm === 'credito' || norm === 'debito') agg.cartao += v;
                else agg._outros += v; // [object object], nao_informado, etc
            });
            return agg;
        }
        const exp = _aggExpected(st.porMetodo);
        // O Z-relatorio das maquininhas ja vem com cartao somado (cred+deb),
        // entao operador nao precisa separar. Mantem compatibilidade:
        const espCartao   = exp.cartao;
        const espPix      = exp.pix;
        const espDinheiro = exp.dinheiro || Number(st.vendasDinheiro || 0);
        const saldoEsperadoDinheiro = Number(st.saldoEsperadoDinheiro || 0);

        // Aviso de vendas com metodo invalido (geralmente pedido teste antigo)
        const polluted = Object.keys(st.porMetodo || {}).filter(k =>
            k && (k.indexOf('object') !== -1 || normalizeMetodo(k) === 'nao_informado')
        );
        let pollutedHtml = '';
        if (polluted.length) {
            const totalPoll = polluted.reduce((s, k) => s + Number(st.porMetodo[k] || 0), 0);
            pollutedHtml =
              '<div style="background:#FEF3C7;border:1px solid #F59E0B;color:#92400E;padding:6px 10px;border-radius:6px;margin:0 0 8px;font-size:11px">' +
                '⚠️ ' + formatBRL(totalPoll) + ' de vendas teste antigas — ignore' +
              '</div>';
        }

        const offHoursCloseWarning = !hourCheckClose.ok ? `
            <div style="background:#FFF3E0;border:2px solid #FB8C00;color:#E65100;padding:10px;border-radius:8px;margin:8px 0;font-weight:600;font-size:13px">
                ⏰ <strong>Fora do horário</strong>
                <div style="font-weight:400;margin-top:2px">${hourCheckClose.reason || 'Previsto: ' + hourCheckClose.expectedClose}</div>
            </div>
            <label style="margin-top:6px;font-size:13px"><strong>Justificativa de horário (obrigatória)</strong></label>
            <textarea data-name="motivoForaHorario" placeholder="Ex: shopping fechou cedo, sem movimento..." rows="2" style="width:100%;padding:8px;border:2px solid #FB8C00;border-radius:6px;font-family:inherit;font-size:13px"></textarea>
        ` : '';

        // === MODO SIMPLES (default): 3 cards (Cartão, PIX, Dinheiro). ===
        // Cada card tem 2 botoes GRANDES: "✓ Tá certo" (verde) ou
        // "✏️ Não bate" (laranja). Confere = aceita o esperado.
        // Não bate = expande input pra digitar valor real e mostra diff.
        // Botão FECHAR fica DESABILITADO ate todos resolvidos.

        const cv2Style = ''+
          '<style>' +
            '.cv2-modal{max-width:560px!important;max-height:92vh;display:flex;flex-direction:column;border-radius:16px;overflow:hidden}' +
            '.cv2-modal .caixa-modal-body{padding:14px 16px!important;background:#f9fafb;overflow-y:auto;flex:1;min-height:0}' +
            '.cv2-modal .caixa-modal-header{padding:12px 16px!important}' +
            '.cv2-modal .caixa-modal-header h3{font-size:17px!important;margin:0!important}' +
            '.cv2-modal .caixa-modal-footer{padding:10px 14px!important;flex-shrink:0;display:flex;gap:8px;background:#fff;border-top:1px solid #e5e7eb}' +
            '.cv2-card{background:#fff;border:2px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin-bottom:10px;transition:all .15s}' +
            '.cv2-card.ok{border-color:#10B981;background:#ECFDF5}' +
            '.cv2-card.editing{border-color:#F59E0B;background:#FFFBEB}' +
            '.cv2-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}' +
            '.cv2-card-icon{font-size:24px;line-height:1}' +
            '.cv2-card-name{font-size:15px;font-weight:800;color:#111827}' +
            '.cv2-card-esperado{font-size:22px;font-weight:900;color:#111827;letter-spacing:-.5px;line-height:1}' +
            '.cv2-card-esp-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}' +
            '.cv2-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
            '.cv2-btn{padding:11px 8px;border-radius:8px;font-weight:800;cursor:pointer;border:2px solid;font-size:13px;transition:all .12s;text-align:center}' +
            '.cv2-btn-ok{background:#10B981;color:#fff;border-color:#10B981}' +
            '.cv2-btn-ok:hover{background:#059669;border-color:#059669}' +
            '.cv2-btn-naobate{background:#fff;color:#92400E;border-color:#F59E0B}' +
            '.cv2-btn-naobate:hover{background:#FFFBEB}' +
            '.cv2-card.ok .cv2-btn-ok{background:#10B981;color:#fff}' +
            '.cv2-card.ok .cv2-btn-naobate{background:#fff;color:#92400E;border-color:#F59E0B;opacity:.6}' +
            '.cv2-card.editing .cv2-btn-naobate{background:#F59E0B;color:#fff}' +
            '.cv2-card.editing .cv2-btn-ok{background:#fff;color:#10B981;opacity:.6}' +
            '.cv2-edit-area{margin-top:10px;padding-top:10px;border-top:1px dashed #F59E0B}' +
            '.cv2-edit-area input{width:100%;padding:10px 12px;border:2px solid #F59E0B;border-radius:8px;font-weight:800;text-align:right;font-size:18px;background:#fff}' +
            '.cv2-diff-msg{margin-top:8px;font-size:13px;font-weight:600;text-align:center;padding:8px 10px;border-radius:6px;line-height:1.4}' +
            '.cv2-diff-ok{background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7}' +
            '.cv2-diff-pequena{background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0}' +
            '.cv2-diff-faltou{background:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5}' +
            '.cv2-diff-sobrou{background:#FFEDD5;color:#9A3412;border:1px solid #FDBA74}' +
            '.cv2-card.ok .cv2-card-status::before{content:"✓ confere";font-size:11px;font-weight:800;color:#065F46;background:#A7F3D0;padding:3px 8px;border-radius:99px}' +
            '.cv2-card.editing .cv2-card-status::before{content:"✏️ ajustando";font-size:11px;font-weight:800;color:#92400E;background:#FDE68A;padding:3px 8px;border-radius:99px}' +
            '.cv2-card .cv2-card-status::before{content:"⚠ confira";font-size:11px;font-weight:800;color:#92400E;background:#FEF3C7;padding:3px 8px;border-radius:99px}' +
            '.cv2-btn-final{flex:1;padding:14px;font-size:16px;font-weight:900;border-radius:10px;border:none;cursor:pointer;transition:all .15s}' +
            '.cv2-btn-final:disabled{background:#d1d5db!important;color:#6b7280!important;cursor:not-allowed}' +
            '.cv2-btn-final-ok{background:#10B981;color:#fff}' +
            '.cv2-btn-final-ok:hover:not(:disabled){background:#059669}' +
            '.cv2-btn-cancel{background:#fff;color:#6b7280;border:2px solid #d1d5db;padding:14px 18px;font-weight:700;border-radius:10px;cursor:pointer}' +
            '.cv2-progress{display:flex;gap:4px;margin-bottom:12px}' +
            '.cv2-progress-dot{flex:1;height:6px;border-radius:3px;background:#e5e7eb;transition:background .2s}' +
            '.cv2-progress-dot.done{background:#10B981}' +
            '.cv2-dinheiro-extra{margin-top:8px;padding-top:8px;border-top:1px dashed #d1d5db}' +
            '.cv2-dinheiro-extra label{font-size:12px;color:#6b7280;display:block;margin-bottom:3px}' +
            '.cv2-dinheiro-extra input{width:100%;padding:8px 10px;border:1.5px solid #d1d5db;border-radius:6px;font-weight:700;text-align:right;font-size:14px}' +
          '</style>';

        // Helper: gera card (Cartão / PIX / Dinheiro)
        // Helper: gera card com campos editaveis customizaveis quando "Não bate"
        // fields = array de { name, label, default } — quando expandido vai
        // gerar 1 input por campo, e a SOMA deles vira o valor conferido.
        // Pra cartao: 2 maquininhas. Pra PIX: 2 maquininhas + banco direto.
        // Pra dinheiro: 1 input (total contado) - depois trata troco separado.
        function _card(key, icon, name, esperado, hint, fields) {
            // Default: 1 campo unico (compatibilidade)
            const flds = fields || [{ name: 'conf_'+key, label: 'Quanto realmente entrou?', default: esperado }];
            const inputsHtml = flds.map(f => ''+
                '<div style="margin-bottom:6px">' +
                  '<label style="font-size:11px;color:#6b7280;display:block;margin-bottom:2px;font-weight:600">'+f.label+'</label>' +
                  '<input type="text" class="caixa-brl cv2-edit-input" data-caixa-brl data-name="'+f.name+'" data-card-field="'+key+'" inputmode="numeric" '+
                    'value="'+formatBRL(f.default || 0)+'" '+
                    'style="width:100%;padding:8px 10px;border:2px solid #F59E0B;border-radius:6px;font-weight:800;text-align:right;font-size:15px;background:#fff">' +
                '</div>'
            ).join('');
            return ''+
            '<div class="cv2-card" data-card="'+key+'" data-esperado-num="'+esperado+'">' +
              '<div class="cv2-card-head">' +
                '<div style="display:flex;align-items:center;gap:10px">' +
                  '<span class="cv2-card-icon">'+icon+'</span>' +
                  '<div>' +
                    '<div class="cv2-card-name">'+name+'</div>' +
                    '<div class="cv2-card-status" style="margin-top:3px"></div>' +
                  '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                  '<div class="cv2-card-esp-label">'+(hint||'esperado')+'</div>' +
                  '<div class="cv2-card-esperado">'+formatBRL(esperado)+'</div>' +
                '</div>' +
              '</div>' +
              '<div class="cv2-btns">' +
                '<button type="button" class="cv2-btn cv2-btn-ok"      data-action="ok"      data-card-btn="'+key+'">✓ Tá certo</button>' +
                '<button type="button" class="cv2-btn cv2-btn-naobate" data-action="naobate" data-card-btn="'+key+'">✏️ Não bate</button>' +
              '</div>' +
              '<div class="cv2-edit-area" data-edit-area="'+key+'" style="display:none">' +
                inputsHtml +
                '<div class="cv2-diff-msg" data-diff-msg="'+key+'" style="display:none"></div>' +
              '</div>' +
            '</div>';
        }

        const html = `${cv2Style}
            <div class="caixa-modal cv2-modal" role="dialog" aria-label="Fechar caixa">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#7B1FA2,#DC2626)">
                <h3>🔒 Fechar caixa do dia</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">

                ${pollutedHtml}

                <div style="background:#EEF2FF;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#3730A3;line-height:1.5">
                  💡 <strong>Como conferir:</strong><br>
                  • <strong>Cartão</strong>: pegue o <strong>Z relatório</strong> da maquineta → linha <strong>"Totais Bandeiras"</strong><br>
                  • <strong>PIX</strong>: linha <strong>"Pix"</strong> do Z relatório (e/ou extrato do banco)<br>
                  • <strong>Dinheiro</strong>: conte a gaveta<br>
                  Se bater, clica <strong>✓ Tá certo</strong>. Se não, <strong>✏️ Não bate</strong> e digita o real.
                </div>

                <!-- Barra de progresso (3 dots) -->
                <div class="cv2-progress">
                  <div class="cv2-progress-dot" data-prog="cartao"></div>
                  <div class="cv2-progress-dot" data-prog="pix"></div>
                  <div class="cv2-progress-dot" data-prog="dinheiro"></div>
                </div>

                ${_card('cartao', '💳', 'Cartão (Bandeiras)', espCartao, 'do Z da maquineta', [
                  { name:'conf_cartao_m1', label:'💳 Maquineta 1 — total Bandeiras', default: espCartao },
                  { name:'conf_cartao_m2', label:'💳 Maquineta 2 — total Bandeiras (se tiver)', default: 0 }
                ])}
                ${_card('pix', '⚡', 'PIX', espPix, 'banco + maquineta', [
                  { name:'conf_pix_m1',     label:'⚡ PIX Maquineta 1', default: espPix },
                  { name:'conf_pix_m2',     label:'⚡ PIX Maquineta 2 (se tiver)', default: 0 },
                  { name:'conf_pix_direto', label:'⚡ PIX direto na conta (banco)', default: 0 }
                ])}

                <!-- Card Dinheiro tem extras (troco) -->
                <div class="cv2-card" data-card="dinheiro" data-esperado-num="${saldoEsperadoDinheiro}">
                  <div class="cv2-card-head">
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="cv2-card-icon">💵</span>
                      <div>
                        <div class="cv2-card-name">Dinheiro físico</div>
                        <div class="cv2-card-status" style="margin-top:3px"></div>
                      </div>
                    </div>
                    <div style="text-align:right">
                      <div class="cv2-card-esp-label">deve ter na gaveta</div>
                      <div class="cv2-card-esperado">${formatBRL(saldoEsperadoDinheiro)}</div>
                    </div>
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-bottom:8px;text-align:right">
                    abertura ${formatBRL(st.valorAbertura)} + vendas dinheiro ${formatBRL(st.vendasDinheiro)}${st.totalReforco?' + reforço '+formatBRL(st.totalReforco):''}${st.totalSangria?' − sangria '+formatBRL(st.totalSangria):''}
                  </div>
                  <div class="cv2-btns">
                    <button type="button" class="cv2-btn cv2-btn-ok"      data-action="ok"      data-card-btn="dinheiro">✓ Tá certo</button>
                    <button type="button" class="cv2-btn cv2-btn-naobate" data-action="naobate" data-card-btn="dinheiro">✏️ Não bate</button>
                  </div>
                  <div class="cv2-edit-area" data-edit-area="dinheiro" style="display:none">
                    <label style="font-size:12px;color:#374151;display:block;margin-bottom:4px;font-weight:700">💵 Quanto contou na gaveta?</label>
                    <input type="text" class="caixa-brl cv2-edit-input" data-caixa-brl data-name="conf_dinheiro" data-card-field="dinheiro" inputmode="numeric" placeholder="R$ 0,00"
                           style="width:100%;padding:10px 12px;border:2px solid #F59E0B;border-radius:8px;font-weight:800;text-align:right;font-size:18px;background:#fff">
                    <div class="cv2-dinheiro-extra">
                      <label>Quanto desse total fica de troco pro próximo turno? (só anotação — não afeta o caixa)</label>
                      <input type="text" class="caixa-brl" data-caixa-brl data-name="dinheiro_troco" inputmode="numeric" placeholder="R$ 0,00">
                    </div>
                    <div class="cv2-diff-msg" data-diff-msg="dinheiro" style="display:none"></div>
                  </div>
                </div>

                <!-- Justificativa só aparece quando há diff > R$ 5 -->
                <div data-justify-wrap style="display:none;margin-top:6px">
                  <div style="background:#FEF3C7;border-radius:8px;padding:10px 12px;font-size:13px;color:#92400E;font-weight:700;margin-bottom:6px">
                    ⚠️ Tem diferença de mais de R$ 5,00 — explique o motivo:
                  </div>
                  <textarea data-name="motivo" placeholder="Ex: troco a mais, erro digitação, falta R$ X..." rows="2"
                            style="width:100%;padding:8px;border:2px solid #F59E0B;border-radius:8px;font-family:inherit;font-size:13px;resize:vertical"></textarea>
                </div>

                ${offHoursCloseWarning}

                <div style="margin-top:10px;font-size:11px;color:#6b7280;text-align:center" title="Email enviado para: milkypot.com@gmail.com, jocimarrodrigo@gmail.com, joseanemse@gmail.com">
                  📧 Ao fechar, relatório vai automaticamente para os 3 emails da gestão
                </div>

                <!-- Detalhes avançados (opcional) -->
                <details style="margin-top:10px">
                  <summary style="cursor:pointer;font-size:11px;color:#6b7280;text-align:center;padding:4px">📊 Ver detalhes (M1/M2 separados)</summary>
                  <div style="background:#fff;border-radius:8px;padding:10px;margin-top:6px;font-size:11px;color:#6b7280;line-height:1.6">
                    Por padrão somamos tudo (M1 + M2 + PIX banco). Se você precisa registrar separado, edite os valores acima clicando "Não bate" e digite a soma das suas maquinetas.
                  </div>
                </details>

                <div class="caixa-danger" data-caixa-error style="display:none;margin-top:8px;padding:8px 10px;background:#FEE2E2;color:#991B1B;border-radius:6px;font-size:13px;font-weight:700"></div>
              </div>
              <div class="caixa-modal-footer">
                <button type="button" class="cv2-btn-cancel" data-caixa-close>Cancelar</button>
                <button type="button" class="cv2-btn-final cv2-btn-final-ok" data-caixa-confirm disabled>✅ Fechar Caixa</button>
              </div>
            </div>`;

        const modal = openModal(html, (data) => {
            // Estado dos cards (preenchido pelos clicks)
            const cardState = modal.__cardState || {};

            // Validar todos resolvidos
            const required = ['cartao','pix','dinheiro'];
            const pending = required.filter(k => !cardState[k]);
            if (pending.length) {
                return _err(modal, '⚠️ Confira: ' + pending.join(', ') + ' ainda não foi marcado.');
            }

            const valCartao = cardState.cartao.value;
            const valPix    = cardState.pix.value;
            // BUG-FIX: Cliente reportou — "TROCO É UMA COISA VENDA E OUTRA"
            // O troco do proximo turno nao deve subtrair do valor contado.
            // O esperado em dinheiro (saldoEsperadoDinheiro) ja eh:
            //   abertura + vendas dinheiro + reforcos − sangrias
            // O valor contado eh o TOTAL na gaveta — incluindo o troco que
            // vai ficar pra amanha (porque ainda nao saiu).
            // Troco vai como informacao auxiliar pro relatorio, nao no calculo.
            const valDinheiroTotal = cardState.dinheiro.value;
            const dinTroco = Number(parseBRL(data.dinheiro_troco) || 0);
            const valorContado = +valDinheiroTotal.toFixed(2);

            // Justificativa de horario
            let motivoH = '';
            if (!hourCheckClose.ok) {
                motivoH = (data.motivoForaHorario || '').trim();
                if (motivoH.length < 3) {
                    return _err(modal, '⚠️ Justificativa de horário obrigatória.');
                }
            }

            const totalConferido = valCartao + valPix + valorContado;
            const totalEsperado  = espCartao + espPix + espDinheiro + Number(st.valorAbertura||0);
            const diffTotal      = +(totalConferido - totalEsperado).toFixed(2);
            const diffDinheiro   = +(valorContado - saldoEsperadoDinheiro).toFixed(2);

            const motivo = (data.motivo || '').trim();
            if ((Math.abs(diffTotal) > 5 || Math.abs(diffDinheiro) > 5) && !motivo) {
                return _err(modal, '⚠️ Diferença maior que R$ 5,00 — explique o motivo no campo amarelo.');
            }

            const extras = {
                modo: 'simples',
                breakdown: {
                    cartao: valCartao,
                    pix_total: valPix,
                    dinheiro_total_gaveta: valDinheiroTotal,
                    dinheiro_troco: dinTroco,  // info pro proximo turno (nao no calculo)
                    dinheiro_liquido_dia: valorContado  // = total contado (sem subtrair troco)
                },
                esperado: {
                    cartao: espCartao,
                    pix: espPix,
                    dinheiro: espDinheiro,
                    saldoEsperadoDinheiro: saldoEsperadoDinheiro,
                    totalEsperado: totalEsperado
                },
                conferido: {
                    totalConferido: totalConferido,
                    diffTotal: diffTotal,
                    diffDinheiro: diffDinheiro
                },
                conferidoEm: new Date().toISOString()
            };

            const r = closeShift(franchiseId, valorContado, motivo, motivoH, extras);
            if (!r.success) {
                return _err(modal, r.error);
            }

            try {
                _persistAndDispatchReport(franchiseId, st, valorContado, motivo, motivoH, extras, r);
            } catch (e) { console.warn('Falha ao despachar relatorio:', e); }

            if (cb) cb(r);
            setTimeout(function(){
                let msg = '✅ Caixa fechado!\n\n';
                msg += 'Total: ' + formatBRL(totalConferido) + '\n';
                if (Math.abs(diffTotal) >= 0.01) msg += 'Diferença: ' + (diffTotal>0?'+':'') + formatBRL(diffTotal) + '\n';
                else msg += 'Bateu certinho!\n';
                msg += '\n📧 Relatório enviado pra gestão.';
                window.alert(msg);
            }, 100);
        });

        // ====== Wiring dos botões e estado ======
        const overlay = modal.overlay;
        modal.__cardState = {}; // { cartao: {ok:true, value:N}, pix: {...}, dinheiro: {...} }

        function _esp(key) {
            const card = overlay.querySelector('[data-card="'+key+'"]');
            return Number(card ? card.getAttribute('data-esperado-num') : 0);
        }
        function _setProgress() {
            ['cartao','pix','dinheiro'].forEach(k => {
                const dot = overlay.querySelector('[data-prog="'+k+'"]');
                if (dot) dot.classList.toggle('done', !!modal.__cardState[k]);
            });
            // Habilita botão final só quando os 3 resolvidos
            const allOk = ['cartao','pix','dinheiro'].every(k => modal.__cardState[k]);
            const fechBtn = overlay.querySelector('[data-caixa-confirm]');
            if (fechBtn) fechBtn.disabled = !allOk;

            // Atualiza justificativa
            if (allOk) {
                // Troco NAO entra no calculo (eh dinheiro fisico que fica
                // pra abrir o proximo turno, nao eh venda).
                const dinContado = modal.__cardState.dinheiro.value;
                const total      = modal.__cardState.cartao.value + modal.__cardState.pix.value + dinContado;
                const totalEsp   = espCartao + espPix + espDinheiro + Number(st.valorAbertura||0);
                const diff       = +(total - totalEsp).toFixed(2);
                const dinDiff    = +(dinContado - saldoEsperadoDinheiro).toFixed(2);
                const wrap = overlay.querySelector('[data-justify-wrap]');
                if (wrap) wrap.style.display = (Math.abs(diff) > 5 || Math.abs(dinDiff) > 5) ? 'block' : 'none';
            }
        }

        function _markCard(key, mode, value) {
            const card = overlay.querySelector('[data-card="'+key+'"]');
            const editArea = overlay.querySelector('[data-edit-area="'+key+'"]');
            if (!card) return;
            card.classList.remove('ok','editing');
            if (mode === 'ok') {
                card.classList.add('ok');
                if (editArea) editArea.style.display = 'none';
                modal.__cardState[key] = { ok: true, mode: 'ok', value: _esp(key) };
            } else if (mode === 'editing') {
                card.classList.add('editing');
                if (editArea) {
                    editArea.style.display = 'block';
                    // Foca no primeiro campo do edit area
                    const firstInp = editArea.querySelector('input.cv2-edit-input, input[data-name^="conf_"]');
                    if (firstInp) { firstInp.focus(); firstInp.select(); }
                }
                // Inicializa value com soma dos campos atuais (defaults)
                if (typeof _sumCardFields === 'function') {
                    const v = _sumCardFields(key);
                    modal.__cardState[key] = { ok: true, mode: 'editing', value: v };
                } else if (typeof value === 'number') {
                    modal.__cardState[key] = { ok: true, mode: 'editing', value: value };
                } else {
                    modal.__cardState[key] = { ok: true, mode: 'editing', value: _esp(key) };
                }
            }
            _setProgress();
        }

        // Click handlers nos botões dos cards
        overlay.addEventListener('click', function(ev){
            const btn = ev.target.closest('[data-card-btn]');
            if (!btn) return;
            ev.preventDefault();
            const key = btn.getAttribute('data-card-btn');
            const action = btn.getAttribute('data-action');
            if (action === 'ok') _markCard(key, 'ok');
            else if (action === 'naobate') {
                _markCard(key, 'editing');
                // Sem value ainda — sera registrado ao digitar
                if (modal.__cardState[key] && modal.__cardState[key].mode === 'editing' && !modal.__cardState[key].value) {
                    modal.__cardState[key].value = _esp(key);
                }
            }
        });

        // Listener do input de valor "não bate" — soma TODOS os campos do mesmo card
        // (cartao tem M1+M2; PIX tem M1+M2+banco; dinheiro tem so 1 input)
        function _sumCardFields(key) {
            const inputs = overlay.querySelectorAll('[data-card-field="'+key+'"]');
            let sum = 0;
            inputs.forEach(i => { sum += parseBRL(i.value) || 0; });
            return +sum.toFixed(2);
        }
        function _onCardFieldInput(key) {
            const v = _sumCardFields(key);
            modal.__cardState[key] = { ok: true, mode: 'editing', value: v };
            const esp = _esp(key);
            const d = +(v - esp).toFixed(2);
            const msgEl = overlay.querySelector('[data-diff-msg="'+key+'"]');
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.classList.remove('cv2-diff-ok','cv2-diff-faltou','cv2-diff-sobrou','cv2-diff-pequena');
                const absD = Math.abs(d);
                if (absD < 0.01) {
                    msgEl.innerHTML = '✓ <strong>Bateu certinho</strong> — pode fechar caixa';
                    msgEl.classList.add('cv2-diff-ok');
                } else if (absD <= 5) {
                    // Diff pequena (até R$5): aceitavel sem justificativa, fecha normal
                    const lbl = d > 0 ? 'Sobrou' : 'Faltou';
                    msgEl.innerHTML = '<strong>' + lbl + ' ' + formatBRL(absD) + '</strong> — diferença pequena, ok pode fechar (sistema lança como ajuste)';
                    msgEl.classList.add('cv2-diff-pequena');
                } else {
                    // Diff grande (>R$5): obrigatorio justificar
                    const lbl = d > 0 ? 'Sobrou' : 'Faltou';
                    msgEl.innerHTML = '⚠️ <strong>' + lbl + ' ' + formatBRL(absD) + '</strong> — explique o motivo no campo amarelo abaixo pra poder fechar';
                    msgEl.classList.add(d < 0 ? 'cv2-diff-faltou' : 'cv2-diff-sobrou');
                }
            }
            _setProgress();
        }
        // Liga TODOS os inputs de campos do edit area
        overlay.querySelectorAll('[data-card-field]').forEach(function(inp){
            const key = inp.getAttribute('data-card-field');
            inp.addEventListener('input', function(){ _onCardFieldInput(key); });
        });
        // Mantem o listener antigo dos campos antigos (compat) — vazio agora
        ['x_unused'].forEach(function(key){
            const inp = overlay.querySelector('input[data-name="conf_'+key+'"]');
            if (!inp) return;
            inp.addEventListener('input', function(){
                const v = parseBRL(inp.value);
                modal.__cardState[key] = { ok: true, mode: 'editing', value: v };
                const esp = _esp(key);
                const d = +(v - esp).toFixed(2);
                const msgEl = overlay.querySelector('[data-diff-msg="'+key+'"]');
                if (msgEl) {
                    msgEl.style.display = 'block';
                    msgEl.classList.remove('cv2-diff-ok','cv2-diff-faltou','cv2-diff-sobrou');
                    if (Math.abs(d) < 0.01) { msgEl.textContent = '✓ Bateu certinho'; msgEl.classList.add('cv2-diff-ok'); }
                    else if (d < 0) { msgEl.textContent = '⚠ Faltou ' + formatBRL(Math.abs(d)); msgEl.classList.add('cv2-diff-faltou'); }
                    else { msgEl.textContent = '+ Sobrou ' + formatBRL(d); msgEl.classList.add('cv2-diff-sobrou'); }
                }
                _setProgress();
            });
        });

        // Listener do troco
        const trocoInput = overlay.querySelector('[data-name="dinheiro_troco"]');
        if (trocoInput) trocoInput.addEventListener('input', _setProgress);

        // Estado inicial: barras vazias, botão final desabilitado
        _setProgress();
    }

    function _err(modal, msg) {
        const err = modal.overlay.querySelector('[data-caixa-error]');
        if (err) {
            // Preserva quebras de linha (\n) na mensagem usando <br>
            err.innerHTML = String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>');
            err.style.display = 'block';
            err.style.whiteSpace = 'pre-wrap';
            // Scroll pro erro pra o operador ver
            try { err.scrollIntoView({behavior:'smooth', block:'center'}); } catch(_){}
        }
        return false;
    }

    /* ============================================
       Envio AUTOMATICO do relatorio — 3 camadas (todas servidor, sem
       abrir cliente de email do operador):

       1. Persiste em caixa_reports_<fid> (audit imutavel no Firestore)
       2. Escreve documento na coleção `mail` no formato da Firebase
          Extension "Trigger Email from Firestore" — quando a extension
          esta instalada (uma vez no console Firebase), ela detecta
          documentos novos em `mail` e envia via SMTP automaticamente.
          Doc: https://extensions.dev/extensions/firebase/firestore-send-email
       3. Tenta CloudFunctions.sendClosingReport (silent fail se nao
          deployada — quando o backend Function for criado, funciona)

       NUNCA abre mailto/cliente de email externo.
       ============================================ */
    function _persistAndDispatchReport(franchiseId, st, valorContado, motivo, motivoH, extras, r) {
        const session = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
        const operatorName = session ? (session.name || session.email || 'Operador') : 'Operador';
        const operatorEmail = session ? (session.email || '') : '';
        const fechamentoDate = new Date();
        const reportId = 'rep_' + (typeof Utils !== 'undefined' ? Utils.generateId() : Date.now().toString(36));
        const RECIPIENTS = ['milkypot.com@gmail.com','jocimarrodrigo@gmail.com','joseanemse@gmail.com'];

        const report = {
            id: reportId,
            franchiseId: franchiseId,
            fechamentoDate: fechamentoDate.toISOString(),
            dateKey: st.dateKey,
            turnoId: st.turnoId,
            operator: { name: operatorName, email: operatorEmail },
            esperado: extras.esperado,
            conferido: extras.conferido,
            breakdown: extras.breakdown,
            motivoQuebra: motivo || '',
            motivoForaHorario: motivoH || '',
            valorContado: valorContado,
            saldoEsperadoDinheiro: st.saldoEsperadoDinheiro,
            valorAbertura: st.valorAbertura,
            faturamentoBruto: st.faturamentoBruto,
            porMetodo: st.porMetodo,
            createdAt: fechamentoDate.toISOString(),
            recipients: RECIPIENTS,
            sent: false
        };

        // 1. Persiste audit no Firestore (sempre — funciona offline tambem)
        try {
            if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
                DataStore.addToCollection('caixa_reports', franchiseId, report);
            }
        } catch (e) { console.warn('persist report:', e); }

        // 2. CAMINHO PRINCIPAL: escreve em /mail (Firebase Trigger Email Extension)
        //    Formato esperado pela extension:
        //    { to: [...], message: { subject, text, html } }
        try {
            const subject = 'Fechamento de Caixa ' + st.dateKey + ' — MilkyPot ' + franchiseId;
            const text = _buildEmailBody(report);
            const html = _buildEmailHtml(report);
            const mailDoc = {
                to: RECIPIENTS,
                from: 'MilkyPot PDV <noreply@milkypot.com>',
                replyTo: operatorEmail || 'milkypot.com@gmail.com',
                message: { subject: subject, text: text, html: html },
                // Metadata pra audit
                _reportId: reportId,
                _franchiseId: franchiseId,
                _operator: operatorName,
                _createdAt: fechamentoDate.toISOString()
            };
            // Tenta gravar via DataStore (que ja sincroniza Firestore)
            if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
                // collection 'mail' (raiz, nao por franquia) — eh onde a
                // Firebase Trigger Email Extension escuta por default
                DataStore.addToCollection('mail', '_global', mailDoc);
            }
            // Direto no Firestore (caminho explicito, prioritario)
            // — caso DataStore tenha namespacing por franquia, garante
            // que o doc apareca em /mail/{auto-id}
            try {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    firebase.firestore().collection('mail').add(mailDoc).catch(e => {
                        console.warn('mail collection add failed:', e && e.message);
                    });
                }
            } catch(_) {}
        } catch (e) { console.warn('mail dispatch:', e); }

        // 3. Tambem chama CloudFunctions.sendClosingReport caso o backend
        //    tenha implementacao alternativa (ex: nodemailer custom)
        try {
            if (typeof CloudFunctions !== 'undefined' && CloudFunctions.sendClosingReport) {
                CloudFunctions.sendClosingReport(franchiseId, {
                    operatorName: operatorName,
                    operatorEmail: operatorEmail,
                    valorContado: valorContado,
                    saldoEsperado: st.saldoEsperadoDinheiro,
                    diferenca: extras.conferido && extras.conferido.diffTotal,
                    motivo: motivo,
                    fechamentoDate: fechamentoDate.toISOString(),
                    breakdownConferido: extras
                }).catch(e => console.warn('sendClosingReport CF:', e && e.message));
            }
        } catch (e) { console.warn('CF dispatch:', e); }
    }

    // HTML version do email — mais bonito que texto puro
    function _buildEmailHtml(rep) {
        const esp = rep.esperado || {};
        const con = rep.conferido || {};
        const br  = rep.breakdown || {};
        const dt = new Date(rep.fechamentoDate).toLocaleString('pt-BR');
        const fmt = (v) => 'R$ ' + Number(v||0).toFixed(2).replace('.', ',');
        const diffColor = Math.abs(con.diffTotal||0) < 0.01 ? '#10B981' :
                          (Math.abs(con.diffTotal||0) <= 5 ? '#F59E0B' : '#DC2626');
        return ''+
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">'+
          '<div style="background:linear-gradient(135deg,#7B1FA2,#DC2626);color:#fff;padding:18px;border-radius:10px 10px 0 0">'+
            '<h2 style="margin:0;font-size:18px">🔒 Fechamento de Caixa</h2>'+
            '<div style="opacity:.9;font-size:13px;margin-top:4px">'+rep.franchiseId+' · '+dt+'</div>'+
          '</div>'+
          '<div style="background:#fff;padding:16px;border:1px solid #e5e7eb;border-top:0">'+
            '<p style="margin:0 0 12px;font-size:13px;color:#6b7280">Operador: <strong style="color:#111">'+(rep.operator&&rep.operator.name)+'</strong> &lt;'+(rep.operator&&rep.operator.email)+'&gt;</p>'+
            '<table style="width:100%;border-collapse:collapse;font-size:13px">'+
              '<tr style="background:#F3F4F6"><th style="padding:8px;text-align:left">Método</th><th style="padding:8px;text-align:right">Sistema</th><th style="padding:8px;text-align:right">Conferido</th></tr>'+
              '<tr><td style="padding:6px 8px;border-top:1px solid #e5e7eb">💳 Cartão (Bandeiras)</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right">'+fmt(esp.cartao||((esp.credito||0)+(esp.debito||0)))+'</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">'+fmt(br.cartao||0)+'</td></tr>'+
              '<tr><td style="padding:6px 8px;border-top:1px solid #e5e7eb">⚡ PIX</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right">'+fmt(esp.pix)+'</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">'+fmt(br.pix_total||0)+'</td></tr>'+
              '<tr><td style="padding:6px 8px;border-top:1px solid #e5e7eb">💵 Dinheiro líquido</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right">'+fmt(esp.saldoEsperadoDinheiro)+'</td><td style="padding:6px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">'+fmt(br.dinheiro_liquido_dia||0)+'</td></tr>'+
              '<tr style="background:#F9FAFB;font-weight:800"><td style="padding:8px">TOTAL</td><td style="padding:8px;text-align:right">'+fmt(esp.totalEsperado)+'</td><td style="padding:8px;text-align:right;color:'+diffColor+'">'+fmt(con.totalConferido)+'</td></tr>'+
            '</table>'+
            '<div style="margin-top:14px;padding:12px;background:'+diffColor+'15;border-radius:8px;border-left:4px solid '+diffColor+'">'+
              '<div style="font-size:13px;color:'+diffColor+';font-weight:800">Diferença total: '+(con.diffTotal>0?'+':'')+fmt(con.diffTotal)+'</div>'+
              '<div style="font-size:12px;color:#6b7280;margin-top:2px">Diferença em dinheiro: '+(con.diffDinheiro>0?'+':'')+fmt(con.diffDinheiro)+'</div>'+
              (rep.motivoQuebra ? '<div style="font-size:12px;margin-top:6px;color:#374151"><strong>Justificativa:</strong> '+rep.motivoQuebra+'</div>' : '')+
            '</div>'+
            '<details style="margin-top:14px;font-size:12px;color:#6b7280"><summary style="cursor:pointer">Ver detalhes (M1/M2/banco)</summary>'+
              '<pre style="background:#F9FAFB;padding:10px;border-radius:6px;overflow:auto;font-size:11px;font-family:Consolas,monospace">'+
                _buildEmailBody(rep).replace(/&/g,'&amp;').replace(/</g,'&lt;')+
              '</pre>'+
            '</details>'+
          '</div>'+
          '<div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:10px">Relatório automático MilkyPot PDV · ID '+rep.id+'</div>'+
        '</div>';
    }

    function _buildEmailBody(rep) {
        const esp = rep.esperado || {};
        const con = rep.conferido || {};
        const br  = rep.breakdown || {};
        const dt = new Date(rep.fechamentoDate).toLocaleString('pt-BR');
        const fmt = (v) => 'R$ ' + Number(v||0).toFixed(2).replace('.', ',');

        let body = '';
        body += 'FECHAMENTO DE CAIXA — MilkyPot\n';
        body += '====================================\n';
        body += 'Franquia:   ' + rep.franchiseId + '\n';
        body += 'Data:       ' + rep.dateKey + '  (fechado em ' + dt + ')\n';
        body += 'Operador:   ' + (rep.operator && rep.operator.name) + ' <' + (rep.operator && rep.operator.email) + '>\n';
        body += 'Turno ID:   ' + rep.turnoId + '\n';
        body += '\n--- VENDAS POR MÉTODO (sistema) ---\n';
        body += 'PIX:        ' + fmt(esp.pix) + '\n';
        body += 'Crédito:    ' + fmt(esp.credito) + '\n';
        body += 'Débito:     ' + fmt(esp.debito) + '\n';
        body += 'Dinheiro:   ' + fmt(esp.dinheiro) + '\n';
        body += 'TOTAL:      ' + fmt(esp.totalEsperado) + '\n';
        body += '\n--- CONFERIDO PELO OPERADOR ---\n';
        body += 'Crédito Maquininha 1:    ' + fmt(br.credito_maquineta_1) + '\n';
        body += 'Crédito Maquininha 2:    ' + fmt(br.credito_maquineta_2) + '\n';
        body += 'Débito Maquininha 1:     ' + fmt(br.debito_maquineta_1) + '\n';
        body += 'Débito Maquininha 2:     ' + fmt(br.debito_maquineta_2) + '\n';
        body += 'PIX Maquininha 1:        ' + fmt(br.pix_maquineta_1) + '\n';
        body += 'PIX Maquininha 2:        ' + fmt(br.pix_maquineta_2) + '\n';
        body += 'PIX direto banco:        ' + fmt(br.pix_direto_banco) + '\n';
        body += '  = PIX total:           ' + fmt(br.pix_total) + '\n';
        body += 'Dinheiro contado:        ' + fmt(br.dinheiro_total_gaveta) + '\n';
        body += '  (− troco prox. turno): ' + fmt(br.dinheiro_troco) + '\n';
        body += '  = Dinheiro líquido:    ' + fmt(br.dinheiro_liquido_dia) + '\n';
        body += 'TOTAL CONFERIDO:         ' + fmt(con.totalConferido) + '\n';
        body += '\n--- DIFERENÇA ---\n';
        body += 'Diferença em dinheiro:   ' + fmt(con.diffDinheiro) + '\n';
        body += 'Diferença total:         ' + fmt(con.diffTotal) + '\n';
        body += 'Justificativa:           ' + (rep.motivoQuebra || '(sem diferença significativa)') + '\n';
        if (rep.motivoForaHorario) body += 'Just. fora horário:      ' + rep.motivoForaHorario + '\n';
        body += '\n--- MOVIMENTOS DO CAIXA ---\n';
        body += 'Abertura:           ' + fmt(rep.valorAbertura) + '\n';
        body += 'Vendas em dinheiro: ' + fmt(rep.breakdown && rep.breakdown.dinheiro_liquido_dia) + '\n';
        body += 'Faturamento bruto:  ' + fmt(rep.faturamentoBruto) + '\n';
        body += '\n====================================\n';
        body += 'Relatório gerado automaticamente pelo PDV MilkyPot.\n';
        body += 'ID do relatório: ' + rep.id + '\n';
        return body;
    }

    // Modal de confirmacao (etapa 2) — mostra um resumo final claro
    // do fechamento e exige checkbox + clique consciente. Se cancelar,
    // reabre o modal de fechamento com os valores preservados.
    function _showCloseConfirmModal(franchiseId, st, params, cb) {
        const breakdownHtml = _renderPagamentosBreakdown(st);
        const diff = params.valorContado - st.saldoEsperadoDinheiro;
        const absDiff = Math.abs(diff);
        const diffColor = absDiff < 0.01 ? '#10B981' : (absDiff <= 5 ? '#F59E0B' : '#DC2626');
        const diffLabel = diff > 0 ? 'SOBRA' : (diff < 0 ? 'FALTA' : 'EXATO');
        const diffBox = '<div style="background:' + diffColor + '15;border:2px solid ' + diffColor + ';border-radius:10px;padding:12px;margin:10px 0">' +
            '<div style="display:flex;justify-content:space-between;font-size:14px">' +
              '<span>Esperado em dinheiro</span><strong>' + formatBRL(st.saldoEsperadoDinheiro) + '</strong>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;font-size:14px">' +
              '<span>Contado no caixa</span><strong>' + formatBRL(params.valorContado) + '</strong>' +
            '</div>' +
            '<hr style="border:none;border-top:1px dashed ' + diffColor + ';margin:8px 0">' +
            '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:' + diffColor + '">' +
              '<span>' + diffLabel + '</span><span>' + formatBRL(absDiff) + '</span>' +
            '</div></div>';

        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Confirmar fechamento" style="max-width:480px">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#7B1FA2,#DC2626)">
                <h3>⚠️ Confirme o fechamento</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <div style="background:#FFF3E0;border-left:4px solid #FB8C00;padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:13px;color:#E65100">
                  <strong>Confira tudo antes de confirmar.</strong><br>
                  Depois de fechar, o caixa do dia fica <strong>imutável</strong> — só admin reabre.
                </div>
                <div style="font-weight:700;margin-bottom:6px;color:#333">💰 Vendas registradas hoje</div>
                ${breakdownHtml}
                ${diffBox}
                <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-top:8px;font-size:14px;line-height:1.4">
                  <input type="checkbox" data-name="confirmou" style="margin-top:3px;width:18px;height:18px;cursor:pointer">
                  <span>Confirmo que <strong>conferi os valores acima</strong> e que correspondem ao realmente faturado hoje.</span>
                </label>
                <div class="caixa-danger" data-caixa-error style="display:none;margin-top:8px"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-back>← Voltar</button>
                <button class="caixa-btn-danger" data-caixa-confirm>✅ Confirmar e fechar caixa</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            if (!data.confirmou) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = '⚠️ Marque o checkbox confirmando que conferiu os valores.';
                err.style.display = 'block';
                return false;
            }
            var r = closeShift(franchiseId, params.valorContadoRaw, params.motivo, params.motivoForaHorario);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error + (r.esperado !== undefined ? ' (esperado ' + formatBRL(r.esperado) + ', diferença ' + formatBRL(r.diff) + ')' : '');
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
        // Botao "Voltar" reabre o modal anterior preservando os valores digitados
        const backBtn = modal.overlay.querySelector('[data-caixa-back]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                modal.overlay.remove();
                // Reabre showCloseModal e prefill
                showCloseModal(franchiseId, cb);
                // Tenta repreencher os campos (depois do modal abrir)
                setTimeout(() => {
                    var valEl = document.querySelector('.caixa-modal [data-name="valor"]');
                    if (valEl && params.valorContadoRaw) valEl.value = params.valorContadoRaw;
                    var motEl = document.querySelector('.caixa-modal [data-name="motivo"]');
                    if (motEl && params.motivo) motEl.value = params.motivo;
                    var motHEl = document.querySelector('.caixa-modal [data-name="motivoForaHorario"]');
                    if (motHEl && params.motivoForaHorario) motHEl.value = params.motivoForaHorario;
                }, 60);
            });
        }
    }

    function showSangriaModal(franchiseId, cb) {
        const st = getTurnoState(franchiseId);
        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Sangria">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#F59E0B,#D97706)">
                <h3>📤 Sangria (retirada)</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-info">Saldo em dinheiro disponível: <strong>${formatBRL(st.saldoEsperadoDinheiro)}</strong></div>
                <label>Valor retirado</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Motivo (obrigatório)</label>
                <textarea data-name="motivo" placeholder="Ex: depósito banco, pagamento fornecedor X, troco para caixa auxiliar..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Registrar sangria</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = registerSangria(franchiseId, data.valor, data.motivo);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    function showReforcoModal(franchiseId, cb) {
        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Reforço">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#10B981,#059669)">
                <h3>📥 Reforço (aporte)</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Valor aportado</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Motivo</label>
                <textarea data-name="motivo" placeholder="Ex: troco adicional, suprimento de caixa..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Registrar reforço</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = registerReforco(franchiseId, data.valor, data.motivo);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    /* ============================================
       Widget de dashboard
       ============================================ */
    function renderWidget(franchiseId) {
        const st = getTurnoState(franchiseId);

        const statusStyles = {
            aberto: { color: '#10B981', label: 'Caixa aberto' },
            fechado: { color: '#2196F3', label: 'Fechado hoje' },
            nao_aberto: { color: '#9E9E9E', label: 'Caixa fechado' }
        };
        const s = statusStyles[st.status];

        const hrIn = st.abertura ? formatHM(st.abertura.createdAt) : '—';
        const hrOut = st.fechamento ? formatHM(st.fechamento.createdAt) : '—';

        let actionBtns;
        if (st.status === 'nao_aberto') {
            actionBtns = `<button class="btn btn-primary btn-sm" onclick="Caixa.showOpenModal(Caixa._fid(), Caixa.refreshWidget)">🟢 Abrir caixa</button>`;
        } else if (st.status === 'aberto') {
            actionBtns = `
                <button class="btn btn-sm" style="background:#10B981;color:#fff" onclick="Caixa.showReforcoModal(Caixa._fid(), Caixa.refreshWidget)">📥 Reforço</button>
                <button class="btn btn-sm" style="background:#F59E0B;color:#fff" onclick="Caixa.showSangriaModal(Caixa._fid(), Caixa.refreshWidget)">📤 Sangria</button>
                <button class="btn btn-sm" style="background:#DC2626;color:#fff" onclick="Caixa.showCloseModal(Caixa._fid(), Caixa.refreshWidget)">🔒 Fechar caixa</button>`;
        } else {
            const diffColor = Math.abs(st.diferenca || 0) < 0.01 ? '#10B981' : '#DC2626';
            actionBtns = `<span style="color:${diffColor};font-weight:700">Diferença: ${formatBRL(st.diferenca)}</span>`;
        }

        const porMetodoHtml = Object.keys(st.porMetodo).length > 0
            ? Object.entries(st.porMetodo).map(([k, v]) =>
                `<span style="display:inline-block;margin:0 10px 4px 0;font-size:.78rem;color:#555">${metodoIcon(k)} ${metodoLabel(k)}: <strong>${formatBRL(v)}</strong></span>`
              ).join('')
            : '<span style="font-size:.8rem;color:#999">Nenhuma venda registrada ainda</span>';

        return `
            <div id="caixaWidget" class="panel-card" style="margin-bottom:20px">
              <div class="panel-card-header">
                <h3>💰 Caixa de Hoje</h3>
                <span class="status-badge" style="background:${s.color}15;color:${s.color};border:1px solid ${s.color}30">${s.label}</span>
              </div>
              <div class="panel-card-body">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:14px">
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Abertura</div>
                    <div style="font-weight:700">${hrIn} · ${formatBRL(st.valorAbertura)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Faturamento</div>
                    <div style="font-weight:700;color:#2E7D32">${formatBRL(st.faturamentoBruto)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Saldo em dinheiro</div>
                    <div style="font-weight:700;color:#E91E63">${formatBRL(st.saldoEsperadoDinheiro)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Fechamento</div>
                    <div style="font-weight:700">${hrOut}${st.fechamento ? ' · ' + formatBRL(st.valorContado) : ''}</div>
                  </div>
                </div>
                <div style="padding-top:12px;border-top:1px dashed #eee;margin-bottom:12px">
                  ${porMetodoHtml}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">
                  ${actionBtns}
                </div>
              </div>
            </div>`;
    }

    function refreshWidget() {
        const el = document.getElementById('caixaWidget');
        if (!el) return;
        const fid = _fid();
        if (!fid) return;
        el.outerHTML = renderWidget(fid);
    }

    function _fid() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            return s ? s.franchiseId : null;
        }
        return null;
    }

    function initPanel() {
        const mount = document.getElementById('caixaMount');
        if (!mount) return;
        const fid = _fid();
        if (!fid) return;
        mount.innerHTML = renderWidget(fid);
    }

    /* ============================================
       Helpers
       ============================================ */
    function formatBRL(v) {
        const n = Number(v || 0);
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + 'R$ ' + abs.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseBRL(s) {
        if (typeof s !== 'string') return Number(s) || 0;
        const digits = s.replace(/\D/g, '');
        if (!digits) return 0;
        return parseInt(digits, 10) / 100;
    }

    function formatHM(iso) {
        try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
        catch (e) { return '—'; }
    }

    function normalizeMetodo(p) {
        if (p == null) return 'nao_informado';
        // Defensivo: payment pode vir como string ('PIX'), number (legado),
        // ou objeto {method,label} (vem da landing). Sem isso, String({...})
        // virava '[object Object]' e poluia o relatorio do caixa.
        let raw = p;
        if (typeof p === 'object') {
            raw = p.method || p.type || p.label || p.name || '';
        }
        let v = String(raw).toLowerCase().trim();
        if (!v) return 'nao_informado';
        // BUG-FIX: 'crédito'.includes('cred') === false ('é' nao bate com 'e')
        // Remove acentos antes de comparar pra detectar credito/debito que
        // foram salvos com acento ('crédito','débito').
        try { v = v.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
        catch(_) {}
        if (v.includes('pix')) return 'pix';
        if (v.includes('din')) return 'dinheiro';
        if (v.includes('cred')) return 'credito';
        if (v.includes('deb')) return 'debito';
        return v;
    }

    function metodoLabel(k) {
        const map = { pix: 'PIX', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', nao_informado: 'Não informado' };
        return map[k] || k;
    }

    function metodoIcon(k) {
        const map = { pix: '⚡', dinheiro: '💵', credito: '💳', debito: '💳', nao_informado: '❓' };
        return map[k] || '💰';
    }

    /* ============================================
       API pública
       ============================================ */
    return {
        // Leitura
        getTurnoState: getTurnoState,
        isShiftOpen: isShiftOpen,
        loadMovements: loadMovements,
        // Operações
        openShift: openShift,
        closeShift: closeShift,
        registerSale: registerSale,
        registerSangria: registerSangria,
        registerReforco: registerReforco,
        registerAjuste: registerAjuste,
        // Modais
        showOpenModal: showOpenModal,
        showCloseModal: showCloseModal,
        showSangriaModal: showSangriaModal,
        showReforcoModal: showReforcoModal,
        showChecklistModal: showChecklistModal,
        // Widget
        renderWidget: renderWidget,
        refreshWidget: refreshWidget,
        initPanel: initPanel,
        // Horário comercial
        getBusinessHours: getBusinessHours,
        checkBusinessHours: checkBusinessHours,
        // Utils
        formatBRL: formatBRL,
        parseBRL: parseBRL,
        _fid: _fid
    };
})();

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.Caixa = Caixa;
if (typeof globalThis !== 'undefined') globalThis.Caixa = Caixa;
