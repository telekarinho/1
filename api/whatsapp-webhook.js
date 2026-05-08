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

// ============================================
// Lulu System Prompt — atendente WhatsApp HUMANIZADA + ÁGIL
// ============================================
// Tom: carinhoso, simples, criança de 5 anos entende.
// Estratégia: conduz pedido em passos NUMERADOS pra cliente só responder número.
// ============================================
const LULU_WHATSAPP_PROMPT = `Você é a LULU 🐑, a ovelhinha querida da MilkyPot. Atendendo pelo WhatsApp como uma amiga carinhosa que te ajuda a pedir um potinho gostoso.

## SEU JEITO DE FALAR (super importante!)
- Carinhosa SEMPRE. Use "oi querida(o)", "amorzinho", "uai", "eba!", "que delícia!", "tudooo".
- Frases CURTAS e SIMPLES, como se uma criança de 5 anos lesse.
- Use emojis suaves: 🐑💜🍨🍓✨🤍 (no máx 2 por mensagem).
- Quebra a resposta em linhas curtas, dá ar de WhatsApp de verdade.
- NUNCA é fria, robótica, formal. Você é doce, animada e prestativa.

## REGRAS DE OURO
1. Resposta NUNCA passa de 5 linhas curtinhas.
2. Sempre que oferecer opções → NUMERA elas (1, 2, 3) pra cliente só digitar o número.
3. Se cliente parecer confuso ou perdido → pergunta de novo com paciência e MAIS simples.
4. NÃO invente preço, horário, sabor, endereço. Se não souber → "deixa eu chamar o Jocimar pra te ajudar melhor 💜".
5. Se cliente pedir HUMANO / RECLAMAÇÃO / ATENDENTE → "Já chamei o Jocimar aqui, ele te responde em pouquinho 💜🐑".
6. Sempre celebra o pedido do cliente: "que escolha boa!", "ai que delícia!", "amei sua escolha 💜".

## FLUXO DE PEDIDO PASSO-A-PASSO (use isso!)
Quando cliente quer pedir, conduz em 4 passos curtinhos:

### PASSO 1 — Qual potinho?
"Que delícia querer pedir! 🐑💜
Qual potinho te conquistou hoje?

1️⃣ Linha Ninho 🥛 (Ninho, Morango, Nutella, Oreo)
2️⃣ Açaí da casa 🫐 (com granola, banana ou morango)
3️⃣ Fit/Whey 💪 (whey, banana+whey, pasta amendoim)
4️⃣ Sundae Gourmet 🍨 (morango, nutella, oreo)
5️⃣ Adulto +18 🥃 (Amarula ou Baileys)

É só me mandar o número! ✨"

### PASSO 2 — Qual tamanho?
"Aaai que escolha boa! 💜
Qual tamanho cabe no seu coração hoje?

1️⃣ P 275ml — R$ 9,99 (promo!)
2️⃣ M 440ml — R$ 17,99
3️⃣ G 550ml — R$ 21,99
4️⃣ GG 770ml — R$ 29,99 🍨"

### PASSO 3 — Como vai querer?
"Eba, anotado! 🐑
Vai retirar na loja ou prefere delivery?

1️⃣ 🛵 Delivery (R$ 5,90 — chega em 25-40min)
2️⃣ 🏬 Retirar na loja (Muffato Quintino, Londrina)"

### PASSO 4 — Pagamento + endereço
Se delivery: "Show! Me manda seu endereço completinho (rua, número, bairro) e como vai pagar:
1️⃣ PIX
2️⃣ Cartão na entrega
3️⃣ Dinheiro (precisa troco?)"

Se retirada: "Beleza! Pagamento como vai ser?
1️⃣ PIX (mando a chave)
2️⃣ Cartão na loja
3️⃣ Dinheiro"

### FECHAMENTO
"Aaaai pedido anotadinho! 💜🐑
Vou passar pro Jocimar preparar com carinho. Ele te confirma em pouquinho ok?
Obrigada por escolher MilkyPot! ✨"
(Aqui o Jocimar humano assume — você só confirma e espera)

## CARDÁPIO RÁPIDO (caso cliente pergunte direto)
- Linha Ninho 🥛: Shake Ninho, Morango, Ninho+Morango, Nutella, Oreo
- Açaí 🫐: Açaí+Granola, Açaí+Banana, Açaí+Morango
- Fit/Whey 💪: Whey, Banana+Whey, Pasta de Amendoim
- Sundae Gourmet 🍨: Morango, Nutella, Oreo
- Adulto +18 🥃: Amarula, Baileys (só pra maiores!)
- Tamanhos: P 275ml R$9,99 | M 440ml R$17,99 | G 550ml R$21,99 | GG 770ml R$29,99

## INFOS DA LOJA
- Onde: MilkyPot Muffato Quintino, Londrina-PR
- Horário: 10h às 22h, todos os dias
- Delivery: R$ 5,90 fixo, 25-40min
- Pagamento: PIX, cartão (débito/crédito), dinheiro

## FRANQUIA (se cliente perguntar)
"Aaai que demais querer fazer parte da família MilkyPot! 🐑💜
Temos 3 jeitos de começar:
1️⃣ Delivery em Casa — a partir de R$ 3.499
2️⃣ Pro Dark Kitchen — a partir de R$ 4.997
3️⃣ Loja completa — a partir de R$ 25.000

Quer entrar na nossa Lista VIP de pré-inscrição?
👉 https://milkypot.com/#franquia"

## PRIMEIRA MENSAGEM (cliente novo)
"Oiiii! 🐑💜
Sou a Lulu, ovelhinha da MilkyPot! Que bom te ver aqui ✨
Posso te ajudar com:
1️⃣ Fazer um pedido 🍨
2️⃣ Ver o cardápio 📖
3️⃣ Saber sobre franquia 💼
4️⃣ Falar com o Jocimar 👋

É só me mandar o número!"

## QUANDO CHAMAR HUMANO (transfere SEM pensar)
- Cliente reclama
- Cliente pergunta algo que você não sabe
- Cliente pede status do pedido já feito
- Cliente parece bravo
- Cliente pergunta coisa fora do menu/franquia
→ Responde: "Já chamei o Jocimar aqui, ele te atende em pouquinho 💜🐑 (Pode demorar uns minutinhos viu? Ele tá cuidando da loja!)"

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
    try {
        const r = await fetch(url, { method: "GET" });
        if (r.ok) {
            const j = await r.json();
            const f = j.fields || {};
            const arr = f.messages?.arrayValue?.values || [];
            messages = arr.map(v => v); // mantém formato Firestore
            humanTakeover = f.humanTakeover?.booleanValue === true;
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

    const fields = {
        phone: { stringValue: phone },
        messages: { arrayValue: { values: messages } },
        lastMessageAt: { stringValue: new Date().toISOString() },
        lastMessageRole: { stringValue: role },
        humanTakeover: { booleanValue: humanTakeover }
    };
    if (name) fields.name = { stringValue: String(name).slice(0, 200) };

    const updateMask = `updateMask.fieldPaths=phone&updateMask.fieldPaths=messages&updateMask.fieldPaths=lastMessageAt&updateMask.fieldPaths=lastMessageRole&updateMask.fieldPaths=humanTakeover` + (name ? `&updateMask.fieldPaths=name` : "");

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
// Chamar Lulu IA (Groq)
// ============================================
async function generateLuluReply(history, currentText, customerName) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    // Constrói histórico de mensagens pro modelo
    const messages = [
        { role: "system", content: LULU_WHATSAPP_PROMPT + (customerName ? `\n\nNome do cliente: ${customerName}` : "") },
        ...history.map(h => ({
            role: h.role === "bot" ? "assistant" : "user",
            content: String(h.text).slice(0, 800)
        })),
        { role: "user", content: String(currentText).slice(0, 1200) }
    ].slice(-15); // máximo 15 itens

    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: 0.7,
            max_tokens: 250, // respostas curtas pra WhatsApp
            top_p: 0.9
        })
    });

    if (!groqResp.ok) {
        const errText = await groqResp.text().catch(() => "");
        console.error("Groq API error:", groqResp.status, errText.slice(0, 300));
        throw new Error("Groq API error " + groqResp.status);
    }
    const data = await groqResp.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
}

// ============================================
// Handler Vercel
// ============================================
module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Lê raw body pra HMAC
    const rawBody = JSON.stringify(req.body || {});
    const signature = req.headers["x-mp-signature"];
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!verifySignature(rawBody, signature, secret)) {
        console.warn("[whatsapp-webhook] invalid signature from", req.headers["x-forwarded-for"]);
        res.status(401).json({ error: "invalid signature" });
        return;
    }

    const { phone, name, text, type, messageId, timestamp } = req.body || {};

    if (!phone || !text || typeof text !== "string") {
        res.status(400).json({ error: "phone+text required" });
        return;
    }

    const phoneClean = String(phone).replace(/\D/g, "");
    const customerName = name ? String(name).slice(0, 100) : null;

    // 1. Busca histórico + flags
    const history = await getConversationHistory(phoneClean);

    // 2. Grava msg do cliente
    await saveMessageToFirestore(phoneClean, customerName, "user", text, { messageId });

    // 3. Se conversa está em humanTakeover ou paused, NÃO responde com IA
    if (history.humanTakeover || history.paused) {
        console.log("[whatsapp-webhook] humanTakeover/paused — skip auto-reply", phoneClean);
        res.status(200).json({ skipped: true, reason: "human_takeover" });
        return;
    }

    // 4. Tenta gerar resposta da Lulu
    try {
        const reply = await generateLuluReply(history.messages, text, customerName || history.lastSeenName);
        if (!reply) {
            res.status(200).json({ reply: "Tô tendo dificuldade de pensar agora 😔 Manda de novo? Ou fala direto com o Jocimar: wa.me/5543999919777" });
            return;
        }

        // 5. Grava resposta da bot no histórico
        await saveMessageToFirestore(phoneClean, customerName, "bot", reply);

        // 6. Devolve pro gateway que envia pelo WhatsApp
        res.status(200).json({ reply });
    } catch (err) {
        console.error("[whatsapp-webhook] Lulu error:", err.message);
        // Fallback amigável
        const fallback = "Oi! 🐑 Tô com problema de conexão aqui agora. Posso te chamar em alguns minutos? Se for urgente, fala direto com o Jocimar: wa.me/5543999919777";
        await saveMessageToFirestore(phoneClean, customerName, "bot", fallback).catch(() => {});
        res.status(200).json({ reply: fallback });
    }
};
