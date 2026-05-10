/**
 * MilkyPot — Raspinha Engine
 * Engine compartilhada de geração de raspadinha pra PDV (loja) e checkout (delivery).
 * Sempre gera raspinha JUNTO COM O PAGAMENTO (impressão fiscal/não-fiscal no PDV ou
 * confirmação do carrinho no delivery).
 *
 * Uso:
 *   var result = RaspinhaEngine.generate({
 *       franchiseId: 'muffato-quintino',
 *       customerName: 'Rodrigo',
 *       customerPhone: '43998042424',
 *       orderTotal: 18.50,
 *       generatedBy: 'order'  // ou 'redeem_loop'
 *   });
 *   // result = { scratch: {...}, skipped: false } ou { scratch: null, skipped: true, reason: '...' }
 */
(function(global){
    'use strict';

    // Calibragem behavioral (Behavioral Nudge Engine + Growth Hacker agents)
    // NONE 42% · SMALL 35% · MEDIUM 18% · BIG 4.3% · MEGA 0.7%
    var DEFAULT_SCRATCH_PRIZES = [
        {code:'RSP_TRY_AGAIN', name:'Quase! Faltou 1 milímetro',
         desc:'Aí, aí... passou raspando! Próximo pedido a sorte vira.',
         prob:42, cost:0, validity:0, scope:'any', minOrder:0, tier:'none', categoria:null,
         copyVariants:[
            'Aí, aí... passou raspando! Próximo pedido a sorte vira.',
            'Ó, escapou por POUCO. A ovelhinha tá guardando algo bom pra próxima.',
            'Quase! Esse não foi seu prêmio... mas tem outra raspadinha te esperando no próximo potinho.'
         ]},
        {code:'RSP_TOPPING_FREE', name:'1 Topping Grátis',
         desc:'Escolhe 1 topping da casa pro próximo milkshake, sundae ou potinho.',
         prob:22, cost:0.80, validity:5, scope:'same', minOrder:15, tier:'small', categoria:'cat_milkshake,cat_sundae,cat_potinho,cat_acai'},
        {code:'RSP_UPSIZE', name:'Upgrade Grátis P→M ou M→G',
         desc:'Pediu Milkshake/Sundae P? Leva M. Pediu M? Leva G.',
         prob:13, cost:5, validity:5, scope:'same', minOrder:15, tier:'small', categoria:'cat_milkshake,cat_sundae'},
        {code:'RSP_DISC_5', name:'R$ 5 OFF acima de R$ 20',
         desc:'R$ 5 de desconto no próximo pedido (mínimo R$ 20).',
         prob:8, cost:5, validity:5, scope:'any', minOrder:20, tier:'medium', categoria:null},
        {code:'RSP_2BY1_TOPPING', name:'Toppings 2 por 1',
         desc:'Escolhe 2 toppings, paga só 1.',
         prob:5, cost:1.50, validity:5, scope:'same', minOrder:15, tier:'medium', categoria:'cat_milkshake,cat_sundae,cat_potinho'},
        {code:'RSP_BUFFET_100G', name:'+100g de Buffet Grátis',
         desc:'No próximo buffet a granel, ganha 100g extras na pesagem.',
         prob:3, cost:6, validity:5, scope:'same', minOrder:0, tier:'medium', categoria:'cat_buffet'},
        {code:'RSP_PICOLE_2BY1', name:'Picolés 2 por 1',
         desc:'Pediu 1 picolé? Leva 2. Misture os 22 sabores que quiser.',
         prob:2, cost:2.60, validity:5, scope:'same', minOrder:0, tier:'medium', categoria:'cat_picole'},
        {code:'RSP_SHAKE_P_FREE', name:'Milkshake P Grátis',
         desc:'Milkshake P 250ml de qualquer sabor da casa GRÁTIS.',
         prob:3.3, cost:9.99, validity:5, scope:'same', minOrder:15, tier:'big', categoria:'cat_milkshake'},
        {code:'RSP_SUNDAE_P_FREE', name:'Sundae P Grátis',
         desc:'Sundae P 250ml de qualquer sabor da casa GRÁTIS.',
         prob:1, cost:9.99, validity:5, scope:'same', minOrder:15, tier:'big', categoria:'cat_sundae'},
        {code:'RSP_CAPITAO_50', name:'50% OFF no Capitão Açaí',
         desc:'O Premium 600ml por metade do preço (R$ 12,49).',
         prob:0.5, cost:12.50, validity:5, scope:'same', minOrder:0, tier:'mega', categoria:'cat_milkshake,cat_sundae'},
        {code:'RSP_MEGA_50', name:'MEGA R$ 50 em créditos',
         desc:'R$ 50 em créditos MilkyPot pra usar em até 7 dias.',
         prob:0.2, cost:50, validity:7, scope:'any', minOrder:0, tier:'mega', categoria:null}
    ];

    var DEFAULT_CONFIG = {
        enabled: true,
        cooldownMinutes: 90,
        minTicketForLoop: 15,
        loopOnRedeem: true,
        defaultValidityDays: 5
    };

    // ─────────────────────────────────────────────────
    function getStore(fid){
        return (global.DataStore && global.DataStore.get) ? global.DataStore : {
            get: function(k){ try { return JSON.parse(localStorage.getItem('mp_' + k)); } catch(e){ return null; } },
            set: function(k,v){ try { localStorage.setItem('mp_' + k, JSON.stringify(v)); } catch(e){} }
        };
    }

    function getPrizes(fid){
        var store = getStore(fid);
        var custom = store.get('scratch_prizes_' + fid);
        if (custom && custom.length) {
            return DEFAULT_SCRATCH_PRIZES.map(function(def){
                var found = custom.find(function(p){ return p.code === def.code; });
                return Object.assign({}, def, found || {});
            });
        }
        return DEFAULT_SCRATCH_PRIZES.slice();
    }

    function getConfig(fid){
        var store = getStore(fid);
        return Object.assign({}, DEFAULT_CONFIG, store.get('scratch_config_' + fid) || {});
    }

    function rollPrize(fid){
        var prizes = getPrizes(fid).filter(function(p){ return !p.disabled; });
        var totalProb = prizes.reduce(function(s,p){ return s + p.prob; }, 0);
        var r = Math.random() * totalProb;
        var acc = 0;
        for (var i=0; i<prizes.length; i++){
            acc += prizes[i].prob;
            if (r <= acc) return prizes[i];
        }
        return prizes[0];
    }

    function pickNearMissCopy(prize){
        if (!prize || prize.tier !== 'none') return prize.desc;
        if (!Array.isArray(prize.copyVariants) || !prize.copyVariants.length) return prize.desc;
        return prize.copyVariants[Math.floor(Math.random() * prize.copyVariants.length)];
    }

    function nanoId(n){
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var out = '';
        for (var i=0; i<n; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
        return out;
    }

    function buildCode(fid){
        var d = new Date();
        var ymd = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
        return 'MKP-' + (fid || 'XXX').toUpperCase().slice(0,4).padEnd(4,'X') + '-' + ymd + '-' + nanoId(8);
    }

    function buildShortCode(){
        return nanoId(3) + '-' + nanoId(3);
    }

    function isInCooldown(fid, customerKey){
        if (!customerKey) return false;
        var cfg = getConfig(fid);
        var store = getStore(fid);
        var arr = store.get('scratches_' + fid) || [];
        var last = arr.filter(function(s){ return s.customerKey === customerKey; })
                      .sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); })[0];
        if (!last) return false;
        var elapsed = Date.now() - new Date(last.createdAt).getTime();
        return elapsed < (cfg.cooldownMinutes || 90) * 60 * 1000;
    }

    function shouldEmit(fid, orderTotal, customerKey){
        var cfg = getConfig(fid);
        if (!cfg.enabled) return { ok:false, reason:'sistema desativado' };
        if (orderTotal < (cfg.minTicketForLoop || 15)) {
            return { ok:false, reason:'ticket abaixo do mínimo R$' + (cfg.minTicketForLoop || 15) };
        }
        if (isInCooldown(fid, customerKey)) {
            return { ok:false, reason:'cooldown ativo (' + (cfg.cooldownMinutes || 90) + ' min)' };
        }
        return { ok:true };
    }

    function saveScratch(fid, scratch){
        var store = getStore(fid);
        var key = 'scratches_' + fid;
        var arr = store.get(key) || [];
        arr.push(scratch);
        store.set(key, arr);
        // Sync Firestore (best-effort)
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                firebase.firestore().collection('scratches').doc(scratch.code).set(scratch);
            }
        } catch(e) { console.warn('[Raspinha] firestore save', e); }
    }

    function normalizeCustomerKey(phone, name){
        var p = (phone || '').replace(/\D/g, '').slice(-11);
        return p || (name || '').trim().toLowerCase().slice(0, 30) || null;
    }

    /**
     * Gera uma raspadinha. Roda no momento do pagamento (PDV ou delivery).
     */
    function generate(opts){
        opts = opts || {};
        var fid = opts.franchiseId;
        if (!fid) return { scratch:null, skipped:true, reason:'sem franchiseId' };

        var customerKey = normalizeCustomerKey(opts.customerPhone, opts.customerName);
        var orderTotal = Number(opts.orderTotal || 0);

        // Loop on redeem ignora cooldown (é recompensa do resgate)
        var bypassCooldown = opts.generatedBy === 'redeem_loop';

        if (!bypassCooldown) {
            var check = shouldEmit(fid, orderTotal, customerKey);
            if (!check.ok) {
                console.info('[Raspinha] não emitida:', check.reason);
                return { scratch:null, skipped:true, reason:check.reason };
            }
        }

        var prize = rollPrize(fid);
        var prizeDesc = pickNearMissCopy(prize) || prize.desc;
        var cfg = getConfig(fid);
        var validityDays = prize.validity > 0 ? prize.validity : (prize.tier === 'none' ? 0 : (cfg.defaultValidityDays || 5));
        var createdAt = new Date();
        var expiresAt = validityDays > 0
            ? new Date(createdAt.getTime() + validityDays * 86400000).toISOString()
            : null;

        var scratch = {
            code: buildCode(fid),
            shortCode: buildShortCode(),
            franchiseId: fid,
            storeName: opts.storeName || 'MilkyPot',
            prizeCode: prize.code,
            prizeName: prize.name,
            prizeDesc: prizeDesc,
            prizeTier: prize.tier,
            prizeScope: prize.scope,
            prizeCategoria: prize.categoria || null,
            minOrder: prize.minOrder,
            customerName: opts.customerName || '',
            customerPhone: opts.customerPhone || '',
            customerKey: customerKey,
            orderTotal: orderTotal,
            orderId: opts.orderId || null,
            orderSource: opts.orderSource || 'pdv',  // 'pdv' ou 'delivery'
            status: 'not_scratched',
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt,
            validityDays: validityDays,
            scratchedAt: null, redeemedAt: null,
            redeemedStoreId: null, redeemedEmployeeId: null, redeemedOrderId: null,
            sharedOnInstagram: false, instagramBonusGranted: false,
            generatedBy: opts.generatedBy || 'order',
            loopFromCode: opts.loopFromCode || null
        };

        saveScratch(fid, scratch);
        return { scratch:scratch, skipped:false };
    }

    global.RaspinhaEngine = {
        generate: generate,
        getPrizes: getPrizes,
        getConfig: getConfig,
        rollPrize: rollPrize,
        pickNearMissCopy: pickNearMissCopy,
        shouldEmit: shouldEmit,
        normalizeCustomerKey: normalizeCustomerKey,
        DEFAULT_PRIZES: DEFAULT_SCRATCH_PRIZES
    };
})(typeof window !== 'undefined' ? window : this);
