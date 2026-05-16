/**
 * MilkyPot Belinha — Registry de Backends LLM Locais
 * ============================================
 * Cada backend é uma estratégia de chamada IA com fallback automático.
 *
 * ORDEM PADRÃO (CASCATA):
 *   1. Claude CLI         (plano Claude Pro/Max — primário)
 *   2. Codex CLI          (plano OpenAI/Codex — backup quando Claude esgota)
 *   3. Gemini CLI         (Google AI Studio — backup)
 *   4. GitHub Copilot CLI (`gh copilot suggest` — backup)
 *   5. LM Studio          (servidor local OpenAI-compatible em :1234)
 *   6. Ollama             (LLMs offline — Llama/Mistral/Qwen)
 *
 * Auto-detecção: cada backend tem detect() que retorna boolean.
 * Cascata: tenta cada disponível em ordem; se falhar, próximo.
 *
 * Configurável via autopilot/backends.json (opcional):
 *   { "order": ["claude", "codex", "ollama"], "disabled": ["copilot-cli"] }
 */

"use strict";

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CODEX_BIN = "C:\\Users\\rodri\\AppData\\Local\\Packages\\OpenAI.Codex_2p2nqsd0c76g0\\LocalCache\\Local\\OpenAI\\Codex\\bin\\codex.exe";

// ============================================
// Util: capture stdout/stderr de child_process
// ============================================
function collectProcess(proc) {
    return new Promise((resolve, reject) => {
        let stdout = "", stderr = "";
        proc.stdout.on("data", c => stdout += c.toString());
        proc.stderr.on("data", c => stderr += c.toString());
        proc.on("close", code => resolve({ exitCode: code, stdout, stderr }));
        proc.on("error", reject);
    });
}

// Verifica se comando existe no PATH (sync)
function commandExists(cmd) {
    const checker = os.platform() === "win32" ? "where" : "which";
    try {
        const r = spawnSync(checker, [cmd], { shell: true, timeout: 3000 });
        return r.status === 0;
    } catch (e) { return false; }
}

// Verifica se URL HTTP responde (server local)
async function urlReachable(url, timeoutMs = 1500) {
    try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), timeoutMs);
        const r = await fetch(url, { method: "GET", signal: ac.signal });
        clearTimeout(t);
        return r.ok || r.status < 500;
    } catch (e) { return false; }
}

// ============================================
// 1. CLAUDE CLI (Claude Pro/Max — primário)
// ============================================
const CLAUDE = {
    id: "claude",
    name: "Claude CLI",
    plan: "Claude Pro/Max — R$ 0",
    async detect() { return commandExists("claude"); },
    async run(combined, opts = {}) {
        const cliArgs = ["-p", "--output-format", "json"];
        const VALID_ALIASES = ["sonnet", "opus", "haiku"];
        if (opts.model && (VALID_ALIASES.includes(opts.model) || /\d{8}$/.test(opts.model))) {
            cliArgs.push("--model", opts.model);
        }
        // Resolve OAuth token de várias fontes
        let sessionToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
        if (!sessionToken) {
            try {
                const bridge = path.join(os.homedir(), ".claude", ".milkypot-token");
                if (fs.existsSync(bridge)) sessionToken = fs.readFileSync(bridge, "utf8").trim();
            } catch (e) {}
        }
        if (!sessionToken) {
            try {
                const credFile = path.join(os.homedir(), ".claude", ".credentials.json");
                const creds = JSON.parse(fs.readFileSync(credFile, "utf8"));
                sessionToken = (creds.claudeAiOauth && creds.claudeAiOauth.accessToken) || "";
            } catch (e) {}
        }
        const env = {
            ...process.env,
            HOME: process.env.HOME || process.env.USERPROFILE || os.homedir(),
            ...(sessionToken ? { CLAUDE_CODE_OAUTH_TOKEN: sessionToken } : {})
        };
        const proc = spawn("claude", cliArgs, { shell: true, env });
        proc.stdin.write(combined, "utf8");
        proc.stdin.end();
        const { exitCode, stdout, stderr } = await collectProcess(proc);
        if (exitCode !== 0) throw new Error(stderr || stdout || `claude_exit_${exitCode}`);
        let reply = "", usage = null;
        try {
            const parsed = JSON.parse(stdout);
            reply = parsed.result || parsed.content || "";
            usage = parsed.usage || null;
        } catch (e) {
            reply = stdout.trim();
        }
        if (!reply) throw new Error("claude_empty_reply");
        return { reply, usage, backend: "claude" };
    }
};

