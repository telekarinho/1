/* ============================================
   MilkyPot — Operator Context
   ============================================
   Identifica QUEM esta operando o PDV/caixa fisicamente,
   independente de quem fez login no painel (admin pode
   operar OU pode ter colaboradores fazendo turnos).

   Casos:
   - Admin loga e opera ele mesmo: operator = admin session
   - Admin loga, mas Carlos vai operar: seleciona Carlos com PIN
   - Maria troca turno com Carlos: usa "Trocar Operador" + PIN

   Permissoes granulares por colaborador (CLT):
   - pdv: opera vendas
   - caixa_abrir / caixa_fechar / caixa_sangria
   - pedidos / produtos / estoque
   - financeiro / despesas / fiscal
   - equipe / ponto / configuracoes / marketing
   ============================================ */

(function () {
    'use strict';

    var STORAGE_KEY = 'mp_pdv_operator';
    var IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4h sem atividade -> precisa reidentificar

    var DEFAULT_PERMISSIONS = {
        // Vendas
        pdv:               true,
        pedidos:           true,
        // Caixa
        caixa_abrir:       false,
        caixa_fechar:      false,
        caixa_sangria:     false,
        caixa_reforco:     false,
        // Gestao
        produtos:          false,
        estoque:           false,
        equipe:            false,
        ponto:             true,   // sempre pode ver/bater seu proprio ponto
        // Financeiro
        financeiro:        false,
        despesas:          false,
        fiscal:            false,
        // Outros
        marketing:         false,
        configuracoes:     false,
        relatorios:        false
    };

    var ADMIN_PERMISSIONS = (function () {
        var p = {};
        Object.keys(DEFAULT_PERMISSIONS).forEach(function (k) { p[k] = true; });
        return p;
    })();

    function nowIso() { return new Date().toISOString(); }

    function readStored() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || !data.id) return null;
            // Idle check
            if (data.lastActivity) {
                var idle = Date.now() - new Date(data.lastActivity).getTime();
                if (idle > IDLE_TIMEOUT_MS) {
                    sessionStorage.removeItem(STORAGE_KEY);
                    return null;
                }
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    function writeStored(data) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    }

    function clearStored() {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    function bumpActivity() {
        var current = readStored();
        if (current) {
            current.lastActivity = nowIso();
            writeStored(current);
        }
    }

    // ----------------------------------------
    // getCurrent — quem esta operando agora
    // ----------------------------------------
    function getCurrent() {
        var stored = readStored();
        if (stored) return stored;

        // Fallback: admin/franqueado logado
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            var s = Auth.getSession();
            if (s) {
                return {
                    id:         s.userId || 'admin_' + (s.email || ''),
                    name:       s.name,
                    email:      s.email,
                    role:       s.role,
                    type:       s.role === 'super_admin' || s.role === 'franchisee' ? 'admin' : 'staff',
                    isFromSession: true,
                    permissions: ADMIN_PERMISSIONS,
                    loginAt:    s.loginAt || nowIso(),
                    lastActivity: nowIso()
                };
            }
        }
        return null;
    }

    function isAdmin() {
        var c = getCurrent();
        return c && c.type === 'admin';
    }

    function hasPermission(key) {
        var c = getCurrent();
        if (!c) return false;
        if (c.type === 'admin') return true;
        return !!(c.permissions && c.permissions[key]);
    }

    // ----------------------------------------
    // Lista quem pode operar (admin + colabs ativos)
    // ----------------------------------------
    function listAvailableOperators(franchiseId) {
        var operators = [];

        // Admin/franqueado da sessao
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            var s = Auth.getSession();
            if (s) {
                operators.push({
                    id:    'admin_' + (s.email || s.userId),
                    name:  s.name + ' (Admin)',
                    role:  'Administrador',
                    email: s.email,
                    type:  'admin',
                    color: '#7C3AED',
                    requiresPin: false
                });
            }
        }

        // Colaboradores
        if (typeof DataStore !== 'undefined') {
            var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return s.active; });
            staff.forEach(function (st) {
                operators.push({
                    id:           st.id,
                    name:         st.name,
                    role:         st.role,
                    type:         'staff',
                    color:        roleColor(st.role),
                    pis:          st.pis || '',
                    cpf:          st.cpf || '',
                    requiresPin:  !!st.pin,
                    permissions:  st.permissions || DEFAULT_PERMISSIONS,
                    hasPin:       !!st.pin
                });
            });
        }

        return operators;
    }

    function roleColor(role) {
        var map = {
            'Atendente':   '#2196F3',
            'Cozinheiro':  '#FF9800',
            'Gerente':     '#9C27B0',
            'Entregador':  '#4CAF50'
        };
        return map[role] || '#6B7280';
    }

    // ----------------------------------------
    // selectOperator — define quem opera (com PIN se for staff)
    // ----------------------------------------
    function selectOperator(franchiseId, operatorId, pin) {
        if (!operatorId) return { success: false, error: 'Operador nao identificado' };

        // Admin?
        if (operatorId.indexOf('admin_') === 0) {
            var s = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
            if (!s) return { success: false, error: 'Sessao admin nao encontrada' };

            var ctx = {
                id:    'admin_' + (s.email || s.userId),
                name:  s.name,
                email: s.email,
                role:  s.role,
                type:  'admin',
                permissions: ADMIN_PERMISSIONS,
                loginAt: nowIso(),
                lastActivity: nowIso(),
                isFromSession: false
            };
            writeStored(ctx);
            audit(franchiseId, 'operator_selected', { operatorId: ctx.id, name: ctx.name, type: 'admin' });
            return { success: true, operator: ctx };
        }

        // Staff
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || []).find(function (x) { return x.id === operatorId; })
            : null;
        if (!staff) return { success: false, error: 'Colaborador nao encontrado' };
        if (!staff.active) return { success: false, error: 'Colaborador inativo' };
        if (staff.pin && staff.pin !== pin) return { success: false, error: 'PIN incorreto' };

        var operatorCtx = {
            id:    staff.id,
            name:  staff.name,
            email: staff.email || null,
            role:  staff.role,
            type:  'staff',
            cpf:   staff.cpf || '',
            pis:   staff.pis || '',
            permissions: staff.permissions || DEFAULT_PERMISSIONS,
            loginAt: nowIso(),
            lastActivity: nowIso()
        };
        writeStored(operatorCtx);
        audit(franchiseId, 'operator_selected', { operatorId: staff.id, name: staff.name, type: 'staff' });
        return { success: true, operator: operatorCtx };
    }

    function clearOperator(franchiseId) {
        var c = getCurrent();
        if (c) audit(franchiseId, 'operator_cleared', { operatorId: c.id, name: c.name });
        clearStored();
    }

    // ----------------------------------------
    // Audit
    // ----------------------------------------
    function audit(franchiseId, action, details) {
        try {
            if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
                DataStore.addToCollection('operator_audit', franchiseId, {
                    id: 'op_aud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    action: action,
                    details: details || {},
                    timestamp: nowIso(),
                    sessionUser: (typeof Auth !== 'undefined' && Auth.getSession() ? Auth.getSession().email : null)
                });
            }
        } catch (e) {}
    }

    // ----------------------------------------
    // Permission gate — usado em paginas pra bloquear acesso
    // ----------------------------------------
    function requirePermission(key, redirectTo) {
        if (hasPermission(key)) return true;
        var c = getCurrent();
        var msg = c
            ? 'Voce (' + c.name + ') nao tem permissao para acessar esta area.'
            : 'Operador nao identificado. Va ao PDV e identifique-se.';
        alert(msg);
        if (redirectTo) window.location.href = redirectTo;
        return false;
    }

    // API publica
    window.OperatorContext = {
        DEFAULT_PERMISSIONS: DEFAULT_PERMISSIONS,
        ADMIN_PERMISSIONS: ADMIN_PERMISSIONS,

        getCurrent:           getCurrent,
        isAdmin:              isAdmin,
        hasPermission:        hasPermission,
        requirePermission:    requirePermission,
        listAvailableOperators: listAvailableOperators,
        selectOperator:       selectOperator,
        clearOperator:        clearOperator,
        bumpActivity:         bumpActivity
    };

})();
