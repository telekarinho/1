/* ============================================
   MilkyPot - Checkout & Chat Ordering
   ============================================ */

let currentCheckoutStep = 1;
let orderCounter = Math.floor(Math.random() * 9000) + 1000;

// ============================================
// CHECKOUT
// ============================================
function openCheckout() {
    if (cart.length === 0) {
        showToast('Adicione produtos ao carrinho primeiro!');
        return;
    }
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentCheckoutStep = 1;
        updateCheckoutSteps();
        updateOrderSummary();
    }
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function nextCheckoutStep(step) {
    // Validate current step
    if (step > currentCheckoutStep) {
        if (!validateCheckoutStep(currentCheckoutStep)) return;
    }

    currentCheckoutStep = step;
    updateCheckoutSteps();

    if (step === 3) {
        updateOrderSummary();
    }
}

function validateCheckoutStep(step) {
    if (step === 1) {
        const name = document.getElementById('checkoutName')?.value?.trim();
        const phone = document.getElementById('checkoutPhone')?.value?.trim();
        if (!name || !phone) {
            showToast('Preencha seu nome e telefone!');
            return false;
        }
    }
    if (step === 2) {
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        if (deliveryType === 'delivery') {
            const cep = document.getElementById('checkoutCep')?.value?.trim();
            const address = document.getElementById('checkoutAddress')?.value?.trim();
            if (!cep || !address) {
                showToast('Preencha o endereço de entrega!');
                return false;
            }
        }
    }
    return true;
}

function updateCheckoutSteps() {
    // Update step indicators
    document.querySelectorAll('.checkout-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (stepNum === currentCheckoutStep) step.classList.add('active');
        if (stepNum < currentCheckoutStep) step.classList.add('completed');
    });

    // Update panels
    document.querySelectorAll('.checkout-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`checkoutStep${currentCheckoutStep}`);
    if (activePanel) activePanel.classList.add('active');
}

function updateOrderSummary() {
    const summaryItems = document.getElementById('summaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryDelivery = document.getElementById('summaryDelivery');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryItems) {
        summaryItems.innerHTML = cart.map(item =>
            `<div class="summary-item">
                <span>${item.emoji} ${item.name} x${item.qty}</span>
                <span>${formatCurrency(item.price * item.qty)}</span>
            </div>`
        ).join('');
    }

    const subtotal = getCartTotal();
    const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
    const deliveryFee = deliveryType === 'delivery' && selectedStore ? selectedStore.deliveryFee : 0;

    if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
    if (summaryDelivery) summaryDelivery.textContent = deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis';
    if (summaryTotal) summaryTotal.textContent = formatCurrency(subtotal + deliveryFee);
}

function placeOrder() {
    orderCounter++;
    const orderNumber = `#MP${orderCounter}`;

    closeCheckout();
    closeSidebar();

    // Show success
    const successModal = document.getElementById('successModal');
    const orderNumEl = document.getElementById('orderNumber');
    const detailsEl = document.getElementById('successDetails');

    if (orderNumEl) orderNumEl.textContent = orderNumber;

    const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
    const paymentType = document.querySelector('input[name="payment"]:checked')?.value;
    const paymentLabels = { pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', cash: 'Dinheiro' };

    if (detailsEl) {
        detailsEl.innerHTML = `
            <p><strong>Loja:</strong> ${selectedStore?.name || '-'}</p>
            <p><strong>Entrega:</strong> ${deliveryType === 'delivery' ? 'Delivery' : 'Retirada na loja'}</p>
            <p><strong>Pagamento:</strong> ${paymentLabels[paymentType] || 'PIX'}</p>
            <p><strong>Total:</strong> ${formatCurrency(getCartTotal() + (deliveryType === 'delivery' && selectedStore ? selectedStore.deliveryFee : 0))}</p>
            <p><strong>Previsão:</strong> ${selectedStore?.deliveryTime || '20-35 min'}</p>
        `;
    }

    if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Confetti!
    createConfetti();

    // Clear cart
    cart = [];
    updateCartUI();
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// DELIVERY TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.delivery-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.delivery-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            const addressDiv = document.getElementById('deliveryAddress');
            if (addressDiv) {
                addressDiv.style.display = radio.value === 'delivery' ? 'block' : 'none';
            }
        });
    });

    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
});

// ============================================
// CHAT ORDERING SYSTEM
// ============================================
let chatState = {
    step: 'greeting',
    selectedCategory: null,
    chatCart: []
};

