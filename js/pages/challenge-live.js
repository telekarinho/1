/* ============================================================
   MilkyPot — Challenge Live (Desafio 10s + 300g)
   ============================================================
   Broadcast do desafio atual pras TVs mostrarem em tempo real.

   Schema Firestore:
     datastore/challenge_live_{fid} = {
       active: true,
       type: "10s" | "300g",
       playerName: "Marina",
       startedAt: ISO,
       durationMs: 10000,           // apenas pra 10s
       result: null | "won" | "lost",
       finalValue: 10.03,            // seg ou g
       finishedAt: null | ISO
     }
     datastore/challenge_10s_winners_{fid} = [{name, stoppedAt, at}, ...]
     datastore/challenge_300g_winners_{fid} = [{name, weight, at}, ...]

   Métodos:
     ChallengeLive.start(fid, type, playerName)
     ChallengeLive.finish(fid, finalValue)
     ChallengeLive.cancel(fid)
     ChallengeLive.onLive(fid, callback)   // listener em tempo real pro APK
   ============================================================ */
(function(global){
    'use strict';

    const TOLERANCE_10S = 0.3;      // ±0.3s conta como vitória
    const TOLERANCE_300G = 3.0;     // ±3g conta como vitória

    function start(fid, type, playerName) {
        if (!fid || !type) return { success: false, error: 'fid e type obrigatórios' };
        const live = {
            active: true,
            type: type,
            playerName: playerName || 'Cliente',
            startedAt: new Date().toISOString(),
            durationMs: type === '10s' ? 10000 : null,
            result: null,
            finalValue: null,
            finishedAt: null
        };
        DataStore.set('challenge_live_' + fid, live);
        return { success: true, live: live };
    }

    function finish(fid, finalValue) {
        const key = 'challenge_live_' + fid;
        const live = DataStore.get(key);
        if (!live || !live.active) return { success: false, error: 'Nenhum desafio em andamento' };

        const val = Number(finalValue);
        const target = live.type === '10s' ? 10.0 : 300.0;
        const tolerance = live.type === '10s' ? TOLERANCE_10S : TOLERANCE_300G;
        const won = Math.abs(val - target) <= tolerance;

        live.active = false;
        live.result = won ? 'won' : 'lost';
        live.finalValue = val;
        live.finishedAt = new Date().toISOString();
        DataStore.set(key, live);

        // Hall da fama: se ganhou, adiciona
        if (won) {
            const winnersKey = live.type === '10s'
                ? 'challenge_10s_winners_' + fid
                : 'challenge_300g_winners_' + fid;
            const list = DataStore.get(winnersKey) || [];
            list.push({
                name: live.playerName,
                [live.type === '10s' ? 'stoppedAt' : 'weight']: val,
                at: live.finishedAt
            });
            // Mantém últimos 100
            if (list.length > 100) list.splice(0, list.length - 100);
            DataStore.set(winnersKey, list);
        }

        // Depois de 6s, "desliga" o desafio na TV (APK) mas deixa o resultado visível
        setTimeout(() => {
            const current = DataStore.get(key);
            if (current && !current.active && current.finishedAt === live.finishedAt) {
                current._clearedFromTv = true;
                DataStore.set(key, current);
            }
        }, 6000);

        return { success: true, won: won, live: live };
    }

    function cancel(fid) {
        const key = 'challenge_live_' + fid;
        const live = DataStore.get(key);
        if (!live) return { success: true };
        live.active = false;
        live.result = 'cancelled';
        live.finishedAt = new Date().toISOString();
        DataStore.set(key, live);
        return { success: true };
    }

    function getCurrent(fid) {
        return DataStore.get('challenge_live_' + fid);
    }

    global.ChallengeLive = {
        start, finish, cancel, getCurrent,
        TOLERANCE_10S, TOLERANCE_300G
    };
})(typeof window !== 'undefined' ? window : this);
