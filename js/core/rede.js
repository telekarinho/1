/* ============================================
   MilkyPot - Rede (consolidação cross-franquia)
   ============================================
   Agrega dados de todas as franquias para visão
   super_admin. Sem esconder nada — "truth mode".
   ============================================ */

const Rede = (function () {
    'use strict';

    /** Consolida métricas por franquia no período. */
    function getConsolidated(periodKey) {
        const pk = periodKey || (typeof Financas !== 'undefined' ? Financas.currentPeriodKey() : null);
        const franchises = (typeof DataStore !== 'undefined') ? (DataStore.getCollection('franchises', null) || []) : [];

        const units = franchises.filter(f => f.active !== false).map(f => {
            let dre = null, health = null, metaProg = null;
            try { dre = typeof Financas !== 'undefined' ? Financas.computeDRE(f.id, pk) : null; } catch (e) {}
            try { health = typeof Financas !== 'undefined' ? Financas.computeHealthScore(f.id, pk) : null; } catch (e) {}
            try { metaProg = typeof AdminConfig !== 'undefined' ? AdminConfig.getMetaProgress(f.id, pk) : null; } catch (e) {}

            return {
                franchiseId: f.id,
                name: f.name,
                address: f.address || '',
                active: f.active !== false,
                score: health ? health.score : 0,
                scoreLabel: health ? (typeof Financas !== 'undefined' ? Financas.scoreLabel(health.score) : '') : '—',
                reliability: health ? health.reliability : 0,
                pillars: health ? health.pillars : null,
                receita: dre ? dre.receitaBruta : 0,
                receitaLiquida: dre ? dre.receitaLiquida : 0,
                resultado: dre ? dre.resultadoOperacional : 0,
                cmv: dre ? dre.cmv : 0,
                totalFixed: dre ? dre.totalFixed : 0,
                totalVariable: dre ? dre.totalVariable : 0,
                margemContribuicao: dre ? dre.margemContribuicao : 0,
                mcPercent: dre ? dre.mcPercent : 0,
                pendencias: dre ? dre.pendencias.length : 0,
                closed: dre ? dre.closed : false,
                meta: metaProg ? metaProg.valor : 0,
                metaPct: metaProg ? Math.min(1.5, metaProg.pct) : null,
                salesCount: dre ? dre.salesCount : 0
            };
        });

        const totalReceita = units.reduce((s, u) => s + u.receita, 0);
        const totalReceitaLiquida = units.reduce((s, u) => s + u.receitaLiquida, 0);
        const totalResultado = units.reduce((s, u) => s + u.resultado, 0);
        const totalCmv = units.reduce((s, u) => s + u.cmv, 0);
        const totalFixed = units.reduce((s, u) => s + u.totalFixed, 0);
        const totalVariable = units.reduce((s, u) => s + u.totalVariable, 0);
        const totalMC = units.reduce((s, u) => s + u.margemContribuicao, 0);
        const totalMeta = units.reduce((s, u) => s + u.meta, 0);
        const totalSales = units.reduce((s, u) => s + u.salesCount, 0);
        const totalPendencias = units.reduce((s, u) => s + u.pendencias, 0);
        const unitsWithData = units.filter(u => u.receita > 0 || u.totalFixed > 0 || u.totalVariable > 0);
        const avgScore = units.length > 0 ? Math.round(units.reduce((s, u) => s + u.score, 0) / units.length) : 0;
        const avgReliability = units.length > 0 ? Math.round(units.reduce((s, u) => s + u.reliability, 0) / units.length) : 0;
        const closedCount = units.filter(u => u.closed).length;

        // Ranking
        const byScore = units.slice().sort((a, b) => b.score - a.score);
        const byReceita = units.slice().sort((a, b) => b.receita - a.receita);
        const byResultado = units.slice().sort((a, b) => b.resultado - a.resultado);

        // DRE consolidado
        const impostosAll = units.reduce((s, u) => {
            if (!u) return s;
            // Aprox: receita - receita_liq ≈ impostos
            return s + Math.max(0, u.receita - u.receitaLiquida);
        }, 0);
        const variaveisSemImpostos = totalVariable - impostosAll;
        const lucroBruto = totalReceitaLiquida - totalCmv;

        return {
            periodKey: pk,
            periodLabel: typeof Financas !== 'undefined' ? Financas.formatPeriodLabel(pk) : pk,
            units: units,
            unitsCount: units.length,
            unitsWithData: unitsWithData.length,
            closedCount: closedCount,
            totals: {
                receitaBruta: totalReceita,
                impostos: impostosAll,
                receitaLiquida: totalReceitaLiquida,
                cmv: totalCmv,
                lucroBruto: lucroBruto,
                totalVariable: totalVariable,
                variaveisSemImpostos: variaveisSemImpostos,
                margemContribuicao: totalMC,
                mcPercent: totalReceitaLiquida > 0 ? totalMC / totalReceitaLiquida : 0,
                totalFixed: totalFixed,
                resultadoOperacional: totalResultado,
                meta: totalMeta,
                metaPct: totalMeta > 0 ? totalReceita / totalMeta : null,
                salesCount: totalSales,
                pendencias: totalPendencias
            },
            aggregates: {
                avgScore: avgScore,
                avgReliability: avgReliability,
                healthyUnits: units.filter(u => u.score >= 75).length,
                moderateUnits: units.filter(u => u.score >= 60 && u.score < 75).length,
                atRiskUnits: units.filter(u => u.score >= 40 && u.score < 60).length,
                criticalUnits: units.filter(u => u.score < 40).length
            },
            rankings: {
                byScore: byScore,
                byReceita: byReceita,
                byResultado: byResultado
            }
        };
    }

    /** Série dos últimos N meses consolidados. */
    function getHistory(months) {
        months = months || 6;
        const now = new Date();
        const out = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const pk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            const c = getConsolidated(pk);
            out.push({
                periodKey: pk,
                label: typeof Financas !== 'undefined' ? Financas.formatPeriodLabel(pk) : pk,
                receita: c.totals.receitaBruta,
                resultado: c.totals.resultadoOperacional,
                avgScore: c.aggregates.avgScore,
                unitsWithData: c.unitsWithData
            });
        }
        return out;
    }

    /** Auditoria recente filtrada. */
    function getAuditTrail(filters) {
        filters = filters || {};
        const raw = localStorage.getItem('mp_audit_log');
        let logs = [];
        try { logs = JSON.parse(raw || '[]'); } catch (e) {}
        if (filters.franchiseId) logs = logs.filter(l => l.franchiseId === filters.franchiseId);
        if (filters.userId) logs = logs.filter(l => l.userId === filters.userId);
        if (filters.eventPrefix) logs = logs.filter(l => l.event && l.event.indexOf(filters.eventPrefix) === 0);
        if (filters.since) logs = logs.filter(l => l.timestamp >= filters.since);
        if (filters.until) logs = logs.filter(l => l.timestamp <= filters.until);
        return logs.slice(0, filters.limit || 200);
    }

    /** Lista distinta de eventos do log. */
    function getEventTypes() {
        const raw = localStorage.getItem('mp_audit_log');
        let logs = [];
        try { logs = JSON.parse(raw || '[]'); } catch (e) {}
        const set = new Set();
        logs.forEach(l => l.event && set.add(l.event));
        return Array.from(set).sort();
    }

    /** Lista distinta de usuários do log. */
    function getUsers() {
        const raw = localStorage.getItem('mp_audit_log');
        let logs = [];
        try { logs = JSON.parse(raw || '[]'); } catch (e) {}
        const map = {};
        logs.forEach(l => { if (l.userId) map[l.userId] = { id: l.userId, name: l.userName, email: l.userEmail }; });
        return Object.values(map).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return {
        getConsolidated,
        getHistory,
        getAuditTrail,
        getEventTypes,
        getUsers
    };
})();
