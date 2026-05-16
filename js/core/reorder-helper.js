/* ============================================================
   MilkyPot Reorder Helper — "Pedir de novo" 1-tap
   ============================================================
   Aumenta repeat customer drasticamente. Lê últimos pedidos do user
   no localStorage (gravados pelo placeOrder), oferece 1-click pra
   reordenar o último entregue.

   API:
     Reorder.getLastOrder()           → último order salvo (ou null)
     Reorder.hasReorderableHistory()  → true se tem pedido pra repetir
     Reorder.execute()                → popula cart + abre checkout
     Reorder.showBanner()             → injeta banner sticky na home

   Storage:
     - localStorage: milkypot_orders_history (top 10 pedidos do site)
     - Mantido por js/checkout.js placeOrder success

   Defensive: nunca crasha se cart.js / checkout.js não estiverem prontos.
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpReorderLoaded) return;
    global._mpReorderLoaded = true;

    var HISTORY_KEY = 'milkypot_orders_history';
    var MAX_HISTORY = 10;
    var BANNER_ID = 'mpReorderBanner';

    // ============================================================
    // Salva pedido no histórico — chamado pelo checkout.js placeOrder
    // ============================================================
    function saveOrderToHistory(order) {
        try {
            var list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            // Remove duplicados pelo orderNumber
            list = list.filter(function (o) { return o.orderNumber !== order.orderNumber; });
            list.unshift({
                orderNumber: order.orderNumber || order.id,
                items: order.items || [],
                total: order.total || 0,
                createdAt: order.createdAt || new Date().toISOString(),
                franchiseId: order.franchiseId || (order.store && order.store.id) || null
            });
            list = list.slice(0, MAX_HISTORY);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        } catch (e) { /* localStorage cheio */ }
    }

    function getLastOrder() {
        try {
            var list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            return list.length > 0 ? list[0] : null;
        } catch (e) { return null; }
    }

    function hasReorderableHistory() {
        var last = getLastOrder();
        return !!(last && last.items && last.items.length > 0);
    }

    // ============================================================
    // Execute reorder: popula cart com items do último pedido
    // ============================================================
    function execute() {
        var last = getLastOrder();
        if (!last || !last.items || !last.items.length) return false;

        try {
            // Limpa cart atual e re-popula com items do último pedido
            var newCart = last.items.map(function (item) {
                return {
                    id: 'reorder_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    name: item.name || 'Produto',
                    emoji: item.emoji || '🍨',
                    unitPrice: item.sizePrice || item.unitPrice || item.price || 0,
                    qty: item.qty || 1,
                    extras: item.extras || [],
                    total: (item.sizePrice || item.unitPrice || item.price || 0) * (item.qty || 1),
                    type: item.type || 'unitario',
                    size: item.size || item.sizeName || '',
                    sizeMl: item.sizeMl || 0,
                    baseId: item.baseId, baseName: item.baseName,
                    formatoId: item.formatoId, formatoName: item.formatoName,
                    saborId: item.saborId, saborName: item.saborName
                };
            });

            global.cart = newCart;
            localStorage.setItem('milkypot_cart', JSON.stringify(newCart));
            if (typeof global.updateCartUI === 'function') global.updateCartUI();

            if (global.MpAnalytics) {
                global.MpAnalytics.track('reorder_executed', {
                    item_count: newCart.length,
                    total: last.total,
                    days_since_last: Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 86400000)
                });
            }

            // Abre checkout direto
            if (typeof global.openCheckout === 'function') {
                setTimeout(function () { global.openCheckout(); }, 300);
            }
            return true;
        } catch (e) {
            console.warn('[Reorder] execute failed:', e);
            return false;
        }
    }

    // ============================================================
    // Banner sticky com call-to-action
    // ============================================================
    function showBanner(opts) {
        opts = opts || {};
        var last = getLastOrder();
        if (!last || !last.items || !last.items.length) return;

        var existing = document.getElementById(BANNER_ID);
        if (existing) return; // já exibido

        // Resumo dos items (ex: "Açaí + Smoothie • 2 itens")
        var itemSummary = last.items.length === 1
            ? (last.items[0].name || 'Pedido')
            : (last.items[0].name || '') + ' + ' + (last.items.length - 1) + ' itens';
        if (itemSummary.length > 50) itemSummary = itemSummary.slice(0, 47) + '...';

        var daysAgo = Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 86400000);
        var dateLabel;
        if (daysAgo === 0) dateLabel = 'hoje mais cedo';
        else if (daysAgo === 1) dateLabel = 'ontem';
        else if (daysAgo < 7) dateLabel = daysAgo + ' dias atrás';
        else if (daysAgo < 30) dateLabel = 'há ' + Math.floor(daysAgo / 7) + ' sem';
        else dateLabel = 'tempo atrás';

        var banner = document.createElement('div');
        banner.id = BANNER_ID;
        banner.style.cssText = [
            'max-width:720px', 'margin:0 auto 14px', 'padding:14px 18px',
            'background:linear-gradient(135deg,#FCE7F3,#FBCFE8)',
            'border:2px solid #EC4899', 'border-radius:14px',
            'display:flex', 'align-items:center', 'justify-content:space-between',
            'gap:12px', 'flex-wrap:wrap', 'cursor:pointer',
            'box-shadow:0 4px 14px rgba(236,72,153,.15)',
            'animation:mp-reorder-slide .5s ease-out'
        ].join(';');
        banner.innerHTML =
            '<div style="flex:1;min-width:200px;text-align:left">' +
              '<div style="font-size:12px;font-weight:700;color:#831843;letter-spacing:.5px">🔄 PEDIR DE NOVO</div>' +
              '<div style="font-size:14px;color:#831843;margin-top:3px">' +
                '<strong>' + _escapeHtml(itemSummary) + '</strong>' +
                ' · ' + _escapeHtml(dateLabel) +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<button id="mpReorderBtn" style="background:linear-gradient(135deg,#EC4899,#F97316);color:#fff;border:0;padding:10px 18px;border-radius:999px;font-weight:900;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px">🔄 Repetir</button>' +
              '<button id="mpReorderDismiss" style="background:transparent;border:0;color:#9CA3AF;font-size:22px;cursor:pointer;padding:4px 8px">×</button>' +
            '</div>';

        var target = opts.parent || document.getElementById('deliveryPromoNotice');
        if (target && target.parentNode) {
            target.parentNode.insertBefore(banner, target.nextSibling);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }

        _injectStyles();

        banner.querySelector('#mpReorderBtn').onclick = function (e) {
            e.stopPropagation();
            execute();
            banner.remove();
        };
        banner.querySelector('#mpReorderDismiss').onclick = function (e) {
            e.stopPropagation();
            banner.remove();
            sessionStorage.setItem('mp_reorder_dismissed', '1');
            if (global.MpAnalytics) global.MpAnalytics.track('reorder_dismissed');
        };
        // Click anywhere else also opens
        banner.onclick = function () {
            execute();
            banner.remove();
        };

        if (global.MpAnalytics) {
            global.MpAnalytics.track('reorder_banner_shown', {
                days_since_last: daysAgo,
                item_count: last.items.length
            });
        }
    }

    function _escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function _injectStyles() {
        if (document.getElementById('mp-reorder-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-reorder-styles';
        style.textContent =
            '@keyframes mp-reorder-slide { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }' +
            '#' + BANNER_ID + ':hover { box-shadow: 0 6px 20px rgba(236,72,153,.25); }';
        document.head.appendChild(style);
    }

    // ============================================================
    // Auto-show on cardapio load (se tem histórico e não foi dismissado)
    // ============================================================
    function autoShow() {
        try {
            if (sessionStorage.getItem('mp_reorder_dismissed') === '1') return;
            if (location.pathname.indexOf('/cardapio') < 0) return;
            // Não exibir se cart atual tem items (user está montando algo novo)
            var currentCart = JSON.parse(localStorage.getItem('milkypot_cart') || '[]');
            if (currentCart.length > 0) return;
            if (hasReorderableHistory()) {
                showBanner();
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(autoShow, 1500);
        });
    } else {
        setTimeout(autoShow, 1500);
    }

    global.Reorder = {
        saveOrderToHistory: saveOrderToHistory,
        getLastOrder: getLastOrder,
        hasReorderableHistory: hasReorderableHistory,
        execute: execute,
        showBanner: showBanner,
        VERSION: 'mp-v249'
    };
})(typeof window !== 'undefined' ? window : this);
