/* ============================================
   MilkyPot - Checkout & Order Capture
   ============================================ */

var currentCheckoutStep = 1;
var orderCounter = parseInt(localStorage.getItem('milkypot_order_counter') || '1000');

// ============================================
// CHECKOUT MODAL
// ============================================
function openCheckout() {
    reloadCart();
    if (cart.length === 0) {
        showToast('Adicione produtos ao carrinho primeiro!');
        return;
    }
    var modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentCheckoutStep = 1;
        updateCheckoutSteps();
        updateOrderSummary();
    }
}

function closeCheckout() {
    var modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function nextCheckoutStep(step) {
    if (step > currentCheckoutStep) {
        if (!validateCheckoutStep(currentCheckoutStep)) return;
    }
    currentCheckoutStep = step;
    updateCheckoutSteps();
    if (step === 4) {
        updateOrderSummary();
    }
}

function validateCheckoutStep(step) {
    if (step === 1) {
        var name = document.getElementById('checkoutName');
        var phone = document.getElementById('checkoutPhone');
        if (!name || !name.value.trim() || !phone || !phone.value.trim()) {
            showToast('Preencha seu nome e telefone!');
            return false;
        }
    }
    if (step === 2) {
        var btn = document.getElementById('btnToDelivery');
        if (btn && btn.disabled) {
            showToast('Selecione uma loja MilkyPot!');
            return false;
        }
    }
    if (step === 3) {
        var deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        if (deliveryRadio && deliveryRadio.value === 'delivery') {
            var cep = document.getElementById('checkoutCep');
            var address = document.getElementById('checkoutAddress');
            if (!cep || !cep.value.trim() || !address || !address.value.trim()) {
                showToast('Preencha o endereço de entrega!');
                return false;
            }
        }
    }
    return true;
}

function updateCheckoutSteps() {
    document.querySelectorAll('.checkout-step').forEach(function(step) {
        var stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (stepNum === currentCheckoutStep) step.classList.add('active');
        if (stepNum < currentCheckoutStep) step.classList.add('completed');
    });

    document.querySelectorAll('.checkout-panel').forEach(function(panel) {
        panel.classList.remove('active');
    });
    var activePanel = document.getElementById('checkoutStep' + currentCheckoutStep);
    if (activePanel) activePanel.classList.add('active');
}

function updateOrderSummary() {
    reloadCart();
    var summaryItems = document.getElementById('summaryItems');
    var summarySubtotal = document.getElementById('summarySubtotal');
    var summaryDelivery = document.getElementById('summaryDelivery');
    var summaryTotal = document.getElementById('summaryTotal');

    var summaryStore = document.getElementById('summaryStore');
    if (summaryStore) {
        var storeName = window._selectedStoreName || '';
        var storeTime = window._selectedStoreTime || '';
        summaryStore.innerHTML = storeName
            ? '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F0E8FF;margin-bottom:8px">' +
              '<span style="font-weight:600;color:#6B3FA0">📍 ' + storeName + '</span>' +
              (storeTime ? '<span style="font-size:0.8rem;color:#9484A8">⏱️ ' + storeTime + '</span>' : '') +
              '</div>'
            : '';
    }

    if (summaryItems) {
        summaryItems.innerHTML = cart.map(function(item) {
            var emoji = item.emoji || '🍨';
            var name = item.name || 'Produto';
            var qty = item.qty || 1;
            var total = item.total || calcItemTotal(item);

            var details = '';
            if (item.sizeName) details += item.sizeName;
            if (item.formatoName) details += (details ? ' · ' : '') + item.formatoName;
            if (item.nomeCliente) details += (details ? ' · ' : '') + '🏷️ ' + item.nomeCliente;

            return '<div class="summary-item">' +
                '<div>' +
                    '<span>' + emoji + ' ' + name + ' x' + qty + '</span>' +
                    (details ? '<small style="display:block;color:#9484A8;font-size:0.75rem">' + details + '</small>' : '') +
                '</div>' +
                '<span>' + formatCurrency(total) + '</span>' +
            '</div>';
        }).join('');
    }

    var subtotal = getCartTotal();
    var deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    var deliveryType = deliveryRadio ? deliveryRadio.value : 'pickup';
    var storeFee = window._selectedStoreDeliveryFee || 0;
    var deliveryFee = deliveryType === 'delivery' ? storeFee : 0;

    if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
    if (summaryDelivery) summaryDelivery.textContent = deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis';
    if (summaryTotal) summaryTotal.textContent = formatCurrency(subtotal + deliveryFee);
}

// ============================================
// PLACE ORDER - Capture + Status
// ============================================
function placeOrder() {
    reloadCart();
    if (cart.length === 0) {
        showToast('Carrinho vazio!');
        return;
    }

    // BUG D — orderCounter com sufixo de timestamp para garantir unicidade
    var counter = parseInt(localStorage.getItem('mp_order_counter') || '0') + 1;
    localStorage.setItem('mp_order_counter', counter);
    var orderNumber = '#MP' + counter + '_' + Date.now().toString(36).toUpperCase().slice(-4);

    // Gather customer data
    var customerName = (document.getElementById('checkoutName') || {}).value || '';
    var customerPhone = (document.getElementById('checkoutPhone') || {}).value || '';
    var customerCpf = (document.getElementById('checkoutCpf') || {}).value || '';

    // Store data
    var storeName = window._selectedStoreName || 'MilkyPot';
    var storeWhatsapp = window._selectedStoreWhatsApp || '5543998042424';
    var storeTime = window._selectedStoreTime || '20-35 min';
    var storeFee = window._selectedStoreDeliveryFee || 0;

    // Delivery data
    var deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    var deliveryType = deliveryRadio ? deliveryRadio.value : 'pickup';
    var deliveryFee = deliveryType === 'delivery' ? storeFee : 0;
    var deliveryAddress = '';
    if (deliveryType === 'delivery') {
        var addr = (document.getElementById('checkoutAddress') || {}).value || '';
        var comp = (document.getElementById('checkoutComplement') || {}).value || '';
        var bairro = (document.getElementById('checkoutNeighborhood') || {}).value || '';
        var cep = (document.getElementById('checkoutCep') || {}).value || '';
        deliveryAddress = [addr, comp, bairro, cep].filter(Boolean).join(', ');
    }

    // Payment data
    var paymentRadio = document.querySelector('input[name="payment"]:checked');
    var paymentType = paymentRadio ? paymentRadio.value : 'pix';
    var paymentLabels = { pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', cash: 'Dinheiro' };

    var subtotal = getCartTotal();
    var total = subtotal + deliveryFee;

    // ============================================
    // CAPTURE ORDER (save to localStorage)
    // ============================================
    var order = {
        orderNumber: orderNumber,
        status: 'aguardando_pagamento',
        createdAt: new Date().toISOString(),
        customer: {
            name: customerName,
            phone: customerPhone,
            cpf: customerCpf
        },
        store: {
            name: storeName,
            whatsapp: storeWhatsapp,
            deliveryTime: storeTime
        },
        delivery: {
            type: deliveryType,
            address: deliveryAddress,
            fee: deliveryFee
        },
        payment: {
            method: paymentType,
            label: paymentLabels[paymentType] || paymentType,
            status: 'pendente'
        },
        items: cart.map(function(item) {
            return {
                name: item.name || 'Produto',
                emoji: item.emoji || '🍨',
                baseId: item.baseId,
                baseName: item.baseName,
                formatoId: item.formatoId,
                formatoName: item.formatoName,
                saborId: item.saborId,
                size: item.sizeName || item.size || '',
                sizeMl: item.sizeMl || 0,
                sizePrice: item.sizePrice || 0,
                extras: item.extras || [],
                bebidas: item.bebidas || [],
                nomeCliente: item.nomeCliente || '',
                qty: item.qty || 1,
                total: item.total || calcItemTotal(item)
            };
        }),
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total
    };

    // Save order to orders list
    var orders = JSON.parse(localStorage.getItem('milkypot_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('milkypot_orders', JSON.stringify(orders));

    // ============================================
    // SAVE TO DATASTORE (franchise financial tracking)
    // ============================================
    var storeId = window._selectedStoreId || null;
    if (typeof DataStore !== 'undefined' && typeof Utils !== 'undefined' && storeId) {
        try {
            // Save order to DataStore for franchise tracking
            DataStore.addToCollection('orders', storeId, {
                id: Utils.generateId(),
                orderNumber: orderNumber,
                status: 'aguardando_pagamento',
                createdAt: new Date().toISOString(),
                customer: { name: customerName, phone: customerPhone },
                delivery: { type: deliveryType, address: deliveryAddress, fee: deliveryFee },
                payment: { method: paymentType, label: paymentLabels[paymentType] || paymentType },
                items: order.items,
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: total,
                source: 'site'
            });

            // Auto-create financial entry from site order
            DataStore.addToCollection('finances', storeId, {
                id: Utils.generateId(),
                type: 'income',
                category: 'vendas_delivery',
                source: 'site',
                amount: total,
                description: 'Pedido ' + orderNumber + ' - ' + (deliveryType === 'delivery' ? 'Delivery' : 'Retirada'),
                orderId: orderNumber,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            });
            console.log('DataStore: Order + finance entry saved for franchise', storeId);
        } catch (e) {
            console.warn('DataStore save error:', e);
        }
    }

    // ============================================
    // DESAFIO VOUCHER GENERATION (site orders)
    // ============================================
    var voucherCode = 'MP' + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).toUpperCase().slice(2,4);
    var voucherDisplay = 'MP-' + voucherCode.slice(2);
    var voucher = {
        code: voucherDisplay,
        orderId: orderNumber,
        orderSource: 'site',
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        franchiseId: storeId || '',
        attempts: 1,
        attemptsUsed: 0,
        instagramBonusUsed: false,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        used: false
    };
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            firebase.firestore().collection('desafio_vouchers').doc(voucherCode).set(voucher);
        } catch(e) { console.warn('Voucher save error:', e); }
    }

    // ============================================
    // SHOW SUCCESS
    // ============================================
    closeCheckout();

    var successModal = document.getElementById('successModal');
    var orderNumEl = document.getElementById('orderNumber');
    var detailsEl = document.getElementById('successDetails');

    if (orderNumEl) orderNumEl.textContent = orderNumber;

    if (detailsEl) {
        detailsEl.innerHTML =
            '<p><strong>Loja:</strong> ' + storeName + '</p>' +
            '<p><strong>Entrega:</strong> ' + (deliveryType === 'delivery' ? 'Delivery' : 'Retirada na loja') + '</p>' +
            '<p><strong>Pagamento:</strong> ' + (paymentLabels[paymentType] || 'PIX') + '</p>' +
            '<p><strong>Total:</strong> ' + formatCurrency(total) + '</p>' +
            '<p><strong>Previsão:</strong> ' + storeTime + '</p>' +
            '<p style="margin-top:8px;padding:8px 12px;background:#FFF3E0;border-radius:8px;font-size:0.85rem;">' +
                '⏳ <strong>Status:</strong> Aguardando pagamento' +
            '</p>' +
            '<div style="margin-top:12px;padding:14px;background:linear-gradient(135deg,#FFF5F7,#F5F0FF);border:2px dashed #FF0040;border-radius:12px;text-align:center">' +
                '<div style="font-size:12px;font-weight:700;color:#9B59B6;margin-bottom:4px">🎟️ Desafio 10.000 Milissegundos</div>' +
                '<div style="font-family:monospace;font-size:28px;font-weight:900;color:#FF0040;letter-spacing:3px;margin-bottom:4px">' + voucherDisplay + '</div>' +
                '<div style="font-size:11px;color:#888">Use este codigo em milkypot.com/desafio.html</div>' +
            '</div>';
    }

    // Build WhatsApp message with full order summary
    var itemsLines = order.items.map(function(item) {
        var line = '• ' + (item.name || item.baseName || 'Produto');
        if (item.size) line += ' ' + item.size;
        if (item.extras && item.extras.length) {
            line += ' (+' + item.extras.map(function(e) { return e.name || e; }).join(', ') + ')';
        }
        line += ' — ' + formatCurrency(item.total || 0);
        return line;
    }).join('\n');

    var deliveryLine = deliveryType === 'delivery'
        ? 'Delivery para: ' + (deliveryAddress || 'a confirmar')
        : 'Retirada na loja';

    var waMsg = [
        'Oi! Fiz meu pedido pelo site 🐑✨',
        '',
        '*Pedido:* ' + orderNumber,
        '*Loja:* ' + storeName,
        '*Itens:*',
        itemsLines,
        '',
        '*' + deliveryLine + '*',
        '*Pagamento:* ' + (paymentLabels[paymentType] || 'PIX'),
        '*Total:* ' + formatCurrency(total),
        '',
        'Pode confirmar? 🙏'
    ].join('\n');

    var waUrl = 'https://wa.me/' + storeWhatsapp + '?text=' + encodeURIComponent(waMsg);

    if (successModal) {
        // Inject or update WhatsApp CTA button
        var waBtn = successModal.querySelector('#successWaBtn');
        if (!waBtn) {
            waBtn = document.createElement('a');
            waBtn.id = 'successWaBtn';
            waBtn.target = '_blank';
            waBtn.rel = 'noopener';
            waBtn.setAttribute('aria-label', 'Confirmar pedido no WhatsApp');
            waBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;text-decoration:none;margin-bottom:12px;border-radius:14px;padding:16px;font-size:1rem;font-weight:700;width:100%;box-sizing:border-box;';
            waBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
                'Confirmar no WhatsApp 💬';
            var closeBtn = successModal.querySelector('[onclick="closeSuccessModal()"]');
            if (closeBtn) closeBtn.parentNode.insertBefore(waBtn, closeBtn);
        }
        waBtn.href = waUrl;
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Confetti
    if (typeof createConfetti === 'function') createConfetti();

    // Clear cart
    clearCart();

    console.log('Order captured:', order);
}

function closeSuccessModal() {
    var modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeSidebar() {
    if (typeof closeCartSidebar === 'function') {
        closeCartSidebar();
    } else {
        var sidebar = document.getElementById('cartSidebar');
        var overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
}

// ============================================
// DELIVERY TOGGLE & PAYMENT OPTIONS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delivery-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.delivery-option').forEach(function(o) { o.classList.remove('active'); });
            opt.classList.add('active');
            var radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            var addressDiv = document.getElementById('deliveryAddress');
            if (addressDiv) {
                addressDiv.style.display = radio && radio.value === 'delivery' ? 'block' : 'none';
            }
        });
    });

    document.querySelectorAll('.payment-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(function(o) { o.classList.remove('active'); });
            opt.classList.add('active');
            var radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
});

