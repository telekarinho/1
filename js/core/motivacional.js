/* ============================================
   MilkyPot - Mensagens Motivacionais
   ============================================
   Só mensagens + banner + toast periódico.
   O controle de caixa vive em js/core/caixa.js.
   Aditivo — não altera nada existente.
   ============================================ */

const Motivacional = (function () {
    'use strict';

    const SEEN_KEY = 'mp_motivacional_seen';

    // Fonte da verdade: AdminConfig (editável pelo super_admin).
    // Fallback local se AdminConfig não tiver carregado.
    function MESSAGES() {
        if (typeof AdminConfig !== 'undefined' && AdminConfig.getMessages) {
            return AdminConfig.getMessages();
        }
        return _FALLBACK_MESSAGES;
    }

    const _FALLBACK_MESSAGES = {
        login: [
            { text: 'Bom dia, estrela! Hoje tem cliente feliz te esperando!', icon: '☀️' },
            { text: 'Você voltou! O potinho fica mais doce com você por aqui.', icon: '🍨' },
            { text: 'Novo dia, novas cascadas de ganache! Bora?', icon: '🚀' },
            { text: 'Cada potinho entregue com carinho vira cliente fiel.', icon: '💝' },
            { text: 'Seu sorriso é o melhor topping de todos!', icon: '😊' },
            { text: 'Equipe MilkyPot é feita de gente especial. Você é!', icon: '⭐' },
            { text: 'Hoje é dia de brilhar e derreter corações!', icon: '✨' },
            { text: 'O sucesso é servido em pequenas doses diárias!', icon: '🏆' },
            { text: 'Pronto pra transformar o dia de alguém em doce?', icon: '🎯' },
            { text: 'Bora fazer acontecer! A galera conta com você!', icon: '🔥' },
        ],
        during: [
            { text: 'Você está arrasando hoje! Continue assim!', icon: '🔥', minHour: 10 },
            { text: 'Meio dia de vitórias! Já dá pra celebrar!', icon: '⚡', minHour: 12 },
            { text: 'Lembra de sorrir pro próximo cliente. Faz diferença!', icon: '😄', minHour: 11 },
            { text: 'Que tal oferecer o combo do dia pro próximo?', icon: '💡', minHour: 13 },
            { text: 'Reta final! Vamos bater a meta juntos!', icon: '🏁', minHour: 16 },
            { text: 'Foto linda dos potinhos no Insta dá resultado!', icon: '📸', minHour: 14 },
            { text: 'Cliente satisfeito volta e traz amigo. Capricha!', icon: '💖', minHour: 15 },
            { text: 'Hora do lanche da tarde: pico de movimento!', icon: '🍦', minHour: 15 },
            { text: 'Já pediu pra avaliarem no Google hoje?', icon: '⭐', minHour: 13 },
            { text: 'Tá quase batendo a meta! Não pára agora!', icon: '🎯', minHour: 17 },
        ],
        caixaAberto: [
            { text: 'Caixa aberto! Que hoje seja um dia doce de vendas!', icon: '💰' },
            { text: 'Vamos com tudo! Primeiro cliente, primeira venda!', icon: '🚀' },
            { text: 'Caixa liberado! Foco, carinho e muito sorriso!', icon: '✨' },
            { text: 'Tudo pronto! Bora fazer acontecer?', icon: '🔥' },
            { text: 'Bom atendimento gera bons números. Conta contigo!', icon: '🏆' },
        ],
        caixaFechado: [
            { text: 'Dia encerrado! Você fez um trabalho incrível hoje!', icon: '🏆' },
            { text: 'Caixa fechado com sucesso! Descanse, você merece!', icon: '🌙' },
            { text: 'Mais um dia na conta da vitória. Parabéns!', icon: '🎉' },
            { text: 'Obrigado pelo seu esforço hoje. Amanhã tem mais!', icon: '💝' },
            { text: 'Feito! Agora é recarregar pra amanhã brilhar de novo!', icon: '🔋' },
        ],
    };

    function getSeen() {
        try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); }
        catch (e) { return {}; }
    }

    function setSeen(data) {
        try { localStorage.setItem(SEEN_KEY, JSON.stringify(data)); } catch (e) {}
    }

    function cleanOldKeys(seen) {
        const keys = Object.keys(seen).sort();
        if (keys.length > 60) {
            keys.slice(0, keys.length - 60).forEach(k => delete seen[k]);
        }
        return seen;
    }

    function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function getLoginMessage() {
        return pickRandom(MESSAGES().login);
    }

    function getDuringMessage() {
        const hour = new Date().getHours();
        const eligible = MESSAGES().during.filter(m => hour >= m.minHour);
        if (eligible.length === 0) return null;
        const seen = getSeen();
        const hourKey = 'during_' + new Date().toISOString().slice(0, 13);
        if (seen[hourKey]) return null;
        seen[hourKey] = true;
        setSeen(cleanOldKeys(seen));
        return pickRandom(eligible);
    }

    function markLoginShown(userId) {
        if (!userId) return;
        const seen = getSeen();
        const today = new Date().toISOString().slice(0, 10);
        seen['login_' + userId + '_' + today] = true;
        setSeen(cleanOldKeys(seen));
    }

    function toast(msg, type) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(msg, type || 'success');
        }
    }

    function showMotivationalToast() {
        const m = getDuringMessage();
        if (!m) return;
        toast(m.icon + ' ' + m.text, 'success');
    }

    function toastCaixaAberto() {
        const m = pickRandom(MESSAGES().caixaAberto);
        toast(m.icon + ' ' + m.text, 'success');
    }

    function toastCaixaFechado() {
        const m = pickRandom(MESSAGES().caixaFechado);
        toast(m.icon + ' ' + m.text, 'success');
    }

    function renderWelcomeBanner(opts) {
        opts = opts || {};
        const userId = opts.userId || '';
        const name = opts.name || 'Atendente';
        const subtitle = opts.subtitle || '';
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
        const msg = getLoginMessage();
        markLoginShown(userId);

        const firstName = name.split(' ')[0];
        const esc = (s) => (typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml(s) : String(s || '');

        return (
            '<div id="motivationBanner" style="background:linear-gradient(135deg,#E91E63,#D4A5FF);border-radius:16px;padding:20px 28px;color:#fff;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;box-shadow:0 4px 14px rgba(233,30,99,0.18);position:relative;overflow:hidden">' +
              '<div style="display:flex;align-items:center;gap:16px;flex:1;min-width:260px">' +
                '<div style="font-size:46px;line-height:1">' + msg.icon + '</div>' +
                '<div>' +
                  '<h2 style="font-family:\'Baloo 2\',cursive;font-size:1.25rem;margin:0 0 4px;font-weight:700">' + greeting + ', ' + esc(firstName) + '! 👋</h2>' +
                  '<p style="margin:0;opacity:0.95;font-size:0.9rem;line-height:1.35">' + esc(msg.text) + '</p>' +
                  (subtitle ? '<p style="margin:6px 0 0;opacity:0.75;font-size:0.78rem">' + esc(subtitle) + '</p>' : '') +
                '</div>' +
              '</div>' +
              '<button onclick="document.getElementById(\'motivationBanner\').style.display=\'none\'" aria-label="Fechar" style="position:absolute;top:8px;right:12px;background:rgba(255,255,255,0.18);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0">✕</button>' +
            '</div>'
        );
    }

    let _tickTimer = null;
    function startPeriodicToasts(intervalMs) {
        stopPeriodicToasts();
        const every = intervalMs || (25 * 60 * 1000);
        _tickTimer = setInterval(showMotivationalToast, every);
    }

    function stopPeriodicToasts() {
        if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }
    }

    function initPanel(opts) {
        opts = opts || {};
        const session = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
        if (!session) return;
        const mount = opts.bannerMount || document.getElementById('motivationMount');
        if (mount) {
            mount.innerHTML = renderWelcomeBanner({
                userId: session.userId,
                name: session.name,
                subtitle: opts.subtitle || ''
            });
        }
        if (opts.startToasts !== false) startPeriodicToasts(opts.intervalMs);
    }

    return {
        MESSAGES: MESSAGES,
        getLoginMessage: getLoginMessage,
        getDuringMessage: getDuringMessage,
        markLoginShown: markLoginShown,
        renderWelcomeBanner: renderWelcomeBanner,
        showMotivationalToast: showMotivationalToast,
        toastCaixaAberto: toastCaixaAberto,
        toastCaixaFechado: toastCaixaFechado,
        startPeriodicToasts: startPeriodicToasts,
        stopPeriodicToasts: stopPeriodicToasts,
        initPanel: initPanel
    };
})();
