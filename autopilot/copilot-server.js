/**
 * MilkyPot Copilot — Servidor Local com Tool Calls REAIS
 * ========================================================
 *
 * MODO LOCAL: usa Claude CLI (seu plano Claude Pro/Max) — R$ 0 de API.
 *
 * O que faz:
 *   - Tool calls que escrevem no Firestore (produtos, preços, custos)
 *   - Protocolo XML pra tool calls (Claude responde <tool_use>{...}</tool_use>)
 *   - Loop até Claude parar de chamar tools (max 10 iter)
 *   - Firebase Admin SDK = bypass das regras = poder total
 *
 * Setup:
 *   1. autopilot/firebase-admin.json  ← service account JSON
 *   2. Claude CLI instalado e autenticado: `claude login`
 *
 * Não precisa de ANTHROPIC_API_KEY — usa seu plano Claude.
 *
 * Roda em: http://localhost:5858
 * UI:      http://localhost:5858/painel/copilot.html
 */

const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// ──────────────────────────────────────────────────────
// Firebase Admin SDK
// ──────────────────────────────────────────────────────
let admin, db;
try {
    admin = require('firebase-admin');
    const saPath = path.join(__dirname, 'firebase-admin.json');
    if (!fs.existsSync(saPath)) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ ARQUIVO firebase-admin.json NÃO ENCONTRADO');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('');
        console.error('  1. https://console.firebase.google.com/project/milkypot-ad945/settings/serviceaccounts/adminsdk');
        console.error('  2. "Gerar nova chave privada"');
        console.error('  3. Salve em: ' + saPath);
        console.error('  4. Reinicie este servidor');
        console.error('');
        process.exit(1);
    }
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    db = admin.firestore();
    console.log('✅ Firebase Admin conectado:', sa.project_id);
} catch (e) {
    console.error('❌ Falha ao inicializar Firebase Admin:', e.message);
    process.exit(1);
}

