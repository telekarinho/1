# Belinha + Google Review Integration

> Documentação pra integrar avaliação Google + raspinha PREMIUM no fluxo
> WhatsApp da Belinha (bot atendimento MilkyPot).

## Status atual

- ✅ **Sistema raspinha-engine.js** já gera raspinha automática no checkout PDV/cardápio
- ✅ **clube/avaliei.html** já valida avaliação Google + libera raspinha PREMIUM
- ✅ **CloudFunctions.claimAction(memberId, 'google_review')** já existe
- ✅ **CTA Google Review** agora aparece em `/pedido.html` quando status = entregue (PR #636)
- ✅ **Widget prova social** com rating + count na home cardapio (PR #636)
- ⏳ **Belinha precisa enviar mensagem WhatsApp** quando pedido entregue (PENDENTE)

## Fluxo proposto Belinha

### Trigger

Quando `orders_log/{id}.status` muda pra `'entregue'` (Cloud Function notifyOrderStatus):
- Cliente recebe push notification (já existe FCM)
- **NOVO**: Belinha envia mensagem WhatsApp 5min depois (timing certo, cliente já comeu)

### Mensagem template

```
Olá {{nome}}! 🐑

Tudo certo com seu MilkyPot? 🍨

Adoraríamos saber o que achou. Se curtiu, dá um pulinho aqui pra avaliar a gente no Google ⭐

👉 https://g.page/r/CXrthQS1rgPdEAE/review

E olha que legal: depois de avaliar, você ganha uma RASPINHA PREMIUM (prêmios maiores) + 50 MilkyCoins 🪙✨

Acompanhe seu pedido + acesso à raspinha:
👉 milkypot.com/pedido.html?id={{order_id}}

Boa sobremesa! 🐑💕
```

### Implementação técnica

**Opção 1 — Cloud Function trigger (recomendado)**

Em `functions/index.js`, adicionar trigger Firestore:

```javascript
exports.notifyOrderDeliveredWhatsApp = onDocumentUpdated(
    'orders_log/{orderId}',
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();

        if (before.status === 'entregue' || after.status !== 'entregue') return;

        const customerPhone = (after.customer && after.customer.phone) || '';
        if (!customerPhone) return;

        const orderId = event.params.orderId;
        const customerName = (after.customer && after.customer.name) || 'Cliente';
        const trackingUrl = `https://milkypot.com/pedido.html?id=${orderId}`;
        const reviewUrl = 'https://g.page/r/CXrthQS1rgPdEAE/review';

        const message = `Olá ${customerName}! 🐑\n\nTudo certo com seu MilkyPot? 🍨\n\nAdoraríamos saber o que achou. Se curtiu, dá um pulinho aqui pra avaliar a gente no Google ⭐\n\n👉 ${reviewUrl}\n\nE olha que legal: depois de avaliar, você ganha uma RASPINHA PREMIUM (prêmios maiores) + 50 MilkyCoins 🪙✨\n\nAcompanhe seu pedido + acesso à raspinha:\n👉 ${trackingUrl}\n\nBoa sobremesa! 🐑💕`;

        // Envia via WhatsApp Business API (Meta)
        await sendWhatsAppMessage(customerPhone, message);

        // Track
        await admin.firestore().collection('whatsapp_review_requests').add({
            orderId, customerPhone, sentAt: new Date().toISOString()
        });
    }
);
```

**Opção 2 — Belinha bot existente** (se já tem webhook ativo)

No prompt system da Belinha (`functions/whatsapp-bot.js` ou similar), adicionar contexto:

```
QUANDO um pedido do cliente é marcado como entregue:
  - Aguarde 5 minutos
  - Mande mensagem: [template acima]
  - Use as tools `send_review_request(customer_phone, order_id)` se disponível

QUANDO cliente responde positivamente sobre o pedido (frases tipo "muito bom",
"adorei", "delícia", "show"):
  - Sugira avaliar no Google: "Olha, você ia me ajudar MUITO se desse essa
    nota lá no Google ⭐ Tem até prêmio: ganha raspinha PREMIUM. Bora?"
  - Inclua link: https://g.page/r/CXrthQS1rgPdEAE/review

QUANDO cliente menciona "raspinha", "prêmio", "ganhei":
  - Acompanhe entusiasmo
  - Pergunte se foi acessar /raspinha.html?c=CODIGO
  - Lembre que tem MilkyCoins acumulando no clube
```

## Métricas pra acompanhar

Adicionar no GA4 / Sentry:

- `whatsapp_review_request_sent` (orderId, customerPhone hash)
- `whatsapp_review_request_clicked` (link Google clicked)
- `google_review_completed` (já existe via avaliei.html)

KPI alvo: **15% conversion rate** (de pedidos entregues → avaliações Google novas).

## Configuração admin

Permitir desligar via Firestore `datastore/feature_flags`:

```json
{
  "flags": {
    "whatsapp_review_request": {
      "enabled": true,
      "delayMinutes": 5,
      "franchiseAllowlist": ["muffato-quintino"]
    }
  }
}
```

## Custo estimado

- WhatsApp Business API Meta: GRÁTIS até 1k conv/mês
- Cloud Function trigger: ~$0.0001 por pedido
- 100 pedidos/dia = ~$0.30/mês

## Próximos passos

1. **Esperar dados** dos PRs já mergeados (CTA + widget) por 7 dias
2. **Confirmar conversion rate** no /pedido.html via GA4
3. **Implementar Cloud Function** acima quando WhatsApp Bot estiver deployed
   (ver `docs/whatsapp-bot-roadmap.md`)
