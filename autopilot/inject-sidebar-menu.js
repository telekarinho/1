#!/usr/bin/env node
/**
 * Inject sidebar-menu.js script tag into all panel pages.
 *
 * - Idempotent: skips files that already have the script tag.
 * - Inserts before </body> (or appends if no </body>).
 * - Adds cache buster v=mp-v308 pra forcar reload em produção.
 *
 * Run: node autopilot/inject-sidebar-menu.js
 */
const fs = require('fs');
const path = require('path');

const PANEL_DIR = path.join(__dirname, '..', 'painel');
const SCRIPT_TAG = '<script src="../js/core/sidebar-menu.js?v=mp-v310" defer></script>';
const MARKER = 'sidebar-menu.js';

function processFile(filePath) {
    const name = path.basename(filePath);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip se ja tem o script (idempotente)
    if (content.includes(MARKER)) return { name, status: 'already-has' };

    // Insere antes de </body> em TODAS as paginas — mesmo as sem sidebar
    // recebem o script pra ter Ctrl+K command palette global
    const closingBody = content.lastIndexOf('</body>');
    if (closingBody === -1) {
        return { name, status: 'no-closing-body' };
    }

    const before = content.slice(0, closingBody);
    const after = content.slice(closingBody);
    const newContent = before + '    ' + SCRIPT_TAG + '\n' + after;

    fs.writeFileSync(filePath, newContent, 'utf8');
    return { name, status: 'updated' };
}

function main() {
    if (!fs.existsSync(PANEL_DIR)) {
        console.error('Painel dir not found:', PANEL_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(PANEL_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(PANEL_DIR, f));

    const results = files.map(processFile);
    const updated = results.filter(r => r.status === 'updated');
    const skipped = results.filter(r => r.status !== 'updated');

    console.log(`\n✅ Updated ${updated.length} files:`);
    updated.forEach(r => console.log('  +', r.name));

    if (skipped.length) {
        console.log(`\n⏭️  Skipped ${skipped.length} files:`);
        skipped.forEach(r => console.log('  -', r.name, '(' + r.status + ')'));
    }
}

main();
