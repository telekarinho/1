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
    initPromoTimer();
    initTestimonialTabs();
    initFaqTabs();
    calculateROI();
});

// ============================================
// PARTICLES
// ============================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const colors = ['#F8B4D9', '#D4A5FF', '#B8D8F8', '#C8F0DC', '#FFF0C8', '#F0A0C8', '#E0C0FF'];
    const shapes = ['50%', '50%', '50%', 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'];
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 10 + 4;
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 18 + 12}s;
            animation-delay: ${Math.random() * 12}s;
            clip-path: ${shape === '50%' ? 'none' : shape};
            border-radius: ${shape === '50%' ? '50%' : '0'};
            opacity: ${Math.random() * 0.3 + 0.15};
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

    document.querySelectorAll('.section-header, .step-card, .model-card, .testimonial-card, .franchise-hero-card, .contact-form, .contact-info, .award-card, .faq-item, .roi-simulator, .benefit-item').forEach(el => {
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
                    <button class="btn-add-cart wiggle-hover" onclick="window.location.href='cardapio.html'"
                            aria-label="Pedir ${product.name}">+</button>
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

// ============================================
// PROMO TIMER
// ============================================
function initPromoTimer() {
    const timerEl = document.getElementById('promoTimer');
    if (!timerEl) return;

    // Set timer to end of today
    function updateTimer() {
        const now = new Date();
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const diff = end - now;
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        timerEl.textContent = `${h}:${m}:${s}`;
    }
    updateTimer();
    setInterval(updateTimer, 1000);
}

// ============================================
// PRODUCT URGENCY COUNTERS
// ============================================
function addUrgencyCounters() {
    document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.product-urgency')) return;
        const viewers = Math.floor(Math.random() * 15) + 3;
        if (viewers > 8) {
            const urgency = document.createElement('div');
            urgency.className = 'product-urgency';
            urgency.innerHTML = `<span class="urgency-dot"></span> ${viewers} pessoas vendo agora`;
            card.querySelector('.product-info').appendChild(urgency);
        }
    });
}

// Override renderProducts to add urgency
const _originalRenderProducts = renderProducts;
renderProducts = function(products) {
    _originalRenderProducts(products);
    setTimeout(addUrgencyCounters, 100);
};

// ============================================
// TESTIMONIAL TABS
// ============================================
function initTestimonialTabs() {
    const tabs = document.querySelectorAll('.tt-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.tab;
            document.querySelectorAll('.testimonial-card').forEach(card => {
                card.style.display = card.dataset.type === type ? '' : 'none';
            });
        });
    });
}

// ============================================
// FAQ
// ============================================
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    item.classList.toggle('open');
}

function initFaqTabs() {
    const tabs = document.querySelectorAll('.faq-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.faq;
            document.querySelectorAll('.faq-item').forEach(item => {
                item.style.display = item.dataset.faqType === type ? '' : 'none';
                item.classList.remove('open');
            });
        });
    });
}

// ============================================
// ROI SIMULATOR
// ============================================
function calculateROI() {
    const model = document.getElementById('roiModel')?.value;
    const location = document.getElementById('roiLocation')?.value;
    const experience = document.getElementById('roiExperience')?.value;
    if (!model) return;

    const models = {
        express:  { investment: 89000,  revenueBase: 45000, marginPct: 0.20 },
        store:    { investment: 169000, revenueBase: 95000, marginPct: 0.20 },
        mega:     { investment: 289000, revenueBase: 160000, marginPct: 0.22 }
    };

    const locationMult = { shopping: 1.15, rua: 1.0, galeria: 0.9 };
    const expMult = { none: 0.9, some: 1.0, food: 1.1 };

    const data = models[model];
    const locMul = locationMult[location] || 1;
    const expMul = expMult[experience] || 1;

    const revenue = Math.round(data.revenueBase * locMul * expMul);
    const profit = Math.round(revenue * data.marginPct * locMul * expMul);
    const payback = Math.ceil(data.investment / profit);

    document.getElementById('roiInvestment').textContent = formatCurrency(data.investment);
    document.getElementById('roiRevenue').textContent = formatCurrency(revenue);
    document.getElementById('roiProfit').textContent = formatCurrency(profit);
    document.getElementById('roiPayback').textContent = `${payback} meses`;
}