// ──────────────────────────────────────────────────────
// Tool implementations — escrevem direto no Firestore
// ──────────────────────────────────────────────────────
const TOOLS_IMPL = {
    async read_catalog() {
        const doc = await db.collection('datastore').doc('catalog_config').get();
        if (!doc.exists) return { error: 'catalog_config não existe ainda' };
        return doc.data();
    },

    async list_catalog_sections() {
        const doc = await db.collection('datastore').doc('catalog_config').get();
        if (!doc.exists) return { sections: [] };
        const data = doc.data();
        const sections = {};
        Object.keys(data).forEach(k => {
            if (Array.isArray(data[k])) {
                sections[k] = {
                    count: data[k].length,
                    items: data[k].map(i => ({ id: i.id, name: i.name, available: i.available !== false }))
                };
            }
        });
        return sections;
    },

    async get_item({ section, itemId }) {
        const doc = await db.collection('datastore').doc('catalog_config').get();
        if (!doc.exists) return { error: 'catalog vazio' };
        const data = doc.data();
        if (!Array.isArray(data[section])) return { error: 'seção inválida: ' + section };
        const item = data[section].find(i => i.id === itemId);
        if (!item) return { error: 'item não encontrado: ' + itemId };
        return item;
    },

    async update_item({ section, itemId, fields }) {
        const ref = db.collection('datastore').doc('catalog_config');
        const doc = await ref.get();
        if (!doc.exists) return { error: 'catalog vazio' };
        const data = doc.data();
        if (!Array.isArray(data[section])) return { error: 'seção inválida: ' + section };
        const idx = data[section].findIndex(i => i.id === itemId);
        if (idx === -1) return { error: 'item não encontrado: ' + itemId };
        data[section][idx] = Object.assign({}, data[section][idx], fields, {
            updatedAt: new Date().toISOString(),
            updatedBy: 'copilot'
        });
        await ref.set(data, { merge: false });
        return { success: true, item: data[section][idx] };
    },

    async create_item({ section, item }) {
        const ref = db.collection('datastore').doc('catalog_config');
        const doc = await ref.get();
        const data = doc.exists ? doc.data() : {};
        if (!Array.isArray(data[section])) data[section] = [];
        if (!item.id) item.id = (item.name || 'item').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (data[section].some(i => i.id === item.id)) return { error: 'id já existe: ' + item.id };
        item.available = item.available !== false;
        item.createdAt = new Date().toISOString();
        item.createdBy = 'copilot';
        data[section].push(item);
        await ref.set(data, { merge: false });
        return { success: true, item };
    },

    async delete_item({ section, itemId }) {
        const ref = db.collection('datastore').doc('catalog_config');
        const doc = await ref.get();
        if (!doc.exists) return { error: 'catalog vazio' };
        const data = doc.data();
        if (!Array.isArray(data[section])) return { error: 'seção inválida' };
        const before = data[section].length;
        data[section] = data[section].filter(i => i.id !== itemId);
        if (data[section].length === before) return { error: 'item não encontrado' };
        await ref.set(data, { merge: false });
        return { success: true, removed: itemId };
    },

    async toggle_item({ section, itemId, available }) {
        return await this.update_item({ section, itemId, fields: { available: !!available } });
    },

    async bulk_price_adjustment({ section, percent, onlyAvailable }) {
        const ref = db.collection('datastore').doc('catalog_config');
        const doc = await ref.get();
        if (!doc.exists) return { error: 'catalog vazio' };
        const data = doc.data();
        if (!Array.isArray(data[section])) return { error: 'seção inválida' };
        const factor = 1 + (percent / 100);
        let touched = 0;
        data[section].forEach(item => {
            if (onlyAvailable && item.available === false) return;
            if (typeof item.price === 'number') {
                item.price = Math.round(item.price * factor * 100) / 100;
                touched++;
            }
            if (item.precos && typeof item.precos === 'object') {
                Object.keys(item.precos).forEach(k => {
                    if (typeof item.precos[k] === 'number') {
                        item.precos[k] = Math.round(item.precos[k] * factor * 100) / 100;
                    }
                });
                touched++;
            }
        });
        await ref.set(data, { merge: false });
        return { success: true, touched, percent };
    },

    async list_franchises() {
        const doc = await db.collection('datastore').doc('franchises').get();
        if (!doc.exists) return { franchises: [] };
        return doc.data();
    },

    async update_franchise({ franchiseId, fields }) {
        const ref = db.collection('datastore').doc('franchises');
        const doc = await ref.get();
        const data = doc.exists ? doc.data() : { franchises: [] };
        const list = Array.isArray(data.franchises) ? data.franchises : [];
        const idx = list.findIndex(f => f.id === franchiseId || f.slug === franchiseId);
        if (idx === -1) return { error: 'franquia não encontrada: ' + franchiseId };
        list[idx] = Object.assign({}, list[idx], fields, { updatedAt: new Date().toISOString() });
        await ref.set({ franchises: list }, { merge: false });
        return { success: true, franchise: list[idx] };
    },

    async read_orders_today({ franchiseId, limit }) {
        const today = new Date();
        const yyyyMmDd = today.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        const docId = 'orders_' + franchiseId;
        const doc = await db.collection('datastore').doc(docId).get();
        if (!doc.exists) return { orders: [], total: 0 };
        const data = doc.data();
        const all = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
        const today_orders = all.filter(o => {
            const d = (o.createdAt || o.created_at || '').slice(0, 10);
            return d === yyyyMmDd;
        });
        const slim = today_orders.slice(0, limit || 50).map(o => ({
            id: o.id, status: o.status, total: o.total, customer: o.customer, items: o.items
        }));
        return {
            count: today_orders.length,
            total_revenue: today_orders.reduce((s, o) => s + (o.total || 0), 0),
            orders: slim
        };
    },

    async read_finances({ franchiseId, month }) {
        const docId = 'finances_' + franchiseId;
        const doc = await db.collection('datastore').doc(docId).get();
        if (!doc.exists) return { entries: [] };
        const data = doc.data();
        const entries = Array.isArray(data.entries) ? data.entries : (Array.isArray(data) ? data : []);
        const filtered = month
            ? entries.filter(e => (e.date || '').slice(0, 7) === month)
            : entries;
        const receita = filtered.filter(e => e.type === 'receita').reduce((s, e) => s + (e.value || 0), 0);
        const despesa = filtered.filter(e => e.type === 'despesa').reduce((s, e) => s + (e.value || 0), 0);
        return {
            month: month || 'all',
            count: filtered.length,
            receita,
            despesa,
            lucro: receita - despesa
        };
    },

    async raw_firestore_read({ collection, document }) {
        const doc = await db.collection(collection).doc(document).get();
        if (!doc.exists) return { exists: false };
        return doc.data();
    }
};

