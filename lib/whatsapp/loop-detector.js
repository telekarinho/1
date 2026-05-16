/* ============================================
   MilkyPot — Loop Detector
   ============================================
   Detecta quando a Lulu está num loop com outro bot (empresa
   de cobrança, spam, robô) ou cliente confuso. Quando detecta,
   pausa a IA e marca a conversa pra atendimento humano.

   Sinais de loop:
   1. Cliente mandou a MESMA mensagem 2+ vezes seguidas
   2. Bot respondeu o MESMO texto 2+ vezes nas últimas 4 trocas
   3. Mensagem "não suportada" / "[mensagem]" repetida 2+ vezes
   4. Mensagem do cliente parece automática (palavras de cobrança,
      faturas, SMS-bot)
   5. Mais de 5 trocas user↔bot sem progresso no pedido
   ============================================ */

"use strict";

function normalize(t) {
    return String(t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function similarity(a, b) {
    a = normalize(a);
    b = normalize(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 10 || b.length < 10) return a === b ? 1 : 0;
    // Jaccard de palavras
    const wa = new Set(a.split(" "));
    const wb = new Set(b.split(" "));
    let intersection = 0;
    for (const w of wa) if (wb.has(w)) intersection++;
    return intersection / (wa.size + wb.size - intersection);
}

const PATTERNS_BOT_COBRANCA = [
    /\bcpf\b/i,
    /\bcnpj\b/i,
    /\bfatura\b/i,
    /boleto/i,
    /\bdivida?s?\b/i,
    /\binadimpl/i,
    /\b(serasa|spc|protesto)\b/i,
    /pagar (sua|seu)/i,
    /negociar (sua|seu)/i,
    /\bbanco\b.*\bcobr/i,
    /\bregularizar\b/i,
    /escritorio.*advoc/i,
    /\bjurid/i,
    /agente.*automat/i,
    /\b(disque|disc)[\s-]+denuncia\b/i,
    /\bpix\s+(de|para|à)\s+R?\$?\s*[\d.,]+\s+(pra|para)\s+(quitar|regularizar)/i
];

function pareceMensagemBotExterno(text) {
    if (!text) return false;
    if (PATTERNS_BOT_COBRANCA.some(rx => rx.test(text))) return true;
    // Mensagem genérica curta tipo "[mensagem não suportada]"
    if (/^\s*\[?(mensagem|message)\s*(nao|não|not)\s*suportad/i.test(text)) return true;
    return false;
}

/**
 * Detecta loop com base no histórico de mensagens.
 * history: [{ role: 'user'|'bot', text, ts }]
 * currentText: string da mensagem atual do user
 * lastBotRepliesBeingConsidered: opcional, próximo reply considerado pra evitar
 *
 * Retorna:
 *   { loop: false }
 *   { loop: true, reason: 'user_repeating'|'bot_repeating'|'unsupported'|'bot_externo'|'sem_progresso', confidence: 0-1 }
 */
function detectLoop(history, currentText, nextReplyCandidate = null) {
    if (!Array.isArray(history)) history = [];
    const userMsgs = history.filter(h => h.role === "user").slice(-6);
    const botMsgs = history.filter(h => h.role === "bot").slice(-6);
    const allRecent = history.slice(-8);

    // 1. Cliente mandou MESMO texto 2+ vezes (literal)
    if (userMsgs.length >= 1) {
        const repeats = userMsgs.filter(m => similarity(m.text, currentText) >= 0.85).length;
        if (repeats >= 2) return { loop: true, reason: "user_repeating", confidence: 0.95 };
    }

    // 2. Bot respondeu o mesmo texto 2+ vezes nas últimas 4
    if (botMsgs.length >= 3) {
        // Pega últimos 4 e procura similaridade entre eles
        const recent = botMsgs.slice(-4);
        for (let i = 0; i < recent.length; i++) {
            let dups = 0;
            for (let j = i + 1; j < recent.length; j++) {
                if (similarity(recent[i].text, recent[j].text) >= 0.85) dups++;
            }
            if (dups >= 1) return { loop: true, reason: "bot_repeating", confidence: 0.9 };
        }
    }

    // 3. Mensagem atual é "não suportada" e bot já respondeu pelo menos 1x a anterior também
    if (/(\[?mensagem\s*nao\s*suportad|\[?audio\]|\[?imagem\]|\[?sticker\])/i.test(normalize(currentText))) {
        const lastUserNonSupported = userMsgs.slice(-3).filter(m =>
            /(\[?mensagem\s*nao\s*suportad|\[?audio\]|\[?imagem\]|\[?sticker\])/i.test(normalize(m.text))
        ).length;
        if (lastUserNonSupported >= 2) return { loop: true, reason: "unsupported_loop", confidence: 0.95 };
    }

    // 4. Parece bot externo (cobrança, spam, automático)
    if (pareceMensagemBotExterno(currentText)) {
        return { loop: true, reason: "bot_externo_cobranca", confidence: 0.85 };
    }

    // 5. Próximo reply candidato seria idêntico ao último → avoid send
    if (nextReplyCandidate && botMsgs.length) {
        const lastBot = botMsgs[botMsgs.length - 1];
        if (similarity(lastBot.text, nextReplyCandidate) >= 0.9) {
            return { loop: true, reason: "would_repeat", confidence: 0.8 };
        }
    }

    // 6. Mais de 6 trocas user↔bot recentes sem mudança de assunto significativa
    if (allRecent.length >= 6) {
        // Pega só user msgs e verifica se todas são parecidas
        if (userMsgs.length >= 3) {
            const uniqUser = new Set(userMsgs.map(m => normalize(m.text)));
            if (uniqUser.size <= 1) {
                return { loop: true, reason: "sem_progresso", confidence: 0.7 };
            }
        }
    }

    return { loop: false };
}

// Mensagem de "encaminhamento humano" — discreta, profissional, sem pegajoso
const HANDOFF_MESSAGES = [
    "Posso pedir um minutinho pra você? Vou passar essa conversa pra equipe te atender pessoalmente. Em breve respondem por aqui! 🐑💜",
    "Olha, deixa eu chamar alguém da equipe pra te ajudar melhor com isso. Já tô passando a conversa — em pouquinho respondem por aqui. 💜",
    "Acho que aqui vou pedir reforço da equipe pra te atender com mais atenção. Já encaminhei — alguém te responde em poucos minutos. 🐑",
    "Vou pedir um minutinho — passei essa conversa pra uma pessoa da equipe te ajudar melhor. Responde em pouquinho por aqui! 💜"
];

function getHandoffMessage(reason) {
    // Mensagem específica pra alguns motivos
    if (reason === "bot_externo_cobranca") {
        return "Acho que você queria falar sobre cobrança/financeiro, e por aqui eu só ajudo com pedidos da MilkyPot 🐑💜\nPosso pedir um momento pra chamar alguém da equipe que possa te ajudar melhor?";
    }
    if (reason === "unsupported_loop") {
        return "Ahh me desculpa, não consegui processar essas mensagens 😅\nDeixa eu pedir reforço da equipe pra te atender direitinho. Já tô passando a conversa — em pouquinho respondem por aqui! 💜";
    }
    // Padrão: rotação aleatória
    return HANDOFF_MESSAGES[Math.floor(Math.random() * HANDOFF_MESSAGES.length)];
}

module.exports = {
    detectLoop,
    getHandoffMessage,
    similarity,
    pareceMensagemBotExterno
};
