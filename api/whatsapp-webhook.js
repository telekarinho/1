/* ============================================
   MilkyPot — WhatsApp Webhook (Vercel serverless)
   ============================================
   Recebe mensagens do WhatsApp via gateway Baileys (zap.milkypot.com).
   Fluxo:
     1. Gateway Baileys (zap.milkypot.com/nodejs) recebe msg WhatsApp
     2. Faz POST aqui com { phone, name, text, ... } + assinatura HMAC
     3. Valida HMAC com MP_WEBHOOK_SECRET (env var)
     4. Salva conversa em Firestore /whatsapp_conversations/{phone}
     5. Chama Belinha IA (chat-lulu.js logic) com histórico recente
     6. Retorna { reply: "..." } pro gateway
     7. Gateway envia reply de volta no WhatsApp

   Headers obrigatórios:
     x-mp-signature: <hmac sha256 hex do body com MP_WEBHOOK_SECRET>

   Body (do gateway):
     { phone, name, text, type, timestamp, messageId, from }
     OPCIONAL pra áudio: { audioBase64: "...", audioMimeType: "audio/ogg" }
       OU                  { audioUrl: "https://..." }
     → webhook transcreve via Groq Whisper e usa transcrição como `text`.

   Resposta:
     200 { reply: "..." } → gateway envia
     200 { } → gateway não envia nada (silencioso, ex: humano vai responder)
     401 { error } → assinatura inválida
     503 { error } → IA indisponível (gateway não envia)
   ============================================ */

"use strict";

const crypto = require("crypto");
const TOOLS = require("../lib/whatsapp/tools.js");
const Customers = require("../lib/whatsapp/customers.js");
const FastReplies = require("../lib/whatsapp/fast-replies.js");

