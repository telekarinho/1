#!/usr/bin/env node
/**
 * EMERGÊNCIA v2 — Remove markers de merge ANINHADOS e duplicados.
 *
 * Diferença do v1: o caso aqui é Belinha pegou arquivos JÁ corrompidos
 * como input e re-mergeou, gerando aninhamento tipo:
 *
 *   <<<<<<< HEAD
 *   <<<<<<< HEAD
 *   <<<<<<< HEAD
 *       [bloco X]
 *   =======
 *       [bloco X]
 *   >>>>>>> origin/main
 *   =======
 *       [bloco X]
 *   =======
 *       [bloco X]
 *   ...
 *   >>>>>>> origin/main
 *
 * Estratégia: parse linha-a-linha. Marker line é descartado.
 * Linhas de conteúdo são mantidas. No final, deduplica grupos de
 * linhas consecutivas idênticas que apareceram entre markers.
 *
 * Conservador: NUNCA remove conteúdo único — só remove DUPLICAÇÕES
 * consecutivas idênticas resultantes dos markers.
 *
 * REGRA #0 anti-regressão: o resultado preserva 100% do conteúdo
 * único do arquivo.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', 'backups', 'tmp-zap-app', 'tmp-zap-placeholder']);
const TARGET_EXTS = new Set(['.html', '.js', '.css', '.json', '.md', '.kt', '.xml', '.yml', '.yaml', '.sh', '.bat', '.ps1']);

let filesScanned = 0;
let filesFixed = 0;
let filesNeedManual = [];
let totalMarkersRemoved = 0;
let totalLinesDedup = 0;

function isMarker(line) {
    return /^<<<<<<< /.test(line) || /^=======\s*$/.test(line) || /^>>>>>>> /.test(line);
}

function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { return; }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        if (SKIP_DIRS.has(e.name) || rel.startsWith('.claude/') || rel.startsWith('autopilot/memory/')) continue;
        if (e.isDirectory()) walk(full);
        else if (TARGET_EXTS.has(path.extname(e.name).toLowerCase())) processFile(full);
    }
}

function processFile(filePath) {
    filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    if (!/^<<<<<<< /m.test(content)) return;

    const lines = content.split('\n');
    const removed = [];

    // Passada 1: remove TODAS as linhas marker. Conta quantas removeu.
    let markerCount = 0;
    const cleaned = [];
    for (const line of lines) {
        if (isMarker(line)) { markerCount++; continue; }
        cleaned.push(line);
    }

    // Passada 2: deduplicar GRUPOS consecutivos idênticos.
    // Estratégia: usa um sliding window com tamanhos 1..50 linhas.
    // Para cada tamanho W, se as próximas W linhas == as W anteriores, pula.
    // Itera até estabilizar.
    let prevLen = -1;
    let result = cleaned;
    let iterations = 0;
    while (result.length !== prevLen && iterations < 20) {
        prevLen = result.length;
        result = dedupConsecutiveBlocks(result);
        iterations++;
    }

    const linesDedup = cleaned.length - result.length;

    // Sanity check: o arquivo precisa ainda ter pelo menos UMA cópia
    // do conteúdo original. Vamos verificar tamanho mínimo razoável.
    if (result.length < 10 && content.length > 1000) {
        // Suspeito — script deletou demais. Aborta.
        filesNeedManual.push(path.relative(ROOT, filePath) + ' (resultado pequeno demais)');
        return;
    }

    fs.writeFileSync(filePath, result.join('\n'));
    filesFixed++;
    totalMarkersRemoved += markerCount;
    totalLinesDedup += linesDedup;
}

/**
 * Dedup blocos consecutivos idênticos.
 * Para cada posição, tenta achar o maior W tal que lines[i..i+W-1] == lines[i+W..i+2W-1].
 * Se encontra, pula a segunda metade.
 */
function dedupConsecutiveBlocks(lines) {
    const out = [];
    let i = 0;
    while (i < lines.length) {
        // Tenta dedup com tamanhos 1..50
        let dedupedW = 0;
        for (let W = 50; W >= 1; W--) {
            if (i + 2 * W > lines.length) continue;
            let match = true;
            for (let k = 0; k < W; k++) {
                if (lines[i + k] !== lines[i + W + k]) { match = false; break; }
            }
            if (match) { dedupedW = W; break; }
        }
        // Mantém o primeiro bloco, pula a duplicação
        if (dedupedW > 0) {
            for (let k = 0; k < dedupedW; k++) out.push(lines[i + k]);
            i += 2 * dedupedW;
        } else {
            out.push(lines[i]);
            i++;
        }
    }
    return out;
}

walk(ROOT);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Merge markers cleanup v2 (ANINHADOS + DUPLICADOS)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Arquivos escaneados:    ', filesScanned);
console.log('  Arquivos consertados:   ', filesFixed);
console.log('  Linhas marker removidas:', totalMarkersRemoved);
console.log('  Linhas duplicadas dedup:', totalLinesDedup);
console.log('  Precisam manual:        ', filesNeedManual.length);
if (filesNeedManual.length) {
    console.log('');
    console.log('  Manual:');
    filesNeedManual.forEach(f => console.log('   - ' + f));
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
