/* ============================================================
   MilkyPot — Belinha Widget (floating AI helper)
   ============================================================
   Widget flutuante que aparece em TODAS as páginas do painel e admin.
   Click no bolinha 🐑 → abre chat lateral com a Belinha AI.
   Context-aware: sabe em qual página o usuário está e sugere
   ações específicas daquela tela.

   Como integrar em qualquer página:
     <script src="../js/core/belinha-widget.js"></script>

   Funciona só pra usuários logados (franchisee ou super_admin).
   Se super_admin, usa persona ceo_mentor; senão, belinha.
   ============================================================ */
(function(global){
    'use strict';

    if (global._belinhaWidgetLoaded) return;
    global._belinhaWidgetLoaded = true;

    // ==========================================================
    // Context detector — identifica qual página é
    // ==========================================================
    function detectContext() {
        const path = location.pathname;
        const pageMap = {
            'catalogo.html':       { title: 'Catálogo', hint: 'cadastro de sabores, preços, receitas, adicionais' },
            'pdv.html':            { title: 'PDV',      hint: 'vendas do caixa, abertura, sangria, fechamento' },
            'financeiro.html':     { title: 'Financeiro', hint: 'DRE, saúde da franquia, custos fixos/variáveis, metas' },
            'produtos.html':       { title: 'Produtos & Estoque', hint: 'inventário, ingredientes, alertas de estoque baixo' },
            'tv-indoor.html':      { title: 'TV Indoor', hint: 'playlist, heartbeat, wall mode, QR, ticker, emergência' },
            'tv-slides-generator.html': { title: 'Gerador de Slides', hint: 'templates A1-A8, auto-sync PDV, publicar direto' },
            'tv-ugc-curadoria.html': { title: 'UGC Curadoria', hint: 'aprovar fotos de clientes pra TV 3' },
            'tv-auto-stories.html': { title: 'Auto Stories IG', hint: 'config Instagram Graph API + agendamento diário' },
            'challenge-studio.html': { title: 'Studio Desafios', hint: 'disparar Desafio 10s e 300g ao vivo' },
            'pedidos.html':        { title: 'Pedidos', hint: 'status, entrega, histórico' },
            'equipe.html':         { title: 'Equipe', hint: 'cadastro de operadores, turnos, comissão' },
            'simulador.html':      { title: 'Simulador', hint: 'projeção de receita, ponto de equilíbrio' },
            'operacional.html':    { title: 'Operacional', hint: 'metas, KPIs, checklist diário' },
            'fidelidade.html':     { title: 'Fidelidade', hint: 'cartão de pontos, cupons, Clube Belinha' },
            'fiscal.html':         { title: 'Fiscal', hint: 'NFC-e, certificado A1, série, CSC' },
            'ifood.html':          { title: 'iFood', hint: 'integração, pedidos importados, taxa' },
            'radio-indoor.html':   { title: 'Rádio Indoor', hint: 'playlist de música ambiente' },
            'entregas.html':       { title: 'Entregas', hint: 'roteirização, entregadores, tempo médio' },
            'marketing.html':      { title: 'Marketing', hint: 'campanhas, cupons, voucher, desafios' },
            'despesas.html':       { title: 'Despesas', hint: 'lançamentos operacionais' },
            'configuracoes.html':  { title: 'Configurações', hint: 'dados da loja, horário, raio, impressora' },
            'audit.html':          { title: 'Auditoria', hint: 'logs, divergências, super_admin review' },
            'franchises.html':     { title: 'Franquias', hint: 'rede completa, onboarding, território' }
        };
        for (const key in pageMap) {
            if (path.endsWith(key) || path.includes(key)) {
                return { file: key, ...pageMap[key] };
            }
        }
        return { file: path.split('/').pop(), title: 'Sistema', hint: 'navegação geral' };
    }

    // ==========================================================
    // UI (HTML + CSS injetado dinamicamente)
    // ==========================================================
    function injectUI() {
        if (document.getElementById('belinha-widget')) return;

        const style = document.createElement('style');
        style.textContent = `
            #belinha-fab {
                position: fixed; bottom: 20px; right: 20px; z-index: 9998;
                width: 60px; height: 60px; border-radius: 50%;
                background: linear-gradient(135deg, #FF4F8A, #7E57C2);
                box-shadow: 0 8px 24px rgba(255,79,138,.4);
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                font-size: 32px; transition: transform .15s cubic-bezier(0.32, 0.72, 0, 1);
                user-select: none; border: none; color: white;
            }
            #belinha-fab:hover { transform: scale(1.08); }
            #belinha-fab:active { transform: scale(.95); }
            #belinha-fab .pulse {
                position: absolute; inset: 0; border-radius: 50%;
                background: rgba(255,79,138,.4); animation: belinhaPulse 2s infinite;
            }
            @keyframes belinhaPulse {
                0% { transform: scale(1); opacity: .6; }
                100% { transform: scale(1.6); opacity: 0; }
            }
            #belinha-tooltip {
                position: fixed; bottom: 92px; right: 20px; z-index: 9997;
                background: #1F2937; color: #fff; padding: 10px 14px;
                border-radius: 12px; font-size: 13px; max-width: 240px;
                animation: belinhaFade .3s cubic-bezier(0.32, 0.72, 0, 1);
                pointer-events: none;
            }
            @keyframes belinhaFade { from { opacity: 0; transform: translateY(6px); } }

            #belinha-panel {
                position: fixed; bottom: 0; right: 0; width: 420px;
                height: 100vh; max-height: 100vh;
                background: #fff; z-index: 9999;
                box-shadow: -12px 0 40px rgba(0,0,0,.15);
                display: flex; flex-direction: column;
                transform: translateX(100%);
                transition: transform .35s cubic-bezier(0.32, 0.72, 0, 1);
                font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            }
            #belinha-panel.open { transform: translateX(0); }
            #belinha-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 9998;
                opacity: 0; transition: opacity .3s; pointer-events: none;
            }
            #belinha-overlay.open { opacity: 1; pointer-events: auto; }
            @media (max-width: 600px) {
                #belinha-panel { width: 100vw; }
            }

            .bw-header {
                background: linear-gradient(135deg, #FF4F8A, #7E57C2);
                color: #fff; padding: 16px 20px;
                display: flex; align-items: center; gap: 12px;
            }
            .bw-header .avatar { font-size: 32px; }
            .bw-header h3 { margin: 0; font-size: 17px; font-weight: 700; }
            .bw-header small { font-size: 11px; opacity: .85; }
            .bw-header .bw-close { margin-left: auto; background: rgba(255,255,255,.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; }
            .bw-header .bw-close:hover { background: rgba(255,255,255,.35); }

            .bw-context-bar { padding: 10px 16px; background: #FFF0F6; border-bottom: 1px solid #FCE4EC; font-size: 12px; color: #9A3412; display: flex; align-items: center; gap: 6px; }

            .bw-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #FAFAFA; }
            .bw-msg { display: flex; gap: 10px; max-width: 92%; }
            .bw-msg.user { align-self: flex-end; flex-direction: row-reverse; }
            .bw-msg .av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
            .bw-msg.user .av { background: #1F2937; color: #fff; }
            .bw-msg.bot .av { background: #FFE4F0; }
            .bw-msg .bubble { padding: 10px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; color: #1F2937; }
            .bw-msg.user .bubble { background: #1F2937; color: #fff; }
            .bw-msg.bot .bubble { background: #fff; border: 1px solid #E5E7EB; }
            .bw-msg .bubble strong { color: #FF4F8A; }
            .bw-msg.user .bubble strong { color: #FFB1D1; }
            .bw-msg .bubble ul,ol { padding-left: 18px; margin: 4px 0; }
            .bw-msg .bubble code { background: #F3F4F6; padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 12px; }
            .bw-msg.user .bubble code { background: rgba(255,255,255,.15); color: #FFB1D1; }

            .bw-quick { padding: 0 14px 8px; display: flex; gap: 6px; flex-wrap: wrap; }
            .bw-quick button {
                background: #FFF0F6; border: 1px solid #FCE4EC; color: #9A3412;
                padding: 6px 10px; border-radius: 100px; font-size: 12px; cursor: pointer;
                transition: all .15s; font-family: inherit;
            }
            .bw-quick button:hover { background: #FF4F8A; color: #fff; border-color: #FF4F8A; }

            .bw-input-area { padding: 10px 14px 14px; background: #fff; border-top: 1px solid #E5E7EB; }
            .bw-input-row { display: flex; gap: 8px; align-items: flex-end; }
            .bw-input-row textarea { flex: 1; resize: none; padding: 10px 12px; border: 1.5px solid #E5E7EB; border-radius: 12px; font-family: inherit; font-size: 14px; outline: none; max-height: 100px; }
            .bw-input-row textarea:focus { border-color: #FF4F8A; }
            .bw-send { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FF4F8A, #7E57C2); color: #fff; border: none; font-size: 16px; cursor: pointer; flex-shrink: 0; }
            .bw-send:active { transform: scale(.92); }
            .bw-send:disabled { opacity: .5; cursor: not-allowed; }

            .bw-status-pill { font-size: 10px; padding: 2px 8px; border-radius: 100px; margin-left: 6px; font-weight: 700; }
            .bw-status-pill.local { background: #D1FAE5; color: #065F46; }
            .bw-status-pill.api { background: #DBEAFE; color: #1E40AF; }
            .bw-status-pill.off { background: #FEE2E2; color: #991B1B; }

            .bw-thinking { display: inline-flex; gap: 3px; padding: 10px 12px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; }
            .bw-thinking span { width: 6px; height: 6px; background: #888; border-radius: 50%; animation: bwBounce 1.4s infinite; }
            .bw-thinking span:nth-child(2) { animation-delay: .2s; }
            .bw-thinking span:nth-child(3) { animation-delay: .4s; }
            @keyframes bwBounce { 0%,60%,100% { transform: translateY(0);} 30% { transform: translateY(-5px);}}
        `;
        document.head.appendChild(style);

        const fab = document.createElement('button');
        fab.id = 'belinha-fab';
        fab.innerHTML = '<span class="pulse"></span>🐑';
        fab.setAttribute('aria-label', 'Abrir Belinha AI');
        document.body.appendChild(fab);

        // Tooltip na primeira vez
        if (!localStorage.getItem('belinha_tooltip_seen')) {
            const tt = document.createElement('div');
            tt.id = 'belinha-tooltip';
            tt.textContent = '👋 Oi! Eu sou a Belinha, te ajudo aqui nessa tela.';
            document.body.appendChild(tt);
            setTimeout(() => tt.remove(), 6000);
            localStorage.setItem('belinha_tooltip_seen', '1');
        }

        const overlay = document.createElement('div');
        overlay.id = 'belinha-overlay';
        document.body.appendChild(overlay);

        const panel = document.createElement('div');
        panel.id = 'belinha-panel';
        panel.innerHTML = `
            <div class="bw-header">
                <span class="avatar">🐑</span>
                <div>
                    <h3>Belinha AI</h3>
                    <small>copiloto executivo MilkyPot <span id="bwStatus" class="bw-status-pill off">—</span></small>
                </div>
                <button class="bw-close" aria-label="Fechar">✕</button>
            </div>
            <div class="bw-context-bar" id="bwContextBar">📍 —</div>
            <div class="bw-messages" id="bwMessages"></div>
            <div class="bw-quick" id="bwQuick"></div>
            <div class="bw-input-area">
                <div class="bw-input-row">
                    <textarea id="bwInput" placeholder="Pergunta aqui… (Shift+Enter quebra linha)" rows="1"></textarea>
                    <button class="bw-send" id="bwSend" aria-label="Enviar">➤</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        fab.addEventListener('click', open);
        overlay.addEventListener('click', close);
        panel.querySelector('.bw-close').addEventListener('click', close);

        return { fab, panel, overlay };
    }

    function open() {
        document.getElementById('belinha-panel').classList.add('open');
        document.getElementById('belinha-overlay').classList.add('open');
        document.getElementById('bwInput').focus();
    }
    function close() {
        document.getElementById('belinha-panel').classList.remove('open');
        document.getElementById('belinha-overlay').classList.remove('open');
    }

    // ==========================================================
    // Chat logic
    // ==========================================================
    const ctx = detectContext();
    const state = {
        messages: [],
        sending: false,
        persona: 'belinha',
        session: null
    };

    function quickActionsFor(pageFile) {
        // Ações contextuais por tela
        const byPage = {
            'catalogo.html': [
                'Quais sabores tão sem receita?',
                'Sugere 3 combos novos pra testar',
                'Qual minha margem por sabor?'
            ],
            'financeiro.html': [
                'Analise minha saúde financeira hoje',
                'Onde tô perdendo dinheiro?',
                'Qual o meu ponto de equilíbrio?'
            ],
            'produtos.html': [
                'Quais insumos estão críticos?',
                'Gera lista de compras pro mês',
                'Quanto devo de Leite Ninho/mês?'
            ],
            'tv-indoor.html': [
                'Que slide devo colocar agora?',
                'Sugere texto pro ticker hoje',
                'O QR code tá bem configurado?'
            ],
            'tv-slides-generator.html': [
                'Qual template usar agora?',
                'Preenche A3 com dados reais',
                'Sugere copy pra slide A5'
            ],
            'pdv.html': [
                'Como tá o caixa hoje?',
                'Dica pra aumentar ticket',
                'Quem comprou mais vezes esta semana?'
            ],
            'tv-ugc-curadoria.html': [
                'Qual foto priorizar?',
                'Como incentivar mais UGC?',
                'Copy de resposta aos clientes'
            ],
            'tv-auto-stories.html': [
                'Gera copy stories hoje',
                'Melhor horário de post',
                'Estratégia de engajamento'
            ],
            'challenge-studio.html': [
                'Como tá o desafio hoje?',
                'Quem são os ganhadores?',
                'Sugere premiação nova'
            ]
        };
        return byPage[pageFile] || [
            'Briefing do dia',
            'O que fazer agora?',
            'Alertas críticos'
        ];
    }

    function renderQuick() {
        const qEl = document.getElementById('bwQuick');
        if (!qEl) return;
        const actions = quickActionsFor(ctx.file);
        qEl.innerHTML = actions.map(a => `<button data-q="${a.replace(/"/g,'&quot;')}">${a}</button>`).join('');
        qEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('bwInput').value = btn.dataset.q;
                send();
            });
        });
    }

    function renderMessages() {
        const el = document.getElementById('bwMessages');
        if (!el) return;
        el.innerHTML = state.messages.map(m => {
            const av = m.role === 'user' ? '👤' : '🐑';
            return `<div class="bw-msg ${m.role}">
                <div class="av">${av}</div>
                <div class="bubble">${formatMd(m.content)}</div>
            </div>`;
        }).join('');
        el.scrollTop = el.scrollHeight;
    }

    function formatMd(t) {
        t = String(t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        t = t.replace(/```(?:\w+)?\n([\s\S]*?)```/g, '<pre>$1</pre>');
        t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*<\/li>\n?)+/g, m => '<ul>'+m+'</ul>');
        t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        t = t.replace(/\n/g, '<br>');
        return t;
    }

    function updateStatusPill() {
        const el = document.getElementById('bwStatus');
        if (!el || !global.CopilotTransport) return;
        global.CopilotTransport.status().then(s => {
            if (s.local) { el.className = 'bw-status-pill local'; el.textContent = '🟢 local'; }
            else {
                const settings = global.DataStore && DataStore.get('belinha_settings') || {};
                if (settings.apiKey) { el.className = 'bw-status-pill api'; el.textContent = '🔵 API'; }
                else { el.className = 'bw-status-pill off'; el.textContent = '— sem IA'; }
            }
        });
    }

    function getSettings() { return (global.DataStore && DataStore.get('belinha_settings')) || {}; }

    function buildContext() {
        const session = global.Auth && Auth.getSession && Auth.getSession();
        const out = {
            page: ctx.file,
            pageTitle: ctx.title,
            pageHint: ctx.hint,
            role: session && session.role,
            franchiseId: session && session.franchiseId,
            franchiseName: session && session.franchiseName
        };
        // Se o scanner existe, adiciona resumo do estado
        try {
            if (global.LiloScanner && session && session.franchiseId) {
                out.scan = global.LiloScanner.scanFranchise(session.franchiseId);
            }
        } catch(e){}
        return out;
    }

    async function send() {
        const input = document.getElementById('bwInput');
        const text = input.value.trim();
        if (!text || state.sending) return;

        state.messages.push({ role: 'user', content: text });
        input.value = '';
        renderMessages();

        state.sending = true;
        document.getElementById('bwSend').disabled = true;

        // Thinking indicator
        const el = document.getElementById('bwMessages');
        const thinking = document.createElement('div');
        thinking.className = 'bw-msg bot';
        thinking.innerHTML = '<div class="av">🐑</div><div class="bw-thinking"><span></span><span></span><span></span></div>';
        el.appendChild(thinking);
        el.scrollTop = el.scrollHeight;

        try {
            const session = global.Auth && Auth.getSession && Auth.getSession();
            const persona = session && session.role === 'super_admin' ? 'ceo_mentor' : 'belinha';

            const settings = getSettings();
            if (!global.CopilotTransport) throw new Error('CopilotTransport não carregado nesta página');

            const data = await global.CopilotTransport.send({
                apiKey: settings.apiKey,
                model: settings.model || 'claude-sonnet-4-5',
                persona: persona,
                messages: state.messages,
                context: buildContext()
            });

            thinking.remove();
            state.messages.push({ role: 'assistant', content: data.reply || '(sem resposta)' });
            renderMessages();
            updateStatusPill();
        } catch (e) {
            thinking.remove();
            state.messages.push({
                role: 'assistant',
                content: '❌ ' + e.message + (e.message.includes('api_key') ? '\n\nConfigura em `copilot-belinha.html` → ⚙️ Configurar' : '')
            });
            renderMessages();
        }

        state.sending = false;
        document.getElementById('bwSend').disabled = false;
    }

    // ==========================================================
    // Init
    // ==========================================================
    function init() {
        // Só carrega se tem sessão (não em páginas públicas)
        const session = global.Auth && Auth.getSession && Auth.getSession();
        if (!session) return;

        injectUI();
        document.getElementById('bwContextBar').innerHTML =
            '📍 Estou na tela <b>' + ctx.title + '</b> com você — posso ajudar com: <i>' + ctx.hint + '</i>';

        const initialMsg = session.role === 'super_admin'
            ? 'Oi! Sou o **CEO Mentor MilkyPot**. Enquanto você navega pelo super_admin, posso analisar dados consolidados da rede, sugerir estratégia, comparar franquias. Clica numa pergunta abaixo ou fala livre.'
            : 'Oi! Sou a **Belinha** 🐑 — tô aqui nessa tela com você. Pergunta o que tá precisando ou clica numa das sugestões abaixo.';
        state.messages.push({ role: 'assistant', content: initialMsg });
        renderMessages();
        renderQuick();
        updateStatusPill();

        const inp = document.getElementById('bwInput');
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        });
        inp.addEventListener('input', () => {
            inp.style.height = 'auto';
            inp.style.height = Math.min(inp.scrollHeight, 100) + 'px';
        });
        document.getElementById('bwSend').addEventListener('click', send);

        // Shortcut Ctrl+Shift+B abre a Belinha
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
                e.preventDefault();
                open();
            }
        });
    }

    // Init quando DOM pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Espera Auth/DataStore inicializarem
            setTimeout(init, 300);
        });
    } else {
        setTimeout(init, 300);
    }
})(typeof window !== 'undefined' ? window : this);
