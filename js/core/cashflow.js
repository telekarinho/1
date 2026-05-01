/* ============================================================
   MilkyPot Cashflow — Fluxo de Caixa D+30 + Contas a Pagar/Receber
   ============================================================
   Gera a projeção de caixa dos próximos 30 dias cruzando:
     - Saldo atual (vendas - custos do mês até hoje)
     - Contas a pagar cadastradas (aluguel, luz, fornecedores)
     - Contas a receber (iFood repasse D+14, cheque, etc.)
     - Recorrentes (Financas.listRecurring)
     - Média diária de vendas (últimos 14 dias) como projeção
     - Média diária de custos variáveis

   Storage:
     payables_{fid}    — contas a pagar: [{id, desc, valor, vencimento, categoria, pago, pagoAt, fornecedor}]
     receivables_{fid} — contas a receber: [{id, desc, valor, vencimento, categoria, recebido, recebidoAt, origem}]

   API:
     Cashflow.projectD30(fid) → { saldoAtual, dias: [{date, entradas, saidas, saldo}], totais, alertas }
     Cashflow.addPayable(fid, entry)
     Cashflow.addReceivable(fid, entry)
     Cashflow.markPaid(fid, id, at)
     Cashflow.markReceived(fid, id, at)
     Cashflow.listUpcoming(fid, days=7) → [{type, entry, daysUntil}]
   ============================================================ */
