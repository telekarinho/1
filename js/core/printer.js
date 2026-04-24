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
            { id: 'balcao', name: 'Balcão (Completo)', active: true },
            { id: 'cozinha', name: 'Cozinha (Simplificado)', active: false }
        ]
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
            return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }

    function saveConfig(cfg) {
        const fid = getFid();
        localStorage.setItem(CONFIG_KEY + fid, JSON.stringify(cfg));
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
        getFid
    };
})();

if (typeof window !== 'undefined') window.Printer = Printer;
