/* ============================================================
   MilkyPot — Uber Direct Integration (Cloud Functions v2)
   ============================================================
   Exports:
     uberDirect_saveSettings       onCall
     uberDirect_getSettings        onCall
     uberDirect_testConnection     onCall
     uberDirect_getQuote           onCall
     uberDirect_createDelivery     onCall
     uberDirect_getDelivery        onCall
     uberDirect_savePricingRules   onCall
     uberDirect_getPricingRules    onCall
     uberDirect_webhook            onRequest (public endpoint)
   ============================================================ */

"use strict";

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

// ---- Firebase handles -------------------------------------------------------
// admin.initializeApp() is already called in index.js; reuse the default app.
const db = admin.firestore;  // lazy getter — avoids double-init race

function getDb() {
    return admin.firestore();
}

// ---- Firebase Secret --------------------------------------------------------
const UBER_ENCRYPTION_KEY = defineSecret("UBER_ENCRYPTION_KEY");

// ---- Constants --------------------------------------------------------------
const REGION = "southamerica-east1";
const UBER_TOKEN_URL = "https://auth.uber.com/oauth/v2/token";
const UBER_API_BASE = "https://api.uber.com/v1/customers";
const TOKEN_CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes (Uber TTL = 60 min)

// Status mapping: Uber Direct → MilkyPot internal
const UBER_STATUS_MAP = {
    pickup: "entregador_a_caminho_da_loja",
    pickup_complete: "pedido_retirado",
    dropoff: "saiu_para_entrega",
    delivered: "entregue",
    cancelled: "cancelado",
    canceled: "cancelado",   // Uber uses both spellings
    failed: "falha",
};

// ============================================================
// ---- Cryptography helpers ----------------------------------
// ============================================================

/**
 * Derives a 32-byte AES key from the raw secret stored in Firebase Secret Manager.
 * Falls back to a project-scoped default so the code runs in local emulator without the secret.
 */
