/**
 * MilkyPot Autopilot — Servidor Local
 *
 * Roda em http://localhost:5757 enquanto a janela do .bat está aberta.
 * O painel web (milkypot.com) chama este endpoint em vez da API
 * Anthropic direta — economiza custo porque usa o `claude` CLI com
 * seu plano Claude Pro/Max/Team autenticado localmente.
 *
 * Endpoints:
 *   GET  /health                → { ok: true, version }
 *   POST /copilot               → { reply, usage }
 *                                  body: { messages, context, persona, model? }
 *
 * Requisitos:
 *   - Node.js 18+
 *   - `claude` CLI instalado e autenticado (claude login)
 *
 * Fluxo:
 *   1. Recebe request do painel com messages + context + persona
 *   2. Escolhe system prompt (Belinha ou CEO Mentor) de _brain-local.js
 *   3. Injeta <context> JSON na última user message
 *   4. Spawn do `claude -p "..." --append-system-prompt "..." --output-format json`
 *   5. Parse da resposta JSON do CLI e devolve pro painel
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const { pickSystem } = require('./_brain-local.js');

const app = express();
app.use(express.json({ limit: '2mb' }));

// ========== STATIC FILES (evita Mixed Content) ==========
// Serve o painel inteiro via HTTP para que quando o user acesse
// http://localhost:5757/painel/... nao haja bloqueio Mixed Content
// (HTTPS->HTTP). Usuario NAO precisa mexer em config do Chrome.
const MP_ROOT = path.join(__dirname, '..');
app.use(express.static(MP_ROOT, {
    index: false,
    extensions: ['html'],
    maxAge: 0
}));

// Rota raiz: redireciona pro painel Belinha direto
app.get('/', (req, res) => {
    res.redirect('/painel/copilot-belinha.html');
});

// CORS: aceita requests do painel web milkypot.com e localhost dev
app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowed = ['https://milkypot.com', 'https://www.milkypot.com', 'http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];
    if (allowed.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Requests de ferramenta tipo curl (sem Origin)
    } else {
        res.header('Access-Control-Allow-Origin', 'https://milkypot.com');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// ========== HEALTH ==========
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'MilkyPot Autopilot',
        version: '1.0.0',
        uptime: Math.round(process.uptime()) + 's',
        cliBackend: 'claude' // pode virar 'claude-code' ou 'anthropic-sdk'
    });
});

// ========== COPILOT ==========
app.post('/copilot', async (req, res) => {
    try {
        const { messages, context, persona, model } = req.body || {};
        if (!Array.isArray(messages) || !messages.length) {
            return res.status(400).json({ error: 'messages_empty' });
        }

        const systemPrompt = pickSystem(persona);

        // Pega a última user message, injeta <context>
        const lastUserIdx = [...messages].map((m, i) => [m.role, i]).reverse().find(([r]) => r === 'user')?.[1];
        let finalPrompt = '';
        messages.forEach((m, i) => {
            if (i === lastUserIdx && m.role === 'user' && context) {
                finalPrompt += `\n\nUSER: <context>\n${JSON.stringify(context, null, 2)}\n</context>\n\n${m.content}`;
            } else {
                finalPrompt += `\n\n${m.role.toUpperCase()}: ${m.content}`;
            }
        });
        finalPrompt = finalPrompt.trim();

        // FIX: Windows cmd.exe tem limite de 8191 chars na linha.
        // System prompt MilkyPot tem ~12KB. Solução: embutir o system
        // prompt no próprio user message com tags <system> e mandar
        // TUDO via stdin. Args ficam mínimos (~50 chars).
        const combined = `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n${finalPrompt}`;

        const cliArgs = ['-p', '--output-format', 'json'];
        if (model) cliArgs.push('--model', model);

        const startTs = Date.now();
        const claudeProc = spawn('claude', cliArgs, { shell: true });

        // Envia prompt completo via stdin — sem limite de tamanho
        claudeProc.stdin.write(combined, 'utf8');
        claudeProc.stdin.end();

        let output = '';
        let errorBuf = '';
        claudeProc.stdout.on('data', chunk => { output += chunk.toString(); });
        claudeProc.stderr.on('data', chunk => { errorBuf += chunk.toString(); });

        const exitCode = await new Promise((resolve, reject) => {
            claudeProc.on('close', resolve);
            claudeProc.on('error', reject);
        });

        if (exitCode !== 0) {
            console.error('[claude cli] exit', exitCode, errorBuf);
            return res.status(500).json({
                error: 'cli_failed',
                exit: exitCode,
                stderr: errorBuf.slice(0, 800)
            });
        }

        // O CLI retorna { result, session_id, total_cost_usd, usage, ... } em JSON
        let reply = '';
        let usage = null;
        try {
            const parsed = JSON.parse(output);
            reply = parsed.result || parsed.content || '';
            usage = parsed.usage || null;
        } catch (e) {
            // Se o output não for JSON (modo stream ou formato antigo), trata como texto puro
            reply = output.trim();
        }

        const elapsedMs = Date.now() - startTs;
        console.log(`[copilot] ${(persona || 'belinha')} · ${elapsedMs}ms · ${reply.length} chars`);

        return res.json({
            reply: reply,
            usage: usage,
            model: model || 'claude-default',
            elapsedMs: elapsedMs,
            source: 'local'
        });

    } catch (e) {
        console.error('[copilot] erro', e);
        return res.status(500).json({ error: 'internal', message: e.message });
    }
});

// ========== BRIEFING PROATIVO (opcional) ==========
app.post('/briefing', async (req, res) => {
    try {
        const { context, persona = 'belinha' } = req.body || {};
        const msg = `🌅 (briefing automático do dia — analise o estado e me dê: TL;DR em 1 linha, top 3 alertas, 1 oportunidade do dia, 1 número que importa)`;
        req.body.messages = [{ role: 'user', content: msg }];
        req.body.persona = persona;
        req.body.context = context;
        // delega pro handler de /copilot
        return app._router.handle(Object.assign(req, { url: '/copilot', method: 'POST' }), res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ========== INIT ==========
const PORT = process.env.MILKYPOT_PORT || 5757;
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════');
    console.log(' 🐑 MilkyPot Autopilot — Servidor Local v1.0.0');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log(`   Rodando em: http://localhost:${PORT}`);
    console.log('   Health check: http://localhost:' + PORT + '/health');
    console.log('');
    console.log('   ⚙️  Backend: claude CLI (seu plano Claude Pro/Max)');
    console.log('   💰 Custo: R$ 0,00 — usa sua conta autenticada');
    console.log('');
    console.log('   👉 PAINEL LOCAL (sem Mixed Content):');
    console.log('   http://localhost:' + PORT + '/painel/copilot-belinha.html');
    console.log('');
    console.log('   Belinha conecta sem precisar mexer no Chrome.');
    console.log('');
    console.log('   Ctrl+C pra parar.');
    console.log('═══════════════════════════════════════════════');
});
