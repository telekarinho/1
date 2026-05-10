/* ============================================================
   MilkyPot Pixels — Meta + TikTok + GA4 carga universal
   ============================================================
   Ativacao via meta tags no <head> da pagina:

     <meta name="mp-meta-pixel" content="YOUR_PIXEL_ID">
     <meta name="mp-tiktok-pixel" content="YOUR_PIXEL_ID">
     <meta name="mp-gtm-id" content="GTM-XXXX">       (opcional)
     <meta name="mp-ga4-id" content="G-XXXX">         (opcional)

   Sem meta tag, o script e no-op. Eventos disparam via fbq/ttq
   globais apos load (auditoria: paid voa cego sem pixels).
   ============================================================ */
(function(global){
    'use strict';
    if (global._mpPixelsLoaded) return;
    global._mpPixelsLoaded = true;

    function meta(name) {
        const m = document.querySelector(`meta[name="${name}"]`);
        const v = m && m.content && m.content.trim();
        return (v && v !== 'REPLACE_ME' && !v.includes('YOUR_')) ? v : null;
    }

    const META_PIXEL  = meta('mp-meta-pixel');
    const TIKTOK_PIXEL = meta('mp-tiktok-pixel');
    const GTM_ID      = meta('mp-gtm-id');
    const GA4_ID      = meta('mp-ga4-id');

    // ---- Meta (Facebook/Instagram) Pixel ----
    if (META_PIXEL) {
        // Snippet oficial do Meta — apenas adapta o `init` pro pixel da meta tag.
        !function(f,b,e,v,n,t,s){
            if(f.fbq) return; n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};
            if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
            t=b.createElement(e); t.async=!0; t.src=v;
            s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
        }(global, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        global.fbq('init', META_PIXEL);
        global.fbq('track', 'PageView');
    }

    // ---- TikTok Pixel ----
    if (TIKTOK_PIXEL) {
        !function (w, d, t) {
            w.TiktokAnalyticsObject = t;
            var ttq = w[t] = w[t] || [];
            ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
            ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
            for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
            ttq.instance = function (t) {
                for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                return e;
            };
            ttq.load = function (e, n) {
                var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
                ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
                ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
                ttq._o = ttq._o || {}; ttq._o[e] = n || {};
                n = document.createElement("script"); n.type = "text/javascript"; n.async = !0; n.src = r + "?sdkid=" + e + "&lib=" + t;
                e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e);
            };
            ttq.load(TIKTOK_PIXEL);
            ttq.page();
        }(global, document, 'ttq');
    }

    // ---- GTM (Google Tag Manager) ----
    if (GTM_ID) {
        (function(w,d,s,l,i){
            w[l]=w[l]||[]; w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
            j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
        })(global, document, 'script', 'dataLayer', GTM_ID);
    }

    // ---- GA4 ----
    if (GA4_ID) {
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
        document.head.appendChild(s);
        global.dataLayer = global.dataLayer || [];
        global.gtag = function(){ global.dataLayer.push(arguments); };
        global.gtag('js', new Date());
        global.gtag('config', GA4_ID);
    }

    // ---- API unificada pra disparar eventos cross-platform ----
    global.MPPixel = {
        track(eventName, params) {
            params = params || {};
            try { if (global.fbq) global.fbq('track', eventName, params); } catch(_) {}
            try { if (global.ttq && global.ttq.track) global.ttq.track(eventName, params); } catch(_) {}
            try { if (global.gtag) global.gtag('event', eventName, params); } catch(_) {}
            try { if (global.dataLayer) global.dataLayer.push({ event: eventName, ...params }); } catch(_) {}
        },
        purchase(value, currency, orderId) {
            this.track('Purchase', { value: value, currency: currency || 'BRL', order_id: orderId });
        },
        addToCart(value, item) {
            this.track('AddToCart', { value: value, currency: 'BRL', content_name: item });
        },
        lead(source) {
            this.track('Lead', { source: source || 'organic' });
        },
        initiateCheckout(value) {
            this.track('InitiateCheckout', { value: value, currency: 'BRL' });
        }
    };
})(typeof window !== 'undefined' ? window : this);
