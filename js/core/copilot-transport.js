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
    const REMOTE_TUNNEL_KEY = 'belinha_tunnel_global';
    let _localAvailable = null;
    let _remoteAvailable = null;
    let _remoteUrl = null;
    let _mixedBlocked = false;   // true quando Chrome bloqueou mixed content
    let _lastCheck = 0;
    let _lastRemoteCheck = 0;

    function isHttpsPage() {
        return typeof location !== 'undefined' && location.protocol === 'https:';
    }

    function normalizeBaseUrl(url) {
        return String(url || '').trim().replace(/\/+$/, '');
    }

    function readRemoteTunnelFromStore() {
        try {
            const raw = global.DataStore && typeof global.DataStore.get === 'function'
                ? global.DataStore.get(REMOTE_TUNNEL_KEY)
                : null;
            if (!raw) return '';
            if (typeof raw === 'string') return normalizeBaseUrl(raw);
            if (raw && typeof raw.url === 'string') return normalizeBaseUrl(raw.url);
        } catch (e) {}
        return '';
    }

    async function fetchRemoteTunnelFromFirestore() {
        try {
            if (!global.firebase || typeof global.firebase.firestore !== 'function') return '';
            const snap = await global.firebase.firestore().collection('datastore').doc(REMOTE_TUNNEL_KEY).get();
            if (!snap.exists) return '';
            const payload = snap.data() || {};
            const parsed = payload.value ? JSON.parse(payload.value) : payload;
            const url = typeof parsed === 'string' ? parsed : parsed && parsed.url;
            const normalized = normalizeBaseUrl(url);
            if (normalized && global.DataStore && typeof global.DataStore.set === 'function') {
                global.DataStore.set(REMOTE_TUNNEL_KEY, { url: normalized, syncedAt: new Date().toISOString() });
            }
            return normalized;
        } catch (e) {
            return '';
        }
    }

    async function getRemoteTunnelUrl(forceRefresh) {
        if (!forceRefresh) {
            const stored = readRemoteTunnelFromStore();
            if (stored) {
                _remoteUrl = stored;
                return stored;
            }
        }
        const fromCloud = await fetchRemoteTunnelFromFirestore();
        if (fromCloud) {
            _remoteUrl = fromCloud;
            return fromCloud;
        }
        return _remoteUrl || '';
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

    async function probeRemote(forceRefresh) {
        const now = Date.now();
        if (!forceRefresh && _remoteAvailable === true && (now - _lastRemoteCheck) < 60000) return true;
        if (!forceRefresh && _remoteAvailable === false && (now - _lastRemoteCheck) < 15000) return false;

        const baseUrl = await getRemoteTunnelUrl(forceRefresh);
        if (!baseUrl) {
            _remoteAvailable = false;
            _lastRemoteCheck = now;
            return false;
        }

        try {
            const r = await Promise.race([
                fetch(baseUrl + '/health', { method: 'GET', mode: 'cors', cache: 'no-store' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
            ]);
            _remoteAvailable = !!(r && r.ok);
            _lastRemoteCheck = now;
            return _remoteAvailable;
        } catch (e) {
            _remoteAvailable = false;
            _lastRemoteCheck = now;
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

    async function sendRemote(payload) {
        const baseUrl = await getRemoteTunnelUrl(false);
        if (!baseUrl) throw new Error('remote_tunnel_missing');
        const r = await fetch(baseUrl + '/copilot', {
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
        if (!r.ok) throw new Error('remote ' + r.status);
        const data = await r.json();
        return { reply: data.reply, usage: data.usage || { input_tokens: 0, output_tokens: 0 }, source: 'remote' };
    }

    async function sendApi(payload) {
        if (!payload.apiKey) throw new Error('api_key_missing');
        const r = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: payload.apiKey,
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
        // Preferência: servidor local. Se não responde, cai na API. Se não, offline.
        const localOn = await probeLocal();
        if (localOn) {
            try { return await sendLocal(payload); }
            catch (e) { console.warn('[CopilotTransport] local falhou:', e.message); }
        }

        const remoteOn = await probeRemote(false);
        if (remoteOn) {
            try { return await sendRemote(payload); }
            catch (e) { console.warn('[CopilotTransport] tunnel remoto falhou:', e.message); }
        }

        // Só tenta API se tiver apiKey configurada
        if (payload.apiKey) {
            try { return await sendApi(payload); }
            catch (e) {
                console.warn('[CopilotTransport] API falhou:', e.message);
                if (e.message === 'api_key_missing') {
                    return sendOffline(payload);
                }
                throw e;
            }
        }

        // Sem apiKey e sem local → modo offline (respostas canned)
        return sendOffline(payload);
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

    async function sendWithTunnel(payload) {
        const localOn = await probeLocal();
        if (localOn) {
            try { return await sendLocal(payload); }
            catch (e) { console.warn('[CopilotTransport] local falhou:', e.message); }
        }

        const remoteOn = await probeRemote(false);
        if (remoteOn) {
            try { return await sendRemote(payload); }
            catch (e) { console.warn('[CopilotTransport] tunnel remoto falhou:', e.message); }
        }

        if (payload.apiKey) {
            try { return await sendApi(payload); }
            catch (e) {
                console.warn('[CopilotTransport] API falhou:', e.message);
                if (e.message === 'api_key_missing') return sendOffline(payload);
                throw e;
            }
        }

        return sendOffline(payload);
    }

    async function statusWithTunnel() {
        const localOn = await probeLocal();
        const remoteOn = localOn ? false : await probeRemote(false);
        const remoteUrl = remoteOn ? await getRemoteTunnelUrl(false) : '';
        return {
            local: localOn,
            remote: remoteOn,
            remoteUrl: remoteUrl || '',
            mixedBlocked: _mixedBlocked,
            badge: localOn
                ? 'ðŸŸ¢ servidor local (R$ 0)'
                : (remoteOn
                    ? '🟢 servidor remoto via tunnel (R$ 0,00)'
                    : (_mixedBlocked ? 'ðŸ”’ bloqueado (Chrome)' : 'âšª offline')),
            url: localOn ? LOCAL_URL : (remoteOn ? remoteUrl : '/api/copilot')
        };
    }

    global.CopilotTransport = { send: sendWithTunnel, probeLocal, probeRemote, status: statusWithTunnel, getRemoteTunnelUrl };
})(typeof window !== 'undefined' ? window : this);
