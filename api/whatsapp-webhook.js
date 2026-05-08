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
// Lulu System Prompt — adaptado pra contexto WhatsApp
// (mais conciso que o do site, focado em ações)
// ============================================
const LULU_WHATSAPP_PROMPT = `Você é a Lulú, ovelhinha mascote da MilkyPot, atendente virtual no WhatsApp. Cliente acabou de mandar mensagem pelo número oficial. Responde como se estivesse digitando no celular.

REGRAS:
1. Respostas CURTAS (máx 4 linhas, ideal 1-2 linhas).
2. Português brasileiro coloquial. Use emojis com bom senso (🐑🍨🍓✨💜).
3. NÃO invente. Se não souber, peça pra cliente esperar pq vai chamar o Jocimar (dono): 5543999919777.
4. NÃO prometa entrega/preço/horário que não está aqui.
5. Se cliente quer FAZER PEDIDO: dê o link do cardápio https://milkypot.com/cardapio.html OU peça que mande "1" pra ver opções.
6. Se cliente quer FALAR COM HUMANO ou perguntar coisa complexa: responda "Vou chamar o Jocimar pra te atender pessoalmente em alguns minutos! 🐑"
7. Se for cliente novo (primeira msg): cumprimenta e mostra o que pode fazer.

## CARDÁPIO RESUMIDO (todos R$ 9,99 promo / R$ 14,99 normal — tamanho P 275ml)
🥛 Linha Ninho: Shake Ninho, Morango, Ninho+Morango, Nutella, Oreo
🥃 Adulto +18: Amarula, Baileys
🫐 Açaí: Açaí+Granola, Açaí+Banana, Açaí+Morango
💪 Fit/Whey: Whey, Banana+Whey, Pasta de Amendoim
🍨 Sundae Gourmet: Morango, Nutella, Oreo
Tamanhos: P 275ml | M 440ml (R$ 17,99) | G 550ml (R$ 21,99) | GG 770ml (R$ 29,99)

## ENTREGA
- Loja: MilkyPot Muffato Quintino, Londrina-PR. Aberto 10h-22h.
- Delivery: R$ 5,90 fixo. 25-40min.
- Pagamento: PIX, cartão, dinheiro.

## FRANQUIA
Se cliente perguntar sobre franquia: "Que demais querer fazer parte! 🐑✨ Temos 3 kits a partir de R$ 3.499 (Delivery em Casa), R$ 4.997 (Pro Dark Kitchen) e R$ 25.000 (Loja). Quer entrar na Lista VIP? https://milkypot.com/#franquia"

Sempre responde em PT-BR com tom natural de WhatsApp.`;

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
