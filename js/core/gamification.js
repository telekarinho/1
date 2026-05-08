/* ============================================
   MilkyPot — Sistema de Gamificacao Completo
   ============================================
   Todas as features sao OPT-IN — admin precisa ativar individualmente.
   Se flag = false, NADA aparece no portal do funcionario.

   Features:
   1. Mensagens motivacionais diarias
   2. Streaks (sequencias de dias bons)
   3. Badges/conquistas
   4. Notificacoes contextuais
   5. Dashboard de progresso pessoal
   6. Catalogo de recompensas por pontos
   7. Modo "Recovery" (encorajamento apos erro)
   8. Onboarding gamificado
   9. Mural de reconhecimento da loja
   10. Easter eggs / surpresas
   11. Voz da Belinha
   12. Calendario visual
   13. Sons de vitoria
   14. Story diario
   ============================================ */

(function () {
    'use strict';

    var DEFAULT_FLAGS = {
        // Ferramentas individuais — admin liga uma a uma
        motivationalMessages:    false,
        streaks:                 false,
        badges:                  false,
        notifications:           false,
        progressDashboard:       false,
        rewardsCatalog:          false,
        recoveryMode:            false,
        onboardingMissions:      false,
        recognitionWall:         false,
        easterEggs:              false,
        belinhaVoice:            false,
        visualCalendar:          false,
        sounds:                  false,
        dailyStory:              false,
        peerRanking:             false,           // ranking publico (cuidado)
        socialShare:             false,
        wellbeingReminders:      false,
        referralProgram:         false,

        // Tom das mensagens (configuravel)
        tone:                    'friendly',     // 'friendly' | 'professional' | 'epic' | 'fun'
        useBelinhaCharacter:     false
    };

    var DEFAULT_REWARDS = [
        // Catalogo de recompensas configuravel — admin pode customizar
        { id: 'r1', name: '1 sorvete extra', points: 100, icon: '🍦', enabled: true },
        { id: 'r2', name: '1h saída antecipada', points: 200, icon: '⏰', enabled: false },
        { id: 'r3', name: '1 dia de folga adicional', points: 500, icon: '📅', enabled: false },
        { id: 'r4', name: 'Bônus R$ 100', points: 1000, icon: '💰', enabled: false }
    ];

    var BADGES = [
        { id: 'first_punch',        name: 'Bem-vindo!',                icon: '🌟', desc: '1ª batida de ponto',                       condition: 'first_punch' },
        { id: 'week_punctual',      name: 'Pontual da Semana',         icon: '⏰', desc: '7 dias seguidos sem atraso',                condition: 'streak_7_no_late' },
        { id: 'month_master',       name: 'Mestre da Pontualidade',    icon: '🏆', desc: '30 dias seguidos sem atraso',               condition: 'streak_30_no_late' },
        { id: 'legend',             name: 'Lenda',                     icon: '🥇', desc: '90 dias seguidos sem atraso',               condition: 'streak_90_no_late' },
        { id: 'diamond',            name: 'Diamante MilkyPot',         icon: '💎', desc: '1 ano sem incidentes',                      condition: 'streak_365_no_late' },
        { id: 'zero_absences',      name: 'Mês Limpo',                 icon: '🎯', desc: 'Mês sem faltas sem justificativa',          condition: 'month_zero_absences' },
        { id: 'mvp_month',          name: 'MVP do Mês',                icon: '👑', desc: 'Top 1 em comissão no mês',                  condition: 'mvp_commission_month' },
        { id: 'overtime_pro',       name: 'Foguete',                   icon: '🚀', desc: '5 dias com horas extras autorizadas',       condition: 'overtime_5_days' },
        { id: 'centurion',          name: 'Centenário',                icon: '💯', desc: '100ª batida de ponto',                      condition: 'count_punch_100' },
        { id: 'recovery',           name: 'Ferrenho',                  icon: '💪', desc: 'Semana boa após semana ruim',               condition: 'recovery_week' }
    ];

    var MESSAGES = {
        friendly: {
            morning: [
                'Bom dia, {nome}! 🌅 Hoje vai ser incrível!',
                'Oi {nome}! Bora começar mais um dia top!',
                'Bom dia! Tu manda muito bem ❤️',
                '☀️ Bom dia, {nome}! O time tá contando contigo.',
                'Oiii! Bora arrasar hoje, {nome}? 💪'
            ],
            afternoon: [
                'Boa tarde, {nome}! Volta bonita do almoço!',
                'Tá indo bem, {nome}! Continua assim 👏',
                'Tarde produtiva, {nome}!'
            ],
            evening: [
                'Boa noite, {nome}! Quase fim do dia.',
                'Última correria, {nome}! Tu consegue 💪'
            ],
            monday: [
                '{nome}, segunda chegou! Bora começar a semana com energia ⚡',
                'Nova semana, {nome}! Vamos com tudo!'
            ],
            friday: [
                '{nome}, sexta-feira! Última correria 🎉',
                'Sextou, {nome}! Mais um dia e fim de semana!'
            ],
            achievement: [
                '🎉 {nome}, você arrasou! Conquistou: {achievement}',
                '🏆 Mandou bem, {nome}! Nova conquista: {achievement}',
                'Olha esse desempenho! {nome}, você ganhou: {achievement} ✨'
            ],
            recovery: [
                'Calma, {nome}. Todo mundo erra. Bora recuperar 💪',
                '{nome}, mais 3 dias seguidos pontual e tu zera essa pendência!',
                'Não desanima, {nome}. Tu já provou que consegue. Bora!'
            ]
        },
        epic: {
            morning: [
                '⚔️ Bom dia, {nome}! Hoje tu vai dominar!',
                'O dia é teu, {nome}! 🔥 Vai com tudo!',
                '🚀 Bom dia, {nome}! Grandes coisas te esperam.'
            ],
            achievement: [
                '⚡ ÉPICO! {nome} desbloqueou: {achievement}',
                '🏆 LENDÁRIO! {nome} é um dos melhores!'
            ],
            recovery: [
                'Heróis caem mas se levantam. Bora, {nome}!',
                'Cada batalha perdida ensina algo, {nome}. Vamos pra próxima!'
            ]
        },
        professional: {
            morning: [
                'Bom dia, {nome}. Tenha um excelente dia de trabalho.',
                'Olá {nome}, bom dia. Bom desempenho hoje.'
            ],
            achievement: [
                'Parabéns {nome}, você atingiu: {achievement}',
                'Reconhecimento {nome}: {achievement}'
            ],
            recovery: [
                '{nome}, considere ajustar seu alarme para 15min antes.',
                'Sugestão de melhoria: definir lembretes adicionais.'
            ]
        },
        fun: {
            morning: [
                'Eaí {nome}! Tá pronto pra mais um dia? 😎',
                'Acordei pensando: o {nome} vai bombar hoje!',
                'Bom dia! Como tá a vida, {nome}? Bora trabalhar!'
            ]
        }
    };

    function nowIso() { return new Date().toISOString(); }

    // ----------------------------------------
    // Config por franquia
    // ----------------------------------------
    function getConfig(franchiseId) {
        if (typeof DataStore === 'undefined') return { flags: DEFAULT_FLAGS, rewards: DEFAULT_REWARDS };
        var franchises = DataStore.getAllFranchises() || [];
        var f = franchises.find(function (x) { return x.id === franchiseId; });
        var saved = (f && f.gamificationConfig) ? f.gamificationConfig : {};
        return {
            flags: Object.assign({}, DEFAULT_FLAGS, saved.flags || {}),
            rewards: saved.rewards || DEFAULT_REWARDS
        };
    }

    function saveConfig(franchiseId, config) {
        if (typeof DataStore === 'undefined') return { success: false };
        var franchises = DataStore.get('franchises') || [];
        var idx = franchises.findIndex(function (x) { return x.id === franchiseId; });
        if (idx === -1) return { success: false };
        franchises[idx].gamificationConfig = config;
        franchises[idx].gamificationConfigUpdatedAt = nowIso();
        DataStore.set('franchises', franchises);
        return { success: true };
    }

    function isFeatureEnabled(franchiseId, featureName) {
        var cfg = getConfig(franchiseId);
        return !!(cfg.flags && cfg.flags[featureName]);
    }

    // ----------------------------------------
    // Mensagens motivacionais contextuais
    // ----------------------------------------
    function getMotivationalMessage(franchiseId, context, vars) {
        if (!isFeatureEnabled(franchiseId, 'motivationalMessages')) return null;
        var cfg = getConfig(franchiseId);
        var tone = cfg.flags.tone || 'friendly';
        var pool = (MESSAGES[tone] && MESSAGES[tone][context]) || MESSAGES.friendly[context] || [];
        if (!pool.length) return null;
        var msg = pool[Math.floor(Math.random() * pool.length)];
        Object.keys(vars || {}).forEach(function (k) {
            msg = msg.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k] || '');
        });
        return msg;
    }

    // ----------------------------------------
    // Streaks (sequencias)
    // ----------------------------------------
    function computeStreak(franchiseId, staffId) {
        if (!isFeatureEnabled(franchiseId, 'streaks')) return null;
        if (typeof TimeClock === 'undefined') return null;

        // Calcula dias consecutivos sem atraso (back to today)
        var today = new Date();
        var streak = 0;
        var maxStreak = 0;
        var currentDate = new Date(today);

        for (var i = 0; i < 365; i++) {
            var dateStr = currentDate.toISOString().slice(0, 10);
            var dia = TimeClock.computeDay(franchiseId, staffId, dateStr);
            if (dia.records.length > 0 && (!dia.minutosAtraso || dia.minutosAtraso === 0)) {
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            } else if (dia.isFolga) {
                // Folga nao quebra streak
            } else if (dia.records.length === 0 && i > 0) {
                // Sem registros = quebrou
                break;
            } else if (dia.minutosAtraso > 0) {
                break;
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return { current: streak, longest: maxStreak };
    }

    // ----------------------------------------
    // Badges
    // ----------------------------------------
    function getStaffBadges(franchiseId, staffId) {
        if (!isFeatureEnabled(franchiseId, 'badges')) return [];
        if (typeof DataStore === 'undefined') return [];

        var earned = (DataStore.getCollection('staff_badges', franchiseId) || [])
            .filter(function (b) { return b.staffId === staffId; });

        // Calcula badges em tempo real tambem
        var calculated = [];
        var streak = computeStreak(franchiseId, staffId);
        if (streak) {
            if (streak.current >= 7) calculated.push('week_punctual');
            if (streak.current >= 30) calculated.push('month_master');
            if (streak.current >= 90) calculated.push('legend');
            if (streak.current >= 365) calculated.push('diamond');
        }

        var total = (DataStore.getCollection('time_clock_records', franchiseId) || [])
            .filter(function (r) { return r.staffId === staffId; }).length;
        if (total >= 1) calculated.push('first_punch');
        if (total >= 100) calculated.push('centurion');

        var allBadgeIds = Array.from(new Set([
            ...earned.map(function (b) { return b.badgeId; }),
            ...calculated
        ]));

        return BADGES.filter(function (b) { return allBadgeIds.indexOf(b.id) !== -1; });
    }

    function awardBadge(franchiseId, staffId, badgeId) {
        if (typeof DataStore === 'undefined') return { success: false };
        var existing = (DataStore.getCollection('staff_badges', franchiseId) || [])
            .find(function (b) { return b.staffId === staffId && b.badgeId === badgeId; });
        if (existing) return { success: true, alreadyAwarded: true };

        var badge = BADGES.find(function (b) { return b.id === badgeId; });
        if (!badge) return { success: false };

        DataStore.addToCollection('staff_badges', franchiseId, {
            id: 'badge_' + Date.now(),
            staffId: staffId,
            badgeId: badgeId,
            badgeName: badge.name,
            badgeIcon: badge.icon,
            awardedAt: nowIso()
        });
        return { success: true, badge: badge };
    }

    // ----------------------------------------
    // Recompensas (catalogo)
    // ----------------------------------------
    function getRewardsCatalog(franchiseId) {
        if (!isFeatureEnabled(franchiseId, 'rewardsCatalog')) return [];
        var cfg = getConfig(franchiseId);
        return (cfg.rewards || []).filter(function (r) { return r.enabled; });
    }

    function redeemReward(franchiseId, staffId, rewardId, currentPoints) {
        var reward = getRewardsCatalog(franchiseId).find(function (r) { return r.id === rewardId; });
        if (!reward) return { success: false, error: 'Recompensa nao disponivel' };
        if (currentPoints < reward.points) {
            return { success: false, error: 'Voce tem ' + currentPoints + ' pontos. Precisa de ' + reward.points + '.' };
        }

        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection('reward_redemptions', franchiseId, {
                id: 'redeem_' + Date.now(),
                staffId: staffId,
                rewardId: rewardId,
                rewardName: reward.name,
                pointsCost: reward.points,
                status: 'pending',                 // gerente precisa aprovar
                redeemedAt: nowIso()
            });
        }
        return { success: true, reward: reward };
    }

    // ----------------------------------------
    // Calendario visual mensal
    // ----------------------------------------
    function getMonthCalendar(franchiseId, staffId, year, month) {
        if (!isFeatureEnabled(franchiseId, 'visualCalendar')) return null;
        if (typeof TimeClock === 'undefined') return null;
        var espelho = TimeClock.computeMonth(franchiseId, staffId, year, month);
        return espelho.days.map(function (d) {
            var color, label;
            if (d.isFolga && d.records.length === 0) { color = '#E5E7EB'; label = 'folga'; }
            else if (d.isFalta) { color = '#FCA5A5'; label = 'falta'; }
            else if (d.justificativa) { color = '#FCD34D'; label = 'justificada'; }
            else if (d.completo && !d.minutosAtraso) { color = '#16A34A'; label = 'perfeito'; }
            else if (d.completo && d.minutosAtraso > 0) { color = '#86EFAC'; label = 'ok'; }
            else if (d.records.length > 0) { color = '#FDE68A'; label = 'incompleto'; }
            else { color = '#F3F4F6'; label = 'futuro'; }
            return { date: d.date, day: parseInt(d.date.slice(8), 10), color: color, label: label };
        });
    }

    // ----------------------------------------
    // Onboarding gamificado (missoes do 1o dia)
    // ----------------------------------------
    function getOnboardingMissions(franchiseId, staffId) {
        if (!isFeatureEnabled(franchiseId, 'onboardingMissions')) return null;
        var done = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('onboarding_progress', franchiseId) || []).filter(function (p) { return p.staffId === staffId; })
            : [];
        var doneIds = done.map(function (d) { return d.missionId; });
        var missions = [
            { id: 'first_punch',     name: 'Bater primeira batida',         points: 20, done: doneIds.indexOf('first_punch') !== -1 },
            { id: 'accept_terms',    name: 'Aceitar os termos do app',      points: 10, done: doneIds.indexOf('accept_terms') !== -1 },
            { id: 'enable_notifs',   name: 'Ativar lembretes',              points: 10, done: doneIds.indexOf('enable_notifs') !== -1 },
            { id: 'add_to_home',     name: 'Adicionar à tela inicial',      points: 20, done: doneIds.indexOf('add_to_home') !== -1 },
            { id: 'view_espelho',    name: 'Ver seu espelho mensal',        points: 10, done: doneIds.indexOf('view_espelho') !== -1 },
            { id: 'view_holerite',   name: 'Ver seu holerite',              points: 10, done: doneIds.indexOf('view_holerite') !== -1 },
            { id: 'first_streak',    name: 'Conseguir 3 dias pontuais',     points: 20, done: doneIds.indexOf('first_streak') !== -1 }
        ];
        var totalEarned = missions.filter(function (m) { return m.done; }).reduce(function (s, m) { return s + m.points; }, 0);
        return { missions: missions, totalEarned: totalEarned, possibleTotal: 100 };
    }

    function completeMission(franchiseId, staffId, missionId) {
        if (typeof DataStore === 'undefined') return;
        var existing = (DataStore.getCollection('onboarding_progress', franchiseId) || [])
            .find(function (p) { return p.staffId === staffId && p.missionId === missionId; });
        if (existing) return;
        DataStore.addToCollection('onboarding_progress', franchiseId, {
            id: 'om_' + Date.now(),
            staffId: staffId,
            missionId: missionId,
            completedAt: nowIso()
        });
    }

    // ----------------------------------------
    // Recognition Wall (mural)
    // ----------------------------------------
    function getRecognitionWall(franchiseId) {
        if (!isFeatureEnabled(franchiseId, 'recognitionWall')) return [];
        if (typeof DataStore === 'undefined') return [];
        return (DataStore.getCollection('recognition_wall', franchiseId) || [])
            .sort(function (a, b) { return b.timestamp.localeCompare(a.timestamp); })
            .slice(0, 10);
    }

    function pinRecognition(franchiseId, params) {
        if (typeof DataStore === 'undefined') return { success: false };
        DataStore.addToCollection('recognition_wall', franchiseId, {
            id: 'rec_' + Date.now(),
            staffId: params.staffId || null,
            staffName: params.staffName || '',
            message: params.message || '',
            type: params.type || 'kudos',     // 'kudos' | 'mvp' | 'birthday' | 'anniversary'
            pinnedBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
            timestamp: nowIso()
        });
        return { success: true };
    }

    // ----------------------------------------
    // Voz da Belinha (mensagens contextuais)
    // ----------------------------------------
    function belinhaSay(franchiseId, context, vars) {
        if (!isFeatureEnabled(franchiseId, 'belinhaVoice')) return null;
        var sayings = {
            welcome: [
                'Oi! Sou a Belinha 🐑. Vou te ajudar a bater ponto, blz?',
                'Eaí, {nome}! Belinha aqui. Tamo junto nessa!'
            ],
            punch_success: [
                '✨ Mandou bem, {nome}!',
                'Top, {nome}! Bora pro próximo round!',
                '🐑 Show, {nome}! Tu é fera!'
            ],
            late_recovery: [
                'Atrasou? Calma, {nome}. Todo mundo tropeça. Bora amanhã 💪',
                '{nome}, foco no próximo dia. Tu consegue!'
            ],
            achievement: [
                '🏆 OLHA SÓ! {nome} conquistou: {achievement}!',
                'EI {nome}! Olha essa conquista: {achievement}! 👏'
            ],
            night: [
                'Boa noite, {nome}! Vai descansar bem 🌙',
                '{nome}, encerrou! Hora de relaxar.'
            ]
        };
        if (!sayings[context]) return null;
        var pool = sayings[context];
        var msg = pool[Math.floor(Math.random() * pool.length)];
        Object.keys(vars || {}).forEach(function (k) {
            msg = msg.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k] || '');
        });
        return msg;
    }

    // ----------------------------------------
    // Story diario (card de 24h)
    // ----------------------------------------
    function getDailyStory(franchiseId, staffId) {
        if (!isFeatureEnabled(franchiseId, 'dailyStory')) return null;
        var now = new Date();
        var dayOfMonth = now.getDate();
        var lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        var dayOfWeek = now.getDay();

        // Eventos especiais
        if (dayOfMonth === lastDay) {
            return { type: 'final_day', message: '🏁 Último dia do mês! Vai bater seu recorde de pontualidade?' };
        }
        if (dayOfMonth === 1) {
            return { type: 'new_month', message: '📅 Mês novo, página em branco! Bora arrasar.' };
        }
        if (dayOfWeek === 5) { // sexta
            return { type: 'friday', message: '🎉 Sextou! Última correria.' };
        }
        if (dayOfWeek === 1) { // segunda
            return { type: 'monday', message: '⚡ Segunda chegou. Bora começar bem!' };
        }
        return null;
    }

    window.Gamification = {
        DEFAULT_FLAGS: DEFAULT_FLAGS,
        DEFAULT_REWARDS: DEFAULT_REWARDS,
        BADGES: BADGES,

        getConfig: getConfig,
        saveConfig: saveConfig,
        isFeatureEnabled: isFeatureEnabled,

        getMotivationalMessage: getMotivationalMessage,
        belinhaSay: belinhaSay,

        computeStreak: computeStreak,
        getStaffBadges: getStaffBadges,
        awardBadge: awardBadge,

        getRewardsCatalog: getRewardsCatalog,
        redeemReward: redeemReward,

        getMonthCalendar: getMonthCalendar,
        getOnboardingMissions: getOnboardingMissions,
        completeMission: completeMission,

        getRecognitionWall: getRecognitionWall,
        pinRecognition: pinRecognition,

        getDailyStory: getDailyStory
    };
})();
