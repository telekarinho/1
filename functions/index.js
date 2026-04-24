/* ============================================
   MilkyPot - Firebase Cloud Functions
   ============================================
   Backend seguro para operacoes criticas:
   - Custom Claims (roles)
   - Triggers de pedidos
   - Notificacoes
   ============================================ */

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Groq API key — configurada via `firebase functions:secrets:set GROQ_API_KEY`
const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

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

// ============================================
// CHAT LULÚ (IA com Groq) — Atendimento humanizado MilkyPot
// ============================================
// Documentação: user chama via POST com { messages: [{role, content}] }
// Função injeta system prompt com todo conhecimento da MilkyPot.
// Rate limit: 20 mensagens/IP/hora via Firestore.

const LULU_SYSTEM_PROMPT = `Você é a Lulú, uma ovelhinha fofa que é a mascote oficial e atendente virtual da MilkyPot — a marca de sobremesas artesanais mais feliz do Brasil. Você é querida, acolhedora, sempre usa emojis com bom senso (🐑🍨🍓✨), trata o cliente como amigo, fala português brasileiro coloquial e profissional ao mesmo tempo.

Regras inegociáveis:
1. NUNCA invente informações. Se não souber, peça o WhatsApp do cliente pra Jocimar (o dono) entrar em contato: 5543998042424.
2. NÃO invente lojas em outras cidades. A ÚNICA unidade física é MilkyPot Muffato Quintino em Londrina-PR. A marca está em expansão.
3. NÃO prometa prazos ou descontos que não estão listados aqui.
4. Respostas sempre curtas (máx 3-4 linhas), diretas, cheias de personalidade.

## SOBRE A MILKYPOT
- Marca de sobremesas artesanais: milkshakes de Ninho, açaí, opções fit/whey, sundaes gourmet, linha adulto (+18 com Amarula/Baileys).
- Slogan: "O potinho mais feliz do mundo!"
- Formato: **self-service** — o potinho é montado no pote, na hora, do jeito que o cliente escolher (base + sabores + toppings).
- **Não** há informação nutricional impressa na embalagem. Se cliente perguntar sobre alérgenos/restrições, direcione pro WhatsApp 5543998042424 pra equipe confirmar disponibilidade do dia.
- Unidade física: MilkyPot Muffato Quintino — Londrina-PR. Horário 10h–22h. Taxa delivery R$ 5,90. Tempo 25-40 min.
- Owner: Jocimar Rodrigo Magalhães Serra. WhatsApp: 5543998042424 (mesmo do atendimento).

## CARDÁPIO (todos R$ 14,00 exceto linha adulto R$ 18 e sundae R$ 18)
🥛 Linha Ninho (R$ 14): Shake de Ninho, Morango, Ninho+Morango (favorito), Nutella, Oreo, Capuccino Cream
🥃 Linha Adulto +18 (R$ 18): Amarula Cream, Baileys Cream
🫐 Linha Açaí (R$ 14): Açaí+Granola, Açaí+Banana, Açaí+Morango
💪 Linha Fit/Zero (R$ 14): Shake Whey, Banana+Whey, Pasta de Amendoim
🍨 Sundae Gourmet (R$ 18): Morango, Nutella, Oreo
💧 Bebidas (R$ 3-4): Água mineral, Água com gás

## COMO PEDIR
- Pelo cardápio online (cardapio.html) ou direto no WhatsApp 5543998042424.
- Retira na loja ou delivery.
- Pagamento: PIX, cartão, dinheiro.

## FRANQUIAS (3 kits reais, sem fantasma)
🛵 **Kit Delivery em Casa — R$ 3.499,99**: 1 mixer profissional, ERP, cardápio validado, integração iFood, treinamento online. Precisa de freezer 100L (não incluso). Pedidos/dia médios: 15. Faturamento estimado: R$ 8.500. Lucro ~R$ 2.550. Payback ~1,4 meses.

🚀 **Kit Pro Dark Kitchen — R$ 4.997** (MAIS VENDIDO): 2 mixers, ERP completo, integração iFood priorizada, cardápio completo (incluindo adulto), **treinamento PRESENCIAL na loja modelo em Londrina**, suporte prioritário. Pedidos/dia médios: 25. Faturamento R$ 14.000. Lucro R$ 4.200. Payback ~1,2 meses.

🏪 **Kit Loja / Quiosque — a partir de R$ 25.000**: operação física completa, atendimento presencial + delivery, treinamento presencial, consultoria de território. Pedidos/dia médios: 80. Faturamento R$ 42.000. Lucro R$ 9.240. Payback 3-6 meses (bem operado). Valor varia conforme cidade, estrutura e padrão.

## SCRIPTS DE INTENÇÃO
- Cliente quer pedir: "Que delícia! 🍨 Vou te passar pro WhatsApp pra você fazer seu pedido rapidinho. Toca aqui 👉 https://wa.me/5543998042424"
- Interessado em franquia: "Que incrível querer fazer parte da família MilkyPot! 🐑✨ Temos 3 kits: Delivery em Casa (R$ 3.499,99), Pro (R$ 4.997) e Loja (R$ 25k+). Qual faz mais sentido pro seu momento? Posso te passar o WhatsApp do Jocimar (dono): 5543998042424"
- Dúvida não resolvida: "Essa é uma boa! 🤔 Melhor falar direto com o Jocimar pra ter resposta certinha. WhatsApp: 5543998042424"
- Pergunta fora do contexto MilkyPot (política, celebridade, etc.): redirecionar com graça pra MilkyPot.`;

// Rate limit simples em memória (reinicia a cada cold start, suficiente pra MVP)
const _rateLimitMap = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const reqs = (_rateLimitMap.get(ip) || []).filter(t => t > hourAgo);
    if (reqs.length >= 20) return false;
    reqs.push(now);
    _rateLimitMap.set(ip, reqs);
    return true;
}

