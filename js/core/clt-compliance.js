/* ============================================
   MilkyPot — CLT Compliance Hub
   ============================================
   Centraliza compliance auxiliar do controle de ponto:
   - CCT (Convencao Coletiva) upload obrigatorio quando admin escolhe
     'banco_horas' como tratamento de intervalo suprimido OU usa banco horas
     com saldo acumulado (CLT 59 §6 - precisa instrumento coletivo escrito).
   - Alerta de vencimento de saldo de banco de horas (CLT 59 §5: 6 meses
     individual / 12 meses coletivo) — avisa admin 30, 15, 10 e 5 dias antes.
   - Catalogo de faltas justificadas (CLT 473) com tipos, dias permitidos
     por evento e documentos comprobatorios necessarios.
   - Salva tudo em DataStore: cct_documents_<fid>, faltas_justificadas_<fid>
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // 📋 CLT 473 — Faltas JUSTIFICADAS por lei
    // ============================================
    // O empregador NAO pode descontar do salario nem do DSR nesses casos.
    // dias = dias consecutivos permitidos POR EVENTO (nao por ano)
    var CLT_473_TIPOS = [
        // Faltas previstas no caput do art. 473 da CLT
        { id: 'falecimento_familiar', label: 'Falecimento de cônjuge/ascendente/descendente/irmão/dependente', dias: 2, base: 'CLT 473 I', comprovante: 'Certidão de óbito' },
        { id: 'casamento', label: 'Casamento', dias: 3, base: 'CLT 473 II', comprovante: 'Certidão de casamento (até 60 dias depois)' },
        { id: 'nascimento_filho', label: 'Nascimento de filho (licença-paternidade básica)', dias: 5, base: 'CLT 473 III + ADCT 10 §1', comprovante: 'Certidão de nascimento' },
        { id: 'doacao_sangue', label: 'Doação voluntária de sangue', dias: 1, base: 'CLT 473 IV', comprovante: 'Comprovante da unidade coletora', anual: true, maxPorAno: 1 },
        { id: 'alistamento_eleitor', label: 'Alistamento como eleitor', dias: 2, base: 'CLT 473 V', comprovante: 'Comprovante do TRE' },
        { id: 'servico_militar', label: 'Serviço militar (obrigações)', dias: -1, base: 'CLT 473 VI', comprovante: 'Convocação militar', obs: 'Período conforme convocação' },
        { id: 'prova_vestibular', label: 'Prova de vestibular para ensino superior', dias: -1, base: 'CLT 473 VII', comprovante: 'Edital/comprovante de inscrição', obs: 'Dias das provas' },
        { id: 'juizo', label: 'Comparecimento em juízo', dias: -1, base: 'CLT 473 VIII', comprovante: 'Intimação/declaração de comparecimento', obs: 'Tempo necessário' },
        { id: 'representacao_sindical', label: 'Representação sindical em conferência', dias: -1, base: 'CLT 473 IX', comprovante: 'Declaração do sindicato' },
        // Acompanhamento gestante/filho (Lei 13.257/2016)
        { id: 'consulta_prenatal', label: 'Acompanhar esposa/companheira em consulta pré-natal', dias: 2, base: 'CLT 473 X', comprovante: 'Atestado médico ou ecografia', maxPorAno: 6 },
        { id: 'consulta_filho', label: 'Acompanhar filho até 6 anos em consulta médica', dias: 1, base: 'CLT 473 XI', comprovante: 'Atestado médico', maxPorAno: 1 },
        // Lei 14.457/2022 — Emprega + Mulher
        { id: 'exame_preventivo', label: 'Exame preventivo de câncer (mulher)', dias: 3, base: 'CLT 473 XII', comprovante: 'Comprovante de realização', maxPorAno: 1, soFeminino: true },
        // Atestado medico — nao esta no 473 mas e o mais comum
        { id: 'atestado_medico', label: 'Atestado médico (próprio)', dias: -1, base: 'Sumula 282 TST + Lei 605/49', comprovante: 'Atestado médico (CRM/CRO)', obs: 'Dias do atestado' },
        { id: 'atestado_acompanhante', label: 'Acompanhante de familiar (atestado)', dias: -1, base: 'Lei 8213/91 art. 73-A', comprovante: 'Atestado com identificação do acompanhante', obs: 'Conforme atestado' },
        // Outras justificativas comuns
        { id: 'paternidade_extendida', label: 'Licença-paternidade estendida (Empresa Cidadã)', dias: 20, base: 'Lei 11.770/2008', comprovante: 'Certidão de nascimento + adesão ao programa', obs: 'Total 20 dias se empresa aderiu' },
        { id: 'maternidade', label: 'Licença-maternidade', dias: 120, base: 'CF 7º XVIII + Lei 11.770', comprovante: 'Atestado médico', obs: 'Pode ser estendida pra 180d com Empresa Cidadã' },
        { id: 'amamentacao', label: 'Pausa para amamentação (até 6 meses)', dias: -1, base: 'CLT 396', comprovante: 'Certidão filho', obs: '2 descansos de 30min/dia, não conta como falta' }
    ];

    function listCLT473Tipos() {
        return CLT_473_TIPOS.slice();
    }

    function findCLT473Tipo(id) {
        return CLT_473_TIPOS.find(function (t) { return t.id === id; }) || null;
    }

    /**
     * Valida se uma falta justificada respeita os limites do CLT 473.
     * Retorna { allowed, reason, restantes }
     */
    function validateCLT473Request(franchiseId, staffId, tipoId, year) {
        var tipo = findCLT473Tipo(tipoId);
        if (!tipo) return { allowed: false, reason: 'Tipo de falta desconhecido' };
        if (!tipo.maxPorAno) return { allowed: true, tipo: tipo };

        // Conta quantas vezes ja usou esse tipo no ano
        var justs = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('time_clock_justifications', franchiseId) || [])
            : [];
        var usadasNoAno = justs.filter(function (j) {
            return j.staffId === staffId &&
                j.clt473TipoId === tipoId &&
                j.date && j.date.startsWith(String(year));
        }).length;
        var restantes = tipo.maxPorAno - usadasNoAno;
        if (restantes <= 0) {
            return {
                allowed: false,
                reason: 'Limite anual de ' + tipo.maxPorAno + ' uso(s) de "' + tipo.label + '" ja atingido em ' + year,
                tipo: tipo,
                restantes: 0
            };
        }
        return { allowed: true, tipo: tipo, restantes: restantes };
    }

    // ============================================
    // 📄 CCT — Convencao Coletiva de Trabalho
    // ============================================
    // Quando admin opta por banco_horas como tratamento de intervalo suprimido
    // OU usa banco de horas com saldo acumulado, precisa ter um documento
    // ESCRITO (CCT do sindicato OU aditivo individual ao contrato).
    // Sem isso, fiscalizacao MTE pode multar e funcionario pode ganhar acao
    // trabalhista pedindo retroativo + juros + multa.

    function listCCTDocs(franchiseId) {
        if (typeof DataStore === 'undefined') return [];
        return (DataStore.getCollection('cct_documents', franchiseId) || [])
            .sort(function (a, b) { return (b.uploadedAt || '').localeCompare(a.uploadedAt || ''); });
    }

    function getActiveCCT(franchiseId) {
        var docs = listCCTDocs(franchiseId);
        var hoje = new Date().toISOString().slice(0, 10);
        // Documento ativo = vigencia comeca antes de hoje e termina depois (ou nao expira)
        return docs.find(function (d) {
            if (d.vigenciaInicio && d.vigenciaInicio > hoje) return false;
            if (d.vigenciaFim && d.vigenciaFim < hoje) return false;
            return true;
        }) || null;
    }

    /**
     * Salva documento CCT (upload via DataURL ou link externo).
     * doc: { tipo: 'cct'|'aditivo_individual', sindicato, vigenciaInicio,
     *        vigenciaFim, fileDataUrl, fileName, linkExterno, observacao }
     */
    function saveCCTDoc(franchiseId, doc) {
        if (typeof DataStore === 'undefined') return { success: false };
        var id = 'cct_' + Date.now();
        var full = Object.assign({
            id: id,
            uploadedAt: new Date().toISOString(),
            uploadedBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system'
        }, doc || {});
        DataStore.addToCollection('cct_documents', franchiseId, full);
        return { success: true, id: id };
    }

    function deleteCCTDoc(franchiseId, docId) {
        if (typeof DataStore === 'undefined') return { success: false };
        var docs = DataStore.getCollection('cct_documents', franchiseId) || [];
        var idx = docs.findIndex(function (d) { return d.id === docId; });
        if (idx === -1) return { success: false };
        docs.splice(idx, 1);
        DataStore.setCollection('cct_documents', franchiseId, docs);
        return { success: true };
    }

    /**
     * Verifica se a franquia esta em conformidade quanto a CCT para usar
     * banco de horas / tratamento intervalo suprimido como banco_horas.
     * Retorna { compliant, message, suggestion }
     */
    function checkCCTCompliance(franchiseId) {
        var cfg = (typeof OvertimeBank !== 'undefined') ? OvertimeBank.getConfig(franchiseId) : {};
        var precisa = false;
        var razao = '';
        if (cfg.tratamento_intervalo_suprimido === 'banco_horas') {
            precisa = true;
            razao = 'Tratamento de intervalo suprimido configurado como banco_horas (CLT 71 §4º exige acordo escrito).';
        }
        if (cfg.bankHoursEnabled && cfg.bankHoursMaxBalance > 0) {
            precisa = true;
            razao = razao || 'Banco de horas habilitado com saldo acumulado (CLT 59 §5 e §6 exige acordo escrito).';
        }
        if (!precisa) {
            return { compliant: true, required: false, message: 'CCT nao obrigatoria pela configuracao atual.' };
        }
        var ativo = getActiveCCT(franchiseId);
        if (!ativo) {
            return {
                compliant: false,
                required: true,
                message: '⚠ ' + razao + ' Nenhum documento CCT ou aditivo ativo no sistema.',
                suggestion: 'Faca upload do PDF da Convencao Coletiva do sindicato OU do aditivo individual assinado em painel/configuracoes-clt.html.'
            };
        }
        // Vigencia
        var hoje = new Date().toISOString().slice(0, 10);
        if (ativo.vigenciaFim && ativo.vigenciaFim < hoje) {
            return {
                compliant: false,
                required: true,
                message: '⚠ Documento CCT (' + (ativo.sindicato || ativo.fileName) + ') venceu em ' + ativo.vigenciaFim + '. ' + razao,
                suggestion: 'Faca upload da CCT renovada.'
            };
        }
        return {
            compliant: true,
            required: true,
            message: '✓ CCT/aditivo ativo: ' + (ativo.sindicato || ativo.fileName) + (ativo.vigenciaFim ? ' (vigencia ate ' + ativo.vigenciaFim + ')' : ' (sem prazo)'),
            doc: ativo
        };
    }

    // ============================================
    // ⏰ ALERTA DE VENCIMENTO — Banco de Horas
    // ============================================
    // CLT 59 §5: acordo individual = 6 meses pra compensar
    // CLT 59 §6: acordo coletivo (CCT) = 12 meses pra compensar
    // Se nao compensar dentro do prazo, EMPRESA DEVE PAGAR em folha
    // (senao funcionario ganha acao trabalhista cobrando 50% adicional).
    //
    // Funcao calcula, pra cada lancamento de extra no banco, quantos dias
    // faltam pra vencer. Se faltam <= 30 dias, retorna alerta.
    //
    // Estrutura assumida: cada dia com saldoDiaMin > 0 conta a partir da data.
    function getBankExpirationAlerts(franchiseId, staffId) {
        if (typeof TimeClock === 'undefined') return [];
        var cfg = (typeof OvertimeBank !== 'undefined') ? OvertimeBank.getConfig(franchiseId) : {};
        var prazoDias = cfg.bankHoursCompensationDays || 180;

        // Pega ultimos 12 meses de espelho
        var alertas = [];
        var hoje = new Date();
        var processados = {}; // staffId -> total
        for (var i = 0; i < 12; i++) {
            var dt = new Date(hoje.getFullYear(), hoje.getMonth() - i, 15);
            try {
                var espelho = TimeClock.computeMonth(franchiseId, staffId, dt.getFullYear(), dt.getMonth() + 1);
                espelho.days.forEach(function (d) {
                    if (d.saldoDiaMin && d.saldoDiaMin > 0 && d.date) {
                        var depositadoEm = new Date(d.date + 'T12:00:00');
                        var vencimento = new Date(depositadoEm);
                        vencimento.setDate(vencimento.getDate() + prazoDias);
                        var diasParaVencer = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
                        if (diasParaVencer <= 30 && diasParaVencer > -60) {
                            // Severidade
                            var sev = diasParaVencer < 0 ? 'expired'
                                    : diasParaVencer <= 5 ? 'critical'
                                    : diasParaVencer <= 10 ? 'high'
                                    : diasParaVencer <= 15 ? 'medium' : 'low';
                            alertas.push({
                                staffId: staffId,
                                date: d.date,
                                minutos: d.saldoDiaMin,
                                vencimentoEm: vencimento.toISOString().slice(0, 10),
                                diasParaVencer: diasParaVencer,
                                severidade: sev,
                                acao: diasParaVencer < 0 ? 'PAGAR_EM_FOLHA_RETROATIVO' : 'COMPENSAR_OU_PAGAR'
                            });
                        }
                    }
                });
            } catch (e) { /* mes sem dados */ }
        }
        return alertas.sort(function (a, b) { return a.diasParaVencer - b.diasParaVencer; });
    }

    /**
     * Alerta consolidado para TODA a franquia.
     */
    function getAllBankExpirationAlerts(franchiseId) {
        if (typeof DataStore === 'undefined') return [];
        var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return s.active; });
        var all = [];
        staff.forEach(function (s) {
            var alerts = getBankExpirationAlerts(franchiseId, s.id);
            alerts.forEach(function (a) {
                a.staffName = s.name;
                all.push(a);
            });
        });
        return all;
    }

    // Expoe API publica
    window.CLTCompliance = {
        // CLT 473
        CLT_473_TIPOS: CLT_473_TIPOS,
        listCLT473Tipos: listCLT473Tipos,
        findCLT473Tipo: findCLT473Tipo,
        validateCLT473Request: validateCLT473Request,
        // CCT
        listCCTDocs: listCCTDocs,
        getActiveCCT: getActiveCCT,
        saveCCTDoc: saveCCTDoc,
        deleteCCTDoc: deleteCCTDoc,
        checkCCTCompliance: checkCCTCompliance,
        // Banco horas vencimento
        getBankExpirationAlerts: getBankExpirationAlerts,
        getAllBankExpirationAlerts: getAllBankExpirationAlerts
    };
})();