// ──────────────────────────────────────────────────────
// Tool descriptions (texto pro Claude — não JSON schema)
// ──────────────────────────────────────────────────────
const TOOLS_DESC = `
## Ferramentas disponíveis

Você TEM ferramentas de verdade. Pra usar, escreva EXATAMENTE este formato (uma linha por tool, em qualquer ponto da sua resposta):

<tool_use name="NOME_DA_TOOL">
{"chave": "valor"}
</tool_use>

O servidor vai executar e responder com:

<tool_result name="NOME_DA_TOOL">
{...resultado JSON...}
</tool_result>

Aí você continua a conversa. Pode chamar várias tools em sequência.

### Lista de tools

**read_catalog** — Lê o catálogo inteiro. Input: \`{}\`

**list_catalog_sections** — Resumo das seções com IDs e nomes (mais rápido). Input: \`{}\`

**get_item** — Detalhes de um item. Input: \`{"section": "sabores", "itemId": "morango"}\`

**update_item** — Atualiza campos. Input: \`{"section": "sabores", "itemId": "morango", "fields": {"price": 15}}\`

**create_item** — Cria item novo. Input: \`{"section": "sabores", "item": {"name": "Brigadeiro", "price": 14, "desc": "..."}}\`

**delete_item** — Remove item (CUIDADO). Input: \`{"section": "sabores", "itemId": "x"}\`

**toggle_item** — Ativa/desativa. Input: \`{"section": "sabores", "itemId": "morango", "available": false}\`

**bulk_price_adjustment** — % em todos os preços. Input: \`{"section": "sabores", "percent": 5, "onlyAvailable": true}\`

**list_franchises** — Lista franquias. Input: \`{}\`

**update_franchise** — Atualiza dados da franquia. Input: \`{"franchiseId": "muffato-quintino", "fields": {"horario": "10h-22h"}}\`

**read_orders_today** — Pedidos de hoje. Input: \`{"franchiseId": "muffato-quintino", "limit": 20}\`

**read_finances** — DRE. Input: \`{"franchiseId": "muffato-quintino", "month": "2026-04"}\`

**raw_firestore_read** — Escape hatch p/ qualquer doc. Input: \`{"collection": "datastore", "document": "..."}\`

### Seções do catálogo
\`bases\` · \`formatos\` · \`tamanhos\` · \`sabores\` · \`adicionais\` · \`bebidas\`
`.trim();

const SYSTEM_PROMPT = `Você é o **Copiloto MilkyPot** — assistente de configuração com poder real de escrever no sistema.

## Identidade
- Voz: direta, brasileira, carinhosa mas executiva. Sem enrolação.
- Owner: Jocimar Rodrigo (jocimarrodrigo@gmail.com), franquia Muffato Quintino em Londrina-PR.
- Você roda LOCALMENTE no PC do dono (Node + Firebase Admin SDK + Claude CLI).

## Diferencial vs Belinha
A Belinha só responde texto. VOCÊ tem tool calls reais — chama \`update_item\` e o sistema MUDA na hora.

## Regras de execução
1. Sempre comece com \`list_catalog_sections\` se for mexer no catálogo (não invente IDs).
2. Mudanças simples (1 preço, ativar/desativar): execute direto.
3. Mudanças críticas (delete, reajuste em massa em produção): confirme antes.
4. Múltiplas tools em sequência: pode chamar uma após a outra sem pedir confirmação a cada passo.
5. Erros em tool_result: explique o problema e ofereça alternativa.
6. Sempre confirme em 1-2 linhas o que foi feito DEPOIS de uma tool call bem-sucedida.

## Formato de resposta
- TL;DR em 1 linha quando termina uma tarefa
- Use emojis com moderação (✅ 🔥 ⚠️ 📊)
- Sem "como uma IA, eu..." (proibido)
- Sem disclaimers genéricos

${TOOLS_DESC}

Se cumprimento ou conversa fora de configuração: responda natural e ofereça "posso mexer em catálogo, preços, custos, franquia, ou ver pedidos/financeiro. O que precisa?"`;