(function(global){
    'use strict';

    function DS() { return global.DataStore; }
    function today0() { const d = new Date(); d.setHours(0,0,0,0); return d; }

    function daysBetween(a, b) {
        return Math.round((new Date(b) - new Date(a)) / 86400000);
    }

    function addDays(d, n) {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        x.setHours(0,0,0,0);
        return x;
    }

    // ================================================================
    // Contas a Pagar
    // ================================================================
    function listPayables(fid, filters) {
        const list = DS().get('payables_' + fid) || [];
        if (!filters) return list;
        if (filters.open) return list.filter(p => !p.pago);
        if (filters.paid) return list.filter(p => !!p.pago);
        return list;
    }

    function addPayable(fid, entry) {
        const list = listPayables(fid);
        const rec = Object.assign({
            id: 'pay_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
            createdAt: new Date().toISOString(),
            pago: false,
            pagoAt: null
        }, entry);
        list.push(rec);
        DS().set('payables_' + fid, list);
        return rec;
    }

    function updatePayable(fid, id, patch) {
        const list = listPayables(fid);
        const idx = list.findIndex(p => p.id === id);
        if (idx < 0) return false;
        list[idx] = Object.assign(list[idx], patch);
        DS().set('payables_' + fid, list);
        return list[idx];
    }

    function markPaid(fid, id, at) {
        return updatePayable(fid, id, { pago: true, pagoAt: at || new Date().toISOString() });
    }

    function deletePayable(fid, id) {
        const list = listPayables(fid).filter(p => p.id !== id);
        DS().set('payables_' + fid, list);
    }

    // ================================================================
    // Contas a Receber
    // ================================================================
    function listReceivables(fid, filters) {
        const list = DS().get('receivables_' + fid) || [];
        if (!filters) return list;
        if (filters.open) return list.filter(r => !r.recebido);
        if (filters.received) return list.filter(r => !!r.recebido);
        return list;
    }

    function addReceivable(fid, entry) {
        const list = listReceivables(fid);
        const rec = Object.assign({
            id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
            createdAt: new Date().toISOString(),
            recebido: false,
            recebidoAt: null
        }, entry);
        list.push(rec);
        DS().set('receivables_' + fid, list);
        return rec;
    }

    function updateReceivable(fid, id, patch) {
        const list = listReceivables(fid);
        const idx = list.findIndex(r => r.id === id);
        if (idx < 0) return false;
        list[idx] = Object.assign(list[idx], patch);
        DS().set('receivables_' + fid, list);
        return list[idx];
    }

    function markReceived(fid, id, at) {
        return updateReceivable(fid, id, { recebido: true, recebidoAt: at || new Date().toISOString() });
    }

    function deleteReceivable(fid, id) {
        const list = listReceivables(fid).filter(r => r.id !== id);
        DS().set('receivables_' + fid, list);
    }

    // ================================================================
    // Projeção D+30
    // ================================================================

    /**
     * Calcula saldo atual (muito simples: receita hoje - custos hoje).
     * Em produção ideal conectaria extrato bancário.
     */
    function currentBalance(fid) {
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const costs = DS().getCollection ? DS().getCollection('finance_costs', fid) || [] : [];

        const start = new Date();
        start.setDate(1); start.setHours(0,0,0,0);

        const receita = orders
            .filter(o => o.createdAt && new Date(o.createdAt) >= start &&
                        ['confirmado','entregue','pago'].includes(o.status))
            .reduce((s,o) => s + (Number(o.total)||0), 0);

        const saida = costs
            .filter(c => c.createdAt && new Date(c.createdAt) >= start)
            .reduce((s,c) => s + (Number(c.valor)||0), 0);

        // Saldo manual sobrescreve se o usuário informou
        const manual = DS().get('cashflow_saldo_manual_' + fid);
        if (manual && manual.value != null) return Number(manual.value);

        return Math.round((receita - saida) * 100) / 100;
    }

    function setManualBalance(fid, value) {
        DS().set('cashflow_saldo_manual_' + fid, { value: Number(value), at: new Date().toISOString() });
    }

    /**
     * Média diária de vendas das últimas N dias (fallback 14).
     */
    function avgDailySales(fid, days) {
        days = days || 14;
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const since = addDays(today0(), -days);
        const recent = orders.filter(o => o.createdAt && new Date(o.createdAt) >= since &&
                                        ['confirmado','entregue','pago'].includes(o.status));
        if (!recent.length) return 0;
        const total = recent.reduce((s,o) => s + (Number(o.total)||0), 0);
        return Math.round(total / days * 100) / 100;
    }

    /**
     * Projeção de caixa dia a dia dos próximos 30 dias.
     */
    function projectD30(fid) {
        const saldoAtual = currentBalance(fid);
        const pay = listPayables(fid, { open: true });
        const rec = listReceivables(fid, { open: true });
        const avgSales = avgDailySales(fid, 14);

        // Recorrentes (do Financas)
        let recurring = [];
        try {
            if (global.Financas && global.Financas.listRecurring) {
                recurring = global.Financas.listRecurring(fid) || [];
            }
        } catch(e){}

        const days = [];
        const start = today0();
        let saldo = saldoAtual;

        // CMV médio como % da receita (últimos 14d)
        let cmvPct = 0.32;
        try {
            if (global.FinanceRealtime) {
                const pk = (new Date()).toISOString().slice(0,7);
                const cmv = global.FinanceRealtime.computeCMV(fid, pk);
                if (cmv.receita > 0) cmvPct = cmv.custo / cmv.receita;
            }
        } catch(e){}

        for (let i = 0; i < 30; i++) {
            const date = addDays(start, i);
            const dateIso = date.toISOString().slice(0,10);
            const dow = date.getDay();

            // Entradas
            let entradas = 0;
            let entradasDetail = [];

            // Contas a receber que vencem HOJE
            rec.forEach(r => {
                if (!r.vencimento) return;
                if (r.vencimento.slice(0,10) === dateIso) {
                    entradas += Number(r.valor) || 0;
                    entradasDetail.push({ tipo: 'contas-receber', desc: r.desc, valor: r.valor });
                }
            });

            // Projeção de vendas (se não for domingo — ajuste conforme loja)
            if (i > 0 && avgSales > 0) {
                const factor = (dow === 0 || dow === 1) ? 0.6 : (dow === 6 ? 1.3 : 1.0);
                const proj = avgSales * factor;
                entradas += proj;
                entradasDetail.push({ tipo: 'vendas-projecao', desc: 'Vendas projetadas', valor: Math.round(proj*100)/100 });
            }

            // Saídas
            let saidas = 0;
            let saidasDetail = [];

            // Contas a pagar que vencem HOJE
            pay.forEach(p => {
                if (!p.vencimento) return;
                if (p.vencimento.slice(0,10) === dateIso) {
                    saidas += Number(p.valor) || 0;
                    saidasDetail.push({ tipo: 'contas-pagar', desc: p.desc, valor: p.valor });
                }
            });

            // Recorrentes mensais (dia do vencimento == dia do mês correspondente)
            recurring.filter(r => r.active !== false).forEach(r => {
                const dueDay = r.dueDay || 1;
                if (date.getDate() === dueDay) {
                    if (r.kind === 'fixed' || r.kind === 'variable') {
                        saidas += Number(r.valor) || 0;
                        saidasDetail.push({ tipo: 'recorrente-' + r.kind, desc: r.descricao || r.categoria, valor: r.valor });
                    }
                }
            });

            // CMV projetado (custo variável das vendas projetadas)
            if (i > 0 && avgSales > 0) {
                const dayRev = entradasDetail.find(e => e.tipo === 'vendas-projecao');
                if (dayRev) {
                    const cmv = dayRev.valor * cmvPct;
                    saidas += cmv;
                    saidasDetail.push({ tipo: 'cmv-projecao', desc: 'CMV projetado', valor: Math.round(cmv*100)/100 });
                }
            }

            saldo = saldo + entradas - saidas;
            days.push({
                date: dateIso,
                dow: dow,
                dayLabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }),
                entradas: Math.round(entradas*100)/100,
                saidas: Math.round(saidas*100)/100,
                saldo: Math.round(saldo*100)/100,
                entradasDetail,
                saidasDetail,
                isWeekend: dow === 0 || dow === 6
            });
        }

        // Totais
        const totais = {
            entradas: days.reduce((s,d) => s + d.entradas, 0),
            saidas: days.reduce((s,d) => s + d.saidas, 0),
            saldoFinal: days[days.length-1].saldo,
            saldoAtual: saldoAtual,
            diasNegativos: days.filter(d => d.saldo < 0).length,
            menorSaldo: Math.min(...days.map(d => d.saldo))
        };

        // Alertas
        const alertas = [];
        if (totais.menorSaldo < 0) {
            const diaNeg = days.find(d => d.saldo < 0);
            alertas.push({
                level: 'critical',
                title: 'Caixa ficará NEGATIVO em ' + diaNeg.dayLabel,
                detail: 'Menor saldo projetado: R$ ' + totais.menorSaldo.toFixed(2),
                action: 'Antecipa receita (iFood antecipação) ou adia contas não-essenciais.'
            });
        }
        if (totais.saldoFinal < saldoAtual * 0.5 && totais.saldoFinal > 0) {
            alertas.push({
                level: 'medium',
                title: 'Caixa vai encolher 50%+ em 30 dias',
                detail: 'Saldo atual R$' + saldoAtual.toFixed(0) + ' → projeção R$' + totais.saldoFinal.toFixed(0),
                action: 'Aumenta volume de vendas 15% ou reduz custos fixos.'
            });
        }

        return { saldoAtual, days, totais, alertas, cmvPct, avgSales };
    }

    /**
     * Lista contas vencendo nos próximos N dias (alertas).
     */
    function listUpcoming(fid, days) {
        days = days || 7;
        const limit = addDays(today0(), days);
        const pay = listPayables(fid, { open: true }).filter(p =>
            p.vencimento && new Date(p.vencimento) >= today0() && new Date(p.vencimento) <= limit
        ).map(p => ({ type: 'pay', entry: p, daysUntil: daysBetween(new Date(), p.vencimento) }));
        const rec = listReceivables(fid, { open: true }).filter(r =>
            r.vencimento && new Date(r.vencimento) >= today0() && new Date(r.vencimento) <= limit
        ).map(r => ({ type: 'rec', entry: r, daysUntil: daysBetween(new Date(), r.vencimento) }));
        return pay.concat(rec).sort((a,b) => a.daysUntil - b.daysUntil);
    }

    /** Contas vencidas (em atraso). */
    function listOverdue(fid) {
        const pay = listPayables(fid, { open: true }).filter(p =>
            p.vencimento && new Date(p.vencimento) < today0()
        ).map(p => ({ type: 'pay', entry: p, daysOverdue: Math.abs(daysBetween(p.vencimento, new Date())) }));
        return pay.sort((a,b) => b.daysOverdue - a.daysOverdue);
    }

    global.Cashflow = {
        listPayables, addPayable, updatePayable, markPaid, deletePayable,
        listReceivables, addReceivable, updateReceivable, markReceived, deleteReceivable,
        currentBalance, setManualBalance, avgDailySales,
        projectD30, listUpcoming, listOverdue
    };
})(typeof window !== 'undefined' ? window : this);
