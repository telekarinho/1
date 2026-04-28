/* ============================================
   MilkyPot — Test Mode Banner
   js/core/test-mode.js
   ============================================
   Injeta banner visível em todas as páginas
   quando o sistema está em modo teste.
   Injetado automaticamente via auth.js após login.
   ============================================ */

(function () {
    'use strict';

    var BANNER_ID = 'mp-test-mode-banner';

    window.TestMode = {

        // ----------------------------------------
        // inject — injeta banner se modo teste ativo
        // ----------------------------------------
        inject: function (franchiseId) {
            if (!franchiseId) return;
            if (document.getElementById(BANNER_ID)) return; // já existe

            // Verifica via Firestore se modo teste está ativo
            if (typeof firebase === 'undefined' || !firebase.firestore) return;

            firebase.firestore()
                .collection('system_config')
                .doc(franchiseId)
                .get()
                .then(function (doc) {
                    if (!doc.exists) return;
                    var data = doc.data();
                    var isTest = data.isTestMode !== false && data.isProductionMode !== true;
                    var isProd = data.isProductionMode === true;

                    if (isTest) {
                        TestMode._showTestBanner(franchiseId);
                    } else if (isProd) {
                        TestMode._showProdBadge();
                    }
                })
                .catch(function () { /* silencioso — nao bloqueia a UI */ });
        },

        // ----------------------------------------
        // _showTestBanner
        // ----------------------------------------
        _showTestBanner: function (franchiseId) {
            if (document.getElementById(BANNER_ID)) return;

            var banner = document.createElement('div');
            banner.id = BANNER_ID;
            banner.style.cssText = [
                'position:fixed',
                'top:0',
                'left:0',
                'right:0',
                'z-index:99999',
                'background:linear-gradient(90deg,#7C3AED,#DB2777)',
                'color:#fff',
                'text-align:center',
                'padding:7px 16px',
                'font-family:Nunito,sans-serif',
                'font-size:13px',
                'font-weight:700',
                'letter-spacing:.3px',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'gap:10px',
                'box-shadow:0 2px 8px rgba(0,0,0,.3)'
            ].join(';');

            banner.innerHTML = [
                '<span style="font-size:16px">🧪</span>',
                '<span>MODO TESTE — dados não afetam clientes reais</span>',
                '<a href="/painel/test-checklist.html" style="background:rgba(255,255,255,.2);color:#fff;text-decoration:none;padding:3px 10px;border-radius:20px;font-size:11px;margin-left:8px">VER CHECKLIST</a>',
                '<button onclick="document.getElementById(\'' + BANNER_ID + '\').style.display=\'none\'" style="background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:18px;line-height:1;padding:0 0 0 8px" title="Fechar">×</button>'
            ].join('');

            // Empurra o conteúdo para baixo
            document.body.insertBefore(banner, document.body.firstChild);
            document.body.style.paddingTop = (parseInt(document.body.style.paddingTop || 0) + 38) + 'px';
        },

        // ----------------------------------------
        // _showProdBadge — badge pequeno no canto
        // ----------------------------------------
        _showProdBadge: function () {
            var badge = document.createElement('div');
            badge.id = BANNER_ID + '-prod';
            badge.style.cssText = [
                'position:fixed',
                'bottom:16px',
                'right:80px',
                'z-index:9000',
                'background:#16a34a',
                'color:#fff',
                'border-radius:20px',
                'padding:5px 14px',
                'font-size:11px',
                'font-weight:700',
                'box-shadow:0 2px 8px rgba(0,0,0,.2)',
                'pointer-events:none'
            ].join(';');
            badge.textContent = '✅ PRODUÇÃO';
            document.body.appendChild(badge);
        }
    };

})();
