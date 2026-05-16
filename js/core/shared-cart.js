/* ============================================================
   MilkyPot Shared Cart — carrinho colaborativo viral
   ============================================================
   Loop K-factor > 1: cada link compartilhado = nova aquisição.

   Use case:
     "Galera, sextou! Vou pedir MilkyPot, escolhe o seu aqui ↗"
     Host clica "Pedir com a galera" → recebe URL + QR.
     Compartilha no grupo WhatsApp.
     Amigos abrem → veem carrinho atual → adicionam itens.
     Real-time onSnapshot mostra "Maria adicionou X 🍓" toast pra todos.
     Host confirma e finaliza pra todo mundo.

   API:
     SharedCart.create({ items, hostPhone, franchiseId, hostName })
       → retorna { cartId, shareUrl, qrUrl }
     SharedCart.join(cartId)
       → carrega items existentes + ativa real-time sync
     SharedCart.addItem(cartId, item, contributorName)
       → adiciona item ao carrinho coletivo
     SharedCart.finalize(cartId)
       → host finaliza, fecha sessão

   Storage:
     Firestore: shared_carts/{cartId} = {
       items: [...],
       host_phone, host_name, franchise_id,
       contributors: [{ name, phone, items_added: N }],
       created_at, expires_at (2h),
       status: 'open' | 'finalized' | 'expired'
     }
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpSharedCartLoaded) return;
    global._mpSharedCartLoaded = true;

    var EXPIRES_HOURS = 2;
    var _activeListener = null; // unsubscribe handle

    // ============================================================
    // ID / URL helpers
    // ============================================================
    function generateCartId() {
        return 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function buildShareUrl(cartId) {
        return location.origin + '/cardapio.html?shared=' + cartId;
    }

    function buildQrUrl(shareUrl) {
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
            encodeURIComponent(shareUrl) + '&ecc=M&margin=2';
    }

    // ============================================================
    // Firestore layer
    // ============================================================
    function _db() {
        if (!global.firebase || !global.firebase.firestore) return null;
        try { return global.firebase.firestore(); } catch (e) { return null; }
    }

    function _docRef(cartId) {
        var db = _db();
        return db ? db.collection('shared_carts').doc(cartId) : null;
    }

    // ============================================================
    // Create new shared cart
    // ============================================================
    function create(opts) {
        opts = opts || {};
        var cartId = generateCartId();
        var nowIso = new Date().toISOString();
        var expiresAt = new Date(Date.now() + EXPIRES_HOURS * 3600 * 1000).toISOString();

        var doc = {
            cartId: cartId,
            items: opts.items || [],
            hostPhone: opts.hostPhone || '',
            hostName: opts.hostName || 'Host',
            franchiseId: opts.franchiseId || null,
            contributors: [{
                name: opts.hostName || 'Host',
                phone: opts.hostPhone || '',
                itemsAdded: (opts.items || []).length
            }],
            createdAt: nowIso,
            expiresAt: expiresAt,
            status: 'open'
        };

        var ref = _docRef(cartId);
        if (ref) {
            ref.set(doc).catch(function (err) {
                console.warn('[SharedCart] create Firestore:', err.message);
            });
        }

        // Persistência local também
        try { localStorage.setItem('mp_shared_cart_id', cartId); } catch (e) {}

        if (global.MpAnalytics) {
            global.MpAnalytics.track('shared_cart_created', {
                cart_id: cartId,
                initial_items: (opts.items || []).length
            });
        }

        return {
            cartId: cartId,
            shareUrl: buildShareUrl(cartId),
            qrUrl: buildQrUrl(buildShareUrl(cartId)),
            expiresAt: expiresAt
        };
    }

    // ============================================================
    // Join existing cart — ativa real-time sync
    // ============================================================
    function join(cartId, onUpdate) {
        var ref = _docRef(cartId);
        if (!ref) return Promise.reject(new Error('Firestore not ready'));

        // Cleanup listener anterior
        if (_activeListener) { try { _activeListener(); } catch (e) {} _activeListener = null; }

        return ref.get().then(function (snap) {
            if (!snap.exists) {
                throw new Error('Esse pedido em grupo não existe ou expirou.');
            }
            var data = snap.data();

            // Check expiration
            if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
                throw new Error('Esse pedido em grupo expirou (2h limite).');
            }
            if (data.status === 'finalized') {
                throw new Error('O host já finalizou esse pedido.');
            }

            // Ativa real-time listener
            _activeListener = ref.onSnapshot(function (s) {
                if (s.exists && typeof onUpdate === 'function') {
                    onUpdate(s.data());
                }
            });

            try { localStorage.setItem('mp_shared_cart_id', cartId); } catch (e) {}

            if (global.MpAnalytics) {
                global.MpAnalytics.track('shared_cart_joined', { cart_id: cartId });
            }

            return data;
        });
    }

    // ============================================================
    // Add item to shared cart
    // ============================================================
    function addItem(cartId, item, contributorName) {
        var ref = _docRef(cartId);
        if (!ref) return Promise.reject(new Error('Firestore not ready'));
        if (!item || !item.name) return Promise.reject(new Error('Item inválido'));

        var enrichedItem = Object.assign({}, item, {
            addedBy: contributorName || 'Anônimo',
            addedAt: new Date().toISOString(),
            sharedItemId: 'si_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
        });

        // Atomic array-union
        return ref.update({
            items: global.firebase.firestore.FieldValue.arrayUnion(enrichedItem),
            lastActivity: new Date().toISOString()
        }).then(function () {
            if (global.MpAnalytics) {
                global.MpAnalytics.track('shared_cart_item_added', {
                    cart_id: cartId,
                    item_name: item.name,
                    contributor: contributorName || 'Anônimo'
                });
            }
            return enrichedItem;
        });
    }

    // ============================================================
    // Finalize cart (host only)
    // ============================================================
    function finalize(cartId) {
        var ref = _docRef(cartId);
        if (!ref) return Promise.reject(new Error('Firestore not ready'));

        return ref.update({
            status: 'finalized',
            finalizedAt: new Date().toISOString()
        }).then(function () {
            if (global.MpAnalytics) {
                global.MpAnalytics.track('shared_cart_finalized', { cart_id: cartId });
            }
            try { localStorage.removeItem('mp_shared_cart_id'); } catch (e) {}
        });
    }

    // ============================================================
    // Leave (cleanup listener) sem finalizar
    // ============================================================
    function leave() {
        if (_activeListener) {
            try { _activeListener(); } catch (e) {}
            _activeListener = null;
        }
    }

    // ============================================================
    // UI helper: modal "Criar pedido em grupo"
    // ============================================================
    function showCreateModal(onCreate) {
        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99995;display:flex;align-items:center;justify-content:center;padding:16px';
        modal.innerHTML =
            '<div style="background:linear-gradient(135deg,#FFF1F5,#FFE4F1);border-radius:24px;padding:24px;max-width:380px;width:100%;text-align:center;position:relative">' +
              '<button id="mpSharedCloseBtn" style="position:absolute;top:12px;right:14px;background:transparent;border:0;font-size:26px;cursor:pointer;color:#9CA3AF">×</button>' +
              '<div style="font-size:60px;margin-bottom:8px">🐑</div>' +
              '<h2 style="margin:0 0 6px;color:#831843">Pedir com a galera 🎉</h2>' +
              '<p style="font-size:14px;color:#4B5563;margin:0 0 16px;line-height:1.4">Cria um link e cada amigo escolhe o seu MilkyPot. Você finaliza pra todo mundo no final!</p>' +
              '<input id="mpSharedHostName" type="text" placeholder="Seu nome (pra galera saber quem é)" style="width:100%;padding:14px;border:2px solid #FCA5A5;border-radius:12px;font-size:15px;margin-bottom:8px;outline:none"/>' +
              '<input id="mpSharedHostPhone" type="text" inputmode="tel" placeholder="WhatsApp (43) 99999-9999" style="width:100%;padding:14px;border:2px solid #FCA5A5;border-radius:12px;font-size:15px;margin-bottom:12px;outline:none"/>' +
              '<button id="mpSharedCreateBtn" style="width:100%;background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:0;padding:14px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 6px 18px rgba(236,72,153,.4)">🔗 Criar link compartilhável</button>' +
              '<div style="font-size:11px;color:#9CA3AF;margin-top:8px">Link expira em 2 horas</div>' +
            '</div>';
        document.body.appendChild(modal);

        modal.querySelector('#mpSharedCloseBtn').onclick = function () { modal.remove(); };
        modal.querySelector('#mpSharedCreateBtn').onclick = function () {
            var name = modal.querySelector('#mpSharedHostName').value.trim();
            var phone = modal.querySelector('#mpSharedHostPhone').value.trim();
            if (!name) { modal.querySelector('#mpSharedHostName').focus(); return; }
            if (!phone) { modal.querySelector('#mpSharedHostPhone').focus(); return; }
            modal.remove();
            // Pega cart atual como itens iniciais
            var initialItems = [];
            try {
                initialItems = JSON.parse(localStorage.getItem('milkypot_cart') || '[]');
            } catch (e) {}
            var result = create({
                items: initialItems,
                hostName: name,
                hostPhone: phone,
                franchiseId: global._selectedStoreId || 'muffato-quintino'
            });
            if (typeof onCreate === 'function') onCreate(result);
            showShareModal(result);
        };
    }

    // ============================================================
    // UI helper: modal compartilhar link
    // ============================================================
    function showShareModal(result) {
        var modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99995;display:flex;align-items:center;justify-content:center;padding:16px';
        modal.innerHTML =
            '<div style="background:#fff;border-radius:24px;padding:24px;max-width:380px;width:100%;text-align:center;position:relative">' +
              '<button class="mpSharedCloseX" style="position:absolute;top:12px;right:14px;background:transparent;border:0;font-size:26px;cursor:pointer;color:#9CA3AF">×</button>' +
              '<div style="font-size:13px;font-weight:800;letter-spacing:1px;color:#10B981;text-transform:uppercase;margin-bottom:4px">✓ Pedido em grupo criado</div>' +
              '<h2 style="margin:0 0 12px;color:#831843">Manda pra galera 🚀</h2>' +
              '<img src="' + result.qrUrl + '" alt="QR Code" style="width:180px;height:180px;display:block;margin:0 auto 8px;border:8px solid #FFF1F5;border-radius:14px"/>' +
              '<div style="background:#F3F4F6;padding:10px;border-radius:8px;font-family:monospace;font-size:12px;color:#374151;word-break:break-all;margin-bottom:12px">' + result.shareUrl + '</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
                '<button id="mpSharedShareWhatsBtn" style="flex:1;min-width:140px;background:#25D366;color:#fff;border:0;padding:12px;border-radius:10px;font-weight:800;cursor:pointer;font-size:14px"><span>📲</span> Mandar no WhatsApp</button>' +
                '<button id="mpSharedCopyBtn" style="flex:1;min-width:140px;background:#3B82F6;color:#fff;border:0;padding:12px;border-radius:10px;font-weight:800;cursor:pointer;font-size:14px"><span>📋</span> Copiar link</button>' +
              '</div>' +
              '<div style="font-size:11px;color:#9CA3AF;margin-top:10px">Expira em 2h · cada amigo adiciona o pedido dele</div>' +
            '</div>';
        document.body.appendChild(modal);

        modal.querySelector('.mpSharedCloseX').onclick = function () { modal.remove(); };
        modal.querySelector('#mpSharedShareWhatsBtn').onclick = function () {
            var msg = '🎉 Sextou! Pedido coletivo MilkyPot 🐑\nEscolhe o seu sabor aqui ↗\n' + result.shareUrl;
            window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
        };
        modal.querySelector('#mpSharedCopyBtn').onclick = function () {
            try {
                navigator.clipboard.writeText(result.shareUrl);
                this.innerHTML = '<span>✅</span> Copiado!';
            } catch (e) { /* navigator.clipboard pode falhar */ }
        };
    }

    // ============================================================
    // Auto-detect: se URL tem ?shared=xxx, ativa modo grupo
    // ============================================================
    function detectSharedMode() {
        try {
            var params = new URLSearchParams(location.search);
            var cartId = params.get('shared');
            if (!cartId) return null;

            // Tenta carregar (background)
            join(cartId, function (data) {
                _renderJoinedBanner(data);
            }).catch(function (err) {
                console.warn('[SharedCart] join failed:', err.message);
                _showError(err.message);
            });

            return cartId;
        } catch (e) { return null; }
    }

    function _renderJoinedBanner(data) {
        var existing = document.getElementById('mpSharedBanner');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'mpSharedBanner';
            existing.style.cssText = 'position:sticky;top:0;z-index:50;background:linear-gradient(135deg,#FCE7F3,#FED7AA);border-bottom:2px solid #EC4899;padding:10px 16px;text-align:center;font-size:13px;font-weight:700;color:#831843';
            // Insert after header
            var inserted = false;
            var nav = document.querySelector('nav,header');
            if (nav && nav.parentNode) { nav.parentNode.insertBefore(existing, nav.nextSibling); inserted = true; }
            if (!inserted) document.body.insertBefore(existing, document.body.firstChild);
        }
        existing.innerHTML =
            '🐑 <strong>Pedido em grupo</strong> de <strong>' + (data.hostName || '?') + '</strong> · ' +
            (data.items || []).length + ' itens · ' +
            '<span style="color:#10B981">✓ Conectado</span>';

        if (global.MpAnalytics) {
            global.MpAnalytics.track('shared_cart_banner_shown', {
                items_count: (data.items || []).length
            });
        }
    }

    function _showError(msg) {
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#DC2626;color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(220,38,38,.4)';
        toast.textContent = '⚠ ' + msg;
        document.body.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 5000);
    }

    // ============================================================
    // Public API
    // ============================================================
    global.SharedCart = {
        create: create,
        join: join,
        addItem: addItem,
        finalize: finalize,
        leave: leave,
        showCreateModal: showCreateModal,
        showShareModal: showShareModal,
        detectSharedMode: detectSharedMode,
        VERSION: 'mp-v248'
    };

    // Auto-detect on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(detectSharedMode, 1500);
        });
    } else {
        setTimeout(detectSharedMode, 1500);
    }
})(typeof window !== 'undefined' ? window : this);
