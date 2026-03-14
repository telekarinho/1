/* ============================================
   MilkyPot - Cardápio Online / Ordering Flow
   ============================================ */

const CardapioApp = {
    // State
    currentStep: 0,      // 0=home, 1=type, 2=flavor, 3=size, 4=extras, 5=summary
    selectedType: null,
    selectedFlavor: null,
    selectedSize: null,
    selectedExtras: [],   // [{id, name, price, qty}]
    quantity: 1,
    cart: [],

    // DOM refs
    els: {},

    init() {
        this.els = {
            main:        document.getElementById('cardapioMain'),
            stepBar:     document.getElementById('cardapioStepBar'),
            backBtn:     document.getElementById('cardapioBack'),
            cartCount:   document.getElementById('menuCartCount'),
            cartBtn:     document.getElementById('menuCartBtn'),
            cartSidebar: document.getElementById('menuCartSidebar'),
            cartOverlay: document.getElementById('menuCartOverlay'),
            cartClose:   document.getElementById('menuCartClose'),
            cartItems:   document.getElementById('menuCartItems'),
            cartFooter:  document.getElementById('menuCartFooter'),
            cartTotal:   document.getElementById('menuCartTotal')
        };

        // Load cart from localStorage
        const saved = localStorage.getItem('milkypot_cart');
        if (saved) {
            try { this.cart = JSON.parse(saved); } catch(e) { this.cart = []; }
        }

        this.renderHome();
        this.updateCartCount();
        this.bindEvents();
    },

    bindEvents() {
        // Back button
        this.els.backBtn?.addEventListener('click', () => this.goBack());

        // Cart
        this.els.cartBtn?.addEventListener('click', () => this.openCart());
        this.els.cartOverlay?.addEventListener('click', () => this.closeCart());
        this.els.cartClose?.addEventListener('click', () => this.closeCart());
    },

    // ============================================
    // NAVIGATION
    // ============================================
    goBack() {
        if (this.currentStep <= 0) return;
        this.currentStep--;
        if (this.currentStep === 0) this.renderHome();
        else if (this.currentStep === 1) this.renderFlavors();
        else if (this.currentStep === 2) this.renderSizes();
        else if (this.currentStep === 3) this.renderExtras();
        else if (this.currentStep === 4) this.renderSummary();
    },

    updateStepBar() {
        if (!this.els.stepBar) return;
        const steps = this.els.stepBar.querySelectorAll('.cp-step');
        steps.forEach((step, i) => {
            step.classList.remove('active', 'done');
            if (i + 1 < this.currentStep) step.classList.add('done');
            if (i + 1 === this.currentStep) step.classList.add('active');
        });
        this.els.stepBar.style.display = this.currentStep > 0 ? 'flex' : 'none';
        this.els.backBtn.style.display = this.currentStep > 0 ? 'flex' : 'none';
    },

    scrollToTop() {
        document.getElementById('cardapioSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ============================================
    // STEP 0: HOME (type selection + highlights)
    // ============================================
    renderHome() {
        this.currentStep = 0;
        this.selectedType = null;
        this.selectedFlavor = null;
        this.selectedSize = null;
        this.selectedExtras = [];
        this.quantity = 1;
        this.updateStepBar();

        const types = CARDAPIO_CONFIG.types.filter(t => t.available);
        const highlights = CARDAPIO_CONFIG.highlights;

        this.els.main.innerHTML = `
            <!-- Hero Phrase -->
            <div class="cp-hero-phrase">
                <div class="cp-mascot">🐑</div>
                <h2>Escolha seu tipo, escolha seu sabor, escolha seu tamanho</h2>
                <p class="cp-hero-sub">Monte do seu jeitinho e receba feliz!</p>
            </div>

            <!-- Highlights (Destaques) -->
            <div class="cp-highlights">
                <h3 class="cp-section-title">🌟 Destaques — Campeões de Venda</h3>
                <div class="cp-highlights-grid">
                    ${highlights.map(h => {
                        const type = CARDAPIO_CONFIG.types.find(t => t.id === h.typeId);
                        const flavor = CARDAPIO_CONFIG.flavors[h.typeId]?.find(f => f.id === h.flavorId);
                        if (!flavor || !type) return '';
                        return `
                            <button class="cp-highlight-card" onclick="CardapioApp.quickSelect('${h.typeId}','${h.flavorId}')">
                                <div class="cp-highlight-badge">${h.label}</div>
                                <div class="cp-highlight-emoji">${flavor.emoji}</div>
                                <div class="cp-highlight-name">${flavor.name}</div>
                                <div class="cp-highlight-desc">${flavor.desc}</div>
                                ${flavor.badge ? `<span class="cp-badge" style="background:${flavor.badgeColor || '#E87AB0'}">${flavor.badge}</span>` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Type Selection -->
            <div class="cp-types-section">
                <h3 class="cp-section-title">🍦 Escolha o Tipo</h3>
                <div class="cp-types-grid">
                    ${types.map(type => `
                        <button class="cp-type-card" onclick="CardapioApp.selectType('${type.id}')"
                                style="--type-color:${type.color};--type-gradient:${type.gradient}">
                            <div class="cp-type-emoji">${type.emoji}</div>
                            <div class="cp-type-name">${type.name}</div>
                            <div class="cp-type-desc">${type.shortDesc}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Como Funciona -->
            <div class="cp-how-it-works">
                <h3 class="cp-section-title">📋 Como Funciona</h3>
                <div class="cp-steps-mini">
                    <div class="cp-step-mini">
                        <span class="cp-step-mini-num">1</span>
                        <span class="cp-step-mini-icon">🍦</span>
                        <span>Escolha o tipo</span>
                    </div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini">
                        <span class="cp-step-mini-num">2</span>
                        <span class="cp-step-mini-icon">😋</span>
                        <span>Escolha o sabor</span>
                    </div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini">
                        <span class="cp-step-mini-num">3</span>
                        <span class="cp-step-mini-icon">🎉</span>
                        <span>Receba feliz!</span>
                    </div>
                </div>
            </div>

            <!-- Combine do Seu Jeito -->
            <div class="cp-combine-section">
                <h3 class="cp-section-title">✨ Combine do Seu Jeito</h3>
                <p class="cp-combine-desc">Adicione extras e bordas para deixar seu pedido ainda mais gostoso!</p>
                <div class="cp-combine-grid">
                    ${Object.values(CARDAPIO_CONFIG.extras).slice(0, 4).map(cat =>
                        cat.items.filter(i => i.available).map(item => `
                            <div class="cp-combine-item">
                                <span class="cp-combine-emoji">${item.emoji}</span>
                                <span class="cp-combine-name">${item.name}</span>
                                <span class="cp-combine-price">+${this.formatPrice(item.price)}</span>
                            </div>
                        `).join('')
                    ).join('')}
                </div>
            </div>
        `;
    },

    // ============================================
    // STEP 1: SELECT TYPE → SHOW FLAVORS
    // ============================================
    selectType(typeId) {
        this.selectedType = CARDAPIO_CONFIG.types.find(t => t.id === typeId);
        if (!this.selectedType) return;
        this.currentStep = 1;
        this.renderFlavors();
        this.scrollToTop();
    },

    renderFlavors() {
        this.updateStepBar();
        const flavors = CARDAPIO_CONFIG.flavors[this.selectedType.id]?.filter(f => f.available) || [];

        this.els.main.innerHTML = `
            <div class="cp-flow-header" style="--type-gradient:${this.selectedType.gradient}">
                <span class="cp-flow-emoji">${this.selectedType.emoji}</span>
                <h2>${this.selectedType.name}</h2>
                <p>${this.selectedType.shortDesc}</p>
            </div>
            <h3 class="cp-section-title cp-mt">Escolha seu sabor</h3>
            <div class="cp-flavors-grid">
                ${flavors.map(flavor => `
                    <button class="cp-flavor-card" onclick="CardapioApp.selectFlavor('${flavor.id}')">
                        <div class="cp-flavor-emoji">${flavor.emoji}</div>
                        ${flavor.badge ? `<span class="cp-badge" style="background:${flavor.badgeColor || '#E87AB0'}">${flavor.badge}</span>` : ''}
                        <h4 class="cp-flavor-name">${flavor.name}</h4>
                        <p class="cp-flavor-desc">${flavor.desc}</p>
                    </button>
                `).join('')}
            </div>
        `;
    },

    quickSelect(typeId, flavorId) {
        this.selectedType = CARDAPIO_CONFIG.types.find(t => t.id === typeId);
        this.selectedFlavor = CARDAPIO_CONFIG.flavors[typeId]?.find(f => f.id === flavorId);
        if (!this.selectedType || !this.selectedFlavor) return;
        this.currentStep = 2;
        this.renderSizes();
        this.scrollToTop();
    },

    // ============================================
    // STEP 2: SELECT FLAVOR → SHOW SIZES
    // ============================================
    selectFlavor(flavorId) {
        this.selectedFlavor = CARDAPIO_CONFIG.flavors[this.selectedType.id]?.find(f => f.id === flavorId);
        if (!this.selectedFlavor) return;
        this.currentStep = 2;
        this.renderSizes();
        this.scrollToTop();
    },

    renderSizes() {
        this.updateStepBar();
        const sizes = CARDAPIO_CONFIG.sizes[this.selectedType.id]?.filter(s => s.available) || [];

        this.els.main.innerHTML = `
            <div class="cp-flow-header" style="--type-gradient:${this.selectedType.gradient}">
                <span class="cp-flow-emoji">${this.selectedFlavor.emoji}</span>
                <h2>${this.selectedFlavor.name}</h2>
                <p>${this.selectedType.name} · ${this.selectedFlavor.desc}</p>
            </div>
            <h3 class="cp-section-title cp-mt">Escolha o tamanho</h3>
            <div class="cp-sizes-grid">
                ${sizes.map((size, i) => `
                    <button class="cp-size-card ${i === 1 ? 'cp-recommended' : ''}"
                            onclick="CardapioApp.selectSize('${size.id}')">
                        ${i === 1 ? '<span class="cp-size-recommended-badge">Recomendado</span>' : ''}
                        <div class="cp-size-visual">
                            <div class="cp-size-cup" style="height:${30 + i * 18}px;width:${28 + i * 8}px"></div>
                        </div>
                        <div class="cp-size-name">${size.name}</div>
                        <div class="cp-size-ml">${size.ml}ml</div>
                        <div class="cp-size-price">${this.formatPrice(size.price)}</div>
                    </button>
                `).join('')}
            </div>
        `;
    },

    // ============================================
    // STEP 3: SELECT SIZE → SHOW EXTRAS
    // ============================================
    selectSize(sizeId) {
        this.selectedSize = CARDAPIO_CONFIG.sizes[this.selectedType.id]?.find(s => s.id === sizeId);
        if (!this.selectedSize) return;
        this.selectedExtras = [];
        this.currentStep = 3;
        this.renderExtras();
        this.scrollToTop();
    },

    renderExtras() {
        this.updateStepBar();
        const extras = CARDAPIO_CONFIG.extras;

        this.els.main.innerHTML = `
            <div class="cp-flow-header cp-flow-header-sm" style="--type-gradient:${this.selectedType.gradient}">
                <div class="cp-flow-summary-line">
                    <span>${this.selectedFlavor.emoji} ${this.selectedFlavor.name}</span>
                    <span>·</span>
                    <span>${this.selectedType.name}</span>
                    <span>·</span>
                    <span>${this.selectedSize.name} (${this.selectedSize.ml}ml)</span>
                    <span>·</span>
                    <span class="cp-flow-price">${this.formatPrice(this.selectedSize.price)}</span>
                </div>
            </div>
            <h3 class="cp-section-title cp-mt">Adicione extras <small>(opcional)</small></h3>
            <div class="cp-extras-list">
                ${Object.entries(extras).map(([catId, cat]) => `
                    <div class="cp-extras-category">
                        <h4 class="cp-extras-cat-name">${cat.emoji} ${cat.name}</h4>
                        <div class="cp-extras-items">
                            ${cat.items.filter(i => i.available).map(item => {
                                const inCart = this.selectedExtras.find(e => e.id === item.id);
                                const qty = inCart ? inCart.qty : 0;
                                return `
                                    <div class="cp-extra-item ${qty > 0 ? 'active' : ''}">
                                        <span class="cp-extra-emoji">${item.emoji}</span>
                                        <div class="cp-extra-info">
                                            <span class="cp-extra-name">${item.name}</span>
                                            <span class="cp-extra-price">+${this.formatPrice(item.price)}</span>
                                        </div>
                                        <div class="cp-extra-controls">
                                            ${qty > 0 ? `
                                                <button class="cp-extra-btn" onclick="CardapioApp.changeExtra('${item.id}', -1)">−</button>
                                                <span class="cp-extra-qty">${qty}</span>
                                            ` : ''}
                                            <button class="cp-extra-btn cp-extra-add" onclick="CardapioApp.changeExtra('${item.id}', 1)">+</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cp-extras-footer">
                <div class="cp-extras-total">
                    <span>Total extras:</span>
                    <span id="extrasTotal">${this.formatPrice(this.getExtrasTotal())}</span>
                </div>
                <button class="cp-btn-primary cp-btn-lg" onclick="CardapioApp.goToSummary()">
                    Continuar →
                </button>
            </div>
        `;
    },

    changeExtra(extraId, delta) {
        // Find the extra in config
        let extraItem = null;
        for (const cat of Object.values(CARDAPIO_CONFIG.extras)) {
            extraItem = cat.items.find(i => i.id === extraId);
            if (extraItem) break;
        }
        if (!extraItem) return;

        const existing = this.selectedExtras.find(e => e.id === extraId);
        if (existing) {
            existing.qty += delta;
            if (existing.qty <= 0) {
                this.selectedExtras = this.selectedExtras.filter(e => e.id !== extraId);
            }
        } else if (delta > 0) {
            this.selectedExtras.push({
                id: extraItem.id,
                name: extraItem.name,
                price: extraItem.price,
                emoji: extraItem.emoji,
                qty: 1
            });
        }
        this.renderExtras();
    },

    getExtrasTotal() {
        return this.selectedExtras.reduce((sum, e) => sum + e.price * e.qty, 0);
    },

    // ============================================
    // STEP 4: SUMMARY
    // ============================================
    goToSummary() {
        this.currentStep = 4;
        this.renderSummary();
        this.scrollToTop();
    },

    renderSummary() {
        this.updateStepBar();
        const basePrice = this.selectedSize.price;
        const extrasTotal = this.getExtrasTotal();
        const unitTotal = basePrice + extrasTotal;
        const total = unitTotal * this.quantity;

        this.els.main.innerHTML = `
            <div class="cp-summary">
                <div class="cp-summary-icon">${this.selectedFlavor.emoji}</div>
                <h2 class="cp-summary-title">Resumo do Pedido</h2>

                <div class="cp-summary-card">
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Tipo</span>
                        <span class="cp-summary-value">${this.selectedType.emoji} ${this.selectedType.name}</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Sabor</span>
                        <span class="cp-summary-value">${this.selectedFlavor.emoji} ${this.selectedFlavor.name}</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Tamanho</span>
                        <span class="cp-summary-value">${this.selectedSize.name} (${this.selectedSize.ml}ml)</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Preço base</span>
                        <span class="cp-summary-value">${this.formatPrice(basePrice)}</span>
                    </div>
                    ${this.selectedExtras.length > 0 ? `
                        <div class="cp-summary-extras-title">Extras:</div>
                        ${this.selectedExtras.map(e => `
                            <div class="cp-summary-row cp-summary-extra-row">
                                <span class="cp-summary-label">${e.emoji} ${e.name} x${e.qty}</span>
                                <span class="cp-summary-value">+${this.formatPrice(e.price * e.qty)}</span>
                            </div>
                        `).join('')}
                    ` : '<div class="cp-summary-no-extras">Sem extras adicionados</div>'}

                    <div class="cp-summary-divider"></div>

                    <div class="cp-summary-qty">
                        <span>Quantidade:</span>
                        <div class="cp-qty-controls">
                            <button class="cp-qty-btn" onclick="CardapioApp.changeQty(-1)">−</button>
                            <span class="cp-qty-value" id="summaryQty">${this.quantity}</span>
                            <button class="cp-qty-btn" onclick="CardapioApp.changeQty(1)">+</button>
                        </div>
                    </div>

                    <div class="cp-summary-total">
                        <span>Total:</span>
                        <span class="cp-summary-total-value" id="summaryTotalValue">${this.formatPrice(total)}</span>
                    </div>
                </div>

                <div class="cp-summary-actions">
                    <button class="cp-btn-primary cp-btn-lg cp-btn-full" onclick="CardapioApp.addToMenuCart()">
                        🛒 Adicionar ao Carrinho
                    </button>
                    <button class="cp-btn-secondary" onclick="CardapioApp.renderHome()">
                        ← Voltar ao Cardápio
                    </button>
                </div>
            </div>
        `;
    },

    changeQty(delta) {
        this.quantity = Math.max(1, this.quantity + delta);
        const basePrice = this.selectedSize.price;
        const extrasTotal = this.getExtrasTotal();
        const total = (basePrice + extrasTotal) * this.quantity;
        const qtyEl = document.getElementById('summaryQty');
        const totalEl = document.getElementById('summaryTotalValue');
        if (qtyEl) qtyEl.textContent = this.quantity;
        if (totalEl) totalEl.textContent = this.formatPrice(total);
    },

    // ============================================
    // CART
    // ============================================
    addToMenuCart() {
        const item = {
            uid: Date.now() + Math.random(),
            type: { id: this.selectedType.id, name: this.selectedType.name, emoji: this.selectedType.emoji },
            flavor: { id: this.selectedFlavor.id, name: this.selectedFlavor.name, emoji: this.selectedFlavor.emoji },
            size: { id: this.selectedSize.id, name: this.selectedSize.name, ml: this.selectedSize.ml, price: this.selectedSize.price },
            extras: [...this.selectedExtras],
            quantity: this.quantity,
            unitPrice: this.selectedSize.price + this.getExtrasTotal(),
            totalPrice: (this.selectedSize.price + this.getExtrasTotal()) * this.quantity
        };

        this.cart.push(item);
        this.saveCart();
        this.updateCartCount();
        this.showToast(`${item.flavor.emoji} ${item.flavor.name} adicionado ao carrinho!`);

        // Reset and go home
        this.renderHome();
        this.openCart();
    },

    removeFromMenuCart(uid) {
        this.cart = this.cart.filter(i => i.uid !== uid);
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    },

    updateMenuCartQty(uid, delta) {
        const item = this.cart.find(i => i.uid === uid);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeFromMenuCart(uid);
            return;
        }
        item.totalPrice = item.unitPrice * item.quantity;
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    },

    getMenuCartTotal() {
        return this.cart.reduce((sum, i) => sum + i.totalPrice, 0);
    },

    getMenuCartCount() {
        return this.cart.reduce((sum, i) => sum + i.quantity, 0);
    },

    saveCart() {
        localStorage.setItem('milkypot_cart', JSON.stringify(this.cart));
    },

    updateCartCount() {
        const count = this.getMenuCartCount();
        if (this.els.cartCount) this.els.cartCount.textContent = count;
    },

    openCart() {
        this.renderCartItems();
        this.els.cartSidebar?.classList.add('active');
        this.els.cartOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeCart() {
        this.els.cartSidebar?.classList.remove('active');
        this.els.cartOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    },

    renderCartItems() {
        if (!this.els.cartItems) return;

        if (this.cart.length === 0) {
            this.els.cartItems.innerHTML = `
                <div class="cp-cart-empty">
                    <span>🐑</span>
                    <p>Seu carrinho está vazio</p>
                    <small>Escolha produtos deliciosos do cardápio!</small>
                </div>
            `;
            if (this.els.cartFooter) this.els.cartFooter.style.display = 'none';
            return;
        }

        this.els.cartItems.innerHTML = this.cart.map(item => `
            <div class="cp-cart-item">
                <div class="cp-cart-item-header">
                    <span class="cp-cart-item-emoji">${item.flavor.emoji}</span>
                    <div class="cp-cart-item-info">
                        <strong>${item.flavor.name}</strong>
                        <small>${item.type.name} · ${item.size.name} (${item.size.ml}ml)</small>
                    </div>
                    <button class="cp-cart-item-remove" onclick="CardapioApp.removeFromMenuCart(${item.uid})" aria-label="Remover">✕</button>
                </div>
                ${item.extras.length > 0 ? `
                    <div class="cp-cart-item-extras">
                        ${item.extras.map(e => `<span>${e.emoji} ${e.name}${e.qty > 1 ? ` x${e.qty}` : ''}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="cp-cart-item-footer">
                    <div class="cp-cart-item-qty">
                        <button class="cp-qty-btn-sm" onclick="CardapioApp.updateMenuCartQty(${item.uid}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button class="cp-qty-btn-sm" onclick="CardapioApp.updateMenuCartQty(${item.uid}, 1)">+</button>
                    </div>
                    <span class="cp-cart-item-price">${this.formatPrice(item.totalPrice)}</span>
                </div>
            </div>
        `).join('');

        if (this.els.cartFooter) this.els.cartFooter.style.display = 'block';
        if (this.els.cartTotal) this.els.cartTotal.textContent = this.formatPrice(this.getMenuCartTotal());
    },

    // ============================================
    // CHECKOUT (redirect to main site checkout or WhatsApp)
    // ============================================
    startCheckout() {
        if (this.cart.length === 0) {
            this.showToast('Adicione itens ao carrinho primeiro!');
            return;
        }
        this.closeCart();
        // Show checkout modal
        const modal = document.getElementById('menuCheckoutModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderCheckoutSummary();
        }
    },

    closeCheckoutModal() {
        const modal = document.getElementById('menuCheckoutModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    renderCheckoutSummary() {
        const el = document.getElementById('checkoutOrderSummary');
        if (!el) return;
        el.innerHTML = this.cart.map(item => `
            <div class="cp-checkout-item">
                <span>${item.flavor.emoji} ${item.flavor.name} (${item.size.name}) x${item.quantity}</span>
                <span>${this.formatPrice(item.totalPrice)}</span>
            </div>
        `).join('') + `
            <div class="cp-checkout-total">
                <strong>Total:</strong>
                <strong>${this.formatPrice(this.getMenuCartTotal())}</strong>
            </div>
        `;
    },

    finishOrder() {
        const name = document.getElementById('ckoName')?.value?.trim();
        const phone = document.getElementById('ckoPhone')?.value?.trim();
        if (!name || !phone) {
            this.showToast('Preencha nome e telefone!');
            return;
        }

        const deliveryType = document.querySelector('input[name="ckoDelivery"]:checked')?.value || 'pickup';
        if (deliveryType === 'delivery') {
            const addr = document.getElementById('ckoAddress')?.value?.trim();
            if (!addr) {
                this.showToast('Preencha o endereço de entrega!');
                return;
            }
        }

        // Build WhatsApp message
        let msg = `🐑 *Novo Pedido MilkyPot*\n\n`;
        msg += `👤 *Nome:* ${name}\n📱 *Tel:* ${phone}\n`;
        msg += deliveryType === 'delivery'
            ? `🛵 *Entrega:* ${document.getElementById('ckoAddress')?.value}\n`
            : `🏪 *Retirada na loja*\n`;
        msg += `\n📋 *Itens:*\n`;
        this.cart.forEach(item => {
            msg += `• ${item.flavor.emoji} ${item.flavor.name} (${item.type.name}) - ${item.size.name}\n`;
            if (item.extras.length) {
                msg += `  Extras: ${item.extras.map(e => e.name + (e.qty > 1 ? ` x${e.qty}` : '')).join(', ')}\n`;
            }
            msg += `  Qtd: ${item.quantity} — ${this.formatPrice(item.totalPrice)}\n`;
        });
        msg += `\n💰 *Total: ${this.formatPrice(this.getMenuCartTotal())}*`;

        // Show success
        this.closeCheckoutModal();
        this.showSuccessModal();

        // Open WhatsApp
        const waNumber = '5511999999999';
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

        // Clear cart
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    },

    showSuccessModal() {
        const modal = document.getElementById('menuSuccessModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Confetti
            this.createConfetti();
        }
    },

    closeSuccessModal() {
        const modal = document.getElementById('menuSuccessModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // ============================================
    // UTILITIES
    // ============================================
    formatPrice(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    },

    showToast(message) {
        const existing = document.querySelector('.cp-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'cp-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    createConfetti() {
        const colors = ['#FFB6D9', '#D4A5FF', '#A5D4FF', '#A5FFD4', '#FFE5A5', '#FFB38A', '#FF6B9D'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'cp-confetti';
            piece.style.cssText = `
                left:${Math.random()*100}%;
                background:${colors[Math.floor(Math.random()*colors.length)]};
                animation-delay:${Math.random()}s;
                animation-duration:${Math.random()*2+2}s;
                width:${Math.random()*8+5}px;
                height:${Math.random()*8+5}px;
                border-radius:${Math.random()>0.5?'50%':'2px'};
            `;
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    CardapioApp.init();

    // Delivery toggle in checkout
    document.querySelectorAll('input[name="ckoDelivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const addrDiv = document.getElementById('ckoDeliveryAddress');
            if (addrDiv) addrDiv.style.display = radio.value === 'delivery' ? 'block' : 'none';
        });
    });
});