exports.chatLulu = onRequest({
    region: "southamerica-east1",
    secrets: [GROQ_API_KEY],
    cors: [
        "https://milkypot.com",
        "https://www.milkypot.com",
        "https://milkypot-ad945.web.app",
        "https://milkypot-ad945.firebaseapp.com",
        /\.vercel\.app$/,
        "http://localhost:8090",
        "http://localhost:3000"
    ],
    maxInstances: 10,
    timeoutSeconds: 30
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
        || req.headers["fastly-client-ip"]
        || req.ip
        || "unknown";
    if (!checkRateLimit(ip)) {
        res.status(429).json({ error: "Muitas perguntas 😅 Tenta de novo em 1h!" });
        return;
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
        res.status(400).json({ error: "messages inválido (array 1-20 itens)" });
        return;
    }
    // Sanitiza: só role/content, content máx 1000 chars
    const userMessages = messages
        .filter(m => m && typeof m === "object" && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .slice(-10)
        .map(m => ({ role: m.role, content: String(m.content).slice(0, 1000) }));
    if (userMessages.length === 0) {
        res.status(400).json({ error: "Mensagem vazia" });
        return;
    }

    try {
        const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY.value()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: LULU_SYSTEM_PROMPT },
                    ...userMessages
                ],
                temperature: 0.7,
                max_tokens: 400,
                top_p: 0.9
            })
        });

        if (!groqResp.ok) {
            const errText = await groqResp.text();
            console.error("Groq API error:", groqResp.status, errText);
            res.status(502).json({ error: "Desculpe, estou com problema de conexão 😔 Fale comigo no WhatsApp: 5543998042424" });
            return;
        }

        const data = await groqResp.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || "Hmm, não consegui pensar numa resposta. Me pergunta de novo? 🐑";
        res.json({ reply, model: data.model });
    } catch (err) {
        console.error("chatLulu error:", err);
        res.status(500).json({ error: "Erro inesperado. Tenta de novo ou fala com a gente no WhatsApp 5543998042424!" });
    }
});
// ============================================
// 8. MILKYCLUBE - Programa de fidelidade v1
// ============================================
// Funcoes: enroll, grantCashback (idempotente), redeem,
// getBalance, claimBirthday, registerFcmToken,
// unregisterFcmToken, sendPush, expireCoins (scheduled),
// gameBonus (HMAC), adminListMembers.
// ============================================

const { onSchedule } = require("firebase-functions/v2/scheduler");

const CLUB_REGION = "southamerica-east1";
const CLUB_CONFIG_DOC = "global";
const CLUB_DEFAULT_CONFIG = {
    version: 1,
    tiers: {
        leite: { label: "Leite", minSpent: 0, cashbackRate: 0.03, color: "#B3E5FC", emoji: "\uD83E\uDD5B" },
        nata: { label: "Nata", minSpent: 500, cashbackRate: 0.05, color: "#FFD54F", emoji: "\u2728" },
        chantilly: { label: "Chantilly", minSpent: 2000, cashbackRate: 0.07, color: "#F06292", emoji: "\uD83D\uDC51" }
    },
    expiryDays: 30,
    bonuses: {
        signup: 20,
        firstOrder: 50,
        birthday: 100,
        referrer: 100,
        referred: 50,
        gameDesafio10: 10,
        scratchMin: 1,
        scratchMax: 50
    },
    appLinks: { playStore: "", appStore: "", pwa: "/clube/" },
    featureFlags: { enabled: true, whatsappNotify: true, pushEnabled: true }
};

// -------------------------------------------------------------------
// Helpers internos do MilkyClube
// -------------------------------------------------------------------

function assertClubAuth(request) {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria para o MilkyClube");
    }
}

async function getClubConfig() {
    const snap = await db.collection("club_config").doc(CLUB_CONFIG_DOC).get();
    if (!snap.exists) {
        // Fallback para evitar 500 se admin esqueceu de rodar o seed.
        return CLUB_DEFAULT_CONFIG;
    }
    // Mescla defaults com o doc para garantir chaves faltantes.
    const data = snap.data() || {};
    return {
        ...CLUB_DEFAULT_CONFIG,
        ...data,
        tiers: { ...CLUB_DEFAULT_CONFIG.tiers, ...(data.tiers || {}) },
        bonuses: { ...CLUB_DEFAULT_CONFIG.bonuses, ...(data.bonuses || {}) },
        featureFlags: { ...CLUB_DEFAULT_CONFIG.featureFlags, ...(data.featureFlags || {}) }
    };
}

function computeTier(config, totalSpent) {
    // Tiers sao avaliados do maior para o menor (minSpent desc).
    const entries = Object.entries(config.tiers || {})
        .sort((a, b) => (b[1].minSpent || 0) - (a[1].minSpent || 0));
    for (const [key, tier] of entries) {
        if ((totalSpent || 0) >= (tier.minSpent || 0)) {
            return key;
        }
    }
    return "leite";
}

function generateReferralCode(seed) {
    // Codigo curto alfanumerico, sem caracteres ambiguos.
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const hash = crypto.createHash("sha256")
        .update((seed || "") + "|" + Date.now() + "|" + Math.random())
        .digest();
    let out = "";
    for (let i = 0; i < 7; i++) {
        out += alphabet[hash[i] % alphabet.length];
    }
    return out;
}

