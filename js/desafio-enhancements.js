/**
 * MilkyPot — Desafio 10s · CAMADA PREMIUM (aditiva)
 * ====================================================
 * Este arquivo NUNCA chama funcoes do desafio.html — so OBSERVA o DOM
 * e injeta enhancements (confete, near-miss overlay, copy viral,
 * reacoes da ovelha, hints dinamicos).
 *
 * Anti-quebra:
 *   1. window.addEventListener('error') silencia falhas locais
 *   2. Tudo dentro de try/catch
 *   3. Se firebase nao existir, gracefully degrada
 *   4. Nao toca em variaveis globais do desafio.html
 *   5. Carrega via <script defer> — nao bloqueia paint
 *
 * Entry point: MPxDesafio.init() — chamado automaticamente no DOMContentLoaded
 * Namespace: window.MPxDesafio (curto pra evitar colisao com window.Auth/DataStore)
 */
(function() {
'use strict';

if (window.MPxDesafio && window.MPxDesafio._loaded) return;

var MPx = window.MPxDesafio = window.MPxDesafio || {};
MPx._loaded = true;

// ============================================================
// SAFE LOGGER
// ============================================================
var DEBUG = /[?&]mpxd=1/.test(location.search);
function log() { if (DEBUG && console && console.log) console.log.apply(console, ['[MPxDesafio]'].concat([].slice.call(arguments))); }
function warn(e) { if (console && console.warn) console.warn('[MPxDesafio]', e); }

// ============================================================
// COPY VIRAL — banco de frases
// ============================================================
var COPY = {
  // mensagens do balao da ovelha por contexto
  attract: [
    '🐑 Bee! Tenta aí…',
    '😏 Acha que consegue?',
    '🔥 Olha o cronômetro!',
    '🎯 5, 10 ou 30. Escolhe um.',
    '👀 Tô de olho…',
    '🍦 Acertou? Pago sorvete!',
    '⚡ Quase ninguém pega.',
    '🐑 Sou Belinha. Vamos?'
  ],
  countdown: [
    '😳 Calma… respira…',
    '👀 Foco!',
    '🔥 Tá quase!',
    '⚡ Vai vai vai!'
  ],
  running: [
    '⏱️ Vai!',
    '👀 Não pisca!',
    '🔥 Cuidado!',
    '😰 Já?'
  ],
  win: [
    '🏆 ACERTOU!',
    '🎉 Não acredito!',
    '🐑 Sortudão!',
    '🔥 Pegou exato!',
    '👑 Lendário.'
  ],
  near: [
    '😩 POR POUCO!',
    '🐑 Quaaase!',
    '⚡ +uma chance!',
    '🤏 Tão perto…'
  ],
  far: [
    '😅 Treina!',
    '🐑 Tenta de novo!',
    '🍦 Foi, foi…',
    '👀 Próxima!'
  ],
  // taglines do hero (rotativo)
  taglines: [
    '⏱️ O DESAFIO MAIS VICIANTE DA MILKYPOT',
    '😳 QUASE NINGUÉM CONSEGUE PARAR EM 10.000',
    '🏆 ACERTE O TEMPO E LEVE SEU PRÊMIO',
    '🐑 O CRONÔMETRO MAIS DIFÍCIL DO MUFFATO'
  ]
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ============================================================
// HELPERS
// ============================================================
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
function addClass(el, c) { if (el && !el.classList.contains(c)) el.classList.add(c); }
function rmClass(el, c) { if (el && el.classList.contains(c)) el.classList.remove(c); }

// detecta modo TV
var TV_MODE = (function() {
  try { var p = new URLSearchParams(location.search); return p.has('tv') || p.has('kiosk'); } catch(e) { return false; }
})();
if (TV_MODE) document.body.classList.add('mp-tv-mode');

// detecta reduced motion
var REDUCED_MOTION = false;
try { REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}

// ============================================================
// 1. SHEEP MASCOT — reacoes dinamicas
// ============================================================
var sheepBubbleTimer = null;
function showSheepLine(text, variant, durationMs) {
  try {
    var bub = $('#sheepBubble');
    if (!bub) return;
    bub.textContent = text;
    // limpa variantes anteriores
    ['mp-rich-win','mp-rich-near','mp-rich-watch','mp-rich-tense'].forEach(function(v){ rmClass(bub, v); });
    addClass(bub, 'mp-rich');
    if (variant) addClass(bub, 'mp-rich-' + variant);
    bub.style.opacity = '1';
    bub.style.transform = 'translateY(0)';
    if (sheepBubbleTimer) clearTimeout(sheepBubbleTimer);
    sheepBubbleTimer = setTimeout(function() {
      bub.style.opacity = '0';
      bub.style.transform = 'translateY(8px)';
    }, durationMs || 3200);
  } catch (e) { warn(e); }
}
MPx.showSheepLine = showSheepLine;

function setSheepMood(mood) {
  try {
    var s = $('#sheepMascot');
    if (!s) return;
    ['mp-happy','mp-sad','mp-watching','mp-blink'].forEach(function(c){ rmClass(s, c); });
    if (mood) addClass(s, 'mp-' + mood);
  } catch (e) { warn(e); }
}
MPx.setSheepMood = setSheepMood;

// ============================================================
// 2. CONFETTI — DIY sem deps
// ============================================================
var CONFETTI_COLORS = ['#FF4F8A','#7E57C2','#42A5F5','#FFD700','#FF6B9D','#FFB74D','#A5D6A7'];
var CONFETTI_SHAPES = ['mp-c-circle','mp-c-strip','mp-c-tri',''];

function burstConfetti(count, durationMs) {
  if (REDUCED_MOTION) return;
  try {
    var stage = $('#mpConfettiStage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'mpConfettiStage';
      stage.className = 'mp-confetti-stage';
      document.body.appendChild(stage);
    }
    var n = count || 90;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'mp-confetti-piece ' + pick(CONFETTI_SHAPES);
      var shape = p.className.indexOf('mp-c-tri') >= 0;
      if (!shape) p.style.background = pick(CONFETTI_COLORS);
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      stage.appendChild(p);
      // auto-cleanup
      (function(el){ setTimeout(function(){ if (el && el.parentNode) el.parentNode.removeChild(el); }, 4000); })(p);
    }
    if (durationMs) setTimeout(function(){ stage && (stage.innerHTML = ''); }, durationMs);
  } catch (e) { warn(e); }
}
MPx.burstConfetti = burstConfetti;

// ============================================================
// 3. NEAR-MISS OVERLAY — quando erra por pouco
// ============================================================
function showNearMiss(diffMs) {
  try {
    if (document.getElementById('mpNearMiss')) return;
    var diff = Math.abs(diffMs || 0);
    var title = diff <= 50 ? 'POR UM FIO!' : diff <= 120 ? 'QUASEEEE!' : 'TÃO PERTO!';
    var emoji = diff <= 50 ? '😱' : '😩';
    var diffStr = (diff / 1000).toFixed(3).replace('.', ',') + 's';
    var sub = 'Errou por apenas <b>' + diff + 'ms</b>. Mais uma!';
    var wrap = document.createElement('div');
    wrap.id = 'mpNearMiss';
    wrap.className = 'mp-near-miss';
    wrap.innerHTML =
      '<div class="mp-near-miss-card">' +
        '<div class="mp-near-miss-emoji">' + emoji + '</div>' +
        '<div class="mp-near-miss-title">' + title + '</div>' +
        '<div class="mp-near-miss-sub">' + sub + '</div>' +
        '<div class="mp-near-miss-diff">±' + diffStr + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    setTimeout(function() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }, 2200);
    // shake leve no body
    document.body.style.animation = 'mpShake 0.5s ease-in-out 1';
    setTimeout(function(){ document.body.style.animation = ''; }, 600);
  } catch (e) { warn(e); }
}
MPx.showNearMiss = showNearMiss;

// ============================================================
// 4. STATS DINAMICOS — pessoas jogaram hoje, recorde do dia
// ============================================================
var STATS_CACHE = { fetchedAt: 0, jogaram: 0, ganharam: 0, melhor: null };
var STATS_TTL_MS = 90000;

function getFranchiseId() {
  try {
    var p = new URLSearchParams(location.search);
    return p.get('franchise') || p.get('f') || 'muffato-quintino';
  } catch(e) { return 'muffato-quintino'; }
}

function todayKeyBR() {
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
}

function fetchStats() {
  return new Promise(function(resolve) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) return resolve(STATS_CACHE);
      if (Date.now() - STATS_CACHE.fetchedAt < STATS_TTL_MS) return resolve(STATS_CACHE);
      var db = firebase.firestore();
      var fid = getFranchiseId();
      var today = todayKeyBR();
      // jogaram hoje = docs em desafio_10000 do dia (qualquer franquia se nao tiver fid filter)
      db.collection('desafio_10000')
        .where('date', '>=', today + 'T00:00:00.000Z')
        .where('date', '<=', today + 'T23:59:59.999Z')
        .limit(500)
        .get()
        .then(function(snap) {
          var jogaram = snap.size;
          var ganharam = 0;
          var melhor = null;
          snap.forEach(function(doc) {
            var d = doc.data();
            var diff = Math.abs((d.target || 10000) - (d.elapsed || 0));
            if (diff <= 50) ganharam++;
            if (!melhor || diff < melhor.diff) melhor = { name: d.name || '—', diff: diff };
          });
          STATS_CACHE = { fetchedAt: Date.now(), jogaram: jogaram, ganharam: ganharam, melhor: melhor };
          resolve(STATS_CACHE);
        })
        .catch(function(e) {
          warn(e);
          resolve(STATS_CACHE);
        });
    } catch (e) {
      warn(e);
      resolve(STATS_CACHE);
    }
  });
}
MPx.fetchStats = fetchStats;

