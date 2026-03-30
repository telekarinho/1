/* ============================================
   MilkyPot iFood Connector - Content Script
   Roda dentro do Gestor de Pedidos do iFood
   Intercepta pedidos aceitos automaticamente
   ============================================ */

(function() {
    'use strict';

    const MILKYPOT_CONFIG_KEY = 'milkypot_ifood_config';
    const CAPTURED_ORDERS_KEY = 'milkypot_ifood_captured';
    let capturedOrderIds = new Set();
    let isEnabled = false;
    let storeId = '';

    // Load config
    function loadConfig() {
        return new Promise(resolve => {
            chrome.storage.local.get([MILKYPOT_CONFIG_KEY, CAPTURED_ORDERS_KEY], result => {
                const config = result[MILKYPOT_CONFIG_KEY] || {};
                isEnabled = config.enabled || false;
                storeId = config.storeId || '';
                capturedOrderIds = new Set(result[CAPTURED_ORDERS_KEY] || []);
                resolve(config);
            });
        });
    }

    // Save captured order ID to avoid duplicates
    function saveCapturedOrder(orderId) {
        capturedOrderIds.add(orderId);
        // Keep only last 500 order IDs
        const arr = Array.from(capturedOrderIds);
        if (arr.length > 500) arr.splice(0, arr.length - 500);
        chrome.storage.local.set({ [CAPTURED_ORDERS_KEY]: arr });
    }

    // Send order to MilkyPot via background script
    function sendToMilkyPot(orderData) {
        if (!isEnabled || !storeId) return;
        if (capturedOrderIds.has(orderData.id)) return; // Already captured

        const milkypotOrder = {
            source: 'ifood',
            ifoodId: orderData.id,
            ifoodShortId: orderData.shortId || orderData.displayId || '',
            storeId: storeId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            customer: {
                name: orderData.customer?.name || orderData.delivery?.deliveryAddress?.formattedAddress || 'Cliente iFood',
                phone: orderData.customer?.phone?.number || '',
            },
            deliveryAddress: orderData.delivery?.deliveryAddress ? {
                street: orderData.delivery.deliveryAddress.streetName || '',
                number: orderData.delivery.deliveryAddress.streetNumber || '',
                neighborhood: orderData.delivery.deliveryAddress.neighborhood || '',
                city: orderData.delivery.deliveryAddress.city || '',
                complement: orderData.delivery.deliveryAddress.complement || '',
                reference: orderData.delivery.deliveryAddress.reference || '',
            } : null,
            items: (orderData.items || []).map(item => ({
                name: item.name || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || item.price || 0,
                totalPrice: item.totalPrice || (item.unitPrice * item.quantity) || 0,
                observations: item.observations || '',
                subItems: (item.subItems || []).map(sub => ({
                    name: sub.name || '',
                    quantity: sub.quantity || 1,
                    price: sub.price || 0,
                }))
            })),
            total: {
                subtotal: orderData.total?.subTotal || orderData.totalPrice || 0,
                deliveryFee: orderData.total?.deliveryFee || orderData.deliveryFee || 0,
                discount: orderData.total?.benefits || orderData.discount || 0,
                total: orderData.total?.orderAmount || orderData.totalPrice || 0,
            },
            payment: {
                method: orderData.payments?.[0]?.name || orderData.paymentMethod || 'Nao informado',
                prepaid: orderData.payments?.[0]?.prepaid ?? true,
            },
            orderType: orderData.orderType || 'DELIVERY',
            scheduledTo: orderData.schedule?.deliveryDateTimeStart || null,
        };

        // Send to background script
        chrome.runtime.sendMessage({
            type: 'IFOOD_ORDER_CAPTURED',
            order: milkypotOrder
        }, response => {
            if (response?.success) {
                saveCapturedOrder(orderData.id);
                showNotification('Pedido #' + (milkypotOrder.ifoodShortId || milkypotOrder.ifoodId.slice(-4)) + ' capturado!');
            }
        });
    }

    // Show floating notification on Gestor de Pedidos
    function showNotification(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#6C63FF;color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:600;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;display:flex;align-items:center;gap:8px;';
        toast.innerHTML = '<span style="font-size:18px">🐑</span> MilkyPot: ' + msg;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    // ============================================
    // INTERCEPT FETCH (main method)
    // ============================================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

        try {
            // Intercept order details responses
            if (url.includes('/order/') && url.includes('/v1.0/orders/')) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data && data.id && data.items && data.items.length > 0) {
                        sendToMilkyPot(data);
                    }
                }).catch(() => {});
            }

            // Intercept order confirmation (POST /confirm)
            if (url.includes('/confirm') && args[1]?.method?.toUpperCase() === 'POST') {
                // Order was confirmed/accepted - extract order ID from URL
                const orderId = url.match(/orders\/([a-f0-9-]+)\//)?.[1];
                if (orderId) {
                    // Fetch full order details
                    setTimeout(() => {
                        const orderUrl = url.replace(/\/confirm.*/, '');
                        originalFetch(orderUrl, {
                            headers: args[1]?.headers || {}
                        }).then(r => r.json()).then(data => {
                            if (data && data.id) sendToMilkyPot(data);
                        }).catch(() => {});
                    }, 1000);
                }
            }
        } catch (e) {
            // Silent fail - never break Gestor de Pedidos
        }

        return response;
    };

    // ============================================
    // INTERCEPT XMLHttpRequest (fallback)
    // ============================================
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._milkypotUrl = url;
        this._milkypotMethod = method;
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('load', function() {
            try {
                const url = this._milkypotUrl || '';
                if (url.includes('/order/') && url.includes('/orders/') && this.status === 200) {
                    const data = JSON.parse(this.responseText);
                    if (data && data.id && data.items && data.items.length > 0) {
                        sendToMilkyPot(data);
                    }
                }
            } catch (e) {}
        });
        return originalXHRSend.apply(this, args);
    };

    // ============================================
    // INIT
    // ============================================
    loadConfig().then(config => {
        if (isEnabled) {
            console.log('🐑 MilkyPot iFood Connector ativo | Loja: ' + storeId);
            showNotification('Connector ativo - capturando pedidos');
        } else {
            console.log('🐑 MilkyPot iFood Connector carregado (desativado)');
        }
    });

    // Listen for config changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes[MILKYPOT_CONFIG_KEY]) {
            const config = changes[MILKYPOT_CONFIG_KEY].newValue || {};
            isEnabled = config.enabled || false;
            storeId = config.storeId || '';
            console.log('🐑 Config atualizada | Ativo:', isEnabled, '| Loja:', storeId);
        }
    });
})();