function initChat() {
    // Create chat button and widget
    const chatBtn = document.createElement('button');
    chatBtn.className = 'chat-float-btn';
    chatBtn.id = 'chatFloatBtn';
    chatBtn.innerHTML = '🐑';
    chatBtn.setAttribute('aria-label', 'Pedir via chat');
    chatBtn.title = 'Pedir pelo Chat!';

    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.id = 'chatWidget';
    chatWidget.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-avatar">🐑</div>
            <div class="chat-header-info">
                <h4>Lulú - MilkyPot</h4>
                <span>Online agora</span>
            </div>
            <button class="chat-close-btn" id="chatCloseBtn" aria-label="Fechar chat">&times;</button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chatInput" placeholder="Digite sua mensagem...">
            <button class="chat-send-btn" id="chatSendBtn" aria-label="Enviar">➤</button>
        </div>
    `;

    document.body.appendChild(chatBtn);
    document.body.appendChild(chatWidget);

    // Move WhatsApp button up
    const whatsapp = document.querySelector('.whatsapp-float');
    if (whatsapp) {
        whatsapp.style.bottom = '170px';
    }

    // Events
    chatBtn.addEventListener('click', () => {
        chatWidget.classList.add('active');
        chatBtn.style.display = 'none';
        if (chatState.step === 'greeting') {
            startChatConversation();
        }
    });

    document.getElementById('chatCloseBtn').addEventListener('click', () => {
        chatWidget.classList.remove('active');
        chatBtn.style.display = 'flex';
    });

    document.getElementById('chatSendBtn').addEventListener('click', handleChatInput);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatInput();
    });
}

function startChatConversation() {
    const messages = document.getElementById('chatMessages');
    messages.innerHTML = '';

    // Greeting sequence
    addBotMessage(CHAT_GREETINGS[0], 0);
    addBotMessage(CHAT_GREETINGS[1], 800);
    addBotMessage(CHAT_GREETINGS[2], 1600);

    // Show options
    setTimeout(() => {
        if (!selectedStore) {
            addBotMessageWithOptions(
                "Primeiro, escolha uma loja perto de você:",
                STORES.filter(s => s.open).slice(0, 4).map(s => ({
                    label: s.name.replace('MilkyPot ', ''),
                    value: `store_${s.id}`
                }))
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
        CHAT_CATEGORIES_MSG,
        [
            { label: "🍨 Potinhos", value: "potinhos" },
            { label: "🥤 Milkshakes", value: "milkshakes" },
            { label: "🫐 Açaí", value: "acai" },
            { label: "🍦 Sorvetes", value: "sorvetes" },
            { label: "✨ Especiais", value: "especiais" },
            { label: "🎁 Combos", value: "combos" }
        ]
    );
}

function handleChatInput() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';

    // Process based on state
    processUserMessage(text);
}

function handleChatOption(value) {
    // Show user selection
    const btn = event.target;
    addUserMessage(btn.textContent);

    // Disable all option buttons in the same group
    const parent = btn.closest('.chat-options');
    if (parent) {
        parent.querySelectorAll('.chat-option-btn').forEach(b => {
            b.disabled = true;
            b.style.opacity = '0.5';
            b.style.cursor = 'default';
        });
    }

    if (chatState.step === 'select_store') {
        const storeId = parseInt(value.replace('store_', ''));
        selectStore(storeId);
        addBotMessage(`Ótima escolha! ${selectedStore.name} selecionada! 🎉`, 500);
        setTimeout(() => showChatCategories(), 1200);
    } else if (chatState.step === 'select_category') {
        chatState.selectedCategory = value;
        showChatProducts(value);
    } else if (chatState.step === 'browsing') {
        if (value === 'more_categories') {
            showChatCategories();
        } else if (value === 'finish') {
            finishChatOrder();
        } else if (value.startsWith('add_')) {
            const productId = parseInt(value.replace('add_', ''));
            addToCart(productId);
            const product = PRODUCTS.find(p => p.id === productId);
            addBotMessage(`${product.emoji} ${product.name} adicionado ao carrinho! ✨`, 500);
            setTimeout(() => {
                addBotMessageWithOptions(
                    CHAT_ADD_MORE,
                    [
                        { label: "📋 Ver mais categorias", value: "more_categories" },
                        { label: "✅ Finalizar pedido", value: "finish" }
                    ]
                );
                chatState.step = 'browsing';
            }, 1000);
        }
    }
}

function showChatProducts(category) {
    const products = PRODUCTS.filter(p => p.category === category);
    chatState.step = 'browsing';

    addBotMessage("Aqui estão as opções deliciosas! 😋", 300);

    products.forEach((product, i) => {
        setTimeout(() => {
            addProductCard(product);
        }, 600 + (i * 400));
    });

    setTimeout(() => {
        addBotMessageWithOptions(
            "Quer ver outra categoria ou finalizar?",
            [
                { label: "📋 Outras categorias", value: "more_categories" },
                { label: "✅ Finalizar pedido", value: "finish" }
            ]
        );
    }, 600 + (products.length * 400) + 500);
}

function finishChatOrder() {
    if (cart.length === 0) {
        addBotMessage("Seu carrinho está vazio! Escolha alguns produtos primeiro 😊", 500);
        setTimeout(() => showChatCategories(), 1200);
        return;
    }

    const total = getCartTotal();
    let summary = "Seu pedido:\n\n";
    cart.forEach(item => {
        summary += `${item.emoji} ${item.name} x${item.qty} - ${formatCurrency(item.price * item.qty)}\n`;
    });
    summary += `\nTotal: ${formatCurrency(total)}`;

    addBotMessage(summary, 500);
    addBotMessage("Vou abrir a tela de finalização para você! 🎉", 1500);

    setTimeout(() => {
        openCheckout();
    }, 2500);
}

function processUserMessage(text) {
    const lower = text.toLowerCase();

    // Simple keyword matching
    showTyping();

    setTimeout(() => {
        removeTyping();

        if (lower.includes('oi') || lower.includes('olá') || lower.includes('ola')) {
            addBotMessage("Oii! Como posso te ajudar? 😊");
            showChatCategories();
        } else if (lower.includes('cardápio') || lower.includes('cardapio') || lower.includes('menu') || lower.includes('produtos')) {
            showChatCategories();
        } else if (lower.includes('potinho')) {
            showChatProducts('potinhos');
        } else if (lower.includes('milkshake')) {
            showChatProducts('milkshakes');
        } else if (lower.includes('açaí') || lower.includes('acai')) {
            showChatProducts('acai');
        } else if (lower.includes('sorvete')) {
            showChatProducts('sorvetes');
        } else if (lower.includes('especial') || lower.includes('waffle') || lower.includes('crepe')) {
            showChatProducts('especiais');
        } else if (lower.includes('combo') || lower.includes('promoção') || lower.includes('promocao')) {
            showChatProducts('combos');
        } else if (lower.includes('finalizar') || lower.includes('fechar') || lower.includes('pagar') || lower.includes('carrinho')) {
            finishChatOrder();
        } else if (lower.includes('obrigado') || lower.includes('obrigada') || lower.includes('valeu')) {
            addBotMessage("Por nada! Fico feliz em ajudar! 🐑💕 Volte sempre!");
        } else {
            addBotMessage("Hmm, não entendi muito bem 🤔 Posso te mostrar nosso cardápio?");
            setTimeout(() => showChatCategories(), 800);
        }
    }, 1000);
}

// ============================================
// CHAT UI HELPERS
// ============================================
function addBotMessage(text, delay = 0) {
    setTimeout(() => {
        const messages = document.getElementById('chatMessages');
        if (!messages) return;
        const msg = document.createElement('div');
        msg.className = 'chat-message bot';
        msg.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>`;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }, delay);
}

