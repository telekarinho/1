/* ============================================
   MilkyPot - Unified Cart System (localStorage)
   ============================================

   UNIFIED ITEM FORMAT:
   {
     id: String,           // unique ID (timestamp)
     name: String,         // "Shake de Morango"
     emoji: String,        // "🍓"
     baseId: String,
     baseName: String,
     formatoId: String,
     formatoName: String,
     saborId: String,
     size: String,         // size id e.g. "medio"
     sizeName: String,     // "Médio"
     sizeMl: Number,       // 500
     sizePrice: Number,    // 18.00
     extras: [{id, name, price}],
     bebidas: [{id, name, price, qty}],
     nomeCliente: String,  // optional
     qty: Number,
     total: Number         // (sizePrice + extras + bebidas) * qty
   }
   ============================================ */

const CART_KEY = 'milkypot_cart';

// BUG F — JSON.parse com try/catch para carrinho corrompido
var cart = [];
try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]') || [];
    if (!Array.isArray(cart)) cart = [];
} catch(e) {
    console.warn('[CART] Carrinho corrompido, resetando.', e);
    cart = [];
    localStorage.removeItem(CART_KEY);
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function reloadCart() {
    try {
        cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]') || [];
        if (!Array.isArray(cart)) cart = [];
    } catch(e) {
        console.warn('[CART] Carrinho corrompido ao recarregar, resetando.', e);
        cart = [];
        localStorage.removeItem(CART_KEY);
    }
}

// ============================================
// PRICE HELPERS
// ============================================
function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function calcItemTotal(item) {
    var base = item.sizePrice || item.price || 0;
    var extrasTotal = 0;
    if (item.extras && item.extras.length) {
        item.extras.forEach(function(e) { extrasTotal += (e.price || 0) * (e.qty || 1); });
    }
    var bebidasTotal = 0;
    if (item.bebidas && item.bebidas.length) {
        item.bebidas.forEach(function(b) { bebidasTotal += (b.price || 0) * (b.qty || 1); });
    }
    return (base + extrasTotal + bebidasTotal) * (item.qty || 1);
}

// ============================================
// CART OPERATIONS
// ============================================
function addItemToCart(item) {
    reloadCart();
    // BUG G — Usar verificação estrita para aceitar R$0,00 como valor válido
    if (item.total === undefined || item.total === null) item.total = calcItemTotal(item);
    cart.push(item);
    saveCart();
    updateCartUI();
}

function removeFromCart(itemId) {
    reloadCart();
    cart = cart.filter(function(item) { return String(item.id) !== String(itemId); });
    saveCart();
    updateCartUI();
}

function updateQty(itemId, delta) {
    reloadCart();
    var item = cart.find(function(i) { return String(i.id) === String(itemId); });
    if (!item) return;

    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
        removeFromCart(itemId);
        return;
    }
    // Recalculate total
    item.total = calcItemTotal(item);
    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce(function(sum, item) {
        return sum + (item.total || calcItemTotal(item));
    }, 0);
}

