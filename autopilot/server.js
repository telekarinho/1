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
const fs = require('fs');
const os = require('os');
const path = require('path');

const { pickSystem } = require('./_brain-local.js');

const app = express();
app.use(express.json({ limit: '2mb' }));

const CODEX_BIN = 'C:\\Users\\rodri\\AppData\\Local\\Packages\\OpenAI.Codex_2p2nqsd0c76g0\\LocalCache\\Local\\OpenAI\\Codex\\bin\\codex.exe';

// ====================================================================
// STATIC FILES (elimina Mixed Content HTTPS->HTTP do Chrome)
// ====================================================================
// Serve o painel direto pelo servidor local, entao o user abre
//   http://localhost:5757/painel/copilot-belinha.html
// e tudo e HTTP-HTTP, sem bloqueio do Chrome.
const MP_ROOT = path.join(__dirname, '..');
app.use(express.static(MP_ROOT, { index: false, extensions: ['html'] }));

// Raiz redireciona direto pra Belinha
app.get('/', (req, res) => res.redirect('/painel/copilot-belinha.html'));

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
        primaryBackend: fs.existsSync(CODEX_BIN) ? 'codex' : 'claude',
        fallbackBackend: fs.existsSync(CODEX_BIN) ? 'claude' : null
    });
});

function collectProcess(proc) {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
        proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
        proc.on('close', exitCode => resolve({ exitCode, stdout, stderr }));
        proc.on('error', reject);
    });
}

async function runClaude(combined, model) {
    const cliArgs = ['-p', '--output-format', 'json'];
    const VALID_ALIASES = ['sonnet', 'opus', 'haiku'];
    if (model && (VALID_ALIASES.includes(model) || /\d{8}$/.test(model))) {
        cliArgs.push('--model', model);
    }

    // Garante HOME + CLAUDE_CODE_OAUTH_TOKEN no env.
    // Em cmd.exe / bat, HOME e o token OAuth podem estar ausentes.
    // Estratégia: (1) env herdado, (2) arquivo bridge escrito pela sessão
    // ativa do Claude Code, (3) .credentials.json como último recurso.
    let sessionToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';
    if (!sessionToken) {
        try {
            const bridgeFile = path.join(os.homedir(), '.claude', '.milkypot-token');
            if (fs.existsSync(bridgeFile)) {
                sessionToken = fs.readFileSync(bridgeFile, 'utf8').trim();
            }
        } catch (e) {}
    }
    if (!sessionToken) {
        try {
            const credFile = path.join(os.homedir(), '.claude', '.credentials.json');
            const creds = JSON.parse(fs.readFileSync(credFile, 'utf8'));
            sessionToken = (creds.claudeAiOauth && creds.claudeAiOauth.accessToken) || '';
        } catch (e) {}
    }
    const claudeEnv = {
        ...process.env,
        HOME: process.env.HOME || process.env.USERPROFILE || os.homedir(),
        ...(sessionToken ? { CLAUDE_CODE_OAUTH_TOKEN: sessionToken } : {})
    };
    const claudeProc = spawn('claude', cliArgs, { shell: true, env: claudeEnv });
    claudeProc.stdin.write(combined, 'utf8');
    claudeProc.stdin.end();

    const { exitCode, stdout, stderr } = await collectProcess(claudeProc);
    if (exitCode !== 0) {
        console.error('[runClaude] exit', exitCode, '| stderr:', stderr.slice(0, 300), '| stdout:', stdout.slice(0, 200));
        throw new Error(stderr || stdout || ('claude_exit_' + exitCode));
    }

    let reply = '';
    let usage = null;
    try {
        const parsed = JSON.parse(stdout);
        reply = parsed.result || parsed.content || '';
        usage = parsed.usage || null;
    } catch (e) {
        reply = stdout.trim();
    }

    return { reply, usage, backend: 'claude' };
}

