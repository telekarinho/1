/* ============================================
   MilkyPot — Cloud Function: Nutrição Automatizada de Leads VIP
   ============================================
   Roda 1x/dia (10:00 UTC = 07:00 BR), verifica leads na coleção
   /franchise_leads e dispara emails de nutrição em sequência:

     T+1d   — "Bem-vindo + áudio do Jocimar virá no WhatsApp"
     T+7d   — "Dossiê: o que está pronto, próximos passos"
     T+30d  — "Atualização da matriz Londrina + lembrete VIP"
     T+90d  — "Última chamada antes da abertura oficial"

   Cada email só dispara UMA vez por lead (controle via campo
   nurtureSent.{day1,day7,day30,day90} no doc do lead).

   PARA leads que JÁ tem statusContato = 'fechado' ou 'desqualificado':
     pula nutrição (não precisa).

   ============================================ */

"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

const ADMIN_EMAIL = "milkypot.com@gmail.com";
const WHATSAPP_JOCIMAR = "5543999919777";

// ============================================
// Templates de email por dia da sequência
// ============================================
function buildEmailHtml(stage, lead) {
    const nome = String(lead.nome || "").split(" ")[0] || lead.nome || "fundador";
    const base = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9FAFB">' +
        '<div style="background:linear-gradient(135deg,#7B1FA2 0%,#FF4F8A 60%,#FFD54F 100%);color:#fff;padding:30px 24px;text-align:center">' +
            '<div style="font-size:48px;line-height:1;margin-bottom:6px">🐑</div>' +
            '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.9;font-weight:800">Lista VIP MilkyPot</div>' +
        '</div>';
    const footer = '<div style="background:#fff;padding:18px 24px;border-top:1px solid #E5E7EB;text-align:center;font-size:13px;color:#6B7280">' +
        '💬 Fala direto comigo no WhatsApp:<br>' +
        '<a href="https://wa.me/' + WHATSAPP_JOCIMAR + '" style="color:#7E57C2;font-weight:700">https://wa.me/' + WHATSAPP_JOCIMAR + '</a>' +
        '<p style="margin:14px 0 0">Um abraço,<br><strong style="color:#7E57C2">Jocimar e a Lilo 🐑</strong></p>' +
        '<p style="font-size:11px;color:#9CA3AF;margin-top:12px">MilkyPot — Londrina-PR</p>' +
    '</div></div>';

    let body = "";
    if (stage === "day1") {
        body = '<div style="background:#fff;padding:28px 24px;font-size:15px;line-height:1.6;color:#374151">' +
            '<h2 style="font-family:Baloo 2,cursive;font-size:24px;margin:0 0 14px;color:#2D1747">Oi, ' + nome + ', um abraço pessoal 💜</h2>' +
            '<p style="margin:0 0 14px">Aqui é o Jocimar, dono da MilkyPot. Vi que você entrou ontem na nossa Lista VIP de fundadores — quero te dizer pessoalmente: <strong>obrigado pela confiança</strong>.</p>' +
            '<p style="margin:0 0 14px">Você está num grupo pequeno de pessoas que vai abrir as primeiras MilkyPot do Brasil junto com a gente. Cada uma dessas pessoas eu quero conhecer pelo nome.</p>' +
            '<p style="margin:0 0 14px">Nos próximos dias eu te chamo no WhatsApp pra a gente conversar sobre <strong>sua região</strong>, suas expectativas, e o que faz sentido pra você.</p>' +
            '<p style="margin:0 0 14px">Enquanto isso, dá uma olhada no que estamos preparando:</p>' +
            '<div style="background:#FFF0F6;border-left:4px solid #FF4F8A;padding:14px 16px;border-radius:8px;margin:14px 0">' +
                '<strong>🌎 Vagas limitadas por cidade.</strong><br>' +
                '<span style="font-size:13.5px">Cada cidade terá número limitado de unidades. Quem entra na Lista VIP tem prioridade na escolha de região antes da abertura oficial.</span>' +
            '</div>' +
            '<p style="margin:0">Em breve você recebe nosso primeiro update da matriz em Londrina.</p>' +
        '</div>';
    } else if (stage === "day7") {
        body = '<div style="background:#fff;padding:28px 24px;font-size:15px;line-height:1.6;color:#374151">' +
            '<h2 style="font-family:Baloo 2,cursive;font-size:22px;margin:0 0 14px;color:#2D1747">📊 Update da semana — MilkyPot Londrina</h2>' +
            '<p style="margin:0 0 14px">Oi, ' + nome + '! Faz uma semana que você entrou na Lista VIP. Quero te dar um update real do que está acontecendo aqui na matriz:</p>' +
            '<div style="background:#F9FAFB;border-radius:10px;padding:16px;margin:0 0 16px">' +
                '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">✅ <strong>Cardápio validado</strong> — 17 sabores de milkshake + 17 de sundae rodando há 30+ dias</div>' +
                '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">✅ <strong>Operação testada</strong> — Muffato Quintino fechou primeira semana cheia</div>' +
                '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">🔄 <strong>Tabela de pré-lançamento</strong> — finalizando cada um dos 3 modelos com o jurídico</div>' +
                '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">🔄 <strong>Manual operacional</strong> — fechando cada processo (compras, fornecedores homologados, layout de loja)</div>' +
                '<div style="padding:6px 0">📅 <strong>Abertura oficial</strong> — em breve, com aviso antecipado pra você</div>' +
            '</div>' +
            '<p style="margin:0 0 14px">Quero ouvir de você: <strong>qual sua maior dúvida hoje?</strong> Capital? Localização? Como funciona o suporte?</p>' +
            '<p style="margin:0 0 14px">Responde esse email com sua dúvida principal — eu mesmo respondo na próxima semana com vídeo curto explicando.</p>' +
            '<p style="margin:0">📌 Lembrete: você está no <strong>primeiro lote</strong> e tem prioridade na escolha de região.</p>' +
        '</div>';
    } else if (stage === "day30") {
        body = '<div style="background:#fff;padding:28px 24px;font-size:15px;line-height:1.6;color:#374151">' +
            '<h2 style="font-family:Baloo 2,cursive;font-size:22px;margin:0 0 14px;color:#2D1747">🎯 Já faz 1 mês, ' + nome + '!</h2>' +
            '<p style="margin:0 0 14px">Quero ser direto com você: você ainda está na Lista VIP, ainda tem prioridade na sua região, e a abertura oficial está cada vez mais perto.</p>' +
            '<div style="background:#FFF0F6;border:2px solid #FF4F8A;border-radius:12px;padding:16px;margin:0 0 16px">' +
                '<div style="font-size:14px;font-weight:800;color:#7B1FA2;margin-bottom:6px">📍 SUA POSIÇÃO NA FILA</div>' +
                '<div style="font-size:13.5px">Você é um dos primeiros nomes da sua região. Quando abrir o programa oficial, <strong>você vai receber o convite antes do público geral</strong> — com tabela de pré-lançamento exclusiva.</div>' +
            '</div>' +
            '<p style="margin:0 0 14px">Se a sua situação mudou (mudou de cidade, mudou capital, decidiu não seguir agora), me avisa por email ou WhatsApp. Sem julgamento — só quero manter a Lista VIP só com gente que ainda quer estar nela.</p>' +
            '<p style="margin:0">E se continua firme: <strong>vamos juntos</strong>. 🐑</p>' +
        '</div>';
    } else if (stage === "day90") {
        body = '<div style="background:#fff;padding:28px 24px;font-size:15px;line-height:1.6;color:#374151">' +
            '<h2 style="font-family:Baloo 2,cursive;font-size:22px;margin:0 0 14px;color:#2D1747">⏰ ' + nome + ', última chamada</h2>' +
            '<p style="margin:0 0 14px">Faz 90 dias que você entrou na Lista VIP. Quero ser transparente: a abertura oficial das franquias MilkyPot está chegando e <strong>preciso saber se você ainda está dentro</strong>.</p>' +
            '<p style="margin:0 0 14px">Não é cobrança — é organização. As vagas de cada cidade vão ser distribuídas pra quem ainda está ativo na lista. Se você não responder, vou assumir que mudou de planos e abrir sua vaga pra próxima pessoa.</p>' +
            '<div style="text-align:center;margin:20px 0">' +
                '<a href="https://wa.me/' + WHATSAPP_JOCIMAR + '?text=Continuo%20interessado%20na%20Lista%20VIP%20MilkyPot" style="display:inline-block;background:linear-gradient(135deg,#FF4F8A,#7E57C2);color:#fff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:800;font-family:Baloo 2,cursive">🐑 Continuo na Lista VIP</a>' +
            '</div>' +
            '<p style="margin:0">Resposta rápida no WhatsApp acima ou responde esse email. Qualquer um serve.</p>' +
        '</div>';
    }
    return base + body + footer;
}

