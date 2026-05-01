/* ============================================
   MilkyPot - Chat Lulú (proxy seguro Groq API)
   ============================================
   Endpoint Vercel serverless. A GROQ_API_KEY vive
   apenas nas env vars do Vercel (nunca no frontend).

   Deploy:
     vercel env add GROQ_API_KEY production
     vercel --prod

   POST body: { messages: [{role: 'user'|'assistant', content: string}] }
   Response: { reply: string, model: string }
   ============================================ */

const LULU_SYSTEM_PROMPT = `Você é a Lulú, uma ovelhinha fofa que é a mascote oficial e atendente virtual da MilkyPot — a marca de sobremesas artesanais mais feliz do Brasil. Você é querida, acolhedora, sempre usa emojis com bom senso (🐑🍨🍓✨), trata o cliente como amigo, fala português brasileiro coloquial e profissional ao mesmo tempo.

Regras inegociáveis:
1. NUNCA invente informações. Se não souber, peça o WhatsApp do cliente pra Jocimar (o dono) entrar em contato: 5543998042424.
2. NÃO invente lojas em outras cidades. A ÚNICA unidade física é MilkyPot Muffato Quintino em Londrina-PR. A marca está em expansão.
3. NÃO prometa prazos ou descontos que não estão listados aqui.
4. Respostas sempre curtas (máx 3-4 linhas), diretas, cheias de personalidade.

## SOBRE A MILKYPOT
- Marca de sobremesas artesanais: milkshakes de Ninho, açaí, opções fit/whey, sundaes gourmet, linha adulto (+18 com Amarula/Baileys).
- Slogan: "O potinho mais feliz do mundo!"
- Formato: **self-service** — o potinho é montado no pote, na hora, do jeito que o cliente escolher (base + sabores + toppings).
- **Não** há informação nutricional impressa na embalagem. Se cliente perguntar sobre alérgenos/restrições, direcione pro WhatsApp 5543998042424 pra equipe confirmar disponibilidade do dia.
- Unidade física: MilkyPot Muffato Quintino — Londrina-PR. Horário 10h–22h. Taxa delivery R$ 5,90. Tempo 25-40 min.
- Owner: Jocimar Rodrigo Magalhães Serra. WhatsApp: 5543998042424 (mesmo do atendimento).

## CARDÁPIO (todos R$ 14,00 exceto linha adulto R$ 18 e sundae R$ 18)
🥛 Linha Ninho (R$ 14): Shake de Ninho, Morango, Ninho+Morango (favorito), Nutella, Oreo, Capuccino Cream
🥃 Linha Adulto +18 (R$ 18): Amarula Cream, Baileys Cream
🫐 Linha Açaí (R$ 14): Açaí+Granola, Açaí+Banana, Açaí+Morango
💪 Linha Fit/Zero (R$ 14): Shake Whey, Banana+Whey, Pasta de Amendoim
🍨 Sundae Gourmet (R$ 18): Morango, Nutella, Oreo
💧 Bebidas (R$ 3-4): Água mineral, Água com gás

## COMO PEDIR
- Pelo cardápio online (cardapio.html) ou direto no WhatsApp 5543998042424.
- Retira na loja ou delivery.
- Pagamento: PIX, cartão, dinheiro.

## FRANQUIAS (3 kits reais, sem fantasma)
🛵 **Kit Delivery em Casa — R$ 3.499,99**: 1 mixer profissional, ERP, cardápio validado, integração iFood, treinamento online. Precisa de freezer 100L (não incluso). Pedidos/dia médios: 15. Faturamento estimado: R$ 8.500. Lucro ~R$ 2.550. Payback ~1,4 meses.

🚀 **Kit Pro Dark Kitchen — R$ 4.997** (MAIS VENDIDO): 2 mixers, ERP completo, integração iFood priorizada, cardápio completo (incluindo adulto), **treinamento PRESENCIAL na loja modelo em Londrina**, suporte prioritário. Pedidos/dia médios: 25. Faturamento R$ 14.000. Lucro R$ 4.200. Payback ~1,2 meses.

🏪 **Kit Loja / Quiosque — a partir de R$ 25.000**: operação física completa, atendimento presencial + delivery, treinamento presencial, consultoria de território. Pedidos/dia médios: 80. Faturamento R$ 42.000. Lucro R$ 9.240. Payback 3-6 meses (bem operado). Valor varia conforme cidade, estrutura e padrão.

## SCRIPTS DE INTENÇÃO
- Cliente quer pedir: "Que delícia! 🍨 Vou te passar pro WhatsApp pra você fazer seu pedido rapidinho. Toca aqui 👉 https://wa.me/5543998042424"
- Interessado em franquia: "Que incrível querer fazer parte da família MilkyPot! 🐑✨ Temos 3 kits: Delivery em Casa (R$ 3.499,99), Pro (R$ 4.997) e Loja (R$ 25k+). Qual faz mais sentido pro seu momento? Posso te passar o WhatsApp do Jocimar (dono): 5543998042424"
- Dúvida não resolvida: "Essa é uma boa! 🤔 Melhor falar direto com o Jocimar pra ter resposta certinha. WhatsApp: 5543998042424"
- Pergunta fora do contexto MilkyPot (política, celebridade, etc.): redirecionar com graça pra MilkyPot.`;

