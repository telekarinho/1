/* ============================================
   MilkyPot - Data Store
   ============================================ */

const STORES = [
    {
        id: 1,
        name: "MilkyPot Shopping Ibirapuera",
        address: "Av. Ibirapuera, 3103 - Moema, São Paulo - SP",
        city: "São Paulo",
        state: "SP",
        cep: "04029-200",
        phone: "(11) 3456-7890",
        rating: 4.9,
        deliveryTime: "20-35 min",
        deliveryFee: 5.90,
        open: true,
        hours: "10:00 - 22:00",
        type: "store",
        lat: -23.6100,
        lng: -46.6658
    },
    {
        id: 2,
        name: "MilkyPot Shopping Morumbi",
        address: "Av. Roque Petroni Jr, 1089 - Morumbi, São Paulo - SP",
        city: "São Paulo",
        state: "SP",
        cep: "04707-900",
        phone: "(11) 3456-7891",
        rating: 4.8,
        deliveryTime: "25-40 min",
        deliveryFee: 6.90,
        open: true,
        hours: "10:00 - 22:00",
        type: "store",
        lat: -23.6233,
        lng: -46.6975
    },
    {
        id: 3,
        name: "MilkyPot Jardins",
        address: "Rua Oscar Freire, 725 - Jardins, São Paulo - SP",
        city: "São Paulo",
        state: "SP",
        cep: "01426-001",
        phone: "(11) 3456-7892",
        rating: 4.9,
        deliveryTime: "15-25 min",
        deliveryFee: 4.90,
        open: true,
        hours: "09:00 - 23:00",
        type: "mega",
        lat: -23.5618,
        lng: -46.6698
    },
    {
        id: 4,
        name: "MilkyPot Barra Shopping",
        address: "Av. das Américas, 4666 - Barra, Rio de Janeiro - RJ",
        city: "Rio de Janeiro",
        state: "RJ",
        cep: "22640-102",
        phone: "(21) 3456-7893",
        rating: 4.7,
        deliveryTime: "25-40 min",
        deliveryFee: 7.90,
        open: true,
        hours: "10:00 - 22:00",
        type: "store",
        lat: -22.9998,
        lng: -43.3652
    },
    {
        id: 5,
        name: "MilkyPot Curitiba - Batel",
        address: "Av. do Batel, 1868 - Batel, Curitiba - PR",
        city: "Curitiba",
        state: "PR",
        cep: "80420-090",
        phone: "(41) 3456-7894",
        rating: 4.8,
        deliveryTime: "20-30 min",
        deliveryFee: 5.50,
        open: false,
        hours: "10:00 - 21:00",
        type: "store",
        lat: -25.4412,
        lng: -49.2918
    },
    {
        id: 6,
        name: "MilkyPot Shopping Recife",
        address: "R. Padre Carapuceiro, 777 - Boa Viagem, Recife - PE",
        city: "Recife",
        state: "PE",
        cep: "51020-280",
        phone: "(81) 3456-7895",
        rating: 4.9,
        deliveryTime: "20-35 min",
        deliveryFee: 5.00,
        open: true,
        hours: "10:00 - 22:00",
        type: "express",
        lat: -8.1186,
        lng: -34.9056
    },
    {
        id: 7,
        name: "MilkyPot BH - Savassi",
        address: "Av. do Contorno, 6061 - Savassi, Belo Horizonte - MG",
        city: "Belo Horizonte",
        state: "MG",
        cep: "30110-060",
        phone: "(31) 3456-7896",
        rating: 4.8,
        deliveryTime: "20-30 min",
        deliveryFee: 5.90,
        open: true,
        hours: "10:00 - 22:00",
        type: "store",
        lat: -19.9354,
        lng: -43.9346
    },
    {
        id: 8,
        name: "MilkyPot Floripa - Centro",
        address: "Rua Felipe Schmidt, 515 - Centro, Florianópolis - SC",
        city: "Florianópolis",
        state: "SC",
        cep: "88010-001",
        phone: "(48) 3456-7897",
        rating: 4.7,
        deliveryTime: "25-40 min",
        deliveryFee: 6.50,
        open: true,
        hours: "10:00 - 21:00",
        type: "express",
        lat: -27.5954,
        lng: -48.5480
    }
];