// ============================================
// 2. CODEX CLI (OpenAI/Codex — backup quando Claude esgota)
// ============================================
const CODEX = {
    id: "codex",
    name: "Codex CLI",
    plan: "OpenAI Codex — R$ 0",
    async detect() {
        if (fs.existsSync(CODEX_BIN)) return true;
        return commandExists("codex");
    },
    async run(combined, opts = {}) {
        const bin = fs.existsSync(CODEX_BIN) ? CODEX_BIN : "codex";
        const outFile = path.join(os.tmpdir(), "milkypot-codex-last-message.txt");
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
        const cmdLine = [
            `"${bin}"`, "exec",
            "--skip-git-repo-check",
            "--dangerously-bypass-approvals-and-sandbox",
            "--output-last-message", `"${outFile}"`,
            "-C", `"${path.join(__dirname, "..")}"`,
            "-"
        ].join(" ");
        const proc = spawn(cmdLine, [], { shell: true });
        proc.stdin.write(combined, "utf8");
        proc.stdin.end();
        const { exitCode, stdout, stderr } = await collectProcess(proc);
        let reply = "";
        try {
            if (fs.existsSync(outFile)) reply = fs.readFileSync(outFile, "utf8").trim();
        } catch (e) {}
        if (!reply) reply = stdout.trim();
        if (!reply) throw new Error(stderr || `codex_exit_${exitCode}`);
        return { reply, usage: null, backend: "codex" };
    }
};

// ============================================
// 3. GEMINI CLI (Google AI Studio — backup gratuito)
// ============================================
const GEMINI_CLI = {
    id: "gemini-cli",
    name: "Gemini CLI",
    plan: "Google AI Studio — R$ 0",
    async detect() { return commandExists("gemini"); },
    async run(combined, opts = {}) {
        const model = opts.model || "gemini-1.5-flash";
        const proc = spawn("gemini", ["-m", model, "-p", "-"], { shell: true });
        proc.stdin.write(combined, "utf8");
        proc.stdin.end();
        const { exitCode, stdout, stderr } = await collectProcess(proc);
        if (exitCode !== 0 || !stdout.trim()) throw new Error(stderr || `gemini_exit_${exitCode}`);
        return { reply: stdout.trim(), usage: null, backend: "gemini-cli" };
    }
};

// ============================================
// 4. GITHUB COPILOT CLI (gh copilot)
// ============================================
const COPILOT_CLI = {
    id: "copilot-cli",
    name: "GitHub Copilot CLI",
    plan: "GitHub Copilot — R$ 0",
    async detect() {
        if (!commandExists("gh")) return false;
        // Verifica extension copilot instalada
        const r = spawnSync("gh", ["extension", "list"], { shell: true, timeout: 5000 });
        return r.status === 0 && r.stdout.toString().includes("copilot");
    },
    async run(combined, opts = {}) {
        // gh copilot suggest é mais pra comandos; pra prosa, usar "explain"
        // Limitação: copilot CLI não aceita stdin, então passamos via -t
        const prompt = combined.slice(0, 5000); // limite de arg
        const proc = spawn("gh", ["copilot", "explain", prompt], { shell: true });
        const { exitCode, stdout, stderr } = await collectProcess(proc);
        if (exitCode !== 0 || !stdout.trim()) throw new Error(stderr || `copilot_exit_${exitCode}`);
        return { reply: stdout.trim(), usage: null, backend: "copilot-cli" };
    }
};

// ============================================
// 5. LM STUDIO (servidor local OpenAI-compatible em :1234)
// ============================================
const LM_STUDIO = {
    id: "lmstudio",
    name: "LM Studio",
    plan: "100% local (CPU/GPU do PC) — R$ 0 forever",
    baseUrl: process.env.LMSTUDIO_URL || "http://localhost:1234",
    async detect() {
        return await urlReachable(this.baseUrl + "/v1/models", 1500);
    },
    async run(combined, opts = {}) {
        // Pega o primeiro modelo disponível
        const modelsResp = await fetch(this.baseUrl + "/v1/models");
        if (!modelsResp.ok) throw new Error("lmstudio_no_models");
        const modelsData = await modelsResp.json();
        const model = opts.model || modelsData.data?.[0]?.id || "local-model";

        const r = await fetch(this.baseUrl + "/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: combined }],
                temperature: 0.7,
                max_tokens: 1500
            })
        });
        if (!r.ok) throw new Error(`lmstudio_${r.status}`);
        const j = await r.json();
        const reply = (j.choices?.[0]?.message?.content || "").trim();
        if (!reply) throw new Error("lmstudio_empty");
        return { reply, usage: j.usage, backend: "lmstudio" };
    }
};

