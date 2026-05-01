/* ============================================
   MilkyPot - IG Export Helper
   ============================================
   Converte qualquer <div> em imagem PNG (1080x1080,
   1080x1350, 1080x1920) usando html2canvas.
   Tambem copia para clipboard.
   ============================================ */

(function(global){
    'use strict';

    var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    var loading = null;

    function ensureHtml2Canvas(){
        if (loading) return loading;
        if (typeof html2canvas !== 'undefined') return Promise.resolve();
        loading = new Promise(function(resolve, reject){
            var s = document.createElement('script');
            s.src = CDN;
            s.async = true;
            s.onload = function(){ resolve(); };
            s.onerror = function(){ reject(new Error('Falha ao carregar html2canvas')); };
            document.head.appendChild(s);
        });
        return loading;
    }

    function render(element, opts){
        opts = opts || {};
        var width = opts.width || 1080;
        var height = opts.height || 1080;
        var scale = opts.scale || (1080 / element.getBoundingClientRect().width || 1);

        return ensureHtml2Canvas().then(function(){
            return html2canvas(element, {
                width: element.offsetWidth,
                height: element.offsetHeight,
                backgroundColor: null,
                scale: scale,
                useCORS: true,
                logging: false
            });
        });
    }

    var IGExport = {

        /**
         * Gera PNG de um elemento e dispara download.
         * element pode ter aspect exato (ex: 540x540 css) e o scale
         * ajusta pra 1080x1080.
         */
        download: function(element, opts){
            opts = opts || {};
            var filename = opts.filename || ('milkypot_' + Date.now() + '.png');
            return render(element, opts).then(function(canvas){
                var url = canvas.toDataURL('image/png');
                var a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return true;
            });
        },

        /**
         * Gera PNG e tenta copiar para clipboard como imagem.
         * Fallback: alerta explicando limitacao.
         */
        toClipboard: function(element, opts){
            opts = opts || {};
            return render(element, opts).then(function(canvas){
                return new Promise(function(resolve, reject){
                    canvas.toBlob(function(blob){
                        if (!blob) return reject(new Error('Canvas sem blob'));
                        try {
                            if (navigator.clipboard && window.ClipboardItem) {
                                var item = new ClipboardItem({ 'image/png': blob });
                                navigator.clipboard.write([item]).then(function(){
                                    resolve(true);
                                }).catch(function(err){
                                    reject(err);
                                });
                            } else {
                                reject(new Error('Clipboard API indisponivel'));
                            }
                        } catch(e){ reject(e); }
                    }, 'image/png');
                });
            });
        },

        /**
         * Retorna dataURL (base64 png) sem download.
         */
        toDataUrl: function(element, opts){
            return render(element, opts).then(function(canvas){
                return canvas.toDataURL('image/png');
            });
        }
    };

    global.IGExport = IGExport;

})(typeof window !== 'undefined' ? window : this);
