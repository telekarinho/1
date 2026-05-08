/* ============================================
   MilkyPot — Beneficios de Funcionario
   ============================================
   Registra produtos consumidos pelo funcionario como
   beneficio (sorvete do dia, lanche, refeicao, etc).

   Regras:
   - NAO transferivel: somente o proprio funcionario pode receber
   - Lancado no PDV usando forma de pagamento "beneficio_funcionario"
   - Custo aparece na contabilidade como "beneficios funcionario"
   - Aparece no portal do funcionario (transparencia)

   Coleção: staff_benefits/{franchiseId}/entries
   ============================================ */

(function () {
    'use strict';

    var COLLECTION = 'staff_benefits';

    var TIPOS = {
        SORVETE_DIA:    'sorvete_dia',
        REFEICAO:       'refeicao',
        LANCHE:         'lanche',
        BEBIDA:         'bebida',
        OUTRO:          'outro'
    };

    var TIPO_LABELS = {
        sorvete_dia: 'Sorvete do dia',
        refeicao:    'Refeicao',
        lanche:      'Lanche',
        bebida:      'Bebida',
        outro:       'Outro beneficio'
    };

    function nowIso() { return new Date().toISOString(); }
    function dateOnly(iso) { return iso.slice(0, 10); }
    function monthKey(iso) { return iso.slice(0, 7); }

    function generateId() {
        if (typeof Utils !== 'undefined' && Utils.generateId) return Utils.generateId();
        return 'ben_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    }

    // ---------- Config por franquia ----------
    var DEFAULT_CONFIG = {
        enabled:                true,
        sorvete_dia_enabled:    true,
        max_value_per_item:     8.00,    // R$ 8,00 max por item
        max_value_per_day:      8.00,    // R$ 8,00 max por dia
        max_items_per_day:      1,       // 1 sorvete/refeicao por dia
        allowed_types:          ['sorvete_dia', 'refeicao', 'lanche', 'bebida', 'outro'],
        require_pin_employee:   true,    // exige PIN do funcionario (nao-transferivel)
        require_acceptance:     true     // exige aceite do termo a cada lancamento
    };

    function getConfig(franchiseId) {
        if (typeof DataStore === 'undefined') return DEFAULT_CONFIG;
        var franchises = DataStore.getAllFranchises() || [];
        var f = franchises.find(function (x) { return x.id === franchiseId; });
        var saved = (f && f.benefitsConfig) ? f.benefitsConfig : {};
        return Object.assign({}, DEFAULT_CONFIG, saved);
    }

    function saveConfig(franchiseId, config) {
        if (typeof DataStore === 'undefined') return { success: false };
        var franchises = DataStore.get('franchises') || [];
        var idx = franchises.findIndex(function (x) { return x.id === franchiseId; });
        if (idx === -1) return { success: false, error: 'Franquia nao encontrada' };
        franchises[idx].benefitsConfig = Object.assign({}, DEFAULT_CONFIG, config || {});
        franchises[idx].benefitsConfigUpdatedAt = nowIso();
        DataStore.set('franchises', franchises);

        try {
            DataStore.addToCollection('staff_benefits_audit', franchiseId, {
                id: 'cfg_' + Date.now(),
                action: 'config_changed',
                config: franchises[idx].benefitsConfig,
                changedBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
                timestamp: nowIso()
            });
        } catch (e) {}
        return { success: true };
    }

    /**
     * Valida ANTES do registro — retorna { ok:bool, error?, warning? }.
     * Aqui ficam todas as regras legais/configuradas.
     */
    function validateBeforeRegister(franchiseId, params) {
        if (!params || !params.staffId) return { ok: false, error: 'Funcionario nao informado' };
        var cfg = getConfig(franchiseId);

        if (!cfg.enabled) return { ok: false, error: 'Beneficios desativados pela administracao da franquia' };

        if (params.tipo && cfg.allowed_types && cfg.allowed_types.indexOf(params.tipo) === -1) {
            return { ok: false, error: 'Tipo de beneficio nao permitido nesta franquia: ' + params.tipo };
        }

        var value = parseFloat(params.value || 0);
        if (cfg.max_value_per_item && value > cfg.max_value_per_item) {
            return { ok: false, error: 'Valor R$ ' + value.toFixed(2) + ' excede o maximo permitido por item (R$ ' + cfg.max_value_per_item.toFixed(2) + '). Ajuste o pedido ou cobre a diferenca.' };
        }

        // Limite por dia (quantidade)
        var today = dateOnly(nowIso());
        var hojeDoFunc = list(franchiseId, { staffId: params.staffId, date: today });
        if (cfg.max_items_per_day && hojeDoFunc.length >= cfg.max_items_per_day) {
            return {
                ok: false,
                error: 'Funcionario JA recebeu ' + hojeDoFunc.length + ' beneficio(s) hoje (limite: ' +
                       cfg.max_items_per_day + ' por dia conforme regra desta franquia). Bloqueado.',
                blocked_by: 'daily_quantity_limit'
            };
        }

        // Limite por dia (valor)
        var totalHoje = hojeDoFunc.reduce(function (s, e) { return s + Number(e.value || 0); }, 0);
        if (cfg.max_value_per_day && (totalHoje + value) > cfg.max_value_per_day) {
            return {
                ok: false,
                error: 'Total do dia (R$ ' + (totalHoje + value).toFixed(2) + ') excederia o maximo permitido por dia (R$ ' + cfg.max_value_per_day.toFixed(2) + ').',
                blocked_by: 'daily_value_limit'
            };
        }

        // Aviso se eh 'sorvete_dia' e ja recebeu hoje
        if (params.tipo === 'sorvete_dia' && alreadyReceivedToday(franchiseId, params.staffId, 'sorvete_dia')) {
            return { ok: false, error: 'Sorvete do dia ja foi entregue para este funcionario hoje. Limite: 1 por dia.' };
        }

        // Aceite do termo no lancamento
        if (cfg.require_acceptance && !params.acceptedTerms) {
            return { ok: false, error: 'Funcionario precisa aceitar os termos do beneficio antes de receber.' };
        }

        // GATE de conduta — opcional, so aplica se admin ativou
        if (typeof StaffConduct !== 'undefined' && StaffConduct.isEnabled(franchiseId)) {
            var conduct = StaffConduct.canReceiveBenefit(franchiseId, params.staffId);
            if (!conduct.entitled && conduct.reason === 'low_score') {
                return {
                    ok: false,
                    error: conduct.message,
                    blocked_by: 'conduct_score',
                    score: conduct.score,
                    threshold: conduct.threshold
                };
            }
        }

        return { ok: true };
    }

    /**
     * Registra um beneficio.
     * @param {string} franchiseId
     * @param {object} benefit  - { staffId, staffName, tipo, productName, productId, value, orderId, notes, operatorName }
     */
    function register(franchiseId, benefit) {
        if (!franchiseId) return { success: false, error: 'Franquia invalida' };
        if (!benefit || !benefit.staffId) return { success: false, error: 'Funcionario nao informado' };
        if (typeof DataStore === 'undefined') return { success: false, error: 'DataStore indisponivel' };

        // Valida regras configuradas (limite, valor maximo, aceite)
        var v = validateBeforeRegister(franchiseId, benefit);
        if (!v.ok) return { success: false, error: v.error, blocked_by: v.blocked_by };

        var entry = {
            id:            generateId(),
            staffId:       benefit.staffId,
            staffName:     benefit.staffName || '',
            staffPin:      benefit.staffPin || null,    // ultimos 4 (audit, nao salva clear)
            tipo:          benefit.tipo || TIPOS.OUTRO,
            tipoLabel:     TIPO_LABELS[benefit.tipo || 'outro'] || 'Beneficio',
            productId:     benefit.productId || null,
            productName:   benefit.productName || '',
            value:         Number(benefit.value || 0),
            orderId:       benefit.orderId || null,
            notes:         benefit.notes || '',
            operatorId:    benefit.operatorId || null,
            operatorName:  benefit.operatorName || '',
            timestamp:     nowIso(),
            date:          dateOnly(nowIso()),
            month:         monthKey(nowIso()),
            transferable:  false,
            cancelled:     false,
            // Aceite legal — prova juridica
            acceptedTerms:    !!benefit.acceptedTerms,
            acceptedAt:       benefit.acceptedAt || nowIso(),
            acceptedTermVersion: (typeof LegalTerms !== 'undefined' ? LegalTerms.TERM_VERSION : null),
            // Validacoes legais
            personalNonTransferable: true,
            cancelableOnFraud:       true,
            // Snapshot do device (audit)
            deviceUserAgent: (navigator.userAgent || '').slice(0, 200)
        };

        DataStore.addToCollection(COLLECTION, franchiseId, entry);

        // Audit log
        try {
            if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
                DataStore.addToCollection('staff_benefits_audit', franchiseId, {
                    id: 'ba_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    action: 'register',
                    benefitId: entry.id,
                    staffId: benefit.staffId,
                    staffName: benefit.staffName,
                    value: entry.value,
                    operatorId: benefit.operatorId,
                    operatorName: benefit.operatorName,
                    timestamp: nowIso()
                });
            }
        } catch (e) {}

        return { success: true, entry: entry };
    }

    /**
     * Lista beneficios — opcionalmente filtrados.
     * @param {string} franchiseId
     * @param {object} [filter] - { staffId, month: 'yyyy-mm', date: 'yyyy-mm-dd' }
     */
    function list(franchiseId, filter) {
        if (typeof DataStore === 'undefined') return [];
        var all = DataStore.getCollection(COLLECTION, franchiseId) || [];
        filter = filter || {};
        return all.filter(function (e) {
            if (e.cancelled) return false;
            if (filter.staffId && e.staffId !== filter.staffId) return false;
            if (filter.month && e.month !== filter.month) return false;
            if (filter.date && e.date !== filter.date) return false;
            return true;
        }).sort(function (a, b) { return b.timestamp.localeCompare(a.timestamp); });
    }

    function totalMonth(franchiseId, staffId, year, month) {
        var monthKey = year + '-' + String(month).padStart(2, '0');
        var entries = list(franchiseId, { staffId: staffId, month: monthKey });
        var total = entries.reduce(function (s, e) { return s + Number(e.value || 0); }, 0);
        return { count: entries.length, total: total, entries: entries };
    }

    function totalDay(franchiseId, staffId, dateStr) {
        var entries = list(franchiseId, { staffId: staffId, date: dateStr });
        var total = entries.reduce(function (s, e) { return s + Number(e.value || 0); }, 0);
        return { count: entries.length, total: total, entries: entries };
    }

    /**
     * Verifica se funcionario ja recebeu o beneficio diario do tipo X hoje.
     * Util pra evitar duplicacao do "sorvete do dia".
     */
    function alreadyReceivedToday(franchiseId, staffId, tipo) {
        var today = dateOnly(nowIso());
        var entries = list(franchiseId, { staffId: staffId, date: today });
        return entries.some(function (e) { return e.tipo === tipo; });
    }

    /**
     * Cancela beneficio (so admin/gerente — soft delete pra audit)
     */
    function cancel(franchiseId, benefitId, reason, operatorName) {
        if (typeof DataStore === 'undefined') return { success: false };
        var all = DataStore.getCollection(COLLECTION, franchiseId) || [];
        var idx = all.findIndex(function (e) { return e.id === benefitId; });
        if (idx === -1) return { success: false, error: 'Beneficio nao encontrado' };

        all[idx].cancelled = true;
        all[idx].cancelledAt = nowIso();
        all[idx].cancelReason = reason || '';
        all[idx].cancelledBy = operatorName || '';
        DataStore.saveCollection(COLLECTION, franchiseId, all);

        try {
            DataStore.addToCollection('staff_benefits_audit', franchiseId, {
                id: 'ba_' + Date.now(),
                action: 'cancel',
                benefitId: benefitId,
                reason: reason,
                cancelledBy: operatorName,
                timestamp: nowIso()
            });
        } catch (e) {}
        return { success: true };
    }

    function exportCSV(franchiseId, year, month) {
        var monthKey = year + '-' + String(month).padStart(2, '0');
        var entries = list(franchiseId, { month: monthKey });

        var lines = [];
        lines.push('Beneficios de Funcionario - ' + monthKey);
        lines.push('');
        lines.push('Data;Hora;Funcionario;Tipo;Produto;Valor;Operador;Observacao');
        entries.forEach(function (e) {
            lines.push([
                e.date,
                e.timestamp.slice(11, 16),
                e.staffName,
                e.tipoLabel,
                e.productName || '-',
                'R$ ' + Number(e.value || 0).toFixed(2).replace('.', ','),
                e.operatorName || '-',
                (e.notes || '').replace(/;/g, ',')
            ].join(';'));
        });
        var total = entries.reduce(function (s, e) { return s + Number(e.value || 0); }, 0);
        lines.push('');
        lines.push('Total entregue;;' + 'R$ ' + total.toFixed(2).replace('.', ','));
        lines.push('Total registros;;' + entries.length);

        var content = '﻿' + lines.join('\n');
        var blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Beneficios_' + monthKey + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // API publica
    window.StaffBenefits = {
        TIPOS: TIPOS,
        TIPO_LABELS: TIPO_LABELS,
        DEFAULT_CONFIG: DEFAULT_CONFIG,

        register: register,
        list: list,
        cancel: cancel,
        totalMonth: totalMonth,
        totalDay: totalDay,
        alreadyReceivedToday: alreadyReceivedToday,
        exportCSV: exportCSV,

        getConfig: getConfig,
        saveConfig: saveConfig,
        validateBeforeRegister: validateBeforeRegister
    };

})();