// ──────────────────────────────────────────────────────
// Claude CLI runner (mesmo padrão da Belinha)
// ──────────────────────────────────────────────────────
function collectProcess(proc) {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', c => { stdout += c.toString(); });
        proc.stderr.on('data', c => { stderr += c.toString(); });
        proc.on('close', code => resolve({ exitCode: code, stdout, stderr }));
        proc.on('error', reject);
    });
}

async function runClaudeCli(combinedPrompt) {
    // Carrega token OAuth do Claude Pro/Max
    let sessionToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';
    if (!sessionToken) {
        try {
            const bridgeFile = path.join(os.homedir(), '.claude', '.milkypot-token');
            if (fs.existsSync(bridgeFile)) sessionToken = fs.readFileSync(bridgeFile, 'utf8').trim();
        } catch (e) {}
    }
    if (!sessionToken) {
        try {
            const credFile = path.join(os.homedir(), '.claude', '.credentials.json');
            const creds = JSON.parse(fs.readFileSync(credFile, 'utf8'));
            sessionToken = (creds.claudeAiOauth && creds.claudeAiOauth.accessToken) || '';
        } catch (e) {}
    }

    const env = {
        ...process.env,
        HOME: process.env.HOME || process.env.USERPROFILE || os.homedir(),
        ...(sessionToken ? { CLAUDE_CODE_OAUTH_TOKEN: sessionToken } : {})
    };

    // -p = print mode (one-shot), JSON output. Tudo via stdin (sem 8191 limit).
    const proc = spawn('claude', ['-p', '--output-format', 'json'], { shell: true, env });
    proc.stdin.write(combinedPrompt, 'utf8');
    proc.stdin.end();

    const { exitCode, stdout, stderr } = await collectProcess(proc);
    if (exitCode !== 0) {
        const errText = stderr || stdout;
        // Detecta erro de autenticação — abre login automaticamente
        if (errText.includes('authentication_error') ||
            errText.includes('Invalid authentication') ||
            errText.includes('401')) {
            console.log('\n[auth] ⚠️  Sessão Claude expirada — abrindo login automático...');
            // Abre nova janela cmd com claude login (Windows)
            try {
                spawn('cmd', ['/c', 'start', 'cmd', '/k',
                    'echo. && echo  Sessao Claude expirada. Fazendo login... && echo. && claude login && echo. && echo  Login OK! Pode fechar esta janela e tentar novamente no copilot. && pause'
                ], { shell: false, detached: true, stdio: 'ignore' }).unref();
            } catch (le) { console.error('[auth] falha ao abrir janela de login:', le.message); }
            throw new Error('🔐 Sessão Claude expirada!\n\nUma janela de login foi aberta automaticamente.\n\n→ Faça o login com sua conta Claude.ai na janela que abriu.\n→ Depois tente novamente aqui.');
        }
        throw new Error('claude_cli_exit_' + exitCode + ': ' + errText.slice(0, 400));
    }

    let reply = '';
    try {
        const parsed = JSON.parse(stdout);
        reply = parsed.result || parsed.content || parsed.text || '';
    } catch (e) {
        reply = stdout.trim();
    }
    return reply;
}

// ──────────────────────────────────────────────────────
// Parser de <tool_use name="..."> blocks
// ──────────────────────────────────────────────────────
function parseToolUses(text) {
    const re = /<tool_use\s+name=["']([\w_]+)["']\s*>([\s\S]*?)<\/tool_use>/gi;
    const calls = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        const name = m[1];
        let input;
        try {
            input = JSON.parse(m[2].trim());
        } catch (e) {
            input = { _parse_error: e.message, _raw: m[2].trim() };
        }
        calls.push({ name, input });
    }
    return calls;
}

