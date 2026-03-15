/* ============================================
   MilkyPot - Integração WhatsApp
   ============================================
   Envia notificações via WhatsApp Web API.
   Usa links wa.me para abrir conversa direta
   e API de templates para mensagens automáticas.
   ============================================ */

const WhatsApp = {
    // Número padrão do suporte MilkyPot (com código do país)
    SUPPORT_NUMBER: '5500000000000',

    // ============================================
    // Gerar link WhatsApp (wa.me)
    // ============================================
    generateLink(phone, message) {
        const cleanPhone = this._cleanPhone(phone);
        const encoded = encodeURIComponent(message || '');
        return `https://wa.me/${cleanPhone}${message ? '?text=' + encoded : ''}`;
    },

    // Abre WhatsApp diretamente
    open(phone, message) {
        const link = this.generateLink(phone, message);
        window.open(link, '_blank');
    },

    // ============================================
    // Templates de mensagem por evento
    // ============================================
    templates: {
        // Confirmação de pedido para o cliente
        orderConfirmed(order) {
            const items = (order.items || []).map(i =>
                `  • ${i.quantity}x ${i.flavor} ${i.size}`
            ).join('\n');

            return `🍦 *MilkyPot - Pedido Confirmado!*\n\n` +
                `Olá ${Utils.escapeHtml(order.customerName || 'Cliente')}!\n\n` +
                `Seu pedido *#${order.id}* foi confirmado!\n\n` +
                `📋 *Itens:*\n${items}\n\n` +
                `💰 *Total:* R$ ${(order.total || 0).toFixed(2)}\n` +
                `📍 *Tipo:* ${WhatsApp._deliveryTypeLabel(order.deliveryType)}\n\n` +
                `Obrigado pela preferência! 💖`;
        },

        // Pedido pronto para retirada
        orderReady(order) {
            return `🍦 *MilkyPot - Pedido Pronto!*\n\n` +
                `Olá ${Utils.escapeHtml(order.customerName || 'Cliente')}!\n\n` +
                `Seu pedido *#${order.id}* está *pronto*! 🎉\n\n` +
                (order.deliveryType === 'retirada'
                    ? `📍 Venha retirar no balcão!\n\n`
                    : `🛵 Saindo para entrega!\n\n`) +
                `Obrigado pela preferência! 💖`;
        },

        // Pedido saiu para entrega
        orderOutForDelivery(order) {
            return `🍦 *MilkyPot - Saiu para Entrega!*\n\n` +
                `Olá ${Utils.escapeHtml(order.customerName || 'Cliente')}!\n\n` +
                `Seu pedido *#${order.id}* saiu para entrega! 🛵\n\n` +
                `Previsão: *30-45 minutos*\n\n` +
                `Obrigado pela preferência! 💖`;
        },

        // Pedido entregue
        orderDelivered(order) {
            return `🍦 *MilkyPot - Pedido Entregue!*\n\n` +
                `Olá ${Utils.escapeHtml(order.customerName || 'Cliente')}!\n\n` +
                `Seu pedido *#${order.id}* foi *entregue*! ✅\n\n` +
                `Esperamos que você goste! 😋\n\n` +
                `⭐ Avalie sua experiência respondendo esta mensagem.\n\n` +
                `Obrigado pela preferência! 💖`;
        },

        // Alerta de estoque baixo para o franqueado
        lowStockAlert(items, franchiseName) {
            const list = items.map(i =>
                `  ⚠️ ${i.name}: ${i.current}${i.unit} (mín: ${i.min}${i.unit})`
            ).join('\n');

            return `📦 *MilkyPot - Alerta de Estoque*\n\n` +
                `Franquia: *${Utils.escapeHtml(franchiseName)}*\n\n` +
                `Os seguintes itens estão com estoque baixo:\n\n` +
                `${list}\n\n` +
                `Providencie a reposição! 🏃`;
        },

        // Relatório diário para o franqueado
        dailyReport(data) {
            return `📊 *MilkyPot - Relatório do Dia*\n\n` +
                `📅 ${data.date}\n` +
                `🏪 ${Utils.escapeHtml(data.franchiseName)}\n\n` +
                `📋 Pedidos: *${data.totalOrders}*\n` +
                `💰 Faturamento: *R$ ${(data.revenue || 0).toFixed(2)}*\n` +
                `🎫 Ticket Médio: *R$ ${(data.avgTicket || 0).toFixed(2)}*\n` +
                `🏆 Mais vendido: *${data.topProduct || '-'}*\n\n` +
                `Bom trabalho! 💪`;
        },

        // Boas-vindas ao programa de fidelidade
        loyaltyWelcome(customerName, points) {
            return `🍦 *MilkyPot - Programa de Fidelidade*\n\n` +
                `Olá ${Utils.escapeHtml(customerName)}! 🎉\n\n` +
                `Você acaba de se cadastrar no nosso programa de fidelidade!\n\n` +
                `💎 Seus pontos: *${points}*\n` +
                `🎁 A cada 100 pontos, ganhe 1 sorvete grátis!\n\n` +
                `Continue comprando para acumular pontos! 💖`;
        },

        // Notificação de pontos de fidelidade
        loyaltyPointsEarned(customerName, pointsEarned, totalPoints) {
            return `🍦 *MilkyPot - Pontos Acumulados!*\n\n` +
                `Olá ${Utils.escapeHtml(customerName)}!\n\n` +
                `Você ganhou *+${pointsEarned} pontos* nesta compra! 🎉\n\n` +
                `💎 Total de pontos: *${totalPoints}*\n` +
                (totalPoints >= 100
                    ? `\n🎁 Você tem pontos suficientes para resgatar uma recompensa!\n`
                    : `\n📈 Faltam *${100 - (totalPoints % 100)} pontos* para a próxima recompensa.\n`) +
                `\nObrigado pela preferência! 💖`;
        }
    },

    // ============================================
    // Enviar mensagem por status do pedido
    // ============================================
    sendOrderNotification(order, newStatus) {
        if (!order.customerPhone) {
            console.warn('WhatsApp: pedido sem telefone do cliente');
            return false;
        }

        let message = '';
        switch (newStatus) {
            case MP.ORDER_STATUS.CONFIRMED:
                message = this.templates.orderConfirmed(order);
                break;
            case MP.ORDER_STATUS.READY:
                message = this.templates.orderReady(order);
                break;
            case MP.ORDER_STATUS.OUT_FOR_DELIVERY:
                message = this.templates.orderOutForDelivery(order);
                break;
            case MP.ORDER_STATUS.DELIVERED:
                message = this.templates.orderDelivered(order);
                break;
            default:
                return false;
        }

        this.open(order.customerPhone, message);

        // Log no audit
        if (typeof AuditLog !== 'undefined') {
            AuditLog.log('whatsapp.sent', {
                orderId: order.id,
                status: newStatus,
                phone: this._maskPhone(order.customerPhone)
            });
        }

        return true;
    },

    // ============================================
    // Botão WhatsApp flutuante para storefront
    // ============================================
    injectFloatingButton(phone, message) {
        if (document.getElementById('mp-whatsapp-fab')) return;

        const btn = document.createElement('a');
        btn.id = 'mp-whatsapp-fab';
        btn.href = this.generateLink(phone, message || 'Olá! Gostaria de fazer um pedido 🍦');
        btn.target = '_blank';
        btn.rel = 'noopener';
        btn.title = 'Fale conosco no WhatsApp';
        btn.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        `;
        btn.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #25D366;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            z-index: 9999;
            transition: transform 0.2s;
            cursor: pointer;
            text-decoration: none;
        `;
        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1)';

        document.body.appendChild(btn);
    },

    // ============================================
    // Compartilhar cardápio via WhatsApp
    // ============================================
    shareMenu(franchiseName, menuUrl) {
        const message = `🍦 Confira o cardápio da *MilkyPot ${Utils.escapeHtml(franchiseName)}*!\n\n` +
            `${menuUrl}\n\n` +
            `Peça já o seu! 😋`;
        this.open('', message);
    },

    // ============================================
    // Helpers
    // ============================================
    _cleanPhone(phone) {
        if (!phone) return '';
        let clean = phone.replace(/\D/g, '');
        // Adiciona código do Brasil se necessário
        if (clean.length === 11) clean = '55' + clean;
        if (clean.length === 10) clean = '55' + clean;
        return clean;
    },

    _maskPhone(phone) {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 4) {
            return clean.slice(0, -4).replace(/./g, '*') + clean.slice(-4);
        }
        return '****';
    },

    _deliveryTypeLabel(type) {
        const labels = {
            'delivery': '🛵 Delivery',
            'retirada': '🏪 Retirada no balcão',
            'consumo_local': '🪑 Consumo no local'
        };
        return labels[type] || type || 'Não informado';
    }
};