function getCartCount() {
    return cart.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

// ============================================
// CART UI RENDERING
// ============================================
function updateCartUI() {
    reloadCart();

    var countEl = document.getElementById('cartCount');
    var itemsEl = document.getElementById('cartItems');
    var footerEl = document.getElementById('cartFooter');
    var totalEl = document.getElementById('cartTotal');

    if (countEl) countEl.textContent = getCartCount();

    if (itemsEl) {
        if (cart.length === 0) {
            itemsEl.innerHTML =
                '<div class="cart-empty">' +
                    '<span class="cart-empty-icon">🛒</span>' +
                    '<p>Seu carrinho está vazio</p>' +
                    '<small>Adicione produtos deliciosos!</small>' +
                '</div>';
        } else {
            itemsEl.innerHTML = cart.map(function(item) {
                var itemEmoji = item.emoji || '🍨';
                var itemName = item.name || 'Produto';
                var itemTotal = item.total || calcItemTotal(item);
                var itemId = item.id;
                var qty = item.qty || 1;

                // Size info
                var sizeText = '';
                if (item.sizeName) {
                    sizeText = '<small class="cart-item-size">' + item.sizeName;
                    if (item.sizeMl) sizeText += ' (' + item.sizeMl + 'ml)';
                    sizeText += '</small>';
                } else if (item.size) {
                    sizeText = '<small class="cart-item-size">' + item.size + '</small>';
                }

                // Format info
                var formatText = '';
                if (item.formatoName) {
                    formatText = '<small class="cart-item-size">' + item.formatoName + '</small>';
                }

                // Extras info
                var extrasText = '';
                if (item.extras && item.extras.length > 0) {
                    extrasText = '<small class="cart-item-extras">' +
                        item.extras.map(function(e) {
                            return e.name + (e.qty && e.qty > 1 ? ' x' + e.qty : '');
                        }).join(', ') + '</small>';
                }

                // Bebidas info
                var bebidasText = '';
                if (item.bebidas && item.bebidas.length > 0) {
                    bebidasText = '<small class="cart-item-extras">' +
                        item.bebidas.map(function(b) {
                            return b.emoji + ' ' + b.name + (b.qty && b.qty > 1 ? ' x' + b.qty : '');
                        }).join(', ') + '</small>';
                }

                // Nome do cliente
                var nomeText = '';
                if (item.nomeCliente) {
                    nomeText = '<small class="cart-item-extras" style="color:#42A5F5">🏷️ ' + item.nomeCliente + '</small>';
                }

                return '<div class="cart-item">' +
                    '<div class="cart-item-img" style="background: linear-gradient(135deg, #D6ECFF, #BBDEFB)">' +
                        itemEmoji +
                    '</div>' +
                    '<div class="cart-item-info">' +
                        '<div class="cart-item-name">' + itemName + '</div>' +
                        formatText +
                        sizeText +
                        extrasText +
                        bebidasText +
                        nomeText +
                        '<div class="cart-item-price">' + formatCurrency(itemTotal) + '</div>' +
                        '<div class="cart-item-qty">' +
                            '<button class="qty-btn" onclick="updateQty(\'' + itemId + '\', -1)">−</button>' +
                            '<span>' + qty + '</span>' +
                            '<button class="qty-btn" onclick="updateQty(\'' + itemId + '\', 1)">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<button class="cart-item-remove" onclick="removeFromCart(\'' + itemId + '\')" aria-label="Remover">✕</button>' +
                '</div>';
            }).join('');
        }
    }

    if (footerEl) {
        footerEl.style.display = cart.length > 0 ? 'block' : 'none';
    }

    if (totalEl) {
        totalEl.textContent = formatCurrency(getCartTotal());
    }

    // Update sticky cart bar if present
    var stickyCart = document.getElementById('stickyCart');
    if (stickyCart) {
        if (cart.length === 0) {
            stickyCart.style.display = 'none';
        } else {
            var totalItems = getCartCount();
            var totalPrice = getCartTotal();
            var stickyText = document.getElementById('stickyCartText');
            var stickyTotal = document.getElementById('stickyCartTotal');
            if (stickyText) stickyText.textContent = totalItems + (totalItems === 1 ? ' item' : ' itens');
            if (stickyTotal) stickyTotal.textContent = formatCurrency(totalPrice);
            stickyCart.style.display = 'flex';
        }
    }
}

// ============================================
// CART SIDEBAR TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var cartBtn = document.getElementById('cartBtn');
    var cartOverlay = document.getElementById('cartOverlay');
    var cartClose = document.getElementById('cartClose');
    var sidebar = document.getElementById('cartSidebar');

    function openCartSidebar() {
        updateCartUI();
        if (sidebar) sidebar.classList.add('active', 'open');
        if (cartOverlay) cartOverlay.classList.add('active', 'open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('cart-open');
        updateCartUI();
    }

    function closeCartSidebar() {
        if (sidebar) sidebar.classList.remove('active', 'open');
        if (cartOverlay) cartOverlay.classList.remove('active', 'open');
        document.body.style.overflow = '';
        document.body.classList.remove('cart-open');
    }

    if (cartBtn) cartBtn.addEventListener('click', openCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartSidebar);
    if (cartClose) cartClose.addEventListener('click', closeCartSidebar);

    // Expose for external use
    window.openCartSidebar = openCartSidebar;
    window.closeCartSidebar = closeCartSidebar;
    window.openCart = openCartSidebar;

    // Initial UI update
    updateCartUI();
});
