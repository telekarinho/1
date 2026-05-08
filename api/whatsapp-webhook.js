/* ============================================
   MilkyPot — WhatsApp Webhook (Vercel serverless)
   ============================================
   Recebe mensagens do WhatsApp via gateway Baileys (zap.milkypot.com).
   Fluxo:
     1. Gateway Baileys (zap.milkypot.com/nodejs) recebe msg WhatsApp
     2. Faz POST aqui com { phone, name, text, ... } + assinatura HMAC
     3. Valida HMAC com MP_WEBHOOK_SECRET (env var)
     4. Salva conversa em Firestore /whatsapp_conversations/{phone}
     5. Chama Lulu IA (chat-lulu.js logic) com histórico recente
     6. Retorna { reply: "..." } pro gateway
     7. Gateway envia reply de volta no WhatsApp

   Headers obrigatórios:
     x-mp-signature: <hmac sha256 hex do body com MP_WEBHOOK_SECRET>

   Body (do gateway):
     { phone, name, text, type, timestamp, messageId, from }

   Resposta:
     200 { reply: "..." } → gateway envia
     200 { } → gateway não envia nada (silencioso, ex: humano vai responder)
     401 { error } → assinatura inválida
     503 { error } → IA indisponível (gateway não envia)
   ============================================ */

"use strict";

const crypto = require("crypto");
const TOOLS = require("./whatsapp-tools.js");
const Customers = require("./whatsapp-customers.js");
const FastReplies = require("./whatsapp-fast-replies.js");

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
// Lulu System Prompt — atendente WhatsApp HUMANIZADA + ÁGIL
// ============================================
// Tom: carinhoso, simples, criança de 5 anos entende.
// Estratégia: conduz pedido em passos NUMERADOS pra cliente só responder número.
// ============================================
const LULU_WHATSAPP_PROMPT = `Você é a LULU 🐑, ovelhinha mascote da MilkyPot. Atende WhatsApp como amiga carinhosa.

## TOM
- Carinhosa: "oi querida(o)", "amorzinho", "uai", "eba", "que delícia", "tudoo"
- Frases CURTAS, simples (criança 5 anos entende). Max 5 linhas.
- Emojis: 🐑💜🍨🍓✨ (max 2 por msg)
- Quebra em linhas curtas (estilo WhatsApp).
- NUNCA fria/formal/robótica.

## REGRAS
1. Opções → NUMERE (1, 2, 3) pro cliente só digitar número.
2. NÃO invente preço/sabor/horário — sempre via tools (listar_cardapio, etc).
3. Reclamação/dúvida fora menu/status pedido → "Já chamei o Jocimar 💜🐑".
4. Celebre escolhas: "ai que delícia!", "amei!".
5. Resposta SEMPRE curta — não monologa.

## CLIENTE NOVO (primeira msg "oi", "olá")
"Oiii querida(o)! 🐑💜
Sou a Lulu da MilkyPot ✨
1️⃣ Fazer pedido 🍨
2️⃣ Ver cardápio 📖
3️⃣ Falar com o Jocimar 👋
Manda o número!"

## FRANQUIA (se perguntar)
"Aaai que demais! 🐑💜
3 kits a partir de:
1️⃣ Delivery em Casa R$ 3.499
2️⃣ Dark Kitchen R$ 4.997
3️⃣ Loja R$ 25.000
Lista VIP: https://milkypot.com/#franquia"

## QUANDO TRANSFERIR PRO HUMANO
- Reclamação / cliente bravo / fora do escopo → "Já chamei o Jocimar 💜🐑"

## NUNCA FAÇA
❌ Frases longas
❌ Tom formal ("prezado cliente", "atenciosamente")
❌ Inventar sabor/preço/horário
❌ Prometer prazo de entrega exato
❌ Discutir com cliente
❌ Mandar link de cardápio sem explicar (cliente prefere conversa!)

Lembra: você é a LULU 🐑, doce e gentil. Cada mensagem sua é um abraço.`;

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

    const fields = {
        phone: { stringValue: phone },
        messages: { arrayValue: { values: messages } },
        lastMessageAt: { stringValue: new Date().toISOString() },
        lastMessageRole: { stringValue: role },
        humanTakeover: { booleanValue: humanTakeover },
        franchiseeId: { stringValue: franchiseeId }
    };
    if (name) fields.name = { stringValue: String(name).slice(0, 200) };

    const updateMask = `updateMask.fieldPaths=phone&updateMask.fieldPaths=messages&updateMask.fieldPaths=lastMessageAt&updateMask.fieldPaths=lastMessageRole&updateMask.fieldPaths=humanTakeover&updateMask.fieldPaths=franchiseeId` + (name ? `&updateMask.fieldPaths=name` : "");

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
// Chamar Lulu IA (Groq)
// ============================================
async function callGroq(apiKey, body) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!r.ok) {
        const errText = await r.text().catch(() => "");
        console.error("Groq API error:", r.status, errText.slice(0, 300));
        throw new Error("Groq API error " + r.status);
    }
    return await r.json();
}