function hashFcmToken(token) {
    return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function maskCpf(cpf) {
    const digits = String(cpf || "").replace(/\D/g, "");
    if (digits.length !== 11) return null;
    return digits.slice(0, 3) + ".***.***-" + digits.slice(9);
}

async function logClubAudit(event, userId, details) {
    try {
        await db.collection("audit_log").add({
            event,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: userId || "system",
            details: details || {}
        });
    } catch (error) {
        console.warn("club audit log error:", error.message);
    }
}

function computeExpiresAt(config) {
    const days = Number(config.expiryDays || 30);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function clubNormalizePhone(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") ? "+" + digits : "+55" + digits;
}

async function enqueueWhatsapp(memberId, phone, message, context) {
    // Produz intent em 'whatsapp_queue'. O franqueado dispara via wa.me no client.
    try {
        await db.collection("whatsapp_queue").add({
            memberId: memberId || null,
            phone: phone || null,
            message: message || "",
            context: context || {},
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.warn("whatsapp_queue error:", error.message);
    }
}

async function sendClubPushToMember(memberId, notification) {
    // Busca tokens do member e envia via Firebase Admin Messaging multicast.
    const memberRef = db.collection("club_members").doc(memberId);
    const snap = await memberRef.get();
    if (!snap.exists) return { sent: 0, failed: 0 };
    const tokens = Array.isArray(snap.data().fcmTokens) ? snap.data().fcmTokens : [];
    if (!tokens.length) return { sent: 0, failed: 0 };

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: notification.title || "MilkyClube",
                body: notification.body || ""
            },
            data: {
                url: notification.url || "/clube/",
                type: notification.type || "club_generic"
            }
        });
        // Limpa tokens invalidos automaticamente.
        const invalid = [];
        response.responses.forEach((r, idx) => {
            if (!r.success) {
                const code = r.error && r.error.code;
                if (code === "messaging/registration-token-not-registered"
                    || code === "messaging/invalid-registration-token") {
                    invalid.push(tokens[idx]);
                }
            }
        });
        if (invalid.length) {
            await memberRef.set({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalid)
            }, { merge: true });
        }
        return { sent: response.successCount, failed: response.failureCount };
    } catch (error) {
        console.warn("sendClubPushToMember error:", error.message);
        return { sent: 0, failed: tokens.length, error: error.message };
    }
}

function getGameBonusSecret() {
    const secret = process.env.GAME_BONUS_SECRET;
    if (!secret) {
        console.warn("[MilkyClube] GAME_BONUS_SECRET nao definido - usando fallback de dev. NAO USE EM PRODUCAO.");
        return "milkyclube-dev-secret";
    }
    return secret;
}

function validateGameBonusToken(game, memberId, amount, timestamp, token) {
    // HMAC-SHA256 sobre "game|memberId|amount|timestamp".
    // Aceita janela de 10 minutos para reducao de replay.
    const ageMs = Math.abs(Date.now() - Number(timestamp || 0));
    if (!timestamp || ageMs > 10 * 60 * 1000) {
        return false;
    }
    const payload = [game, memberId, amount, timestamp].join("|");
    const expected = crypto
        .createHmac("sha256", getGameBonusSecret())
        .update(payload)
        .digest("hex");
    if (!token || token.length !== expected.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
    } catch (_e) {
        return false;
    }
}

