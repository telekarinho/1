/**
 * MilkyPot Copilot — Servidor Local com Tool Calls REAIS
 * ========================================================
 *
 * O que ele faz que a Belinha NÃO faz:
 *   - Tool calls que escrevem no Firestore (produtos, preços, custos)
 *   - Anthropic API com tool_use (não é Claude CLI)
 *   - Firebase Admin SDK = bypass das regras = poder total
 *
 * Setup necessário (uma vez):
 *   1. autopilot/firebase-admin.json  ← service account JSON do Firebase
 *      (Firebase Console > Project Settings > Service accounts > Generate)
 *   2. autopilot/.env  ← com ANTHROPIC_API_KEY=sk-ant-...
 *
 * Roda em: http://localhost:5858
 * UI:      http://localhost:5858/painel/copilot.html
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────
// Carrega .env (sem dependência dotenv)
// ──────────────────────────────────────────────────────
(function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return;
        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        lines.forEach(line => {
            const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
            if (m && !process.env[m[1]]) {
                process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
            }
        });
    } catch (e) {
        console.warn('[env] falha ao carregar .env:', e.message);
    }
})();

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
        console.error('  Como obter:');
        console.error('  1. Abra https://console.firebase.google.com/project/milkypot-ad945/settings/serviceaccounts/adminsdk');
        console.error('  2. Clique em "Gerar nova chave privada"');
        console.error('  3. Salve o JSON baixado como:');
        console.error('     ' + saPath);
        console.error('  4. Reinicie este servidor');
        console.error('');
        console.error('═══════════════════════════════════════════════════════════');
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
// Anthropic SDK
// ──────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.BELINHA_API_KEY || '';
if (!ANTHROPIC_KEY) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ANTHROPIC_API_KEY NÃO CONFIGURADA');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error('  Crie autopilot/.env com:');
    console.error('     ANTHROPIC_API_KEY=sk-ant-api03-...');
    console.error('');
    console.error('  Pegue a chave em: https://console.anthropic.com/settings/keys');
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
}

let Anthropic;
try {
    Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
    console.error('❌ @anthropic-ai/sdk não instalado. Rode: npm install @anthropic-ai/sdk');
    process.exit(1);
}
const anthropic = new Anthropic.default({ apiKey: ANTHROPIC_KEY });

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
// Tool definitions p/ Anthropic
// ──────────────────────────────────────────────────────
const TOOLS = [
    {
        name: 'read_catalog',
        description: 'Lê o catálogo completo (bases, formatos, tamanhos, sabores, adicionais, bebidas). Use quando precisar ver o que existe.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'list_catalog_sections',
        description: 'Lista resumida das seções do catálogo com IDs e nomes (sem detalhes). Útil pra navegar rápido.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'get_item',
        description: 'Pega detalhes de um item específico do catálogo.',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string', description: 'bases, formatos, tamanhos, sabores, adicionais, bebidas' },
                itemId: { type: 'string' }
            },
            required: ['section', 'itemId']
        }
    },
    {
        name: 'update_item',
        description: 'Atualiza campos de um item existente (price, cost, name, desc, available, etc). Sobrescreve só os campos passados em `fields`.',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string' },
                itemId: { type: 'string' },
                fields: { type: 'object', description: 'Objeto com campos a alterar. Ex: {price: 14.5, cost: 4.2}' }
            },
            required: ['section', 'itemId', 'fields']
        }
    },
    {
        name: 'create_item',
        description: 'Cria um novo item em uma seção. Se id não passar, gera do nome.',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string' },
                item: { type: 'object', description: 'Objeto completo do item: {id?, name, desc?, price, cost?, available?, ...}' }
            },
            required: ['section', 'item']
        }
    },
    {
        name: 'delete_item',
        description: 'Remove um item do catálogo. CUIDADO: irreversível.',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string' },
                itemId: { type: 'string' }
            },
            required: ['section', 'itemId']
        }
    },
    {
        name: 'toggle_item',
        description: 'Liga/desliga um item (available true/false) sem deletar.',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string' },
                itemId: { type: 'string' },
                available: { type: 'boolean' }
            },
            required: ['section', 'itemId', 'available']
        }
    },
    {
        name: 'bulk_price_adjustment',
        description: 'Aplica reajuste percentual em todos os preços de uma seção (ex: percent=10 = +10%, percent=-5 = -5%).',
        input_schema: {
            type: 'object',
            properties: {
                section: { type: 'string' },
                percent: { type: 'number', description: 'Ex: 10 pra +10%, -5 pra -5%' },
                onlyAvailable: { type: 'boolean', description: 'Se true, só ajusta itens disponíveis' }
            },
            required: ['section', 'percent']
        }
    },
    {
        name: 'list_franchises',
        description: 'Lista todas as franquias da rede.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'update_franchise',
        description: 'Atualiza campos de uma franquia (nome, endereço, horário, ownerEmail, etc).',
        input_schema: {
            type: 'object',
            properties: {
                franchiseId: { type: 'string' },
                fields: { type: 'object' }
            },
            required: ['franchiseId', 'fields']
        }
    },
    {
        name: 'read_orders_today',
        description: 'Lê pedidos de hoje da franquia (até `limit`, default 50).',
        input_schema: {
            type: 'object',
            properties: {
                franchiseId: { type: 'string' },
                limit: { type: 'number' }
            },
            required: ['franchiseId']
        }
    },
    {
        name: 'read_finances',
        description: 'Lê DRE da franquia (receita, despesa, lucro do mês). Mês formato YYYY-MM.',
        input_schema: {
            type: 'object',
            properties: {
                franchiseId: { type: 'string' },
                month: { type: 'string', description: 'YYYY-MM ou omitido pra tudo' }
            },
            required: ['franchiseId']
        }
    },
    {
        name: 'raw_firestore_read',
        description: 'Leitura direta de qualquer doc Firestore (escape hatch).',
        input_schema: {
            type: 'object',
            properties: {
                collection: { type: 'string' },
                document: { type: 'string' }
            },
            required: ['collection', 'document']
        }
    }
];

// ──────────────────────────────────────────────────────
// System prompt humanizado
// ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o **Copiloto MilkyPot** — um assistente de configuração com poder real de escrever no sistema da franquia.

## Identidade
- Voz: direta, brasileira, carinhosa mas executiva. Sem enrolação.
- Owner: Jocimar Rodrigo (jocimarrodrigo@gmail.com), franquia Muffato Quintino em Londrina-PR.
- Você está sendo executado LOCALMENTE no PC do dono via servidor Node + Firebase Admin SDK.

## O que você faz de diferente
Você TEM TOOL CALLS reais. Quando o usuário diz "muda o preço do shake de Ninho pra R$ 15", você NÃO responde texto explicando como fazer — você chama \`update_item\` direto e confirma.

## Regras de execução
1. **Confirme antes de mudar coisas críticas** (deletar item, reajuste em massa). Para mudanças simples (mudar 1 preço, ativar/desativar item), execute direto e mostre o resultado.
2. **Sempre comece lendo** o catálogo (\`list_catalog_sections\` ou \`read_catalog\`) antes de propor mudanças — não invente IDs.
3. **Mostre o que foi feito**: depois de cada tool call, confirme em 1-2 linhas o que mudou.
4. **Erros**: se uma tool retornar \`error\`, explique o que faltou e ofereça alternativa.
5. **Múltiplas mudanças**: pode fazer várias tool calls em sequência. Não pergunte a cada passo.

## Seções do catálogo
- \`bases\` — Ninho / Zero-Fit / Açaí
- \`formatos\` — Shake / Sundae / Bowl
- \`tamanhos\` — P / M / G (com preços por base)
- \`sabores\` — Morango, Nutella, Oreo, etc
- \`adicionais\` — toppings extra
- \`bebidas\` — água, refrigerante

## Formato de resposta
- TL;DR em 1 linha quando termina uma tarefa
- Use emojis com moderação (✅ 🔥 ⚠️ 📊)
- Mostre números reais quando o usuário perguntar de pedidos/financeiro

Se o usuário pergunta algo sem dar contexto (ex: "muda o preço"), pergunte: "qual seção e qual item? Posso listar pra você ver".

Se o usuário cumprimentar ou conversar fora de configuração, responda natural e ofereça: "posso te ajudar a mexer no catálogo, preços, custos, ou ver pedidos do dia. O que precisa?"`;

// ──────────────────────────────────────────────────────
// HTTP server
// ──────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '4mb' }));

// CORS
app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowed = ['https://milkypot.com', 'https://www.milkypot.com', 'https://milkypot-ad945.web.app'];
    if (allowed.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Static files (serve milkypot frontend)
const MP_ROOT = path.join(__dirname, '..');
app.use(express.static(MP_ROOT, { index: false, extensions: ['html'] }));

// Health
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'MilkyPot Copilot',
        version: '1.0.0',
        tools: TOOLS.map(t => t.name),
        firebase_project: admin.app().options.projectId || 'milkypot-ad945'
    });
});

// Root → UI
app.get('/', (req, res) => res.redirect('/painel/copilot.html'));

// ── /chat — endpoint principal ─────────────────────────
app.post('/chat', async (req, res) => {
    const { messages = [], model = 'claude-sonnet-4-5' } = req.body || {};
    if (!messages.length) return res.status(400).json({ error: 'messages_empty' });

    try {
        // Loop de tool calls (até 10 iterações)
        let conversation = messages.slice();
        const traces = [];
        let finalText = '';

        for (let iter = 0; iter < 10; iter++) {
            const response = await anthropic.messages.create({
                model,
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                tools: TOOLS,
                messages: conversation
            });

            // Anexa resposta do assistente na conversa
            conversation.push({ role: 'assistant', content: response.content });

            // Processa tool_use blocks
            const toolUses = response.content.filter(c => c.type === 'tool_use');
            const textBlocks = response.content.filter(c => c.type === 'text');
            const stopReason = response.stop_reason;

            // Acumula texto desta iteração
            textBlocks.forEach(tb => {
                if (tb.text) finalText += (finalText ? '\n\n' : '') + tb.text;
            });

            if (!toolUses.length || stopReason === 'end_turn') {
                break;
            }

            // Executa todas as tool calls
            const toolResults = [];
            for (const tu of toolUses) {
                const fn = TOOLS_IMPL[tu.name];
                let result;
                if (!fn) {
                    result = { error: 'tool não implementada: ' + tu.name };
                } else {
                    try {
                        result = await fn.call(TOOLS_IMPL, tu.input || {});
                    } catch (e) {
                        result = { error: e.message };
                    }
                }
                traces.push({ tool: tu.name, input: tu.input, output: result });
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: tu.id,
                    content: JSON.stringify(result)
                });
            }
            conversation.push({ role: 'user', content: toolResults });
        }

        return res.json({
            reply: finalText || '(sem resposta de texto)',
            traces,
            model
        });
    } catch (e) {
        console.error('[chat] erro:', e);
        return res.status(500).json({ error: 'internal', message: e.message });
    }
});

// ── INIT ──────────────────────────────────────────────
const PORT = process.env.MILKYPOT_COPILOT_PORT || 5858;
const server = app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════');
    console.log(' 🐑 MilkyPot Copilot — Servidor Local');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('   Rodando em: http://localhost:' + PORT);
    console.log('   UI:         http://localhost:' + PORT + '/painel/copilot.html');
    console.log('   Health:     http://localhost:' + PORT + '/health');
    console.log('');
    console.log('   ✅ ' + TOOLS.length + ' tools disponíveis');
    console.log('   ✅ Firebase Admin conectado (escreve no Firestore)');
    console.log('   ✅ Anthropic API com tool_use');
    console.log('');
    console.log('   Ctrl+C pra parar.');
    console.log('═══════════════════════════════════════════════');
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error('⚠️  Porta ' + PORT + ' já em uso — feche a janela anterior do Copiloto e tente de novo.');
        process.exit(1);
    }
    console.error('[server] erro:', err);
    process.exit(1);
});
