/* ============================================
   MilkyPot - DataStore (Firestore + localStorage)
   ============================================
   Usa Firestore como banco principal com cache
   localStorage para performance instantanea.
   API sincrona mantida para compatibilidade.
   ============================================ */

const DataStore = {
    PREFIX: 'mp_',
    _db: null,
    _ready: false,
    _pendingWrites: [],
    // Flag: true apos _syncFromCloud() completar. Paginas verificam
    // esta flag para nao perder o evento mp_synced quando sync termina
    // antes do listener ser registrado.
    _syncDone: false,

    // ============================================
    // Inicializacao Firestore
    // ============================================
    init() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this._db = firebase.firestore();
                this._ready = true;
                console.log('🔥 DataStore: Firestore conectado');
                // Sync pending writes
                this._flushPendingWrites();
                // Load cloud data to local cache
                this._syncFromCloud();
            } else {
                console.warn('⚠️ DataStore: Firestore nao disponivel, usando localStorage apenas');
            }
        } catch (e) {
            console.error('DataStore.init error:', e);
        }
    },

    // ============================================
    // CRUD Basico (sincrono via localStorage)
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
            // Sync to Firestore in background
            this._writeToCloud(key, data);
            return true;
        } catch (e) {
            console.error('DataStore.set error:', key, e);
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
        this._deleteFromCloud(key);
    },

    // Alias mantido para telas legadas
    getItem(key) {
        return this.get(key);
    },

    setItem(key, data) {
        return this.set(key, data);
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
            const orders = (this.getCollection('orders', f.id) || []);
            orders.forEach(o => { o._franchiseId = f.id; o._franchiseName = f.name; });
            allOrders = allOrders.concat(orders);
        });
        return filterFn ? allOrders.filter(filterFn) : allOrders;
    },

    // ============================================
    // Onboarding & Setup (Scale-Ready)
    // ============================================
    initStore(franchiseId, config = {}) {
        const franchises = this.getAllFranchises() || [];
        const idx = franchises.findIndex(f => f.id === franchiseId);
        if (idx === -1) return { success: false, error: 'Franchise not found' };

        // 1. Update basic metadata (Comercial Align)
        franchises[idx].tipoOperacao = config.tipoOperacao || 'delivery';
        franchises[idx].setupCompleto = false;
        franchises[idx].setupStatus = 'pending'; 
        
        // Investment Breakdown
        franchises[idx].investimentoBase = config.investimentoBase || 3499.99;
        franchises[idx].investimentoEstrutura = config.investimentoEstrutura || 2000.00;
        franchises[idx].investimentoTotalEstimado = franchises[idx].investimentoBase + franchises[idx].investimentoEstrutura;
        
        franchises[idx].ticketMedioBase = config.ticketMedio || 20.00;
        franchises[idx].treinamentoTipo = config.treinamentoTipo || 'online'; // online | presencial | hibrido

        franchises[idx].territorio = {
            cidade: config.cidade || '',
            bairro: config.bairro || '',
            raioEntrega: config.raioEntrega || 3,
            status: config.status || 'reservado',
            dataReserva: new Date().toISOString()
        };
        this.set('franchises', franchises);

        // 2. Seed Default Catalog if empty
        const currentCat = this.get('catalog_config');
        if (!currentCat) {
            // Se nao tem catalogo global, usa o seed do cardapio-data
            if (window.CARDAPIO_CONFIG) {
                this.set('catalog_config', window.CARDAPIO_CONFIG);
            }
        }

        // 3. Set Initial Onboarding Checklist (Foco em Clareza Comercial)
        const setupChecklist = [
            { id: 'menu', text: 'Entender cardápio e precificação', done: false, required: true },
            { id: 'stock', text: 'Configurar estoque inicial', done: false, required: true },
            { id: 'test_sale', text: 'Realizar uma venda de teste no PDV', done: false, required: true }
        ];
        this.setCollection('checklist_onboarding', franchiseId, setupChecklist);

        return { success: true, franchise: franchises[idx] };
    },

    markSetupComplete(franchiseId) {
        const franchises = this.getAllFranchises() || [];
        const idx = franchises.findIndex(f => f.id === franchiseId);
        if (idx === -1) return false;

        franchises[idx].setupCompleto = true;
        franchises[idx].setupStatus = 'pronto';
        franchises[idx].activatedAt = new Date().toISOString();
        this.set('franchises', franchises);

        // Trigger notification (to be implemented in notifications.js)
        if (typeof Notifications !== 'undefined' && Notifications.notifyAdminOnActivation) {
            Notifications.notifyAdminOnActivation(franchises[idx]);
        }

        return true;
    },

    getFranchiseAge(franchiseId) {
        const franchises = this.getAllFranchises() || [];
        const f = franchises.find(f => f.id === franchiseId);
        if (!f || !f.createdAt) return 0;

        const start = new Date(f.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
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
    // Firestore Sync (background)
    // ============================================
    _writeToCloud(key, data) {
        if (!this._ready || !this._db) {
            this._pendingWrites.push({ action: 'set', key, data });
            return;
        }
        try {
            // Store as a document in 'datastore' collection
            this._db.collection('datastore').doc(key).set({
                value: JSON.stringify(data),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(err => console.warn('Firestore write error:', key, err));
        } catch (e) {
            console.warn('_writeToCloud error:', e);
        }
    },

    _deleteFromCloud(key) {
        if (!this._ready || !this._db) return;
        try {
            this._db.collection('datastore').doc(key).delete()
                .catch(err => console.warn('Firestore delete error:', key, err));
        } catch (e) {
            console.warn('_deleteFromCloud error:', e);
        }
    },

    _flushPendingWrites() {
        if (!this._ready) return;
        const pending = [...this._pendingWrites];
        this._pendingWrites = [];
        pending.forEach(op => {
            if (op.action === 'set') this._writeToCloud(op.key, op.data);
            if (op.action === 'delete') this._deleteFromCloud(op.key);
        });
    },

    // Fetch only the franchises doc (public, no auth needed)
    async fetchPublicFranchises() {
        if (!this._ready || !this._db) return null;
        try {
            const doc = await this._db.collection('datastore').doc('franchises').get();
            if (doc.exists) {
                const data = JSON.parse(doc.data().value);
                localStorage.setItem(this.PREFIX + 'franchises', JSON.stringify(data));
                return data;
            }
        } catch (e) {
            console.warn('fetchPublicFranchises error:', e);
        }
        return null;
    },

    async _syncFromCloud() {
        if (!this._ready || !this._db) return;
        try {
            // Priority 1: Check for catalog_config specifically for seeding
            const catalogDoc = await this._db.collection('datastore').doc('catalog_config').get();
            if (!catalogDoc.exists && typeof CARDAPIO_CONFIG !== 'undefined') {
                console.log('🌱 Seed: Enviando configuração inicial do cardápio para o Firestore...');
                this.set('catalog_config', CARDAPIO_CONFIG);
            }

            const snapshot = await this._db.collection('datastore').get();
            if (snapshot.empty) {
                // First time: push local data to cloud
                console.log('☁️ Firestore vazio, enviando dados locais...');
                this._pushAllToCloud();
            } else {
                // Cloud has data: update local cache
                console.log('☁️ Sincronizando dados do Firestore...');
                snapshot.forEach(doc => {
                    const key = doc.id;
                    try {
                        const cloudData = JSON.parse(doc.data().value);
                        // Only update if cloud data is different/newer (simplified here as overwrite)
                        localStorage.setItem(this.PREFIX + key, JSON.stringify(cloudData));
                    } catch (e) {
                        console.warn('Sync parse error for:', key, e);
                    }
                });
                console.log(`✅ ${snapshot.size} registros sincronizados do Firestore`);
            }

            // Notifica paginas que a sincronizacao com Firestore terminou.
            // Paginas como despesas.html re-renderizam para refletir o estado
            // atual do localStorage apos o sync (evita race condition).
            // _syncDone=true permite que listeners tardios (auth > sync)
            // detectem que o sync ja correu sem precisar do evento.
            this._syncDone = true;
            window.dispatchEvent(new CustomEvent('mp_synced'));

            // Real-time listener for the catalog and global settings
            this._db.collection('datastore').doc('catalog_config').onSnapshot(doc => {
                if (doc.exists) {
                    const newData = JSON.parse(doc.data().value);
                    localStorage.setItem(this.PREFIX + 'catalog_config', doc.data().value);
                    console.log('🔄 Catálogo atualizado via Firebase (Background)');
                    // Trigger a custom event for UI updates
                    window.dispatchEvent(new CustomEvent('mp_catalog_updated', { detail: newData }));
                }
            });

        } catch (e) {
            console.warn('_syncFromCloud error:', e);
        }
    },

    _pushAllToCloud() {
        if (!this._ready || !this._db) return;
        const batch = this._db.batch();
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (fullKey.startsWith(this.PREFIX)) {
                const key = fullKey.substring(this.PREFIX.length);
                if (key === '_seeded' || key === 'session') continue;
                const ref = this._db.collection('datastore').doc(key);
                batch.set(ref, {
                    value: localStorage.getItem(fullKey),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                count++;
                // Firestore batch limit = 500
                if (count >= 490) break;
            }
        }
        if (count > 0) {
            batch.commit()
                .then(() => console.log(`☁️ ${count} registros enviados para o Firestore`))
                .catch(err => console.error('Batch write error:', err));
        }
    },

    // ============================================
    // Real-time listeners (para pedidos)
    // ============================================
    onOrdersChange(franchiseId, callback) {
        if (!this._ready || !this._db) return null;
        const key = franchiseId ? `orders_${franchiseId}` : 'orders';
        return this._db.collection('datastore').doc(key)
            .onSnapshot(doc => {
                if (doc.exists) {
                    try {
                        const data = JSON.parse(doc.data().value);
                        localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
                        if (callback) callback(data);
                    } catch (e) {
                        console.warn('onOrdersChange parse error:', e);
                    }
                }
            }, err => console.warn('onOrdersChange error:', err));
    },

    // ============================================
    // Firestore Subcollections (Fase 2 ready)
    // Metodos async para acesso direto ao Firestore
    // usando subcollections: franchises/{id}/orders
    // ============================================
    async firestoreAddDoc(collectionPath, data) {
        if (!this._ready || !this._db) return null;
        try {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const ref = await this._db.collection(collectionPath).add(data);
            data.id = ref.id;
            return data;
        } catch (e) {
            console.error('firestoreAddDoc error:', collectionPath, e);
            return null;
        }
    },

    async firestoreGetDoc(collectionPath, docId) {
        if (!this._ready || !this._db) return null;
        try {
            const doc = await this._db.collection(collectionPath).doc(docId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (e) {
            console.error('firestoreGetDoc error:', e);
            return null;
        }
    },

    async firestoreQuery(collectionPath, filters = [], orderBy = null, limit = null) {
        if (!this._ready || !this._db) return [];
        try {
            let query = this._db.collection(collectionPath);
            filters.forEach(([field, op, value]) => {
                query = query.where(field, op, value);
            });
            if (orderBy) {
                query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
            }
            if (limit) {
                query = query.limit(limit);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('firestoreQuery error:', collectionPath, e);
            return [];
        }
    },

    async firestoreUpdateDoc(collectionPath, docId, updates) {
        if (!this._ready || !this._db) return false;
        try {
            updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await this._db.collection(collectionPath).doc(docId).update(updates);
            return true;
        } catch (e) {
            console.error('firestoreUpdateDoc error:', e);
            return false;
        }
    },

    async firestoreDeleteDoc(collectionPath, docId) {
        if (!this._ready || !this._db) return false;
        try {
            await this._db.collection(collectionPath).doc(docId).delete();
            return true;
        } catch (e) {
            console.error('firestoreDeleteDoc error:', e);
            return false;
        }
    },

    // Real-time listener generico para subcollections
    firestoreListen(collectionPath, callback, filters = []) {
        if (!this._ready || !this._db) return null;
        let query = this._db.collection(collectionPath);
        filters.forEach(([field, op, value]) => {
            query = query.where(field, op, value);
        });
        return query.onSnapshot(snapshot => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(docs);
        }, err => console.warn('firestoreListen error:', collectionPath, err));
    },

    // Helper: path para subcollection de franquia
    franchisePath(franchiseId, subcollection) {
        return `franchises/${franchiseId}/${subcollection}`;
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
        // Also push to Firestore
        this._pushAllToCloud();
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
    // SEED - Dados iniciais para demonstracao
    // ============================================
    seed() {
        if (this.get('_seeded')) return;

        // ---- Usuarios (SEM senhas - autenticacao via Firebase Auth) ----
        const users = [
            {
                id: 'admin1',
                email: 'admin@milkypot.com',
                role: 'super_admin',
                name: 'Admin MilkyPot',
                franchiseId: null,
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'franq1',
                email: 'milkypot.com@gmail.com',
                role: 'franchisee',
                name: 'JOCIMAR RODRIGO MAGALHAES SERRA',
                franchiseId: 'muffato-quintino',
                createdAt: '2024-06-01T00:00:00Z'
            }
        ];
        this.set('users', users);

        // ---- Franquias (apenas unidades reais; fonte de verdade: Firestore via admin) ----
        const franchises = [
            {
                id: 'muffato-quintino',
                slug: 'muffato-quintino',
                name: 'MilkyPot Muffato Quintino',
                address: 'Quintino, Londrina - PR',
                city: 'Londrina',
                state: 'PR',
                owner: 'JOCIMAR RODRIGO MAGALHAES SERRA',
                email: 'milkypot.com@gmail.com',
                phone: '(43) 99804-2424',
                whatsapp: '5543998042424',
                rating: 5,
                deliveryTime: '25-40 min',
                deliveryFee: 5.90,
                hours: '10:00 - 22:00',
                type: 'store',
                status: 'ativo',
                tipoOperacao: 'loja',
                setupCompleto: true,
                territorio: { cidade: 'Londrina', bairro: 'Quintino', raioEntrega: 5, status: 'ativo' },
                monthlyFee: 100,
                createdAt: '2024-06-01T00:00:00Z',
                lat: -23.3265, lng: -51.1664
            }
        ];
        // Add metadata to existing ones
        franchises.forEach(f => {
            if (!f.tipoOperacao) f.tipoOperacao = 'loja';
            if (f.setupCompleto === undefined) f.setupCompleto = true;
            if (!f.territorio) {
                f.territorio = { cidade: f.city || '', bairro: '', raioEntrega: 3, status: 'ativo' };
            }
        });
        this.set('franchises', franchises);

        // ---- Pedidos demo para cada franquia ----
        const sabores = ['Ninho', 'Morango', 'Ninho com Morango', 'Nutella', 'Oreo', 'Acai + Granola', 'Banana + Whey'];
        const nomes = ['Ana', 'Carlos', 'Julia', 'Pedro', 'Maria', 'Lucas', 'Lara', 'Bruno', 'Sofia', 'Mateus'];
        const statuses = ['entregue', 'entregue', 'entregue', 'pronto', 'preparando', 'novo'];

        franchises.forEach(f => {
            const orders = [];
            const numOrders = Math.floor(Math.random() * 20) + 30;
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

            // ---- Financas demo ----
            const finances = [];
            for (let d = 29; d >= 0; d--) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                const dateStr = date.toISOString().split('T')[0];

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

            // ---- Inventario demo ----
            const inventory = [
                { id: `inv_${f.id}_1`, name: 'Leite Ninho', category: 'ingredientes', quantity: Math.floor(Math.random() * 50) + 10, unit: 'kg', minStock: 15 },
                { id: `inv_${f.id}_2`, name: 'Morango', category: 'frutas', quantity: Math.floor(Math.random() * 30) + 5, unit: 'kg', minStock: 10 },
                { id: `inv_${f.id}_3`, name: 'Nutella', category: 'ingredientes', quantity: Math.floor(Math.random() * 20) + 3, unit: 'kg', minStock: 8 },
                { id: `inv_${f.id}_4`, name: 'Oreo', category: 'ingredientes', quantity: Math.floor(Math.random() * 40) + 5, unit: 'pct', minStock: 10 },
                { id: `inv_${f.id}_5`, name: 'Acai', category: 'ingredientes', quantity: Math.floor(Math.random() * 30) + 5, unit: 'litro', minStock: 12 },
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

// Garante acesso global (IIFE-less const é escopo de script em browser;
// publicar como window.DataStore evita "undefined" em testes e módulos externos)
if (typeof window !== 'undefined') window.DataStore = DataStore;
if (typeof globalThis !== 'undefined') globalThis.DataStore = DataStore;