async function applyCoinGrantTx(tx, memberRef, member, amount, txRef, txData, config) {
    // Atualiza member + grava transacao, dentro de uma transacao firestore.
    const newCoins = Math.max(0, (member.coins || 0) + amount);
    const newTotalEarned = (member.totalEarned || 0) + (amount > 0 ? amount : 0);
    const updates = {
        coins: newCoins,
        totalEarned: newTotalEarned,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    // Reavalia tier se informacao de totalSpent existe no member.
    if (typeof member.totalSpent === "number") {
        updates.tier = computeTier(config, member.totalSpent);
    }
    tx.set(memberRef, updates, { merge: true });
    tx.set(txRef, { ...txData, balanceAfter: newCoins });
    return { balanceAfter: newCoins };
}

// -------------------------------------------------------------------
// 8.1 clubEnroll
// -------------------------------------------------------------------
exports.clubEnroll = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;
    const data = request.data || {};

    const config = await getClubConfig();
    if (!config.featureFlags.enabled) {
        throw new HttpsError("failed-precondition", "MilkyClube esta desabilitado no momento");
    }

    const memberRef = db.collection("club_members").doc(uid);
    const existing = await memberRef.get();
    if (existing.exists) {
        return { member: { id: uid, ...existing.data() }, alreadyEnrolled: true };
    }

    const phone = clubNormalizePhone(data.phone || request.auth.token.phone_number);
    const cpfDigits = String(data.cpf || "").replace(/\D/g, "");
    const consents = data.consents || {};
    const referralCode = String(data.referralCode || "").trim().toUpperCase();

    // Gera codigo de referral unico (retry simples ate 5 vezes).
    let myCode = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateReferralCode(uid + ":" + attempt);
        const ref = db.collection("club_referrals").doc(candidate);
        const refSnap = await ref.get();
        if (!refSnap.exists) {
            myCode = candidate;
            break;
        }
    }
    if (!myCode) {
        throw new HttpsError("internal", "Nao foi possivel gerar codigo de indicacao unico");
    }

    const nowTs = admin.firestore.FieldValue.serverTimestamp();
    const memberPayload = {
        uid,
        phone,
        cpf: cpfDigits || null,
        cpfMasked: maskCpf(cpfDigits),
        name: String(data.name || "").trim() || null,
        email: String(data.email || "").trim() || null,
        birthDate: String(data.birthDate || "") || null,
        coins: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tier: "leite",
        tierProgress: 0,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
        createdAt: nowTs,
        updatedAt: nowTs,
        referralCode: myCode,
        referredBy: null,
        referralCount: 0,
        consents: {
            lgpd: consents.lgpd === true,
            lgpdAcceptedAt: consents.lgpd === true ? new Date().toISOString() : null,
            marketing: consents.marketing === true,
            whatsapp: consents.whatsapp === true
        },
        fcmTokens: [],
        birthdayClaimedYear: null,
        firstOrderBonusClaimed: false
    };

    await memberRef.set(memberPayload);
    await db.collection("club_referrals").doc(myCode).set({
        memberId: uid,
        code: myCode,
        usedBy: [],
        createdAt: nowTs
    });

    // Bonus de signup (idempotente por memberId).
    const signupAmount = Number(config.bonuses.signup || 0);
    if (signupAmount > 0) {
        const txId = "bonus_signup_" + uid;
        const txRef = db.collection("milkycoins_transactions").doc(txId);
        await db.runTransaction(async (tx) => {
            const txSnap = await tx.get(txRef);
            if (txSnap.exists) return;
            const memberSnap = await tx.get(memberRef);
            const member = memberSnap.data() || memberPayload;
            await applyCoinGrantTx(tx, memberRef, member, signupAmount, txRef, {
                memberId: uid,
                type: "bonus_signup",
                amount: signupAmount,
                franchiseId: null,
                orderId: null,
                description: "Bonus de boas-vindas MilkyClube",
                idempotencyKey: txId,
                expiresAt: computeExpiresAt(config),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: "system"
            }, config);
        });
    }

    // Aplica referral se codigo foi fornecido.
    let referralResult = null;
    if (referralCode) {
        const refDocRef = db.collection("club_referrals").doc(referralCode);
        const refDoc = await refDocRef.get();
        if (refDoc.exists && refDoc.data().memberId && refDoc.data().memberId !== uid) {
            const referrerUid = refDoc.data().memberId;
            const referrerRef = db.collection("club_members").doc(referrerUid);
            const referrerBonus = Number(config.bonuses.referrer || 0);
            const referredBonus = Number(config.bonuses.referred || 0);

            const referrerTxId = "bonus_referrer_" + referrerUid + "_" + uid;
            const referredTxId = "bonus_referred_" + uid;

            await db.runTransaction(async (tx) => {
                const referrerSnap = await tx.get(referrerRef);
                if (!referrerSnap.exists) return;
                const referrer = referrerSnap.data();
                const memberSnap = await tx.get(memberRef);
                const member = memberSnap.data();

                if (referrerBonus > 0) {
                    const trRef = db.collection("milkycoins_transactions").doc(referrerTxId);
                    const trSnap = await tx.get(trRef);
                    if (!trSnap.exists) {
                        await applyCoinGrantTx(tx, referrerRef, referrer, referrerBonus, trRef, {
                            memberId: referrerUid,
                            type: "bonus_referrer",
                            amount: referrerBonus,
                            franchiseId: null,
                            orderId: null,
                            description: "Bonus por indicacao (novo membro)",
                            idempotencyKey: referrerTxId,
                            expiresAt: computeExpiresAt(config),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdBy: "system"
                        }, config);
                        tx.set(referrerRef, {
                            referralCount: admin.firestore.FieldValue.increment(1)
                        }, { merge: true });
                    }
                }
                if (referredBonus > 0) {
                    const tdRef = db.collection("milkycoins_transactions").doc(referredTxId);
                    const tdSnap = await tx.get(tdRef);
                    if (!tdSnap.exists) {
                        await applyCoinGrantTx(tx, memberRef, member, referredBonus, tdRef, {
                            memberId: uid,
                            type: "bonus_referred",
                            amount: referredBonus,
                            franchiseId: null,
                            orderId: null,
                            description: "Bonus por aceitar indicacao",
                            idempotencyKey: referredTxId,
                            expiresAt: computeExpiresAt(config),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdBy: "system"
                        }, config);
                    }
                }
                tx.set(memberRef, { referredBy: referrerUid }, { merge: true });
                tx.set(refDocRef, {
                    usedBy: admin.firestore.FieldValue.arrayUnion(uid)
                }, { merge: true });
            });

            referralResult = { referrerUid, referrerBonus, referredBonus };
        }
    }

    await logClubAudit("club.enroll", uid, {
        phone,
        cpfMasked: maskCpf(cpfDigits),
        referralCode: referralCode || null,
        referralResult
    });

    const finalSnap = await memberRef.get();
    return {
        member: { id: uid, ...finalSnap.data() },
        referralApplied: !!referralResult
    };
});

