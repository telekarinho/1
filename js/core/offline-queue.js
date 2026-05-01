/* ============================================================
   MilkyPot Offline Queue — PDV sobrevive sem internet
   ============================================================
   Problema: loja com internet caindo = PDV morto = fila parada.
   Solução: gravar pedidos SEMPRE em localStorage + IndexedDB,
   sincronizar em background quando net volta.

   API:
     OfflineQueue.init()                    — liga listener online/offline
     OfflineQueue.enqueueOrder(order)       — salva pedido local + marca pending
     OfflineQueue.syncPending()             — força sync de pendentes
     OfflineQueue.getStatus()               — { online, pending, lastSync }
     OfflineQueue.onStatusChange(cb)        — observer pra UI

   Storage keys:
     offline_queue_{fid}  — array de pedidos com flag `_pending: true`
     offline_last_sync_{fid} — timestamp

   Dependencies: DataStore, firebase (opcional)
   ============================================================ */
(function(global){
    'use strict';

    const observers = [];
    let _syncing = false;
    let _timer = null;

    // Detecção de estado online robusta
    function isOnline() {
        if (typeof navigator === 'undefined') return true;
        return navigator.onLine !== false;
    }

    function notify(status) {
        observers.forEach(cb => { try { cb(status); } catch(e) {} });
    }

    function onStatusChange(cb) {
        if (typeof cb === 'function') observers.push(cb);
    }

    function getStatus(fid) {
        const pending = (global.DataStore && global.DataStore.get('offline_queue_' + fid)) || [];
        const lastSync = (global.DataStore && global.DataStore.get('offline_last_sync_' + fid)) || null;
        return {
            online: isOnline(),
            pending: pending.length,
            lastSync: lastSync
        };
    }

    /**
     * Enfileira pedido local — SEMPRE grava, mesmo online.
     * Se online, tenta sync imediato; se falhar, deixa pendente.
     */
    function enqueueOrder(fid, order) {
        if (!global.DataStore || !fid || !order) return false;

        // Sempre marca timestamp local
        order._enqueuedAt = new Date().toISOString();
        order._pending = true;
        if (!order.id) order.id = 'ord_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);

        // Grava no array principal de orders (pra PDV/pedidos enxergarem)
        const orders = global.DataStore.getCollection ?
            (global.DataStore.getCollection('orders', fid) || []) : [];
        orders.push(order);
        if (global.DataStore.setCollection) {
            global.DataStore.setCollection('orders', fid, orders);
        } else {
            global.DataStore.set('orders_' + fid, orders);
        }

        // Queue paralela pra controle
        const q = global.DataStore.get('offline_queue_' + fid) || [];
        q.push({ id: order.id, enqueuedAt: order._enqueuedAt });
        global.DataStore.set('offline_queue_' + fid, q);

        notify(getStatus(fid));

        // Tenta sync imediato se online
        if (isOnline()) setTimeout(() => syncPending(fid), 200);

        return order;
    }

    /**
     * Tenta sincronizar todos os pedidos pendentes.
     * Cada pedido bem-sucedido é marcado `_pending:false`.
     */
    function syncPending(fid) {
        if (_syncing || !isOnline() || !fid || !global.DataStore) return Promise.resolve({ synced: 0 });
        _syncing = true;

        return new Promise(resolve => {
            try {
                const orders = (global.DataStore.getCollection ?
                    global.DataStore.getCollection('orders', fid) : null) ||
                    global.DataStore.get('orders_' + fid) || [];
                const pending = orders.filter(o => o._pending);

                if (!pending.length) {
                    _syncing = false;
                    return resolve({ synced: 0 });
                }

                // Se Firestore disponível, faz batch write
                let synced = 0;
                const done = () => {
                    // Marca não-pending
                    pending.forEach(p => { p._pending = false; p._syncedAt = new Date().toISOString(); });
                    if (global.DataStore.setCollection) {
                        global.DataStore.setCollection('orders', fid, orders);
                    } else {
                        global.DataStore.set('orders_' + fid, orders);
                    }
                    // Limpa queue
                    global.DataStore.set('offline_queue_' + fid, []);
                    global.DataStore.set('offline_last_sync_' + fid, new Date().toISOString());
                    _syncing = false;
                    notify(getStatus(fid));
                    resolve({ synced: pending.length });
                };

                if (global.firebase && global.firebase.firestore) {
                    try {
                        const db = global.firebase.firestore();
                        const batch = db.batch();
                        pending.forEach(p => {
                            const ref = db.collection('orders_' + fid).doc(p.id);
                            batch.set(ref, Object.assign({}, p, { _pending: false }), { merge: true });
                        });
                        batch.commit().then(done).catch(err => {
                            console.warn('[OfflineQueue] batch failed, retry later:', err);
                            _syncing = false;
                            resolve({ synced: 0, error: err.message });
                        });
                        return;
                    } catch(e) {
                        console.warn('[OfflineQueue] firestore unavailable:', e);
                    }
                }

                // Sem Firebase disponível — DataStore._writeToCloud já cuida no set
                done();

            } catch(e) {
                console.error('[OfflineQueue] syncPending:', e);
                _syncing = false;
                resolve({ synced: 0, error: e.message });
            }
        });
    }

    function _scheduleSync(fid) {
        if (_timer) clearTimeout(_timer);
        _timer = setTimeout(() => syncPending(fid), 3000);
    }

    function init(fid) {
        if (typeof window === 'undefined') return;
        fid = fid || (global.Auth && global.Auth.getSession && global.Auth.getSession().franchiseId);
        if (!fid) {
            // retry até ter sessão
            setTimeout(() => init(), 1500);
            return;
        }

        window.addEventListener('online', () => {
            console.log('[OfflineQueue] 🟢 Online — disparando sync...');
            notify(getStatus(fid));
            _scheduleSync(fid);
        });
        window.addEventListener('offline', () => {
            console.log('[OfflineQueue] 🔴 Offline — modo local ativo');
            notify(getStatus(fid));
        });

        // Tentativa inicial em 5s
        setTimeout(() => syncPending(fid), 5000);

        // Retry periódico a cada 60s (se tiver pendentes)
        setInterval(() => {
            const s = getStatus(fid);
            if (s.pending > 0 && s.online) syncPending(fid);
        }, 60000);
    }

    global.OfflineQueue = {
        init, enqueueOrder, syncPending, getStatus, onStatusChange, isOnline
    };
})(typeof window !== 'undefined' ? window : this);
