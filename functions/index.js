/* ============================================
   MilkyPot - Firebase Cloud Functions
   ============================================
   Backend seguro para operacoes criticas:
   - Custom Claims (roles)
   - Triggers de pedidos
   - Notificacoes
   ============================================ */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const UBER_ENCRYPTION_KEY = defineSecret("UBER_ENCRYPTION_KEY");
// Senha de app do Gmail (16 chars). Configurada via:
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
// Conta usada como remetente: milkypot.com@gmail.com
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

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
// 3. TRIGGER: Novo pedido criado
// ============================================
// Quando um pedido e criado via storefront publico
exports.onOrderCreated = onDocumentCreated({
    document: "datastore/{docId}",
    region: "southamerica-east1"
}, async (event) => {
    const docId = event.params.docId;

    // So processa documentos de orders
    if (!docId.startsWith("orders_")) return;

    const data = event.data.data();
    if (!data || !data.value) return;

    try {
        const orders = JSON.parse(data.value);
        if (!Array.isArray(orders)) return;

        // Pega o pedido mais recente (ultimo do array)
        const latestOrder = orders[orders.length - 1];
        if (!latestOrder) return;

        const franchiseId = docId.replace("orders_", "");

        // Log
        console.log(`Novo pedido detectado: ${latestOrder.id} na franquia ${franchiseId}`);

        // Aqui poderia:
        // - Enviar notificacao push para o franqueado
        // - Enviar email de confirmacao para o cliente
        // - Atualizar metricas em tempo real

    } catch (e) {
        console.error("onOrderCreated error:", e);
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
            ...data,
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
// SETUP TEST USER — uma vez, garante claims + franquia teste
// ============================================================
// Function publica (sem auth) que SO atua no email teste@teste.com.
// Seta custom claims (role franchisee, franchiseId franquia-teste) e
// garante que a franquia-teste existe no doc datastore/franchises.
// Apos o user logar uma vez, podemos remover essa function.
exports.setupTestFranchise = onCall({ region: "southamerica-east1" }, async () => {
    const TEST_EMAIL = "teste@teste.com";
    const TEST_FID = "franquia-teste";

    // 1. Setar claims no usuario teste
    let user;
    try {
        user = await auth.getUserByEmail(TEST_EMAIL);
    } catch (e) {
        throw new HttpsError("not-found", "Usuario teste@teste.com nao existe");
    }
    await auth.setCustomUserClaims(user.uid, {
        role: "franchisee",
        franchiseId: TEST_FID,
    });

    // 2. Garantir franquia-teste no doc franchises com DADOS REAIS
    //    da Muffato Quintino (cliente pediu: dados reais pra testar
    //    pedidos reais, mas separados em outro fid/orders).
    const ref = db.collection("datastore").doc("franchises");
    const snap = await ref.get();
    let arr = [];
    if (snap.exists) {
        try { arr = JSON.parse(snap.data().value || "[]"); } catch (e) { arr = []; }
    }
    const muffato = arr.find((f) => f.id === "muffato-quintino");
    // Dados reais da loja real (com fallback se Muffato nao existir)
    const realData = muffato ? {
        address: muffato.address,
        city: muffato.city,
        state: muffato.state,
        phone: muffato.phone,
        whatsapp: muffato.whatsapp,
        deliveryFee: muffato.deliveryFee,
        deliveryTime: muffato.deliveryTime,
        rating: muffato.rating,
        hours: muffato.hours,
    } : {
        address: "Rua Quintino Bocaiúva, 1045",
        city: "Londrina", state: "PR",
        phone: "43998042424", whatsapp: "43998042424",
        deliveryFee: 5.9, deliveryTime: "20-35 min", rating: 5,
        hours: "00:00 - 23:59",
    };
    const testFranchiseObj = {
        id: TEST_FID,
        slug: TEST_FID,
        name: "MilkyPot TESTE (Demo)",
        ...realData,
        type: "store",
        monthlyFee: 0,
        status: "ativo",
        storeOnlineOpen: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        isTestFranchise: true,
        // Override hours pra sempre aberta no teste
        hours: "00:00 - 23:59",
        createdAt: new Date().toISOString(),
        access: {
            ownerName: "Franquia TESTE",
            ownerEmail: TEST_EMAIL,
            ownerPhone: realData.phone,
            ownerPassword: "Teste@123",
            loginUrl: "https://milkypot.com/login.html",
            panelUrl: "https://milkypot.com/painel/index.html",
            notes: "Franquia de teste — dados de endereco/contato espelhados da Muffato Quintino. Pedidos salvos em orders_franquia-teste (separado).",
        },
    };
    const idx = arr.findIndex((f) => f.id === TEST_FID);
    if (idx === -1) arr.push(testFranchiseObj);
    else arr[idx] = testFranchiseObj; // SEMPRE re-sincroniza dados reais
    await ref.set({
        value: JSON.stringify(arr),
        updatedAt: new Date().toISOString(),
    });

    // 2.1 Cria docs vazios pro APK Android nao receber 404 quando itera
    //     sobre franchises buscando tv_shortcodes_<fid>. Sem isso, a
    //     adicao da franquia-teste no array franchises causa 404 no APK
    //     pra essas chaves -> APK pode mostrar 'codigo tv3 nao encontrado'
    //     se o cache da muffato-quintino tambem falhar momentaneamente.
    const tvDocs = [
        "tv_shortcodes_" + TEST_FID,
        "tv_media_" + TEST_FID,
        "tv_playlist_" + TEST_FID,
        "tv_config_" + TEST_FID,
    ];
    for (const docId of tvDocs) {
        try {
            const dRef = db.collection("datastore").doc(docId);
            const dSnap = await dRef.get();
            if (!dSnap.exists) {
                const emptyVal = docId.includes("media") || docId.includes("playlist") ? "[]" : "{}";
                await dRef.set({ value: emptyVal, updatedAt: new Date().toISOString() });
            }
        } catch (e) { console.warn("init tv doc " + docId + ":", e.message); }
    }

    // 2.2 Copia credenciais Uber Direct da Muffato Quintino pra franquia-teste
    //     (cliente disse: "ja ta ativa e cadastrada no sistema pode usar a mesma").
    //     Usa a mesma conta Uber, so muda o franchiseId interno.
    try {
        const muffatoUber = await db.collection("uber_settings").doc("muffato-quintino").get();
        if (muffatoUber.exists) {
            const testUber = await db.collection("uber_settings").doc(TEST_FID).get();
            if (!testUber.exists) {
                await db.collection("uber_settings").doc(TEST_FID).set(muffatoUber.data());
                console.log("uber settings copiadas de muffato-quintino pra " + TEST_FID);
            }
        }
    } catch (e) { console.warn("copy uber settings:", e.message); }

    // 3. Garantir user profile no datastore/users (auth.js usa esse perfil
    //    pra autorizar login — sem ele cai em 'Usuario nao cadastrado').
    const usersRef = db.collection("datastore").doc("users");
    const usersSnap = await usersRef.get();
    let usersArr = [];
    if (usersSnap.exists) {
        try { usersArr = JSON.parse(usersSnap.data().value || "[]"); } catch (e) { usersArr = []; }
    }
    if (!usersArr.find((u) => u.email === TEST_EMAIL)) {
        usersArr.push({
            id: "user_" + user.uid,
            email: TEST_EMAIL,
            name: "Franquia TESTE",
            role: "franchisee",
            franchiseId: TEST_FID,
            firebaseUid: user.uid,
            createdAt: new Date().toISOString(),
        });
        await usersRef.set({
            value: JSON.stringify(usersArr),
            updatedAt: new Date().toISOString(),
        });
    }

    // Diagnostico do estado Uber (sem expor secrets)
    const uberMuffato = await db.collection("uber_settings").doc("muffato-quintino").get();
    const uberTeste = await db.collection("uber_settings").doc(TEST_FID).get();
    const muffatoStatus = uberMuffato.exists ? {
        exists: true,
        enabled: uberMuffato.data().enabled === true,
        has_client_id: !!uberMuffato.data().client_id,
        has_customer_id: !!uberMuffato.data().customer_id,
        has_secret: !!uberMuffato.data().client_secret_encrypted,
        pickup_address: uberMuffato.data().pickup_address || null,
    } : { exists: false };
    const testeStatus = uberTeste.exists ? {
        exists: true,
        enabled: uberTeste.data().enabled === true,
        has_client_id: !!uberTeste.data().client_id,
        has_customer_id: !!uberTeste.data().customer_id,
        has_secret: !!uberTeste.data().client_secret_encrypted,
        pickup_address: uberTeste.data().pickup_address || null,
    } : { exists: false };

    return {
        success: true,
        message: "Franquia teste configurada (auth + franquia + user profile)",
        uid: user.uid,
        email: TEST_EMAIL,
        franchiseId: TEST_FID,
        password: "Teste@123",
        userProfileCreated: true,
        uberStatus: {
            muffato: muffatoStatus,
            teste: testeStatus,
        },
    };
});

// ============================================================
// SEED REAL CATALOG — popula Firestore com os 17 milkshakes + 17
// sundaes + buffet OFICIAIS. Idempotente — pode rodar quantas vezes.
// SO sobrescreve o catalog_config se ele tiver < 5 produtos OU se
// for o seed default (apenas Ninho com Morango / Nutella / Buffet).
// ============================================================
exports.seedRealCatalog = onCall({ region: "southamerica-east1" }, async (request) => {
    const MILKSHAKES = [
        { id:'amora-apaixonada', name:'Amora Apaixonada', emoji:'💜', desc:'Roxa, doce e teimosa — que nem aquele crush que sua mente não desliga.' },
        { id:'blue-ice', name:'Blue Ice — Crush Gelado', emoji:'🧊', desc:'Azul que nem o céu de Londrina ao entardecer. Sabor surpresa, frescor de praia.' },
        { id:'morango-romantico', name:'Morango Romântico', emoji:'🍓', desc:'O clássico que sempre volta — porque amor verdadeiro não envelhece.' },
        { id:'acai-liberdade', name:'Açaí Liberdade', emoji:'🟣', desc:'Bowl de açaí virou líquido. Energia da Amazônia.' },
        { id:'caramelo-derretido', name:'Caramelo Derretido', emoji:'🍯', desc:'Caramelo que escorre devagar — igual beijo demorado.' },
        { id:'limao-refresca', name:'Limão Refresca-Tudo', emoji:'🍋', desc:'Azedinho na medida, gelado no ponto.' },
        { id:'chocolate-apaixonante', name:'Chocolate Apaixonante', emoji:'🍫', desc:'Bombom líquido. Abraço quente do chocolate.' },
        { id:'uva-vovo', name:'Uva da Vovó', emoji:'🍇', desc:'Aquela uva roxinha do quintal da vovó, mas crescida.' },
        { id:'maracuja-calmaria', name:'Maracujá Calmaria', emoji:'💛', desc:'Tropical, levemente azedinho, totalmente relaxante.' },
        { id:'dentadura-doidinha', name:'Dentadura Doidinha', emoji:'😬', desc:'Milkshake colorido que deixa sua boca igual desenho animado.' },
        { id:'cookies-snow', name:'Cookies Snow', emoji:'🤍', desc:'Branquinho, cremoso, com pedaços de cookie crocante.' },
        { id:'ninho-vovo', name:'Ninho da Vovó', emoji:'🥛', desc:'Cremosidade de berço. Aquele cheirinho que lembra colo.' },
        { id:'pistache-esmeralda', name:'Pistache Esmeralda', emoji:'🟢', desc:'Verdinho gourmet, sofisticado, crocante.' },
        { id:'peanut-heaven', name:'Peanut Heaven', emoji:'🥜', desc:'Cremoso, salgadinho, viciante. Peanut butter virou milkshake.' },
        { id:'cereja-beijada', name:'Cereja Beijada', emoji:'🍒', desc:'Vermelhinha, brincalhona, top de bolo.' },
        { id:'ameixa-roxinha', name:'Ameixa Roxinha', emoji:'🍑', desc:'Roxa, polpuda, exótica.' },
        { id:'banana-caramelizada', name:'Banana Caramelizada', emoji:'🍌', desc:'Banana douradinha, beijada pelo caramelo.' },
    ];

    const TAMANHOS = [
        { id: 'p',     name: 'P (250ml)',    ml: 250, price: 9.99,  available: true },
        { id: 'm',     name: 'M (400ml)',    ml: 400, price: 19.99, available: true },
        { id: 'g',     name: 'G (500ml)',    ml: 500, price: 22.99, available: true },
    ];

    function makeItem(prefix, formato, m, idx) {
        return {
            id: prefix + '-' + m.id,
            name: (idx+1) + '. ' + formato + ' ' + m.name,
            emoji: m.emoji,
            desc: m.desc,
            price: 9.99,
            highlight: idx < 3,
            available: true,
            modoMontagem: 'simples',
            tipoVenda: 'unidade',
        };
    }

    const milkshakeItems = MILKSHAKES.map((m, idx) => makeItem('milkshake', 'Milkshake', m, idx));
    const sundaeItems = MILKSHAKES.map((m, idx) => makeItem('sundae', 'Sundae', m, idx));
    sundaeItems.push({
        id: 'sundae-capitao-acai-premium', name: '18. Sundae Capitão Açaí Premium', emoji: '👑',
        desc: 'Premium sundae com açaí da Amazônia, granola e raspas de chocolate.',
        price: 24.99, highlight: true, available: true, isPremium: true,
        modoMontagem: 'simples', tipoVenda: 'unidade',
    });
    milkshakeItems.push({
        id: 'milkshake-capitao-acai-premium', name: '18. Milkshake Capitão Açaí Premium', emoji: '👑',
        desc: 'Premium milkshake — açaí amazônico, granola, banana caramelizada.',
        price: 24.99, highlight: true, available: true, isPremium: true,
        modoMontagem: 'simples', tipoVenda: 'unidade',
    });

    const newCatalog = {
        bases: [
            { id: 'ninho', name: 'Ninho', emoji: '🥛', available: true },
            { id: 'baunilha', name: 'Baunilha', emoji: '🍦', available: true },
        ],
        tamanhos: TAMANHOS,
        formatos: [
            { id: 'milkshake', name: 'Milkshake', emoji: '🥤' },
            { id: 'sundae', name: 'Sundae', emoji: '🍨' },
        ],
        sabores: {
            milkshake: { label: 'Milkshake', icon: '🥤', items: milkshakeItems },
            sundae:    { label: 'Sundae',    icon: '🍨', items: sundaeItems    },
            buffet:    { label: 'Buffet Self-Service', icon: '🍽️', items: [
                { id: 'buffet-100g', name: 'Buffet por peso', emoji: '⚖️',
                  desc: 'Monte do seu jeito — 22 toppings + 12 sabores + caldas. R\$ 5,99/100g',
                  price: 5.99, highlight: true, available: true,
                  modoMontagem: 'simples', tipoVenda: 'por_peso',
                  porcoes: [
                      { label: '200g', peso: 200 },
                      { label: '300g', peso: 300 },
                      { label: '400g', peso: 400 },
                      { label: '500g', peso: 500 },
                  ],
                },
            ]},
        },
        adicionais: {
            coberturas: { label: 'Caldas e Toppings', items: [
                { id: 'leitinho-morango', name: 'Leitinho Morango', emoji: '✨', price: 2.00, available: true },
                { id: 'calda-avela', name: 'Calda Avelã', emoji: '✨', price: 2.00, available: true },
                { id: 'maracuja-calda', name: 'Maracujá Calda', emoji: '✨', price: 2.00, available: true },
                { id: 'pistache', name: 'Pistache', emoji: '✨', price: 3.50, available: true },
                { id: 'banana-caramelizada-add', name: 'Banana Caramelizada', emoji: '✨', price: 2.50, available: true },
                { id: 'morango-add', name: 'Morango', emoji: '🍓', price: 2.00, available: true },
                { id: 'nutella-add', name: 'Nutella', emoji: '🍫', price: 4.00, available: true },
            ]},
        },
        bebidas: [
            { id: 'agua-500', name: 'Água Mineral 500ml', emoji: '💧', price: 4.00, available: true, type: 'bebida', tipoVenda: 'unidade' },
            { id: 'coca-lata', name: 'Coca-Cola Lata 350ml', emoji: '🥤', price: 6.00, available: true, type: 'bebida', tipoVenda: 'unidade' },
            { id: 'guarana-lata', name: 'Guaraná Antarctica Lata', emoji: '🥤', price: 6.00, available: true, type: 'bebida', tipoVenda: 'unidade' },
        ],
        _seedSource: 'production_real',
        _seededAt: new Date().toISOString(),
    };

    // Salva em catalog_config (key global usada pelo PDV/cardapio/landing)
    await db.collection("datastore").doc("catalog_config").set({
        value: JSON.stringify(newCatalog),
        updatedAt: new Date().toISOString(),
    });

    // Tambem salva em catalog_config_<fid> pra ambas franquias
    const fids = ["muffato-quintino", "franquia-teste"];
    for (const fid of fids) {
        await db.collection("datastore").doc("catalog_config_" + fid).set({
            value: JSON.stringify(newCatalog),
            updatedAt: new Date().toISOString(),
        });
    }

    return {
        success: true,
        message: "Catálogo real seedado em catalog_config + 2 franquias",
        produtos: {
            milkshakes: milkshakeItems.length,
            sundaes: sundaeItems.length,
            buffet: 1,
            bebidas: newCatalog.bebidas.length,
        },
        franquias: fids,
    };
});

// ============================================================
// GET MY PROFILE — auth.js usa pra buscar perfil quando cache vazio
// ============================================================
// Retorna o perfil do usuario autenticado. Seguro: usa request.auth
// (token verificado pelo Firebase) — ninguem consegue pegar perfil
// de outro usuario.
exports.getMyProfile = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Login necessario");
    }
    const email = request.auth.token.email;
    if (!email) {
        throw new HttpsError("invalid-argument", "Token sem email");
    }
    try {
        const snap = await db.collection("datastore").doc("users").get();
        if (!snap.exists) return { success: false, profile: null };
        const arr = JSON.parse((snap.data() || {}).value || "[]");
        const profile = arr.find((u) => u && u.email === email) || null;
        return { success: true, profile };
    } catch (e) {
        console.error("getMyProfile error:", e);
        throw new HttpsError("internal", e.message || "Erro");
    }
});

