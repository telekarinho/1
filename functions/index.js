/* ============================================
   MilkyPot - Firebase Cloud Functions
   ============================================
   Backend seguro para operacoes criticas:
   - Custom Claims (roles)
   - Triggers de pedidos
   - Notificacoes
   ============================================ */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const UBER_ENCRYPTION_KEY = defineSecret("UBER_ENCRYPTION_KEY");
// Senha de app do Gmail (16 chars). Configurada via:
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
// Conta usada como remetente: milkypot.com@gmail.com
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
// Google Places API key — usada pra validar reviews automaticamente.
// Configurar via: firebase functions:secrets:set GOOGLE_PLACES_API_KEY
// Sem ela, o sistema cai pro fluxo manual (admin aprova na fila).
const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

// ============================================
// 1. SET CUSTOM CLAIMS (roles e franchiseId)
// ============================================
// Chamada pelo admin apos criar usuario
exports.setUserRole = onCall({
    region: "southamerica-east1"
}, async (request) => {
    // Verifica se quem chama e super_admin
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin pode definir roles");
    }

    const { uid, role, franchiseId } = request.data;
    if (!uid || !role) {
        throw new HttpsError("invalid-argument", "uid e role sao obrigatorios");
    }

    const validRoles = ["super_admin", "franchisee", "manager", "staff"];
    if (!validRoles.includes(role)) {
        throw new HttpsError("invalid-argument", "Role invalido: " + role);
    }

    // Define custom claims
    const claims = { role };
    if (franchiseId) claims.franchiseId = franchiseId;

    await auth.setCustomUserClaims(uid, claims);

    // Registra no audit log
    await db.collection("audit_log").add({
        event: "auth.role_set",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: request.auth.uid,
        details: { targetUid: uid, role, franchiseId },
    });

    return { success: true, message: `Role ${role} definido para ${uid}` };
});