// ============================================
// CONFETTI HELPER
// ============================================
function createConfetti() {
    var colors = ['#FFB6D9', '#D4A5FF', '#A5D4FF', '#A5FFD4', '#FFE5A5', '#FFB38A', '#FF6B9D'];
    for (var i = 0; i < 40; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = 'position:fixed;top:-10px;left:' + (Math.random() * 100) + '%;z-index:99999;' +
            'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
            'width:' + (Math.random() * 8 + 5) + 'px;height:' + (Math.random() * 8 + 5) + 'px;' +
            'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
            'animation:confettiFall ' + (Math.random() * 2 + 2) + 's ease forwards;' +
            'animation-delay:' + Math.random() + 's;';
        document.body.appendChild(piece);
        setTimeout(function() { piece.remove(); }, 4500);
    }
}

// Add confetti animation style if not present
(function() {
    if (!document.getElementById('confettiStyle')) {
        var style = document.createElement('style');
        style.id = 'confettiStyle';
        style.textContent = '@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }';
        document.head.appendChild(style);
    }
})();

// ============================================
// CHAT ORDERING SYSTEM (Lulu Bot)
// ============================================
var chatState = {
    step: 'greeting',
    selectedCategory: null,
    chatCart: []
};

function initChat() {
    var chatBtn = document.createElement('button');
    chatBtn.className = 'chat-float-btn';
    chatBtn.id = 'chatFloatBtn';
    chatBtn.innerHTML = '🐑';
    chatBtn.setAttribute('aria-label', 'Pedir via chat');
    chatBtn.title = 'Pedir pelo Chat!';

    var chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.id = 'chatWidget';
    chatWidget.innerHTML =
        '<div class="chat-header">' +
            '<div class="chat-header-avatar">🐑</div>' +
            '<div class="chat-header-info"><h4>Lulú - MilkyPot</h4><span>Online agora</span></div>' +
            '<button class="chat-close-btn" id="chatCloseBtn" aria-label="Fechar chat">&times;</button>' +
        '</div>' +
        '<div class="chat-messages" id="chatMessages"></div>' +
        '<div class="chat-input-area">' +
            '<input type="text" class="chat-input" id="chatInput" placeholder="Digite sua mensagem...">' +
            '<button class="chat-send-btn" id="chatSendBtn" aria-label="Enviar">➤</button>' +
        '</div>';

    document.body.appendChild(chatBtn);
    document.body.appendChild(chatWidget);

    var whatsapp = document.querySelector('.whatsapp-float');
    if (whatsapp) whatsapp.style.bottom = '170px';

    chatBtn.addEventListener('click', function() {
        chatWidget.classList.add('active');
        chatBtn.style.display = 'none';
        if (chatState.step === 'greeting') startChatConversation();
    });

    document.getElementById('chatCloseBtn').addEventListener('click', function() {
        chatWidget.classList.remove('active');
        chatBtn.style.display = 'flex';
    });

    document.getElementById('chatSendBtn').addEventListener('click', handleChatInput);
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleChatInput();
    });
}

