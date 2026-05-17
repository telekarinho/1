/**
 * MilkyPot Belinha — Memória Permanente
 * ============================================
 * Sistema de memória que sobrevive entre sessões. Salva localmente
 * (autopilot/memory/) com cópia opcional no Firestore.
 *
 * Estrutura:
 *   memory/
 *     decisions.jsonl     — append-only de decisões importantes
 *     facts.json          — chave→valor de fatos persistentes
 *     session-summaries/  — resumos das últimas sessões
 *     last-context.json   — onde a última sessão parou
 *
 * API:
 *   loadMemory()                   → { decisions[], facts{}, summaries[], lastContext }
 *   appendDecision(text, meta)     → adiciona linha em decisions.jsonl
 *   setFact(key, value)            → upsert em facts.json
 *   saveSessionSummary(summary)    → grava resumo da sessão
 *   updateLastContext(payload)     → marca onde parou
 *   buildMemorySnippet(query?)     → string pronta pra injetar no system prompt
 *
 * Otimização de tokens:
 *   - Não envia transcrição completa, só TOP-K decisões + fatos + resumos
 *   - buildMemorySnippet retorna ≤2000 chars
 *   - Quando histórico de chat > 30 msgs, server.js comprime via summary
 */

"use strict";

const fs = require("fs");
const path = require("path");

const MEMORY_DIR = path.join(__dirname, "memory");
const DECISIONS_FILE = path.join(MEMORY_DIR, "decisions.jsonl");
const FACTS_FILE = path.join(MEMORY_DIR, "facts.json");
const LAST_CONTEXT_FILE = path.join(MEMORY_DIR, "last-context.json");
const SUMMARIES_DIR = path.join(MEMORY_DIR, "session-summaries");

function ensureDirs() {
    if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
    if (!fs.existsSync(SUMMARIES_DIR)) fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
}

function loadDecisions(limit = 200) {
    try {
        if (!fs.existsSync(DECISIONS_FILE)) return [];
        const content = fs.readFileSync(DECISIONS_FILE, "utf8");
        const lines = content.split("\n").filter(l => l.trim());
        const all = lines.map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
        return all.slice(-limit);
    } catch (e) { return []; }
}

function appendDecision(text, meta = {}) {
    ensureDirs();
    const entry = {
        ts: new Date().toISOString(),
        text: String(text).slice(0, 500),
        ...meta
    };
    fs.appendFileSync(DECISIONS_FILE, JSON.stringify(entry) + "\n", "utf8");
    return entry;
}

function loadFacts() {
    try {
        if (!fs.existsSync(FACTS_FILE)) return {};
        return JSON.parse(fs.readFileSync(FACTS_FILE, "utf8"));
    } catch (e) { return {}; }
}

function setFact(key, value) {
    ensureDirs();
    const facts = loadFacts();
    facts[key] = {
        value: typeof value === "string" ? value : JSON.stringify(value),
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(FACTS_FILE, JSON.stringify(facts, null, 2), "utf8");
    return facts[key];
}

function loadLastContext() {
    try {
        if (!fs.existsSync(LAST_CONTEXT_FILE)) return null;
        return JSON.parse(fs.readFileSync(LAST_CONTEXT_FILE, "utf8"));
    } catch (e) { return null; }
}

function updateLastContext(payload) {
    ensureDirs();
    const data = {
        ts: new Date().toISOString(),
        ...payload
    };
    fs.writeFileSync(LAST_CONTEXT_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
}

function loadRecentSummaries(limit = 5) {
    try {
        if (!fs.existsSync(SUMMARIES_DIR)) return [];
        const files = fs.readdirSync(SUMMARIES_DIR)
            .filter(f => f.endsWith(".json"))
            .map(f => ({ name: f, ts: f.split("_")[0] || "0" }))
            .sort((a, b) => b.ts.localeCompare(a.ts))
            .slice(0, limit);
        return files.map(f => {
            try {
                return JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, f.name), "utf8"));
            } catch (e) { return null; }
        }).filter(Boolean);
    } catch (e) { return []; }
}

function saveSessionSummary(summary) {
    ensureDirs();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
    const entry = {
        ts: new Date().toISOString(),
        summary: String(summary).slice(0, 4000)
    };
    fs.writeFileSync(path.join(SUMMARIES_DIR, filename), JSON.stringify(entry, null, 2), "utf8");
    // Mantém só os últimos 30 summaries (auto-cleanup)
    try {
        const all = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith(".json")).sort();
        if (all.length > 30) {
            for (const old of all.slice(0, all.length - 30)) {
                fs.unlinkSync(path.join(SUMMARIES_DIR, old));
            }
        }
    } catch (e) {}
    return entry;
}

/**
 * Constrói snippet de memória otimizado pra injetar no system prompt.
 * Inclui:
 *   - Onde parou na última sessão
 *   - Últimas N decisões importantes
 *   - Fatos relevantes (filtrados por query se fornecida)
 *   - Resumos das últimas 3 sessões
 *
 * Limita a ≤2500 chars pra não estourar tokens.
 */
