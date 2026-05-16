/* ============================================================
   MilkyPot Maps Picker — Drop pin no mapa + GPS one-tap robusto
   ============================================================
   Substitui digitação de endereço por:
     1. Botão "📍 Usar minha localização" — GPS + reverse geocode auto-preenche TUDO
     2. Botão "🗺️ Mapa interativo" — modal com Leaflet, user arrasta ovelhinha
        pra casa, reverse geocode preenche.

   Usa Nominatim (OpenStreetMap, free, sem API key).
   Leaflet (free, open source) lazy-loaded só quando user abre o modal.

   API:
     MapsPicker.useMyLocation()  → flow GPS + auto-preenche inputs
     MapsPicker.openPickerModal() → modal com mapa interativo

   Eventos GA4:
     maps_gps_used, maps_gps_failed, maps_pin_dropped, maps_modal_opened
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpMapsPickerLoaded) return;
    global._mpMapsPickerLoaded = true;

    var LONDRINA_LAT = -23.31;
    var LONDRINA_LON = -51.16;
    var LEAFLET_CDN_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    var LEAFLET_CDN_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    var LEAFLET_LOADED = false;

    // ============================================================
    // Reverse geocode (Nominatim, free)
    // ============================================================
    function reverseGeocode(lat, lon) {
        var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&zoom=18&addressdetails=1';
        return fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
            .then(function (r) { return r.json(); })
            .then(function (json) {
                var addr = json.address || {};
                return {
                    rua: addr.road || addr.pedestrian || addr.cycleway || '',
                    numero: addr.house_number || '',
                    bairro: addr.suburb || addr.neighbourhood || addr.quarter || '',
                    cidade: addr.city || addr.town || addr.village || 'Londrina',
                    cep: (addr.postcode || '').replace(/\D/g, ''),
                    raw: json.display_name || ''
                };
            })
            .catch(function () { return null; });
    }

    // ============================================================
    // Auto-preenche os inputs do checkout
    // ============================================================
    function fillInputs(addr) {
        if (!addr) return;
        var ruaEl = document.getElementById('checkoutAddress');
        var numEl = document.getElementById('checkoutNumber');
        var nbhEl = document.getElementById('checkoutNeighborhood');
        var cepEl = document.getElementById('checkoutCep');

        if (ruaEl && addr.rua) ruaEl.value = addr.rua;
        if (numEl && addr.numero) numEl.value = addr.numero;
        if (nbhEl && addr.bairro) nbhEl.value = addr.bairro;
        if (cepEl && addr.cep && addr.cep.length === 8) {
            cepEl.value = addr.cep.slice(0, 5) + '-' + addr.cep.slice(5);
        }

        // Dispara evento input pra triggar Uber quote
        if (typeof global._scheduleUberQuote === 'function') {
            global._scheduleUberQuote();
        }
    }

    // ============================================================
    // GPS one-tap (substitui flow atual)
    // ============================================================
    function useMyLocation() {
        if (!navigator.geolocation) {
            _toast('⚠ GPS não suportado no seu navegador', '#DC2626');
            if (global.MpAnalytics) global.MpAnalytics.track('maps_gps_failed', { reason: 'no_geolocation' });
            return;
        }
        _toast('📍 Pegando sua localização…', '#3B82F6');
        navigator.geolocation.getCurrentPosition(function (pos) {
            var lat = pos.coords.latitude;
            var lon = pos.coords.longitude;
            reverseGeocode(lat, lon).then(function (addr) {
                if (addr) {
                    fillInputs(addr);
                    _toast('✓ Endereço preenchido', '#10B981');
                    if (global.MpAnalytics) global.MpAnalytics.track('maps_gps_used', {
                        has_street: !!addr.rua, has_cep: !!addr.cep
                    });
                } else {
                    _toast('⚠ Não consegui encontrar seu endereço', '#F59E0B');
                    if (global.MpAnalytics) global.MpAnalytics.track('maps_gps_failed', { reason: 'reverse_failed' });
                }
            });
        }, function (err) {
            _toast('⚠ Não consegui pegar localização', '#F59E0B');
            if (global.MpAnalytics) global.MpAnalytics.track('maps_gps_failed', {
                reason: err.code === 1 ? 'permission_denied' : 'unavailable'
            });
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    }

    // ============================================================
    // Modal com Leaflet (drop pin)
    // ============================================================
    function _loadLeaflet() {
        if (LEAFLET_LOADED) return Promise.resolve();
        if (global.L) { LEAFLET_LOADED = true; return Promise.resolve(); }
        return new Promise(function (resolve) {
            // CSS
            if (!document.querySelector('link[href*="leaflet"]')) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = LEAFLET_CDN_CSS;
                document.head.appendChild(link);
            }
            // JS
            var script = document.createElement('script');
            script.src = LEAFLET_CDN_JS;
            script.onload = function () { LEAFLET_LOADED = true; resolve(); };
            script.onerror = function () { resolve(); };
            document.head.appendChild(script);
        });
    }

    function openPickerModal() {
        if (global.MpAnalytics) global.MpAnalytics.track('maps_modal_opened');

        var modal = document.createElement('div');
        modal.id = 'mpMapsModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99995;display:flex;flex-direction:column;padding:0';
        modal.innerHTML =
            '<div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #FCE7F3">' +
              '<div>' +
                '<div style="font-weight:900;color:#831843;font-size:16px">🗺️ Arraste pra sua casa</div>' +
                '<div style="font-size:12px;color:#6B7280">Solte o ovelhinha 🐑 no local exato</div>' +
              '</div>' +
              '<button id="mpMapsClose" style="background:#FCE7F3;border:0;width:36px;height:36px;border-radius:999px;font-size:20px;cursor:pointer;color:#831843">×</button>' +
            '</div>' +
            '<div id="mpMapsContainer" style="flex:1;background:#F3F4F6;position:relative">' +
              '<div id="mpMapsLoading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6B7280">⏳ Carregando mapa…</div>' +
            '</div>' +
            '<div style="background:#fff;padding:14px 16px;border-top:2px solid #FCE7F3">' +
              '<div id="mpMapsAddress" style="font-size:14px;color:#1F2937;margin-bottom:10px;min-height:20px">📍 Mova o mapa pra ver o endereço</div>' +
              '<button id="mpMapsConfirm" disabled style="width:100%;background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:14px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer;opacity:.5">✓ Usar esse endereço</button>' +
            '</div>';
        document.body.appendChild(modal);

        modal.querySelector('#mpMapsClose').onclick = function () { modal.remove(); };

        _loadLeaflet().then(function () {
            if (!global.L) {
                document.getElementById('mpMapsLoading').textContent = '⚠ Falha ao carregar mapa. Use GPS ou digite manualmente.';
                return;
            }
            document.getElementById('mpMapsLoading').remove();
            var mapEl = document.createElement('div');
            mapEl.id = 'mpLeafletMap';
            mapEl.style.cssText = 'width:100%;height:100%';
            document.getElementById('mpMapsContainer').appendChild(mapEl);

            var center = [LONDRINA_LAT, LONDRINA_LON];
            var map = global.L.map('mpLeafletMap').setView(center, 14);
            global.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(map);

            // Tenta pegar GPS pra centralizar
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    map.setView([pos.coords.latitude, pos.coords.longitude], 17);
                }, function () {}, { timeout: 5000 });
            }

            // Marker draggable com emoji ovelhinha (usa divIcon)
            var icon = global.L.divIcon({
                html: '<div style="font-size:36px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">🐑</div>',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                className: 'mp-pin-icon'
            });
            var marker = global.L.marker(center, { draggable: true, icon: icon }).addTo(map);
            var selectedAddr = null;
            var confirmBtn = document.getElementById('mpMapsConfirm');
            var addrEl = document.getElementById('mpMapsAddress');

            function updateAddress(lat, lon) {
                addrEl.textContent = '🔍 Buscando endereço…';
                reverseGeocode(lat, lon).then(function (addr) {
                    if (addr && addr.raw) {
                        selectedAddr = addr;
                        addrEl.innerHTML = '📍 <strong>' + (addr.rua || addr.raw.split(',').slice(0,2).join(',')) + '</strong>' +
                                           (addr.bairro ? ' · ' + addr.bairro : '') +
                                           (addr.cep ? ' · CEP ' + addr.cep : '');
                        confirmBtn.disabled = false;
                        confirmBtn.style.opacity = '1';
                    } else {
                        addrEl.textContent = '⚠ Não achei endereço aqui. Tenta mover o pin.';
                    }
                });
            }

            marker.on('dragend', function (e) {
                var p = marker.getLatLng();
                updateAddress(p.lat, p.lng);
            });
            map.on('click', function (e) {
                marker.setLatLng(e.latlng);
                updateAddress(e.latlng.lat, e.latlng.lng);
            });

            // Geocode inicial
            updateAddress(center[0], center[1]);

            confirmBtn.onclick = function () {
                if (!selectedAddr) return;
                fillInputs(selectedAddr);
                if (global.MpAnalytics) global.MpAnalytics.track('maps_pin_dropped', {
                    has_street: !!selectedAddr.rua,
                    has_cep: !!selectedAddr.cep
                });
                modal.remove();
                _toast('✓ Endereço escolhido pelo mapa', '#10B981');
            };
        });
    }

    function _toast(msg, color) {
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + (color || '#3B82F6') + ';color:#fff;padding:12px 20px;border-radius:999px;font-weight:700;font-size:13px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.2)';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 3000);
    }

    // ============================================================
    // Public API + override do botão existente _useMyLocation
    // ============================================================
    global.MapsPicker = {
        useMyLocation: useMyLocation,
        openPickerModal: openPickerModal,
        reverseGeocode: reverseGeocode,
        fillInputs: fillInputs,
        VERSION: 'mp-v254'
    };

    // Overrides — cardapio.html chama window._useMyLocation
    // Substituímos pela versão melhorada com reverse geocode robusto.
    global._useMyLocation = useMyLocation;
})(typeof window !== 'undefined' ? window : this);
