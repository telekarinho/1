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
                // Watcher de Firebase Auth — detecta mp_session ÓRFÃ (sem user no Firebase)
                this._setupAuthWatcher();
            } else {
                console.warn('⚠️ DataStore: Firestore nao disponivel, usando localStorage apenas');
            }
        } catch (e) {
            console.error('DataStore.init error:', e);
        }
    },

    // Auth watcher — apenas tenta self-heal silencioso quando Firebase Auth some.
    // NÃO mostra banner pro user: rules de orders_/caixa_/pdv_tabs_/finances_ são
    // públicas (allow read: true), então sync de leitura funciona SEM auth.
    // Self-heal anonymous = bonus pra writes funcionarem em PCs sem login completo.
    _setupAuthWatcher() {
        try {
            if (!firebase || !firebase.auth) return;
            var self = this;
            firebase.auth().onAuthStateChanged(async function (user) {
                self._firebaseUser = user;
                var hasMpSession = !!localStorage.getItem('mp_session');
                if (hasMpSession && !user) {
                    // Tenta anon auth silencioso pra liberar writes. Se falhar,
                    // não mostra banner — reads públicos cobrem o caso de sync.
                    await self._attemptAnonymousAuth();
                } else if (user) {
                    self._flushPendingWrites();
                    self._syncFromCloud();
                }
            });
        } catch (e) {
            console.warn('_setupAuthWatcher error:', e);
        }
    },

    // Self-heal: signInAnonymously cria user Firebase válido SEM credenciais.
    // Anon user satisfaz isAuthenticated() nas rules → sync passa a funcionar.
    // Não cobre rules que checam .uid específico, mas pra collection 'datastore' rola.
    async _attemptAnonymousAuth() {
        if (!firebase || !firebase.auth) return false;
        // Evita loop: tenta no máximo 1 vez por sessão
        if (this._anonAuthAttempted) return false;
        this._anonAuthAttempted = true;
        try {
            const result = await firebase.auth().signInAnonymously();
            return !!(result && result.user);
        } catch (e) {
            console.warn('signInAnonymously falhou:', e.code, e.message);
            return false;
        }
    },

    // ============================================
    // CRUD Basico (sincrono via localStorage)
    // ============================================
    get(key) {
        try {
            // FIX (Fase 8.3): catalog_config tem versão per-franchise pra
            // evitar race condition entre franquias. Prefere catalog_config_<fid>
            // quando existe e marcado _fromV2 (autoritativo). Fallback global.
            if (key === 'catalog_config') {
                try {
                    let fid = null;
                    const raw = localStorage.getItem('mp_session');
                    if (raw) fid = (JSON.parse(raw) || {}).franchiseId;
                    if (fid) {
                        const perFidRaw = localStorage.getItem(this.PREFIX + 'catalog_config_' + fid);
                        if (perFidRaw) {
                            const perFid = JSON.parse(perFidRaw);
                            if (perFid && perFid._fromV2 && perFid.sabores) return perFid;
                        }
                    }
                } catch (_) { /* fallback abaixo */ }
            }
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
            // Stamp local timestamp para keys que usam last-writer-wins (ex: inventory_)
            // Permite que sync subsequente respeite versão local recém-escrita.
            if (this._isLocalTimestampedKey(key)) {
                localStorage.setItem(this.PREFIX + key + '__local_ts', String(Date.now()));
            }
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
    // Keys que precisam de merge (arrays compartilhadas entre PCs).
    // Sem merge: cada PC sobrescreve o array INTEIRO → race condition fatal,
    // PC com menos itens locais apaga itens do outro PC do cloud.
    _isMergeable(key) {
        // inventory_ NÃO é mergeable: cada deduct é state replacement.
        // Merge por id+timestamp falhava porque deduct mantém createdAt original
        // → cloud sempre vencia local recém-deduzido. Resultado: estoque revertia.
        // Last-writer-wins via _localFresherThanCloud() abaixo.
        return /^(orders_|caixa_|pdv_tabs_|finances_|recurring_expenses_|price_changes_log_|purchase_orders_log_)/.test(key || '');
    },

    /**
     * Checa se a versão local de uma key tem timestamp mais novo que a cloud.
     * Usado por inventory_ pra evitar que sync sobrescreva venda recém-feita.
     * Retorna true se local deve ser PRESERVADO (e empurrado pra cloud).
     */
    _localFresherThanCloud(key, cloudDoc) {
        try {
            const localTsStr = localStorage.getItem(this.PREFIX + key + '__local_ts');
            if (!localTsStr) return false;
            const localTs = parseInt(localTsStr, 10);
            if (!Number.isFinite(localTs)) return false;
            if (!cloudDoc || !cloudDoc.exists) return true; // local existe, cloud não → local wins
            const cloudUpdatedAt = cloudDoc.data().updatedAt;
            const cloudMs = (cloudUpdatedAt && cloudUpdatedAt.toMillis)
                ? cloudUpdatedAt.toMillis() : 0;
            return localTs > cloudMs;
        } catch (e) { return false; }
    },

    /** Keys que usam protocolo last-writer-wins com timestamp local */
    _isLocalTimestampedKey(key) {
        return /^inventory_/.test(key || '');
    },
    // Merge inteligente: une dois arrays por id, prefere o mais recente
    // (updatedAt > createdAt). Idempotente — pode rodar várias vezes sem efeito ruim.
    _itemMutationTime(item) {
        if (!item) return 0;
        function t(value) {
            const ms = value ? new Date(value).getTime() : 0;
            return Number.isFinite(ms) ? ms : 0;
        }
        return Math.max(
            t(item.updatedAt),
            t(item.deletedAt),
            t(item.cancelledAt),
            t(item.finalizedAt)
        );
    },

    _itemVersionTime(item) {
        if (!item) return 0;
        const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        return Math.max(
            this._itemMutationTime(item),
            Number.isFinite(created) ? created : 0
        );
    },

    _pickNewestItem(a, b) {
        if (!a) return b;
        if (!b) return a;

        const aMutation = this._itemMutationTime(a);
        const bMutation = this._itemMutationTime(b);
        const aDeleted = !!a.deleted;
        const bDeleted = !!b.deleted;
        if (aDeleted !== bDeleted) {
            if (aDeleted && aMutation >= bMutation) return a;
            if (bDeleted && bMutation >= aMutation) return b;
        }

        if (aMutation || bMutation) {
            return aMutation >= bMutation ? a : b;
        }

        return this._itemVersionTime(a) >= this._itemVersionTime(b) ? a : b;
    },

    _mergeArrays(localArr, cloudArr) {
        if (!Array.isArray(localArr)) localArr = [];
        if (!Array.isArray(cloudArr)) cloudArr = [];
        var byId = {};
        var self = this;
        cloudArr.forEach(function (it) { if (it && it.id) byId[it.id] = it; });
        localArr.forEach(function (it) {
            if (!it || !it.id) return;
            byId[it.id] = byId[it.id] ? self._pickNewestItem(byId[it.id], it) : it;
        });
        return Object.keys(byId).map(function (k) { return byId[k]; });
    },
    async _writeToCloud(key, data) {
        if (!this._ready || !this._db) {
            this._pendingWrites.push({ action: 'set', key, data });
            return;
        }
        try {
            // Para keys mergeable (orders_, caixa_, finances_, pdv_tabs_) — lê cloud
            // primeiro, mescla com local pelo id, e escreve a união. Evita perda de
            // dados quando 2+ PCs escrevem em paralelo. Não-mergeables: write direto.
            var finalData = data;
            if (this._isMergeable(key) && Array.isArray(data)) {
                try {
                    var snap = await this._db.collection('datastore').doc(key).get();
                    if (snap.exists) {
                        var cloudArr = JSON.parse(snap.data().value || '[]');
                        finalData = this._mergeArrays(data, cloudArr);
                        // Atualiza localStorage com a versão mesclada (não dispara
                        // _writeToCloud de novo pra evitar loop — set direto)
                        try { localStorage.setItem(this.PREFIX + key, JSON.stringify(finalData)); } catch (e) {}
                        if (finalData.length !== data.length) {
                            console.log('🔀 Merge ' + key + ': local=' + data.length + ' + cloud=' + cloudArr.length + ' = ' + finalData.length);
                        }
                    }
                } catch (mergeErr) {
                    console.warn('Merge falhou (escrevendo local):', key, mergeErr.message);
                }
            }
            // Store as a document in 'datastore' collection
            this._db.collection('datastore').doc(key).set({
                value: JSON.stringify(finalData),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(async err => {
                console.warn('Firestore write error:', key, err.code || err.message);
                this._pendingWrites.push({ action: 'set', key, data });
                if (err && (err.code === 'permission-denied' || err.code === 'unauthenticated')) {
                    const healed = await this._attemptAnonymousAuth();
                    if (healed) this._flushPendingWrites();
                }
            });
        } catch (e) {
            console.warn('_writeToCloud error:', e);
            this._pendingWrites.push({ action: 'set', key, data });
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

    _isMergeableListDoc(docId) {
        // Arrays compartilhadas entre PCs — sem merge dá race condition fatal.
        // PCs com listas locais diferentes sobrescrevem o array do outro.
        // inventory_ EXCEPTION: usa last-writer-wins via _localFresherThanCloud
        // (deduct não atualiza createdAt → merge sempre escolhia cloud antigo).
        return !!docId && (
            docId.startsWith('orders_') ||
            docId.startsWith('pdv_tabs_') ||
            docId.startsWith('caixa_') ||
            docId.startsWith('finances_') ||
            docId.startsWith('recurring_expenses_') ||
            docId.startsWith('price_changes_log_') ||
            docId.startsWith('purchase_orders_log_')
            // inventory_ removido: tratado via last-writer-wins
        );
    },

    _mergeListDoc(docId, cloudStr) {
        if (!this._isMergeableListDoc(docId)) return { value: cloudStr, changed: false };
        try {
            const localStr = localStorage.getItem(this.PREFIX + docId);
            const cloudItems = cloudStr ? JSON.parse(cloudStr) : [];
            const localItems = localStr ? JSON.parse(localStr) : [];
            if (!Array.isArray(cloudItems) || !Array.isArray(localItems)) {
                return { value: cloudStr, changed: false };
            }
            const byId = {};
            const self = this;
            cloudItems.concat(localItems).forEach(item => {
                if (!item || !item.id) return;
                const prev = byId[item.id];
                byId[item.id] = prev ? self._pickNewestItem(prev, item) : item;
            });
            const merged = Object.values(byId).sort((a, b) => {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            });
            const mergedStr = JSON.stringify(merged);
            return { value: mergedStr, changed: mergedStr !== cloudStr };
        } catch (e) {
            console.warn('merge ' + docId + ' ignorado:', e.message || e);
            return { value: cloudStr, changed: false };
        }
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

    // Lista de docs públicos por franquia — sync funciona SEM auth via per-doc gets
    // (collection.get() exige rule de LIST que não temos pra unauth).
    _publicSyncDocs() {
        // Nao use Auth.getSession() aqui: se a sessao local estiver expirada,
        // getSession pode redirecionar a tela. Sync publico precisa ser
        // side-effect-free para nao derrubar o operador no PDV.
        var fid = null;
        try {
            if (typeof Auth !== 'undefined' && Auth.getSessionRaw) {
                fid = (Auth.getSessionRaw() || {}).franchiseId;
            } else {
                var raw = localStorage.getItem('mp_session');
                fid = raw ? (JSON.parse(raw) || {}).franchiseId : null;
            }
        } catch (_) {}
        // Fallback: super_admin acessando painel via ?fid= (não tem franchiseId na sessão)
        if (!fid) {
            try { fid = new URLSearchParams(location.search).get('fid'); } catch (_) {}
        }
        if (!fid) return [];
        return [
            'catalog_config',
            'catalog_config_' + fid,
            'catalog_v2_' + fid,
            'orders_' + fid,
            'caixa_' + fid,
            'pdv_tabs_' + fid,
            'finances_' + fid,
            'recurring_expenses_' + fid,
            'inventory_' + fid,
            'staff_' + fid
        ];
    },

    async _syncFromCloud() {
        if (!this._ready || !this._db) return;

        // CRÍTICO: anexa listeners e poll ANTES dos awaits do sync inicial.
        // Se um await travar (rede lenta, Firestore offline, etc), os listeners
        // ainda assim ficam ativos e o sync acontece via realtime/poll quando
        // a rede normalizar. Isolation total das duas fases.
        this._setupListenersAndPoll();

        try {
            // Priority 1: Check for catalog_config specifically for seeding (timeout 5s)
            try {
                const catalogDoc = await Promise.race([
                    this._db.collection('datastore').doc('catalog_config').get(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 5s')), 5000))
                ]);
                if (catalogDoc.exists) {
                    const value = catalogDoc.data().value;
                    if (typeof value === 'string') {
                        localStorage.setItem(this.PREFIX + 'catalog_config', value);
                        try {
                            window.dispatchEvent(new CustomEvent('mp_catalog_updated', { detail: JSON.parse(value) }));
                        } catch (_) {}
                    }
                } else if (typeof CARDAPIO_CONFIG !== 'undefined') {
                    console.log('🌱 Seed: Enviando configuração inicial do cardápio para o Firestore...');
                    this.set('catalog_config', CARDAPIO_CONFIG);
                }
            } catch (e) {
                console.warn('catalog_config sync ignorado:', e.code || e.message);
            }

            // PER-DOC reads — funciona sem auth pq cada doc tem allow read individual
            // pelas patterns orders_*, caixa_*, etc. Collection.get() exigia LIST permission.
            const docsToSync = this._publicSyncDocs();
            let synced = 0;
            for (const docId of docsToSync) {
                try {
                    const doc = await this._db.collection('datastore').doc(docId).get();
                    // last-writer-wins: pra inventory_ etc, se local tem timestamp
                    // mais novo que cloud, NÃO sobrescreve — ao contrário, push pra cloud.
                    if (this._isLocalTimestampedKey(docId) && this._localFresherThanCloud(docId, doc)) {
                        const localStr = localStorage.getItem(this.PREFIX + docId);
                        if (localStr) {
                            this._writeToCloud(docId, JSON.parse(localStr));
                            console.log('🔼 Local mais novo que cloud, push:', docId);
                        }
                        synced++;
                        continue;
                    }
                    if (doc.exists) {
                        const merged = this._mergeListDoc(docId, doc.data().value);
                        const cloudStr = merged.value;
                        localStorage.setItem(this.PREFIX + docId, cloudStr);
                        // SYNC INICIAL: se local tinha itens que o cloud não tinha (e.g. caixa
                        // aberto offline), escreve de volta. Seguro aqui porque roda 1x só
                        // por carregamento de página. Não causa loop: onSnapshot vai disparar
                        // com o mesmo conteúdo → merge produz igual → localStr===cloudStr → sem loop.
                        if (merged.changed) this._writeToCloud(docId, JSON.parse(cloudStr));
                        synced++;
                    } else if (this._isMergeableListDoc(docId) || this._isLocalTimestampedKey(docId)) {
                        const localStr = localStorage.getItem(this.PREFIX + docId);
                        if (localStr) this._writeToCloud(docId, JSON.parse(localStr));
                    }
                } catch (e) {
                    console.warn('per-doc sync error', docId, e.message);
                }
            }
            console.log(`☁️ Per-doc sync: ${synced}/${docsToSync.length} docs`);

            this._syncDone = true;
            window.dispatchEvent(new CustomEvent('mp_synced'));

        } catch (e) {
            console.warn('_syncFromCloud error:', e);
        }
    },

    // Setup listeners + poll. Idempotente. Chamado pelo _syncFromCloud BEFORE awaits
    // pra garantir que mesmo se o sync inicial travar, realtime/poll ficam ativos.
    _setupListenersAndPoll() {
        if (!this._ready || !this._db) return;
        try {
            // catalog_config listener (background)
            if (!this._catalogListenerAttached) {
                this._catalogListenerAttached = true;
                const self = this;
                const attachCatalogListener = function(docId, storageKey) {
                    self._db.collection('datastore').doc(docId).onSnapshot(doc => {
                        if (doc.exists) {
                            const value = doc.data().value;
                            if (typeof value !== 'string') return;
                            const newData = JSON.parse(value);
                            localStorage.setItem(self.PREFIX + storageKey, value);
                            console.log('🔄 Catálogo atualizado via Firebase (Background):', docId);
                            if (storageKey === 'catalog_config' || (newData && newData._fromV2)) {
                                window.dispatchEvent(new CustomEvent('mp_catalog_updated', { detail: newData }));
                            }
                        }
                    }, err => {
                        console.warn(docId + ' listener ignorado:', err.code || err.message);
                        self._catalogListenerAttached = false;
                    });
                };

                attachCatalogListener('catalog_config', 'catalog_config');
                try {
                    let fid = null;
                    if (typeof Auth !== 'undefined' && Auth.getSessionRaw) {
                        fid = (Auth.getSessionRaw() || {}).franchiseId;
                    } else {
                        const raw = localStorage.getItem('mp_session');
                        fid = raw ? (JSON.parse(raw) || {}).franchiseId : null;
                    }
                    if (fid) {
                        attachCatalogListener('catalog_config_' + fid, 'catalog_config_' + fid);
                        attachCatalogListener('catalog_v2_' + fid, 'catalog_v2_' + fid);
                    }
                } catch (_) {}
            }

            // Per-doc realtime listeners (orders/caixa/pdv_tabs/finances)
            if (!this._realtimeListenerAttached) {
                this._realtimeListenerAttached = true;
                const self = this;
                const docsToSync = this._publicSyncDocs();
                docsToSync.forEach(docId => {
                    self._db.collection('datastore').doc(docId).onSnapshot(doc => {
                        if (!doc.exists) return;
                        try {
                            // last-writer-wins: ignora updates do cloud se local é mais novo
                            if (self._isLocalTimestampedKey(docId) && self._localFresherThanCloud(docId, doc)) {
                                return; // local é fresher — não sobrescreve
                            }
                            const merged = self._mergeListDoc(docId, doc.data().value);
                            const cloudStr = merged.value;
                            const localStr = localStorage.getItem(self.PREFIX + docId);
                            if (localStr !== cloudStr) {
                                localStorage.setItem(self.PREFIX + docId, cloudStr);
                                // FIX LOOP: NÃO auto-writeback (causa loop infinito multi-PC)
                                // if (merged.changed) self._writeToCloud(docId, JSON.parse(cloudStr));
                                let parsed = null;
                                try { parsed = JSON.parse(cloudStr); } catch(_) {}
                                window.dispatchEvent(new CustomEvent('mp_remote_update', {
                                    detail: { key: docId, data: parsed }
                                }));
                                console.log('🔄 Sync remoto:', docId);
                            }
                        } catch (e) {
                            console.warn('Realtime sync error:', docId, e);
                        }
                    }, async err => {
                        console.warn('Listener err', docId, err.code || err.message);
                        // Se foi auth/permission, força refresh do token antes de reconectar.
                        // Tokens Firebase Auth expiram em 1h; auto-refresh nem sempre roda
                        // pra listeners passivos. Force getIdToken(true) renova na hora.
                        if (err && (err.code === 'permission-denied' || err.code === 'unauthenticated')) {
                            try {
                                if (firebase && firebase.auth) {
                                    var u = firebase.auth().currentUser;
                                    if (u && u.getIdToken) {
                                        await u.getIdToken(true);
                                        console.log('🔑 Token Firebase refreshed (listener recovery)');
                                    }
                                }
                            } catch (refErr) { console.warn('Token refresh falhou:', refErr.message); }
                        }
                        // Re-attach: listener morreu — reseta flag e reagenda.
                        self._realtimeListenerAttached = false;
                        setTimeout(function() {
                            try { self._setupListenersAndPoll(); } catch(e) {}
                        }, 8000);
                    });
                });
            }

            // Polling fallback (per-doc, 5s) — belt+suspenders
            if (!this._pollFallbackId) {
                const self = this;
                this._pollFallbackId = setInterval(async () => {
                    if (!self._ready || !self._db) return;
                    const docs = self._publicSyncDocs();
                    let changes = 0;
                    for (const docId of docs) {
                        try {
                            const doc = await self._db.collection('datastore').doc(docId).get();
                            if (!doc.exists) {
                                if (self._isMergeableListDoc(docId) || self._isLocalTimestampedKey(docId)) {
                                    const localStr = localStorage.getItem(self.PREFIX + docId);
                                    if (localStr) self._writeToCloud(docId, JSON.parse(localStr));
                                }
                                continue;
                            }
                            // last-writer-wins pra inventory_: poll não sobrescreve local fresher
                            if (self._isLocalTimestampedKey(docId) && self._localFresherThanCloud(docId, doc)) {
                                const localStr = localStorage.getItem(self.PREFIX + docId);
                                if (localStr) self._writeToCloud(docId, JSON.parse(localStr));
                                continue;
                            }
                            const merged = self._mergeListDoc(docId, doc.data().value);
                            const cloudStr = merged.value;
                            const localStr = localStorage.getItem(self.PREFIX + docId);
                            if (localStr !== cloudStr) {
                                localStorage.setItem(self.PREFIX + docId, cloudStr);
                                // FIX LOOP: NÃO auto-writeback (causa loop infinito multi-PC)
                                // if (merged.changed) self._writeToCloud(docId, JSON.parse(cloudStr));
                                let parsed = null;
                                try { parsed = JSON.parse(cloudStr); } catch (_) {}
                                window.dispatchEvent(new CustomEvent('mp_remote_update', {
                                    detail: { key: docId, data: parsed, source: 'poll' }
                                }));
                                changes++;
                            }
                        } catch (e) { /* ignora — próximo poll tenta */ }
                    }
                    if (changes > 0) console.log('🔁 Poll: ' + changes + ' doc(s) atualizado(s)');
                }, 10000); // 10s — fallback quando listener morrer/reconectar
            }
        } catch (e) {
            console.warn('_setupListenersAndPoll error:', e);
        }
    },

    // Manual force sync — botão "Sincronizar Agora" no UI
    // PER-DOC gets pra não depender de LIST permission da collection.
    async forceSync() {
        if (!this._ready || !this._db) {
            console.warn('forceSync: Firestore não conectado');
            return { success: false, error: 'Firestore offline', code: 'no_db' };
        }
        try {
            const docsToSync = this._publicSyncDocs();
            let changes = 0;
            let total = 0;
            for (const docId of docsToSync) {
                try {
                    const doc = await this._db.collection('datastore').doc(docId).get();
                    total++;
                    if (!doc.exists) {
                        if (this._isMergeableListDoc(docId) || this._isLocalTimestampedKey(docId)) {
                            const localStr = localStorage.getItem(this.PREFIX + docId);
                            if (localStr) this._writeToCloud(docId, JSON.parse(localStr));
                        }
                        continue;
                    }
                    // forceSync respeita local mais fresher pra last-writer-wins keys
                    if (this._isLocalTimestampedKey(docId) && this._localFresherThanCloud(docId, doc)) {
                        const localStr = localStorage.getItem(this.PREFIX + docId);
                        if (localStr) this._writeToCloud(docId, JSON.parse(localStr));
                        continue;
                    }
                    const merged = this._mergeListDoc(docId, doc.data().value);
                    const cloudStr = merged.value;
                    const localStr = localStorage.getItem(this.PREFIX + docId);
                    if (localStr !== cloudStr) {
                        localStorage.setItem(this.PREFIX + docId, cloudStr);
                        // FIX LOOP: NÃO escreve de volta no cloud por iniciativa do listener.
                        // Se merge produz resultado diferente do cloud, isso só significa que
                        // local tinha algo a mais — esse algo será propagado no próximo
                        // DataStore.set explícito do user (ordem nova, status, etc).
                        // Auto-writeback aqui causava loop infinito entre PCs (4+ writes/s).
                        // if (merged.changed) this._writeToCloud(docId, JSON.parse(cloudStr));
                        let parsed = null;
                        try { parsed = JSON.parse(cloudStr); } catch(_) {}
                        window.dispatchEvent(new CustomEvent('mp_remote_update', {
                            detail: { key: docId, data: parsed, source: 'force' }
                        }));
                        changes++;
                    }
                } catch (e) {
                    console.warn('forceSync per-doc:', docId, e.code || e.message);
                }
            }
            // Para compat com código existente que itera snap.forEach
            const snap = { size: total };
            console.log('🔄 ForceSync: ' + changes + ' doc(s) atualizado(s)');
            return { success: true, changes: changes, total: snap.size };
        } catch (e) {
            console.error('forceSync error:', e);
            // Per-doc gets protegem contra permission-denied — mensagem genérica
            return { success: false, error: e.message || 'Erro ao sincronizar', code: 'unknown' };
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
        const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : '';
        const isLocalHost = !host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
        const skipDemoSeed = !isLocalHost;

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
        if (skipDemoSeed) {
            localStorage.setItem(this.PREFIX + '_seeded', JSON.stringify(true));
            console.log('DataStore seed demo skipped on production host');
            return;
        }

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
