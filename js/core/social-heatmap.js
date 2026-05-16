/* ============================================================
   MilkyPot Social Heatmap — prova social em tempo real
   ============================================================
   "🔥 12 pessoas perto de você pedindo Pistache agora"

   Lê últimos N pedidos do Firestore (anonimizados), agrupa por:
     - franchise mais próxima (geo)
     - sabor mais pedido na última hora
     - count total da última hora

   Mostra banner pequeno na home do cardápio com efeito FOMO.
   Cache 5min sessionStorage pra não bombardear Firestore.

   API:
     SocialHeatmap.fetchStats() → { total, topFlavor, lastOrderMins }
     SocialHeatmap.show()       → injeta banner
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpSocialHeatLoaded) return;
    global._mpSocialHeatLoaded = true;

    var CACHE_KEY = 'mp_social_heatmap_cache';
    var CACHE_TTL = 5 * 60 * 1000; // 5min
    var BANNER_ID = 'mpSocialHeatBanner';

    function fetchStats() {
        try {
            var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
            if (cached && (Date.now() - cached.t) < CACHE_TTL) {
                return Promise.resolve(cached.data);
            }
        } catch (e) {}

        if (typeof firebase === 'undefined' || !firebase.firestore) return Promise.resolve(null);

        var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        var franchiseId = (global._selectedStoreId) || 'muffato-quintino';

        return firebase.firestore()
            .collection('orders_log')
            .where('store.id', '==', franchiseId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get()
            .then(function (snap) {
                var orders = snap.docs.map(function (d) { return d.data(); });
                var recent = orders.filter(function (o) { return o.createdAt >= oneHourAgo; });

                // Top flavor
                var flavorCount = {};
                recent.forEach(function (o) {
                    (o.items || []).forEach(function (it) {
                        var name = it.name || '?';
                        // Extrai 1ª palavra significativa
                        var firstWord = name.replace(/^\d+\.\s*/, '').split(/[\s·]/)[0];
                        if (firstWord.length > 2) {
                            flavorCount[firstWord] = (flavorCount[firstWord] || 0) + (it.qty || 1);
                        }
                    });
                });
                var topFlavor = null;
                var topCount = 0;
                Object.keys(flavorCount).forEach(function (k) {
                    if (flavorCount[k] > topCount) { topFlavor = k; topCount = flavorCount[k]; }
                });

                var lastOrderMins = null;
                if (orders.length) {
                    lastOrderMins = Math.floor((Date.now() - new Date(orders[0].createdAt).getTime()) / 60000);
                }

                var data = {
                    totalLastHour: recent.length,
                    totalLast24h: orders.filter(function(o){return o.createdAt >= new Date(Date.now() - 24*3600000).toISOString();}).length,
                    topFlavor: topFlavor,
                    topFlavorCount: topCount,
                    lastOrderMins: lastOrderMins
                };

                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data }));
                } catch (e) {}

                return data;
            })
            .catch(function (err) {
                console.warn('[SocialHeatmap]', err.message);
                return null;
            });
    }

    function show(opts) {
        opts = opts || {};
        if (document.getElementById(BANNER_ID)) return;
        if (sessionStorage.getItem('mp_social_heat_dismissed') === '1') return;

        fetchStats().then(function (stats) {
            if (!stats) return;
            if (stats.totalLastHour < 2 && stats.totalLast24h < 5) return; // sem dados suficientes pra prova social

            var lines = [];
            if (stats.totalLastHour >= 2) {
                lines.push('🔥 <strong>' + stats.totalLastHour + ' pedidos</strong> na última hora');
            } else if (stats.totalLast24h >= 5) {
                lines.push('🐑 <strong>' + stats.totalLast24h + ' pessoas</strong> pediram hoje');
            }
            if (stats.topFlavor && stats.topFlavorCount >= 2) {
                lines.push('💫 <strong>' + stats.topFlavor + '</strong> tá bombando agora');
            }
            if (stats.lastOrderMins !== null && stats.lastOrderMins <= 15) {
                lines.push('⚡ Último pedido há <strong>' + stats.lastOrderMins + 'min</strong>');
            }
            if (!lines.length) return;

            var banner = document.createElement('div');
            banner.id = BANNER_ID;
            banner.style.cssText = 'max-width:720px;margin:0 auto 14px;padding:12px 16px;background:linear-gradient(135deg,#FEE2E2,#FCA5A5);border:2px solid #DC2626;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;animation:mp-social-pulse 2s ease-in-out infinite';
            banner.innerHTML =
                '<div style="flex:1;min-width:200px;text-align:left">' +
                  '<div style="font-size:11px;font-weight:800;color:#991B1B;letter-spacing:.5px;text-transform:uppercase">🔴 AO VIVO</div>' +
                  '<div style="font-size:13px;color:#7F1D1D;margin-top:3px;line-height:1.5">' + lines.join(' · ') + '</div>' +
                '</div>' +
                '<button id="mpSocialHeatDismiss" style="background:transparent;border:0;color:#991B1B;font-size:18px;cursor:pointer">×</button>';

            var target = opts.parent || document.getElementById('deliveryPromoNotice');
            if (target && target.parentNode) target.parentNode.insertBefore(banner, target);
            else document.body.insertBefore(banner, document.body.firstChild);

            _injectStyles();

            banner.querySelector('#mpSocialHeatDismiss').onclick = function () {
                banner.remove();
                sessionStorage.setItem('mp_social_heat_dismissed', '1');
            };

            if (global.MpAnalytics) {
                global.MpAnalytics.track('social_heatmap_shown', {
                    total_hour: stats.totalLastHour,
                    total_24h: stats.totalLast24h,
                    top_flavor: stats.topFlavor || ''
                });
            }
        });
    }

    function _injectStyles() {
        if (document.getElementById('mp-social-heat-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-social-heat-styles';
        style.textContent = '@keyframes mp-social-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); } 50% { box-shadow: 0 0 0 12px rgba(220,38,38,0); } }';
        document.head.appendChild(style);
    }

    // Auto-show no cardápio (após 3s pra não bombardear)
    if (location.pathname.indexOf('/cardapio') > -1 || location.pathname === '/' || location.pathname.indexOf('/index') > -1) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { setTimeout(show, 3000); });
        } else {
            setTimeout(show, 3000);
        }
    }

    global.SocialHeatmap = {
        fetchStats: fetchStats,
        show: show,
        VERSION: 'mp-v256'
    };
})(typeof window !== 'undefined' ? window : this);
