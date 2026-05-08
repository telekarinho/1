/* MilkyPot — Geofence module
   Validacao de proximidade da loja antes de bater ponto. Anti-fraude. */
(function () {
    'use strict';

    var DEFAULT_RADIUS_M = 150;       // 150m por padrao
    var DEFAULT_REQUIRED = false;     // por default nao bloqueia (so registra)

    // Distancia haversine em metros
    function haversine(lat1, lon1, lat2, lon2) {
        var R = 6371000;
        var toRad = function (d) { return d * Math.PI / 180; };
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function getStoreLocation(franchiseId) {
        if (typeof DataStore === 'undefined') return null;
        var franchises = DataStore.getAllFranchises() || [];
        var f = franchises.find(function (x) { return x.id === franchiseId; });
        if (!f) return null;
        var lat = f.latitude || (f.location && f.location.lat) || (f.geo && f.geo.lat);
        var lng = f.longitude || (f.location && f.location.lng) || (f.geo && f.geo.lng);
        if (!lat || !lng) return null;
        return {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius: parseInt(f.geofenceRadiusM || DEFAULT_RADIUS_M, 10),
            required: f.geofenceRequired !== undefined ? !!f.geofenceRequired : DEFAULT_REQUIRED,
            name: f.name
        };
    }

    function validate(franchiseId, userLat, userLng) {
        var store = getStoreLocation(franchiseId);
        if (!store) {
            return {
                valid: true,
                blocked: false,
                reason: 'no_store_location',
                message: 'Loja sem coordenadas cadastradas — nao foi possivel validar proximidade.'
            };
        }
        if (userLat == null || userLng == null) {
            return {
                valid: false,
                blocked: store.required,
                reason: 'no_user_location',
                message: 'Localizacao do usuario indisponivel.'
            };
        }
        var dist = haversine(store.lat, store.lng, userLat, userLng);
        var inside = dist <= store.radius;
        return {
            valid: inside,
            blocked: !inside && store.required,
            distance: Math.round(dist),
            radius: store.radius,
            store: store,
            reason: inside ? 'inside' : 'outside',
            message: inside
                ? 'Voce esta a ' + Math.round(dist) + 'm da loja (dentro do raio de ' + store.radius + 'm).'
                : 'Voce esta a ' + Math.round(dist) + 'm da loja (fora do raio de ' + store.radius + 'm).'
        };
    }

    window.Geofence = {
        haversine: haversine,
        getStoreLocation: getStoreLocation,
        validate: validate,
        DEFAULT_RADIUS_M: DEFAULT_RADIUS_M
    };
})();