async function runCodex(combined) {
    if (!fs.existsSync(CODEX_BIN)) throw new Error('codex_missing');

    const outFile = path.join(os.tmpdir(), 'milkypot-codex-last-message.txt');
    try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}

    // Use shell:true + quoted path to bypass WindowsApps ACL restriction.
    // cmd.exe can invoke WindowsApps binaries even when Node spawn can't.
    const quotedBin = '"' + CODEX_BIN + '"';
    const quotedOut = '"' + outFile + '"';
    const quotedDir = '"' + path.join(__dirname, '..') + '"';
    const cmdLine = [
        quotedBin,
        'exec',
        '--skip-git-repo-check',
        '--dangerously-bypass-approvals-and-sandbox',
        '--output-last-message', quotedOut,
        '-C', quotedDir,
        '-'
    ].join(' ');

    const codexProc = spawn(cmdLine, [], { shell: true });
    codexProc.stdin.write(combined, 'utf8');
    codexProc.stdin.end();

    const { exitCode, stdout, stderr } = await collectProcess(codexProc);

    // Check output file first — may exist even on non-zero exit (warnings-only)
    const reply = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8').trim() : '';
    if (reply) return { reply, usage: null, backend: 'codex' };

    if (exitCode !== 0) {
        // Truncate stderr — Codex emits huge HTML pages on some errors
        const errMsg = (stderr || stdout || ('codex_exit_' + exitCode)).slice(0, 400);
        throw new Error(errMsg);
    }
    throw new Error('codex_empty_reply');
}

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

        const primaryStartTs = Date.now();
        let result;
        try {
            // Primário: Codex local (OpenAI plano do usuário — R$ 0)
            result = await runCodex(combined);
        } catch (codexErr) {
            console.warn('[copilot] codex falhou, tentando claude backup:', codexErr.message.slice(0, 120));
            // Backup: Claude CLI (plano Claude Pro/Max — R$ 0)
            result = await runClaude(combined, model);
        }

        const primaryElapsedMs = Date.now() - primaryStartTs;
        console.log(`[copilot] ${(persona || 'belinha')} · ${result.backend} · ${primaryElapsedMs}ms · ${result.reply.length} chars`);

        return res.json({
            reply: result.reply,
            usage: result.usage,
            model: model || (result.backend === 'claude' ? 'claude-default' : 'codex-default'),
            elapsedMs: primaryElapsedMs,
            source: 'local',
            backend: result.backend
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

// ========================================================
// CLOUDFLARE TUNNEL (expoe servidor local via HTTPS publica)
// ========================================================
// Sem tunnel, milkypot.com (HTTPS) nao consegue chamar localhost:5757 (HTTP)
// por Mixed Content. Com tunnel, a URL publica HTTPS resolve pro local.
// Registramos a URL no Firestore (via Vercel Function) pra que o painel
// leia automaticamente. Zero config no browser.
// ========================================================
let TUNNEL_URL = null;
const VERCEL_REGISTRY = 'https://milkypot.vercel.app/api/belinha-tunnel';

function startTunnel(port) {
    console.log('');
    console.log('🌐 Iniciando tunnel publico (cloudflared)...');
    const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], { shell: true });

    const tryRegister = async (url) => {
        try {
            const resp = await fetch(VERCEL_REGISTRY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (resp.ok) {
                console.log('✅ Tunnel registrado no Firestore — painel milkypot.com ja funciona!');
            } else {
                const txt = await resp.text();
                console.warn('⚠️ Falha ao registrar tunnel:', resp.status, txt);
            }
        } catch (e) {
            console.warn('⚠️ Falha ao registrar tunnel:', e.message);
        }
    };

    const onData = (chunk) => {
        const txt = chunk.toString();
        const match = txt.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (match && !TUNNEL_URL) {
            TUNNEL_URL = match[0];
            console.log('');
            console.log('✨ URL publica HTTPS:', TUNNEL_URL);
            console.log('   Health via tunnel: ' + TUNNEL_URL + '/health');
            tryRegister(TUNNEL_URL);
        }
    };
    tunnel.stdout.on('data', onData);
    tunnel.stderr.on('data', onData);
    tunnel.on('error', (e) => console.warn('⚠️ Tunnel erro:', e.message));
    tunnel.on('close', (code) => {
        console.warn('⚠️ Tunnel encerrou (exit ' + code + '). Belinha em milkypot.com nao funcionara ate reiniciar o .bat.');
        TUNNEL_URL = null;
    });

    // Expoe endpoint local pra consulta
    app.get('/tunnel-url', (req, res) => res.json({ url: TUNNEL_URL }));
}

// ========== INIT ==========
const PORT = process.env.MILKYPOT_PORT || 5757;
const server = app.listen(PORT, () => {
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
    console.log('   🐑 BELINHA LOCAL: http://localhost:' + PORT + '/painel/copilot-belinha.html');
    console.log('   🐑 BELINHA ONLINE: https://milkypot.com/painel/copilot-belinha.html');
    console.log('   (ambas usam este servidor local — R$ 0,00)');
    console.log('');
    console.log('   Ctrl+C pra parar.');
    console.log('═══════════════════════════════════════════════');

    // Inicia tunnel em paralelo para expor o servidor na internet (HTTPS)
    startTunnel(PORT);
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error('');
        console.error('⚠️ A porta 5757 já está em uso.');
        console.error('Se for outra janela da Belinha, reutilize a instância já aberta em http://localhost:5757/painel/copilot-belinha.html');
        console.error('');
        process.exit(1);
    }
    console.error('[server] erro ao iniciar', err);
    process.exit(1);
});