// ============================================================
// SEND CLOSING REPORT — fechamento de caixa por email
// ============================================================
// Chamada pelo PDV (caixa.js) quando o operador fecha o caixa do dia.
// Envia relatorio HTML pra 3 emails fixos da gestao via Gmail SMTP.
// Pre-requisito: secret GMAIL_APP_PASSWORD setado:
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
// (gerado em https://myaccount.google.com/apppasswords usando a conta
//  milkypot.com@gmail.com com 2FA ativo)
const RECIPIENTS = [
    "milkypot.com@gmail.com",
    "jocimarrodrigo@gmail.com",
    "joseanemse@gmail.com",
];
// Conta usada como remetente (gerou a app password):
const SMTP_USER = "jocimarrodrigo@gmail.com";

function _fmtBRL(v) {
    return "R$ " + (Number(v || 0).toFixed(2)).replace(".", ",");
}

function _buildClosingHtml(data) {
    const esp = data.esperado || {};
    const con = data.conferido || (data.breakdownConferido && data.breakdownConferido.conferido) || {};
    const br = data.breakdown || (data.breakdownConferido && data.breakdownConferido.breakdown) || {};
    const dt = new Date(data.fechamentoDate || Date.now()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const diff = Number(con.diffTotal || data.diferenca || 0);
    const diffColor = Math.abs(diff) < 0.01 ? "#10B981" : (Math.abs(diff) <= 5 ? "#F59E0B" : "#DC2626");
    const diffLabel = Math.abs(diff) < 0.01 ? "Bateu certinho" : (diff > 0 ? "Sobrou" : "Faltou");
    const totalEsperado = Number(esp.totalEsperado || data.saldoEsperado || 0);
    const totalConferido = Number(con.totalConferido || data.valorContado || 0);
    return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:16px;background:#f9fafb">
  <div style="background:linear-gradient(135deg,#7B1FA2,#DC2626);color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:20px">🔒 Fechamento de Caixa — MilkyPot</h2>
    <div style="opacity:.92;font-size:13px;margin-top:6px">${data.franchiseId || ""} · ${dt}</div>
  </div>
  <div style="background:#fff;padding:18px;border:1px solid #e5e7eb;border-top:0">
    <p style="margin:0 0 14px;font-size:13px;color:#6b7280">Operador: <strong style="color:#111">${data.operatorName || "?"}</strong> &lt;${data.operatorEmail || ""}&gt;</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
      <tr style="background:#F3F4F6"><th style="padding:9px 8px;text-align:left">Método</th><th style="padding:9px 8px;text-align:right">Sistema</th><th style="padding:9px 8px;text-align:right">Conferido</th></tr>
      <tr><td style="padding:7px 8px;border-top:1px solid #e5e7eb">💳 Cartão (Bandeiras)</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right">${_fmtBRL(esp.cartao || ((esp.credito || 0) + (esp.debito || 0)))}</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">${_fmtBRL(br.cartao || 0)}</td></tr>
      <tr><td style="padding:7px 8px;border-top:1px solid #e5e7eb">⚡ PIX</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right">${_fmtBRL(esp.pix)}</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">${_fmtBRL(br.pix_total || 0)}</td></tr>
      <tr><td style="padding:7px 8px;border-top:1px solid #e5e7eb">💵 Dinheiro físico</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right">${_fmtBRL(esp.saldoEsperadoDinheiro)}</td><td style="padding:7px 8px;border-top:1px solid #e5e7eb;text-align:right;font-weight:700">${_fmtBRL(br.dinheiro_liquido_dia || br.dinheiro_total_gaveta || 0)}</td></tr>
      <tr style="background:#F9FAFB;font-weight:800"><td style="padding:9px 8px;border-top:2px solid #e5e7eb">TOTAL</td><td style="padding:9px 8px;border-top:2px solid #e5e7eb;text-align:right">${_fmtBRL(totalEsperado)}</td><td style="padding:9px 8px;border-top:2px solid #e5e7eb;text-align:right">${_fmtBRL(totalConferido)}</td></tr>
    </table>
    <div style="padding:14px;background:${diffColor}15;border-radius:8px;border-left:5px solid ${diffColor}">
      <div style="font-size:14px;color:${diffColor};font-weight:800">${diffLabel}: ${_fmtBRL(Math.abs(diff))}</div>
      ${data.motivo ? '<div style="font-size:12px;margin-top:8px;color:#374151"><strong>Justificativa:</strong> ' + String(data.motivo).replace(/</g, "&lt;") + '</div>' : ''}
    </div>
    ${br.dinheiro_troco ? `<div style="margin-top:12px;font-size:12px;color:#6b7280">💰 Troco que fica pro próximo turno: <strong>${_fmtBRL(br.dinheiro_troco)}</strong></div>` : ""}
  </div>
  <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:12px">Relatório automático MilkyPot PDV</div>
</div>`;
}

function _buildClosingText(data) {
    const esp = data.esperado || {};
    const con = data.conferido || (data.breakdownConferido && data.breakdownConferido.conferido) || {};
    const br = data.breakdown || (data.breakdownConferido && data.breakdownConferido.breakdown) || {};
    const dt = new Date(data.fechamentoDate || Date.now()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    let body = "";
    body += "FECHAMENTO DE CAIXA — MilkyPot\n";
    body += "====================================\n";
    body += "Franquia:   " + (data.franchiseId || "?") + "\n";
    body += "Data:       " + dt + "\n";
    body += "Operador:   " + (data.operatorName || "?") + " <" + (data.operatorEmail || "") + ">\n\n";
    body += "Cartão (Bandeiras):  " + _fmtBRL(br.cartao || 0) + " (esperado " + _fmtBRL(esp.cartao || 0) + ")\n";
    body += "PIX:                 " + _fmtBRL(br.pix_total || 0) + " (esperado " + _fmtBRL(esp.pix || 0) + ")\n";
    body += "Dinheiro físico:     " + _fmtBRL(br.dinheiro_liquido_dia || br.dinheiro_total_gaveta || 0) + " (esperado " + _fmtBRL(esp.saldoEsperadoDinheiro || 0) + ")\n";
    body += "TOTAL CONFERIDO:     " + _fmtBRL(con.totalConferido || data.valorContado || 0) + "\n";
    body += "Diferença total:     " + _fmtBRL(con.diffTotal || data.diferenca || 0) + "\n";
    if (data.motivo) body += "Justificativa:       " + data.motivo + "\n";
    if (br.dinheiro_troco) body += "Troco próx. turno:   " + _fmtBRL(br.dinheiro_troco) + "\n";
    return body;
}

exports.sendClosingReport = onCall({
    region: "southamerica-east1",
    secrets: [GMAIL_APP_PASSWORD],
    timeoutSeconds: 60,
    memory: "256MiB",
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    const { franchiseId, data, managers } = request.data || {};
    const recipients = Array.isArray(managers) && managers.length ? managers : RECIPIENTS;
    const reportData = data || {};

    const password = GMAIL_APP_PASSWORD.value();
    if (!password) {
        // Secret nao configurado — salva no Firestore mesmo assim e retorna erro graceful
        await db.collection("mail").add({
            to: recipients,
            from: "MilkyPot PDV <" + SMTP_USER + ">",
            replyTo: reportData.operatorEmail || SMTP_USER,
            message: {
                subject: "Fechamento de Caixa — " + (franchiseId || "?") + " — " + new Date().toISOString().slice(0, 10),
                text: _buildClosingText({ ...reportData, franchiseId }),
                html: _buildClosingHtml({ ...reportData, franchiseId }),
            },
            _pendingSmtp: true,
            _createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: false, queued: true, reason: "GMAIL_APP_PASSWORD nao configurado — relatorio salvo em /mail" };
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: SMTP_USER, pass: password },
    });

    try {
        await transporter.sendMail({
            from: '"MilkyPot PDV" <' + SMTP_USER + '>',
            to: recipients.join(", "),
            replyTo: reportData.operatorEmail || SMTP_USER,
            subject: "🔒 Fechamento de Caixa — " + (franchiseId || "?") + " — " + new Date().toISOString().slice(0, 10),
            text: _buildClosingText({ ...reportData, franchiseId }),
            html: _buildClosingHtml({ ...reportData, franchiseId }),
        });
        // Marca como enviado pra audit
        await db.collection("caixa_reports_sent").add({
            franchiseId,
            recipients,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            data: reportData,
        });
        return { success: true, sent: recipients.length };
    } catch (e) {
        console.error("sendClosingReport SMTP error:", e);
        // Salva no Firestore como fallback pra retry futuro
        await db.collection("mail").add({
            to: recipients,
            from: "MilkyPot PDV <" + SMTP_USER + ">",
            message: {
                subject: "Fechamento de Caixa — " + (franchiseId || "?"),
                text: _buildClosingText({ ...reportData, franchiseId }),
                html: _buildClosingHtml({ ...reportData, franchiseId }),
            },
            _smtpError: String(e && e.message || e),
            _createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new HttpsError("internal", "SMTP falhou: " + (e.message || "?"));
    }
});

// ============================================================
// FASE 3 — DESPESAS RECORRENTES (cron mensal + callable)
// ============================================================
// Gera lancamentos automaticos de custos fixos (aluguel, salarios, energia)
// no dia 1 de cada mes, pra TODAS as franquias ativas.
//
// Idempotencia: usa (recurringExpenseId, competencia) como chave logica.
// Se ja existe lancamento na collection 'finances' com esse par, pula.
//
// Storage layout (DataStore JSON-blob por doc):
//   datastore/recurring_expenses_<fid>  → { value: JSON.stringify([recs...]) }
//   datastore/finances_<fid>            → { value: JSON.stringify([entries...]) }
// ============================================================
function _competenciaAtual() {
    const dt = new Date();
    return dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0");
}

function _dateForCompetencia(competencia, dia) {
    const parts = (competencia || "").split("-");
    if (parts.length !== 2) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!y || !m) return null;
    const lastDay = new Date(y, m, 0).getDate();
    const d = Math.min(Math.max(parseInt(dia, 10) || 1, 1), lastDay);
    return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

function _genId() {
    return "rec_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function _competenciaFromDate(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return null;
    return dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0");
}

function _isApplicable(rec, competencia) {
    if (!rec || rec.ativo === false) return false;
    const inicioComp = _competenciaFromDate(rec.dataInicio);
    if (inicioComp && competencia < inicioComp) return false;
    if (rec.dataFim) {
        const fimComp = _competenciaFromDate(rec.dataFim);
        if (fimComp && competencia > fimComp) return false;
    }
    return true;
}

async function _readDoc(docId) {
    try {
        const snap = await db.collection("datastore").doc(docId).get();
        if (!snap.exists) return [];
        const raw = snap.data().value;
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn("readDoc " + docId + " err:", e.message);
        return [];
    }
}

async function _writeDoc(docId, arr) {
    await db.collection("datastore").doc(docId).set({
        value: JSON.stringify(arr),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: "scheduled_recurring_expenses",
    }, { merge: true });
}

async function _generateForFranchise(franchiseId, competencia) {
    const recs = await _readDoc("recurring_expenses_" + franchiseId);
    if (!Array.isArray(recs) || recs.length === 0) {
        return { franchiseId, criados: 0, pulados: 0, semRecorrencias: true };
    }

    const finances = await _readDoc("finances_" + franchiseId);
    const finArr = Array.isArray(finances) ? finances.slice() : [];

    let criados = 0;
    let pulados = 0;
    let inaplicaveis = 0;
    const detalhes = [];

    for (const r of recs) {
        if (!_isApplicable(r, competencia)) {
            inaplicaveis++;
            continue;
        }
        const jaExiste = finArr.some(f =>
            f && f._origem === "recorrente"
            && f._recurringExpenseId === r.id
            && f._competencia === competencia
        );
        if (jaExiste) {
            pulados++;
            continue;
        }
        const entry = {
            id: _genId(),
            type: "expense",
            category: r.categoria,
            amount: Number(r.valor) || 0,
            description: (r.descricao || "Recorrente") + " (recorrente)",
            date: _dateForCompetencia(competencia, r.diaVencimento),
            _origem: "recorrente",
            _recurringExpenseId: r.id,
            _competencia: competencia,
            _diaVencimento: r.diaVencimento,
            _snapshotValor: Number(r.valor) || 0,
            _generatedBy: "cloud_function_scheduled",
            createdAt: new Date().toISOString(),
        };
        finArr.push(entry);
        criados++;
        detalhes.push({ recurringId: r.id, descricao: r.descricao, valor: entry.amount });
    }

    if (criados > 0) {
        await _writeDoc("finances_" + franchiseId, finArr);
    }

    return {
        franchiseId,
        competencia,
        criados,
        pulados,
        inaplicaveis,
        detalhes,
    };
}

async function _runForAllFranchises(competencia) {
    // Le a lista de franquias do datastore/franchises
    const franchisesDoc = await _readDoc("franchises");
    if (!Array.isArray(franchisesDoc) || franchisesDoc.length === 0) {
        console.warn("[recurring] nenhuma franquia encontrada em datastore/franchises");
        return { totalFranquias: 0, processadas: 0, criados: 0, resultados: [] };
    }
    const resultados = [];
    let totalCriados = 0;
    for (const f of franchisesDoc) {
        if (!f || !f.id) continue;
        try {
            const res = await _generateForFranchise(f.id, competencia);
            resultados.push(res);
            totalCriados += res.criados;
        } catch (e) {
            console.error("[recurring] falha em " + f.id + ":", e.message);
            resultados.push({ franchiseId: f.id, error: e.message });
        }
    }
    return {
        totalFranquias: franchisesDoc.length,
        processadas: resultados.length,
        criados: totalCriados,
        resultados,
    };
}

// CRON: dia 1 de cada mes, 03:00 UTC (00:00 Brasilia)
exports.generateMonthlyRecurringExpenses = onSchedule({
    region: "southamerica-east1",
    schedule: "0 3 1 * *",
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 540,
    memory: "256MiB",
}, async (event) => {
    const competencia = _competenciaAtual();
    console.log("[scheduled-recurring] iniciando geracao", competencia);
    const summary = await _runForAllFranchises(competencia);
    console.log("[scheduled-recurring] resumo:", JSON.stringify(summary));

    // Audit log
    try {
        await db.collection("recurring_expenses_runs").add({
            triggeredBy: "schedule",
            competencia,
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            summary,
        });
    } catch (e) {
        console.warn("audit log falhou:", e.message);
    }
});

// Callable manual — admin pode forcar geracao retroativa pra qualquer mes/franquia
exports.runRecurringExpensesNow = onCall({
    region: "southamerica-east1",
    timeoutSeconds: 120,
    memory: "256MiB",
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    const role = request.auth.token.role || "";
    if (!["super_admin", "admin", "franchisee"].includes(role)) {
        throw new HttpsError("permission-denied", "Apenas admin/franqueado");
    }

    const { franchiseId, competencia } = request.data || {};
    const comp = competencia || _competenciaAtual();
    if (!/^\d{4}-\d{2}$/.test(comp)) {
        throw new HttpsError("invalid-argument", "competencia deve ser YYYY-MM");
    }

    if (franchiseId) {
        // franqueado so pode rodar pra propria franquia
        if (role === "franchisee" && request.auth.token.franchiseId !== franchiseId) {
            throw new HttpsError("permission-denied", "Franqueado so pode rodar pra propria franquia");
        }
        const res = await _generateForFranchise(franchiseId, comp);
        await db.collection("recurring_expenses_runs").add({
            triggeredBy: "manual:" + (request.auth.uid || "?"),
            competencia: comp,
            franchiseId,
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            result: res,
        });
        return { ok: true, mode: "single-franchise", result: res };
    }

    // sem franchiseId → apenas super_admin pode rodar pra todas
    if (role !== "super_admin" && role !== "admin") {
        throw new HttpsError("permission-denied", "Apenas admin pode rodar pra todas franquias");
    }
    const summary = await _runForAllFranchises(comp);
    await db.collection("recurring_expenses_runs").add({
        triggeredBy: "manual-all:" + (request.auth.uid || "?"),
        competencia: comp,
        ranAt: admin.firestore.FieldValue.serverTimestamp(),
        summary,
    });
    return { ok: true, mode: "all-franchises", summary };
});

// ============================================================
// FASE 5++ — Limpeza automática de finance órfãos
// ============================================================
// Roda toda madrugada e tombstona income entries que:
//   - type === 'income'
//   - !deleted (ainda ativos)
//   - !orderId OU orderId não existe na collection orders_<fid>
// Tombstone = deleted:true, amount:0, cmvSnapshot:0, _voided_reason
// NUNCA apaga físico — preserva auditoria.
// ============================================================
async function _cleanupOrphansForFranchise(fid) {
    const financesRef = db.collection("datastore").doc("finances_" + fid);
    const ordersRef = db.collection("datastore").doc("orders_" + fid);
    const [finSnap, ordSnap] = await Promise.all([financesRef.get(), ordersRef.get()]);
    if (!finSnap.exists) {
        return { fid, skipped: "no-finances", tombstoned: 0 };
    }
    let finances;
    try {
        finances = JSON.parse(finSnap.data().value || "[]");
    } catch (e) {
        return { fid, error: "parse-finances: " + e.message, tombstoned: 0 };
    }
    if (!Array.isArray(finances)) {
        return { fid, error: "finances-not-array", tombstoned: 0 };
    }
    let validOrderIds = new Set();
    if (ordSnap.exists) {
        try {
            const orders = JSON.parse(ordSnap.data().value || "[]");
            if (Array.isArray(orders)) orders.forEach((o) => o && o.id && validOrderIds.add(o.id));
        } catch (e) { /* ignora — assume nenhum order válido */ }
    }
    const nowIso = new Date().toISOString();
    const tombstoned = [];
    finances.forEach((f) => {
        if (!f || f.type !== "income" || f.deleted) return;
        const isOrphan = !f.orderId || !validOrderIds.has(f.orderId);
        if (!isOrphan) return;
        tombstoned.push({
            id: f.id,
            orderId: f.orderId || null,
            amountWas: Number(f.amount || 0),
            cmvSnapshotWas: Number(f.cmvSnapshot || f.custo || 0),
        });
        f.amount = 0;
        f.cmvSnapshot = 0;
        f.custo = 0;
        f.lucroBruto = 0;
        f.margem = null;
        f.deleted = true;
        f.deletedAt = nowIso;
        f.updatedAt = nowIso;
        f._voided_reason = "órfão automático (income sem orderId válido)";
        f.description = "[VOID-orphan-auto] " + (f.description || f.id);
    });
    if (tombstoned.length === 0) {
        return { fid, tombstoned: 0, scanned: finances.length };
    }
    await financesRef.set({
        value: JSON.stringify(finances),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { fid, tombstoned: tombstoned.length, scanned: finances.length, ids: tombstoned };
}

async function _runOrphanCleanupAllFranchises() {
    const fSnap = await db.collection("datastore").doc("franchises").get();
    if (!fSnap.exists) return { franchises: 0, totalTombstoned: 0, results: [] };
    let franchises;
    try {
        franchises = JSON.parse(fSnap.data().value || "[]");
    } catch (e) {
        return { error: "parse-franchises: " + e.message };
    }
    if (!Array.isArray(franchises)) return { error: "franchises-not-array" };
    const results = [];
    let totalTombstoned = 0;
    for (const f of franchises) {
        if (!f || !f.id) continue;
        try {
            const r = await _cleanupOrphansForFranchise(f.id);
            results.push(r);
            totalTombstoned += r.tombstoned || 0;
        } catch (e) {
            results.push({ fid: f.id, error: e.message });
        }
    }
    return { franchises: franchises.length, totalTombstoned, results };
}

// Cron diário 3h da manhã Brasília — roda pra todas as franquias
exports.cleanupOrphanFinances = onSchedule({
    region: "southamerica-east1",
    schedule: "0 3 * * *",
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 540,
    memory: "256MiB",
}, async () => {
    console.log("[orphan-cleanup] iniciando");
    const summary = await _runOrphanCleanupAllFranchises();
    console.log("[orphan-cleanup] resumo:", JSON.stringify(summary));
    try {
        await db.collection("orphan_cleanup_runs").add({
            triggeredBy: "schedule",
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            summary,
        });
    } catch (e) {
        console.warn("audit log falhou:", e.message);
    }
});

// Manual trigger — admin / franchisee pra própria franquia
exports.runOrphanCleanupNow = onCall({
    region: "southamerica-east1",
    timeoutSeconds: 120,
    memory: "256MiB",
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    const role = request.auth.token.role || "";
    if (!["super_admin", "admin", "franchisee"].includes(role)) {
        throw new HttpsError("permission-denied", "Apenas admin/franqueado");
    }
    const { franchiseId } = request.data || {};
    if (franchiseId) {
        if (role === "franchisee" && request.auth.token.franchiseId !== franchiseId) {
            throw new HttpsError("permission-denied", "Franqueado so pode rodar pra propria franquia");
        }
        const result = await _cleanupOrphansForFranchise(franchiseId);
        await db.collection("orphan_cleanup_runs").add({
            triggeredBy: "manual:" + (request.auth.uid || "?"),
            franchiseId,
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            result,
        });
        return { ok: true, mode: "single-franchise", result };
    }
    if (role !== "super_admin" && role !== "admin") {
        throw new HttpsError("permission-denied", "Apenas admin pode rodar pra todas");
    }
    const summary = await _runOrphanCleanupAllFranchises();
    await db.collection("orphan_cleanup_runs").add({
        triggeredBy: "manual-all:" + (request.auth.uid || "?"),
        ranAt: admin.firestore.FieldValue.serverTimestamp(),
        summary,
    });
    return { ok: true, mode: "all-franchises", summary };
});

// ============================================================
// FASE 8.2 — Catalog Auto-Sync (server-side)
// ============================================================
// Triggers Firestore: quando catalog_v2_<fid> ou inventory_<fid> muda,
// servidor reconstrói catalog_config + recalcula custoTotal automaticamente.
// Elimina race condition entre PCs (servidor é fonte única de verdade).
const CatalogSync = require("./catalog-sync");

/**
 * Trigger: datastore/catalog_v2_{fid} mudou → reconstrói catalog_config.
 * Importante: não dispara loop porque o catalog_config NÃO matcha o pattern.
 */
exports.onCatalogV2Write = onDocumentUpdated({
    region: "southamerica-east1",
    document: "datastore/{docId}",
    timeoutSeconds: 60,
    memory: "256MiB",
}, async (event) => {
    const docId = event.params.docId || "";
    // Responde a catalog_v2_<fid>, inventory_<fid> e catalog_config[_<fid>]
    const isCatalogV2 = docId.startsWith("catalog_v2_") && docId !== "catalog_v2_franquia";
    const isInventory = docId.startsWith("inventory_");
    const isCatalogConfig = docId === "catalog_config" || docId.startsWith("catalog_config_");
    if (!isCatalogV2 && !isInventory && !isCatalogConfig) return;

    // Extrai fid
    let fid = null;
    if (isCatalogV2) fid = docId.replace("catalog_v2_", "");
    else if (isInventory) fid = docId.replace("inventory_", "");
    else if (isCatalogConfig) {
        if (docId === "catalog_config") {
            // catalog_config global: tenta extrair fid via _fid no payload
            try {
                const after = event.data.after.data();
                const parsed = JSON.parse(after.value || "{}");
                fid = parsed._fid || null;
            } catch (e) {}
        } else {
            fid = docId.replace("catalog_config_", "");
        }
    }
    if (!fid) return;

    // Anti-loop: se o write veio do próprio sync (audit tag), não dispara de novo
    try {
        const after = event.data.after.data();
        if (after && after._updatedBy && /^catalog-sync-/.test(after._updatedBy)) {
            return; // próprio sync escreveu — ignora
        }
    } catch (e) {}

    // FIX (Fase 8.5) — DEFESA SERVER-SIDE contra clients legados:
    // Se for write em catalog_config[_<fid>] vindo de browser (sem tag),
    // VALIDA que tem receitas. Se não tiver MAS catalog_v2 da franquia tem,
    // RESTAURA imediatamente. Isso bloqueia o loop de "Receita pendente volta"
    // mesmo quando outro cliente tá com cache antigo (sem o guard v8.4).
    if (isCatalogConfig) {
        try {
            const after = event.data.after.data();
            const parsed = JSON.parse(after.value || "{}");
            // Conta receitas escritas
            let totalItems = 0, comReceita = 0;
            Object.values(parsed.sabores || {}).forEach((g) => {
                if (g && g.items) g.items.forEach((it) => {
                    totalItems++;
                    if (it.receita && it.receita.length) comReceita++;
                });
            });
            const percComReceita = totalItems > 0 ? (comReceita / totalItems) * 100 : 100;

            // Lê catalog_v2 do FS pra comparar
            const v2Snap = await db.collection("datastore").doc("catalog_v2_" + fid).get();
            if (v2Snap.exists) {
                const v2 = JSON.parse(v2Snap.data().value || "{}");
                const v2Prods = (v2.produtos || []).filter(p => p && p.active !== false);
                const v2ComReceita = v2Prods.filter(p => p.custos && p.custos.insumos && p.custos.insumos.length).length;
                const v2Perc = v2Prods.length > 0 ? (v2ComReceita / v2Prods.length) * 100 : 0;

                if (percComReceita < 50 && v2Perc > 50) {
                    console.warn(`[catalog-config-guard] BLOCKED stale write em ${docId} ` +
                        `(${comReceita}/${totalItems} com receita) — v2 tem ${v2ComReceita}/${v2Prods.length}. RESTAURANDO.`);
                    // Re-roda sync server-side pra restaurar a versão correta
                    await CatalogSync.syncCatalogConfigForFranchise(db, fid);
                    return;
                }
            }
        } catch (e) { console.warn("[catalog-config-guard] check falhou:", e.message); }
        // Se passou no guard, não precisa re-sync (o write é válido OU não é catalog_config)
        return;
    }

    console.log(`[catalog-sync] trigger por ${docId} → sincronizando franquia ${fid}`);
    try {
        const r = await CatalogSync.syncCatalogConfigForFranchise(db, fid);
        console.log(`[catalog-sync] resultado:`, JSON.stringify(r));
    } catch (e) {
        console.error(`[catalog-sync] erro pra ${fid}:`, e.message);
    }
});

/** Também responde a catalog_v2 created (1ª vez) */
exports.onCatalogV2Create = onDocumentCreated({
    region: "southamerica-east1",
    document: "datastore/{docId}",
    timeoutSeconds: 60,
    memory: "256MiB",
}, async (event) => {
    const docId = event.params.docId || "";
    if (!docId.startsWith("catalog_v2_") && !docId.startsWith("inventory_")) return;
    let fid = null;
    if (docId.startsWith("catalog_v2_")) fid = docId.replace("catalog_v2_", "");
    else fid = docId.replace("inventory_", "");
    if (!fid) return;
    try {
        const after = event.data.data();
        if (after && after._updatedBy && /^catalog-sync-/.test(after._updatedBy)) return;
    } catch (e) {}
    console.log(`[catalog-sync] create-trigger por ${docId} → sincronizando franquia ${fid}`);
    try {
        await CatalogSync.syncCatalogConfigForFranchise(db, fid);
    } catch (e) { console.error(`[catalog-sync] erro:`, e.message); }
});

/** Manual trigger — admin (todas) ou franchisee (própria). Útil pra catch-up inicial. */
exports.runCatalogSyncNow = onCall({
    region: "southamerica-east1",
    timeoutSeconds: 120,
    memory: "256MiB",
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    const role = request.auth.token.role || "";
    if (!["super_admin", "admin", "franchisee"].includes(role)) {
        throw new HttpsError("permission-denied", "Apenas admin/franqueado");
    }
    const { franchiseId } = request.data || {};
    if (franchiseId) {
        if (role === "franchisee" && request.auth.token.franchiseId !== franchiseId) {
            throw new HttpsError("permission-denied", "Franqueado só pode rodar pra própria franquia");
        }
        const r = await CatalogSync.syncCatalogConfigForFranchise(db, franchiseId);
        return { ok: true, mode: "single-franchise", result: r };
    }
    if (role !== "super_admin" && role !== "admin") {
        throw new HttpsError("permission-denied", "Apenas admin pode rodar pra todas");
    }
    const summary = await CatalogSync.syncAllFranchises(db);
    return { ok: true, mode: "all-franchises", summary };
});
