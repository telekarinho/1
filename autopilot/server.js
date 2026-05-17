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
const Knowledge = require('./_belinha-knowledge.js');

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
// /painel e /painel/ (sem arquivo) também caem na Belinha
app.get(['/painel', '/painel/'], (req, res) => res.redirect('/painel/copilot-belinha.html'));

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
app.get('/health', async (req, res) => {
    const detected = await Backends.detectAvailable();
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
        /\b(codigo|c[oó]digo|arquivo|pagina|p[aá]gina|sistema|pdv|pedido|estoque|menu|tela|bot[aã]o|icone|[ií]cone|card[aá]pio|cat[aá]logo|belinha|bug|erro|html|js|css|firebase|firestore|deploy|git)\b/.test(q);
}

function buildExecutorInstructions(lastUserText) {
    if (!isCodeEditRequest(lastUserText)) return '';
    return [
        '',
        '<executor_mode>',
        'Este pedido parece ser ajuste de codigo/arquivo do sistema MilkyPot.',
        'Rode como agente executor no repositorio local. Faca a alteracao diretamente quando for seguro.',
        'Nao diga para o usuario clicar em Allow, aprovar popup, abrir Claude Code ou usar PowerShell.',
        'O processo local ja roda sem aprovacao interativa; se precisar editar, edite. Se precisar testar, teste.',
        'Preserve alteracoes existentes do usuario e nao reverta arquivos fora do escopo.',
        'Ao final, responda em portugues com: o que mudou, arquivos tocados, validacao feita e se precisa reiniciar/deploy.',
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

        // ⚡ COMPOSITE FOLLOW-UP: user respondeu "1", "2", "tudo", "pula 3" depois
        // de receber um composite-plan? Vai no last-context e processa a tarefa.
        try {
            const trimmed = lastUserText.trim().toLowerCase();
            if (/^\?+$/.test(trimmed)) {
                const ctx = Memory.loadLastContext && Memory.loadLastContext();
                const pending = ctx && Array.isArray(ctx.compositeTasks) ? ctx.compositeTasks.length : 0;
                const done = ctx && ctx.activeTask === 'composite-run-done';
                return res.json({
                    reply: done
                        ? 'A execucao em sequencia ja terminou. Se a tela ainda mostra bolinhas ou "backends lentos", recarrega a pagina da Belinha para limpar o indicador antigo.'
                        : (pending ? 'Ainda existem ' + pending + ' tarefa(s) pendente(s). Digite o numero da tarefa ou "tudo" para executar em sequencia.' : 'Nao ha tarefa pendente agora. Me mande o ajuste em uma frase direta que eu executo pelo Codex.'),
                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                    model: 'knowledge-status',
                    backend: 'knowledge-status',
                    elapsedMs: 1,
                    source: 'local',
                    memoryUsed: true,
                    knowledgeMatch: { mode: 'quick-status', activeTask: ctx && ctx.activeTask, pending }
                });
            }
            const isSingleNum = /^\d{1,2}$/.test(trimmed);
            const isTudo = /^(tudo|todas|todos|vai|vamos|sim|ok|go)$/i.test(trimmed);
            const skipMatch = trimmed.match(/^(?:pula|skip|ignora)\s+(\d{1,2})$/i);
            if (isSingleNum || isTudo || skipMatch) {
                const ctx = Memory.loadLastContext && Memory.loadLastContext();
                if (ctx && Array.isArray(ctx.compositeTasks) && ctx.compositeTasks.length > 0) {
                    if (isSingleNum) {
                        const idx = parseInt(trimmed, 10) - 1;
                        const t = ctx.compositeTasks[idx];
                        if (t) {
                            const header = `## ▶️ Tarefa ${idx + 1}/${ctx.compositeTasks.length}\n\n> ${t.text}\n\n---\n\n`;
                            // Atualiza contexto removendo a tarefa
                            try {
                                const remaining = ctx.compositeTasks.filter((_, i) => i !== idx);
                                Memory.updateLastContext({ ...ctx, compositeTasks: remaining, activeTask: 'composite-running:' + idx });
                            } catch(e){}

                            // PROCESSAMENTO REAL — tenta playbook primeiro, senão cascata AI
                            const playbookInstant = Knowledge.instantAnswer(t.text);
                            if (playbookInstant) {
                                console.log(`[knowledge] composite-followup · task ${idx + 1} → instant ${playbookInstant.playbookId}`);
                                return res.json({
                                    reply: header + playbookInstant.reply,
                                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                                    model: 'knowledge-composite-instant', backend: 'knowledge-composite-instant',
                                    elapsedMs: playbookInstant.elapsedMs, source: 'local', memoryUsed: true,
                                    knowledgeMatch: { mode: 'composite-followup-instant', taskIndex: idx, playbook: playbookInstant.playbookId }
                                });
                            }

                            // Sem playbook → dispara cascata AI com prompt focado SÓ na tarefa
                            console.log(`[knowledge] composite-followup · task ${idx + 1} → cascade AI`);
                            const taskPrompt = `Tarefa focada da MilkyPot (extraída de uma lista maior): "${t.text}"\n\nResponda DIRETO e CURTO (max 250 palavras). Se for análise, dê 3 ações concretas. Se for fix de código/dados, dê o comando pronto. Sem rodeio.`;
                            const execStart = Date.now();
                            try {
                                const result = await Backends.executeCascade(taskPrompt, { model, preferredBackend: 'codex', timeoutMs: 120000 });
                                const elapsed = Date.now() - execStart;
                                console.log(`[knowledge] composite-followup · task ${idx + 1} · ${result.backend} · ${elapsed}ms`);
                                return res.json({
                                    reply: header + (result.reply || `(backend ${result.backend} retornou vazio em ${elapsed}ms — tenta novamente ou reformula a tarefa)`),
                                    usage: result.usage || { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                                    model: result.backend || 'unknown',
                                    backend: 'composite-task/' + (result.backend || 'unknown'),
                                    elapsedMs: elapsed, source: 'local', memoryUsed: true,
                                    knowledgeMatch: { mode: 'composite-followup-ai', taskIndex: idx, backend: result.backend }
                                });
                            } catch (execErr) {
                                const elapsed = Date.now() - execStart;
                                console.warn(`[knowledge] composite-followup · task ${idx + 1} FAIL: ${execErr.message}`);
                                return res.json({
                                    reply: header + `❌ Falha ao processar tarefa em ${elapsed}ms: ${execErr.message.slice(0, 200)}\n\nReformula a tarefa pra ser mais específica (ex: "renumera produto Pistache" em vez de "ajuste isso") que eu respondo mais rápido.`,
                                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                                    model: 'composite-task-failed', backend: 'composite-task-failed',
                                    elapsedMs: elapsed, source: 'local', memoryUsed: true,
                                    knowledgeMatch: { mode: 'composite-followup-failed', taskIndex: idx, error: execErr.message }
                                });
                            }
                        }
                    } else if (isTudo) {
                        const reply = `## ▶️ Vou executar as ${ctx.compositeTasks.length} tarefas em sequência\n\n` +
                            ctx.compositeTasks.map((t, i) => `**${i + 1}.** ${t.text.slice(0, 100)}${t.text.length > 100 ? '...' : ''}\n   ↳ ${t.playbook ? '🎯 `' + t.playbook + '` (instant ~5ms)' : '🤖 cascade AI (~10-60s)'}`).join('\n\n') +
                            `\n\n---\n\n🔴 **EXECUÇÃO INICIADA EM BACKGROUND** — cada tarefa aparece conforme conclui (via SSE). Olha pra esse chat que vai chover resposta.\n\n_(Se nada acontecer em 30s, abra os logs em http://localhost:5757/logs/viewer)_`;
                        console.log(`[knowledge] composite-followup · TUDO ${ctx.compositeTasks.length} tasks → dispara SSE`);
                        return res.json({
                            reply, usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                            model: 'knowledge-composite-followup', backend: 'knowledge-composite-followup',
                            elapsedMs: 1, source: 'local', memoryUsed: true,
                            knowledgeMatch: { mode: 'composite-tudo-trigger', tasks: ctx.compositeTasks.length },
                            triggerCompositeRun: true  // sinal pro cliente abrir SSE /copilot/composite-run
                        });
                    } else if (skipMatch) {
                        const idx = parseInt(skipMatch[1], 10) - 1;
                        const remaining = ctx.compositeTasks.filter((_, i) => i !== idx);
                        try { Memory.updateLastContext({ ...ctx, compositeTasks: remaining }); } catch(e){}
                        const reply = `## ✖️ Tarefa ${idx + 1} ignorada\n\nRestaram ${remaining.length} tarefas:\n\n` +
                            remaining.map((t, i) => `**${i + 1}.** ${t.text.slice(0, 80)}`).join('\n');
                        return res.json({
                            reply, usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                            model: 'knowledge-composite-followup', backend: 'knowledge-composite-followup',
                            elapsedMs: 1, source: 'local', memoryUsed: true,
                            knowledgeMatch: { mode: 'composite-skip', skipped: idx + 1 }
                        });
                    }
                }
            }
        } catch (e) { console.warn('[knowledge] composite-followup failed:', e.message); }

        // ⚡ COMPOSITE DETECTOR: pergunta com 3+ tarefas → quebra IMEDIATA em plano
        // antes de mandar pra AI (evita Claude pensar 90s+ em pergunta composta).
        try {
            const comp = Knowledge.detectComposite(lastUserText);
            if (comp && comp.tasks.length >= 3) {
                const reply = Knowledge.formatCompositePlan(comp);
                console.log(`[knowledge] composite-plan · ${comp.totalTasks} tarefas detectadas`);
                try {
                    Memory.appendDecision(`Composite plan: ${comp.totalTasks} tarefas em "${lastUserText.slice(0, 80)}"`, { tags: ['knowledge', 'composite'] });
                    Memory.updateLastContext({
                        activeTask: 'composite-plan',
                        lastUserMessage: lastUserText.slice(0, 300),
                        lastBotReply: reply.slice(0, 300),
                        msgCount: messages.length + 1,
                        compositeTasks: comp.tasks.map(t => ({ text: t.text.slice(0, 100), playbook: t.suggestedPlaybook }))
                    });
                } catch (e) {}
                return res.json({
                    reply: reply,
                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                    model: 'knowledge-composite',
                    backend: 'knowledge-composite',
                    elapsedMs: 1,
                    source: 'local',
                    memoryUsed: true,
                    knowledgeMatch: { mode: 'composite-plan', tasksDetected: comp.totalTasks }
                });
            }
        } catch (e) { console.warn('[knowledge] composite detect failed:', e.message); }

        // ⚡ AUTO-INVESTIGATE / AUTO-EXECUTE: se o user pediu AÇÃO
        // (veja/corrige/aplica) E houve match recente de playbook,
        // a Belinha LÊ ou MODIFICA os arquivos do playbook.
        //   - INVESTIGATE: read-only, retorna achados (1-50ms)
        //   - EXECUTE: dispara Codex CLI pra aplicar fix real (~10-60s)
        try {
            const isExec = Knowledge.isExecuteRequest(lastUserText);
            const isInv  = !isExec && Knowledge.isInvestigateRequest(lastUserText);
            if (isExec || isInv) {
                // Resolve playbookId: match atual OU last-context
                let pbId = null;
                const matchNow = Knowledge.match(lastUserText);
                if (matchNow && matchNow.confidence >= 0.5) {
                    pbId = matchNow.playbook.id;
                } else {
                    try {
                        const lastCtx = Memory.loadLastContext && Memory.loadLastContext();
                        if (lastCtx && lastCtx.knowledgeMatch) pbId = lastCtx.knowledgeMatch;
                    } catch (e) {}
                }

                if (pbId) {
                    // Roda investigação SEMPRE (rápido, dá contexto pro execute também)
                    const inv = Knowledge.investigate(pbId);

                    // ============ MODO INVESTIGATE (read-only) ============
                    if (isInv && inv && !inv.error && inv.files && inv.files.length) {
                        const formattedReply = Knowledge.formatInvestigation(inv);
                        console.log(`[knowledge] auto-investigate · ${pbId} · ${inv.files.length} files · ${inv.totalFindings} findings · ${inv.elapsedMs}ms`);
                        try {
                            Memory.appendDecision(`Auto-investigate: ${pbId} → ${inv.totalFindings} achados`, { tags: ['knowledge', 'investigate', pbId] });
                            Memory.updateLastContext({
                                activeTask: 'auto-investigate:' + pbId,
                                lastUserMessage: lastUserText.slice(0, 300),
                                lastBotReply: formattedReply.slice(0, 300),
                                msgCount: messages.length + 1,
                                knowledgeMatch: pbId,
                                lastInvestigation: { totalFindings: inv.totalFindings, files: inv.files.length }
                            });
                        } catch (e) {}
                        return res.json({
                            reply: formattedReply,
                            usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                            model: 'knowledge-investigate',
                            backend: 'knowledge-investigate',
                            elapsedMs: inv.elapsedMs,
                            source: 'local',
                            memoryUsed: true,
                            knowledgeMatch: { playbookId: pbId, mode: 'auto-investigate', filesScanned: inv.files.length, findings: inv.totalFindings }
                        });
                    }

                    // ============ MODO EXECUTE (dispara Codex) ============
                    if (isExec) {
                        const execPrompt = Knowledge.buildExecutePrompt(pbId, inv);
                        if (execPrompt) {
                            console.log(`[knowledge] auto-execute · ${pbId} · disparando Codex...`);
                            const execStart = Date.now();
                            try {
                                // Força Codex como backend (skip Claude que pede aprovação)
                                const result = await Backends.executeCascade(execPrompt, { model, preferredBackend: 'codex', timeoutMs: 120000 });
                                const elapsed = Date.now() - execStart;
                                console.log(`[knowledge] auto-execute · ${pbId} · ${result.backend} · ${elapsed}ms`);
                                const replyHeader = `## 🔧 Auto-fix executado: ${inv.playbookTitle || pbId}\n\n_Backend: ${result.backend} · ${elapsed}ms_\n\n`;
                                const fullReply = replyHeader + (result.reply || '(sem retorno)');
                                try {
                                    Memory.appendDecision(`Auto-execute: ${pbId} via ${result.backend} em ${elapsed}ms`, { tags: ['knowledge', 'execute', pbId] });
                                    Memory.updateLastContext({
                                        activeTask: 'auto-execute:' + pbId,
                                        lastUserMessage: lastUserText.slice(0, 300),
                                        lastBotReply: fullReply.slice(0, 300),
                                        msgCount: messages.length + 1,
                                        knowledgeMatch: pbId
                                    });
                                } catch (e) {}
                                return res.json({
                                    reply: fullReply,
                                    usage: result.usage || { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                                    model: result.backend || 'codex',
                                    backend: 'knowledge-execute/' + (result.backend || 'codex'),
                                    elapsedMs: elapsed,
                                    source: 'local',
                                    memoryUsed: true,
                                    knowledgeMatch: { playbookId: pbId, mode: 'auto-execute', backend: result.backend }
                                });
                            } catch (execErr) {
                                console.warn(`[knowledge] auto-execute falhou: ${execErr.message}`);
                                // Fallback: retorna investigação + sugere fix manual
                                const fallbackReply = `## ⚠️ Auto-fix falhou: ${execErr.message.slice(0, 200)}\n\n` +
                                    Knowledge.formatInvestigation(inv) +
                                    `\n\n_O Codex CLI não conseguiu aplicar o fix automático. Tente rodar manualmente o script do playbook acima._`;
                                return res.json({
                                    reply: fallbackReply,
                                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                                    model: 'knowledge-execute-failed',
                                    backend: 'knowledge-execute-failed',
                                    elapsedMs: Date.now() - execStart,
                                    source: 'local',
                                    memoryUsed: true,
                                    knowledgeMatch: { playbookId: pbId, mode: 'auto-execute', error: execErr.message }
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[knowledge] auto-action falhou:', e.message);
        }

        // ⚡ KNOWLEDGE INSTANT-ANSWER: se a pergunta bate com playbook conhecido
        // (encoding, custo açaí, renumerar cardápio etc), retorna resposta DIRETA
        // em 1-2s sem queimar Claude/Codex. Tem que ser ANTES da cascata AI.
        try {
            const instant = Knowledge.instantAnswer(lastUserText);
            if (instant) {
                console.log(`[knowledge] instant-answer · ${instant.playbookId} · confidence=${instant.confidence.toFixed(2)} · ${instant.elapsedMs}ms`);
                // Salva na memória pra rastreio
                try {
                    Memory.appendDecision(`Knowledge instant: ${instant.playbookId} → "${lastUserText.slice(0, 80)}"`, { tags: ['knowledge', 'instant', instant.playbookId] });
                    Memory.updateLastContext({
                        activeTask: instant.playbookTitle,
                        lastUserMessage: lastUserText.slice(0, 300),
                        lastBotReply: instant.reply.slice(0, 300),
                        msgCount: messages.length + 1,
                        knowledgeMatch: instant.playbookId
                    });
                } catch (e) { console.warn('[knowledge] memory save failed:', e.message); }

                return res.json({
                    reply: instant.reply,
                    usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
                    model: 'knowledge-instant',
                    backend: 'knowledge-instant',
                    elapsedMs: instant.elapsedMs,
                    source: 'local',
                    memoryUsed: true,
                    knowledgeMatch: {
                        playbookId: instant.playbookId,
                        title: instant.playbookTitle,
                        confidence: instant.confidence,
                        triggers: instant.matchedTriggers
                    }
                });
            }
        } catch (e) {
            console.warn('[knowledge] match failed (segue p/ AI):', e.message);
        }

        // Knowledge não-instant: se houver playbook relacionado, injeta no system prompt
        const knowledgeSnippet = Knowledge.buildKnowledgeSnippet(lastUserText);
        if (knowledgeSnippet) {
            console.log(`[knowledge] context inject (sem instant-match)`);
        }

        const memorySnippet = Memory.buildMemorySnippet(lastUserText.slice(0, 200));
        const baseSystem = pickSystem(persona);
        const systemPrompt = `${baseSystem}\n\n${memorySnippet}${knowledgeSnippet ? '\n\n' + knowledgeSnippet : ''}`;

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
        const preferredBackend = executorInstructions ? 'codex' : null;

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
            result = await Backends.executeCascade(combined, { model, preferredBackend });
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

app.get('/backends', async (req, res) => {
    try {
        const detected = await Backends.detectAvailable();
        // Pra Ollama, lista modelos instalados
        const ollama = detected.find(b => b.id === 'ollama' && b.available);
        let ollamaModels = [];
        if (ollama) {
            try {
                const r = await fetch('http://localhost:11434/api/tags');
                const j = await r.json();
                ollamaModels = (j.models || []).map(m => ({ name: m.name, size: m.size }));
            } catch (e) {}
        }
        res.json({
            cascade: detected,
            ollamaModels,
            config: Backends.loadConfig()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
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

// ============================================================
// 🚀 COMPOSITE RUN — executa "tudo" das tarefas do composite em
// sequência, streaming progresso via SSE (cliente vê tarefa-por-tarefa)
// ============================================================
app.get('/copilot/composite-run', async (req, res) => {
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
    if (!ctx || !Array.isArray(ctx.compositeTasks) || !ctx.compositeTasks.length) {
        send('error', { message: 'Nenhuma lista de tarefas pendente. Mande pergunta composta primeiro.' });
        return res.end();
    }

    const total = ctx.compositeTasks.length;
    send('start', { total, tasks: ctx.compositeTasks.map(t => ({ text: t.text, playbook: t.playbook })) });

    const results = [];
    for (let i = 0; i < ctx.compositeTasks.length; i++) {
        const t = ctx.compositeTasks[i];
        const taskNum = i + 1;
        send('task-start', { index: i, taskNum, total, text: t.text, playbook: t.playbook });
        const taskStart = Date.now();
        try {
            // Tenta playbook instant primeiro
            const inst = Knowledge.instantAnswer(t.text);
            if (inst) {
                const elapsed = Date.now() - taskStart;
                send('task-done', { index: i, taskNum, mode: 'instant', playbook: inst.playbookId, elapsed, reply: inst.reply });
                results.push({ task: t.text, mode: 'instant', playbook: inst.playbookId, elapsed });
                try { Memory.appendDecision(`composite-run [${taskNum}/${total}] instant: ${inst.playbookId}`, { tags: ['knowledge','composite-run','instant', inst.playbookId] }); } catch(e){}
                continue;
            }
            // Sem playbook → cascata AI (Codex preferred)
            send('task-progress', { index: i, taskNum, message: 'Codex trabalhando agora. Se passar de 2min, corto e sigo para o proximo fallback.' });
            const prompt = `Tarefa focada da MilkyPot (lista composta ${taskNum}/${total}): "${t.text}"\n\nResponda DIRETO e CURTO (max 200 palavras). Se for fix de dados/código, dê o comando. Sem rodeio.`;
            const result = await Backends.executeCascade(prompt, { model: req.query.model, preferredBackend: 'codex', timeoutMs: 120000 });
            const elapsed = Date.now() - taskStart;
            send('task-done', { index: i, taskNum, mode: 'cascade', backend: result.backend, elapsed, reply: result.reply || '(backend retornou vazio)' });
            results.push({ task: t.text, mode: 'cascade', backend: result.backend, elapsed });
            try { Memory.appendDecision(`composite-run [${taskNum}/${total}] cascade ${result.backend} em ${elapsed}ms`, { tags: ['knowledge','composite-run','cascade'] }); } catch(e){}
        } catch (e) {
            const elapsed = Date.now() - taskStart;
            send('task-error', { index: i, taskNum, elapsed, error: e.message.slice(0, 200) });
            results.push({ task: t.text, mode: 'error', error: e.message, elapsed });
        }
    }
    // Limpa contexto após executar
    try { Memory.updateLastContext({ ...ctx, compositeTasks: [], activeTask: 'composite-run-done', completedAt: new Date().toISOString() }); } catch(e){}
    send('done', { total, results, doneAt: Date.now() });
    res.end();
});

// ============================================================
// 📚 KNOWLEDGE — lista playbooks + historico de uso filtrado
// ============================================================
// ============================================================
// EXECUTOR RUN - executa um pedido de ajuste com progresso ao vivo
// ============================================================
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
        send('error', {
            elapsed,
            message: e.message.slice(0, 300)
        });
        try {
            Memory.updateLastContext({ ...ctx, activeTask: 'executor-run-error', executorRun: null, lastError: e.message });
        } catch(memErr) {}
    }
    res.end();
});

app.get('/knowledge/playbooks', (req, res) => {
    try {
        const playbooks = Knowledge.loadPlaybooks();
        const category = req.query.category || null;
        const filtered = category
            ? playbooks.filter(p => (p.category || '') === category)
            : playbooks;
        res.json({
            total: filtered.length,
            category: category,
            playbooks: filtered.map(p => ({
                id: p.id, title: p.title, category: p.category || 'geral',
                instant: !!p.instant, triggers: p.triggers, weight: p.weight
            }))
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// /knowledge/history?category=marketing  → decisions filtradas por tag de playbook
app.get('/knowledge/history', (req, res) => {
    try {
        const category = req.query.category || null;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 10), 500);
        const playbooks = Knowledge.loadPlaybooks();
        const idsInCategory = category
            ? new Set(playbooks.filter(p => (p.category || '') === category).map(p => p.id))
            : null;
        const decisions = Memory.loadDecisions(500);
        const filtered = decisions.filter(d => {
            if (!Array.isArray(d.tags)) return false;
            if (!d.tags.includes('knowledge')) return false;
            if (!idsInCategory) return true;
            return d.tags.some(t => idsInCategory.has(t));
        }).slice(-limit).reverse();
        // Estatisticas por playbook
        const stats = {};
        for (const d of filtered) {
            const pbId = (d.tags || []).find(t => idsInCategory ? idsInCategory.has(t) : (playbooks.find(p => p.id === t)));
            if (!pbId) continue;
            if (!stats[pbId]) stats[pbId] = { id: pbId, runs: 0, lastRun: null, modes: {} };
            stats[pbId].runs++;
            stats[pbId].lastRun = d.ts;
            const mode = (d.tags || []).find(t => ['instant','investigate','execute'].includes(t)) || 'other';
            stats[pbId].modes[mode] = (stats[pbId].modes[mode] || 0) + 1;
        }
        res.json({
            category, total: filtered.length, decisions: filtered, stats: Object.values(stats)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// 📜 LOGS — tail dos logs do servidor (CLI + SSE para painel)
// ============================================================
const LOGS_OUT = path.join(__dirname, 'server-live.out.log');
const LOGS_ERR = path.join(__dirname, 'server-live.err.log');

function tailFile(file, maxLines = 200) {
    try {
        if (!fs.existsSync(file)) return [];
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split(/\r?\n/);
        return lines.slice(-maxLines);
    } catch (e) {
        return ['[tailFile error: ' + e.message + ']'];
    }
}

// GET /logs?lines=200&type=both|out|err   → JSON com últimas N linhas
app.get('/logs', (req, res) => {
    const n = Math.min(Math.max(parseInt(req.query.lines, 10) || 200, 10), 2000);
    const type = (req.query.type || 'both').toLowerCase();
    const out = (type === 'err') ? [] : tailFile(LOGS_OUT, n);
    const err = (type === 'out') ? [] : tailFile(LOGS_ERR, n);
    res.json({
        outLines: out.length,
        errLines: err.length,
        out,
        err,
        files: { out: LOGS_OUT, err: LOGS_ERR },
        serverUptimeMs: Math.round(process.uptime() * 1000)
    });
});

// GET /logs/raw?type=out|err   → text/plain pro tail no terminal
app.get('/logs/raw', (req, res) => {
    const type = (req.query.type || 'out').toLowerCase();
    const file = type === 'err' ? LOGS_ERR : LOGS_OUT;
    const n = Math.min(Math.max(parseInt(req.query.lines, 10) || 500, 10), 5000);
    res.type('text/plain; charset=utf-8').send(tailFile(file, n).join('\n'));
});

// GET /logs/stream   → Server-Sent Events ao vivo (pra painel/CLI)
app.get('/logs/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.write(`: connected\n\n`);

    // Estado inicial: manda últimas 50 linhas
    const initialOut = tailFile(LOGS_OUT, 50);
    const initialErr = tailFile(LOGS_ERR, 30);
    res.write(`event: snapshot\ndata: ${JSON.stringify({ out: initialOut, err: initialErr })}\n\n`);

    // Watch dos arquivos — manda linhas novas conforme aparecem
    let lastOutSize = fs.existsSync(LOGS_OUT) ? fs.statSync(LOGS_OUT).size : 0;
    let lastErrSize = fs.existsSync(LOGS_ERR) ? fs.statSync(LOGS_ERR).size : 0;

    function streamDelta(file, lastSize, eventName) {
        try {
            if (!fs.existsSync(file)) return lastSize;
            const stat = fs.statSync(file);
            if (stat.size === lastSize) return lastSize;
            if (stat.size < lastSize) lastSize = 0; // rotacionado/truncado
            const fd = fs.openSync(file, 'r');
            const buf = Buffer.alloc(stat.size - lastSize);
            fs.readSync(fd, buf, 0, buf.length, lastSize);
            fs.closeSync(fd);
            const delta = buf.toString('utf8').split(/\r?\n/).filter(l => l.length > 0);
            if (delta.length) {
                res.write(`event: ${eventName}\ndata: ${JSON.stringify({ lines: delta, at: Date.now() })}\n\n`);
            }
            return stat.size;
        } catch (e) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: e.message, file })}\n\n`);
            return lastSize;
        }
    }

    const interval = setInterval(() => {
        lastOutSize = streamDelta(LOGS_OUT, lastOutSize, 'out');
        lastErrSize = streamDelta(LOGS_ERR, lastErrSize, 'err');
        // Heartbeat a cada ciclo pra detectar disconnect
        try { res.write(`: ping ${Date.now()}\n\n`); } catch(e) {}
    }, 1000);

    req.on('close', () => clearInterval(interval));
});

// GET /logs/viewer   → HTML standalone com viewer (sem precisar UI no painel)
app.get('/logs/viewer', (req, res) => {
    res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><title>Belinha — Logs ao vivo</title>
<style>
  body { background:#0b1020; color:#d6e0f0; font-family:'SF Mono',Consolas,monospace; font-size:13px; margin:0; padding:0; }
  .toolbar { background:#1a2238; padding:10px 16px; border-bottom:1px solid #2a3654; display:flex; gap:12px; align-items:center; }
  .toolbar h1 { margin:0; font-size:14px; color:#7be0c1; }
  .toolbar button { background:#2a3654; color:#d6e0f0; border:0; padding:6px 12px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12px; }
  .toolbar button:hover { background:#3a4670; }
  .toolbar .badge { padding:2px 8px; border-radius:10px; font-size:11px; }
  .badge.connected { background:#0e6e3f; color:#a7f3c1; }
  .badge.disconnected { background:#7e1b1b; color:#fbcaca; }
  #logs { padding:12px 16px; line-height:1.45; white-space:pre-wrap; word-break:break-word; }
  .line-out { color:#d6e0f0; }
  .line-err { color:#ff8888; font-weight:600; }
  .line-cmd { color:#7be0c1; }
  .line-time { color:#5e7393; margin-right:8px; }
  .filter-input { background:#0b1020; color:#d6e0f0; border:1px solid #2a3654; padding:6px 10px; border-radius:6px; font-family:inherit; font-size:12px; width:240px; }
</style></head>
<body>
<div class="toolbar">
  <h1>📜 Belinha — Logs ao vivo</h1>
  <span class="badge connected" id="status">connecting...</span>
  <input class="filter-input" id="filter" placeholder="filtro (regex)... ex: cascade|error">
  <button onclick="clearLogs()">🗑️ Limpar</button>
  <button onclick="togglePause()" id="pauseBtn">⏸️ Pausar</button>
  <button onclick="toggleAutoscroll()" id="scrollBtn">📜 Auto-scroll: ON</button>
  <span style="margin-left:auto;color:#5e7393" id="counter">0 linhas</span>
</div>
<div id="logs"></div>
<script>
let paused = false, autoscroll = true, lineCount = 0;
const logsEl = document.getElementById('logs');
const statusEl = document.getElementById('status');
const counterEl = document.getElementById('counter');
const filterEl = document.getElementById('filter');
function clearLogs(){ logsEl.innerHTML=''; lineCount=0; counterEl.textContent='0 linhas'; }
function togglePause(){ paused=!paused; document.getElementById('pauseBtn').textContent = paused?'▶️ Retomar':'⏸️ Pausar'; }
function toggleAutoscroll(){ autoscroll=!autoscroll; document.getElementById('scrollBtn').textContent='📜 Auto-scroll: '+(autoscroll?'ON':'OFF'); }
function appendLines(lines, kind){
  if (paused) return;
  const re = filterEl.value.trim() ? new RegExp(filterEl.value, 'i') : null;
  const ts = new Date().toLocaleTimeString('pt-BR', { hour12:false });
  for (const line of lines) {
    if (re && !re.test(line)) continue;
    const div = document.createElement('div');
    div.className = 'line-' + kind;
    div.innerHTML = '<span class="line-time">'+ts+'</span>' + line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    logsEl.appendChild(div);
    lineCount++;
  }
  counterEl.textContent = lineCount + ' linhas';
  // Trim se passar de 5000 linhas
  while (logsEl.childElementCount > 5000) logsEl.removeChild(logsEl.firstChild);
  if (autoscroll) window.scrollTo(0, document.body.scrollHeight);
}
function connect(){
  const es = new EventSource('/logs/stream');
  es.onopen = () => { statusEl.className='badge connected'; statusEl.textContent='connected'; };
  es.onerror = () => { statusEl.className='badge disconnected'; statusEl.textContent='disconnected — retrying'; };
  es.addEventListener('snapshot', e => {
    const d = JSON.parse(e.data);
    appendLines(d.out || [], 'out');
    appendLines(d.err || [], 'err');
  });
  es.addEventListener('out', e => appendLines(JSON.parse(e.data).lines || [], 'out'));
  es.addEventListener('err', e => appendLines(JSON.parse(e.data).lines || [], 'err'));
}
connect();
</script>
</body></html>`);
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
