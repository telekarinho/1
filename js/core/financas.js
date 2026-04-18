/* ============================================
   MilkyPot - Finance OS (DRE + Competência)
   ============================================
   Sistema financeiro auditável por competência
   mensal (YYYY-MM). Custos fixos/variáveis com
   categorias obrigatórias. Fechamento gera
   snapshot imutável. Retificações pós-fechamento
   são NOVOS lançamentos (não sobrescrevem).

   Coleções (via DataStore, scope por franquia):
   - finance_costs_{fid}      lançamentos fixos+vars
   - finance_recurring_{fid}  templates recorrentes
   - finance_periods_{fid}    metadata de período
   - finance_snapshots_{fid}  snapshots imutáveis

   Modelo de Cost:
   { id, kind: 'fixed'|'variable', periodKey,
     categoria, descricao, valor, dueDay,
     notes, mandatory, source: 'manual'|'recurring'|'retification',
     recurringId?, retifiesSnapshotId?,
     createdAt, createdBy, createdByName, createdByEmail }

   Modelo de Recurring (template):
   { id, kind, categoria, descricao, valor, dueDay,
     startPeriodKey, endPeriodKey?, active,
     createdAt, createdBy }

   Modelo de Period:
   { periodKey, status: 'aberto'|'fechado',
     closedAt?, closedBy?, closedByName?,
     snapshotId?, reopened? }

   Modelo de Snapshot:
   { id, periodKey, createdAt, createdBy, dre, meta }
   ============================================ */

