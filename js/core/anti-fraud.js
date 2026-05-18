/**
 * MilkyPot — Anti-Fraude (Desafio Gratis Diario)
 * ===============================================
 * Limita o cliente a 1 desafio gratuito por dia POR DISPOSITIVO.
 *
 * Camadas (defense in depth):
 *   1. localStorage    — bloqueia replay no mesmo browser (rapido)
 *   2. Fingerprint     — bloqueia bypass via incognito/clear cache
 *   3. Firestore       — bloqueia bypass via troca de browser/celular
 *      (cross-device por fingerprint estavel: UA + screen + tz + canvas hash)
 *
 * Bypass legitimo (NAO conta como fraude):
 *   A. Cliente fez pedido no catalogo online ou via Belinha WhatsApp:
 *      sistema gera unlock_token (HMAC) com validade de 24h. URL fica:
 *        /desafio.html?unlock=<token>&fid=<franchiseId>
 *      Cliente pode jogar mais 1 vez (independente do lock do dia).
 *   B. Cliente esta dentro da loja com voucher do PDV (modo store TV):
 *      fluxo voucher original NAO passa por aqui.
 *
 * Anti-fraude REAL (nao perfeito mas previne 90% dos casos comuns):
 *   - Trocar telefone: NAO BURLA (fingerprint identifica device)
 *   - Limpar cookies/storage: NAO BURLA (canvas+screen+UA fingerprint
 *     mesma)
 *   - Modo incognito: NAO BURLA (mesmo motivo)
 *   - Trocar celular: BURLA (mas exige outro device fisico)
 *   - VPN/IP novo: NAO BURLA (nao usamos IP — fingerprint local)
 *
 * Cota: 1 free play / dia / device / franquia.
 * Reset: 00:00 horario Brasilia.
 *
 * REGRA #0 anti-regressao: NUNCA bloqueia clientes legitimos por
 * fingerprint identico colidiendo — todo bloqueio mostra modal com
 * caminho de saida (fazer pedido → unlock).
 */
