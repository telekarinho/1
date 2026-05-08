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
            return `${greeting}! Sou a Lulu 🐑💜\nA ovelhinha querida da MilkyPot ✨\n\nO que posso fazer por você?\n1️⃣ Fazer um pedido 🍨\n2️⃣ Ver cardápio 📖\n3️⃣ Saber sobre franquia 💼\n4️⃣ Falar com o Jocimar 👋\n\nÉ só me mandar o número (ou direto o que você quer 💕)!`;
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
            let msg = `Olha que delícia o cardápio hoje! 🍨💜\n`;
            for (const [cat, prods] of Object.entries(cats)) {
                msg += `\n*${cat}* (${brl(prods[0].price)}):\n`;
                msg += prods.slice(0, 6).map(p => `• ${p.name}`).join("\n");
                if (prods.length > 6) msg += `\n+ outros ${prods.length - 6}`;
                msg += "\n";
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
            return `Tamo aqui ó! 🏪💜\n📍 ${a}\n\nVai vir pegar ou prefere delivery? 🛵💕`;
        }
    },

    // ============================================
    // 5. FRETE / DELIVERY
    // ============================================
    {
        id: "frete",
        match: (text) => {
            const t = normalize(text);
            return /^(frete|entrega|delivery|taxa.*entreg|taxa.*delivery|quanto.*entreg|quanto.*delivery|valor.*entreg|tem entrega|faz entrega|entreg(am|a)|chega ate aqui)[\s!.,?]*$/.test(t)
                || /quanto.*frete/.test(t);
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
            return /^(obrigad[oa]|brigad[oa]|valeu|vlw|gratidao|gratidão|thanks|tnks|tchau|ate mais|ate logo|falou|flw|bye)[\s!.,?💜🐑✨💕]*$/.test(t);
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
    // 11. FALAR COM HUMANO
    // ============================================
    {
        id: "humano",
        match: (text) => {
            const t = normalize(text);
            return /(falar com (humano|atendente|jocimar|pessoa)|chamar (humano|jocimar)|atendente real|reclamacao|reclam(ar|o)|insatisfeit|com raiva|odiei|horrivel|merda|fila|demoraram|frio|nao chegou|nao recebi|errado o pedido|pedido errado)/.test(t)
                || t === "4" || t === "4️⃣";
        },
        reply: () => `Já chamei o Jocimar aqui amorzinho 💜🐑\nEle te atende em pouquinho viu?\n(Pode demorar uns minutinhos pq ele tá cuidando da loja)\n\nEnquanto isso me conta o que aconteceu pra eu já adiantar pra ele 💕`
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
        reply: () => `Eba! 🐑💜✨\nMe diz o que vai ser amorzinho:\n\n• *Sabor* (ex: Amora Apaixonada, Blue Ice, Ninho da Vovó...)\n• Se preferir Milkshake ou Sundae\n• Quantos potinhos? 🍨\n\nE depois vejo se é delivery ou retirada e fechamos! 💕`
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
                    return { reply: String(reply).trim(), matchedId: rule.id };
                }
            }
        } catch (e) {
            console.warn(`[fast-reply] rule ${rule.id} crashed:`, e.message);
        }
    }
    return null;
}

module.exports = { tryFastReply, FAST_REPLIES };