function getUberEncKey() {
    const raw =
        (UBER_ENCRYPTION_KEY.value && UBER_ENCRYPTION_KEY.value()) ||
        process.env.UBER_ENCRYPTION_KEY ||
        process.env.GCLOUD_PROJECT ||
        "milkypot-uber-direct-dev-fallback";
    return crypto.createHash("sha256").update(raw).digest(); // 32 bytes
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Format: base64(iv[12] | authTag[16] | ciphertext)
 */
function encryptSecret(value) {
    const key = getUberEncKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypts a value previously encrypted with encryptSecret().
 */
function decryptSecret(encoded) {
    const key = getUberEncKey();
    const buf = Buffer.from(encoded, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// ============================================================
// ---- Auth guard & franchise resolution ---------------------
// ============================================================

/**
 * Validates authentication and resolves franchiseId.
 * super_admin may pass an explicit franchiseId; franchisees/managers use their own.
 * Falls back to Firestore users/{uid} when JWT has no custom claims (claims not yet set).
 */
async function resolveUberContext(request, requestedFranchiseId = null) {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }

    let role = request.auth.token.role || null;
    let ownFranchiseId = request.auth.token.franchiseId || null;

    // Fallback: if no claims yet, look up the user profile in Firestore
    if (!role) {
        try {
            const userDoc = await getDb().collection("users").doc(request.auth.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                role = userData.role || null;
                ownFranchiseId = ownFranchiseId || userData.franchiseId || null;
            }
        } catch (e) {
            console.warn("resolveUberContext: Firestore user lookup failed:", e.message);
        }
    }

    // Last-resort: if the user is the owner email, treat as super_admin
    const OWNER_EMAIL = "jocimarrodrigo@gmail.com";
    const FRANCHISE_EMAIL = "milkypot.com@gmail.com";
    if (!role) {
        const email = request.auth.token.email || "";
        if (email === OWNER_EMAIL) {
            role = "super_admin";
        } else if (email === FRANCHISE_EMAIL) {
            role = "franchisee";
            ownFranchiseId = ownFranchiseId || requestedFranchiseId || "muffato-quintino";
        }
    }

    const isSuperAdmin = role === "super_admin";
    const allowedRoles = ["super_admin", "franchisee", "manager"];
    if (!allowedRoles.includes(role)) {
        throw new HttpsError("permission-denied", "Perfil sem permissao para o modulo Uber Direct");
    }

    const franchiseId = isSuperAdmin
        ? (requestedFranchiseId || ownFranchiseId || null)
        : ownFranchiseId;

    if (!franchiseId) {
        throw new HttpsError("failed-precondition", "franchiseId nao identificado no token do usuario");
    }

    return { franchiseId, role, isSuperAdmin };
}

// ============================================================
// ---- Uber OAuth2 token (with Firestore cache) --------------
// ============================================================

/**
 * Fetches an access_token from Uber, caching it in Firestore to avoid
 * hammering the token endpoint on every API call (TTL: 55 min).
 *
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} franchiseId  - used only as Firestore cache key namespace
 * @returns {Promise<string>} access_token
 */
async function getUberAccessToken(clientId, clientSecret, franchiseId) {
    const db = getDb();
    const cacheRef = db.collection("uber_settings").doc(franchiseId);
    const snap = await cacheRef.get();
    const data = snap.exists ? snap.data() : {};

    const now = Date.now();
    if (
        data._tokenCache &&
        data._tokenCache.accessToken &&
        data._tokenCache.expiresAt > now
    ) {
        return data._tokenCache.accessToken;
    }

    // Request new token
    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "eats.deliveries",
    });

    const res = await fetch(UBER_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new HttpsError(
            "internal",
            `Uber OAuth falhou (${res.status}): ${body.slice(0, 200)}`
        );
    }

    const json = await res.json();
    const accessToken = json.access_token;
    const expiresAt = now + (json.expires_in ? json.expires_in * 1000 : TOKEN_CACHE_TTL_MS);

    // Cache in Firestore (merge to avoid overwriting settings)
    await cacheRef.set(
        { _tokenCache: { accessToken, expiresAt, fetchedAt: now } },
        { merge: true }
    );

    return accessToken;
}

// ============================================================
// ---- Uber API helper ---------------------------------------
// ============================================================

async function uberRequest(method, url, token, body = null) {
    const opts = {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
        throw new HttpsError(
            "internal",
            `Uber API error ${res.status}: ${JSON.stringify(json).slice(0, 300)}`
        );
    }
    return json;
}

// ============================================================
// ---- Logging helper ----------------------------------------
// ============================================================

/**
 * Writes a log entry to uber_logs/{franchiseId}/entries (subcollection).
 * Never logs the raw client secret — caller must scrub before passing request payload.
 */
async function logUberEvent(franchiseId, { action, requestPayload, responsePayload, durationMs, error = null }) {
    try {
        const db = getDb();
        await db
            .collection("uber_logs")
            .doc(franchiseId)
            .collection("entries")
            .add({
                action,
                requestPayload: requestPayload || null,
                responsePayload: responsePayload || null,
                durationMs: durationMs || 0,
                error: error || null,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
    } catch (err) {
        console.warn("uber_logs write failed:", err.message);
    }
}

// ============================================================
// ---- Pricing rules engine ----------------------------------
// ============================================================

/**
 * Applies the franchise pricing rules to the raw Uber fee.
 *
 * @param {object} rules          - document from uber_pricing_rules/{franchiseId}
 * @param {number} uberFeeCents   - fee returned by Uber in smallest currency unit (centavos)
 * @param {number} orderTotalCents
 * @param {number} distanceKm
 * @returns {{ customerFeeCents, isFree, absorbedBy }}
 */
function applyPricingRules(rules, uberFeeCents, orderTotalCents, distanceKm) {
    if (!rules || !rules.pricing_mode) {
        return { customerFeeCents: uberFeeCents, isFree: false, absorbedBy: null };
    }

    // --- Free delivery check (overrides everything) ---
    if (
        rules.free_delivery_enabled &&
        orderTotalCents >= (rules.free_delivery_min_order_value || 0) &&
        distanceKm <= (rules.free_delivery_max_km || Infinity)
    ) {
        return { customerFeeCents: 0, isFree: true, absorbedBy: rules.free_delivery_absorbed_by || "franchise" };
    }

    // --- Pricing mode ---
    let customerFeeCents = uberFeeCents;
    let absorbedBy = null;

    switch (rules.pricing_mode) {
        case "exact_uber":
            customerFeeCents = uberFeeCents;
            break;

        case "uber_plus_margin": {
            const marginType = rules.margin_type || "fixed";
            if (marginType === "percent") {
                const pct = Number(rules.margin_value || 0);
                customerFeeCents = Math.round(uberFeeCents * (1 + pct / 100));
            } else {
                // fixed (centavos)
                customerFeeCents = uberFeeCents + Math.round(Number(rules.margin_value || 0));
            }
            break;
        }

        case "own_table": {
            // Distance-based table: array of { max_km, fee_cents }
            const table = rules.distance_table || [];
            const entry = table
                .sort((a, b) => a.max_km - b.max_km)
                .find((row) => distanceKm <= row.max_km);
            customerFeeCents = entry ? entry.fee_cents : uberFeeCents;
            break;
        }

        case "fixed_fee":
            customerFeeCents = Math.round(Number(rules.fixed_fee_cents || 0));
            break;

        case "free_campaign":
            customerFeeCents = 0;
            absorbedBy = rules.free_campaign_absorbed_by || "franchise";
            break;

        default:
            customerFeeCents = uberFeeCents;
    }

    return { customerFeeCents, isFree: customerFeeCents === 0, absorbedBy };
}

// ============================================================
// ---- 1. uberDirect_saveSettings ---------------------------
// ============================================================
exports.uberDirect_saveSettings = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const {
        customer_id,
        client_id,
        client_secret,
        environment = "production",
        pickup_name,
        pickup_address,
        pickup_phone,
        pickup_latitude,
        pickup_longitude,
        prep_time_minutes,
        enabled = true,
    } = request.data || {};

    if (!customer_id || !client_id || !client_secret) {
        throw new HttpsError(
            "invalid-argument",
            "customer_id, client_id e client_secret sao obrigatorios"
        );
    }

    const db = getDb();
    const ref = db.collection("uber_settings").doc(franchiseId);
    const existing = await ref.get();

    const payload = {
        franchiseId,
        customer_id: String(customer_id).trim(),
        client_id: String(client_id).trim(),
        client_secret_encrypted: encryptSecret(String(client_secret).trim()),
        environment: environment === "sandbox" ? "sandbox" : "production",
        pickup_name: pickup_name || "",
        pickup_address: pickup_address || "",
        pickup_phone: pickup_phone || "",
        pickup_latitude: pickup_latitude || null,
        pickup_longitude: pickup_longitude || null,
        prep_time_minutes: parseInt(prep_time_minutes) || 10,
        enabled: Boolean(enabled),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
    };

    if (!existing.exists) {
        payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        payload.createdBy = request.auth.uid;
    }

    // Preserve the token cache if it exists
    if (existing.exists && existing.data()._tokenCache) {
        payload._tokenCache = existing.data()._tokenCache;
    }

    await ref.set(payload, { merge: true });

    await logUberEvent(franchiseId, {
        action: "settings.saved",
        requestPayload: { ...payload, client_secret_encrypted: "***" },
        responsePayload: null,
        durationMs: 0,
    });

    return {
        success: true,
        data: {
            franchiseId,
            customer_id,
            client_id,
            client_secret: "***masked***",
            environment,
            enabled,
        },
    };
});

// ============================================================
// ---- 2. uberDirect_getSettings ----------------------------
// ============================================================
exports.uberDirect_getSettings = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const db = getDb();
    const snap = await db.collection("uber_settings").doc(franchiseId).get();

    if (!snap.exists) {
        return { success: true, data: null };
    }

    const d = snap.data();
    return {
        success: true,
        data: {
            franchiseId: d.franchiseId,
            customer_id: d.customer_id || "",
            client_id: d.client_id || "",
            client_secret: d.client_secret_encrypted ? "***masked***" : "",
            environment: d.environment || "production",
            pickup_name: d.pickup_name || "",
            pickup_address: d.pickup_address || "",
            pickup_phone: d.pickup_phone || "",
            pickup_latitude: d.pickup_latitude || null,
            pickup_longitude: d.pickup_longitude || null,
            prep_time_minutes: d.prep_time_minutes || 10,
            enabled: d.enabled !== false,
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
        },
    };
});

