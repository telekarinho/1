/* ============================================
   MilkyPot - Cart System (localStorage-based)
   ============================================ */

const CART_KEY = 'milkypot_cart';

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ============================================
// CART OPERATIONS
// ============================================
function addToCart(productId) {
    // Legacy addToCart (from data.js PRODUCTS array)
    if (typeof PRODUCTS !== 'undefined') {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ ...product, qty: 1, total: product.price });
        }

        saveCart();
        updateCartUI();
        showToast(`${product.emoji} ${product.name} adicionado!`);
    }

    // Animate cart button
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.classList.add('cart-add-anim');
        setTimeout(() => cartBtn.classList.remove('cart-add-anim'), 400);
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => String(item.id) !== String(itemId));
    saveCart();
    updateCartUI();
}

function updateQty(itemId, delta) {
    const item = cart.find(i => String(i.id) === String(itemId));
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(itemId);
        return;
    }
    // Recalculate total
    if (item.sizePrice !== undefined) {
        let extrasTotal = 0;
        if (item.extras) item.extras.forEach(e => extrasTotal += e.price);
        item.total = (item.sizePrice + extrasTotal) * item.qty;
    } else if (item.price) {
        item.total = item.price * item.qty;
    }
    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        if (item.total) return sum + item.total;
        if (item.price) return sum + (item.price * item.qty);
        return sum;
    }, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

// ============================================
// CART UI
// ============================================
function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const footerEl = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');

    // Reload from localStorage (in case bottom sheet added items)
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

    if (countEl) countEl.textContent = getCartCount();

    if (itemsEl) {
        if (cart.length === 0) {
            itemsEl.innerHTML = `
                <div class="cart-empty">
                    <span class="cart-empty-icon">🛒</span>
                    <p>Seu carrinho está vazio</p>
                    <small>Adicione produtos deliciosos!</small>
                </div>
            `;
        } else {
            itemsEl.innerHTML = cart.map(item => {
                const itemEmoji = item.emoji || '🍨';
                const itemName = item.name || 'Produto';
                const itemTotal = item.total || (item.price ? item.price * item.qty : 0);
                const itemId = item.id;
                const extrasText = item.extras && item.extras.length > 0
                    ? '<small class="cart-item-extras">' + item.extras.map(e => e.name).join(', ') + '</small>'
                    : '';
                const sizeText = item.size ? '<small class="cart-item-size">' + item.size + '</small>' : '';

                return `
                    <div class="cart-item">
                        <div class="cart-item-img" style="background: linear-gradient(135deg, #D6ECFF, #BBDEFB)">
                            ${itemEmoji}
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${itemName}</div>
                            ${sizeText}
                            ${extrasText}
                            <div class="cart-item-price">${formatCurrency(itemTotal)}</div>
                            <div class="cart-item-qty">
                                <button class="qty-btn" onclick="updateQty('${itemId}', -1)">−</button>
                                <span>${item.qty || 1}</span>
                                <button class="qty-btn" onclick="updateQty('${itemId}', 1)">+</button>
                            </div>
                        </div>
                        <button class="cart-item-remove" onclick="removeFromCart('${itemId}')" aria-label="Remover">✕</button>
                    </div>
                `;
            }).join('');
        }
    }

    if (footerEl) {
        footerEl.style.display = cart.length > 0 ? 'block' : 'none';
    }

    if (totalEl) {
        totalEl.textContent = formatCurrency(getCartTotal());
    }

    // Also update sticky cart bar if present
    const stickyCart = document.getElementById('stickyCart');
    if (stickyCart) {
        if (cart.length === 0) {
            stickyCart.style.display = 'none';
        } else {
            const totalItems = getCartCount();
            const totalPrice = getCartTotal();
            const stickyText = document.getElementById('stickyCartText');
            const stickyTotal = document.getElementById('stickyCartTotal');
            if (stickyText) stickyText.textContent = totalItems + (totalItems === 1 ? ' item' : ' itens');
            if (stickyTotal) stickyTotal.textContent = formatCurrency(totalPrice);
            stickyCart.style.display = 'flex';
        }
    }
}

function getCategoryBg(category) {
    const bgs = {
        potinhos: 'linear-gradient(135deg, #D6ECFF, #BBDEFB)',
        milkshakes: 'linear-gradient(135deg, #F0DBFF, #DBF0FF)',
        acai: 'linear-gradient(135deg, #E0D0F8, #DBF0FF)',
        sorvetes: 'linear-gradient(135deg, #DBF0FF, #D0FFE8)',
        especiais: 'linear-gradient(135deg, #FFE5A5, #D6ECFF)',
        combos: 'linear-gradient(135deg, #D0FFE8, #FFE5A5)'
    };
    return bgs[category] || bgs.potinhos;
}

// ============================================
// CART SIDEBAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const sidebar = document.getElementById('cartSidebar');

    function openCartSidebar() {
        updateCartUI(); // Refresh from localStorage
        if (sidebar) sidebar.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        if (sidebar) sidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (cartBtn) cartBtn.addEventListener('click', openCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);

    // Initial UI update
    updateCartUI();
});
