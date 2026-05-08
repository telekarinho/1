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

    /**
     * Registra um beneficio.
     * @param {string} franchiseId
     * @param {object} benefit  - { staffId, staffName, tipo, productName, productId, value, orderId, notes, operatorName }
     */
    function register(franchiseId, benefit) {
        if (!franchiseId) return { success: false, error: 'Franquia invalida' };
        if (!benefit || !benefit.staffId) return { success: false, error: 'Funcionario nao informado' };
        if (typeof DataStore === 'undefined') return { success: false, error: 'DataStore indisponivel' };

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
            cancelled:     false
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

        register: register,
        list: list,
        cancel: cancel,
        totalMonth: totalMonth,
        totalDay: totalDay,
        alreadyReceivedToday: alreadyReceivedToday,
        exportCSV: exportCSV
    };

})();