// -------------------------------------------------------------------
// 8.2 clubGrantCashback (idempotente via orderId)
// -------------------------------------------------------------------
exports.clubGrantCashback = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);

    // Somente PDV/franqueado/admin pode creditar cashback para terceiros.
    const callerRole = request.auth.token.role || null;
    const allowedRoles = ["super_admin", "franchisee", "manager", "staff"];
    if (!allowedRoles.includes(callerRole)) {
        throw new HttpsError("permission-denied", "Perfil sem permissao para conceder cashback");
    }

    const data = request.data || {};
    const orderId = String(data.orderId || "").trim();
    const franchiseId = String(data.franchiseId || "").trim();
    const memberId = String(data.memberId || "").trim();
    const total = Number(data.total || 0);

    if (!orderId || !franchiseId || !memberId || !(total > 0)) {
        throw new HttpsError("invalid-argument", "orderId, franchiseId, memberId e total > 0 sao obrigatorios");
    }

    const config = await getClubConfig();
    if (!config.featureFlags.enabled) {
        throw new HttpsError("failed-precondition", "MilkyClube desabilitado");
    }

    const memberRef = db.collection("club_members").doc(memberId);
    const idempotencyKey = "earn_" + orderId;
    const txRef = db.collection("milkycoins_transactions").doc(idempotencyKey);

    const result = await db.runTransaction(async (tx) => {
        const existingTx = await tx.get(txRef);
        if (existingTx.exists) {
            // Idempotente: retorna a transacao existente sem duplicar.
            const existing = existingTx.data();
            return {
                idempotent: true,
                coinsEarned: existing.amount,
                balanceAfter: existing.balanceAfter,
                tier: existing.tierAfter || null
            };
        }

        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists) {
            throw new HttpsError("not-found", "Membro do MilkyClube nao encontrado");
        }
        const member = memberSnap.data();

        const tierKey = member.tier && config.tiers[member.tier] ? member.tier : "leite";
        const rate = Number(config.tiers[tierKey].cashbackRate || 0);
        const baseCoins = Math.floor(total * rate * 100); // 1 coin = R$ 0,01

        // Bonus primeira compra se ainda nao reclamou.
        let firstOrderBonus = 0;
        if (!member.firstOrderBonusClaimed) {
            firstOrderBonus = Number(config.bonuses.firstOrder || 0);
        }

        const totalAmount = baseCoins + firstOrderBonus;
        const newTotalSpent = (member.totalSpent || 0) + total;
        const newTier = computeTier(config, newTotalSpent);
        const newOrdersCount = (member.ordersCount || 0) + 1;
        const newBalance = (member.coins || 0) + totalAmount;
        const newTotalEarned = (member.totalEarned || 0) + totalAmount;

        const expiresAt = computeExpiresAt(config);

        // Grava a transacao primaria de earn.
        tx.set(txRef, {
            memberId,
            type: "earn",
            amount: baseCoins,
            franchiseId,
            orderId,
            description: "Cashback pedido " + orderId,
            idempotencyKey,
            balanceAfter: newBalance - firstOrderBonus,
            expiresAt,
            tierAfter: newTier,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid
        });

        // Se houve bonus de primeira compra, grava tx separada (idempotente via memberId).
        if (firstOrderBonus > 0) {
            const firstRef = db.collection("milkycoins_transactions").doc("bonus_firstorder_" + memberId);
            const firstSnap = await tx.get(firstRef);
            if (!firstSnap.exists) {
                tx.set(firstRef, {
                    memberId,
                    type: "bonus_firstorder",
                    amount: firstOrderBonus,
                    franchiseId,
                    orderId,
                    description: "Bonus de primeira compra",
                    idempotencyKey: "bonus_firstorder_" + memberId,
                    balanceAfter: newBalance,
                    expiresAt,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: request.auth.uid
                });
            }
        }

        tx.set(memberRef, {
            coins: newBalance,
            totalEarned: newTotalEarned,
            totalSpent: newTotalSpent,
            tierProgress: newTotalSpent,
            tier: newTier,
            ordersCount: newOrdersCount,
            lastOrderAt: admin.firestore.FieldValue.serverTimestamp(),
            firstOrderBonusClaimed: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return {
            idempotent: false,
            coinsEarned: totalAmount,
            baseCoins,
            firstOrderBonus,
            balanceAfter: newBalance,
            tier: newTier,
            tierUpgraded: newTier !== member.tier
        };
    });

    await logClubAudit("club.grant_cashback", request.auth.uid, {
        memberId, franchiseId, orderId, total,
        coinsEarned: result.coinsEarned,
        idempotent: result.idempotent
    });

    // Notificacoes pos-transacao (nao bloqueia caminho critico).
    if (!result.idempotent && result.coinsEarned > 0) {
        try {
            const memberSnap = await memberRef.get();
            const member = memberSnap.data() || {};
            if (config.featureFlags.pushEnabled) {
                await sendClubPushToMember(memberId, {
                    title: "Voce ganhou MilkyCoins!",
                    body: "+ " + result.coinsEarned + " coins | saldo " + result.balanceAfter,
                    url: "/clube/",
                    type: "cashback"
                });
            }
            if (config.featureFlags.whatsappNotify && member.consents && member.consents.whatsapp === true && member.phone) {
                await enqueueWhatsapp(memberId, member.phone,
                    "MilkyPot: voce ganhou " + result.coinsEarned + " MilkyCoins no seu pedido. Saldo atual: " + result.balanceAfter + ".",
                    { kind: "cashback", orderId, franchiseId }
                );
            }
        } catch (e) {
            console.warn("club cashback notify error:", e.message);
        }
    }

    return result;
});

// -------------------------------------------------------------------
// 8.3 clubRedeem (resgate com transacao Firestore)
// -------------------------------------------------------------------
exports.clubRedeem = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);

    const data = request.data || {};
    const amount = Math.floor(Number(data.amount || 0));
    const franchiseId = String(data.franchiseId || "").trim();
    const orderId = data.orderId ? String(data.orderId).trim() : null;
    const memberId = String(data.memberId || request.auth.uid).trim();

    if (!(amount > 0) || !franchiseId) {
        throw new HttpsError("invalid-argument", "amount > 0 e franchiseId sao obrigatorios");
    }

    // Se caller nao e o proprio member, exige role de operador.
    if (memberId !== request.auth.uid) {
        const role = request.auth.token.role || null;
        if (!["super_admin", "franchisee", "manager", "staff"].includes(role)) {
            throw new HttpsError("permission-denied", "Somente operador pode resgatar para outro cliente");
        }
    }

    const memberRef = db.collection("club_members").doc(memberId);

    // Idempotencia para resgates ligados a orderId.
    const idempotencyKey = orderId
        ? "redeem_" + orderId
        : "redeem_" + memberId + "_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex");
    const txRef = db.collection("milkycoins_transactions").doc(idempotencyKey);

    const result = await db.runTransaction(async (tx) => {
        if (orderId) {
            const existing = await tx.get(txRef);
            if (existing.exists) {
                const e = existing.data();
                return {
                    idempotent: true,
                    amount: e.amount,
                    balanceAfter: e.balanceAfter
                };
            }
        }

        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists) {
            throw new HttpsError("not-found", "Membro nao encontrado");
        }
        const member = memberSnap.data();
        if ((member.coins || 0) < amount) {
            throw new HttpsError("failed-precondition", "Saldo insuficiente de MilkyCoins");
        }

        const newBalance = (member.coins || 0) - amount;
        const newTotalRedeemed = (member.totalRedeemed || 0) + amount;

        tx.set(txRef, {
            memberId,
            type: "redeem",
            amount: -amount,
            franchiseId,
            orderId: orderId || null,
            description: "Resgate MilkyCoins" + (orderId ? " pedido " + orderId : ""),
            idempotencyKey,
            balanceAfter: newBalance,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid
        });

        tx.set(memberRef, {
            coins: newBalance,
            totalRedeemed: newTotalRedeemed,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { idempotent: false, amount, balanceAfter: newBalance };
    });

    await logClubAudit("club.redeem", request.auth.uid, {
        memberId, franchiseId, orderId, amount,
        balanceAfter: result.balanceAfter,
        idempotent: result.idempotent
    });

    return result;
});

