/* ============================================================
   MilkyPot Roleta MilkyCoins — modal pós-pedido com sorteio de prêmios
   ============================================================
   Engajamento viral + retenção:
   - Modal anima após order_completed
   - 8 prêmios com pesos diferentes (sorteio ponderado)
   - Voucher único salvo em Firestore (resgatável no PDV)
   - "Mostre pra galera" CTA: share Stories
   - FOMO: cupom expira em 7 dias

   API:
     Roleta.show({ orderId, customerPhone, franchiseId, total })
       Roda flow inteiro: modal anima, sorteia, salva.
     Roleta.PRIZES — array exposto pra admin customizar depois.

   Integração:
     Após placeOrder() success em js/checkout.js:
       if (window.Roleta) Roleta.show({ orderId: orderNumber, ... });
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpRoletaLoaded) return;
    global._mpRoletaLoaded = true;

    // Catálogo de prêmios. Peso (weight) é probabilidade relativa.
    // Soma dos pesos = 100. Espera-se distribuição: prêmios fáceis (alto peso)
    // saem ~30%, raros (jackpot, peso 1) saem ~1%.
    var PRIZES = [
        {
            id: 'desconto_20',
            label: '20% OFF',
            sub: 'No próximo pedido',
            emoji: '💸',
            color: '#FF6B9D',
            weight: 30,
            type: 'percent_off',
            value: 20,
            expiresDays: 7
        },
        {
            id: 'milky_coins_50',
            label: '+50',
            sub: 'MilkyCoins',
            emoji: '🪙',
            color: '#F59E0B',
            weight: 20,
            type: 'coins',
            value: 50
        },
        {
            id: 'topping_gratis',
            label: 'Topping',
            sub: 'GRÁTIS!',
            emoji: '🍓',
            color: '#EC4899',
            weight: 15,
            type: 'free_topping',
            value: 1,
            expiresDays: 7
        },
        {
            id: 'sticker_digital',
            label: 'Sticker',
            sub: 'Exclusivo 🐑',
            emoji: '🎨',
            color: '#8B5CF6',
            weight: 15,
            type: 'sticker'
        },
        {
            id: 'frete_gratis',
            label: 'Frete',
            sub: 'GRÁTIS',
            emoji: '🛵',
            color: '#10B981',
            weight: 10,
            type: 'free_delivery',
            expiresDays: 7
        },
        {
            id: 'sundae_gratis',
            label: 'Sundae',
            sub: 'em pedido R$30+',
            emoji: '🍨',
            color: '#06B6D4',
            weight: 5,
            type: 'free_sundae',
            minOrder: 30,
            expiresDays: 7
        },
        {
            id: 'combo_familia_15',
            label: '15% OFF',
            sub: 'Combo Família',
            emoji: '👨‍👩‍👧',
            color: '#F97316',
            weight: 4,
            type: 'percent_off_combo',
            value: 15,
            expiresDays: 14
        },
        {
            id: 'jackpot_milkshake',
            label: 'JACKPOT',
            sub: '1 Milkshake GRÁTIS',
            emoji: '🏆',
            color: '#FBBF24',
            weight: 1,
            type: 'free_milkshake',
            isJackpot: true,
            expiresDays: 14
        }
    ];

    // ============================================================
    // Sorteio ponderado
    // ============================================================
    function pickPrize() {
        var totalWeight = PRIZES.reduce(function (s, p) { return s + p.weight; }, 0);
        var r = Math.random() * totalWeight;
        var acc = 0;
        for (var i = 0; i < PRIZES.length; i++) {
            acc += PRIZES[i].weight;
            if (r <= acc) return { prize: PRIZES[i], index: i };
        }
        return { prize: PRIZES[0], index: 0 }; // fallback
    }

    // ============================================================
    // Voucher code generator
    // ============================================================
    function generateVoucherCode() {
        var ts = Date.now().toString(36).toUpperCase().slice(-5);
        var rand = Math.random().toString(36).toUpperCase().slice(2, 5);
        return 'MP-' + ts + rand;
    }

    // ============================================================
    // Persistência: Firestore + localStorage fallback
    // ============================================================
    function persistVoucher(voucher) {
        // localStorage sempre (offline-first)
        try {
            var list = JSON.parse(localStorage.getItem('mp_roleta_vouchers') || '[]');
            list.unshift(voucher);
            list = list.slice(0, 50); // mantém últimas 50
            localStorage.setItem('mp_roleta_vouchers', JSON.stringify(list));
        } catch (e) { /* localStorage cheio */ }

        // Firestore quando online
        try {
            if (global.firebase && global.firebase.firestore) {
                global.firebase.firestore()
                    .collection('roleta_winnings')
                    .doc(voucher.code)
                    .set(voucher)
                    .catch(function (err) {
                        console.warn('[Roleta] Firestore save falhou (voucher local OK):', err.message);
                    });
            }
        } catch (e) { /* ignore */ }
    }

    // ============================================================
    // Modal HTML (lazy, criado on-demand)
    // ============================================================
    function createModal() {
        var existing = document.getElementById('mpRoletaModal');
        if (existing) return existing;

        var modal = document.createElement('div');
        modal.id = 'mpRoletaModal';
        modal.style.cssText = [
            'position:fixed', 'inset:0', 'background:rgba(0,0,0,.75)',
            'z-index:99999', 'display:none', 'align-items:center', 'justify-content:center',
            'padding:16px', 'font-family:"Segoe UI",sans-serif'
        ].join(';');

        modal.innerHTML =
            '<div id="mpRoletaCard" style="background:linear-gradient(135deg,#FFF1F5,#FFEAF5);border-radius:24px;padding:24px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);position:relative">' +
              '<button id="mpRoletaClose" style="position:absolute;top:12px;right:14px;background:transparent;border:0;font-size:24px;cursor:pointer;color:#9CA3AF">×</button>' +
              '<div style="font-size:13px;font-weight:800;letter-spacing:1px;color:#EC4899;text-transform:uppercase;margin-bottom:4px">🎰 Pedido entregue!</div>' +
              '<h2 style="margin:0 0 16px;font-size:24px;color:#831843;font-weight:900">Tira sua sorte 🐑</h2>' +
              '<div id="mpRoletaWheelContainer" style="position:relative;width:280px;height:280px;margin:0 auto 16px">' +
                '<svg id="mpRoletaSvg" viewBox="0 0 200 200" style="width:100%;height:100%;transition:transform 5s cubic-bezier(0.17,0.67,0.27,0.99);transform:rotate(0deg)"></svg>' +
                '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:22px solid #DC2626;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));z-index:2"></div>' +
              '</div>' +
              '<button id="mpRoletaSpinBtn" style="background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:16px 32px;border-radius:999px;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 8px 24px rgba(236,72,153,.4);transition:transform .2s;letter-spacing:.5px">🎰 GIRAR</button>' +
              '<div id="mpRoletaResult" style="display:none;margin-top:16px"></div>' +
              '<div style="margin-top:12px;font-size:11px;color:#9CA3AF">1 giro por pedido · cupons válidos 7-14 dias</div>' +
            '</div>';

        document.body.appendChild(modal);

        // Build wheel SVG (8 slices)
        var svg = modal.querySelector('#mpRoletaSvg');
        var sliceAngle = 360 / PRIZES.length;
        var svgContent = '';
        PRIZES.forEach(function (p, i) {
            var a1 = (i * sliceAngle - 90) * Math.PI / 180;
            var a2 = ((i + 1) * sliceAngle - 90) * Math.PI / 180;
            var x1 = 100 + 100 * Math.cos(a1), y1 = 100 + 100 * Math.sin(a1);
            var x2 = 100 + 100 * Math.cos(a2), y2 = 100 + 100 * Math.sin(a2);
            svgContent += '<path d="M100,100 L' + x1 + ',' + y1 + ' A100,100 0 0,1 ' + x2 + ',' + y2 + ' Z" fill="' + p.color + '" stroke="#fff" stroke-width="2"/>';
            // Texto no meio do slice
            var aMid = ((i + 0.5) * sliceAngle - 90) * Math.PI / 180;
            var tx = 100 + 60 * Math.cos(aMid), ty = 100 + 60 * Math.sin(aMid);
            var rot = (i + 0.5) * sliceAngle;
            svgContent += '<text x="' + tx + '" y="' + ty + '" fill="#fff" font-size="11" font-weight="800" text-anchor="middle" transform="rotate(' + rot + ' ' + tx + ' ' + ty + ')">' + p.emoji + '</text>';
        });
        // Círculo central
        svgContent += '<circle cx="100" cy="100" r="22" fill="#fff" stroke="#EC4899" stroke-width="3"/>';
        svgContent += '<text x="100" y="104" fill="#EC4899" font-size="13" font-weight="900" text-anchor="middle">🐑</text>';
        svg.innerHTML = svgContent;

        // Close handler
        modal.querySelector('#mpRoletaClose').addEventListener('click', function () {
            modal.style.display = 'none';
        });

        return modal;
    }

    // ============================================================
    // Animação + sorteio
    // ============================================================
    function spinWheel(context) {
        var modal = document.getElementById('mpRoletaModal');
        if (!modal) return;
        var svg = modal.querySelector('#mpRoletaSvg');
        var btn = modal.querySelector('#mpRoletaSpinBtn');
        var result = modal.querySelector('#mpRoletaResult');

        btn.disabled = true;
        btn.textContent = 'Girando…';
        btn.style.opacity = '0.6';

        var picked = pickPrize();
        var sliceAngle = 360 / PRIZES.length;
        // Posição final: centro do slice deve ficar embaixo da seta (topo)
        // Seta está em 0° (topo). Slice i começa em i*sliceAngle. Centro = (i+0.5)*sliceAngle.
        // Pra centro ficar no topo, precisamos rotacionar -(centro do slice)
        var targetAngle = -(picked.index + 0.5) * sliceAngle;
        // Acrescenta 6 voltas completas pra efeito
        var fullSpins = 6 * 360;
        var finalAngle = fullSpins + targetAngle;

        svg.style.transform = 'rotate(' + finalAngle + 'deg)';

        setTimeout(function () {
            showPrize(picked.prize, context, modal, btn, result);
        }, 5200); // matches CSS transition duration

        // Track analytics
        try {
            if (global.MpAnalytics) {
                global.MpAnalytics.track('roleta_spin', {
                    prize_id: picked.prize.id,
                    is_jackpot: !!picked.prize.isJackpot,
                    order_id: (context && context.orderId) || ''
                });
            }
        } catch (e) {}
    }

    function showPrize(prize, context, modal, btn, resultEl) {
        var voucherCode = (prize.type === 'sticker' || prize.type === 'coins') ? null : generateVoucherCode();
        var expiresAt = null;
        if (prize.expiresDays) {
            var d = new Date(); d.setDate(d.getDate() + prize.expiresDays);
            expiresAt = d.toISOString();
        }

        var voucher = {
            code: voucherCode,
            prizeId: prize.id,
            prizeLabel: prize.label,
            prizeSub: prize.sub,
            prizeEmoji: prize.emoji,
            prizeType: prize.type,
            prizeValue: prize.value || null,
            isJackpot: !!prize.isJackpot,
            orderId: (context && context.orderId) || null,
            customerPhone: (context && context.customerPhone) || null,
            franchiseId: (context && context.franchiseId) || null,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt,
            used: false,
            usedAt: null
        };

        if (voucherCode) persistVoucher(voucher);

        // Render result
        var resultHtml =
            '<div style="background:linear-gradient(135deg,' + prize.color + ',#fff);padding:20px;border-radius:16px;border:3px dashed ' + prize.color + ';animation:mp-pulse 1.5s ease-in-out infinite">' +
              '<div style="font-size:48px;margin-bottom:8px">' + prize.emoji + '</div>' +
              '<div style="font-size:24px;font-weight:900;color:' + (prize.isJackpot ? '#92400E' : '#831843') + ';margin-bottom:4px">' + prize.label + '</div>' +
              '<div style="font-size:14px;color:#4B5563;margin-bottom:12px">' + prize.sub + '</div>';

        if (voucherCode) {
            resultHtml += '<div style="background:#fff;padding:10px 14px;border-radius:10px;font-family:monospace;font-weight:900;font-size:18px;color:' + prize.color + ';letter-spacing:2px;display:inline-block;border:2px dashed ' + prize.color + '">' + voucherCode + '</div>';
            resultHtml += '<div style="margin-top:8px;font-size:11px;color:#6B7280">Apresente esse código na loja ou use no próximo pedido</div>';
            if (expiresAt) {
                var dExp = new Date(expiresAt).toLocaleDateString('pt-BR');
                resultHtml += '<div style="margin-top:4px;font-size:11px;color:#DC2626;font-weight:700">⏰ Válido até ' + dExp + '</div>';
            }
        } else if (prize.type === 'coins') {
            resultHtml += '<div style="font-size:13px;color:#92400E;font-weight:700">Adicionado ao seu MilkyClube 🪙</div>';
            // TODO: integrar com milkyclub.js pra creditar coins
        } else if (prize.type === 'sticker') {
            resultHtml += '<div style="font-size:13px;color:#7C3AED;font-weight:700">Baixe seu sticker exclusivo!</div>';
            resultHtml += '<a href="/images/stickers/ovelhinha-' + prize.id + '.png" download style="display:inline-block;margin-top:8px;background:' + prize.color + ';color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">📥 Baixar sticker</a>';
        }

        resultHtml +=
              '<div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
                '<button id="mpRoletaShareBtn" style="background:#25D366;color:#fff;border:0;padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:6px"><span>📲</span> Mostrar pra galera</button>' +
                '<button id="mpRoletaCloseBtn" style="background:#E5E7EB;color:#374151;border:0;padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px">Fechar</button>' +
              '</div>' +
            '</div>';

        resultEl.innerHTML = resultHtml;
        resultEl.style.display = 'block';
        btn.style.display = 'none';

        // Share handler
        var shareBtn = resultEl.querySelector('#mpRoletaShareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                var shareText = '🎰 Ganhei ' + prize.emoji + ' ' + prize.label + ' ' + prize.sub + ' na roleta MilkyPot! 🐑\n\nFaz seu pedido em milkypot.com';
                if (navigator.share) {
                    navigator.share({ title: 'MilkyPot Roleta', text: shareText, url: 'https://milkypot.com' }).catch(function(){});
                } else {
                    // Fallback: copia texto
                    try {
                        navigator.clipboard.writeText(shareText);
                        shareBtn.innerHTML = '<span>✅</span> Copiado!';
                        setTimeout(function () { shareBtn.innerHTML = '<span>📲</span> Mostrar pra galera'; }, 2000);
                    } catch (e) {
                        // Última opção: window.open WhatsApp
                        window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
                    }
                }
                if (global.MpAnalytics) global.MpAnalytics.track('roleta_share', { prize_id: prize.id });
            });
        }

        var closeBtn = resultEl.querySelector('#mpRoletaCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () { modal.style.display = 'none'; });
        }

        // Confetti se jackpot
        if (prize.isJackpot && typeof global.createConfetti === 'function') {
            global.createConfetti();
        }

        // Track outcome
        if (global.MpAnalytics) {
            global.MpAnalytics.track('roleta_prize_revealed', {
                prize_id: prize.id,
                voucher_code: voucherCode || '',
                is_jackpot: !!prize.isJackpot
            });
        }
    }

    // ============================================================
    // Inject CSS animation
    // ============================================================
    function injectStyles() {
        if (document.getElementById('mp-roleta-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-roleta-styles';
        style.textContent =
            '@keyframes mp-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }' +
            '#mpRoletaSpinBtn:hover { transform: scale(1.05); }' +
            '#mpRoletaSpinBtn:active { transform: scale(0.98); }';
        document.head.appendChild(style);
    }

    // ============================================================
    // Public API
    // ============================================================
    function show(context) {
        try {
            injectStyles();
            var modal = createModal();
            // Reset state pra reabrir limpo
            var btn = modal.querySelector('#mpRoletaSpinBtn');
            var result = modal.querySelector('#mpRoletaResult');
            var svg = modal.querySelector('#mpRoletaSvg');
            btn.disabled = false;
            btn.textContent = '🎰 GIRAR';
            btn.style.opacity = '1';
            btn.style.display = 'inline-block';
            result.style.display = 'none';
            result.innerHTML = '';
            svg.style.transition = 'none';
            svg.style.transform = 'rotate(0deg)';
            // Force reflow para reativar a transition
            void svg.offsetHeight;
            svg.style.transition = 'transform 5s cubic-bezier(0.17,0.67,0.27,0.99)';

            btn.onclick = function () { spinWheel(context || {}); };
            modal.style.display = 'flex';

            if (global.MpAnalytics) {
                global.MpAnalytics.track('roleta_shown', {
                    order_id: (context && context.orderId) || ''
                });
            }
        } catch (e) {
            console.warn('[Roleta] show error:', e);
        }
    }

    global.Roleta = {
        show: show,
        PRIZES: PRIZES,
        pickPrize: pickPrize, // exposto pra teste/admin
        VERSION: 'mp-v246'
    };
})(typeof window !== 'undefined' ? window : this);
