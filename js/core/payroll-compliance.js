/* ============================================
   MilkyPot — Payroll Compliance (Folha + Encargos + Verbas)
   ============================================
   Calcula provisoes, descontos e verbas legais brasileiras:
   - Holerite mensal (proventos + descontos + liquido)
   - Ferias: periodo aquisitivo, gozo, 1/3 constitucional, abono pecuniario (1/3)
   - 13o salario: 1a parcela (Nov), 2a parcela (Dez), com base media anual
   - FGTS: 8% mensal + multa 40% rescisao
   - INSS 2025 (tabela CCI) — escalonado por faixa
   - IRRF 2025 — escalonado + deducoes legais (dependentes, INSS, etc)
   - Vale-transporte (max 6% do salario)
   - Salario-familia (CCI 2025)
   - DSR sobre comissoes/HE/noturno

   Tabelas 2025 (atualizar conforme Lei 14.663/2023 e portarias anuais):
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // 📊 TABELAS LEGAIS 2025 (atualizar anualmente)
    // ============================================

    // Salario minimo 2025 (referencia)
    var SALARIO_MINIMO = 1518.00;

    // Tabela INSS 2025 (Portaria MPS 6/2025)
    var INSS_2025 = [
        { ate: 1518.00,  aliq: 0.075 },   // 7.5%
        { ate: 2793.88,  aliq: 0.09 },    // 9%
        { ate: 4190.83,  aliq: 0.12 },    // 12%
        { ate: 8157.41,  aliq: 0.14 }     // 14% — teto
    ];

    // Tabela IRRF 2025 (Lei 14.663/2023 + IN RFB)
    var IRRF_2025 = [
        { ate: 2428.80,  aliq: 0.00,  deducao: 0 },
        { ate: 2826.65,  aliq: 0.075, deducao: 182.16 },
        { ate: 3751.05,  aliq: 0.15,  deducao: 394.16 },
        { ate: 4664.68,  aliq: 0.225, deducao: 675.49 },
        { ate: Infinity, aliq: 0.275, deducao: 908.73 }
    ];
    var IRRF_DESCONTO_DEPENDENTE = 189.59;     // por dependente
    var IRRF_DESCONTO_SIMPLIFICADO = 564.80;    // alternativa ao calculo deducoes

    // Salario-familia 2025
    var SAL_FAMILIA = {
        teto: 1906.04,           // recebe se salario contribuicao <= teto
        valor_por_filho: 65.00   // por filho ate 14 anos (ou invalido)
    };

    // Vale-transporte
    var VT_MAX_DESCONTO = 0.06;   // max 6% do salario base

    // FGTS
    var FGTS_ALIQ = 0.08;
    var FGTS_MULTA_RESCISAO_SEM_JUSTA_CAUSA = 0.40;

    // ============================================
    // 🧮 HELPERS DE CALCULO
    // ============================================

    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    function calculaINSS(baseContribuicao) {
        var inss = 0;
        var anterior = 0;
        for (var i = 0; i < INSS_2025.length; i++) {
            var faixa = INSS_2025[i];
            if (baseContribuicao <= faixa.ate) {
                inss += (baseContribuicao - anterior) * faixa.aliq;
                anterior = baseContribuicao;
                break;
            } else {
                inss += (faixa.ate - anterior) * faixa.aliq;
                anterior = faixa.ate;
            }
        }
        return round2(Math.min(inss, INSS_2025[INSS_2025.length - 1].ate * INSS_2025[INSS_2025.length - 1].aliq));
    }

    function calculaIRRF(baseTributavel, dependentes) {
        if (!dependentes) dependentes = 0;
        // Calculo tradicional (com deducoes)
        var baseComDed = baseTributavel - (dependentes * IRRF_DESCONTO_DEPENDENTE);
        var irrfTrad = 0;
        for (var i = 0; i < IRRF_2025.length; i++) {
            if (baseComDed <= IRRF_2025[i].ate) {
                irrfTrad = baseComDed * IRRF_2025[i].aliq - IRRF_2025[i].deducao;
                break;
            }
        }
        irrfTrad = Math.max(0, irrfTrad);

        // Calculo simplificado (introduzido 2024) — funcionario escolhe o menor
        var baseSimpl = baseTributavel - IRRF_DESCONTO_SIMPLIFICADO;
        var irrfSimpl = 0;
        for (var j = 0; j < IRRF_2025.length; j++) {
            if (baseSimpl <= IRRF_2025[j].ate) {
                irrfSimpl = baseSimpl * IRRF_2025[j].aliq - IRRF_2025[j].deducao;
                break;
            }
        }
        irrfSimpl = Math.max(0, irrfSimpl);

        return round2(Math.min(irrfTrad, irrfSimpl));
    }

    function calculaSalarioFamilia(salarioContribuicao, qtdFilhosElegiveis) {
        if (!qtdFilhosElegiveis || salarioContribuicao > SAL_FAMILIA.teto) return 0;
        return round2(qtdFilhosElegiveis * SAL_FAMILIA.valor_por_filho);
    }

    // ============================================
    // 💰 HOLERITE MENSAL
    // ============================================
    /**
     * Gera holerite mensal completo a partir do espelho de ponto + dados do staff.
     * staff: { id, name, cpf, pis, salario_base, dependentes_irrf, dependentes_salfamilia,
     *          vale_transporte, vale_refeicao_dia, dataAdmissao }
     */
    function gerarHolerite(franchiseId, staffId, year, month) {
        if (typeof TimeClock === 'undefined') throw new Error('TimeClock nao disponivel');
        if (typeof DataStore === 'undefined') throw new Error('DataStore nao disponivel');

        var staff = (DataStore.getCollection('staff', franchiseId) || [])
            .find(function (s) { return s.id === staffId; });
        if (!staff) throw new Error('Funcionario nao encontrado');

        var espelho = TimeClock.computeMonth(franchiseId, staffId, year, month);
        var salarioBase = parseFloat(staff.salario_base || 0);
        var valorHora = salarioBase / 220;  // 220h mensais (CLT padrao 44h/sem)

        // PROVENTOS
        var proventos = [];

        // 1. Salario base (proporcional aos dias trabalhados + folga + faltas justificadas)
        var lastDay = new Date(year, month, 0).getDate();
        var diasUteis = espelho.days.filter(function (d) { return !d.isFolga || d.completo; }).length;
        var diasAusentesSemJust = espelho.totals.faltas;
        var diasPagos = lastDay - diasAusentesSemJust;  // CLT: trabalhou ou justificado = paga
        var salarioProporcional = round2(salarioBase * diasPagos / lastDay);
        proventos.push({ codigo: '001', descricao: 'Salario base (proporcional ' + diasPagos + '/' + lastDay + ' dias)', valor: salarioProporcional });

        // 2. Horas extras (incluindo intervalo suprimido se tratamento = hora_extra)
        if (espelho.totals.extras > 0) {
            var valorExtras = round2(valorHora * (espelho.totals.extras / 60) * 1.5);
            proventos.push({ codigo: '010', descricao: 'Horas extras 50% (' + Math.floor(espelho.totals.extras/60) + 'h ' + (espelho.totals.extras%60) + 'min)', valor: valorExtras });
        }

        // 3. Adicional noturno
        if (espelho.totals.noturno > 0) {
            var valorNoturno = round2(valorHora * (espelho.totals.noturno / 60) * 0.20);
            proventos.push({ codigo: '020', descricao: 'Adicional noturno 20% (' + Math.floor(espelho.totals.noturno/60) + 'h ' + (espelho.totals.noturno%60) + 'min)', valor: valorNoturno });
        }

        // 4. DSR sobre HE + noturno (Lei 605/49, Sumula 172 TST)
        var valorHEN = (espelho.totals.extras / 60 * valorHora * 1.5) + (espelho.totals.noturno / 60 * valorHora * 0.20);
        var diasDescanso = espelho.days.filter(function (d) { return d.isFolga && d.records.length === 0; }).length;
        var diasTrabalhadosUteis = espelho.totals.diasTrabalhados;
        var dsrSobreHEN = 0;
        if (valorHEN > 0 && diasTrabalhadosUteis > 0) {
            dsrSobreHEN = round2(valorHEN * diasDescanso / diasTrabalhadosUteis);
            proventos.push({ codigo: '025', descricao: 'DSR sobre HE/noturno', valor: dsrSobreHEN });
        }

        // 5. Salario-familia
        var totalProventos = proventos.reduce(function (s, p) { return s + p.valor; }, 0);
        var qtdFilhos = parseInt(staff.dependentes_salfamilia || 0, 10);
        var salFam = calculaSalarioFamilia(totalProventos, qtdFilhos);
        if (salFam > 0) proventos.push({ codigo: '030', descricao: 'Salario-familia (' + qtdFilhos + ' filho[s])', valor: salFam });

        // DESCONTOS
        var descontos = [];

        // 1. DSR perdidos por falta nao justificada
        if (espelho.totals.dsrPerdidos > 0) {
            var valorDsr = round2((salarioBase / lastDay) * espelho.totals.dsrPerdidos);
            descontos.push({ codigo: '101', descricao: 'DSR perdido (' + espelho.totals.dsrPerdidos + ' dia[s]) - Lei 605/49', valor: valorDsr });
        }

        // 2. Faltas nao justificadas
        if (diasAusentesSemJust > 0) {
            var valorFaltas = round2((salarioBase / lastDay) * diasAusentesSemJust);
            descontos.push({ codigo: '102', descricao: 'Faltas sem justificativa (' + diasAusentesSemJust + ' dia[s])', valor: valorFaltas });
        }

        // 3. Recalcula totais aplicando descontos pre-INSS
        var baseINSS = round2(totalProventos + salFam - (descontos.reduce(function (s, d) { return s + d.valor; }, 0)));
        var inss = calculaINSS(baseINSS);
        descontos.push({ codigo: '110', descricao: 'INSS', valor: inss });

        // 4. IRRF (base = totalProventos - INSS - dependentes)
        var baseIRRF = round2(baseINSS - inss);
        var dependentesIRRF = parseInt(staff.dependentes_irrf || 0, 10);
        var irrf = calculaIRRF(baseIRRF, dependentesIRRF);
        if (irrf > 0) descontos.push({ codigo: '120', descricao: 'IRRF', valor: irrf });

        // 5. Vale-transporte (max 6% do salario base)
        if (staff.vale_transporte) {
            var vtDesconto = round2(Math.min(salarioBase * VT_MAX_DESCONTO, parseFloat(staff.vale_transporte || 0)));
            descontos.push({ codigo: '130', descricao: 'Vale-transporte (6% legal)', valor: vtDesconto });
        }

        // 6. Vale-refeicao (% acordado, geralmente 20%)
        if (staff.vale_refeicao_desconto) {
            descontos.push({ codigo: '140', descricao: 'Vale-refeicao (cota empregado)', valor: round2(parseFloat(staff.vale_refeicao_desconto || 0)) });
        }

        // Liquido
        var totalDescontos = descontos.reduce(function (s, d) { return s + d.valor; }, 0);
        var liquido = round2(totalProventos - totalDescontos);

        // FGTS (depositado pelo empregador — nao desconta do funcionario, mas informa)
        var fgts = round2(baseINSS * FGTS_ALIQ);

        return {
            staff: {
                id: staff.id,
                name: staff.name,
                cpf: staff.cpf,
                pis: staff.pis,
                cargo: staff.cargo || '-',
                dataAdmissao: staff.dataAdmissao
            },
            periodo: { year: year, month: month, label: pad(month) + '/' + year },
            espelho: { diasTrabalhados: espelho.totals.diasTrabalhados, faltas: diasAusentesSemJust },
            proventos: proventos,
            descontos: descontos,
            totais: {
                totalProventos: round2(totalProventos),
                totalDescontos: round2(totalDescontos),
                liquido: liquido,
                fgts: fgts,
                baseINSS: baseINSS,
                baseIRRF: baseIRRF
            },
            geradoEm: new Date().toISOString()
        };
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    /**
     * Gera HTML do holerite (pronto pra window.print ou conversao em PDF).
     */
    function holeriteHTML(holerite, franchise) {
        franchise = franchise || {};
        var p = holerite;
        var rows = function (items) {
            return items.map(function (i) {
                return '<tr><td style="padding:4px 8px;font-size:.8rem">' + i.codigo + '</td><td style="padding:4px 8px;font-size:.8rem">' + i.descricao + '</td><td style="padding:4px 8px;font-size:.8rem;text-align:right">R$ ' + i.valor.toFixed(2).replace('.', ',') + '</td></tr>';
            }).join('');
        };
        return '<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px;border:1px solid #000">' +
            '<table style="width:100%;margin-bottom:14px"><tr>' +
                '<td><h2 style="margin:0">' + (franchise.nome || 'MilkyPot') + '</h2>' +
                    '<small>CNPJ: ' + (franchise.cnpj || '-') + ' · ' + (franchise.endereco || '') + '</small></td>' +
                '<td style="text-align:right"><b>RECIBO DE PAGAMENTO</b><br><small>Competência: ' + p.periodo.label + '</small></td>' +
            '</tr></table>' +
            '<table style="width:100%;border-top:1px solid #000;border-bottom:1px solid #000;padding:6px 0;margin-bottom:8px">' +
                '<tr><td><b>Funcionário:</b> ' + p.staff.name + '</td><td><b>CPF:</b> ' + (p.staff.cpf || '-') + '</td></tr>' +
                '<tr><td><b>PIS/PASEP:</b> ' + (p.staff.pis || '-') + '</td><td><b>Cargo:</b> ' + p.staff.cargo + '</td></tr>' +
                '<tr><td><b>Admissão:</b> ' + (p.staff.dataAdmissao || '-') + '</td><td><b>Dias trabalhados:</b> ' + p.espelho.diasTrabalhados + '</td></tr>' +
            '</table>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><thead><tr style="background:#E5E7EB"><th style="padding:4px 8px;text-align:left;font-size:.8rem">Cód.</th><th style="padding:4px 8px;text-align:left;font-size:.8rem">Descrição</th><th style="padding:4px 8px;text-align:right;font-size:.8rem">Provento</th></tr></thead><tbody>' + rows(p.proventos) + '</tbody></table>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><thead><tr style="background:#FEE2E2"><th style="padding:4px 8px;text-align:left;font-size:.8rem">Cód.</th><th style="padding:4px 8px;text-align:left;font-size:.8rem">Descrição</th><th style="padding:4px 8px;text-align:right;font-size:.8rem">Desconto</th></tr></thead><tbody>' + rows(p.descontos) + '</tbody></table>' +
            '<table style="width:100%;border-top:2px solid #000;padding-top:8px">' +
                '<tr><td><b>Total Proventos:</b></td><td style="text-align:right"><b>R$ ' + p.totais.totalProventos.toFixed(2).replace('.', ',') + '</b></td></tr>' +
                '<tr><td><b>Total Descontos:</b></td><td style="text-align:right"><b>R$ ' + p.totais.totalDescontos.toFixed(2).replace('.', ',') + '</b></td></tr>' +
                '<tr style="border-top:1px solid #000;background:#D1FAE5"><td style="padding:8px 0"><b>LÍQUIDO A RECEBER:</b></td><td style="text-align:right;padding:8px 0;font-size:1.2rem"><b>R$ ' + p.totais.liquido.toFixed(2).replace('.', ',') + '</b></td></tr>' +
            '</table>' +
            '<div style="margin-top:10px;padding:8px;background:#F3F4F6;font-size:.75rem"><b>Informações para conferência:</b> Base INSS: R$ ' + p.totais.baseINSS.toFixed(2).replace('.', ',') + ' · Base IRRF: R$ ' + p.totais.baseIRRF.toFixed(2).replace('.', ',') + ' · FGTS depositado (não desconta): R$ ' + p.totais.fgts.toFixed(2).replace('.', ',') + '</div>' +
            '<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-top:30px">' +
                '<div style="border-top:1px solid #000;padding-top:4px;text-align:center;font-size:.85rem">Assinatura do empregado</div>' +
                '<div style="border-top:1px solid #000;padding-top:4px;text-align:center;font-size:.85rem">Assinatura/carimbo do empregador</div>' +
            '</div>' +
            '<div style="margin-top:14px;text-align:center;font-size:.7rem;color:#6B7280">Gerado eletronicamente em ' + new Date(p.geradoEm).toLocaleString('pt-BR') + ' · MilkyPot Compliance</div>' +
            '</div>';
    }

    function imprimirHolerite(holerite, franchise) {
        var w = window.open('', '_blank');
        w.document.write('<html><head><title>Holerite ' + holerite.staff.name + ' ' + holerite.periodo.label + '</title></head><body>' + holeriteHTML(holerite, franchise) + '<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>');
        w.document.close();
    }

    // ============================================
    // 🏖 FERIAS
    // ============================================
    /**
     * Calcula situacao de ferias para um staff.
     * Retorna { periodosAquisitivos, periodosVencidos, proximoVencimento, diasDireito, valorEstimado }
     *
     * Logica:
     * - Periodo aquisitivo = 12 meses de trabalho consecutivos a partir da admissao
     * - A cada periodo completo, ganha 30 dias de ferias
     * - Pode gozar nos 12 meses seguintes (periodo concessivo)
     * - Apos 24 meses sem gozar = vencido (paga dobrado conforme CLT 137)
     * - 1/3 constitucional (Art. 7 XVII): adicional obrigatorio
     * - Abono pecuniario (CLT 143): vende ate 1/3 das ferias (10 dias)
     */
    function calculaFerias(staff) {
        if (!staff || !staff.dataAdmissao) {
            return { error: 'Data de admissao nao informada' };
        }
        var admissao = new Date(staff.dataAdmissao + 'T12:00:00');
        var hoje = new Date();
        var salarioBase = parseFloat(staff.salario_base || 0);
        var periodos = [];

        // Itera periodos aquisitivos (1 ano cada)
        var inicio = new Date(admissao);
        while (inicio < hoje) {
            var fim = new Date(inicio);
            fim.setFullYear(fim.getFullYear() + 1);
            fim.setDate(fim.getDate() - 1);
            if (fim > hoje) fim = new Date(hoje);

            var concessivoFim = new Date(fim);
            concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);

            // Status
            var status, completo = inicio < hoje && (new Date(inicio).setFullYear(inicio.getFullYear() + 1)) <= hoje;
            if (!completo) status = 'em_andamento';
            else if (concessivoFim < hoje) status = 'vencido';
            else if (concessivoFim < new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000)) status = 'vence_em_60d';
            else status = 'disponivel';

            // Verifica se ja foi gozado (collection ferias_gozadas_<fid>)
            var gozadas = (typeof DataStore !== 'undefined')
                ? (DataStore.getCollection('ferias_gozadas', staff.franchiseId || '') || []).filter(function (g) {
                    return g.staffId === staff.id && g.periodoAquisitivo === inicio.toISOString().slice(0, 10);
                })
                : [];
            var diasJaGozados = gozadas.reduce(function (s, g) { return s + (g.dias || 0); }, 0);

            periodos.push({
                inicio: inicio.toISOString().slice(0, 10),
                fim: fim.toISOString().slice(0, 10),
                concessivoFim: concessivoFim.toISOString().slice(0, 10),
                status: status,
                completo: completo,
                diasDireito: completo ? 30 : Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24) / 30) * 2.5,
                diasJaGozados: diasJaGozados,
                diasRestantes: completo ? 30 - diasJaGozados : 0,
                valorEstimado: round2(salarioBase * (4 / 3))  // salario + 1/3
            });

            inicio = new Date(fim);
            inicio.setDate(inicio.getDate() + 1);
        }

        var vencidos = periodos.filter(function (p) { return p.status === 'vencido' && p.diasRestantes > 0; });
        var proxVenc = periodos.find(function (p) { return p.status === 'vence_em_60d'; });

        return {
            periodos: periodos,
            vencidos: vencidos,
            proximoVencimento: proxVenc || null,
            alerta: vencidos.length > 0
                ? '🚨 ' + vencidos.length + ' periodo(s) de ferias VENCIDO(S) — pagamento em DOBRO conforme CLT 137'
                : (proxVenc ? '⚠ Periodo vencendo em breve: programar gozo antes de ' + proxVenc.concessivoFim : '✓ Tudo em dia')
        };
    }

    /**
     * Calcula valor de gozo de ferias (com 1/3 e abono opcional)
     */
    function valorFerias(staff, diasGozados, vendeAbono) {
        var salarioBase = parseFloat(staff.salario_base || 0);
        var diaria = salarioBase / 30;
        var valorBruto = diaria * diasGozados;
        var umTerco = valorBruto / 3;
        var abono = vendeAbono ? round2(diaria * 10 + diaria * 10 / 3) : 0;  // vende 10 dias + 1/3
        var totalBruto = round2(valorBruto + umTerco + abono);

        // INSS + IRRF
        var inss = calculaINSS(totalBruto);
        var irrf = calculaIRRF(totalBruto - inss, parseInt(staff.dependentes_irrf || 0, 10));

        return {
            diasGozados: diasGozados,
            valorBruto: round2(valorBruto),
            umTercoConstitucional: round2(umTerco),
            abonoPecuniario: abono,
            totalBruto: totalBruto,
            inss: inss,
            irrf: irrf,
            liquido: round2(totalBruto - inss - irrf)
        };
    }

    // ============================================
    // 🎁 13o SALARIO
    // ============================================
    /**
     * Calcula 13o conforme CF 7º VIII + Lei 4.090/62
     * 1a parcela: paga ate 30/Nov (50% do salario)
     * 2a parcela: paga ate 20/Dez (50% - INSS - IRRF)
     * Base: media dos meses trabalhados no ano (>= 15 dias = mes completo)
     */
    function calcula13o(franchiseId, staffId, year) {
        if (typeof DataStore === 'undefined') return null;
        var staff = (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; });
        if (!staff) return null;
        var salarioBase = parseFloat(staff.salario_base || 0);
        var admissao = new Date(staff.dataAdmissao + 'T12:00:00');

        // Conta meses trabalhados no ano (>= 15 dias)
        var mesesTrabalhados = 0;
        var hoje = new Date();
        for (var m = 1; m <= 12; m++) {
            var inicio = new Date(year, m - 1, 1);
            var fim = new Date(year, m, 0);
            if (admissao > fim) continue;
            if (inicio > hoje) break;
            // Considera proporcional: admitido dia <= 15 = mes completo
            if (admissao >= inicio && admissao <= fim) {
                if (admissao.getDate() <= 15) mesesTrabalhados++;
            } else {
                mesesTrabalhados++;
            }
        }

        // Soma medias mensais (HE + noturno + comissoes) — pra simplificar, pega ultimo espelho disponivel
        // Em producao, deveria computar media de todos os meses do ano
        var totalMediaMensal = salarioBase;
        try {
            if (typeof TimeClock !== 'undefined') {
                var espelho = TimeClock.computeMonth(franchiseId, staffId, year, hoje.getMonth() + 1);
                var heValor = (espelho.totals.extras / 60) * (salarioBase / 220) * 1.5;
                var notValor = (espelho.totals.noturno / 60) * (salarioBase / 220) * 0.20;
                totalMediaMensal += heValor + notValor;
            }
        } catch (e) {}

        var baseAvos = totalMediaMensal * (mesesTrabalhados / 12);
        var primeiraParcela = round2(baseAvos * 0.5);
        var inss = calculaINSS(baseAvos);
        var irrf = calculaIRRF(baseAvos - inss, parseInt(staff.dependentes_irrf || 0, 10));
        var segundaParcela = round2(baseAvos - primeiraParcela - inss - irrf);

        return {
            staff: { id: staff.id, name: staff.name, cpf: staff.cpf },
            year: year,
            mesesTrabalhados: mesesTrabalhados,
            avos: mesesTrabalhados + '/12',
            baseAvos: round2(baseAvos),
            primeiraParcela: { valor: primeiraParcela, vencimento: year + '-11-30' },
            segundaParcela: { valor: segundaParcela, vencimento: year + '-12-20', inssDescontado: inss, irrfDescontado: irrf }
        };
    }

    // ============================================
    // 🏦 FGTS — Saldo + Multa Rescisao
    // ============================================
    /**
     * Calcula saldo acumulado de FGTS de um staff.
     * Considera 8% sobre todas as remuneracoes desde a admissao.
     * Multa rescisao = 40% do saldo (sem justa causa).
     */
    function calculaFGTS(franchiseId, staffId) {
        if (typeof DataStore === 'undefined') return null;
        var staff = (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; });
        if (!staff || !staff.dataAdmissao) return null;
        var salarioBase = parseFloat(staff.salario_base || 0);
        var admissao = new Date(staff.dataAdmissao + 'T12:00:00');
        var hoje = new Date();
        var mesesTrab = (hoje.getFullYear() - admissao.getFullYear()) * 12 + (hoje.getMonth() - admissao.getMonth());
        if (mesesTrab < 0) mesesTrab = 0;

        // FGTS aproximado (8% sobre salario por mes trabalhado)
        // Producao real: deveria somar TODOS os holerites (com HE, noturno, 13o, ferias)
        var saldoAprox = round2(salarioBase * FGTS_ALIQ * mesesTrab);
        var multaRescisao = round2(saldoAprox * FGTS_MULTA_RESCISAO_SEM_JUSTA_CAUSA);

        return {
            staffId: staff.id,
            staffName: staff.name,
            mesesContribuidos: mesesTrab,
            depositoMensal: round2(salarioBase * FGTS_ALIQ),
            saldoEstimado: saldoAprox,
            multaRescisaoSemJustaCausa: multaRescisao,
            custoTotalRescisao: round2(saldoAprox + multaRescisao),
            observacao: 'Estimativa simplificada. Para valor exato, consulte extrato CAIXA.'
        };
    }

    // ============================================
    // 📋 RESCISAO COMPLETA
    // ============================================
    /**
     * Calcula valores de rescisao conforme motivo:
     * - dispensa_sem_justa_causa: aviso previo, 13o prop, ferias prop, 1/3, FGTS + 40% multa
     * - pedido_demissao: 13o prop, ferias prop, 1/3 (sem aviso indenizado, sem multa FGTS)
     * - termino_contrato_experiencia: 13o prop, ferias prop, FGTS
     * - justa_causa: somente saldo salario + ferias vencidas (sem aviso, sem multa, sem 13o)
     */
    function calculaRescisao(franchiseId, staffId, motivo, dataRescisao) {
        if (typeof DataStore === 'undefined') return null;
        var staff = (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; });
        if (!staff || !staff.dataAdmissao) return null;
        var salarioBase = parseFloat(staff.salario_base || 0);
        var admissao = new Date(staff.dataAdmissao + 'T12:00:00');
        var resc = new Date((dataRescisao || new Date().toISOString().slice(0, 10)) + 'T12:00:00');
        var anosTrab = (resc - admissao) / (1000 * 60 * 60 * 24 * 365);
        var mesesProp = (resc.getMonth() + 1);  // meses do ano corrente

        var verbas = [];
        var direitos = {
            dispensa_sem_justa_causa: { avisoIndenizado: true, multa40: true, decimo: true, ferias: true, multaFGTS: true },
            pedido_demissao:           { avisoIndenizado: false, multa40: false, decimo: true, ferias: true, multaFGTS: false },
            termino_contrato:          { avisoIndenizado: false, multa40: false, decimo: true, ferias: true, multaFGTS: false },
            justa_causa:               { avisoIndenizado: false, multa40: false, decimo: false, ferias: false, multaFGTS: false }
        };
        var d = direitos[motivo] || direitos.dispensa_sem_justa_causa;

        // Saldo salario (dias do mes corrente)
        var diasMes = resc.getDate();
        var lastDayMes = new Date(resc.getFullYear(), resc.getMonth() + 1, 0).getDate();
        verbas.push({ desc: 'Saldo salario (' + diasMes + '/' + lastDayMes + ' dias)', valor: round2(salarioBase * diasMes / lastDayMes) });

        if (d.avisoIndenizado) {
            // Aviso previo: 30 dias + 3 dias por ano trabalhado (max 90)
            var diasAviso = Math.min(30 + Math.floor(anosTrab) * 3, 90);
            verbas.push({ desc: 'Aviso previo indenizado (' + diasAviso + ' dias)', valor: round2(salarioBase / 30 * diasAviso) });
        }

        if (d.decimo) {
            verbas.push({ desc: '13o salario proporcional (' + mesesProp + '/12)', valor: round2(salarioBase * mesesProp / 12) });
        }

        if (d.ferias) {
            // Ferias proporcionais + 1/3
            var feriasProp = round2(salarioBase * (mesesProp / 12) * (4 / 3));
            verbas.push({ desc: 'Ferias proporcionais + 1/3', valor: feriasProp });
        }

        // FGTS
        var fgts = calculaFGTS(franchiseId, staffId);
        if (fgts) {
            verbas.push({ desc: 'FGTS - saldo estimado (saque)', valor: fgts.saldoEstimado });
            if (d.multa40) verbas.push({ desc: 'FGTS - multa 40% (rescisao sem justa causa)', valor: fgts.multaRescisaoSemJustaCausa });
        }

        var total = verbas.reduce(function (s, v) { return s + v.valor; }, 0);

        // INSS + IRRF sobre rescisao tem regras especificas, simplificado aqui
        var inss = calculaINSS(salarioBase);
        var irrf = calculaIRRF(salarioBase - inss, parseInt(staff.dependentes_irrf || 0, 10));

        return {
            staff: { id: staff.id, name: staff.name, cpf: staff.cpf },
            motivo: motivo,
            dataRescisao: resc.toISOString().slice(0, 10),
            anosTrabalhados: round2(anosTrab),
            verbas: verbas,
            descontos: [
                { desc: 'INSS', valor: inss },
                { desc: 'IRRF', valor: irrf }
            ],
            totalBruto: round2(total),
            totalLiquido: round2(total - inss - irrf),
            observacao: 'Estimativa para conferencia. Homologacao em sindicato (se >1 ano de casa) recomendada.'
        };
    }

    // Expoe API publica
    window.PayrollCompliance = {
        // Tabelas
        SALARIO_MINIMO: SALARIO_MINIMO,
        INSS_2025: INSS_2025,
        IRRF_2025: IRRF_2025,
        // Calculo basico
        calculaINSS: calculaINSS,
        calculaIRRF: calculaIRRF,
        calculaSalarioFamilia: calculaSalarioFamilia,
        // Holerite
        gerarHolerite: gerarHolerite,
        holeriteHTML: holeriteHTML,
        imprimirHolerite: imprimirHolerite,
        // Ferias
        calculaFerias: calculaFerias,
        valorFerias: valorFerias,
        // 13o
        calcula13o: calcula13o,
        // FGTS
        calculaFGTS: calculaFGTS,
        // Rescisao
        calculaRescisao: calculaRescisao
    };
})();
