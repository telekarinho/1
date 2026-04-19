/* ============================================
   MilkyPot - Data Store
   ============================================ */

// Unidades ativas — fonte de verdade: Firestore via painel admin.
// Fallback offline: MILKYPOT_STORES (js/stores-data.js).
const STORES = (typeof MILKYPOT_STORES !== 'undefined')
    ? MILKYPOT_STORES.map(function(s, i) {
        return Object.assign(
            { id: i + 1, type: 'store', cep: '', phone: s.whatsapp || '' },
            s
        );
      })
    : [];

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