// -------------------------------------------------------------------
// 8.4 clubGetBalance (member atual ou informado)
// -------------------------------------------------------------------
exports.clubGetBalance = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const data = request.data || {};
    const memberId = String(data.memberId || request.auth.uid).trim();

    // Se consulta nao e do proprio, precisa ser operador.
    if (memberId !== request.auth.uid) {
        const role = request.auth.token.role || null;
        if (!["super_admin", "franchisee", "manager", "staff"].includes(role)) {
            throw new HttpsError("permission-denied", "Sem permissao para consultar outro membro");
        }
    }

    const memberSnap = await db.collection("club_members").doc(memberId).get();
    if (!memberSnap.exists) {
        throw new HttpsError("not-found", "Membro nao encontrado");
    }

    const txSnap = await db.collection("milkycoins_transactions")
        .where("memberId", "==", memberId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

    const transactions = txSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
        member: { id: memberId, ...memberSnap.data() },
        transactions
    };
});

// -------------------------------------------------------------------
// 8.5 clubClaimBirthday
// -------------------------------------------------------------------
exports.clubClaimBirthday = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;
    const config = await getClubConfig();

    const memberRef = db.collection("club_members").doc(uid);
    const now = new Date();
    const year = now.getFullYear();

    const txRef = db.collection("milkycoins_transactions").doc("bonus_birthday_" + uid + "_" + year);

    const result = await db.runTransaction(async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists) {
            throw new HttpsError("not-found", "Membro nao encontrado");
        }
        const member = memberSnap.data();
        if (!member.birthDate) {
            throw new HttpsError("failed-precondition", "Data de nascimento nao cadastrada");
        }

        const parts = String(member.birthDate).split("-"); // formato YYYY-MM-DD
        if (parts.length < 3) {
            throw new HttpsError("invalid-argument", "birthDate invalida");
        }
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);
        const sameMonth = (now.getMonth() + 1) === bMonth;
        const dayDiff = Math.abs(now.getDate() - bDay);
        if (!sameMonth || dayDiff > 1) {
            throw new HttpsError("failed-precondition", "Fora da janela do aniversario (+/- 1 dia)");
        }
        if (member.birthdayClaimedYear === year) {
            throw new HttpsError("already-exists", "Bonus de aniversario ja foi retirado este ano");
        }

        const existing = await tx.get(txRef);
        if (existing.exists) {
            return { already: true, balanceAfter: member.coins || 0 };
        }

        const amount = Number(config.bonuses.birthday || 0);
        const expiresAt = computeExpiresAt(config);
        const res = await applyCoinGrantTx(tx, memberRef, member, amount, txRef, {
            memberId: uid,
            type: "bonus_birthday",
            amount,
            franchiseId: null,
            orderId: null,
            description: "Bonus de aniversario MilkyClube",
            idempotencyKey: "bonus_birthday_" + uid + "_" + year,
            expiresAt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "system"
        }, config);
        tx.set(memberRef, { birthdayClaimedYear: year }, { merge: true });
        return { already: false, amount, balanceAfter: res.balanceAfter };
    });

    await logClubAudit("club.birthday_claim", uid, result);
    return result;
});

