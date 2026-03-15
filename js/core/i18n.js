/* ============================================
   MilkyPot - Sistema de Internacionalização (i18n)
   ============================================
   Suporta múltiplos idiomas com fallback para pt-BR.
   Uso: i18n.t('key') ou t('key')
   ============================================ */

const i18n = {
    _currentLang: 'pt-BR',
    _fallbackLang: 'pt-BR',
    _translations: {},
    _initialized: false,

    // Idiomas disponíveis
    LANGUAGES: {
        'pt-BR': { name: 'Português (BR)', flag: '🇧🇷' },
        'en': { name: 'English', flag: '🇺🇸' },
        'es': { name: 'Español', flag: '🇪🇸' }
    },

    // ============================================
    // Inicialização
    // ============================================
    init() {
        // Carrega idioma salvo ou detecta do navegador
        const saved = localStorage.getItem('mp_language');
        if (saved && this.LANGUAGES[saved]) {
            this._currentLang = saved;
        } else {
            this._currentLang = this._detectLanguage();
        }
        this._initialized = true;
        return this._currentLang;
    },

    // ============================================
    // Tradução principal
    // ============================================
    t(key, params) {
        if (!this._initialized) this.init();

        // Busca na língua atual
        let text = this._resolve(key, this._currentLang);

        // Fallback para pt-BR
        if (text === undefined) {
            text = this._resolve(key, this._fallbackLang);
        }

        // Se não encontrou, retorna a key formatada
        if (text === undefined) {
            return key.split('.').pop().replace(/_/g, ' ');
        }

        // Substitui parâmetros {{param}}
        if (params) {
            Object.keys(params).forEach(k => {
                text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]);
            });
        }

        return text;
    },

    // Resolve chave aninhada: "auth.login_error" → translations[lang].auth.login_error
    _resolve(key, lang) {
        const dict = this._translations[lang];
        if (!dict) return undefined;
        const parts = key.split('.');
        let obj = dict;
        for (const part of parts) {
            if (obj && typeof obj === 'object' && part in obj) {
                obj = obj[part];
            } else {
                return undefined;
            }
        }
        return typeof obj === 'string' ? obj : undefined;
    },

    // ============================================
    // Getters/Setters
    // ============================================
    getLang() {
        return this._currentLang;
    },

    setLang(lang) {
        if (!this.LANGUAGES[lang]) return false;
        this._currentLang = lang;
        localStorage.setItem('mp_language', lang);
        // Dispara evento para componentes que escutam
        document.dispatchEvent(new CustomEvent('mp:language-changed', { detail: { lang } }));
        return true;
    },

    getAvailableLanguages() {
        return Object.entries(this.LANGUAGES).map(([code, info]) => ({
            code, ...info, active: code === this._currentLang
        }));
    },

    // ============================================
    // Auto-tradução de elementos DOM
    // ============================================
    translatePage() {
        // Traduz elementos com data-i18n="chave"
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Traduz placeholders com data-i18n-placeholder="chave"
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Traduz titles com data-i18n-title="chave"
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Atualiza html lang
        document.documentElement.lang = this._currentLang === 'pt-BR' ? 'pt-BR' : this._currentLang;
    },

    // ============================================
    // Selector de idioma (injeta no DOM)
    // ============================================
    renderLanguageSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const langs = this.getAvailableLanguages();
        container.innerHTML = langs.map(l => `
            <button class="lang-btn ${l.active ? 'active' : ''}"
                    onclick="i18n.setLang('${l.code}'); i18n.translatePage(); location.reload();"
                    title="${l.name}">
                ${l.flag}
            </button>
        `).join('');
    },

    // ============================================
    // Detecção de idioma do navegador
    // ============================================
    _detectLanguage() {
        const nav = navigator.language || navigator.userLanguage || 'pt-BR';
        if (nav.startsWith('pt')) return 'pt-BR';
        if (nav.startsWith('es')) return 'es';
        if (nav.startsWith('en')) return 'en';
        return 'pt-BR';
    }
};

