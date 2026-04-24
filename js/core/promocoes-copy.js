/* ============================================================
   MilkyPot Promoções — Copies para TVs (geradas pelo Ad Creative
   Strategist + Growth Hacker agents)
   ============================================================
   12 copies rotativos: 6 pro Desafio 10s + 6 pro Acertou Ganhou 300g.

   Usados em:
   - TV do Desafio: overlay rotativo em loop
   - TV Indoor (outras 2 TVs): slides adicionais no gerador
   - Challenge Studio: preview de criativos

   Formato por copy:
     { id, promo, title (max 4 palavras), subtitle, cta, emoji, hook }

   Hooks: gamificado | status | gratis | fomo | social
   ============================================================ */
(function(global){
    'use strict';

    const COPIES = [
        // ========== DESAFIO 10 SEGUNDOS ==========
        { id: "desafio10-01", promo: "desafio10", title: "PAROU NO 10?",       subtitle: "Cronômetro na mão. Acertou, levou.",                cta: "JOGA AGORA", emoji: "⏱️", hook: "gamificado" },
        { id: "desafio10-02", promo: "desafio10", title: "R$ 150 NA MESA",     subtitle: "Mega prêmio pra quem travar no segundo certo.",     cta: "EU QUERO",   emoji: "💰", hook: "status" },
        { id: "desafio10-03", promo: "desafio10", title: "TOPPING GRÁTIS",     subtitle: "Parou no 5, 10 ou 30? Tá seu.",                     cta: "TENTA",      emoji: "🎯", hook: "gratis" },
        { id: "desafio10-04", promo: "desafio10", title: "DEDO RÁPIDO PAGA",   subtitle: "Reflexo ruim não leva prêmio nenhum.",              cta: "ENCARA",     emoji: "⚡", hook: "gamificado" },
        { id: "desafio10-05", promo: "desafio10", title: "SORVETE DE GRAÇA",   subtitle: "Só travar o cronômetro no número certo.",           cta: "APERTA AÍ",  emoji: "🍦", hook: "gratis" },
        { id: "desafio10-06", promo: "desafio10", title: "A BELINHA DESAFIA",  subtitle: "Duvido você parar no 10 de primeira.",              cta: "PROVA",      emoji: "🐑", hook: "fomo" },

        // ========== ACERTOU GANHOU 300g ==========
        { id: "peso300-01",   promo: "peso300",   title: "300g = GRÁTIS",      subtitle: "Acertou o peso exato, não paga nada.",              cta: "MONTA",      emoji: "⚖️", hook: "gratis" },
        { id: "peso300-02",   promo: "peso300",   title: "ERROU 1g, PAGOU",    subtitle: "Margem zero. Balança não tem dó.",                  cta: "TENTA",      emoji: "😬", hook: "fomo" },
        { id: "peso300-03",   promo: "peso300",   title: "MÃO DE OURO",        subtitle: "Quem cravar 300g sai com pote de graça.",           cta: "VAI FUNDO",  emoji: "🏆", hook: "status" },
        { id: "peso300-04",   promo: "peso300",   title: "JÁ TEVE GENTE",      subtitle: "Vários clientes saíram sem pagar essa semana.",     cta: "TUA VEZ",    emoji: "👀", hook: "social" },
        { id: "peso300-05",   promo: "peso300",   title: "BALANÇA OU NADA",    subtitle: "Só 300 gramas te separam do pote free.",            cta: "MONTA JÁ",   emoji: "🎰", hook: "gamificado" },
        { id: "peso300-06",   promo: "peso300",   title: "OLHÔMETRO VALE",     subtitle: "Confia no seu instinto e leva sem pagar.",          cta: "ARRISCA",    emoji: "👁️", hook: "gamificado" }
    ];

    // Hook viral no potinho físico (estampa tampa/fundo)
    const HOOK_VIRAL_POTINHO = {
        principal: "ACERTEI NO @milkypot — ME DESAFIA?",
        alternativa: "300g DE SORTE. @milkypot"
    };

    // Métrica-estrela pro dashboard (TFH = Tentativas Filmadas por Hora)
    const METRICA_ESTRELA = {
        sigla: "TFH",
        nome: "Tentativas Filmadas por Hora",
        formula: "(nº tentativas registradas) × (% com vídeo/story marcando @milkypot)",
        metaSemana1: 8,
        descricao: "Captura funil inteiro: tráfego, engajamento, viralização"
    };

    // Loop retenção (D+1 cupom)
    const CUPONS_RETENCAO = {
        ganhador: {
            codigo: "VOLTA_AMIGO",
            msg: "🎉 Você acertou! Volta amanhã com 1 amigo e os DOIS ganham topping grátis.",
            validade: "D+1"
        },
        perdedor: {
            codigo: "QUASE_GANHOU",
            msg: "😅 Quase! Volta amanhã antes das 15h e ganha 10% OFF pra tentar de novo.",
            validade: "D+1"
        }
    };

    function byPromo(promo) {
        return COPIES.filter(c => c.promo === promo);
    }
    function shuffle() {
        const arr = COPIES.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    global.PromocoesCopy = {
        COPIES, byPromo, shuffle,
        HOOK_VIRAL_POTINHO, METRICA_ESTRELA, CUPONS_RETENCAO
    };

    if (typeof window !== 'undefined') window.PromocoesCopy = global.PromocoesCopy;
    if (typeof globalThis !== 'undefined') globalThis.PromocoesCopy = global.PromocoesCopy;
})(typeof window !== 'undefined' ? window : this);
