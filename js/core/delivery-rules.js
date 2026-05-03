/* ============================================
   MilkyPot - Delivery pricing and freight rules
   ============================================ */
(function(global) {
    'use strict';

    const DEFAULT_CONFIG = {
        percentual_acrescimo_delivery: 30,
        pedido_minimo_delivery: 30,
        taxa_uber_referencia: 10.50,
        modo_frete_delivery: 'FRETE_GRATIS_TOTAL'
    };

    function num(v, fallback) {
        const n = Number(v);
        return Number.isFinite(n) ? n : (fallback || 0);
    }

    function money(v) {
        return Math.round(num(v) * 100) / 100;
    }

    function brl(v) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num(v));
    }

    function commercialRound(value) {
        const v = num(value);
        if (v <= 0) return 0;
        let rounded = Math.ceil(v) - 0.01;
        if (rounded + 0.0001 < v) rounded = Math.ceil(v + 1) - 0.01;
        return money(Math.max(0.99, rounded));
    }

    function normalizeConfig(raw) {
        const cfg = Object.assign({}, DEFAULT_CONFIG, raw || {});
        cfg.percentual_acrescimo_delivery = num(cfg.percentual_acrescimo_delivery, DEFAULT_CONFIG.percentual_acrescimo_delivery);
        cfg.pedido_minimo_delivery = num(cfg.pedido_minimo_delivery, DEFAULT_CONFIG.pedido_minimo_delivery);
        cfg.taxa_uber_referencia = num(cfg.taxa_uber_referencia, DEFAULT_CONFIG.taxa_uber_referencia);
        if (!['FRETE_GRATIS_TOTAL', 'COBRAR_DIFERENCA', 'FRETE_NORMAL'].includes(cfg.modo_frete_delivery)) {
            cfg.modo_frete_delivery = DEFAULT_CONFIG.modo_frete_delivery;
        }
        return cfg;
    }

    function getFranchise(franchiseId) {
        try {
            if (global.DataStore && DataStore.getAllFranchises) {
                const f = (DataStore.getAllFranchises() || []).find(x => x && x.id === franchiseId);
                if (f) return f;
            }
        } catch(_) {}
        try {
            if (Array.isArray(global.MILKYPOT_STORES)) {
                return global.MILKYPOT_STORES.find(x => x && x.id === franchiseId) || null;
            }
        } catch(_) {}
        return null;
    }

    function getConfig(franchiseId) {
        const f = getFranchise(franchiseId);
        return normalizeConfig(f && f.deliveryFreeConfig);
    }

    function deliveryPriceFromPdv(pdvPrice, cfg) {
        cfg = normalizeConfig(cfg);
        return commercialRound(num(pdvPrice) * (1 + cfg.percentual_acrescimo_delivery / 100));
    }

    function variantPdvBase(variant) {
        const loja = num(variant && variant.precoLoja);
        const original = num(variant && variant.precoLojaOriginal);
        if (variant && variant.promoAtivo && original > loja) return original;
        return loja || original;
    }

    function variantPdvActual(variant) {
        const loja = num(variant && variant.precoLoja);
        const original = num(variant && variant.precoLojaOriginal);
        return loja || original;
    }

    function priceForVariant(variant, cfg) {
        const pdvActual = variantPdvActual(variant);
        const pdvBase = variantPdvBase(variant);
        return {
            pdvUnitPrice: money(pdvActual),
            deliveryUnitPrice: deliveryPriceFromPdv(pdvBase, cfg),
            deliveryBasePrice: money(pdvBase)
        };
    }

    function itemPdvPrice(item) {
        if (!item) return 0;
        const precos = item._v2 && item._v2.precos;
        return num(precos && precos.loja && (precos.loja.real || precos.loja.recomendado)) || num(item.price);
    }

    function priceForSimpleItem(item, cfg) {
        const pdv = itemPdvPrice(item);
        return {
            pdvUnitPrice: money(pdv),
            deliveryUnitPrice: deliveryPriceFromPdv(pdv, cfg),
            deliveryBasePrice: money(pdv)
        };
    }

    function priceForPortion(item, peso, cfg) {
        const pdvKg = itemPdvPrice(item);
        const pdvPortion = pdvKg * num(peso) / 1000;
        return {
            pdvUnitPrice: money(pdvPortion),
            deliveryUnitPrice: deliveryPriceFromPdv(pdvPortion, cfg),
            deliveryBasePrice: money(pdvPortion)
        };
    }

    function cartItemPdvTotal(item) {
        const qty = num(item && item.qty, 1) || 1;
        let unit = num(item && item.pdvUnitPrice);
        if (!unit) {
            const total = num(item && (item.total || item.price));
            unit = total && qty ? total / qty : 0;
        }
        let extras = 0;
        (item && item.extras || []).forEach(e => {
            extras += num(e.pdvPrice != null ? e.pdvPrice : e.price) * (num(e.qty, 1) || 1);
        });
        return money((unit + extras) * qty);
    }

    function cartItemDeliveryTotal(item) {
        if (item && Number.isFinite(Number(item.total))) return money(item.total);
        const qty = num(item && item.qty, 1) || 1;
        let unit = num(item && (item.unitPrice || item.price || item.sizePrice));
        let extras = 0;
        (item && item.extras || []).forEach(e => {
            extras += num(e.price) * (num(e.qty, 1) || 1);
        });
        return money((unit + extras) * qty);
    }

    function calculateCart(cart) {
        const items = Array.isArray(cart) ? cart : [];
        const subtotalDelivery = money(items.reduce((s, item) => s + cartItemDeliveryTotal(item), 0));
        const subtotalPDV = money(items.reduce((s, item) => s + cartItemPdvTotal(item), 0));
        return {
            subtotalPDV,
            subtotalDelivery,
            valorAcrescimoDelivery: money(subtotalDelivery - subtotalPDV)
        };
    }

    function calculateFreight(cart, uberFee, deliveryType, cfg) {
        cfg = normalizeConfig(cfg);
        const base = calculateCart(cart);
        const isDelivery = deliveryType === 'delivery';
        const taxaUber = isDelivery ? money(num(uberFee, cfg.taxa_uber_referencia)) : 0;
        let fretePagoCliente = isDelivery ? taxaUber : 0;

        if (isDelivery) {
            if (cfg.modo_frete_delivery === 'FRETE_GRATIS_TOTAL') {
                fretePagoCliente = base.subtotalDelivery >= cfg.pedido_minimo_delivery ? 0 : taxaUber;
            } else if (cfg.modo_frete_delivery === 'COBRAR_DIFERENCA') {
                fretePagoCliente = Math.max(0, taxaUber - base.valorAcrescimoDelivery);
            } else {
                fretePagoCliente = taxaUber;
            }
        }

        fretePagoCliente = money(fretePagoCliente);
        const freteBancadoLoja = money(Math.max(0, taxaUber - fretePagoCliente));
        const diferencaBancadaPelaLoja = money(Math.max(0, taxaUber - base.valorAcrescimoDelivery - fretePagoCliente));

        const result = Object.assign({}, base, {
            taxaUber,
            fretePagoCliente,
            freteBancadoLoja,
            diferencaBancadaPelaLoja,
            saldoFrete: money(base.valorAcrescimoDelivery - freteBancadoLoja),
            modoFreteDelivery: cfg.modo_frete_delivery,
            pedidoMinimoDelivery: cfg.pedido_minimo_delivery,
            pedidoMinimoOk: !isDelivery || base.subtotalDelivery >= cfg.pedido_minimo_delivery
        });
        try { console.info('[DeliveryRules] freight_calc', result); } catch(_) {}
        return result;
    }

    function minimumMessage(calc) {
        const faltam = Math.max(0, num(calc && calc.pedidoMinimoDelivery) - num(calc && calc.subtotalDelivery));
        const frete = brl(calc && calc.fretePagoCliente);
        return 'Você pode ganhar frete grátis a partir de ' + brl(calc.pedidoMinimoDelivery) + ' em compras. Faltam ' + brl(faltam) + '. Se preferir, pode finalizar agora pagando o frete de ' + frete + '.';
    }

    function summarizeOrders(orders, fromDate, toDate) {
        const list = (Array.isArray(orders) ? orders : []).filter(o => {
            if (!o || o.deleted) return false;
            const metrics = o.deliveryPricing || o.deliveryMetrics || null;
            if (!metrics) return false;
            const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            if (fromDate && t < new Date(fromDate + 'T00:00:00').getTime()) return false;
            if (toDate && t > new Date(toDate + 'T23:59:59').getTime()) return false;
            return true;
        });

        const summary = {
            totalPedidosDelivery: list.length,
            totalVendidoPDV: 0,
            totalVendidoDelivery: 0,
            totalGeradoAcrescimo: 0,
            totalPagoUber: 0,
            totalPagoClienteFrete: 0,
            totalBancadoLoja: 0,
            saldoFinalFrete: 0,
            ticketMedioDelivery: 0,
            percentualPedidosFretePrejuizo: 0,
            percentualPedidosFreteCoberto: 0
        };

        list.forEach(o => {
            const m = o.deliveryPricing || o.deliveryMetrics || {};
            summary.totalVendidoPDV += num(m.subtotalPDV);
            summary.totalVendidoDelivery += num(m.subtotalDelivery);
            summary.totalGeradoAcrescimo += num(m.valorAcrescimoDelivery);
            summary.totalPagoUber += num(m.taxaUber);
            summary.totalPagoClienteFrete += num(m.fretePagoCliente);
            summary.totalBancadoLoja += num(m.freteBancadoLoja);
            summary.saldoFinalFrete += num(m.saldoFrete);
        });

        if (list.length) {
            summary.ticketMedioDelivery = summary.totalVendidoDelivery / list.length;
            summary.percentualPedidosFretePrejuizo = list.filter(o => num((o.deliveryPricing || o.deliveryMetrics || {}).saldoFrete) < 0).length / list.length * 100;
            summary.percentualPedidosFreteCoberto = list.filter(o => num((o.deliveryPricing || o.deliveryMetrics || {}).saldoFrete) >= 0).length / list.length * 100;
        }
        Object.keys(summary).forEach(k => summary[k] = money(summary[k]));
        return { summary, orders: list };
    }

    global.DeliveryRules = {
        DEFAULT_CONFIG,
        normalizeConfig,
        getConfig,
        getFranchise,
        brl,
        money,
        commercialRound,
        deliveryPriceFromPdv,
        priceForVariant,
        priceForSimpleItem,
        priceForPortion,
        calculateCart,
        calculateFreight,
        minimumMessage,
        summarizeOrders
    };
})(window);
