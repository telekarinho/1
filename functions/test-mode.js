/* ============================================
   MilkyPot — Test Mode & Production Mode
   Cloud Functions
   ============================================
   generateTestToken  — gera token custom Firebase para o Claude testar
   setSystemMode      — alterna entre modo teste e producao
   getSystemMode      — retorna modo atual + checklist
   saveChecklistItem  — salva estado de um item do checklist
   ============================================ */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// admin.initializeApp() already called in index.js
function getDb()   { return admin.firestore(); }
function getAuth() { return admin.auth(); }

// ----------------------------------------
// resolveTestAdmin — valida super_admin
// ----------------------------------------
async function resolveTestAdmin(request) {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login necessario");
    const email = (request.auth.token.email || "").toLowerCase().trim();
    const role  = request.auth.token.role  || null;
    const OWNER = "jocimarrodrigo@gmail.com";
    const isSuperAdmin = role === "super_admin" || email === OWNER;
    if (!isSuperAdmin) throw new HttpsError("permission-denied", "Apenas super_admin pode executar esta acao");
    return { uid: request.auth.uid, email };
}

// ============================================
// generateTestToken
// ============================================
// Gera um Firebase custom token para o agente de teste (Claude).
// O token e valido por 1 hora e pode ser usado em:
//   https://milkypot.com/login?testToken=<TOKEN>&fid=<franchiseId>
// ============================================
// Gera token de validacao usando UUID + Firestore lookup (sem IAM signBlob).
// Login.html valida o token batendo no doc test_tokens/<token> em vez de
// firebaseAuth.signInWithCustomToken — evita dependencia de
// roles/iam.serviceAccountTokenCreator que falhava com "INTERNAL".
const crypto = require("crypto");
exports.generateTestToken = onCall({ region: "southamerica-east1" }, async (request) => {
    const caller = await resolveTestAdmin(request);
    const { franchiseId } = request.data;
    if (!franchiseId) throw new HttpsError("invalid-argument", "franchiseId obrigatorio");

    const safeId  = franchiseId.replace(/[^a-zA-Z0-9]/g, "_");
    const testUid = `test_agent_${safeId}`;

    // Token aleatorio de 32 bytes (URL-safe)
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora

    // Salva token em Firestore — login.html valida via lookup
    await getDb().collection("test_tokens").doc(token).set({
        token,
        testUid,
        franchiseId,
        role:        "franchisee",
        isTestSession: true,
        name:        `Test Agent (${franchiseId})`,
        email:       `${testUid}@test.milkypot.internal`,
        expiresAt:   expiresAt,
        used:        false,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedBy: caller.email
    });

    // Persiste sessao de teste ativa
    await getDb().collection("system_config").doc(franchiseId).set({
        testSession: {
            active:       true,
            testUid,
            generatedAt:  admin.firestore.FieldValue.serverTimestamp(),
            generatedBy:  caller.email
        }
    }, { merge: true });

    await getDb().collection("audit_logs").add({
        action:      "test_token_generated",
        franchiseId,
        by:          caller.uid,
        byEmail:     caller.email,
        testUid,
        createdAt:   admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        success:    true,
        token,
        testUid,
        franchiseId,
        loginUrl:   `https://milkypot.com/login.html?testToken=${encodeURIComponent(token)}&fid=${encodeURIComponent(franchiseId)}`,
        expiresIn:  "1 hora"
    };
});

// ============================================
// setSystemMode
// ============================================
// mode: "test" | "production"
// ============================================
exports.setSystemMode = onCall({ region: "southamerica-east1" }, async (request) => {
    const caller = await resolveTestAdmin(request);
    const { mode, franchiseId = "global" } = request.data;
    if (!["test", "production"].includes(mode)) {
        throw new HttpsError("invalid-argument", "mode deve ser 'test' ou 'production'");
    }

    await getDb().collection("system_config").doc(franchiseId).set({
        mode,
        isTestMode:       mode === "test",
        isProductionMode: mode === "production",
        modeChangedAt:    admin.firestore.FieldValue.serverTimestamp(),
        modeChangedBy:    caller.email
    }, { merge: true });

    await getDb().collection("audit_logs").add({
        action:      `system_mode_${mode}`,
        franchiseId,
        by:          caller.uid,
        byEmail:     caller.email,
        createdAt:   admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, mode, franchiseId };
});

// ============================================
// getSystemMode
// ============================================
exports.getSystemMode = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login necessario");

    const franchiseId = request.data.franchiseId || "global";
    const doc = await getDb().collection("system_config").doc(franchiseId).get();
    const data = doc.exists ? doc.data() : {};

    // Busca checklist
    const clDoc = await getDb().collection("test_checklist").doc(franchiseId).get();
    const checklist = clDoc.exists ? clDoc.data() : { items: {}, completedCount: 0, totalCount: 0 };

    return {
        success:          true,
        mode:             data.mode || "test",
        isTestMode:       data.isTestMode !== false,
        isProductionMode: data.isProductionMode === true,
        modeChangedAt:    data.modeChangedAt || null,
        modeChangedBy:    data.modeChangedBy || null,
        checklist
    };
});

// ============================================
// saveChecklistItem
// ============================================
exports.saveChecklistItem = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login necessario");

    const { franchiseId, itemId, status, notes = "" } = request.data;
    if (!franchiseId || !itemId) throw new HttpsError("invalid-argument", "franchiseId e itemId sao obrigatorios");
    if (!["pending", "pass", "fail"].includes(status)) throw new HttpsError("invalid-argument", "status invalido");

    const ref = getDb().collection("test_checklist").doc(franchiseId);
    await ref.set({
        items: {
            [itemId]: {
                status,
                notes,
                testedAt:  admin.firestore.FieldValue.serverTimestamp(),
                testedBy:  request.auth.token.email || request.auth.uid
            }
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, itemId, status };
});
