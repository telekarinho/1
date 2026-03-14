/* ============================================
   MilkyPot - DataStore (localStorage Abstraction)
   ============================================
   Camada de dados que pode ser migrada para
   Firebase/Supabase no futuro sem alterar a API.
   ============================================ */

const DataStore = {
    PREFIX: 'mp_',

    // ============================================
    // CRUD Básico
    // ============================================
    get(key) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('DataStore.get error:', key, e);
            return null;
        }
    },

    set(key, data) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('DataStore.set error:', key, e);
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    // ============================================
    // Collections (com suporte a franchiseId)
    // ============================================
    _collectionKey(name, franchiseId) {
        return franchiseId ? `${name}_${franchiseId}` : name;
    },

    getCollection(name, franchiseId) {
        return this.get(this._collectionKey(name, franchiseId)) || [];
    },

    setCollection(name, franchiseId, data) {
        return this.set(this._collectionKey(name, franchiseId), data);
    },

    addToCollection(name, franchiseId, item) {
        const col = this.getCollection(name, franchiseId);
        item.id = item.id || Utils.generateId();
        item.createdAt = item.createdAt || new Date().toISOString();
        col.push(item);
        this.setCollection(name, franchiseId, col);
        return item;
    },

    updateInCollection(name, franchiseId, id, updates) {
        const col = this.getCollection(name, franchiseId);
        const idx = col.findIndex(item => item.id === id);
        if (idx === -1) return null;
        col[idx] = { ...col[idx], ...updates, updatedAt: new Date().toISOString() };
        this.setCollection(name, franchiseId, col);
        return col[idx];
    },

    removeFromCollection(name, franchiseId, id) {
        const col = this.getCollection(name, franchiseId);
        const filtered = col.filter(item => item.id !== id);
        this.setCollection(name, franchiseId, filtered);
        return filtered.length < col.length;
    },

    query(name, franchiseId, filterFn) {
        const col = this.getCollection(name, franchiseId);
        return filterFn ? col.filter(filterFn) : col;
    },

    count(name, franchiseId, filterFn) {
        return this.query(name, franchiseId, filterFn).length;
    },

    // ============================================
    // Aggregations
    // ============================================
    sum(name, franchiseId, field, filterFn) {
        return this.query(name, franchiseId, filterFn)
            .reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
    },

    // ============================================
    // Cross-franchise queries (para admin)
    // ============================================
    getAllFranchises() {
        return this.getCollection('franchises', null);
    },

    getOrdersAllFranchises(filterFn) {
        const franchises = this.getAllFranchises();
        let allOrders = [];
        franchises.forEach(f => {
            const orders = this.getCollection('orders', f.id);
            orders.forEach(o => { o._franchiseId = f.id; o._franchiseName = f.name; });
            allOrders = allOrders.concat(orders);
        });
        return filterFn ? allOrders.filter(filterFn) : allOrders;
    },

    getFinancesAllFranchises(filterFn) {
        const franchises = this.getAllFranchises();
        let allFinances = [];
        franchises.forEach(f => {
            const finances = this.getCollection('finances', f.id);
            finances.forEach(fin => { fin._franchiseId = f.id; fin._franchiseName = f.name; });
            allFinances = allFinances.concat(finances);
        });
        return filterFn ? allFinances.filter(filterFn) : allFinances;
    },

    // ============================================
    // Export / Import (backup)
    // ============================================
    exportAll() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.PREFIX)) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    },

    importAll(data) {
        Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.setItem(key, value);
            }
        });
    },

    downloadBackup() {
        const data = this.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `milkypot-backup-${Utils.today()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // ============================================
    // SEED - Dados iniciais para demonstração
    // ============================================
    seed() {
        if (this.get('_seeded')) return;

        // ---- Usuários ----
        const users = [
            {
                id: 'admin1',
                email: 'admin@milkypot.com',
                password: 'admin123',
                role: 'super_admin',
                name: 'Admin MilkyPot',
                franchiseId: null,
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'franq1',
                email: 'catuai@milkypot.com',
                password: 'catuai123',
                role: 'franchisee',
                name: 'João Silva',
                franchiseId: 'catuai',
                createdAt: '2024-06-01T00:00:00Z'
            },
            {
                id: 'franq2',
                email: 'morumbi@milkypot.com',
                password: 'morumbi123',
                role: 'franchisee',
                name: 'Maria Santos',
                franchiseId: 'morumbi',
                createdAt: '2024-03-15T00:00:00Z'
            },
            {
                id: 'franq3',
                email: 'jardins@milkypot.com',
                password: 'jardins123',
                role: 'franchisee',
                name: 'Pedro Oliveira',
                franchiseId: 'jardins',
                createdAt: '2024-02-01T00:00:00Z'
            }
        ];
        this.set('users', users);

        // ---- Franquias ----
        const franchises = [
            {
                id: 'ibirapuera',
                slug: 'ibirapuera',
                name: 'MilkyPot Shopping Ibirapuera',
                address: 'Av. Ibirapuera, 3103 - Moema, São Paulo - SP',
                city: 'São Paulo',
                state: 'SP',
                phone: '(11) 3456-7890',
                whatsapp: '5511934567890',
                rating: 4.9,
                deliveryTime: '20-35 min',
                deliveryFee: 5.90,
                hours: '10:00 - 22:00',
                type: 'store',
                status: 'ativo',
                monthlyFee: 5000,
                createdAt: '2023-01-15T00:00:00Z',
                lat: -23.6100, lng: -46.6658
            },
            {
                id: 'morumbi',
                slug: 'morumbi',
                name: 'MilkyPot Shopping Morumbi',
                address: 'Av. Roque Petroni Jr, 1089 - Morumbi, São Paulo - SP',
                city: 'São Paulo',
                state: 'SP',
                phone: '(11) 3456-7891',
                whatsapp: '5511934567891',
                rating: 4.8,
                deliveryTime: '25-40 min',
                deliveryFee: 6.90,
                hours: '10:00 - 22:00',
                type: 'store',
                status: 'ativo',
                monthlyFee: 5000,
                createdAt: '2023-03-01T00:00:00Z',
                lat: -23.6233, lng: -46.6975
            },
            {
                id: 'jardins',
                slug: 'jardins',
                name: 'MilkyPot Jardins',
                address: 'Rua Oscar Freire, 725 - Jardins, São Paulo - SP',
                city: 'São Paulo',
                state: 'SP',
                phone: '(11) 3456-7892',
                whatsapp: '5511934567892',
                rating: 4.9,
                deliveryTime: '15-25 min',
                deliveryFee: 4.90,
                hours: '09:00 - 23:00',
                type: 'mega',
                status: 'ativo',
                monthlyFee: 8000,
                createdAt: '2023-02-01T00:00:00Z',
                lat: -23.5618, lng: -46.6698
            },
            {
                id: 'barra',
                slug: 'barra',
                name: 'MilkyPot Barra Shopping',
                address: 'Av. das Américas, 4666 - Barra, Rio de Janeiro - RJ',
                city: 'Rio de Janeiro',
                state: 'RJ',
                phone: '(21) 3456-7893',
                whatsapp: '5521934567893',
                rating: 4.7,
                deliveryTime: '25-40 min',
                deliveryFee: 7.90,
                hours: '10:00 - 22:00',
                type: 'store',
                status: 'ativo',
                monthlyFee: 5000,
                createdAt: '2023-06-01T00:00:00Z',
                lat: -22.9998, lng: -43.3652
            },
            {
                id: 'catuai',
                slug: 'catuai',
                name: 'MilkyPot Catuai Londrina',
                address: 'Rod. Celso Garcia Cid, 5600 - Londrina - PR',
                city: 'Londrina',
                state: 'PR',
                phone: '(43) 3456-7894',
                whatsapp: '5543934567894',
                rating: 4.8,
                deliveryTime: '20-30 min',
                deliveryFee: 5.50,
                hours: '10:00 - 22:00',
                type: 'store',
                status: 'ativo',
                monthlyFee: 4500,
                createdAt: '2024-06-01T00:00:00Z',
                lat: -23.3045, lng: -51.1696
            },
            {
                id: 'recife',
                slug: 'recife',
                name: 'MilkyPot Shopping Recife',
                address: 'R. Padre Carapuceiro, 777 - Boa Viagem, Recife - PE',
                city: 'Recife',
                state: 'PE',
                phone: '(81) 3456-7895',
                whatsapp: '5581934567895',
                rating: 4.9,
                deliveryTime: '20-35 min',
                deliveryFee: 5.00,
                hours: '10:00 - 22:00',
                type: 'express',
                status: 'ativo',
                monthlyFee: 3500,
                createdAt: '2024-01-01T00:00:00Z',
                lat: -8.1186, lng: -34.9056
            }
        ];
        this.set('franchises', franchises);

        // ---- Pedidos demo para cada franquia ----
        const sabores = ['Ninho', 'Morango', 'Ninho com Morango', 'Nutella', 'Oreo', 'Açaí + Granola', 'Banana + Whey'];
        const nomes = ['Ana', 'Carlos', 'Julia', 'Pedro', 'Maria', 'Lucas', 'Lara', 'Bruno', 'Sofia', 'Mateus'];
        const statuses = ['entregue', 'entregue', 'entregue', 'pronto', 'preparando', 'novo'];

        franchises.forEach(f => {
            const orders = [];
            const numOrders = Math.floor(Math.random() * 20) + 30; // 30-50 pedidos
            for (let i = 0; i < numOrders; i++) {
                const daysAgo = Math.floor(Math.random() * 30);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                date.setHours(Math.floor(Math.random() * 12) + 10, Math.floor(Math.random() * 60));

                const numItems = Math.floor(Math.random() * 3) + 1;
                const items = [];
                let total = 0;
                for (let j = 0; j < numItems; j++) {
                    const price = [10, 14, 18, 22][Math.floor(Math.random() * 4)];
                    total += price;
                    items.push({
                        sabor: sabores[Math.floor(Math.random() * sabores.length)],
                        tamanho: ['Mini', 'Pequeno', 'Medio', 'Gigante'][Math.floor(Math.random() * 4)],
                        formato: ['Shake', 'Sundae'][Math.floor(Math.random() * 2)],
                        price: price,
                        nomeCliente: nomes[Math.floor(Math.random() * nomes.length)]
                    });
                }

                orders.push({
                    id: `ord_${f.id}_${i}`,
                    items: items,
                    customer: {
                        name: nomes[Math.floor(Math.random() * nomes.length)],
                        phone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
                    },
                    delivery: Math.random() > 0.5 ? 'delivery' : 'retirada',
                    payment: ['pix', 'credito', 'debito', 'dinheiro'][Math.floor(Math.random() * 4)],
                    status: daysAgo > 1 ? 'entregue' : statuses[Math.floor(Math.random() * statuses.length)],
                    total: total,
                    createdAt: date.toISOString()
                });
            }
            this.set('orders_' + f.id, orders);

            // ---- Finanças demo ----
            const finances = [];
            for (let d = 29; d >= 0; d--) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                const dateStr = date.toISOString().split('T')[0];

                // Receitas (dos pedidos daquele dia)
                const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));
                const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
                if (dayRevenue > 0) {
                    finances.push({
                        id: Utils.generateId(),
                        type: 'income',
                        category: 'vendas',
                        amount: dayRevenue,
                        description: `Vendas do dia (${dayOrders.length} pedidos)`,
                        date: dateStr,
                        createdAt: date.toISOString()
                    });
                }

                // Despesas aleatórias
                if (Math.random() > 0.6) {
                    const categories = ['ingredientes', 'aluguel', 'salarios', 'manutencao', 'marketing', 'outros'];
                    const cat = categories[Math.floor(Math.random() * categories.length)];
                    const amounts = { ingredientes: 800, aluguel: 5000, salarios: 3000, manutencao: 500, marketing: 1000, outros: 300 };
                    finances.push({
                        id: Utils.generateId(),
                        type: 'expense',
                        category: cat,
                        amount: amounts[cat] * (0.5 + Math.random()),
                        description: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                        date: dateStr,
                        createdAt: date.toISOString()
                    });
                }
            }
            this.set('finances_' + f.id, finances);

            // ---- Equipe demo ----
            const roles = ['Atendente', 'Cozinheiro', 'Gerente', 'Entregador'];
            const staffNames = ['Ana Clara', 'Roberto Lima', 'Carla Souza', 'Diego Costa', 'Fernanda Alves'];
            const staff = staffNames.slice(0, Math.floor(Math.random() * 3) + 3).map((name, i) => ({
                id: `staff_${f.id}_${i}`,
                name: name,
                role: roles[i % roles.length],
                phone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                salary: [1800, 2200, 3500, 1600][i % 4],
                startDate: '2024-01-15',
                active: true,
                createdAt: '2024-01-15T00:00:00Z'
            }));
            this.set('staff_' + f.id, staff);

            // ---- Inventário demo ----
            const inventory = [
                { id: `inv_${f.id}_1`, name: 'Leite Ninho', category: 'ingredientes', quantity: Math.floor(Math.random() * 50) + 10, unit: 'kg', minStock: 15 },
                { id: `inv_${f.id}_2`, name: 'Morango', category: 'frutas', quantity: Math.floor(Math.random() * 30) + 5, unit: 'kg', minStock: 10 },
                { id: `inv_${f.id}_3`, name: 'Nutella', category: 'ingredientes', quantity: Math.floor(Math.random() * 20) + 3, unit: 'kg', minStock: 8 },
                { id: `inv_${f.id}_4`, name: 'Oreo', category: 'ingredientes', quantity: Math.floor(Math.random() * 40) + 5, unit: 'pct', minStock: 10 },
                { id: `inv_${f.id}_5`, name: 'Açaí', category: 'ingredientes', quantity: Math.floor(Math.random() * 30) + 5, unit: 'litro', minStock: 12 },
                { id: `inv_${f.id}_6`, name: 'Granola', category: 'ingredientes', quantity: Math.floor(Math.random() * 25) + 5, unit: 'kg', minStock: 8 },
                { id: `inv_${f.id}_7`, name: 'Copos 300ml', category: 'embalagens', quantity: Math.floor(Math.random() * 500) + 100, unit: 'un', minStock: 200 },
                { id: `inv_${f.id}_8`, name: 'Copos 500ml', category: 'embalagens', quantity: Math.floor(Math.random() * 400) + 80, unit: 'un', minStock: 150 },
                { id: `inv_${f.id}_9`, name: 'Whey Protein', category: 'ingredientes', quantity: Math.floor(Math.random() * 10) + 2, unit: 'kg', minStock: 5 },
                { id: `inv_${f.id}_10`, name: 'Banana', category: 'frutas', quantity: Math.floor(Math.random() * 20) + 3, unit: 'kg', minStock: 8 }
            ];
            this.set('inventory_' + f.id, inventory);
        });

        // ---- Pagamentos de franquia ----
        const payments = [];
        franchises.forEach(f => {
            for (let m = 0; m < 6; m++) {
                const due = new Date();
                due.setMonth(due.getMonth() - m);
                due.setDate(10);
                const isPaid = m > 0 || Math.random() > 0.3;
                payments.push({
                    id: Utils.generateId(),
                    franchiseId: f.id,
                    franchiseName: f.name,
                    amount: f.monthlyFee,
                    dueDate: due.toISOString().split('T')[0],
                    paidDate: isPaid ? new Date(due.getTime() + Math.random() * 5 * 86400000).toISOString().split('T')[0] : null,
                    status: isPaid ? 'pago' : (m === 0 ? 'pendente' : 'atrasado'),
                    createdAt: due.toISOString()
                });
            }
        });
        this.set('payments', payments);

        this.set('_seeded', true);
        console.log('🌱 DataStore seeded with demo data!');
    }
};

// Auto-seed on load
DataStore.seed();
