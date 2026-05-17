#!/usr/bin/env node
/**
 * MilkyPot — Atualiza premios da raspinha pra estrategia "comprou X, leva Y"
 *
 * Antes de gravar:
 *   1. BACKUP automatico em backups/scratch-prizes-<fid>-<timestamp>.json
 *   2. Print do BEFORE/AFTER em tabela
 *   3. Pede confirmacao (--yes pra pular)
 *
 * Uso:
 *   node autopilot/update-raspinha-prizes.js [franchiseId] [--yes]
 *
 * Default: muffato-quintino
 *
 * REGRA #0 anti-regressao: backup OBRIGATORIO antes da gravacao.
 * Pra reverter: copia o JSON do backup pra Firestore via outro script.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const fid = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : 'muffato-quintino';
const autoYes = process.argv.includes('--yes');

// Init Firebase Admin
const saPath = path.join(__dirname, 'firebase-admin.json');
if (!fs.existsSync(saPath)) {
  console.error('❌ Service account nao encontrado:', saPath);
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(require(saPath)) });
const db = admin.firestore();

// =========================================================
// NOVA LISTA — estrategia "comprou X, leva Y junto"
// Y sempre tem CUSTO MENOR que X → zero prejuizo, alto upsell.
// =========================================================
//
// CALIBRAGEM probabilistica (Behavioral Nudge):
//   - 4 brindes de CUSTO BAIXO (~R$2-3): 60% combinado
//     (casquinha, picolé, copinho — sem dor)
//   - 4 brindes de CUSTO MEDIO (~R$5-9): 30% combinado
//     (upgrade, +50g buffet, topping premium)
//   - 2 brindes de CUSTO ALTO (~R$10+): 10% combinado
//     (dose dupla, combo surpresa) - aparecem raro mas viralizam
//   - "Volte com Amigo" 5% pra incentivar traffic em grupo
//
// Soma: 100%. Cooldown 90min entre raspadinhas no PDV.
//
const NEW_PRIZES = [
  // ========== TIER LOW-COST (~R$2-3) — 60% combinado ==========
  {
    code:'RSP_MS_CASQUINHA', name:'Comprou Milk Shake? Leva Casquinha',
    desc:'Próximo Milk Shake M ou maior vem com 1 casquinha de leite ninho grátis.',
    prob:18, cost:2.50, validity:7, scope:'same', minOrder:20, tier:'small',
    categoria:'cat_milkshake', minSizeTag:'M'
  },
  {
    code:'RSP_SUNDAE_COPINHO', name:'Comprou Sundae? Leva Copinho',
    desc:'Próximo Sundae M ou maior vem com 1 copinho de sorvete grátis.',
    prob:15, cost:3.00, validity:7, scope:'same', minOrder:20, tier:'small',
    categoria:'cat_sundae', minSizeTag:'M'
  },
  {
    code:'RSP_CASCAO_CASQUINHA', name:'Cascão? Leva Casquinha',
    desc:'Próximo cascão vem com 1 casquinha de brinde.',
    prob:15, cost:2.00, validity:7, scope:'same', minOrder:15, tier:'small',
    categoria:'cat_casquinha'
  },
  {
    code:'RSP_BUFFET_PICOLE', name:'Buffet 250g+? Leva Picolé',
    desc:'No próximo buffet acima de 250g, ganhe 1 picolé grátis.',
    prob:12, cost:3.00, validity:7, scope:'same', minOrder:15, tier:'small',
    categoria:'cat_buffet'
  },

  // ========== TIER MID-COST (~R$5-9) — 30% combinado ==========
  {
    code:'RSP_UPGRADE_MILKSHAKE', name:'Upgrade Milk Shake',
    desc:'No próximo Milk Shake, P vira M ou M vira G de graça.',
    prob:8, cost:5.00, validity:7, scope:'same', minOrder:15, tier:'medium',
    categoria:'cat_milkshake'
  },
  {
    code:'RSP_UPGRADE_SUNDAE', name:'Upgrade Sundae',
    desc:'No próximo Sundae, P vira M ou M vira G de graça.',
    prob:8, cost:5.00, validity:7, scope:'same', minOrder:15, tier:'medium',
    categoria:'cat_sundae'
  },
  {
    code:'RSP_BUFFET_50G', name:'+50g de Buffet',
    desc:'No próximo buffet acima de R$ 15, ganha 50g extras na pesagem.',
    prob:8, cost:3.00, validity:7, scope:'same', minOrder:15, tier:'medium',
    categoria:'cat_buffet'
  },
  {
    code:'RSP_TOPPING_PREMIUM', name:'Topping Premium Grátis',
    desc:'No próximo Milk Shake/Sundae, escolhe 1 topping premium (Nutella, Ovomaltine ou Oreo).',
    prob:6, cost:2.50, validity:7, scope:'same', minOrder:15, tier:'medium',
    categoria:'cat_milkshake,cat_sundae'
  },

  // ========== TIER HIGH-VALUE (~R$10+) — 10% combinado ==========
  {
    code:'RSP_DOSE_DUPLA', name:'Dose Dupla Milk Shake',
    desc:'Comprou Milk Shake G ou Monster? Leva 1 Milk Shake P de outro sabor pra dividir.',
    prob:5, cost:9.99, validity:7, scope:'same', minOrder:25, tier:'big',
    categoria:'cat_milkshake', minSizeTag:'G'
  },
  {
    code:'RSP_COMBO_SURPRESA', name:'Combo Surpresa',
    desc:'No próximo Milk Shake M+, leva 1 casquinha + 1 picolé de brinde.',
    prob:5, cost:5.00, validity:7, scope:'same', minOrder:20, tier:'big',
    categoria:'cat_milkshake', minSizeTag:'M'
  },

  // ========== ESPECIAL — "Volte com Amigo" (traffic boost) ==========
  {
    code:'RSP_VOLTA_AMIGO', name:'Volte com um Amigo',
    desc:'Volte com 1 amigo e os dois ganham 1 casquinha de leite ninho cada.',
    prob:5, cost:4.00, validity:7, scope:'same', minOrder:20, tier:'medium',
    categoria:null
  }
];

// Verifica soma de probabilidades
const sum = NEW_PRIZES.reduce((s,p) => s + p.prob, 0);
console.log(`\n🎯 Soma de probabilidades: ${sum}% (deve ser 100%)`);
if (Math.abs(sum - 100) > 0.5) {
  console.error('❌ Soma nao bate 100%. Ajuste o array antes de rodar.');
  process.exit(1);
}

async function main() {
  const docId = 'datastore/scratch_prizes_' + fid;
  console.log(`\n📦 Lendo estado atual de ${docId}...`);
  const ref = db.collection('datastore').doc('scratch_prizes_' + fid);
  const snap = await ref.get();

  // BACKUP
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `scratch-prizes-${fid}-${ts}.json`);

  let beforeData = null;
  if (snap.exists) {
    beforeData = snap.data();
    fs.writeFileSync(backupPath, JSON.stringify(beforeData, null, 2));
    console.log(`✅ Backup salvo: ${path.relative(process.cwd(), backupPath)}`);

    // Mostra BEFORE
    let beforeRaw = beforeData.value;
    if (typeof beforeRaw === 'string') {
      try { beforeRaw = JSON.parse(beforeRaw); } catch(_) {}
    }
    if (Array.isArray(beforeRaw)) {
      console.log(`\n📋 BEFORE (${beforeRaw.length} premios):`);
      beforeRaw.forEach(p => console.log(`   ${p.prob||'?'}% · ${p.name || p.code}`));
    }
  } else {
    console.log('⚠️  Doc nao existe — sera criado novo.');
  }

  // Mostra AFTER
  console.log(`\n🆕 AFTER (${NEW_PRIZES.length} premios) — comprou X, leva Y:`);
  NEW_PRIZES.forEach(p => {
    console.log(`   ${String(p.prob).padStart(4)}% · R$${String(p.cost).padStart(5)} · ${p.name}`);
  });

  if (!autoYes) {
    console.log('\n⚠️  Rode com --yes pra aplicar:');
    console.log(`     node autopilot/update-raspinha-prizes.js ${fid} --yes`);
    process.exit(0);
  }

  // APLICA
  console.log('\n💾 Gravando no Firestore...');
  await ref.set({
    value: JSON.stringify(NEW_PRIZES),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    _updatedBy: 'autopilot/update-raspinha-prizes.js',
    _backup: path.relative(path.join(__dirname, '..'), backupPath)
  });
  console.log('✅ Premios atualizados com sucesso!');
  console.log(`   Backup: backups/${path.basename(backupPath)}`);
  console.log(`   Pra reverter: copie o JSON do backup pro doc no Firestore.`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
