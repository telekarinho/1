/* ============================================================
   MilkyPot — Copilot Transport
   ============================================================
   Decide onde enviar a request do copilot:
     1. http://localhost:5757/copilot  (servidor local do MilkyPot Autopilot.bat — grátis)
     2. /api/copilot                   (Vercel Function → Anthropic API — usa créditos)

   Cada client (Belinha AI / CEO Mentor) chama:
     CopilotTransport.send({ persona, messages, context, model, apiKey })

   Retorna: { reply, usage, source: "local" | "api" }
   ============================================================ */
(function(global){
    'use strict';

    const LOCAL_URL = 'http://localhost:5757';
    let _localAvailable = null;  // null=nunca testou, true=disponivel, false=nao
    let _lastCheck = 0;

    async function probeLocal() {
        // Cache positivo por 60s; negativo por 15s (rápido pra detectar start)
        const now = Date.now();
        if (_localAvailable === true && (now - _lastCheck) < 60000) return true;
        if (_localAvailable === false && (now - _lastCheck) < 15000) return false;

        try {
            const r = await Promise.race([
                fetch(LOCAL_URL + '/health', { method: 'GET', mode: 'cors' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            _localAvailable = r.ok;
            _lastCheck = now;
            return _localAvailable;
        } catch (e) {
            _localAvailable = false;
            _lastCheck = now;
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

    async function send(payload) {
        // Preferência: servidor local. Se não responde, cai na API Anthropic.
        const localOn = await probeLocal();
        if (localOn) {
            try { return await sendLocal(payload); }
            catch (e) { console.warn('[CopilotTransport] local falhou, tentando API:', e.message); }
        }
        return sendApi(payload);
    }

    async function status() {
        const on = await probeLocal();
        return {
            local: on,
            badge: on ? '🟢 servidor local (R$ 0)' : '🔵 API Anthropic',
            url: on ? LOCAL_URL : '/api/copilot'
        };
    }

    global.CopilotTransport = { send, probeLocal, status };
})(typeof window !== 'undefined' ? window : this);
