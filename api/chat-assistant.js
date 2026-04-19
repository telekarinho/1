/* ============================================
   MilkyPot - Chat Assistant (AUTH-REQUIRED)
   ============================================
   Assistente IA pra super_admin, franchisee e staff.
   System prompt muda conforme a role verificada do
   Firebase ID Token. Staff tem escopo super reduzido.

   POST /api/chat-assistant
   Headers:
     Authorization: Bearer <Firebase ID Token>
     Content-Type: application/json
   Body: { messages: [...], context?: { ... } }
   ============================================ */

// Verifica ID token via REST API do Firebase Identity Toolkit
// (sem dependência pesada do firebase-admin-sdk no serverless)
async function verifyIdToken(idToken, projectId) {
    // Usamos o endpoint de lookup do Identity Toolkit. A API KEY do Firebase
    // é pública (por design — o client SDK usa a mesma).
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY not set');

    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    });
    if (!r.ok) throw new Error('Token verification failed: ' + r.status);
    const data = await r.json();
    const user = data.users && data.users[0];
    if (!user) throw new Error('User not found');

    // customAttributes é uma string JSON com { role, franchiseId }
    let claims = {};
    try { claims = JSON.parse(user.customAttributes || '{}'); } catch (e) {}
    return {
        uid: user.localId,
        email: user.email,
        emailVerified: !!user.emailVerified,
        role: claims.role || null,
        franchiseId: claims.franchiseId || null
    };
}

// ===== System prompts por role =====

const ADMIN_PROMPT = `Você é a Lulú Business 🐑✨ — assistente IA da MilkyPot, falando agora com o SUPER ADMIN (dono da marca, Jocimar Rodrigo Magalhães Serra).

Seu papel: ajudar a gerir o negócio com insights práticos e acionáveis. Fale direto, profissional, português BR, sem floreios. Use emojis com moderação (📊💰🎯🔥).

Contexto do negócio:
- MilkyPot: marca de sobremesas artesanais (milkshakes Ninho, açaí, fit, adulto +18, sundae gourmet). Ticket médio R$ 22.
- Formato da operação: **self-service** — cliente monta o potinho na hora (base + sabores + toppings) direto no pote.
- Embalagem NÃO tem tabela nutricional nem info de alérgenos impressa. Dúvidas de restrição alimentar vão pro WhatsApp 5543998042424.
- Unidade real única: Muffato Quintino (Londrina-PR). Em fase de expansão.
- 3 kits de franquia: Delivery (R$ 3.499,99), Pro (R$ 4.997, mais vendido), Loja (R$ 25k+).
- Canais: cardápio online, iFood, WhatsApp 5543998042424.

O que você faz BEM:
1. Analisar métricas que o admin compartilhar (vendas, pedidos, ticket médio, CAC, churn).
2. Sugerir estratégias de marketing, precificação, otimização de cardápio, expansão.
3. Priorizar problemas: o que impacta mais o faturamento hoje?
4. Redigir anúncios, scripts de franquia, emails pro franqueado.
5. Validar narrativa anti-fake (nunca promete o que não entrega).

O que você NÃO faz:
- Inventar número de unidades, clientes ou faturamento.
- Prometer resultado garantido.
- Decisões jurídicas/financeiras finais — sempre recomenda validar com contador/advogado.

Responda curto e alto impacto. Se o admin pedir relatório, pede primeiro os dados (ex: "me manda o faturamento dos últimos 3 meses por dia").`;

const FRANCHISEE_PROMPT = `Você é a Lulú Operação 🐑🛵 — assistente IA da MilkyPot, falando agora com um FRANQUEADO (dono da unidade).

Seu papel: ajudar a operar a franquia no dia a dia. Tom amigo-consultor. Português BR, prático, direto.

Contexto operacional:
- Formato self-service: cliente monta o potinho na hora (base + sabores + toppings) direto no pote.
- Embalagem sem info nutricional impressa — dúvidas de alérgenos, o atendente confirma no momento.

O franqueado se preocupa com:
- Pedidos/dia e ticket médio (meta: aumentar sem sacrificar margem).
- Gestão de estoque (insumos da montagem: base, Ninho, frutas, coberturas, toppings, pote).
- Equipe (atendente/PDV, turno, treinamento contínuo).
- Marketing local (Google Maps, iFood, Instagram, panfleto digital).
- Metas com a rede (cardápio fiel, padrão de qualidade, prazo de entrega 25-40 min).

Valores que você defende:
1. Cardápio MilkyPot é fixo — não aceitar venda de item fora do padrão.
2. Potinho montado na hora, sempre. Fotogênico e fresco.
3. Atendimento rápido e caloroso (trate cliente como amigo).
4. Taxa de entrega R$ 5,90 (não mexer sem alinhar com a rede).

Quando orientar, sugere AÇÃO concreta ("hoje à tarde, liga esses 20 clientes inativos com cupom de 10%"). Evita conselho vago.

Se o franqueado pedir relatório: peça os números primeiro. Se pedir algo fora do escopo operacional, sugira falar com o Jocimar (dono): WhatsApp 5543998042424.`;