const PRODUCTS = [
    // Potinhos
    {
        id: 1,
        name: "Potinho Arco-Íris",
        desc: "Sorvete de baunilha com calda colorida, granulado e confetes de chocolate",
        price: 24.90,
        originalPrice: 29.90,
        category: "potinhos",
        emoji: "🍨",
        badge: "Mais Vendido",
        popular: true
    },
    {
        id: 2,
        name: "Potinho Nuvem de Morango",
        desc: "Creme de morango com chantilly, morangos frescos e calda rosa",
        price: 22.90,
        category: "potinhos",
        emoji: "🍓",
        popular: true
    },
    {
        id: 3,
        name: "Potinho Brigadeiro Mágico",
        desc: "Brigadeiro cremoso com granulado belga, Nutella e leite ninho",
        price: 26.90,
        category: "potinhos",
        emoji: "🍫",
        badge: "Novo"
    },
    {
        id: 4,
        name: "Potinho Unicórnio",
        desc: "Mix de sorvetes coloridos com marshmallow, confeitos e calda de tutti-frutti",
        price: 28.90,
        category: "potinhos",
        emoji: "🦄",
        badge: "Especial"
    },
    {
        id: 5,
        name: "Potinho Cookie Monster",
        desc: "Sorvete de cookies com pedaços de cookie, calda de chocolate e chantilly",
        price: 25.90,
        category: "potinhos",
        emoji: "🍪"
    },
    {
        id: 6,
        name: "Potinho Doce de Leite",
        desc: "Doce de leite artesanal com nozes, farofa crocante e calda caramelo",
        price: 23.90,
        category: "potinhos",
        emoji: "🥛"
    },
    // Milkshakes
    {
        id: 7,
        name: "Milkshake Sonho Rosa",
        desc: "Milkshake de morango com chantilly, calda rosa e algodão doce",
        price: 19.90,
        category: "milkshakes",
        emoji: "🥤",
        popular: true
    },
    {
        id: 8,
        name: "Milkshake Ovomaltine",
        desc: "Milkshake cremoso com Ovomaltine crocante e calda de chocolate",
        price: 21.90,
        category: "milkshakes",
        emoji: "🥤"
    },
    {
        id: 9,
        name: "Milkshake Nutella Dream",
        desc: "Milkshake de Nutella com avelã, chantilly e calda extra de Nutella",
        price: 23.90,
        category: "milkshakes",
        emoji: "🥤",
        badge: "Top"
    },
    {
        id: 10,
        name: "Milkshake Beijinho",
        desc: "Milkshake de coco com leite condensado, coco ralado e cereja",
        price: 18.90,
        category: "milkshakes",
        emoji: "🥥"
    },
    // Açaí
    {
        id: 11,
        name: "Açaí MilkyPot 500ml",
        desc: "Açaí puro com banana, granola, leite ninho e mel",
        price: 27.90,
        category: "acai",
        emoji: "🫐",
        popular: true
    },
    {
        id: 12,
        name: "Açaí MilkyPot 700ml",
        desc: "Açaí puro com frutas da estação, granola, paçoca e leite condensado",
        price: 34.90,
        category: "acai",
        emoji: "🫐"
    },
    {
        id: 13,
        name: "Açaí Premium 500ml",
        desc: "Açaí com morango, kiwi, manga, granola artesanal e mel orgânico",
        price: 32.90,
        category: "acai",
        emoji: "🍇",
        badge: "Premium"
    },
    // Sorvetes
    {
        id: 14,
        name: "Casquinha Dupla",
        desc: "Duas bolas de sorvete na casquinha crocante. Escolha seus sabores!",
        price: 12.90,
        category: "sorvetes",
        emoji: "🍦"
    },
    {
        id: 15,
        name: "Sundae Caramelo",
        desc: "Sorvete de creme com calda de caramelo, castanhas e chantilly",
        price: 18.90,
        category: "sorvetes",
        emoji: "🍨"
    },
    {
        id: 16,
        name: "Banana Split MilkyPot",
        desc: "Banana com 3 bolas de sorvete, caldas, chantilly e cereja",
        price: 29.90,
        category: "sorvetes",
        emoji: "🍌",
        badge: "Clássico"
    },
    {
        id: 17,
        name: "Picolé Artesanal",
        desc: "Picolé artesanal nos sabores: frutas vermelhas, maracujá ou limão",
        price: 9.90,
        category: "sorvetes",
        emoji: "🍭"
    },
    // Especiais
    {
        id: 18,
        name: "Fondue de Chocolate",
        desc: "Fondue de chocolate belga com frutas, marshmallow e biscoitos",
        price: 49.90,
        category: "especiais",
        emoji: "🫕",
        badge: "Para Compartilhar"
    },
    {
        id: 19,
        name: "Waffle MilkyPot",
        desc: "Waffle crocante com sorvete, calda, frutas e chantilly",
        price: 32.90,
        category: "especiais",
        emoji: "🧇"
    },
    {
        id: 20,
        name: "Crepe de Nutella",
        desc: "Crepe fino recheado com Nutella, morango e sorvete",
        price: 28.90,
        category: "especiais",
        emoji: "🥞"
    },
    {
        id: 21,
        name: "Churros Recheado",
        desc: "Churros crocante recheado com doce de leite e cobertura de chocolate",
        price: 15.90,
        category: "especiais",
        emoji: "🥖"
    },
    // Combos
    {
        id: 22,
        name: "Combo Família Feliz",
        desc: "4 Potinhos médios + 1 Milkshake grande + 4 Picolés",
        price: 89.90,
        originalPrice: 119.60,
        category: "combos",
        emoji: "👨‍👩‍👧‍👦",
        badge: "Economia"
    },
    {
        id: 23,
        name: "Combo Casal",
        desc: "2 Potinhos grandes + 2 Milkshakes + Fondue para dividir",
        price: 99.90,
        originalPrice: 139.60,
        category: "combos",
        emoji: "💑",
        badge: "Romântico"
    },
    {
        id: 24,
        name: "Combo Kids",
        desc: "1 Potinho pequeno + 1 Milkshake mini + 1 Picolé + Brinde surpresa",
        price: 34.90,
        originalPrice: 44.70,
        category: "combos",
        emoji: "🧒",
        badge: "Com Brinde!"
    },
    {
        id: 25,
        name: "Combo Festa",
        desc: "10 Potinhos + 5 Milkshakes + Bolo de sorvete para 15 pessoas",
        price: 299.90,
        originalPrice: 399.00,
        category: "combos",
        emoji: "🎂",
        badge: "Festa"
    }
];

const CHAT_GREETINGS = [
    "Oii! Bem-vindo à MilkyPot! 🐑✨",
    "Eu sou a Lulú, a ovelhinha mais doce do mundo!",
    "Posso te ajudar a fazer seu pedido de um jeito super fácil! O que você gostaria?"
];

const CHAT_CATEGORIES_MSG = "Escolha uma categoria para ver os produtos:";
const CHAT_ADD_MORE = "Quer adicionar mais alguma coisa ao pedido?";
const CHAT_FINISH = "Perfeito! Quando quiser finalizar, é só me avisar! 😊";
