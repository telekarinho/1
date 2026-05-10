/* ============================================================
   MilkyPot — Cloud Function: migrar orders legado -> subcoleção
   ============================================================
   ADR-001. Migra `datastore/orders_{fid}` (array gigante) para
   `franchises/{fid}/orders/{orderId}` (doc por pedido).

   Idempotente: rodando 2x produz mesmo resultado (set com merge:true,
   id = order.id).

   Como executar via CLI:
     firebase functions:call migrateOrdersToSubcollection \
       --data '{"franchiseId":"muffato-quintino","dryRun":false}' \
       --project milkypot-ad945

   Resposta:
     { total, migrated, skipped, errors }

   Como verificar:
     firebase functions:call verifyOrdersMigration \
       --data '{"franchiseId":"muffato-quintino"}' \
       --project milkypot-ad945
   ============================================================ */
"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const REGION = "southamerica-east1";

function getDb() { return admin.firestore(); }

exports.migrateOrdersToSubcollection = onCall({
    region: REGION,
    timeoutSeconds: 540,
    memory: "512MiB"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    if (request.auth.token.role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin pode migrar");
    }

    const franchiseId = request.data?.franchiseId;
    if (!franchiseId || typeof franchiseId !== "string") {
        throw new HttpsError("invalid-argument", "franchiseId obrigatorio");
    }
    const dryRun = request.data?.dryRun !== false; // default DRY RUN

    const db = getDb();
    const legacyDoc = await db.collection("datastore").doc("orders_" + franchiseId).get();
    if (!legacyDoc.exists) {
        return { migrated: 0, reason: "no_legacy_doc", franchiseId };
    }

    let orders = [];
    try {
        const v = legacyDoc.data().value;
        orders = JSON.parse(v) || [];
    } catch (e) {
        throw new HttpsError("failed-precondition", "legacy_parse_error: " + e.message);
    }
    if (!Array.isArray(orders)) {
        throw new HttpsError("failed-precondition", "legacy_value nao e array");
    }

    const ref = db.collection("franchises").doc(franchiseId).collection("orders");
    const result = { total: orders.length, migrated: 0, skipped: 0, errors: [], dryRun };

    const BATCH_SIZE = 400;
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const slice = orders.slice(i, i + BATCH_SIZE);
        if (dryRun) {
            result.skipped += slice.length;
            continue;
        }
        const batch = db.batch();
        for (const o of slice) {
            if (!o || !o.id) {
                result.errors.push({ idx: i, reason: "no_id" });
                continue;
            }
            const docRef = ref.doc(String(o.id));
            batch.set(docRef, {
                ...o,
                _migratedAt: admin.firestore.FieldValue.serverTimestamp(),
                _writeSource: "migration-v1"
            }, { merge: true });
            result.migrated++;
        }
        try { await batch.commit(); }
        catch (e) { result.errors.push({ batchStart: i, error: e.message }); }
    }

    // Audit log
    try {
        await db.collection("audit_log").add({
            event: "ops.orders_migration",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: request.auth.uid,
            details: { franchiseId, ...result }
        });
    } catch (_) {}

    return result;
});

exports.verifyOrdersMigration = onCall({
    region: REGION
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Autenticacao necessaria");
    }
    if (request.auth.token.role !== "super_admin") {
        throw new HttpsError("permission-denied", "Apenas super_admin");
    }

    const franchiseId = request.data?.franchiseId;
    if (!franchiseId) throw new HttpsError("invalid-argument", "franchiseId obrigatorio");

    const db = getDb();
    const legacyDoc = await db.collection("datastore").doc("orders_" + franchiseId).get();
    let legacyCount = 0;
    if (legacyDoc.exists) {
        try {
            const v = legacyDoc.data().value;
            legacyCount = (JSON.parse(v) || []).length;
        } catch (_) {}
    }

    const subSnap = await db.collection("franchises").doc(franchiseId)
        .collection("orders").count().get();
    const subCount = subSnap.data().count;

    return {
        franchiseId,
        legacyCount,
        subCount,
        ok: subCount >= legacyCount,
        delta: subCount - legacyCount
    };
});
