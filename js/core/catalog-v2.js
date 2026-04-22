/* ============================================================
   MilkyPot Catalog v2 — Schema + CRUD
   ============================================================
   Arquitetura de cadastro avançada:

   catalog_v2_{fid} = {
     categorias: [
       { id, name, icon, color, order, active }
     ],
     produtos: [
       { id, categoriaId, name, desc,
         midia: { fotos:[], video, emoji },
         custos: {
           insumos: [{ insumoId, qty, unit }],       // consumo da receita
           custoInsumos: auto,                         // soma insumos (calculado)
           custoAdicional: { embalagem, energia, mao_obra, outros },
           custoTotal: auto                            // insumos + adicional
         },
         precos: {
           loja:     { recomendado: auto, real: user },
           delivery: { recomendado: auto, real: user },
           ifood:    { recomendado: auto, real: user }
         },
         kits: [
           { label: "1 unid", qty: 1, precoLoja, precoDelivery, precoIfood },
           ...
         ],
         variantes: [
           { id, name, tipo: "unidade"|"kg"|"balde"|"pote", gramas,
             custoExtra, precoLoja, precoDelivery, precoIfood }
         ],
         toppingsIds: [],           // toppings que pode adicionar
         buffet: {
           ativo: bool, precoPorKg, toppingsInclusos: []
         },
         canal: "ambos"|"loja"|"delivery",
         active: true
       }
     ],
     toppings: [
       { id, name, custo, precoExtra, categoria:"topping", active }
     ]
   }
   ============================================================ */