// ============================================
// TRADUÇÕES: Português (BR) — Idioma base
// ============================================
i18n._translations['pt-BR'] = {
    common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        add: 'Adicionar',
        search: 'Buscar',
        filter: 'Filtrar',
        export: 'Exportar',
        print: 'Imprimir',
        back: 'Voltar',
        close: 'Fechar',
        confirm: 'Confirmar',
        loading: 'Carregando...',
        no_data: 'Nenhum dado encontrado',
        success: 'Sucesso!',
        error: 'Erro',
        warning: 'Atenção',
        yes: 'Sim',
        no: 'Não',
        actions: 'Ações',
        total: 'Total',
        date: 'Data',
        name: 'Nome',
        email: 'E-mail',
        phone: 'Telefone',
        status: 'Status',
        type: 'Tipo',
        value: 'Valor',
        quantity: 'Quantidade',
        description: 'Descrição',
        category: 'Categoria',
        all: 'Todos',
        active: 'Ativo',
        inactive: 'Inativo',
        pending: 'Pendente'
    },

    auth: {
        login: 'Entrar',
        logout: 'Sair',
        login_title: 'Acesso ao Sistema',
        login_subtitle: 'Painel Administrativo & Franqueados',
        login_google: 'Entrar com Google',
        login_email_divider: 'ou entre com e-mail',
        email_label: 'E-mail',
        email_placeholder: 'seu@email.com',
        password_label: 'Senha',
        password_placeholder: 'Sua senha',
        forgot_password: 'Esqueci minha senha',
        back_to_site: 'Voltar ao site',
        logging_in: 'Entrando...',
        fill_all_fields: 'Preencha todos os campos',
        user_not_registered: 'Usuário não cadastrado no sistema. Solicite acesso ao administrador.',
        google_not_registered: 'Este e-mail Google não está cadastrado no sistema. Solicite acesso ao administrador.',
        email_exists: 'E-mail já cadastrado',
        not_authenticated: 'Usuário não autenticado',
        weak_password: 'Senha deve ter mínimo 8 caracteres, 1 maiúscula e 1 número',
        reauth_required: 'Por segurança, faça logout e login novamente antes de alterar a senha',
        password_reset_sent: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.',
        password_reset_error: 'Erro ao enviar e-mail de recuperação',
        password_reset_instruction: 'Digite seu e-mail no campo acima para receber o link de recuperação',
        login_error: 'E-mail ou senha incorretos',
        network_error: 'Erro ao conectar. Verifique sua internet.',
        google_error: 'Erro ao fazer login com Google',
        account_migrated: 'Sua conta foi migrada para autenticação segura.',
        // Firebase errors
        'error.user-not-found': 'Usuário não encontrado',
        'error.wrong-password': 'Senha incorreta',
        'error.invalid-email': 'E-mail inválido',
        'error.email-already-in-use': 'E-mail já cadastrado no Firebase',
        'error.weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
        'error.too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
        'error.network-request-failed': 'Erro de conexão. Verifique sua internet.',
        'error.popup-closed': 'Login cancelado',
        'error.requires-recent-login': 'Sessão expirada. Faça login novamente.',
        'error.invalid-credential': 'E-mail ou senha incorretos'
    },

    nav: {
        dashboard: 'Dashboard',
        orders: 'Pedidos',
        products: 'Produtos',
        inventory: 'Estoque',
        finances: 'Financeiro',
        staff: 'Equipe',
        marketing: 'Marketing',
        settings: 'Configurações',
        delivery: 'Entregas',
        loyalty: 'Fidelidade',
        franchises: 'Franquias',
        users: 'Usuários',
        audit: 'Auditoria',
        campaigns: 'Campanhas',
        seo: 'SEO'
    },

    orders: {
        title: 'Gerenciamento de Pedidos',
        new_order: 'Novo Pedido',
        order_number: 'Pedido #{{id}}',
        customer: 'Cliente',
        items: 'Itens',
        subtotal: 'Subtotal',
        delivery_fee: 'Taxa de entrega',
        discount: 'Desconto',
        notes: 'Observações',
        // Status
        status_new: 'Novo',
        status_confirmed: 'Confirmado',
        status_preparing: 'Preparando',
        status_ready: 'Pronto',
        status_out_delivery: 'Em Entrega',
        status_delivered: 'Entregue',
        status_cancelled: 'Cancelado',
        // Delivery types
        delivery: 'Delivery',
        pickup: 'Retirada',
        dine_in: 'Consumo Local'
    },

    products: {
        title: 'Gerenciamento de Produtos',
        add_product: 'Novo Produto',
        product_name: 'Nome do produto',
        price: 'Preço',
        sizes: 'Tamanhos',
        flavors: 'Sabores',
        available: 'Disponível',
        unavailable: 'Indisponível'
    },

    finances: {
        title: 'Controle Financeiro',
        revenue: 'Receita',
        expenses: 'Despesas',
        profit: 'Lucro',
        balance: 'Saldo',
        income: 'Entrada',
        expense: 'Saída',
        dre_title: 'DRE - Demonstrativo de Resultado',
        period: 'Período',
        monthly: 'Mensal',
        weekly: 'Semanal',
        daily: 'Diário',
        // Categories
        cat_sales: 'Vendas',
        cat_fees: 'Taxas',
        cat_ingredients: 'Ingredientes',
        cat_rent: 'Aluguel',
        cat_salaries: 'Salários',
        cat_maintenance: 'Manutenção',
        cat_marketing: 'Marketing',
        cat_packaging: 'Embalagens',
        cat_electricity: 'Energia',
        cat_water: 'Água',
        cat_internet: 'Internet',
        cat_other: 'Outros'
    },

    staff: {
        title: 'Gerenciamento de Equipe',
        add_member: 'Novo Membro',
        role: 'Função',
        shift: 'Turno',
        hire_date: 'Data de contratação',
        salary: 'Salário'
    },

    franchises: {
        title: 'Gerenciamento de Franquias',
        add_franchise: 'Nova Franquia',
        franchise_name: 'Nome da franquia',
        address: 'Endereço',
        city: 'Cidade',
        state: 'Estado',
        type_express: 'Express',
        type_store: 'Loja',
        type_mega: 'Mega',
        kpi_revenue: 'Faturamento',
        kpi_orders: 'Pedidos',
        kpi_avg_ticket: 'Ticket Médio',
        kpi_customers: 'Clientes'
    },

    loyalty: {
        title: 'Programa de Fidelidade',
        points: 'Pontos',
        rewards: 'Recompensas',
        customer_name: 'Nome do cliente',
        customer_phone: 'Telefone',
        total_points: 'Total de pontos',
        available_rewards: 'Recompensas disponíveis',
        redeem: 'Resgatar',
        history: 'Histórico',
        points_per_real: '1 ponto por R$1 gasto',
        reward_threshold: '100 pontos = 1 recompensa'
    },

    inventory: {
        title: 'Controle de Estoque',
        item_name: 'Item',
        current_stock: 'Estoque atual',
        min_stock: 'Estoque mínimo',
        unit: 'Unidade',
        low_stock: 'Estoque baixo',
        add_stock: 'Adicionar estoque',
        stock_alert: 'Alerta de estoque'
    },

    notifications: {
        title: 'Notificações',
        mark_all_read: 'Marcar todas como lidas',
        no_notifications: 'Nenhuma notificação',
        new_order: 'Novo pedido recebido',
        order_confirmed: 'Pedido confirmado',
        low_stock_alert: 'Alerta: estoque baixo',
        payment_received: 'Pagamento recebido'
    },

    payment: {
        pix: 'PIX',
        credit: 'Crédito',
        debit: 'Débito',
        cash: 'Dinheiro',
        status_pending: 'Pendente',
        status_paid: 'Pago',
        status_overdue: 'Atrasado',
        status_due_soon: 'Vencendo',
        status_refunded: 'Reembolsado'
    },

    users: {
        title: 'Gerenciamento de Usuários',
        add_user: 'Novo Usuário',
        role_super_admin: 'Super Admin',
        role_franchisee: 'Franqueado',
        role_manager: 'Gerente',
        role_staff: 'Funcionário',
        change_password: 'Alterar Senha',
        reset_password: 'Resetar Senha'
    },

    audit: {
        title: 'Log de Auditoria',
        event: 'Evento',
        user: 'Usuário',
        timestamp: 'Data/Hora',
        details: 'Detalhes',
        export_csv: 'Exportar CSV'
    },

    storefront: {
        menu: 'Cardápio',
        cart: 'Carrinho',
        add_to_cart: 'Adicionar ao carrinho',
        checkout: 'Finalizar pedido',
        your_order: 'Seu pedido',
        empty_cart: 'Carrinho vazio',
        order_placed: 'Pedido realizado com sucesso!',
        order_tracking: 'Acompanhe seu pedido',
        delivery_address: 'Endereço de entrega',
        payment_method: 'Forma de pagamento'
    },

    dashboard: {
        welcome: 'Bem-vindo, {{name}}!',
        today_sales: 'Vendas hoje',
        today_orders: 'Pedidos hoje',
        monthly_revenue: 'Faturamento mensal',
        pending_orders: 'Pedidos pendentes',
        top_products: 'Produtos mais vendidos',
        recent_orders: 'Pedidos recentes',
        quick_actions: 'Ações rápidas'
    },

    settings: {
        title: 'Configurações',
        general: 'Geral',
        appearance: 'Aparência',
        language: 'Idioma',
        timezone: 'Fuso horário',
        currency: 'Moeda',
        notifications_settings: 'Notificações',
        backup: 'Backup',
        export_data: 'Exportar dados'
    }
};

