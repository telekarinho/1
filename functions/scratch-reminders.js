/* ============================================================
   MilkyPot — Scratch Reminder Dispatcher
   ============================================================
   Trigger: pending_notifications/{notifId} criado com type='scratch_expiring'
   (gerado pelo cron notifyExpiringScratches 2x/dia 8h+18h BRT).

   O que faz:
   1. Calcula urgencia (dias restantes até expiresAt)
   2. Envia push FCM se cliente tem token em push_subscriptions
   3. Enfileira whatsapp_outbox pra Belinha local mandar
   4. Marca notif como 'sent' com timestamp

   Anti-dup:
   - cron notifyExpiringScratches ja tem dedup 18h via _lastReminderAt
   - aqui adicionamos dedup por shortCode no whatsapp_outbox (1 msg/raspinha)

   REGRA #0: aditivo. notifyExpiringScratches cron continua identico.
   So adicionamos o dispatcher que CONSOME a queue dele.

   Deploy:
     firebase deploy --only functions:dispatchScratchReminder
   ============================================================ */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const REGION = "southamerica-east1";

exports.dispatchScratchReminder = onDocumentCreated(
    { document: "pending_notifications/{notifId}", region: REGION },
    async (event) => {
        const data = (event.data && event.data.data()) || {};
        if (data.type !== "scratch_expiring") return;
        if (data.status && data.status !== "pending") return;

        const customerPhone = data.customerPhone || "";
        const customerName = (data.customerName || "").trim() || "Cliente";
        const prizeName = data.prizeName || "prêmio";
        const shortCode = data.shortCode || "";
        const fid = data.franchiseId || null;
        const expiresAt = data.expiresAt || "";

        if (!customerPhone || !shortCode) {
            console.log(`[scratch-reminder] notif=${event.params.notifId} sem phone/shortCode — pulando`);
            await event.data.ref.update({
                status: "skipped",
                reason: "no_phone_or_shortcode",
                skippedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
        }

        // Urgencia baseada em dias restantes
        let daysLeft = 0;
        if (expiresAt) {
            try {
                const expMs = new Date(expiresAt).getTime();
                daysLeft = Math.max(0, Math.ceil((expMs - Date.now()) / (24 * 3600 * 1000)));
            } catch (_) {}
        }
        const urgency =
            daysLeft <= 1 ? "⚠️ ÚLTIMO DIA" :
            daysLeft <= 2 ? "🔥 Faltam 2 dias" :
            daysLeft <= 4 ? `⏰ ${daysLeft} dias restantes` :
            `${daysLeft} dias`;

        const db = admin.firestore();
        let pushSent = 0;
        let outboxQueued = false;

        // 1. PUSH FCM (se cliente tem token registrado)
        try {
            const tokensSnap = await db.collection("push_subscriptions")
                .where("customerPhone", "==", customerPhone)
                .where("active", "==", true)
                .limit(10)
                .get();

            if (!tokensSnap.empty) {
                const tokens = tokensSnap.docs.map((d) => d.id);
                const msg = {
                    notification: {
                        title: `🎫 ${urgency}: Sua raspadinha`,
                        body: `${prizeName} — raspa antes que expire!`
                    },
                    data: {
                        type: "scratch_expiring",
                        shortCode: shortCode,
                        fid: String(fid || ""),
                        url: `/raspinha.html?code=${encodeURIComponent(shortCode)}`,
                        clickAction: `https://milkypot.com/raspinha.html?code=${encodeURIComponent(shortCode)}`
                    },
                    tokens: tokens
                };
                const result = await admin.messaging().sendEachForMulticast(msg);
                pushSent = result.successCount || 0;
                console.log(`[scratch-reminder] push: ${pushSent}/${tokens.length} pra ${customerPhone}`);
            }
        } catch (e) {
            console.warn(`[scratch-reminder] push falhou: ${e.message}`);
        }

        // 2. WHATSAPP OUTBOX (Belinha local consome e manda)
        try {
            // Anti-dup: ja tem outbox pendente pra essa raspinha?
            const existing = await db.collection("whatsapp_outbox")
                .where("type", "==", "scratch_expiring")
                .where("metadata.shortCode", "==", shortCode)
                .limit(1)
                .get();

            if (existing.empty) {
                const raspUrl = `https://milkypot.com/raspinha.html?code=${encodeURIComponent(shortCode)}`;
                const lastDay = daysLeft <= 1;
                const message =
                    `Ei ${customerName}! 🐑\n\n` +
                    (lastDay
                        ? `⚠️ HOJE é o ÚLTIMO DIA pra usar sua raspadinha!\n\n`
                        : `Sua raspadinha expira em ${daysLeft} dias.\n\n`) +
                    `Prêmio: ${prizeName}\n\n` +
                    `Raspa pelo celular agora:\n` +
                    `👉 ${raspUrl}\n\n` +
                    (lastDay
                        ? `Bora não perder essa! ⏰`
                        : `Volta na loja e usa antes que expire. 🎫`);

                await db.collection("whatsapp_outbox").add({
                    type: "scratch_expiring",
                    customerPhone: customerPhone,
                    customerName: customerName,
                    message: message,
                    scheduledFor: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    status: "pending",
                    franchiseId: fid,
                    metadata: {
                        shortCode: shortCode,
                        prizeName: prizeName,
                        daysLeft: daysLeft,
                        urgency: urgency
                    }
                });
                outboxQueued = true;
                console.log(`[scratch-reminder] outbox enfileirado pra ${customerPhone} — ${urgency}`);
            } else {
                console.log(`[scratch-reminder] outbox ja existe pra shortCode=${shortCode}`);
            }
        } catch (e) {
            console.warn(`[scratch-reminder] outbox falhou: ${e.message}`);
        }

        // 3. Marca notif como sent
        await event.data.ref.update({
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            pushSent: pushSent,
            outboxQueued: outboxQueued,
            daysLeft: daysLeft
        });
    }
);