(function(global){
    'use strict';

    // ==========================================================
    // Categorias padrão MilkyPot
    // ==========================================================
    const CATEGORIAS_SEED = [
        { id: 'cat_milkshake',  name: 'Milkshakes',       icon: '🥤', color: '#FF4F8A', order: 1 },
        { id: 'cat_potinho',    name: 'Potinhos (monte o seu)', icon: '🍨', color: '#7E57C2', order: 2 },
        { id: 'cat_acai',       name: 'Açaí Bowls',       icon: '🍇', color: '#5E35B1', order: 3 },
        { id: 'cat_sundae',     name: 'Sundaes',          icon: '🍦', color: '#EC407A', order: 4 },
        { id: 'cat_picole',     name: 'Picolés',          icon: '🍡', color: '#42A5F5', order: 5 },
        { id: 'cat_sorvete_kg', name: 'Sorvete por Kg',   icon: '⚖️', color: '#FB8C00', order: 6 },
        { id: 'cat_buffet',     name: 'Buffet / Self-Service', icon: '🍽️', color: '#66BB6A', order: 7 },
        { id: 'cat_bebida',     name: 'Bebidas',          icon: '🧃', color: '#29B6F6', order: 8 },
        { id: 'cat_topping',    name: 'Toppings / Adicionais', icon: '✨', color: '#FFB300', order: 9 }
    ];

    // ==========================================================
    // Storage
    // ==========================================================
    function key(fid) { return 'catalog_v2_' + fid; }

    function load(fid) {
        if (!fid) return _empty();
        const data = (global.DataStore && DataStore.get(key(fid))) || null;
        if (!data) return _empty();
        return _ensureShape(data);
    }

    function save(fid, data) {
        if (!fid || !global.DataStore) return false;
        DataStore.set(key(fid), _ensureShape(data));
        return true;
    }

    function _empty() {
        return {
            categorias: CATEGORIAS_SEED.map(c => Object.assign({ active: true }, c)),
            produtos: [],
            toppings: []
        };
    }

    function _ensureShape(d) {
        d = d || {};
        if (!Array.isArray(d.categorias) || !d.categorias.length) d.categorias = CATEGORIAS_SEED.slice();
        if (!Array.isArray(d.produtos)) d.produtos = [];
        if (!Array.isArray(d.toppings)) d.toppings = [];
        return d;
    }

    // ==========================================================
    // ID generator
    // ==========================================================
    function newId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    }

    // ==========================================================
    // CATEGORIAS
    // ==========================================================
    function listCategorias(fid) {
        return load(fid).categorias.filter(c => c.active !== false).sort((a,b) => (a.order||99) - (b.order||99));
    }

    function saveCategoria(fid, cat) {
        const d = load(fid);
        if (!cat.id) cat.id = newId('cat');
        const idx = d.categorias.findIndex(c => c.id === cat.id);
        if (idx >= 0) d.categorias[idx] = Object.assign(d.categorias[idx], cat);
        else d.categorias.push(Object.assign({ active: true, order: d.categorias.length + 1 }, cat));
        save(fid, d);
        return cat;
    }

    function deleteCategoria(fid, id) {
        const d = load(fid);
        const cat = d.categorias.find(c => c.id === id);
        if (!cat) return false;
        // Se tem produtos, apenas desativa
        if (d.produtos.some(p => p.categoriaId === id)) {
            cat.active = false;
            save(fid, d);
            return { softDelete: true };
        }
        d.categorias = d.categorias.filter(c => c.id !== id);
        save(fid, d);
        return { hardDelete: true };
    }

    // ==========================================================
    // PRODUTOS
    // ==========================================================
    function listProdutos(fid, filters) {
        let list = load(fid).produtos;
        if (filters && filters.categoriaId) list = list.filter(p => p.categoriaId === filters.categoriaId);
        if (filters && filters.active != null) list = list.filter(p => !!p.active === !!filters.active);
        return list;
    }

    function getProduto(fid, id) {
        return load(fid).produtos.find(p => p.id === id);
    }

    function saveProduto(fid, p) {
        const d = load(fid);
        p = _ensureProdutoShape(p);
        if (!p.id) p.id = newId('prod');
        if (!p.createdAt) p.createdAt = new Date().toISOString();
        p.updatedAt = new Date().toISOString();

        const idx = d.produtos.findIndex(x => x.id === p.id);
        if (idx >= 0) d.produtos[idx] = p;
        else d.produtos.push(p);
        save(fid, d);
        return p;
    }

    function deleteProduto(fid, id) {
        const d = load(fid);
        d.produtos = d.produtos.filter(p => p.id !== id);
        save(fid, d);
        return true;
    }

    function _ensureProdutoShape(p) {
        p = p || {};
        p.name = p.name || '';
        p.desc = p.desc || '';
        p.categoriaId = p.categoriaId || '';
        p.midia = p.midia || { fotos: [], video: '', emoji: '' };
        if (!Array.isArray(p.midia.fotos)) p.midia.fotos = [];
        p.custos = p.custos || {};
        p.custos.insumos = Array.isArray(p.custos.insumos) ? p.custos.insumos : [];
        p.custos.custoInsumos = Number(p.custos.custoInsumos) || 0;
        p.custos.custoAdicional = p.custos.custoAdicional || { embalagem:0, energia:0, mao_obra:0, outros:0 };
        p.custos.custoTotal = Number(p.custos.custoTotal) || 0;
        p.precos = p.precos || {};
        ['loja','delivery','ifood'].forEach(ch => {
            p.precos[ch] = p.precos[ch] || { recomendado: 0, real: 0 };
        });
        p.kits = Array.isArray(p.kits) ? p.kits : [];
        p.variantes = Array.isArray(p.variantes) ? p.variantes : [];
        p.toppingsIds = Array.isArray(p.toppingsIds) ? p.toppingsIds : [];
        p.buffet = p.buffet || { ativo: false, precoPorKg: 0, toppingsInclusos: [] };
        p.canal = p.canal || 'ambos';
        if (p.active == null) p.active = true;
        return p;
    }

    // ==========================================================
    // TOPPINGS (globais)
    // ==========================================================
    function listToppings(fid) {
        return load(fid).toppings.filter(t => t.active !== false);
    }

    function saveTopping(fid, t) {
        const d = load(fid);
        if (!t.id) t.id = newId('top');
        if (t.active == null) t.active = true;
        const idx = d.toppings.findIndex(x => x.id === t.id);
        if (idx >= 0) d.toppings[idx] = Object.assign(d.toppings[idx], t);
        else d.toppings.push(t);
        save(fid, d);
        return t;
    }

    function deleteTopping(fid, id) {
        const d = load(fid);
        d.toppings = d.toppings.filter(t => t.id !== id);
        // Remove de produtos também
        d.produtos.forEach(p => {
            p.toppingsIds = (p.toppingsIds || []).filter(tid => tid !== id);
        });
        save(fid, d);
        return true;
    }

    // ==========================================================
    // Seed de produtos MilkyPot (opcional)
    // ==========================================================
    function seedMilkyPot(fid) {
        const d = load(fid);
        if (d.produtos.length) return { skipped: true, reason: 'já tem produtos' };

        // Toppings base
        const topSeed = [
            { name: 'Granola',       custo: 0.80, precoExtra: 2.50 },
            { name: 'Morango fresco', custo: 1.20, precoExtra: 3.50 },
            { name: 'Nutella',       custo: 1.50, precoExtra: 4.00 },
            { name: 'Paçoca',        custo: 0.40, precoExtra: 2.00 },
            { name: 'Oreo',          custo: 0.60, precoExtra: 2.50 },
            { name: 'Chantilly',     custo: 0.50, precoExtra: 2.00 },
            { name: 'Leite Ninho em pó', custo: 0.90, precoExtra: 3.00 },
            { name: 'Brigadeiro',    custo: 0.70, precoExtra: 3.00 },
            { name: 'Calda chocolate', custo: 0.30, precoExtra: 1.50 },
            { name: 'Calda morango', custo: 0.30, precoExtra: 1.50 }
        ];
        d.toppings = topSeed.map(t => Object.assign({ id: newId('top'), active: true }, t));

        // Produtos-exemplo por categoria
        const prodSeed = [
            { cat: 'cat_milkshake', name: 'Milkshake Ninho com Morango', emoji:'🥤', cInsumos:4.80, cAdd:1.20 },
            { cat: 'cat_milkshake', name: 'Milkshake Nutella',            emoji:'🥤', cInsumos:5.50, cAdd:1.20 },
            { cat: 'cat_potinho',   name: 'Potinho 180ml',                emoji:'🍨', cInsumos:2.80, cAdd:0.70 },
            { cat: 'cat_potinho',   name: 'Potinho 300ml',                emoji:'🍨', cInsumos:4.20, cAdd:0.90 },
            { cat: 'cat_potinho',   name: 'Potinho 500ml',                emoji:'🍨', cInsumos:6.50, cAdd:1.10 },
            { cat: 'cat_acai',      name: 'Açaí Bowl 300ml',              emoji:'🍇', cInsumos:7.20, cAdd:1.30 },
            { cat: 'cat_acai',      name: 'Açaí Bowl 500ml',              emoji:'🍇', cInsumos:11.50, cAdd:1.50 },
            { cat: 'cat_sundae',    name: 'Sundae Clássico',              emoji:'🍦', cInsumos:3.90, cAdd:0.80 },
            { cat: 'cat_picole',    name: 'Picolé Ninho com Morango',     emoji:'🍡', cInsumos:2.10, cAdd:0.40 },
            { cat: 'cat_picole',    name: 'Picolé Nutella',               emoji:'🍡', cInsumos:2.50, cAdd:0.40 },
            { cat: 'cat_sorvete_kg', name: 'Sorvete por Kg (varietes)',   emoji:'⚖️', cInsumos:0, cAdd:0 },
            { cat: 'cat_buffet',    name: 'Buffet a Granel',              emoji:'🍽️', cInsumos:0, cAdd:0 }
        ];

        const allTopIds = d.toppings.map(t => t.id);
        d.produtos = prodSeed.map(s => ({
            id: newId('prod'),
            categoriaId: s.cat,
            name: s.name,
            desc: '',
            midia: { fotos: [], video: '', emoji: s.emoji },
            custos: {
                insumos: [],
                custoInsumos: s.cInsumos,
                custoAdicional: { embalagem: s.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                custoTotal: s.cInsumos + s.cAdd
            },
            precos: { loja:{recomendado:0,real:0}, delivery:{recomendado:0,real:0}, ifood:{recomendado:0,real:0} },
            kits: s.cat === 'cat_picole' ? [
                { label:'1 unidade',  qty:1,  precoLoja:0, precoDelivery:0, precoIfood:0 },
                { label:'3 unidades', qty:3,  precoLoja:0, precoDelivery:0, precoIfood:0 },
                { label:'10 unidades',qty:10, precoLoja:0, precoDelivery:0, precoIfood:0 },
                { label:'20 unidades',qty:20, precoLoja:0, precoDelivery:0, precoIfood:0 }
            ] : [],
            variantes: s.cat === 'cat_sorvete_kg' ? [
                { id: newId('var'), name: '250g (pote pequeno)', tipo:'pote', gramas:250, custoExtra:0, precoLoja:0, precoDelivery:0, precoIfood:0 },
                { id: newId('var'), name: '500g (pote médio)',   tipo:'pote', gramas:500, custoExtra:0, precoLoja:0, precoDelivery:0, precoIfood:0 },
                { id: newId('var'), name: '1kg (balde pequeno)', tipo:'balde', gramas:1000, custoExtra:0, precoLoja:0, precoDelivery:0, precoIfood:0 },
                { id: newId('var'), name: '5kg (balde grande)',  tipo:'balde', gramas:5000, custoExtra:0, precoLoja:0, precoDelivery:0, precoIfood:0 }
            ] : [],
            toppingsIds: ['cat_potinho','cat_sundae','cat_acai','cat_milkshake'].includes(s.cat) ? allTopIds : [],
            buffet: s.cat === 'cat_buffet' ? { ativo:true, precoPorKg:89.90, toppingsInclusos: allTopIds } : { ativo:false, precoPorKg:0, toppingsInclusos:[] },
            canal: 'ambos',
            active: true,
            createdAt: new Date().toISOString()
        }));

        save(fid, d);
        return { seeded: true, produtos: d.produtos.length, toppings: d.toppings.length };
    }

    // ==========================================================
    // BRIDGE: sincroniza catalog_v2 pro catalog_config (legado) que o
    // PDV atual lê. Chamado automaticamente ao salvar qualquer produto.
    // O PDV segue funcionando sem mexer no código dele.
    // ==========================================================
    function syncToLegacy(fid) {
        if (!global.DataStore) return;
        const d = load(fid);
        const cats = d.categorias.filter(c => c.active !== false);
        const legacy = global.DataStore.get('catalog_config') || {};

        // Sabores: categorias que são consumíveis (não toppings/bebidas)
        legacy.sabores = legacy.sabores || {};

        cats.forEach(cat => {
            const prods = d.produtos.filter(p =>
                p.categoriaId === cat.id && p.active !== false &&
                ['cat_potinho','cat_milkshake','cat_acai','cat_sundae','cat_picole'].includes(cat.id)
            );
            if (!prods.length) return;
            const legacyKey = cat.id.replace('cat_', '');
            legacy.sabores[legacyKey] = legacy.sabores[legacyKey] || { name: cat.name, items: [] };
            legacy.sabores[legacyKey].name = cat.name;
            legacy.sabores[legacyKey].items = prods.map(p => ({
                id: p.id,
                name: p.name,
                emoji: p.midia?.emoji || cat.icon || '🍨',
                desc: p.desc || '',
                price: Number(p.precos?.loja?.real || p.precos?.loja?.recomendado || 0),
                cost: Number(p.custos?.custoTotal || 0),
                costAdjust: 0,
                available: p.active !== false,
                tipoVenda: 'unitario',
                canalVenda: p.canal || 'ambos',
                modoMontagem: 'montado',
                commissionRate: 5,
                // Preserva receita caso tenha (permite dedução de estoque)
                receita: (p.custos?.insumos || []).filter(r => r.insumoId && r.qty)
                                                   .map(r => ({ insumoId: r.insumoId, qty: r.qty, unit: r.unit || 'unid' })),
                // Campos v2 pra PDV avançado consumir
                _v2: {
                    precos: p.precos,
                    kits: p.kits,
                    variantes: p.variantes,
                    toppingsIds: p.toppingsIds
                }
            }));
        });

        // Bebidas (array plano)
        const bebidas = d.produtos.filter(p => p.categoriaId === 'cat_bebida' && p.active !== false);
        if (bebidas.length) {
            legacy.bebidas = bebidas.map(p => ({
                id: p.id, name: p.name, emoji: p.midia?.emoji || '🧃',
                price: Number(p.precos?.loja?.real || 0),
                cost: Number(p.custos?.custoTotal || 0),
                available: true
            }));
        }

        // Adicionais (toppings)
        if (d.toppings.length) {
            legacy.adicionais = legacy.adicionais || {};
            legacy.adicionais.geral = {
                name: 'Toppings',
                items: d.toppings.filter(t => t.active !== false).map(t => ({
                    id: t.id, name: t.name, emoji: '✨',
                    price: Number(t.precoExtra || 0),
                    cost: Number(t.custo || 0),
                    available: true,
                    commissionRate: 5
                }))
            };
        }

        global.DataStore.set('catalog_config', legacy);
        return legacy;
    }

    // Wrap os saves pra sincronizar legacy automaticamente
    const _origSaveProduto = saveProduto;
    function saveProdutoAndSync(fid, p) {
        const res = _origSaveProduto(fid, p);
        try { syncToLegacy(fid); } catch(e) { console.warn('sync legacy', e); }
        return res;
    }

    const _origSaveTopping = saveTopping;
    function saveToppingAndSync(fid, t) {
        const res = _origSaveTopping(fid, t);
        try { syncToLegacy(fid); } catch(e) {}
        return res;
    }

    const _origSeed = seedMilkyPot;
    function seedMilkyPotAndSync(fid) {
        const res = _origSeed(fid);
        try { syncToLegacy(fid); } catch(e) {}
        return res;
    }

    // Auto-sync ao load (garante PDV sempre atualizado)
    function autoSyncIfNeeded(fid) {
        try {
            const d = load(fid);
            if (d.produtos.length > 0) syncToLegacy(fid);
        } catch(e){}
    }

    global.CatalogV2 = {
        load, save,
        listCategorias, saveCategoria, deleteCategoria,
        listProdutos, getProduto,
        saveProduto: saveProdutoAndSync,
        deleteProduto,
        listToppings,
        saveTopping: saveToppingAndSync,
        deleteTopping,
        seedMilkyPot: seedMilkyPotAndSync,
        syncToLegacy,
        autoSyncIfNeeded,
        newId,
        CATEGORIAS_SEED
    };

    // Auto-sync leve quando a página carrega (se tiver sessão)
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            try {
                const s = global.Auth && global.Auth.getSession && global.Auth.getSession();
                if (s && s.franchiseId) autoSyncIfNeeded(s.franchiseId);
            } catch(e){}
        }, 2500);
    }
})(typeof window !== 'undefined' ? window : this);
