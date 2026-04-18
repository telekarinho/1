/* ============================================
   MilkyPot - Admin Config
   ============================================
   Configurações editáveis pelo super_admin:
   - Mensagens motivacionais (login, during, caixa)
   - Metas mensais de venda por franquia
   - Templates de checklist (abertura/fechamento)

   Storage:
   - settings_messages        (global)
   - settings_metas           (global, mapa {fid}{pk}->valor)
   - settings_checklist       (global, templates)
   - checklist_exec_{fid}     (por franquia, execuções por turno)
   ============================================ */

const AdminConfig = (function () {
    'use strict';

    /* ---- Defaults de mensagens (espelha motivacional.js) ---- */
    const DEFAULT_MESSAGES = {
        login: [
            { text: 'Bom dia, estrela! Hoje tem cliente feliz te esperando!', icon: '☀️' },
            { text: 'Você voltou! O potinho fica mais doce com você por aqui.', icon: '🍨' },
            { text: 'Novo dia, novas cascadas de ganache! Bora?', icon: '🚀' },
            { text: 'Cada potinho entregue com carinho vira cliente fiel.', icon: '💝' },
            { text: 'Seu sorriso é o melhor topping de todos!', icon: '😊' },
            { text: 'Equipe MilkyPot é feita de gente especial. Você é!', icon: '⭐' },
            { text: 'Hoje é dia de brilhar e derreter corações!', icon: '✨' },
            { text: 'O sucesso é servido em pequenas doses diárias!', icon: '🏆' },
            { text: 'Pronto pra transformar o dia de alguém em doce?', icon: '🎯' },
            { text: 'Bora fazer acontecer! A galera conta com você!', icon: '🔥' }
        ],
        during: [
            { text: 'Você está arrasando hoje! Continue assim!', icon: '🔥', minHour: 10 },
            { text: 'Meio dia de vitórias! Já dá pra celebrar!', icon: '⚡', minHour: 12 },
            { text: 'Lembra de sorrir pro próximo cliente. Faz diferença!', icon: '😄', minHour: 11 },
            { text: 'Que tal oferecer o combo do dia pro próximo?', icon: '💡', minHour: 13 },
            { text: 'Reta final! Vamos bater a meta juntos!', icon: '🏁', minHour: 16 },
            { text: 'Foto linda dos potinhos no Insta dá resultado!', icon: '📸', minHour: 14 },
            { text: 'Cliente satisfeito volta e traz amigo. Capricha!', icon: '💖', minHour: 15 },
            { text: 'Hora do lanche da tarde: pico de movimento!', icon: '🍦', minHour: 15 },
            { text: 'Já pediu pra avaliarem no Google hoje?', icon: '⭐', minHour: 13 },
            { text: 'Tá quase batendo a meta! Não pára agora!', icon: '🎯', minHour: 17 }
        ],
        caixaAberto: [
            { text: 'Caixa aberto! Que hoje seja um dia doce de vendas!', icon: '💰' },
            { text: 'Vamos com tudo! Primeiro cliente, primeira venda!', icon: '🚀' },
            { text: 'Caixa liberado! Foco, carinho e muito sorriso!', icon: '✨' },
            { text: 'Tudo pronto! Bora fazer acontecer?', icon: '🔥' },
            { text: 'Bom atendimento gera bons números. Conta contigo!', icon: '🏆' }
        ],
        caixaFechado: [
            { text: 'Dia encerrado! Você fez um trabalho incrível hoje!', icon: '🏆' },
            { text: 'Caixa fechado com sucesso! Descanse, você merece!', icon: '🌙' },
            { text: 'Mais um dia na conta da vitória. Parabéns!', icon: '🎉' },
            { text: 'Obrigado pelo seu esforço hoje. Amanhã tem mais!', icon: '💝' },
            { text: 'Feito! Agora é recarregar pra amanhã brilhar de novo!', icon: '🔋' }
        ]
    };

    const DEFAULT_CHECKLIST = {
        abertura: [
            { id: 'unif', text: 'Uniforme limpo e identificação visível', required: true },
            { id: 'lavar_maos', text: 'Higienizar mãos e bancadas', required: true },
            { id: 'conferir_equip', text: 'Conferir máquinas de sorvete e vitrine refrigerada', required: true },
            { id: 'conferir_estoque', text: 'Conferir estoque de potinhos, colheres e topos', required: true },
            { id: 'conferir_caixa', text: 'Conferir troco inicial no caixa', required: true }
        ],
        fechamento: [
            { id: 'limpar_balcao', text: 'Limpar balcão, vitrine e piso', required: true },
            { id: 'guardar_prod', text: 'Guardar produtos perecíveis adequadamente', required: true },
            { id: 'desligar_equip', text: 'Desligar equipamentos não essenciais', required: true },
            { id: 'conferir_saidas', text: 'Conferir saídas do caixa (sangrias)', required: true },
            { id: 'trancar_loja', text: 'Trancar loja e acionar alarme', required: true }
        ]
    };

    /* ---- Helpers storage ---- */
    function getSetting(key, fallback) {
        if (typeof DataStore === 'undefined' || !DataStore.get) return fallback;
        const v = DataStore.get(key);
        return v != null ? v : fallback;
    }

    function setSetting(key, value) {
        if (typeof DataStore === 'undefined' || !DataStore.set) return false;
        DataStore.set(key, value);
        return true;
    }

    function sessionInfo() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            if (s) return { id: s.userId, name: s.name, role: s.role };
        }
        return { id: 'anon', name: 'Sistema', role: null };
    }

    function requireAdmin() {
        const s = sessionInfo();
        if (s.role !== 'super_admin') return { ok: false, error: 'Apenas super_admin pode alterar configuração global.' };
        return { ok: true, user: s };
    }

    function audit(event, details) {
        try { if (typeof AuditLog !== 'undefined' && AuditLog.log) AuditLog.log(event, details || {}); } catch (e) {}
    }

    /* ============================================
       Mensagens motivacionais
       ============================================ */
    function getMessages() {
        const custom = getSetting('settings_messages', null);
        if (!custom || typeof custom !== 'object') return DEFAULT_MESSAGES;
        // Mescla: se alguma chave faltar, usa default
        return {
            login: Array.isArray(custom.login) && custom.login.length ? custom.login : DEFAULT_MESSAGES.login,
            during: Array.isArray(custom.during) && custom.during.length ? custom.during : DEFAULT_MESSAGES.during,
            caixaAberto: Array.isArray(custom.caixaAberto) && custom.caixaAberto.length ? custom.caixaAberto : DEFAULT_MESSAGES.caixaAberto,
            caixaFechado: Array.isArray(custom.caixaFechado) && custom.caixaFechado.length ? custom.caixaFechado : DEFAULT_MESSAGES.caixaFechado
        };
    }

    function saveMessages(msgs) {
        const g = requireAdmin();
        if (!g.ok) return { success: false, error: g.error };
        if (!msgs || typeof msgs !== 'object') return { success: false, error: 'Dados inválidos.' };
        setSetting('settings_messages', msgs);
        audit('config.messages_updated', { groups: Object.keys(msgs), by: g.user.name });
        return { success: true };
    }

    function resetMessages() {
        const g = requireAdmin();
        if (!g.ok) return { success: false, error: g.error };
        setSetting('settings_messages', null);
        audit('config.messages_reset', { by: g.user.name });
        return { success: true };
    }

    function getDefaultMessages() {
        return JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
    }

    /* ============================================
       Metas de venda mensais (por franquia)
       ============================================ */
    function getMetasAll() {
        return getSetting('settings_metas', {}) || {};
    }

    function getMeta(franchiseId, periodKey) {
        const all = getMetasAll();
        return all[franchiseId] && all[franchiseId][periodKey] ? all[franchiseId][periodKey] : null;
    }

    // Permissão relaxada: super_admin pode editar qualquer franquia; franchisee/manager só a própria.
    function requireFranchiseScope(franchiseId) {
        const s = sessionInfo();
        if (s.role === 'super_admin') return { ok: true, user: s };
        if ((s.role === 'franchisee' || s.role === 'manager') && s.franchiseId && s.franchiseId === franchiseId) {
            return { ok: true, user: s };
        }
        return { ok: false, error: 'Sem permissão para editar dados desta franquia.' };
    }

    function setMeta(franchiseId, periodKey, valor) {
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        if (isNaN(valor) || valor < 0) return { success: false, error: 'Valor inválido.' };
        const all = getMetasAll();
        if (!all[franchiseId]) all[franchiseId] = {};
        const before = all[franchiseId][periodKey] || null;
        all[franchiseId][periodKey] = {
            valor: Number(valor),
            updatedAt: new Date().toISOString(),
            updatedBy: g.user.name
        };
        setSetting('settings_metas', all);
        audit('config.meta_set', { franchiseId, periodKey, valor, before, by: g.user.name });
        return { success: true };
    }

    function removeMeta(franchiseId, periodKey) {
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        const all = getMetasAll();
        if (all[franchiseId]) delete all[franchiseId][periodKey];
        setSetting('settings_metas', all);
        audit('config.meta_removed', { franchiseId, periodKey });
        return { success: true };
    }

    /** Progresso vs meta no período. */
    function getMetaProgress(franchiseId, periodKey) {
        const meta = getMeta(franchiseId, periodKey);
        if (!meta || meta.valor <= 0) return null;
        let receita = 0;
        if (typeof Financas !== 'undefined' && Financas.getSalesInPeriod) {
            receita = Financas.getSalesInPeriod(franchiseId, periodKey).total || 0;
        }
        return {
            periodKey,
            valor: meta.valor,
            realizado: receita,
            pct: meta.valor > 0 ? Math.min(1.5, receita / meta.valor) : 0,
            updatedBy: meta.updatedBy,
            updatedAt: meta.updatedAt
        };
    }

    /* ============================================
       Checklist de turno
       ============================================ */
    function _checklistKey(franchiseId) {
        return franchiseId ? ('settings_checklist_' + franchiseId) : 'settings_checklist';
    }

    /** Retorna checklist: por-franquia se existir; senão global; senão default. */
    function getChecklistTemplates(franchiseId) {
        // 1. Tenta por-franquia
        if (franchiseId) {
            const perFranchise = getSetting(_checklistKey(franchiseId), null);
            if (perFranchise && typeof perFranchise === 'object' &&
                ((perFranchise.abertura && perFranchise.abertura.length) ||
                 (perFranchise.fechamento && perFranchise.fechamento.length))) {
                return {
                    abertura: Array.isArray(perFranchise.abertura) && perFranchise.abertura.length ? perFranchise.abertura : DEFAULT_CHECKLIST.abertura,
                    fechamento: Array.isArray(perFranchise.fechamento) && perFranchise.fechamento.length ? perFranchise.fechamento : DEFAULT_CHECKLIST.fechamento,
                    _source: 'franchise'
                };
            }
        }
        // 2. Fallback global (super_admin pode ter definido um template padrão)
        const custom = getSetting('settings_checklist', null);
        if (custom && typeof custom === 'object' &&
            ((custom.abertura && custom.abertura.length) || (custom.fechamento && custom.fechamento.length))) {
            return {
                abertura: Array.isArray(custom.abertura) && custom.abertura.length ? custom.abertura : DEFAULT_CHECKLIST.abertura,
                fechamento: Array.isArray(custom.fechamento) && custom.fechamento.length ? custom.fechamento : DEFAULT_CHECKLIST.fechamento,
                _source: 'global'
            };
        }
        // 3. Defaults
        const d = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST));
        d._source = 'default';
        return d;
    }

    /**
     * Salva templates. Se franchiseId passado: grava em settings_checklist_{fid}.
     * Super_admin: pode salvar global (sem franchiseId) ou de qualquer franquia.
     * Franchisee/manager: só a própria franquia (franchiseId obrigatório e == session.franchiseId).
     */
    function saveChecklistTemplates(franchiseId, tpls) {
        // Compat: chamadas antigas passam só tpls (super_admin, global)
        if (franchiseId && typeof franchiseId === 'object' && tpls === undefined) {
            tpls = franchiseId;
            franchiseId = null;
        }
        const s = sessionInfo();
        if (!franchiseId) {
            // Global — só super_admin
            if (s.role !== 'super_admin') return { success: false, error: 'Apenas super_admin pode alterar checklist global.' };
            setSetting('settings_checklist', tpls);
            audit('config.checklist_updated', { scope: 'global', by: s.name });
        } else {
            const g = requireFranchiseScope(franchiseId);
            if (!g.ok) return { success: false, error: g.error };
            setSetting(_checklistKey(franchiseId), tpls);
            audit('config.checklist_updated', { scope: 'franchise', franchiseId, by: g.user.name });
        }
        return { success: true };
    }

    function resetChecklistTemplates(franchiseId) {
        const s = sessionInfo();
        if (!franchiseId) {
            if (s.role !== 'super_admin') return { success: false, error: 'Apenas super_admin pode alterar checklist global.' };
            setSetting('settings_checklist', null);
            audit('config.checklist_reset', { scope: 'global', by: s.name });
        } else {
            const g = requireFranchiseScope(franchiseId);
            if (!g.ok) return { success: false, error: g.error };
            setSetting(_checklistKey(franchiseId), null);
            audit('config.checklist_reset', { scope: 'franchise', franchiseId, by: g.user.name });
        }
        return { success: true };
    }

    /** Registra execução de checklist. Retorna execId. */
    function recordChecklistExec(franchiseId, phase, items) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        if (phase !== 'abertura' && phase !== 'fechamento') return { success: false, error: 'Fase inválida.' };
        const user = sessionInfo();
        const exec = {
            phase,
            dateKey: new Date().toISOString().slice(0, 10),
            items: items || [],
            completedCount: (items || []).filter(i => i.done).length,
            totalCount: (items || []).length,
            requiredMissing: (items || []).filter(i => i.required && !i.done).length,
            userId: user.id,
            userName: user.name
        };
        const saved = DataStore.addToCollection('checklist_exec', franchiseId, exec);
        audit('checklist.executed', { franchiseId, phase, completed: exec.completedCount, missing: exec.requiredMissing });
        return { success: true, exec: saved };
    }

    function getTodayChecklistExec(franchiseId, phase) {
        const today = new Date().toISOString().slice(0, 10);
        const all = (DataStore.getCollection('checklist_exec', franchiseId) || []);
        return all.find(e => e.phase === phase && e.dateKey === today) || null;
    }

    /* ============================================
       Códigos curtos de TV (URLs /t?tv1)
       Códigos são únicos POR FRANQUIA, não globalmente.
       Resolução usa o IP público pra descobrir a franquia.
       ============================================ */
    function _tvShortKey(franchiseId) {
        return 'tv_shortcodes_' + franchiseId;
    }

    function listTvShortcodesForFranchise(franchiseId) {
        if (!franchiseId) return [];
        const map = getSetting(_tvShortKey(franchiseId), {}) || {};
        return Object.entries(map).map(([code, v]) => ({ code, fid: franchiseId, ...v }));
    }

    /** Busca atalho específico numa franquia. */
    function getTvShortcodeForFranchise(franchiseId, code) {
        if (!franchiseId || !code) return null;
        const map = getSetting(_tvShortKey(franchiseId), {}) || {};
        const entry = map[String(code).toLowerCase()];
        if (!entry) return null;
        return { code: String(code).toLowerCase(), fid: franchiseId, ...entry };
    }

    /** Mantido pra compatibilidade: busca o código em TODAS as franquias (retorna primeiro match). */
    function getTvShortcode(code) {
        if (!code) return null;
        const c = String(code).toLowerCase();
        // Novo formato: procura em todas as franquias
        const franchises = (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? (DataStore.getCollection('franchises', null) || [])
            : [];
        for (const f of franchises) {
            const entry = getTvShortcodeForFranchise(f.id, c);
            if (entry) return entry;
        }
        // Fallback formato antigo (durante migração)
        const legacy = getSetting('tv_shortcodes', null);
        if (legacy && legacy[c]) return { code: c, ...legacy[c] };
        return null;
    }

    function setTvShortcode(franchiseId, code, tvId) {
        const c = String(code || '').toLowerCase().trim();
        if (!/^[a-z0-9]{1,8}$/.test(c)) return { success: false, error: 'Código deve ter 1 a 8 letras/números (sem espaço).' };
        if (!tvId) return { success: false, error: 'TV inválida.' };
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        const key = _tvShortKey(franchiseId);
        const map = getSetting(key, {}) || {};
        map[c] = {
            tvId: tvId,
            createdBy: g.user.name,
            createdAt: new Date().toISOString()
        };
        setSetting(key, map);
        audit('config.tv_shortcode_set', { code: c, fid: franchiseId, tvId: tvId, by: g.user.name });
        return { success: true, code: c };
    }

    function removeTvShortcode(franchiseId, code) {
        const c = String(code || '').toLowerCase().trim();
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        const key = _tvShortKey(franchiseId);
        const map = getSetting(key, {}) || {};
        if (!map[c]) return { success: false, error: 'Código não encontrado.' };
        delete map[c];
        setSetting(key, map);
        audit('config.tv_shortcode_removed', { code: c, fid: franchiseId, by: g.user.name });
        return { success: true };
    }

    /* ============================================
       IPs autorizados por franquia
       ============================================ */
    function getFranchiseIpsAll() {
        return getSetting('franchise_ips', {}) || {};
    }

    /** Retorna a franquia cujo IP autorizado bate com o IP dado. */
    function getFranchiseByIp(ip) {
        if (!ip) return null;
        const map = getFranchiseIpsAll();
        for (const [fid, list] of Object.entries(map)) {
            if (Array.isArray(list) && list.indexOf(ip) !== -1) return fid;
        }
        return null;
    }

    function listFranchiseIps(franchiseId) {
        const map = getFranchiseIpsAll();
        return (map[franchiseId] || []).slice();
    }

    function addFranchiseIp(franchiseId, ip) {
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        const normalized = String(ip || '').trim();
        if (!/^[0-9a-fA-F:.]{3,45}$/.test(normalized)) return { success: false, error: 'IP inválido.' };
        const map = getFranchiseIpsAll();
        // Verifica se esse IP já pertence a outra franquia (evita colisão)
        for (const [fid, list] of Object.entries(map)) {
            if (fid !== franchiseId && Array.isArray(list) && list.indexOf(normalized) !== -1) {
                return { success: false, error: 'Este IP já está registrado para outra franquia. Verifique ou peça ao admin.' };
            }
        }
        if (!map[franchiseId]) map[franchiseId] = [];
        if (map[franchiseId].indexOf(normalized) !== -1) return { success: false, error: 'IP já está registrado.' };
        map[franchiseId].push(normalized);
        setSetting('franchise_ips', map);
        audit('config.franchise_ip_added', { fid: franchiseId, ip: normalized, by: g.user.name });
        return { success: true };
    }

    function removeFranchiseIp(franchiseId, ip) {
        const g = requireFranchiseScope(franchiseId);
        if (!g.ok) return { success: false, error: g.error };
        const map = getFranchiseIpsAll();
        if (!map[franchiseId]) return { success: false, error: 'Nenhum IP registrado.' };
        const before = map[franchiseId].length;
        map[franchiseId] = map[franchiseId].filter(x => x !== ip);
        if (map[franchiseId].length === before) return { success: false, error: 'IP não encontrado.' };
        setSetting('franchise_ips', map);
        audit('config.franchise_ip_removed', { fid: franchiseId, ip, by: g.user.name });
        return { success: true };
    }

    /* ---- Format helpers ---- */
    function formatBRL(v) {
        const n = Number(v || 0);
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + 'R$ ' + abs.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    return {
        // Mensagens
        DEFAULT_MESSAGES,
        getMessages,
        saveMessages,
        resetMessages,
        getDefaultMessages,

        // Metas
        getMeta,
        getMetasAll,
        setMeta,
        removeMeta,
        getMetaProgress,

        // Checklist
        DEFAULT_CHECKLIST,
        getChecklistTemplates,
        saveChecklistTemplates,
        resetChecklistTemplates,
        recordChecklistExec,
        getTodayChecklistExec,

        // TV shortcodes (por-franquia + por-IP)
        getTvShortcode,
        getTvShortcodeForFranchise,
        listTvShortcodesForFranchise,
        setTvShortcode,
        removeTvShortcode,
        // IPs por franquia
        getFranchiseByIp,
        listFranchiseIps,
        addFranchiseIp,
        removeFranchiseIp,

        formatBRL
    };
})();
