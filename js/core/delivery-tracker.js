/* ============================================
   MilkyPot - Delivery GPS Tracker
   ============================================
   Rastreamento em tempo real de entregas.
   Usa Geolocation API + Firestore para
   compartilhar localização com o cliente.
   ============================================ */

const DeliveryTracker = {
    _watchId: null,
    _currentPosition: null,
    _trackingOrderId: null,
    _listeners: [],
    _updateInterval: null,

    // ============================================
    // Iniciar rastreamento (lado do entregador)
    // ============================================
    async startTracking(orderId) {
        if (!navigator.geolocation) {
            return { success: false, error: 'Geolocalização não suportada neste dispositivo' };
        }

        this._trackingOrderId = orderId;

        return new Promise((resolve) => {
            this._watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this._currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed,
                        heading: position.coords.heading,
                        timestamp: new Date().toISOString()
                    };

                    // Salva no DataStore para sincronizar
                    this._savePosition(orderId, this._currentPosition);

                    // Notifica listeners locais
                    this._listeners.forEach(fn => fn(this._currentPosition));

                    resolve({ success: true, position: this._currentPosition });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    resolve({ success: false, error: this._translateGeoError(error.code) });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );

            // Atualiza Firestore a cada 15 segundos
            this._updateInterval = setInterval(() => {
                if (this._currentPosition) {
                    this._savePosition(orderId, this._currentPosition);
                }
            }, 15000);
        });
    },

    // ============================================
    // Parar rastreamento
    // ============================================
    stopTracking() {
        if (this._watchId !== null) {
            navigator.geolocation.clearWatch(this._watchId);
            this._watchId = null;
        }
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }

        // Limpa posição do pedido
        if (this._trackingOrderId) {
            this._clearPosition(this._trackingOrderId);
            this._trackingOrderId = null;
        }

        this._currentPosition = null;
        this._listeners = [];
    },

    // ============================================
    // Observar posição do entregador (lado do cliente)
    // ============================================
    watchDelivery(orderId, callback) {
        // Poll a cada 10 segundos
        const check = () => {
            const pos = this.getDeliveryPosition(orderId);
            if (pos) {
                callback(pos);
            }
        };

        check(); // Primeira checagem imediata
        const interval = setInterval(check, 10000);

        // Retorna função para parar de observar
        return () => clearInterval(interval);
    },

    // ============================================
    // Obter posição atual de um pedido
    // ============================================
    getDeliveryPosition(orderId) {
        const key = `delivery_tracking_${orderId}`;
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            const pos = JSON.parse(data);
            // Posição expira após 10 minutos
            const age = Date.now() - new Date(pos.timestamp).getTime();
            if (age > 600000) {
                localStorage.removeItem(key);
                return null;
            }
            return pos;
        } catch (e) {
            return null;
        }
    },

    // ============================================
    // Calcular distância e ETA
    // ============================================
    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return null;

        const R = 6371; // Raio da Terra em km
        const dLat = this._toRad(pos2.lat - pos1.lat);
        const dLon = this._toRad(pos2.lng - pos1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRad(pos1.lat)) * Math.cos(this._toRad(pos2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distância em km
    },

    estimateETA(deliveryPosition, destinationPosition) {
        const distance = this.calculateDistance(deliveryPosition, destinationPosition);
        if (!distance) return null;

        // Velocidade média de entrega: 30 km/h em área urbana
        const avgSpeed = deliveryPosition.speed
            ? Math.max(deliveryPosition.speed * 3.6, 10) // m/s para km/h, mín 10
            : 30;

        const etaMinutes = Math.ceil((distance / avgSpeed) * 60);
        return {
            distanceKm: distance.toFixed(1),
            etaMinutes,
            etaText: etaMinutes < 1 ? 'Chegando!' :
                etaMinutes === 1 ? '~1 minuto' :
                    `~${etaMinutes} minutos`
        };
    },

    // ============================================
    // Renderizar mapa simples (sem Google Maps)
    // ============================================
    renderTrackingCard(containerId, orderId, destinationCoords) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const update = () => {
            const pos = this.getDeliveryPosition(orderId);

            if (!pos) {
                container.innerHTML = `
                    <div style="text-align:center;padding:24px;background:#f5f5f5;border-radius:12px">
                        <div style="font-size:48px;margin-bottom:8px">🛵</div>
                        <p style="color:#666;margin:0">Aguardando localização do entregador...</p>
                    </div>
                `;
                return;
            }

            const eta = destinationCoords
                ? this.estimateETA(pos, destinationCoords)
                : null;

            container.innerHTML = `
                <div style="background:linear-gradient(135deg,#42A5F5,#FF5722);border-radius:12px;padding:20px;color:white">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                        <div style="font-size:32px">🛵</div>
                        <div>
                            <div style="font-weight:700;font-size:16px">Entrega em andamento</div>
                            <div style="font-size:12px;opacity:0.9">Pedido #${Utils.escapeHtml(orderId)}</div>
                        </div>
                    </div>
                    ${eta ? `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px;text-align:center">
                            <div style="font-size:20px;font-weight:800">${eta.etaText}</div>
                            <div style="font-size:11px;opacity:0.8">Previsão</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px;text-align:center">
                            <div style="font-size:20px;font-weight:800">${eta.distanceKm} km</div>
                            <div style="font-size:11px;opacity:0.8">Distância</div>
                        </div>
                    </div>
                    ` : ''}
                    <div style="font-size:11px;opacity:0.7;text-align:right">
                        📍 Atualizado: ${new Date(pos.timestamp).toLocaleTimeString('pt-BR')}
                        ${pos.accuracy ? ` (±${Math.round(pos.accuracy)}m)` : ''}
                    </div>
                    <a href="https://www.google.com/maps?q=${pos.lat},${pos.lng}"
                       target="_blank" rel="noopener"
                       style="display:block;margin-top:12px;text-align:center;background:rgba(255,255,255,0.2);padding:10px;border-radius:8px;color:white;text-decoration:none;font-weight:600">
                        📍 Ver no Google Maps
                    </a>
                </div>
            `;
        };

        update();
        // Atualiza a cada 10 segundos
        const interval = setInterval(update, 10000);
        // Retorna cleanup function
        return () => clearInterval(interval);
    },

    // ============================================
    // Status de entrega com timeline
    // ============================================
    renderDeliveryTimeline(containerId, order) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const statusFlow = [
            { key: 'novo', label: 'Pedido recebido', icon: '📋' },
            { key: 'confirmado', label: 'Confirmado', icon: '✅' },
            { key: 'preparando', label: 'Preparando', icon: '👨‍🍳' },
            { key: 'pronto', label: 'Pronto', icon: '🍦' },
            { key: 'em_entrega', label: 'Em entrega', icon: '🛵' },
            { key: 'entregue', label: 'Entregue', icon: '🎉' }
        ];

        const currentIdx = statusFlow.findIndex(s => s.key === order.status);

        container.innerHTML = `
            <div style="padding:16px">
                ${statusFlow.map((s, i) => {
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return `
                    <div style="display:flex;align-items:flex-start;gap:12px;position:relative;padding-bottom:${i < statusFlow.length - 1 ? '20px' : '0'}">
                        <div style="
                            width:32px;height:32px;border-radius:50%;
                            display:flex;align-items:center;justify-content:center;
                            font-size:16px;flex-shrink:0;
                            background:${isDone ? '#42A5F5' : '#eee'};
                            color:${isDone ? 'white' : '#999'};
                            ${isCurrent ? 'box-shadow:0 0 0 4px rgba(233,30,99,0.2);' : ''}
                        ">${s.icon}</div>
                        ${i < statusFlow.length - 1 ? `
                        <div style="
                            position:absolute;left:15px;top:32px;
                            width:2px;height:20px;
                            background:${isDone && i < currentIdx ? '#42A5F5' : '#eee'};
                        "></div>` : ''}
                        <div>
                            <div style="font-weight:${isCurrent ? '700' : '500'};color:${isDone ? '#333' : '#999'};font-size:14px">
                                ${s.label}
                            </div>
                            ${isCurrent ? '<div style="font-size:11px;color:#42A5F5;margin-top:2px">Status atual</div>' : ''}
                        </div>
                    </div>`;
        }).join('')}
            </div>
        `;
    },

    // ============================================
    // Adicionar listener de posição
    // ============================================
    onPositionUpdate(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(fn => fn !== callback);
        };
    },

    // ============================================
    // Helpers
    // ============================================
    _savePosition(orderId, position) {
        const key = `delivery_tracking_${orderId}`;
        localStorage.setItem(key, JSON.stringify(position));

        // Tenta salvar no Firestore para sincronização cross-device
        if (typeof DataStore !== 'undefined' && DataStore._db) {
            try {
                DataStore._db.collection('delivery_tracking').doc(orderId).set(position);
            } catch (e) {
                // Firestore offline, usa só localStorage
            }
        }
    },

    _clearPosition(orderId) {
        localStorage.removeItem(`delivery_tracking_${orderId}`);
        if (typeof DataStore !== 'undefined' && DataStore._db) {
            try {
                DataStore._db.collection('delivery_tracking').doc(orderId).delete();
            } catch (e) { }
        }
    },

    _toRad(deg) {
        return deg * Math.PI / 180;
    },

    _translateGeoError(code) {
        switch (code) {
            case 1: return 'Permissão de localização negada. Ative nas configurações do navegador.';
            case 2: return 'Não foi possível obter a localização. Tente novamente.';
            case 3: return 'Tempo esgotado ao buscar localização. Verifique seu GPS.';
            default: return 'Erro desconhecido de geolocalização';
        }
    }
};