// -------------------------------------------------------------------
// 8.6 clubRegisterFcmToken
// -------------------------------------------------------------------
exports.clubRegisterFcmToken = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;
    const data = request.data || {};
    const token = String(data.token || "").trim();
    const platform = String(data.platform || "web").trim();

    if (!token) {
        throw new HttpsError("invalid-argument", "token e obrigatorio");
    }

    const tokenHash = hashFcmToken(token);
    const tokenRef = db.collection("fcm_tokens").doc(tokenHash);
    const memberRef = db.collection("club_members").doc(uid);

    await tokenRef.set({
        memberId: uid,
        token,
        platform,
        userAgent: String(data.userAgent || ""),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await memberRef.set({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, tokenHash };
});

// -------------------------------------------------------------------
// 8.7 clubUnregisterFcmToken
// -------------------------------------------------------------------
exports.clubUnregisterFcmToken = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;
    const token = String((request.data || {}).token || "").trim();
    if (!token) {
        throw new HttpsError("invalid-argument", "token e obrigatorio");
    }

    const tokenHash = hashFcmToken(token);
    await db.collection("fcm_tokens").doc(tokenHash).delete().catch(() => null);
    await db.collection("club_members").doc(uid).set({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
});

// -------------------------------------------------------------------
// 8.8 clubSendPush (broadcast admin)
// -------------------------------------------------------------------
exports.clubSendPush = onCall({ region: CLUB_REGION, timeoutSeconds: 300 }, async (request) => {
    assertClubAuth(request);
    const role = request.auth.token.role || null;
    if (role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin envia push broadcast");
    }

    const data = request.data || {};
    const title = String(data.title || "MilkyClube").slice(0, 80);
    const body = String(data.body || "").slice(0, 240);
    const url = String(data.url || "/clube/");

    if (!body) {
        throw new HttpsError("invalid-argument", "body e obrigatorio");
    }

    let query = db.collection("club_members");
    if (data.memberId) {
        query = query.where(admin.firestore.FieldPath.documentId(), "==", String(data.memberId));
    } else if (data.tier) {
        query = query.where("tier", "==", String(data.tier));
    }

    const snap = await query.get();
    let totalSent = 0;
    let totalFailed = 0;

    for (const doc of snap.docs) {
        const res = await sendClubPushToMember(doc.id, { title, body, url, type: "broadcast" });
        totalSent += res.sent;
        totalFailed += res.failed;
    }

    await logClubAudit("club.push_broadcast", request.auth.uid, {
        filter: data.memberId ? { memberId: data.memberId } : (data.tier ? { tier: data.tier } : { all: true }),
        title, body, totalSent, totalFailed
    });

    return { success: true, totalSent, totalFailed, membersTargeted: snap.size };
});

// -------------------------------------------------------------------
// 8.9 clubExpireCoins (scheduled diario 03:00 BRT)
// -------------------------------------------------------------------
exports.clubExpireCoins = onSchedule({
    schedule: "0 3 * * *",
    timeZone: "America/Sao_Paulo",
    region: CLUB_REGION
}, async () => {
    const config = await getClubConfig();
    const now = admin.firestore.Timestamp.now();

    // Busca transacoes de earn/bonus com expiresAt passado e ainda nao expiradas.
    const earnTypes = ["earn", "bonus_signup", "bonus_firstorder", "bonus_birthday",
        "bonus_referrer", "bonus_referred", "game_desafio", "game_scratch", "manual_admin"];

    const expiredByMember = new Map();
    // Firestore limita 'in' a 30 itens, mas aqui sao poucos tipos.
    const snap = await db.collection("milkycoins_transactions")
        .where("type", "in", earnTypes)
        .where("expiresAt", "<=", now.toDate())
        .where("expired", "!=", true)
        .limit(500)
        .get()
        .catch(async () => {
            // Firestore pode rejeitar o composite. Fallback: apenas filtra por expiresAt.
            return await db.collection("milkycoins_transactions")
                .where("expiresAt", "<=", now.toDate())
                .limit(500)
                .get();
        });

    snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.expired === true) return;
        if (!earnTypes.includes(d.type)) return;
        if (!(d.amount > 0)) return;
        const list = expiredByMember.get(d.memberId) || [];
        list.push({ id: doc.id, ...d });
        expiredByMember.set(d.memberId, list);
    });

    let processed = 0;
    for (const [memberId, txs] of expiredByMember.entries()) {
        const memberRef = db.collection("club_members").doc(memberId);
        try {
            await db.runTransaction(async (tx) => {
                const memberSnap = await tx.get(memberRef);
                if (!memberSnap.exists) return;
                const member = memberSnap.data();
                let totalToExpire = 0;
                for (const t of txs) {
                    totalToExpire += Number(t.amount || 0);
                }
                if (totalToExpire <= 0) return;

                const expireAmount = Math.min(member.coins || 0, totalToExpire);
                const newBalance = Math.max(0, (member.coins || 0) - expireAmount);

                const expireRef = db.collection("milkycoins_transactions")
                    .doc("expire_" + memberId + "_" + now.toMillis());
                tx.set(expireRef, {
                    memberId,
                    type: "expire",
                    amount: -expireAmount,
                    franchiseId: null,
                    orderId: null,
                    description: "Expiracao de MilkyCoins (" + txs.length + " transacoes)",
                    idempotencyKey: expireRef.id,
                    balanceAfter: newBalance,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: "system"
                });

                tx.set(memberRef, {
                    coins: newBalance,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                for (const t of txs) {
                    tx.set(db.collection("milkycoins_transactions").doc(t.id), {
                        expired: true,
                        expiredAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            });
            processed += 1;
        } catch (error) {
            console.warn("expire error member=" + memberId, error.message);
        }
    }

    await logClubAudit("club.expire_coins", "system", {
        processedMembers: processed,
        totalTxs: snap.size
    });

    console.log("[MilkyClube] clubExpireCoins OK - members=" + processed + " txs=" + snap.size);
});

// -------------------------------------------------------------------
// 8.10 clubGameBonus (HMAC anti-fraude)
// -------------------------------------------------------------------
exports.clubGameBonus = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;
    const data = request.data || {};
    const game = String(data.game || "").trim();
    const amount = Math.floor(Number(data.amount || 0));
    const token = String(data.token || "").trim();
    const timestamp = Number(data.timestamp || 0);

    if (!["desafio10", "scratch"].includes(game)) {
        throw new HttpsError("invalid-argument", "game invalido");
    }
    if (!(amount > 0)) {
        throw new HttpsError("invalid-argument", "amount deve ser positivo");
    }

    if (!validateGameBonusToken(game, uid, amount, timestamp, token)) {
        throw new HttpsError("permission-denied", "Token HMAC invalido ou expirado");
    }

    const config = await getClubConfig();
    // Valida teto conforme config.
    if (game === "scratch") {
        const minB = Number(config.bonuses.scratchMin || 1);
        const maxB = Number(config.bonuses.scratchMax || 50);
        if (amount < minB || amount > maxB) {
            throw new HttpsError("invalid-argument", "amount fora do intervalo do scratch");
        }
    } else if (game === "desafio10") {
        const max = Number(config.bonuses.gameDesafio10 || 10);
        if (amount > max) {
            throw new HttpsError("invalid-argument", "amount acima do teto do desafio");
        }
    }

    const memberRef = db.collection("club_members").doc(uid);
    const txId = "game_" + game + "_" + uid + "_" + timestamp;
    const txRef = db.collection("milkycoins_transactions").doc(txId);

    const result = await db.runTransaction(async (tx) => {
        const existing = await tx.get(txRef);
        if (existing.exists) {
            return { idempotent: true, balanceAfter: existing.data().balanceAfter };
        }
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists) {
            throw new HttpsError("not-found", "Membro nao encontrado");
        }
        const member = memberSnap.data();
        const type = game === "scratch" ? "game_scratch" : "game_desafio";
        const res = await applyCoinGrantTx(tx, memberRef, member, amount, txRef, {
            memberId: uid,
            type,
            amount,
            franchiseId: null,
            orderId: null,
            description: "Bonus " + game,
            idempotencyKey: txId,
            expiresAt: computeExpiresAt(config),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "system"
        }, config);
        return { idempotent: false, amount, balanceAfter: res.balanceAfter };
    });

    await logClubAudit("club.game_bonus", uid, { game, amount, result });
    return result;
});