// ============================================================
// 4b. ULTIMOS CAMPEOES 300G — lista dinamica pro Hall da Fama
// ============================================================
// Tenta varias colecoes em ordem de prioridade. Se nenhuma tiver dado,
// retorna [] e o caller mostra fallback motivacional.
var WINNERS_CACHE = { fetchedAt: 0, list: [], placeholder: false };
var WINNERS_TTL_MS = 120000;

function fetchRecentWinners300g() {
  return new Promise(function(resolve) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) return resolve(WINNERS_CACHE);
      if (Date.now() - WINNERS_CACHE.fetchedAt < WINNERS_TTL_MS) return resolve(WINNERS_CACHE);
      var db = firebase.firestore();
      var fid = getFranchiseId();
      var sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      // tentativa 1: scratches com prizeCode RSP_BUFFET_* resgatados (proxy do 300g)
      // tentativa 2: desafio_results filtrando por target=300g se houver
      // tentativa 3: tv_promo_events com slideId acerta300 (ainda nao registra ganhadores, so views)
      var attempts = [
        function() {
          return db.collection('scratches')
            .where('status', '==', 'redeemed')
            .where('redeemedAtFranchise', '==', fid)
            .orderBy('redeemedAt', 'desc')
            .limit(20)
            .get()
            .then(function(snap) {
              var list = [];
              snap.forEach(function(doc) {
                var d = doc.data();
                // so pegamos resgates que SOAM como desafio 300g
                if (!d.prizeCode || !/300|BUFFET/i.test(d.prizeCode)) return;
                list.push({
                  name: d.redeemedBy || d.customerName || 'Cliente',
                  detail: d.prizeName || '300g exatos'
                });
              });
              return list.slice(0, 5);
            });
        }
      ];

      // executa a primeira e ja resolve — se vier vazio, marca placeholder
      attempts[0]()
        .then(function(list) {
          WINNERS_CACHE = {
            fetchedAt: Date.now(),
            list: list || [],
            placeholder: !list || !list.length
          };
          resolve(WINNERS_CACHE);
        })
        .catch(function(e) {
          warn(e);
          WINNERS_CACHE = { fetchedAt: Date.now(), list: [], placeholder: true };
          resolve(WINNERS_CACHE);
        });
    } catch (e) {
      warn(e);
      resolve(WINNERS_CACHE);
    }
  });
}
MPx.fetchRecentWinners300g = fetchRecentWinners300g;