function stripToolUses(text) {
    return text.replace(/<tool_use\s+name=["'][\w_]+["']\s*>[\s\S]*?<\/tool_use>/gi, '').trim();
}

// ──────────────────────────────────────────────────────
// Runner com tool loop
// ──────────────────────────────────────────────────────
async function chatWithTools(userMessages) {
    // Histórico textual: cada turno como "USER:" / "ASSISTANT:"
    const history = userMessages.map(m => {
        const role = m.role === 'user' ? 'USER' : 'ASSISTANT';
        return role + ':\n' + (typeof m.content === 'string' ? m.content : JSON.stringify(m.content));
    }).join('\n\n');

    let conversation = history;
    const traces = [];
    let finalReply = '';

    for (let iter = 0; iter < 10; iter++) {
        const fullPrompt =
            '<system_instructions>\n' + SYSTEM_PROMPT + '\n</system_instructions>\n\n' +
            conversation +
            '\n\nASSISTANT:';

        const reply = await runClaudeCli(fullPrompt);
        const toolCalls = parseToolUses(reply);

        // Acumula texto limpo (sem tool_use blocks) na resposta final
        const cleanText = stripToolUses(reply);
        if (cleanText) {
            finalReply += (finalReply ? '\n\n' : '') + cleanText;
        }

        if (toolCalls.length === 0) {
            break;
        }

        // Executa todas as tool calls
        const resultBlocks = [];
        for (const call of toolCalls) {
            const fn = TOOLS_IMPL[call.name];
            let result;
            if (!fn) {
                result = { error: 'tool não implementada: ' + call.name };
            } else {
                try {
                    result = await fn.call(TOOLS_IMPL, call.input || {});
                } catch (e) {
                    result = { error: e.message };
                }
            }
            traces.push({ tool: call.name, input: call.input, output: result });
            resultBlocks.push(`<tool_result name="${call.name}">\n${JSON.stringify(result, null, 2)}\n</tool_result>`);
        }

        // Adiciona ao histórico: turno ASSISTANT (com tool_use ainda lá) e turno USER (com results)
        conversation += '\n\nASSISTANT:\n' + reply + '\n\nUSER:\n' + resultBlocks.join('\n\n');
    }

    return { reply: finalReply || '(sem resposta de texto)', traces };
}

// ──────────────────────────────────────────────────────
// HTTP server
// ──────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '4mb' }));

// Secret aleatório por sessão — só quem tem este token pode chamar /chat via tunnel
const COPILOT_SECRET = crypto.randomBytes(24).toString('base64url');

app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowed = ['https://milkypot.com', 'https://www.milkypot.com', 'https://milkypot-ad945.web.app'];
    if (allowed.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || /\.trycloudflare\.com$/.test(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Copilot-Secret');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Auth middleware: /chat requer secret quando vem de fora (tunnel)
function requireSecret(req, res, next) {
    const origin = req.headers.origin || '';
    const isLocal = !origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (isLocal) return next();
    // De fora (milkypot.com via tunnel): exige secret
    const secret = req.headers['x-copilot-secret'] || '';
    if (secret !== COPILOT_SECRET) {
        return res.status(401).json({ error: 'unauthorized', hint: 'x-copilot-secret header obrigatório quando vem de fora' });
    }
    next();
}

const MP_ROOT = path.join(__dirname, '..');
app.use(express.static(MP_ROOT, { index: false, extensions: ['html'] }));

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'MilkyPot Copilot',
        version: '1.2.0',
        backend: 'claude-cli (plano Claude Pro/Max — R$ 0)',
        tools: Object.keys(TOOLS_IMPL),
        firebase_project: admin.app().options.projectId || 'milkypot-ad945',
        tunnel: TUNNEL_URL || null
    });
});

app.get('/', (req, res) => res.redirect('/painel/copilot.html'));