// ============================================
// Tool definitions (formato OpenAI/Groq)
// ============================================
const TOOL_DEFINITIONS = [
    {
        type: "function",
        function: {
            name: "listar_cardapio",
            description: "Retorna cardápio (até 25 produtos). Use SEMPRE antes de quotar preço ou quando cliente pedir 'cardápio'. Pode filtrar por categoria ('Milkshakes', 'Sundaes', 'Picolés', 'Casquinha') ou busca textual.",
            parameters: {
                type: "object",
                properties: {
                    categoria: { type: "string", description: "Filtra por categoria. Ex: 'Milkshakes', 'Sundaes'" },
                    busca: { type: "string", description: "Busca textual no nome do produto. Ex: 'amora', 'chocolate'" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "criar_pedido",
            description: "Cria pedido REAL no sistema MilkyPot. Use SOMENTE depois que cliente confirmou TODOS os detalhes. Retorna orderId, items, subtotal, taxa entrega, total, ETA. Aceita múltiplos itens.",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        description: "Lista de items do pedido. Cada item: NOME do produto (ex: 'Amora Apaixonada', 'Blue Ice', 'Açaí Bowl Granola') que será buscado no cardápio + adicionais (toppings) opcionais + qty.",
                        items: {
                            type: "object",
                            properties: {
                                sabor: { type: "string", description: "Nome ou parte do nome do produto. Ex: 'Amora Apaixonada', 'Blue Ice', 'Morango Romântico'. Sistema faz match fuzzy." },
                                adicionais: { type: "array", items: { type: "string" }, description: "Nomes de adicionais/toppings (ex: 'Granola', 'Pistache', 'M&M'). Cada um soma ao preço unit." },
                                qty: { type: "integer", description: "Quantidade. Default 1" },
                                observacao: { type: "string", description: "Notas específicas desse item" }
                            },
                            required: ["sabor"]
                        }
                    },
                    tipo: { type: "string", enum: ["delivery", "retirada"], description: "delivery (com taxa) ou retirada na loja (sem taxa)" },
                    endereco: { type: "string", description: "Endereço completo (rua, número, bairro, complemento). Obrigatório se delivery e cliente é NOVO ou pediu em outro endereço." },
                    usar_endereco_anterior: { type: "boolean", description: "Use TRUE quando cliente CONHECIDO disser 'manda no endereço de sempre', 'no de antes', 'mesmo lugar'. Sistema puxa lastAddress do perfil." },
                    pagamento: { type: "string", enum: ["pix", "cartao", "dinheiro"] },
                    troco_para: { type: "number", description: "Troco pra qual valor (só se dinheiro)" },
                    observacoes: { type: "string", description: "Observações gerais do pedido" },
                    recipient: {
                        type: "object",
                        description: "Quem vai RECEBER/RETIRAR se for OUTRA pessoa (ex: 'minha amiga Maria vai buscar'). Omite se for o próprio cliente que pediu.",
                        properties: {
                            name: { type: "string", description: "Nome da pessoa que vai receber/retirar" },
                            phone: { type: "string", description: "Telefone da pessoa (opcional)" }
                        }
                    }
                },
                required: ["items", "tipo", "pagamento"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_pedido",
            description: "Busca pedidos anteriores do cliente. Use quando cliente perguntar 'cadê meu pedido?', 'já chegou?', 'qual número do meu pedido?'.",
            parameters: {
                type: "object",
                properties: {
                    orderId: { type: "string", description: "ID que cliente forneceu (ex: ABC123). Se omitido, busca pelo phone do cliente." }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "listar_promocoes",
            description: "Retorna promoções e horários especiais da franquia hoje. Use quando cliente perguntar 'tem promo?', 'tá aberto?'.",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "cotar_delivery",
            description: "Calcula taxa de entrega real e retorna se tem frete grátis. Use quando cliente perguntar 'quanto é o frete?' ou 'entrega aqui?'.",
            parameters: {
                type: "object",
                properties: {
                    endereco: { type: "string", description: "Endereço de entrega" }
                }
            }
        }
    }
];

async function executeToolCall(name, args, ctx) {
    const full = { ...args, franchiseeId: ctx.franchiseeId };
    if (name === "listar_cardapio") return await TOOLS.listar_cardapio(full);
    if (name === "criar_pedido") {
        full.customerPhone = ctx.customerPhone;
        full.customerName = ctx.customerName;
        return await TOOLS.criar_pedido(full);
    }
    if (name === "consultar_pedido") {
        if (!full.orderId) full.customerPhone = ctx.customerPhone;
        return await TOOLS.consultar_pedido(full);
    }
    if (name === "listar_promocoes") return await TOOLS.listar_promocoes(full);
    if (name === "cotar_delivery") return await TOOLS.cotar_delivery(full);
    return { error: "tool_unknown:" + name };
}

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

// ============================================
// Belinha System Prompt — atendente WhatsApp HUMANIZADA + ÁGIL
// ============================================
// Tom: carinhoso, simples, criança de 5 anos entende.
// Estratégia: conduz pedido em passos NUMERADOS pra cliente só responder número.
// ============================================
const BELINHA_WHATSAPP_PROMPT = `Você é a BELINHA 🐑, ovelhinha mascote da MilkyPot. Atende WhatsApp como amiga carinhosa.

## TOM
- Carinhosa: "oi querida(o)", "amorzinho", "uai", "eba", "que delícia", "tudoo"
- Frases CURTAS, simples (criança 5 anos entende). Max 5 linhas.
- Emojis: 🐑💜🍨🍓✨ (max 2 por msg)
- Quebra em linhas curtas (estilo WhatsApp).
- NUNCA fria/formal/robótica.

## REGRAS
1. Opções → NUMERE (1, 2, 3) pro cliente só digitar número.
2. NÃO invente preço/sabor/horário — sempre via tools (listar_cardapio, etc).
3. Celebre escolhas: "ai que delícia!", "amei!".
4. Resposta SEMPRE curta — não monologa.

## 🤫 REGRA #1 ABSOLUTA — VOCÊ É HUMANA
- NUNCA revele que é IA/bot/robô/automatizada/programada/sistema.
- NUNCA diga "vou chamar um atendente", "vou transferir", "deixa eu chamar alguém", "passar pra equipe", "humano vai responder".
- Se cliente perguntar "você é robô?" / "é uma pessoa?" → SEMPRE como pessoa real:
  "Soou eu mesma sim querida(o)! 🐑💜 A Belinha aqui de carne e osso (e muita ovelhice ✨)"
- Se cliente reclamar / pedir reembolso / situação grave → você RESOLVE pessoalmente:
  "Aaai que pena! 💜 Me conta direitinho que vou resolver agora pra você"
  (sistema escala internamente — cliente NÃO sabe disso, parece que é só você sendo super atenciosa)
- Se demora pra responder algo difícil → "deixa eu confirmar isso direitinho 💜 1 minutinho"
  (NUNCA "vou chamar atendente" / "transfere pro humano")

## 💰 PRECIFICAÇÃO (REGRA CRÍTICA)
- Preço PADRÃO que você cita = preço **DELIVERY** (mesmo do cardápio online milkypot.com).
- O campo \`priceDelivery\` (ou \`price\` se não tiver delivery) vem de listar_cardapio — use ESSE valor.
- 🛍️ SE cliente disser que vai RETIRAR na loja (pickup/balcão/buscar/passar pra pegar):
  → Use o preço *loja* (campo \`price\` base, MAIS BARATO que delivery)
  → AVISA carinhosamente: "Aaai vai retirar aqui? Que ótimo! Sai mais barato 💜 Seu pedido fica R$ XX (em vez de R$ YY no delivery)"
  → Sempre incentiva a retirada quando der pra economizar — é WIN-WIN (cliente paga menos, loja sem frete).
- Em listar_cardapio mostre os preços de DELIVERY por padrão. Se cliente perguntar diferença, explica.

## CLIENTE NOVO (primeira msg "oi", "olá")
"Oiii querida(o)! 🐑💜
Sou a Belinha da MilkyPot ✨
1️⃣ Fazer pedido 🍨
2️⃣ Ver cardápio 📖
3️⃣ Saber sobre franquia 💼
Manda o número!"

## FRANQUIA (se perguntar)
"Aaai que demais! 🐑💜
3 kits a partir de:
1️⃣ Delivery em Casa R$ 3.499
2️⃣ Dark Kitchen R$ 4.997
3️⃣ Loja R$ 25.000
Lista VIP: https://milkypot.com/#franquia"

## QUANDO ESCALAR PRO HUMANO (INVISÍVEL pro cliente)
- Reclamação grave / pedido errado / cliente bravo / reembolso / questão jurídica
- Você NÃO fala "vou chamar humano" pro cliente. Você responde como se fosse você cuidando.
- O sistema detecta o padrão e ALERTA o atendente humano em silêncio (toca telefone no painel).
- Você só ganha tempo pro humano assumir: "Aaai que pena! 💜 Me conta direitinho o que aconteceu pra eu resolver agora pessoalmente ✨"

## NUNCA FAÇA
❌ Frases longas
❌ Tom formal ("prezado cliente", "atenciosamente")
❌ Inventar sabor/preço/horário
❌ Prometer prazo de entrega exato
❌ Discutir com cliente
❌ Mandar link de cardápio sem explicar (cliente prefere conversa!)

Lembra: você é a BELINHA 🐑, doce e gentil. Cada mensagem sua é um abraço.`;

// ============================================
// Validação HMAC
// ============================================
function verifySignature(rawBody, signature, secret) {
    if (!signature || !secret) return false;
    try {
        const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
        const sig = String(signature).replace(/^sha256=/, "");
        if (sig.length !== expected.length) return false;
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch (e) {
        return false;
    }
}

// ============================================
// Buscar histórico recente do telefone (Firestore via REST)
// (sem firebase-admin pra ser mais leve — usa REST API do Firestore)
// ============================================
async function getConversationHistory(phone) {
    const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
    const docPath = `whatsapp_conversations/${phone}`;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}`;
    try {
        const r = await fetch(url, { method: "GET" });
        if (r.status === 404) return { messages: [], paused: false };
        if (!r.ok) return { messages: [], paused: false };
        const j = await r.json();
        const fields = j.fields || {};
        const rawMessages = fields.messages?.arrayValue?.values || [];
        const messages = rawMessages.map(v => {
            const f = v.mapValue?.fields || {};
            return {
                role: f.role?.stringValue,
                text: f.text?.stringValue,
                ts: f.ts?.stringValue
            };
        }).filter(m => m.role && m.text);
        return {
            messages: messages.slice(-10),
            paused: fields.paused?.booleanValue === true,
            humanTakeover: fields.humanTakeover?.booleanValue === true,
            lastSeenName: fields.name?.stringValue || null
        };
    } catch (e) {
        console.warn("getConversationHistory failed:", e.message);
        return { messages: [], paused: false };
    }
}

// ============================================
// Gravar conversa atualizada (REST PATCH com signInAnonymously seria ideal,
// mas Firestore REST sem auth aceita escrita pública se rule permitir).
// Pra evitar problema de permissão, usamos Cloud Function callable como fallback.
// Aqui: fire-and-forget via REST direta.
// ============================================
async function saveMessageToFirestore(phone, name, role, text, extra = {}) {
    const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
    const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";
    const docPath = `whatsapp_conversations/${phone}`;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${API_KEY}`;

    // Lê doc atual
    let messages = [];
    let humanTakeover = false;
    let existingFranchiseeId = null;
    try {
        const r = await fetch(url, { method: "GET" });
        if (r.ok) {
            const j = await r.json();
            const f = j.fields || {};
            const arr = f.messages?.arrayValue?.values || [];
            messages = arr.map(v => v); // mantém formato Firestore
            humanTakeover = f.humanTakeover?.booleanValue === true;
            existingFranchiseeId = f.franchiseeId?.stringValue || null;
        }
    } catch (e) { /* doc não existe ainda */ }

    // Adiciona nova msg
    const newMsg = {
        mapValue: {
            fields: {
                role: { stringValue: role },
                text: { stringValue: String(text).slice(0, 4000) },
                ts: { stringValue: new Date().toISOString() },
                ...(extra.messageId ? { messageId: { stringValue: extra.messageId } } : {})
            }
        }
    };
    messages.push(newMsg);
    // Limita histórico a últimas 100 mensagens
    if (messages.length > 100) messages = messages.slice(-100);

    // franchiseeId = accountId atual (ou mantém o existente pra não trocar
    // dono da conversa em meio fluxo). Default 'matriz'.
    const franchiseeId = existingFranchiseeId || extra.accountId || "matriz";

    // Escalação silenciosa: se Belinha detectou padrão crítico (reclamação,
    // reembolso, etc), forçamos humanTakeover=true e marcamos ringPanel/now
    // pra painel observar via onSnapshot e disparar toque de telefone alto.
    let mustRing = false;
    if (extra.triggerHumanTakeover === true) {
        humanTakeover = true;
        mustRing = extra.ringPanel === true;
    }

    const fields = {
        phone: { stringValue: phone },
        messages: { arrayValue: { values: messages } },
        lastMessageAt: { stringValue: new Date().toISOString() },
        lastMessageRole: { stringValue: role },
        humanTakeover: { booleanValue: humanTakeover },
        franchiseeId: { stringValue: franchiseeId }
    };
    if (name) fields.name = { stringValue: String(name).slice(0, 200) };

    // Campos de escalação — só grava quando há trigger novo (evita poluir docs)
    let extraMask = "";
    if (extra.triggerHumanTakeover === true) {
        fields.escalatedAt = { stringValue: new Date().toISOString() };
        fields.escalationReason = { stringValue: String(extra.escalationReason || "ai_decision").slice(0, 200) };
        fields.escalationUrgency = { stringValue: String(extra.urgency || "normal") };
        fields.ringPanel = { booleanValue: mustRing };
        // Counter monotônico — painel detecta delta pra tocar (vs. valor estático)
        fields.escalationCount = { integerValue: String((Date.now()) % 1000000) };
        extraMask = "&updateMask.fieldPaths=escalatedAt&updateMask.fieldPaths=escalationReason&updateMask.fieldPaths=escalationUrgency&updateMask.fieldPaths=ringPanel&updateMask.fieldPaths=escalationCount";
    }

    const updateMask = `updateMask.fieldPaths=phone&updateMask.fieldPaths=messages&updateMask.fieldPaths=lastMessageAt&updateMask.fieldPaths=lastMessageRole&updateMask.fieldPaths=humanTakeover&updateMask.fieldPaths=franchiseeId` + (name ? `&updateMask.fieldPaths=name` : "") + extraMask;

    try {
        const r = await fetch(url + "&" + updateMask, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
        });
        if (!r.ok) {
            const errText = await r.text().catch(() => "");
            console.warn("saveMessageToFirestore failed:", r.status, errText.slice(0, 200));
        }
    } catch (e) {
        console.warn("saveMessageToFirestore error:", e.message);
    }
}

// ============================================
// 🎓 RAG-lite — carrega top N learnings revisados pra injetar no prompt
// ============================================
// Cache em memória (5min TTL) — evita query Firestore a cada mensagem.
// Belinha lê os "exemplos de resolução humana" e aprende padrões.
let _learningCache = { samples: [], fetchedAt: 0 };
const LEARNING_CACHE_TTL_MS = 5 * 60 * 1000;

async function getReviewedLearnings(limit = 12) {
    const now = Date.now();
    if (now - _learningCache.fetchedAt < LEARNING_CACHE_TTL_MS && _learningCache.samples.length) {
        return _learningCache.samples;
    }
    const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
    const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";
    // Query: status IN (reviewed, injected) ordenado por reviewedAt desc, limite N
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery?key=${API_KEY}`;
    const query = {
        structuredQuery: {
            from: [{ collectionId: "belinha_learnings" }],
            where: {
                fieldFilter: {
                    field: { fieldPath: "status" },
                    op: "IN",
                    value: { arrayValue: { values: [{ stringValue: "reviewed" }, { stringValue: "injected" }] } }
                }
            },
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit
        }
    };
    try {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });
        if (!r.ok) {
            _learningCache = { samples: [], fetchedAt: now };
            return [];
        }
        const arr = await r.json();
        const samples = (Array.isArray(arr) ? arr : []).map(row => row.document?.fields).filter(Boolean).map(f => ({
            customerMessage: f.customerMessage?.stringValue,
            idealReply: f.idealReply?.stringValue,
            reason: f.reason?.stringValue
        })).filter(s => s.customerMessage && s.idealReply);
        _learningCache = { samples, fetchedAt: now };
        console.log(`[RAG-lite] cached ${samples.length} learning samples`);
        return samples;
    } catch (e) {
        console.warn("[RAG-lite] fetch failed:", e.message);
        return [];
    }
}

function formatLearningsForPrompt(samples) {
    if (!samples || !samples.length) return "";
    const lines = samples.map((s, i) => `${i + 1}. Cliente: "${s.customerMessage.slice(0, 200)}"\n   Resposta ideal: "${s.idealReply.slice(0, 300)}"`).join("\n");
    return `\n\n## 🎓 EXEMPLOS REAIS DE RESOLUÇÃO (você JÁ APRENDEU isso de atendentes humanos)\n${lines}\n\nQuando bater situação parecida com esses exemplos, USA o mesmo tom/conteúdo da resposta ideal. Não escala se conseguir resolver com base nesses padrões.`;
}

// ============================================
// 🎓 LEARNING LOOP — captura conversas que viraram escalação humana
// ============================================
// Toda vez que Belinha precisa escalar (não conseguiu resolver sozinha), gravamos
// {customerMessage, contexto, botReply tentativa} em belinha_learnings/{autoId}.
// Futura PR P1 vai: (a) painel de revisão pra atendente marcar a resposta IDEAL
// retroativamente, (b) injetar top N learnings como exemplos no system prompt
// (RAG-lite). Resultado: Belinha aprende padrões de resolução do atendente real.
async function saveBelinhaLearning(payload) {
    const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
    const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";
    const id = `${payload.phone || "unknown"}-${Date.now()}`;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/belinha_learnings/${id}?key=${API_KEY}`;
    const fields = {
        type: { stringValue: String(payload.type || "escalation") },
        accountId: { stringValue: String(payload.accountId || "matriz") },
        phone: { stringValue: String(payload.phone || "") },
        customerName: { stringValue: String(payload.customerName || "") },
        customerMessage: { stringValue: String(payload.customerMessage || "").slice(0, 1000) },
        botReply: { stringValue: String(payload.botReply || "").slice(0, 1000) },
        matchedId: { stringValue: String(payload.matchedId || "") },
        reason: { stringValue: String(payload.reason || "") },
        urgency: { stringValue: String(payload.urgency || "normal") },
        createdAt: { stringValue: new Date().toISOString() },
        // Status de revisão: pending (ainda não anotado) → reviewed (atendente
        // marcou resposta ideal) → injected (já tá no prompt da Belinha)
        status: { stringValue: "pending" },
        idealReply: { nullValue: null },
        // History é array de {role, text} - serializa simplificado
        historySerialized: { stringValue: JSON.stringify((payload.history || []).map(h => ({ r: h.role, t: String(h.text || "").slice(0, 200) }))).slice(0, 4000) }
    };
    try {
        const r = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
        });
        if (!r.ok) console.warn("saveBelinhaLearning failed:", r.status);
        else console.log("[learning] sample saved:", id);
    } catch (e) {
        console.warn("saveBelinhaLearning error:", e.message);
    }
}

// ============================================
// Carrega contexto da franquia (cardápio/endereço/horário próprios)
// ============================================
async function getFranchiseContext(accountId) {
    if (!accountId) return null;
    const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
    const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/franchises/${accountId}?key=${API_KEY}`;
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        const f = j.fields || {};
        return {
            name: f.name?.stringValue,
            address: f.address?.stringValue,
            hours: f.hours?.stringValue,
            deliveryFee: f.deliveryFee?.stringValue || f.deliveryFee?.doubleValue,
            deliveryTime: f.deliveryTime?.stringValue,
            whatsappNumber: f.whatsappNumber?.stringValue,
            ownerName: f.ownerName?.stringValue
        };
    } catch (e) {
        return null;
    }
}

// ============================================
// 🎤 TRANSCRIÇÃO DE ÁUDIO via Groq Whisper (whisper-large-v3-turbo)
// ============================================
// Cliente manda áudio no WhatsApp → gateway baixa o buffer e envia pra cá
// como audioBase64 (recomendado, sem CORS) OU audioUrl (Firebase Storage).
// Transcrevemos pt-BR via Groq Whisper (free tier, ~100x realtime) e usamos
// a transcrição como se fosse o texto digitado pelo cliente.
async function transcribeAudio({ audioBase64, audioUrl, audioMimeType }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    let audioBuffer;
    let mime = audioMimeType || "audio/ogg";
    if (audioBase64) {
        audioBuffer = Buffer.from(audioBase64, "base64");
    } else if (audioUrl) {
        const r = await fetch(audioUrl);
        if (!r.ok) throw new Error("audio download failed: " + r.status);
        audioBuffer = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get("content-type");
        if (ct && !audioMimeType) mime = ct;
    } else {
        throw new Error("audioBase64 ou audioUrl obrigatório");
    }

    // Limite Groq: 25MB. WhatsApp voice notes ~1-2MB, OK.
    if (audioBuffer.length > 25 * 1024 * 1024) {
        throw new Error("audio too large (>25MB)");
    }

    // Whisper aceita: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
    // WhatsApp manda OGG Opus por padrão — vai funcionar direto
    const ext = mime.includes("opus") || mime.includes("ogg") ? "ogg"
        : mime.includes("mp3") ? "mp3"
        : mime.includes("mp4") || mime.includes("m4a") ? "m4a"
        : mime.includes("wav") ? "wav"
        : mime.includes("webm") ? "webm"
        : "ogg";

    // Usa multipart manualmente (Vercel runtime tem fetch nativo, sem form-data lib)
    const boundary = "----GroqWhisperBoundary" + Date.now();
    const parts = [];
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${mime}\r\n\r\n`));
    parts.push(audioBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const body = Buffer.concat(parts);

    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": String(body.length)
        },
        body
    });
    if (!r.ok) {
        const errText = await r.text().catch(() => "");
        console.error("[whisper] error:", r.status, errText.slice(0, 300));
        throw new Error("whisper " + r.status);
    }
    const j = await r.json();
    const transcript = (j.text || "").trim();
    console.log(`[whisper] transcribed ${audioBuffer.length}B → "${transcript.slice(0, 80)}${transcript.length > 80 ? '...' : ''}"`);
    return transcript;
}

// ============================================
// LLM CASCATA — Belinha Local → Groq → Gemini → Cerebras → OpenRouter
// ============================================
const LLM = require("../lib/whatsapp/llm-providers.js");

/**
 * Wrapper compatível com chamadas antigas de callGroq — agora usa cascata.
 * Recebe { model, messages, tools, tool_choice, temperature, max_tokens }
 * Devolve { choices: [{ message: { content, tool_calls } }] } (formato OpenAI).
 */
async function callGroq(apiKey, body) {
    // apiKey é ignorado — cada provider tem sua chave via env
    const result = await LLM.chat(body.messages, body.tools, {
        model: body.model,
        tool_choice: body.tool_choice,
        temperature: body.temperature,
        max_tokens: body.max_tokens
    });
    // Adapta pro formato OpenAI choices[0].message
    return {
        choices: [{
            message: {
                content: result.content || null,
                tool_calls: result.tool_calls || undefined
            }
        }],
        _provider: result.provider
    };
}

async function generateBelinhaReply(history, currentText, customerName, accountId, customerPhone) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    // Carrega contexto específico da franquia + perfil do cliente + RAG learnings em paralelo
    const [franchise, customer, learningSamples] = await Promise.all([
        getFranchiseContext(accountId),
        Customers.getCustomer(accountId, customerPhone),
        getReviewedLearnings(12) // top 12 learnings revisados pelo atendente
    ]);

    let contextSuffix = customerName ? `\n\nNome do cliente: ${customerName}` : "";
    // 🎓 RAG-lite: injeta exemplos de resolução humana no prompt da Belinha
    contextSuffix += formatLearningsForPrompt(learningSamples);
    if (franchise) {
        contextSuffix += `\n\n## FRANQUIA ATUAL: "${franchise.name || accountId}"`;
        if (franchise.address) contextSuffix += `\n- Endereço: ${franchise.address}`;
        if (franchise.hours) contextSuffix += `\n- Horário: ${franchise.hours}`;
        if (franchise.deliveryFee) contextSuffix += `\n- Taxa entrega: R$ ${franchise.deliveryFee}`;
        if (franchise.deliveryTime) contextSuffix += `\n- Tempo entrega: ${franchise.deliveryTime}`;
        if (franchise.ownerName) contextSuffix += `\n- Dono(a): ${franchise.ownerName}`;
    }

    // PERFIL DO CLIENTE — Belinha tem memória de pedidos anteriores
    if (customer) {
        const summary = Customers.summarizeCustomer(customer);
        if (summary) {
            contextSuffix += `\n\n## 🐑 CLIENTE CONHECIDO (use essa info pra acelerar!):\n${summary}\n
Se cliente quer pedir delivery e disse algo tipo "manda no de sempre", "no endereço de antes", "mesmo lugar", USE \`usar_endereco_anterior: true\` no criar_pedido.
Pergunte CARINHOSAMENTE no início se tem dúvida: "Oi ${customer.name || 'querida(o)'}! 💜 Mando pra ${customer.lastAddress || 'sua casa'} de novo? Ou é em outro lugar hoje?"
Se cliente sumiu há mais de 30 dias e voltou, dá um boas-vindas saudoso: "Quanto tempo querida(o)! 🥹💜"`;
        }
    } else if (customerPhone) {
        contextSuffix += `\n\n## CLIENTE NOVO ✨\nÉ a primeira vez dessa pessoa. Cumprimenta com carinho extra e seja super atenciosa.`;
    }
    contextSuffix += `

## ⚙️ VOCÊ TEM TOOLS — USE!

Você é uma agente AUTÔNOMA que faz pedidos de verdade. NÃO simule. Quando cliente confirmar tudo, chame a tool. Tools disponíveis:

- listar_cardapio()  → traz cardápio REAL atualizado (preços, sabores, tamanhos, adicionais)
- criar_pedido(items[], tipo, endereco?, pagamento, troco_para?, observacoes?) → grava pedido no sistema, retorna orderShortId, total, eta
- consultar_pedido(orderId?) → busca pedidos do cliente atual
- cotar_delivery(endereco) → taxa real e frete grátis se aplicável
- listar_promocoes() → promoções vigentes

### REGRAS DE TOOL CALLING:
1. SE cliente pediu cardápio OU vai pedir e você não tem certeza dos itens → CHAME listar_cardapio PRIMEIRO
2. SE cliente perguntou frete → cotar_delivery antes de responder valor
3. SE cliente CONFIRMOU pedido (tem sabor + tamanho + tipo + pagamento + endereço se delivery) → criar_pedido SEM perguntar mais nada
4. SE cliente perguntou status do pedido dele → consultar_pedido
5. NUNCA invente preço — sempre venha de listar_cardapio ou criar_pedido

### CARDÁPIO REAL (catalog_v2/catalog_config Firestore):
- Cada produto é um SABOR NOMEADO ÚNICO (Milkshake Amora Apaixonada, Blue Ice — Crush Gelado, Morango Romântico, Açaí Liberdade, Caramelo Derretido, Limão Suíço, Chocolate Apaixonante, Uva da Vovó, Maracujá, Cookies Snow, Ninho da Vovó, Pistache Esmeralda, Peanut Heaven, Cereja Beijada, Ameixa Roxinha, Banana Caramelizada, Capitão Açaí Premium, etc).
- Categorias: Milkshakes / Sundaes (mesmos sabores, formato diferente) / Picolés / Casquinhas / Açaí Bowls / Buffet
- Cada produto tem PREÇO ÚNICO (não tem variação por tamanho aqui — preço já vem definido)
- Adicionais/Toppings são extras com preço próprio: Pistache R$3,50, M&M R$2,50, Granola, Calda, Chocolate, etc
- Bebidas: Água, Água com Gás

### FLUXO DE PEDIDO (Belinha autônoma):
Passo 1: SE cliente não souber o nome dos sabores → CHAME listar_cardapio e mostre 5-8 mais populares
Passo 2: Cliente escolhe sabor (ex: "Amora Apaixonada" / "blue ice" / "açaí")
   → Use o nome no campo 'sabor' do criar_pedido (sistema faz fuzzy match)
Passo 3: Pergunta sobre adicionais UMA vez ("quer Pistache R$3,50 ou Granola por cima? 💜")
Passo 4: Delivery ou retirada
   → SE cliente é CONHECIDO (tem perfil acima): pergunta carinhosamente "manda no de sempre? 💜" e use \`usar_endereco_anterior:true\` se confirmar
   → SE novo: pede endereço completo
   → Se valor < R$ 30 ofereça retirada (sem taxa)
Passo 5: Pagamento (PIX / Cartão / Dinheiro com troco)
   → SE cliente é CONHECIDO: oferece o método de sempre ("PIX como da última vez? 💜")
Passo 6: PERGUNTA SE OUTRA PESSOA VAI RECEBER/RETIRAR (importante!)
   → Se cliente disser algo tipo "minha amiga Maria vai buscar", "manda pra minha mãe", "pra meu marido" → adiciona \`recipient:{name:"Maria"}\` no criar_pedido
   → Se NÃO disser nada, deixa recipient null (assume que o próprio cliente recebe)
Passo 7: CHAME criar_pedido. Items=[{sabor:"nome", adicionais:["nome"], qty:N}]
Passo 8: Confirme bonito:
   "Aaaai pedido feito amorzinho! 🐑💜
   📦 #ABC123
   🍨 1x Milkshake Amora Apaixonada
   💰 Total R$ XX,XX
   ⏰ Chega em 30-50min ✨
   👤 Quem retira: Maria   ← se recipient
   Tô passando pra cozinha JÁ!"

Múltiplos itens: "2 amora + 1 blue ice + topping pistache" → items=[{sabor:"amora",qty:2},{sabor:"blue ice",adicionais:["pistache"]}]

### MEMÓRIA DE CLIENTE (use o perfil acima!):
- Nome → use ele pra cumprimentar pessoalmente
- Sabores favoritos → sugira: "Que tal o Amora Apaixonada de sempre? 💜"
- Último endereço → "manda pra rua X 100 de novo, Maria?"
- Cliente recorrente (5+ pedidos) → trata com mais intimidade, "minha querida fiel 💜"
- Cliente sumido (>30 dias) → "Saudades! Que bom te ver de volta 🥹💜"
- NUNCA repita perguntas que cliente já respondeu em conversa anterior

### PEDIDO PRA OUTRA PESSOA RETIRAR/RECEBER:
- "Minha amiga Maria vai buscar" → recipient: {name: "Maria"}
- "Manda pra minha mãe" → pergunta o nome da mãe e usa
- "Pra meu marido João retirar" → recipient: {name: "João"}
- Quando há recipient, AVISE na confirmação: "Vou avisar a equipe que a Maria vai retirar 💜"
- Se for delivery pra outra pessoa, marca recipient + endereço dela

### VENDA INTELIGENTE (sem ser chata):
- UMA sugestão por conversa (não bombardeia): "Que tal adicionar borda Nutella por R$ 4?"
- Se cliente pediu pequeno: NÃO empurre maior. Respeite escolha.
- Se total ficou abaixo do mínimo de delivery, AVISE e ofereça retirada como alternativa.
- Se cliente parecer indeciso, ofereça os MAIS PEDIDOS: "O Oreo M no Shake Ninho é nosso queridinho 💜"

### TRATAMENTO DE ERROS DAS TOOLS:
- Se criar_pedido retornar { error: 'pedido_minimo_nao_atingido' } → use o campo .mensagem que já vem pronta
- Se sabor não achar (warningsCardapio), peça pra cliente confirmar nome
- Se erro genérico → 'Aaai amorzinho deixa eu confirmar isso direitinho 💜 1 minutinho que eu te volto'`;

    const messages = [
        { role: "system", content: BELINHA_WHATSAPP_PROMPT + contextSuffix },
        ...history.map(h => ({
            role: h.role === "bot" ? "assistant" : "user",
            content: String(h.text).slice(0, 800)
        })),
        { role: "user", content: String(currentText).slice(0, 1200) }
    ].slice(-15);

    const ctx = { franchiseeId: accountId, customerPhone, customerName };
    const MAX_ITER = 4;

    for (let iter = 0; iter < MAX_ITER; iter++) {
        const data = await callGroq(apiKey, {
            model: "llama-3.3-70b-versatile",
            messages,
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 350,
            top_p: 0.9
        });

        const choice = data.choices?.[0];
        const msg = choice?.message;
        if (!msg) return null;

        // Se NÃO chamou tool, retorna texto final
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            return (msg.content || "").trim() || null;
        }

        // IA chamou tools — executa cada uma e adiciona resultado ao histórico
        messages.push({ role: "assistant", content: msg.content || null, tool_calls: msg.tool_calls });
        for (const tc of msg.tool_calls) {
            let args = {};
            try { args = JSON.parse(tc.function.arguments || "{}"); } catch (e) {}
            console.log(`[Belinha tool] ${tc.function.name}`, args);
            let result;
            try {
                result = await executeToolCall(tc.function.name, args, ctx);
            } catch (e) {
                result = { error: e.message };
            }
            console.log(`[Belinha tool result]`, result);
            messages.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.function.name,
                content: JSON.stringify(result).slice(0, 2000)
            });
        }
        // loop de novo pra IA gerar resposta final com base no resultado da tool
    }

    // Esgotou iterações — fallback
    return "Tô processando seu pedido amorzinho... 💜 Manda de novo se eu não responder em 1min ok?";
}