// Injeta a lista no slide hallFamaLive quando ele esta visivel
function injectRecentWinnersInHall() {
  try {
    var hallSlide = document.querySelector('.promo-slide-hall');
    if (!hallSlide) return;
    if (hallSlide.querySelector('.mp-hall-recent')) return; // ja injetado
    fetchRecentWinners300g().then(function(w) {
      // re-busca caso a chamada demore e o slide tenha mudado
      var slide = document.querySelector('.promo-slide-hall');
      if (!slide || slide.querySelector('.mp-hall-recent')) return;

      var html;
      if (w.list && w.list.length) {
        html = '<div class="mp-hall-recent"><h4>🏆 Últimos a levarem GRÁTIS hoje</h4><ul>' +
               w.list.map(function(p) {
                 return '<li><span>' + escapeHTML(p.name) + '</span><b>' + escapeHTML(p.detail) + '</b></li>';
               }).join('') +
               '</ul></div>';
      } else {
        // placeholder motivacional — encaixa o "será que hoje é sua vez?"
        html = '<div class="mp-hall-recent"><h4>🐑 Hoje pode ser sua vez</h4>' +
               '<ul><li><span>O placar está vazio…</span><b>seja o primeiro</b></li></ul></div>';
      }
      var wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      // insere antes do FOMO (.mp-hall-fomo) se existir, senao no fim
      var fomo = slide.querySelector('.mp-hall-fomo');
      if (fomo && fomo.parentNode) fomo.parentNode.insertBefore(wrapper.firstChild, fomo);
      else slide.appendChild(wrapper.firstChild);
    });
  } catch (e) { warn(e); }
}
MPx.injectRecentWinnersInHall = injectRecentWinnersInHall;