// ============================================
// TRADUÇÕES: English
// ============================================
i18n._translations['en'] = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        print: 'Print',
        back: 'Back',
        close: 'Close',
        confirm: 'Confirm',
        loading: 'Loading...',
        no_data: 'No data found',
        success: 'Success!',
        error: 'Error',
        warning: 'Warning',
        yes: 'Yes',
        no: 'No',
        actions: 'Actions',
        total: 'Total',
        date: 'Date',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        status: 'Status',
        type: 'Type',
        value: 'Value',
        quantity: 'Quantity',
        description: 'Description',
        category: 'Category',
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending'
    },

    auth: {
        login: 'Sign In',
        logout: 'Sign Out',
        login_title: 'System Access',
        login_subtitle: 'Admin Panel & Franchisees',
        login_google: 'Sign in with Google',
        login_email_divider: 'or sign in with email',
        email_label: 'Email',
        email_placeholder: 'your@email.com',
        password_label: 'Password',
        password_placeholder: 'Your password',
        forgot_password: 'Forgot my password',
        back_to_site: 'Back to site',
        logging_in: 'Signing in...',
        fill_all_fields: 'Fill in all fields',
        user_not_registered: 'User not registered in the system. Request access from the administrator.',
        google_not_registered: 'This Google email is not registered in the system. Request access from the administrator.',
        email_exists: 'Email already registered',
        not_authenticated: 'User not authenticated',
        weak_password: 'Password must have at least 8 characters, 1 uppercase and 1 number',
        reauth_required: 'For security, please log out and log in again before changing your password',
        password_reset_sent: 'Recovery email sent! Check your inbox.',
        password_reset_error: 'Error sending recovery email',
        password_reset_instruction: 'Enter your email above to receive the recovery link',
        login_error: 'Incorrect email or password',
        network_error: 'Connection error. Check your internet.',
        google_error: 'Error signing in with Google',
        account_migrated: 'Your account has been migrated to secure authentication.',
        'error.user-not-found': 'User not found',
        'error.wrong-password': 'Incorrect password',
        'error.invalid-email': 'Invalid email',
        'error.email-already-in-use': 'Email already registered in Firebase',
        'error.weak-password': 'Password too weak (minimum 6 characters)',
        'error.too-many-requests': 'Too many attempts. Wait a few minutes.',
        'error.network-request-failed': 'Connection error. Check your internet.',
        'error.popup-closed': 'Login cancelled',
        'error.requires-recent-login': 'Session expired. Sign in again.',
        'error.invalid-credential': 'Incorrect email or password'
    },

    nav: {
        dashboard: 'Dashboard',
        orders: 'Orders',
        products: 'Products',
        inventory: 'Inventory',
        finances: 'Finances',
        staff: 'Team',
        marketing: 'Marketing',
        settings: 'Settings',
        delivery: 'Deliveries',
        loyalty: 'Loyalty',
        franchises: 'Franchises',
        users: 'Users',
        audit: 'Audit',
        campaigns: 'Campaigns',
        seo: 'SEO'
    },

    orders: {
        title: 'Order Management',
        new_order: 'New Order',
        order_number: 'Order #{{id}}',
        customer: 'Customer',
        items: 'Items',
        subtotal: 'Subtotal',
        delivery_fee: 'Delivery fee',
        discount: 'Discount',
        notes: 'Notes',
        status_new: 'New',
        status_confirmed: 'Confirmed',
        status_preparing: 'Preparing',
        status_ready: 'Ready',
        status_out_delivery: 'Out for Delivery',
        status_delivered: 'Delivered',
        status_cancelled: 'Cancelled',
        delivery: 'Delivery',
        pickup: 'Pickup',
        dine_in: 'Dine In'
    },

    products: {
        title: 'Product Management',
        add_product: 'New Product',
        product_name: 'Product name',
        price: 'Price',
        sizes: 'Sizes',
        flavors: 'Flavors',
        available: 'Available',
        unavailable: 'Unavailable'
    },

    finances: {
        title: 'Financial Control',
        revenue: 'Revenue',
        expenses: 'Expenses',
        profit: 'Profit',
        balance: 'Balance',
        income: 'Income',
        expense: 'Expense',
        dre_title: 'Income Statement',
        period: 'Period',
        monthly: 'Monthly',
        weekly: 'Weekly',
        daily: 'Daily',
        cat_sales: 'Sales',
        cat_fees: 'Fees',
        cat_ingredients: 'Ingredients',
        cat_rent: 'Rent',
        cat_salaries: 'Salaries',
        cat_maintenance: 'Maintenance',
        cat_marketing: 'Marketing',
        cat_packaging: 'Packaging',
        cat_electricity: 'Electricity',
        cat_water: 'Water',
        cat_internet: 'Internet',
        cat_other: 'Other'
    },

    staff: {
        title: 'Team Management',
        add_member: 'New Member',
        role: 'Role',
        shift: 'Shift',
        hire_date: 'Hire date',
        salary: 'Salary'
    },

    franchises: {
        title: 'Franchise Management',
        add_franchise: 'New Franchise',
        franchise_name: 'Franchise name',
        address: 'Address',
        city: 'City',
        state: 'State',
        type_express: 'Express',
        type_store: 'Store',
        type_mega: 'Mega',
        kpi_revenue: 'Revenue',
        kpi_orders: 'Orders',
        kpi_avg_ticket: 'Avg Ticket',
        kpi_customers: 'Customers'
    },

    loyalty: {
        title: 'Loyalty Program',
        points: 'Points',
        rewards: 'Rewards',
        customer_name: 'Customer name',
        customer_phone: 'Phone',
        total_points: 'Total points',
        available_rewards: 'Available rewards',
        redeem: 'Redeem',
        history: 'History',
        points_per_real: '1 point per R$1 spent',
        reward_threshold: '100 points = 1 reward'
    },

    inventory: {
        title: 'Inventory Control',
        item_name: 'Item',
        current_stock: 'Current stock',
        min_stock: 'Minimum stock',
        unit: 'Unit',
        low_stock: 'Low stock',
        add_stock: 'Add stock',
        stock_alert: 'Stock alert'
    },

    notifications: {
        title: 'Notifications',
        mark_all_read: 'Mark all as read',
        no_notifications: 'No notifications',
        new_order: 'New order received',
        order_confirmed: 'Order confirmed',
        low_stock_alert: 'Alert: low stock',
        payment_received: 'Payment received'
    },

    payment: {
        pix: 'PIX',
        credit: 'Credit',
        debit: 'Debit',
        cash: 'Cash',
        status_pending: 'Pending',
        status_paid: 'Paid',
        status_overdue: 'Overdue',
        status_due_soon: 'Due Soon',
        status_refunded: 'Refunded'
    },

    users: {
        title: 'User Management',
        add_user: 'New User',
        role_super_admin: 'Super Admin',
        role_franchisee: 'Franchisee',
        role_manager: 'Manager',
        role_staff: 'Staff',
        change_password: 'Change Password',
        reset_password: 'Reset Password'
    },

    audit: {
        title: 'Audit Log',
        event: 'Event',
        user: 'User',
        timestamp: 'Date/Time',
        details: 'Details',
        export_csv: 'Export CSV'
    },

    storefront: {
        menu: 'Menu',
        cart: 'Cart',
        add_to_cart: 'Add to cart',
        checkout: 'Checkout',
        your_order: 'Your order',
        empty_cart: 'Empty cart',
        order_placed: 'Order placed successfully!',
        order_tracking: 'Track your order',
        delivery_address: 'Delivery address',
        payment_method: 'Payment method'
    },

    dashboard: {
        welcome: 'Welcome, {{name}}!',
        today_sales: 'Today\'s sales',
        today_orders: 'Today\'s orders',
        monthly_revenue: 'Monthly revenue',
        pending_orders: 'Pending orders',
        top_products: 'Top products',
        recent_orders: 'Recent orders',
        quick_actions: 'Quick actions'
    },

    settings: {
        title: 'Settings',
        general: 'General',
        appearance: 'Appearance',
        language: 'Language',
        timezone: 'Timezone',
        currency: 'Currency',
        notifications_settings: 'Notifications',
        backup: 'Backup',
        export_data: 'Export data'
    }
};