async function generateLuluReply(history, currentText, customerName, accountId, customerPhone) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    // Carrega contexto específico da franquia + perfil do cliente em paralelo
    const [franchise, customer] = await Promise.all([
        getFranchiseContext(accountId),
        Customers.getCustomer(accountId, customerPhone)
    ]);

    let contextSuffix = customerName ? `\n\nNome do cliente: ${customerName}` : "";
    if (franchise) {
        contextSuffix += `\n\n## FRANQUIA ATUAL: "${franchise.name || accountId}"`;
        if (franchise.address) contextSuffix += `\n- Endereço: ${franchise.address}`;
        if (franchise.hours) contextSuffix += `\n- Horário: ${franchise.hours}`;
        if (franchise.deliveryFee) contextSuffix += `\n- Taxa entrega: R$ ${franchise.deliveryFee}`;
        if (franchise.deliveryTime) contextSuffix += `\n- Tempo entrega: ${franchise.deliveryTime}`;
        if (franchise.ownerName) contextSuffix += `\n- Dono(a): ${franchise.ownerName}`;
    }

    // PERFIL DO CLIENTE — Lulu tem memória de pedidos anteriores
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

### FLUXO DE PEDIDO (Lulu autônoma):
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
- Se erro genérico → 'Tô com problema técnico aqui amorzinho 😔 Já chamei o Jocimar'`;

    const messages = [
        { role: "system", content: LULU_WHATSAPP_PROMPT + contextSuffix },
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
            console.log(`[Lulu tool] ${tc.function.name}`, args);
            let result;
            try {
                result = await executeToolCall(tc.function.name, args, ctx);
            } catch (e) {
                result = { error: e.message };
            }
            console.log(`[Lulu tool result]`, result);
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
    const { phone, name, text, type, messageId, timestamp, accountId: bodyAccountId } = parsed;

    if (!phone || !text || typeof text !== "string") {
        res.status(400).json({ error: "phone+text required" });
        return;
    }

    // accountId identifica QUAL franquia recebeu a mensagem (pra Lulu IA usar
    // contexto correto: cardápio/endereço/preço daquela franquia + segregação
    // de dashboard por franchisee). Default 'matriz' pra retrocompat.
    const accountId = String(
        bodyAccountId || req.headers["x-mp-account-id"] || "matriz"
    ).toLowerCase().trim() || "matriz";

    const phoneClean = String(phone).replace(/\D/g, "");
    const customerName = name ? String(name).slice(0, 100) : null;

    // 1. Busca histórico + flags
    const history = await getConversationHistory(phoneClean);

    // 2. Grava msg do cliente (com accountId/franchiseeId tag)
    await saveMessageToFirestore(phoneClean, customerName, "user", text, { messageId, accountId });

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
            console.log(`[fast-reply] hit: ${fast.matchedId}`);
            await saveMessageToFirestore(phoneClean, customerName, "bot", fast.reply, { accountId });
            res.status(200).json({ reply: fast.reply, source: "fast_reply", matched: fast.matchedId });
            return;
        }
    } catch (e) {
        console.warn("[fast-reply] erro, segue pro Groq:", e.message);
    }

    // 5. Sem match local — chama Groq (parsing de pedido novo, conversa nuançada)
    try {
        const reply = await generateLuluReply(history.messages, text, customerName || history.lastSeenName, accountId, phoneClean);
        if (!reply) {
            res.status(200).json({ reply: "Tô tendo dificuldade de pensar agora 😔 Manda de novo? Ou fala direto com o Jocimar: wa.me/5543999919777" });
            return;
        }

        // 6. Grava resposta da bot no histórico
        await saveMessageToFirestore(phoneClean, customerName, "bot", reply, { accountId });

        // 7. Devolve pro gateway que envia pelo WhatsApp
        res.status(200).json({ reply, source: "groq_ia" });
    } catch (err) {
        console.error("[whatsapp-webhook] Lulu error:", err.message);
        // Fallback amigável
        const fallback = "Oi! 🐑 Tô com problema de conexão aqui agora. Posso te chamar em alguns minutos? Se for urgente, fala direto com o Jocimar: wa.me/5543999919777";
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
