/* ============================================================
   MilkyPot Order Notifications — Cloud Functions
   ============================================================
   2 triggers ao status do pedido mudar em orders_log:

   1. notifyOrderStatusPush — envia FCM push pra cliente
      ("✓ Pedido confirmado", "🛵 Saiu pra entrega", etc.)

   2. notifyOrderDeliveredOutbox — quando entregue, cria doc
      em whatsapp_outbox/{id} pro servidor local da Belinha
      enviar mensagem via WhatsApp Business com:
      - Agradecimento
      - Link tracking
      - CTA Avalie no Google + raspinha PREMIUM

   Como deployar:
     cd functions/
     firebase deploy --only functions:notifyOrderStatusPush,functions:notifyOrderDeliveredOutbox

   Pre-requisitos:
     - push_subscriptions/{token} populado (FCM client subscribe ja existe)
     - whatsapp_outbox/{id} processado pelo servidor local Belinha
   ============================================================ */
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const REGION = "southamerica-east1";

const STATUS_MESSAGES = {
    aguardando_pagamento: { emoji: "💳", title: "Pedido recebido!", body: "Aguardando confirmação de pagamento." },
    novo: { emoji: "✓", title: "Pedido confirmado!", body: "Seu MilkyPot tá indo pra cozinha 🐑" },
    confirmado: { emoji: "✓", title: "Pedido confirmado!", body: "Seu MilkyPot tá indo pra cozinha 🐑" },
    preparando: { emoji: "🥤", title: "Tá montando seu sabor!", body: "Pedido em preparação — fica de olho aqui." },
    pronto: { emoji: "📦", title: "Pedido pronto!", body: "Acabou de sair da cozinha. ETA pra chegar: 8min." },
    em_entrega: { emoji: "🛵", title: "Saiu pra entrega!", body: "Tá a caminho. Acompanhe no link 👉" },
    em_rota: { emoji: "🛵", title: "Saiu pra entrega!", body: "Tá a caminho. Acompanhe no link 👉" },
    entregue: { emoji: "🎉", title: "Pedido entregue!", body: "Aproveite! Não esquece da roleta MilkyCoins 🎰" }
};

// ============================================================
// 1. PUSH NOTIFICATION POR ETAPA (FCM)
// ============================================================
exports.notifyOrderStatusPush = onDocumentUpdated(
    { document: "orders_log/{orderId}", region: REGION },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();
        if (!before || !after) return;
        if (before.status === after.status) return; // sem mudança de status

        const newStatus = after.status;
        const msg = STATUS_MESSAGES[newStatus];
        if (!msg) return;

        const customerPhone = (after.customer && after.customer.phone) || "";
        if (!customerPhone) return;

        // Busca FCM tokens do cliente (subscribed via push-subscriber.js)
        const db = admin.firestore();
        const tokensSnap = await db
            .collection("push_subscriptions")
            .where("customerPhone", "==", customerPhone)
            .where("active", "==", true)
            .get();

        if (tokensSnap.empty) {
            console.log(`[notifyOrderStatusPush] No FCM tokens for ${customerPhone}`);
            return;
        }

        const tokens = tokensSnap.docs.map((d) => d.id);
        const orderId = event.params.orderId;
        const trackingUrl = `https://milkypot.com/pedido.html?id=${encodeURIComponent(orderId)}`;

        const message = {
            notification: {
                title: `${msg.emoji} ${msg.title}`,
                body: msg.body
            },
            data: {
                orderId: orderId,
                status: newStatus,
                trackingUrl: trackingUrl,
                click_action: trackingUrl
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(
            `[notifyOrderStatusPush] order=${orderId} status=${newStatus} sent=${response.successCount}/${tokens.length}`
        );

        // Limpa tokens inválidos
        const invalidTokens = [];
        response.responses.forEach((r, i) => {
            if (!r.success) {
                const errCode = (r.error && r.error.code) || "";
                if (
                    errCode.includes("invalid-registration-token") ||
                    errCode.includes("registration-token-not-registered")
                ) {
                    invalidTokens.push(tokens[i]);
                }
            }
        });
        if (invalidTokens.length) {
            const batch = db.batch();
            invalidTokens.forEach((t) => {
                batch.update(db.collection("push_subscriptions").doc(t), { active: false });
            });
            await batch.commit();
            console.log(`[notifyOrderStatusPush] Marked ${invalidTokens.length} tokens inactive`);
        }
    }
);

// ============================================================
// 2. WHATSAPP OUTBOX PRO BELINHA (local server) ENVIAR
// ============================================================
//
// Quando pedido entregue, cria doc em whatsapp_outbox/{auto_id} com
// payload pro servidor local da Belinha (api/belinha-tunnel) processar
// e enviar via WhatsApp Business.
//
// Servidor local da Belinha precisa ter listener onCreate em
// whatsapp_outbox e mandar a mensagem via WhatsApp lib.
// ============================================================
exports.notifyOrderDeliveredOutbox = onDocumentUpdated(
    { document: "orders_log/{orderId}", region: REGION },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();
        if (!before || !after) return;
        if (before.status === "entregue") return; // ja era entregue antes
        if (after.status !== "entregue") return; // não virou entregue agora

        const customerPhone = (after.customer && after.customer.phone) || "";
        if (!customerPhone) return;

        const customerName = (after.customer && after.customer.name) || "Cliente";
        const orderId = event.params.orderId;
        const trackingUrl = `https://milkypot.com/pedido.html?id=${encodeURIComponent(orderId)}`;
        const reviewUrl = "https://g.page/r/CXrthQS1rgPdEAE/review";

        const message =
            `Olá ${customerName}! 🐑\n\n` +
            `Tudo certo com seu MilkyPot? 🍨\n\n` +
            `Adoraríamos saber o que achou! Se curtiu, dá um pulinho aqui pra avaliar a gente no Google ⭐\n\n` +
            `👉 ${reviewUrl}\n\n` +
            `E olha que legal: depois de avaliar, você ganha uma RASPINHA PREMIUM (prêmios maiores!) + 50 MilkyCoins 🪙✨\n\n` +
            `Acompanhe seu pedido + raspinha:\n` +
            `👉 ${trackingUrl}\n\n` +
            `Boa sobremesa! 🐑💕`;

        const db = admin.firestore();

        // Anti-duplicate: nao envia 2x pro mesmo pedido
        const existing = await db
            .collection("whatsapp_outbox")
            .where("orderId", "==", orderId)
            .where("type", "==", "review_request")
            .limit(1)
            .get();
        if (!existing.empty) {
            console.log(`[notifyOrderDeliveredOutbox] Already queued for ${orderId}`);
            return;
        }

        await db.collection("whatsapp_outbox").add({
            type: "review_request",
            orderId: orderId,
            customerPhone: customerPhone,
            customerName: customerName,
            message: message,
            scheduledFor: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // +5min
            createdAt: new Date().toISOString(),
            status: "pending",
            franchiseId: (after.store && after.store.id) || null
        });

        console.log(`[notifyOrderDeliveredOutbox] Queued review request for order=${orderId}`);
    }
);
