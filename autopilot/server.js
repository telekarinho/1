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
const Memory = require('./_belinha-memory.js');
const Backends = require('./_backends.js');

// ====================================================================
// LOG BUFFER (intercepta console.log/warn/error pra /logs/viewer)
// ====================================================================
// Buffer circular em memória das últimas LOG_MAX entradas. Cada entrada:
// { id, ts, level, msg }. O painel /logs/viewer faz long-poll via
// /logs/stream?since=<lastId> e renderiza ao vivo. Útil pra debugar
// Belinha sem ter que olhar a janela do .bat.
const LOG_MAX = 1500;
const __logBuffer = [];
let __logSeq = 0;
function __pushLog(level, args) {
    try {
        const msg = Array.prototype.map.call(args, function (a) {
            if (a == null) return String(a);
            if (typeof a === 'string') return a;
            if (a instanceof Error) return a.stack || a.message;
            try { return JSON.stringify(a); } catch (e) { return String(a); }
        }).join(' ');
        __logBuffer.push({ id: ++__logSeq, ts: new Date().toISOString(), level: level, msg: msg });
        if (__logBuffer.length > LOG_MAX) __logBuffer.splice(0, __logBuffer.length - LOG_MAX);
    } catch (e) { /* nunca quebra o servidor */ }
}
['log', 'info', 'warn', 'error'].forEach(function (lvl) {
    const orig = console[lvl];
    console[lvl] = function () {
        __pushLog(lvl, arguments);
        return orig.apply(console, arguments);
    };
});

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

