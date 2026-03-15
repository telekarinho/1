/* ============================================
   MilkyPot - Cardápio Data (Admin-Editable)
   ============================================

   FLUXO DO PEDIDO:
   BASE → FORMATO → TAMANHO → SABOR → ADICIONAIS → BEBIDAS → RESUMO

   INSTRUÇÕES PARA O ADMIN:
   - Edite nomes, descrições, preços e disponibilidade
   - Para desativar um item: available: false
   - Cada franquia pode ter configs próprias (storeId)
   ============================================ */

const CARDAPIO_CONFIG = {
    storeId: null,
    storeName: '',

    // ============================================
    // PASSO 1: BASES
    // ============================================
    bases: [
        {
            id: 'ninho',
            name: 'Milkypot Ninho',
            emoji: '☁️',
            desc: 'Base cremosa de leite Ninho. A mais amada!',
            color: '#90CAF9',
            gradient: 'linear-gradient(135deg, #D6ECFF 0%, #BBDEFB 100%)',
            available: true
        },
        {
            id: 'zero-fit',
            name: 'Milkypot Zero / Fit',
            emoji: '💪',
            desc: 'Base zero açúcar com opções proteicas.',
            color: '#4CAF50',
            gradient: 'linear-gradient(135deg, #D0FFE8 0%, #C8F0DC 100%)',
            available: true
        },
        {
            id: 'acai',
            name: 'Milkypot Açaí',
            emoji: '🫐',
            desc: 'Base de açaí puro e cremoso.',
            color: '#7B4EA8',
            gradient: 'linear-gradient(135deg, #E0D0F8 0%, #C8A8E8 100%)',
            available: true
        }
    ],

    // ============================================
    // PASSO 2: FORMATOS
    // ============================================
    formatos: [
        {
            id: 'shake',
            name: 'Milkypot Shake',
            emoji: '🥤',
            desc: 'Batido na máquina, gelado e super cremoso.',
            compatibleBases: ['ninho', 'zero-fit'],
            available: true
        },
        {
            id: 'sundae',
            name: 'Sundae Gourmet',
            emoji: '🍨',
            desc: 'Montado no copo com camadas de cremes e coberturas.',
            compatibleBases: ['ninho', 'zero-fit'],
            available: true
        },
        {
            id: 'acai-bowl',
            name: 'Açaí Bowl',
            emoji: '🥣',
            desc: 'Açaí servido na tigela com toppings.',
            compatibleBases: ['acai'],
            available: true
        },
        {
            id: 'acai-shake',
            name: 'Açaí Shake',
            emoji: '🥤',
            desc: 'Açaí batido cremoso no copo.',
            compatibleBases: ['acai'],
            available: true
        }
    ],

    // ============================================
    // PASSO 3: TAMANHOS (preço único p/ todos)
    // ============================================
    tamanhos: [
        { id: 'mini',    name: 'Mini',    ml: 180, price: 10.00, available: true },
        { id: 'pequeno', name: 'Pequeno', ml: 300, price: 14.00, available: true },
        { id: 'medio',   name: 'Médio',   ml: 500, price: 18.00, available: true },
        { id: 'gigante', name: 'Gigante', ml: 700, price: 22.00, available: true }
    ],

    // ============================================
    // PASSO 4: SABORES (organizados por categoria)
    // ============================================
    sabores: {
        classicos: {
            name: 'Clássicos',
            emoji: '⭐',
            compatibleBases: ['ninho'],
            items: [
                { id: 'morango',           name: 'Morango',           emoji: '🍓', desc: 'Calda artesanal de morango.', highlight: true, available: true },
                { id: 'ninho',             name: 'Ninho',             emoji: '☁️', desc: 'Puro creme de leite Ninho.', highlight: true, available: true },
                { id: 'ninho-morango',     name: 'Ninho com Morango', emoji: '🍓', desc: 'Creme de Ninho + calda de morango.', highlight: true, available: true },
                { id: 'nutella',           name: 'Nutella',           emoji: '🍫', desc: 'Nutella cremosa generosa.', highlight: true, available: true },
                { id: 'oreo',              name: 'Oreo',              emoji: '🍪', desc: 'Pedaços de Oreo triturado.', highlight: true, available: true }
            ]
        },
        especiais: {
            name: 'Especiais',
            emoji: '✨',
            compatibleBases: ['ninho'],
            items: [
                { id: 'capuccino-cream',   name: 'Capuccino Cream',   emoji: '☕', desc: 'Creme de capuccino aveludado.', highlight: false, available: true }
            ]
        },
        adulto: {
            name: 'Adulto +18',
            emoji: '🔞',
            compatibleBases: ['ninho'],
            items: [
                { id: 'amarula-cream',     name: 'Amarula Cream',     emoji: '🥃', desc: 'Com licor Amarula.', highlight: false, available: true },
                { id: 'baileys-cream',     name: 'Baileys Cream',     emoji: '🥃', desc: 'Com licor Baileys.', highlight: false, available: true }
            ]
        },
        acai: {
            name: 'Açaí',
            emoji: '🫐',
            compatibleBases: ['acai'],
            items: [
                { id: 'acai-granola',      name: 'Açaí + Granola',    emoji: '🥣', desc: 'Açaí com granola crocante.', highlight: true, available: true },
                { id: 'acai-banana',       name: 'Açaí + Banana',     emoji: '🍌', desc: 'Açaí com banana fatiada.', highlight: false, available: true },
                { id: 'acai-morango',      name: 'Açaí + Morango',    emoji: '🍓', desc: 'Açaí com morango fresco.', highlight: false, available: true }
            ]
        },
        zero_fit: {
            name: 'Zero / Fit',
            emoji: '💪',
            compatibleBases: ['zero-fit'],
            items: [
                { id: 'whey',              name: 'Whey',              emoji: '💪', desc: 'Com whey protein.', highlight: false, available: true },
                { id: 'banana-whey',       name: 'Banana + Whey',     emoji: '🍌', desc: 'Banana com whey protein.', highlight: true, available: true },
                { id: 'pasta-amendoim',    name: 'Pasta de Amendoim', emoji: '🥜', desc: 'Com pasta de amendoim.', highlight: false, available: true }
            ]
        }
    },

    // ============================================
    // PASSO 5: ADICIONAIS (organizados por subcategoria)
    // ============================================
    adicionais: {
        bordas: {
            name: 'Bordas Recheadas',
            emoji: '🔵',
            items: [
                { id: 'borda-nutella',  name: 'Nutella',          price: 4.00, emoji: '🍫', available: true },
                { id: 'borda-ninho',    name: 'Creme de Ninho',   price: 4.00, emoji: '☁️', available: true },
                { id: 'borda-oreo',     name: 'Oreo',             price: 4.00, emoji: '🍪', available: true }
            ]
        },
        frutas: {
            name: 'Frutas',
            emoji: '🍓',
            items: [
                { id: 'add-morango',    name: 'Morango',          price: 3.00, emoji: '🍓', available: true },
                { id: 'add-banana',     name: 'Banana',           price: 3.00, emoji: '🍌', available: true }
            ]
        },
        toppings: {
            name: 'Toppings',
            emoji: '🍪',
            items: [
                { id: 'add-granola',    name: 'Granola',          price: 3.00, emoji: '🥣', available: true },
                { id: 'add-oreo',       name: 'Oreo',             price: 3.00, emoji: '🍪', available: true },
                { id: 'add-confete',    name: 'Confete',          price: 2.00, emoji: '🎉', available: true },
                { id: 'add-condensado', name: 'Leite Condensado', price: 3.00, emoji: '🥛', available: true },
                { id: 'add-chocolate',  name: 'Chocolate',        price: 3.00, emoji: '🍫', available: true }
            ]
        }
    },

    // ============================================
    // PASSO 6: BEBIDAS
    // ============================================
    bebidas: [
        { id: 'agua',          name: 'Água',          price: 3.00, emoji: '💧', available: true },
        { id: 'agua-gas',      name: 'Água com Gás',  price: 4.00, emoji: '🫧', available: true }
    ],

    // ============================================
    // DESTAQUES (home page)
    // ============================================
    highlights: [
        { baseId: 'ninho', saborId: 'ninho',          label: 'Mais Pedido' },
        { baseId: 'ninho', saborId: 'morango',        label: 'Clássico' },
        { baseId: 'ninho', saborId: 'ninho-morango',  label: 'Favorito' },
        { baseId: 'ninho', saborId: 'nutella',        label: 'Cremoso' },
        { baseId: 'ninho', saborId: 'oreo',           label: 'Crocante' }
    ]
};