app.post('/chat', requireSecret, async (req, res) => {
    const { messages = [] } = req.body || {};
    if (!messages.length) return res.status(400).json({ error: 'messages_empty' });

    try {
        const t0 = Date.now();
        const result = await chatWithTools(messages);
        const elapsed = Date.now() - t0;
        console.log(`[chat] ${result.traces.length} tools · ${elapsed}ms · ${result.reply.length} chars`);
        return res.json({
            reply: result.reply,
            traces: result.traces,
            elapsedMs: elapsed,
            backend: 'claude-cli'
        });
    } catch (e) {
        console.error('[chat] erro:', e);
        return res.status(500).json({ error: 'internal', message: e.message });
    }
});

// ──────────────────────────────────────────────────────
// CLOUDFLARE TUNNEL — expõe HTTPS público pra milkypot.com
// ──────────────────────────────────────────────────────
let TUNNEL_URL = null;
let tunnelProc = null;

async function registerTunnelInFirestore() {
    if (!TUNNEL_URL) return;
    try {
        await db.collection('datastore').doc('copilot_tunnel').set({
            url: TUNNEL_URL,
            secret: COPILOT_SECRET,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            host: os.hostname(),
            version: '1.2.0'
        });
        console.log('✅ Tunnel registrado no Firestore — milkypot.com já consegue chamar.');
    } catch (e) {
        console.error('⚠️ Falha ao registrar tunnel no Firestore:', e.message);
    }
}

async function clearTunnelFromFirestore() {
    try {
        await db.collection('datastore').doc('copilot_tunnel').delete();
        console.log('🧹 Tunnel removido do Firestore.');
    } catch (e) {}
}

function startTunnel(port) {
    console.log('');
    console.log('🌐 Iniciando cloudflared tunnel...');
    tunnelProc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], { shell: true });

    const onData = (chunk) => {
        const txt = chunk.toString();
        const match = txt.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (match && !TUNNEL_URL) {
            TUNNEL_URL = match[0];
            console.log('');
            console.log('✨ URL pública HTTPS:', TUNNEL_URL);
            console.log('   Health via tunnel:', TUNNEL_URL + '/health');
            console.log('   UI online: https://milkypot.com/painel/copilot.html');
            console.log('');
            registerTunnelInFirestore();
        }
    };
    tunnelProc.stdout.on('data', onData);
    tunnelProc.stderr.on('data', onData);
    tunnelProc.on('error', (e) => {
        console.warn('⚠️ Cloudflared não encontrado ou erro:', e.message);
        console.warn('   Instale com: winget install Cloudflare.cloudflared');
        console.warn('   Ou: https://github.com/cloudflare/cloudflared/releases');
    });
    tunnelProc.on('close', (code) => {
        console.warn('⚠️ Tunnel encerrou (exit ' + code + '). Reinicie o .bat pra restaurar acesso online.');
        TUNNEL_URL = null;
        clearTunnelFromFirestore();
    });
}

// Limpa Firestore ao parar (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\n🛑 Parando servidor...');
    await clearTunnelFromFirestore();
    if (tunnelProc) try { tunnelProc.kill(); } catch (e) {}
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await clearTunnelFromFirestore();
    process.exit(0);
});

const PORT = process.env.MILKYPOT_COPILOT_PORT || 5858;
const server = app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════');
    console.log(' 🐑 MilkyPot Copilot — Servidor Local v1.2');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('   Local: http://localhost:' + PORT + '/painel/copilot.html');
    console.log('');
    console.log('   ⚙️  Backend: Claude CLI (plano Pro/Max — R$ 0)');
    console.log('   ✅ ' + Object.keys(TOOLS_IMPL).length + ' tools disponíveis');
    console.log('   ✅ Firebase Admin conectado');
    console.log('   🔐 Secret de sessão gerado (válido enquanto este processo viver)');
    console.log('');
    console.log('   Ctrl+C pra parar.');
    console.log('═══════════════════════════════════════════════');

    // Sobe o tunnel pra expor em milkypot.com (HTTPS)
    startTunnel(PORT);
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error('⚠️  Porta ' + PORT + ' já em uso.');
        process.exit(1);
    }
    console.error('[server] erro:', err);
    process.exit(1);
});
