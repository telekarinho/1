# MilkyPot Deploy Checklist — Status 100%

> Atualizado após sessão épica 2026-05-15/16. Checklist completo do que está LIVE
> automaticamente vs do que precisa ação manual pra ativar 100%.

## ✅ JÁ LIVE EM PRODUÇÃO (deploy automático via GitHub Pages)

Tudo abaixo deployou sozinho ao mergear na `main`:

### Cardápio online (cardapio.html)
- ⭐ Widget Google Reviews na home
- 🐑 Botão "Pedir com a galera" (Shared Cart viral)
- 🎤 Botão "Pedir por voz" (Web Speech API)
- 🔄 Banner "Pedir de novo" 1-tap (auto-show se histórico)
- ☀️ Banner Weather Promo contextual
- 🔴 Banner Social Heatmap "AO VIVO"
- 📍 GPS one-tap + 🗺️ Mapa interativo Leaflet (drop pin ovelhinha)
- 🪄 Botão "Ver em 3D" no modal de cada produto (AR Preview)
- 🔔 Push opt-in prompt (se cart ativo)
- 🎰 Roleta MilkyCoins pós-checkout (8 prêmios + share)
- 🔥 Streak gamificado (milestones 3/7/14/30)
- 📊 Telemetria GA4 (~50 eventos custom)
- 🛡️ Sentry alert se DeliveryRules sumir

### Tracking ao vivo (/pedido.html)
- 📍 Timeline 6 estágios (confirmado → entregue)
- ⏱️ ETA estimado por status
- 📞 Botão WhatsApp + Novo Pedido
- ⭐ CTA "Avalie no Google + raspinha PREMIUM" quando entregue
- 🎰 Botão "Girar Roleta MilkyCoins" quando entregue
- 📸 Botão "Mostra pra galera Stories" (Selfie sticker) quando entregue

### Painel admin
- 📊 `/painel/uber-stats.html` — dashboard cotações Uber
- ⭐ `/painel/google-reviews-config.html` — atualizar rating+count

### Clube fidelidade (clube.html)
- 💳 Botão flutuante "Minha carteirinha" (WalletPass + QR)

### Belinha WhatsApp (atendimento)
- 🐑 System prompt atualizado com 14 features novas
- 🎭 Detecção de emoção (feliz=pede review, insatisfeito=escala)

### Telemetria
- ✅ ~50 eventos GA4 custom enviando dados em tempo real

---

## ⚠️ PRECISA DEPLOY MANUAL (Cloud Functions Firebase)

As Cloud Functions de notificação foram CRIADAS mas precisam deploy:

```bash
cd functions/
npm install
firebase deploy --only functions:notifyOrderStatusPush,functions:notifyOrderDeliveredOutbox
```

**O que essas Cloud Functions fazem:**

### `notifyOrderStatusPush`
- Trigger: `onUpdate orders_log/{orderId}` (status muda)
- Lê tokens FCM do cliente em `push_subscriptions`
- Envia notification: "🛵 Saiu pra entrega! ETA 8min" etc.
- Auto-limpa tokens inválidos

### `notifyOrderDeliveredOutbox`
- Trigger: `onUpdate orders_log/{orderId}` (status virou "entregue")
- Cria doc em `whatsapp_outbox/{auto}` com mensagem template
- Servidor local da Belinha (cloudflared tunnel) lê esse outbox e envia

**Como Belinha consome o outbox:**

O servidor local da Belinha (`Belinha-Iniciar.bat` no PC do dono) precisa ter:

```javascript
// Adicionar no server.js da Belinha:
firebase.firestore().collection('whatsapp_outbox')
  .where('status', '==', 'pending')
  .onSnapshot(async (snap) => {
    for (const doc of snap.docs) {
      const data = doc.data();
      const scheduledFor = new Date(data.scheduledFor);
      if (scheduledFor > new Date()) continue; // ainda não é hora

      // Envia via WhatsApp lib (whatsapp-web.js, baileys, etc.)
      await sendWhatsAppMessage(data.customerPhone, data.message);

      await doc.ref.update({
        status: 'sent',
        sentAt: new Date().toISOString()
      });
    }
  });
```

---

## ⏳ BACKLOG ESTRUTURADO (não bloqueia 100%)

- 🤖 **WhatsApp Bot Meta API completo** (per `docs/whatsapp-bot-roadmap.md`)
  - Belinha hoje é via tunnel local. Pra escalar pra múltiplos números/franquias, migrar pra webhook Meta + Cloud Function direto. ~1 dia dev quando precisar.
- 💳 **Apple Wallet .pkpass nativo**
  - Hoje WalletPass entrega card visual + QR + download PNG. Pkpass nativo requer cert Apple Developer ($99/ano). ~2-3h dev quando comprar cert.

---

## 📊 SW Progression Final

v240 → v263 (23 deploys nesta sessão, zero downtime, 100% validado Chrome MCP).

## 🎯 Como confirmar 100% em produção

1. **Cardápio**: `https://milkypot.com/cardapio.html` → console deve mostrar:
   - `MpAnalytics`, `Roleta`, `StreakTracker`, `SharedCart`, `Reorder`, `WeatherPromo`, `MapsPicker`, `VoiceOrder`, `SocialHeatmap`, `ARPreview`, `PushSubscriber`, `DeliveryRules`, `GoogleReviewsWidget` = todos `object`
2. **Tracking**: criar pedido teste, abrir `/pedido.html?id=XXX` → ver timeline
3. **Quando status="entregue"**: ver 2 botões (Roleta + Selfie) + CTA Google
4. **Admin**: `/painel/google-reviews-config.html` → atualizar rating
5. **Clube**: `/clube.html` logado → ver botão "💳 Minha carteirinha" floating

## 🚀 Próximas vitórias (mensuráveis em 7 dias via GA4)

- **K-factor viral**: `shared_cart_joined / shared_cart_created`
- **Conversion review Google**: `google_review_returned / order_completed`
- **Retention Streak**: `streak_milestone_hit / total_customers`
- **Roleta engagement**: `roleta_spin / order_completed`
- **Push opt-in rate**: `push_subscribed / push_optin_shown`