function addUserMessage(text) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const msg = document.createElement('div');
    msg.className = 'chat-message user';
    msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function addBotMessageWithOptions(text, options) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const msg = document.createElement('div');
    msg.className = 'chat-message bot';
    msg.innerHTML = `
        <div class="chat-bubble">${text}</div>
        <div class="chat-options">
            ${options.map(opt =>
                `<button class="chat-option-btn" onclick="handleChatOption('${opt.value}')">${opt.label}</button>`
            ).join('')}
        </div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function addProductCard(product) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const msg = document.createElement('div');
    msg.className = 'chat-message bot';
    msg.innerHTML = `
        <div class="chat-product-card">
            <div class="chat-product-img">${product.emoji}</div>
            <div class="chat-product-info">
                <h5>${product.name}</h5>
                <p class="desc">${product.desc}</p>
                <span class="price">${formatCurrency(product.price)}</span>
            </div>
            <div class="chat-product-actions">
                <button class="chat-add-btn chat-option-btn" onclick="handleChatOption('add_${product.id}')">Adicionar 🛒</button>
            </div>
        </div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const typing = document.createElement('div');
    typing.className = 'chat-message bot typing-msg';
    typing.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
    const typing = document.querySelector('.typing-msg');
    if (typing) typing.remove();
}
