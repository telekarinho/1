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
            { cat: 'cat_sorvete_kg', name: 'Sorvete por Kg (variantes)',  emoji:'⚖️', cInsumos:18, cAdd:1.5 },
            { cat: 'cat_buffet',    name: 'Buffet Self-Service',          emoji:'🍽️', cInsumos:25, cAdd:1.5 }
        ];

        const allTopIds = d.toppings.map(t => t.id);
        const CC = global.CostCalculator;

        // Helper: aplica preços sugeridos pelo CostCalculator
        function precosSugeridos(custoTotal, categoriaId) {
            if (!CC || !custoTotal) {
                return { loja:{recomendado:0,real:0}, delivery:{recomendado:0,real:0}, ifood:{recomendado:0,real:0} };
            }
            const sug = CC.suggestAll(custoTotal, categoriaId);
            return {
                loja:     { recomendado: sug.loja.preco,     real: sug.loja.preco },
                delivery: { recomendado: sug.delivery.preco, real: sug.delivery.preco },
                ifood:    { recomendado: sug.ifood.preco,    real: sug.ifood.preco }
            };
        }

        d.produtos = prodSeed.map(s => {
            const custoTotal = s.cInsumos + s.cAdd;
            const precos = precosSugeridos(custoTotal, s.cat);

            // Kits de picolé — preços PROMOCIONAIS MilkyPot (hardcoded de mercado)
            // User definiu: 1→R$3 / 4→R$10 / 10→R$23 / 20→R$39,99 (LOJA)
            // Delivery = loja ×1.12 | iFood = loja ×1.28 (psychRound)
            const kits = s.cat === 'cat_picole' ? (() => {
                const tabela = [
                    { label: '1 unidade',    qty:  1, loja:  3.00, delivery:  3.50, ifood:  3.90 },
                    { label: '4 unidades',   qty:  4, loja: 10.00, delivery: 11.50, ifood: 12.90 },
                    { label: '10 unidades',  qty: 10, loja: 23.00, delivery: 25.90, ifood: 29.90 },
                    { label: '20 unidades',  qty: 20, loja: 39.99, delivery: 44.90, ifood: 49.99 }
                ];
                return tabela.map(k => ({
                    label: k.label, qty: k.qty,
                    precoLoja: k.loja,
                    precoDelivery: k.delivery,
                    precoIfood: k.ifood
                }));
            })() : [];

            // Se for picolé, sobrescreve precos unitários com o preço do kit de 1
            // (pra o PDV e tabela principal mostrarem o preço "regular")
            if (s.cat === 'cat_picole' && kits.length) {
                const k1 = kits[0];
                precos.loja     = { recomendado: k1.precoLoja,     real: k1.precoLoja };
                precos.delivery = { recomendado: k1.precoDelivery, real: k1.precoDelivery };
                precos.ifood    = { recomendado: k1.precoIfood,    real: k1.precoIfood };
            }

            // Variantes sorvete kg: custo por grama + preço por variante
            const variantes = s.cat === 'cat_sorvete_kg' && CC ? (() => {
                // Custo estimado por kg (média sorvete artesanal: R$ 18/kg)
                const custoPorKg = 18;
                const sizes = [
                    { name: '250g (pote pequeno)',  gramas: 250,  tipo:'pote' },
                    { name: '500g (pote médio)',    gramas: 500,  tipo:'pote' },
                    { name: '1kg (balde pequeno)',  gramas: 1000, tipo:'balde' },
                    { name: '5kg (balde grande)',   gramas: 5000, tipo:'balde' }
                ];
                return sizes.map(v => {
                    const custoV = (custoPorKg * v.gramas / 1000) + 1.5; // + embalagem
                    const sug = CC.suggestAll(custoV, 'cat_sorvete_kg');
                    return {
                        id: newId('var'), name: v.name, tipo: v.tipo, gramas: v.gramas,
                        custoExtra: Math.round(custoV*100)/100,
                        precoLoja: sug.loja.preco, precoDelivery: sug.delivery.preco, precoIfood: sug.ifood.preco
                    };
                });
            })() : [];

            // Buffet: preço/kg sugerido direto
            const buffet = s.cat === 'cat_buffet' ? (() => {
                // Custo médio sorvete+toppings: ~25/kg. Margem alvo buffet 70%.
                const custoKg = 25;
                const sug = CC ? CC.suggest(custoKg, 'loja', 'cat_buffet') : { preco: 89.90 };
                return { ativo: true, precoPorKg: sug.preco, toppingsInclusos: allTopIds };
            })() : { ativo:false, precoPorKg:0, toppingsInclusos:[] };

            return {
                id: newId('prod'),
                categoriaId: s.cat,
                name: s.name,
                desc: '',
                midia: { fotos: [], video: '', emoji: s.emoji },
                custos: {
                    insumos: [],
                    custoInsumos: s.cInsumos,
                    custoAdicional: { embalagem: s.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                    custoTotal: custoTotal
                },
                precos: precos,
                kits: kits,
                variantes: variantes,
                toppingsIds: ['cat_potinho','cat_sundae','cat_acai','cat_milkshake'].includes(s.cat) ? allTopIds : [],
                buffet: buffet,
                canal: 'ambos',
                active: true,
                createdAt: new Date().toISOString()
            };
        });

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

        // Quando CatalogV2 tem produtos cadastrados, ELE é a fonte de verdade.
        // Partimos de um objeto limpo — sem carregar o catalog_config antigo —
        // para que os itens do CARDAPIO_CONFIG legado (bases, clássicos, especiais,
        // adulto+18…) NÃO apareçam misturados com os produtos do novo cadastro.
        const hasProdutos = d.produtos.length > 0;
        const legacy = hasProdutos ? {} : (global.DataStore.get('catalog_config') || {});

        // Remove explicitamente seções do modelo "monta o seu" que não existem no CatalogV2
        if (hasProdutos) {
            legacy.bases = null;      // "Bases Populares" — modelo antigo de configuração
            legacy.tamanhos = null;   // tamanhos globais — cada produto v2 tem os próprios
            legacy.formatos = null;   // formatos (shake/bowl/sundae) — modelo antigo
        }

        // -------------------------------------------------------
        // Sabores: TODAS as categorias de produto (exceto bebidas
        // e toppings, que têm seções próprias no legado)
        // -------------------------------------------------------
        const EXCLUIR_SABORES = ['cat_bebida', 'cat_topping'];
        legacy.sabores = {};

        cats.forEach(cat => {
            if (EXCLUIR_SABORES.includes(cat.id)) return;
            const prods = d.produtos.filter(p =>
                p.categoriaId === cat.id && p.active !== false
            );
            if (!prods.length) return;
            const legacyKey = cat.id.replace('cat_', '');
            legacy.sabores[legacyKey] = legacy.sabores[legacyKey] || {};
            legacy.sabores[legacyKey].name = cat.name;
            legacy.sabores[legacyKey].icon = cat.icon || '';
            legacy.sabores[legacyKey].color = cat.color || '';
            legacy.sabores[legacyKey].items = prods.map(p => {
                // tipoVenda:
                //  - cat_sorvete_kg: sempre por peso
                //  - cat_buffet OU qualquer produto com buffet.ativo: por peso
                //  - produtos com variantes (balde/pote): por peso
                //  - resto: unitário
                const hasBuffet = p.buffet && p.buffet.ativo;
                const tipoVenda = (
                    cat.id === 'cat_sorvete_kg' ||
                    cat.id === 'cat_buffet' ||
                    hasBuffet ||
                    (p.variantes && p.variantes.length)
                ) ? 'por_peso' : 'unitario';

                // preço exposto ao PDV/cardápio
                //  - se buffet/por peso: preço por kg (buffet.precoPorKg tem prioridade sobre precos.loja)
                //  - se tem variantes: menor preço de variante
                //  - senão: preço loja real/recomendado
                let price = 0;
                if (hasBuffet && Number(p.buffet.precoPorKg)) {
                    price = Number(p.buffet.precoPorKg);
                } else {
                    price = Number(p.precos?.loja?.real || p.precos?.loja?.recomendado || 0);
                }
                if (!price && p.variantes?.length) {
                    price = Math.min(...p.variantes.map(v => Number(v.precoLoja || 0)).filter(v => v > 0));
                }

                // Custo por kg para produtos por peso (pro CMV ficar correto)
                // Se custoTotal é por porção, o PDV usa isso direto. Buffet: custoTotal já é estimativa por kg.
                const cost = Number(p.custos?.custoTotal || 0);

                // Porções padrão para produtos vendidos por peso (cardápio delivery mostra seletor de tamanho)
                // - buffet: porções populares (250g/350g/500g/750g/1kg)
                // - sorvete_kg: usa variantes como porções se existirem, senão padrão
                let porcoes = null;
                if (tipoVenda === 'por_peso') {
                    if (p.variantes && p.variantes.length) {
                        porcoes = p.variantes
                            .filter(v => v.gramas && Number(v.gramas) > 0)
                            .map(v => ({ label: v.name, peso: Number(v.gramas) }));
                    }
                    if (!porcoes || !porcoes.length) {
                        // Buffet/por-peso genérico
                        porcoes = [
                            { label: '250g',  peso: 250 },
                            { label: '350g',  peso: 350 },
                            { label: '500g',  peso: 500 },
                            { label: '750g',  peso: 750 },
                            { label: '1kg',   peso: 1000 }
                        ];
                    }
                }

                return {
                    id: p.id,
                    name: p.name,
                    emoji: p.midia?.emoji || cat.icon || '🍨',
                    desc: p.desc || '',
                    price: price,
                    cost: cost,
                    costAdjust: 0,
                    available: p.active !== false,
                    tipoVenda,
                    porcoes: porcoes,  // exposto pro cardápio mobile por peso
                    canalVenda: p.canal || 'ambos',
                    modoMontagem: 'montado',
                    commissionRate: 5,
                    // Receita para dedução de estoque
                    receita: (p.custos?.insumos || [])
                        .filter(r => r.insumoId && r.qty)
                        .map(r => ({ insumoId: r.insumoId, qty: r.qty, unit: r.unit || 'unid' })),
                    // Dados v2 completos para PDV avançado
                    _v2: {
                        precos: p.precos,
                        kits: p.kits,
                        variantes: p.variantes,
                        toppingsIds: p.toppingsIds,
                        buffet: p.buffet
                    }
                };
            });
        });

        // -------------------------------------------------------
        // Bebidas (array plano — mantém canal delivery/loja)
        // -------------------------------------------------------
        const bebidas = d.produtos.filter(p => p.categoriaId === 'cat_bebida' && p.active !== false);
        if (bebidas.length) {
            legacy.bebidas = bebidas.map(p => ({
                id: p.id,
                name: p.name,
                emoji: p.midia?.emoji || '🧃',
                price: Number(p.precos?.loja?.real || p.precos?.loja?.recomendado || 0),
                priceDelivery: Number(p.precos?.delivery?.real || p.precos?.delivery?.recomendado || 0),
                cost: Number(p.custos?.custoTotal || 0),
                available: p.active !== false,
                canalVenda: p.canal || 'ambos'
            }));
        }

        // -------------------------------------------------------
        // Toppings / Adicionais
        // -------------------------------------------------------
        if (d.toppings.length) {
            legacy.adicionais = legacy.adicionais || {};
            legacy.adicionais.coberturas = {
                name: 'Coberturas & Toppings',
                items: d.toppings.filter(t => t.active !== false).map(t => ({
                    id: t.id, name: t.name, emoji: '✨',
                    price: Number(t.precoExtra || 0),
                    cost: Number(t.custo || 0),
                    available: true,
                    commissionRate: 5
                }))
            };
            // Mantém alias 'geral' para compatibilidade com código antigo
            legacy.adicionais.geral = legacy.adicionais.coberturas;
        }

        // Flag para que PDV e cardapio saibam que o catálogo veio do CatalogV2
        if (hasProdutos) legacy._fromV2 = true;

        global.DataStore.set('catalog_config', legacy);

        // Dispara evento LOCAL imediatamente (sem aguardar round-trip Firestore).
        // Isso garante que pdv.html e cardapio.html atualizam na mesma frame
        // que produtos.html salva — sem latência de rede.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mp_catalog_updated', { detail: legacy }));
        }

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
