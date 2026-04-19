/* ============================================
   MilkyPot - Admin/Franqueado/Staff Assistant
   ============================================
   Widget IA injetado nos painéis. Requer auth do
   Firebase (usa ID token no header Authorization).
   ============================================ */

(function() {
    'use strict';

    const ENDPOINT = '/api/chat-assistant';
    const STORAGE_KEY = 'milkypot_assistant_history';
    const MAX_HISTORY = 20;

    // ---- Histórico (sessionStorage por aba) ----
    function load() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.slice(-MAX_HISTORY) : [];
        } catch (e) { return []; }
    }
    function save(arr) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_HISTORY))); } catch (e) {}
    }

    // ---- Firebase ID Token ----
    async function getIdToken() {
        if (typeof firebase === 'undefined' || !firebase.auth) return null;
        const user = firebase.auth().currentUser;
        if (!user) return null;
        try { return await user.getIdToken(); } catch (e) { return null; }
    }

    // ---- Chamada ao proxy ----
    async function ask(userText) {
        const history = load();
        history.push({ role: 'user', content: userText });

        const token = await getIdToken();
        if (!token) {
            throw new Error('Faça login como admin, franqueado ou atendente pra usar o assistente.');
        }

        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 45000);
        try {
            const resp = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
                signal: ctrl.signal
            });
            clearTimeout(t);
            let data = null;
            try { data = await resp.json(); } catch (e) {}
            if (!resp.ok) throw new Error((data && data.error) || 'Assistente indisponível');
            const reply = (data && data.reply) || 'Sem resposta.';
            history.push({ role: 'assistant', content: reply });
            save(history);
            return { reply, role: data.role };
        } catch (err) {
            clearTimeout(t);
            if (err.name === 'AbortError') throw new Error('Demorou demais… tenta de novo.');
            throw err;
        }
    }

    // ---- UI ----
    function injectStyles() {
        if (document.getElementById('mp-assistant-styles')) return;
        const css = `
        .mp-assist-fab {
            position: fixed;
            bottom: calc(20px + env(safe-area-inset-bottom, 0px));
            right: 20px;
            z-index: 9999;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #A5D4FF 0%, #D4A5FF 60%, #FFB6D9 100%);
            color: #5A4570;
            font-size: 1.8rem;
            cursor: pointer;
            box-shadow: 0 8px 22px rgba(160, 140, 255, 0.45), 0 2px 6px rgba(0,0,0,.12);
            transition: transform .2s cubic-bezier(.2,.9,.3,1.4), box-shadow .2s;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
        }
        .mp-assist-fab:hover { transform: translateY(-2px) scale(1.04); }
        .mp-assist-fab:active { transform: scale(.96); }
        .mp-assist-fab .mp-assist-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #25D366;
            color: white;
            font-size: 0.6rem;
            padding: 3px 7px;
            border-radius: 999px;
            font-weight: 800;
            letter-spacing: .3px;
        }
        .mp-assist-panel {
            position: fixed;
            bottom: calc(90px + env(safe-area-inset-bottom, 0px));
            right: 20px;
            width: 380px;
            max-width: calc(100vw - 24px);
            height: 560px;
            max-height: calc(100vh - 120px);
            background: #fff;
            border-radius: 22px;
            box-shadow: 0 20px 60px rgba(0,0,0,.22);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9998;
            font-family: 'Nunito', system-ui, sans-serif;
            border: 1px solid rgba(160,140,255,.18);
        }
        .mp-assist-panel.open { display: flex; animation: mpAssistSlideIn .3s ease; }
        @keyframes mpAssistSlideIn {
            from { transform: translateY(16px) scale(.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .mp-assist-header {
            padding: 14px 16px;
            background: linear-gradient(135deg, #4A3268 0%, #6B4E8C 100%);
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .mp-assist-header .avatar {
            width: 36px; height: 36px;
            background: rgba(255,255,255,.18);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem;
        }
        .mp-assist-header h4 {
            margin: 0; font-size: 1rem; font-weight: 800; font-family: 'Baloo 2', cursive;
        }
        .mp-assist-header small { opacity: .85; font-size: .72rem; display: block; }
        .mp-assist-close {
            margin-left: auto;
            background: transparent;
            border: none;
            color: white;
            font-size: 1.4rem;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
        }
        .mp-assist-close:hover { background: rgba(255,255,255,.12); }
        .mp-assist-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: linear-gradient(180deg, #FAF7FF, #FFFFFF);
            font-size: .9rem;
            line-height: 1.5;
        }
        .mp-assist-msg {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 16px;
            margin-bottom: 10px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .mp-assist-msg.bot { background: #F0EAFF; color: #3E2860; border-bottom-left-radius: 4px; }
        .mp-assist-msg.user { background: linear-gradient(135deg, #6B4E8C, #A5D4FF); color: white; margin-left: auto; border-bottom-right-radius: 4px; }
        .mp-assist-msg.error { background: #FFE4E4; color: #8B0000; }
        .mp-assist-msg a { color: inherit; text-decoration: underline; }
        .mp-assist-typing { display: inline-flex; gap: 4px; padding: 2px 0; }
        .mp-assist-typing span {
            width: 7px; height: 7px; border-radius: 50%;
            background: #6B4E8C; opacity: .55;
            animation: mpDots 1.1s infinite ease-in-out;
        }
        .mp-assist-typing span:nth-child(2) { animation-delay: .15s; }
        .mp-assist-typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes mpDots {
            0%,60%,100% { transform: translateY(0); opacity:.55; }
            30% { transform: translateY(-5px); opacity: 1; }
        }
        .mp-assist-input-wrap {
            padding: 10px 12px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 8px;
            background: #fff;
        }
        .mp-assist-input-wrap input {
            flex: 1;
            padding: 11px 14px;
            border: 1px solid #E0D8F0;
            border-radius: 999px;
            font-size: .9rem;
            font-family: inherit;
            outline: none;
        }
        .mp-assist-input-wrap input:focus { border-color: #A5D4FF; box-shadow: 0 0 0 3px rgba(165,212,255,.25); }
        .mp-assist-input-wrap button {
            background: linear-gradient(135deg, #6B4E8C, #A5D4FF);
            color: white; border: none;
            padding: 0 16px; border-radius: 999px;
            font-weight: 700; cursor: pointer;
            font-family: inherit;
        }
        .mp-assist-input-wrap button:disabled { opacity: .5; cursor: not-allowed; }
        .mp-assist-suggestions {
            display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
        }
        .mp-assist-suggestions button {
            font-size: .78rem; padding: 6px 11px;
            background: #fff; border: 1px solid #E0D8F0;
            border-radius: 999px; cursor: pointer;
            color: #6B4E8C; font-family: inherit; font-weight: 600;
            transition: all .15s;
        }
        .mp-assist-suggestions button:hover { background: #6B4E8C; color: white; border-color: #6B4E8C; }
        @media (max-width: 480px) {
            .mp-assist-panel {
                width: calc(100vw - 20px);
                right: 10px;
                height: calc(100vh - 100px);
                bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            }
        }
        `;
        const style = document.createElement('style');
        style.id = 'mp-assistant-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function buildUI(role) {
        injectStyles();

        const roleLabel = {
            super_admin: { name: 'Lulú Business', sub: 'Admin da marca', emoji: '🐑📊', placeholder: 'Ex: como aumentar ticket médio?' },
            franchisee:  { name: 'Lulú Operação',  sub: 'Gestão da sua unidade', emoji: '🐑🛵', placeholder: 'Ex: script pra reativar clientes?' },
            manager:     { name: 'Lulú Operação',  sub: 'Gestão da unidade', emoji: '🐑🛵', placeholder: 'Ex: como fazer a inauguração?' },
            staff:       { name: 'Lulú PDV',       sub: 'Ajuda rápida no caixa', emoji: '🐑💳', placeholder: 'Como abrir o caixa?' }
        }[role] || { name: 'Lulú', sub: 'Assistente', emoji: '🐑', placeholder: 'Pergunta aí!' };

        const suggestions = {
            super_admin: [
                'Que relatório eu devo olhar primeiro?',
                'Como melhorar ticket médio?',
                'Script de prospecção de franqueado',
                'O que priorizar pra escalar?'
            ],
            franchisee: [
                'Como aumentar pedidos no iFood?',
                'Melhor combo pra empurrar hoje?',
                'Roteiro de treinamento pro atendente',
                'Como fidelizar cliente?'
            ],
            manager: [
                'Como organizar os turnos?',
                'Checklist de qualidade',
                'Como treinar novo atendente'
            ],
            staff: [
                'Como abrir o caixa?',
                'Passo a passo de um pedido',
                'Como fechar o turno?',
                'Regra de embalagem delivery'
            ]
        }[role] || [];

        const fab = document.createElement('button');
        fab.className = 'mp-assist-fab';
        fab.setAttribute('aria-label', 'Assistente IA');
        fab.setAttribute('title', roleLabel.name + ' — clique pra falar');
        fab.innerHTML = roleLabel.emoji + '<span class="mp-assist-badge">IA</span>';

        const panel = document.createElement('div');
        panel.className = 'mp-assist-panel';
        panel.innerHTML =
            '<div class="mp-assist-header">' +
                '<div class="avatar">🐑</div>' +
                '<div><h4>' + roleLabel.name + '</h4><small>' + roleLabel.sub + '</small></div>' +
                '<button class="mp-assist-close" aria-label="Fechar">&times;</button>' +
            '</div>' +
            '<div class="mp-assist-body" id="mpAssistBody"></div>' +
            '<div class="mp-assist-input-wrap">' +
                '<input type="text" id="mpAssistInput" placeholder="' + roleLabel.placeholder + '" autocomplete="off">' +
                '<button id="mpAssistSend">Enviar</button>' +
            '</div>';

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        const body = panel.querySelector('#mpAssistBody');
        const input = panel.querySelector('#mpAssistInput');
        const sendBtn = panel.querySelector('#mpAssistSend');
        const closeBtn = panel.querySelector('.mp-assist-close');

        function renderWelcome() {
            body.innerHTML = '';
            const welcome = {
                super_admin: 'Opa Jocimar! 👋 Sou sua IA de gestão. Pergunta aí — relatório, estratégia, copy, análise de pedidos. Respondo com base no que você compartilhar.',
                franchisee: 'Oi! 🐑 Sou sua IA operacional. Pergunta sobre pedidos, equipe, marketing local, iFood… Te dou ação concreta, não discurso.',
                manager: 'Oi gestor! 🐑 Vou te ajudar com operação da unidade. Manda ver.',
                staff: 'Oi! 🐑 Dúvida do PDV? Abertura de caixa, pedidos, embalagem, fechamento de turno. Me pergunta!'
            }[role] || 'Oi! Pergunta aí 🐑';

            addBot(welcome);
            if (suggestions.length) {
                const sug = document.createElement('div');
                sug.className = 'mp-assist-suggestions';
                suggestions.forEach(text => {
                    const b = document.createElement('button');
                    b.textContent = text;
                    b.onclick = () => { input.value = text; handle(); };
                    sug.appendChild(b);
                });
                body.appendChild(sug);
            }
        }

        function addBot(text) {
            const el = document.createElement('div');
            el.className = 'mp-assist-msg bot';
            renderRich(text, el);
            body.appendChild(el);
            body.scrollTop = body.scrollHeight;
        }
        function addUser(text) {
            const el = document.createElement('div');
            el.className = 'mp-assist-msg user';
            el.textContent = text;
            body.appendChild(el);
            body.scrollTop = body.scrollHeight;
        }
        function addError(text) {
            const el = document.createElement('div');
            el.className = 'mp-assist-msg error';
            el.textContent = text;
            body.appendChild(el);
            body.scrollTop = body.scrollHeight;
        }
        function addTyping() {
            const el = document.createElement('div');
            el.className = 'mp-assist-msg bot';
            el.innerHTML = '<div class="mp-assist-typing"><span></span><span></span><span></span></div>';
            body.appendChild(el);
            body.scrollTop = body.scrollHeight;
            return el;
        }
        function renderRich(text, target) {
            const urlRe = /(https?:\/\/[^\s]+)/g;
            const lines = String(text).split('\n');
            lines.forEach((line, i) => {
                let last = 0, m;
                urlRe.lastIndex = 0;
                while ((m = urlRe.exec(line)) !== null) {
                    if (m.index > last) target.appendChild(document.createTextNode(line.slice(last, m.index)));
                    const a = document.createElement('a');
                    a.href = m[0]; a.target = '_blank'; a.rel = 'noopener';
                    a.textContent = m[0].length > 50 ? m[0].slice(0, 47) + '…' : m[0];
                    target.appendChild(a);
                    last = m.index + m[0].length;
                }
                if (last < line.length) target.appendChild(document.createTextNode(line.slice(last)));
                if (i < lines.length - 1) target.appendChild(document.createElement('br'));
            });
        }

        async function handle() {
            const text = (input.value || '').trim();
            if (!text) return;
            addUser(text);
            input.value = '';
            sendBtn.disabled = true;
            const typing = addTyping();
            try {
                const { reply } = await ask(text);
                typing.remove();
                addBot(reply);
            } catch (err) {
                typing.remove();
                addError(err.message || 'Erro ao falar com a IA');
            } finally {
                sendBtn.disabled = false;
                input.focus();
            }
        }

        sendBtn.addEventListener('click', handle);
        input.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); handle(); } });

        fab.addEventListener('click', () => {
            panel.classList.add('open');
            fab.style.display = 'none';
            if (!body.children.length) renderWelcome();
            setTimeout(() => input.focus(), 250);
        });
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            fab.style.display = 'flex';
        });
    }

    // ---- Auto-init quando Firebase Auth confirmar user logado ----
    function waitForAuthAndInit() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            // Firebase ainda não carregou, tenta depois
            setTimeout(waitForAuthAndInit, 800);
            return;
        }
        firebase.auth().onAuthStateChanged(async user => {
            if (!user) return;
            try {
                const tokenResult = await user.getIdTokenResult();
                const role = tokenResult.claims.role;
                if (!role || !['super_admin', 'franchisee', 'manager', 'staff'].includes(role)) return;
                if (document.querySelector('.mp-assist-fab')) return; // já montado
                buildUI(role);
                console.log('🐑 Lulú Assistant ativada para role:', role);
            } catch (e) {
                console.warn('Assistant init failed:', e);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForAuthAndInit);
    } else {
        waitForAuthAndInit();
    }
})();
