# WhatsApp Bot MilkyPot — Roadmap de implementação

> **Status**: Backlog. Tudo o que precede já foi entregue. Esta feature requer Cloud Function deploy + Meta Business API access, fora do escopo client-only.

## Visão

Cliente manda mensagem natural no WhatsApp:
> "Quero 2 milkshakes de morango, monster pot"

Bot entende, monta pedido, manda link de pagamento. Zero fricção, mesma facilidade de pedir por voz pra um amigo.

## Arquitetura

```
WhatsApp (cliente)
    ↓ webhook (Meta Business API)
Cloud Function /whatsapp/webhook (Firebase)
    ↓
Claude API tool use (parse intent + items)
    ↓
Cria pedido em orders_log + envia link /pedido/{id}?pay=pix
    ↓ Meta API enviar mensagem com link
Cliente recebe link no WhatsApp + paga + acompanha
```

## Stack

- **Meta WhatsApp Business API** (oficial, free até 1k conv/mês)
  - Alternativa: Twilio (~US$ 5/mês conta + por mensagem)
- **Firebase Functions** (us-central1 ou southamerica-east1)
- **Claude API** (claude-sonnet-4 ou haiku-4 pra reduzir custo)
- **Firestore** pra persistir conversation state + orders

## Implementação passo-a-passo

### 1. Setup Meta Business (1-2h)

```bash
# Criar app em developers.facebook.com
# Adicionar produto WhatsApp Business
# Pegar:
#   - PHONE_NUMBER_ID
#   - WHATSAPP_TOKEN (long-lived access token)
#   - WEBHOOK_VERIFY_TOKEN (você escolhe)
# Configurar webhook URL: https://southamerica-east1-milkypot-ad945.cloudfunctions.net/whatsappWebhook
```

Salvar secrets:
```bash
firebase functions:secrets:set WHATSAPP_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_ID
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
firebase functions:secrets:set ANTHROPIC_API_KEY
```

### 2. Cloud Function `whatsappWebhook` (3-4h)

Arquivo: `functions/whatsapp-bot.js`

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Anthropic = require('@anthropic-ai/sdk');
const admin = require('firebase-admin');

const WHATSAPP_TOKEN = defineSecret('WHATSAPP_TOKEN');
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

exports.whatsappWebhook = onRequest(
  { secrets: [WHATSAPP_TOKEN, ANTHROPIC_API_KEY], region: 'southamerica-east1' },
  async (req, res) => {
    // GET = verification (Meta exige)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return res.send(req.query['hub.challenge']);
      }
      return res.sendStatus(403);
    }

    // POST = mensagem recebida
    const body = req.body;
    const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const fromPhone = msg.from;
    const text = msg.text?.body || '';

    // Recupera estado da conversa
    const db = admin.firestore();
    const convRef = db.collection('whatsapp_conversations').doc(fromPhone);
    const conv = (await convRef.get()).data() || { messages: [] };

    conv.messages.push({ role: 'user', content: text });

    // Claude API com tools
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: `Você é a Lulu, atendente MilkyPot. Cardápio: [milkshakes de morango/chocolate/oreo/nutella/... a partir de R$16,99]. Tamanhos: Essencial 275ml, Supremo 440ml, Monster Pot 550ml, Soberano 770ml. Use as tools pra criar pedido quando o cliente confirmar.`,
      tools: [
        {
          name: 'create_order',
          description: 'Cria pedido após cliente confirmar',
          input_schema: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', properties: {
                name: { type: 'string' }, size: { type: 'string' }, qty: { type: 'number' }
              }}},
              customer_name: { type: 'string' },
              delivery_type: { type: 'string', enum: ['delivery', 'pickup'] }
            },
            required: ['items']
          }
        }
      ],
      messages: conv.messages
    });

    // Processa tool calls
    let reply = '';
    for (const block of completion.content) {
      if (block.type === 'text') reply += block.text;
      if (block.type === 'tool_use' && block.name === 'create_order') {
        const orderId = 'WA' + Date.now().toString(36);
        await db.collection('orders_log').doc(orderId).set({
          orderNumber: orderId,
          status: 'aguardando_pagamento',
          items: block.input.items,
          customer: { name: block.input.customer_name, phone: fromPhone },
          delivery: { type: block.input.delivery_type || 'pickup' },
          source: 'whatsapp_bot',
          createdAt: new Date().toISOString()
        });
        reply += `\n\n✅ Pedido criado! Acompanhe: https://milkypot.com/pedido.html?id=${orderId}`;
      }
    }

    conv.messages.push({ role: 'assistant', content: reply });
    await convRef.set(conv, { merge: true });

    // Envia resposta via WhatsApp API
    await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN.value()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: fromPhone,
        text: { body: reply }
      })
    });

    res.sendStatus(200);
  }
);
```

### 3. Deploy (5 min)

```bash
cd functions/
npm install @anthropic-ai/sdk
firebase deploy --only functions:whatsappWebhook
```

### 4. Test

Mande mensagem pro WhatsApp Business no número configurado.

## Estimativa total

- Setup Meta: 1-2h
- Cloud Function: 3-4h
- Tests + ajustes: 2-3h
- **Total: ~1 dia útil de dev**

## Custos estimados

- Meta WhatsApp: GRATIS até 1k conv/mês
- Claude API: ~US$ 0.003/conv (Sonnet) → 1k conv = US$ 3/mês
- Firebase Functions: dentro do free tier
- **Total: ~R$ 15-30/mês**

## Eventos GA4 sugeridos

- `whatsapp_message_received`
- `whatsapp_intent_understood`
- `whatsapp_order_created` (source: whatsapp_bot)
- `whatsapp_confused` (claude não entendeu)

## Próximos passos (depois do MVP)

- Áudio: cliente manda áudio, transcreve com Whisper, processa
- Imagem: cliente manda foto do potinho que quer, Claude descreve, sugere pedido similar
- Multi-tenant: cada franquia tem seu número WhatsApp
- Handoff humano: se Claude não entende 3x, manda pra fila do atendente real
