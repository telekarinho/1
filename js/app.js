/* ============================================
   MilkyPot - Main Application
   ============================================ */

// State
let selectedStore = null;
let currentCategory = 'todos';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initScrollAnimations();
    initCounters();
    renderStores(STORES);
    renderProducts(PRODUCTS);
    initCategoryTabs();
    initStoreSearch();
    initForms();
    initChat();
});

// ============================================
// PARTICLES
// ============================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const colors = ['#FFB6D9', '#D4A5FF', '#A5D4FF', '#A5FFD4', '#FFE5A5', '#FFB38A'];
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 8 + 4;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 15 + 10}s;
            animation-delay: ${Math.random() * 10}s;
        `;
        container.appendChild(particle);
    }
}

// ============================================
// NAVBAR
// ============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Hamburger toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = navLinks.querySelector(`a[href="#${id}"]`);
            if (link) {
                link.classList.toggle('active', scrollY >= top && scrollY < top + height);
            }
        });
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section-header, .step-card, .model-card, .testimonial-card, .franchise-hero-card, .contact-form, .contact-info').forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });
}

// ============================================
// COUNTERS
// ============================================
function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

function animateCounter(el, target) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current);
    }, 16);
}

// ============================================
// STORES
// ============================================
function renderStores(stores) {
    const grid = document.getElementById('storesGrid');
    if (!grid) return;
    grid.innerHTML = stores.map(store => `
        <div class="store-card ${selectedStore?.id === store.id ? 'selected' : ''}"
             onclick="selectStore(${store.id})" data-store-id="${store.id}">
            <div class="store-header">
                <div class="store-avatar">🐑</div>
                <div>
                    <div class="store-name">${store.name}</div>
                    <div class="store-address">${store.address}</div>
                </div>
            </div>
            <div class="store-meta">
                <span class="store-meta-item">⭐ ${store.rating}</span>
                <span class="store-meta-item">🕐 ${store.deliveryTime}</span>
                <span class="store-meta-item">🛵 R$ ${store.deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="store-status ${store.open ? 'open' : 'closed'}">
                <span class="status-dot"></span>
                ${store.open ? 'Aberto agora' : 'Fechado'} · ${store.hours}
            </div>
        </div>
    `).join('');
}

function selectStore(storeId) {
    selectedStore = STORES.find(s => s.id === storeId);
    if (!selectedStore) return;

    // Update UI
    document.querySelectorAll('.store-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.storeId) === storeId);
    });

    const banner = document.getElementById('selectedStoreBanner');
    const storeName = document.getElementById('selectedStoreName');
    if (banner && storeName) {
        banner.style.display = 'flex';
        storeName.textContent = selectedStore.name;
    }

    showToast(`Loja selecionada: ${selectedStore.name}`);

    // Scroll to products
    setTimeout(() => scrollToSection('produtos'), 300);
}

function changeStore() {
    selectedStore = null;
    document.getElementById('selectedStoreBanner').style.display = 'none';
    document.querySelectorAll('.store-card').forEach(c => c.classList.remove('selected'));
    scrollToSection('pedir');
}

function initStoreSearch() {
    const input = document.getElementById('storeSearch');
    if (!input) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderStores(STORES);
            return;
        }
        const filtered = STORES.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.city.toLowerCase().includes(query) ||
            s.state.toLowerCase().includes(query) ||
            s.cep.includes(query) ||
            s.address.toLowerCase().includes(query)
        );
        renderStores(filtered);
    });

    // Geolocation button
    const btnLocation = document.getElementById('btnLocation');
    if (btnLocation) {
        btnLocation.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('Geolocalização não suportada');
                return;
            }
            btnLocation.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;margin:0"></span>';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    btnLocation.innerHTML = '<span>📍</span>';
                    // Sort stores by distance
                    const sorted = [...STORES].sort((a, b) => {
                        const distA = getDistance(pos.coords.latitude, pos.coords.longitude, a.lat, a.lng);
                        const distB = getDistance(pos.coords.latitude, pos.coords.longitude, b.lat, b.lng);
                        return distA - distB;
                    });
                    renderStores(sorted);
                    showToast('Lojas ordenadas pela distância!');
                },
                () => {
                    btnLocation.innerHTML = '<span>📍</span>';
                    showToast('Não foi possível obter sua localização');
                }
            );
        });
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// PRODUCTS
// ============================================
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = currentCategory === 'todos'
        ? products
        : products.filter(p => p.category === currentCategory);

    grid.innerHTML = filtered.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image ${product.category}">
                <span>${product.emoji}</span>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.desc}</p>
                <div class="product-footer">
                    <div class="product-price">
                        R$ ${product.price.toFixed(2).replace('.', ',')}
                        ${product.originalPrice ? `<small>R$ ${product.originalPrice.toFixed(2).replace('.', ',')}</small>` : ''}
                    </div>
                    <button class="btn-add-cart wiggle-hover" onclick="addToCart(${product.id})"
                            aria-label="Adicionar ${product.name} ao carrinho">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

function initCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            renderProducts(PRODUCTS);
        });
    });
}

// ============================================
// FORMS
// ============================================
function initForms() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Mensagem enviada com sucesso! Entraremos em contato em breve.');
            contactForm.reset();
        });
    }

    // Franchise form
    const franchiseForm = document.getElementById('franchiseForm');
    if (franchiseForm) {
        franchiseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Candidatura enviada! Nossa equipe entrará em contato em 24h.');
            franchiseForm.reset();
            closeFranchiseForm();
        });
    }
}

function openFranchiseForm(model) {
    const modal = document.getElementById('franchiseModal');
    const modelInput = document.getElementById('franchiseModel');
    if (modal) {
        modal.classList.add('active');
        if (modelInput) modelInput.value = model;
        document.body.style.overflow = 'hidden';
    }
}

function closeFranchiseForm() {
    const modal = document.getElementById('franchiseModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// UTILITIES
// ============================================
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function createConfetti() {
    const colors = ['#FFB6D9', '#D4A5FF', '#A5D4FF', '#A5FFD4', '#FFE5A5', '#FFB38A', '#FF6B9D'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
            left: ${Math.random() * 100}%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-delay: ${Math.random() * 1}s;
            animation-duration: ${Math.random() * 2 + 2}s;
            width: ${Math.random() * 8 + 6}px;
            height: ${Math.random() * 8 + 6}px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
    }
}