// ============================================
// TRADUÇÕES: Español
// ============================================
i18n._translations['es'] = {
    common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        search: 'Buscar',
        filter: 'Filtrar',
        export: 'Exportar',
        print: 'Imprimir',
        back: 'Volver',
        close: 'Cerrar',
        confirm: 'Confirmar',
        loading: 'Cargando...',
        no_data: 'No se encontraron datos',
        success: '¡Éxito!',
        error: 'Error',
        warning: 'Atención',
        yes: 'Sí',
        no: 'No',
        actions: 'Acciones',
        total: 'Total',
        date: 'Fecha',
        name: 'Nombre',
        email: 'Correo',
        phone: 'Teléfono',
        status: 'Estado',
        type: 'Tipo',
        value: 'Valor',
        quantity: 'Cantidad',
        description: 'Descripción',
        category: 'Categoría',
        all: 'Todos',
        active: 'Activo',
        inactive: 'Inactivo',
        pending: 'Pendiente'
    },

    auth: {
        login: 'Iniciar sesión',
        logout: 'Cerrar sesión',
        login_title: 'Acceso al Sistema',
        login_subtitle: 'Panel Administrativo y Franquiciados',
        login_google: 'Iniciar sesión con Google',
        login_email_divider: 'o inicie sesión con correo',
        email_label: 'Correo',
        email_placeholder: 'su@correo.com',
        password_label: 'Contraseña',
        password_placeholder: 'Su contraseña',
        forgot_password: 'Olvidé mi contraseña',
        back_to_site: 'Volver al sitio',
        logging_in: 'Iniciando sesión...',
        fill_all_fields: 'Complete todos los campos',
        user_not_registered: 'Usuario no registrado en el sistema. Solicite acceso al administrador.',
        google_not_registered: 'Este correo de Google no está registrado en el sistema. Solicite acceso al administrador.',
        email_exists: 'Correo ya registrado',
        not_authenticated: 'Usuario no autenticado',
        weak_password: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número',
        reauth_required: 'Por seguridad, cierre sesión e inicie sesión nuevamente antes de cambiar su contraseña',
        password_reset_sent: '¡Correo de recuperación enviado! Revise su bandeja de entrada.',
        password_reset_error: 'Error al enviar correo de recuperación',
        password_reset_instruction: 'Ingrese su correo arriba para recibir el enlace de recuperación',
        login_error: 'Correo o contraseña incorrectos',
        network_error: 'Error de conexión. Verifique su internet.',
        google_error: 'Error al iniciar sesión con Google',
        account_migrated: 'Su cuenta ha sido migrada a autenticación segura.',
        'error.user-not-found': 'Usuario no encontrado',
        'error.wrong-password': 'Contraseña incorrecta',
        'error.invalid-email': 'Correo inválido',
        'error.email-already-in-use': 'Correo ya registrado en Firebase',
        'error.weak-password': 'Contraseña muy débil (mínimo 6 caracteres)',
        'error.too-many-requests': 'Demasiados intentos. Espere unos minutos.',
        'error.network-request-failed': 'Error de conexión. Verifique su internet.',
        'error.popup-closed': 'Inicio de sesión cancelado',
        'error.requires-recent-login': 'Sesión expirada. Inicie sesión nuevamente.',
        'error.invalid-credential': 'Correo o contraseña incorrectos'
    },

    nav: {
        dashboard: 'Panel',
        orders: 'Pedidos',
        products: 'Productos',
        inventory: 'Inventario',
        finances: 'Finanzas',
        staff: 'Equipo',
        marketing: 'Marketing',
        settings: 'Configuración',
        delivery: 'Entregas',
        loyalty: 'Fidelidad',
        franchises: 'Franquicias',
        users: 'Usuarios',
        audit: 'Auditoría',
        campaigns: 'Campañas',
        seo: 'SEO'
    },

    orders: {
        title: 'Gestión de Pedidos',
        new_order: 'Nuevo Pedido',
        order_number: 'Pedido #{{id}}',
        customer: 'Cliente',
        items: 'Artículos',
        subtotal: 'Subtotal',
        delivery_fee: 'Tarifa de envío',
        discount: 'Descuento',
        notes: 'Observaciones',
        status_new: 'Nuevo',
        status_confirmed: 'Confirmado',
        status_preparing: 'Preparando',
        status_ready: 'Listo',
        status_out_delivery: 'En Entrega',
        status_delivered: 'Entregado',
        status_cancelled: 'Cancelado',
        delivery: 'Envío',
        pickup: 'Retiro',
        dine_in: 'Consumo Local'
    },

    products: {
        title: 'Gestión de Productos',
        add_product: 'Nuevo Producto',
        product_name: 'Nombre del producto',
        price: 'Precio',
        sizes: 'Tamaños',
        flavors: 'Sabores',
        available: 'Disponible',
        unavailable: 'No disponible'
    },

    finances: {
        title: 'Control Financiero',
        revenue: 'Ingresos',
        expenses: 'Gastos',
        profit: 'Ganancia',
        balance: 'Saldo',
        income: 'Entrada',
        expense: 'Salida',
        dre_title: 'Estado de Resultados',
        period: 'Período',
        monthly: 'Mensual',
        weekly: 'Semanal',
        daily: 'Diario',
        cat_sales: 'Ventas',
        cat_fees: 'Tasas',
        cat_ingredients: 'Ingredientes',
        cat_rent: 'Alquiler',
        cat_salaries: 'Salarios',
        cat_maintenance: 'Mantenimiento',
        cat_marketing: 'Marketing',
        cat_packaging: 'Embalajes',
        cat_electricity: 'Electricidad',
        cat_water: 'Agua',
        cat_internet: 'Internet',
        cat_other: 'Otros'
    },

    staff: {
        title: 'Gestión de Equipo',
        add_member: 'Nuevo Miembro',
        role: 'Función',
        shift: 'Turno',
        hire_date: 'Fecha de contratación',
        salary: 'Salario'
    },

    franchises: {
        title: 'Gestión de Franquicias',
        add_franchise: 'Nueva Franquicia',
        franchise_name: 'Nombre de la franquicia',
        address: 'Dirección',
        city: 'Ciudad',
        state: 'Estado',
        type_express: 'Express',
        type_store: 'Tienda',
        type_mega: 'Mega',
        kpi_revenue: 'Ingresos',
        kpi_orders: 'Pedidos',
        kpi_avg_ticket: 'Ticket Promedio',
        kpi_customers: 'Clientes'
    },

    loyalty: {
        title: 'Programa de Fidelidad',
        points: 'Puntos',
        rewards: 'Recompensas',
        customer_name: 'Nombre del cliente',
        customer_phone: 'Teléfono',
        total_points: 'Total de puntos',
        available_rewards: 'Recompensas disponibles',
        redeem: 'Canjear',
        history: 'Historial',
        points_per_real: '1 punto por R$1 gastado',
        reward_threshold: '100 puntos = 1 recompensa'
    },

    inventory: {
        title: 'Control de Inventario',
        item_name: 'Artículo',
        current_stock: 'Stock actual',
        min_stock: 'Stock mínimo',
        unit: 'Unidad',
        low_stock: 'Stock bajo',
        add_stock: 'Agregar stock',
        stock_alert: 'Alerta de stock'
    },

    notifications: {
        title: 'Notificaciones',
        mark_all_read: 'Marcar todas como leídas',
        no_notifications: 'Sin notificaciones',
        new_order: 'Nuevo pedido recibido',
        order_confirmed: 'Pedido confirmado',
        low_stock_alert: 'Alerta: stock bajo',
        payment_received: 'Pago recibido'
    },

    payment: {
        pix: 'PIX',
        credit: 'Crédito',
        debit: 'Débito',
        cash: 'Efectivo',
        status_pending: 'Pendiente',
        status_paid: 'Pagado',
        status_overdue: 'Vencido',
        status_due_soon: 'Por vencer',
        status_refunded: 'Reembolsado'
    },

    users: {
        title: 'Gestión de Usuarios',
        add_user: 'Nuevo Usuario',
        role_super_admin: 'Super Admin',
        role_franchisee: 'Franquiciado',
        role_manager: 'Gerente',
        role_staff: 'Empleado',
        change_password: 'Cambiar Contraseña',
        reset_password: 'Resetear Contraseña'
    },

    audit: {
        title: 'Registro de Auditoría',
        event: 'Evento',
        user: 'Usuario',
        timestamp: 'Fecha/Hora',
        details: 'Detalles',
        export_csv: 'Exportar CSV'
    },

    storefront: {
        menu: 'Menú',
        cart: 'Carrito',
        add_to_cart: 'Agregar al carrito',
        checkout: 'Finalizar pedido',
        your_order: 'Su pedido',
        empty_cart: 'Carrito vacío',
        order_placed: '¡Pedido realizado con éxito!',
        order_tracking: 'Siga su pedido',
        delivery_address: 'Dirección de entrega',
        payment_method: 'Método de pago'
    },

    dashboard: {
        welcome: '¡Bienvenido, {{name}}!',
        today_sales: 'Ventas de hoy',
        today_orders: 'Pedidos de hoy',
        monthly_revenue: 'Ingresos mensuales',
        pending_orders: 'Pedidos pendientes',
        top_products: 'Productos más vendidos',
        recent_orders: 'Pedidos recientes',
        quick_actions: 'Acciones rápidas'
    },

    settings: {
        title: 'Configuración',
        general: 'General',
        appearance: 'Apariencia',
        language: 'Idioma',
        timezone: 'Zona horaria',
        currency: 'Moneda',
        notifications_settings: 'Notificaciones',
        backup: 'Copia de seguridad',
        export_data: 'Exportar datos'
    }
};

// Atalho global
function t(key, params) {
    return i18n.t(key, params);
}

// Auto-init
if (typeof document !== 'undefined') {
    i18n.init();
}
