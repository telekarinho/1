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
// DataStore wrapper helpers — todos os docs em datastore/
// têm shape { value: <JSON-string>, updatedAt: timestamp }
// e o catalogo (v2) tem categorias aninhadas:
//   { sabores: { milkshake: { name, icon, items: [...] }, acai: {...} }, bebidas: [...] }
// ──────────────────────────────────────────────────────
async function readDS(docId, fallback) {
    const doc = await db.collection('datastore').doc(docId).get();
    if (!doc.exists) return fallback;
    const raw = doc.data();
    if (typeof raw.value === 'string') {
        try { return JSON.parse(raw.value); } catch (e) { return fallback; }
    }
    return raw; // formato legacy não-wrapper
}
async function writeDS(docId, data) {
    await db.collection('datastore').doc(docId).set({
        value: JSON.stringify(data),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _updatedBy: 'copilot'
    });
}

// Itera TODOS os items do catálogo retornando { section, category, item }
// Section pode ser array direto (bebidas) ou object com categorias contendo items[]
function* iterCatalogItems(cat) {
    if (!cat) return;
    for (const sectionKey of Object.keys(cat)) {
        const section = cat[sectionKey];
        if (Array.isArray(section)) {
            for (const item of section) yield { sectionKey, categoryKey: null, item };
        } else if (section && typeof section === 'object') {
            for (const catKey of Object.keys(section)) {
                const cat2 = section[catKey];
                if (cat2 && Array.isArray(cat2.items)) {
                    for (const item of cat2.items) yield { sectionKey, categoryKey: catKey, item };
                }
            }
        }
    }
}
function findItemById(cat, itemId) {
    for (const ref of iterCatalogItems(cat)) {
        if (ref.item.id === itemId) return ref;
    }
    return null;
}

