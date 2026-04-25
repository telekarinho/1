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
        deliveryEnabled: true,  // toggle controlado em painel/configuracoes.html
        hours: '10:00 - 22:00',
        open: true,
        whatsapp: '5543998042424',
        email: 'milkypot.com@gmail.com',
        lat: -23.3265,
        lng: -51.1664
    }
];

// Mescla com franchises do DataStore (fonte de verdade no painel)
// para que o cardápio respeite o toggle deliveryEnabled em tempo real.
(function mergeFranchiseFlags() {
    try {
        if (typeof DataStore === 'undefined' || !DataStore.getAllFranchises) return;
        var dsFranchises = DataStore.getAllFranchises() || [];
        MILKYPOT_STORES.forEach(function(s) {
            var f = dsFranchises.find(function(d) { return d.id === s.id; });
            if (f) {
                if (typeof f.deliveryEnabled === 'boolean') s.deliveryEnabled = f.deliveryEnabled;
                if (typeof f.deliveryFee === 'number') s.deliveryFee = f.deliveryFee;
                if (f.hours) s.hours = f.hours;
                if (f.deliveryTime) s.deliveryTime = f.deliveryTime;
            }
        });
    } catch(e) {}
})();