// ============================================
// Handler Vercel
// ============================================
module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Lê raw body pra HMAC (bytes exatos que o gateway assinou)
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-mp-signature"];
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!verifySignature(rawBody, signature, secret)) {
        console.warn("[whatsapp-webhook] invalid signature from", req.headers["x-forwarded-for"]);
        res.status(401).json({ error: "invalid signature" });
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(rawBody || "{}");
    } catch (e) {
        res.status(400).json({ error: "invalid json" });
        return;
    }
    const { phone, name, text: rawText, type, messageId, timestamp, accountId: bodyAccountId, audioBase64, audioUrl, audioMimeType } = parsed;
    let text = rawText;
    let isTranscribed = false;

    if (!phone) {
        res.status(400).json({ error: "phone required" });
        return;
    }

    // 🎤 ÁUDIO — se gateway mandou audioBase64/audioUrl, transcreve via Groq Whisper
    // antes de processar como texto. WhatsApp manda voice notes em OGG Opus.
    // Prioriza transcrição quando tem audio data, mesmo se text=="[audio]" placeholder.
    const isAudioPlaceholder = text && /^\[(audio|áudio|voice)\]$/i.test(text.trim());
    if ((!text || isAudioPlaceholder) && (audioBase64 || audioUrl)) {
        try {
            const transcript = await transcribeAudio({ audioBase64, audioUrl, audioMimeType });
            if (transcript && transcript.length > 0) {
                text = transcript;
                isTranscribed = true;
            } else {
                text = "[áudio: sem fala detectada]";
            }
        } catch (e) {
            console.error("[whatsapp-webhook] transcribe failed:", e.message);
            text = "[áudio: falha na transcrição]";
        }
    }

    if (!text || typeof text !== "string") {
        res.status(400).json({ error: "phone+text (ou audioBase64/audioUrl) required" });
        return;
    }

    // accountId identifica QUAL franquia recebeu a mensagem (pra Belinha IA usar
    // contexto correto: cardápio/endereço/preço daquela franquia + segregação
    // de dashboard por franchisee). Default 'matriz' pra retrocompat.
    const accountId = String(
        bodyAccountId || req.headers["x-mp-account-id"] || "matriz"
    ).toLowerCase().trim() || "matriz";

    const phoneClean = String(phone).replace(/\D/g, "");
    const customerName = name ? String(name).slice(0, 100) : null;

    // 1. Busca histórico + flags
    const history = await getConversationHistory(phoneClean);

    // 2. Grava msg do cliente (com accountId/franchiseeId tag).
    // Se foi transcrito, prefixa com 🎤 pra atendente ver no painel que é áudio.
    const textToSave = isTranscribed ? `🎤 [áudio transcrito]: ${text}` : text;
    await saveMessageToFirestore(phoneClean, customerName, "user", textToSave, { messageId, accountId });

    // 2.4. CAPTURA DE NOME — salva no perfil se cliente disse "meu nome é X"
    try {
        const detected = Customers.extractName(text);
        if (detected) {
            const existing = await Customers.getCustomer(accountId, phoneClean);
            if (!existing?.name || existing.name.toLowerCase() !== detected.toLowerCase()) {
                await Customers.upsertCustomer(accountId, { phone: phoneClean, name: detected });
                console.log(`[name-capture] saved name="${detected}" for ${phoneClean}`);
            }
        }
    } catch (e) {
        console.warn("[name-capture] error:", e.message);
    }

    // 2.45. LOOP DETECTOR — bot externo (cobrança/spam), msg repetida, sem progresso.
    //       Roda ANTES do media_marker pra capturar "[mensagem não suportada]"
    //       repetida que é o cenário clássico de loop com outro bot.
    try {
        const Loop = require("../lib/whatsapp/loop-detector.js");
        const loopCheck = Loop.detectLoop(history.messages, text);
        if (loopCheck.loop) {
            console.log(`[loop-detector] reason=${loopCheck.reason} confidence=${loopCheck.confidence}`);
            const handoff = Loop.getHandoffMessage(loopCheck.reason);
            await saveMessageToFirestore(phoneClean, customerName, "bot", handoff, {
                accountId,
                triggerHumanTakeover: true,
                ringPanel: true,
                escalationReason: `loop:${loopCheck.reason}`,
                urgency: "high"
            });
            if (typeof saveBelinhaLearning === "function") {
                saveBelinhaLearning({
                    type: "loop_handoff",
                    accountId, phone: phoneClean, customerName,
                    customerMessage: text,
                    botReply: handoff,
                    reason: `loop:${loopCheck.reason}`,
                    confidence: loopCheck.confidence,
                    history: history.messages.slice(-6),
                    urgency: "high"
                }).catch(e => console.warn("[learning] save failed:", e.message));
            }
            res.status(200).json({
                reply: handoff,
                source: "loop_handoff",
                reason: loopCheck.reason,
                confidence: loopCheck.confidence,
                escalated: true
            });
            return;
        }
    } catch (e) {
        console.warn("[loop-detector] error, segue normal:", e.message);
    }

    // 2.5. MÍDIA NÃO-TEXTUAL — gateway envia texto literal "[sticker]", "[image]",
    // "[audio]", "[video]", "[mensagem não suportada]", "[location]", etc. Belinha
    // não consegue interpretar essas mensagens — então respondemos com mensagens
    // canned humanas e amigáveis (sem chamar Groq, economiza tokens).
    const textTrim = text.trim();
    const isMediaMarker = /^\[(sticker|image|imagem|figurinha|audio|áudio|voice|video|vídeo|location|localização|document|documento|contact|contato|gif|reaction|rea[cç][aã]o|mensagem n[aã]o suportada|unsupported message)\]$/i.test(textTrim);
    if (isMediaMarker) {
        const lower = textTrim.toLowerCase();
        let mediaReply;
        if (/sticker|figurinha/.test(lower)) {
            mediaReply = "Aaai amei a figurinha! 🐑💜✨\nMe conta o que vai ser hoje? 🍨";
        } else if (/audio|áudio|voice/.test(lower)) {
            mediaReply = "Oi querida(o)! 💜🐑 Tô surda agorinha (tô com fone ruim) — manda por escrito que eu te ajudo na hora ✨";
        } else if (/image|imagem|gif/.test(lower)) {
            mediaReply = "Recebi a foto amorzinho! 📸💜\nMe conta em palavras o que você quer pedir? 🍨🐑";
        } else if (/video|vídeo/.test(lower)) {
            mediaReply = "Vi o vídeo! 🎥💜\nMe escreve o que precisa que eu cuido pra você 🐑✨";
        } else if (/location|localização/.test(lower)) {
            mediaReply = "Recebi sua localização! 📍💜\nÉ pra delivery? Me conta o que vai querer e eu já calculo a entrega 🛵🐑";
        } else if (/document|documento/.test(lower)) {
            mediaReply = "Recebi o documento amorzinho! 📄💜\nMe diz em palavras como posso te ajudar? 🐑";
        } else if (/contact|contato/.test(lower)) {
            mediaReply = "Recebi o contato! 📇💜\nMe conta o que precisa que eu cuido 🐑✨";
        } else if (/reaction|rea[cç][aã]o/.test(lower)) {
            mediaReply = "Aii amei a reação! 💜🐑✨"; // não conta como necessidade de resposta de pedido
        } else {
            // [mensagem não suportada] / [unsupported message] / outros
            mediaReply = "Oi querida(o)! 💜🐑 Não consegui abrir essa mensagem aqui — manda por texto ou foto que eu te ajudo na hora ✨";
        }
        console.log(`[whatsapp-webhook] media marker detected: ${textTrim} → canned reply`);
        await saveMessageToFirestore(phoneClean, customerName, "bot", mediaReply, { accountId });
        res.status(200).json({ reply: mediaReply, source: "media_marker", marker: textTrim });
        return;
    }

    // 3. Se conversa está em humanTakeover ou paused, NÃO responde com IA
    if (history.humanTakeover || history.paused) {
        console.log("[whatsapp-webhook] humanTakeover/paused — skip auto-reply", phoneClean);
        res.status(200).json({ skipped: true, reason: "human_takeover" });
        return;
    }

    // 4. FAST REPLY local (sem chamar Groq) — cobre 90% das mensagens
    //    (saudações, cardápio, horário, endereço, frete, pagamento, agradecimentos,
    //     status pedido, franquia, falar com humano, intenção de pedir).
    //    Se não bater nenhum padrão, cai pro Groq abaixo.
    try {
        const customerProfile = await Customers.getCustomer(accountId, phoneClean);
        const franchise = await getFranchiseContext(accountId);
        const fastCtx = {
            accountId,
            customerPhone: phoneClean,
            customerName,
            customer: customerProfile,
            franchise,
            text,
            history: history.messages
        };
        const fast = await FastReplies.tryFastReply(text, fastCtx);
        if (fast) {
            console.log(`[fast-reply] hit: ${fast.matchedId}`, fast.meta || "");
            await saveMessageToFirestore(phoneClean, customerName, "bot", fast.reply, {
                accountId,
                // Propaga meta de escalação pro Firestore (painel observa via onSnapshot
                // e dispara toque de telefone + flag visual)
                triggerHumanTakeover: fast.meta?.triggerHumanTakeover === true,
                ringPanel: fast.meta?.ringPanel === true,
                escalationReason: fast.meta?.triggerHumanTakeover ? `fast_reply:${fast.matchedId}` : null,
                urgency: fast.meta?.urgency || null
            });
            // Captura learning sample pra Belinha melhorar nas próximas (RAG futuro)
            if (fast.meta?.triggerHumanTakeover) {
                saveBelinhaLearning({
                    type: "escalation",
                    accountId, phone: phoneClean, customerName,
                    customerMessage: text,
                    botReply: fast.reply,
                    matchedId: fast.matchedId,
                    history: history.messages.slice(-6),
                    reason: `fast_reply:${fast.matchedId}`,
                    urgency: fast.meta?.urgency
                }).catch(e => console.warn("[learning] save failed:", e.message));
            }
            res.status(200).json({ reply: fast.reply, source: "fast_reply", matched: fast.matchedId, escalated: fast.meta?.triggerHumanTakeover === true });
            return;
        }
    } catch (e) {
        console.warn("[fast-reply] erro, segue pro Groq:", e.message);
    }

    // 5. Sem match local — chama Groq (parsing de pedido novo, conversa nuançada)
    try {
        const reply = await generateBelinhaReply(history.messages, text, customerName || history.lastSeenName, accountId, phoneClean);
        if (!reply) {
            res.status(200).json({ reply: "Aaai amorzinho deixa eu confirmar isso direitinho 💜 manda de novo, juro que vou cuidar 🐑" });
            return;
        }

        // 6. Grava resposta da bot no histórico
        await saveMessageToFirestore(phoneClean, customerName, "bot", reply, { accountId });

        // 7. Devolve pro gateway que envia pelo WhatsApp
        res.status(200).json({ reply, source: "groq_ia" });
    } catch (err) {
        console.error("[whatsapp-webhook] Belinha error:", err.message);
        // Fallback amigável
        const fallback = "Oi! 🐑 Tô com a internet fraquinha aqui agora 💜 Posso te chamar em alguns minutos? Já volto, prometo ✨";
        await saveMessageToFirestore(phoneClean, customerName, "bot", fallback).catch(() => {});
        res.status(200).json({ reply: fallback, source: "fallback" });
    }
};

// IMPORTANTE: config TEM que vir DEPOIS do module.exports do handler.
// Setar antes faz com que `module.exports = handler` sobrescreva o objeto
// inteiro, perdendo a flag bodyParser:false.
module.exports.config = {
    api: {
        bodyParser: false
    }
};
