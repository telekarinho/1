/* ============================================
   MilkyPot - Uber Direct (stub honesto)
   ============================================
   Estado: NÃO IMPLEMENTADO (frontend stub).

   Para ativar de verdade:
     1. Obter credenciais Uber Direct (Customer ID + OAuth Client/Secret)
     2. Salvar via UberDirect.saveCredentials() no DataStore
     3. Implementar Cloud Function `uberDirectQuote` e `uberDirectCreateDelivery`
        em functions/index.js (backend, nunca chamar a API direto do
        navegador — o secret vaza)
     4. Trocar UberDirect.isConfigured() para checar a Cloud Function
   ============================================ */

var UberDirect = (function() {
    var CREDS_KEY = 'uber_direct_credentials';

    function getCreds() {
        try {
            var raw = localStorage.getItem(CREDS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    }

    function saveCredentials(creds) {
        // creds = { customerId, environment: 'sandbox'|'production', webhookUrl }
        // Client ID / Secret NÃO devem ser salvos no client. Vai pra
        // Firebase Functions config (firebase functions:secrets:set).
        if (!creds || !creds.customerId) {
            throw new Error('customerId obrigatório');
        }
        localStorage.setItem(CREDS_KEY, JSON.stringify({
            customerId: creds.customerId,
            environment: creds.environment || 'sandbox',
            webhookUrl: creds.webhookUrl || '',
            savedAt: new Date().toISOString()
        }));
        return true;
    }

    function isConfigured() {
        var c = getCreds();
        return !!(c && c.customerId);
    }

    // Cota uma entrega — STUB. No futuro chama Cloud Function.
    function quote(params) {
        // params = { pickup: {address}, dropoff: {address}, total }
        return new Promise(function(resolve) {
            if (!isConfigured()) {
                resolve({
                    ok: false,
                    error: 'NOT_CONFIGURED',
                    message: 'Credenciais Uber Direct não configuradas. Vá em Configurações > Integrações.'
                });
                return;
            }
            // STUB — retorna cotação fake mas marcada como mock
            resolve({
                ok: true,
                mock: true,
                fee: 7.50,
                etaMinutes: 25,
                quoteId: 'mock_' + Date.now(),
                message: 'Cotação simulada (Cloud Function ainda não implementada)'
            });
        });
    }

    function createDelivery(params) {
        return new Promise(function(resolve) {
            if (!isConfigured()) {
                resolve({ ok: false, error: 'NOT_CONFIGURED', message: 'Configure credenciais Uber Direct.' });
                return;
            }
            resolve({
                ok: false,
                error: 'BACKEND_NOT_IMPLEMENTED',
                message: 'Cloud Function uberDirectCreateDelivery ainda não foi implementada em functions/index.js'
            });
        });
    }

    function trackingUrl(deliveryId) {
        var c = getCreds();
        if (!c || !deliveryId) return null;
        var base = c.environment === 'production'
            ? 'https://www.uber.com/track/'
            : 'https://sandbox.uber.com/track/';
        return base + encodeURIComponent(deliveryId);
    }

    return {
        getCreds: getCreds,
        saveCredentials: saveCredentials,
        isConfigured: isConfigured,
        quote: quote,
        createDelivery: createDelivery,
        trackingUrl: trackingUrl
    };
})();

if (typeof window !== 'undefined') window.UberDirect = UberDirect;