function buildMemorySnippet(query = null) {
    const parts = [];
    parts.push("## 🧠 MEMÓRIA PERMANENTE BELINHA (sobrevive entre sessões)\n");

    // Onde parou
    const last = loadLastContext();
    if (last) {
        const ageHours = (Date.now() - new Date(last.ts).getTime()) / (1000 * 60 * 60);
        parts.push(`### 📍 ÚLTIMA SESSÃO (${ageHours.toFixed(1)}h atrás)`);
        if (last.activeTask) parts.push(`Tarefa ativa: ${last.activeTask}`);
        if (last.openPRs?.length) parts.push(`PRs abertos: ${last.openPRs.join(", ")}`);
        if (last.lastUserMessage) parts.push(`Última msg do user: "${last.lastUserMessage.slice(0, 120)}"`);
        if (last.nextStep) parts.push(`Próximo passo: ${last.nextStep}`);
        parts.push("");
    }

    // Decisões recentes (filtra por query se houver)
    let decisions = loadDecisions(50);
    if (query) {
        const q = String(query).toLowerCase();
        const filtered = decisions.filter(d =>
            (d.text || "").toLowerCase().includes(q) ||
            (d.tags || []).some(t => t.toLowerCase().includes(q))
        );
        if (filtered.length) decisions = filtered;
    }
    decisions = decisions.slice(-12); // últimas 12
    if (decisions.length) {
        parts.push("### 📋 DECISÕES RECENTES");
        for (const d of decisions) {
            const date = d.ts ? new Date(d.ts).toISOString().slice(5, 10) : "?";
            parts.push(`[${date}] ${d.text}`);
        }
        parts.push("");
    }

    // Fatos persistentes
    const facts = loadFacts();
    const factKeys = Object.keys(facts);
    if (factKeys.length) {
        parts.push("### 📌 FATOS DO SISTEMA");
        for (const k of factKeys.slice(0, 15)) {
            const v = facts[k].value || "";
            parts.push(`- ${k}: ${v.slice(0, 120)}`);
        }
        parts.push("");
    }

    // Resumos recentes
    const summaries = loadRecentSummaries(3);
    if (summaries.length) {
        parts.push("### 📚 RESUMOS DE SESSÕES ANTERIORES");
        for (let i = 0; i < summaries.length; i++) {
            const s = summaries[i];
            const date = s.ts ? new Date(s.ts).toISOString().slice(0, 10) : "?";
            parts.push(`**${date}:** ${s.summary.slice(0, 400)}`);
        }
        parts.push("");
    }

    let result = parts.join("\n");
    // Trunca pra ≤2500 chars
    if (result.length > 2500) {
        result = result.slice(0, 2500) + "\n[...truncado pra economizar tokens]";
    }
    return result;
}

/**
 * Extrai automaticamente decisões/fatos da última troca de msgs.
 * Procura padrões tipo "Decidimos X", "Foi feito X", "PR #123 criado", etc.
 */
function autoCaptureFromMessage(role, content) {
    if (role !== "assistant" && role !== "user") return;
    const text = String(content || "");
    if (text.length < 20) return;

    // Padrões de decisão
    const decisionPatterns = [
        /PR #(\d+)\s+(?:criado|mergeado|merged|aberto)/gi,
        /(?:deployei|deployed|deploy de|deploy do)\s+(.+?)(?:\.|$)/gi,
        /(?:decidimos|decisão|vou fazer|vamos fazer)\s+(.+?)(?:\.|\n)/gi,
        /(?:criei|criado|adicionei)\s+(?:o |a |um |uma )?(?:arquivo |endpoint |função |tool )?(.+?)(?:\.|\n)/gi
    ];
    for (const pattern of decisionPatterns) {
        let m;
        while ((m = pattern.exec(text)) !== null) {
            const fullMatch = m[0].slice(0, 200);
            try {
                appendDecision(fullMatch, { role, autoCaptured: true });
            } catch (e) {}
        }
    }

    // Fatos do tipo "X = Y" ou "X é Y"
    const factPatterns = [
        /([A-Z][A-Z_]{3,})\s*=\s*([^\s\n]+)/g,        // ENV_VAR=value
        /(?:secret|key|token|url|endpoint)\s+([\w-]+)\s+(?:é|=)\s+(\S+)/gi
    ];
    for (const pattern of factPatterns) {
        let m;
        while ((m = pattern.exec(text)) !== null) {
            try {
                setFact(m[1].slice(0, 60), m[2].slice(0, 200));
            } catch (e) {}
        }
    }
}

module.exports = {
    loadDecisions,
    appendDecision,
    loadFacts,
    setFact,
    loadLastContext,
    updateLastContext,
    loadRecentSummaries,
    saveSessionSummary,
    buildMemorySnippet,
    autoCaptureFromMessage
};
