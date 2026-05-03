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
        lng: -51.1664,
        // FIX (Fase 8.6): flag pro cardápio saber que essa loja calcula frete
        // dinamicamente via Uber Direct. Quando true, modal "Entrega" mostra
        // 'Calculado pela Uber ao informar endereço' em vez do fee fixo.
        uberDirectEnabled: true
    },
    {
        // Franquia TESTE — espelha dados REAIS da Muffato Quintino
        // (mesmo endereco, mesmo telefone, mesma cobertura) pra
        // simular pedidos reais. So muda o id/slug -> pedidos vao pra
        // orders_franquia-teste (separado) sem misturar com producao.
        // Login no painel: teste@teste.com / Teste@123
        id: 'franquia-teste',
        slug: 'franquia-teste',
        name: 'MilkyPot TESTE (Demo)',
        address: 'Rua Quintino Bocaiúva, 1045',
        city: 'Londrina',
        state: 'PR',
        rating: 5,
        deliveryTime: '20-35 min',
        deliveryFee: 5.90,
        deliveryEnabled: true,
        pickupEnabled: true,
        storeOnlineOpen: true,
        hours: '00:00 - 23:59',
        open: true,
        whatsapp: '5543998042424',
        email: 'teste@teste.com',
        isTestFranchise: true,
        lat: -23.3265,
        lng: -51.1664,
        uberDirectEnabled: true
    }
];

// Mescla com franchises do DataStore (fonte de verdade no painel)
// para que o cardápio respeite o toggle deliveryEnabled em tempo real.
function mergeFranchiseFlags() {
    try {
        if (typeof DataStore === 'undefined' || !DataStore.getAllFranchises) return;
        var dsFranchises = DataStore.getAllFranchises() || [];
        MILKYPOT_STORES.forEach(function(s) {
            var f = dsFranchises.find(function(d) { return d.id === s.id; });
            if (f) {
                // Loja aberta/fechada (master toggle — bloqueia tudo quando false)
                if (typeof f.storeOnlineOpen === 'boolean') s.open = f.storeOnlineOpen;
                // Delivery e retirada independentes
                if (typeof f.deliveryEnabled === 'boolean') s.deliveryEnabled = f.deliveryEnabled;
                if (typeof f.pickupEnabled === 'boolean') s.pickupEnabled = f.pickupEnabled;
                // Dados operacionais
                if (typeof f.deliveryFee === 'number') s.deliveryFee = f.deliveryFee;
                if (f.hours) s.hours = f.hours;
                if (f.deliveryTime) s.deliveryTime = f.deliveryTime;
                // FIX (Fase 8.6): propaga flag de Uber se franchise tiver
                if (typeof f.uberDirectEnabled === 'boolean') s.uberDirectEnabled = f.uberDirectEnabled;
            }
        });
    } catch(e) {}
}

// Roda imediatamente (localStorage já carregado)
mergeFranchiseFlags();

// Re-roda após o Firestore sincronizar — garante que o toggle do admin
// (deliveryEnabled salvo no Firestore) seja respeitado em tempo real,
// mesmo que o sync termine depois que stores-data.js já rodou.
if (typeof window !== 'undefined') {
    window.addEventListener('mp_synced', function() {
        mergeFranchiseFlags();
        // Notifica o cardápio para re-verificar a opção de delivery
        // caso o cliente já tenha selecionado uma loja.
        window.dispatchEvent(new CustomEvent('mp_stores_updated'));
    });
}
