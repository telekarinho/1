/**
 * MilkyPot - Onboarding Engine (Onda 1)
 * Gerencia o encantamento inicial, checklist de setup e bloqueio guiado.
 */
const Onboarding = {
    _franchise: null,
    _modal: null,

    init() {
        if (typeof Auth === 'undefined' || typeof DataStore === 'undefined') return;
        
        const session = Auth.getSession();
        if (!session || session.role !== 'franchisee') return;

        const franchises = DataStore.getAllFranchises();
        this._franchise = franchises.find(f => f.id === session.franchiseId);

        if (!this._franchise) return;

        // Injeta estilos
        this._injectStyles();

        // Se o setup não estiver pronto, inicia o fluxo
        if (this._franchise.setupStatus !== 'pronto') {
            this.showWelcomeModal();
        }

        // Verifica bloqueio de página (se estiver no PDV)
        this.checkPageLock();
    },

    _injectStyles() {
        if (document.getElementById('mp-onboarding-styles')) return;
        const style = document.createElement('style');
        style.id = 'mp-onboarding-styles';
        style.textContent = `
            .mp-onboarding-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(45, 27, 78, 0.85); backdrop-filter: blur(8px);
                z-index: 10001; display: flex; align-items: center; justify-content: center;
                padding: 20px;
            }
            .mp-onboarding-modal {
                background: #fff; border-radius: 24px; width: 100%; max-width: 600px;
                max-height: 90vh; overflow-y: auto; position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                animation: mp-onboard-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes mp-onboard-in { from { transform: scale(0.8) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            
            .mp-onboarding-hero {
                background: linear-gradient(135deg, #42A5F5, #7E57C2);
                padding: 40px 30px; border-radius: 0 0 30px 30px; color: #fff; text-align: center;
            }
            .mp-onboarding-hero h2 { font-family: 'Baloo 2', cursive; font-size: 1.8rem; margin-bottom: 10px; }
            .mp-onboarding-hero p { opacity: 0.9; font-size: 1rem; line-height: 1.4; }

            .mp-onboarding-content { padding: 30px; }
            
            .mp-projection-grid {
                display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;
            }
            .mp-projection-card {
                background: #F3F4F6; padding: 15px; border-radius: 16px; text-align: center;
            }
            .mp-projection-label { font-size: 0.75rem; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
            .mp-projection-value { font-size: 1.1rem; font-weight: 800; color: #2D1B4E; }

            .mp-checklist { margin-top: 20px; }
            .mp-checklist-title { font-weight: 700; font-size: 1rem; margin-bottom: 15px; color: #2D1B4E; display: flex; align-items: center; gap: 8px; }
            
            .mp-progress-container { background: #E5E7EB; height: 10px; border-radius: 5px; margin-bottom: 20px; overflow: hidden; }
            .mp-progress-bar { background: #10B981; height: 100%; transition: width 0.5s ease; }

            .mp-check-item {
                display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px;
                transition: all 0.2s; cursor: pointer;
            }
            .mp-check-item:hover { border-color: #7E57C2; background: #F9F5FF; }
            .mp-check-item.done { background: #ECFDF5; border-color: #10B981; }
            .mp-check-circle { 
                width: 22px; height: 22px; border-radius: 50%; border: 2px solid #D1D5DB;
                display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
            }
            .mp-check-item.done .mp-check-circle { background: #10B981; border-color: #10B981; color: #fff; }
            .mp-check-text { font-size: 0.9rem; font-weight: 600; color: #374151; }
            .mp-check-item.done .mp-check-text { color: #059669; text-decoration: line-through; opacity: 0.7; }

            .mp-onboard-footer { margin-top: 30px; text-align: center; }
            .mp-btn-full { 
                width: 100%; padding: 14px; border-radius: 12px; border: none;
                background: #7E57C2; color: #fff; font-weight: 700; font-size: 1rem;
                cursor: pointer; transition: background 0.2s;
            }
            .mp-btn-full:hover { background: #6A49AD; }
            .mp-btn-full:disabled { background: #D1D5DB; cursor: not-allowed; }

            /* Trava de PDV */
            .mp-pdv-locked {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(255,255,255,0.9); z-index: 9999;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                text-align: center; padding: 40px;
            }
            .mp-lock-icon { font-size: 4rem; margin-bottom: 20px; }
            .mp-lock-title { font-family: 'Baloo 2', cursive; font-size: 2rem; color: #2D1B4E; margin-bottom: 15px; }
            .mp-lock-msg { color: #666; max-width: 450px; line-height: 1.5; margin-bottom: 30px; }
        `;
        document.head.appendChild(style);
    },

    showWelcomeModal() {
        if (this._modal) return;

        const overlay = document.createElement('div');
        overlay.className = 'mp-onboarding-overlay';
        
        const invBase = this._franchise.investimentoBase || 3499.99;
        const invEst = this._franchise.investimentoEstrutura || 2000.00;
        const potential = (invBase + invEst) * 2.5; // Projeção conservadora

        overlay.innerHTML = `
            <div class="mp-onboarding-modal">
                <div class="mp-onboarding-hero">
                    <h2>Parabéns! 🎉</h2>
                    <p>Você acaba de ativar sua mini franquia <strong>${this._franchise.name}</strong>.<br>Agora você tem um negócio profissional pronto para rodar!</p>
                </div>
                <div class="mp-onboarding-content">
                    <div style="margin-bottom: 20px; font-size: 0.9rem; color: #666; text-align: center;">
                        Para iniciar sua operação hoje, certifique-se de ter um <strong>freezer básico (100L)</strong> instalado.
                    </div>

                    <div class="mp-projection-grid">
                        <div class="mp-projection-card">
                            <div class="mp-projection-label">Investimento (Kit + Est.)</div>
                            <div class="mp-projection-value">R$ ${(invBase + invEst).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                        </div>
                        <div class="mp-projection-card" style="background: #E0F2F1">
                            <div class="mp-projection-label">Projeção Faturamento</div>
                            <div class="mp-projection-value" style="color: #00796B">R$ ${potential.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                        </div>
                    </div>

                    <div class="mp-checklist-title">🚀 Passo a Passo para Vender</div>
                    <div class="mp-progress-container">
                        <div class="mp-progress-bar" id="onboardProgress" style="width: 0%"></div>
                    </div>

                    <div class="mp-checklist" id="onboardChecklist">
                        <!-- Itens via JS -->
                    </div>

                    <div class="mp-onboard-footer">
                        <button class="mp-btn-full" id="btnFinishSetup" disabled onclick="Onboarding.finishSetup()">Finalizar Configuração</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this._modal = overlay;
        this.renderChecklist();
    },

    renderChecklist() {
        const checklist = DataStore.getCollection('checklist_onboarding', this._franchise.id);
        const container = document.getElementById('onboardChecklist');
        if (!container) return;

        const doneCount = checklist.filter(i => i.done).length;
        const progress = Math.round((doneCount / checklist.length) * 100);
        
        document.getElementById('onboardProgress').style.width = progress + '%';
        
        container.innerHTML = checklist.map(item => `
            <div class="mp-check-item ${item.done ? 'done' : ''}" onclick="Onboarding.toggleStep('${item.id}')">
                <div class="mp-check-circle">${item.done ? '✓' : ''}</div>
                <div class="mp-check-text">${item.text}</div>
            </div>
        `).join('');

        const btn = document.getElementById('btnFinishSetup');
        if (btn) btn.disabled = (doneCount < checklist.length);
    },

    toggleStep(id) {
        const checklist = DataStore.getCollection('checklist_onboarding', this._franchise.id);
        const item = checklist.find(i => i.id === id);
        if (item) {
            item.done = !item.done;
            DataStore.setCollection('checklist_onboarding', this._franchise.id, checklist);
            
            // Se começou a marcar, muda status para 'em_configuracao'
            if (this._franchise.setupStatus === 'pending') {
                this.updateStatus('em_configuracao');
            }
            
            this.renderChecklist();
        }
    },

    updateStatus(status) {
        const franchises = DataStore.getAllFranchises();
        const idx = franchises.findIndex(f => f.id === this._franchise.id);
        if (idx !== -1) {
            franchises[idx].setupStatus = status;
            DataStore.set('franchises', franchises);
            this._franchise = franchises[idx];
        }
    },

    finishSetup() {
        if (DataStore.markSetupComplete(this._franchise.id)) {
            if (this._modal) this._modal.remove();
            
            // Notificação de sucesso
            if (typeof Notifications !== 'undefined') {
                Notifications.add(
                    'Negócio Ativado! 🚀',
                    'Sua franquia está pronta para operar. O sistema de vendas foi liberado!',
                    'success'
                );
            }
            
            // Recarrega se estiver no PDV para liberar
            if (window.location.pathname.includes('pdv.html')) {
                window.location.reload();
            }
        }
    },

    checkPageLock() {
        // Bloqueio Guiado: Só PDV é bloqueado agressivamente
        const isPDV = window.location.pathname.includes('pdv.html');
        if (isPDV && this._franchise.setupStatus !== 'pronto') {
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
            <p class="mp-lock-msg">
                Sua unidade ainda não completou a configuração inicial obrigatória.<br>
                <strong>Cadastre seu estoque e finalize o checklist no Dashboard para liberar o PDV.</strong>
            </p>
            <button class="mp-btn-full" style="max-width:300px" onclick="window.location.href='index.html'">Voltar para Dashboard</button>
        `;
        document.body.appendChild(lock);
    }
};

// Auto-init
Onboarding.init();
