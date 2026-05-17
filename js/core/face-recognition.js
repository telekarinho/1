/* ============================================
   MilkyPot — Face Recognition (anti-fraude ponto)
   ============================================
   Wrapper sobre face-api.js (@vladmandic/face-api) com:
   - Loading LAZY (modelos só carregam quando precisa)
   - Graceful degradation TOTAL (nunca bloqueia o ponto se algo falhar)
   - Cache de descriptor da foto-referência (calcula 1x quando admin cadastra)
   - Threshold sensato pra evitar falsos negativos

   USO:
     await FaceRecognition.init();                              // 1x na app (lazy)
     const descA = await FaceRecognition.descriptor(imgA);      // foto-ref
     const descB = await FaceRecognition.descriptor(imgB);      // selfie atual
     const result = FaceRecognition.compare(descA, descB);
     // result = { distance: 0.32, match: true, confidence: 0.85, status: 'match' }

   STATUS POSSÍVEIS:
     'match'      → distance < 0.4  (alta similaridade, mesmo rosto)
     'maybe'      → distance 0.4-0.6 (pode ser, admin revisa)
     'no_match'   → distance > 0.6  (rostos diferentes)
     'no_face'    → não detectou rosto na imagem
     'error'      → falha técnica (modelo, rede, etc)

   IMPORTANTE: 'no_face' e 'error' NUNCA devem bloquear o ponto —
   funcionário registra mesmo assim e admin audita manualmente.
   ============================================ */

(function() {
    'use strict';

    const FACE_API_CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js';
    // Modelos hosted pelo @vladmandic/face-api (mais leves, atualizados)
    const MODELS_BASE = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';

    // Thresholds — Euclidean distance entre descriptors (128 floats)
    // < 0.4 = mesmo rosto (alta confiança)
    // 0.4-0.6 = pode ser (revisar)
    // > 0.6 = rostos diferentes
    const THRESHOLD_MATCH = 0.4;
    const THRESHOLD_MAYBE = 0.6;

    let _ready = false;
    let _loading = null;
    let _loadFailed = false;

    // ============================================
    // INIT — carrega face-api.js + modelos uma vez
    // ============================================
    async function init() {
        if (_ready) return true;
        if (_loadFailed) return false;
        if (_loading) return _loading;

        _loading = (async () => {
            try {
                // Carrega script CDN se ainda não carregou
                if (typeof faceapi === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = FACE_API_CDN;
                        s.async = true;
                        s.onload = resolve;
                        s.onerror = () => reject(new Error('face-api CDN failed'));
                        document.head.appendChild(s);
                    });
                }

                // Carrega modelos em paralelo
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_BASE),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_BASE),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_BASE)
                ]);

                _ready = true;
                console.log('[FaceRecognition] modelos carregados ✓');
                return true;
            } catch (e) {
                console.warn('[FaceRecognition] falhou ao carregar:', e.message);
                _loadFailed = true;
                return false;
            } finally {
                _loading = null;
            }
        })();

        return _loading;
    }

    // ============================================
    // DESCRIPTOR — extrai vetor 128-D de um rosto
    // ============================================
    // input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | dataURL
    // returns: Float32Array(128) ou null se sem rosto detectado
    async function descriptor(imageOrUrl) {
        if (!_ready) {
            const ok = await init();
            if (!ok) return null;
        }
        try {
            let img = imageOrUrl;
            if (typeof imageOrUrl === 'string') {
                // dataURL ou URL — carrega como Image
                img = await new Promise((resolve, reject) => {
                    const i = new Image();
                    i.crossOrigin = 'anonymous';
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = imageOrUrl;
                });
            }
            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,         // 320 = bom balance velocidade/precisão
                    scoreThreshold: 0.5
                }))
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection || !detection.descriptor) {
                return null;
            }
            // Float32Array → Array regular pra serializar JSON
            return Array.from(detection.descriptor);
        } catch (e) {
            console.warn('[FaceRecognition] descriptor falhou:', e.message);
            return null;
        }
    }

    // ============================================
    // COMPARE — calcula similaridade entre 2 descriptors
    // ============================================
    function compare(descRef, descTest) {
        if (!descRef || !descTest) {
            return { distance: null, match: false, confidence: 0, status: 'no_face' };
        }
        if (descRef.length !== descTest.length) {
            return { distance: null, match: false, confidence: 0, status: 'error' };
        }

        // Euclidean distance
        let sum = 0;
        for (let i = 0; i < descRef.length; i++) {
            const d = descRef[i] - descTest[i];
            sum += d * d;
        }
        const distance = Math.sqrt(sum);

        // Confidence inverso (1 - distance, normalizado)
        const confidence = Math.max(0, Math.min(1, 1 - distance));

        let status, match;
        if (distance < THRESHOLD_MATCH) {
            status = 'match'; match = true;
        } else if (distance < THRESHOLD_MAYBE) {
            status = 'maybe'; match = false;
        } else {
            status = 'no_match'; match = false;
        }

        return { distance: Math.round(distance * 1000) / 1000, match, confidence: Math.round(confidence * 100) / 100, status };
    }

    // ============================================
    // QUICK CHECK — wrapper conveniente
    // ============================================
    // Recebe 2 dataURLs e retorna result completo
    async function checkMatch(refImage, testImage, refDescriptorCached) {
        try {
            const ok = await init();
            if (!ok) return { distance: null, match: false, status: 'error', error: 'face-api unavailable' };

            // Se já tem descriptor cached da foto-ref, usa direto
            const descRef = refDescriptorCached || await descriptor(refImage);
            if (!descRef) return { distance: null, match: false, status: 'no_face', error: 'ref sem rosto detectado' };

            const descTest = await descriptor(testImage);
            if (!descTest) return { distance: null, match: false, status: 'no_face', error: 'selfie sem rosto detectado' };

            const result = compare(descRef, descTest);
            // Anexa descriptor da selfie pra salvar no record (auditoria futura)
            result.testDescriptor = descTest;
            return result;
        } catch (e) {
            return { distance: null, match: false, status: 'error', error: e.message };
        }
    }

    // ============================================
    // STATE — pra UI checar disponibilidade
    // ============================================
    function isReady() { return _ready; }
    function isLoading() { return !!_loading; }
    function isFailed() { return _loadFailed; }

    window.FaceRecognition = {
        init,
        descriptor,
        compare,
        checkMatch,
        isReady,
        isLoading,
        isFailed,
        THRESHOLD_MATCH,
        THRESHOLD_MAYBE
    };
})();
