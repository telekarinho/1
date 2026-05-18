/**
 * MilkyPot — NPS 1-Clique
 * ========================
 * Coleta feedback do cliente em UM click: 👍 Top / 😐 Beleza / 👎 Ruim.
 *
 * Por que 1 click vs 5 estrelas:
 *   - Taxa de resposta de 5★: ~3-5% dos clientes
 *   - Taxa de resposta 1-click: ~15-25% (5x mais feedback)
 *   - Custo cognitivo zero: cliente acha o emoji que combina com o sentimento
 *
 * Fluxo:
 *   1. /pedido.html status='entregue' → renderiza widget abaixo do banner
 *   2. Cliente clica 1 emoji (3 opções)
 *   3. Se 👍 → mostra CTA Google Review premiado
 *   4. Se 😐 → agradece + pergunta o que faltou (textarea opcional)
 *   5. Se 👎 → pede contato + escala pra Belinha humana
 *   6. Em qualquer caso, grava em nps_responses/{orderId}
 *
 * REGRA #0: aditivo, coexiste com google-review-cta.js (que ainda
 * roda separadamente apos resposta positiva).
 */
(function (global) {
    'use strict';

    function todayKey() {
        var d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }

    function alreadyResponded(orderId) {
        try {
            var k = 'mp_nps_' + (orderId || 'no-order');
            return !!localStorage.getItem(k);
        } catch (_) { return false; }
    }

    function markResponded(orderId, score) {
        try {
            localStorage.setItem('mp_nps_' + (orderId || 'no-order'), JSON.stringify({
                score: score,
                at: Date.now()
            }));
        } catch (_) {}
    }

    function gradeFromScore(score) {
        if (score >= 8) return 'promoter';
        if (score >= 5) return 'neutral';
        return 'detractor';
    }

    function recordResponse(orderId, score, extras) {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) return;
            var docId = orderId
                ? ('order_' + orderId)
                : ('anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
            firebase.firestore().collection('nps_responses').doc(docId).set(Object.assign({
                orderId: orderId || null,
                score: score,
                grade: gradeFromScore(score),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                dayKey: todayKey(),
                userAgent: (navigator.userAgent || '').slice(0, 120)
            }, extras || {}), { merge: true });
        } catch (e) { console.warn('[nps] record:', e); }
    }

    function injectStyles() {
        if (document.getElementById('npsQuickStyles')) return;
        var css =
            '#npsQuick{margin:24px auto;max-width:520px;background:#fff;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,.1);padding:22px 20px;text-align:center;font-family:"Baloo 2","Nunito",sans-serif;animation:npsIn .5s cubic-bezier(.2,.8,.2,1)}' +
            '@keyframes npsIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
            '#npsQuick h3{font-size:18px;color:#2D1747;margin:0 0 6px;font-weight:900}' +
            '#npsQuick p.lead{font-size:13px;color:#6B7280;margin:0 0 14px;line-height:1.4}' +
            '#npsQuick .nps-btns{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}' +
            '#npsQuick .nps-btn{background:#FAF9FC;border:2px solid #E5E7EB;border-radius:18px;padding:14px 16px;cursor:pointer;transition:all .15s;min-width:90px;font-family:inherit}' +
            '#npsQuick .nps-btn:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.08)}' +
            '#npsQuick .nps-btn .emoji{font-size:36px;line-height:1;display:block;margin-bottom:4px}' +
            '#npsQuick .nps-btn .label{font-size:12px;font-weight:800;color:#6B7280;letter-spacing:.5px}' +
            '#npsQuick .nps-btn[data-s="10"]:hover{border-color:#16A34A;background:#DCFCE7}' +
            '#npsQuick .nps-btn[data-s="10"]:hover .label{color:#15803D}' +
            '#npsQuick .nps-btn[data-s="6"]:hover{border-color:#F59E0B;background:#FEF3C7}' +
            '#npsQuick .nps-btn[data-s="6"]:hover .label{color:#92400E}' +
            '#npsQuick .nps-btn[data-s="2"]:hover{border-color:#DC2626;background:#FEE2E2}' +
            '#npsQuick .nps-btn[data-s="2"]:hover .label{color:#991B1B}' +
            '#npsQuick .nps-followup{margin-top:16px;display:none}' +
            '#npsQuick .nps-followup.show{display:block;animation:npsIn .35s}' +
            '#npsQuick textarea{width:100%;padding:10px 12px;border:1.5px solid #E5E7EB;border-radius:12px;font-family:inherit;font-size:13px;resize:vertical;min-height:60px;box-sizing:border-box}' +
            '#npsQuick textarea:focus{outline:none;border-color:#7E57C2}' +
            '#npsQuick .nps-thanks{font-weight:800;color:#16A34A;font-size:15px;margin-top:14px}' +
            '#npsQuick .nps-cta-secondary{display:inline-block;margin-top:12px;background:linear-gradient(135deg,#7E57C2,#FF4F8A);color:#fff;text-decoration:none;padding:10px 22px;border-radius:24px;font-size:14px;font-weight:800;font-family:inherit}' +
            '#npsQuick .nps-mini-link{font-size:12px;color:#9CA3AF;margin-top:8px;display:block;cursor:pointer;background:none;border:0;font-family:inherit}';
        var style = document.createElement('style');
        style.id = 'npsQuickStyles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function build(orderId) {
        injectStyles();
        var wrap = document.createElement('div');
        wrap.id = 'npsQuick';
        wrap.innerHTML =
            '<h3>Como foi seu MilkyPot? 🐑</h3>' +
            '<p class="lead">É 1 clique. Sua resposta ajuda a ovelhinha a melhorar.</p>' +
            '<div class="nps-btns">' +
                '<button class="nps-btn" data-s="10"><span class="emoji">👍</span><span class="label">TOP</span></button>' +
                '<button class="nps-btn" data-s="6"><span class="emoji">😐</span><span class="label">BELEZA</span></button>' +
                '<button class="nps-btn" data-s="2"><span class="emoji">👎</span><span class="label">RUIM</span></button>' +
            '</div>' +
            '<div class="nps-followup" id="npsFollowup"></div>';
        wrap.querySelectorAll('.nps-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var score = parseInt(btn.getAttribute('data-s'), 10);
                handleScore(score, orderId);
            });
        });
        return wrap;
    }

    function handleScore(score, orderId) {
        markResponded(orderId, score);
        recordResponse(orderId, score, {});

        // Esconde botoes apos resposta
        var btns = document.querySelector('#npsQuick .nps-btns');
        if (btns) btns.style.display = 'none';

        var follow = document.getElementById('npsFollowup');
        if (!follow) return;

        if (score >= 8) {
            // Promoter — direciona pro Google Review
            follow.innerHTML =
                '<div class="nps-thanks">Eba! Que bom que curtiu 🎉</div>' +
                '<p style="font-size:13px;color:#6B7280;margin:8px 0 12px">Se sobrar 30 segundos: avalia a gente no Google e ganha <strong>raspinha PREMIUM + 50 MilkyCoins</strong>.</p>' +
                '<a class="nps-cta-secondary" href="https://milkypot.com/go.html?to=' +
                  encodeURIComponent('https://g.page/r/CXrthQS1rgPdEAE/review') +
                  '&promo=nps-promoter&fid=&source=nps" target="_blank">⭐ Avaliar no Google</a>';
        } else if (score >= 5) {
            // Neutral — pergunta o que faltou (textarea opcional)
            follow.innerHTML =
                '<div style="font-weight:800;color:#92400E;font-size:14px;margin-bottom:8px">Anotado! Quer dizer o que faltou pra ser TOP?</div>' +
                '<textarea id="npsReason" placeholder="Ex: demorou pra entregar, faltou cobertura, etc"></textarea>' +
                '<button class="nps-cta-secondary" onclick="window.__npsSubmitReason && window.__npsSubmitReason()">Enviar</button>' +
                '<button class="nps-mini-link" onclick="window.__npsThanksHide && window.__npsThanksHide()">Sem comentários, valeu</button>';
            window.__npsSubmitReason = function () {
                var t = document.getElementById('npsReason');
                var reason = (t && t.value || '').trim();
                if (reason) recordResponse(orderId, score, { reason: reason.slice(0, 500) });
                follow.innerHTML = '<div class="nps-thanks">Recebido. Vamos melhorar 💜</div>';
            };
        } else {
            // Detractor — pede contato + escala pra Belinha humana
            follow.innerHTML =
                '<div style="font-weight:800;color:#991B1B;font-size:14px;margin-bottom:8px">Vamos resolver. Pode contar o que aconteceu?</div>' +
                '<textarea id="npsReason" placeholder="Pode falar tudo. A gente lê uma a uma."></textarea>' +
                '<button class="nps-cta-secondary" onclick="window.__npsSubmitDetractor && window.__npsSubmitDetractor()">Enviar pra dona</button>' +
                '<a class="nps-cta-secondary" href="https://wa.me/554399919777?text=' +
                  encodeURIComponent('Olá! Tive um problema com meu pedido #' + (orderId || '')) +
                  '" target="_blank" style="background:#25D366;margin-top:8px">💬 Falar pelo WhatsApp agora</a>';
            window.__npsSubmitDetractor = function () {
                var t = document.getElementById('npsReason');
                var reason = (t && t.value || '').trim();
                recordResponse(orderId, score, { reason: reason.slice(0, 1000), needsContact: true });
                follow.innerHTML = '<div class="nps-thanks" style="color:#7E57C2">Recebido. A dona vai entrar em contato 💜</div>';
            };
        }
        window.__npsThanksHide = function () {
            if (follow) follow.innerHTML = '<div class="nps-thanks">Valeu! 🐑</div>';
        };
        follow.classList.add('show');
    }

    function show(opts) {
        opts = opts || {};
        var orderId = opts.orderId || null;
        if (alreadyResponded(orderId)) return;
        var container = opts.container || document.getElementById('content') || document.body;
        var widget = build(orderId);
        container.appendChild(widget);
    }

    /** Auto-detect: se /pedido.html status='entregue', mostra NPS após 4s. */
    function _autoShowOnDelivered() {
        try {
            if (location.pathname.indexOf('/pedido') < 0) return;
            setTimeout(function () {
                var contentEl = document.getElementById('content');
                if (!contentEl) return;
                var deliveredBanner = Array.from(contentEl.querySelectorAll('.eta-banner'))
                    .find(function (el) { return el.textContent.indexOf('ENTREGUE') > -1; });
                if (!deliveredBanner) return;
                var params = new URLSearchParams(location.search);
                var orderId = params.get('id') || params.get('order') || '';
                show({ container: contentEl, orderId: orderId });
            }, 4000);
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoShowOnDelivered);
    } else {
        _autoShowOnDelivered();
    }

    global.NPSQuick = { show: show, alreadyResponded: alreadyResponded };
})(typeof window !== 'undefined' ? window : this);
