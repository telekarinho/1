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

        // Toppings base — cardápio oficial MilkyPot
        const topSeed = [
            { name: 'Leitinho Morango Calda',   custo: 0.40, precoExtra: 2.00 },
            { name: 'Calda Avelã',              custo: 0.40, precoExtra: 2.00 },
            { name: 'Maracujá Calda',           custo: 0.30, precoExtra: 2.00 },
            { name: 'Pistache',                 custo: 1.20, precoExtra: 3.50 },
            { name: 'Banana Caramelizada',      custo: 0.70, precoExtra: 2.50 },
            { name: 'Limão em Calda',           custo: 0.30, precoExtra: 2.00 },
            { name: 'Ovomaltine',               custo: 0.80, precoExtra: 2.50 },
            { name: 'Chicletinho',              custo: 0.50, precoExtra: 2.00 },
            { name: 'M&M',                      custo: 0.80, precoExtra: 2.50 },
            { name: 'Granulado',                custo: 0.30, precoExtra: 1.50 },
            { name: 'Chocobol',                 custo: 0.50, precoExtra: 2.00 },
            { name: 'Chocobol Mega',            custo: 0.70, precoExtra: 2.50 },
            { name: 'Leite em Pó',              custo: 0.60, precoExtra: 2.00 },
            { name: 'Beijinho',                 custo: 0.70, precoExtra: 2.50 },
            { name: 'Brigadeiro',               custo: 0.70, precoExtra: 2.50 },
            { name: 'Crocante de Amendoim',     custo: 0.60, precoExtra: 2.00 },
            { name: 'Xerem',                    custo: 0.30, precoExtra: 1.50 },
            { name: 'Ameixa',                   custo: 0.70, precoExtra: 2.50 },
            { name: 'Cereja',                   custo: 0.80, precoExtra: 2.50 },
            { name: 'Gotas de Chocolate',       custo: 0.40, precoExtra: 1.50 },
            { name: 'Creme de Cookies',         custo: 0.80, precoExtra: 2.50 },
            { name: 'Creme de Amendoim',        custo: 0.70, precoExtra: 2.50 }
        ];
        d.toppings = topSeed.map(t => Object.assign({ id: newId('top'), active: true }, t));

        // Produtos-exemplo por categoria
        const prodSeed = [
            { cat: 'cat_milkshake', name: 'Milkshake Ninho com Morango', emoji:'🥤', cInsumos:4.80, cAdd:1.20 },
            { cat: 'cat_milkshake', name: 'Milkshake Nutella',            emoji:'🥤', cInsumos:5.50, cAdd:1.20 },
            // Potinhos/Açaí Bowls/Sorvete-kg removidos do seed — cardápio fica
            // limpo e os 17+1 milkshakes/sundaes + picolé genérico + buffet são
            // adicionados pelas migrations específicas.
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

            // Buffet: R$ 5,99/100g = R$ 59,90/kg — somente loja
            const buffet = s.cat === 'cat_buffet'
                ? { ativo: true, precoPorKg: 59.90, toppingsInclusos: allTopIds }
                : { ativo: false, precoPorKg: 0, toppingsInclusos: [] };

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
                canal: s.cat === 'cat_buffet' ? 'loja' : 'ambos',
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
                //  - cat_sorvete_kg: sempre por peso (variantes = potes/baldes em gramas)
                //  - cat_buffet OU qualquer produto com buffet.ativo: por peso
                //  - milkshakes/potinhos com variantes P/M/G: ainda unitario
                //    (variant modal mostra os tamanhos com preços fixos discretos)
                //  - resto: unitário
                const hasBuffet = p.buffet && p.buffet.ativo;
                const tipoVenda = (
                    cat.id === 'cat_sorvete_kg' ||
                    cat.id === 'cat_buffet' ||
                    hasBuffet
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

                // Detecta se tem variantes (mostra "a partir de" no card)
                const hasVariantes = p.variantes && p.variantes.length > 1;

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
                    badge: p.badge || '',           // ex: 'PREMIUM' no Capitão Açaí
                    aPartirDe: hasVariantes,        // mostra "a partir de R$ X" no card
                    order: typeof p.order === 'number' ? p.order : 999,
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

    // Migração única: substitui toppings e reconfigura buffet para R$5,99/100g somente loja
    function migrateBuffetV1(fid) {
        const d = load(fid);
        if (!d.produtos.length) return { skipped: true, reason: 'sem produtos' };
        if (d.__buffetMigratedV1) return { skipped: true, reason: 'já migrado' };

        const newTops = [
            { name: 'Leitinho Morango Calda',   custo: 0.40, precoExtra: 2.00 },
            { name: 'Calda Avelã',              custo: 0.40, precoExtra: 2.00 },
            { name: 'Maracujá Calda',           custo: 0.30, precoExtra: 2.00 },
            { name: 'Pistache',                 custo: 1.20, precoExtra: 3.50 },
            { name: 'Banana Caramelizada',      custo: 0.70, precoExtra: 2.50 },
            { name: 'Limão em Calda',           custo: 0.30, precoExtra: 2.00 },
            { name: 'Ovomaltine',               custo: 0.80, precoExtra: 2.50 },
            { name: 'Chicletinho',              custo: 0.50, precoExtra: 2.00 },
            { name: 'M&M',                      custo: 0.80, precoExtra: 2.50 },
            { name: 'Granulado',                custo: 0.30, precoExtra: 1.50 },
            { name: 'Chocobol',                 custo: 0.50, precoExtra: 2.00 },
            { name: 'Chocobol Mega',            custo: 0.70, precoExtra: 2.50 },
            { name: 'Leite em Pó',              custo: 0.60, precoExtra: 2.00 },
            { name: 'Beijinho',                 custo: 0.70, precoExtra: 2.50 },
            { name: 'Brigadeiro',               custo: 0.70, precoExtra: 2.50 },
            { name: 'Crocante de Amendoim',     custo: 0.60, precoExtra: 2.00 },
            { name: 'Xerem',                    custo: 0.30, precoExtra: 1.50 },
            { name: 'Ameixa',                   custo: 0.70, precoExtra: 2.50 },
            { name: 'Cereja',                   custo: 0.80, precoExtra: 2.50 },
            { name: 'Gotas de Chocolate',       custo: 0.40, precoExtra: 1.50 },
            { name: 'Creme de Cookies',         custo: 0.80, precoExtra: 2.50 },
            { name: 'Creme de Amendoim',        custo: 0.70, precoExtra: 2.50 }
        ];
        d.toppings = newTops.map(t => Object.assign({ id: newId('top'), active: true }, t));
        const allTopIds = d.toppings.map(t => t.id);

        // Atualiza produto buffet existente
        const buffetProd = d.produtos.find(p => p.categoriaId === 'cat_buffet');
        if (buffetProd) {
            buffetProd.buffet = { ativo: true, precoPorKg: 59.90, toppingsInclusos: allTopIds };
            buffetProd.canal = 'loja';
            buffetProd.precos = {
                loja:     { recomendado: 59.90, real: 59.90 },
                delivery: { recomendado: 0,     real: 0 },
                ifood:    { recomendado: 0,     real: 0 }
            };
            buffetProd.toppingsIds = allTopIds;
        }

        // Atualiza toppingsIds dos outros produtos (cardápio a la carte)
        d.produtos.forEach(p => {
            if (['cat_potinho','cat_sundae','cat_acai','cat_milkshake'].includes(p.categoriaId)) {
                p.toppingsIds = allTopIds;
            }
        });

        d.__buffetMigratedV1 = true;
        save(fid, d);
        return { ok: true };
    }

    // Migração: aplica variantes P/M/G nos milkshakes com preços oficiais MilkyPot
    // P 250ml: R$14,99 (promo inauguração R$9,99) — editável
    // M 400ml: R$17,99
    // G 500ml: R$19,99
    function migrateMilkshakeSizesV1(fid) {
        const d = load(fid);
        if (!d.produtos.length) return { skipped: true, reason: 'sem produtos' };
        if (d.__milkshakeSizesMigratedV1) return { skipped: true, reason: 'já migrado' };

        const milkshakes = d.produtos.filter(p => p.categoriaId === 'cat_milkshake');
        if (!milkshakes.length) {
            d.__milkshakeSizesMigratedV1 = true;
            save(fid, d);
            return { skipped: true, reason: 'sem milkshakes' };
        }

        milkshakes.forEach(p => {
            const baseCusto = Number(p.custos?.custoTotal || 6);
            p.variantes = [
                {
                    id: newId('var'),
                    name: 'P (250ml)',
                    tipo: 'copo',
                    gramas: 250,
                    custoExtra: Math.round(baseCusto * 0.7 * 100) / 100,
                    // Promoção Inauguração: ativa = R$9,99; original = R$14,99
                    precoLoja: 9.99,
                    precoLojaOriginal: 14.99,
                    precoDelivery: 11.49,
                    precoIfood: 12.99,
                    promoAtivo: true,
                    promoLabel: 'Promoção Inauguração'
                },
                {
                    id: newId('var'),
                    name: 'M (400ml)',
                    tipo: 'copo',
                    gramas: 400,
                    custoExtra: Math.round(baseCusto * 1.0 * 100) / 100,
                    precoLoja: 17.99,
                    precoDelivery: 19.99,
                    precoIfood: 22.99
                },
                {
                    id: newId('var'),
                    name: 'G (500ml)',
                    tipo: 'copo',
                    gramas: 500,
                    custoExtra: Math.round(baseCusto * 1.25 * 100) / 100,
                    precoLoja: 19.99,
                    precoDelivery: 22.99,
                    precoIfood: 25.99
                }
            ];

            // Atualiza precos.loja.real para o menor preço (P promo R$9,99) — vira "a partir de" no card
            p.precos = p.precos || {};
            p.precos.loja     = { recomendado: 9.99,  real: 9.99 };
            p.precos.delivery = { recomendado: 11.49, real: 11.49 };
            p.precos.ifood    = { recomendado: 12.99, real: 12.99 };
        });

        d.__milkshakeSizesMigratedV1 = true;
        save(fid, d);
        return { ok: true, count: milkshakes.length };
    }

    // Cardápio oficial MilkyPot — 17 sabores virais + 1 premium
    // Nomes e copies pensadas pra Instagram/TikTok (Geração Z, Londrina)
    const MILKSHAKE_FLAVORS = [
        { name: 'Amora Apaixonada',          emoji: '💜', cInsumos: 4.80, cAdd: 1.20,
          desc: 'Roxa, doce e teimosa — que nem aquele crush que sua mente não desliga. Amora chegou pintando seu feed de roxo. #AmoraVibe' },
        { name: 'Blue Ice — Crush Gelado',   emoji: '🧊', cInsumos: 4.50, cAdd: 1.20,
          desc: 'Azul que nem o céu de Londrina ao entardecer. Sabor surpresa, frescor de praia e foto que viraliza antes do primeiro gole.' },
        { name: 'Morango Romântico',         emoji: '🍓', cInsumos: 4.80, cAdd: 1.20,
          desc: 'O clássico que sempre volta — porque amor verdadeiro não envelhece. Cremosinho, vermelhinho, abraço em forma de milkshake.' },
        { name: 'Açaí Liberdade',            emoji: '🟣', cInsumos: 5.20, cAdd: 1.20,
          desc: 'Bowl de açaí virou líquido. Energia da Amazônia, doçura de Londrina, canudinho na boca. O açaí dos preguiçosos felizes.' },
        { name: 'Caramelo Derretido',        emoji: '🍯', cInsumos: 4.60, cAdd: 1.20,
          desc: 'Caramelo que escorre devagar — igual beijo demorado de quinta à noite. Dourado, gostoso e impossível de resistir.' },
        { name: 'Limão Suíço Refresca-Tudo', emoji: '🍋', cInsumos: 4.40, cAdd: 1.20,
          desc: 'Azedinho na medida, gelado no ponto. Pra quando o sol de Londrina aperta e você precisa de um respiro com graça.' },
        { name: 'Chocolate Apaixonante',     emoji: '🍫', cInsumos: 5.00, cAdd: 1.20,
          desc: 'Bombom líquido. O abraço quente do chocolate com a frescura do milkshake. Conforto que cabe num copo.' },
        { name: 'Uva da Vovó',               emoji: '🍇', cInsumos: 4.60, cAdd: 1.20,
          desc: 'Aquela uva roxinha do quintal da vovó, mas crescida e bem-vestida. Suco de infância na versão Geração TikTok.' },
        { name: 'Maracujá Calmaria',         emoji: '💛', cInsumos: 4.70, cAdd: 1.20,
          desc: 'Tropical, levemente azedinho, totalmente relaxante. Maracujá chegou pra desacelerar seu rolê com um gole zen.' },
        { name: 'Dentadura Doidinha',        emoji: '😬', cInsumos: 4.50, cAdd: 1.20,
          desc: 'O milkshake colorido que deixa sua boca igual desenho animado. Diversão visual + sabor explosivo. Foto obrigatória.' },
        { name: 'Cookies Snow',              emoji: '🤍', cInsumos: 5.50, cAdd: 1.30,
          desc: 'Branquinho, cremoso, com pedaços de cookie crocante. Tipo neve em Londrina: raríssima, mas gostosa demais.' },
        { name: 'Ninho da Vovó',             emoji: '🥛', cInsumos: 5.20, cAdd: 1.20,
          desc: 'Cremosidade de berço. Aquele cheirinho que lembra colo, pé no sofá e desenho da Disney no domingo de manhã.' },
        { name: 'Pistache Esmeralda',        emoji: '🟢', cInsumos: 6.20, cAdd: 1.30,
          desc: 'Verdinho gourmet, sofisticado, crocante. Pistache premium com clima italiano — pra quem gosta de chique no copo.' },
        { name: 'Peanut Heaven',             emoji: '🥜', cInsumos: 5.50, cAdd: 1.30,
          desc: 'Cremoso, salgadinho, viciante. O peanut butter virou milkshake — e a vida nunca mais foi a mesma.' },
        { name: 'Cereja Beijada',            emoji: '🍒', cInsumos: 4.80, cAdd: 1.20,
          desc: 'Vermelhinha, brincalhona, top de bolo. A cereja que coroou seu milkshake — e provavelmente seu dia.' },
        { name: 'Ameixa Roxinha',            emoji: '🍑', cInsumos: 4.80, cAdd: 1.20,
          desc: 'Roxa, polpuda, exótica. Pra quem quer fugir do óbvio e descobrir um sabor novo no meio do caminho.' },
        { name: 'Banana Caramelizada',       emoji: '🍌', cInsumos: 4.60, cAdd: 1.20,
          desc: 'Banana douradinha, queimadinha na medida, beijada pelo caramelo. Doçura de fazenda em copo gelado.' }
    ];

    // Premium: Capitão Açaí — flagship do cardápio
    const MILKSHAKE_PREMIUM_ACAI = {
        name: 'Capitão Açaí · Premium',
        emoji: '👑',
        desc: 'O bowl gigante virou shake gigante. Açaí da Amazônia, granola crocante, banana caramelizada, leite condensado e raspas de chocolate. Não é só um milkshake — é a coroa do cardápio MilkyPot. 600ml de experiência pura.',
        cInsumos: 9.50,
        cAdd: 2.50
    };

    // Migração: substitui milkshakes seed pelos 17 sabores oficiais + 1 premium
    function migrateMilkshakeFlavorsV1(fid) {
        const d = load(fid);
        if (!d.produtos.length) return { skipped: true, reason: 'sem produtos' };
        if (d.__milkshakeFlavorsMigratedV1) return { skipped: true, reason: 'já migrado' };

        // Desativa milkshakes antigos (preserva histórico — não deleta)
        d.produtos.forEach(p => {
            if (p.categoriaId === 'cat_milkshake') p.active = false;
        });

        // Helper: cria variantes P/M/G padrão (com promo P R$9,99)
        function makeVariantesPMG(baseCusto) {
            return [
                { id: newId('var'), name: 'P (250ml)', tipo: 'copo', gramas: 250,
                  custoExtra: Math.round(baseCusto * 0.7 * 100) / 100,
                  precoLoja: 9.99, precoLojaOriginal: 14.99,
                  precoDelivery: 11.49, precoIfood: 12.99,
                  promoAtivo: true, promoLabel: 'Promoção Inauguração' },
                { id: newId('var'), name: 'M (400ml)', tipo: 'copo', gramas: 400,
                  custoExtra: Math.round(baseCusto * 1.0 * 100) / 100,
                  precoLoja: 17.99, precoDelivery: 19.99, precoIfood: 22.99 },
                { id: newId('var'), name: 'G (500ml)', tipo: 'copo', gramas: 500,
                  custoExtra: Math.round(baseCusto * 1.25 * 100) / 100,
                  precoLoja: 19.99, precoDelivery: 22.99, precoIfood: 25.99 }
            ];
        }

        const allTopIds = (d.toppings || []).map(t => t.id);

        // Insere os 17 sabores
        MILKSHAKE_FLAVORS.forEach((f, idx) => {
            const custoTotal = f.cInsumos + f.cAdd;
            d.produtos.push({
                id: newId('prod'),
                categoriaId: 'cat_milkshake',
                name: (idx + 1) + '. Milkshake ' + f.name,
                desc: f.desc + SOFT_EXPRESSO_FOOTER,
                midia: { fotos: [], video: '', emoji: f.emoji },
                custos: {
                    insumos: [],
                    custoInsumos: f.cInsumos,
                    custoAdicional: { embalagem: f.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                    custoTotal: custoTotal
                },
                precos: {
                    loja:     { recomendado: 9.99,  real: 9.99 },
                    delivery: { recomendado: 11.49, real: 11.49 },
                    ifood:    { recomendado: 12.99, real: 12.99 }
                },
                kits: [],
                variantes: makeVariantesPMG(custoTotal),
                toppingsIds: allTopIds,
                buffet: { ativo: false, precoPorKg: 0, toppingsInclusos: [] },
                canal: 'ambos',
                active: true,
                order: idx + 1,
                createdAt: new Date().toISOString()
            });
        });

        // Premium: Capitão Açaí — 600ml único, preço diferenciado
        const premium = MILKSHAKE_PREMIUM_ACAI;
        const custoPremium = premium.cInsumos + premium.cAdd;
        d.produtos.push({
            id: newId('prod'),
            categoriaId: 'cat_milkshake',
            name: '18. Milkshake Capitão Açaí Premium',
            desc: premium.desc + SOFT_EXPRESSO_FOOTER,
            midia: { fotos: [], video: '', emoji: premium.emoji },
            custos: {
                insumos: [],
                custoInsumos: premium.cInsumos,
                custoAdicional: { embalagem: premium.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                custoTotal: custoPremium
            },
            precos: {
                loja:     { recomendado: 24.99, real: 24.99 },
                delivery: { recomendado: 28.99, real: 28.99 },
                ifood:    { recomendado: 32.99, real: 32.99 }
            },
            kits: [],
            variantes: [
                { id: newId('var'), name: 'Premium (600ml)', tipo: 'copo', gramas: 600,
                  custoExtra: custoPremium,
                  precoLoja: 24.99, precoDelivery: 28.99, precoIfood: 32.99 }
            ],
            toppingsIds: allTopIds,
            buffet: { ativo: false, precoPorKg: 0, toppingsInclusos: [] },
            canal: 'ambos',
            active: true,
            order: 100,
            badge: 'PREMIUM',
            createdAt: new Date().toISOString()
        });

        d.__milkshakeFlavorsMigratedV1 = true;
        save(fid, d);
        return { ok: true, count: MILKSHAKE_FLAVORS.length + 1 };
    }

    // Limpeza: remove milkshakes inativos do seed antigo (Ninho com Morango,
    // Nutella) que ficaram visíveis no admin mesmo desativados.
    // Idempotente — gate __inactiveMilkshakesCleanedV1.
    function cleanupInactiveMilkshakesV1(fid) {
        const d = load(fid);
        if (d.__inactiveMilkshakesCleanedV1) return { skipped: true, reason: 'já limpo' };

        const before = d.produtos.length;
        d.produtos = d.produtos.filter(p => {
            // Remove APENAS os milkshakes inativos cujo nome bate com o seed antigo
            // (preserva qualquer customização do franqueado)
            if (p.categoriaId !== 'cat_milkshake') return true;
            if (p.active !== false) return true;  // mantém os ativos (novos sabores)
            const oldSeedNames = ['Milkshake Ninho com Morango', 'Milkshake Nutella'];
            return !oldSeedNames.includes(p.name);
        });
        const removed = before - d.produtos.length;

        d.__inactiveMilkshakesCleanedV1 = true;
        save(fid, d);
        return { ok: true, removed: removed };
    }

    // ==========================================================
    // SUNDAE GOURMET — mesmo cardápio dos milkshakes adaptado
    // ==========================================================
    const SUNDAE_FLAVORS = [
        { name: 'Amora Apaixonada',          emoji: '💜', cInsumos: 4.80, cAdd: 1.30,
          desc: 'Roxa, doce e teimosa — que nem aquele crush que sua mente não desliga. Sundae cremoso de amora pintando seu feed de roxo. #AmoraVibe' },
        { name: 'Blue Ice — Crush Gelado',   emoji: '🧊', cInsumos: 4.50, cAdd: 1.30,
          desc: 'Azul que nem o céu de Londrina ao entardecer. Sundae surpresa, frescor de praia e foto que viraliza antes da primeira colher.' },
        { name: 'Morango Romântico',         emoji: '🍓', cInsumos: 4.80, cAdd: 1.30,
          desc: 'O clássico que sempre volta — porque amor verdadeiro não envelhece. Cremosinho, vermelhinho, abraço em forma de sundae.' },
        { name: 'Açaí Liberdade',            emoji: '🟣', cInsumos: 5.20, cAdd: 1.30,
          desc: 'Bowl de açaí virou sundae cremoso. Energia da Amazônia, doçura de Londrina, colher na mão. Açaí dos preguiçosos felizes.' },
        { name: 'Caramelo Derretido',        emoji: '🍯', cInsumos: 4.60, cAdd: 1.30,
          desc: 'Caramelo que escorre devagar — igual beijo demorado de quinta à noite. Sundae dourado, gostoso e impossível de resistir.' },
        { name: 'Limão Suíço Refresca-Tudo', emoji: '🍋', cInsumos: 4.40, cAdd: 1.30,
          desc: 'Azedinho na medida, gelado no ponto. Sundae pra quando o sol de Londrina aperta e você precisa de um respiro com graça.' },
        { name: 'Chocolate Apaixonante',     emoji: '🍫', cInsumos: 5.00, cAdd: 1.30,
          desc: 'Bombom em camadas. O abraço quente do chocolate com a frescura do sundae. Conforto que cabe num copo.' },
        { name: 'Uva da Vovó',               emoji: '🍇', cInsumos: 4.60, cAdd: 1.30,
          desc: 'Aquela uva roxinha do quintal da vovó, mas crescida e bem-vestida. Sundae de infância na versão Geração TikTok.' },
        { name: 'Maracujá Calmaria',         emoji: '💛', cInsumos: 4.70, cAdd: 1.30,
          desc: 'Tropical, levemente azedinho, totalmente relaxante. Sundae de maracujá pra desacelerar seu rolê com uma colherada zen.' },
        { name: 'Dentadura Doidinha',        emoji: '😬', cInsumos: 4.50, cAdd: 1.30,
          desc: 'O sundae colorido que deixa sua boca igual desenho animado. Diversão visual + sabor explosivo. Foto obrigatória.' },
        { name: 'Cookies Snow',              emoji: '🤍', cInsumos: 5.50, cAdd: 1.40,
          desc: 'Branquinho, cremoso, com pedaços de cookie crocante por cima. Tipo neve em Londrina: raríssima, mas gostosa demais.' },
        { name: 'Ninho da Vovó',             emoji: '🥛', cInsumos: 5.20, cAdd: 1.30,
          desc: 'Cremosidade de berço. Aquele cheirinho que lembra colo, pé no sofá e desenho da Disney no domingo de manhã.' },
        { name: 'Pistache Esmeralda',        emoji: '🟢', cInsumos: 6.20, cAdd: 1.40,
          desc: 'Verdinho gourmet, sofisticado, crocante. Sundae de pistache premium com clima italiano — pra quem gosta de chique no copo.' },
        { name: 'Peanut Heaven',             emoji: '🥜', cInsumos: 5.50, cAdd: 1.40,
          desc: 'Cremoso, salgadinho, viciante. O peanut butter virou sundae — e a vida nunca mais foi a mesma.' },
        { name: 'Cereja Beijada',            emoji: '🍒', cInsumos: 4.80, cAdd: 1.30,
          desc: 'Vermelhinha, brincalhona, top de bolo. A cereja que coroou seu sundae — e provavelmente seu dia.' },
        { name: 'Ameixa Roxinha',            emoji: '🍑', cInsumos: 4.80, cAdd: 1.30,
          desc: 'Roxa, polpuda, exótica. Sundae pra quem quer fugir do óbvio e descobrir um sabor novo no meio do caminho.' },
        { name: 'Banana Caramelizada',       emoji: '🍌', cInsumos: 4.60, cAdd: 1.30,
          desc: 'Banana douradinha, queimadinha na medida, beijada pelo caramelo. Sundae de fazenda em copo gelado.' }
    ];

    const SUNDAE_PREMIUM_ACAI = {
        name: 'Capitão Açaí Sundae · Premium',
        emoji: '👑',
        desc: 'Coroa do cardápio de sundaes. Açaí da Amazônia em camadas generosas, granola crocante, banana caramelizada, leite condensado e raspas de chocolate. Não é só um sundae — é uma experiência. 600ml de pura indulgência.',
        cInsumos: 9.50,
        cAdd: 2.50
    };

    // Migração: substitui sundaes seed pelos 17 sabores oficiais + 1 premium
    function migrateSundaeGourmetFlavorsV1(fid) {
        const d = load(fid);
        if (!d.produtos.length) return { skipped: true, reason: 'sem produtos' };
        if (d.__sundaeGourmetMigratedV1) return { skipped: true, reason: 'já migrado' };

        // Desativa sundaes antigos do seed (Sundae Clássico)
        d.produtos.forEach(p => {
            if (p.categoriaId === 'cat_sundae') p.active = false;
        });

        function makeVariantesPMG(baseCusto) {
            return [
                { id: newId('var'), name: 'P (250ml)', tipo: 'copo', gramas: 250,
                  custoExtra: Math.round(baseCusto * 0.7 * 100) / 100,
                  precoLoja: 9.99, precoLojaOriginal: 14.99,
                  precoDelivery: 11.49, precoIfood: 12.99,
                  promoAtivo: true, promoLabel: 'Promoção Inauguração' },
                { id: newId('var'), name: 'M (400ml)', tipo: 'copo', gramas: 400,
                  custoExtra: Math.round(baseCusto * 1.0 * 100) / 100,
                  precoLoja: 17.99, precoDelivery: 19.99, precoIfood: 22.99 },
                { id: newId('var'), name: 'G (500ml)', tipo: 'copo', gramas: 500,
                  custoExtra: Math.round(baseCusto * 1.25 * 100) / 100,
                  precoLoja: 19.99, precoDelivery: 22.99, precoIfood: 25.99 }
            ];
        }

        const allTopIds = (d.toppings || []).map(t => t.id);

        SUNDAE_FLAVORS.forEach((f, idx) => {
            const custoTotal = f.cInsumos + f.cAdd;
            d.produtos.push({
                id: newId('prod'),
                categoriaId: 'cat_sundae',
                name: (idx + 1) + '. Sundae ' + f.name,
                desc: f.desc + SOFT_EXPRESSO_FOOTER,
                midia: { fotos: [], video: '', emoji: f.emoji },
                custos: {
                    insumos: [],
                    custoInsumos: f.cInsumos,
                    custoAdicional: { embalagem: f.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                    custoTotal: custoTotal
                },
                precos: {
                    loja:     { recomendado: 9.99,  real: 9.99 },
                    delivery: { recomendado: 11.49, real: 11.49 },
                    ifood:    { recomendado: 12.99, real: 12.99 }
                },
                kits: [],
                variantes: makeVariantesPMG(custoTotal),
                toppingsIds: allTopIds,
                buffet: { ativo: false, precoPorKg: 0, toppingsInclusos: [] },
                canal: 'ambos',
                active: true,
                order: idx + 1,
                createdAt: new Date().toISOString()
            });
        });

        // Premium: Capitão Açaí Sundae 600ml
        const premium = SUNDAE_PREMIUM_ACAI;
        const custoPremium = premium.cInsumos + premium.cAdd;
        d.produtos.push({
            id: newId('prod'),
            categoriaId: 'cat_sundae',
            name: '18. Sundae Capitão Açaí Premium',
            desc: premium.desc + SOFT_EXPRESSO_FOOTER,
            midia: { fotos: [], video: '', emoji: premium.emoji },
            custos: {
                insumos: [],
                custoInsumos: premium.cInsumos,
                custoAdicional: { embalagem: premium.cAdd, energia: 0, mao_obra: 0, outros: 0 },
                custoTotal: custoPremium
            },
            precos: {
                loja:     { recomendado: 24.99, real: 24.99 },
                delivery: { recomendado: 28.99, real: 28.99 },
                ifood:    { recomendado: 32.99, real: 32.99 }
            },
            kits: [],
            variantes: [
                { id: newId('var'), name: 'Premium (600ml)', tipo: 'copo', gramas: 600,
                  custoExtra: custoPremium,
                  precoLoja: 24.99, precoDelivery: 28.99, precoIfood: 32.99 }
            ],
            toppingsIds: allTopIds,
            buffet: { ativo: false, precoPorKg: 0, toppingsInclusos: [] },
            canal: 'ambos',
            active: true,
            order: 100,
            badge: 'PREMIUM',
            createdAt: new Date().toISOString()
        });

        d.__sundaeGourmetMigratedV1 = true;
        save(fid, d);
        return { ok: true, count: SUNDAE_FLAVORS.length + 1 };
    }

    // Cleanup: remove sundaes inativos do seed antigo
    function cleanupInactiveSundaesV1(fid) {
        const d = load(fid);
        if (d.__inactiveSundaesCleanedV1) return { skipped: true, reason: 'já limpo' };

        const before = d.produtos.length;
        d.produtos = d.produtos.filter(p => {
            if (p.categoriaId !== 'cat_sundae') return true;
            if (p.active !== false) return true;
            const oldSeedNames = ['Sundae Clássico'];
            return !oldSeedNames.includes(p.name);
        });
        const removed = before - d.produtos.length;

        d.__inactiveSundaesCleanedV1 = true;
        save(fid, d);
        return { ok: true, removed: removed };
    }

    // Fix: sundaes com tipo='taca' (versão antiga) → 'copo' (mesmo recipiente que milkshake)
    function fixSundaeTipoCopoV1(fid) {
        const d = load(fid);
        if (d.__sundaeTipoCopoFixedV1) return { skipped: true, reason: 'já corrigido' };

        let fixed = 0;
        d.produtos.forEach(p => {
            if (p.categoriaId !== 'cat_sundae') return;
            (p.variantes || []).forEach(v => {
                if (v.tipo === 'taca') { v.tipo = 'copo'; fixed++; }
            });
        });

        d.__sundaeTipoCopoFixedV1 = true;
        save(fid, d);
        return { ok: true, fixed: fixed };
    }

    // ==========================================================
    // PERMANENT DENYLIST — produtos placeholder/seed que devem
    // SEMPRE ser removidos. Roda em TODA chamada de applyAllMigrations
    // (sem gate) pra cobrir caso de cloud override resyncar dados velhos.
    // ==========================================================
    const PLACEHOLDER_DENYLIST = [
        // Potinhos genéricos (substituídos pelos sabores numerados)
        'Potinho 180ml', 'Potinho 300ml', 'Potinho 500ml',
        // Açaí Bowl genérico (vai ser revisado depois)
        'Açaí Bowl 300ml', 'Açaí Bowl 500ml', 'Acai Bowl 300ml', 'Acai Bowl 500ml',
        // Sorvete por Kg placeholder
        'Sorvete por Kg (variantes)', 'Sorvete por Kg (varietes)',
        // Picolés antigos — substituídos pelo Picolé de Leite/Fruta genérico
        'Picolé Ninho com Morango', 'Picolé Nutella', 'Picole Ninho com Morango', 'Picole Nutella',
        // Milkshakes/Sundae antigos do seed (já removidos por cleanup, mas reforça)
        'Milkshake Ninho com Morango', 'Milkshake Nutella', 'Sundae Clássico'
    ];

    function purgePlaceholders(fid) {
        const d = load(fid);
        const before = d.produtos.length;
        d.produtos = d.produtos.filter(p => PLACEHOLDER_DENYLIST.indexOf(p.name) === -1);
        const purged = before - d.produtos.length;
        if (purged > 0) save(fid, d);
        return { ok: true, purged: purged };
    }

    // Cria o picolé genérico "Picolé de Leite/Fruta" com 22 sabores na descrição
    function migratePicoleGenericoV1(fid) {
        const d = load(fid);
        if (d.__picoleGenericoV1) return { skipped: true, reason: 'já migrado' };

        // Verifica se já existe (idempotência extra)
        const exists = d.produtos.some(p =>
            p.categoriaId === 'cat_picole' && p.active !== false && /Leite\/Fruta|Leite ou Fruta/i.test(p.name)
        );

        if (!exists) {
            const desc =
                '22 sabores rotativos · pergunte os sabores do dia! ' +
                '🥛 LEITE: Ninho · Brigadeiro · Romeu e Julieta · Morango Cremoso · Doce de Leite · ' +
                'Cookies & Cream · Beijinho · Pavê · Banana · Paçoca · Coco. ' +
                '🍓 FRUTA: Morango · Maracujá · Açaí · Limão · Coco Verde · Manga · Abacaxi · Uva · ' +
                'Tangerina · Frutas Vermelhas · Kiwi.';

            d.produtos.push({
                id: newId('prod'),
                categoriaId: 'cat_picole',
                name: 'Picolé de Leite/Fruta',
                desc: desc,
                midia: { fotos: [], video: '', emoji: '🍡' },
                custos: {
                    insumos: [],
                    custoInsumos: 2.20,
                    custoAdicional: { embalagem: 0.40, energia: 0, mao_obra: 0, outros: 0 },
                    custoTotal: 2.60
                },
                precos: {
                    loja:     { recomendado: 3.00, real: 3.00 },
                    delivery: { recomendado: 3.50, real: 3.50 },
                    ifood:    { recomendado: 3.90, real: 3.90 }
                },
                kits: [
                    { label: '1 unidade',   qty:  1, precoLoja:  3.00, precoDelivery:  3.50, precoIfood:  3.90 },
                    { label: '4 unidades',  qty:  4, precoLoja: 10.00, precoDelivery: 11.50, precoIfood: 12.90 },
                    { label: '10 unidades', qty: 10, precoLoja: 23.00, precoDelivery: 25.90, precoIfood: 29.90 },
                    { label: '20 unidades', qty: 20, precoLoja: 39.99, precoDelivery: 44.90, precoIfood: 49.99 }
                ],
                variantes: [],
                toppingsIds: [],
                buffet: { ativo: false, precoPorKg: 0, toppingsInclusos: [] },
                canal: 'ambos',
                active: true,
                order: 1,
                createdAt: new Date().toISOString()
            });
        }

        d.__picoleGenericoV1 = true;
        save(fid, d);
        return { ok: true, created: !exists };
    }

    // Footer que comunica ao cliente que a base é soft expresso Baunilha/Ninho
    const SOFT_EXPRESSO_FOOTER = ' 🥛 Base: sorvete soft expresso · Baunilha/Ninho · cremoso e na hora.';

    // Adiciona o footer 'soft expresso Baunilha/Ninho' nas descrições dos
    // milkshakes e sundaes existentes — idempotente (gate + check de presença).
    function addSoftExpressoDescV1(fid) {
        const d = load(fid);
        if (d.__softExpressoDescV1) return { skipped: true, reason: 'já adicionado' };

        let updated = 0;
        d.produtos.forEach(p => {
            if (p.active === false) return;
            if (p.categoriaId !== 'cat_milkshake' && p.categoriaId !== 'cat_sundae') return;
            if (!p.desc) p.desc = '';
            // Pula se já tem (defesa dupla)
            if (p.desc.indexOf('soft expresso') !== -1) return;
            p.desc = p.desc.trim() + SOFT_EXPRESSO_FOOTER;
            updated++;
        });

        d.__softExpressoDescV1 = true;
        save(fid, d);
        return { ok: true, updated: updated };
    }

    // Renomeia produtos: "Amora Apaixonada" → "1. Milkshake Amora Apaixonada"
    // (mesma numeração 1-17 pra milkshake e sundae · Premium = 18)
    function renameProductsNumberedV1(fid) {
        const d = load(fid);
        if (d.__productsNumberedV1) return { skipped: true, reason: 'já numerado' };

        // Mapa nome-original → número (mesma ordem em milkshake e sundae)
        const flavorOrder = {};
        MILKSHAKE_FLAVORS.forEach((f, idx) => { flavorOrder[f.name] = idx + 1; });

        let renamed = 0;

        d.produtos.forEach(p => {
            if (p.active === false) return;

            // Detecta categoria → prefixo
            let prefix;
            if (p.categoriaId === 'cat_milkshake') prefix = 'Milkshake';
            else if (p.categoriaId === 'cat_sundae') prefix = 'Sundae';
            else return;

            // Se já tem número no início, pula (idempotência extra)
            if (/^\d{1,2}\.\s/.test(p.name)) return;

            const isPremium = p.name.indexOf('Capitão Açaí') !== -1;
            if (isPremium) {
                p.name = '18. ' + prefix + ' Capitão Açaí Premium';
                p.order = 18;
            } else {
                // Tenta achar pelo nome original (limpa o "Sundae " caso o nome tenha sido prefixado antes)
                const cleanName = p.name.replace(/^Sundae\s+/i, '').replace(/^Milkshake\s+/i, '');
                const num = flavorOrder[cleanName];
                if (!num) return;  // não bate com sabor oficial — preserva
                p.name = num + '. ' + prefix + ' ' + cleanName;
                p.order = num;
            }
            renamed++;
        });

        d.__productsNumberedV1 = true;
        save(fid, d);
        return { ok: true, renamed: renamed };
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

    // Aplica TODAS as migrations idempotentes — chamada centralizada
    // pra garantir que admin/PDV/cardápio/financeiro vejam os mesmos dados.
    // Cada migrate tem seu próprio gate (__xxxMigratedV1) e pula se já rodou.
    function applyAllMigrations(fid) {
        try {
            const d = load(fid);
            if (!d.produtos.length) return { skipped: true, reason: 'sem produtos seed' };
            const results = {};
            try { results.buffet = migrateBuffetV1(fid); } catch(e) { results.buffet_err = e.message; }
            try { results.milkshakeSizes = migrateMilkshakeSizesV1(fid); } catch(e) { results.milkshakeSizes_err = e.message; }
            try { results.milkshakeFlavors = migrateMilkshakeFlavorsV1(fid); } catch(e) { results.milkshakeFlavors_err = e.message; }
            try { results.cleanupInactive = cleanupInactiveMilkshakesV1(fid); } catch(e) { results.cleanupInactive_err = e.message; }
            try { results.sundaeGourmet = migrateSundaeGourmetFlavorsV1(fid); } catch(e) { results.sundaeGourmet_err = e.message; }
            try { results.cleanupSundaes = cleanupInactiveSundaesV1(fid); } catch(e) { results.cleanupSundaes_err = e.message; }
            try { results.sundaeTipoCopo = fixSundaeTipoCopoV1(fid); } catch(e) { results.sundaeTipoCopo_err = e.message; }
            try { results.picoleGenerico = migratePicoleGenericoV1(fid); } catch(e) { results.picoleGenerico_err = e.message; }
            try { results.softExpresso = addSoftExpressoDescV1(fid); } catch(e) { results.softExpresso_err = e.message; }
            try { results.numbered = renameProductsNumberedV1(fid); } catch(e) { results.numbered_err = e.message; }
            // SEM gate — roda em toda chamada (cobre cloud override resyncando placeholders velhos)
            try { results.purged = purgePlaceholders(fid); } catch(e) { results.purged_err = e.message; }
            return results;
        } catch(e) { return { error: e.message }; }
    }

    // Auto-sync ao load (garante PDV/admin/cardápio sempre atualizados)
    function autoSyncIfNeeded(fid) {
        try {
            const d = load(fid);
            if (d.produtos.length > 0) {
                applyAllMigrations(fid);
                syncToLegacy(fid);
            }
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
        migrateBuffetV1,
        migrateMilkshakeSizesV1,
        migrateMilkshakeFlavorsV1,
        cleanupInactiveMilkshakesV1,
        migrateSundaeGourmetFlavorsV1,
        cleanupInactiveSundaesV1,
        fixSundaeTipoCopoV1,
        renameProductsNumberedV1,
        migratePicoleGenericoV1,
        addSoftExpressoDescV1,
        purgePlaceholders,
        applyAllMigrations,
        syncToLegacy,
        autoSyncIfNeeded,
        // Catálogo dos sabores oficiais — usado por TV indoor e marketing
        MILKSHAKE_FLAVORS,
        MILKSHAKE_PREMIUM_ACAI,
        SUNDAE_FLAVORS,
        SUNDAE_PREMIUM_ACAI,
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