// ============================================================
// ---- 3. uberDirect_testConnection -------------------------
// ============================================================
exports.uberDirect_testConnection = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
    timeoutSeconds: 30,
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const db = getDb();
    const snap = await db.collection("uber_settings").doc(franchiseId).get();
    if (!snap.exists) {
        throw new HttpsError("not-found", "Configuracoes Uber Direct nao encontradas para esta franquia");
    }

    const settings = snap.data();
    const clientId = settings.client_id;
    const clientSecret = decryptSecret(settings.client_secret_encrypted);

    const t0 = Date.now();
    let error = null;
    let token = null;

    try {
        token = await getUberAccessToken(clientId, clientSecret, franchiseId);
    } catch (err) {
        error = err.message;
    }

    const durationMs = Date.now() - t0;

    await logUberEvent(franchiseId, {
        action: "connection.test",
        requestPayload: { client_id: clientId },
        responsePayload: { ok: !error, durationMs },
        durationMs,
        error,
    });

    if (error) {
        return { success: false, data: { ok: false, error, durationMs } };
    }

    return {
        success: true,
        data: {
            ok: true,
            durationMs,
            message: "Conexao com Uber Direct estabelecida com sucesso",
            tokenPreview: token ? token.slice(0, 8) + "..." : null,
        },
    };
});