// ============================================
// MILKYCLUBE: MilkyPass de carimbos
// ============================================
// Concede 1 carimbo ao cliente identificado no PDV apos uma venda real.
exports.clubGrantMilkyPassStamp = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const role = request.auth.token.role;
    if (!["super_admin", "franchisee", "manager", "staff"].includes(role)) {
        throw new HttpsError("permission-denied", "Sem permissao para conceder MilkyPass");
    }

    const { memberId, orderId, franchiseId, total } = request.data || {};
    if (!memberId || !orderId) {
        throw new HttpsError("invalid-argument", "memberId e orderId sao obrigatorios");
    }

    const totalBRL = Number(total || 0);
    const nowIso = new Date().toISOString();
    const cfgSnap = await db.collection("club_config").doc("global").get();
    const cfg = cfgSnap.exists ? (cfgSnap.data() || {}) : {};
    const passCfg = Object.assign({
        enabled: true,
        stampsRequired: 5,
        minOrder: 0,
        rewardType: "scratch_bonus",
        rewardLabel: "Raspinha bonus",
        resetOnComplete: true
    }, cfg.milkyPass || {});

    if (passCfg.enabled === false) {
        return { success: true, skipped: true, reason: "disabled" };
    }

    const minOrder = Number(passCfg.minOrder || 0);
    if (totalBRL < minOrder) {
        return { success: true, skipped: true, reason: "below_min_order" };
    }

    const required = Math.max(1, parseInt(passCfg.stampsRequired || 5, 10) || 5);
    const memberRef = db.collection("club_members").doc(memberId);

    const result = await db.runTransaction(async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists) {
            throw new HttpsError("not-found", "Cliente MilkyClube nao encontrado");
        }

        const member = memberSnap.data() || {};
        const pass = member.milkyPass || {};
        const current = Math.max(0, parseInt(pass.current || 0, 10) || 0);
        const next = current + 1;
        const completed = next >= required;
        const nextCurrent = completed && passCfg.resetOnComplete !== false ? 0 : Math.min(next, required);
        let pending = Array.isArray(member.pendingPassRewards) ? member.pendingPassRewards.slice() : [];
        let reward = null;

        if (completed) {
            reward = {
                id: `pass_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
                type: passCfg.rewardType || "scratch_bonus",
                label: passCfg.rewardLabel || "Raspinha bonus",
                orderId,
                franchiseId: franchiseId || request.auth.token.franchiseId || null,
                createdAt: nowIso,
                redeemedAt: null
            };
            pending.push(reward);
            pending = pending.slice(-20);
        }

        const update = {
            milkyPass: {
                current: nextCurrent,
                required,
                totalStamps: (pass.totalStamps || 0) + 1,
                totalCompleted: (pass.totalCompleted || 0) + (completed ? 1 : 0),
                lastStampAt: nowIso,
                lastOrderId: orderId,
                lastRewardAt: completed ? nowIso : (pass.lastRewardAt || null)
            },
            updatedAt: nowIso
        };
        if (completed) update.pendingPassRewards = pending;

        tx.update(memberRef, update);
        return { current: nextCurrent, required, completed, reward };
    });

    await db.collection("club_pass_events").add({
        memberId,
        orderId,
        franchiseId: franchiseId || request.auth.token.franchiseId || null,
        total: totalBRL,
        result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid
    });

    return { success: true, ...result };
});

// ============================================
// 1.5. CLUB RESOLVE CREDITS
// ============================================
// Lê TODOS os créditos disponíveis pra um membro MilkyClube em uma chamada:
// - Saldo MilkyCoins (cashback)
// - Progresso MilkyPass + prêmios pendentes
// - Raspinhas não resgatadas (com prêmio + validade)
// - Vouchers de Desafio não usados
// - Tier atual
// Usado pelo PDV pra mostrar o que o cliente tem disponível pra abater no
// pagamento. Apenas LEITURA — não muda nada. Idempotente.
exports.clubResolveCredits = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    const role = request.auth.token.role;
    if (!["super_admin", "franchisee", "manager", "staff"].includes(role)) {
        throw new HttpsError("permission-denied", "Sem permissao para consultar créditos");
    }

    const { memberId, franchiseId } = request.data || {};
    if (!memberId) {
        throw new HttpsError("invalid-argument", "memberId obrigatorio");
    }

    // 1. Lê o doc do membro
    const memberSnap = await db.collection("club_members").doc(memberId).get();
    if (!memberSnap.exists) {
        throw new HttpsError("not-found", "Membro MilkyClube nao encontrado");
    }
    const member = memberSnap.data() || {};
    const phone = (member.phone || "").replace(/\D/g, "");

    // 2. MilkyCoins + tier (direto do member doc)
    const coins = Number(member.coins || 0);
    const tier = member.tier || "leite";
    const tierProgress = member.tierProgress || {};

    // 3. MilkyPass: progress + prêmios pendentes
    const milkyPass = member.milkyPass || { current: 0, required: 5 };
    const pendingPassRewards = (member.pendingPassRewards || []).filter(r => !r.redeemedAt);

    // 4. Raspinhas: query por customerKey (telefone normalizado)
    let scratches = [];
    if (phone) {
        try {
            const scratchSnap = await db.collection("scratches")
                .where("customerKey", "==", phone)
                .where("status", "in", ["scratched", "not_scratched"])
                .limit(20).get();
            const nowMs = Date.now();
            scratches = scratchSnap.docs.map(d => {
                const data = d.data() || {};
                const expiresMs = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
                return {
                    code: d.id,
                    status: data.status,
                    prizeId: data.prizeId,
                    prizeName: data.prizeName,
                    prizeDesc: data.prizeDesc,
                    prizeCategoria: data.prizeCategoria,
                    minOrder: data.minOrder || 0,
                    expiresAt: data.expiresAt,
                    expired: expiresMs > 0 && expiresMs < nowMs,
                    scratchedAt: data.scratchedAt
                };
            }).filter(s => !s.expired); // só raspinhas válidas
        } catch (e) {
            console.warn("scratches query failed:", e && e.message);
        }
    }

    // 5. Vouchers de Desafio: por playerPhone
    let desafioVouchers = [];
    if (phone) {
        try {
            const voucherSnap = await db.collection("desafio_vouchers")
                .where("playerPhone", "==", phone)
                .where("used", "==", false)
                .limit(10).get();
            desafioVouchers = voucherSnap.docs.map(d => {
                const data = d.data() || {};
                return {
                    code: d.id,
                    prize: data.prize || null,
                    prizeLabel: data.prizeLabel || data.prize || "",
                    discountValue: Number(data.discountValue || 0),
                    discountType: data.discountType || null, // 'fixed' | 'percent' | 'item'
                    attemptsRemaining: Math.max(0, (data.attempts || 1) - (data.attemptsUsed || 0)),
                    expiresAt: data.expiresAt || null
                };
            });
        } catch (e) {
            console.warn("desafio_vouchers query failed:", e && e.message);
        }
    }

    return {
        success: true,
        memberId,
        member: {
            name: member.name || "",
            phone: member.phone || "",
            email: member.email || "",
            coins,
            tier,
            tierProgress,
            ordersCount: member.ordersCount || 0,
            totalSpent: member.totalSpent || 0
        },
        credits: {
            coins,
            milkyPass: {
                current: milkyPass.current || 0,
                required: milkyPass.required || 5,
                pendingRewards: pendingPassRewards
            },
            scratches,
            desafioVouchers
        },
        franchiseId: franchiseId || null,
        fetchedAt: new Date().toISOString()
    };
});

// ============================================
// 1.6. ACTION CLAIMS (Earn-before-claim engine)
// ============================================
// Cliente realiza ação (review Google, story IG, opt-in WhatsApp, etc)
// e reivindica recompensa. Sistema valida (auto/manual) e libera.
//
// Schema de /action_claims/{claimId}:
//   memberId: string
//   franchiseId: string?
//   action: 'google_review' | 'instagram_story' | 'tiktok_post'
//         | 'whatsapp_optin' | 'birthday_set' | 'referral_converted'
//         | 'pwa_notif_optin' | 'ugc_photo'
//   rewardType: 'raspinha_premium' | 'milkypass_stamp' | 'milkycoins'
//             | 'cashback_multiplier' | 'free_item'
//   rewardValue: number (coins, stamps, multiplicador)
//   status: 'pending' | 'verified' | 'rejected' | 'expired'
//   verificationMethod: 'auto_places_api' | 'manual_admin' | 'time_based' | 'instant'
//   payload: { scratchCode?, igMediaUrl?, screenshotUrl?, referrerCode?, ... }
//   claimedAt: ISO
//   verifiedAt: ISO?
//   appliedAt: ISO?
//   appliedRewardRefs: { coinsTxId?, scratchCode?, stampEventId? }
//   expiresAt: ISO (24-72h)
// ============================================

const ACTION_REWARDS = {
    google_review:    { type: 'raspinha_premium', value: 50,  coinsBonus: 50,  verify: 'auto_places_api',  expiresInH: 48 },
    instagram_story:  { type: 'raspinha_premium', value: 30,  coinsBonus: 30,  verify: 'manual_admin',     expiresInH: 24 },
    tiktok_post:      { type: 'milkycoins',       value: 100,                  verify: 'manual_admin',     expiresInH: 72 },
    whatsapp_optin:   { type: 'milkycoins',       value: 50,                   verify: 'instant',          expiresInH: 0 },
    birthday_set:     { type: 'milkycoins',       value: 30,                   verify: 'instant',          expiresInH: 0 },
    pwa_notif_optin:  { type: 'milkycoins',       value: 25,                   verify: 'instant',          expiresInH: 0 },
    referral_converted:{ type: 'milkypass_stamp', value: 2,   coinsBonus: 100, verify: 'auto_order_link',  expiresInH: 0 },
    ugc_photo:        { type: 'milkycoins',       value: 50,                   verify: 'manual_admin',     expiresInH: 48 }
};

function _genClaimId() {
    return 'claim_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

// 1.6.1 — claimAction: cliente reivindica uma ação
// Cliente identificado chama isso, sistema cria o claim com status 'pending'
// (ou 'verified' direto se for instant). Helper applyClaimReward é chamado em
// follow-up se o claim virou verified.
exports.claimAction = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth necessaria");

    const { memberId, action, payload, franchiseId } = request.data || {};
    if (!memberId || !action) {
        throw new HttpsError("invalid-argument", "memberId e action obrigatorios");
    }
    const cfg = ACTION_REWARDS[action];
    if (!cfg) throw new HttpsError("invalid-argument", "action desconhecida: " + action);

    // Verifica se membro existe
    const memberRef = db.collection("club_members").doc(memberId);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) throw new HttpsError("not-found", "Membro nao encontrado");

    // Anti-fraude: dedup de claims pendentes da mesma ação nas últimas 24h
    const dedupSince = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recentSnap = await db.collection("action_claims")
        .where("memberId", "==", memberId)
        .where("action", "==", action)
        .where("claimedAt", ">=", dedupSince)
        .where("status", "in", ["pending", "verified"])
        .limit(1).get();
    if (!recentSnap.empty) {
        const existing = recentSnap.docs[0];
        return {
            success: true,
            duplicate: true,
            claimId: existing.id,
            claim: existing.data(),
            message: "Você já tem um claim ativo dessa ação nas últimas 24h"
        };
    }

    const nowIso = new Date().toISOString();
    const expiresInMs = (cfg.expiresInH || 24) * 3600 * 1000;
    const claimId = _genClaimId();
    const initialStatus = cfg.verify === 'instant' ? 'verified' : 'pending';

    const claim = {
        id: claimId,
        memberId,
        franchiseId: franchiseId || null,
        action,
        rewardType: cfg.type,
        rewardValue: cfg.value,
        coinsBonus: cfg.coinsBonus || 0,
        status: initialStatus,
        verificationMethod: cfg.verify,
        payload: payload || {},
        claimedAt: nowIso,
        verifiedAt: initialStatus === 'verified' ? nowIso : null,
        appliedAt: null,
        appliedRewardRefs: {},
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
        createdBy: request.auth.uid
    };

    await db.collection("action_claims").doc(claimId).set(claim);

    // Se já verified (instant), aplica recompensa imediatamente
    let applyResult = null;
    if (initialStatus === 'verified') {
        applyResult = await _applyClaimReward(claimId);
    }

    return {
        success: true,
        claimId,
        claim,
        applied: applyResult
    };
});

// 1.6.2 — verifyClaim: aprovação manual (admin) ou trigger pós-verificação
exports.verifyClaim = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth necessaria");
    const role = request.auth.token.role;
    if (!["super_admin", "franchisee", "manager"].includes(role)) {
        throw new HttpsError("permission-denied", "Sem permissao");
    }

    const { claimId, approved, rejectionReason } = request.data || {};
    if (!claimId) throw new HttpsError("invalid-argument", "claimId obrigatorio");

    const ref = db.collection("action_claims").doc(claimId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Claim nao encontrado");
    const claim = snap.data() || {};
    if (claim.status !== 'pending') {
        return { success: false, error: 'Claim ja processado: ' + claim.status };
    }

    if (approved === false) {
        await ref.update({
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason || 'sem motivo informado',
            verifiedBy: request.auth.uid
        });
        return { success: true, status: 'rejected' };
    }

    await ref.update({
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: request.auth.uid
    });

    const applyResult = await _applyClaimReward(claimId);
    return { success: true, status: 'verified', applied: applyResult };
});

// 1.6.3 — Helper interno: aplica a recompensa do claim no membro
async function _applyClaimReward(claimId) {
    const ref = db.collection("action_claims").doc(claimId);
    const snap = await ref.get();
    if (!snap.exists) return { error: 'claim nao existe' };
    const c = snap.data() || {};
    if (c.status !== 'verified') return { error: 'claim nao verified' };
    if (c.appliedAt) return { error: 'ja aplicado', appliedAt: c.appliedAt };

    const memberRef = db.collection("club_members").doc(c.memberId);
    const refs = {};
    const nowIso = new Date().toISOString();

    // 1) MilkyCoins (coinsBonus + se rewardType == milkycoins, soma rewardValue)
    let totalCoins = (c.coinsBonus || 0);
    if (c.rewardType === 'milkycoins') totalCoins += (c.rewardValue || 0);
    if (totalCoins > 0) {
        await db.runTransaction(async tx => {
            const m = await tx.get(memberRef);
            if (!m.exists) throw new Error("member missing");
            const cur = Number((m.data() || {}).coins || 0);
            tx.update(memberRef, {
                coins: cur + totalCoins,
                totalEarned: ((m.data() || {}).totalEarned || 0) + totalCoins,
                updatedAt: nowIso
            });
        });
        const txDoc = {
            memberId: c.memberId,
            type: 'earn',
            amount: totalCoins,
            source: 'action_claim',
            claimId,
            action: c.action,
            createdAt: nowIso
        };
        const txRef = await db.collection("milkycoins_transactions").add(txDoc);
        refs.coinsTxId = txRef.id;
    }

    // 2) MilkyPass stamps (se rewardType == milkypass_stamp)
    if (c.rewardType === 'milkypass_stamp' && c.rewardValue > 0) {
        const stamps = parseInt(c.rewardValue, 10) || 1;
        const stampEventIds = [];
        for (let i = 0; i < stamps; i++) {
            // Reusa lógica de clubGrantMilkyPassStamp via stamp manual
            // Simplificado: incrementa direto. Cron periódico checa se completou.
            const evt = await db.collection("club_pass_events").add({
                memberId: c.memberId,
                franchiseId: c.franchiseId,
                source: 'action_claim',
                claimId,
                action: c.action,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            stampEventIds.push(evt.id);
            // Incrementa current
            await db.runTransaction(async tx => {
                const m = await tx.get(memberRef);
                if (!m.exists) return;
                const data = m.data() || {};
                const pass = data.milkyPass || { current: 0, required: 5 };
                const next = (pass.current || 0) + 1;
                const required = pass.required || 5;
                const completed = next >= required;
                let pending = Array.isArray(data.pendingPassRewards) ? data.pendingPassRewards.slice() : [];
                if (completed) {
                    pending.push({
                        id: 'pass_' + Date.now().toString(36),
                        type: 'scratch_bonus',
                        label: 'MilkyPass via ação',
                        action: c.action,
                        createdAt: nowIso,
                        redeemedAt: null
                    });
                }
                tx.update(memberRef, {
                    'milkyPass.current': completed ? 0 : next,
                    'milkyPass.required': required,
                    'milkyPass.totalStamps': (pass.totalStamps || 0) + 1,
                    'milkyPass.totalCompleted': (pass.totalCompleted || 0) + (completed ? 1 : 0),
                    'milkyPass.lastStampAt': nowIso,
                    pendingPassRewards: pending,
                    updatedAt: nowIso
                });
            });
        }
        refs.stampEventIds = stampEventIds;
    }

    // 3) Raspinha PREMIUM (se rewardType == raspinha_premium)
    // Marca um upgrade flag no member — frontend cria scratch com tier elevado
    // ao detectar pendingPremiumScratch > 0
    if (c.rewardType === 'raspinha_premium') {
        await memberRef.update({
            pendingPremiumScratches: admin.firestore.FieldValue.increment(1),
            lastPremiumGrantedAt: nowIso
        });
        refs.premiumScratchPending = true;
    }

    await ref.update({
        appliedAt: nowIso,
        appliedRewardRefs: refs
    });

    return { applied: true, refs, totalCoins };
}

// ============================================
// 1.6.4 — Cron de validação automática de reviews Google
// ============================================
// Roda a cada 6h. Pra cada claim google_review pending:
// 1. Busca place details via Places API (Place ID hardcoded ou em config)
// 2. Pega últimas reviews
// 3. Tenta matching por nome do membro (fuzzy) + tempo (review depois do claim)
// 4. Se match, chama _applyClaimReward
// 5. Se claim mais antigo que 48h sem match, expira (status=expired)
//
// Sem GOOGLE_PLACES_API_KEY configurado, só expira velhas. Caminho manual continua via /admin/recompensas-claims.
// ============================================

const MILKYPOT_PLACE_ID = "ChIJsfGiFihF65QReu2FBLWuA90"; // Place ID do Google Maps (extraído de g.page/r/CXrthQS1rgPdEAE/review). Admin pode sobrescrever em club_config/google_places.
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place/details/json";

function _normalizeName(name) {
    return String(name || "")
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
}

function _nameMatches(memberName, reviewAuthorName) {
    if (!memberName || !reviewAuthorName) return false;
    var mNorm = _normalizeName(memberName);
    var rNorm = _normalizeName(reviewAuthorName);
    if (!mNorm || !rNorm) return false;
    if (mNorm === rNorm) return true;
    // Match parcial: primeiro+último nome do membro presentes na review
    var memParts = mNorm.split(/\s+/).filter(Boolean);
    if (memParts.length >= 2) {
        var first = memParts[0];
        var last = memParts[memParts.length - 1];
        if (first.length >= 3 && last.length >= 3 && rNorm.includes(first) && rNorm.includes(last)) return true;
    }
    // Match por primeiro nome se tem 4+ chars
    if (memParts[0] && memParts[0].length >= 4 && rNorm.startsWith(memParts[0])) return true;
    return false;
}

async function _fetchGoogleReviews(apiKey, placeId) {
    if (!apiKey) return null;
    var url = PLACES_API_URL + "?place_id=" + encodeURIComponent(placeId)
        + "&fields=reviews,name,user_ratings_total&key=" + encodeURIComponent(apiKey);
    try {
        var res = await fetch(url);
        if (!res.ok) {
            console.warn("Places API HTTP", res.status);
            return null;
        }
        var json = await res.json();
        if (json.status !== "OK") {
            console.warn("Places API status:", json.status, json.error_message);
            return null;
        }
        return (json.result && json.result.reviews) || [];
    } catch (e) {
        console.error("Places API fetch error:", e.message);
        return null;
    }
}

exports.verifyGoogleReviewsCron = onSchedule({
    schedule: "every 6 hours",
    region: "southamerica-east1",
    secrets: [GOOGLE_PLACES_API_KEY],
    timeoutSeconds: 300,
    memory: "256MiB"
}, async () => {
    console.log("[verifyGoogleReviewsCron] start");

    // Busca claims pending de google_review
    var pendingSnap = await db.collection("action_claims")
        .where("action", "==", "google_review")
        .where("status", "==", "pending")
        .limit(50).get();

    if (pendingSnap.empty) {
        console.log("[verifyGoogleReviewsCron] sem claims pendentes");
        return;
    }

    // Tenta API key
    var apiKey = null;
    try { apiKey = GOOGLE_PLACES_API_KEY.value(); } catch (_) {}

    // Place ID dinâmico (config global pode sobrescrever)
    var placeId = MILKYPOT_PLACE_ID;
    try {
        var cfgSnap = await db.collection("club_config").doc("google_places").get();
        if (cfgSnap.exists) {
            var c = cfgSnap.data() || {};
            if (c.placeId) placeId = c.placeId;
        }
    } catch (_) {}

    var reviews = null;
    if (apiKey && placeId && !placeId.includes("REPLACE_WITH_REAL")) {
        reviews = await _fetchGoogleReviews(apiKey, placeId);
        console.log("[verifyGoogleReviewsCron] fetched", reviews ? reviews.length : 0, "reviews");
    } else {
        console.log("[verifyGoogleReviewsCron] sem GOOGLE_PLACES_API_KEY ou placeId — só expira velhos");
    }

    var stats = { processed: 0, matched: 0, expired: 0, kept: 0 };
    var nowMs = Date.now();

    for (var i = 0; i < pendingSnap.docs.length; i++) {
        var doc = pendingSnap.docs[i];
        var c = doc.data() || {};
        stats.processed++;

        // Expira se passou de 48h sem validação
        var claimedMs = c.claimedAt ? new Date(c.claimedAt).getTime() : nowMs;
        var ageH = (nowMs - claimedMs) / 3600000;

        if (reviews && reviews.length) {
            // Tenta match
            var memberSnap = await db.collection("club_members").doc(c.memberId).get();
            var memberName = memberSnap.exists ? (memberSnap.data().name || "") : "";

            var matched = null;
            for (var r = 0; r < reviews.length; r++) {
                var rev = reviews[r];
                var revTime = (rev.time || 0) * 1000; // unix sec → ms
                if (revTime > 0 && revTime < claimedMs - 24 * 3600000) continue; // review muito antiga
                if (_nameMatches(memberName, rev.author_name)) {
                    matched = rev;
                    break;
                }
            }

            if (matched) {
                await doc.ref.update({
                    status: "verified",
                    verifiedAt: new Date().toISOString(),
                    verificationMethod: "auto_places_api",
                    payload: Object.assign({}, c.payload || {}, {
                        matchedReviewAuthor: matched.author_name,
                        matchedReviewRating: matched.rating,
                        matchedReviewText: (matched.text || "").substring(0, 500),
                        matchedReviewTime: new Date((matched.time || 0) * 1000).toISOString()
                    })
                });
                await _applyClaimReward(doc.id);
                stats.matched++;
                console.log("[verifyGoogleReviewsCron] matched", c.memberId, "→", matched.author_name);
                continue;
            }
        }

        if (ageH > 48) {
            await doc.ref.update({
                status: "expired",
                expiredAt: new Date().toISOString(),
                expirationReason: reviews ? "no_match_in_48h" : "no_api_key_48h"
            });
            stats.expired++;
        } else {
            stats.kept++;
        }
    }

    console.log("[verifyGoogleReviewsCron] done", stats);
});

// ============================================
// 2. SETUP INICIAL DO OWNER
// ============================================
// Seta o primeiro admin (owner) como super_admin
exports.setupOwner = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const OWNER_EMAIL = "jocimarrodrigo@gmail.com";
    const user = await auth.getUser(request.auth.uid);

    if (user.email !== OWNER_EMAIL) {
        throw new HttpsError("permission-denied", "Apenas o owner pode executar o setup inicial");
    }

    // Verifica se ja tem claims
    if (user.customClaims && user.customClaims.role === "super_admin") {
        return { success: true, message: "Owner ja configurado como super_admin" };
    }

    await auth.setCustomUserClaims(request.auth.uid, {
        role: "super_admin",
    });

    await db.collection("audit_log").add({
        event: "auth.owner_setup",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: request.auth.uid,
        details: { email: OWNER_EMAIL },
    });

    return { success: true, message: "Owner configurado como super_admin. Faca logout e login novamente." };
});

// ============================================
// 3. TRIGGER: Novo(s) pedido(s) criado(s) — usa onDocumentWritten
// ============================================
// FIX RACE: a versao anterior usava onDocumentCreated + orders[orders.length-1].
// Bug: (a) onDocumentCreated so dispara UMA vez no create do doc inteiro
// (subsequente updates do array nao disparavam); (b) com 2 PDVs gravando
// em paralelo, o "ultimo do array" podia ser processado 2x.
//
// Agora: onDocumentWritten + diff (before vs after) processa SO os pedidos
// novos por id, e quotas a TOP 10 mais recentes pra evitar reprocessar
// historico no primeiro create.
exports.onOrderCreated = onDocumentWritten({
    document: "datastore/{docId}",
    region: "southamerica-east1"
}, async (event) => {
    const docId = event.params.docId;
    if (!docId.startsWith("orders_")) return;

    const afterData = event.data?.after?.data();
    if (!afterData || !afterData.value) return;

    const beforeData = event.data?.before?.data();

    let afterOrders = [];
    let beforeOrders = [];
    try {
        afterOrders = JSON.parse(afterData.value) || [];
        if (beforeData && beforeData.value) {
            beforeOrders = JSON.parse(beforeData.value) || [];
        }
    } catch (e) {
        console.error("onOrderCreated parse error:", e);
        return;
    }
    if (!Array.isArray(afterOrders)) return;

    // Identifica pedidos novos por id (diff)
    const beforeIds = new Set(beforeOrders.map(o => o && o.id).filter(Boolean));
    const newOrders = afterOrders.filter(o => o && o.id && !beforeIds.has(o.id));

    // Hard cap: no primeiro create (beforeOrders vazio), so processa os 10
    // mais recentes pra evitar inundar de notificacoes historicas.
    const toProcess = (beforeOrders.length === 0)
        ? newOrders.slice(-10)
        : newOrders;

    if (toProcess.length === 0) return;

    const franchiseId = docId.replace("orders_", "");

    for (const order of toProcess) {
        try {
            console.log(`Novo pedido: ${order.id} franquia ${franchiseId} total=${order.total}`);
            // Aqui poderia:
            // - Enviar notificacao push para o franqueado
            // - Enviar email de confirmacao para o cliente
            // - Atualizar metricas em tempo real
        } catch (e) {
            console.error(`onOrderCreated process error order=${order.id}:`, e);
        }
    }
});

// ============================================
// 4. CRIAR USUARIO COM ROLE (admin endpoint)
// ============================================
exports.createUserWithRole = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin pode criar usuarios");
    }

    const { email, name, password, role, franchiseId } = request.data;

    if (!email || !name || !role) {
        throw new HttpsError("invalid-argument", "email, name e role sao obrigatorios");
    }

    try {
        // Cria usuario no Firebase Auth
        const userRecord = await auth.createUser({
            email,
            displayName: name,
            password: password || generatePassword(),
            emailVerified: false,
        });

        // Define custom claims
        const claims = { role };
        if (franchiseId) claims.franchiseId = franchiseId;
        await auth.setCustomUserClaims(userRecord.uid, claims);

        // Salva perfil no Firestore
        await db.collection("users").doc(userRecord.uid).set({
            email,
            name,
            role,
            franchiseId: franchiseId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
        });

        // Audit log
        await db.collection("audit_log").add({
            event: "auth.user_created",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: request.auth.uid,
            details: { targetUid: userRecord.uid, email, role, franchiseId },
        });

        return {
            success: true,
            uid: userRecord.uid,
            email,
            message: `Usuario ${email} criado com role ${role}`,
        };
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

// ============================================
// 5. DELETAR USUARIO (admin endpoint)
// ============================================
exports.deleteUserAccount = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin pode deletar usuarios");
    }

    const { uid } = request.data;
    if (!uid) {
        throw new HttpsError("invalid-argument", "uid e obrigatorio");
    }

    // Nao permite deletar a si mesmo
    if (uid === request.auth.uid) {
        throw new HttpsError("failed-precondition", "Nao e possivel deletar sua propria conta");
    }

    // Verifica se o alvo nao e super_admin
    const targetUser = await auth.getUser(uid);
    if (targetUser.customClaims && targetUser.customClaims.role === "super_admin") {
        throw new HttpsError("failed-precondition", "Nao e possivel deletar outro super_admin");
    }

    try {
        await auth.deleteUser(uid);
        await db.collection("users").doc(uid).delete();

        await db.collection("audit_log").add({
            event: "auth.user_deleted",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: request.auth.uid,
            details: { deletedUid: uid, deletedEmail: targetUser.email },
        });

        return { success: true, message: `Usuario ${targetUser.email} deletado` };
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

// ============================================
// 6. OBTER CLAIMS DO USUARIO ATUAL
// ============================================
exports.getMyRole = onCall({
    region: "southamerica-east1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    const user = await auth.getUser(request.auth.uid);
    return {
        uid: user.uid,
        email: user.email,
        role: user.customClaims?.role || null,
        franchiseId: user.customClaims?.franchiseId || null,
    };
});

// ============================================
// Helper: gera senha aleatoria
// ============================================
function generatePassword(length = 12) {
    const crypto = require("crypto");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    const bytes = crypto.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(bytes[i] % chars.length);
    }
    return password;
}

// ============================================
// 7. FISCAL BACKEND (Firebase native)
// ============================================

function assertAuthenticated(request) {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
}

function getFiscalContext(request, requestedFranchiseId = null) {
    assertAuthenticated(request);

    const role = request.auth.token.role || null;
    const ownFranchiseId = request.auth.token.franchiseId || null;
    const isSuperAdmin = role === "super_admin";
    const allowedRoles = ["super_admin", "franchisee", "manager"];

    if (!allowedRoles.includes(role)) {
        throw new HttpsError("permission-denied", "Perfil sem permissao para o modulo fiscal");
    }

    const franchiseId = isSuperAdmin
        ? (requestedFranchiseId || ownFranchiseId || null)
        : ownFranchiseId;

    if (!franchiseId) {
        throw new HttpsError("failed-precondition", "Franquia nao identificada no usuario autenticado");
    }

    return { franchiseId, role, isSuperAdmin };
}

function getFiscalConfigRef(franchiseId) {
    return db.collection("franchises").doc(franchiseId).collection("fiscal").doc("config");
}

function getFiscalNotesCollection(franchiseId) {
    return db.collection("franchises").doc(franchiseId).collection("fiscal_notes");
}

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeConfig(input = {}) {
    const endereco = input.endereco || {};
    const nfce = input.nfce || {};
    const provider = input.provider || {};

    return {
        cnpj: normalizeString(input.cnpj).replace(/\D/g, ""),
        razaoSocial: normalizeString(input.razaoSocial),
        nomeFantasia: normalizeString(input.nomeFantasia),
        inscricaoEstadual: normalizeString(input.inscricaoEstadual),
        regimeTributario: normalizeString(input.regimeTributario) || "1",
        endereco: {
            cep: normalizeString(endereco.cep),
            logradouro: normalizeString(endereco.logradouro),
            numero: normalizeString(endereco.numero),
            complemento: normalizeString(endereco.complemento),
            bairro: normalizeString(endereco.bairro),
            cidade: normalizeString(endereco.cidade),
            uf: normalizeString(endereco.uf).toUpperCase(),
            codigoIbge: normalizeString(endereco.codigoIbge)
        },
        nfce: {
            ambiente: nfce.ambiente === "producao" ? "producao" : "homologacao",
            serie: Number.parseInt(nfce.serie, 10) || 1,
            proximoNumero: Number.parseInt(nfce.proximoNumero, 10) || 1,
            cscId: normalizeString(nfce.cscId),
            cscToken: normalizeString(nfce.cscToken)
        },
        provider: {
            type: normalizeString(provider.type),
            apiKey: normalizeString(provider.apiKey),
            baseUrl: normalizeString(provider.baseUrl)
        },
        apiKey: normalizeString(input.apiKey)
    };
}

function validateFiscalConfig(config) {
    if (!config.cnpj || config.cnpj.length !== 14) {
        throw new HttpsError("invalid-argument", "CNPJ invalido");
    }
    if (!config.razaoSocial) {
        throw new HttpsError("invalid-argument", "Razao social obrigatoria");
    }
}

function getEncryptionKey() {
    const raw = process.env.FISCAL_ENCRYPTION_KEY || process.env.GCLOUD_PROJECT || "milkypot-fiscal-default";
    return crypto.createHash("sha256").update(raw).digest();
}

function encryptSecret(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function sanitizeCertificateMeta(certificate = null) {
    if (!certificate) {
        return { installed: false, valid: false, status: "missing" };
    }
    return {
        installed: true,
        valid: certificate.status === "uploaded",
        status: certificate.status || "uploaded",
        fileName: certificate.fileName || "",
        size: certificate.size || 0,
        uploadedAt: certificate.uploadedAt || null,
        uploadedBy: certificate.uploadedBy || null,
        message: certificate.message || "Certificado salvo no Firebase"
    };
}

function sanitizeNote(doc) {
    const data = doc.data();
    return {
        id: doc.id,
        numero: data.numero || "-",
        tipo: data.tipo || "nfce",
        data: data.dataEmissao || data.createdAt || new Date().toISOString(),
        cliente: data.cliente?.nome || "Consumidor",
        valor: data.total || 0,
        status: data.status || "pendente",
        chave: data.chave || "",
        protocolo: data.protocolo || "",
        erro: data.erro || "",
        items: data.items || [],
        formaPagamento: data.formaPagamento || "",
        source: data.source || "firebase"
    };
}

async function logFiscalEvent(franchiseId, eventName, payload) {
    try {
        await db.collection("audit_log").add({
            event: eventName,
            franchiseId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: payload
        });
    } catch (error) {
        console.warn("fiscal audit log error:", error.message);
    }
}

function buildCupomHtml(config, note) {
    const lines = (note.items || []).map((item, index) => {
        const total = Number(item.valorTotal || (item.quantidade * item.valorUnitario) || 0);
        return `<div class="item"><span>${index + 1}. ${escapeHtml(item.nome || "Item")} x${item.quantidade || 1}</span><span>R$ ${total.toFixed(2)}</span></div>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${note.tipo === "cupom" ? "Cupom nao fiscal" : "Documento fiscal"}</title>
  <style>
    body { font-family: "Courier New", monospace; max-width: 320px; margin: 0 auto; padding: 16px; font-size: 12px; }
    .header, .footer { text-align: center; }
    .header { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .items { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .item { display: flex; justify-content: space-between; margin: 4px 0; gap: 8px; }
    .total { text-align: right; font-weight: bold; font-size: 14px; margin: 8px 0; }
    .muted { color: #555; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <strong>${escapeHtml(config.nomeFantasia || config.razaoSocial || "MilkyPot")}</strong><br>
    <span>${escapeHtml(config.razaoSocial || "")}</span><br>
    <span>CNPJ ${escapeHtml(config.cnpj || "")}</span>
  </div>
  <div class="items">${lines}</div>
  <div class="total">TOTAL R$ ${Number(note.total || 0).toFixed(2)}</div>
  <div>Pagamento: ${escapeHtml(note.formaPagamento || "-")}</div>
  <div>Cliente: ${escapeHtml(note.cliente?.nome || "Consumidor")}</div>
  <div class="footer muted">
    ${note.tipo === "cupom" ? "Cupom nao fiscal" : "NFC-e"}<br>
    Emitido em ${escapeHtml(note.dataEmissao || new Date().toISOString())}
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

exports.getFiscalHealth = onCall({
    region: "southamerica-east1"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request);
    const configSnap = await getFiscalConfigRef(franchiseId).get();
    const config = configSnap.exists ? configSnap.data() : {};

    return {
        success: true,
        backend: "firebase-functions",
        projectId: process.env.GCLOUD_PROJECT || null,
        storageBucket: bucket.name,
        connected: true,
        providerConfigured: !!(config?.provider?.type && (config?.provider?.apiKey || config?.provider?.baseUrl)),
        certificateInstalled: !!config?.certificate?.storagePath
    };
});

// Redact campos sensiveis (CSC token NFC-e, provider.apiKey) — exibe apenas
// last4 + flag "configurado". Antes: getFiscalConfig retornava cleartext
// completo, permitindo qualquer franqueado puxar o CSC e forjar NFC-e em
// homologacao contra o CNPJ da loja.
function _last4(s) {
    if (!s || typeof s !== 'string') return null;
    if (s.length <= 4) return '***';
    return '***' + s.slice(-4);
}
function _redactFiscal(data) {
    if (!data || typeof data !== 'object') return data;
    const out = { ...data };
    if (out.cscToken) out.cscToken = _last4(out.cscToken);
    if (out.csc_token) out.csc_token = _last4(out.csc_token);
    if (out.provider) {
        out.provider = { ...out.provider };
        if (out.provider.apiKey) out.provider.apiKey = _last4(out.provider.apiKey);
        if (out.provider.api_key) out.provider.api_key = _last4(out.provider.api_key);
        if (out.provider.token) out.provider.token = _last4(out.provider.token);
        if (out.provider.secret) out.provider.secret = _last4(out.provider.secret);
    }
    return out;
}

exports.getFiscalConfig = onCall({
    region: "southamerica-east1"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const snap = await getFiscalConfigRef(franchiseId).get();
    const data = snap.exists ? snap.data() : {};

    return {
        success: true,
        franchiseId,
        config: {
            ..._redactFiscal(data),
            certificate: sanitizeCertificateMeta(data.certificate)
        }
    };
});

exports.saveFiscalConfig = onCall({
    region: "southamerica-east1"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const config = normalizeConfig(request.data?.config || {});
    validateFiscalConfig(config);

    const ref = getFiscalConfigRef(franchiseId);
    const existing = await ref.get();
    const previous = existing.exists ? existing.data() : {};

    const payload = {
        ...config,
        certificate: previous.certificate || null,
        certificatePasswordEncrypted: previous.certificatePasswordEncrypted || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid
    };

    if (!existing.exists) {
        payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        payload.createdBy = request.auth.uid;
    }

    await ref.set(payload, { merge: true });
    await logFiscalEvent(franchiseId, "fiscal.config_saved", { by: request.auth.uid });

    return {
        success: true,
        franchiseId,
        config: {
            ...config,
            certificate: sanitizeCertificateMeta(previous.certificate)
        }
    };
});

exports.uploadFiscalCertificate = onCall({
    region: "southamerica-east1",
    memory: "512MiB",
    timeoutSeconds: 120
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const fileName = normalizeString(request.data?.fileName || "certificado.pfx");
    const password = normalizeString(request.data?.password);
    const fileContentBase64 = normalizeString(request.data?.fileContentBase64);

    if (!fileContentBase64 || !password) {
        throw new HttpsError("invalid-argument", "Arquivo e senha do certificado sao obrigatorios");
    }

    if (!/\.(pfx|p12)$/i.test(fileName)) {
        throw new HttpsError("invalid-argument", "Envie um certificado .pfx ou .p12");
    }

    const buffer = Buffer.from(fileContentBase64, "base64");
    if (buffer.length === 0 || buffer.length > 200 * 1024) {
        throw new HttpsError("invalid-argument", "Tamanho de certificado invalido");
    }

    const objectPath = `fiscal-certificates/${franchiseId}/current-${Date.now()}.pfx`;
    const file = bucket.file(objectPath);
    await file.save(buffer, {
        resumable: false,
        metadata: {
            contentType: "application/x-pkcs12",
            metadata: { franchiseId, uploadedBy: request.auth.uid }
        }
    });

    const certificateMeta = {
        fileName,
        storagePath: objectPath,
        size: buffer.length,
        status: "uploaded",
        message: "Certificado salvo com sucesso no Firebase",
        uploadedAt: new Date().toISOString(),
        uploadedBy: request.auth.uid,
        sha256: crypto.createHash("sha256").update(buffer).digest("hex")
    };

    await getFiscalConfigRef(franchiseId).set({
        certificate: certificateMeta,
        certificatePasswordEncrypted: encryptSecret(password),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid
    }, { merge: true });

    await logFiscalEvent(franchiseId, "fiscal.certificate_uploaded", {
        by: request.auth.uid,
        fileName,
        size: buffer.length
    });

    return {
        success: true,
        certificate: sanitizeCertificateMeta(certificateMeta)
    };
});

exports.listFiscalNotes = onCall({
    region: "southamerica-east1"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const snapshot = await getFiscalNotesCollection(franchiseId)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

    return {
        success: true,
        items: snapshot.docs.map(sanitizeNote)
    };
});

exports.emitFiscalDocument = onCall({
    region: "southamerica-east1",
    timeoutSeconds: 120,
    memory: "512MiB"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const tipo = request.data?.tipo === "cupom" ? "cupom" : "nfce";
    const payload = request.data?.payload || {};
    const configSnap = await getFiscalConfigRef(franchiseId).get();
    const config = configSnap.exists ? configSnap.data() : null;

    if (!config?.cnpj || !config?.razaoSocial) {
        return { success: false, error: "Configuracao fiscal incompleta para esta franquia" };
    }

    const items = Array.isArray(payload.items) ? payload.items.filter((item) =>
        normalizeString(item.nome) && Number(item.quantidade || 0) > 0 && Number(item.valorUnitario || 0) > 0
    ) : [];

    if (!items.length) {
        return { success: false, error: "Adicione pelo menos um item valido" };
    }

    if (tipo === "nfce") {
        const providerConfigured = !!(config?.provider?.type && (config?.provider?.apiKey || config?.provider?.baseUrl));
        if (!providerConfigured) {
            return {
                success: false,
                error: "Backend Firebase pronto, mas falta configurar o provedor fiscal da NFC-e para emissao real",
                requiresProvider: true
            };
        }
    }

    const numero = Number(config?.nfce?.proximoNumero || 1);
    const total = Number(payload.total || 0);
    const nowIso = new Date().toISOString();
    const noteRef = getFiscalNotesCollection(franchiseId).doc();
    const note = {
        franchiseId,
        tipo,
        numero: tipo === "cupom" ? String(Date.now()).slice(-6) : numero,
        serie: config?.nfce?.serie || 1,
        status: "autorizada",
        source: tipo === "cupom" ? "firebase-cupom" : "firebase-provider-ready",
        cliente: {
            nome: normalizeString(payload.cliente?.nome) || "Consumidor",
            documento: normalizeString(payload.cliente?.documento)
        },
        items,
        subtotal: Number(payload.subtotal || total),
        desconto: Number(payload.desconto || 0),
        total,
        formaPagamento: normalizeString(payload.formaPagamento),
        pedidoId: normalizeString(payload.pedidoId),
        dataEmissao: nowIso,
        danfeHtml: buildCupomHtml(config, {
            tipo,
            items,
            total,
            formaPagamento: normalizeString(payload.formaPagamento),
            cliente: { nome: normalizeString(payload.cliente?.nome) || "Consumidor" },
            dataEmissao: nowIso
        }),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid
    };

    if (tipo === "nfce") {
        note.chave = `PENDENTE${String(numero).padStart(9, "0")}`;
        note.protocolo = "PENDENTE_PROVEDOR";
        note.status = "pendente";
        note.source = "firebase-awaiting-provider";
    }

    await noteRef.set(note);

    if (tipo === "cupom") {
        await getFiscalConfigRef(franchiseId).set({
            nfce: {
                ...config.nfce,
                proximoNumero: numero
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } else {
        await getFiscalConfigRef(franchiseId).set({
            nfce: {
                ...config.nfce,
                proximoNumero: numero + 1
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    await logFiscalEvent(franchiseId, "fiscal.document_emitted", {
        by: request.auth.uid,
        tipo,
        noteId: noteRef.id
    });

    return {
        success: true,
        note: sanitizeNote({
            id: noteRef.id,
            data: () => note
        }),
        warning: tipo === "nfce"
            ? "NFC-e registrada no Firebase. Falta plugar o provedor fiscal para autorizacao real na SEFAZ."
            : null
    };
});

exports.cancelFiscalNote = onCall({
    region: "southamerica-east1"
}, async (request) => {
    const { franchiseId } = getFiscalContext(request, request.data?.franchiseId);
    const noteId = normalizeString(request.data?.noteId);
    const reason = normalizeString(request.data?.reason) || "Cancelamento solicitado pelo emitente";

    if (!noteId) {
        throw new HttpsError("invalid-argument", "ID da nota obrigatorio");
    }

    const ref = getFiscalNotesCollection(franchiseId).doc(noteId);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new HttpsError("not-found", "Nota fiscal nao encontrada");
    }

    const note = snap.data();
    if (note.tipo === "nfce" && note.source !== "firebase-awaiting-provider") {
        return {
            success: false,
            error: "Cancelamento automatico desta NFC-e depende do provedor fiscal configurado"
        };
    }

    await ref.set({
        status: "cancelada",
        cancelReason: reason,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        canceledBy: request.auth.uid
    }, { merge: true });

    await logFiscalEvent(franchiseId, "fiscal.note_canceled", {
        by: request.auth.uid,
        noteId,
        reason
    });

    return { success: true, canceled: true };
});

// ============================================================
// Uber Direct Integration
// ============================================================
const uberDirect = require("./uber-direct");
Object.assign(exports, uberDirect);

// ============================================================
// Test Mode & Production Mode
// ============================================================
const testMode = require("./test-mode");
Object.assign(exports, testMode);

// ============================================================
// Orders Migration (ADR-001 — datastore -> subcollection)
// ============================================================
const migrateOrders = require("./migrate-orders");
Object.assign(exports, migrateOrders);
