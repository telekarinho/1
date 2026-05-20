/* ============================================
   MilkyPot — Horas Extras & Banco de Horas
   ============================================
   Conforme CLT:
   - art. 59: maximo 2h extras/dia
   - art. 59 §2: banco de horas (acordo individual ate 6 meses)
   - art. 59-A §5: convencao coletiva ate 1 ano
   - art. 7 XVI: adicional minimo 50%
   - art. 7 IX: domingos/feriados +100%
   - sumula 60 TST: noturno integral durante prorrogacao
   ============================================ */

(function () {
    'use strict';

    var DEFAULT_CONFIG = {
        // ===== HORAS EXTRAS =====
        overtimeEnabled:           true,
        maxOvertimePerDay:         2,        // max 2h/dia (CLT art. 59 — limite legal)
        maxOvertimePerWeek:        10,       // max 10h/semana (recomendado)
        maxOvertimePerMonth:       40,       // max 40h/mes (recomendado)
        overtimeRate:              50,       // 50% adicional (CLT art. 7 XVI minimo)
        overtimeRateSundayHoliday: 100,      // 100% adicional dom/feriado (CLT art. 7 IX)
        overtimeRateNightShift:    20,       // +20% noturno (CLT art. 73)
        requireApproval:           true,     // gerente precisa aprovar pra contar
        autoApproveUpTo:           1,        // ate 1h auto-aprova

        // ===== BANCO DE HORAS =====
        bankHoursEnabled:          true,
        bankHoursAgreement:        'individual',  // 'individual' (6m) | 'collective' (12m)
        bankHoursMaxBalance:       40,       // saldo max acumulado (h)
        bankHoursCompensationDays: 180,      // 6 meses (acordo individual default)
        bankHoursAutoExpire:       true,     // se nao usar no prazo, paga em folha automatic
        bankHoursAllowDebit:       false,    // se permite saldo NEGATIVO (perigoso, default off)
        bankHoursMaxNegative:      0,        // se permitir, max 8h negativas

        // ===== POLITICA =====
        ovetimeOnSunday:           false,    // permitir horas extras em domingo
        overtimeOnHoliday:         false,    // permitir em feriado nacional
        notifyEmployeeAtThreshold: 80,       // notifica funcionario quando atingir X% do limite
        forbidExtraIfBankFull:     true,     // bloqueia extras se banco ja esta no maximo

        // ===== INTERVALO INTRAJORNADA SUPRIMIDO (CLT art. 71 §4º Reforma 2017) =====
        // Quando funcionario nao tira (ou tira menos) intervalo de almoço/janta combinado,
        // a empresa DEVE pagar o periodo suprimido +50% como verba indenizatoria (dinheiro).
        // Trocar isso por banco de horas exige acordo coletivo OU individual ESCRITO
        // (CCT do sindicato OU aditivo contratual assinado). Sem isso, fiscalizacao MTE pode multar.
        // Opcoes: 'hora_extra' (default - paga em folha como hora extra) | 'banco_horas' (com aviso de risco) | 'desativado' (admin assume risco)
        tratamento_intervalo_suprimido: 'hora_extra',

        // ===== AUTO-COMPLETE BATIDAS ESQUECIDAS (Sumula 338 TST) =====
        // Quando true, sistema completa automaticamente batidas que funcionária
        // esqueceu de bater nos últimos 14 dias. Usa horário da jornada contratual.
        // Conforme a Súmula 338 TST: ônus do empregador é registrar a jornada;
        // se registro está incompleto, presume-se jornada contratual a favor do
        // funcionário. Auto-complete materializa essa presunção.
        // Registros ganham flag autoCompleted:true + retroativo:true. Funcionária
        // recebe notificação no app dela e pode contestar. Admin pode ajustar
        // depois manualmente se necessário.
        autoCompleteEnabled: true
    };

    function nowIso() { return new Date().toISOString(); }

    function getConfig(franchiseId) {
        if (typeof DataStore === 'undefined') return DEFAULT_CONFIG;
        var franchises = DataStore.getAllFranchises() || [];
        var f = franchises.find(function (x) { return x.id === franchiseId; });
        var saved = (f && f.overtimeBankConfig) ? f.overtimeBankConfig : {};
        var merged = Object.assign({}, DEFAULT_CONFIG, saved);

        // FORCA limites legais (admin nao pode burlar):
        if (merged.maxOvertimePerDay > 2) merged.maxOvertimePerDay = 2;        // CLT art. 59
        if (merged.overtimeRate < 50) merged.overtimeRate = 50;                 // CLT art. 7 XVI
        if (merged.overtimeRateSundayHoliday < 100) merged.overtimeRateSundayHoliday = 100;
        if (merged.bankHoursAgreement === 'individual' && merged.bankHoursCompensationDays > 180) {
            merged.bankHoursCompensationDays = 180;
        }
        if (merged.bankHoursAgreement === 'collective' && merged.bankHoursCompensationDays > 365) {
            merged.bankHoursCompensationDays = 365;
        }
        return merged;
    }

    function saveConfig(franchiseId, config) {
        if (typeof DataStore === 'undefined') return { success: false };
        var franchises = DataStore.get('franchises') || [];
        var idx = franchises.findIndex(function (x) { return x.id === franchiseId; });
        if (idx === -1) return { success: false, error: 'Franquia nao encontrada' };

        var safe = Object.assign({}, config || {});
        // Forca legal
        if (safe.maxOvertimePerDay > 2) safe.maxOvertimePerDay = 2;
        if (safe.overtimeRate < 50) safe.overtimeRate = 50;
        if (safe.overtimeRateSundayHoliday < 100) safe.overtimeRateSundayHoliday = 100;

        franchises[idx].overtimeBankConfig = Object.assign({}, DEFAULT_CONFIG, safe);
        franchises[idx].overtimeBankConfigUpdatedAt = nowIso();
        DataStore.set('franchises', franchises);

        try {
            DataStore.addToCollection('overtime_bank_audit', franchiseId, {
                id: 'cfg_' + Date.now(),
                action: 'config_changed',
                config: franchises[idx].overtimeBankConfig,
                changedBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
                timestamp: nowIso()
            });
        } catch (e) {}
        return { success: true };
    }

    /**
     * Calcula saldo do banco de horas de um staff num mes.
     * Saldo = horas extras nao pagas - horas compensadas
     */
    function computeBankBalance(franchiseId, staffId, year, month) {
        if (typeof TimeClock === 'undefined') return { balance: 0, balanceMin: 0 };
        var espelho = TimeClock.computeMonth(franchiseId, staffId, year, month);
        var minExtras = espelho.totals.extras || 0;
        var minAtraso = espelho.totals.atraso || 0;

        // Solicitacoes aprovadas de compensacao (uso do banco)
        var requests = [];
        if (typeof Payroll !== 'undefined' && Payroll.listBankHoursRequests) {
            requests = Payroll.listBankHoursRequests(franchiseId, { staffId: staffId, status: 'approved' });
        }
        var minCompensados = requests
            .filter(function (r) { return r.type === 'compensar'; })
            .reduce(function (s, r) { return s + (r.hoursMin || 0); }, 0);

        var saldoMin = minExtras - minAtraso - minCompensados;
        return {
            balance: saldoMin / 60,
            balanceMin: saldoMin,
            extras: minExtras / 60,
            atrasos: minAtraso / 60,
            compensados: minCompensados / 60,
            formatted: (saldoMin >= 0 ? '+' : '-') + Math.floor(Math.abs(saldoMin) / 60) + 'h ' + (Math.abs(saldoMin) % 60) + 'min'
        };
    }

    /**
     * Verifica se uma hora extra adicional excederia limites legais.
     */
    function canRegisterOvertime(franchiseId, staffId, dailyOvertimeMin, weeklyOvertimeMin) {
        var cfg = getConfig(franchiseId);
        if (!cfg.overtimeEnabled) {
            return { allowed: false, reason: 'disabled', message: 'Horas extras desativadas pela administracao.' };
        }
        if (dailyOvertimeMin / 60 > cfg.maxOvertimePerDay) {
            return {
                allowed: false,
                reason: 'daily_limit',
                message: 'Limite diario de ' + cfg.maxOvertimePerDay + 'h excedido (CLT art. 59).'
            };
        }
        if (weeklyOvertimeMin / 60 > cfg.maxOvertimePerWeek) {
            return {
                allowed: false,
                reason: 'weekly_limit',
                message: 'Limite semanal de ' + cfg.maxOvertimePerWeek + 'h excedido.'
            };
        }
        return { allowed: true };
    }

    function getValidationStatus(config) {
        var alerts = [];
        if (!config) config = DEFAULT_CONFIG;
        if (config.maxOvertimePerDay > 2) alerts.push('⚠️ Limite diario acima de 2h fere CLT art. 59');
        if (config.overtimeRate < 50) alerts.push('⚠️ Adicional abaixo de 50% fere CLT art. 7 XVI');
        if (config.bankHoursAllowDebit) alerts.push('⚠️ Saldo negativo no banco e arriscado juridicamente');
        if (config.bankHoursAgreement === 'individual' && config.bankHoursCompensationDays > 180)
            alerts.push('⚠️ Acordo individual nao pode passar 6 meses (CLT art. 59 §5)');
        return alerts;
    }

    window.OvertimeBank = {
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        getConfig: getConfig,
        saveConfig: saveConfig,
        computeBankBalance: computeBankBalance,
        canRegisterOvertime: canRegisterOvertime,
        getValidationStatus: getValidationStatus
    };
})();
