#!/usr/bin/env node
/**
 * EMERGÊNCIA — Remove marcadores de merge conflict (<<<<<<<, =======, >>>>>>>)
 * de TODOS os arquivos do repo MilkyPot, automaticamente quando os dois lados
 * são idênticos (caso comum aqui — merge tool burro inseriu markers em diffs
 * triviais), ou registra pra resolução manual quando divergem.
 *
 * REGRA #0 ANTI-REGRESSÃO: NUNCA descarta conteúdo. Quando os dois lados
 * divergem, ABORTA o arquivo e loga pra você decidir, em vez de adivinhar.
 *
 * Uso: node autopilot/fix-merge-markers.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', 'backups', 'tmp-zap-app', 'tmp-zap-placeholder', 'autopilot/memory']);
const TARGET_EXTS = new Set(['.html', '.js', '.css', '.json', '.md', '.kt', '.xml', '.yml', '.yaml', '.sh', '.bat', '.ps1']);

let filesScanned = 0;
let filesFixed = 0;
let filesNeedManual = [];
let totalMarkersRemoved = 0;

function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { return; }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        if (SKIP_DIRS.has(e.name) || SKIP_DIRS.has(rel)) continue;
        if (e.isDirectory()) walk(full);
        else if (TARGET_EXTS.has(path.extname(e.name).toLowerCase())) processFile(full);
    }
}

function processFile(filePath) {
    filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    if (!/^<<<<<<< /m.test(content)) return;

    const lines = content.split('\n');
    const out = [];
    let i = 0;
    let foundManual = false;
    let markersFixed = 0;

    while (i < lines.length) {
        const line = lines[i];
        // Detecta inicio de bloco de conflict
        if (/^<<<<<<< /.test(line)) {
            // Coleta lado A ate o =======
            const sideA = [];
            i++;
            while (i < lines.length && !/^=======\s*$/.test(lines[i])) {
                if (/^<<<<<<< /.test(lines[i]) || /^>>>>>>> /.test(lines[i])) {
                    // Marker aninhado bizarro — aborta esse arquivo
                    foundManual = true;
                    break;
                }
                sideA.push(lines[i]);
                i++;
            }
            if (foundManual) break;
            if (i >= lines.length) { foundManual = true; break; }  // sem =======
            i++; // pula =======
            // Coleta lado B ate >>>>>>>
            const sideB = [];
            while (i < lines.length && !/^>>>>>>> /.test(lines[i])) {
                if (/^<<<<<<< /.test(lines[i]) || /^=======\s*$/.test(lines[i])) {
                    foundManual = true;
                    break;
                }
                sideB.push(lines[i]);
                i++;
            }
            if (foundManual) break;
            if (i >= lines.length) { foundManual = true; break; }  // sem >>>>>>>
            i++; // pula >>>>>>>

            const a = sideA.join('\n');
            const b = sideB.join('\n');

            if (a === b) {
                // Lados IDENTICOS — mantem um (sem markers)
                for (const l of sideA) out.push(l);
                markersFixed++;
            } else if (a === '' && b !== '') {
                // Lado A vazio → mantem B (adicao pura)
                for (const l of sideB) out.push(l);
                markersFixed++;
            } else if (b === '' && a !== '') {
                for (const l of sideA) out.push(l);
                markersFixed++;
            } else {
                // DIVERGE — aborta esse arquivo, marca pra manual
                foundManual = true;
                break;
            }
        } else {
            out.push(line);
            i++;
        }
    }

    if (foundManual) {
        filesNeedManual.push(path.relative(ROOT, filePath));
        return;
    }

    if (markersFixed > 0) {
        fs.writeFileSync(filePath, out.join('\n'));
        filesFixed++;
        totalMarkersRemoved += markersFixed;
    }
}

walk(ROOT);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Merge markers cleanup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Arquivos escaneados: ', filesScanned);
console.log('  Arquivos consertados:', filesFixed);
console.log('  Blocos resolvidos:   ', totalMarkersRemoved);
console.log('  Precisam manual:     ', filesNeedManual.length);
if (filesNeedManual.length) {
    console.log('');
    console.log('  ARQUIVOS QUE PRECISAM RESOLUCAO MANUAL:');
    filesNeedManual.forEach(f => console.log('   - ' + f));
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