function startChatConversation() {
    var messages = document.getElementById('chatMessages');
    if (messages) messages.innerHTML = '';

    if (typeof CHAT_GREETINGS !== 'undefined') {
        addBotMessage(CHAT_GREETINGS[0], 0);
        addBotMessage(CHAT_GREETINGS[1], 800);
        addBotMessage(CHAT_GREETINGS[2], 1600);
    } else {
        addBotMessage('Oii! Bem-vindo(a) à MilkyPot! 🐑', 0);
        addBotMessage('Eu sou a Lulú, vou te ajudar a montar seu potinho perfeito! 🍨', 800);
    }

    setTimeout(function() {
        if (!selectedStore) {
            addBotMessageWithOptions(
                'Primeiro, escolha uma loja perto de você:',
                (typeof STORES !== 'undefined' ? STORES : []).filter(function(s) { return s.open; }).slice(0, 4).map(function(s) {
                    return { label: s.name.replace('MilkyPot ', ''), value: 'store_' + s.id };
                })
            );
            chatState.step = 'select_store';
        } else {
            showChatCategories();
        }
    }, 2400);
}

function showChatCategories() {
    chatState.step = 'select_category';
    addBotMessageWithOptions(
        typeof CHAT_CATEGORIES_MSG !== 'undefined' ? CHAT_CATEGORIES_MSG : 'Escolha uma categoria:',
        [
            { label: '🍨 Potinhos', value: 'potinhos' },
            { label: '🥤 Milkshakes', value: 'milkshakes' },
            { label: '🫐 Açaí', value: 'acai' },
            { label: '🍦 Sorvetes', value: 'sorvetes' },
            { label: '✨ Especiais', value: 'especiais' },
            { label: '🎁 Combos', value: 'combos' }
        ]
    );
}

