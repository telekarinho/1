/* ============================================
   MilkyPot - Cardápio Data (Admin-Editable)
   ============================================

   INSTRUÇÕES PARA O ADMIN:
   - Edite nomes, descrições, preços e disponibilidade
   - Para desativar um produto: available: false
   - Para desativar um extra: available: false
   - Para alterar preços de tamanhos, edite o array "sizes"
   - Cada franquia pode ter configs próprias no futuro
   ============================================ */

const CARDAPIO_CONFIG = {
    // Configuração da franquia atual
    storeId: null, // será preenchido ao selecionar loja
    storeName: '',

    // Tipos de produto (categorias principais)
    types: [
        {
            id: 'milkshake',
            name: 'Milkshake',
            emoji: '🥤',
            color: '#F8B4D9',
            gradient: 'linear-gradient(135deg, #FFE0EE 0%, #F0DBFF 100%)',
            shortDesc: 'Batido na máquina, gelado e super cremoso.',
            icon: '🥤',
            order: 1,
            available: true
        },
        {
            id: 'cremoso',
            name: 'Cremoso no Copo',
            emoji: '🍨',
            color: '#D4A5FF',
            gradient: 'linear-gradient(135deg, #F0DBFF 0%, #E4F0FC 100%)',
            shortDesc: 'Sorvete montado no copo com cremes e coberturas.',
            icon: '🍨',
            order: 2,
            available: true
        },
        {
            id: 'acai',
            name: 'Açaí',
            emoji: '🫐',
            color: '#7B4EA8',
            gradient: 'linear-gradient(135deg, #E0D0F8 0%, #C8A8E8 100%)',
            shortDesc: 'Açaí cremoso com combinações deliciosas.',
            icon: '🫐',
            order: 3,
            available: true
        },
        {
            id: 'zero',
            name: 'Zero / Proteico',
            emoji: '💪',
            color: '#4CAF50',
            gradient: 'linear-gradient(135deg, #D0FFE8 0%, #C8F0DC 100%)',
            shortDesc: 'Opções sem açúcar e com proteína.',
            icon: '💪',
            order: 4,
            available: true
        }
    ],

    // Tamanhos padrão (preços por tipo)
    sizes: {
        milkshake: [
            { id: 'mini',    name: 'Mini',    ml: 180, price: 12.90, available: true },
            { id: 'pequeno', name: 'Pequeno', ml: 300, price: 16.90, available: true },
            { id: 'medio',   name: 'Médio',   ml: 500, price: 22.90, available: true },
            { id: 'gigante', name: 'Gigante', ml: 700, price: 28.90, available: true }
        ],
        cremoso: [
            { id: 'mini',    name: 'Mini',    ml: 180, price: 11.90, available: true },
            { id: 'pequeno', name: 'Pequeno', ml: 300, price: 15.90, available: true },
            { id: 'medio',   name: 'Médio',   ml: 500, price: 21.90, available: true },
            { id: 'gigante', name: 'Gigante', ml: 700, price: 27.90, available: true }
        ],
        acai: [
            { id: 'mini',    name: 'Mini',    ml: 180, price: 13.90, available: true },
            { id: 'pequeno', name: 'Pequeno', ml: 300, price: 18.90, available: true },
            { id: 'medio',   name: 'Médio',   ml: 500, price: 25.90, available: true },
            { id: 'gigante', name: 'Gigante', ml: 700, price: 32.90, available: true }
        ],
        zero: [
            { id: 'mini',    name: 'Mini',    ml: 180, price: 14.90, available: true },
            { id: 'pequeno', name: 'Pequeno', ml: 300, price: 19.90, available: true },
            { id: 'medio',   name: 'Médio',   ml: 500, price: 26.90, available: true },
            { id: 'gigante', name: 'Gigante', ml: 700, price: 34.90, available: true }
        ]
    },

    // Sabores por tipo
    flavors: {
        milkshake: [
            {
                id: 'nevinha',
                name: 'Nevinha',
                desc: 'Milkshake de sorvete cremoso com creme de leite Ninho e leite em pó por cima.',
                emoji: '☁️',
                badge: 'Mais Pedido',
                badgeColor: '#E87AB0',
                highlight: true,
                available: true
            },
            {
                id: 'ovelha-negra',
                name: 'Ovelha Negra',
                desc: 'Milkshake de sorvete cremoso com Nutella.',
                emoji: '🐑',
                badge: 'Cremoso',
                badgeColor: '#8B4513',
                highlight: true,
                available: true
            },
            {
                id: 'flocos-rebanho',
                name: 'Flocos do Rebanho',
                desc: 'Milkshake de sorvete cremoso com creme de Ninho e pedaços de Oreo.',
                emoji: '🍪',
                badge: null,
                highlight: false,
                available: true
            },
            {
                id: 'campo-doce',
                name: 'Campo Doce',
                desc: 'Milkshake de sorvete cremoso com creme de Ninho e morango.',
                emoji: '🍓',
                badge: null,
                highlight: false,
                available: true
            }
        ],
        cremoso: [
            {
                id: 'nuvem-doce',
                name: 'Nuvem Doce',
                desc: 'Sorvete no copo com creme de leite Ninho e leite em pó.',
                emoji: '☁️',
                badge: 'Mais Pedido',
                badgeColor: '#E87AB0',
                highlight: true,
                available: true
            },
            {
                id: 'choco-nuvem',
                name: 'Choco Nuvem',
                desc: 'Sorvete no copo com Nutella.',
                emoji: '🍫',
                badge: 'Cremoso',
                badgeColor: '#8B4513',
                highlight: false,
                available: true
            },
            {
                id: 'ovelhinha',
                name: 'Ovelhinha',
                desc: 'Sorvete no copo com Oreo.',
                emoji: '🐑',
                badge: 'Infantil',
                badgeColor: '#D4A5FF',
                highlight: false,
                available: true
            },
            {
                id: 'doce-pastinho',
                name: 'Doce Pastinho',
                desc: 'Sorvete no copo com creme de Ninho e morango.',
                emoji: '🌿',
                badge: null,
                highlight: false,
                available: true
            }
        ],
        acai: [
            {
                id: 'acai-ninho',
                name: 'Açaí Ninho',
                desc: 'Açaí com creme de leite Ninho e leite em pó.',
                emoji: '🥛',
                badge: 'Mais Pedido',
                badgeColor: '#7B4EA8',
                highlight: true,
                available: true
            },
            {
                id: 'acai-banana',
                name: 'Açaí Banana',
                desc: 'Açaí com banana e granola.',
                emoji: '🍌',
                badge: null,
                highlight: false,
                available: true
            },
            {
                id: 'acai-nutella',
                name: 'Açaí Nutella',
                desc: 'Açaí com Nutella.',
                emoji: '🍫',
                badge: 'Cremoso',
                badgeColor: '#8B4513',
                highlight: false,
                available: true
            },
            {
                id: 'acai-proteico',
                name: 'Açaí Proteico',
                desc: 'Açaí com banana e whey.',
                emoji: '💪',
                badge: 'Proteico',
                badgeColor: '#4CAF50',
                highlight: false,
                available: true
            }
        ],
        zero: [
            {
                id: 'fit-baunilha',
                name: 'Fit Baunilha',
                desc: 'Sorvete zero açúcar com calda baunilha zero.',
                emoji: '🍦',
                badge: 'Zero Açúcar',
                badgeColor: '#4CAF50',
                highlight: false,
                available: true
            },
            {
                id: 'proteico',
                name: 'Proteico',
                desc: 'Sorvete zero com whey protein.',
                emoji: '💪',
                badge: 'Proteico',
                badgeColor: '#2196F3',
                highlight: true,
                available: true
            },
            {
                id: 'proteico-amendoim',
                name: 'Proteico Amendoim',
                desc: 'Sorvete zero com pasta de amendoim e whey.',
                emoji: '🥜',
                badge: 'Mais Pedido',
                badgeColor: '#E87AB0',
                highlight: true,
                available: true
            },
            {
                id: 'zero-ninho-fit',
                name: 'Zero Ninho Fit',
                desc: 'Sorvete zero com creme zero e leite em pó zero.',
                emoji: '☁️',
                badge: 'Zero Açúcar',
                badgeColor: '#4CAF50',
                highlight: false,
                available: true
            }
        ]
    },

    // Extras organizados por categoria
    extras: {
        bordas: {
            name: 'Bordas',
            emoji: '🔵',
            items: [
                { id: 'borda-nutella',  name: 'Borda de Nutella',         price: 5.90, emoji: '🍫', available: true },
                { id: 'borda-ninho',    name: 'Borda de Creme de Ninho',  price: 5.90, emoji: '☁️', available: true }
            ]
        },
        cremes: {
            name: 'Cremes',
            emoji: '🍯',
            items: [
                { id: 'nutella',        name: 'Nutella',                  price: 4.90, emoji: '🍫', available: true },
                { id: 'creme-ninho',    name: 'Creme de Ninho',           price: 4.90, emoji: '☁️', available: true }
            ]
        },
        frutas: {
            name: 'Frutas',
            emoji: '🍓',
            items: [
                { id: 'morango',        name: 'Morango',                  price: 3.90, emoji: '🍓', available: true },
                { id: 'banana',         name: 'Banana',                   price: 2.90, emoji: '🍌', available: true }
            ]
        },
        crocantes: {
            name: 'Crocantes',
            emoji: '🍪',
            items: [
                { id: 'oreo',           name: 'Oreo',                     price: 3.90, emoji: '🍪', available: true },
                { id: 'granola',        name: 'Granola',                  price: 2.90, emoji: '🥣', available: true }
            ]
        },
        proteinas: {
            name: 'Proteínas',
            emoji: '💪',
            items: [
                { id: 'pasta-amendoim', name: 'Pasta de Amendoim',        price: 4.90, emoji: '🥜', available: true },
                { id: 'whey',           name: 'Whey Protein',             price: 5.90, emoji: '💪', available: true }
            ]
        }
    },

    // Destaques (campeões de venda - IDs dos sabores)
    highlights: [
        { typeId: 'milkshake', flavorId: 'nevinha',           label: 'Milkshake' },
        { typeId: 'milkshake', flavorId: 'ovelha-negra',     label: 'Milkshake' },
        { typeId: 'acai',      flavorId: 'acai-ninho',       label: 'Açaí' },
        { typeId: 'zero',      flavorId: 'proteico-amendoim', label: 'Proteico' }
    ]
};
