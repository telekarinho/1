/* ============================================
   MilkyPot — Conduta & Pontuacao (OPCIONAL)
   ============================================
   Sistema de gamificacao/conduta para INCENTIVAR boa pratica.
   AVISO LEGAL CRITICO:
   - NUNCA pode descontar salario, horas, direitos CLT
   - NUNCA pode penalizar atestado medico (direito CLT)
   - SO pode condicionar BENEFICIOS IN NATURA extras (sorvete, lanche)
     que nao integram salario (Lei 13.467/17, art. 458 §2 CLT)
   - OPCIONAL — admin precisa explicitamente ativar e configurar
   - Se desativado, sistema nao aparece em lugar nenhum

   Padrao SCORE: 100 pontos. Cada acao + ou - eh CONFIGURAVEL.
   ============================================ */

(function () {
    'use strict';

    var DEFAULT_CONFIG = {
        enabled:                false,    // OPCIONAL — desativado por padrao
        initialScore:           100,      // pontos iniciais por mes
        // Bonus
        bonusPerWorkedDay:      1,        // +1 ponto por dia trabalhado completo
        bonusPunctualWeek:      5,        // +5 se semana inteira sem atraso
        // Penalidades — NUNCA aplicadas a salario, so a beneficios extras
        penaltyMissedPunch:     2,        // -2 por marcacao esquecida
        penaltyLatePunch:       3,        // -3 por atraso > tolerancia (CLT 5min)
        penaltyUnjustifiedAbsence: 10,    // -10 por falta sem justificativa
        // ATESTADO E DIREITOS CLT NUNCA PENALIZAM (CLT art. 6, sumula 282 TST)
        penaltyMedicalAbsence:  0,        // FIXO 0 — atestado nao penaliza
        penaltyVacation:        0,        // FIXO 0 — ferias nao penalizam
        penaltyMaternity:       0,        // FIXO 0 — licenca maternidade nao penaliza
        // Threshold de beneficios extras
        benefitMinScore:        70,       // < 70 pontos perde beneficios extras
        // Premiacao no holerite (opcional, depende de contrato)
        bonusHolderitMinScore:  90,       // se >= 90, recebe bonus
        bonusHolderitValue:     0         // valor R$ default (precisa ser cadastrado em contrato)
    };

    function nowIso() { return new Date().toISOString(); }

    // ----------------------------------------
    // Config por franquia
    // ----------------------------------------
    function getConfig(franchiseId) {
        if (typeof DataStore === 'undefined') return DEFAULT_CONFIG;
        var franchises = DataStore.getAllFranchises() || [];
        var f = franchises.find(function (x) { return x.id === franchiseId; });
        var saved = (f && f.conductConfig) ? f.conductConfig : {};
        // Force protections legais — esses NUNCA podem virar > 0
        saved.penaltyMedicalAbsence = 0;
        saved.penaltyVacation = 0;
        saved.penaltyMaternity = 0;
        return Object.assign({}, DEFAULT_CONFIG, saved);
    }

    function saveConfig(franchiseId, config) {
        if (typeof DataStore === 'undefined') return { success: false };
        var franchises = DataStore.get('franchises') || [];
        var idx = franchises.findIndex(function (x) { return x.id === franchiseId; });
        if (idx === -1) return { success: false, error: 'Franquia nao encontrada' };

        // Forca protecoes legais
        var safe = Object.assign({}, config || {});
        safe.penaltyMedicalAbsence = 0;
        safe.penaltyVacation = 0;
        safe.penaltyMaternity = 0;

        franchises[idx].conductConfig = Object.assign({}, DEFAULT_CONFIG, safe);
        franchises[idx].conductConfigUpdatedAt = nowIso();
        DataStore.set('franchises', franchises);

        try {
            DataStore.addToCollection('staff_conduct_audit', franchiseId, {
                id: 'cfg_' + Date.now(),
                action: 'config_changed',
                config: franchises[idx].conductConfig,
                changedBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
                timestamp: nowIso()
            });
        } catch (e) {}
        return { success: true };
    }

    function isEnabled(franchiseId) {
        return getConfig(franchiseId).enabled === true;
    }

    // ----------------------------------------
    // Calculo da pontuacao do mes
    // ----------------------------------------
    function computeScore(franchiseId, staffId, year, month) {
        var cfg = getConfig(franchiseId);
        if (!cfg.enabled) {
            return { enabled: false, score: cfg.initialScore, breakdown: [] };
        }
        if (typeof TimeClock === 'undefined') {
            return { enabled: true, score: cfg.initialScore, breakdown: [], error: 'TimeClock indisponivel' };
        }

        var espelho = TimeClock.computeMonth(franchiseId, staffId, year, month);
        var t = espelho.totals;
        var score = cfg.initialScore;
        var breakdown = [{ label: 'Pontuacao inicial', value: cfg.initialScore }];

        // Bonus: dias trabalhados
        var bonusDias = (cfg.bonusPerWorkedDay || 0) * t.diasTrabalhados;
        if (bonusDias > 0) {
            score += bonusDias;
            breakdown.push({ label: t.diasTrabalhados + ' dias trabalhados (+' + cfg.bonusPerWorkedDay + ' cada)', value: bonusDias });
        }

        // Penalidade: atrasos (cada hora de atraso = -X dependendo)
        var horasAtraso = (t.atraso || 0) / 60;
        if (horasAtraso > 0 && cfg.penaltyLatePunch) {
            // Aplicado por ocorrencia (cada dia com atraso)
            var diasAtraso = espelho.days.filter(function (d) { return d.minutosAtraso > 0; }).length;
            var pen = diasAtraso * cfg.penaltyLatePunch;
            score -= pen;
            breakdown.push({ label: diasAtraso + ' dia(s) com atraso (-' + cfg.penaltyLatePunch + ' cada)', value: -pen });
        }

        // Faltas — distinguir justificadas (atestado) das nao-justificadas
        var faltasNaoJustif = t.faltas; // ja conta apenas sem justificativa
        if (faltasNaoJustif > 0 && cfg.penaltyUnjustifiedAbsence) {
            var penFaltas = faltasNaoJustif * cfg.penaltyUnjustifiedAbsence;
            score -= penFaltas;
            breakdown.push({ label: faltasNaoJustif + ' falta(s) sem justificativa (-' + cfg.penaltyUnjustifiedAbsence + ' cada)', value: -penFaltas });
        }

        // Marcacoes esquecidas — dia com entrada mas sem saida, etc
        var diasIncompletos = espelho.days.filter(function (d) {
            return !d.isFolga && !d.isFalta && d.records.length > 0 && d.records.length < 4 && !d.justificativa;
        }).length;
        if (diasIncompletos > 0 && cfg.penaltyMissedPunch) {
            var penInc = diasIncompletos * cfg.penaltyMissedPunch;
            score -= penInc;
            breakdown.push({ label: diasIncompletos + ' dia(s) com marcacao incompleta (-' + cfg.penaltyMissedPunch + ' cada)', value: -penInc });
        }

        // Atestado — registrado em justificativas tipo 'abono'/'falta'
        // NUNCA penaliza — apenas registra como info
        var totalAtestados = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('time_clock_justifications', franchiseId) || []).filter(function (j) {
                return j.staffId === staffId && j.type === 'abono' && j.date && j.date.startsWith(year + '-' + String(month).padStart(2, '0'));
            }).length
            : 0;

        if (totalAtestados > 0) {
            breakdown.push({ label: totalAtestados + ' atestado(s) — protegido por lei (CLT art. 6)', value: 0, info: true });
        }

        // Score nunca abaixo de 0
        score = Math.max(0, score);

        return {
            enabled: true,
            score: score,
            initialScore: cfg.initialScore,
            breakdown: breakdown,
            entitledToBenefits: score >= cfg.benefitMinScore,
            entitledToBonus: score >= cfg.bonusHolderitMinScore,
            bonusValue: score >= cfg.bonusHolderitMinScore ? cfg.bonusHolderitValue : 0,
            stats: {
                diasTrabalhados: t.diasTrabalhados,
                atrasos: horasAtraso.toFixed(1) + 'h',
                faltasNaoJustif: faltasNaoJustif,
                atestados: totalAtestados,
                marcacoesIncompletas: diasIncompletos
            }
        };
    }

    /**
     * Verifica se o funcionario pode receber beneficio agora (gate legal).
     * Se sistema desativado, sempre retorna true (nao bloqueia nada).
     */
    function canReceiveBenefit(franchiseId, staffId) {
        var cfg = getConfig(franchiseId);
        if (!cfg.enabled) return { entitled: true, reason: 'system_disabled' };

        var now = new Date();
        var report = computeScore(franchiseId, staffId, now.getFullYear(), now.getMonth() + 1);
        if (report.entitledToBenefits) {
            return { entitled: true, score: report.score, threshold: cfg.benefitMinScore };
        }
        return {
            entitled: false,
            score: report.score,
            threshold: cfg.benefitMinScore,
            reason: 'low_score',
            message: 'Pontuacao do mes (' + report.score + ') abaixo do minimo configurado (' + cfg.benefitMinScore +
                     ') para receber beneficios extras. Pratique pontualidade e regularidade pra recuperar.'
        };
    }

    /**
     * Comissao por funcionario (alternativa/complementar ao commissionRate por produto).
     */
    function computeCommission(franchiseId, staffId, year, month) {
        if (typeof DataStore === 'undefined') return { total: 0 };
        var staff = (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; });
        if (!staff) return { total: 0 };

        var orders = DataStore.getCollection('orders', franchiseId) || [];
        var prefix = year + '-' + String(month).padStart(2, '0');
        var minhasOrders = orders.filter(function (o) {
            if (!o.createdAt || !o.createdAt.startsWith(prefix)) return false;
            if (!['confirmado', 'entregue', 'pago'].includes(o.status)) return false;
            return o.operatorId === staffId || o.createdBy === staffId || o.createdByName === staff.name;
        });

        var totalVendas = minhasOrders.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
        var rate = parseFloat(staff.commissionRate) || 0;        // % sobre vendas
        var fixed = parseFloat(staff.commissionFixed) || 0;      // R$ fixo mensal
        var variable = totalVendas * rate / 100;
        var total = fixed + variable;

        return {
            staff: { id: staff.id, name: staff.name },
            month: prefix,
            ordersCount: minhasOrders.length,
            totalVendas: totalVendas,
            rate: rate,
            fixed: fixed,
            variable: variable,
            total: total
        };
    }

    window.StaffConduct = {
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        getConfig: getConfig,
        saveConfig: saveConfig,
        isEnabled: isEnabled,
        computeScore: computeScore,
        canReceiveBenefit: canReceiveBenefit,
        computeCommission: computeCommission
    };
})();
