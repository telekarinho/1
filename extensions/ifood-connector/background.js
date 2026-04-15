// AVISO DE SEGURANÇA: Esta extensão grava no Firestore sem autenticação Firebase.
// As Firestore Rules permitem escrita em ifood_* sem auth temporariamente.
// TODO: Implementar Firebase Auth anônimo para identificar escritas da extensão.

/* ============================================
   MilkyPot iFood Connector - Background Script
   Recebe pedidos do content script e envia pro Firestore
   ============================================ */

const FIREBASE_PROJECT = 'milkypot-ad945';
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents';

// Tentar auth anônima para identificar a extensão
async function getFirebaseToken() {
  try {
    var authResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({returnSecureToken: true})
    });
    var authData = await authResp.json();
    return authData.idToken || null;
  } catch(e) { return null; }
}

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

// Bug C — heurística de centavos mais segura
function parseOrderValue(val) {
  if (typeof val === 'number') {
    // iFood geralmente retorna em centavos (inteiro grande)
    // Se > 10000 assume centavos (R$100+), senão assume reais
    return val > 10000 ? val / 100 : val;
  }
  return parseFloat(val) || 0;
}

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
                 order.items.length + ' item(s) - R$ ' + parseOrderValue(order.total?.total || 0).toFixed(2).replace('.', ','),
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

// BUG B — Anti-padrão corrigido: cada pedido é salvo como documento individual
// em vez de acumular tudo em ifood_${storeId} (limite 1MB por documento).
async function saveToFirestore(order) {
    // Obter token de auth anônima (Bug A)
    const token = await getFirebaseToken();
    const authHeader = token ? { 'Authorization': 'Bearer ' + token } : {};

    // Salvar cada pedido como documento individual (Bug B)
    var pedidoDoc = 'ifood_' + order.storeId + '_' + (order.ifoodId || order.id || Date.now());

    const res = await fetch(FIRESTORE_URL + '/datastore/' + pedidoDoc, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
            fields: {
                ifoodId:   { stringValue: order.ifoodId || '' },
                storeId:   { stringValue: order.storeId || '' },
                createdAt: { stringValue: order.createdAt || new Date().toISOString() },
                value:     { stringValue: JSON.stringify(order) }
            }
        })
    });

    if (!res.ok) {
        throw new Error('Firestore write failed: ' + res.status);
    }
}
