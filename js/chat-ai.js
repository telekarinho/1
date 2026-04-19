/* ============================================
   MilkyPot - Chat AI (Lulú com Groq via proxy)
   ============================================
   Integra a IA da Lulú no chat widget existente.
   Chama o endpoint Vercel /api/chat-lulu (proxy seguro).
   Mantém histórico curto (últimas 10 msgs) por sessão.
   ============================================ */

(function() {
    'use strict';

    const API_ENDPOINT = '/api/chat-lulu';
    const STORAGE_KEY = 'milkypot_lulu_history';
    const MAX_HISTORY = 10;

    // ----- Histórico persistente na sessão -----
    function loadHistory() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
        } catch (e) { return []; }
    }

    function saveHistory(history) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
        } catch (e) { /* quota exceeded, ignora */ }
    }

    function clearHistory() {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    // ----- Indicador de "digitando…" -----
    function addTypingIndicator() {
        const messages = document.getElementById('chatMessages');
        if (!messages) return null;
        const el = document.createElement('div');
        el.className = 'chat-message bot chat-typing';
        el.innerHTML =
            '<div class="chat-avatar">🐑</div>' +
            '<div class="chat-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
        return el;
    }

    function removeTypingIndicator(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    // ----- Envia ao proxy -----
    async function askLulu(userText) {
        const history = loadHistory();
        history.push({ role: 'user', content: userText });

        const payload = {
            messages: history.slice(-MAX_HISTORY)
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const resp = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeout);

            let data = null;
            try { data = await resp.json(); } catch (e) {}

            if (!resp.ok) {
                const errMsg = (data && data.error) || 'Opa, travei aqui! 🐑 Fala comigo no WhatsApp: 5543998042424';
                throw new Error(errMsg);
            }

            const reply = (data && data.reply) || 'Hmm, não consegui pensar… me pergunta de novo? 🐑';
            history.push({ role: 'assistant', content: reply });
            saveHistory(history);
            return reply;
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === 'AbortError') {
                throw new Error('Demorei demais pra responder 😔 Tenta de novo ou fala no WhatsApp 5543998042424');
            }
            throw err;
        }
    }

    // ----- Adiciona mensagens no chat UI -----
    function addBotResponse(text) {
        const messages = document.getElementById('chatMessages');
        if (!messages) return;

        const el = document.createElement('div');
        el.className = 'chat-message bot chat-ai-reply';
        el.innerHTML =
            '<div class="chat-avatar">🐑</div>' +
            '<div class="chat-bubble"></div>';
        el.querySelector('.chat-bubble').appendChild(renderRichText(text));
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
    }

    /**
     * Renderiza texto com conversão de URLs em links clicáveis
     * e preserva quebras de linha. Nada de innerHTML com user input.
     */
    function renderRichText(text) {
        const frag = document.createDocumentFragment();
        const urlRe = /(https?:\/\/[^\s]+)/g;
        const lines = String(text).split('\n');
        lines.forEach((line, idx) => {
            let lastIdx = 0;
            let m;
            urlRe.lastIndex = 0;
            while ((m = urlRe.exec(line)) !== null) {
                if (m.index > lastIdx) {
                    frag.appendChild(document.createTextNode(line.slice(lastIdx, m.index)));
                }
                const a = document.createElement('a');
                a.href = m[0];
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = m[0].length > 50 ? m[0].slice(0, 47) + '…' : m[0];
                frag.appendChild(a);
                lastIdx = m.index + m[0].length;
            }
            if (lastIdx < line.length) {
                frag.appendChild(document.createTextNode(line.slice(lastIdx)));
            }
            if (idx < lines.length - 1) frag.appendChild(document.createElement('br'));
        });
        return frag;
    }

    // ----- Hook no chat existente -----
    // Intercepta free-form input do chat. O fluxo guiado (botões) fica intacto.
    function tryInitHook() {
        if (window.__luluAIHooked) return;
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSendBtn');
        if (!input || !sendBtn) return; // chat ainda não montado

        window.__luluAIHooked = true;

        async function handle() {
            const text = (input.value || '').trim();
            if (!text) return;

            // Já adiciona user message via função existente, se disponível
            if (typeof window.addUserMessage === 'function') {
                window.addUserMessage(text);
            } else {
                const messages = document.getElementById('chatMessages');
                if (messages) {
                    const el = document.createElement('div');
                    el.className = 'chat-message user';
                    el.innerHTML = '<div class="chat-bubble"></div>';
                    el.querySelector('.chat-bubble').textContent = text;
                    messages.appendChild(el);
                    messages.scrollTop = messages.scrollHeight;
                }
            }
            input.value = '';

            const typing = addTypingIndicator();
            try {
                const reply = await askLulu(text);
                removeTypingIndicator(typing);
                addBotResponse(reply);
            } catch (err) {
                removeTypingIndicator(typing);
                addBotResponse(err.message || 'Opa! Tenta de novo, ou fala comigo no WhatsApp 5543998042424 🐑');
            }
        }

        // Substitui handler do botão e Enter
        const newSend = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSend, sendBtn);
        newSend.addEventListener('click', handle);

        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); handle(); }
        });

        console.log('🐑 Lulú AI ativada');
    }

    // Observa mudanças no DOM (chat é injetado por checkout.js depois de DOMContentLoaded)
    function observeChat() {
        if (document.getElementById('chatInput')) {
            tryInitHook();
            return;
        }
        const obs = new MutationObserver((muts, observer) => {
            if (document.getElementById('chatInput') && document.getElementById('chatSendBtn')) {
                tryInitHook();
                observer.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        // Failsafe
        setTimeout(() => obs.disconnect(), 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeChat);
    } else {
        observeChat();
    }

    // Expõe API pública mínima
    window.LuluAI = {
        ask: askLulu,
        clearHistory
    };
})();
