/* ============================================================
   MilkyPot TV Promo Rotator
   ============================================================
   Renderiza as 12 copies de PromocoesCopy em containers marcados
   com data-tv-promos="all|desafio10|peso300".

   Uso:
     <div data-tv-promos="all" data-interval="5000"></div>
     <script src="/js/core/promocoes-copy.js"></script>
     <script src="/js/core/tv-promo-rotator.js"></script>

   Troca de copy a cada N ms. Card grande, contraste alto, CTA visivel.
   Funciona offline — 100% client-side.
   ============================================================ */
(function(){
  'use strict';

  var PALETTE = {
    desafio10: { bg:'linear-gradient(135deg,#FF0040 0%,#FF6B6B 100%)', accent:'#FFE600' },
    peso300:   { bg:'linear-gradient(135deg,#00C853 0%,#64DD17 100%)', accent:'#FFFFFF' }
  };

  function pickCopies(mode){
    var PC = window.PromocoesCopy;
    if(!PC) return [];
    if(mode === 'desafio10') return PC.byPromo('desafio10');
    if(mode === 'peso300')   return PC.byPromo('peso300');
    return PC.shuffle(); // all
  }

  function render(container, copy){
    var p = PALETTE[copy.promo] || PALETTE.desafio10;
    var tag = copy.promo === 'peso300' ? 'ACERTOU GANHOU 300g' : 'DESAFIO 10s';
    container.innerHTML =
      '<div class="mp-promo-card" style="'+
        'background:'+p.bg+';color:#fff;border-radius:24px;'+
        'padding:clamp(16px,3vw,32px);box-shadow:0 12px 40px rgba(0,0,0,.25);'+
        'text-align:center;position:relative;overflow:hidden;'+
        'font-family:inherit;animation:mpPromoIn .6s ease;'+
      '">'+
        '<div style="position:absolute;top:10px;right:14px;background:rgba(255,255,255,.2);'+
          'padding:4px 10px;border-radius:100px;font-size:clamp(9px,1vw,12px);font-weight:800;letter-spacing:.5px">'+
          tag+
        '</div>'+
        '<div style="font-size:clamp(42px,8vw,88px);line-height:1;margin-bottom:8px">'+copy.emoji+'</div>'+
        '<div style="font-size:clamp(22px,4vw,52px);font-weight:900;letter-spacing:-.5px;line-height:1.1;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,.15)">'+
          copy.title+
        '</div>'+
        '<div style="font-size:clamp(13px,1.6vw,20px);opacity:.95;line-height:1.35;margin-bottom:14px;max-width:90%;margin-left:auto;margin-right:auto">'+
          copy.subtitle+
        '</div>'+
        '<div style="display:inline-block;background:'+p.accent+';color:#1a1a1a;'+
          'padding:10px 22px;border-radius:100px;font-weight:900;font-size:clamp(14px,1.8vw,22px);'+
          'letter-spacing:.5px;box-shadow:0 4px 12px rgba(0,0,0,.2)">'+
          copy.cta+' &rarr;'+
        '</div>'+
      '</div>';
  }

  function ensureAnim(){
    if(document.getElementById('mp-promo-anim')) return;
    var s = document.createElement('style');
    s.id = 'mp-promo-anim';
    s.textContent = '@keyframes mpPromoIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}';
    document.head.appendChild(s);
  }

  function attach(container){
    var mode = container.getAttribute('data-tv-promos') || 'all';
    var interval = parseInt(container.getAttribute('data-interval'),10) || 5000;
    var copies = pickCopies(mode);
    if(copies.length === 0){
      // PromocoesCopy ainda nao carregou — tenta de novo em 500ms
      setTimeout(function(){ attach(container); }, 500);
      return;
    }
    var idx = 0;
    render(container, copies[0]);
    container.__mpPromoTimer = setInterval(function(){
      idx = (idx + 1) % copies.length;
      // Reshuffle ao completar ciclo (se mode=all)
      if(idx === 0 && mode === 'all') copies = pickCopies('all');
      render(container, copies[idx]);
    }, interval);
  }

  function initAll(){
    ensureAnim();
    var containers = document.querySelectorAll('[data-tv-promos]');
    for(var i=0;i<containers.length;i++){
      if(containers[i].__mpPromoAttached) continue;
      containers[i].__mpPromoAttached = true;
      attach(containers[i]);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Reexpor pro caso de telas dinamicas
  window.MPPromoRotator = { initAll: initAll, attach: attach };
})();