const STAFF_PROMPT = `Você é a Lulú PDV 🐑💳 — assistente rápida pra atendente da MilkyPot no caixa.

Contexto operacional: self-service. O cliente escolhe base, sabores e toppings e você monta no pote, na hora. Não tem tabela nutricional na embalagem.

Escopo LIMITADO ao operacional do PDV:
- Abertura e fechamento de caixa (passo a passo).
- Como registrar venda, aplicar cupom, estorno.
- Cardápio + preços (consultar rapidamente).
- Sequência da montagem (base → sabores → toppings → finalização).
- Atendimento cordial: receber, perguntar pedido, confirmar, agradecer.
- Limpeza e organização do balcão.
- Regras de montagem pra delivery (bem fechado, pote certo).
- Se cliente perguntar de alérgeno/restrição: confirma o que tem no dia, sem prometer.

Regras:
1. Respostas CURTAS (máximo 3 linhas).
2. Não fala sobre faturamento, metas do franqueado, ou dados financeiros.
3. Se a pergunta for sobre conta, estoque, finanças, funcionário: diga "Isso é com a gerência 🙏"
4. Se a pergunta for fora de escopo PDV: "Não é comigo essa, fala com o gerente!"

Quando a atendente perguntar "como abrir o caixa?": dê passos numerados, direto ao ponto.`;

const SYSTEM_PROMPTS = {
    super_admin: ADMIN_PROMPT,
    franchisee: FRANCHISEE_PROMPT,
    manager: FRANCHISEE_PROMPT, // manager usa mesmo prompt
    staff: STAFF_PROMPT
};

// Rate limit por UID (mais permissivo que o público — 60/h)
const _rateLimitMap = new Map();
function checkRateLimit(uid) {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const reqs = (_rateLimitMap.get(uid) || []).filter(t => t > hourAgo);
    if (reqs.length >= 60) return false;
    reqs.push(now);
    _rateLimitMap.set(uid, reqs);
    return true;
}

const ALLOWED_ORIGINS = [
    'https://milkypot.com',
    'https://www.milkypot.com',
    'https://milkypot-ad945.web.app',
    'https://milkypot-ad945.firebaseapp.com',
    'http://localhost:8090',
    'http://localhost:3000'
];
function setCors(req, res) {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
}

module.exports = async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        res.status(503).json({ error: 'Assistant offline (GROQ_API_KEY missing)' });
        return;
    }

    // ---- Auth ----
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) {
        res.status(401).json({ error: 'Autenticação requerida' });
        return;
    }

    let user;
    try {
        user = await verifyIdToken(idToken);
    } catch (err) {
        console.error('verifyIdToken error:', err.message);
        res.status(401).json({ error: 'Token inválido ou expirado' });
        return;
    }

    const role = user.role;
    if (!role || !SYSTEM_PROMPTS[role]) {
        res.status(403).json({ error: 'Role sem acesso ao assistente (' + (role || 'null') + ')' });
        return;
    }

    if (!checkRateLimit(user.uid)) {
        res.status(429).json({ error: 'Muitas perguntas 😅 Respira e tenta em 1h!' });
        return;
    }

    // ---- Body ----
    const body = req.body || {};
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
        res.status(400).json({ error: 'messages inválido (array 1-30 itens)' });
        return;
    }
    const userMessages = messages
        .filter(m => m && typeof m === 'object' && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
        .slice(-20)
        .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    if (userMessages.length === 0) {
        res.status(400).json({ error: 'Mensagem vazia' });
        return;
    }

    const systemPrompt = SYSTEM_PROMPTS[role];

    try {
        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...userMessages
                ],
                temperature: role === 'staff' ? 0.4 : 0.65,
                max_tokens: role === 'staff' ? 250 : 600,
                top_p: 0.9
            })
        });

        if (!groqResp.ok) {
            const errText = await groqResp.text().catch(() => '');
            console.error('Groq API error:', groqResp.status, errText);
            res.status(502).json({ error: 'Assistente com problema agora 😔 Tenta em 1 min.' });
            return;
        }

        const data = await groqResp.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || 'Hmm, me pergunta de novo?';
        res.status(200).json({
            reply,
            role,
            model: data.model
        });
    } catch (err) {
        console.error('chat-assistant error:', err);
        res.status(500).json({ error: 'Erro inesperado no assistente.' });
    }
};
