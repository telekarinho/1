/* ============================================================
   MilkyPot Google Review CTA — incentivo pós-entrega
   ============================================================
   Mostra CTA "Avalie no Google + ganhe raspinha PREMIUM" no
   momento certo (pedido entregue) pra capitalizar o pico de
   satisfação. Integrado com sistema raspinha existente:

   Fluxo:
     1. Pedido status = 'entregue' → /pedido.html mostra banner
     2. Click "⭐ Avalie no Google" abre g.page/r/CXrthQS1rgPdEAE/review
     3. Após 1.5s redireciona pra /clube/avaliei.html?fid=XXX
     4. avaliei.html chama CloudFunctions.claimAction(memberId, 'google_review')
     5. Backend valida + libera RASPINHA PREMIUM (50 coins + valor 50)

   API:
     GoogleReviewCTA.show({ container, orderId })
       Injeta CTA no container DOM informado.
     GoogleReviewCTA.openReview()
       Abre Google review + redirect pra avaliei.html.

   Tracking GA4:
     google_review_cta_shown
     google_review_cta_clicked
     google_review_returned (avaliei.html dispara)
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpGoogleReviewLoaded) return;
    global._mpGoogleReviewLoaded = true;

    var GOOGLE_REVIEW_URL = 'https://g.page/r/CXrthQS1rgPdEAE/review';
    var FRANCHISE_DEFAULT = 'muffato-quintino';

    function show(opts) {
        opts = opts || {};
        var container = opts.container;
        if (!container) return;
        if (container.querySelector('.mp-google-review-cta')) return; // já existe

        var orderId = opts.orderId || '';
        var fid = opts.franchiseId || FRANCHISE_DEFAULT;

        var div = document.createElement('div');
        div.className = 'mp-google-review-cta';
        div.style.cssText = 'background:linear-gradient(135deg,#FFD700 0%,#FFA000 50%,#FF6B00 100%);border-radius:18px;padding:18px 20px;margin:12px 0;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(255,107,0,.35);position:relative;overflow:hidden';
        div.innerHTML =
            '<div style="position:absolute;top:-20px;right:-20px;font-size:120px;opacity:.15;pointer-events:none">⭐</div>' +
            '<div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">🎁 Bônus exclusivo</div>' +
            '<h3 style="margin:0 0 6px;font-size:18px;font-weight:900">Curtiu? Avalia a gente no Google ⭐</h3>' +
            '<p style="margin:0 0 14px;font-size:13px;opacity:.95;line-height:1.4">Sua avaliação nos ajuda MUITO. Em troca, você ganha uma <strong>raspinha PREMIUM</strong> (prêmios maiores) + <strong>50 MilkyCoins</strong> 🪙</p>' +
            '<button id="mpReviewBtn-' + (orderId || 'default') + '" style="background:#fff;color:#FF6B00;border:0;padding:12px 24px;border-radius:999px;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:inline-flex;align-items:center;gap:8px">⭐ Avaliar agora <span style="opacity:.6;font-size:11px">(30 segundos)</span></button>';
        container.appendChild(div);

        var btn = div.querySelector('button');
        if (btn) {
            btn.addEventListener('click', function () {
                openReview({ orderId: orderId, franchiseId: fid });
            });
        }

        if (global.MpAnalytics) {
            global.MpAnalytics.track('google_review_cta_shown', {
                order_id: orderId,
                franchise: fid
            });
        }
    }

    function openReview(opts) {
        opts = opts || {};
        var fid = opts.franchiseId || FRANCHISE_DEFAULT;

        if (global.MpAnalytics) {
            global.MpAnalytics.track('google_review_cta_clicked', {
                order_id: opts.orderId || '',
                franchise: fid
            });
        }

        // Marca em sessionStorage que user foi avaliar (pra detectar volta)
        try {
            sessionStorage.setItem('mp_review_pending', JSON.stringify({
                orderId: opts.orderId || '',
                franchiseId: fid,
                startedAt: Date.now()
            }));
        } catch (e) {}

        // Abre Google review em nova aba
        window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener');

        // Redireciona aba atual pra landing após 1.5s
        setTimeout(function () {
            location.href = '/clube/avaliei.html?fid=' + encodeURIComponent(fid) +
                            (opts.orderId ? '&order=' + encodeURIComponent(opts.orderId) : '');
        }, 1500);
    }

    /**
     * Auto-detect: se /pedido.html status='entregue', mostra CTA após 3s
     */
    function _autoShowOnDelivered() {
        try {
            if (location.pathname.indexOf('/pedido') < 0) return;
            // Espera renderOrder rodar primeiro
            setTimeout(function () {
                var contentEl = document.getElementById('content');
                if (!contentEl) return;
                // Procura banner "PEDIDO ENTREGUE"
                var deliveredBanner = Array.from(contentEl.querySelectorAll('.eta-banner'))
                    .find(function (el) { return el.textContent.indexOf('ENTREGUE') > -1; });
                if (!deliveredBanner) return;
                // Pega orderId da URL
                var params = new URLSearchParams(location.search);
                var orderId = params.get('id') || params.get('order') || '';
                show({ container: contentEl, orderId: orderId });
            }, 2500);
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoShowOnDelivered);
    } else {
        _autoShowOnDelivered();
    }

    global.GoogleReviewCTA = {
        show: show,
        openReview: openReview,
        URL: GOOGLE_REVIEW_URL,
        VERSION: 'mp-v260'
    };
})(typeof window !== 'undefined' ? window : this);
