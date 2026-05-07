/* ============================================
   MilkyClube — Action Widgets
   ============================================
   Componentes plug-and-play para o cliente reivindicar recompensas
   (review Google, opt-in WhatsApp, push, aniversário, etc).

   Uso:
   <div id="clubActions"></div>
   <script src="/js/core/club-action-widgets.js"></script>
   <script>ClubActions.render('clubActions');</script>

   Requer: MilkyClube SDK + CloudFunctions inicializados.
   ============================================ */

(function (global) {
    'use strict';

    const FRANCHISE_DEFAULT = 'muffato-quintino';

    function getMember() {
        if (typeof MilkyClube === 'undefined' || !MilkyClube.getCurrentMember) return null;
        return MilkyClube.getCurrentMember();
    }
    function getMemberId(m) { return m && (m.uid || m.id); }
    function getFranchise() {
        try {
            return new URLSearchParams(location.search).get('fid') || FRANCHISE_DEFAULT;
        } catch(_) { return FRANCHISE_DEFAULT; }
    }

    function cardHtml(opts) {
        return '' +
        '<div style="background:' + opts.bg + ';color:' + opts.color + ';border-radius:18px;padding:18px 20px;margin-bottom:14px;box-shadow:0 4px 16px rgba(0,0,0,.08);position:relative;overflow:hidden">' +
            (opts.tag ? '<div style="position:absolute;top:8px;right:10px;background:rgba(255,255,255,.85);color:#7c3aed;font-size:.7rem;font-weight:800;padding:3px 10px;border-radius:100px;letter-spacing:.05em;text-transform:uppercase">' + opts.tag + '</div>' : '') +
            '<div style="font-size:30px;line-height:1;margin-bottom:6px">' + opts.icon + '</div>' +
            '<div style="font-family:\'Baloo 2\',cursive;font-size:1.05rem;font-weight:800;line-height:1.15;margin-bottom:6px">' + opts.title + '</div>' +
            '<div style="font-size:.86rem;line-height:1.4;opacity:.95;margin-bottom:14px">' + opts.body + '</div>' +
            '<button id="' + opts.btnId + '" style="display:block;width:100%;padding:12px;background:' + (opts.btnBg || '#fff') + ';color:' + (opts.btnColor || opts.color) + ';font-family:\'Baloo 2\',cursive;font-weight:800;font-size:.95rem;border:none;border-radius:12px;cursor:pointer">' + opts.btn + '</button>' +
            '<div id="' + opts.btnId + '_status" style="margin-top:8px;font-size:.82rem;font-weight:700;text-align:center;display:none"></div>' +
        '</div>';
    }

    function setStatus(btnId, msg, kind) {
        var el = document.getElementById(btnId + '_status');
        if (!el) return;
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
        el.style.color = kind === 'ok' ? '#16a34a' : kind === 'err' ? '#dc2626' : '#6b7280';
    }

    async function claimAndApply(action, payload, btnId, successMsg) {
        var member = getMember();
        var memberId = getMemberId(member);
        if (!memberId) {
            setStatus(btnId, '⚠️ Faça login primeiro', 'err');
            return null;
        }
        if (typeof CloudFunctions === 'undefined' || !CloudFunctions.claimAction) {
            setStatus(btnId, '⚠️ Sistema não inicializado', 'err');
            return null;
        }
        var btn = document.getElementById(btnId);
        if (btn) { btn.disabled = true; btn.style.opacity = '.7'; }
        setStatus(btnId, '⏳ Processando...', 'info');
        try {
            var r = await CloudFunctions.claimAction(memberId, action, payload || {}, getFranchise());
            if (r && r.duplicate) {
                setStatus(btnId, '✅ Você já fez isso recentemente', 'ok');
                if (btn) btn.style.display = 'none';
                return r;
            }
            if (r && r.success) {
                setStatus(btnId, successMsg || '✅ Concluído!', 'ok');
                if (btn) btn.style.display = 'none';
                return r;
            }
            setStatus(btnId, '⚠️ ' + (r && r.error || 'Não foi possível'), 'err');
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            return r;
        } catch(e) {
            setStatus(btnId, '❌ ' + (e.message || e), 'err');
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            return null;
        }
    }

    // ─────────────────────────────────────────
    // WIDGETS
    // ─────────────────────────────────────────

    function widgetWhatsAppOptin() {
        var html = cardHtml({
            tag: '+50 G$',
            bg: 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff',
            icon: '💬',
            title: 'Quer ofertas no WhatsApp?',
            body: 'A gente avisa quando rolar promo na sua loja. Nada de spam, só desconto bom.',
            btn: '✓ Ativar e ganhar 50 MilkyCoins',
            btnId: 'btnWaOptin',
            btnBg: '#fff',
            btnColor: '#128C7E'
        });
        return html;
    }
    function bindWhatsAppOptin() {
        var btn = document.getElementById('btnWaOptin');
        if (!btn) return;
        btn.addEventListener('click', function(){
            claimAndApply('whatsapp_optin', { source: 'clube_widget' }, 'btnWaOptin',
                '✅ Ativado! 50 MilkyCoins na conta');
        });
    }

    function widgetGoogleReview() {
        var html = cardHtml({
            tag: '+50 G$ + Premium',
            bg: 'linear-gradient(135deg,#FFD700,#FFA000)',
            color: '#fff',
            icon: '⭐',
            title: 'Avalie no Google',
            body: 'Conta a alguém o que achou da MilkyPot — você ganha uma raspinha PREMIUM (prêmios maiores) + 50 MilkyCoins.',
            btn: '⭐ Avaliar agora',
            btnId: 'btnGoogleReview',
            btnBg: '#fff',
            btnColor: '#FF6B00'
        });
        return html;
    }
    function bindGoogleReview() {
        var btn = document.getElementById('btnGoogleReview');
        if (!btn) return;
        btn.addEventListener('click', function(){
            // Abre review em nova aba e leva pra landing após
            var reviewUrl = 'https://g.page/r/CXrthQS1rgPdEAE/review';
            window.open(reviewUrl, '_blank', 'noopener');
            setTimeout(function() {
                location.href = '/clube/avaliei.html?fid=' + getFranchise();
            }, 1500);
        });
    }

    function widgetBirthdaySet(member) {
        if (member && member.birthday) return ''; // já tem
        var html = cardHtml({
            tag: '+30 G$',
            bg: 'linear-gradient(135deg,#EC407A,#9C27B0)',
            color: '#fff',
            icon: '🎂',
            title: 'Conta seu aniversário',
            body: 'A gente prepara um mimo especial pro seu dia. Promessa de festa.',
            btn: '🎂 Definir aniversário',
            btnId: 'btnBirthdaySet',
            btnBg: '#fff',
            btnColor: '#9C27B0'
        });
        return html;
    }
    function bindBirthdaySet() {
        var btn = document.getElementById('btnBirthdaySet');
        if (!btn) return;
        btn.addEventListener('click', async function(){
            var raw = prompt('Quando é seu aniversário? (formato DD/MM)', '');
            if (!raw) return;
            var m = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
            if (!m) { setStatus('btnBirthdaySet', '⚠️ Use o formato DD/MM', 'err'); return; }
            var dd = parseInt(m[1],10), mm = parseInt(m[2],10);
            if (dd<1 || dd>31 || mm<1 || mm>12) { setStatus('btnBirthdaySet', '⚠️ Data inválida', 'err'); return; }

            // Atualiza birthday no member doc
            try {
                var member = getMember();
                var memberId = getMemberId(member);
                if (firebase && firebase.firestore && memberId) {
                    await firebase.firestore().collection('club_members').doc(memberId).update({
                        birthday: dd + '/' + mm,
                        updatedAt: new Date().toISOString()
                    });
                }
            } catch(e) { console.warn('birthday update', e); }

            claimAndApply('birthday_set', { birthday: dd+'/'+mm }, 'btnBirthdaySet',
                '✅ Anotado! 30 MilkyCoins na conta');
        });
    }

    function widgetPushOptin() {
        if (typeof Notification === 'undefined') return '';
        if (Notification.permission === 'granted') return '';
        var html = cardHtml({
            tag: '+25 G$',
            bg: 'linear-gradient(135deg,#42A5F5,#1976D2)',
            color: '#fff',
            icon: '🔔',
            title: 'Receba avisos por notificação',
            body: 'A gente te avisa quando o pedido tá pronto, raspinha nova, e ofertas relâmpago.',
            btn: '🔔 Ativar notificações',
            btnId: 'btnPushOptin',
            btnBg: '#fff',
            btnColor: '#1976D2'
        });
        return html;
    }
    function bindPushOptin() {
        var btn = document.getElementById('btnPushOptin');
        if (!btn) return;
        btn.addEventListener('click', async function(){
            try {
                var perm = await Notification.requestPermission();
                if (perm !== 'granted') {
                    setStatus('btnPushOptin', '⚠️ Permissão negada — pode reativar nas config do navegador', 'err');
                    return;
                }
            } catch(e) {
                setStatus('btnPushOptin', '⚠️ Não suportado', 'err');
                return;
            }
            claimAndApply('pwa_notif_optin', { permission: 'granted' }, 'btnPushOptin',
                '✅ Ativado! 25 MilkyCoins na conta');
        });
    }

    // ─────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────

    function render(elementId, options) {
        options = options || {};
        var el = document.getElementById(elementId);
        if (!el) { console.warn('ClubActions.render: elemento ' + elementId + ' não encontrado'); return; }

        var member = getMember();
        if (!member || !getMemberId(member)) {
            el.innerHTML = '<div style="text-align:center;padding:14px;color:#888;font-size:.88rem">Faça login pra ver suas missões 🐑</div>';
            return;
        }

        // Cabeçalho
        var html = '<h3 style="font-family:\'Baloo 2\',cursive;font-size:1.1rem;color:#7c3aed;margin-bottom:14px">🎁 Ganhe MilkyCoins fazendo missões</h3>';

        // Widgets em ordem
        html += widgetGoogleReview();
        html += widgetWhatsAppOptin();
        html += widgetBirthdaySet(member);
        html += widgetPushOptin();

        el.innerHTML = html;

        // Bind handlers
        bindGoogleReview();
        bindWhatsAppOptin();
        bindBirthdaySet();
        bindPushOptin();
    }

    // Auto re-render quando member muda
    function watchMemberChanges(elementId) {
        if (typeof MilkyClube !== 'undefined' && MilkyClube.onMemberChange) {
            MilkyClube.onMemberChange(function(){ render(elementId); });
        }
    }

    global.ClubActions = {
        render: render,
        watchMemberChanges: watchMemberChanges,
        // Exposed pra uso programático
        claim: claimAndApply
    };

})(typeof window !== 'undefined' ? window : this);
