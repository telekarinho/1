/* MilkyPot Cloud Functions — Lembretes de bater ponto via FCM
   Cron a cada 5 minutos: verifica funcionarios com horario chegando e dispara push.
   Tambem aprovacao de banco de horas notifica funcionario. */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const REGION = "southamerica-east1";

function getDb() { return admin.firestore(); }
function getMessaging() { return admin.messaging(); }

// Calcula minutos do horario "HH:MM"
function hhmmToMinutes(hhmm) {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function nowMinutesLocal() {
    const now = new Date();
    // Brasilia UTC-3 (sem horario de verao desde 2019)
    const brasilia = new Date(now.getTime() - 3 * 3600000);
    return brasilia.getUTCHours() * 60 + brasilia.getUTCMinutes();
}

function dayOfWeek() {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const now = new Date();
    const brasilia = new Date(now.getTime() - 3 * 3600000);
    return dias[brasilia.getUTCDay()];
}

/**
 * Cron a cada 5 minutos — checa quem precisa ser lembrado.
 */
exports.cron_remindPunch = onSchedule({
    schedule: "every 5 minutes",
    region: REGION,
    timeZone: "America/Sao_Paulo"
}, async () => {
    const db = getDb();
    const dia = dayOfWeek();
    const nowMin = nowMinutesLocal();

    // Itera todas franquias
    const franchises = await db.collection("franquias").get();
    const sentCount = { entrada: 0, almoco_saida: 0, almoco_volta: 0, saida: 0 };

    for (const fdoc of franchises.docs) {
        const franchiseId = fdoc.id;

        // Busca staff ativos
        const staffSnap = await db.collection("staff").where("franchiseId", "==", franchiseId).get();
        if (staffSnap.empty) continue;

        for (const sdoc of staffSnap.docs) {
            const staff = sdoc.data();
            if (!staff.active || !staff.jornada) continue;

            const j = staff.jornada;
            const folgas = j.folgas || ['domingo'];
            if (folgas.includes(dia)) continue; // de folga hoje

            // Calcula horarios programados
            const horariosAlvo = [];
            if (j.hora_entrada) horariosAlvo.push({ time: hhmmToMinutes(j.hora_entrada), label: 'Entrada', tag: 'entrada' });
            if (j.hora_saida) horariosAlvo.push({ time: hhmmToMinutes(j.hora_saida), label: 'Saída', tag: 'saida' });
            if (j.hora_entrada && j.hora_saida && j.intervalo_almoco_min) {
                const entrada = hhmmToMinutes(j.hora_entrada);
                const saida = hhmmToMinutes(j.hora_saida);
                const meio = Math.floor((entrada + saida - j.intervalo_almoco_min) / 2);
                horariosAlvo.push({ time: meio, label: 'Início almoço', tag: 'almoco_saida' });
                horariosAlvo.push({ time: meio + j.intervalo_almoco_min, label: 'Volta almoço', tag: 'almoco_volta' });
            }

            // Manda lembrete 10min antes (com tolerancia de 5min pro cron de 5min)
            for (const alvo of horariosAlvo) {
                const diff = alvo.time - nowMin;
                if (diff < 5 || diff > 14) continue; // janela 10min antes (+/- 5)

                // Busca tokens FCM do funcionario
                const subsSnap = await db.collection("fcm_subscriptions")
                    .where("franchiseId", "==", franchiseId)
                    .where("staffId", "==", staff.id || sdoc.id)
                    .where("active", "==", true)
                    .get();

                if (subsSnap.empty) continue;
                const tokens = subsSnap.docs.map(d => d.data().token).filter(Boolean);
                if (!tokens.length) continue;

                // Anti-duplicacao: marca dia + tag pra nao mandar 2x
                const dedupId = `${franchiseId}_${staff.id || sdoc.id}_${new Date().toISOString().slice(0,10)}_${alvo.tag}`;
                const dedupRef = db.collection("reminder_dedupe").doc(dedupId);
                const dedupExists = (await dedupRef.get()).exists;
                if (dedupExists) continue;

                try {
                    await getMessaging().sendEachForMulticast({
                        tokens: tokens,
                        notification: {
                            title: 'MilkyPot — Lembrete',
                            body: `Em 10 min: ${alvo.label}. Não esqueça de bater ponto!`
                        },
                        data: { url: '/funcionario/?action=punch', tag: alvo.tag },
                        webpush: {
                            fcmOptions: { link: '/funcionario/?action=punch' },
                            notification: {
                                icon: '/images/logo-milkypot.png',
                                vibrate: [200, 100, 200]
                            }
                        }
                    });
                    await dedupRef.set({ sentAt: new Date().toISOString(), staffName: staff.name || '' });
                    sentCount[alvo.tag] = (sentCount[alvo.tag] || 0) + 1;
                } catch (e) {
                    console.error(`Erro enviando push pra ${staff.name}:`, e.message);
                }
            }
        }
    }

    console.log('cron_remindPunch concluido. Push enviados:', sentCount);
    return null;
});

/**
 * Notifica funcionario quando solicitacao de banco horas e aprovada/rejeitada
 */
exports.bankHours_notifyDecision = onCall({ region: REGION }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login necessario");
    const { franchiseId, requestId, decision, observation } = request.data;
    if (!franchiseId || !requestId) throw new HttpsError("invalid-argument", "franchiseId e requestId obrigatorios");

    const db = getDb();
    const reqRef = db.collection("bank_hours_requests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) throw new HttpsError("not-found", "Solicitacao nao existe");
    const req = reqSnap.data();

    const updates = {
        status: decision,
        decidedAt: new Date().toISOString(),
        decidedBy: request.auth.token.email || request.auth.uid
    };
    if (decision === 'approved') updates.approverObservation = observation || '';
    if (decision === 'rejected') updates.rejectReason = observation || '';
    await reqRef.update(updates);

    // Push pro funcionario
    const subsSnap = await db.collection("fcm_subscriptions")
        .where("staffId", "==", req.staffId)
        .where("active", "==", true)
        .get();
    const tokens = subsSnap.docs.map(d => d.data().token).filter(Boolean);
    if (tokens.length) {
        try {
            await getMessaging().sendEachForMulticast({
                tokens: tokens,
                notification: {
                    title: decision === 'approved' ? '✅ Banco de horas APROVADO' : '❌ Solicitação rejeitada',
                    body: decision === 'approved'
                        ? `Sua solicitação de ${Math.floor(req.hoursMin/60)}h foi aprovada.`
                        : `Motivo: ${observation || 'Não informado'}`
                },
                data: { url: '/funcionario/?tab=banco' }
            });
        } catch (e) { console.error('Push notify error:', e.message); }
    }

    return { success: true };
});

/**
 * Funcionario solicita banco de horas — registra e notifica gerentes
 */
exports.bankHours_request = onCall({ region: REGION }, async (request) => {
    const { franchiseId, staffId, staffName, type, hoursMin, useDate, reason } = request.data;
    if (!franchiseId || !staffId || !hoursMin) throw new HttpsError("invalid-argument", "Dados incompletos");

    const db = getDb();
    const id = 'bh_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    await db.collection("bank_hours_requests").doc(id).set({
        id, franchiseId, staffId, staffName, type, hoursMin,
        useDate: useDate || null, reason: reason || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    return { success: true, requestId: id };
});
