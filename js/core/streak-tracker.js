/* ============================================================
   MilkyPot Streak Tracker — gamificação de pedidos consecutivos
   ============================================================
   Vicia repeat customer. Cada dia consecutivo com pedido = +1 streak.
   Milestones disparam recompensas:
     -  3 dias → "🔥 Pegando fogo" (badge + toast)
     -  7 dias → "🏆 Sundae GRÁTIS na próxima visita" (voucher auto)
     - 14 dias → "👑 Realeza MilkyPot" (badge premium + 100 MilkyCoins)
     - 30 dias → "🌈 LENDÁRIO — camiseta exclusiva" (notif admin pra enviar)

   Storage:
     - Firestore: milkyclube_members/{uid}.streak (se logado)
     - localStorage: mp_streak_{phone} (fallback anônimo)

   Timezone: tudo em BRT (-3:00) usando Utils.today() padrão MilkyPot.

   API:
     StreakTracker.recordOrder({ phone, uid, franchiseId })
       Chamado em placeOrder success. Atualiza streak + dispara milestone se aplicável.

     StreakTracker.getStreak(phone)
       Retorna { current, best, lastOrderDate, nextMilestone }

     StreakTracker.showStatus()
       Modal status atual (opcional, em /clube ou home).
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpStreakLoaded) return;
    global._mpStreakLoaded = true;

    var MILESTONES = [
        { days: 3,  emoji: '🔥', label: 'Pegando fogo',         reward: 'badge_fire',   prize: '+25 MilkyCoins' },
        { days: 7,  emoji: '🏆', label: 'Lenda da semana',      reward: 'sundae_free',  prize: 'Sundae GRÁTIS' },
        { days: 14, emoji: '👑', label: 'Realeza MilkyPot',     reward: 'crown',        prize: '+100 MilkyCoins' },
        { days: 30, emoji: '🌈', label: 'LENDÁRIO',             reward: 'tshirt',       prize: 'Camiseta exclusiva' }
    ];

    // ============================================================
    // Date helpers — sempre BRT (padrão MilkyPot)
    // ============================================================
    function todayBRT() {
        // Usa Utils.today() se disponível (já trata timezone), senão fallback.
        if (global.Utils && global.Utils.today) return global.Utils.today();
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    }

    function daysBetween(d1str, d2str) {
        if (!d1str || !d2str) return Infinity;
        var d1 = new Date(d1str + 'T12:00:00');
        var d2 = new Date(d2str + 'T12:00:00');
        return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    // ============================================================
    // Storage layer
    // ============================================================
    function _localKey(phone) {
        return 'mp_streak_' + (phone || 'anon').replace(/\D/g, '');
    }

    function _readLocal(phone) {
        try {
            var raw = localStorage.getItem(_localKey(phone));
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }

    function _writeLocal(phone, data) {
        try {
            localStorage.setItem(_localKey(phone), JSON.stringify(data));
        } catch (e) { /* localStorage cheio */ }
    }

    function _writeFirestore(uid, data) {
        if (!uid) return Promise.resolve();
        try {
            if (!global.firebase || !global.firebase.firestore) return Promise.resolve();
            return global.firebase.firestore()
                .collection('milkyclube_members')
                .doc(uid)
                .set({
                    streak: data.current || 0,
                    bestStreak: data.best || 0,
                    lastOrderDate: data.lastOrderDate || null,
                    streakUpdatedAt: new Date().toISOString()
                }, { merge: true })
                .catch(function (err) { console.warn('[Streak] Firestore save:', err.message); });
        } catch (e) { return Promise.resolve(); }
    }

    // ============================================================
    // Core logic
    // ============================================================
    function getStreak(phone) {
        var local = _readLocal(phone) || { current: 0, best: 0, lastOrderDate: null };
        var next = MILESTONES.find(function (m) { return m.days > local.current; });
        return {
            current: local.current,
            best: local.best,
            lastOrderDate: local.lastOrderDate,
            nextMilestone: next || null,
            daysToNext: next ? (next.days - local.current) : null
        };
    }

    function recordOrder(ctx) {
        ctx = ctx || {};
        var phone = ctx.phone || (global._lastOrderPhone || '');
        if (!phone) {
            console.warn('[Streak] recordOrder sem phone — pulando');
            return null;
        }

        var today = todayBRT();
        var current = _readLocal(phone) || { current: 0, best: 0, lastOrderDate: null };

        var newCurrent;
        var isReset = false;
        var isContinue = false;
        var isSameDay = false;

        if (current.lastOrderDate === today) {
            // Mesmo dia — não conta de novo, mas mantém streak
            newCurrent = current.current;
            isSameDay = true;
        } else if (daysBetween(current.lastOrderDate, today) === 1) {
            // Dia consecutivo — incrementa
            newCurrent = (current.current || 0) + 1;
            isContinue = true;
        } else {
            // Quebrou (mais de 1 dia ou primeiro pedido)
            newCurrent = 1;
            isReset = current.current > 0;
        }

        var newBest = Math.max(current.best || 0, newCurrent);
        var updated = {
            current: newCurrent,
            best: newBest,
            lastOrderDate: today
        };

        _writeLocal(phone, updated);
        if (ctx.uid) _writeFirestore(ctx.uid, updated);

        // Track analytics
        try {
            if (global.MpAnalytics) {
                global.MpAnalytics.track('streak_recorded', {
                    streak_current: newCurrent,
                    streak_best: newBest,
                    is_continue: isContinue,
                    is_reset: isReset,
                    is_same_day: isSameDay
                });
            }
        } catch (e) {}

        // Detect milestone hit
        if (isContinue || (isReset && newCurrent === 1)) {
            var milestone = MILESTONES.find(function (m) { return m.days === newCurrent; });
            if (milestone) {
                showMilestoneModal(milestone, updated, ctx);
            } else if (newCurrent >= 2) {
                showContinueToast(newCurrent);
            }
        }

        return updated;
    }

    // ============================================================
    // UI: Milestone Modal (visual reward)
    // ============================================================
    function showMilestoneModal(milestone, streak, ctx) {
        var modal = document.createElement('div');
        modal.style.cssText = [
            'position:fixed', 'inset:0', 'background:rgba(0,0,0,.8)',
            'z-index:99998', 'display:flex', 'align-items:center', 'justify-content:center',
            'padding:16px', 'font-family:"Segoe UI",sans-serif',
            'animation:mp-streak-fadein .3s ease-out'
        ].join(';');

        modal.innerHTML =
            '<div style="background:linear-gradient(135deg,#FFE4F1,#FFDFC7);border-radius:24px;padding:28px;max-width:380px;width:100%;text-align:center;position:relative;box-shadow:0 24px 64px rgba(236,72,153,.4);animation:mp-streak-pop .5s cubic-bezier(.34,1.56,.64,1)">' +
              '<button id="mpStreakClose" style="position:absolute;top:12px;right:14px;background:transparent;border:0;font-size:26px;cursor:pointer;color:#9CA3AF">×</button>' +
              '<div style="font-size:80px;line-height:1;margin-bottom:8px;animation:mp-streak-bounce 1s ease-in-out infinite">' + milestone.emoji + '</div>' +
              '<div style="font-size:13px;font-weight:800;letter-spacing:2px;color:#EC4899;text-transform:uppercase;margin-bottom:4px">STREAK ' + milestone.days + ' DIAS</div>' +
              '<h2 style="margin:0 0 8px;font-size:28px;color:#831843;font-weight:900">' + milestone.label + '</h2>' +
              '<div style="font-size:15px;color:#4B5563;margin-bottom:20px;line-height:1.5">Você pediu ' + milestone.days + ' dias seguidos na MilkyPot 🐑<br>Isso é só pra <strong>lenda</strong>.</div>' +
              '<div style="background:#fff;padding:16px;border-radius:14px;border:3px dashed #EC4899;margin-bottom:16px">' +
                '<div style="font-size:11px;font-weight:700;color:#831843;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">SUA RECOMPENSA</div>' +
                '<div style="font-size:24px;font-weight:900;color:#EC4899">' + milestone.prize + '</div>' +
              '</div>' +
              '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
                '<button id="mpStreakShareBtn" style="background:#25D366;color:#fff;border:0;padding:12px 18px;border-radius:12px;font-weight:800;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px"><span>📲</span> Bota nos Stories</button>' +
                '<button id="mpStreakOkBtn" style="background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:12px 24px;border-radius:12px;font-weight:800;cursor:pointer;font-size:14px">Fechar</button>' +
              '</div>' +
            '</div>';

        document.body.appendChild(modal);
        _injectStyles();

        // Generate voucher se milestone tem prêmio resgatável
        var voucherCode = null;
        if (milestone.reward === 'sundae_free' || milestone.reward === 'tshirt') {
            voucherCode = 'STREAK-' + milestone.days + '-' + Date.now().toString(36).toUpperCase().slice(-5);
            _persistStreakVoucher({
                code: voucherCode,
                milestone: milestone.days,
                reward: milestone.reward,
                prize: milestone.prize,
                phone: (ctx && ctx.phone) || null,
                uid: (ctx && ctx.uid) || null,
                franchiseId: (ctx && ctx.franchiseId) || null,
                createdAt: new Date().toISOString(),
                used: false
            });
        }

        modal.querySelector('#mpStreakClose').onclick =
        modal.querySelector('#mpStreakOkBtn').onclick = function () { modal.remove(); };

        modal.querySelector('#mpStreakShareBtn').onclick = function () {
            var shareText = '🔥 STREAK ' + milestone.days + ' DIAS na MilkyPot! ' + milestone.emoji + ' Ganhei ' + milestone.prize + ' 🐑\n\nVem virar lenda também: milkypot.com';
            if (navigator.share) {
                navigator.share({ title: 'MilkyPot Streak', text: shareText, url: 'https://milkypot.com' }).catch(function(){});
            } else {
                try {
                    navigator.clipboard.writeText(shareText);
                    this.innerHTML = '<span>✅</span> Copiado!';
                } catch (e) {
                    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
                }
            }
            if (global.MpAnalytics) global.MpAnalytics.track('streak_share', {
                milestone: milestone.days,
                reward: milestone.reward
            });
        };

        // Confetti pra milestones grandes
        if ((milestone.days >= 7) && typeof global.createConfetti === 'function') {
            global.createConfetti();
        }

        if (global.MpAnalytics) {
            global.MpAnalytics.track('streak_milestone_hit', {
                milestone_days: milestone.days,
                reward: milestone.reward,
                voucher_code: voucherCode || ''
            });
        }
    }

    function showContinueToast(streakDays) {
        // Toast leve pros dias 2, 4, 5, 6, 8-13, 15-29 — não interrompe muito
        var next = MILESTONES.find(function (m) { return m.days > streakDays; });
        if (!next) return;
        var daysLeft = next.days - streakDays;

        var toast = document.createElement('div');
        toast.style.cssText = [
            'position:fixed', 'bottom:24px', 'left:50%',
            'transform:translateX(-50%) translateY(100px)',
            'background:linear-gradient(135deg,#EC4899,#F97316)', 'color:#fff',
            'padding:14px 22px', 'border-radius:999px',
            'font-weight:800', 'font-size:14px', 'z-index:99997',
            'box-shadow:0 8px 32px rgba(236,72,153,.5)',
            'transition:transform .5s cubic-bezier(.34,1.56,.64,1)',
            'max-width:90%', 'text-align:center'
        ].join(';');
        toast.innerHTML = '🔥 Streak ' + streakDays + ' dias! Faltam ' + daysLeft + ' pra ' + next.emoji + ' <strong>' + next.prize + '</strong>';

        document.body.appendChild(toast);
        // Trigger animation
        setTimeout(function () { toast.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
        setTimeout(function () {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(function () { toast.remove(); }, 500);
        }, 4000);
    }

    function _persistStreakVoucher(voucher) {
        try {
            var list = JSON.parse(localStorage.getItem('mp_streak_vouchers') || '[]');
            list.unshift(voucher);
            list = list.slice(0, 20);
            localStorage.setItem('mp_streak_vouchers', JSON.stringify(list));
        } catch (e) {}
        try {
            if (global.firebase && global.firebase.firestore) {
                global.firebase.firestore()
                    .collection('streak_vouchers')
                    .doc(voucher.code)
                    .set(voucher)
                    .catch(function () {});
            }
        } catch (e) {}
    }

    function _injectStyles() {
        if (document.getElementById('mp-streak-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-streak-styles';
        style.textContent =
            '@keyframes mp-streak-fadein { from { opacity: 0; } to { opacity: 1; } }' +
            '@keyframes mp-streak-pop { from { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.1); } to { transform: scale(1); opacity: 1; } }' +
            '@keyframes mp-streak-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }';
        document.head.appendChild(style);
    }

    /**
     * Modal de status do streak — útil pra mostrar no /clube ou home
     */
    function showStatus() {
        var s = getStreak((global._lastOrderPhone || ''));
        if (!s.current && !s.lastOrderDate) {
            console.log('[Streak] Sem histórico. Faz um pedido pra começar 🐑');
            return;
        }
        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99996;display:flex;align-items:center;justify-content:center;padding:16px';
        var nextHtml = s.nextMilestone
            ? '<div style="margin-top:12px;padding:12px;background:#FFF7ED;border-radius:10px;font-size:13px;color:#9A3412"><strong>Próximo:</strong> ' + s.nextMilestone.emoji + ' ' + s.nextMilestone.prize + ' em ' + s.daysToNext + ' dia' + (s.daysToNext > 1 ? 's' : '') + '</div>'
            : '<div style="margin-top:12px;font-size:13px;color:#10B981">🌈 Você é LENDA! Atingiu todos os milestones.</div>';
        modal.innerHTML =
            '<div style="background:#fff;padding:24px;border-radius:20px;max-width:360px;width:100%;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.3)">' +
              '<div style="font-size:60px;margin-bottom:8px">🔥</div>' +
              '<h2 style="margin:0 0 4px;color:#831843">Streak ' + s.current + ' dias</h2>' +
              '<div style="font-size:13px;color:#6B7280;margin-bottom:8px">Melhor: ' + s.best + ' dias</div>' +
              nextHtml +
              '<button onclick="this.closest(\'[style*=\\\'z-index:99996\\\']\').remove()" style="margin-top:16px;background:#EC4899;color:#fff;border:0;padding:10px 24px;border-radius:10px;font-weight:700;cursor:pointer">Fechar</button>' +
            '</div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    }

    global.StreakTracker = {
        recordOrder: recordOrder,
        getStreak: getStreak,
        showStatus: showStatus,
        MILESTONES: MILESTONES,
        VERSION: 'mp-v247'
    };
})(typeof window !== 'undefined' ? window : this);
