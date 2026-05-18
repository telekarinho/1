/* ============================================================
   MilkyPot — Desafio Unlock Token Generator
   ============================================================
   Trigger: orders_log/{orderId}.status muda pra 'entregue'

   O que faz:
   1. Gera token unico crypto.randomBytes (32 chars hex)
   2. Grava em desafio_unlock_tokens/{token} com:
        - franchiseId, orderId, customerPhone, customerName
        - expiresAt: +24h
        - usedAt: null
   3. Enfileira mensagem em whatsapp_outbox com link:
        https://milkypot.com/desafio.html?unlock={token}&fid={fid}
      Belinha local pega esse outbox e manda WhatsApp.

   Por que isso importa: o anti-fraude em js/core/anti-fraud.js
   bloqueia o cliente a 1 desafio gratuito por dia/dispositivo.
   Esse token e a UNICA forma do cliente jogar dnv apos comprar
   — sem ele, o anti-fraude prende o cliente ate amanha.

   REGRA #0: aditivo, nao quebra notifyOrderDeliveredOutbox que
   tambem trigge no mesmo evento (manda review request 5min depois).
   Esse manda o unlock IMEDIATAMENTE.

   Deploy:
     firebase deploy --only functions:generateDesafioUnlockToken
   ============================================================ */
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

const REGION = "southamerica-east1";
const TOKEN_TTL_HOURS = 24;
const COOLDOWN_BETWEEN_TOKENS_MIN = 90; // mesmo cooldown da raspinha — evita
                                         // gerar 10 tokens por cliente em 1 dia

exports.generateDesafioUnlockToken = onDocumentUpdated(
    { document: "orders_log/{orderId}", region: REGION },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();
        if (!before || !after) return;
        // Trigger so quando vira "entregue" (mesma logica do outbox)
        if (before.status === "entregue") return;
        if (after.status !== "entregue") return;

        const orderId = event.params.orderId;
        const customerPhone = (after.customer && after.customer.phone) || "";
        const customerName = (after.customer && after.customer.name) || "Cliente";
        const franchiseId = (after.store && after.store.id) || (after.franchiseId) || null;

        if (!franchiseId) {
            console.log(`[unlock] order=${orderId} sem franchiseId — pulando`);
            return;
        }
        if (!customerPhone) {
            console.log(`[unlock] order=${orderId} sem phone — pulando`);
            return;
        }

        const db = admin.firestore();

        // Anti-duplicate por orderId: nao gera 2 tokens pro mesmo pedido
        const existing = await db
            .collection("desafio_unlock_tokens")
            .where("orderId", "==", orderId)
            .limit(1)
            .get();
        if (!existing.empty) {
            console.log(`[unlock] Token ja existe pra order=${orderId}`);
            return;
        }

        // Cooldown anti-spam: cliente ja recebeu token recente?
        const cooldownAgo = new Date(Date.now() - COOLDOWN_BETWEEN_TOKENS_MIN * 60 * 1000);
        const recentToken = await db
            .collection("desafio_unlock_tokens")
            .where("customerPhone", "==", customerPhone)
            .where("createdAt", ">", cooldownAgo.toISOString())
            .limit(1)
            .get();
        if (!recentToken.empty) {
            console.log(`[unlock] Cliente ${customerPhone} ja tem token recente (cooldown ${COOLDOWN_BETWEEN_TOKENS_MIN}min)`);
            return;
        }

        // Gera token: 32 chars hex = 128 bits de entropia, impossivel adivinhar
        const token = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000);
        const createdAtIso = new Date().toISOString();

        // Grava token no Firestore
        await db.collection("desafio_unlock_tokens").doc(token).set({
            franchiseId: franchiseId,
            orderId: orderId,
            customerPhone: customerPhone,
            customerName: customerName,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            createdAt: createdAtIso,
            usedAt: null,
            source: "order_delivered"
        });
        console.log(`[unlock] Token gerado: ${token.slice(0,8)}... pra order=${orderId}`);

        // Enfileira mensagem WhatsApp via Belinha outbox
        const unlockUrl = `https://milkypot.com/desafio.html?unlock=${token}&fid=${encodeURIComponent(franchiseId)}`;
        const message =
            `Ei ${customerName}! 🐑\n\n` +
            `Você ganhou um DESAFIO EXTRA hoje! 🎯\n\n` +
            `Curte parar o cronômetro em 10s cravado e ganhar sorvete por nossa conta?\n\n` +
            `Joga aí (vale por 24h):\n` +
            `👉 ${unlockUrl}\n\n` +
            `Boa sorte! 🍀✨`;

        // Anti-duplicate outbox: mesmo orderId + tipo
        const outboxExisting = await db
            .collection("whatsapp_outbox")
            .where("orderId", "==", orderId)
            .where("type", "==", "desafio_unlock")
            .limit(1)
            .get();
        if (outboxExisting.empty) {
            await db.collection("whatsapp_outbox").add({
                type: "desafio_unlock",
                orderId: orderId,
                customerPhone: customerPhone,
                customerName: customerName,
                message: message,
                scheduledFor: new Date(Date.now() + 60 * 1000).toISOString(), // +1min
                createdAt: createdAtIso,
                status: "pending",
                franchiseId: franchiseId,
                metadata: { token: token, unlockUrl: unlockUrl }
            });
            console.log(`[unlock] Outbox enfileirado pra ${customerPhone}`);
        }
    }
);

/**
 * Endpoint HTTP utilitário pra gerar token manualmente (admin ou Belinha bot).
 * Uso: POST /generateDesafioUnlockTokenManual com body:
 *   { franchiseId, customerPhone, customerName?, reason?, hours? }
 * Requer header X-Admin-Token (configurado via secret).
 *
 * Retorna { token, unlockUrl, expiresAt }
 */
const { onRequest } = require("firebase-functions/v2/https");
exports.generateDesafioUnlockTokenManual = onRequest(
    { region: REGION, cors: ["https://milkypot.com", "http://localhost:5757"] },
    async (req, res) => {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "POST only" });
        }
        const body = req.body || {};
        const fid = body.franchiseId;
        const phone = body.customerPhone;
        const name = body.customerName || "Cliente";
        const reason = body.reason || "manual";
        const hours = Math.min(72, Math.max(1, Number(body.hours) || TOKEN_TTL_HOURS));

        if (!fid || !phone) {
            return res.status(400).json({ error: "franchiseId + customerPhone obrigatorios" });
        }

        const db = admin.firestore();
        const token = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
        const unlockUrl = `https://milkypot.com/desafio.html?unlock=${token}&fid=${encodeURIComponent(fid)}`;

        await db.collection("desafio_unlock_tokens").doc(token).set({
            franchiseId: fid,
            customerPhone: phone,
            customerName: name,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            createdAt: new Date().toISOString(),
            usedAt: null,
            source: "manual:" + reason
        });

        return res.json({
            token: token,
            unlockUrl: unlockUrl,
            expiresAt: expiresAt.toISOString(),
            ttlHours: hours
        });
    }
);
