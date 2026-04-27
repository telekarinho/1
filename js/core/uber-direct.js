/* ============================================
   MilkyPot - Uber Direct Client Module
   ============================================
   Singleton window.UberDirect
   Inicializa com settings + rules da franquia,
   expoe cotacao, renderizacao de bloco de entrega,
   criacao e consulta de entregas reais.
   ============================================ */

window.UberDirect = (function () {

    var _settings = null;
    var _rules = null;

    // ============================================
    // INIT — carrega settings + rules da franquia
    // ============================================
    async function init(franchiseId) {
        try {
            var [settingsResult, rulesResult] = await Promise.all([
                CloudFunctions.call('uberDirect_getSettings', { franchiseId }),
                CloudFunctions.call('uberDirect_getPricingRules', { franchiseId })
            ]);

            if (settingsResult && settingsResult.success) {
                _settings = settingsResult.settings || null;
            }
            if (rulesResult && rulesResult.success) {
                _rules = rulesResult.rules || null;
            }
        } catch (e) {
            console.warn('[UberDirect] init error:', e);
        }
    }

    // ============================================
    // isActive — verifica se Uber Direct esta ativo
    // ============================================
    function isActive() {
        return !!(
            _settings &&
            _settings.active &&
            _rules &&
            _rules.active
        );
    }

    // ============================================
    // getQuote — cotacao de entrega
    // pickup = { address, lat, lng, name, phone }
    // dropoff = { address, lat, lng, name, phone }
    // manifest = array de itens do carrinho
    // ============================================
    async function getQuote(franchiseId, orderId, pickup, dropoff, manifest, orderTotal) {
        try {
            var result = await CloudFunctions.call('uberDirect_getQuote', {
                franchiseId,
                orderId,
                pickup,
                dropoff,
                manifest,
                order_total: orderTotal
            });
            if (result && result.success) {
                return result;
            }
            console.warn('[UberDirect] getQuote falhou:', result);
            return null;
        } catch (e) {
            console.warn('[UberDirect] getQuote error:', e);
            return null;
        }
    }

    // ============================================
    // renderDeliveryBlock — exibe bloco de entrega
    // no checkout. Salva quote_id e customer_fee
    // em window._uberQuoteId e window._uberCustomerFee
    // ============================================
    async function renderDeliveryBlock(containerId, franchiseId, orderId, dropoff, manifest, orderTotal) {
        var container = document.getElementById(containerId);
        if (!container) return;

        // Spinner enquanto cota
        container.innerHTML = _spinnerHtml();

        if (!isActive()) {
            container.innerHTML = _unavailableHtml('Entrega via Uber Direct nao disponivel para esta loja.');
            return;
        }

        // Monta pickup a partir das settings carregadas
        var pickup = {
            address: (_settings.pickup_address_json && typeof _settings.pickup_address_json === 'string')
                ? _settings.pickup_address_json
                : (_settings.pickup_address_json ? JSON.stringify(_settings.pickup_address_json) : ''),
            lat: _settings.pickup_lat || 0,
            lng: _settings.pickup_lng || 0,
            name: _settings.pickup_name || 'MilkyPot',
            phone: _settings.pickup_phone || ''
        };

        var quote = await getQuote(franchiseId, orderId, pickup, dropoff, manifest, orderTotal);

        if (!quote) {
            container.innerHTML = _unavailableHtml('Nao foi possivel calcular o frete agora. Voce pode optar por retirada na loja.');
            window._uberQuoteId = null;
            window._uberCustomerFee = undefined;
            return;
        }

        // Salva no escopo global para placeOrder usar
        window._uberQuoteId = quote.quote_id;
        window._uberCustomerFee = quote.customer_fee || 0;

        container.innerHTML = _quoteCardHtml(quote);
    }

    // ============================================
    // createDelivery — cria entrega real apos pagamento
    // ============================================
    async function createDelivery(franchiseId, orderId, quoteId) {
        try {
            var result = await CloudFunctions.call('uberDirect_createDelivery', {
                franchiseId,
                orderId,
                quote_id: quoteId
            });
            return result || { success: false, error: 'Sem resposta' };
        } catch (e) {
            console.warn('[UberDirect] createDelivery error:', e);
            return { success: false, error: e.message || 'Erro ao criar entrega' };
        }
    }

    // ============================================
    // getDelivery — consulta status de uma entrega
    // ============================================
    async function getDelivery(franchiseId, deliveryId, orderId) {
        try {
            var result = await CloudFunctions.call('uberDirect_getDelivery', {
                franchiseId,
                deliveryId,
                orderId
            });
            return result || { success: false, error: 'Sem resposta' };
        } catch (e) {
            console.warn('[UberDirect] getDelivery error:', e);
            return { success: false, error: e.message || 'Erro ao consultar entrega' };
        }
    }

    // ============================================
    // testConnection — testa credenciais
    // ============================================
    async function testConnection(franchiseId) {
        try {
            var result = await CloudFunctions.call('uberDirect_testConnection', { franchiseId });
            return result || { success: false, error: 'Sem resposta' };
        } catch (e) {
            console.warn('[UberDirect] testConnection error:', e);
            return { success: false, error: e.message || 'Erro ao testar conexao' };
        }
    }

    // ============================================
    // HTML HELPERS
    // ============================================
    function _spinnerHtml() {
        return '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;' +
               'background:#F3F0FF;border:1px solid #D4A5FF;border-radius:10px;' +
               'font-family:\'Nunito\',sans-serif;font-size:14px;color:#4A3B5C;">' +
               '<div style="width:20px;height:20px;border:2px solid #D4A5FF;' +
               'border-top-color:#7C3AED;border-radius:50%;animation:uberSpin .7s linear infinite;flex-shrink:0"></div>' +
               'Calculando frete Uber Direct...' +
               '</div>' +
               '<style>@keyframes uberSpin{to{transform:rotate(360deg)}}</style>';
    }

    function _unavailableHtml(msg) {
        return '<div style="display:flex;align-items:flex-start;gap:10px;padding:14px 16px;' +
               'background:#FFF3F3;border:1px solid #FFCDD2;border-radius:10px;' +
               'font-family:\'Nunito\',sans-serif;font-size:13px;color:#B71C1C;">' +
               '<span style="font-size:18px;flex-shrink:0">&#9888;</span>' +
               '<span>' + msg + '</span>' +
               '</div>';
    }

    function _quoteCardHtml(quote) {
        var isFree = !!quote.is_free;
        var customerFee = quote.customer_fee || 0;
        var uberFee = quote.uber_fee || 0;
        var pickupMin = quote.estimated_pickup_min || 0;
        var dropoffMin = quote.estimated_dropoff_min || 0;
        var distKm = quote.distance_km ? quote.distance_km.toFixed(1) : '?';
        var absorbed = quote.absorbed_by || '';

        var absorbedNote = '';
        if (isFree && absorbed) {
            var absorbedLabel = absorbed === 'franchise' ? 'franquia' : absorbed === 'milkypot' ? 'MilkyPot' : absorbed;
            absorbedNote = '<span style="font-size:11px;color:#388E3C;margin-left:6px">(custo absorvido pela ' + absorbedLabel + ')</span>';
        }

        var feeDisplay = isFree
            ? '<span style="font-weight:800;color:#2E7D32;font-size:15px">Entrega Gratis &#127881;</span>' + absorbedNote
            : '<span style="font-weight:800;font-size:15px">R$ ' + customerFee.toFixed(2).replace('.', ',') + '</span>';

        return '<div style="background:#F3F0FF;border:1px solid #7C3AED;border-radius:12px;' +
               'padding:16px;font-family:\'Nunito\',sans-serif;">' +
               '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
               '<div style="display:flex;align-items:center;gap:8px">' +
               '<span style="background:#000;color:#fff;font-size:10px;font-weight:700;' +
               'padding:3px 8px;border-radius:6px;letter-spacing:.5px">UBER</span>' +
               '<span style="font-size:13px;font-weight:700;color:#2D1B4E">Uber Direct</span>' +
               '</div>' +
               feeDisplay +
               '</div>' +
               '<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:#6B5B8A">' +
               '<span>&#128345; ' + pickupMin + '-' + dropoffMin + ' min</span>' +
               '<span>&#128205; ' + distKm + ' km</span>' +
               (uberFee > 0 ? '<span>Custo Uber: R$ ' + uberFee.toFixed(2).replace('.', ',') + '</span>' : '') +
               '</div>' +
               '</div>';
    }

    // API publica
    return {
        init: init,
        isActive: isActive,
        getQuote: getQuote,
        renderDeliveryBlock: renderDeliveryBlock,
        createDelivery: createDelivery,
        getDelivery: getDelivery,
        testConnection: testConnection,
        // Expoe internals de forma controlada para a pagina admin
        _getSettings: function () { return _settings; },
        _getRules: function () { return _rules; }
    };

})();
