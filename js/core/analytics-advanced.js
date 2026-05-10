/* ============================================================
   MilkyPot Analytics Advanced
   ============================================================
   - Curva ABC de produtos (Pareto 80/20)
   - Cohort de retenção de clientes (D7, D14, D30)
   - Top clientes + ranking operadores

   Todos esses cálculos consomem `orders_{fid}` do DataStore.
   Cliente identificado por phone (normalizado) — não precisa de CPF.
   ============================================================ */
(function(global){
    'use strict';

    function DS() { return global.DataStore; }
    function today0() { const d = new Date(); d.setHours(0,0,0,0); return d; }
    function parseDate(iso) { return new Date(iso); }

    function normalizePhone(p) {
        return String(p || '').replace(/\D/g, '').slice(-11);
    }

    // ================================================================
    // CURVA ABC (produtos)
    // ================================================================
    function curveABC(fid, days) {
        days = days || 30;
        const since = new Date(today0().getTime() - days * 86400000);
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const recent = orders.filter(o => o.createdAt && parseDate(o.createdAt) >= since &&
                                         ['confirmado','entregue','pago'].includes(o.status));

        const byProduct = new Map();
        recent.forEach(o => {
            (o.items || []).forEach(it => {
                const name = (it.name || it.sabor || 'Outros').trim();
                const qty = Number(it.qty || 1);
                const total = Number(it.total || (Number(it.unitPrice)||0) * qty);
                if (!byProduct.has(name)) byProduct.set(name, { name, qty: 0, receita: 0 });
                const p = byProduct.get(name);
                p.qty += qty; p.receita += total;
            });
        });

        const sorted = Array.from(byProduct.values()).sort((a,b) => b.receita - a.receita);
        const totalRev = sorted.reduce((s,p) => s + p.receita, 0) || 1;

        let cum = 0;
        sorted.forEach(p => {
            p.pct = p.receita / totalRev * 100;
            cum += p.pct;
            p.cumPct = cum;
            p.classe = cum <= 80 ? 'A' : (cum <= 95 ? 'B' : 'C');
        });

        const classeA = sorted.filter(p => p.classe === 'A');
        const classeB = sorted.filter(p => p.classe === 'B');
        const classeC = sorted.filter(p => p.classe === 'C');

        return {
            produtos: sorted,
            classeA, classeB, classeC,
            totalRev,
            insight: classeA.length > 0 ?
                `${classeA.length} produto(s) geram 80% da receita. Foque neles em marketing e estoque.` :
                'Sem dados suficientes (precisa 30+ vendas).'
        };
    }

    // ================================================================
    // COHORT ANALYSIS
    // ================================================================
    /**
     * Pra cada cliente (phone), descobre:
     * - 1a compra (mês cohort)
     * - Se voltou em D+7, D+14, D+30, D+60
     */
    function cohortAnalysis(fid) {
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];

        // Agrupa por phone
        const byPhone = new Map();
        orders.filter(o => o.customer && o.customer.phone).forEach(o => {
            const ph = normalizePhone(o.customer.phone);
            if (!ph) return;
            if (!byPhone.has(ph)) byPhone.set(ph, []);
            byPhone.get(ph).push({ at: parseDate(o.createdAt), total: Number(o.total)||0, customerName: o.customer.name });
        });

        const cohorts = {}; // cohort-YYYY-MM → [{ phone, first, retornos: {d7,d14,d30,d60} }]
        let totalClients = byPhone.size;
        let returned7 = 0, returned14 = 0, returned30 = 0, returned60 = 0;
        const topClients = [];

        byPhone.forEach((visits, phone) => {
            visits.sort((a,b) => a.at - b.at);
            const first = visits[0];
            const cohortKey = first.at.toISOString().slice(0,7); // YYYY-MM

            const retornos = { d7: false, d14: false, d30: false, d60: false };
            visits.slice(1).forEach(v => {
                const diff = (v.at - first.at) / 86400000;
                if (diff <= 7) retornos.d7 = true;
                if (diff <= 14) retornos.d14 = true;
                if (diff <= 30) retornos.d30 = true;
                if (diff <= 60) retornos.d60 = true;
            });
            if (retornos.d7) returned7++;
            if (retornos.d14) returned14++;
            if (retornos.d30) returned30++;
            if (retornos.d60) returned60++;

            if (!cohorts[cohortKey]) cohorts[cohortKey] = [];
            cohorts[cohortKey].push({ phone, first, retornos, totalVisits: visits.length });

            // Top clients
            const totalSpent = visits.reduce((s,v) => s + v.total, 0);
            topClients.push({
                phone, name: first.customerName || '—', visits: visits.length,
                totalSpent: Math.round(totalSpent*100)/100,
                lastVisit: visits[visits.length-1].at.toISOString(),
                firstVisit: first.at.toISOString()
            });
        });

        topClients.sort((a,b) => b.totalSpent - a.totalSpent);

        return {
            totalClients,
            retencao: {
                d7:  totalClients > 0 ? Math.round(returned7/totalClients*100) : 0,
                d14: totalClients > 0 ? Math.round(returned14/totalClients*100) : 0,
                d30: totalClients > 0 ? Math.round(returned30/totalClients*100) : 0,
                d60: totalClients > 0 ? Math.round(returned60/totalClients*100) : 0
            },
            cohorts,
            topClients: topClients.slice(0, 20),
            insight: totalClients > 0 ?
                `${totalClients} clientes únicos. ${returned30} voltaram em 30 dias (${Math.round(returned30/totalClients*100)}%). Benchmark MilkyPot: >20% D30.` :
                'Cadastre pedidos com telefone do cliente pra gerar cohort.'
        };
    }

    // ================================================================
    // COMISSÃO POR OPERADOR
    // ================================================================
    /**
     * Calcula comissão do operador baseado em `commissionRate` por item.
     * Ordem precisa ter `operatorId` ou `createdBy` pra atribuir.
     */
    function commissionReport(fid, periodKey) {
        periodKey = periodKey || (new Date()).toISOString().slice(0,7);
        const [y, m] = periodKey.split('-').map(Number);

        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const catalog = DS().get('catalog_config') || {};
        const productMap = {};
        Object.values(catalog.sabores||{}).forEach(g => (g.items||[]).forEach(i => productMap[i.id] = i));
        Object.values(catalog.adicionais||{}).forEach(g => (g.items||[]).forEach(i => productMap[i.id] = i));
        (catalog.bebidas||[]).forEach(i => productMap[i.id] = i);

        const byOperator = new Map();
        const periodOrders = orders.filter(o => {
            if (!o.createdAt) return false;
            const d = parseDate(o.createdAt);
            return d.getFullYear() === y && (d.getMonth()+1) === m &&
                   ['confirmado','entregue','pago'].includes(o.status);
        });

        periodOrders.forEach(o => {
            const operId = o.operatorId || o.createdBy || 'indefinido';
            if (!byOperator.has(operId)) {
                byOperator.set(operId, { operatorId: operId, orders: 0, revenue: 0, commission: 0 });
            }
            const op = byOperator.get(operId);
            op.orders++;
            op.revenue += Number(o.total) || 0;

            (o.items || []).forEach(it => {
                const p = productMap[it.productId || it.id];
                const rate = p ? Number(p.commissionRate || 0) : 0;
                const linhaValor = Number(it.total || (Number(it.unitPrice)||0) * (Number(it.qty)||1));
                op.commission += linhaValor * rate / 100;
            });
        });

        const list = Array.from(byOperator.values()).map(o => ({
            ...o,
            revenue: Math.round(o.revenue*100)/100,
            commission: Math.round(o.commission*100)/100,
            avgTicket: o.orders > 0 ? Math.round(o.revenue/o.orders*100)/100 : 0
        })).sort((a,b) => b.revenue - a.revenue);

        return {
            periodKey,
            operadores: list,
            totalComissao: list.reduce((s,o) => s + o.commission, 0),
            totalVendas: list.reduce((s,o) => s + o.revenue, 0)
        };
    }

    global.AnalyticsAdvanced = {
        curveABC, cohortAnalysis, commissionReport,
        normalizePhone
    };
})(typeof window !== 'undefined' ? window : this);