function handleChatInput() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = '';
    processUserMessage(text);
}

// BUG E — event recebido explicitamente como parâmetro (não mais global implícito)
function handleChatOption(event, value) {
    var btn = event.target;
    addUserMessage(btn.textContent);
    var parent = btn.closest('.chat-options');
    if (parent) {
        parent.querySelectorAll('.chat-option-btn').forEach(function(b) {
            b.disabled = true;
            b.style.opacity = '0.5';
            b.style.cursor = 'default';
        });
    }

    if (chatState.step === 'select_store') {
        var storeId = parseInt(value.replace('store_', ''));
        if (typeof selectStore === 'function') selectStore(storeId);
        addBotMessage('Ótima escolha! Loja selecionada! 🎉', 500);
        setTimeout(function() { showChatCategories(); }, 1200);
    } else if (chatState.step === 'select_category') {
        chatState.selectedCategory = value;
        showChatProducts(value);
    } else if (chatState.step === 'browsing') {
        if (value === 'more_categories') {
            showChatCategories();
        } else if (value === 'finish') {
            finishChatOrder();
        } else if (value.startsWith('add_')) {
            var productId = parseInt(value.replace('add_', ''));
            if (typeof PRODUCTS !== 'undefined') {
                var product = PRODUCTS.find(function(p) { return p.id === productId; });
                if (product) {
                    // Add to localStorage cart
                    var cartItems = JSON.parse(localStorage.getItem('milkypot_cart') || '[]');
                    var existing = cartItems.find(function(i) { return i.name === product.name; });
                    if (existing) {
                        existing.qty = (existing.qty || 1) + 1;
                        existing.total = (existing.sizePrice || existing.price || product.price) * existing.qty;
                    } else {
                        cartItems.push({
                            id: Date.now().toString(),
                            name: product.name,
                            emoji: product.emoji,
                            sizePrice: product.price,
                            extras: [],
                            bebidas: [],
                            qty: 1,
                            total: product.price
                        });
                    }
                    localStorage.setItem('milkypot_cart', JSON.stringify(cartItems));
                    if (typeof updateCartUI === 'function') updateCartUI();
                    addBotMessage(product.emoji + ' ' + product.name + ' adicionado ao carrinho! ✨', 500);
                }
            }
            setTimeout(function() {
                addBotMessageWithOptions(
                    'Quer adicionar mais alguma coisa?',
                    [
                        { label: '📋 Ver mais categorias', value: 'more_categories' },
                        { label: '✅ Finalizar pedido', value: 'finish' }
                    ]
                );
                chatState.step = 'browsing';
            }, 1000);
        }
    }
}

