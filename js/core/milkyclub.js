/* ============================================
   MilkyPot - MilkyClube Client SDK
   ============================================
   Cliente do programa de fidelidade MilkyClube.
   Fonte da verdade: .claude/MILKYCLUBE_CONTRACT.md

   Responsabilidades:
   - Phone Auth (SMS OTP) com reCAPTCHA invisible.
   - Cadastro (enroll) via Cloud Function `clubEnroll`.
   - Saldo / histórico via `clubGetBalance` + listener Firestore.
   - Resgate, aniversário, referral, conta, FCM tokens.
   - Helpers de formatação (MilkyCoins = R$ 0,01) e tiers.
   ============================================ */

(function() {
    'use strict';

    // ---------------------------------------------
    // Estado interno
    // ---------------------------------------------
    var state = {
        initialized: false,
        auth: null,
        firestore: null,
        functions: null,
        recaptchaVerifier: null,
        recaptchaContainerId: 'milkyclube-recaptcha-container',
        currentUser: null,           // firebase.User
        currentMember: null,         // { uid, phone, name, coins, tier, ... }
        memberUnsubscribe: null,     // Firestore onSnapshot unsubscribe
        configCache: null,
        configCacheAt: 0,
        memberChangeListeners: [],
        // Confirmation result do signInWithPhoneNumber (reutilizado pelo verifyOTP)
        _lastConfirmation: null
    };

    var CONFIG_TTL_MS = 5 * 60 * 1000;   // 5 minutos
    var REF_PARAM = 'ref';

    // ---------------------------------------------
    // Utilitários
    // ---------------------------------------------
    function log() {
        try { console.log.apply(console, ['[MilkyClube]'].concat([].slice.call(arguments))); } catch(e){}
    }
    function warn() {
        try { console.warn.apply(console, ['[MilkyClube]'].concat([].slice.call(arguments))); } catch(e){}
    }

    // Limpa telefone e força +55 BR se necessário
    function normalizeBRPhone(raw) {
        if (!raw) return '';
        var digits = String(raw).replace(/\D/g, '');
        if (digits.length === 0) return '';
        // Remove zeros à esquerda comuns
        while (digits.length > 11 && digits.charAt(0) === '0') digits = digits.substring(1);
        if (digits.length === 10 || digits.length === 11) {
            digits = '55' + digits;
        }
        return '+' + digits;
    }

    // Valida telefone brasileiro no formato E.164
    function isValidBRPhone(e164) {
        return /^\+55\d{10,11}$/.test(e164 || '');
    }

    // Validação de CPF (algoritmo real)
    function isValidCPF(cpf) {
        if (!cpf) return false;
        var clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(clean)) return false; // todos iguais
        var sum = 0, rest;
        for (var i = 1; i <= 9; i++) {
            sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(clean.substring(9, 10), 10)) return false;
        sum = 0;
        for (var j = 1; j <= 10; j++) {
            sum += parseInt(clean.substring(j - 1, j), 10) * (12 - j);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(clean.substring(10, 11), 10)) return false;
        return true;
    }

    function maskCPF(cpf) {
        var clean = String(cpf || '').replace(/\D/g, '');
        if (clean.length !== 11) return '';
        return clean.substring(0, 3) + '.***.***.' + clean.substring(9, 11);
    }

    // Formata MilkyCoins como "G$ 450" (inteiro, representa centavos)
    function formatCoins(coins) {
        var n = Math.max(0, Math.floor(Number(coins) || 0));
        return 'G$ ' + n.toLocaleString('pt-BR');
    }

    // Converte MilkyCoins (centavos) para BRL formatado
    function formatCoinsBRL(coins) {
        var n = Math.max(0, Math.floor(Number(coins) || 0));
        return 'R$ ' + (n / 100).toFixed(2).replace('.', ',');
    }

    // Tier label + emoji + cor
    function tierLabel(t) {
        var map = {
            leite:     { label: 'Leite',     emoji: '🥛', color: '#B3E5FC' },
            nata:      { label: 'Nata',      emoji: '✨', color: '#FFD54F' },
            chantilly: { label: 'Chantilly', emoji: '👑', color: '#F06292' }
        };
        return map[t] || map.leite;
    }

    function notifyMemberChange() {
        var snap = state.currentMember;
        state.memberChangeListeners.forEach(function(cb) {
            try { cb(snap); } catch(e) { warn('listener error', e); }
        });
    }

    // ---------------------------------------------
    // reCAPTCHA
    // ---------------------------------------------
    function ensureRecaptchaContainer() {
        var id = state.recaptchaContainerId;
        var el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.style.position = 'fixed';
            el.style.bottom = '0';
            el.style.right = '0';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            document.body.appendChild(el);
        }
        return id;
    }

    function buildRecaptcha() {
        if (state.recaptchaVerifier) return state.recaptchaVerifier;
        var containerId = ensureRecaptchaContainer();
        // Firebase compat v10 — RecaptchaVerifier(containerIdOrElement, params, auth?)
        state.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
            size: 'invisible',
            callback: function() { /* token resolvido — segue fluxo */ }
        });
        return state.recaptchaVerifier;
    }

    function resetRecaptcha() {
        try {
            if (state.recaptchaVerifier && typeof state.recaptchaVerifier.clear === 'function') {
                state.recaptchaVerifier.clear();
            }
        } catch(e) {}
        state.recaptchaVerifier = null;
    }

    // ---------------------------------------------
    // Cloud Functions helper
    // ---------------------------------------------
    function callable(name) {
        // Prefere CloudFunctions (Vercel/Firebase adapter) se existir.
        if (typeof CloudFunctions !== 'undefined' && CloudFunctions && typeof CloudFunctions.call === 'function') {
            return function(data) { return CloudFunctions.call(name, data || {}); };
        }
        // Fallback Firebase direto
        if (typeof firebase !== 'undefined' && firebase.functions) {
            var fns = firebase.app().functions('southamerica-east1');
            var fn = fns.httpsCallable(name);
            return function(data) {
                return fn(data || {}).then(function(r) { return r && r.data; });
            };
        }
        return function() {
            return Promise.reject(new Error('CloudFunctions não disponível'));
        };
    }

    // ---------------------------------------------
    // Member subscription (Firestore onSnapshot)
    // ---------------------------------------------
    function subscribeMember(uid) {
        unsubscribeMember();
        if (!uid || !state.firestore) return;
        try {
            state.memberUnsubscribe = state.firestore
                .collection('club_members')
                .doc(uid)
                .onSnapshot(function(doc) {
                    if (doc && doc.exists) {
                        state.currentMember = Object.assign({ uid: uid }, doc.data());
                    } else {
                        // Auth pronto mas ainda não chamou enroll
                        state.currentMember = null;
                    }
                    notifyMemberChange();
                }, function(err) {
                    warn('member snapshot error', err && err.message);
                });
        } catch(e) {
            warn('subscribeMember failed', e);
        }
    }

    function unsubscribeMember() {
        if (typeof state.memberUnsubscribe === 'function') {
            try { state.memberUnsubscribe(); } catch(e) {}
        }
        state.memberUnsubscribe = null;
    }

    // ---------------------------------------------
    // Public API
    // ---------------------------------------------
    var MilkyClube = {

        /**
         * Inicializa o SDK. Idempotente.
         * Configura auth, firestore, escuta mudanças de usuário e
         * auto-assina o doc do member.
         */
        async init() {
            if (state.initialized) return;
            if (typeof firebase === 'undefined') {
                warn('firebase não carregado — init abortado');
                return;
            }
            state.auth = firebase.auth();
            state.firestore = firebase.firestore ? firebase.firestore() : null;

            try { state.auth.useDeviceLanguage(); } catch(e) {}

            state.auth.onAuthStateChanged(function(user) {
                state.currentUser = user || null;
                if (user && user.uid) {
                    subscribeMember(user.uid);
                } else {
                    unsubscribeMember();
                    state.currentMember = null;
                    notifyMemberChange();
                }
            });

            state.initialized = true;
            log('init ok');
        },

        /**
         * Retorna o member atual (snapshot em memória) ou null.
         */
        getCurrentMember() {
            return state.currentMember;
        },

        /**
         * Retorna o firebase.User atual (pode existir sem member, ex. logou mas não fez enroll).
         */
        getCurrentUser() {
            return state.currentUser;
        },

        /**
         * Registra callback para mudanças no member.
         * Retorna função de unsubscribe.
         */
        onMemberChange(cb) {
            if (typeof cb !== 'function') return function() {};
            state.memberChangeListeners.push(cb);
            // Dispara imediatamente com o estado atual
            try { cb(state.currentMember); } catch(e) {}
            return function unsubscribe() {
                var idx = state.memberChangeListeners.indexOf(cb);
                if (idx >= 0) state.memberChangeListeners.splice(idx, 1);
            };
        },

        /**
         * Envia OTP por SMS.
         * @param {string} phone - Formato livre (55, 43, com/sem DDI).
         * @returns {Promise<{ verificationId: string }>}
         */
        async sendPhoneOTP(phone) {
            await this.init();
            var e164 = normalizeBRPhone(phone);
            if (!isValidBRPhone(e164)) {
                throw new Error('Telefone inválido. Use DDD + número.');
            }
            var verifier = buildRecaptcha();
            try {
                var confirmation = await state.auth.signInWithPhoneNumber(e164, verifier);
                state._lastConfirmation = confirmation;
                return { verificationId: confirmation.verificationId || 'pending' };
            } catch (err) {
                // reCAPTCHA queima após uso/erro — reseta pra próxima tentativa
                resetRecaptcha();
                throw err;
            }
        },

        /**
         * Confirma OTP.
         * @param {string} _verificationId - Ignorado (usamos ConfirmationResult do último send).
         * @param {string} code - Código SMS.
         * @returns {Promise<{ user, isNewMember: boolean }>}
         */
        async verifyOTP(_verificationId, code) {
            if (!state._lastConfirmation) {
                throw new Error('Nenhum código enviado. Reenvie o SMS.');
            }
            if (!code || String(code).replace(/\D/g, '').length < 4) {
                throw new Error('Código inválido.');
            }
            var result = await state._lastConfirmation.confirm(String(code).trim());
            state._lastConfirmation = null;
            // Reseta reCAPTCHA para próximo uso
            resetRecaptcha();

            var user = result.user;
            state.currentUser = user;

            // Checa se member existe
            var isNewMember = true;
            if (state.firestore && user) {
                try {
                    var doc = await state.firestore.collection('club_members').doc(user.uid).get();
                    isNewMember = !doc.exists;
                } catch(e) {
                    warn('verifyOTP: check member failed', e && e.message);
                }
            }
            return { user: user, isNewMember: isNewMember };
        },

        /**
         * Cadastra o member (chama Cloud Function `clubEnroll`).
         */
        async enroll(payload) {
            if (!state.currentUser) throw new Error('Sessão expirada. Faça login novamente.');
            payload = payload || {};
            if (!payload.name || String(payload.name).trim().length < 2) {
                throw new Error('Informe seu nome completo.');
            }
            if (!isValidCPF(payload.cpf)) {
                throw new Error('CPF inválido.');
            }
            if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
                throw new Error('E-mail inválido.');
            }
            var consents = payload.consents || {};
            if (!consents.lgpd) {
                throw new Error('É necessário aceitar o regulamento (LGPD).');
            }

            var body = {
                phone: (state.currentUser.phoneNumber || normalizeBRPhone(payload.phone)),
                cpf: String(payload.cpf).replace(/\D/g, ''),
                name: String(payload.name).trim(),
                email: payload.email ? String(payload.email).trim().toLowerCase() : null,
                birthDate: payload.birthDate || null,
                referralCode: (payload.referralCode || '').toUpperCase().trim() || null,
                consents: {
                    lgpd: !!consents.lgpd,
                    marketing: !!consents.marketing,
                    whatsapp: !!consents.whatsapp
                }
            };

            var fn = callable('clubEnroll');
            var res = await fn(body);
            if (res && res.success === false) {
                throw new Error(res.error || 'Erro ao cadastrar.');
            }
            var member = (res && (res.member || (res.data && res.data.member))) || null;
            if (member) {
                state.currentMember = Object.assign({ uid: state.currentUser.uid }, member);
                notifyMemberChange();
            }
            return member;
        },

        /**
         * Busca saldo + últimas transações via Cloud Function.
         */
        async getBalance() {
            var fn = callable('clubGetBalance');
            var res = await fn({});
            if (res && res.success === false) {
                throw new Error(res.error || 'Erro ao buscar saldo.');
            }
            var data = (res && (res.data || res)) || {};
            var member = data.member || null;
            var transactions = data.transactions || [];
            if (member) {
                state.currentMember = Object.assign({}, state.currentMember || {}, member);
                notifyMemberChange();
            }
            return { member: member, transactions: transactions };
        },

        /**
         * Resgata MilkyCoins (chamado pelo PDV; raramente pelo cliente).
         */
        async redeem(params) {
            params = params || {};
            if (!params.amount || params.amount <= 0) throw new Error('Valor inválido.');
            var fn = callable('clubRedeem');
            var res = await fn({
                amount: Math.floor(params.amount),
                franchiseId: params.franchiseId || null,
                orderId: params.orderId || null,
                memberId: (state.currentUser && state.currentUser.uid) || null
            });
            if (res && res.success === false) throw new Error(res.error || 'Resgate falhou.');
            return (res && (res.data || res)) || {};
        },

        /**
         * Reivindica bônus de aniversário.
         */
        async claimBirthday() {
            var fn = callable('clubClaimBirthday');
            var res = await fn({});
            if (res && res.success === false) throw new Error(res.error || 'Bônus não disponível.');
            return (res && (res.data || res)) || {};
        },

        /**
         * Registra token FCM. Delegado ao módulo milkyclub-push.js.
         */
        async registerPush() {
            if (typeof window.MilkyClubePush === 'undefined') {
                throw new Error('Push não carregado.');
            }
            return await window.MilkyClubePush.requestAndRegister();
        },

        /**
         * Remove token FCM atual.
         */
        async unregisterPush() {
            if (typeof window.MilkyClubePush === 'undefined') return;
            return await window.MilkyClubePush.unregister();
        },

        /**
         * Atualiza dados cadastrais do member (nome, email, birthDate, consentos).
         * Campos protegidos (coins/tier/totalEarned...) são bloqueados pelas rules.
         */
        async updateProfile(updates) {
            if (!state.currentUser) throw new Error('Não autenticado.');
            if (!state.firestore) throw new Error('Firestore indisponível.');
            updates = updates || {};
            var allowed = {};
            if (typeof updates.name === 'string') {
                if (updates.name.trim().length < 2) throw new Error('Nome muito curto.');
                allowed.name = updates.name.trim();
            }
            if (typeof updates.email === 'string') {
                if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
                    throw new Error('E-mail inválido.');
                }
                allowed.email = updates.email.trim().toLowerCase();
            }
            if (typeof updates.birthDate === 'string' || updates.birthDate === null) {
                allowed.birthDate = updates.birthDate || null;
            }
            if (updates.consents && typeof updates.consents === 'object') {
                var cur = (state.currentMember && state.currentMember.consents) || {};
                allowed.consents = {
                    // Nunca derruba LGPD via update (exige deleteAccount)
                    lgpd: cur.lgpd === true ? true : !!updates.consents.lgpd,
                    lgpdAcceptedAt: cur.lgpdAcceptedAt || new Date().toISOString(),
                    marketing: !!updates.consents.marketing,
                    whatsapp: !!updates.consents.whatsapp
                };
            }
            if (Object.keys(allowed).length === 0) return state.currentMember;

            await state.firestore.collection('club_members').doc(state.currentUser.uid).update(allowed);
            // Listener atualiza state automaticamente
            return Object.assign({}, state.currentMember || {}, allowed);
        },

        /**
         * LGPD: exclui conta do member e todos os dados atrelados.
         * Chama Cloud Function que faz a limpeza server-side.
         */
        async deleteAccount() {
            if (!state.currentUser) throw new Error('Não autenticado.');
            var fn = callable('clubDeleteAccount');
            var res = await fn({});
            if (res && res.success === false) throw new Error(res.error || 'Falha ao excluir conta.');
            try { await state.auth.signOut(); } catch(e) {}
            unsubscribeMember();
            state.currentMember = null;
            state.currentUser = null;
            notifyMemberChange();
            return true;
        },

        /**
         * URL de indicação do member atual.
         */
        getReferralLink() {
            var code = (state.currentMember && state.currentMember.referralCode) || '';
            var base = window.location.origin || 'https://milkypot.com';
            return base + '/clube.html?' + REF_PARAM + '=' + encodeURIComponent(code);
        },

        /**
         * Lê código de referral da URL atual (se houver).
         */
        getReferralFromURL() {
            try {
                var params = new URLSearchParams(window.location.search);
                var c = (params.get(REF_PARAM) || '').toUpperCase().trim();
                return c || null;
            } catch(e) { return null; }
        },

        formatCoins: formatCoins,
        formatCoinsBRL: formatCoinsBRL,
        tierLabel: tierLabel,
        isValidCPF: isValidCPF,
        maskCPF: maskCPF,
        normalizeBRPhone: normalizeBRPhone,
        isValidBRPhone: isValidBRPhone,

        /**
         * Busca config global (cache em memória 5min).
         */
        async getConfig() {
            var now = Date.now();
            if (state.configCache && (now - state.configCacheAt) < CONFIG_TTL_MS) {
                return state.configCache;
            }
            if (!state.firestore) throw new Error('Firestore indisponível.');
            try {
                var doc = await state.firestore.collection('club_config').doc('global').get();
                if (doc.exists) {
                    state.configCache = doc.data();
                    state.configCacheAt = now;
                    return state.configCache;
                }
            } catch(e) {
                warn('getConfig falhou', e && e.message);
            }
            // Fallback razoável — segue o contrato
            state.configCache = {
                version: 1,
                tiers: {
                    leite:     { label: 'Leite',     minSpent: 0,    cashbackRate: 0.03, color: '#B3E5FC', emoji: '🥛' },
                    nata:      { label: 'Nata',      minSpent: 500,  cashbackRate: 0.05, color: '#FFD54F', emoji: '✨' },
                    chantilly: { label: 'Chantilly', minSpent: 2000, cashbackRate: 0.07, color: '#F06292', emoji: '👑' }
                },
                expiryDays: 30,
                bonuses: {
                    signup: 20, firstOrder: 50, birthday: 100,
                    referrer: 100, referred: 50,
                    gameDesafio10: 10, scratchMin: 1, scratchMax: 50
                },
                appLinks: { playStore: '', appStore: '', pwa: '/clube.html' },
                featureFlags: { enabled: true, whatsappNotify: true, pushEnabled: true }
            };
            state.configCacheAt = now;
            return state.configCache;
        },

        /**
         * Calcula progresso (0..1) pro próximo tier, baseado em totalSpent.
         */
        getTierProgress(member, config) {
            member = member || state.currentMember || {};
            config = config || state.configCache;
            if (!config || !config.tiers) return { progress: 0, next: null, remaining: 0 };
            var tiers = config.tiers;
            var cur = member.tier || 'leite';
            var order = ['leite', 'nata', 'chantilly'];
            var idx = order.indexOf(cur);
            if (idx === -1 || idx === order.length - 1) {
                return { progress: 1, next: null, remaining: 0 };
            }
            var nextKey = order[idx + 1];
            var curMin = (tiers[cur] && tiers[cur].minSpent) || 0;
            var nextMin = (tiers[nextKey] && tiers[nextKey].minSpent) || 0;
            var totalSpent = Number(member.totalSpent || 0);
            var span = Math.max(1, nextMin - curMin);
            var prog = Math.max(0, Math.min(1, (totalSpent - curMin) / span));
            return {
                progress: prog,
                next: nextKey,
                nextLabel: (tiers[nextKey] && tiers[nextKey].label) || nextKey,
                remaining: Math.max(0, nextMin - totalSpent)
            };
        },

        /**
         * Encerra sessão local (mantém member doc — só faz signOut).
         */
        async signOut() {
            try { await state.auth.signOut(); } catch(e) {}
            unsubscribeMember();
            state.currentMember = null;
            state.currentUser = null;
            notifyMemberChange();
        }
    };

    window.MilkyClube = MilkyClube;

})();
