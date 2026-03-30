/* ============================================
   MilkyPot iFood Connector - Background Script
   Recebe pedidos do content script e envia pro Firestore
   ============================================ */

const FIREBASE_PROJECT = 'milkypot-ad945';
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents';

// Listen for orders from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'IFOOD_ORDER_CAPTURED') {
        handleOrder(message.order)
            .then(() => sendResponse({ success: true }))
            .catch(err => {
                console.error('Error saving order:', err);
                sendResponse({ success: false, error: err.message });
            });
        return true; // Keep channel open for async response
    }
});

async function handleOrder(order) {
    // Save locally first (offline-safe)
    await saveLocally(order);

    // Try to save to Firestore (public write to ifood_orders collection)
    try {
        await saveToFirestore(order);
    } catch (e) {
        console.warn('Firestore save failed, saved locally:', e);
        // Will be synced later
    }

    // Show Chrome notification
    chrome.notifications.create('order_' + order.ifoodId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'MilkyPot - Pedido iFood',
        message: 'Pedido #' + (order.ifoodShortId || order.ifoodId.slice(-4)) + ' capturado! ' +
                 order.items.length + ' item(s) - R$ ' + (order.total.total / 100).toFixed(2).replace('.', ','),
        priority: 2
    });
}

async function saveLocally(order) {
    return new Promise(resolve => {
        chrome.storage.local.get('milkypot_ifood_orders', result => {
            const orders = result.milkypot_ifood_orders || [];
            // Avoid duplicates
            if (orders.find(o => o.ifoodId === order.ifoodId)) {
                resolve();
                return;
            }
            orders.unshift(order);
            // Keep last 200 orders
            if (orders.length > 200) orders.splice(200);
            chrome.storage.local.set({ milkypot_ifood_orders: orders }, resolve);
        });
    });
}

async function saveToFirestore(order) {
    // Use Firestore REST API (no auth needed for public collection)
    const docId = 'ifood_' + order.storeId;

    // Get existing orders for this store
    let existingOrders = [];
    try {
        const getRes = await fetch(FIRESTORE_URL + '/datastore/' + docId);
        if (getRes.ok) {
            const doc = await getRes.json();
            if (doc.fields?.value?.stringValue) {
                existingOrders = JSON.parse(doc.fields.value.stringValue);
            }
        }
    } catch (e) {}

    // Avoid duplicates
    if (existingOrders.find(o => o.ifoodId === order.ifoodId)) return;

    // Add new order at beginning
    existingOrders.unshift(order);
    // Keep last 100
    if (existingOrders.length > 100) existingOrders.splice(100);

    // Save back
    const res = await fetch(FIRESTORE_URL + '/datastore/' + docId + '?updateMask.fieldPaths=value', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                value: { stringValue: JSON.stringify(existingOrders) }
            }
        })
    });

    if (!res.ok) {
        throw new Error('Firestore write failed: ' + res.status);
    }
}