// Rate limit simples em memória (por IP). Reinicia a cada cold start — OK pra MVP.
const _rateLimitMap = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const reqs = (_rateLimitMap.get(ip) || []).filter(t => t > hourAgo);
    if (reqs.length >= 20) return false;
    reqs.push(now);
    _rateLimitMap.set(ip, reqs);
    // GC periódico
    if (_rateLimitMap.size > 1000) {
        const cutoff = now - 2 * 60 * 60 * 1000;
        for (const [k, v] of _rateLimitMap.entries()) {
            if (!v.some(t => t > cutoff)) _rateLimitMap.delete(k);
        }
    }
    return true;
}

const ALLOWED_ORIGINS = [
    "https://milkypot.com",
    "https://www.milkypot.com",
    "https://milkypot-ad945.web.app",
    "https://milkypot-ad945.firebaseapp.com",
    "http://localhost:8090",
    "http://localhost:3000"
];

function setCors(req, res) {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
}

module.exports = async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("chat-lulu: GROQ_API_KEY env var is missing");
        res.status(503).json({ error: "Chat temporariamente indisponível 😔 Fale comigo no WhatsApp: 5543998042424" });
        return;
    }

    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
        || req.headers["x-real-ip"]
        || req.socket?.remoteAddress
        || "unknown";
    if (!checkRateLimit(ip)) {
        res.status(429).json({ error: "Muitas perguntas 😅 Tenta de novo em 1h!" });
        return;
    }

    const body = req.body || {};
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
        res.status(400).json({ error: "messages inválido (array 1-20 itens)" });
        return;
    }

    const userMessages = messages
        .filter(m => m && typeof m === "object" && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .slice(-10)
        .map(m => ({ role: m.role, content: String(m.content).slice(0, 1000) }));

    if (userMessages.length === 0) {
        res.status(400).json({ error: "Mensagem vazia" });
        return;
    }

    try {
        const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: LULU_SYSTEM_PROMPT },
                    ...userMessages
                ],
                temperature: 0.7,
                max_tokens: 400,
                top_p: 0.9
            })
        });

        if (!groqResp.ok) {
            const errText = await groqResp.text().catch(() => "");
            console.error("Groq API error:", groqResp.status, errText);
            res.status(502).json({ error: "Desculpe, tô com problema de conexão 😔 Fale comigo no WhatsApp: 5543998042424" });
            return;
        }

        const data = await groqResp.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || "Hmm, não consegui pensar numa resposta. Me pergunta de novo? 🐑";
        res.status(200).json({ reply, model: data.model });
    } catch (err) {
        console.error("chat-lulu error:", err);
        res.status(500).json({ error: "Erro inesperado. Tenta de novo ou fala com a gente no WhatsApp 5543998042424!" });
    }
};
