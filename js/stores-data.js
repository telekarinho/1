/**
 * MilkyPot - Centralized Store Data
 *
 * Single source of truth for all store/franchise information.
 * Import this file before any script that needs store data.
 */

// Replace placeholder WhatsApp numbers below with real numbers before going to production.
var MILKYPOT_STORES = [
    {
        id: 'ibirapuera',
        name: 'MilkyPot Shopping Ibirapuera',
        address: 'Av. Ibirapuera, 3103 - Moema, São Paulo - SP',
        rating: 4.9,
        deliveryTime: '20-35 min',
        deliveryFee: 5.90,
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5511999990001', // TODO: substituir pelo número real
        lat: -23.6092,
        lng: -46.6654
    },
    {
        id: 'morumbi',
        name: 'MilkyPot Shopping Morumbi',
        address: 'Av. Roque Petroni Jr, 1089 - Morumbi, São Paulo - SP',
        rating: 4.8,
        deliveryTime: '25-40 min',
        deliveryFee: 6.90,
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5511999990002', // TODO: substituir pelo número real
        lat: -23.6233,
        lng: -46.6984
    },
    {
        id: 'jardins',
        name: 'MilkyPot Jardins',
        address: 'Rua Oscar Freire, 725 - Jardins, São Paulo - SP',
        rating: 4.9,
        deliveryTime: '15-25 min',
        deliveryFee: 4.90,
        hours: '09:00 - 23:00',
        open: true,
        whatsapp: '5511999990003', // TODO: substituir pelo número real
        lat: -23.5631,
        lng: -46.6699
    },
    {
        id: 'barra',
        name: 'MilkyPot Barra Shopping',
        address: 'Av. das Américas, 4666 - Barra, Rio de Janeiro - RJ',
        rating: 4.7,
        deliveryTime: '25-40 min',
        deliveryFee: 7.90,
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5521999990004', // TODO: substituir pelo número real
        lat: -22.9994,
        lng: -43.3632
    },
    {
        id: 'curitiba',
        name: 'MilkyPot Curitiba - Batel',
        address: 'Av. do Batel, 1868 - Batel, Curitiba - PR',
        rating: 4.8,
        deliveryTime: '20-30 min',
        deliveryFee: 5.50,
        hours: '10:00 - 21:00',
        open: false,
        whatsapp: '5541999990005', // TODO: substituir pelo número real
        lat: -25.4369,
        lng: -49.2889
    },
    {
        id: 'recife',
        name: 'MilkyPot Shopping Recife',
        address: 'R. Padre Carapuceiro, 777 - Boa Viagem, Recife - PE',
        rating: 4.9,
        deliveryTime: '20-35 min',
        deliveryFee: 5.00,
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5581999990006', // TODO: substituir pelo número real
        lat: -8.1184,
        lng: -34.9046
    },
    {
        id: 'muffato-londrina',
        name: 'MilkyPot Muffato Londrina',
        address: 'Av. Quintino Bocaiuva, 1045 - Londrina - PR',
        rating: 5.0,
        deliveryTime: '15-40 min',
        deliveryFee: 5.00,
        hours: '14:00 - 23:00',
        open: true,
        whatsapp: '5543998042424',
        lat: -23.3045,
        lng: -51.1696
    }
];
