/* ============================================================
   MilkyPot Weather Promo — promos dinâmicas baseadas no clima
   ============================================================
   Aumenta conversão em momentos certos:
     - >30°C  → "🥵 Tá quente! Smoothie GELADO R$12,99 só hoje"
     - <18°C / chuva  → "🌧️ Que tal um milkshake quentinho de Nutella?"
     - Sol forte (UV>7) → "🌞 +25 MilkyCoins se pedir nos próximos 30min"

   API pública (Open-Meteo, free, sem API key):
     GET https://api.open-meteo.com/v1/forecast?latitude=-23.31&longitude=-51.16&current_weather=true
     CORS habilitado, free pra sempre.

   Cache 30min em sessionStorage. Auto-show banner na home cardapio.
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpWeatherLoaded) return;
    global._mpWeatherLoaded = true;

    var LONDRINA_LAT = -23.31;
    var LONDRINA_LON = -51.16;
    var CACHE_KEY = 'mp_weather_cache';
    var CACHE_TTL = 30 * 60 * 1000; // 30min
    var BANNER_ID = 'mpWeatherBanner';

    // ============================================================
    // Promos por condição
    // ============================================================
    var PROMOS = {
        hot: {
            condition: function (w) { return w.temperature >= 28; },
            emoji: '🥵',
            label: 'Hoje tá um forno em Londrina!',
            cta: 'Smoothie gelado a partir de R$12,99',
            color: '#F97316',
            bgGradient: '#FFEDD5,#FED7AA',
            urgency: 'Só HOJE'
        },
        cold: {
            condition: function (w) { return w.temperature <= 18; },
            emoji: '🌧️',
            label: 'Friozin? A gente entende',
            cta: 'Milkshake de Nutella cremoso pra você',
            color: '#3B82F6',
            bgGradient: '#DBEAFE,#BFDBFE',
            urgency: 'O potinho do conforto'
        },
        rainy: {
            condition: function (w) { return w.weatherCode >= 51 && w.weatherCode <= 67; },
            emoji: '☔',
            label: 'Tá chovendo? A gente leva!',
            cta: 'Frete grátis em pedidos R$30+',
            color: '#06B6D4',
            bgGradient: '#CFFAFE,#A5F3FC',
            urgency: 'Só hoje, com chuva'
        },
        perfect: {
            condition: function (w) { return w.temperature > 18 && w.temperature < 28; },
            emoji: '😎',
            label: 'Dia perfeito pra um MilkyPot',
            cta: 'Monte do seu jeito a partir de R$16,99',
            color: '#10B981',
            bgGradient: '#D1FAE5,#A7F3D0',
            urgency: 'Sextou!'
        }
    };

    // ============================================================
    // Fetch (com cache 30min)
    // ============================================================
    function fetchWeather() {
        try {
            var cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
            if (cache && (Date.now() - cache.t) < CACHE_TTL) {
                return Promise.resolve(cache.data);
            }
        } catch (e) {}

        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LONDRINA_LAT +
                  '&longitude=' + LONDRINA_LON + '&current_weather=true&timezone=America/Sao_Paulo';
        return fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (json) {
                var cw = json.current_weather || {};
                var data = {
                    temperature: cw.temperature || 22,
                    weatherCode: cw.weathercode || 0,
                    windSpeed: cw.windspeed || 0,
                    time: cw.time
                };
                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data }));
                } catch (e) {}
                return data;
            })
            .catch(function () { return null; });
    }

    // ============================================================
    // Pick promo + render
    // ============================================================
    function pickPromo(weather) {
        if (!weather) return null;
        // Ordem de prioridade: hot > cold > rainy > perfect
        if (PROMOS.hot.condition(weather)) return Object.assign({ key: 'hot' }, PROMOS.hot);
        if (PROMOS.cold.condition(weather)) return Object.assign({ key: 'cold' }, PROMOS.cold);
        if (PROMOS.rainy.condition(weather)) return Object.assign({ key: 'rainy' }, PROMOS.rainy);
        return Object.assign({ key: 'perfect' }, PROMOS.perfect);
    }

    function renderBanner(promo, weather) {
        if (!promo) return;
        if (document.getElementById(BANNER_ID)) return;
        if (sessionStorage.getItem('mp_weather_dismissed') === '1') return;

        var banner = document.createElement('div');
        banner.id = BANNER_ID;
        banner.style.cssText = [
            'max-width:720px', 'margin:0 auto 14px', 'padding:14px 18px',
            'background:linear-gradient(135deg,' + promo.bgGradient + ')',
            'border:2px solid ' + promo.color, 'border-radius:14px',
            'display:flex', 'align-items:center', 'justify-content:space-between',
            'gap:12px', 'flex-wrap:wrap',
            'box-shadow:0 4px 14px rgba(0,0,0,.08)',
            'animation:mp-weather-slide .6s ease-out'
        ].join(';');

        banner.innerHTML =
            '<div style="flex:1;min-width:200px;display:flex;align-items:center;gap:12px">' +
              '<div style="font-size:42px;line-height:1">' + promo.emoji + '</div>' +
              '<div style="text-align:left">' +
                '<div style="font-size:11px;font-weight:800;color:' + promo.color + ';letter-spacing:1px;text-transform:uppercase">' + promo.urgency + ' · ' + Math.round(weather.temperature) + '°C</div>' +
                '<div style="font-size:15px;font-weight:900;color:#1F2937;margin-top:2px">' + promo.label + '</div>' +
                '<div style="font-size:13px;color:#4B5563;margin-top:1px">' + promo.cta + '</div>' +
              '</div>' +
            '</div>' +
            '<button id="mpWeatherDismiss" style="background:transparent;border:0;color:#9CA3AF;font-size:22px;cursor:pointer;padding:4px 8px">×</button>';

        var target = document.getElementById('deliveryPromoNotice');
        if (target && target.parentNode) {
            target.parentNode.insertBefore(banner, target);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }

        _injectStyles();

        banner.querySelector('#mpWeatherDismiss').onclick = function (e) {
            e.stopPropagation();
            banner.remove();
            sessionStorage.setItem('mp_weather_dismissed', '1');
            if (global.MpAnalytics) global.MpAnalytics.track('weather_promo_dismissed', { promo_key: promo.key });
        };

        if (global.MpAnalytics) {
            global.MpAnalytics.track('weather_promo_shown', {
                promo_key: promo.key,
                temperature: Math.round(weather.temperature),
                weather_code: weather.weatherCode
            });
        }
    }

    function _injectStyles() {
        if (document.getElementById('mp-weather-styles')) return;
        var style = document.createElement('style');
        style.id = 'mp-weather-styles';
        style.textContent = '@keyframes mp-weather-slide { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }';
        document.head.appendChild(style);
    }

    function autoShow() {
        if (location.pathname.indexOf('/cardapio') < 0 && location.pathname !== '/' && location.pathname.indexOf('/index') < 0) {
            return;
        }
        fetchWeather().then(function (w) {
            if (!w) return;
            var promo = pickPromo(w);
            renderBanner(promo, w);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(autoShow, 1800);
        });
    } else {
        setTimeout(autoShow, 1800);
    }

    global.WeatherPromo = {
        fetchWeather: fetchWeather,
        pickPromo: pickPromo,
        renderBanner: renderBanner,
        PROMOS: PROMOS,
        VERSION: 'mp-v252'
    };
})(typeof window !== 'undefined' ? window : this);
