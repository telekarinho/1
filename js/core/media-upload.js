/* ============================================================
   MilkyPot Media Upload — Otimização + Firebase Storage
   ============================================================
   Upload direto de fotos/vídeos com compressão client-side.

   Otimizações automáticas:
   - Fotos: redimensiona pra max 1200px, converte pra JPEG 85%
     (reduz 4MB → ~200KB sem perda visível)
   - Vídeos: aceita até 50MB (não comprime no browser, apenas valida)

   Usa Firebase Storage path /products/{fid}/{uuid}.{ext}
   Retorna URL pública + metadata pra salvar em p.midia.fotos/video.

   API:
     MediaUpload.photo(file, fid, opts) → Promise<{url, size, w, h}>
     MediaUpload.video(file, fid, opts) → Promise<{url, size, duration}>
     MediaUpload.remove(url) → Promise<bool>
   ============================================================ */
(function(global){
    'use strict';

    const MAX_PHOTO_SIZE = 10 * 1024 * 1024;   // 10MB entrada
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024;   // 50MB (Firebase Storage cobra acima de 5GB total)
    const TARGET_PHOTO_MAX_SIDE = 1200;        // Lado máximo após resize
    const TARGET_PHOTO_QUALITY = 0.85;         // JPEG quality

    function _uuid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function _extFromType(mime) {
        if (!mime) return 'bin';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('png')) return 'png';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('mp4')) return 'mp4';
        if (mime.includes('quicktime') || mime.includes('mov')) return 'mov';
        if (mime.includes('webm')) return 'webm';
        return mime.split('/')[1] || 'bin';
    }

    /**
     * Redimensiona imagem via canvas + comprime pra JPEG.
     * Mantém proporção, não aumenta imagens pequenas.
     */
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('Arquivo não é imagem'));
            }
            if (file.size > MAX_PHOTO_SIZE) {
                return reject(new Error('Imagem muito grande (max 10MB de entrada)'));
            }
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.onload = e => {
                const img = new Image();
                img.onerror = () => reject(new Error('Arquivo não é imagem válida'));
                img.onload = () => {
                    // Redimensiona mantendo proporção
                    let { width: w, height: h } = img;
                    const maxSide = Math.max(w, h);
                    if (maxSide > TARGET_PHOTO_MAX_SIDE) {
                        const ratio = TARGET_PHOTO_MAX_SIDE / maxSide;
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => {
                        if (!blob) return reject(new Error('Falha na compressão'));
                        resolve({ blob, width: w, height: h, size: blob.size });
                    }, 'image/jpeg', TARGET_PHOTO_QUALITY);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload de foto otimizada pro Firebase Storage.
     */
    function uploadPhoto(file, fid, opts) {
        opts = opts || {};
        if (!global.firebase || !firebase.storage) {
            return Promise.reject(new Error('Firebase Storage não carregado'));
        }
        return compressImage(file).then(({ blob, width, height, size }) => {
            const ext = 'jpg';
            const path = `products/${fid}/${_uuid()}.${ext}`;
            const ref = firebase.storage().ref(path);
            const metadata = {
                contentType: 'image/jpeg',
                customMetadata: {
                    originalName: file.name || 'photo',
                    width: String(width),
                    height: String(height),
                    uploadedAt: new Date().toISOString()
                }
            };
            const task = ref.put(blob, metadata);

            if (opts.onProgress) {
                task.on('state_changed', snap => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    opts.onProgress(pct);
                });
            }

            return task.then(() => ref.getDownloadURL()).then(url => ({
                url, size, width, height, path
            }));
        });
    }

    /**
     * Upload de vídeo (sem compressão no browser).
     * Limita tamanho pra não estourar quota gratuita.
     */
    function uploadVideo(file, fid, opts) {
        opts = opts || {};
        if (!file || !file.type.startsWith('video/')) {
            return Promise.reject(new Error('Arquivo não é vídeo'));
        }
        if (file.size > MAX_VIDEO_SIZE) {
            return Promise.reject(new Error(`Vídeo muito grande (max ${MAX_VIDEO_SIZE/1024/1024}MB). Comprima antes no CapCut/HandBrake.`));
        }
        if (!global.firebase || !firebase.storage) {
            return Promise.reject(new Error('Firebase Storage não carregado'));
        }
        const ext = _extFromType(file.type);
        const path = `products/${fid}/${_uuid()}.${ext}`;
        const ref = firebase.storage().ref(path);
        const metadata = {
            contentType: file.type,
            customMetadata: {
                originalName: file.name || 'video',
                uploadedAt: new Date().toISOString()
            }
        };
        const task = ref.put(file, metadata);

        if (opts.onProgress) {
            task.on('state_changed', snap => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                opts.onProgress(pct);
            });
        }

        return task.then(() => ref.getDownloadURL()).then(url => ({
            url, size: file.size, path
        }));
    }

    /**
     * Remove arquivo do Storage (best-effort).
     */
    function remove(url) {
        if (!url || !global.firebase || !firebase.storage) return Promise.resolve(false);
        try {
            const ref = firebase.storage().refFromURL(url);
            return ref.delete().then(() => true).catch(e => {
                console.warn('MediaUpload.remove:', e.message);
                return false;
            });
        } catch(e) { return Promise.resolve(false); }
    }

    global.MediaUpload = {
        photo: uploadPhoto,
        video: uploadVideo,
        compressImage,
        remove,
        MAX_PHOTO_SIZE,
        MAX_VIDEO_SIZE
    };

    if (typeof window !== 'undefined') window.MediaUpload = global.MediaUpload;
    if (typeof globalThis !== 'undefined') globalThis.MediaUpload = global.MediaUpload;
})(typeof window !== 'undefined' ? window : this);