function showChatProducts(category) {
    if (typeof PRODUCTS === 'undefined') return;
    var products = PRODUCTS.filter(function(p) { return p.category === category; });
    chatState.step = 'browsing';

    addBotMessage('Aqui estão as opções deliciosas! 😋', 300);
    products.forEach(function(product, i) {
        setTimeout(function() { addProductCard(product); }, 600 + (i * 400));
    });

    setTimeout(function() {
        addBotMessageWithOptions(
            'Quer ver outra categoria ou finalizar?',
            [
                { label: '📋 Outras categorias', value: 'more_categories' },
                { label: '✅ Finalizar pedido', value: 'finish' }
            ]
        );
    }, 600 + (products.length * 400) + 500);
}

function finishChatOrder() {
    reloadCart();
    if (cart.length === 0) {
        addBotMessage('Seu carrinho está vazio! Escolha alguns produtos primeiro 😊', 500);
        setTimeout(function() { showChatCategories(); }, 1200);
        return;
    }

    var total = getCartTotal();
    var summary = 'Seu pedido:\n\n';
    cart.forEach(function(item) {
        summary += (item.emoji || '🍨') + ' ' + (item.name || 'Produto') + ' x' + (item.qty || 1) + ' - ' + formatCurrency(item.total || 0) + '\n';
    });
    summary += '\nTotal: ' + formatCurrency(total);

    addBotMessage(summary, 500);
    addBotMessage('Vou abrir a tela de finalização para você! 🎉', 1500);

    setTimeout(function() { openCheckout(); }, 2500);
}

