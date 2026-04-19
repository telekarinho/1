/**
 * MilkyPot - Centralized Store Data
 *
 * IMPORTANTE: Este arquivo é FALLBACK offline.
 * A fonte de verdade é o Firestore (coleção `franchises`) — editada via painel admin.
 * Landing/cardápio devem ler do Firestore primeiro e cair neste fallback só em erro.
 *
 * Hoje existe APENAS a unidade Muffato Quintino (Londrina - PR).
 * Novas unidades devem ser criadas no painel admin; nunca hardcoded aqui.
 */

var MILKYPOT_STORES = [
    {
        id: 'muffato-quintino',
        slug: 'muffato-quintino',
        name: 'MilkyPot Muffato Quintino',
        address: 'Quintino, Londrina - PR',
        city: 'Londrina',
        state: 'PR',
        rating: 5,
        deliveryTime: '25-40 min',
        deliveryFee: 5.90,
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5543998042424',
        email: 'milkypot.com@gmail.com',
        lat: -23.3265,
        lng: -51.1664
    }
];