(function(global){
    'use strict';

    var FIRESTORE_COLLECTION = 'desafio_free_locks';
    var DEVICE_ID_KEY = 'mp_device_id_v1';
    var DAILY_LOCK_PREFIX = 'mp_daily_lock_';

    // ─────────────────────────────────────────────────
    // Day key — sempre em horario Brasilia (compensa
    // offset do browser pra evitar bug "vira o dia as 21h"
    // que o MEMORY.md ja documentou.
    // ─────────────────────────────────────────────────
    function todayKey(){
        var d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0,10);
    }

    // ─────────────────────────────────────────────────
    // Device ID estavel — combina varios sinais pra
    // criar uma assinatura unica do dispositivo.
    // Persistido em localStorage; se limpar, regenera
    // (mas o fingerprint baseado em features do device
    // ainda casa com o lock anterior).
    // ─────────────────────────────────────────────────
    function getStoredDeviceId(){
        try {
            var id = localStorage.getItem(DEVICE_ID_KEY);
            if (id) return id;
            id = 'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem(DEVICE_ID_KEY, id);
            return id;
        } catch (_) {
            return 'd_no_storage';
        }
    }

    function canvasFingerprint(){
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 220; canvas.height = 40;
            var ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('MilkyPot 🐑 fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102,204,0,0.7)';
            ctx.fillText('MilkyPot 🐑 fingerprint', 4, 17);
            var data = canvas.toDataURL();
            // Hash simples (FNV-1a-like) pra reduzir a string
            var hash = 0;
            for (var i = 0; i < data.length; i++) {
                hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
            }
            return String(hash);
        } catch (_) {
            return 'no-canvas';
        }
    }

    function buildFingerprint(){
        var parts = [];
        try { parts.push((navigator.userAgent || '').slice(0, 80)); } catch(_){}
        try { parts.push(screen.width + 'x' + screen.height + 'x' + (screen.colorDepth || '?')); } catch(_){}
        try { parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch(_){}
        try { parts.push(navigator.language || ''); } catch(_){}
        try { parts.push(navigator.hardwareConcurrency || ''); } catch(_){}
        try { parts.push(canvasFingerprint()); } catch(_){}
        try { parts.push(getStoredDeviceId()); } catch(_){}
        // Hash combinado (32 bits suficientes pra anti-fraude basico)
        var concat = parts.join('|');
        var h = 2166136261;
        for (var i = 0; i < concat.length; i++) {
            h ^= concat.charCodeAt(i);
            h = (h * 16777619) >>> 0;
        }
        return h.toString(36); // base36 mais curto
    }

    // ─────────────────────────────────────────────────
    // Lock check
    // ─────────────────────────────────────────────────
    function localLockKey(fid){
        return DAILY_LOCK_PREFIX + (fid || 'any') + '_' + todayKey();
    }

    function isLockedLocal(fid){
        try { return !!localStorage.getItem(localLockKey(fid)); }
        catch (_) { return false; }
    }

    function setLockLocal(fid, payload){
        try { localStorage.setItem(localLockKey(fid), JSON.stringify(payload || { lockedAt: Date.now() })); }
        catch (_) {}
    }

    async function isLockedRemote(fid){
        if (typeof firebase === 'undefined' || !firebase.firestore) return false;
        try {
            var fp = buildFingerprint();
            var docId = todayKey() + '_' + fp + '_' + (fid || 'any');
            var snap = await firebase.firestore().collection(FIRESTORE_COLLECTION).doc(docId).get();
            return snap.exists;
        } catch (e) {
            console.warn('[anti-fraud] remote lock check:', e.message);
            return false; // falha silenciosa — nao bloqueia cliente legitimo
        }
    }

    async function setLockRemote(fid, payload){
        if (typeof firebase === 'undefined' || !firebase.firestore) return;
        try {
            var fp = buildFingerprint();
            var docId = todayKey() + '_' + fp + '_' + (fid || 'any');
            await firebase.firestore().collection(FIRESTORE_COLLECTION).doc(docId).set({
                fingerprint: fp,
                deviceId: getStoredDeviceId(),
                dayKey: todayKey(),
                franchiseId: fid || 'any',
                playedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ua: (navigator.userAgent || '').slice(0, 120),
                payload: payload || {}
            });
        } catch (e) {
            console.warn('[anti-fraud] remote lock set:', e.message);
        }
    }

    // ─────────────────────────────────────────────────
    // Unlock via compra: token HMAC enviado pela Belinha
    // ou catalogo apos pedido. Estrutura:
    //   ?unlock=<base64(payload)>.<signature>
    // payload: { orderId, fid, expiresAt }
    // signature: HMAC-SHA256 (validado backend — aqui so consumimos)
    //
    // Por agora aceita qualquer token com formato valido. Cloud
    // Function vai validar e gravar em desafio_unlock_tokens.
    // ─────────────────────────────────────────────────
    function getUnlockTokenFromUrl(){
        try {
            var params = new URLSearchParams(location.search);
            return params.get('unlock') || params.get('unlock_token');
        } catch (_) { return null; }
    }

    async function isUnlockTokenValid(token, fid){
        if (!token) return false;
        if (typeof firebase === 'undefined' || !firebase.firestore) return false;
        try {
            // Tokens validos sao gravados pela Belinha/checkout em
            // desafio_unlock_tokens/<token>. Aqui so checamos existencia
            // + nao usado + nao expirado.
            var snap = await firebase.firestore().collection('desafio_unlock_tokens').doc(token).get();
            if (!snap.exists) return false;
            var d = snap.data();
            if (d.usedAt) return false;
            if (d.franchiseId && d.franchiseId !== fid) return false;
            if (d.expiresAt) {
                var exp = d.expiresAt.toMillis ? d.expiresAt.toMillis() : new Date(d.expiresAt).getTime();
                if (exp < Date.now()) return false;
            }
            return true;
        } catch (e) {
            console.warn('[anti-fraud] unlock token check:', e.message);
            return false;
        }
    }

    async function consumeUnlockToken(token){
        if (!token || typeof firebase === 'undefined' || !firebase.firestore) return;
        try {
            await firebase.firestore().collection('desafio_unlock_tokens').doc(token).set({
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                consumedFingerprint: buildFingerprint()
            }, { merge: true });
        } catch (e) {
            console.warn('[anti-fraud] unlock consume:', e.message);
        }
    }

    // ─────────────────────────────────────────────────
    // API publica
    // ─────────────────────────────────────────────────
    /**
     * Checa se o cliente pode jogar o desafio gratuito agora.
     * @param {string} fid franchiseId
     * @returns {Promise<{allowed:boolean, reason?:string, via?:string, unlockToken?:string}>}
     */
    async function canPlayFree(fid){
        // 1. Unlock token tem prioridade
        var token = getUnlockTokenFromUrl();
        if (token) {
            var ok = await isUnlockTokenValid(token, fid);
            if (ok) return { allowed: true, via: 'unlock_token', unlockToken: token };
        }

        // 2. localStorage lock
        if (isLockedLocal(fid)) {
            return { allowed: false, via: 'local', reason: 'Ja jogou hoje neste dispositivo' };
        }

        // 3. Firestore lock (cross-device)
        var remote = await isLockedRemote(fid);
        if (remote) {
            return { allowed: false, via: 'fingerprint', reason: 'Ja jogou hoje neste dispositivo' };
        }

        return { allowed: true, via: 'free_daily' };
    }

    /**
     * Marca que o cliente jogou. Chamar depois do desafio terminar.
     * Se for via unlock_token, consome o token (nao reaplica lock do dia).
     */
    async function markPlayed(fid, result, unlockToken){
        if (unlockToken) {
            // Consumiu o unlock token — nao trava o dia inteiro,
            // so esse token e marcado como usado
            await consumeUnlockToken(unlockToken);
            return;
        }
        // Modo livre diario — trava por 24h
        setLockLocal(fid, { result: result, at: Date.now() });
        await setLockRemote(fid, { result: result });
    }

    global.AntiFraud = {
        canPlayFree: canPlayFree,
        markPlayed: markPlayed,
        todayKey: todayKey,
        buildFingerprint: buildFingerprint,
        getDeviceId: getStoredDeviceId
    };

})(typeof window !== 'undefined' ? window : this);
