/**
 * MilkyPot - Printer System
 * Handles printer configuration, formatting, and profiles (Counter, Kitchen, etc.)
 */
const Printer = (function() {
    'use strict';

    const CONFIG_KEY = 'mp_printer_settings_';

    const DEFAULT_CONFIG = {
        enabled: true,
        width: '80mm', // '80mm' or '58mm'
        charsPerLine: 32, // 32 for 58mm, 42-48 for 80mm
        autoPrint: false,
        useBrowserDialog: true,
        profiles: [
            // Padrão MilkyPot: imprime AMBOS — recibo cliente (não-fiscal, ainda não temos NFC-e)
            // + pedido cozinha. Ambos podem ser desligados em ⚙️ Configurações.
            { id: 'balcao', name: 'Recibo Cliente (não-fiscal)', active: true },
            { id: 'cozinha', name: 'Pedido Cozinha', active: true }
        ],
        // Migration flag — força defaults novos pra usuários que tinham config antiga
        __cozinhaDefaultV2: true
    };

    function getFid() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            return Auth.getSession().franchiseId || 'global';
        }
        return 'global';
    }

    function getConfig() {
        const fid = getFid();
        const saved = localStorage.getItem(CONFIG_KEY + fid);
        if (!saved) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        try {
            const parsed = JSON.parse(saved);
            const cfg = Object.assign({}, DEFAULT_CONFIG, parsed);

            // Garante que ambos perfis existem (balcao + cozinha) — se o usuário
            // tinha config antiga com só balcao, adiciona cozinha
            if (!Array.isArray(cfg.profiles) || !cfg.profiles.length) {
                cfg.profiles = JSON.parse(JSON.stringify(DEFAULT_CONFIG.profiles));
            } else {
                DEFAULT_CONFIG.profiles.forEach(def => {
                    if (!cfg.profiles.find(p => p.id === def.id)) cfg.profiles.push(Object.assign({}, def));
                });
            }

            // Migração única: ativa cozinha pra usuários antigos (uma vez só)
            if (!cfg.__cozinhaDefaultV2) {
                const cozinha = cfg.profiles.find(p => p.id === 'cozinha');
                if (cozinha) cozinha.active = true;
                const balcao = cfg.profiles.find(p => p.id === 'balcao');
                if (balcao) {
                    balcao.active = true;
                    balcao.name = 'Recibo Cliente (não-fiscal)';
                }
                cfg.__cozinhaDefaultV2 = true;
                try { localStorage.setItem(CONFIG_KEY + fid, JSON.stringify(cfg)); } catch(e){}
            }

            return cfg;
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }

    function saveConfig(cfg) {
        const fid = getFid();
        localStorage.setItem(CONFIG_KEY + fid, JSON.stringify(cfg));
    }

    // Categorias que precisam de preparo na cozinha (milkshake, sundae,
    // açaí bowl, potinho montado). Buffet/picolé/sorvete-kg/bebida não.
    const KITCHEN_PREP_CATEGORIES = ['cat_milkshake', 'cat_sundae', 'cat_acai', 'cat_potinho'];
    // Categorias que NUNCA vão pra cozinha (grab-and-go).
    const NON_KITCHEN_CATEGORIES = ['cat_picole', 'cat_sorvete_kg', 'cat_buffet', 'cat_bebida', 'cat_topping'];

    function isKitchenItem(cartItem) {
        if (!cartItem) return false;
        // Buffet vendido por peso (cliente monta)
        if (cartItem.type === 'por_peso') return false;

        // Exclusões por nome — sempre se aplicam (buffet/picolé/bebida nunca vão pra cozinha)
        const n = (cartItem.name || '').toLowerCase();
        if (n.includes('picol')) return false;
        if (n.includes('buffet')) return false;
        if (n.includes('sorvete') && n.includes('kg')) return false;
        if (n.includes('bebida') || n.includes('refri') || n.includes('agua')) return false;
        if (n.includes('coca') || n.includes('guarana') || n.includes('guaraná') || n.includes('suco')) return false;

        // Decisão via CatalogV2 (fonte da verdade)
        try {
            const fid = getFid();
            if (typeof CatalogV2 !== 'undefined' && CatalogV2.load && fid !== 'global') {
                const v2 = CatalogV2.load(fid);
                const prod = (v2.produtos || []).find(p => p.id === cartItem.id);
                if (prod) {
                    if (NON_KITCHEN_CATEGORIES.includes(prod.categoriaId)) return false;
                    if (KITCHEN_PREP_CATEGORIES.includes(prod.categoriaId)) return true;
                    // Categoria desconhecida (admin criou cat custom) — não decide aqui,
                    // cai pro match por nome abaixo. ANTES desse fix retornava false
                    // direto e cozinha nunca via o pedido.
                }
            }
        } catch(e){}

        // Match positivo por nome (milkshake, sundae, açaí, bowl, potinho)
        if (n.includes('milkshake') || n.includes('milk shake') || n.includes('shake')) return true;
        if (n.includes('sundae')) return true;
        if (n.includes('acai') || n.includes('açaí') || n.includes('açai') || n.includes('bowl')) return true;
        if (n.includes('potinho')) return true;

        // Default permissivo: se não bateu nem em exclusão nem em match positivo, manda pra cozinha.
        // Pior caso: imprime um ticket extra (recuperável). Caso oposto: cozinha não
        // recebe pedido e cliente espera (catastrófico em dia de inauguração).
        return true;
    }

    /**
     * Formata texto para a largura atual
     */
    function centerLine(text, width) {
        if (text.length >= width) return text.substring(0, width);
        const padding = Math.floor((width - text.length) / 2);
        return ' '.repeat(padding) + text;
    }

    function justifyLine(left, right, width) {
        const space = width - left.length - right.length;
        if (space <= 0) return (left + ' ' + right).substring(0, width);
        return left + ' '.repeat(space) + right;
    }

    return {
        getConfig,
        saveConfig,
        centerLine,
        justifyLine,
        getFid,
        isKitchenItem,
        KITCHEN_PREP_CATEGORIES
    };
})();

if (typeof window !== 'undefined') window.Printer = Printer;
