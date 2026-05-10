/* ============================================================
   MilkyPot — DataStore Subcollection Adapter (ADR-001)
   ============================================================
   Adapter OPCIONAL que faz dual-write em `franchises/{fid}/orders/{orderId}`
   alem do legado `datastore/orders_{fid}`. Permite testar a subcolecao
   antes do flip definitivo (estoura limite 1MB em 30+ franquias).

   Ativacao: flag MP.USE_SUBCOLLECTION_ORDERS = true (em constants.js
   ou via DataStore.set('feature_flags', { useSubcollectionOrders: true })).

   Quando ativo:
   - addOrder() grava em AMBOS (legado + subcolecao). Sem disrupcao.
   - getOrdersStream() prefere subcolecao se houver, fallback legado.
   - migrateOrdersToSubcollection() one-shot copia legado -> subcolecao.

   Quando inativo (default): no-op completo. Codigo legado fica intacto.

   Roll-out plan: ver docs/migration-orders-subcollection.md.
   ============================================================ */
(function(global){
    'use strict';
    if (global._mpDsSubLoaded) return;
    global._mpDsSubLoaded = true;

    function isEnabled() {
        try {
            if (global.MP && global.MP.USE_SUBCOLLECTION_ORDERS === true) return true;
            const flags = (global.DataStore && global.DataStore.get
                ? global.DataStore.get('feature_flags')
                : null) || {};
            return flags.useSubcollectionOrders === true;
        } catch (_) { return false; }
    }

    function getFirestoreDb() {
        try {
            if (!global.firebase || !global.firebase.firestore) return null;
            return global.firebase.firestore();
        } catch (_) { return null; }
    }

    function ordersRef(franchiseId) {
        const db = getFirestoreDb();
        if (!db || !franchiseId) return null;
        return db.collection('franchises').doc(franchiseId).collection('orders');
    }

    // ---- Write (dual-write quando enabled) ----
    async function writeOrderToSubcollection(order, franchiseId) {
        if (!isEnabled()) return { skipped: true };
        const ref = ordersRef(franchiseId);
        if (!ref) return { error: 'firestore_unavailable' };
        if (!order || !order.id) return { error: 'order_invalid' };
        try {
            // O id do doc na subcolecao = order.id (idempotente).
            await ref.doc(String(order.id)).set({
                ...order,
                _writtenAt: global.firebase.firestore.FieldValue.serverTimestamp(),
                _writeSource: 'adapter-v1'
            }, { merge: true });
            return { ok: true };
        } catch (e) {
            console.warn('[ds-sub] writeOrder error:', e);
            return { error: e.message };
        }
    }

    // ---- Read (paginated) ----
    async function getOrdersPaginated(franchiseId, opts) {
        opts = opts || {};
        if (!isEnabled()) return null; // sinaliza pro caller usar legado
        const ref = ordersRef(franchiseId);
        if (!ref) return null;
        try {
            let q = ref.orderBy('createdAt', 'desc');
            if (opts.status) q = q.where('status', '==', opts.status);
            if (opts.startAfter) q = q.startAfter(opts.startAfter);
            q = q.limit(opts.limit || 50);
            const snap = await q.get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('[ds-sub] getOrdersPaginated error:', e);
            return null;
        }
    }

    // ---- Listener (paginated) ----
    function listenOrders(franchiseId, opts, cb) {
        if (!isEnabled()) return () => {};
        const ref = ordersRef(franchiseId);
        if (!ref) return () => {};
        opts = opts || {};
        let q = ref.orderBy('createdAt', 'desc').limit(opts.limit || 50);
        if (opts.status) q = q.where('status', '==', opts.status);
        return q.onSnapshot(snap => {
            try { cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (_) {}
        }, err => {
            console.warn('[ds-sub] listenOrders error:', err);
        });
    }

    // ---- One-shot migration (dispara via console admin) ----
    async function migrateOrdersToSubcollection(franchiseId, opts) {
        opts = opts || {};
        const dryRun = opts.dryRun !== false; // default DRY RUN
        const ref = ordersRef(franchiseId);
        if (!ref) throw new Error('firestore_unavailable');

        const legacyDoc = await getFirestoreDb()
            .collection('datastore').doc('orders_' + franchiseId).get();
        if (!legacyDoc.exists) {
            return { migrated: 0, reason: 'no_legacy_doc' };
        }
        const legacyValue = legacyDoc.data().value;
        let orders = [];
        try { orders = JSON.parse(legacyValue) || []; } catch (e) {
            throw new Error('legacy_parse_error: ' + e.message);
        }
        if (!Array.isArray(orders)) throw new Error('legacy_not_array');

        const results = { total: orders.length, migrated: 0, skipped: 0, errors: [] };
        const BATCH_SIZE = 400;
        for (let i = 0; i < orders.length; i += BATCH_SIZE) {
            const slice = orders.slice(i, i + BATCH_SIZE);
            if (dryRun) {
                results.skipped += slice.length;
                continue;
            }
            const batch = getFirestoreDb().batch();
            for (const o of slice) {
                if (!o || !o.id) { results.errors.push({ idx: i, reason: 'no_id' }); continue; }
                const docRef = ref.doc(String(o.id));
                batch.set(docRef, {
                    ...o,
                    _migratedAt: global.firebase.firestore.FieldValue.serverTimestamp(),
                    _writeSource: 'migration-v1'
                }, { merge: true });
                results.migrated++;
            }
            try { await batch.commit(); }
            catch (e) { results.errors.push({ batchStart: i, error: e.message }); }
        }
        return results;
    }

    // ---- Verify migration (counts in both) ----
    async function verifyMigration(franchiseId) {
        const ref = ordersRef(franchiseId);
        if (!ref) return { error: 'firestore_unavailable' };

        const legacyDoc = await getFirestoreDb()
            .collection('datastore').doc('orders_' + franchiseId).get();
        let legacyCount = 0;
        try {
            const v = legacyDoc.exists ? legacyDoc.data().value : '[]';
            legacyCount = (JSON.parse(v) || []).length;
        } catch (_) {}

        const subSnap = await ref.get();
        return {
            legacyCount,
            subCount: subSnap.size,
            ok: subSnap.size >= legacyCount
        };
    }

    global.DataStoreSub = {
        isEnabled,
        writeOrderToSubcollection,
        getOrdersPaginated,
        listenOrders,
        migrateOrdersToSubcollection,
        verifyMigration
    };
})(typeof window !== 'undefined' ? window : this);
