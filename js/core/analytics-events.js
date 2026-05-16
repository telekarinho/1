/* ============================================================
   MilkyPot Analytics Events — funil de checkout + delivery
   ============================================================
   Centraliza eventos custom enviados ao GA4 (G-1PD6G2EJY2) e GTM
   (GTM-WGPBCS6K). Permite painel de funil visual no GA4 sem
   precisar tocar em cada chamada de UI.

   Uso: MpAnalytics.track('event_name', { params })

   Eventos do funil:
   - checkout_open                 — abriu modal checkout
   - checkout_step_complete        — preencheu step (param: step)
   - delivery_option_selected      — clicou Delivery option (vs Retirada)
   - cep_filled                    — CEP válido digitado (8 dígitos)
   - cep_lookup_success            — ViaCEP autocompletou endereço
   - cep_lookup_failed             — ViaCEP retornou 404 / erro
   - uber_quote_dispatched         — chamou Firebase Function
   - uber_quote_received           — callback success com fee
   - uber_quote_outside_area       — endereço fora da cobertura
   - uber_quote_failed             — erro técnico (não fora de área)
   - whatsapp_fallback_shown       — banner WhatsApp apareceu
   - whatsapp_fallback_used        — clicou enviar pedido via WhatsApp
   - order_completed               — pedido finalizado (param: total, type)

   Eventos críticos infra:
   - delivery_rules_missing        — DeliveryRules undefined (alerta)
   - checkout_js_error             — exceção no flow checkout

   Auto-export pra dataLayer pra GTM enrolar regras se quiser.
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpAnalyticsLoaded) return;
    global._mpAnalyticsLoaded = true;

    function _now() { return new Date().toISOString(); }

    function _sessionContext() {
        try {
            var sess = global.Auth && global.Auth.getSession && global.Auth.getSession();
            return {
                fid: (sess && sess.franchiseId) || global._selectedStoreId || 'unknown',
                role: (sess && sess.role) || 'guest',
                page: location.pathname,
                referrer: document.referrer ? new URL(document.referrer).hostname : 'direct'
            };
        } catch (e) { return { fid: 'unknown', role: 'guest' }; }
    }

    function track(eventName, params) {
        params = params || {};
        var ctx = _sessionContext();
        var payload = Object.assign({}, ctx, params, { event_time: _now() });

        // 1. GA4 via gtag (se disponível)
        try {
            if (typeof global.gtag === 'function') {
                global.gtag('event', eventName, payload);
            }
        } catch (e) { /* never crash analytics */ }

        // 2. GTM dataLayer (independente do gtag)
        try {
            global.dataLayer = global.dataLayer || [];
            global.dataLayer.push(Object.assign({ event: 'mp_' + eventName }, payload));
        } catch (e) {}

        // 3. Console log em dev (URL tem ?debug=1)
        try {
            if (location.search.indexOf('debug=1') > -1) {
                console.info('[MpAnalytics]', eventName, payload);
            }
        } catch (e) {}
    }

    /**
     * Alerta crítico — usa ErrorTracking que vai pra Sentry/error_log.
     * Use só pra problemas REAIS que precisam ação. Não use pra tracking normal.
     */
    function critical(message, context) {
        try {
            if (global.ErrorTracking && global.ErrorTracking.capture) {
                global.ErrorTracking.capture(
                    new Error('[MP-CRITICAL] ' + message),
                    Object.assign({ critical: true }, _sessionContext(), context || {})
                );
            } else {
                console.error('[MP-CRITICAL]', message, context);
            }
        } catch (e) {}
        // Também tracka no GA pra ver tendência
        track('critical_alert', Object.assign({ alert_message: message }, context || {}));
    }

    /**
     * Detecta se DeliveryRules sumiu de novo (lição PR #614).
     * Roda 2s após DOMContentLoaded pra dar tempo de script tags carregarem.
     */
    function _checkDeliveryRulesPresence() {
        try {
            if (typeof global.DeliveryRules === 'undefined' &&
                location.pathname.indexOf('/cardapio') > -1) {
                critical('DeliveryRules undefined em cardapio — script tag delivery-rules.js faltando?', {
                    page: location.pathname,
                    has_checkout_js: typeof global.openCheckout === 'function',
                    sw_version: (global.MP && global.MP.CACHE_VERSION) || 'unknown'
                });
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(_checkDeliveryRulesPresence, 2000);
        });
    } else {
        setTimeout(_checkDeliveryRulesPresence, 2000);
    }

    global.MpAnalytics = {
        track: track,
        critical: critical,
        VERSION: 'mp-v245'
    };
})(typeof window !== 'undefined' ? window : this);