// ============================================================
// ---- 4. uberDirect_getQuote --------------------------------
// ============================================================
exports.uberDirect_getQuote = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
    timeoutSeconds: 30,
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const {
        orderId,
        dropoff_address,
        dropoff_name,
        dropoff_phone_number,
        manifest_items,
        order_total_cents = 0,
        distance_km = 0,
        pricing_mode,
    } = request.data || {};

    if (!dropoff_address || !dropoff_name || !dropoff_phone_number) {
        throw new HttpsError(
            "invalid-argument",
            "dropoff_address, dropoff_name e dropoff_phone_number sao obrigatorios"
        );
    }

    const db = getDb();

    // Load settings
    const settingsSnap = await db.collection("uber_settings").doc(franchiseId).get();
    if (!settingsSnap.exists) {
        throw new HttpsError("not-found", "Configuracoes Uber Direct nao encontradas");
    }
    const settings = settingsSnap.data();
    if (!settings.enabled) {
        throw new HttpsError("failed-precondition", "Entrega Uber Direct desabilitada para esta franquia");
    }

    const clientId = settings.client_id;
    const clientSecret = decryptSecret(settings.client_secret_encrypted);
    const customerId = settings.customer_id;

    // Load pricing rules
    const rulesSnap = await db.collection("uber_pricing_rules").doc(franchiseId).get();
    const rules = rulesSnap.exists ? rulesSnap.data() : null;
    const effectivePricingMode = pricing_mode || (rules && rules.pricing_mode) || "exact_uber";

    const t0 = Date.now();
    let quoteData = null;
    let error = null;

    try {
        const token = await getUberAccessToken(clientId, clientSecret, franchiseId);

        const quoteBody = {
            pickup_address: settings.pickup_address,
            dropoff_address,
            pickup_name: settings.pickup_name,
            dropoff_name,
            pickup_phone_number: settings.pickup_phone,
            dropoff_phone_number,
            manifest_items: manifest_items || [{ name: "Pedido MilkyPot", quantity: 1, size: "small" }],
        };

        const url = `${UBER_API_BASE}/${customerId}/delivery_quotes`;
        quoteData = await uberRequest("POST", url, token, quoteBody);
    } catch (err) {
        error = err.message;
    }

    const durationMs = Date.now() - t0;

    await logUberEvent(franchiseId, {
        action: "quote.requested",
        requestPayload: {
            orderId,
            dropoff_address,
            dropoff_name,
            order_total_cents,
            distance_km,
        },
        responsePayload: quoteData,
        durationMs,
        error,
    });

    if (error) {
        throw new HttpsError("internal", `Erro ao obter cotacao Uber: ${error}`);
    }

    // ---- Pricing calculation ----
    const uberFeeCents = quoteData.fee != null ? Math.round(Number(quoteData.fee)) : 0;
    const { customerFeeCents, isFree, absorbedBy } = applyPricingRules(
        rules ? { ...rules, pricing_mode: effectivePricingMode } : null,
        uberFeeCents,
        order_total_cents,
        distance_km
    );

    // Save quote doc for later delivery creation
    if (orderId) {
        await db.collection("uber_quotes").doc(orderId).set({
            franchiseId,
            orderId,
            quote_id: quoteData.quote_id,
            uber_fee_cents: uberFeeCents,
            customer_fee_cents: customerFeeCents,
            is_free: isFree,
            absorbed_by: absorbedBy,
            currency: quoteData.currency || "BRL",
            raw_quote: quoteData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return {
        success: true,
        data: {
            quote_id: quoteData.quote_id,
            uber_fee: uberFeeCents,
            customer_fee: customerFeeCents,
            is_free: isFree,
            absorbed_by: absorbedBy,
            currency: quoteData.currency || "BRL",
            pickup_duration: quoteData.pickup_duration || null,
            dropoff_eta: quoteData.dropoff_eta || null,
            expires_at: quoteData.expires || null,
            raw: quoteData,
        },
    };
});

// ============================================================
// ---- 5. uberDirect_createDelivery -------------------------
// ============================================================
exports.uberDirect_createDelivery = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
    timeoutSeconds: 60,
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const {
        orderId,
        quote_id,
        dropoff_name,
        dropoff_address,
        dropoff_phone_number,
        dropoff_latitude,
        dropoff_longitude,
        manifest_items,
        dropoff_notes = "",
    } = request.data || {};

    if (!orderId || !quote_id || !dropoff_name || !dropoff_address || !dropoff_phone_number) {
        throw new HttpsError(
            "invalid-argument",
            "orderId, quote_id, dropoff_name, dropoff_address e dropoff_phone_number sao obrigatorios"
        );
    }

    const db = getDb();

    // Load settings
    const settingsSnap = await db.collection("uber_settings").doc(franchiseId).get();
    if (!settingsSnap.exists) {
        throw new HttpsError("not-found", "Configuracoes Uber Direct nao encontradas");
    }
    const settings = settingsSnap.data();
    if (!settings.enabled) {
        throw new HttpsError("failed-precondition", "Entrega Uber Direct desabilitada para esta franquia");
    }

    const clientId = settings.client_id;
    const clientSecret = decryptSecret(settings.client_secret_encrypted);
    const customerId = settings.customer_id;

    const t0 = Date.now();
    let deliveryData = null;
    let error = null;

    try {
        const token = await getUberAccessToken(clientId, clientSecret, franchiseId);

        const body = {
            quote_id,
            pickup_name: settings.pickup_name,
            pickup_address: settings.pickup_address,
            pickup_phone_number: settings.pickup_phone,
            dropoff_name,
            dropoff_address,
            dropoff_phone_number,
            manifest_items: manifest_items || [{ name: "Pedido MilkyPot", quantity: 1, size: "small" }],
        };

        if (settings.pickup_latitude) body.pickup_latitude = settings.pickup_latitude;
        if (settings.pickup_longitude) body.pickup_longitude = settings.pickup_longitude;
        if (dropoff_latitude) body.dropoff_latitude = dropoff_latitude;
        if (dropoff_longitude) body.dropoff_longitude = dropoff_longitude;
        if (dropoff_notes) body.dropoff_notes = dropoff_notes;

        const url = `${UBER_API_BASE}/${customerId}/deliveries`;
        deliveryData = await uberRequest("POST", url, token, body);
    } catch (err) {
        error = err.message;
    }

    const durationMs = Date.now() - t0;

    await logUberEvent(franchiseId, {
        action: "delivery.created",
        requestPayload: { orderId, quote_id, dropoff_name, dropoff_address },
        responsePayload: deliveryData,
        durationMs,
        error,
    });

    if (error) {
        throw new HttpsError("internal", `Erro ao criar entrega Uber: ${error}`);
    }

    const internalStatus = UBER_STATUS_MAP[deliveryData.status] || deliveryData.status;

    // Persist delivery document
    await db.collection("uber_deliveries").doc(orderId).set({
        franchiseId,
        orderId,
        uber_delivery_id: deliveryData.id,
        status_uber: deliveryData.status,
        status_internal: internalStatus,
        tracking_url: deliveryData.tracking_url || null,
        courier: deliveryData.courier || null,
        pickup_eta: deliveryData.pickup_eta || null,
        dropoff_eta: deliveryData.dropoff_eta || null,
        raw_delivery: deliveryData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update the order document with delivery info and status
    try {
        await db.collection("orders").doc(orderId).set(
            {
                uber_delivery_id: deliveryData.id,
                uber_tracking_url: deliveryData.tracking_url || null,
                delivery_status: internalStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    } catch (orderErr) {
        console.warn("Failed to update orders doc for orderId", orderId, orderErr.message);
    }

    return {
        success: true,
        data: {
            uber_delivery_id: deliveryData.id,
            status: internalStatus,
            status_uber: deliveryData.status,
            tracking_url: deliveryData.tracking_url || null,
            courier: deliveryData.courier || null,
            pickup_eta: deliveryData.pickup_eta || null,
            dropoff_eta: deliveryData.dropoff_eta || null,
        },
    };
});

// ============================================================
// ---- 6. uberDirect_getDelivery ----------------------------
// ============================================================
exports.uberDirect_getDelivery = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
    timeoutSeconds: 20,
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const { orderId } = request.data || {};
    if (!orderId) {
        throw new HttpsError("invalid-argument", "orderId e obrigatorio");
    }

    const db = getDb();

    // Load delivery doc (for uber_delivery_id)
    const delivSnap = await db.collection("uber_deliveries").doc(orderId).get();
    if (!delivSnap.exists) {
        throw new HttpsError("not-found", "Entrega Uber nao encontrada para este pedido");
    }

    const delivData = delivSnap.data();
    const uberDeliveryId = delivData.uber_delivery_id;

    // Load settings
    const settingsSnap = await db.collection("uber_settings").doc(franchiseId).get();
    if (!settingsSnap.exists) {
        throw new HttpsError("not-found", "Configuracoes Uber Direct nao encontradas");
    }
    const settings = settingsSnap.data();
    const clientId = settings.client_id;
    const clientSecret = decryptSecret(settings.client_secret_encrypted);
    const customerId = settings.customer_id;

    const t0 = Date.now();
    let statusData = null;
    let error = null;

    try {
        const token = await getUberAccessToken(clientId, clientSecret, franchiseId);
        const url = `${UBER_API_BASE}/${customerId}/deliveries/${uberDeliveryId}`;
        statusData = await uberRequest("GET", url, token);
    } catch (err) {
        error = err.message;
    }

    const durationMs = Date.now() - t0;

    await logUberEvent(franchiseId, {
        action: "delivery.status_checked",
        requestPayload: { orderId, uberDeliveryId },
        responsePayload: statusData,
        durationMs,
        error,
    });

    if (error) {
        throw new HttpsError("internal", `Erro ao consultar entrega Uber: ${error}`);
    }

    const internalStatus = UBER_STATUS_MAP[statusData.status] || statusData.status;

    // Keep Firestore in sync
    await db.collection("uber_deliveries").doc(orderId).set(
        {
            status_uber: statusData.status,
            status_internal: internalStatus,
            courier: statusData.courier || null,
            pickup_eta: statusData.pickup_eta || null,
            dropoff_eta: statusData.dropoff_eta || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    return {
        success: true,
        data: {
            uber_delivery_id: statusData.id,
            status: internalStatus,
            status_uber: statusData.status,
            tracking_url: statusData.tracking_url || null,
            courier: statusData.courier || null,
            pickup_eta: statusData.pickup_eta || null,
            dropoff_eta: statusData.dropoff_eta || null,
        },
    };
});

// ============================================================
// ---- 7. uberDirect_savePricingRules -----------------------
// ============================================================
exports.uberDirect_savePricingRules = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
}, async (request) => {
    const { franchiseId, isSuperAdmin } = await resolveUberContext(request, request.data?.franchiseId);

    // Only super_admin or franchisee can change pricing
    if (!isSuperAdmin && request.auth.token.role !== "franchisee") {
        throw new HttpsError("permission-denied", "Apenas super_admin ou franqueado podem alterar regras de frete");
    }

    const {
        pricing_mode,
        margin_type,
        margin_value,
        distance_table,
        fixed_fee_cents,
        free_delivery_enabled,
        free_delivery_min_order_value,
        free_delivery_max_km,
        free_delivery_absorbed_by,
        free_campaign_absorbed_by,
    } = request.data || {};

    const validModes = ["exact_uber", "uber_plus_margin", "own_table", "fixed_fee", "free_campaign"];
    if (!pricing_mode || !validModes.includes(pricing_mode)) {
        throw new HttpsError("invalid-argument", `pricing_mode invalido. Valores aceitos: ${validModes.join(", ")}`);
    }

    const payload = {
        franchiseId,
        pricing_mode,
        margin_type: margin_type || "fixed",
        margin_value: Number(margin_value || 0),
        distance_table: Array.isArray(distance_table) ? distance_table : [],
        fixed_fee_cents: Number(fixed_fee_cents || 0),
        free_delivery_enabled: Boolean(free_delivery_enabled),
        free_delivery_min_order_value: Number(free_delivery_min_order_value || 0),
        free_delivery_max_km: Number(free_delivery_max_km || 0),
        free_delivery_absorbed_by: free_delivery_absorbed_by || "franchise",
        free_campaign_absorbed_by: free_campaign_absorbed_by || "franchise",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
    };

    const db = getDb();
    await db.collection("uber_pricing_rules").doc(franchiseId).set(payload, { merge: true });

    await logUberEvent(franchiseId, {
        action: "pricing_rules.saved",
        requestPayload: payload,
        responsePayload: null,
        durationMs: 0,
    });

    return { success: true, data: payload };
});

// ============================================================
// ---- 8. uberDirect_getPricingRules ------------------------
// ============================================================
exports.uberDirect_getPricingRules = onCall({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
}, async (request) => {
    const { franchiseId } = await resolveUberContext(request, request.data?.franchiseId);

    const db = getDb();
    const snap = await db.collection("uber_pricing_rules").doc(franchiseId).get();

    return {
        success: true,
        data: snap.exists ? snap.data() : null,
    };
});

// ============================================================
// ---- 9. uberDirect_webhook (onRequest, public) ------------
// ============================================================
/**
 * Public HTTPS endpoint that receives Uber Direct webhook events.
 * URL after deploy: https://<region>-<project>.cloudfunctions.net/uberDirect_webhook
 * Recommended: configure this as /webhook/uber-direct in Firebase Hosting rewrite rules.
 *
 * Uber sends POST with JSON body. We do idempotent processing via Firestore
 * deduplication on event_id.
 */
exports.uberDirect_webhook = onRequest({
    region: REGION,
    secrets: [UBER_ENCRYPTION_KEY],
    timeoutSeconds: 30,
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const db = getDb();
    const body = req.body;

    if (!body || typeof body !== "object") {
        res.status(400).send("Bad Request: invalid JSON body");
        return;
    }

    const eventId = body.event_id || body.id || null;
    const eventType = body.event_type || body.type || null;

    // ---- Deduplication ----
    if (eventId) {
        const dedupRef = db.collection("uber_webhook_events").doc(String(eventId));
        const dedupSnap = await dedupRef.get();
        if (dedupSnap.exists) {
            // Already processed — return 200 so Uber stops retrying
            res.status(200).json({ received: true, duplicate: true });
            return;
        }
        // Mark as received immediately to prevent race conditions
        await dedupRef.set({
            event_id: eventId,
            event_type: eventType,
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
            raw: body,
        });
    }

    // ---- Extract delivery metadata ----
    // Uber payload structure varies slightly; handle both flat and nested formats.
    const meta = body.meta || body;
    const uberDeliveryId =
        (body.delivery && body.delivery.id) ||
        body.delivery_id ||
        meta.delivery_id ||
        null;

    const uberStatus =
        (body.delivery && body.delivery.status) ||
        body.status ||
        meta.status ||
        null;

    const internalStatus = uberStatus ? (UBER_STATUS_MAP[uberStatus] || uberStatus) : null;

    // ---- Find matching MilkyPot order ----
    // uber_deliveries docs are keyed by orderId but contain uber_delivery_id.
    // Reverse lookup: query by uber_delivery_id.
    let orderId = null;
    if (uberDeliveryId) {
        const q = await db
            .collection("uber_deliveries")
            .where("uber_delivery_id", "==", uberDeliveryId)
            .limit(1)
            .get();

        if (!q.empty) {
            const doc = q.docs[0];
            orderId = doc.id;
            const franchiseId = doc.data().franchiseId;

            // Update uber_deliveries tracking doc
            await doc.ref.set(
                {
                    status_uber: uberStatus,
                    status_internal: internalStatus,
                    courier: (body.delivery && body.delivery.courier) || null,
                    dropoff_eta: (body.delivery && body.delivery.dropoff_eta) || null,
                    last_webhook_event: eventType,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            // Update orders/{orderId}
            try {
                await db.collection("orders").doc(orderId).set(
                    {
                        delivery_status: internalStatus,
                        uber_tracking_url:
                            (body.delivery && body.delivery.tracking_url) || null,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
            } catch (orderErr) {
                console.warn("webhook: failed to update orders doc", orderId, orderErr.message);
            }

            // Write log entry
            await logUberEvent(franchiseId, {
                action: `webhook.${eventType || "event"}`,
                requestPayload: { uberDeliveryId, uberStatus, eventType },
                responsePayload: { orderId, internalStatus },
                durationMs: 0,
            });
        } else {
            console.warn("webhook: no uber_deliveries match for uber_delivery_id", uberDeliveryId);
        }
    }

    res.status(200).json({ received: true, orderId, internalStatus });
});
