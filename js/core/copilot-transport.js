/* ============================================================
   MilkyPot — Copilot Transport
   ============================================================
   Decide onde enviar a request do copilot, nesta ordem:
     1. http://localhost:5757/copilot    (servidor local .bat — R$ 0)
     2. /api/copilot                     (Vercel Function → Anthropic API)
     3. Fallback OFFLINE local           (usa BelinhaScanners + knowledge
                                          pra responder sem rede/AI)

   Problema comum: milkypot.com (HTTPS) tentando chamar localhost (HTTP)
   é bloqueado pelo Chrome como MIXED CONTENT. Detectamos isso e:
     - Mostramos mensagem explicativa com instrução Chrome settings
     - Funcionamos em modo offline (resposta com os scanners)
   ============================================================ */
(function(global){
    'use strict';

    const LOCAL_URL = 'http://localhost:5757';

    // URL base da API. Se o site estiver em milkypot.com (GitHub Pages, sem API),
    // aponta direto pra Vercel. Se ja estiver em vercel.app ou localhost, usa rota
    // relativa. Isso evita migrar DNS e funciona de qualquer hospedagem.
    function apiBase() {
        try {
            const host = location.hostname;
            // milkypot.com/www.milkypot.com estao no GitHub Pages — precisam apontar
            // pra Vercel pra ter acesso as Serverless Functions
            if (host === 'milkypot.com' || host === 'www.milkypot.com') {
                return 'https://milkypot.vercel.app';
            }
        } catch(e){}
        return ''; // mesmo origin
    }

    let _localAvailable = null;
    let _mixedBlocked = false;   // true quando Chrome bloqueou mixed content
    let _lastCheck = 0;

    function isHttpsPage() {
        return typeof location !== 'undefined' && location.protocol === 'https:';
    }

    async function probeLocal() {
        const now = Date.now();
        if (_localAvailable === true && (now - _lastCheck) < 60000) return true;
        if (_localAvailable === false && (now - _lastCheck) < 15000) return false;

        // Mixed content: HTTPS não pode chamar HTTP localhost
        // Fazemos o fetch mesmo assim — se bloqueado, catch detecta
        try {
            const r = await Promise.race([
                fetch(LOCAL_URL + '/health', { method: 'GET', mode: 'cors' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
            ]);
            _localAvailable = r.ok;
            _lastCheck = now;
            _mixedBlocked = false;
            return _localAvailable;
        } catch (e) {
            _localAvailable = false;
            _lastCheck = now;
            // Detecta mixed content (Chrome lança TypeError ao bloquear)
            if (isHttpsPage() && (e.message.includes('Failed to fetch') || e.name === 'TypeError')) {
                _mixedBlocked = true;
            }
            return false;
        }
    }

    async function sendLocal(payload) {
        const r = await fetch(LOCAL_URL + '/copilot', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                persona: payload.persona,
                messages: payload.messages,
                context: payload.context,
                model: payload.model
            })
        });
        if (!r.ok) throw new Error('local ' + r.status);
        const data = await r.json();
        return { reply: data.reply, usage: data.usage || { input_tokens: 0, output_tokens: 0 }, source: 'local' };
    }

    async function sendApi(payload) {
        // Nao exige apiKey — se vazia, Vercel Function usa ANTHROPIC_API_KEY env var.
        // Belinha funciona de qualquer PC sem configuracao do usuario.
        // apiBase() aponta pra Vercel quando estamos em milkypot.com (GitHub Pages).
        const r = await fetch(apiBase() + '/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: payload.apiKey || '',
                model: payload.model || 'claude-sonnet-4-5',
                persona: payload.persona,
                messages: payload.messages,
                context: payload.context
            })
        });
        if (!r.ok) {
            const err = await r.text();
            throw new Error(err || ('api ' + r.status));
        }
        const data = await r.json();
        return { reply: data.reply, usage: data.usage || null, source: 'api' };
    }

    /**
     * Fallback offline: usa BelinhaScanners + last user message
     * pra gerar resposta contextual sem precisar de AI remota.
     */
    function sendOffline(payload) {
        const lastUser = payload.messages.filter(m => m.role === 'user').pop();
        const q = (lastUser && lastUser.content || '').toLowerCase();
        const ctx = payload.context || {};
        let reply = '';

        // Tenta responder usando o scanner da página
        let scan = null;
        try {
            if (global.BelinhaScanners && global.BelinhaScanners.scanCurrent) {
                const session = global.Auth && global.Auth.getSession && global.Auth.getSession();
                if (session) scan = global.BelinhaScanners.scanCurrent(session);
            }
        } catch(e){}

        // Mixed content: mostrar instrução clara
        if (_mixedBlocked) {
            reply = `🔒 **Conexão local bloqueada pelo Chrome (Mixed Content).**\n\n` +
                `Seu servidor local tá rodando em \`http://localhost:5757\`, mas o painel é \`https://milkypot.com\` (HTTPS). Chrome não deixa HTTPS chamar HTTP.\n\n` +
                `**Solução em 3 passos:**\n\n` +
                `1. No Chrome, clica no **🔒 cadeado** à esquerda da URL (milkypot.com)\n` +
                `2. Vai em **"Configurações do site"**\n` +
                `3. Em **"Conteúdo inseguro"**, escolhe **"Permitir"**\n` +
                `4. Recarrega a página (F5)\n\n` +
                `Ou cola no browser: \`chrome://settings/content/siteDetails?site=https%3A%2F%2Fmilkypot.com\`\n\n` +
                `_Depois disso, eu volto a falar com o servidor local e zero custo de API._`;
        }
        // Responde perguntas comuns com base em scanner
        else if (scan && scan.alerts && scan.alerts.length && (q.includes('fazer') || q.includes('alert') || q.includes('critic'))) {
            const levelEmoji = { critical:'🚨', high:'⚠️', medium:'💡', low:'👋' };
            reply = `🐑 **Modo offline — respondendo com minha análise da tela:**\n\n` +
                scan.alerts.slice(0, 5).map((a, i) =>
                    `${levelEmoji[a.level]||'•'} **${i+1}. ${a.title}**\n${a.detail}\n➜ *${a.action}*`
                ).join('\n\n') +
                `\n\n_Pra respostas mais profundas (em linguagem natural), liga o \`Belinha-Iniciar.bat\` que tá na pasta do sistema._`;
        }
        else if (q.includes('briefing') || q.includes('bom dia') || q.includes('tudo bem')) {
            reply = `🐑 **Oi! Aqui é a Belinha em modo offline.**\n\n` +
                `Você tá na tela: **${ctx.page || 'desconhecida'}**.\n\n` +
                (scan && scan.alerts && scan.alerts.length
                    ? `Detectei **${scan.alerts.length} ponto(s)** que merecem atenção — me pergunta "o que fazer agora?" que eu listo.`
                    : `Tudo parece em ordem por aqui. Navega pelas telas ou me pergunta algo específico.`) +
                `\n\n💡 Pra eu responder em linguagem natural com profundidade, abre o \`Belinha-Iniciar.bat\`.`;
        }
        else {
            reply = `🐑 **Modo offline ativo.**\n\n` +
                `Pra eu responder perguntas em linguagem natural, preciso do servidor Claude CLI local rodando.\n\n` +
                `**Pra ligar:**\n` +
                `1. Abre \`D:\\EDITADOS\\milkypot\\Belinha-Iniciar.bat\`\n` +
                `2. Espera aparecer "SERVIDOR RODANDO"\n` +
                `3. Volta aqui e recarrega a página (F5)\n\n` +
                (scan && scan.alerts && scan.alerts.length
                    ? `Enquanto isso, posso te mostrar **${scan.alerts.length} alertas** que detectei nesta tela — clica em "Alertas críticos" abaixo.`
                    : `Ou clica numa das sugestões abaixo.`);
        }

        return Promise.resolve({
            reply,
            usage: { input_tokens: 0, output_tokens: 0 },
            source: 'offline'
        });
    }

    async function send(payload) {
        // Ordem: servidor local (se rodando) -> API Vercel (env var) -> offline.
        // Usuario NAO precisa configurar nada — apenas Vercel tem que ter
        // ANTHROPIC_API_KEY configurada como env var.
        const localOn = await probeLocal();
        if (localOn) {
            try { return await sendLocal(payload); }
            catch (e) { console.warn('[CopilotTransport] local falhou:', e.message); }
        }

        // API sempre tentada (Vercel Function usa env var se apiKey vazia)
        try { return await sendApi(payload); }
        catch (e) {
            console.warn('[CopilotTransport] API falhou:', e.message);
            return sendOffline(payload);
        }
    }

    async function status() {
        const on = await probeLocal();
        return {
            local: on,
            mixedBlocked: _mixedBlocked,
            badge: on ? '🟢 servidor local (R$ 0)' : (_mixedBlocked ? '🔒 bloqueado (Chrome)' : '⚪ offline'),
            url: on ? LOCAL_URL : '/api/copilot'
        };
    }

    global.CopilotTransport = { send, probeLocal, status };
})(typeof window !== 'undefined' ? window : this);
