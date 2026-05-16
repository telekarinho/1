/* ============================================================
   MilkyPot Selfie Sticker — UGC engine pós-entrega
   ============================================================
   Modal aparece após pedido entregue. User tira foto com câmera,
   overlay ovelhinha 🐑 + logo + "MilkyPot Chegou!". Compartilha
   no Instagram Stories com hashtag pre-feita.

   Stack:
     - getUserMedia (câmera nativa browser)
     - Canvas API pra compor foto + overlays
     - Web Share API (mobile) + clipboard fallback
     - Upload opcional pra Firebase Storage (analytics futura)

   API pública:
     SelfieSticker.show({ orderId, customerName })
       Abre modal de captura → preview com filtros → share
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpSelfieLoaded) return;
    global._mpSelfieLoaded = true;

    var SHARE_HASHTAG = '#MilkyPotChegou';

    // ============================================================
    // Modal HTML lazy
    // ============================================================
    function show(context) {
        context = context || {};
        var modal = document.createElement('div');
        modal.id = 'mpSelfieModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99994;display:flex;flex-direction:column;color:#fff;font-family:"Segoe UI",sans-serif';
        modal.innerHTML =
            '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.5)">' +
              '<div>' +
                '<div style="font-weight:900;font-size:16px">📸 Mostra pra galera!</div>' +
                '<div style="font-size:12px;opacity:.7">Tira foto com o seu MilkyPot e bota nos Stories</div>' +
              '</div>' +
              '<button id="mpSelfieClose" style="background:rgba(255,255,255,.15);border:0;color:#fff;width:36px;height:36px;border-radius:999px;font-size:20px;cursor:pointer">×</button>' +
            '</div>' +
            '<div id="mpSelfieStage" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;background:#000;overflow:hidden">' +
              '<div id="mpSelfieLoading" style="text-align:center">' +
                '<div style="font-size:48px;margin-bottom:8px">📷</div>' +
                '<div>Pedindo permissão da câmera…</div>' +
              '</div>' +
            '</div>' +
            '<div id="mpSelfieControls" style="padding:16px;background:rgba(0,0,0,.5);display:none">' +
              '<button id="mpSelfieCapture" style="width:80px;height:80px;border-radius:999px;background:#fff;border:6px solid rgba(255,255,255,.4);margin:0 auto;display:block;cursor:pointer"></button>' +
            '</div>' +
            '<div id="mpSelfieReview" style="padding:16px;background:rgba(0,0,0,.5);display:none">' +
              '<canvas id="mpSelfieCanvas" style="width:100%;max-height:60vh;object-fit:contain;border-radius:12px;margin-bottom:16px"></canvas>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                '<button id="mpSelfieRetake" style="background:rgba(255,255,255,.15);color:#fff;border:0;padding:14px;border-radius:12px;font-weight:800;cursor:pointer">↺ Refazer</button>' +
                '<button id="mpSelfieShare" style="background:#25D366;color:#fff;border:0;padding:14px;border-radius:12px;font-weight:900;cursor:pointer">📲 Compartilhar</button>' +
              '</div>' +
              '<div style="font-size:11px;opacity:.7;margin-top:10px;text-align:center">Use ' + SHARE_HASHTAG + ' pra ganhar 50 MilkyCoins 🪙</div>' +
            '</div>';
        document.body.appendChild(modal);

        var video, stream, canvas, ctx;
        var stage = modal.querySelector('#mpSelfieStage');

        function closeModal() {
            if (stream) try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
            modal.remove();
        }
        modal.querySelector('#mpSelfieClose').onclick = closeModal;

        // Pedir câmera
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
            audio: false
        }).then(function (s) {
            stream = s;
            stage.innerHTML = '';
            video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;
            video.style.cssText = 'max-width:100%;max-height:100%;border-radius:8px';
            video.srcObject = stream;
            stage.appendChild(video);
            modal.querySelector('#mpSelfieControls').style.display = 'block';

            if (global.MpAnalytics) global.MpAnalytics.track('selfie_camera_opened');

            modal.querySelector('#mpSelfieCapture').onclick = function () {
                _capture();
            };
        }).catch(function (err) {
            stage.innerHTML =
                '<div style="text-align:center;padding:20px">' +
                  '<div style="font-size:48px;margin-bottom:8px">📷❌</div>' +
                  '<div style="font-size:15px;margin-bottom:8px">Sem acesso à câmera</div>' +
                  '<div style="font-size:13px;opacity:.7">Permite no navegador ou tira foto pelo app de câmera direto</div>' +
                '</div>';
            if (global.MpAnalytics) global.MpAnalytics.track('selfie_camera_denied', { error: err.name });
        });

        function _capture() {
            canvas = modal.querySelector('#mpSelfieCanvas');
            ctx = canvas.getContext('2d');
            var w = video.videoWidth;
            var h = video.videoHeight;
            canvas.width = w;
            canvas.height = h;

            // Espelhar (selfie style)
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, w, h);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Overlay: arco-íris no topo
            var grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgba(236,72,153,.85)');
            grad.addColorStop(.33, 'rgba(249,115,22,.85)');
            grad.addColorStop(.66, 'rgba(245,158,11,.85)');
            grad.addColorStop(1, 'rgba(139,92,246,.85)');
            ctx.fillStyle = grad;
            var bandH = h * 0.08;
            ctx.fillRect(0, 0, w, bandH);

            // Texto topo
            ctx.fillStyle = '#fff';
            ctx.font = '900 ' + Math.floor(bandH * 0.55) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐑 MILKYPOT CHEGOU! 🎉', w / 2, bandH / 2);

            // Watermark bottom-right
            var wmSize = Math.floor(w * 0.12);
            ctx.font = '900 ' + wmSize + 'px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,.95)';
            ctx.strokeStyle = '#EC4899';
            ctx.lineWidth = wmSize * 0.1;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.strokeText('milkypot.com', w - wmSize * 0.3, h - wmSize * 0.3);
            ctx.fillText('milkypot.com', w - wmSize * 0.3, h - wmSize * 0.3);

            // Mostra preview
            modal.querySelector('#mpSelfieControls').style.display = 'none';
            modal.querySelector('#mpSelfieReview').style.display = 'block';
            stage.style.display = 'none';

            if (global.MpAnalytics) global.MpAnalytics.track('selfie_captured');

            modal.querySelector('#mpSelfieRetake').onclick = function () {
                modal.querySelector('#mpSelfieReview').style.display = 'none';
                modal.querySelector('#mpSelfieControls').style.display = 'block';
                stage.style.display = 'flex';
            };
            modal.querySelector('#mpSelfieShare').onclick = function () {
                _share();
            };
        }

        function _share() {
            canvas.toBlob(function (blob) {
                if (!blob) { _toast('⚠ Falha ao gerar foto'); return; }
                var file = new File([blob], 'milkypot-' + Date.now() + '.png', { type: 'image/png' });
                var shareData = {
                    title: 'MilkyPot Chegou! 🐑',
                    text: 'Pediu, chegou! Faz o seu também: milkypot.com ' + SHARE_HASHTAG,
                    files: [file]
                };

                // Web Share API com files (mobile)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share(shareData).then(function () {
                        if (global.MpAnalytics) global.MpAnalytics.track('selfie_shared', { method: 'web_share' });
                        _toast('✓ Compartilhado!');
                        closeModal();
                    }).catch(function () { /* user cancelou */ });
                    return;
                }

                // Fallback: download da imagem + redirect WhatsApp
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
                _toast('✓ Foto baixada! Compartilha nos Stories');
                if (global.MpAnalytics) global.MpAnalytics.track('selfie_shared', { method: 'download' });

                // Upload pro Firebase Storage (background, sem bloquear)
                _uploadToStorage(blob, context).catch(function(){});

                setTimeout(closeModal, 1500);
            }, 'image/png');
        }

        function _toast(msg) {
            var t = document.createElement('div');
            t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;padding:12px 20px;border-radius:999px;font-weight:700;z-index:99999';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 2500);
        }
    }

    function _uploadToStorage(blob, context) {
        if (typeof firebase === 'undefined' || !firebase.storage) return Promise.resolve();
        try {
            var fname = 'selfies/' + (context.orderId || 'anon') + '_' + Date.now() + '.png';
            var ref = firebase.storage().ref().child(fname);
            return ref.put(blob).then(function () {
                console.log('[Selfie] uploaded:', fname);
            });
        } catch (e) {
            return Promise.resolve();
        }
    }

    global.SelfieSticker = {
        show: show,
        VERSION: 'mp-v255'
    };
})(typeof window !== 'undefined' ? window : this);
