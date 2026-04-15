/* ============================================
   MilkyPot iFood Connector - Popup Script
   ============================================ */

const CONFIG_KEY = 'milkypot_ifood_config';
const ORDERS_KEY = 'milkypot_ifood_orders';

document.addEventListener('DOMContentLoaded', () => {
    loadState();

    document.getElementById('toggleEnabled').addEventListener('change', (e) => {
        saveConfig({ enabled: e.target.checked });
        updateStatusUI(e.target.checked);
    });

    document.getElementById('storeSelect').addEventListener('change', (e) => {
        saveConfig({ storeId: e.target.value });
    });
});

// Bug D — heurística de centavos mais segura (mesmo padrão do background.js)
function parseOrderValue(val) {
  if (typeof val === 'number') {
    // iFood geralmente retorna em centavos (inteiro grande)
    // Se > 10000 assume centavos (R$100+), senão assume reais
    return val > 10000 ? val / 100 : val;
  }
  return parseFloat(val) || 0;
}

function loadState() {
    chrome.storage.local.get([CONFIG_KEY, ORDERS_KEY], (result) => {
        const config = result[CONFIG_KEY] || {};
        const orders = result[ORDERS_KEY] || [];

        // Set toggle
        const toggle = document.getElementById('toggleEnabled');
        toggle.checked = config.enabled || false;
        updateStatusUI(config.enabled || false);

        // Set store
        const select = document.getElementById('storeSelect');
        if (config.storeId) select.value = config.storeId;

        // Stats
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
        document.getElementById('totalOrders').textContent = todayOrders.length;

        const revenue = todayOrders.reduce((sum, o) => {
            return sum + parseOrderValue(o.total?.total || 0);
        }, 0);
        document.getElementById('totalRevenue').textContent = 'R$ ' + revenue.toFixed(0);

        // Render orders
        renderOrders(orders.slice(0, 10));
    });
}

function updateStatusUI(enabled) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    dot.className = 'status-dot ' + (enabled ? 'active' : 'inactive');
    text.textContent = enabled ? 'Ativo - Capturando' : 'Desativado';
}

function saveConfig(updates) {
    chrome.storage.local.get(CONFIG_KEY, (result) => {
        const config = { ...(result[CONFIG_KEY] || {}), ...updates };
        chrome.storage.local.set({ [CONFIG_KEY]: config });
    });
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (orders.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#999;font-size:12px;padding:20px;">Nenhum pedido capturado ainda</div>';
        return;
    }

    list.innerHTML = orders.map(o => {
        const shortId = o.ifoodShortId || o.ifoodId?.slice(-6) || '???';
        const itemNames = o.items?.map(i => i.quantity + 'x ' + i.name).join(', ') || '';
        const total = o.total?.total || 0;
        const totalStr = parseOrderValue(total).toFixed(2).replace('.', ',');
        const time = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

        return '<div class="order-item">' +
            '<div class="oi-head"><span>#' + shortId + '</span><span>' + time + '</span></div>' +
            '<div class="oi-items">' + itemNames + '</div>' +
            '<div class="oi-total">R$ ' + totalStr + '</div>' +
        '</div>';
    }).join('');
}