function buildSubject(stage, lead) {
    const nome = String(lead.nome || "").split(" ")[0] || "";
    const subjects = {
        day1:  "Oi " + nome + ", aqui é o Jocimar 🐑",
        day7:  "📊 Update da matriz MilkyPot — semana 1",
        day30: "🎯 1 mês na Lista VIP — sua posição na fila",
        day90: "⏰ Última chamada — sua vaga ainda está reservada?"
    };
    return subjects[stage] || "Update MilkyPot";
}

// ============================================
// Cloud Function: roda diário, processa nutrição
// ============================================
exports.franchiseNurtureCron = onSchedule({
    schedule: "every day 10:00",          // 10:00 UTC = 07:00 BR
    timeZone: "America/Sao_Paulo",
    region: "us-central1"
}, async () => {
    if (!admin.apps.length) admin.initializeApp();
    const db = admin.firestore();

    logger.info("[franchise-nurture] iniciando ciclo diário");

    // Lê todos leads com statusContato em estado nutrível
    // (novo, conversa, qualificado, ou null/sem status)
    const snap = await db.collection("franchise_leads").get();

    const now = Date.now();
    const stages = [
        { key: "day1",  days: 1  },
        { key: "day7",  days: 7  },
        { key: "day30", days: 30 },
        { key: "day90", days: 90 }
    ];

    let processed = 0;
    let emailsSent = 0;
    let skippedFinal = 0;

    for (const doc of snap.docs) {
        const lead = doc.data();
        processed++;

        // Pula leads finalizados (fechado/desqualificado) — não nutre mais
        const status = lead.statusContato || "novo";
        if (status === "fechado" || status === "desqualificado") {
            skippedFinal++;
            continue;
        }

        // Calcula idade do lead em dias
        const criadoEm = lead.criadoEm ? new Date(lead.criadoEm).getTime() : null;
        if (!criadoEm) continue;
        const ageDays = Math.floor((now - criadoEm) / 86400000);
        if (ageDays < 1) continue; // muito novo

        const sent = lead.nurtureSent || {};

        // Pra cada estágio: se chegou no dia E ainda não enviou → dispara
        for (const stage of stages) {
            if (ageDays >= stage.days && !sent[stage.key]) {
                try {
                    // Email pro lead via Trigger Email Extension (collection /mail)
                    await db.collection("mail").add({
                        to: [lead.email],
                        cc: [ADMIN_EMAIL],
                        from: "MilkyPot <noreply@milkypot.com>",
                        replyTo: ADMIN_EMAIL,
                        message: {
                            subject: buildSubject(stage.key, lead),
                            html: buildEmailHtml(stage.key, lead)
                        },
                        metadata: {
                            leadId: doc.id,
                            stage: stage.key,
                            origem: "franchise_nurture_cron"
                        }
                    });

                    // Atualiza nurtureSent no lead pra não disparar de novo
                    await doc.ref.update({
                        ["nurtureSent." + stage.key]: new Date().toISOString()
                    });

                    emailsSent++;
                    logger.info("[franchise-nurture] enviado " + stage.key + " pra " + lead.email);
                } catch (err) {
                    logger.warn("[franchise-nurture] falhou " + stage.key + " pra " + lead.email + ": " + err.message);
                }
            }
        }
    }

    logger.info("[franchise-nurture] ciclo concluído", {
        processed, emailsSent, skippedFinal
    });
    return null;
});