// -------------------------------------------------------------------
// 8.11 clubAdminListMembers
// -------------------------------------------------------------------
exports.clubAdminListMembers = onCall({ region: CLUB_REGION }, async (request) => {
    assertClubAuth(request);
    const role = request.auth.token.role || null;
    if (!["super_admin", "franchisee", "manager"].includes(role)) {
        throw new HttpsError("permission-denied", "Sem permissao para listar membros");
    }

    const data = request.data || {};
    const limit = Math.min(Math.max(parseInt(data.limit || 50, 10) || 50, 1), 200);
    const tier = data.tier ? String(data.tier) : null;
    const franchiseId = data.franchiseId ? String(data.franchiseId) : null;
    const cursor = data.cursor ? String(data.cursor) : null;

    let q = db.collection("club_members");
    if (tier) q = q.where("tier", "==", tier);
    q = q.orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
        const cursorSnap = await db.collection("club_members").doc(cursor).get();
        if (cursorSnap.exists) q = q.startAfter(cursorSnap);
    }

    const snap = await q.get();
    let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filtro de franchiseId: como member nao e exclusivo de uma franquia,
    // cruzamos com transacoes recentes para indicar atividade na franquia.
    if (franchiseId && role !== "super_admin") {
        const memberIds = docs.map((d) => d.id);
        if (memberIds.length) {
            const actByMember = new Set();
            const chunks = [];
            for (let i = 0; i < memberIds.length; i += 10) {
                chunks.push(memberIds.slice(i, i + 10));
            }
            for (const ch of chunks) {
                const txSnap = await db.collection("milkycoins_transactions")
                    .where("franchiseId", "==", franchiseId)
                    .where("memberId", "in", ch)
                    .limit(200)
                    .get();
                txSnap.docs.forEach((t) => actByMember.add(t.data().memberId));
            }
            docs = docs.filter((d) => actByMember.has(d.id));
        }
    }

    // Sanitiza PII antes de enviar para franqueado.
    if (role !== "super_admin") {
        docs = docs.map((d) => ({
            id: d.id,
            name: d.name,
            phone: d.phone ? d.phone.slice(0, -4) + "****" : null,
            cpfMasked: d.cpfMasked,
            tier: d.tier,
            coins: d.coins,
            ordersCount: d.ordersCount,
            totalSpent: d.totalSpent,
            lastOrderAt: d.lastOrderAt,
            createdAt: d.createdAt
        }));
    }

    return {
        members: docs,
        nextCursor: snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null
    };
});

// -------------------------------------------------------------------
// 8.12 clubDeleteAccount — LGPD: exclusao do member + anonimizacao
// -------------------------------------------------------------------
// Retencao fiscal: transacoes NAO sao apagadas (obrigacao legal de 5 anos).
// Sao anonimizadas: memberId vira hash irreversivel; PII (name/phone/cpf) removida.
// Member doc e fcm_tokens sao deletados. Auth user e deletado ao final.
exports.clubDeleteAccount = onCall({ region: CLUB_REGION, timeoutSeconds: 120 }, async (request) => {
    assertClubAuth(request);
    const uid = request.auth.uid;

    const memberRef = db.collection("club_members").doc(uid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
        // Nada a apagar: apenas tenta limpar auth user se existir
        try { await auth.deleteUser(uid); } catch (e) { /* ja removido */ }
        return { success: true, message: "Conta ja inexistente" };
    }

    const member = memberSnap.data();

    // Hash irreversivel do uid para anonimizacao das transacoes
    const anonId = "anon_" + crypto.createHash("sha256")
        .update(uid + (process.env.LGPD_ANON_SALT || "milkyclube-anon-salt"))
        .digest("hex").slice(0, 24);

    try {
        // 1) Anonimiza transacoes (mantem para fiscal/auditoria)
        const txSnap = await db.collection("milkycoins_transactions")
            .where("memberId", "==", uid)
            .get();
        const batchLimit = 450;
        for (let i = 0; i < txSnap.docs.length; i += batchLimit) {
            const batch = db.batch();
            txSnap.docs.slice(i, i + batchLimit).forEach((d) => {
                batch.update(d.ref, {
                    memberId: anonId,
                    _anonymizedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        // 2) Remove tokens FCM
        const tokensSnap = await db.collection("fcm_tokens")
            .where("memberId", "==", uid)
            .get();
        for (let i = 0; i < tokensSnap.docs.length; i += batchLimit) {
            const batch = db.batch();
            tokensSnap.docs.slice(i, i + batchLimit).forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }

        // 3) Remove referral code (se unico do usuario)
        if (member.referralCode) {
            try {
                await db.collection("club_referrals").doc(member.referralCode).delete();
            } catch (e) { /* ignore */ }
        }

        // 4) Remove doc do member
        await memberRef.delete();

        // 5) Audit log (com dados ja mascarados)
        await db.collection("audit_log").add({
            event: "club.member_deleted",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: uid,
            details: {
                anonId,
                phoneMasked: member.phone ? member.phone.slice(0, 4) + "****" : null,
                transactionsAnonymized: txSnap.size,
                tokensRemoved: tokensSnap.size
            }
        });

        // 6) Deleta usuario do Firebase Auth (irreversivel)
        try {
            await auth.deleteUser(uid);
        } catch (e) {
            // Mesmo que falhe, o member ja foi removido — retorna sucesso parcial
            console.warn("clubDeleteAccount: auth.deleteUser falhou:", e && e.message);
        }

        return {
            success: true,
            message: "Conta excluida. Dados pessoais removidos; historico transacional anonimizado conforme obrigacao fiscal.",
            anonId
        };
    } catch (error) {
        console.error("clubDeleteAccount error:", error);
        throw new HttpsError("internal", error.message || "Falha ao excluir conta");
    }
});

// ============================================
// FIM MILKYCLUBE
// ============================================