// ──────────────────────────────────────────────────────
// Tool implementations — escrevem direto no Firestore
// ──────────────────────────────────────────────────────
const TOOLS_IMPL = {
    async read_catalog() {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog_config não existe' };
        return cat;
    },

    async list_catalog_sections() {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog vazio' };
        const summary = {};
        for (const sectionKey of Object.keys(cat)) {
            if (sectionKey.startsWith('_')) continue;
            const section = cat[sectionKey];
            if (Array.isArray(section)) {
                summary[sectionKey] = {
                    type: 'array',
                    count: section.length,
                    items: section.map(i => ({ id: i.id, name: i.name, price: i.price, available: i.available !== false }))
                };
            } else if (section && typeof section === 'object') {
                const cats = {};
                let total = 0;
                for (const catKey of Object.keys(section)) {
                    const c = section[catKey];
                    if (c && Array.isArray(c.items)) {
                        cats[catKey] = {
                            name: c.name || catKey,
                            count: c.items.length,
                            items: c.items.map(i => ({ id: i.id, name: i.name, price: i.price, available: i.available !== false }))
                        };
                        total += c.items.length;
                    }
                }
                summary[sectionKey] = { type: 'categorized', total_items: total, categories: cats };
            }
        }
        return summary;
    },

    async get_item({ itemId, section }) {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog vazio' };
        const ref = findItemById(cat, itemId);
        if (!ref) return { error: 'item não encontrado: ' + itemId };
        return { ...ref.item, _location: { section: ref.sectionKey, category: ref.categoryKey } };
    },

    async update_item({ itemId, fields, section }) {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog vazio' };
        const ref = findItemById(cat, itemId);
        if (!ref) return { error: 'item não encontrado: ' + itemId };
        Object.assign(ref.item, fields, {
            updatedAt: new Date().toISOString(),
            updatedBy: 'copilot'
        });
        await writeDS('catalog_config', cat);
        return { success: true, item: ref.item, location: { section: ref.sectionKey, category: ref.categoryKey } };
    },

    async create_item({ section, category, item }) {
        if (!section) return { error: 'section obrigatório' };
        const cat = await readDS('catalog_config', {});
        if (!item.id) item.id = 'prod_' + Math.random().toString(36).slice(2, 12);
        if (findItemById(cat, item.id)) return { error: 'id já existe: ' + item.id };
        item.available = item.available !== false;
        item.createdAt = new Date().toISOString();
        item.createdBy = 'copilot';

        // Decide onde colocar
        if (Array.isArray(cat[section])) {
            cat[section].push(item);
        } else if (cat[section] && typeof cat[section] === 'object') {
            // Estrutura categorizada
            if (!category) return { error: 'seção "' + section + '" tem categorias — passe `category` (ex: "milkshake", "acai")' };
            if (!cat[section][category]) {
                cat[section][category] = { name: category, items: [] };
            }
            if (!Array.isArray(cat[section][category].items)) cat[section][category].items = [];
            cat[section][category].items.push(item);
        } else {
            cat[section] = [item]; // cria seção como array
        }
        await writeDS('catalog_config', cat);
        return { success: true, item };
    },

    async delete_item({ itemId }) {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog vazio' };
        const ref = findItemById(cat, itemId);
        if (!ref) return { error: 'item não encontrado' };
        if (ref.categoryKey) {
            cat[ref.sectionKey][ref.categoryKey].items = cat[ref.sectionKey][ref.categoryKey].items.filter(i => i.id !== itemId);
        } else {
            cat[ref.sectionKey] = cat[ref.sectionKey].filter(i => i.id !== itemId);
        }
        await writeDS('catalog_config', cat);
        return { success: true, removed: itemId, location: { section: ref.sectionKey, category: ref.categoryKey } };
    },

    async toggle_item({ itemId, available }) {
        return await this.update_item({ itemId, fields: { available: !!available } });
    },

    async bulk_price_adjustment({ section, percent, onlyAvailable }) {
        const cat = await readDS('catalog_config', null);
        if (!cat) return { error: 'catalog vazio' };
        const factor = 1 + (percent / 100);
        let touched = 0;
        for (const ref of iterCatalogItems(cat)) {
            if (section && ref.sectionKey !== section) continue;
            if (onlyAvailable && ref.item.available === false) continue;
            if (typeof ref.item.price === 'number') {
                ref.item.price = Math.round(ref.item.price * factor * 100) / 100;
                touched++;
            }
            if (ref.item.precos && typeof ref.item.precos === 'object') {
                for (const k of Object.keys(ref.item.precos)) {
                    if (typeof ref.item.precos[k] === 'number') {
                        ref.item.precos[k] = Math.round(ref.item.precos[k] * factor * 100) / 100;
                    }
                }
            }
        }
        await writeDS('catalog_config', cat);
        return { success: true, touched, percent, scope: section || 'all' };
    },

    async list_franchises() {
        const data = await readDS('franchises', null);
        if (!data) return { franchises: [] };
        const list = Array.isArray(data) ? data : (Array.isArray(data.franchises) ? data.franchises : []);
        return { count: list.length, franchises: list.map(f => ({ id: f.id, slug: f.slug, name: f.name, city: f.city, ownerEmail: f.access && f.access.ownerEmail })) };
    },

    async update_franchise({ franchiseId, fields }) {
        const data = await readDS('franchises', []);
        const list = Array.isArray(data) ? data : (Array.isArray(data.franchises) ? data.franchises : []);
        const idx = list.findIndex(f => f.id === franchiseId || f.slug === franchiseId);
        if (idx === -1) return { error: 'franquia não encontrada: ' + franchiseId };
        list[idx] = Object.assign({}, list[idx], fields, { updatedAt: new Date().toISOString() });
        await writeDS('franchises', list);
        return { success: true, franchise: list[idx] };
    },

    async read_orders_today({ franchiseId, limit }) {
        const today = new Date();
        const yyyyMmDd = today.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        const data = await readDS('orders_' + franchiseId, []);
        const all = Array.isArray(data) ? data : (Array.isArray(data.orders) ? data.orders : []);
        const today_orders = all.filter(o => {
            const d = (o.createdAt || o.created_at || o.timestamp || '').toString().slice(0, 10);
            return d === yyyyMmDd;
        });
        return {
            date: yyyyMmDd,
            count: today_orders.length,
            total_revenue: today_orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
            orders: today_orders.slice(0, limit || 30).map(o => ({
                id: o.id, status: o.status, total: o.total,
                customer: o.customer && (o.customer.name || o.customer),
                items_count: Array.isArray(o.items) ? o.items.length : 0
            }))
        };
    },

    async read_finances({ franchiseId, month }) {
        const data = await readDS('finances_' + franchiseId, []);
        const entries = Array.isArray(data) ? data : (Array.isArray(data.entries) ? data.entries : []);
        const filtered = month ? entries.filter(e => (e.date || '').slice(0, 7) === month) : entries;
        const receita = filtered.filter(e => e.type === 'receita').reduce((s, e) => s + (Number(e.value) || 0), 0);
        const despesa = filtered.filter(e => e.type === 'despesa').reduce((s, e) => s + (Number(e.value) || 0), 0);
        return {
            month: month || 'all',
            count: filtered.length,
            receita: Math.round(receita * 100) / 100,
            despesa: Math.round(despesa * 100) / 100,
            lucro: Math.round((receita - despesa) * 100) / 100
        };
    },

    async raw_firestore_read({ collection, document }) {
        const doc = await db.collection(collection).doc(document).get();
        if (!doc.exists) return { exists: false };
        const raw = doc.data();
        if (raw && typeof raw.value === 'string') {
            try { return { _wrapped: true, data: JSON.parse(raw.value), updatedAt: raw.updatedAt }; } catch (e) {}
        }
        return raw;
    }
};

