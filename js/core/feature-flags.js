/* ============================================================
   MilkyPot Feature Flags — controle progressivo de rollout

   Lê de Firestore `datastore/feature_flags` (lazy) + localStorage
   cache. Permite ativar/desativar features por franquia ou globalmente
   sem deploy de código.

   Uso:
     await FeatureFlags.init();
     if (FeatureFlags.isOn('monte_seu_jeito', { franchiseId: 'muffato-quintino' })) {
         // ativa feature
     }

   Schema do doc Firestore `datastore/feature_flags`:
     {
       "flags": {
         "monte_seu_jeito":     { enabled: true,  franchiseAllowlist: ['*'] },
         "alcoolico":           { enabled: true,  franchiseAllowlist: ['muffato-quintino'] },
         "ice_protein":         { enabled: false, franchiseAllowlist: [] },
         "carrinho_persistente": { enabled: true, franchiseAllowlist: ['*'] }
       },
       "version": 1,
       "updatedAt": "2026-05-15T..."
     }

   Quando flag não existe ou Firestore offline → fallback default (enabled=true)
   ============================================================ */
(function(global){
    'use strict';
    if (global.FeatureFlags) return;

    var CACHE_KEY = 'mp_feature_flags';
    var CACHE_TTL_MS = 5 * 60 * 1000; // 5min
    var state = {
        flags: null,
        loadedAt: 0,
        loading: null,
        defaults: {
            // defaults caso Firestore não retorne ou flag não exista
            monte_seu_jeito:     { enabled: true,  franchiseAllowlist: ['*'] },
            alcoolico:           { enabled: true,  franchiseAllowlist: ['*'] },
            ice_protein:         { enabled: true,  franchiseAllowlist: ['*'] },
            carrinho_persistente:{ enabled: true,  franchiseAllowlist: ['*'] },
            welcome_bonus:       { enabled: true,  franchiseAllowlist: ['*'] },
            google_signin:       { enabled: true,  franchiseAllowlist: ['*'] }
        }
    };

    function isFresh() {
        return state.flags && (Date.now() - state.loadedAt) < CACHE_TTL_MS;
    }

    function tryReadCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (obj && obj.flags && obj.loadedAt && (Date.now() - obj.loadedAt) < CACHE_TTL_MS) {
                return obj;
            }
        } catch(_) {}
        return null;
    }

    function writeCache(flags) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                flags: flags,
                loadedAt: Date.now()
            }));
        } catch(_) {}
    }

    global.FeatureFlags = {
        async init() {
            if (isFresh()) return state.flags;
            if (state.loading) return state.loading;
            // tenta cache primeiro
            var cached = tryReadCache();
            if (cached) {
                state.flags = cached.flags;
                state.loadedAt = cached.loadedAt;
                // refresh em background mas retorna cache imediato
            }
            state.loading = (async function fetchFlags() {
                try {
                    if (typeof firebase === 'undefined' || !firebase.firestore) {
                        state.flags = state.flags || state.defaults;
                        state.loadedAt = Date.now();
                        return state.flags;
                    }
                    var doc = await firebase.firestore()
                        .collection('datastore').doc('feature_flags').get();
                    if (doc.exists) {
                        var data = doc.data() || {};
                        // value field se usar mesma estrutura de catalog_config
                        var parsed = data.value ? JSON.parse(data.value) : data;
                        var flags = parsed.flags || parsed;
                        // merge com defaults — defaults preenchem flags ausentes
                        var merged = Object.assign({}, state.defaults, flags);
                        state.flags = merged;
                        state.loadedAt = Date.now();
                        writeCache(merged);
                    } else {
                        state.flags = state.flags || state.defaults;
                        state.loadedAt = Date.now();
                    }
                } catch(e) {
                    console.warn('[FeatureFlags] init err:', e.message);
                    state.flags = state.flags || state.defaults;
                    state.loadedAt = Date.now();
                } finally {
                    state.loading = null;
                }
                return state.flags;
            })();
            return state.loading;
        },

        /**
         * Verifica se flag está ativa, respeitando allowlist de franquia.
         * @param {string} key - 'monte_seu_jeito', etc.
         * @param {object} [ctx] - { franchiseId?: string }
         * @returns {boolean}
         */
        isOn(key, ctx) {
            var flags = state.flags || state.defaults;
            var f = flags[key];
            if (!f) return false; // flag desconhecida → off
            if (f.enabled === false) return false;
            var allowlist = f.franchiseAllowlist;
            if (!allowlist || allowlist.length === 0) return false;
            if (allowlist.indexOf('*') >= 0) return true;
            if (ctx && ctx.franchiseId && allowlist.indexOf(ctx.franchiseId) >= 0) return true;
            return false;
        },

        /**
         * Versão sync (usa cache, NÃO chama init). Útil em hot paths.
         * Se cache vazio retorna default.
         */
        isOnSync(key, ctx) {
            return this.isOn(key, ctx);
        },

        /**
         * Snapshot pra debug
         */
        getAll() {
            return state.flags || state.defaults;
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
