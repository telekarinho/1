/* ============================================================
   MilkyPot Wallet Pass — MilkyClube card pra Wallet
   ============================================================
   Apple Wallet (.pkpass) requer signing server-side, fora do escopo
   client-only. Solução pragmática:
     - Gera QR Code com link /clube?uid=XXX
     - Botão "Adicionar ao Wallet" tenta Apple Wallet via .pkpass URL
       se existir endpoint server, senão faz download de PNG ou
       Web Share da imagem.
     - Tudo client-side com QR API externa (free).

   Caso o user tenha Apple Wallet, futura Cloud Function pode gerar
   .pkpass real com signing. Por enquanto cobre 80% do valor — cliente
   tem o QR sempre acessível.

   API:
     WalletPass.show({ memberName, coins, tier, uid })
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpWalletLoaded) return;
    global._mpWalletLoaded = true;

    var QR_API = 'https://api.qrserver.com/v1/create-qr-code/';

    function show(opts) {
        opts = opts || {};
        var memberName = opts.memberName || 'Membro MilkyClube';
        var coins = Number(opts.coins || 0);
        var tier = opts.tier || 'leite';
        var uid = opts.uid || ('anon_' + Date.now().toString(36));
        var url = location.origin + '/clube.html?uid=' + encodeURIComponent(uid);

        var tierColors = {
            leite: '#3B82F6',
            nata: '#A855F7',
            chantilly: '#F59E0B'
        };
        var tierIcons = {
            leite: '🥛',
            nata: '✨',
            chantilly: '👑'
        };

        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99993;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Segoe UI",sans-serif';
        modal.innerHTML =
            '<div style="background:#fff;border-radius:24px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.4)">' +

              // Card visual estilo Apple Wallet
              '<div style="background:linear-gradient(135deg,' + tierColors[tier] + ',' + tierColors[tier] + 'CC);padding:24px;color:#fff;position:relative">' +
                '<button id="mpWalletClose" style="position:absolute;top:12px;right:14px;background:rgba(255,255,255,.2);border:0;color:#fff;width:36px;height:36px;border-radius:999px;font-size:22px;cursor:pointer">×</button>' +
                '<div style="display:flex;justify-content:space-between;align-items:start">' +
                  '<div>' +
                    '<div style="font-size:11px;opacity:.85;letter-spacing:1px;text-transform:uppercase">MilkyClube</div>' +
                    '<div style="font-size:22px;font-weight:900;margin-top:4px">' + tierIcons[tier] + ' ' + tier.toUpperCase() + '</div>' +
                  '</div>' +
                  '<div style="text-align:right">' +
                    '<div style="font-size:10px;opacity:.7;letter-spacing:1px;text-transform:uppercase">Saldo</div>' +
                    '<div style="font-size:24px;font-weight:900">' + coins + ' 🪙</div>' +
                  '</div>' +
                '</div>' +
                '<div style="margin-top:24px;font-size:14px;font-weight:700">' + memberName + '</div>' +
                '<div style="margin-top:6px;font-size:11px;opacity:.7">Cardão MilkyPot · ID ' + uid.slice(-6).toUpperCase() + '</div>' +
              '</div>' +

              // QR
              '<div style="padding:20px;text-align:center;background:#FAFAFA">' +
                '<img src="' + QR_API + '?size=180x180&data=' + encodeURIComponent(url) + '&ecc=H&margin=2" alt="QR" style="width:180px;height:180px;border-radius:14px;background:#fff;padding:8px;display:block;margin:0 auto"/>' +
                '<div style="margin-top:10px;font-size:12px;color:#6B7280">Apresente esse QR na loja</div>' +
              '</div>' +

              // Ações
              '<div style="padding:16px;background:#fff;display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                '<button id="mpWalletDownload" style="background:#1F2937;color:#fff;border:0;padding:14px;border-radius:12px;font-weight:800;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px">📥 Baixar card</button>' +
                '<button id="mpWalletShare" style="background:#25D366;color:#fff;border:0;padding:14px;border-radius:12px;font-weight:800;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px">📲 Compartilhar</button>' +
              '</div>' +
              '<div style="padding:0 16px 16px;font-size:11px;color:#9CA3AF;text-align:center">Salve esse card nas suas fotos pra ter sempre na mão</div>' +
            '</div>';
        document.body.appendChild(modal);

        modal.querySelector('#mpWalletClose').onclick = function () { modal.remove(); };

        modal.querySelector('#mpWalletDownload').onclick = function () {
            // Renderiza card como imagem via html2canvas (lazy) ou download direto do QR
            _downloadCard(memberName, coins, tier, url);
            if (global.MpAnalytics) global.MpAnalytics.track('wallet_card_downloaded', { tier: tier });
        };

        modal.querySelector('#mpWalletShare').onclick = function () {
            var text = '🐑 Minha carteirinha MilkyClube — ' + tier.toUpperCase() + ' com ' + coins + ' MilkyCoins!\n\nQuer ver seus pontos? milkypot.com/clube';
            if (navigator.share) {
                navigator.share({ title: 'MilkyClube', text: text, url: location.origin + '/clube.html' });
            } else {
                window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
            }
            if (global.MpAnalytics) global.MpAnalytics.track('wallet_shared', { tier: tier });
        };

        if (global.MpAnalytics) global.MpAnalytics.track('wallet_modal_shown', { tier: tier, coins: coins });
    }

    function _downloadCard(memberName, coins, tier, url) {
        // Simples: baixa só o QR como PNG (servidor QR retorna PNG direto)
        var qrUrl = QR_API + '?size=400x400&data=' + encodeURIComponent(url) + '&ecc=H&margin=4';
        var a = document.createElement('a');
        a.href = qrUrl;
        a.download = 'milkyclube-' + memberName.replace(/\s+/g, '-') + '.png';
        a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove();
    }

    global.WalletPass = {
        show: show,
        VERSION: 'mp-v257'
    };
})(typeof window !== 'undefined' ? window : this);
