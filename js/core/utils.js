/* ============================================
   MilkyPot - Utilidades Compartilhadas
   ============================================ */

const Utils = {
    // Gera ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // Formata moeda BRL
    formatCurrency(value) {
        return 'R$ ' + (value || 0).toFixed(2).replace('.', ',');
    },

    // Formata data BR
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR');
    },

    // Formata data e hora BR
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Formata hora
    formatTime(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Data de hoje em formato YYYY-MM-DD (TIMEZONE LOCAL, nao UTC)
    // Importante: pedidos criados a noite em BRT podem ter timestamp UTC do dia seguinte
    today() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    },

    // Converte timestamp ISO (geralmente UTC) para YYYY-MM-DD em timezone local
    localDateOf(isoTimestamp) {
        if (!isoTimestamp) return '';
        const d = new Date(isoTimestamp);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    },

    // Início do mês atual — retorna YYYY-MM-DD (sem hora) para comparar com dateKey
    startOfMonth() {
        const d = new Date();
        // Usar data local (não UTC) para evitar bug de fuso: Brasília UTC-3 faz
        // new Date(ano, mes, 1).toISOString() retornar "...T03:00:00Z" que é
        // lexicograficamente maior que "YYYY-MM-01" e exclui o dia 1 do filtro.
        const yyyy = d.getFullYear();
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        return yyyy + '-' + mm + '-01';
    },

    // Toast notification
    showToast(message, type = 'success') {
        const existing = document.querySelector('.mp-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `mp-toast mp-toast-${type}`;
        toast.innerHTML = `
            <span class="mp-toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Debounce
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    // Calcula percentual de mudança
    percentChange(current, previous) {
        if (!previous) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    },

    // Status badge HTML
    statusBadge(status) {
        const map = {
            'ativo': { color: '#4CAF50', label: 'Ativo', icon: '🟢' },
            'inativo': { color: '#F44336', label: 'Inativo', icon: '🔴' },
            'pendente': { color: '#FF9800', label: 'Pendente', icon: '🟡' },
            'novo': { color: '#2196F3', label: 'Novo', icon: '🔵' },
            'confirmado': { color: '#2196F3', label: 'Confirmado', icon: '✔️' },
            'preparando': { color: '#FF9800', label: 'Preparando', icon: '🟡' },
            'pronto': { color: '#4CAF50', label: 'Pronto', icon: '🟢' },
            'em_entrega': { color: '#9C27B0', label: 'Em Entrega', icon: '🛵' },
            'entregue': { color: '#9E9E9E', label: 'Entregue', icon: '✅' },
            'cancelado': { color: '#F44336', label: 'Cancelado', icon: '❌' },
            'pago': { color: '#4CAF50', label: 'Pago', icon: '✅' },
            'atrasado': { color: '#F44336', label: 'Atrasado', icon: '🔴' },
            'vencendo': { color: '#FF9800', label: 'Vencendo', icon: '⚠️' }
        };
        const s = map[status] || { color: '#999', label: status, icon: '⚪' };
        return `<span class="status-badge" style="background:${s.color}15;color:${s.color};border:1px solid ${s.color}30">${s.icon} ${s.label}</span>`;
    },

    // Escapa HTML para prevenir XSS
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    // Sanitiza objeto - escapa todas as strings
    sanitizeObject(obj) {
        if (typeof obj === 'string') return this.escapeHtml(obj);
        if (Array.isArray(obj)) return obj.map(item => this.sanitizeObject(item));
        if (obj && typeof obj === 'object') {
            const clean = {};
            for (const [key, value] of Object.entries(obj)) {
                clean[key] = this.sanitizeObject(value);
            }
            return clean;
        }
        return obj;
    },

    // Valida email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Valida senha (min 8 chars, 1 maiuscula, 1 numero)
    isStrongPassword(password) {
        return password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password);
    },

    // Gera senha aleatoria segura
    generateSecurePassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    },

    // Gera token seguro usando crypto API
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Slug from name
    slugify(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    },

    // Grava CSV e faz download
    downloadCSV(filename, headers, rows) {
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.Utils = Utils;
if (typeof globalThis !== 'undefined') globalThis.Utils = Utils;