// ========== LOGS VIEWER ==========
// Abre num popup do painel Belinha. Mostra logs ao vivo do servidor
// local (codex/claude/ollama). Long-poll via /logs/stream a cada 1.5s.
app.get('/logs/viewer', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>📜 Belinha Logs ao vivo</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'SF Mono', Consolas, monospace; background: #0F172A; color: #E2E8F0; padding: 0; }
.hdr { background: #1E293B; padding: 10px 14px; display: flex; gap: 10px; align-items: center; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 10; }
.hdr h1 { font-size: 14px; flex: 1; color: #F8FAFC; }
.hdr .stat { font-size: 11px; color: #94A3B8; }
.hdr button { background: #334155; border: 0; color: #fff; padding: 5px 10px; border-radius: 6px; font: inherit; font-size: 11px; cursor: pointer; }
.hdr button:hover { background: #475569; }
.hdr button.act { background: #10B981; }
.hdr select { background: #334155; border: 0; color: #fff; padding: 5px 8px; border-radius: 6px; font: inherit; font-size: 11px; }
.hdr input[type=text] { background: #0F172A; border: 1px solid #334155; color: #fff; padding: 5px 8px; border-radius: 6px; font: inherit; font-size: 11px; min-width: 150px; }
#log { padding: 8px 14px; font-size: 12px; line-height: 1.5; }
.row { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,.03); white-space: pre-wrap; word-break: break-word; }
.row .t { color: #64748B; margin-right: 8px; }
.row .l { font-weight: 800; margin-right: 6px; padding: 0 4px; border-radius: 3px; font-size: 10px; vertical-align: middle; }
.row.log .l { background: #475569; color: #CBD5E1; }
.row.info .l { background: #3B82F6; color: #fff; }
.row.warn .l { background: #F59E0B; color: #fff; }
.row.error .l { background: #EF4444; color: #fff; }
.row.warn { background: rgba(245,158,11,.05); }
.row.error { background: rgba(239,68,68,.08); color: #FCA5A5; }
.empty { padding: 40px; text-align: center; color: #64748B; }
</style></head><body>
<div class="hdr">
    <h1>📜 Belinha Logs (servidor local)</h1>
    <select id="filter"><option value="">Todos níveis</option><option value="error">Só errors</option><option value="warn">warn + error</option></select>
    <input type="text" id="search" placeholder="Filtrar texto…">
    <span class="stat" id="stat">—</span>
    <button id="btnPause">⏸ Pausar</button>
    <button id="btnClear">🗑️ Limpar tela</button>
    <button class="act" onclick="location.reload()">🔄</button>
</div>
<div id="log"><div class="empty">Aguardando logs…</div></div>
<script>
var lastId = 0;
var paused = false;
var rows = [];
var filterLvl = '';
var search = '';
var logEl = document.getElementById('log');
var statEl = document.getElementById('stat');

function render() {
    var filtered = rows.filter(function (r) {
        if (filterLvl === 'error' && r.level !== 'error') return false;
        if (filterLvl === 'warn' && !(r.level === 'warn' || r.level === 'error')) return false;
        if (search && r.msg.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
        return true;
    });
    if (!filtered.length) { logEl.innerHTML = '<div class="empty">Sem entries com esse filtro</div>'; statEl.textContent = '0 / ' + rows.length; return; }
    logEl.innerHTML = filtered.slice(-500).map(function (r) {
        var t = new Date(r.ts).toLocaleTimeString('pt-BR');
        var msg = r.msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<div class="row ' + r.level + '"><span class="t">' + t + '</span><span class="l">' + r.level.toUpperCase() + '</span>' + msg + '</div>';
    }).join('');
    statEl.textContent = filtered.length + ' / ' + rows.length;
    window.scrollTo(0, document.body.scrollHeight);
}

function poll() {
    if (paused) { setTimeout(poll, 800); return; }
    fetch('/logs/stream?since=' + lastId, { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
            if (j.entries && j.entries.length) {
                rows = rows.concat(j.entries);
                if (rows.length > 2000) rows = rows.slice(-2000);
                lastId = j.entries[j.entries.length - 1].id;
                render();
            }
        })
        .catch(function () { /* silent */ })
        .finally(function () { setTimeout(poll, 1500); });
}
document.getElementById('btnPause').onclick = function () {
    paused = !paused;
    this.textContent = paused ? '▶ Continuar' : '⏸ Pausar';
    this.style.background = paused ? '#F59E0B' : '#334155';
};
document.getElementById('btnClear').onclick = function () { rows = []; render(); };
document.getElementById('filter').onchange = function () { filterLvl = this.value; render(); };
document.getElementById('search').oninput = function () { search = this.value; render(); };
poll();
</script>
</body></html>`);
});

// JSON streamer: retorna entries com id > since
app.get('/logs/stream', (req, res) => {
    const since = parseInt(req.query.since || '0', 10);
    const entries = __logBuffer.filter(e => e.id > since);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ entries: entries, latest: __logSeq, bufferSize: __logBuffer.length });
});

// ========== HEALTH ==========
app.get('/health', async (req, res) => {
    const detected = [
        { id: 'codex', name: 'Codex CLI', available: true, plan: 'OpenAI Codex — R$ 0' },
        { id: 'claude', name: 'Claude CLI', available: true, plan: 'Claude Pro/Max — R$ 0' },
        { id: 'ollama', name: 'Ollama', available: true, plan: '100% local offline — R$ 0 forever' }
    ];
    const available = detected.filter(b => b.available);
    res.json({
        ok: true,
        service: 'MilkyPot Autopilot',
        version: '2.0.0',
        uptime: Math.round(process.uptime()) + 's',
        primaryBackend: available[0]?.id || null,
        fallbackBackends: available.slice(1).map(b => b.id),
        cascade: detected.map(b => ({ id: b.id, name: b.name, available: b.available, plan: b.plan })),
        memory: {
            decisions: Memory.loadDecisions(10).length,
            facts: Object.keys(Memory.loadFacts()).length
        }
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

function isCodeEditRequest(text) {
    const q = String(text || '').toLowerCase();
    return /\b(corrij|ajust|arrum|consert|resolv|implemente|adicione|altere|mude|edite|finalize|deploy|commit|pr|veja|verifique|analise|desfa|desfaz|restaure)\b/.test(q) &&
        /\b(codigo|código|arquivo|pagina|página|sistema|pdv|pedido|estoque|menu|tela|botão|botao|icone|ícone|cardápio|cardapio|catálogo|catalogo|belinha|bug|erro|html|js|css|firebase|firestore|deploy|git|preço|preco|valor|produto|casquinha|cascão|cascao|picolé|picole)\b/.test(q);
}

function buildExecutorInstructions(lastUserText) {
    if (!isCodeEditRequest(lastUserText)) return '';
    return [
        '',
        '<executor_mode>',
        'Este pedido parece ser ajuste de codigo/arquivo/dados do sistema MilkyPot.',
        'Rode como agente executor no repositorio local. Investigue antes, preserve o que funciona e faca a alteracao diretamente quando for seguro.',
        'Nao diga para o usuario clicar em Allow, aprovar popup, abrir Claude Code ou usar PowerShell.',
        'Ao final, responda em portugues com o que mudou, arquivos tocados, validacao feita e se precisa reiniciar/deploy.',
        '</executor_mode>'
    ].join('\n');
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
        const { messages, context, persona, model, images } = req.body || {};
        if (!Array.isArray(messages) || !messages.length) {
            return res.status(400).json({ error: 'messages_empty' });
        }

        // 🧠 Memória permanente: injeta no system prompt
        const lastUserText = (messages.slice().reverse().find(m => m.role === 'user') || {}).content || '';
        const memorySnippet = Memory.buildMemorySnippet(lastUserText.slice(0, 200));
        const baseSystem = pickSystem(persona);
        const systemPrompt = `${baseSystem}\n\n${memorySnippet}`;

        // Se vier imagens (paste de print), descreve elas no prompt e o user prompt vê
        let imagesSummary = '';
        if (Array.isArray(images) && images.length) {
            imagesSummary = `\n\n📎 O usuário anexou ${images.length} imagem(ns) (print/foto). Cada imagem está descrita abaixo como ALT_TEXT (Codex não vê pixels diretamente, mas usa esse texto):\n` +
                images.map((img, i) => `[${i + 1}] ${img.altText || img.filename || 'print sem descrição'}`).join('\n');
            console.log(`[copilot] ${images.length} imagem(ns) anexadas`);
        }

        // 📝 COMPRESSÃO: se histórico > 30 msgs, comprime as mais antigas em summary
        let workingMessages = messages;
        if (messages.length > 30) {
            const oldMsgs = messages.slice(0, messages.length - 20);
            const recentMsgs = messages.slice(messages.length - 20);
            const compressedSummary = oldMsgs
                .map(m => `${m.role}: ${String(m.content || '').slice(0, 200)}`)
                .join("\n")
                .slice(0, 1500);
            workingMessages = [
                { role: 'system', content: `[Conversa anterior comprimida — ${oldMsgs.length} msgs]\n${compressedSummary}` },
                ...recentMsgs
            ];
            console.log(`[copilot] comprimiu ${oldMsgs.length} msgs antigas (${messages.length} → ${workingMessages.length})`);
        }

        // Pega a última user message, injeta <context>
        const lastUserIdx = [...workingMessages].map((m, i) => [m.role, i]).reverse().find(([r]) => r === 'user')?.[1];
        let finalPrompt = '';
        workingMessages.forEach((m, i) => {
            if (i === lastUserIdx && m.role === 'user' && context) {
                finalPrompt += `\n\nUSER: <context>\n${JSON.stringify(context, null, 2)}\n</context>${imagesSummary}\n\n${m.content}`;
            } else {
                finalPrompt += `\n\n${m.role.toUpperCase()}: ${m.content}`;
            }
        });
        finalPrompt = finalPrompt.trim();

        // FIX: Windows cmd.exe tem limite de 8191 chars na linha.
        // System prompt MilkyPot tem ~12KB. Solução: embutir o system
        // prompt no próprio user message com tags <system> e mandar
        // TUDO via stdin. Args ficam mínimos (~50 chars).
        const executorInstructions = buildExecutorInstructions(lastUserText);
        const combined = `<system_instructions>\n${systemPrompt}${executorInstructions}\n</system_instructions>\n\n${finalPrompt}`;

        if (executorInstructions) {
            try {
                Memory.updateLastContext({
                    activeTask: 'executor-run-pending',
                    lastUserMessage: lastUserText.slice(0, 500),
                    msgCount: messages.length + 1,
                    executorRun: {
                        prompt: combined,
                        model: model || null,
                        createdAt: new Date().toISOString()
                    }
                });
            } catch (e) {
                console.warn('[executor-run] memory save failed:', e.message);
            }
            return res.json({
                reply: 'Vou executar esse ajuste pelo Codex agora e mostrar o progresso aqui. Nao vou desfazer nada sem antes identificar exatamente o que mudou.',
                usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                model: 'executor-run',
                backend: 'executor-run',
                elapsedMs: 1,
                source: 'local',
                memoryUsed: true,
                triggerExecutorRun: true
            });
        }

        const primaryStartTs = Date.now();
        // Cascata completa: Claude → Codex → Gemini CLI → Copilot CLI → LM Studio → Ollama
        // Cada backend testa detect() primeiro; se disponível, tenta executar;
        // se falhar, próximo da cascata assume.
        // Ordem configurável via autopilot/backends.json
        let result;
        try {
            result = await Backends.executeCascade(combined, { model });
        } catch (cascadeErr) {
            console.error('[copilot] cascata completa falhou:', cascadeErr.attempts);
            throw cascadeErr;
        }

        const primaryElapsedMs = Date.now() - primaryStartTs;
        console.log(`[copilot] ${(persona || 'belinha')} · ${result.backend} · ${primaryElapsedMs}ms · ${result.reply.length} chars`);

        // 🧠 Auto-captura: extrai decisões/fatos da troca user→assistant
        try {
            const lastUser = messages.slice().reverse().find(m => m.role === 'user');
            if (lastUser) Memory.autoCaptureFromMessage('user', lastUser.content);
            Memory.autoCaptureFromMessage('assistant', result.reply);
            // Atualiza last-context com onde parou
            Memory.updateLastContext({
                activeTask: (context?.activeTask || context?.currentPage) || null,
                lastUserMessage: lastUser ? lastUser.content.slice(0, 300) : null,
                lastBotReply: result.reply.slice(0, 300),
                msgCount: messages.length + 1
            });
        } catch (e) {
            console.warn('[copilot] auto-memory falhou:', e.message);
        }

        return res.json({
            reply: result.reply,
            usage: result.usage,
            model: model || (result.backend === 'claude' ? 'claude-default' : 'codex-default'),
            elapsedMs: primaryElapsedMs,
            source: 'local',
            backend: result.backend,
            memoryUsed: !!memorySnippet
        });

    } catch (e) {
        console.error('[copilot] erro', e);
        return res.status(500).json({ error: 'internal', message: e.message });
    }
});

// ========== EXECUTOR RUN (SSE) ==========
app.get('/copilot/execute-run', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    const send = (event, data) => {
        try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch(e) {}
    };
    send('connected', { at: Date.now() });

    const ctx = Memory.loadLastContext && Memory.loadLastContext();
    const run = ctx && ctx.executorRun;
    if (!run || !run.prompt) {
        send('error', { message: 'Nenhuma execucao pendente. Mande o pedido de ajuste novamente.' });
        return res.end();
    }

    send('start', {
        backend: 'codex',
        message: 'Codex iniciou a investigacao no repositorio local.',
        userMessage: ctx.lastUserMessage || ''
    });

    let beat = 0;
    const heartbeat = setInterval(() => {
        beat += 1;
        send('progress', {
            seconds: beat * 10,
            message: beat < 6
                ? 'Ainda trabalhando: lendo arquivos, comparando mudancas e preservando o que funciona.'
                : 'Ainda em execucao. Se passar do limite, corto por timeout e mostro o erro real.'
        });
    }, 10000);

    const started = Date.now();
    try {
        Memory.updateLastContext({ ...ctx, activeTask: 'executor-running' });
        const result = await Backends.executeCascade(run.prompt, {
            model: run.model,
            preferredBackend: 'codex',
            timeoutMs: 120000
        });
        clearInterval(heartbeat);
        const elapsed = Date.now() - started;
        send('done', {
            backend: result.backend,
            elapsed,
            reply: result.reply || '(backend retornou vazio)'
        });
        try {
            Memory.appendDecision(`executor-run ${result.backend} em ${elapsed}ms`, { tags: ['executor-run', result.backend] });
            Memory.updateLastContext({
                ...ctx,
                activeTask: 'executor-run-done',
                executorRun: null,
                lastBotReply: String(result.reply || '').slice(0, 300),
                completedAt: new Date().toISOString()
            });
        } catch(e) {}
    } catch (e) {
        clearInterval(heartbeat);
        const elapsed = Date.now() - started;
        send('error', { elapsed, message: e.message.slice(0, 300) });
        try {
            Memory.updateLastContext({ ...ctx, activeTask: 'executor-run-error', executorRun: null, lastError: e.message });
        } catch(memErr) {}
    }
    res.end();
});

// ========== BRIEFING PROATIVO (opcional) ==========
// ========== MEMORY ENDPOINTS ==========
// Painel pode listar/manipular memória persistente
app.get('/memory', (req, res) => {
    try {
        res.json({
            decisions: Memory.loadDecisions(50),
            facts: Memory.loadFacts(),
            lastContext: Memory.loadLastContext(),
            recentSummaries: Memory.loadRecentSummaries(5)
        });
    } catch (e) {
        res.status(500).json({ error: 'internal', message: e.message });
    }
});

app.post('/memory/decision', (req, res) => {
    try {
        const { text, meta } = req.body || {};
        if (!text) return res.status(400).json({ error: 'text required' });
        const entry = Memory.appendDecision(text, meta || {});
        res.json({ ok: true, entry });
    } catch (e) {
        res.status(500).json({ error: 'internal', message: e.message });
    }
});

app.post('/memory/fact', (req, res) => {
    try {
        const { key, value } = req.body || {};
        if (!key) return res.status(400).json({ error: 'key required' });
        const entry = Memory.setFact(key, value);
        res.json({ ok: true, entry });
    } catch (e) {
        res.status(500).json({ error: 'internal', message: e.message });
    }
});

app.post('/memory/summary', (req, res) => {
    try {
        const { summary } = req.body || {};
        if (!summary) return res.status(400).json({ error: 'summary required' });
        const entry = Memory.saveSessionSummary(summary);
        res.json({ ok: true, entry });
    } catch (e) {
        res.status(500).json({ error: 'internal', message: e.message });
    }
});

app.get('/memory/snippet', (req, res) => {
    try {
        const query = req.query.q || null;
        res.type('text/plain').send(Memory.buildMemorySnippet(query));
    } catch (e) {
        res.status(500).json({ error: 'internal', message: e.message });
    }
});

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

    // Lê secret de .env (se existir) ou env var direta
    const BELINHA_TUNNEL_SECRET = process.env.BELINHA_TUNNEL_SECRET || (function() {
        try {
            const envFile = path.join(__dirname, '.env');
            if (!fs.existsSync(envFile)) return null;
            const content = fs.readFileSync(envFile, 'utf8');
            const m = content.match(/BELINHA_TUNNEL_SECRET\s*=\s*(.+)/);
            return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
        } catch (e) { return null; }
    })();

    const tryRegister = async (url) => {
        try {
            const body = { url };
            if (BELINHA_TUNNEL_SECRET) body.secret = BELINHA_TUNNEL_SECRET;
            const resp = await fetch(VERCEL_REGISTRY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                console.log('✅ Tunnel registrado no Firestore — painel milkypot.com ja funciona!');
            } else {
                const txt = await resp.text();
                console.warn('⚠️ Falha ao registrar tunnel:', resp.status, txt);
                if (!BELINHA_TUNNEL_SECRET) {
                    console.warn('   💡 Defina BELINHA_TUNNEL_SECRET em autopilot/.env');
                }
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
const server = app.listen(PORT, async () => {
    console.log('═══════════════════════════════════════════════');
    console.log(' 🐑 MilkyPot Autopilot — Servidor Local v2.0.0');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log(`   Rodando em: http://localhost:${PORT}`);
    console.log('   Health check: http://localhost:' + PORT + '/health');
    console.log('');

    // Detecta TODOS os backends disponíveis e mostra cascata
    try {
        const detected = await Backends.detectAvailable();
        console.log('   🧠 CASCATA DE BACKENDS LLM (ordem de tentativa):');
        let i = 1;
        for (const b of detected) {
            const status = b.available ? '✅' : '⚪';
            const label = b.available
                ? `${b.id} — ${b.plan}`
                : `${b.id} — não detectado`;
            console.log(`      ${status} ${i}. ${label}`);
            i++;
        }
        const ativos = detected.filter(b => b.available);
        console.log('');
        if (ativos.length) {
            console.log(`   💰 ${ativos.length} backend(s) ativo(s) — Custo: R$ 0,00`);
            console.log(`   🥇 Primário: ${ativos[0].id} (resto é backup automático)`);
        } else {
            console.log('   ⚠️  NENHUM backend detectado! Verifique:');
            console.log('      - claude CLI instalado e logado (claude login)');
            console.log('      - codex CLI instalado');
            console.log('      - Ollama rodando em :11434');
            console.log('      - LM Studio rodando em :1234');
        }
    } catch (e) {
        console.warn('   ⚠️  Erro detectando backends:', e.message);
    }

    console.log('');
    console.log('   🐑 BELINHA LOCAL:  http://localhost:' + PORT + '/painel/copilot-belinha.html');
    console.log('   🐑 BELINHA ONLINE: https://milkypot.com/painel/copilot-belinha.html');
    console.log('   🧠 Memória permanente: autopilot/memory/');
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