function processUserMessage(text) {
    var lower = text.toLowerCase();
    showTyping();

    setTimeout(function() {
        removeTyping();
        if (lower.includes('oi') || lower.includes('olá') || lower.includes('ola')) {
            addBotMessage('Oii! Como posso te ajudar? 😊');
            showChatCategories();
        } else if (lower.includes('cardápio') || lower.includes('cardapio') || lower.includes('menu')) {
            showChatCategories();
        } else if (lower.includes('finalizar') || lower.includes('fechar') || lower.includes('carrinho')) {
            finishChatOrder();
        } else if (lower.includes('obrigado') || lower.includes('valeu')) {
            addBotMessage('Por nada! Fico feliz em ajudar! 🐑💕 Volte sempre!');
        } else {
            addBotMessage('Hmm, não entendi muito bem 🤔 Posso te mostrar nosso cardápio?');
            setTimeout(function() { showChatCategories(); }, 800);
        }
    }, 1000);
}

// Chat UI helpers
function addBotMessage(text, delay) {
    delay = delay || 0;
    setTimeout(function() {
        var messages = document.getElementById('chatMessages');
        if (!messages) return;
        var msg = document.createElement('div');
        msg.className = 'chat-message bot';
        msg.innerHTML = '<div class="chat-bubble">' + text.replace(/\n/g, '<br>') + '</div>';
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }, delay);
}

function addUserMessage(text) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var msg = document.createElement('div');
    msg.className = 'chat-message user';
    msg.innerHTML = '<div class="chat-bubble">' + text + '</div>';
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function addBotMessageWithOptions(text, options) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var msg = document.createElement('div');
    msg.className = 'chat-message bot';
    msg.innerHTML =
        '<div class="chat-bubble">' + text + '</div>' +
        '<div class="chat-options">' +
            options.map(function(opt) {
                return '<button class="chat-option-btn" onclick="handleChatOption(event, \'' + opt.value + '\')">' + opt.label + '</button>';
            }).join('') +
        '</div>';
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function addProductCard(product) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var msg = document.createElement('div');
    msg.className = 'chat-message bot';
    msg.innerHTML =
        '<div class="chat-product-card">' +
            '<div class="chat-product-img">' + product.emoji + '</div>' +
            '<div class="chat-product-info">' +
                '<h5>' + product.name + '</h5>' +
                '<p class="desc">' + product.desc + '</p>' +
                '<span class="price">' + formatCurrency(product.price) + '</span>' +
            '</div>' +
            '<div class="chat-product-actions">' +
                '<button class="chat-add-btn chat-option-btn" onclick="handleChatOption(event, \'add_' + product.id + '\')">Adicionar 🛒</button>' +
            '</div>' +
        '</div>';
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var typing = document.createElement('div');
    typing.className = 'chat-message bot typing-msg';
    typing.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
    var typing = document.querySelector('.typing-msg');
    if (typing) typing.remove();
}
