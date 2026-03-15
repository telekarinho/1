/**
 * MilkyPot - In-App Notification Center
 * Real-time notifications with bell icon, dropdown, toast, and sound alerts
 */
const Notifications = {
    _container: null,
    _bell: null,
    _dropdown: null,
    _unreadCount: 0,
    _notifications: [],
    _isOpen: false,

    // Initialize - creates the bell icon and dropdown
    init() {
        this._notifications = JSON.parse(localStorage.getItem('mp_notifications') || '[]');
        this._unreadCount = this._notifications.filter(n => !n.read).length;
        this._injectStyles();
        this._createBell();
        this._startListening();
    },

    // Inject CSS styles for the notification system
    _injectStyles() {
        if (document.getElementById('mp-notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'mp-notif-styles';
        style.textContent = `
            .mp-notif-bell {
                position: relative;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.3rem;
                padding: 6px 10px;
                border-radius: 8px;
                transition: background 0.2s;
            }
            .mp-notif-bell:hover {
                background: rgba(0,0,0,0.05);
            }
            .mp-notif-badge {
                position: absolute;
                top: 2px;
                right: 2px;
                background: #42A5F5;
                color: #fff;
                font-size: 0.65rem;
                font-weight: 800;
                min-width: 18px;
                height: 18px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                padding: 0 4px;
                font-family: 'Nunito', sans-serif;
                box-shadow: 0 1px 4px rgba(233,30,99,0.4);
            }
            .mp-notif-badge.hidden {
                display: none;
            }
            .mp-notif-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: 360px;
                max-height: 460px;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                z-index: 9999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(0,0,0,0.08);
            }
            .mp-notif-dropdown.open {
                display: flex;
            }
            .mp-notif-dropdown-header {
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #fafafa;
            }
            .mp-notif-dropdown-header h4 {
                margin: 0;
                font-family: 'Baloo 2', cursive;
                font-size: 1rem;
                color: #2d1b4e;
            }
            .mp-notif-dropdown-header .mp-notif-count {
                font-size: 0.75rem;
                color: #888;
            }
            .mp-notif-list {
                flex: 1;
                overflow-y: auto;
                max-height: 340px;
            }
            .mp-notif-list::-webkit-scrollbar {
                width: 6px;
            }
            .mp-notif-list::-webkit-scrollbar-thumb {
                background: #ddd;
                border-radius: 3px;
            }
            .mp-notif-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 20px;
                border-bottom: 1px solid #f5f5f5;
                cursor: pointer;
                transition: background 0.15s;
                position: relative;
            }
            .mp-notif-item:hover {
                background: #f9f5ff;
            }
            .mp-notif-item.unread {
                background: #fef7ff;
            }
            .mp-notif-item.unread::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
            }
            .mp-notif-item.type-info.unread::before { background: #2196F3; }
            .mp-notif-item.type-order.unread::before { background: #FF9800; }
            .mp-notif-item.type-alert.unread::before { background: #F44336; }
            .mp-notif-item.type-success.unread::before { background: #4CAF50; }
            .mp-notif-item.type-finance.unread::before { background: #9C27B0; }
            .mp-notif-icon {
                font-size: 1.4rem;
                flex-shrink: 0;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: #f5f5f5;
            }
            .mp-notif-item.type-info .mp-notif-icon { background: #E3F2FD; }
            .mp-notif-item.type-order .mp-notif-icon { background: #FFF3E0; }
            .mp-notif-item.type-alert .mp-notif-icon { background: #FFEBEE; }
            .mp-notif-item.type-success .mp-notif-icon { background: #E8F5E9; }
            .mp-notif-item.type-finance .mp-notif-icon { background: #F3E5F5; }
            .mp-notif-body {
                flex: 1;
                min-width: 0;
            }
            .mp-notif-title {
                font-weight: 700;
                font-size: 0.85rem;
                color: #2d1b4e;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .mp-notif-msg {
                font-size: 0.78rem;
                color: #666;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .mp-notif-time {
                font-size: 0.7rem;
                color: #aaa;
                margin-top: 4px;
            }
            .mp-notif-empty {
                padding: 40px 20px;
                text-align: center;
                color: #aaa;
                font-size: 0.85rem;
            }
            .mp-notif-footer {
                display: flex;
                border-top: 1px solid #f0f0f0;
                background: #fafafa;
            }
            .mp-notif-footer button {
                flex: 1;
                padding: 12px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 0.78rem;
                font-weight: 600;
                color: #888;
                transition: background 0.15s, color 0.15s;
                font-family: 'Nunito', sans-serif;
            }
            .mp-notif-footer button:hover {
                background: #f0e8ff;
                color: #7c3aed;
            }
            .mp-notif-footer button + button {
                border-left: 1px solid #f0f0f0;
            }
            /* Toast notification */
            .mp-toast-notif {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                z-index: 10000;
                max-width: 380px;
                transform: translateX(120%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid #2196F3;
            }
            .mp-toast-notif.show {
                transform: translateX(0);
            }
            .mp-toast-notif.type-info { border-left-color: #2196F3; }
            .mp-toast-notif.type-order { border-left-color: #FF9800; }
            .mp-toast-notif.type-alert { border-left-color: #F44336; }
            .mp-toast-notif.type-success { border-left-color: #4CAF50; }
            .mp-toast-notif.type-finance { border-left-color: #9C27B0; }
            .mp-toast-notif .mp-toast-icon {
                font-size: 1.3rem;
                flex-shrink: 0;
            }
            .mp-toast-notif .mp-toast-body {
                flex: 1;
            }
            .mp-toast-notif .mp-toast-title {
                font-weight: 700;
                font-size: 0.85rem;
                color: #2d1b4e;
                margin-bottom: 2px;
            }
            .mp-toast-notif .mp-toast-msg {
                font-size: 0.78rem;
                color: #666;
            }
            .mp-toast-notif .mp-toast-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.1rem;
                color: #bbb;
                padding: 0 4px;
                line-height: 1;
            }
            .mp-toast-notif .mp-toast-close:hover {
                color: #666;
            }
            /* Bell wrapper for positioning dropdown */
            .mp-notif-wrapper {
                position: relative;
                display: inline-flex;
            }
            @media (max-width: 480px) {
                .mp-notif-dropdown {
                    width: calc(100vw - 24px);
                    right: -12px;
                }
            }
        `;
        document.head.appendChild(style);
    },

    // Create bell icon in header
    _createBell() {
        // Try multiple containers in order of preference
        let headerRight = document.querySelector('.panel-header-right')
            || document.querySelector('.panel-header')
            || document.querySelector('header');

        // If no header element exists at all, create a fixed container
        if (!headerRight) {
            headerRight = document.createElement('div');
            headerRight.id = 'mp-notif-fixed-container';
            headerRight.style.cssText = 'position:fixed;top:12px;right:16px;z-index:9998;display:flex;align-items:center;';
            document.body.appendChild(headerRight);
        }

        // Remove existing placeholder bell buttons
        const existingBells = headerRight.querySelectorAll('.header-btn[title="Notificacoes"]');
        existingBells.forEach(btn => btn.remove());

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'mp-notif-wrapper';

        // Create bell button
        this._bell = document.createElement('button');
        this._bell.className = 'mp-notif-bell header-btn';
        this._bell.title = 'Notificacoes';
        this._bell.innerHTML = '<span style="pointer-events:none">&#x1F514;</span>';

        // Badge
        const badge = document.createElement('span');
        badge.className = 'mp-notif-badge' + (this._unreadCount === 0 ? ' hidden' : '');
        badge.id = 'mp-notif-badge';
        badge.textContent = this._unreadCount;
        this._bell.appendChild(badge);

        // Dropdown
        this._dropdown = document.createElement('div');
        this._dropdown.className = 'mp-notif-dropdown';
        this._dropdown.id = 'mp-notif-dropdown';
        this._renderDropdown();

        // Events
        this._bell.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown();
        });

        document.addEventListener('click', (e) => {
            if (this._isOpen && !this._dropdown.contains(e.target)) {
                this._closeDropdown();
            }
        });

        wrapper.appendChild(this._bell);
        wrapper.appendChild(this._dropdown);

        // Insert at the beginning of header-right (before logout)
        const logoutBtn = headerRight.querySelector('.btn-logout');
        if (logoutBtn) {
            headerRight.insertBefore(wrapper, logoutBtn);
        } else {
            headerRight.appendChild(wrapper);
        }
    },

    _toggleDropdown() {
        if (this._isOpen) {
            this._closeDropdown();
        } else {
            this._openDropdown();
        }
    },

    _openDropdown() {
        this._isOpen = true;
        this._dropdown.classList.add('open');
        this._renderDropdown();
    },

    _closeDropdown() {
        this._isOpen = false;
        this._dropdown.classList.remove('open');
    },

    _getIcon(type) {
        const icons = {
            info: '\u2139\uFE0F',
            order: '\uD83D\uDCE6',
            alert: '\u26A0\uFE0F',
            success: '\u2705',
            finance: '\uD83D\uDCB0'
        };
        return icons[type] || icons.info;
    },

    _renderDropdown() {
        if (!this._dropdown) return;

        const header = `
            <div class="mp-notif-dropdown-header">
                <h4>Notificacoes</h4>
                <span class="mp-notif-count">${this._unreadCount} nao lida(s)</span>
            </div>
        `;

        let list = '';
        if (this._notifications.length === 0) {
            list = '<div class="mp-notif-empty">Nenhuma notificacao</div>';
        } else {
            list = this._notifications.map(n => `
                <div class="mp-notif-item type-${n.type} ${n.read ? '' : 'unread'}"
                     data-id="${n.id}"
                     onclick="Notifications._onItemClick('${n.id}', ${n.link ? "'" + n.link + "'" : 'null'})">
                    <div class="mp-notif-icon">${this._getIcon(n.type)}</div>
                    <div class="mp-notif-body">
                        <div class="mp-notif-title">${this._escapeHtml(n.title)}</div>
                        <div class="mp-notif-msg">${this._escapeHtml(n.message)}</div>
                        <div class="mp-notif-time">${this._timeAgo(n.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        }

        const footer = `
            <div class="mp-notif-footer">
                <button onclick="Notifications.markAllRead()">Marcar todas como lidas</button>
                <button onclick="Notifications.clear()">Limpar</button>
            </div>
        `;

        this._dropdown.innerHTML = header + '<div class="mp-notif-list">' + list + '</div>' + footer;
    },

    _onItemClick(id, link) {
        this.markAsRead(id);
        if (link) {
            window.location.href = link;
        }
    },

    // Add notification
    add(title, message, type, link) {
        type = type || 'info';
        link = link || null;
        const notif = {
            id: (typeof Utils !== 'undefined' && Utils.generateId) ? Utils.generateId() : ('n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            title: title,
            message: message,
            type: type,
            link: link,
            read: false,
            createdAt: new Date().toISOString()
        };
        this._notifications.unshift(notif);
        if (this._notifications.length > 50) {
            this._notifications = this._notifications.slice(0, 50);
        }
        this._save();
        this._updateBadge();
        this._renderDropdown();
        this._showToastNotif(notif);
        // Play sound for important notifications
        if (type === 'order' || type === 'alert') {
            this._playSound();
        }
    },

    // Show toast notification
    _showToastNotif(notif) {
        const toast = document.createElement('div');
        toast.className = 'mp-toast-notif type-' + notif.type;
        toast.innerHTML = `
            <span class="mp-toast-icon">${this._getIcon(notif.type)}</span>
            <div class="mp-toast-body">
                <div class="mp-toast-title">${this._escapeHtml(notif.title)}</div>
                <div class="mp-toast-msg">${this._escapeHtml(notif.message)}</div>
            </div>
            <button class="mp-toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(toast);

        // Stack toasts
        const existingToasts = document.querySelectorAll('.mp-toast-notif.show');
        const offset = existingToasts.length * 90;
        toast.style.top = (20 + offset) + 'px';

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Play notification sound using Web Audio API
    _playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { /* audio not supported */ }
    },

    // Mark a single notification as read
    markAsRead(id) {
        const notif = this._notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            this._save();
            this._updateBadge();
            this._renderDropdown();
        }
    },

    // Mark all as read
    markAllRead() {
        this._notifications.forEach(n => { n.read = true; });
        this._save();
        this._updateBadge();
        this._renderDropdown();
    },

    // Clear all notifications
    clear() {
        this._notifications = [];
        this._save();
        this._updateBadge();
        this._renderDropdown();
        this._closeDropdown();
    },

    // Save to localStorage
    _save() {
        localStorage.setItem('mp_notifications', JSON.stringify(this._notifications));
    },

    // Update the badge count
    _updateBadge() {
        this._unreadCount = this._notifications.filter(n => !n.read).length;
        const badge = document.getElementById('mp-notif-badge');
        if (badge) {
            badge.textContent = this._unreadCount;
            if (this._unreadCount === 0) {
                badge.classList.add('hidden');
            } else {
                badge.classList.remove('hidden');
            }
        }
    },

    // Listen for real-time order changes
    _startListening() {
        if (typeof DataStore !== 'undefined' && typeof Auth !== 'undefined') {
            try {
                const session = Auth.getSession();
                if (session && session.franchiseId && typeof DataStore.onOrdersChange === 'function') {
                    DataStore.onOrdersChange(session.franchiseId, (orders) => {
                        const storageKey = 'mp_last_order_count_' + session.franchiseId;
                        const lastCount = parseInt(localStorage.getItem(storageKey) || '0');
                        if (orders.length > lastCount && lastCount > 0) {
                            const newOrders = orders.length - lastCount;
                            this.add(
                                'Novo Pedido!',
                                newOrders + ' novo(s) pedido(s) recebido(s)',
                                'order',
                                'pedidos.html'
                            );
                        }
                        localStorage.setItem(storageKey, orders.length.toString());
                    });
                }
            } catch (e) { /* session might not exist */ }
        }
    },

    // Time ago helper
    _timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'agora';
        if (mins < 60) return mins + 'min';
        var hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h';
        var days = Math.floor(hours / 24);
        return days + 'd';
    },

    // Simple HTML escape
    _escapeHtml(str) {
        if (typeof Utils !== 'undefined' && Utils.escapeHtml) return Utils.escapeHtml(str);
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { Notifications.init(); });
} else {
    Notifications.init();
}
