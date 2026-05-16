/* ============================================
   MilkyPot — Fast Replies (90% sem chamar Groq)
   ============================================
   Pattern matching local pra respostas comuns. A IA Groq só é
   chamada quando a mensagem não bate em nenhum padrão (parsing
   de pedido novo, conversa nuançada, etc).

   Cada regra:
   - pattern: regex que matcha a mensagem
   - reply: função (ctx) → string OU async (ctx) → string
     ctx = { accountId, customerPhone, customer, franchise, text, history }
   ============================================ */

"use strict";

const Cardapio = require("./cardapio.js");
const Tools = require("./tools.js");

function brl(n) {
    return "R$ " + Number(n || 0).toFixed(2).replace('.', ',');
}

function getGreeting() {
    const h = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false });
    const hour = parseInt(h);
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
}

function pickEmoji() {
    const emojis = ["💜", "🐑", "✨", "🍨", "💕"];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// Normaliza texto pra matching (sem acentos, lowercase)
function normalize(t) {
    return String(t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim();
}

// ============================================
// Regras de fast reply
// ============================================
const FAST_REPLIES = [
    // ============================================
    // 1. SAUDAÇÕES
    // ============================================
    {
        id: "saudacao",
        match: (text, ctx) => {
            const t = normalize(text);
            return /^(oi+|ola|hey+|hi+|opa+|eai|e ai|bom dia|boa tarde|boa noite|salve|alo|alou|tudo bem|td bem)[\s!.,?💜🐑]*$/i.test(t)
                || /^[💜🐑✨🍨💕]+$/.test(text.trim()); // só emoji
        },
        reply: (ctx) => {
            const greeting = getGreeting();
            const name = ctx.customer?.name;
            if (name && ctx.customer.ordersCount > 0) {
                const fav = ctx.customer.favoriteFlavors?.[0];
                let msg = `${greeting}, ${name}! 🐑💜\n`;
                msg += `Que bom te ver de novo amorzinho! ✨\n`;
                if (fav) msg += `Vai querer o ${fav} de sempre, ou hoje vai variar? 💕`;
                else msg += `O que vai ser hoje? 💕`;
                return msg;
            }
            return `${greeting}! Sou a Belinha da MilkyPot 🐑💜\n\nO que posso fazer por você hoje?\n1️⃣ Fazer um pedido 🍨\n2️⃣ Ver cardápio 📖\n3️⃣ Saber sobre franquia 💼\n\nÉ só me mandar o número (ou direto o que você quer 💕)!`;
        }
    },

    // ============================================
    // 2. CARDÁPIO
    // ============================================
    {
        id: "cardapio",
        match: (text) => {
            const t = normalize(text);
            return /^(cardapio|menu|sabores|opcoes|que tem|o que tem|tem o que|me mostra|2|2️⃣)[\s!.,?]*$/i.test(t)
                || /^(cardapio|menu)/i.test(t);
        },
        reply: async (ctx) => {
            const c = await Cardapio.getCardapio(ctx.accountId);
            const top = (c.produtos || []).slice(0, 8);
            if (!top.length) return "Tô buscando o cardápio amorzinho 💜 me dá 1 segundinho...";

            const cats = {};
            for (const p of c.produtos.slice(0, 20)) {
                const k = p.categoriaName || p.categoria || "Outros";
                if (!cats[k]) cats[k] = [];
                cats[k].push(p);
            }
            // Preço default = DELIVERY (mesmo do cardápio online milkypot.com).
            // Se cliente preferir RETIRAR na loja sai mais barato — incentivamos no rodapé.
            let msg = `Olha que delícia o cardápio hoje! 🍨💜\n_(preços de delivery)_\n`;
            let temDescontoRetirada = false;
            for (const [cat, prods] of Object.entries(cats)) {
                const ref = prods[0];
                const precoDelivery = ref.priceDelivery || ref.price;
                const precoLoja = ref.price;
                if (precoLoja && precoDelivery && precoLoja < precoDelivery) temDescontoRetirada = true;
                msg += `\n*${cat}* (a partir de ${brl(precoDelivery)}):\n`;
                msg += prods.slice(0, 6).map(p => `• ${p.name}`).join("\n");
                if (prods.length > 6) msg += `\n+ outros ${prods.length - 6}`;
                msg += "\n";
            }
            if (temDescontoRetirada) {
                msg += `\n🛍️ *Vai retirar na loja?* Sai mais barato — me avisa que aplico o desconto!\n`;
            }
            msg += `\n💕 Me diz o que vai querer!`;
            return msg;
        }
    },

    // ============================================
    // 3. HORÁRIO
    // ============================================
    {
        id: "horario",
        match: (text) => {
            const t = normalize(text);
            return /(que hora|qual hor|ta aberta|esta aberta|horario|funcion|fechad|abre|abrem|fecham|aberto)/.test(t);
        },
        reply: (ctx) => {
            const h = ctx.franchise?.hours || "10h às 22h, todos os dias";
            return `Tamo aberta sim amorzinho! 💜\n⏰ Horário: ${h}\n\nPede que a gente tá aqui te esperando 🐑✨`;
        }
    },

    // ============================================
    // 4. ENDEREÇO
    // ============================================
    {
        id: "endereco_loja",
        match: (text) => {
            const t = normalize(text);
            return /(onde (e|fica|que e|que fica)|qual.*endereco|endereco da loja|local da loja|onde voces estao|onde voce ta)/.test(t);
        },
        reply: (ctx) => {
            const a = ctx.franchise?.address || "MilkyPot Muffato Quintino — Av. dos Pioneiros, 4255, Iguatemi, Londrina-PR";
            return `Tamo aqui ó! 🏪💜\n📍 ${a}\n\n🛍️ *Retirada na loja sai mais barato* (sem taxa de delivery + preço promocional)\n🛵 Ou prefere delivery? Me avisa! 💕`;
        }
    },

    // ============================================
    // 5. FRETE / DELIVERY
    // ============================================
    {
        id: "frete",
        match: (text) => {
            const t = normalize(text);
            // Mensagem curta que mencione frete/delivery/entrega
            if (t.length > 80) return false;
            return /\b(frete|entrega|delivery)\b/i.test(t)
                && !/(fazer|quero|mandar|agora|por favor)\s+(o\s+)?pedido/i.test(t); // não confunde com pedido
        },
        reply: async (ctx) => {
            const cfg = await Cardapio.getDeliveryConfig(ctx.accountId);
            let msg = `🛵 Sobre delivery amorzinho:\n\n`;
            if (cfg.modo_frete_delivery === "FRETE_GRATIS_TOTAL") {
                msg += `🎁 Frete *grátis* em pedidos acima de ${brl(cfg.pedido_minimo_delivery)}!\n`;
                msg += `📦 Abaixo disso: ${brl(cfg.deliveryFee)} fixo\n`;
            } else {
                msg += `📦 Taxa: ${brl(cfg.deliveryFee)}\n`;
                msg += `💰 Pedido mínimo: ${brl(cfg.pedido_minimo_delivery)}\n`;
            }
            msg += `⏰ Chega em 30-50min ✨\n\nQuer pedir? Me manda o que você quer! 💜`;
            return msg;
        }
    },

    // ============================================
    // 6. PAGAMENTO
    // ============================================
    {
        id: "pagamento",
        match: (text) => {
            const t = normalize(text);
            return /(formas? de pagam|aceita.*(pix|cart|dinheiro)|como (pago|paga)|qual o pix|chave pix|dados do pix)/.test(t);
        },
        reply: () => `Aceitamos várias formas amorzinho! 💜\n\n💸 *PIX* (mando a chave quando confirmar)\n💳 *Cartão* (débito ou crédito na entrega/loja)\n💵 *Dinheiro* (com troco se precisar)\n\nQual é a sua preferida? ✨`
    },

    // ============================================
    // 7. AGRADECIMENTO / DESPEDIDA
    // ============================================
    {
        id: "obrigado",
        match: (text) => {
            const t = normalize(text);
            if (t.length > 60) return false;
            return /^(muito\s+|mt\s+|super\s+|nossa\s+)?(obrigad[oa]|brigad[oa]|valeu|vlw|gratidao|thanks|tnks|tchau|ate (mais|logo|amanha|breve)|falou|flw|bye|adeus)[\s!.,?]*$/.test(t);
        },
        reply: (ctx) => {
            const name = ctx.customer?.name ? `, ${ctx.customer.name}` : "";
            return `De nadinha${name}! 💜🐑\nVolta sempre que bater aquela vontade ✨\nObrigada por escolher a MilkyPot! 💕`;
        }
    },

    // ============================================
    // 8. PROMOÇÃO
    // ============================================
    {
        id: "promo",
        match: (text) => {
            const t = normalize(text);
            return /(tem promo|qual.*promo|promocao|desconto|oferta|combo)/.test(t);
        },
        reply: async (ctx) => {
            const r = await Tools.listar_promocoes({ franchiseeId: ctx.accountId });
            if (r?.promocoes?.length) {
                return `Promoções de hoje! 🎉💜\n\n${r.promocoes.map(p => "✨ " + p).join("\n")}\n\nQuer pedir? 💕`;
            }
            return `Hoje sem promo específica amorzinho 💜\nMas frete *grátis* acima de R$ 30,00 ✨\nE todos os sabores estão no preço cheio do cardápio. Me chama se quiser pedir! 🐑`;
        }
    },

    // ============================================
    // 9. STATUS DO PEDIDO ("cadê meu pedido")
    // ============================================
    {
        id: "status_pedido",
        match: (text) => {
            const t = normalize(text);
            return /(cade meu pedido|cade o pedido|ja chegou|ja saiu|ta saindo|esta a caminho|status do pedido|meu pedido|pedido foi feito|pedido chegou)/.test(t);
        },
        reply: async (ctx) => {
            const r = await Tools.consultar_pedido({ franchiseeId: ctx.accountId, customerPhone: ctx.customerPhone });
            if (!r?.found || !r.orders?.length) {
                return `Não achei nenhum pedido seu ainda amorzinho 💜\nQuer fazer um agora? Me diz o que você quer ✨`;
            }
            const last = r.orders[0];
            const statusEmoji = { novo: "🆕", em_preparo: "👩‍🍳", pronto: "✅", entregue: "🎉", cancelado: "❌" }[last.status] || "📦";
            return `Seu último pedido tá assim: ${statusEmoji}\n\n📦 *#${last.id}*\n🍨 ${last.items}\n💰 ${brl(last.total)}\n*Status: ${last.status.toUpperCase()}*\n\n${last.status === "novo" ? "Tô passando pra cozinha agora! 💜" : last.status === "em_preparo" ? "Tá sendo preparado com carinho! 🐑" : last.status === "pronto" ? "Pronto! Já tá na rua/aguardando 💕" : "✨"}`;
        }
    },

    // ============================================
    // 10. FRANQUIA
    // ============================================
    {
        id: "franquia",
        match: (text) => {
            const t = normalize(text);
            return /(quero abrir|abrir.*franquia|franquia.*milky|trabalhar.*milky|investir.*milky|representante|3 (rep|representante))/.test(t)
                || t === "3" || t === "3️⃣";
        },
        reply: () => `Aaaai que demais querer fazer parte da família MilkyPot! 🐑💜✨\n\nTemos 3 jeitos de começar:\n1️⃣ *Delivery em Casa* — a partir de R$ 3.499\n2️⃣ *Pro Dark Kitchen* — a partir de R$ 4.997\n3️⃣ *Loja completa* — a partir de R$ 25.000\n\nEntra na nossa Lista VIP de pré-inscrição:\n👉 https://milkypot.com/#franquia\n\nA gente te liga rapidinho! 💕`
    },

    // ============================================
    // 11. ESCALAÇÃO SILENCIOSA (cliente NÃO sabe que virou humano)
    // ============================================
    // Cliente NUNCA deve saber que está falando com bot vs humano. Quando bate
    // padrão de reclamação/raiva/erro grave, marcamos a conversa pra humano
    // assumir (humanTakeover=true via webhook), mas pra cliente respondemos
    // como se fôssemos a Belinha resolvendo pessoalmente. O painel toca som de
    // telefone pra equipe assumir — cliente só percebe melhor atendimento.
    {
        id: "escalacao_silenciosa",
        meta: { triggerHumanTakeover: true, ringPanel: true, urgency: "high" },
        match: (text) => {
            const t = normalize(text);
            return /(reclamacao|reclam(ar|o)|insatisfeit|com raiva|odiei|horrivel|merda|porcaria|lixo|fila|demoraram|frio|nao chegou|nao recebi|errado o pedido|pedido errado|cancela.*pedido|quero (meu )?dinheiro de volta|reembolso|processar|advogad)/.test(t);
        },
        reply: (ctx) => {
            const name = ctx.customer?.name ? `, ${ctx.customer.name}` : "";
            return `Aaai${name} que pena ouvir isso 💜🐑\nMe conta direitinho o que aconteceu pra eu resolver agora?\n(É super importante pra gente, prometo cuidar disso pessoalmente ✨)`;
        }
    },

    // ============================================
    // 12. PEDIDO VIA NÚMERO 1
    // ============================================
    {
        id: "intencao_pedir",
        match: (text) => {
            const t = normalize(text).trim();
            return t === "1" || t === "1️⃣" || /^(quero (pedir|comprar)|fazer pedido|pedir)$/i.test(t);
        },
        reply: () => `Eba! 🐑💜✨\nMe diz o que vai ser amorzinho:\n\n• *Sabor* (ex: Amora Apaixonada, Blue Ice, Ninho da Vovó...)\n• Se preferir Milkshake ou Sundae\n• Quantos potinhos? 🍨\n\nE depois vejo se é delivery ou *retirada na loja* (sai mais barato!) e fechamos 💕`
    },

    // ============================================
    // 13. CONFIRMAÇÃO simples (sim/ok/manda/blz)
    // → só responde se cliente NÃO está em fluxo de pedido
    // ============================================
    {
        id: "confirmacao_simples",
        match: (text, ctx) => {
            const t = normalize(text).trim();
            // Não bate se houver histórico recente de pedido sendo montado (deixa IA tratar)
            const ultimasBot = (ctx.history || []).filter(h => h.role === "bot").slice(-3);
            const temContextoPedido = ultimasBot.some(b => /sabor|tamanho|endere|pagam|delivery|retirada|adicional/i.test(b.text || ""));
            if (temContextoPedido) return false;
            return /^(sim|s|ok|okay|blz|beleza|claro|certo|combinado|fechado|pode|pode ser|ta bom|tudo bem)[\s!.,?💜]*$/.test(t);
        },
        reply: () => `Show! 💜\nMe diz o que precisa amorzinho? 🐑✨`
    },

    // ============================================
    // 14. PERGUNTAS CURTAS sobre tempo de entrega
    // ============================================
    {
        id: "tempo_entrega",
        match: (text) => {
            const t = normalize(text);
            if (t.length > 80) return false;
            return /(quanto.*tempo|demora.*chegar|chega.*quando|quanto.*demor|demora.*entreg|entreg.*minutos)/i.test(t);
        },
        reply: () => `🛵 Entrega chega em *30-50min* normalmente amorzinho!\nSe pedir agora tô garantindo que sai já 💜🐑✨`
    },

    // ============================================
    // 15. NÚMERO DE WHATSAPP / CONTATO
    // ============================================
    {
        id: "contato",
        match: (text) => {
            const t = normalize(text);
            return /(qual.*whatsapp|qual.*numero|outro contato|outro numero|telefone|fone)/i.test(t) && t.length < 80;
        },
        reply: (ctx) => {
            const num = ctx.franchise?.whatsappNumber || "5543999919777";
            return `Você já tá falando comigo no WhatsApp oficial! 💜\n📞 *${num}*\nMe conta o que precisa que eu cuido pra você 🐑✨`;
        }
    }
];

// ============================================
// Tenta achar fast reply pra mensagem
// Retorna { reply, matchedId } ou null
// ============================================
async function tryFastReply(text, ctx) {
    if (!text || text.length > 200) return null; // textos longos = pedido complexo, usa IA

    for (const rule of FAST_REPLIES) {
        try {
            if (rule.match(text, ctx)) {
                const reply = typeof rule.reply === "function"
                    ? await Promise.resolve(rule.reply(ctx))
                    : rule.reply;
                if (reply) {
                    return {
                        reply: String(reply).trim(),
                        matchedId: rule.id,
                        // meta opcional propaga p/ webhook decidir escalar/tocar painel
                        meta: rule.meta || null
                    };
                }
            }
        } catch (e) {
            console.warn(`[fast-reply] rule ${rule.id} crashed:`, e.message);
        }
    }
    return null;
}

module.exports = { tryFastReply, FAST_REPLIES };
