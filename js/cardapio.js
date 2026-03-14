/* ============================================
   MilkyPot - Cardápio Online / Ordering Flow
   FLUXO: BASE → FORMATO → TAMANHO → SABOR → ADICIONAIS → BEBIDAS → RESUMO
   ============================================ */

const CardapioApp = {
    // Steps: 0=home, 1=base, 2=formato, 3=tamanho, 4=sabor, 5=adicionais, 6=bebidas, 7=resumo
    currentStep: 0,
    selectedBase: null,
    selectedFormato: null,
    selectedTamanho: null,
    selectedSabor: null,
    selectedAdicionais: [],   // [{id, name, price, emoji, qty}]
    selectedBebidas: [],      // [{id, name, price, emoji, qty}]
    nomeCliente: '',
    quantity: 1,
    cart: [],

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

        const saved = localStorage.getItem('milkypot_cart');
        if (saved) {
            try { this.cart = JSON.parse(saved); } catch(e) { this.cart = []; }
        }

        this.renderHome();
        this.updateCartCount();
        this.bindEvents();
    },

    bindEvents() {
        this.els.backBtn?.addEventListener('click', () => this.goBack());
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
        const renders = [
            () => this.renderHome(),
            () => this.renderBases(),
            () => this.renderFormatos(),
            () => this.renderTamanhos(),
            () => this.renderSabores(),
            () => this.renderAdicionais(),
            () => this.renderBebidas(),
            () => this.renderResumo()
        ];
        if (renders[this.currentStep]) renders[this.currentStep]();
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
    // STEP 0: HOME
    // ============================================
    renderHome() {
        this.currentStep = 0;
        this.resetSelections();
        this.updateStepBar();

        const bases = CARDAPIO_CONFIG.bases.filter(b => b.available);
        const highlights = CARDAPIO_CONFIG.highlights;

        this.els.main.innerHTML = `
            <div class="cp-hero-phrase">
                <div class="cp-mascot">🐑</div>
                <h2>Monte seu Milkypot!</h2>
                <p class="cp-hero-sub">Escolha sua base, formato, sabor e monte do seu jeito.</p>
            </div>

            <!-- Destaques -->
            <div class="cp-highlights">
                <h3 class="cp-section-title">🌟 Top 5 — Mais Pedidos</h3>
                <div class="cp-highlights-grid">
                    ${highlights.map(h => {
                        const sabor = this.findSabor(h.saborId);
                        if (!sabor) return '';
                        return `
                            <button class="cp-highlight-card" onclick="CardapioApp.quickStart('${h.baseId}','${h.saborId}')">
                                <div class="cp-highlight-badge">${h.label}</div>
                                <div class="cp-highlight-emoji">${sabor.emoji}</div>
                                <div class="cp-highlight-name">${sabor.name}</div>
                                <div class="cp-highlight-desc">${sabor.desc}</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Começar Pedido -->
            <div class="cp-start-section">
                <h3 class="cp-section-title">🍦 Comece seu Pedido</h3>
                <p class="cp-start-desc">Siga o passo a passo e monte seu potinho perfeito!</p>
                <div class="cp-types-grid">
                    ${bases.map(base => `
                        <button class="cp-type-card" onclick="CardapioApp.selectBase('${base.id}')"
                                style="--type-color:${base.color};--type-gradient:${base.gradient}">
                            <div class="cp-type-emoji">${base.emoji}</div>
                            <div class="cp-type-name">${base.name}</div>
                            <div class="cp-type-desc">${base.desc}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Como Funciona -->
            <div class="cp-how-it-works">
                <h3 class="cp-section-title">📋 Como Funciona</h3>
                <div class="cp-steps-mini">
                    <div class="cp-step-mini"><span class="cp-step-mini-num">1</span><span>Base</span></div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini"><span class="cp-step-mini-num">2</span><span>Formato</span></div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini"><span class="cp-step-mini-num">3</span><span>Tamanho</span></div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini"><span class="cp-step-mini-num">4</span><span>Sabor</span></div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini"><span class="cp-step-mini-num">5</span><span>Adicionais</span></div>
                    <div class="cp-step-mini-arrow">→</div>
                    <div class="cp-step-mini"><span class="cp-step-mini-num">6</span><span>Confirmar</span></div>
                </div>
            </div>
        `;
    },

    resetSelections() {
        this.selectedBase = null;
        this.selectedFormato = null;
        this.selectedTamanho = null;
        this.selectedSabor = null;
        this.selectedAdicionais = [];
        this.selectedBebidas = [];
        this.nomeCliente = '';
        this.quantity = 1;
    },

    findSabor(saborId) {
        for (const cat of Object.values(CARDAPIO_CONFIG.sabores)) {
            const found = cat.items.find(s => s.id === saborId);
            if (found) return found;
        }
        return null;
    },

    quickStart(baseId, saborId) {
        this.selectedBase = CARDAPIO_CONFIG.bases.find(b => b.id === baseId);
        this.selectedSabor = this.findSabor(saborId);
        if (!this.selectedBase || !this.selectedSabor) return;
        // Skip to formato selection
        this.currentStep = 2;
        this.renderFormatos();
        this.scrollToTop();
    },

    // ============================================
    // STEP 1: ESCOLHER BASE
    // ============================================
    selectBase(baseId) {
        this.selectedBase = CARDAPIO_CONFIG.bases.find(b => b.id === baseId);
        if (!this.selectedBase) return;
        this.currentStep = 1;
        this.renderFormatos();
        this.scrollToTop();
    },

    renderBases() {
        this.updateStepBar();
        const bases = CARDAPIO_CONFIG.bases.filter(b => b.available);
        this.els.main.innerHTML = `
            <div class="cp-flow-header">
                <span class="cp-flow-emoji">🐑</span>
                <h2>Escolha sua Base</h2>
                <p>Qual é a base do seu Milkypot?</p>
            </div>
            <div class="cp-types-grid">
                ${bases.map(base => `
                    <button class="cp-type-card" onclick="CardapioApp.selectBase('${base.id}')"
                            style="--type-color:${base.color};--type-gradient:${base.gradient}">
                        <div class="cp-type-emoji">${base.emoji}</div>
                        <div class="cp-type-name">${base.name}</div>
                        <div class="cp-type-desc">${base.desc}</div>
                    </button>
                `).join('')}
            </div>
        `;
    },

    // ============================================
    // STEP 2: ESCOLHER FORMATO
    // ============================================
    renderFormatos() {
        this.currentStep = 2;
        this.updateStepBar();
        const formatos = CARDAPIO_CONFIG.formatos.filter(f =>
            f.available && f.compatibleBases.includes(this.selectedBase.id)
        );

        this.els.main.innerHTML = `
            <div class="cp-flow-header" style="--type-gradient:${this.selectedBase.gradient}">
                <span class="cp-flow-emoji">${this.selectedBase.emoji}</span>
                <h2>${this.selectedBase.name}</h2>
                <p>Escolha o formato do seu potinho</p>
            </div>
            <h3 class="cp-section-title cp-mt">Formato</h3>
            <div class="cp-types-grid">
                ${formatos.map(fmt => `
                    <button class="cp-type-card cp-formato-card" onclick="CardapioApp.selectFormato('${fmt.id}')">
                        <div class="cp-type-emoji">${fmt.emoji}</div>
                        <div class="cp-type-name">${fmt.name}</div>
                        <div class="cp-type-desc">${fmt.desc}</div>
                    </button>
                `).join('')}
            </div>
        `;
    },

    selectFormato(formatoId) {
        this.selectedFormato = CARDAPIO_CONFIG.formatos.find(f => f.id === formatoId);
        if (!this.selectedFormato) return;
        this.currentStep = 3;
        this.renderTamanhos();
        this.scrollToTop();
    },

    // ============================================
    // STEP 3: ESCOLHER TAMANHO
    // ============================================
    renderTamanhos() {
        this.updateStepBar();
        const tamanhos = CARDAPIO_CONFIG.tamanhos.filter(t => t.available);

        this.els.main.innerHTML = `
            <div class="cp-flow-header" style="--type-gradient:${this.selectedBase.gradient}">
                <div class="cp-flow-summary-line">
                    <span>${this.selectedBase.emoji} ${this.selectedBase.name}</span>
                    <span>·</span>
                    <span>${this.selectedFormato.emoji} ${this.selectedFormato.name}</span>
                </div>
            </div>
            <h3 class="cp-section-title cp-mt">Escolha o Tamanho</h3>
            <div class="cp-sizes-grid">
                ${tamanhos.map((tam, i) => `
                    <button class="cp-size-card ${i === 2 ? 'cp-recommended' : ''}"
                            onclick="CardapioApp.selectTamanho('${tam.id}')">
                        ${i === 2 ? '<span class="cp-size-recommended-badge">Mais Pedido</span>' : ''}
                        <div class="cp-size-visual">
                            <div class="cp-size-cup" style="height:${28 + i * 16}px;width:${26 + i * 8}px"></div>
                        </div>
                        <div class="cp-size-name">${tam.name}</div>
                        <div class="cp-size-ml">${tam.ml}ml</div>
                        <div class="cp-size-price">${this.formatPrice(tam.price)}</div>
                    </button>
                `).join('')}
            </div>
        `;
    },

    selectTamanho(tamanhoId) {
        this.selectedTamanho = CARDAPIO_CONFIG.tamanhos.find(t => t.id === tamanhoId);
        if (!this.selectedTamanho) return;
        // If sabor already selected (quickStart), skip to adicionais
        if (this.selectedSabor) {
            this.currentStep = 5;
            this.renderAdicionais();
        } else {
            this.currentStep = 4;
            this.renderSabores();
        }
        this.scrollToTop();
    },

    // ============================================
    // STEP 4: ESCOLHER SABOR
    // ============================================
    renderSabores() {
        this.updateStepBar();
        const baseId = this.selectedBase.id;

        // Filter sabor categories compatible with the base
        const categorias = Object.entries(CARDAPIO_CONFIG.sabores)
            .filter(([, cat]) => cat.compatibleBases.includes(baseId))
            .map(([catId, cat]) => ({ catId, ...cat }));

        this.els.main.innerHTML = `
            <div class="cp-flow-header cp-flow-header-sm" style="--type-gradient:${this.selectedBase.gradient}">
                <div class="cp-flow-summary-line">
                    <span>${this.selectedBase.emoji} ${this.selectedBase.name}</span>
                    <span>·</span>
                    <span>${this.selectedFormato.emoji} ${this.selectedFormato.name}</span>
                    <span>·</span>
                    <span>${this.selectedTamanho.name} (${this.selectedTamanho.ml}ml)</span>
                    <span>·</span>
                    <span class="cp-flow-price">${this.formatPrice(this.selectedTamanho.price)}</span>
                </div>
            </div>
            <h3 class="cp-section-title cp-mt">Escolha o Sabor</h3>
            ${categorias.map(cat => `
                <div class="cp-sabor-category">
                    <h4 class="cp-sabor-cat-title">${cat.emoji} ${cat.name}</h4>
                    <div class="cp-flavors-grid">
                        ${cat.items.filter(s => s.available).map(sabor => `
                            <button class="cp-flavor-card" onclick="CardapioApp.selectSabor('${sabor.id}')">
                                <div class="cp-flavor-emoji">${sabor.emoji}</div>
                                ${sabor.highlight ? '<span class="cp-badge">Top 5</span>' : ''}
                                <h4 class="cp-flavor-name">${sabor.name}</h4>
                                <p class="cp-flavor-desc">${sabor.desc}</p>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    },

    selectSabor(saborId) {
        this.selectedSabor = this.findSabor(saborId);
        if (!this.selectedSabor) return;
        this.selectedAdicionais = [];
        this.currentStep = 5;
        this.renderAdicionais();
        this.scrollToTop();
    },

    // ============================================
    // STEP 5: ADICIONAIS
    // ============================================
    renderAdicionais() {
        this.updateStepBar();
        const adicionais = CARDAPIO_CONFIG.adicionais;

        this.els.main.innerHTML = `
            <div class="cp-flow-header cp-flow-header-sm" style="--type-gradient:${this.selectedBase.gradient}">
                <div class="cp-flow-summary-line">
                    <span>${this.selectedSabor.emoji} ${this.selectedSabor.name}</span>
                    <span>·</span>
                    <span>${this.selectedFormato.name}</span>
                    <span>·</span>
                    <span>${this.selectedTamanho.name}</span>
                    <span>·</span>
                    <span class="cp-flow-price">${this.formatPrice(this.selectedTamanho.price)}</span>
                </div>
            </div>
            <h3 class="cp-section-title cp-mt">Adicionais <small>(opcional)</small></h3>
            <div class="cp-extras-list">
                ${Object.entries(adicionais).map(([catId, cat]) => `
                    <div class="cp-extras-category">
                        <h4 class="cp-extras-cat-name">${cat.emoji} ${cat.name}</h4>
                        <div class="cp-extras-items">
                            ${cat.items.filter(i => i.available).map(item => {
                                const inCart = this.selectedAdicionais.find(e => e.id === item.id);
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
                                                <button class="cp-extra-btn" onclick="CardapioApp.changeAdicional('${item.id}', -1)">−</button>
                                                <span class="cp-extra-qty">${qty}</span>
                                            ` : ''}
                                            <button class="cp-extra-btn cp-extra-add" onclick="CardapioApp.changeAdicional('${item.id}', 1)">+</button>
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
                    <span>Total adicionais:</span>
                    <span id="extrasTotal">${this.formatPrice(this.getAdicionaisTotal())}</span>
                </div>
                <button class="cp-btn-primary cp-btn-lg" onclick="CardapioApp.goToBebidas()">
                    Continuar →
                </button>
            </div>
        `;
    },

    changeAdicional(itemId, delta) {
        let item = null;
        for (const cat of Object.values(CARDAPIO_CONFIG.adicionais)) {
            item = cat.items.find(i => i.id === itemId);
            if (item) break;
        }
        if (!item) return;

        const existing = this.selectedAdicionais.find(e => e.id === itemId);
        if (existing) {
            existing.qty += delta;
            if (existing.qty <= 0) {
                this.selectedAdicionais = this.selectedAdicionais.filter(e => e.id !== itemId);
            }
        } else if (delta > 0) {
            this.selectedAdicionais.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
        }
        this.renderAdicionais();
    },

    getAdicionaisTotal() {
        return this.selectedAdicionais.reduce((sum, e) => sum + e.price * e.qty, 0);
    },

    // ============================================
    // STEP 6: BEBIDAS
    // ============================================
    goToBebidas() {
        this.currentStep = 6;
        this.renderBebidas();
        this.scrollToTop();
    },

    renderBebidas() {
        this.updateStepBar();
        const bebidas = CARDAPIO_CONFIG.bebidas.filter(b => b.available);

        this.els.main.innerHTML = `
            <div class="cp-flow-header cp-flow-header-sm" style="--type-gradient:${this.selectedBase.gradient}">
                <div class="cp-flow-summary-line">
                    <span>${this.selectedSabor.emoji} ${this.selectedSabor.name}</span>
                    <span>·</span>
                    <span>${this.selectedFormato.name}</span>
                    <span>·</span>
                    <span>${this.selectedTamanho.name}</span>
                </div>
            </div>
            <h3 class="cp-section-title cp-mt">Bebidas <small>(opcional)</small></h3>
            <div class="cp-extras-list">
                <div class="cp-extras-items">
                    ${bebidas.map(beb => {
                        const inCart = this.selectedBebidas.find(e => e.id === beb.id);
                        const qty = inCart ? inCart.qty : 0;
                        return `
                            <div class="cp-extra-item ${qty > 0 ? 'active' : ''}">
                                <span class="cp-extra-emoji">${beb.emoji}</span>
                                <div class="cp-extra-info">
                                    <span class="cp-extra-name">${beb.name}</span>
                                    <span class="cp-extra-price">${this.formatPrice(beb.price)}</span>
                                </div>
                                <div class="cp-extra-controls">
                                    ${qty > 0 ? `
                                        <button class="cp-extra-btn" onclick="CardapioApp.changeBebida('${beb.id}', -1)">−</button>
                                        <span class="cp-extra-qty">${qty}</span>
                                    ` : ''}
                                    <button class="cp-extra-btn cp-extra-add" onclick="CardapioApp.changeBebida('${beb.id}', 1)">+</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="cp-extras-footer">
                <div class="cp-extras-total">
                    <span>Bebidas:</span>
                    <span>${this.formatPrice(this.getBebidasTotal())}</span>
                </div>
                <button class="cp-btn-primary cp-btn-lg" onclick="CardapioApp.goToResumo()">
                    Ver Resumo →
                </button>
            </div>
        `;
    },

    changeBebida(bebId, delta) {
        const beb = CARDAPIO_CONFIG.bebidas.find(b => b.id === bebId);
        if (!beb) return;

        const existing = this.selectedBebidas.find(e => e.id === bebId);
        if (existing) {
            existing.qty += delta;
            if (existing.qty <= 0) {
                this.selectedBebidas = this.selectedBebidas.filter(e => e.id !== bebId);
            }
        } else if (delta > 0) {
            this.selectedBebidas.push({ id: beb.id, name: beb.name, price: beb.price, emoji: beb.emoji, qty: 1 });
        }
        this.renderBebidas();
    },

    getBebidasTotal() {
        return this.selectedBebidas.reduce((sum, b) => sum + b.price * b.qty, 0);
    },

    // ============================================
    // STEP 7: RESUMO
    // ============================================
    goToResumo() {
        this.currentStep = 7;
        this.renderResumo();
        this.scrollToTop();
    },

    renderResumo() {
        this.updateStepBar();
        const basePrice = this.selectedTamanho.price;
        const adicionaisTotal = this.getAdicionaisTotal();
        const bebidasTotal = this.getBebidasTotal();
        const unitTotal = basePrice + adicionaisTotal;
        const total = (unitTotal * this.quantity) + bebidasTotal;

        this.els.main.innerHTML = `
            <div class="cp-summary">
                <div class="cp-summary-icon">${this.selectedSabor.emoji}</div>
                <h2 class="cp-summary-title">Resumo do Pedido</h2>

                <!-- Nome do Cliente -->
                <div class="cp-nome-cliente">
                    <label class="cp-nome-label">🏷️ Nome para o potinho *</label>
                    <input type="text" class="cp-nome-input" id="nomePotinho"
                           placeholder="Ex: João" value="${this.nomeCliente}"
                           oninput="CardapioApp.nomeCliente = this.value"
                           maxlength="30">
                    <small class="cp-nome-hint">Aparece no seu pedido e na etiqueta!</small>
                </div>

                <div class="cp-summary-card">
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Base</span>
                        <span class="cp-summary-value">${this.selectedBase.emoji} ${this.selectedBase.name}</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Formato</span>
                        <span class="cp-summary-value">${this.selectedFormato.emoji} ${this.selectedFormato.name}</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Tamanho</span>
                        <span class="cp-summary-value">${this.selectedTamanho.name} (${this.selectedTamanho.ml}ml)</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Sabor</span>
                        <span class="cp-summary-value">${this.selectedSabor.emoji} ${this.selectedSabor.name}</span>
                    </div>
                    <div class="cp-summary-row">
                        <span class="cp-summary-label">Preço base</span>
                        <span class="cp-summary-value">${this.formatPrice(basePrice)}</span>
                    </div>

                    ${this.selectedAdicionais.length > 0 ? `
                        <div class="cp-summary-extras-title">Adicionais:</div>
                        ${this.selectedAdicionais.map(e => `
                            <div class="cp-summary-row cp-summary-extra-row">
                                <span class="cp-summary-label">${e.emoji} ${e.name} x${e.qty}</span>
                                <span class="cp-summary-value">+${this.formatPrice(e.price * e.qty)}</span>
                            </div>
                        `).join('')}
                    ` : '<div class="cp-summary-no-extras">Sem adicionais</div>'}

                    ${this.selectedBebidas.length > 0 ? `
                        <div class="cp-summary-extras-title">Bebidas:</div>
                        ${this.selectedBebidas.map(b => `
                            <div class="cp-summary-row cp-summary-extra-row">
                                <span class="cp-summary-label">${b.emoji} ${b.name} x${b.qty}</span>
                                <span class="cp-summary-value">${this.formatPrice(b.price * b.qty)}</span>
                            </div>
                        `).join('')}
                    ` : ''}

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
        const basePrice = this.selectedTamanho.price;
        const adicionaisTotal = this.getAdicionaisTotal();
        const bebidasTotal = this.getBebidasTotal();
        const total = ((basePrice + adicionaisTotal) * this.quantity) + bebidasTotal;
        const qtyEl = document.getElementById('summaryQty');
        const totalEl = document.getElementById('summaryTotalValue');
        if (qtyEl) qtyEl.textContent = this.quantity;
        if (totalEl) totalEl.textContent = this.formatPrice(total);
    },

    // ============================================
    // CART
    // ============================================
    addToMenuCart() {
        const nome = document.getElementById('nomePotinho')?.value?.trim();
        if (!nome) {
            this.showToast('Preencha o nome para o potinho!');
            document.getElementById('nomePotinho')?.focus();
            return;
        }
        this.nomeCliente = nome;

        const item = {
            uid: Date.now() + Math.random(),
            nomeCliente: this.nomeCliente,
            base: { id: this.selectedBase.id, name: this.selectedBase.name, emoji: this.selectedBase.emoji },
            formato: { id: this.selectedFormato.id, name: this.selectedFormato.name, emoji: this.selectedFormato.emoji },
            tamanho: { id: this.selectedTamanho.id, name: this.selectedTamanho.name, ml: this.selectedTamanho.ml, price: this.selectedTamanho.price },
            sabor: { id: this.selectedSabor.id, name: this.selectedSabor.name, emoji: this.selectedSabor.emoji },
            adicionais: [...this.selectedAdicionais],
            bebidas: [...this.selectedBebidas],
            quantity: this.quantity,
            unitPrice: this.selectedTamanho.price + this.getAdicionaisTotal(),
            bebidasTotal: this.getBebidasTotal(),
            totalPrice: ((this.selectedTamanho.price + this.getAdicionaisTotal()) * this.quantity) + this.getBebidasTotal()
        };

        this.cart.push(item);
        this.saveCart();
        this.updateCartCount();
        this.showToast(`${item.sabor.emoji} ${item.sabor.name} adicionado! (${item.nomeCliente})`);
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
        if (item.quantity <= 0) { this.removeFromMenuCart(uid); return; }
        item.totalPrice = (item.unitPrice * item.quantity) + item.bebidasTotal;
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    },

    getMenuCartTotal() { return this.cart.reduce((sum, i) => sum + i.totalPrice, 0); },
    getMenuCartCount() { return this.cart.reduce((sum, i) => sum + i.quantity, 0); },
    saveCart() { localStorage.setItem('milkypot_cart', JSON.stringify(this.cart)); },
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
                    <small>Monte seu Milkypot e adicione aqui!</small>
                </div>
            `;
            if (this.els.cartFooter) this.els.cartFooter.style.display = 'none';
            return;
        }

        this.els.cartItems.innerHTML = this.cart.map(item => `
            <div class="cp-cart-item">
                <div class="cp-cart-item-header">
                    <span class="cp-cart-item-emoji">${item.sabor.emoji}</span>
                    <div class="cp-cart-item-info">
                        <strong>${item.sabor.name}</strong>
                        <small>${item.formato.name} · ${item.tamanho.name} (${item.tamanho.ml}ml)</small>
                        <small class="cp-cart-nome">🏷️ ${item.nomeCliente}</small>
                    </div>
                    <button class="cp-cart-item-remove" onclick="CardapioApp.removeFromMenuCart(${item.uid})" aria-label="Remover">✕</button>
                </div>
                ${item.adicionais.length > 0 ? `
                    <div class="cp-cart-item-extras">
                        ${item.adicionais.map(e => `<span>${e.emoji} ${e.name}${e.qty > 1 ? ' x' + e.qty : ''}</span>`).join('')}
                    </div>
                ` : ''}
                ${item.bebidas.length > 0 ? `
                    <div class="cp-cart-item-extras">
                        ${item.bebidas.map(b => `<span>${b.emoji} ${b.name}${b.qty > 1 ? ' x' + b.qty : ''}</span>`).join('')}
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
    // CHECKOUT
    // ============================================
    startCheckout() {
        if (this.cart.length === 0) { this.showToast('Adicione itens ao carrinho!'); return; }
        this.closeCart();
        const modal = document.getElementById('menuCheckoutModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderCheckoutSummary();
        }
    },

    closeCheckoutModal() {
        const modal = document.getElementById('menuCheckoutModal');
        if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    },

    renderCheckoutSummary() {
        const el = document.getElementById('checkoutOrderSummary');
        if (!el) return;
        el.innerHTML = this.cart.map(item => `
            <div class="cp-checkout-item">
                <div>
                    <span>${item.sabor.emoji} ${item.sabor.name}</span>
                    <small style="display:block;color:#9484A8">${item.formato.name} · ${item.tamanho.name} · 🏷️ ${item.nomeCliente}</small>
                </div>
                <span>x${item.quantity} ${this.formatPrice(item.totalPrice)}</span>
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
        if (!name || !phone) { this.showToast('Preencha nome e telefone!'); return; }

        const deliveryType = document.querySelector('input[name="ckoDelivery"]:checked')?.value || 'pickup';
        if (deliveryType === 'delivery') {
            const addr = document.getElementById('ckoAddress')?.value?.trim();
            if (!addr) { this.showToast('Preencha o endereco!'); return; }
        }

        let msg = `🐑 *Novo Pedido MilkyPot*\n\n`;
        msg += `👤 *Responsável:* ${name}\n📱 *Tel:* ${phone}\n`;
        msg += deliveryType === 'delivery'
            ? `🛵 *Entrega:* ${document.getElementById('ckoAddress')?.value}\n`
            : `🏪 *Retirada na loja*\n`;
        msg += `\n📋 *Itens:*\n`;
        this.cart.forEach((item, i) => {
            msg += `\n*Potinho #${i + 1} — 🏷️ ${item.nomeCliente}*\n`;
            msg += `${item.sabor.emoji} ${item.sabor.name}\n`;
            msg += `Base: ${item.base.name}\n`;
            msg += `Formato: ${item.formato.name}\n`;
            msg += `Tamanho: ${item.tamanho.name} (${item.tamanho.ml}ml)\n`;
            if (item.adicionais.length) {
                msg += `Adicionais: ${item.adicionais.map(e => e.name + (e.qty > 1 ? ' x' + e.qty : '')).join(', ')}\n`;
            }
            if (item.bebidas.length) {
                msg += `Bebidas: ${item.bebidas.map(b => b.name + (b.qty > 1 ? ' x' + b.qty : '')).join(', ')}\n`;
            }
            msg += `Qtd: ${item.quantity} — ${this.formatPrice(item.totalPrice)}\n`;
        });
        msg += `\n💰 *Total: ${this.formatPrice(this.getMenuCartTotal())}*`;

        this.closeCheckoutModal();
        this.showSuccessModal();

        const waNumber = '5511999999999';
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    },

    showSuccessModal() {
        const modal = document.getElementById('menuSuccessModal');
        if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; this.createConfetti(); }
    },

    closeSuccessModal() {
        const modal = document.getElementById('menuSuccessModal');
        if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    },

    // ============================================
    // UTILITIES
    // ============================================
    formatPrice(value) { return `R$ ${value.toFixed(2).replace('.', ',')}`; },

    showToast(message) {
        const existing = document.querySelector('.cp-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'cp-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
    },

    createConfetti() {
        const colors = ['#FFB6D9', '#D4A5FF', '#A5D4FF', '#A5FFD4', '#FFE5A5', '#FFB38A', '#FF6B9D'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'cp-confetti';
            piece.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()}s;animation-duration:${Math.random()*2+2}s;width:${Math.random()*8+5}px;height:${Math.random()*8+5}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CardapioApp.init();
    document.querySelectorAll('input[name="ckoDelivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const addrDiv = document.getElementById('ckoDeliveryAddress');
            if (addrDiv) addrDiv.style.display = radio.value === 'delivery' ? 'block' : 'none';
        });
    });
});
