/**
 * MilkyPot - Landing Page Conversions Flow (Comercial Align)
 * Hybrid Flow: Lead Capture -> WhatsApp Redirection
 * Dual Simulator (Delivery vs Shop)
 */

document.addEventListener('DOMContentLoaded', function() {
    updateLpSim();
});

const LpFlow = {
    // ---- Simulator Logic ----
    updateSimValue: function() {
        const slider = document.getElementById('lpSlider');
        const qty = parseInt(slider.value);
        
        // Determina contexto global via HTML (window.currentModel)
        const model = window.currentModel || 'delivery';
        
        let ticketMedio = 20; 
        let margin = 0.35;
        let payback = '1 a 2 Meses';
        
        if (model === 'loja') {
            ticketMedio = 22; // Ticket maior em loja física
            margin = 0.28; // Margem menor devido a custos fixos (aluguel/luz)
            payback = '3 a 6 Meses';
        }

        const monthlyRevenue = qty * ticketMedio * 30;
        const monthlyProfit = monthlyRevenue * margin;
        
        document.getElementById('lpQtyText')?.setHTMLUnsafe(`<strong>${qty}</strong>`);
        // Adaptacao para o novo headline do simulador
        const h3 = document.getElementById('simHeadline');
        if (h3) h3.innerHTML = `Se você vender <strong>${qty}</strong> pedidos por dia no modelo ${model === 'delivery' ? 'Delivery' : 'Loja'}...`;

        document.getElementById('lpRevenueText').textContent = this.formatBrl(monthlyRevenue);
        document.getElementById('lpProfitText').textContent = this.formatBrl(monthlyProfit);
        
        const paybackEl = document.getElementById('lpPaybackText');
        if (paybackEl) paybackEl.textContent = payback;
    },

    formatBrl: function(val) {
        return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    },

    // ---- Modal Logic ----
    openLeadModal: function() {
        const modal = document.getElementById('leadModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },

    closeLeadModal: function() {
        const modal = document.getElementById('leadModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'initial';
        }
    },

    // ---- Hybrid Flow Execution ----
    submitLead: function(e) {
        e.preventDefault();
        
        const name = document.getElementById('leadName').value;
        const city = document.getElementById('leadCity').value;
        const neighborhood = document.getElementById('leadNeighborhood').value;
        const phone = document.getElementById('leadPhone').value;
        const model = window.currentModel || 'delivery';

        // 1. Save Lead
        const leadData = {
            name, city, neighborhood, phone, model,
            timestamp: new Date().toISOString(),
            source: 'lp_comercial_v2'
        };
        
        try {
            let leads = JSON.parse(localStorage.getItem('mp_leads') || '[]');
            leads.push(leadData);
            localStorage.setItem('mp_leads', JSON.stringify(leads));
        } catch(err) {}

        // 2. Prepare WhatsApp Message (Comercial Force)
        const waNumber = '5543998042424'; 
        const text = `Olá! Vi a proposta da MilkyPot e tenho interesse no modelo *${model === 'delivery' ? 'Delivery (Home)' : 'Loja / Quiosque'}*.\n\nMeu nome é *${name}* e quero garantir minha região no bairro *${neighborhood}* em *${city}*.\n\nPode me passar os próximos passos?`;
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

        // 3. Feedback and Redirect
        const btn = e.target.querySelector('button');
        btn.textContent = 'Enviando para o comercial...';
        btn.disabled = true;

        setTimeout(() => {
            window.location.href = waUrl;
        }, 800);
    }
};

// Global hooks
window.updateLpSim = () => LpFlow.updateSimValue();
window.openLeadModal = () => LpFlow.openLeadModal();
window.closeLeadModal = () => LpFlow.closeLeadModal();
window.handleLeadSubmit = (e) => LpFlow.submitLead(e);
window.currentModel = 'delivery'; // Default inicial