// ============================================
// 6. OLLAMA (LLMs locais offline — Llama/Mistral/Qwen)
// ============================================
const OLLAMA = {
    id: "ollama",
    name: "Ollama",
    plan: "100% local offline — R$ 0 forever",
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    async detect() {
        return await urlReachable(this.baseUrl + "/api/tags", 1500);
    },
    async run(combined, opts = {}) {
        // Pega primeiro modelo instalado
        const tagsResp = await fetch(this.baseUrl + "/api/tags");
        const tags = await tagsResp.json();
        const model = opts.model || tags.models?.[0]?.name || "llama3.2";

        const r = await fetch(this.baseUrl + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: combined }],
                stream: false
            })
        });
        if (!r.ok) throw new Error(`ollama_${r.status}`);
        const j = await r.json();
        const reply = (j.message?.content || "").trim();
        if (!reply) throw new Error("ollama_empty");
        return { reply, usage: null, backend: `ollama/${model}` };
    }
};

// ============================================
// REGISTRO COMPLETO
// ============================================
const ALL_BACKENDS = [CLAUDE, CODEX, GEMINI_CLI, COPILOT_CLI, LM_STUDIO, OLLAMA];

// Carrega ordem custom do backends.json se existir
function loadConfig() {
    const configFile = path.join(__dirname, "backends.json");
    try {
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
    } catch (e) {}
    // Padrão: Claude primeiro, Codex segundo, demais por ordem do array
    return { order: ["claude", "codex", "gemini-cli", "copilot-cli", "lmstudio", "ollama"], disabled: [] };
}

function getCascade() {
    const config = loadConfig();
    const disabled = new Set(config.disabled || []);
    const order = config.order || [];
    const byId = new Map(ALL_BACKENDS.map(b => [b.id, b]));
    // Primeiro os da ordem, depois os que sobraram
    const ordered = [];
    for (const id of order) {
        if (disabled.has(id)) continue;
        const b = byId.get(id);
        if (b) { ordered.push(b); byId.delete(id); }
    }
    // Resto na ordem do array original
    for (const b of byId.values()) {
        if (!disabled.has(b.id)) ordered.push(b);
    }
    return ordered;
}

// Detecta TODOS os disponíveis (pra mostrar no /health e banner)
async function detectAvailable() {
    const cascade = getCascade();
    const results = [];
    for (const b of cascade) {
        try {
            const ok = await Promise.race([
                b.detect(),
                new Promise(r => setTimeout(() => r(false), 3000))
            ]);
            results.push({ id: b.id, name: b.name, plan: b.plan, available: !!ok });
        } catch (e) {
            results.push({ id: b.id, name: b.name, plan: b.plan, available: false, error: e.message });
        }
    }
    return results;
}

// Executa cascata: tenta cada backend disponível em ordem; primeiro que responder vence
async function executeCascade(combined, opts = {}) {
    const cascade = getCascade();
    const attempts = [];
    for (const backend of cascade) {
        try {
            const available = await Promise.race([
                backend.detect(),
                new Promise(r => setTimeout(() => r(false), 3000))
            ]);
            if (!available) {
                attempts.push({ id: backend.id, status: "unavailable" });
                continue;
            }
            const startTs = Date.now();
            const result = await backend.run(combined, opts);
            attempts.push({ id: backend.id, status: "ok", elapsed: Date.now() - startTs });
            console.log(`[cascade] ✅ ${backend.id} respondeu em ${Date.now() - startTs}ms`);
            return { ...result, attempts };
        } catch (e) {
            attempts.push({ id: backend.id, status: "failed", error: e.message.slice(0, 150) });
            console.warn(`[cascade] ❌ ${backend.id} falhou: ${e.message.slice(0, 120)} → próximo`);
        }
    }
    const err = new Error("Todos backends falharam ou indisponíveis");
    err.attempts = attempts;
    throw err;
}

module.exports = {
    ALL_BACKENDS,
    getCascade,
    detectAvailable,
    executeCascade,
    loadConfig
};