// detecta quando o slide hallFamaLive entra em cena e injeta a lista
function watchHallSlide() {
  try {
    var mo = new MutationObserver(function() {
      if (document.querySelector('.promo-slide-hall')) injectRecentWinnersInHall();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // tenta uma vez ja
    setTimeout(injectRecentWinnersInHall, 1500);
  } catch (e) { warn(e); }
}

// ============================================================
// 5. HERO HINTS — injeta no stepAttract
// ============================================================
function renderHintsStrip(stats) {
  try {
    var attract = $('#stepAttract');
    if (!attract || attract.querySelector('.mp-hint-strip')) return;
    var strip = document.createElement('div');
    strip.className = 'mp-hint-strip';
    var hints = [];
    if (stats.jogaram > 0) hints.push('<div class="mp-hint fire">🔥 <b>' + stats.jogaram + '</b> tentaram hoje</div>');
    if (stats.ganharam > 0) hints.push('<div class="mp-hint gold">🏆 <b>' + stats.ganharam + '</b> acertaram</div>');
    if (stats.melhor && stats.melhor.diff < 999999) {
      hints.push('<div class="mp-hint">👑 Recorde de hoje: <b>±' + stats.melhor.diff + 'ms</b> por ' + escapeHTML(stats.melhor.name) + '</div>');
    }
    if (!hints.length) {
      hints.push('<div class="mp-hint fire">🔥 <b>Hoje rola prêmio</b></div>');
      hints.push('<div class="mp-hint gold">🏆 Acerte e leve sorvete</div>');
    }
    strip.innerHTML = hints.join('');
    // posiciona depois do attract-sub
    var sub = attract.querySelector('.attract-sub');
    if (sub && sub.parentNode) {
      sub.parentNode.insertBefore(strip, sub.nextSibling);
    } else {
      attract.appendChild(strip);
    }
  } catch (e) { warn(e); }
}
function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}); }

// ============================================================
// 6. OBSERVER — reagir a mudancas de step + result
// ============================================================
var lastStepId = null;
var lastResultClass = '';

function onStepChange(stepId) {
  if (stepId === lastStepId) return;
  lastStepId = stepId;
  log('step ->', stepId);
  if (stepId === 'stepAttract') {
    setSheepMood('watching');
    showSheepLine(pick(COPY.attract), 'watch', 4000);
  } else if (stepId === 'stepDiff') {
    setSheepMood('watching');
    showSheepLine(pick(COPY.countdown), 'tense', 2000);
  } else if (stepId === 'step1' || stepId === 'step2') {
    setSheepMood('watching');
    showSheepLine(pick(COPY.running), 'tense', 2200);
  }
}

function onResultRendered() {
  try {
    var rv = $('#resultValue');
    if (!rv) return;
    var classes = rv.className || '';
    if (classes === lastResultClass) return;
    lastResultClass = classes;

    var dbg = $('#resultDiffBadge');
    var txt = (dbg && dbg.textContent) || '';
    var diffMatch = txt.match(/([+\-]?)(\d+)\s*ms/);
    var diff = diffMatch ? parseInt(diffMatch[2], 10) : null;

    if (/\bwin\b/.test(classes)) {
      addClass(rv, 'mp-burst');
      setSheepMood('happy');
      showSheepLine(pick(COPY.win), 'win', 4500);
      burstConfetti(140);
    } else if (/\bclose\b/.test(classes)) {
      addClass(rv, 'mp-shake');
      setSheepMood('sad');
      showSheepLine(pick(COPY.near), 'near', 4000);
      if (diff !== null && diff <= 200) showNearMiss(diff);
    } else if (/\bfar\b/.test(classes)) {
      setSheepMood('sad');
      showSheepLine(pick(COPY.far), 'near', 3500);
    }
  } catch (e) { warn(e); }
}

