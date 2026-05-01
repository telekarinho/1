/* ============================================
   MilkyPot - Sistema de Audit Log
   ============================================
   Registra todas as acoes importantes do sistema
   para rastreabilidade e compliance.
   Logs sao imutaveis (write-only no Firestore).
   ============================================ */

const AuditLog = {
    // ============================================
    // Tipos de evento
    // ============================================
    EVENTS: {
        // Auth
        LOGIN: 'auth.login',
        LOGIN_GOOGLE: 'auth.login_google',
        LOGIN_LEGACY: 'auth.login_legacy',
        LOGOUT: 'auth.logout',
        PASSWORD_CHANGE: 'auth.password_change',
        PASSWORD_RESET: 'auth.password_reset',
        USER_CREATED: 'auth.user_created',
        USER_UPDATED: 'auth.user_updated',
        USER_DELETED: 'auth.user_deleted',

        // Orders
        ORDER_CREATED: 'order.created',
        ORDER_STATUS_CHANGED: 'order.status_changed',
        ORDER_CANCELLED: 'order.cancelled',
        ORDER_EDITED: 'order.edited',

        // Finances
        FINANCE_CREATED: 'finance.created',
        FINANCE_EDITED: 'finance.edited',
        FINANCE_DELETED: 'finance.deleted',
        PAYMENT_MARKED: 'finance.payment_marked',

        // Franchise
        FRANCHISE_CREATED: 'franchise.created',
        FRANCHISE_UPDATED: 'franchise.updated',
        FRANCHISE_STATUS_CHANGED: 'franchise.status_changed',

        // Inventory
        INVENTORY_UPDATED: 'inventory.updated',
        INVENTORY_ENTRY: 'inventory.entry',

        // Staff
        STAFF_CREATED: 'staff.created',
        STAFF_UPDATED: 'staff.updated',
        STAFF_DEACTIVATED: 'staff.deactivated',

        // Products
        PRODUCT_CREATED: 'product.created',
        PRODUCT_UPDATED: 'product.updated',
        PRODUCT_TOGGLED: 'product.toggled',
        
        // Gamification / Marketing
        CHALLENGE_REWARD: 'marketing.challenge_reward',

        // Settings
        SETTINGS_CHANGED: 'settings.changed',
        BACKUP_CREATED: 'system.backup',
        BACKUP_RESTORED: 'system.restore'
    },

    // ============================================
    // Buffer para batch writes
    // ============================================
    _buffer: [],
    _flushTimer: null,
    _FLUSH_INTERVAL: 5000, // 5 segundos
    _FLUSH_SIZE: 20, // max itens no buffer antes de flush

    // ============================================
    // Log principal
    // ============================================
    log(event, details = {}, franchiseId = null) {
        const session = this._getSession();

        const entry = {
            id: Utils.generateId(),
            event: event,
            timestamp: new Date().toISOString(),
            userId: session?.userId || 'anonymous',
            userName: session?.name || 'Sistema',
            userEmail: session?.email || null,
            userRole: session?.role || null,
            franchiseId: franchiseId || session?.franchiseId || null,
            details: details,
            ip: null, // Preenchido pelo backend quando tiver Functions
            userAgent: navigator.userAgent.substring(0, 200)
        };

        // Salva no localStorage (ultimos 500 logs)
        this._saveLocal(entry);

        // Envia para Firestore em background
        this._buffer.push(entry);
        if (this._buffer.length >= this._FLUSH_SIZE) {
            this._flush();
        } else if (!this._flushTimer) {
            this._flushTimer = setTimeout(() => this._flush(), this._FLUSH_INTERVAL);
        }

        // Log no console em dev
        console.log(`[AUDIT] ${entry.event}`, entry.userName, details);

        return entry;
    },

    // Atalhos por categoria
    logAuth(event, details) {
        return this.log(event, details);
    },

    logOrder(event, orderId, details, franchiseId) {
        return this.log(event, { orderId, ...details }, franchiseId);
    },

    logFinance(event, details, franchiseId) {
        return this.log(event, details, franchiseId);
    },

    logFranchise(event, franchiseId, details) {
        return this.log(event, details, franchiseId);
    },

    // ============================================
    // Storage local (ultimos 500 logs)
    // ============================================
    _saveLocal(entry) {
        try {
            const key = 'mp_audit_log';
            let logs = JSON.parse(localStorage.getItem(key) || '[]');
            logs.unshift(entry);
            // Manter apenas os ultimos 500
            if (logs.length > 500) {
                logs = logs.slice(0, 500);
            }
            localStorage.setItem(key, JSON.stringify(logs));
        } catch (e) {
            console.warn('AuditLog._saveLocal error:', e);
        }
    },

    // ============================================
    // Flush para Firestore
    // ============================================
    _flush() {
        if (this._flushTimer) {
            clearTimeout(this._flushTimer);
            this._flushTimer = null;
        }

        if (this._buffer.length === 0) return;

        const entries = [...this._buffer];
        this._buffer = [];

        if (!DataStore._ready || !DataStore._db) {
            // Sem Firestore, manter em buffer
            this._buffer = entries.concat(this._buffer);
            return;
        }

        try {
            const batch = DataStore._db.batch();
            entries.forEach(entry => {
                const ref = DataStore._db.collection('audit_log').doc(entry.id);
                batch.set(ref, {
                    ...entry,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            batch.commit().catch(err => {
                console.warn('AuditLog flush error:', err);
                // Re-add to buffer on failure
                this._buffer = entries.concat(this._buffer);
            });
        } catch (e) {
            console.warn('AuditLog._flush error:', e);
            this._buffer = entries.concat(this._buffer);
        }
    },

    // ============================================
    // Consultas
    // ============================================
    getLocal(limit = 100) {
        try {
            const logs = JSON.parse(localStorage.getItem('mp_audit_log') || '[]');
            return logs.slice(0, limit);
        } catch (e) {
            return [];
        }
    },

    getLocalByEvent(eventType, limit = 50) {
        return this.getLocal(500).filter(l => l.event === eventType).slice(0, limit);
    },

    getLocalByUser(userId, limit = 50) {
        return this.getLocal(500).filter(l => l.userId === userId).slice(0, limit);
    },

    getLocalByFranchise(franchiseId, limit = 50) {
        return this.getLocal(500).filter(l => l.franchiseId === franchiseId).slice(0, limit);
    },

    // Consulta Firestore (async)
    async queryFirestore(filters = {}, limit = 100) {
        if (!DataStore._ready || !DataStore._db) return this.getLocal(limit);

        try {
            let query = DataStore._db.collection('audit_log')
                .orderBy('timestamp', 'desc');

            if (filters.event) {
                query = query.where('event', '==', filters.event);
            }
            if (filters.userId) {
                query = query.where('userId', '==', filters.userId);
            }
            if (filters.franchiseId) {
                query = query.where('franchiseId', '==', filters.franchiseId);
            }
            if (filters.startDate) {
                query = query.where('timestamp', '>=', new Date(filters.startDate));
            }
            if (filters.endDate) {
                query = query.where('timestamp', '<=', new Date(filters.endDate));
            }

            query = query.limit(limit);
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('AuditLog.queryFirestore error:', e);
            return this.getLocal(limit);
        }
    },

    // ============================================
    // Helpers
    // ============================================
    _getSession() {
        try {
            const data = localStorage.getItem(MP.SESSION_KEY || 'mp_session');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Traduz evento para label PT-BR
    eventLabel(event) {
        const labels = {
            'auth.login': 'Login (e-mail)',
            'auth.login_google': 'Login (Google)',
            'auth.login_legacy': 'Login (legado)',
            'auth.logout': 'Logout',
            'auth.password_change': 'Alteracao de senha',
            'auth.password_reset': 'Reset de senha',
            'auth.user_created': 'Usuario criado',
            'auth.user_updated': 'Usuario atualizado',
            'auth.user_deleted': 'Usuario removido',
            'order.created': 'Pedido criado',
            'order.status_changed': 'Status do pedido alterado',
            'order.cancelled': 'Pedido cancelado',
            'order.edited': 'Pedido editado',
            'finance.created': 'Lancamento financeiro',
            'finance.edited': 'Lancamento editado',
            'finance.deleted': 'Lancamento removido',
            'finance.payment_marked': 'Pagamento marcado',
            'franchise.created': 'Franquia criada',
            'franchise.updated': 'Franquia atualizada',
            'franchise.status_changed': 'Status da franquia alterado',
            'inventory.updated': 'Estoque atualizado',
            'inventory.entry': 'Entrada de estoque',
            'staff.created': 'Funcionario criado',
            'staff.updated': 'Funcionario atualizado',
            'staff.deactivated': 'Funcionario desativado',
            'product.created': 'Produto criado',
            'product.updated': 'Produto atualizado',
            'product.toggled': 'Produto ativado/desativado',
            'marketing.challenge_reward': 'Prêmio de Desafio Concedido',
            'settings.changed': 'Configuracoes alteradas',
            'system.backup': 'Backup criado',
            'system.restore': 'Backup restaurado'
        };
        return labels[event] || event;
    },

    // Icone do evento
    eventIcon(event) {
        const category = event.split('.')[0];
        const icons = {
            'auth': '🔐',
            'order': '📦',
            'finance': '💰',
            'franchise': '🏪',
            'inventory': '📦',
            'staff': '👥',
            'product': '🍦',
            'settings': '⚙️',
            'system': '🔧'
        };
        return icons[category] || '📋';
    },

    // Flush quando a pagina for fechada
    init() {
        window.addEventListener('beforeunload', () => this._flush());
        // Flush periodico a cada 30s
        setInterval(() => this._flush(), 30000);
    }
};

// Auto-inicializa
AuditLog.init();

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.AuditLog = AuditLog;
if (typeof globalThis !== 'undefined') globalThis.AuditLog = AuditLog;
