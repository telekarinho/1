/* ============================================
   MilkyPot - Constantes do Sistema
   ============================================
   Enums centralizados para evitar magic strings.
   ============================================ */

const MP = {
    // Roles de usuario
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        FRANCHISEE: 'franchisee',
        MANAGER: 'manager',
        STAFF: 'staff'
    },

    // Status de pedido
    ORDER_STATUS: {
        NEW: 'novo',
        CONFIRMED: 'confirmado',
        PREPARING: 'preparando',
        READY: 'pronto',
        OUT_FOR_DELIVERY: 'em_entrega',
        DELIVERED: 'entregue',
        CANCELLED: 'cancelado'
    },

    // Status de pagamento
    PAYMENT_STATUS: {
        PENDING: 'pendente',
        PAID: 'pago',
        OVERDUE: 'atrasado',
        DUE_SOON: 'vencendo',
        REFUNDED: 'reembolsado'
    },

    // Metodos de pagamento
    PAYMENT_METHODS: {
        PIX: 'pix',
        CREDIT: 'credito',
        DEBIT: 'debito',
        CASH: 'dinheiro'
    },

    // Status de franquia
    FRANCHISE_STATUS: {
        ACTIVE: 'ativo',
        INACTIVE: 'inativo',
        PENDING: 'pendente'
    },

    // Status de funcionario
    STAFF_STATUS: {
        ACTIVE: 'ativo',
        INACTIVE: 'inativo'
    },

    // Categorias financeiras
    FINANCE_CATEGORIES: {
        INCOME: ['vendas', 'taxas', 'outros_receita'],
        EXPENSE: ['ingredientes', 'aluguel', 'salarios', 'manutencao', 'marketing', 'embalagens', 'energia', 'agua', 'internet', 'outros']
    },

    // Tipos de entrega
    DELIVERY_TYPES: {
        DELIVERY: 'delivery',
        PICKUP: 'retirada',
        DINE_IN: 'consumo_local'
    },

    // Tipos de franquia
    FRANCHISE_TYPES: {
        EXPRESS: 'express',
        STORE: 'store',
        MEGA: 'mega'
    },

    // Coleções do Firestore
    COLLECTIONS: {
        USERS: 'users',
        FRANCHISES: 'franchises',
        ORDERS: 'orders',
        FINANCES: 'finances',
        INVENTORY: 'inventory',
        STAFF: 'staff',
        PRODUCTS: 'products',
        PAYMENTS: 'payments',
        SETTINGS: 'settings',
        AUDIT_LOG: 'audit_log'
    },

    // Owner email principal (para auto-registro como super_admin)
    OWNER_EMAIL: 'jocimarrodrigo@gmail.com',

    // Owners adicionais — todos viram super_admin no primeiro login com Google
    OWNER_EMAILS: ['jocimarrodrigo@gmail.com', 'milkypot.com@gmail.com'],

    // Session config
    SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 horas
    SESSION_KEY: 'mp_session',

    // Vercel API URL (para Cloud Functions serverless)
    VERCEL_API_URL: 'https://milkypot.vercel.app'
};

// Configura URL da API Vercel globalmente
window.MP_VERCEL_API_URL = MP.VERCEL_API_URL;
