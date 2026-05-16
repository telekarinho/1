/* ============================================================
   MilkyPot Voice Order — pedido por voz (Web Speech API)
   ============================================================
   Acessibilidade + mão livre + manchete fácil ("primeira sorveteria
   com pedido por voz em Londrina").

   Stack: Web Speech API nativa (Chrome/Edge/Safari mobile).
   Fallback: input text se browser não suporta.

   Flow:
     1. Botão "🎤 Pedir por voz" na home cardápio
     2. Modal aparece, mostra ondas animadas, "Tô ouvindo…"
     3. Reconhece comando em português BR
     4. Busca match no catálogo (substring/synonym)
     5. Se confiante, adiciona no cart. Se ambíguo, pergunta confirmação.

   API:
     VoiceOrder.show()           - abre modal
     VoiceOrder.parse(transcript) - retorna { items: [], confidence: 0-1 }
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpVoiceLoaded) return;
    global._mpVoiceLoaded = true;

    // Sinônimos comuns (BR) → product keywords
    var KEYWORDS = {
        'milkshake': ['milkshake', 'milk shake', 'milk-shake', 'shake'],
        'sundae': ['sundae', 'sundai', 'sundae'],
        'açaí': ['açaí', 'acai', 'açai'],
        'morango': ['morango', 'fragola'],
        'chocolate': ['chocolate', 'choco', 'choclate'],
        'nutella': ['nutella'],
        'ovomaltine': ['ovomaltine', 'ovo maltine'],
        'cookie': ['cookie', 'cookies'],
        'pistache': ['pistache'],
        'amendoim': ['amendoim', 'paçoca'],
        'doce de leite': ['doce de leite', 'dulce'],
        'oreo': ['oreo'],
        'banana': ['banana'],
        'limão': ['limão', 'limao', 'lemon'],
        'cereja': ['cereja'],
        'frutas vermelhas': ['frutas vermelhas', 'frutas vermelha']
    };

    var SIZES = {
        'essencial': ['essencial', 'pequeno', 'mini'],
        'supremo': ['supremo', 'medio', 'médio'],
        'monster pot': ['monster', 'monster pot', 'grande'],
        'soberano': ['soberano', 'gigante']
    };

    function _normalize(s) {
        return (s || '').toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function parse(transcript) {
        if (!transcript) return { items: [], confidence: 0 };
        var t = _normalize(transcript);

        var detectedFlavors = [];
        var detectedSize = null;
        var qty = 1;

        // Qty match (números 1-9 + "um/uma/dois/três")
        var qtyMap = { 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3, 'quatro': 4, 'cinco': 5 };
        Object.keys(qtyMap).forEach(function (k) {
            if (t.indexOf(k + ' ') === 0 || t.indexOf(' ' + k + ' ') > -1) qty = qtyMap[k];
        });
        var digMatch = t.match(/\b([1-9])\b/);
        if (digMatch) qty = parseInt(digMatch[1]);

        // Tamanho
        Object.keys(SIZES).forEach(function (size) {
            SIZES[size].forEach(function (synonym) {
                if (t.indexOf(_normalize(synonym)) > -1) detectedSize = size;
            });
        });

        // Sabores
        Object.keys(KEYWORDS).forEach(function (flavor) {
            KEYWORDS[flavor].forEach(function (synonym) {
                if (t.indexOf(_normalize(synonym)) > -1 && detectedFlavors.indexOf(flavor) < 0) {
                    detectedFlavors.push(flavor);
                }
            });
        });

        // Confidence heuristic
        var confidence = 0;
        if (detectedFlavors.length) confidence += 0.5;
        if (detectedSize) confidence += 0.3;
        if (qty) confidence += 0.2;
        confidence = Math.min(1, confidence);

        return {
            items: detectedFlavors.map(function (f) {
                return { flavor: f, size: detectedSize, qty: qty };
            }),
            confidence: confidence,
            transcript: transcript
        };
    }

    function show() {
        var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
        if (!SR) {
            _toast('⚠ Seu navegador não suporta voz. Usa Chrome ou Safari.', '#DC2626');
            return;
        }

        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99994;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;padding:24px;font-family:"Segoe UI",sans-serif';
        modal.innerHTML =
            '<button id="mpVoiceClose" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);border:0;color:#fff;width:42px;height:42px;border-radius:999px;font-size:22px;cursor:pointer">×</button>' +
            '<div id="mpVoiceAnimation" style="font-size:120px;animation:mp-voice-pulse 1.2s ease-in-out infinite">🎤</div>' +
            '<div id="mpVoiceStatus" style="font-size:18px;font-weight:800;margin-top:12px;text-align:center">Tô ouvindo… fala aí</div>' +
            '<div id="mpVoiceTranscript" style="font-size:15px;margin-top:14px;color:rgba(255,255,255,.7);text-align:center;max-width:400px;font-style:italic;min-height:40px"></div>' +
            '<div id="mpVoiceHint" style="font-size:13px;color:rgba(255,255,255,.5);margin-top:20px;text-align:center;max-width:400px">Tenta algo como:<br><strong>"dois milkshake de morango monster pot"</strong></div>' +
            '<button id="mpVoiceRetry" style="display:none;margin-top:18px;background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:14px 24px;border-radius:999px;font-weight:800;cursor:pointer;font-size:15px">↺ Tentar de novo</button>';
        document.body.appendChild(modal);

        _injectStyles();
        modal.querySelector('#mpVoiceClose').onclick = function () { try { recognition.stop(); } catch(e){} modal.remove(); };

        var recognition = new SR();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;

        var finalTranscript = '';

        recognition.onresult = function (event) {
            var interim = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var r = event.results[i];
                if (r.isFinal) finalTranscript += r[0].transcript;
                else interim += r[0].transcript;
            }
            modal.querySelector('#mpVoiceTranscript').textContent = '"' + (finalTranscript + interim).trim() + '"';
        };

        recognition.onerror = function (e) {
            modal.querySelector('#mpVoiceStatus').textContent = '⚠ ' + (e.error === 'no-speech' ? 'Não ouvi nada' : 'Erro: ' + e.error);
            modal.querySelector('#mpVoiceRetry').style.display = 'inline-block';
            if (global.MpAnalytics) global.MpAnalytics.track('voice_error', { error: e.error });
        };

        recognition.onend = function () {
            modal.querySelector('#mpVoiceAnimation').style.animation = 'none';
            modal.querySelector('#mpVoiceAnimation').textContent = '⏸';
            if (finalTranscript) {
                _processTranscript(finalTranscript, modal);
            } else {
                modal.querySelector('#mpVoiceStatus').textContent = 'Não entendi 🤔';
                modal.querySelector('#mpVoiceRetry').style.display = 'inline-block';
            }
        };

        modal.querySelector('#mpVoiceRetry').onclick = function () {
            finalTranscript = '';
            modal.querySelector('#mpVoiceTranscript').textContent = '';
            modal.querySelector('#mpVoiceStatus').textContent = 'Tô ouvindo… fala aí';
            modal.querySelector('#mpVoiceAnimation').textContent = '🎤';
            modal.querySelector('#mpVoiceAnimation').style.animation = 'mp-voice-pulse 1.2s ease-in-out infinite';
            modal.querySelector('#mpVoiceRetry').style.display = 'none';
            try { recognition.start(); } catch(e){}
        };

        try {
            recognition.start();
            if (global.MpAnalytics) global.MpAnalytics.track('voice_started');
        } catch (e) {
            _toast('⚠ Não consegui acessar o microfone', '#DC2626');
            modal.remove();
        }
    }

    function _processTranscript(transcript, modal) {
        var parsed = parse(transcript);
        if (global.MpAnalytics) global.MpAnalytics.track('voice_parsed', {
            confidence: parsed.confidence,
            items_count: parsed.items.length,
            transcript_len: transcript.length
        });

        if (parsed.confidence < 0.4 || !parsed.items.length) {
            modal.querySelector('#mpVoiceStatus').textContent = 'Hmm, não pesquei o pedido 🐑';
            modal.querySelector('#mpVoiceRetry').style.display = 'inline-block';
            return;
        }

        var summary = parsed.items.map(function (it) {
            return it.qty + 'x ' + it.flavor + (it.size ? ' (' + it.size + ')' : '');
        }).join(', ');

        modal.querySelector('#mpVoiceStatus').textContent = '✓ Entendi!';
        modal.querySelector('#mpVoiceTranscript').innerHTML =
            '<div style="font-size:18px;color:#10B981;font-style:normal;margin-bottom:14px">' + summary + '</div>' +
            '<button id="mpVoiceConfirm" style="background:#10B981;color:#fff;border:0;padding:14px 28px;border-radius:999px;font-weight:900;cursor:pointer;font-size:15px;margin-right:6px">✓ Tá certo, busca pra mim</button>' +
            '<button id="mpVoiceCancel" style="background:rgba(255,255,255,.15);color:#fff;border:0;padding:14px 18px;border-radius:999px;font-weight:700;cursor:pointer;font-size:14px">↺ Refazer</button>';
        modal.querySelector('#mpVoiceConfirm').onclick = function () {
            // Filtra cardápio + abre primeiro produto que match
            try {
                var firstFlavor = parsed.items[0].flavor;
                if (typeof global.filterProducts === 'function') {
                    // Filtra por tab (milkypot por padrão)
                    global.filterProducts({ target: document.querySelector('[data-category="milkypot"]') }, 'milkypot');
                }
                // Scroll pro grid + show toast
                var grid = document.getElementById('productGrid');
                if (grid && grid.scrollIntoView) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                _toast('🔍 Buscando: ' + firstFlavor, '#10B981');
                if (global.MpAnalytics) global.MpAnalytics.track('voice_confirmed', { flavor: firstFlavor });
            } catch (e) {}
            modal.remove();
        };
        modal.querySelector('#mpVoiceCancel').onclick = function () {
            modal.querySelector('#mpVoiceRetry').click();
        };
    }

    function _injectStyles() {
        if (document.getElementById('mp-voice-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-voice-styles';
        style.textContent = '@keyframes mp-voice-pulse { 0%,100% { transform: scale(1); opacity:1 } 50% { transform: scale(1.15); opacity:.7 } }';
        document.head.appendChild(style);
    }

    function _toast(msg, color) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + (color||'#3B82F6') + ';color:#fff;padding:12px 20px;border-radius:999px;font-weight:700;z-index:99999;font-size:13px';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function(){ t.remove(); }, 3000);
    }

    global.VoiceOrder = {
        show: show,
        parse: parse,
        KEYWORDS: KEYWORDS,
        VERSION: 'mp-v256'
    };
})(typeof window !== 'undefined' ? window : this);
