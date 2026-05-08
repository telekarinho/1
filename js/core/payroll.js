/* MilkyPot — Payroll & Bank-of-Hours module
   Calcula holerite simplificado mensal + gerencia solicitacoes de banco de horas. */
(function () {
    'use strict';

    var COLLECTION_REQUESTS = 'bank_hours_requests';

    var INSS_TIERS_2025 = [
        { upTo: 1518.00,    rate: 0.075, deduct: 0.00 },
        { upTo: 2793.88,    rate: 0.090, deduct: 22.77 },
        { upTo: 4190.83,    rate: 0.120, deduct: 106.59 },
        { upTo: 8157.41,    rate: 0.140, deduct: 190.41 }
    ];
    var INSS_TETO = 951.62;

    function nowIso() { return new Date().toISOString(); }

    function calcINSS(salario) {
        if (!salario || salario <= 0) return 0;
        var s = parseFloat(salario);
        for (var i = 0; i < INSS_TIERS_2025.length; i++) {
            var tier = INSS_TIERS_2025[i];
            if (s <= tier.upTo) {
                return Math.max(0, s * tier.rate - tier.deduct);
            }
        }
        return INSS_TETO;
    }

    function calcIRRF(baseCalculo) {
        // Tabela 2025 simplificada (dependentes nao considerados)
        if (baseCalculo <= 2259.20) return 0;
        if (baseCalculo <= 2826.65) return Math.max(0, baseCalculo * 0.075 - 169.44);
        if (baseCalculo <= 3751.05) return Math.max(0, baseCalculo * 0.150 - 381.44);
        if (baseCalculo <= 4664.68) return Math.max(0, baseCalculo * 0.225 - 662.77);
        return Math.max(0, baseCalculo * 0.275 - 896.00);
    }

    /**
     * Calcula holerite mensal de um funcionario.
     */
    function computePayslip(franchiseId, staffId, year, month) {
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; })
            : null;
        if (!staff) return { error: 'Funcionario nao encontrado' };

        var espelho = (typeof TimeClock !== 'undefined')
            ? TimeClock.computeMonth(franchiseId, staffId, year, month)
            : null;

        var salarioBase = parseFloat(staff.salary) || 0;
        var cargaSemanal = parseFloat(staff.carga_horaria_semanal) || 44;
        var horasMensais = cargaSemanal * 4.33;
        var valorHora = horasMensais > 0 ? salarioBase / horasMensais : 0;

        var hExtras = espelho ? (espelho.totals.extras || 0) / 60 : 0;
        var valorExtras = hExtras * valorHora * 1.5; // adicional minimo 50%

        var hAtraso = espelho ? (espelho.totals.atraso || 0) / 60 : 0;
        var descontoAtraso = hAtraso * valorHora;

        var hNoturno = espelho ? (espelho.totals.noturno || 0) / 60 : 0;
        var adicionalNoturno = hNoturno * valorHora * 0.20;

        var faltas = espelho ? espelho.totals.faltas : 0;
        // Cada falta sem justificativa: 1 dia + DSR proporcional (1/6)
        var diasUteis = (staff.jornada && staff.jornada.tipo === '6x1') ? 26 : 22;
        var valorDiario = salarioBase / 30;
        var descontoFaltas = faltas * valorDiario * (7 / 6); // dia + DSR

        // Beneficios consumidos no mes (nao deduzem do salario, mas mostram no holerite)
        var beneficios = (typeof StaffBenefits !== 'undefined')
            ? StaffBenefits.totalMonth(franchiseId, staffId, year, month)
            : { count: 0, total: 0 };

        var salarioBruto = salarioBase + valorExtras + adicionalNoturno - descontoAtraso - descontoFaltas;
        var inss = calcINSS(salarioBruto);
        var baseIRRF = salarioBruto - inss;
        var irrf = calcIRRF(baseIRRF);
        var salarioLiquido = salarioBruto - inss - irrf;

        // Provisoes (custo do empregador, nao deduzido)
        var prov13 = salarioBase / 12;
        var provFerias = (salarioBase / 12) * (4 / 3);
        var fgts = salarioBruto * 0.08;

        return {
            staff: {
                name: staff.name,
                role: staff.role,
                cpf: staff.cpf,
                pis: staff.pis,
                startDate: staff.startDate
            },
            month: year + '-' + String(month).padStart(2, '0'),
            base: {
                salarioBase: salarioBase,
                cargaSemanal: cargaSemanal,
                valorHora: valorHora,
                diasTrabalhados: espelho ? espelho.totals.diasTrabalhados : 0,
                horasTrabalhadas: espelho ? (espelho.totals.trabalhado / 60) : 0
            },
            proventos: {
                salarioBase: salarioBase,
                horasExtras: { qtd: hExtras, valor: valorExtras },
                adicionalNoturno: { qtd: hNoturno, valor: adicionalNoturno },
                total: salarioBase + valorExtras + adicionalNoturno
            },
            descontos: {
                atrasos: { qtd: hAtraso, valor: descontoAtraso },
                faltas: { qtd: faltas, valor: descontoFaltas },
                inss: inss,
                irrf: irrf,
                total: descontoAtraso + descontoFaltas + inss + irrf
            },
            salarioBruto: salarioBruto,
            salarioLiquido: salarioLiquido,
            beneficiosConsumidos: { count: beneficios.count, valor: beneficios.total },
            provisoes: {
                fgts: fgts,
                decimoTerceiro: prov13,
                ferias: provFerias,
                total: fgts + prov13 + provFerias
            },
            custoTotal: salarioBruto + fgts + prov13 + provFerias
        };
    }

    function formatBRL(v) {
        var n = parseFloat(v) || 0;
        return 'R$ ' + n.toFixed(2).replace('.', ',');
    }

    function generatePayslipHTML(payslip) {
        if (payslip.error) return '<p>' + payslip.error + '</p>';
        var s = payslip;
        var html = '<div style="font-family:\'Nunito\',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;color:#111">';
        html += '<div style="text-align:center;border-bottom:3px solid #16A34A;padding-bottom:14px;margin-bottom:14px">';
        html += '<h2 style="margin:0;color:#16A34A;font-family:\'Baloo 2\',cursive">MilkyPot — Demonstrativo de Pagamento</h2>';
        html += '<small style="color:#666">Mes ' + s.month + ' • Documento informativo</small>';
        html += '</div>';

        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:.9rem;margin-bottom:14px">';
        html += '<div><strong>Funcionario:</strong> ' + (s.staff.name || '-') + '</div>';
        html += '<div><strong>Cargo:</strong> ' + (s.staff.role || '-') + '</div>';
        html += '<div><strong>CPF:</strong> ' + (s.staff.cpf || '-') + '</div>';
        html += '<div><strong>PIS:</strong> ' + (s.staff.pis || '-') + '</div>';
        html += '<div><strong>Carga semanal:</strong> ' + s.base.cargaSemanal + 'h</div>';
        html += '<div><strong>Dias trabalhados:</strong> ' + s.base.diasTrabalhados + '</div>';
        html += '</div>';

        html += '<table style="width:100%;border-collapse:collapse;font-size:.88rem;margin-bottom:14px">';
        html += '<thead><tr style="background:#F0FDF4"><th style="text-align:left;padding:8px;border-bottom:2px solid #BBF7D0">Proventos</th><th style="text-align:right;padding:8px;border-bottom:2px solid #BBF7D0">Valor</th></tr></thead><tbody>';
        html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">Salario base</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">' + formatBRL(s.proventos.salarioBase) + '</td></tr>';
        if (s.proventos.horasExtras.qtd > 0)
            html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">Horas extras (' + s.proventos.horasExtras.qtd.toFixed(1) + 'h x 1.5)</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">' + formatBRL(s.proventos.horasExtras.valor) + '</td></tr>';
        if (s.proventos.adicionalNoturno.qtd > 0)
            html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">Adicional noturno (' + s.proventos.adicionalNoturno.qtd.toFixed(1) + 'h x 1.2)</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">' + formatBRL(s.proventos.adicionalNoturno.valor) + '</td></tr>';
        html += '<tr style="font-weight:800;background:#F0FDF4"><td style="padding:8px">Total proventos</td><td style="text-align:right;padding:8px">' + formatBRL(s.proventos.total) + '</td></tr>';
        html += '</tbody></table>';

        html += '<table style="width:100%;border-collapse:collapse;font-size:.88rem;margin-bottom:14px">';
        html += '<thead><tr style="background:#FEF2F2"><th style="text-align:left;padding:8px;border-bottom:2px solid #FECACA">Descontos</th><th style="text-align:right;padding:8px;border-bottom:2px solid #FECACA">Valor</th></tr></thead><tbody>';
        if (s.descontos.atrasos.qtd > 0)
            html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">Atrasos (' + s.descontos.atrasos.qtd.toFixed(1) + 'h)</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">- ' + formatBRL(s.descontos.atrasos.valor) + '</td></tr>';
        if (s.descontos.faltas.qtd > 0)
            html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">Faltas s/ justific. (' + s.descontos.faltas.qtd + ' x dia + DSR)</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">- ' + formatBRL(s.descontos.faltas.valor) + '</td></tr>';
        html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">INSS</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">- ' + formatBRL(s.descontos.inss) + '</td></tr>';
        if (s.descontos.irrf > 0)
            html += '<tr><td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">IRRF</td><td style="text-align:right;padding:6px 8px;border-bottom:1px solid #F3F4F6">- ' + formatBRL(s.descontos.irrf) + '</td></tr>';
        html += '<tr style="font-weight:800;background:#FEF2F2"><td style="padding:8px">Total descontos</td><td style="text-align:right;padding:8px">- ' + formatBRL(s.descontos.total) + '</td></tr>';
        html += '</tbody></table>';

        html += '<div style="background:linear-gradient(135deg,#16A34A,#22C55E);color:#fff;padding:16px;border-radius:10px;text-align:center;margin-bottom:14px">';
        html += '<small style="opacity:.9">SALARIO LIQUIDO</small>';
        html += '<div style="font-size:1.8rem;font-family:\'Baloo 2\',cursive;font-weight:800">' + formatBRL(s.salarioLiquido) + '</div>';
        html += '</div>';

        if (s.beneficiosConsumidos.count > 0) {
            html += '<div style="background:#F0FDF4;border-left:4px solid #16A34A;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:.85rem">';
            html += '<strong>Beneficios consumidos no mes:</strong> ' + s.beneficiosConsumidos.count + ' itens — ' + formatBRL(s.beneficiosConsumidos.valor);
            html += '<br><small style="color:#666">Beneficios sao custo do empregador. Nao deduzem do seu salario.</small>';
            html += '</div>';
        }

        html += '<details style="margin-top:14px"><summary style="cursor:pointer;font-size:.82rem;color:#666;font-weight:700">Custo total para o empregador (encargos)</summary>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px">';
        html += '<tr><td style="padding:5px">FGTS (8%)</td><td style="text-align:right">' + formatBRL(s.provisoes.fgts) + '</td></tr>';
        html += '<tr><td style="padding:5px">Provisao 13o (1/12)</td><td style="text-align:right">' + formatBRL(s.provisoes.decimoTerceiro) + '</td></tr>';
        html += '<tr><td style="padding:5px">Provisao ferias (1/12+1/3)</td><td style="text-align:right">' + formatBRL(s.provisoes.ferias) + '</td></tr>';
        html += '<tr style="font-weight:700;border-top:1px solid #ddd"><td style="padding:5px">Custo total</td><td style="text-align:right">' + formatBRL(s.custoTotal) + '</td></tr>';
        html += '</table></details>';

        html += '<p style="text-align:center;font-size:.7rem;color:#9CA3AF;margin-top:14px">Documento informativo. Holerite oficial deve ser emitido pela contabilidade.</p>';
        html += '</div>';
        return html;
    }

    /* ============== BANCO DE HORAS ============== */

    function requestBankHours(franchiseId, request) {
        if (!request || !request.staffId) return { success: false, error: 'Dados invalidos' };
        var entry = {
            id: 'bh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            staffId: request.staffId,
            staffName: request.staffName || '',
            type: request.type || 'compensar',  // 'compensar' (uso saldo) ou 'acumular' (cria saldo)
            requestDate: request.requestDate || nowIso().slice(0, 10),
            useDate: request.useDate || null,    // se compensar
            hoursMin: parseInt(request.hoursMin, 10) || 0,
            reason: request.reason || '',
            status: 'pending',                    // pending | approved | rejected
            createdAt: nowIso(),
            createdBy: request.createdBy || ''
        };
        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection(COLLECTION_REQUESTS, franchiseId, entry);
        }
        return { success: true, entry: entry };
    }

    function approveBankHours(franchiseId, requestId, approverEmail, observation) {
        if (typeof DataStore === 'undefined') return { success: false };
        var all = DataStore.getCollection(COLLECTION_REQUESTS, franchiseId) || [];
        var idx = all.findIndex(function (r) { return r.id === requestId; });
        if (idx === -1) return { success: false, error: 'Solicitacao nao encontrada' };
        all[idx].status = 'approved';
        all[idx].approvedAt = nowIso();
        all[idx].approvedBy = approverEmail || '';
        all[idx].approverObservation = observation || '';
        DataStore.saveCollection(COLLECTION_REQUESTS, franchiseId, all);
        return { success: true };
    }

    function rejectBankHours(franchiseId, requestId, approverEmail, reason) {
        if (typeof DataStore === 'undefined') return { success: false };
        var all = DataStore.getCollection(COLLECTION_REQUESTS, franchiseId) || [];
        var idx = all.findIndex(function (r) { return r.id === requestId; });
        if (idx === -1) return { success: false, error: 'Solicitacao nao encontrada' };
        all[idx].status = 'rejected';
        all[idx].rejectedAt = nowIso();
        all[idx].rejectedBy = approverEmail || '';
        all[idx].rejectReason = reason || '';
        DataStore.saveCollection(COLLECTION_REQUESTS, franchiseId, all);
        return { success: true };
    }

    function listBankHoursRequests(franchiseId, filter) {
        if (typeof DataStore === 'undefined') return [];
        var all = DataStore.getCollection(COLLECTION_REQUESTS, franchiseId) || [];
        filter = filter || {};
        return all.filter(function (r) {
            if (filter.staffId && r.staffId !== filter.staffId) return false;
            if (filter.status && r.status !== filter.status) return false;
            return true;
        }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    }

    window.Payroll = {
        calcINSS: calcINSS,
        calcIRRF: calcIRRF,
        computePayslip: computePayslip,
        generatePayslipHTML: generatePayslipHTML,
        formatBRL: formatBRL,
        // banco horas
        requestBankHours: requestBankHours,
        approveBankHours: approveBankHours,
        rejectBankHours: rejectBankHours,
        listBankHoursRequests: listBankHoursRequests
    };
})();