const Financas = (function () {
    'use strict';

    const COL_COSTS = 'finance_costs';
    const COL_RECURRING = 'finance_recurring';
    const COL_PERIODS = 'finance_periods';
    const COL_SNAPSHOTS = 'finance_snapshots';

    /* ============================================
       Categorias obrigatórias (MilkyPot)
       ============================================ */
    const FIXED_CATEGORIES = [
        { key: 'aluguel', label: 'Aluguel', mandatory: true },
        { key: 'condominio', label: 'Condomínio', mandatory: true },
        { key: 'energia', label: 'Energia elétrica', mandatory: true },
        { key: 'agua', label: 'Água', mandatory: true },
        { key: 'internet', label: 'Internet / Telefonia', mandatory: true },
        { key: 'folha', label: 'Folha de pagamento', mandatory: true },
        { key: 'pro_labore', label: 'Pró-labore', mandatory: true },
        { key: 'contador', label: 'Contador', mandatory: true },
        { key: 'royalties', label: 'Royalties / Taxa de franquia', mandatory: true },
        { key: 'software', label: 'Software / Sistemas', mandatory: true },
        { key: 'marketing_local', label: 'Marketing local', mandatory: false },
        { key: 'seguros', label: 'Seguros', mandatory: false },
        { key: 'manutencao', label: 'Manutenção', mandatory: false },
        { key: 'juros', label: 'Juros / Financiamentos', mandatory: false }
    ];

    const VARIABLE_CATEGORIES = [
        { key: 'insumos', label: 'Compra de insumos / mercadoria', mandatory: true },
        { key: 'embalagens', label: 'Embalagens / descartáveis', mandatory: true },
        { key: 'taxas_cartao', label: 'Taxas de cartão', mandatory: true },
        { key: 'apps_delivery', label: 'Comissão apps / delivery', mandatory: true },
        { key: 'impostos', label: 'Impostos sobre vendas', mandatory: true },
        { key: 'comissoes', label: 'Comissões / bonificações', mandatory: false },
        { key: 'frete', label: 'Frete', mandatory: false },
        { key: 'perdas', label: 'Perdas / estornos', mandatory: false },
        { key: 'eventual', label: 'Despesa esporádica', mandatory: false },
        { key: 'outros_var', label: 'Outros variáveis', mandatory: false }
    ];

    function allCategories(kind) {
        return kind === 'fixed' ? FIXED_CATEGORIES : VARIABLE_CATEGORIES;
    }

    function mandatoryCategories(kind) {
        return allCategories(kind).filter(c => c.mandatory);
    }

    function categoryLabel(kind, key) {
        const c = allCategories(kind).find(x => x.key === key);
        return c ? c.label : key;
    }

    /* ============================================
       Helpers de período
       ============================================ */
    function currentPeriodKey() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function parsePeriodKey(pk) {
        const [y, m] = (pk || currentPeriodKey()).split('-').map(Number);
        return { year: y, month: m };
    }

    function nextPeriodKey(pk) {
        const { year, month } = parsePeriodKey(pk);
        const d = new Date(year, month, 1); // month is 1-12; new Date expects 0-11, so month=nextMonth-1 → this gives next month
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function daysInPeriod(pk) {
        const { year, month } = parsePeriodKey(pk);
        return new Date(year, month, 0).getDate();
    }

    function periodRange(pk) {
        const { year, month } = parsePeriodKey(pk);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        return { start, end, startIso: start.toISOString(), endIso: end.toISOString() };
    }

    function formatPeriodLabel(pk) {
        const { year, month } = parsePeriodKey(pk);
        const names = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        return names[month - 1] + ' de ' + year;
    }

    /* ============================================
       Session info
       ============================================ */
    function sessionInfo() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            if (s) return { id: s.userId, name: s.name, email: s.email, role: s.role };
        }
        return { id: 'anonymous', name: 'Sistema', email: null, role: null };
    }

    function audit(event, franchiseId, details) {
        try {
            if (typeof AuditLog !== 'undefined' && AuditLog.log) {
                AuditLog.log(event, details || {}, franchiseId);
            }
        } catch (e) {}
    }

    /* ============================================
       Período — status e trava
       ============================================ */
    function loadPeriods(franchiseId) {
        return (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? (DataStore.getCollection(COL_PERIODS, franchiseId) || [])
            : [];
    }

    function getPeriodMeta(franchiseId, periodKey) {
        return loadPeriods(franchiseId).find(p => p.periodKey === periodKey) || null;
    }

    function isPeriodClosed(franchiseId, periodKey) {
        const m = getPeriodMeta(franchiseId, periodKey);
        return !!(m && m.status === 'fechado');
    }

    function ensurePeriodOpen(franchiseId, periodKey, operation) {
        if (isPeriodClosed(franchiseId, periodKey)) {
            return { ok: false, error: 'O período ' + formatPeriodLabel(periodKey) + ' está fechado. Use retificação para alterar.' };
        }
        return { ok: true };
    }

    /* ============================================
       Costs (fixos + variáveis)
       ============================================ */
    function loadCosts(franchiseId) {
        return (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? (DataStore.getCollection(COL_COSTS, franchiseId) || [])
            : [];
    }

    function getCostsByPeriod(franchiseId, periodKey, kind) {
        const all = loadCosts(franchiseId);
        return all.filter(c => c.periodKey === periodKey && (!kind || c.kind === kind));
    }

    function addCost(franchiseId, data) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        if (!data || !data.kind || !data.categoria) return { success: false, error: 'Dados incompletos.' };
        if (isNaN(data.valor) || Number(data.valor) <= 0) return { success: false, error: 'Valor inválido.' };

        const pk = data.periodKey || currentPeriodKey();
        const guard = ensurePeriodOpen(franchiseId, pk, 'add_cost');
        if (!guard.ok) return { success: false, error: guard.error };

        const user = sessionInfo();
        const cat = allCategories(data.kind).find(c => c.key === data.categoria);

        const cost = {
            kind: data.kind,
            periodKey: pk,
            categoria: data.categoria,
            categoriaLabel: cat ? cat.label : data.categoria,
            mandatory: cat ? !!cat.mandatory : false,
            descricao: String(data.descricao || cat?.label || ''),
            valor: Number(data.valor),
            dueDay: data.dueDay ? Number(data.dueDay) : null,
            notes: String(data.notes || ''),
            source: data.source || 'manual',
            recurringId: data.recurringId || null,
            retifiesSnapshotId: null,
            createdBy: user.id,
            createdByName: user.name,
            createdByEmail: user.email
        };

        const saved = DataStore.addToCollection(COL_COSTS, franchiseId, cost);
        audit(AuditLog.EVENTS.FIN_COST_CREATED, franchiseId, {
            costId: saved.id, kind: saved.kind, periodKey: pk,
            categoria: saved.categoria, valor: saved.valor, source: saved.source
        });
        return { success: true, cost: saved };
    }

    function updateCost(franchiseId, costId, updates) {
        if (!franchiseId || !costId) return { success: false, error: 'Dados inválidos.' };
        const all = loadCosts(franchiseId);
        const cost = all.find(c => c.id === costId);
        if (!cost) return { success: false, error: 'Lançamento não encontrado.' };
        const guard = ensurePeriodOpen(franchiseId, cost.periodKey, 'update_cost');
        if (!guard.ok) return { success: false, error: guard.error };

        const user = sessionInfo();
        const before = Object.assign({}, cost);
        const patch = {};
        ['descricao', 'valor', 'dueDay', 'notes'].forEach(k => {
            if (updates[k] !== undefined) patch[k] = k === 'valor' ? Number(updates[k]) : updates[k];
        });
        patch.updatedBy = user.id;
        patch.updatedByName = user.name;

        const updated = DataStore.updateInCollection(COL_COSTS, franchiseId, costId, patch);
        audit(AuditLog.EVENTS.FIN_COST_UPDATED, franchiseId, {
            costId: costId, before: { valor: before.valor, descricao: before.descricao }, after: patch
        });
        return { success: true, cost: updated };
    }

    function deleteCost(franchiseId, costId) {
        const all = loadCosts(franchiseId);
        const cost = all.find(c => c.id === costId);
        if (!cost) return { success: false, error: 'Lançamento não encontrado.' };
        const guard = ensurePeriodOpen(franchiseId, cost.periodKey, 'delete_cost');
        if (!guard.ok) return { success: false, error: guard.error };

        DataStore.removeFromCollection(COL_COSTS, franchiseId, costId);
        audit(AuditLog.EVENTS.FIN_COST_DELETED, franchiseId, {
            costId: costId, kind: cost.kind, valor: cost.valor, periodKey: cost.periodKey
        });
        return { success: true };
    }

    /* ============================================
       Recurring costs (templates)
       ============================================ */
    function loadRecurring(franchiseId) {
        return (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? (DataStore.getCollection(COL_RECURRING, franchiseId) || [])
            : [];
    }

    function addRecurring(franchiseId, data) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        if (!data || !data.kind || !data.categoria) return { success: false, error: 'Dados incompletos.' };
        if (isNaN(data.valor) || Number(data.valor) <= 0) return { success: false, error: 'Valor inválido.' };

        const user = sessionInfo();
        const cat = allCategories(data.kind).find(c => c.key === data.categoria);
        const tpl = {
            kind: data.kind,
            categoria: data.categoria,
            categoriaLabel: cat ? cat.label : data.categoria,
            descricao: String(data.descricao || cat?.label || ''),
            valor: Number(data.valor),
            dueDay: data.dueDay ? Number(data.dueDay) : null,
            startPeriodKey: data.startPeriodKey || currentPeriodKey(),
            endPeriodKey: data.endPeriodKey || null,
            active: true,
            createdBy: user.id,
            createdByName: user.name
        };
        const saved = DataStore.addToCollection(COL_RECURRING, franchiseId, tpl);
        audit(AuditLog.EVENTS.FIN_RECURRING_CREATED, franchiseId, {
            recurringId: saved.id, kind: tpl.kind, categoria: tpl.categoria, valor: tpl.valor
        });
        return { success: true, recurring: saved };
    }

    function deactivateRecurring(franchiseId, recurringId) {
        DataStore.updateInCollection(COL_RECURRING, franchiseId, recurringId, { active: false });
        return { success: true };
    }

    /** Gera lançamentos do período a partir dos templates ativos. Idempotente. */
    function generateRecurringForPeriod(franchiseId, periodKey) {
        const guard = ensurePeriodOpen(franchiseId, periodKey, 'generate_recurring');
        if (!guard.ok) return { success: false, error: guard.error };

        const templates = loadRecurring(franchiseId).filter(t => t.active !== false);
        const existing = getCostsByPeriod(franchiseId, periodKey);
        let generated = 0;
        templates.forEach(t => {
            if (t.startPeriodKey && periodKey < t.startPeriodKey) return;
            if (t.endPeriodKey && periodKey > t.endPeriodKey) return;
            const already = existing.find(c => c.recurringId === t.id);
            if (already) return;
            addCost(franchiseId, {
                kind: t.kind,
                categoria: t.categoria,
                descricao: t.descricao,
                valor: t.valor,
                dueDay: t.dueDay,
                periodKey: periodKey,
                source: 'recurring',
                recurringId: t.id
            });
            generated++;
        });
        if (generated > 0) {
            audit(AuditLog.EVENTS.FIN_RECURRING_GENERATED, franchiseId, { periodKey: periodKey, count: generated });
        }
        return { success: true, generated: generated };
    }

    /* ============================================
       Receita via Caixa (vendas do período)
       ============================================ */
    function getSalesInPeriod(franchiseId, periodKey) {
        if (typeof Caixa === 'undefined' || !Caixa.loadMovements) return { total: 0, porMetodo: {}, count: 0 };
        const { startIso, endIso } = periodRange(periodKey);
        const sales = (Caixa.loadMovements(franchiseId) || []).filter(m =>
            m.type === 'venda' && m.createdAt >= startIso && m.createdAt <= endIso
        );
        const total = sales.reduce((s, m) => s + Number(m.valor || 0), 0);
        const porMetodo = sales.reduce((acc, m) => {
            const k = m.metodo || 'nao_informado';
            acc[k] = (acc[k] || 0) + Number(m.valor || 0);
            return acc;
        }, {});
        return { total, porMetodo, count: sales.length };
    }

    /* ============================================
       CMV (Custo da Mercadoria Vendida)
       ============================================ */
    function getCMVInPeriod(franchiseId, periodKey) {
        if (typeof DataStore === 'undefined' || !DataStore.getCollection) return { total: 0, itensSemCusto: 0, cobertura: 1 };
        const { startIso, endIso } = periodRange(periodKey);
        const orders = (DataStore.getCollection('orders', franchiseId) || []).filter(o =>
            o.status === 'entregue' && o.createdAt >= startIso && o.createdAt <= endIso
        );
        const products = DataStore.getCollection('products', null) || [];
        const productById = {};
        products.forEach(p => { productById[p.id] = p; });

        let totalCMV = 0;
        let totalItens = 0;
        let itensSemCusto = 0;

        orders.forEach(o => {
            (o.items || []).forEach(it => {
                totalItens++;
                const prod = productById[it.productId] || productById[it.id] || null;
                const cu = prod ? Number(prod.costUnit || prod.custoUnitario || 0) : Number(it.costUnit || 0);
                if (cu > 0) totalCMV += cu * Number(it.qty || 1);
                else itensSemCusto++;
            });
        });

        const cobertura = totalItens > 0 ? (totalItens - itensSemCusto) / totalItens : 1;
        return { total: totalCMV, itensSemCusto, totalItens, cobertura };
    }

    /* ============================================
       DRE — Demonstrativo do período
       ============================================ */
    function computeDRE(franchiseId, periodKey) {
        const pk = periodKey || currentPeriodKey();
        const sales = getSalesInPeriod(franchiseId, pk);
        const cmv = getCMVInPeriod(franchiseId, pk);
        const fixedCosts = getCostsByPeriod(franchiseId, pk, 'fixed');
        const variableCosts = getCostsByPeriod(franchiseId, pk, 'variable');

        const receitaBruta = sales.total;
        // Impostos já estão em variableCosts (categoria 'impostos')
        const totalFixed = fixedCosts.reduce((s, c) => s + Number(c.valor || 0), 0);
        const totalVariable = variableCosts.reduce((s, c) => s + Number(c.valor || 0), 0);
        const impostos = variableCosts.filter(c => c.categoria === 'impostos').reduce((s, c) => s + Number(c.valor || 0), 0);
        const receitaLiquida = receitaBruta - impostos;

        const lucroBruto = receitaLiquida - cmv.total;
        const variaveisSemImpostos = totalVariable - impostos;
        const margemContribuicao = lucroBruto - variaveisSemImpostos;
        const resultadoOperacional = margemContribuicao - totalFixed;

        const mcPercent = receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) : 0;
        const breakEven = mcPercent > 0 ? (totalFixed / mcPercent) : 0;
        const diasPeriodo = daysInPeriod(pk);
        const vendaMinimaDiaria = diasPeriodo > 0 ? (breakEven / diasPeriodo) : 0;

        // Pendências
        const pendencias = computePendencies(franchiseId, pk, { sales, cmv, fixedCosts, variableCosts });

        return {
            periodKey: pk,
            periodLabel: formatPeriodLabel(pk),
            receitaBruta,
            impostos,
            receitaLiquida,
            cmv: cmv.total,
            lucroBruto,
            variaveisSemImpostos,
            totalVariable,
            margemContribuicao,
            totalFixed,
            resultadoOperacional,
            mcPercent,
            breakEven,
            vendaMinimaDiaria,
            cmvCobertura: cmv.cobertura,
            itensSemCusto: cmv.itensSemCusto,
            salesCount: sales.count,
            salesPorMetodo: sales.porMetodo,
            pendencias,
            closed: isPeriodClosed(franchiseId, pk)
        };
    }

    /* ============================================
       Pendências (obrigatórios faltantes + confiabilidade)
       ============================================ */
    function computePendencies(franchiseId, periodKey, ctx) {
        const pends = [];
        const fixedLançados = new Set((ctx.fixedCosts || []).map(c => c.categoria));
        const varLançados = new Set((ctx.variableCosts || []).map(c => c.categoria));

        mandatoryCategories('fixed').forEach(c => {
            if (!fixedLançados.has(c.key)) {
                pends.push({ severity: 'high', kind: 'fixed', categoria: c.key, label: 'Fixo obrigatório sem lançamento: ' + c.label });
            }
        });
        mandatoryCategories('variable').forEach(c => {
            if (!varLançados.has(c.key)) {
                pends.push({ severity: 'high', kind: 'variable', categoria: c.key, label: 'Variável obrigatório sem lançamento: ' + c.label });
            }
        });
        if (ctx.cmv && ctx.cmv.itensSemCusto > 0) {
            pends.push({
                severity: 'medium',
                kind: 'cmv',
                label: ctx.cmv.itensSemCusto + ' item(ns) vendido(s) sem custo unitário cadastrado',
                meta: { count: ctx.cmv.itensSemCusto, cobertura: ctx.cmv.cobertura }
            });
        }
        if (!ctx.sales || ctx.sales.count === 0) {
            pends.push({ severity: 'medium', kind: 'sales', label: 'Nenhuma venda registrada no caixa no período' });
        }
        return pends;
    }

    function reliabilityScore(franchiseId, periodKey) {
        const dre = computeDRE(franchiseId, periodKey);
        const mandTotal = mandatoryCategories('fixed').length + mandatoryCategories('variable').length;
        const mandMissing = dre.pendencias.filter(p => p.severity === 'high').length;
        const catCoverage = mandTotal > 0 ? (mandTotal - mandMissing) / mandTotal : 1;
        const cmvCoverage = dre.cmvCobertura || 0;
        const score = Math.round((catCoverage * 0.6 + cmvCoverage * 0.4) * 100);
        return { score, catCoverage, cmvCoverage };
    }

    /* ============================================
       Score de Saúde Financeira (5 pilares)
       Pesos: Liquidez 25% + Rentabilidade 25% +
              Eficiência 20% + Previsibilidade 15%
              + Disciplina 15%
       ============================================ */
    function _pillarLiquidity(cashBalance, totalFixed) {
        if (totalFixed <= 0) return 60; // sem fixos, neutro
        const ratio = cashBalance / totalFixed;
        if (ratio >= 1.2) return 100;
        if (ratio >= 0.8) return 78;
        if (ratio >= 0.4) return 55;
        if (ratio > 0) return 30;
        return 10;
    }

    function _pillarProfitability(resultadoOp, receitaLiquida) {
        if (receitaLiquida <= 0) return 10;
        const margin = resultadoOp / receitaLiquida;
        if (margin >= 0.12) return 100;
        if (margin >= 0.06) return 82;
        if (margin >= 0) return 65;
        if (margin >= -0.05) return 35;
        return 10;
    }

    function _pillarEfficiency(cmv, varExImp, receitaLiquida) {
        if (receitaLiquida <= 0) return 25;
        const ratio = (cmv + varExImp) / receitaLiquida;
        if (ratio <= 0.55) return 100;
        if (ratio <= 0.68) return 78;
        if (ratio <= 0.80) return 55;
        return 25;
    }

    function _pillarPredictability(reliability, cmvCoverage) {
        // Combina cobertura de obrigatórios (via reliability) com cobertura de custos de produtos
        const base = reliability.catCoverage || 0;
        const cmv = cmvCoverage || 0;
        const combined = (base * 0.6) + (cmv * 0.4);
        if (combined >= 0.95) return 88;
        if (combined >= 0.75) return 65;
        if (combined >= 0.50) return 42;
        return 20;
    }

    function _pillarDiscipline(reliability) {
        return Math.round((reliability.catCoverage || 0) * 100);
    }

    /**
     * Calcula cashBalance estimado do período.
     * Sem integração bancária, aproxima por:
     * - Se período aberto e há caixa aberto hoje → saldo esperado + resultado acumulado positivo
     * - Caso contrário → max(0, resultado operacional do período)
     * Esta é uma estimativa auditável; uma versão futura aceita saldo bancário manual.
     */
    function estimatedCashBalance(franchiseId, periodKey, dre) {
        const ro = Number(dre?.resultadoOperacional || 0);
        if (typeof Caixa !== 'undefined' && Caixa.getTurnoState) {
            const st = Caixa.getTurnoState(franchiseId);
            if (st.status === 'aberto') {
                return Math.max(0, ro) + Number(st.saldoEsperadoDinheiro || 0);
            }
        }
        return Math.max(0, ro);
    }

    function computeHealthScore(franchiseId, periodKey) {
        const pk = periodKey || currentPeriodKey();
        const dre = computeDRE(franchiseId, pk);
        const rel = reliabilityScore(franchiseId, pk);
        const cashBalance = estimatedCashBalance(franchiseId, pk, dre);

        const pillars = {
            liquidez: _pillarLiquidity(cashBalance, dre.totalFixed),
            rentabilidade: _pillarProfitability(dre.resultadoOperacional, dre.receitaLiquida),
            eficiencia: _pillarEfficiency(dre.cmv, dre.variaveisSemImpostos, dre.receitaLiquida),
            previsibilidade: _pillarPredictability(rel, dre.cmvCobertura),
            disciplina: _pillarDiscipline(rel)
        };

        const weighted =
            (pillars.liquidez * 0.25) +
            (pillars.rentabilidade * 0.25) +
            (pillars.eficiencia * 0.20) +
            (pillars.previsibilidade * 0.15) +
            (pillars.disciplina * 0.15);
        const score = Math.round(weighted);

        return {
            periodKey: pk,
            score: score,
            label: scoreLabel(score),
            tone: scoreTone(score),
            pillars: pillars,
            cashBalance: cashBalance,
            reliability: rel.score,
            inputs: {
                receitaLiquida: dre.receitaLiquida,
                totalFixed: dre.totalFixed,
                resultadoOperacional: dre.resultadoOperacional,
                cmv: dre.cmv,
                variaveisSemImpostos: dre.variaveisSemImpostos,
                cmvCobertura: dre.cmvCobertura
            }
        };
    }

    function scoreLabel(score) {
        if (score >= 90) return 'Operação forte';
        if (score >= 75) return 'Saudável com atenção';
        if (score >= 60) return 'Risco moderado';
        if (score >= 40) return 'Risco alto';
        return 'Intervenção imediata';
    }

    function scoreTone(score) {
        if (score >= 75) return 'good';
        if (score >= 60) return 'warn';
        return 'danger';
    }

    function scoreColor(score) {
        if (score >= 75) return '#10B981';
        if (score >= 60) return '#F59E0B';
        if (score >= 40) return '#DC2626';
        return '#7F1D1D';
    }

    function pillarLabel(key) {
        const map = {
            liquidez: 'Liquidez',
            rentabilidade: 'Rentabilidade',
            eficiencia: 'Eficiência',
            previsibilidade: 'Previsibilidade',
            disciplina: 'Disciplina'
        };
        return map[key] || key;
    }

    function pillarHint(key) {
        const map = {
            liquidez: 'Caixa livre vs custos fixos — capacidade de honrar obrigações',
            rentabilidade: 'Resultado operacional sobre receita líquida',
            eficiencia: 'CMV + variáveis sobre receita — quanto sobra por real vendido',
            previsibilidade: 'Qualidade dos dados lançados — obrigatórios + CMV completos',
            disciplina: 'Disciplina de lançamento dos custos obrigatórios'
        };
        return map[key] || '';
    }

    function pillarWeight(key) {
        const map = { liquidez: 0.25, rentabilidade: 0.25, eficiencia: 0.20, previsibilidade: 0.15, disciplina: 0.15 };
        return map[key] || 0;
    }

    /** Série histórica dos últimos N períodos fechados (snapshots) + período atual aberto. */
    function healthHistory(franchiseId, months) {
        months = months || 6;
        const snaps = loadSnapshots(franchiseId);
        const byPeriod = {};
        snaps.forEach(s => { byPeriod[s.periodKey] = s; });

        const now = new Date();
        const out = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const pk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            const snap = byPeriod[pk];
            if (snap && snap.dre) {
                // Usa snapshot imutável se existir
                const h = computeHealthScore(franchiseId, pk);
                out.push({
                    periodKey: pk,
                    label: formatPeriodLabel(pk),
                    score: snap.reliability ? Math.round((snap.reliability.score + h.score) / 2) : h.score,
                    receita: snap.dre.receitaBruta,
                    resultado: snap.dre.resultadoOperacional,
                    fromSnapshot: true,
                    closedAt: snap.closedAt || snap.createdAt,
                    reliability: snap.reliability ? snap.reliability.score : null
                });
            } else {
                const h = computeHealthScore(franchiseId, pk);
                const dre = computeDRE(franchiseId, pk);
                out.push({
                    periodKey: pk,
                    label: formatPeriodLabel(pk),
                    score: h.score,
                    receita: dre.receitaBruta,
                    resultado: dre.resultadoOperacional,
                    fromSnapshot: false,
                    closedAt: null,
                    reliability: h.reliability
                });
            }
        }
        return out;
    }

    /* ============================================
       Fechamento de período (snapshot imutável)
       ============================================ */
    function closePeriod(franchiseId, periodKey) {
        const user = sessionInfo();
        const allowedRoles = ['super_admin', 'franchisee', 'manager'];
        if (allowedRoles.indexOf(user.role) === -1) return { success: false, error: 'Sem permissão para fechar período.' };

        if (isPeriodClosed(franchiseId, periodKey)) return { success: false, error: 'Período já está fechado.' };

        const dre = computeDRE(franchiseId, periodKey);
        const reliability = reliabilityScore(franchiseId, periodKey);

        // Cria snapshot imutável
        const snapshot = {
            periodKey: periodKey,
            dre: dre,
            reliability: reliability,
            costsFrozen: {
                fixed: getCostsByPeriod(franchiseId, periodKey, 'fixed').map(c => Object.assign({}, c)),
                variable: getCostsByPeriod(franchiseId, periodKey, 'variable').map(c => Object.assign({}, c))
            },
            sales: getSalesInPeriod(franchiseId, periodKey),
            cmv: getCMVInPeriod(franchiseId, periodKey),
            closedBy: user.id,
            closedByName: user.name,
            closedByEmail: user.email
        };
        const savedSnap = DataStore.addToCollection(COL_SNAPSHOTS, franchiseId, snapshot);

        // Registra metadata de período
        const periods = loadPeriods(franchiseId);
        const idx = periods.findIndex(p => p.periodKey === periodKey);
        const meta = {
            periodKey: periodKey,
            status: 'fechado',
            closedAt: new Date().toISOString(),
            closedBy: user.id,
            closedByName: user.name,
            snapshotId: savedSnap.id
        };
        if (idx === -1) DataStore.addToCollection(COL_PERIODS, franchiseId, meta);
        else DataStore.updateInCollection(COL_PERIODS, franchiseId, periods[idx].id, meta);

        audit(AuditLog.EVENTS.FIN_PERIOD_CLOSED, franchiseId, {
            periodKey, snapshotId: savedSnap.id,
            receitaBruta: dre.receitaBruta,
            resultadoOperacional: dre.resultadoOperacional,
            reliability: reliability.score
        });
        return { success: true, snapshot: savedSnap, dre, reliability };
    }

    /**
     * Retificação: cria NOVO lançamento marcado como retificação em período fechado.
     * Só super_admin. Requer motivo. Não sobrescreve o snapshot.
     */
    function retify(franchiseId, periodKey, costData, motivo) {
        const user = sessionInfo();
        if (user.role !== 'super_admin') return { success: false, error: 'Apenas super_admin pode retificar.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório para retificação.' };
        if (!isPeriodClosed(franchiseId, periodKey)) return { success: false, error: 'Período não está fechado. Use lançamento normal.' };
        if (!costData.kind || !costData.categoria || isNaN(costData.valor)) return { success: false, error: 'Dados da retificação incompletos.' };

        const meta = getPeriodMeta(franchiseId, periodKey);
        const cat = allCategories(costData.kind).find(c => c.key === costData.categoria);
        const retif = {
            kind: costData.kind,
            periodKey: periodKey,
            categoria: costData.categoria,
            categoriaLabel: cat ? cat.label : costData.categoria,
            mandatory: cat ? !!cat.mandatory : false,
            descricao: '[RETIFICAÇÃO] ' + (costData.descricao || ''),
            valor: Number(costData.valor),
            dueDay: costData.dueDay || null,
            notes: motivo,
            source: 'retification',
            retifiesSnapshotId: meta ? meta.snapshotId : null,
            createdBy: user.id,
            createdByName: user.name,
            createdByEmail: user.email,
            retificacaoMotivo: motivo
        };
        const saved = DataStore.addToCollection(COL_COSTS, franchiseId, retif);
        audit(AuditLog.EVENTS.FIN_PERIOD_RETIFIED, franchiseId, {
            periodKey, costId: saved.id, snapshotId: meta?.snapshotId,
            motivo, valor: saved.valor, categoria: saved.categoria
        });
        return { success: true, cost: saved };
    }

    function reopenPeriod(franchiseId, periodKey, motivo) {
        const user = sessionInfo();
        if (user.role !== 'super_admin') return { success: false, error: 'Apenas super_admin pode reabrir período.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório.' };
        if (!isPeriodClosed(franchiseId, periodKey)) return { success: false, error: 'Período não está fechado.' };

        const periods = loadPeriods(franchiseId);
        const meta = periods.find(p => p.periodKey === periodKey);
        DataStore.updateInCollection(COL_PERIODS, franchiseId, meta.id, {
            status: 'aberto',
            reopened: true,
            reopenedAt: new Date().toISOString(),
            reopenedBy: user.id,
            reopenedByName: user.name,
            reopenedMotivo: motivo
        });
        audit(AuditLog.EVENTS.FIN_PERIOD_REOPENED, franchiseId, { periodKey, motivo });
        return { success: true };
    }

    function loadSnapshots(franchiseId) {
        return (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? (DataStore.getCollection(COL_SNAPSHOTS, franchiseId) || [])
            : [];
    }

    function getSnapshot(franchiseId, snapshotId) {
        return loadSnapshots(franchiseId).find(s => s.id === snapshotId) || null;
    }

    /* ============================================
       Helpers de formatação
       ============================================ */
    function formatBRL(v) {
        const n = Number(v || 0);
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + 'R$ ' + abs.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function formatPct(v) {
        return (Number(v || 0) * 100).toFixed(1) + '%';
    }

    /* ============================================
       API pública
       ============================================ */
    return {
        // Categorias
        FIXED_CATEGORIES,
        VARIABLE_CATEGORIES,
        allCategories,
        mandatoryCategories,
        categoryLabel,

        // Período
        currentPeriodKey,
        parsePeriodKey,
        nextPeriodKey,
        formatPeriodLabel,
        daysInPeriod,
        periodRange,

        // Metadata
        loadPeriods,
        getPeriodMeta,
        isPeriodClosed,

        // Costs
        loadCosts,
        getCostsByPeriod,
        addCost,
        updateCost,
        deleteCost,

        // Recurring
        loadRecurring,
        addRecurring,
        deactivateRecurring,
        generateRecurringForPeriod,

        // Receita e CMV
        getSalesInPeriod,
        getCMVInPeriod,

        // DRE + score
        computeDRE,
        reliabilityScore,
        computePendencies,

        // Saúde (5 pilares)
        computeHealthScore,
        estimatedCashBalance,
        healthHistory,
        scoreLabel,
        scoreTone,
        scoreColor,
        pillarLabel,
        pillarHint,
        pillarWeight,

        // Fechamento + retificação
        closePeriod,
        retify,
        reopenPeriod,
        loadSnapshots,
        getSnapshot,

        // Format
        formatBRL,
        formatPct
    };
})();