// ──────────────────────────────────────────────────────
// Tool descriptions (texto pro Claude — não JSON schema)
// ──────────────────────────────────────────────────────
const TOOLS_DESC = `
## ⚠️ INSTRUÇÃO CRÍTICA — leia 3x

Você está rodando dentro de um servidor wrapper. **NÃO TEM Bash, NÃO TEM Edit, NÃO TEM Read** — todas as ferramentas nativas estão desabilitadas. **Não tente** chamar curl, node, ou qualquer comando.

Você só pode interagir com o sistema escrevendo este formato literal **dentro do texto da sua resposta**:

\`\`\`
<tool_use name="NOME_DA_TOOL">
{"chave": "valor"}
</tool_use>
\`\`\`

Isso é texto markup, não é uma tool real. O servidor wrapper que recebe sua resposta procura por esse padrão de texto via regex, executa a função correspondente em Node.js, e te manda de volta uma nova mensagem do tipo USER contendo:

\`\`\`
<tool_result name="NOME_DA_TOOL">
{...resultado JSON...}
</tool_result>
\`\`\`

Aí você continua a conversa normalmente, lendo o resultado e respondendo. Pode emitir vários blocos \`<tool_use>\` por turno — o servidor executa todos antes de te chamar de novo.

**Não peça permissão.** Não diga "preciso de aprovação". Não tente curl. Apenas escreva os blocos \`<tool_use>\` no meio da sua resposta.

### Lista de tools

**read_catalog** — Lê o catálogo inteiro (todas as seções). Input: \`{}\`

**list_catalog_sections** — Resumo: cada seção, suas categorias e items com IDs/preços. Input: \`{}\`. Use ESTA primeiro pra navegar e descobrir IDs.

**get_item** — Detalhes de um item por ID (busca em todas as seções). Input: \`{"itemId": "prod_xxx"}\`

**update_item** — Atualiza campos do item (precisa só do itemId, encontra a seção sozinho). Input: \`{"itemId": "prod_xxx", "fields": {"price": 15.5, "desc": "..."}}\`

**create_item** — Cria item novo. Input: \`{"section": "sabores", "category": "milkshake", "item": {"name": "Brigadeiro", "price": 14}}\`. Em seções categorizadas (sabores, bases, etc) precisa de \`category\`.

**delete_item** — Remove item. Input: \`{"itemId": "prod_xxx"}\`

**toggle_item** — Ativa/desativa. Input: \`{"itemId": "prod_xxx", "available": false}\`

**bulk_price_adjustment** — Reajuste % nos preços. Input: \`{"section": "sabores", "percent": 5, "onlyAvailable": true}\`. Omita section pra reajustar tudo.

**list_franchises** — Lista franquias. Input: \`{}\`

**update_franchise** — Atualiza dados. Input: \`{"franchiseId": "muffato-quintino", "fields": {"horario": "10h-22h"}}\`

**read_orders_today** — Pedidos de hoje. Input: \`{"franchiseId": "muffato-quintino", "limit": 20}\`

**read_finances** — DRE. Input: \`{"franchiseId": "muffato-quintino", "month": "2026-04"}\`

**raw_firestore_read** — Escape hatch p/ qualquer doc. Input: \`{"collection": "datastore", "document": "..."}\`

### Estrutura do catálogo
Seções: \`bases\`, \`formatos\`, \`tamanhos\`, \`sabores\`, \`adicionais\`, \`bebidas\`.
A maioria é **categorizada** (object com sub-categorias contendo \`items[]\`). \`bebidas\` é array direto.
Sempre rode \`list_catalog_sections\` primeiro pra ver IDs reais (formato \`prod_xxxxx\`).
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

    // -p = print mode (one-shot), JSON output.
    // --disallowedTools bloqueia as ferramentas nativas do Claude CLI
    // (Bash, Edit, Read, etc) — nosso protocolo é XML via texto, não tool calls reais.
    const proc = spawn(
        'claude',
        ['-p', '--output-format', 'json', '--disallowedTools', 'Bash Edit Write Read Glob Grep WebFetch WebSearch Task TodoWrite NotebookEdit'],
        { shell: true, env }
    );
    proc.stdin.write(combinedPrompt, 'utf8');
    proc.stdin.end();

    const { exitCode, stdout, stderr } = await collectProcess(proc);
    if (exitCode !== 0) {
        const errText = stderr || stdout;
        // Detecta erro de autenticação — abre Claude Code com instrução clara
        if (errText.includes('authentication_error') ||
            errText.includes('Invalid authentication') ||
            errText.includes('401')) {
            console.log('\n[auth] ⚠️  Sessão Claude expirada — abrindo Claude Code automaticamente...');
            try {
                // Versões novas do Claude Code CLI (>=2.x) NÃO têm `claude login`.
                // O login é interno via /login dentro do REPL. Abrimos o Claude Code
                // com instruções bem claras na mesma janela.
                spawn('cmd', ['/c', 'start', '"MilkyPot - Login Claude"', 'cmd', '/k',
                    'echo. && ' +
                    'echo  ============================================== && ' +
                    'echo   SESSAO CLAUDE EXPIRADA - LOGIN NECESSARIO && ' +
                    'echo  ============================================== && ' +
                    'echo. && ' +
                    'echo  PASSOS: && ' +
                    'echo. && ' +
                    'echo   1. O Claude Code vai abrir abaixo. && ' +
                    'echo   2. Digite EXATAMENTE este comando ^(com a barra^): && ' +
                    'echo. && ' +
                    'echo        /login && ' +
                    'echo. && ' +
                    'echo   3. Vai abrir o navegador pra autenticar com sua && ' +
                    'echo      conta Claude.ai. && ' +
                    'echo   4. Apos confirmar no navegador, FECHE esta janela. && ' +
                    'echo   5. Volte no Copiloto e tente de novo. && ' +
                    'echo. && ' +
                    'echo  ATENCAO: digite /login com a barra. NAO digite "login" sozinho. && ' +
                    'echo. && ' +
                    'echo  ============================================== && ' +
                    'echo. && ' +
                    'claude'
                ], { shell: false, detached: true, stdio: 'ignore' }).unref();
            } catch (le) { console.error('[auth] falha ao abrir janela de login:', le.message); }
            throw new Error(
                '🔐 Sessão Claude expirada!\n\n' +
                'Uma janela do Claude Code foi aberta automaticamente.\n\n' +
                'Na janela que abriu:\n' +
                '  → Digite /login (COM a barra)\n' +
                '  → Confirme no navegador\n' +
                '  → Feche a janela e tente de novo aqui\n\n' +
                '⚠️  Não digite "login" sem a barra — vai dar erro 401 igual antes.'
            );
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