function startObserver() {
  try {
    var mo = new MutationObserver(function(muts) {
      // mudancas de step
      muts.forEach(function(m) {
        if (m.attributeName === 'class') {
          var t = m.target;
          if (t && t.classList && t.classList.contains('step') && t.classList.contains('active')) {
            onStepChange(t.id);
          }
          if (t && t.id === 'resultValue') {
            onResultRendered();
          }
        }
      });
    });
    mo.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    log('observer iniciado');
  } catch (e) { warn(e); }
}

// ============================================================
// 7. CRONOMETRO TENSE — observa contador rodando e adiciona classe
// ============================================================
var lastTenseClass = '';
function startCounterWatcher() {
  try {
    var ids = ['counterNum', 'liveCounter', 'gameCounter']; // possiveis nomes
    var elements = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    var found = elements[0] || $('.counter-num');
    if (!found) { log('counter element nao encontrado'); return; }
    // checa a cada 100ms se o valor esta perto do alvo
    var mo = new MutationObserver(function() {
      var txt = (found.textContent || '').trim();
      var m = txt.match(/(\d+):(\d+)\.(\d+)/);
      if (!m) return;
      var totalMs = (parseInt(m[1],10) * 60000) + (parseInt(m[2],10) * 1000) + parseInt(m[3].slice(0,3),10);
      // alvos conhecidos: 5000, 10000, 30000
      var targets = [5000, 10000, 30000];
      var nearest = targets.reduce(function(prev, t) {
        return Math.abs(t - totalMs) < Math.abs(prev - totalMs) ? t : prev;
      }, targets[0]);
      var diff = Math.abs(nearest - totalMs);
      var newClass = '';
      if (diff <= 200) newClass = 'mp-laser';
      else if (diff <= 800) newClass = 'mp-tense';
      if (newClass !== lastTenseClass) {
        rmClass(found, 'mp-laser'); rmClass(found, 'mp-tense');
        if (newClass) addClass(found, newClass);
        lastTenseClass = newClass;
      }
    });
    mo.observe(found, { childList: true, characterData: true, subtree: true });
  } catch (e) { warn(e); }
}

// ============================================================
// 8. HERO TAGLINE ROTATOR — cicla taglines no attract
// ============================================================
function rotateHeroTagline() {
  try {
    var title = $('#stepAttract .attract-title');
    if (!title) return;
    // armazena texto original (1x)
    if (!title.dataset.mpxOrig) title.dataset.mpxOrig = title.textContent;
    var idx = 0;
    var taglines = COPY.taglines.slice();
    function tick() {
      var attract = $('#stepAttract');
      if (!attract || !attract.classList.contains('active')) return;
      title.textContent = taglines[idx % taglines.length];
      idx++;
    }
    tick();
    setInterval(tick, 8000);
  } catch (e) { warn(e); }
}

// ============================================================
// 9. AURORA BG + viral hints — pequenas adicoes
// ============================================================
function applyVisualEnhancements() {
  try {
    document.body.classList.add('mp-aurora-bg');
  } catch (e) { warn(e); }
}

// ============================================================
// 10. INIT — orquestra tudo apos DOM pronto
// ============================================================
function init() {
  try {
    log('init MPxDesafio v1');
    applyVisualEnhancements();
    startObserver();
    startCounterWatcher();
    rotateHeroTagline();
    watchHallSlide();

    // hints iniciais (placeholder estatico) + carrega stats reais async
    renderHintsStrip(STATS_CACHE);
    fetchStats().then(function(s) {
      // re-renderiza com dados reais
      var existing = document.querySelector('#stepAttract .mp-hint-strip');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      renderHintsStrip(s);
    });

    // re-fetch stats a cada 2min em modo TV
    if (TV_MODE) {
      setInterval(function() {
        STATS_CACHE.fetchedAt = 0;
        fetchStats().then(function(s) {
          var existing = document.querySelector('#stepAttract .mp-hint-strip');
          if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
          renderHintsStrip(s);
        });
      }, 120000);
    }

    // primeira fala da ovelha
    setTimeout(function(){ showSheepLine(pick(COPY.attract), 'watch', 4000); setSheepMood('watching'); }, 1200);
  } catch (e) { warn(e); }
}
MPx.init = init;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(init, 80);
} else {
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 80); });
}

})();
