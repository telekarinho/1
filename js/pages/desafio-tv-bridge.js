/* ============================================================
   MilkyPot — Bridge entre desafio.html e o sistema de TVs
   ============================================================
   Conecta o desafio público (milkypot.com/desafio.html) com:
    - challenge_live_{fid}    → TVs mostram timer/resultado ao vivo
    - challenge_10s_winners_{fid} → Hall da Fama automático
    - challenge_300g_winners_{fid} → Hall da Fama 300g
    - Viral share: quando cliente ganha, oferece botão pra postar story
      com o tempo + tag @milkypot
   ============================================================ */
(function(global){
    'use strict';

    var _fid = null;
    var _resolved = false;
    var _resolvePromise = null;

    // =======================================================
    // Descobre franquia a usar
    // 1º: ?f=<shortcode>|<fid> na URL
    // 2º: primeira franquia cadastrada no DataStore
    // =======================================================
    function resolveFranchise() {
        if (_resolvePromise) return _resolvePromise;
        _resolvePromise = new Promise(function(resolve){
            // Via URL
            var qs = new URLSearchParams(location.search);
            var qf = qs.get('f');
            if (qf) {
                // Pode ser shortcode (mq1) ou fid direto
                tryResolveShortcode(qf).then(function(fid){
                    _fid = fid || qf;
                    _resolved = true;
                    resolve(_fid);
                });
                return;
            }
            // Via DataStore (primeira franquia)
            if (typeof DataStore !== 'undefined') {
                try {
                    var fs = DataStore.get('franchises') || [];
                    if (fs.length) {
                        _fid = fs[0].id;
                        _resolved = true;
                        return resolve(_fid);
                    }
                } catch(e){}
            }
            resolve(null);
        });
        return _resolvePromise;
    }

    function tryResolveShortcode(code) {
        return new Promise(function(resolve){
            if (typeof DataStore === 'undefined') { return resolve(null); }
            try {
                var fs = DataStore.get('franchises') || [];
                for (var i=0; i<fs.length; i++) {
                    var map = DataStore.get('tv_shortcodes_' + fs[i].id);
                    if (map && map[code]) return resolve(fs[i].id);
                }
                resolve(null);
            } catch(e) { resolve(null); }
        });
    }

    // =======================================================
    // Hooks publicos chamados do desafio.html
    // =======================================================

    /**
     * Chamado quando o jogador aperta START no cronometro.
     * @param {string} playerName
     * @param {'10s'|'300g'} type  (default "10s")
     * @param {number} durationMs  (default 10000 pra 10s)
     */
    global._tvChallengeStart = function(playerName, type) {
        type = type || '10s';
        resolveFranchise().then(function(fid){
            if (!fid || typeof DataStore === 'undefined') return;
            try {
                DataStore.set('challenge_live_' + fid, {
                    active: true,
                    type: type,
                    playerName: playerName || 'Cliente',
                    startedAt: new Date().toISOString(),
                    durationMs: type === '10s' ? 10000 : null,
                    result: null,
                    finalValue: null,
                    finishedAt: null
                });
                console.log('[TV Bridge] START broadcast', type, playerName);
            } catch(e) { console.warn('[TV Bridge] start erro', e); }
        });
    };

    /**
     * Chamado quando o jogador para o cronometro.
     * @param {number} finalValue  — seg pra 10s, g pra 300g
     * @param {'10s'|'300g'} type (default "10s")
     * @returns {Promise<{won:boolean, distance:number}>}
     */
    global._tvChallengeFinish = function(finalValue, type) {
        type = type || '10s';
        return resolveFranchise().then(function(fid){
            if (!fid || typeof DataStore === 'undefined') return { won:false, distance:0 };
            var TOL_10S = 0.3;
            var TOL_300G = 3.0;
            var target = type === '10s' ? 10.0 : 300.0;
            var tolerance = type === '10s' ? TOL_10S : TOL_300G;
            var val = Number(finalValue);
            var distance = Math.abs(val - target);
            var won = distance <= tolerance;

            // Atualiza challenge_live
            var key = 'challenge_live_' + fid;
            var live = DataStore.get(key) || { type: type, playerName: 'Cliente' };
            live.active = false;
            live.result = won ? 'won' : 'lost';
            live.finalValue = val;
            live.finishedAt = new Date().toISOString();
            DataStore.set(key, live);

            // Hall da fama (só se ganhou)
            if (won) {
                var winnersKey = type === '10s'
                    ? 'challenge_10s_winners_' + fid
                    : 'challenge_300g_winners_' + fid;
                var list = DataStore.get(winnersKey) || [];
                var entry = {
                    name: live.playerName || 'Cliente',
                    at: live.finishedAt
                };
                if (type === '10s') entry.stoppedAt = val;
                else entry.weight = val;
                list.push(entry);
                if (list.length > 100) list.splice(0, list.length - 100);
                DataStore.set(winnersKey, list);
            }

            // "Limpa" da TV após 6s (mantém resultado visível até lá)
            setTimeout(function(){
                var cur = DataStore.get(key);
                if (cur && !cur.active && cur.finishedAt === live.finishedAt) {
                    cur._clearedFromTv = true;
                    DataStore.set(key, cur);
                }
            }, 6000);

            console.log('[TV Bridge] FINISH', won ? '🏆 GANHOU' : '😢 perdeu', val, 'dist=' + distance.toFixed(3));
            return { won: won, distance: distance };
        });
    };

    /**
     * Web Share nativa quando o jogador ganha — passa cliente pra postar
     * a vitória como story marcando @milkypot. Se Web Share API não existe,
     * retorna false (UI mostra fallback com link direto).
     */
    global._tvChallengeShare = function(opts) {
        opts = opts || {};
        var text = opts.text || 'Cravei o Desafio 10 Segundos da MilkyPot! 🎯 Quem consegue? @milkypot';
        var url = opts.url || 'https://milkypot.com/desafio.html';
        if (navigator.share) {
            return navigator.share({ title: 'MilkyPot 🎯', text: text, url: url })
                .then(function(){ return true; })
                .catch(function(){ return false; });
        }
        // Fallback: copia link e sugere IG Stories
        try {
            navigator.clipboard.writeText(text + ' ' + url);
            return Promise.resolve('clipboard');
        } catch(e) { return Promise.resolve(false); }
    };

    // =======================================================
    // UI: injeta botão "Postar vitória no Instagram" na tela de WIN
    // =======================================================
    function injectShareButtonOnWin() {
        // Aguarda .screen.win aparecer
        var observer = new MutationObserver(function(muts){
            muts.forEach(function(m){
                if (m.attributeName === 'class') {
                    var el = m.target;
                    if (el.classList && el.classList.contains('win')) {
                        addShareButton(el);
                    }
                }
            });
        });
        var screenEl = document.getElementById('screen');
        if (screenEl) observer.observe(screenEl, { attributes: true });

        // Alternativa: observa step 3 de resultado tambem
        var step3 = document.getElementById('step3');
        if (step3) new MutationObserver(function(){
            var abs = document.getElementById('resultValue');
            if (abs && abs.classList && abs.classList.contains('win')) addShareButton(step3);
        }).observe(step3, { attributes:true, childList:true, subtree:true });
    }

    function addShareButton(parent) {
        if (parent.querySelector('[data-tv-share]')) return;
        var btn = document.createElement('button');
        btn.setAttribute('data-tv-share', '1');
        btn.textContent = '📲 Compartilhar no Instagram';
        btn.style.cssText =
            'display:block;margin:24px auto 0;padding:16px 32px;font-size:18px;font-weight:800;' +
            'background:linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5);' +
            'color:#fff;border:none;border-radius:100px;cursor:pointer;font-family:inherit;' +
            'box-shadow:0 10px 30px rgba(214,41,118,.4);';
        btn.onclick = function(){
            global._tvChallengeShare({
                text: '🏆 EU CRAVEI o Desafio 10 Segundos da MilkyPot! Quem topa? @milkypot 🐑'
            }).then(function(r){
                if (r === 'clipboard') alert('Copiado! Cola no seu story marcando @milkypot 📲');
            });
        };
        parent.appendChild(btn);
    }

    // Init depois de DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectShareButtonOnWin);
    } else {
        injectShareButtonOnWin();
    }

    // Pre-resolve franchise
    resolveFranchise();
})(typeof window !== 'undefined' ? window : this);
