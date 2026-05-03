/**
 * MilkyPot - Analytics Helper (GA4) + LGPD Cookie Consent
 *
 * Safe wrapper around window.gtag — all tracking calls are silently
 * ignored when GA4 hasn't been loaded yet, so this file can be
 * included on every page without risk of errors.
 */

var MilkyPotAnalytics = (function () {

    // ---------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------

    /**
     * Safe gtag call. Does nothing when gtag is unavailable.
     */
    function _gtag() {
        if (typeof window.gtag === 'function') {
            window.gtag.apply(null, arguments);
        }
    }

    /**
     * Check whether the user has given LGPD consent.
     */
    function hasConsent() {
        try {
            return localStorage.getItem('milkypot_lgpd_consent') === 'true';
        } catch (e) {
            return false;
        }
    }

    // ---------------------------------------------------------------
    // Public tracking methods
    // ---------------------------------------------------------------

    /**
     * Track a page view with store context.
     * @param {string} storeName - Friendly store name (e.g. "MilkyPot Jardins")
     */
    function trackPageView(storeName) {
        _gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            store_name: storeName || 'not_set'
        });
    }

    /**
     * Track an "add to cart" event.
     * @param {string} productName
     * @param {number} price - Unit price
     * @param {number} qty  - Quantity added
     */
    function trackAddToCart(productName, price, qty) {
        _gtag('event', 'add_to_cart', {
            currency: 'BRL',
            value: price * qty,
            items: [{
                item_name: productName,
                price: price,
                quantity: qty
            }]
        });
    }

    /**
     * Track a completed order / purchase event.
     * @param {Object} order
     * @param {string} order.orderNumber
     * @param {number} order.total
     * @param {Array}  order.items - Each item: { name, qty, total }
     */
    function trackOrder(order) {
        var gaItems = [];
        if (order.items && order.items.length) {
            for (var i = 0; i < order.items.length; i++) {
                var item = order.items[i];
                gaItems.push({
                    item_name: item.name,
                    quantity: item.qty,
                    price: item.total / (item.qty || 1)
                });
            }
        }

        _gtag('event', 'purchase', {
            transaction_id: order.orderNumber,
            currency: 'BRL',
            value: order.total,
            items: gaItems
        });
    }

    /**
     * Track a checkout funnel step.
     * @param {string} step - e.g. "select_store", "enter_address", "payment", "confirm"
     */
    function trackCheckoutStep(step) {
        _gtag('event', 'checkout_step', {
            checkout_step: step
        });
    }

    /**
     * Generic event tracking.
     * @param {string} eventName
     * @param {Object} [params]
     */
    function trackEvent(eventName, params) {
        _gtag('event', eventName, params || {});
    }

    // ---------------------------------------------------------------
    // LGPD Cookie Consent Banner
    // ---------------------------------------------------------------

    /**
     * Show the LGPD consent banner once. If the user has already
     * accepted (stored in localStorage) the banner is not shown again.
     */
    function initConsentBanner() {
        if (hasConsent()) return;

        // Avoid duplicate banners
        if (document.getElementById('milkypot-lgpd-banner')) return;

        var banner = document.createElement('div');
        banner.id = 'milkypot-lgpd-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Aviso de cookies');

        banner.style.cssText = [
            'position:fixed',
            'bottom:0',
            'left:0',
            'right:0',
            'background:#1a1a1a',
            'color:#fff',
            'padding:16px 24px',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'flex-wrap:wrap',
            'gap:16px',
            'font-family:inherit',
            'font-size:14px',
            'z-index:900',
            'box-shadow:0 -2px 12px rgba(0,0,0,0.3)',
            'pointer-events:none'
        ].join(';');

        var text = document.createElement('span');
        text.textContent = 'Este site utiliza cookies e tecnologias semelhantes para melhorar sua experiência. ' +
            'Ao continuar navegando, você concorda com a nossa Política de Privacidade (LGPD).';

        var btn = document.createElement('button');
        btn.textContent = 'Aceitar';
        btn.style.cssText = [
            'background:#e75480',
            'color:#fff',
            'border:none',
            'padding:10px 28px',
            'border-radius:24px',
            'cursor:pointer',
            'font-size:14px',
            'font-weight:600',
            'white-space:nowrap',
            'flex-shrink:0',
            'pointer-events:auto'
        ].join(';');

        btn.addEventListener('click', function () {
            try {
                localStorage.setItem('milkypot_lgpd_consent', 'true');
            } catch (e) { /* localStorage unavailable */ }
            banner.parentNode.removeChild(banner);
        });

        banner.appendChild(text);
        banner.appendChild(btn);
        document.body.appendChild(banner);
    }

    // Auto-init the consent banner when the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConsentBanner);
    } else {
        initConsentBanner();
    }

    // ---------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------

    return {
        trackPageView: trackPageView,
        trackAddToCart: trackAddToCart,
        trackOrder: trackOrder,
        trackCheckoutStep: trackCheckoutStep,
        trackEvent: trackEvent,
        hasConsent: hasConsent,
        initConsentBanner: initConsentBanner
    };

})();
