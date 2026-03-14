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
    // ===== MILKYPOT NINHO - Clássicos =====
    {
        id: 1,
        name: "Shake de Ninho",
        desc: "Puro creme de leite Ninho batido na máquina, gelado e super cremoso.",
        price: 14.00,
        category: "ninho",
        emoji: "☁️",
        badge: "Mais Pedido",
        popular: true
    },
    {
        id: 2,
        name: "Shake de Morango",
        desc: "Calda e pedaços de morango com base cremosa de leite Ninho.",
        price: 14.00,
        category: "ninho",
        emoji: "🍓",
        badge: "Clássico",
        popular: true
    },
    {
        id: 3,
        name: "Shake Ninho com Morango",
        desc: "Creme de Ninho + calda de morango. O favorito da galera!",
        price: 14.00,
        category: "ninho",
        emoji: "🍓",
        badge: "Favorito",
        popular: true
    },
    {
        id: 4,
        name: "Shake de Nutella",
        desc: "Nutella cremosa generosa com base de leite Ninho.",
        price: 14.00,
        category: "ninho",
        emoji: "🍫",
        badge: "Cremoso",
        popular: true
    },
    {
        id: 5,
        name: "Shake de Oreo",
        desc: "Pedaços de Oreo triturado com base cremosa de leite Ninho.",
        price: 14.00,
        category: "ninho",
        emoji: "🍪",
        badge: "Crocante",
        popular: true
    },
    {
        id: 6,
        name: "Capuccino Cream",
        desc: "Creme de capuccino aveludado com base de leite Ninho.",
        price: 14.00,
        category: "ninho",
        emoji: "☕"
    },
    // ===== MILKYPOT NINHO - Adulto +18 =====
    {
        id: 7,
        name: "Amarula Cream",
        desc: "Shake cremoso com licor Amarula. Exclusivo +18.",
        price: 18.00,
        category: "adulto",
        emoji: "🥃",
        badge: "+18"
    },
    {
        id: 8,
        name: "Baileys Cream",
        desc: "Shake cremoso com licor Baileys. Exclusivo +18.",
        price: 18.00,
        category: "adulto",
        emoji: "🥃",
        badge: "+18"
    },
    // ===== MILKYPOT AÇAÍ =====
    {
        id: 9,
        name: "Açaí + Granola",
        desc: "Açaí puro e cremoso com granola crocante.",
        price: 14.00,
        category: "acai",
        emoji: "🥣",
        popular: true
    },
    {
        id: 10,
        name: "Açaí + Banana",
        desc: "Açaí cremoso com banana fatiada fresca.",
        price: 14.00,
        category: "acai",
        emoji: "🍌"
    },
    {
        id: 11,
        name: "Açaí + Morango",
        desc: "Açaí cremoso com morango fresco.",
        price: 14.00,
        category: "acai",
        emoji: "🍓"
    },
    // ===== MILKYPOT ZERO / FIT =====
    {
        id: 12,
        name: "Shake Whey",
        desc: "Shake zero açúcar com whey protein.",
        price: 14.00,
        category: "fit",
        emoji: "💪"
    },
    {
        id: 13,
        name: "Shake Banana + Whey",
        desc: "Banana com whey protein, zero açúcar.",
        price: 14.00,
        category: "fit",
        emoji: "🍌",
        badge: "Fit",
        popular: true
    },
    {
        id: 14,
        name: "Shake Pasta de Amendoim",
        desc: "Com pasta de amendoim, zero açúcar e proteico.",
        price: 14.00,
        category: "fit",
        emoji: "🥜"
    },
    // ===== SUNDAE GOURMET =====
    {
        id: 15,
        name: "Sundae de Morango",
        desc: "Montado no copo com camadas de cremes e cobertura de morango.",
        price: 18.00,
        category: "sundae",
        emoji: "🍨",
        badge: "Gourmet"
    },
    {
        id: 16,
        name: "Sundae de Nutella",
        desc: "Montado no copo com camadas de cremes e Nutella generosa.",
        price: 18.00,
        category: "sundae",
        emoji: "🍨"
    },
    {
        id: 17,
        name: "Sundae de Oreo",
        desc: "Montado no copo com camadas de cremes e Oreo triturado.",
        price: 18.00,
        category: "sundae",
        emoji: "🍨"
    },
    // ===== BEBIDAS =====
    {
        id: 18,
        name: "Água",
        desc: "Água mineral 500ml.",
        price: 3.00,
        category: "bebidas",
        emoji: "💧"
    },
    {
        id: 19,
        name: "Água com Gás",
        desc: "Água mineral com gás 500ml.",
        price: 4.00,
        category: "bebidas",
        emoji: "🫧"
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
