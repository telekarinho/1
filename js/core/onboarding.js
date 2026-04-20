/**
 * MilkyPot - Onboarding Engine
 * Mostra um checklist apenas quando há itens pendentes.
 * Items sao AUTO-DETECTADOS baseados no estado real do sistema.
 * Quando todos estiverem feitos, setupStatus vira 'pronto' e o modal
 * nunca mais aparece pra essa franquia.
 */
const Onboarding = {
    _franchise: null,
    _modal: null,
    _items: null,

    DEFAULT_ITEMS: [
        { id: 'catalogo',      text: 'Catalogo / cardapio ativo',        autoDetect: 'hasCatalog',   link: '../painel/catalogo.html' },
        { id: 'inventario',    text: 'Estoque inicial configurado',      autoDetect: 'hasInventory', link: 'produtos.html' },
        { id: 'tv',            text: 'TV Indoor configurada',            autoDetect: 'hasTV',        link: 'tv-indoor.html' },
        { id: 'caixa',         text: 'Abrir caixa pela primeira vez',    autoDetect: 'caixaOpened', link: 'pdv.html' },
        { id: 'venda_teste',   text: 'Realizar 1 venda de teste no PDV', autoDetect: 'hasFirstSale', link: 'pdv.html' }
    ],

    init() {
        if (typeof Auth === 'undefined' || typeof DataStore === 'undefined') return;

        const session = Auth.getSession();
        if (!session || session.role !== 'franchisee') return;

        const franchises = (DataStore.getAllFranchises && DataStore.getAllFranchises()) || DataStore.get('franchises') || [];
        this._franchise = franchises.find(f => f.id === session.franchiseId);
        if (!this._franchise) return;

        // Se ja finalizou uma vez, nao mostra mais nunca
        if (this._franchise.setupStatus === 'pronto' || this._franchise.setupCompleto) {
            this.checkPageLock();
            return;
        }

        this._injectStyles();

        // Popula o checklist se nao existe
        this._items = DataStore.getCollection('checklist_onboarding', this._franchise.id) || [];
        if (!this._items.length) {
            this._items = this.DEFAULT_ITEMS.map(it => ({ id: it.id, text: it.text, done: false }));
            DataStore.setCollection('checklist_onboarding', this._franchise.id, this._items);
        }

        // Auto-detecta items que ja foram completados pelo uso normal do sistema
        this._autoDetect();

        // Se tudo foi detectado como feito, auto-finaliza e nao mostra modal
        if (this._items.every(i => i.done)) {
            this.finishSetup(/*silent*/true);
            return;
        }

        this.showWelcomeModal();
        this.checkPageLock();
    },

    // Auto-detecta items baseado em dados reais do sistema
    _autoDetect() {
        const fid = this._franchise.id;
        const detectors = {
            hasCatalog: () => {
                const c = DataStore.get('catalog_config');
                if (!c) return false;
                const sab = c.sabores || {};
                return Object.values(sab).some(g => (g.items || []).length > 0);
            },
            hasInventory: () => {
                const inv = DataStore.getCollection('inventory', fid) || [];
                return inv.length > 0;
            },
            hasTV: () => {
                const tvs = DataStore.get('tv_devices_' + fid) || [];
                return tvs.length > 0;
            },
            caixaOpened: () => {
                // se houver qualquer registro de caixa para essa franquia
                try {
                    const caixas = DataStore.getCollection && DataStore.getCollection('caixa_sessions', fid) || [];
                    return caixas.length > 0;
                } catch(e) { return false; }
            },
            hasFirstSale: () => {
                try {
                    const orders = DataStore.getCollection && DataStore.getCollection('orders', fid) || [];
                    return orders.filter(o => o.status === 'entregue' || o.status === 'pago').length > 0;
                } catch(e) { return false; }
            }
        };

        let anyChange = false;
        this._items.forEach(item => {
            const def = this.DEFAULT_ITEMS.find(d => d.id === item.id);
            if (!def || !def.autoDetect) return;
            const fn = detectors[def.autoDetect];
            if (!fn) return;
            try {
                if (fn()) {
                    if (!item.done) { item.done = true; anyChange = true; }
                }
            } catch(e) { /* ignore detection errors */ }
        });
        if (anyChange) {
            DataStore.setCollection('checklist_onboarding', this._franchise.id, this._items);
        }
    },

    _injectStyles() {
        if (document.getElementById('mp-onboarding-styles')) return;
        const style = document.createElement('style');
        style.id = 'mp-onboarding-styles';
        style.textContent = `
            .mp-onboarding-overlay {
                position: fixed; inset: 0;
                background: rgba(45, 27, 78, 0.85); backdrop-filter: blur(8px);
                z-index: 10001; display: flex; align-items: center; justify-content: center;
                padding: 20px;
            }
            .mp-onboarding-modal {
                background: #fff; border-radius: 24px; width: 100%; max-width: 620px;
                max-height: 90vh; overflow-y: auto; position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                animation: mp-onboard-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes mp-onboard-in { from { transform: scale(0.92) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

            .mp-onboarding-hero {
                background: linear-gradient(135deg, #42A5F5, #7E57C2);
                padding: 36px 26px; border-radius: 0 0 30px 30px; color: #fff; text-align: center;
                position: relative;
            }
            .mp-onboarding-hero h2 { font-family: 'Baloo 2', cursive; font-size: 1.7rem; margin: 0 0 8px; }
            .mp-onboarding-hero p { opacity: 0.92; font-size: .95rem; line-height: 1.4; margin: 0; }

            .mp-onboarding-close { position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 14px; }
            .mp-onboarding-close:hover { background: rgba(255,255,255,.35); }

            .mp-onboarding-content { padding: 26px; }

            .mp-progress-container { background: #E5E7EB; height: 10px; border-radius: 5px; margin: 14px 0 22px; overflow: hidden; }
            .mp-progress-bar { background: #10B981; height: 100%; transition: width 0.5s ease; }

            .mp-checklist-title { font-weight: 700; font-size: 1rem; margin-bottom: 10px; color: #2D1B4E; display: flex; align-items: center; gap: 8px; }

            .mp-check-item {
                display: flex; align-items: center; gap: 12px; padding: 12px 14px;
                border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px;
                transition: all 0.15s;
                background: #fff;
            }
            .mp-check-item.done { background: #ECFDF5; border-color: #10B981; }
            .mp-check-circle {
                width: 22px; height: 22px; border-radius: 50%; border: 2px solid #D1D5DB;
                display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
                flex-shrink: 0;
            }
            .mp-check-item.done .mp-check-circle { background: #10B981; border-color: #10B981; color: #fff; }
            .mp-check-text { font-size: 0.92rem; font-weight: 600; color: #374151; flex: 1; cursor: pointer; }
            .mp-check-item.done .mp-check-text { color: #059669; text-decoration: line-through; opacity: 0.75; }
            .mp-check-go { padding: 6px 12px; background: #7E57C2; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: .8rem; text-decoration: none; flex-shrink: 0; }
            .mp-check-item.done .mp-check-go { display: none; }

            .mp-onboard-footer { margin-top: 22px; display: flex; gap: 10px; }
            .mp-btn-full { flex: 1; padding: 14px; border-radius: 12px; border: none; background: #7E57C2; color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer; }
            .mp-btn-full:hover { background: #6A49AD; }
            .mp-btn-full:disabled { background: #D1D5DB; cursor: not-allowed; }
            .mp-btn-dismiss { padding: 14px 18px; border-radius: 12px; border: 1px solid #E5E7EB; background: #fff; color: #6B7280; font-weight: 600; font-size: .9rem; cursor: pointer; }
            .mp-btn-dismiss:hover { background: #F9FAFB; }

            .mp-pdv-locked { position: fixed; inset: 0; background: rgba(255,255,255,0.95); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
            .mp-lock-icon { font-size: 4rem; margin-bottom: 16px; }
            .mp-lock-title { font-family: 'Baloo 2', cursive; font-size: 1.8rem; color: #2D1B4E; margin: 0 0 12px; }
            .mp-lock-msg { color: #666; max-width: 460px; line-height: 1.5; margin: 0 0 24px; }
        `;
        document.head.appendChild(style);
    },

    showWelcomeModal() {
        if (this._modal) return;

        const done = this._items.filter(i => i.done).length;
        const total = this._items.length;
        const pct = Math.round((done / total) * 100);

        const invBase = this._franchise.investimentoBase || 3499.99;
        const invEst = this._franchise.investimentoEstrutura || 2000.00;
        const projMensal = 22 * 8 * (this._franchise.ticketMedioBase || 25); // 22 dias, 8 pedidos/dia

        const overlay = document.createElement('div');
        overlay.className = 'mp-onboarding-overlay';
        overlay.innerHTML = `
            <div class="mp-onboarding-modal">
                <div class="mp-onboarding-hero">
                    <button class="mp-onboarding-close" aria-label="Fechar" onclick="Onboarding.dismiss()">✕</button>
                    <h2>Falta pouco! 🎉</h2>
                    <p>Complete os itens abaixo e sua franquia <strong>${this._franchise.name}</strong> estará 100% pronta pra operar.</p>
                </div>
                <div class="mp-onboarding-content">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div style="background:#F3F4F6;padding:12px;border-radius:12px;text-align:center">
                            <div style="font-size:.68rem;color:#6B7280;font-weight:600;text-transform:uppercase">Investimento</div>
                            <div style="font-size:1rem;font-weight:800;color:#2D1B4E">R$ ${(invBase + invEst).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                        </div>
                        <div style="background:#E0F2F1;padding:12px;border-radius:12px;text-align:center">
                            <div style="font-size:.68rem;color:#6B7280;font-weight:600;text-transform:uppercase">Projeção mensal</div>
                            <div style="font-size:1rem;font-weight:800;color:#00796B">R$ ${projMensal.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0})}+</div>
                        </div>
                    </div>

                    <div class="mp-checklist-title">🚀 Passo a Passo (${done}/${total})</div>
                    <div class="mp-progress-container">
                        <div class="mp-progress-bar" id="onboardProgress" style="width:${pct}%"></div>
                    </div>

                    <div class="mp-checklist" id="onboardChecklist"></div>

                    <div class="mp-onboard-footer">
                        <button class="mp-btn-dismiss" onclick="Onboarding.dismiss()">Ver depois</button>
                        <button class="mp-btn-full" id="btnFinishSetup" onclick="Onboarding.finishSetup()" ${done < total ? 'disabled' : ''}>${done < total ? 'Complete os passos acima' : 'Finalizar Configuração ✓'}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this._modal = overlay;
        this.renderChecklist();
    },

    renderChecklist() {
        const container = document.getElementById('onboardChecklist');
        if (!container) return;

        const itemsHtml = this._items.map(item => {
            const def = this.DEFAULT_ITEMS.find(d => d.id === item.id) || {};
            const link = def.link || '#';
            return `
                <div class="mp-check-item ${item.done ? 'done' : ''}">
                    <div class="mp-check-circle" onclick="Onboarding.toggleStep('${item.id}')">${item.done ? '✓' : ''}</div>
                    <div class="mp-check-text" onclick="Onboarding.toggleStep('${item.id}')">${item.text}</div>
                    ${item.done ? '' : `<a class="mp-check-go" href="${link}">Ir</a>`}
                </div>
            `;
        }).join('');
        container.innerHTML = itemsHtml;
    },

    toggleStep(id) {
        const item = this._items.find(i => i.id === id);
        if (!item) return;
        item.done = !item.done;
        DataStore.setCollection('checklist_onboarding', this._franchise.id, this._items);

        if (this._franchise.setupStatus === 'pending') {
            this.updateStatus('em_configuracao');
        }

        // Re-render progress bar + buttons
        const done = this._items.filter(i => i.done).length;
        const total = this._items.length;
        const pct = Math.round((done / total) * 100);
        const progressEl = document.getElementById('onboardProgress');
        if (progressEl) progressEl.style.width = pct + '%';
        const btn = document.getElementById('btnFinishSetup');
        if (btn) {
            btn.disabled = done < total;
            btn.textContent = done < total ? 'Complete os passos acima' : 'Finalizar Configuração ✓';
        }
        // Update title
        const title = document.querySelector('.mp-checklist-title');
        if (title) title.innerHTML = `🚀 Passo a Passo (${done}/${total})`;

        this.renderChecklist();
    },

    updateStatus(status) {
        const franchises = (DataStore.getAllFranchises && DataStore.getAllFranchises()) || DataStore.get('franchises') || [];
        const idx = franchises.findIndex(f => f.id === this._franchise.id);
        if (idx !== -1) {
            franchises[idx].setupStatus = status;
            DataStore.set('franchises', franchises);
            this._franchise = franchises[idx];
        }
    },

    finishSetup(silent) {
        if (typeof DataStore.markSetupComplete === 'function') {
            DataStore.markSetupComplete(this._franchise.id);
        } else {
            this.updateStatus('pronto');
            const franchises = DataStore.get('franchises') || [];
            const idx = franchises.findIndex(f => f.id === this._franchise.id);
            if (idx !== -1) {
                franchises[idx].setupCompleto = true;
                franchises[idx].activatedAt = new Date().toISOString();
                DataStore.set('franchises', franchises);
            }
        }
        if (this._modal) { this._modal.remove(); this._modal = null; }

        if (!silent && typeof Notifications !== 'undefined' && Notifications.add) {
            try {
                Notifications.add('Setup concluído! 🚀', 'Sua franquia está 100% pronta. O PDV foi liberado.', 'success');
            } catch(e) {}
        }

        if (window.location.pathname.includes('pdv.html')) {
            window.location.reload();
        }
    },

    // "Ver depois" — fecha o modal mas NAO marca como pronto.
    // Usa sessionStorage pra nao reabrir na mesma sessao (re-abre no proximo login).
    dismiss() {
        try { sessionStorage.setItem('mp_onboarding_dismissed_' + this._franchise.id, '1'); } catch(e) {}
        if (this._modal) { this._modal.remove(); this._modal = null; }
    },

    checkPageLock() {
        // Bloqueia o PDV se setup nao terminou ainda
        const isPDV = window.location.pathname.includes('pdv.html');
        if (isPDV && this._franchise && this._franchise.setupStatus !== 'pronto' && !this._franchise.setupCompleto) {
            this.showPDVLock();
        }
    },

    showPDVLock() {
        if (document.getElementById('mp-pdv-lock')) return;
        const lock = document.createElement('div');
        lock.id = 'mp-pdv-lock';
        lock.className = 'mp-pdv-locked';
        lock.innerHTML = `
            <div class="mp-lock-icon">🔒</div>
            <h2 class="mp-lock-title">Vendas Bloqueadas</h2>
            <p class="mp-lock-msg">Finalize o checklist de onboarding no Dashboard pra liberar o PDV.</p>
            <button class="mp-btn-full" style="max-width:300px" onclick="window.location.href='index.html'">Voltar ao Dashboard</button>
        `;
        document.body.appendChild(lock);
    }
};

// Auto-init com respeito a sessionStorage dismiss
(function(){
    const origShow = Onboarding.showWelcomeModal.bind(Onboarding);
    Onboarding.showWelcomeModal = function(){
        try {
            if (this._franchise && sessionStorage.getItem('mp_onboarding_dismissed_' + this._franchise.id)) return;
        } catch(e) {}
        return origShow();
    };
})();

Onboarding.init();
