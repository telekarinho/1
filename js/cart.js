/* ============================================
   MilkyPot - Cart System
   ============================================ */

let cart = [];

// ============================================
// CART OPERATIONS
// ============================================
function addToCart(productId) {
    if (!selectedStore) {
        showToast('Selecione uma loja primeiro! 📍');
        scrollToSection('pedir');
        return;
    }

    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
    showToast(`${product.emoji} ${product.name} adicionado!`);

    // Animate cart button
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.classList.add('cart-add-anim');
        setTimeout(() => cartBtn.classList.remove('cart-add-anim'), 400);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

// ============================================
// CART UI
// ============================================
function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const footerEl = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');

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
            itemsEl.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img" style="background:${getCategoryBg(item.category)}">
                        ${item.emoji}
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatCurrency(item.price * item.qty)}</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remover">✕</button>
                </div>
            `).join('');
        }
    }

    if (footerEl) {
        footerEl.style.display = cart.length > 0 ? 'block' : 'none';
    }

    if (totalEl) {
        totalEl.textContent = formatCurrency(getCartTotal());
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

    function openCart() {
        sidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        sidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
});
