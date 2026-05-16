/* ============================================================
   MilkyPot Google Reviews Widget — vitrine de prova social
   ============================================================
   Mostra rating + count de avaliações Google na home/cardapio.
   Aumenta confiança de novos clientes (FOMO + social proof).

   Stack: Google Places API NÃO usada client-side (requer key + custo).
   Solução pragmática:
     - Manualmente atualiza COUNT + RATING via Firestore (config)
     - OU usa scrape periódico via Cloud Function (futura)
     - Fallback: valores hardcoded "5.0 ★ baseado em 100+ avaliações"

   Lê de Firestore: datastore/google_reviews_stats:
     {
       rating: 4.8,
       count: 145,
       url: 'https://g.page/r/CXrthQS1rgPdEAE/review',
       lastUpdated: '...'
     }

   API:
     GoogleReviewsWidget.show({ container })
     GoogleReviewsWidget.fetchStats()
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpReviewsWidgetLoaded) return;
    global._mpReviewsWidgetLoaded = true;

    var DEFAULT_STATS = {
        rating: 5.0,
        count: 50,
        url: 'https://g.page/r/CXrthQS1rgPdEAE/review',
        lastUpdated: new Date().toISOString()
    };
    var CACHE_KEY = 'mp_google_reviews_stats';
    var CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

    function fetchStats() {
        // Cache local primeiro
        try {
            var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
            if (cached && (Date.now() - cached.t) < CACHE_TTL) {
                return Promise.resolve(cached.data);
            }
        } catch (e) {}

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            return Promise.resolve(DEFAULT_STATS);
        }

        return firebase.firestore()
            .collection('datastore')
            .doc('google_reviews_stats')
            .get()
            .then(function (snap) {
                var data = (snap.exists && snap.data()) || DEFAULT_STATS;
                try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
                return data;
            })
            .catch(function () { return DEFAULT_STATS; });
    }

    function _renderStars(rating) {
        var full = Math.floor(rating);
        var half = (rating - full) >= 0.5;
        var html = '';
        for (var i = 0; i < full; i++) html += '⭐';
        if (half) html += '⭐';
        return html;
    }

    function show(opts) {
        opts = opts || {};
        var container = opts.container || document.getElementById('googleReviewsWidget');
        if (!container) return;

        fetchStats().then(function (stats) {
            container.innerHTML =
                '<a href="' + stats.url + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block">' +
                  '<div style="background:#fff;border-radius:14px;padding:14px 18px;border:2px solid #FFD700;box-shadow:0 4px 12px rgba(255,193,0,.15);display:flex;align-items:center;gap:14px;cursor:pointer;transition:transform .15s">' +
                    '<div style="font-size:32px;line-height:1">⭐</div>' +
                    '<div style="flex:1">' +
                      '<div style="font-size:18px;font-weight:900;color:#1F2937;line-height:1">' + stats.rating.toFixed(1) + ' <span style="color:#FFA000;font-size:14px;letter-spacing:-2px">' + _renderStars(stats.rating) + '</span></div>' +
                      '<div style="font-size:12px;color:#6B7280;margin-top:2px"><strong>' + stats.count + '+ avaliações</strong> no Google · <span style="color:#1976D2;font-weight:700">Ver todas →</span></div>' +
                    '</div>' +
                  '</div>' +
                '</a>';

            if (global.MpAnalytics) {
                global.MpAnalytics.track('google_reviews_widget_shown', {
                    rating: stats.rating,
                    count: stats.count
                });
            }

            // Track click
            var link = container.querySelector('a');
            if (link) {
                link.addEventListener('click', function () {
                    if (global.MpAnalytics) global.MpAnalytics.track('google_reviews_widget_clicked');
                });
            }
        });
    }

    /**
     * Auto-inject widget no cardapio (próximo ao banner promo).
     * Só mostra se elemento #googleReviewsWidget OU #deliveryPromoNotice existir.
     */
    function _autoInject() {
        if (location.pathname.indexOf('/cardapio') < 0 && location.pathname !== '/' && location.pathname.indexOf('/index') < 0) {
            return;
        }
        var existing = document.getElementById('googleReviewsWidget');
        if (existing) {
            show({ container: existing });
            return;
        }
        // Cria container abaixo do deliveryPromoNotice
        var anchor = document.getElementById('deliveryPromoNotice');
        if (!anchor || !anchor.parentNode) return;
        var container = document.createElement('div');
        container.id = 'googleReviewsWidget';
        container.style.cssText = 'max-width:720px;margin:0 auto 14px';
        anchor.parentNode.insertBefore(container, anchor.nextSibling);
        show({ container: container });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(_autoInject, 1200);
        });
    } else {
        setTimeout(_autoInject, 1200);
    }

    global.GoogleReviewsWidget = {
        show: show,
        fetchStats: fetchStats,
        VERSION: 'mp-v260'
    };
})(typeof window !== 'undefined' ? window : this);
