/* ============================================
   MilkyPot — LLM Providers com cascata gratuita
   ============================================
   Sistema de fallback inteligente entre múltiplos provedores LLM.
   Tenta em ordem (BELINHA LOCAL → GROQ → GEMINI → OPENROUTER → CEREBRAS)
   até um responder com sucesso. Cada um tem seu rate-limit/TPD
   independente, então quando um esgota o próximo assume.

   ORDEM:
   1. Belinha Local (Codex/Claude CLI via cloudflared tunnel)
      → ZERO custo (usa plano local do user)
      → Endpoint: datastore/belinha_tunnel_global.url + /copilot
   2. Groq (Llama 3.3 70b → 3.1 8b → Gemma 2 9b)
      → Free: 100k TPD por modelo
   3. Google Gemini (1.5 flash)
      → Free: 15 RPM, 1500 RPD, 1M TPM
   4. OpenRouter (modelos free, rotativos)
      → Free: variável, alguns ilimitados
   5. Cerebras (Llama 3.1 8b instant)
      → Free: 60 RPM, 1M TPD

   Cada provider expõe:
   - id (string)
   - available() → boolean (config OK?)
   - chat(messages, tools?, options?) → { content, tool_calls? }

   Formato unificado OpenAI: messages[{role, content}], tools[{type,function}]
   ============================================ */

"use strict";

const PROJECT = process.env.FIREBASE_PROJECT_ID || "milkypot-ad945";
const FB_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAbQ1fe0pK4prhfzYJypod2ie4DyNsq6BA";

// ============================================
// HELPERS
// ============================================
async function fsGet(docPath) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?key=${FB_KEY}`;
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

async function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms))
    ]);
}

// ============================================
// PROVIDER 1: BELINHA LOCAL (Codex/Claude CLI via tunnel)
// ============================================
let _cachedTunnelUrl = null;
let _tunnelLastCheck = 0;

async function getBelinhaTunnelUrl() {
    // Cache de 60s pra não bombardear Firestore
    const now = Date.now();
    if (_cachedTunnelUrl && (now - _tunnelLastCheck) < 60000) {
        return _cachedTunnelUrl;
    }
    try {
        const doc = await fsGet("datastore/belinha_tunnel_global");
        const url = doc?.fields?.url?.stringValue;
        const updatedAt = doc?.fields?.updatedAt?.timestampValue;
        // Tunnel stale (>10min sem heartbeat) = não usa
        if (updatedAt) {
            const age = Date.now() - new Date(updatedAt).getTime();
            if (age > 10 * 60 * 1000) {
                console.log("[llm:belinha-local] tunnel stale (idade > 10min), pulando");
                _cachedTunnelUrl = null;
                _tunnelLastCheck = now;
                return null;
            }
        }
        _cachedTunnelUrl = url || null;
        _tunnelLastCheck = now;
        return _cachedTunnelUrl;
    } catch (e) {
        return null;
    }
}

const BELINHA_LOCAL = {
    id: "belinha-local",
    cost: "free",
    async available() {
        const url = await getBelinhaTunnelUrl();
        return !!url;
    },
    async chat(messages, tools, options = {}) {
        const url = await getBelinhaTunnelUrl();
        if (!url) throw new Error("belinha-local: tunnel offline");
        // Belinha local não suporta tool calling do Groq format → só usa pra conversa simples
        if (tools && tools.length) throw new Error("belinha-local: tool calling nao suportado");

        // Adapta o formato: extrai system + último user
        const system = messages.find(m => m.role === "system")?.content || "";
        const userMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        const history = messages.filter(m => m.role !== "system");

        const r = await withTimeout(fetch(`${url}/copilot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: history,
                context: { system_prompt: system, source: "whatsapp_lulu" },
                persona: "belinha",
                model: options.model || "auto"
            })
        }), 25000);
        if (!r.ok) throw new Error(`belinha-local ${r.status}`);
        const j = await r.json();
        return { content: (j.reply || "").trim(), provider: "belinha-local" };
    }
};

// ============================================
// PROVIDER 2: GROQ (cascata 70b → 8b → gemma)
// ============================================
const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it"
];

const GROQ = {
    id: "groq",
    cost: "free",
    available() {
        return !!process.env.GROQ_API_KEY;
    },
    async chat(messages, tools, options = {}) {
        const apiKey = process.env.GROQ_API_KEY;
        const preferred = options.model || GROQ_MODELS[0];
        const cascade = [preferred, ...GROQ_MODELS.filter(m => m !== preferred)];

        let lastErr;
        for (const model of cascade) {
            const body = {
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 350,
                top_p: 0.9
            };
            if (tools?.length) {
                body.tools = tools;
                body.tool_choice = options.tool_choice || "auto";
            }
            try {
                const r = await withTimeout(fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                }), 30000);
                if (r.ok) {
                    const j = await r.json();
                    const choice = j.choices?.[0]?.message;
                    return {
                        content: (choice?.content || "").trim(),
                        tool_calls: choice?.tool_calls || null,
                        provider: `groq/${model}`
                    };
                }
                lastErr = new Error(`groq ${model} ${r.status}`);
                if (r.status !== 429 && r.status !== 503) throw lastErr;
                console.log(`[llm:groq] ${model} got ${r.status}, fallback...`);
            } catch (e) {
                lastErr = e;
                if (!String(e.message).match(/429|503|timeout/)) throw e;
            }
        }
        throw lastErr || new Error("groq: todos modelos esgotados");
    }
};

// ============================================
// PROVIDER 3: GOOGLE GEMINI (gemini-1.5-flash free)
// ============================================
const GEMINI = {
    id: "gemini",
    cost: "free",
    available() {
        return !!process.env.GEMINI_API_KEY;
    },
    async chat(messages, tools, options = {}) {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = options.model || "gemini-1.5-flash-latest";

        // Adapta messages OpenAI → Gemini contents
        const systemMsg = messages.find(m => m.role === "system")?.content || "";
        const contents = messages
            .filter(m => m.role !== "system" && m.role !== "tool")
            .map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
            }));

        const body = {
            systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
            contents,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.max_tokens ?? 400
            }
        };

        // Tools adaptação (Gemini tem formato diferente, suportado)
        if (tools?.length) {
            body.tools = [{
                functionDeclarations: tools.map(t => ({
                    name: t.function.name,
                    description: t.function.description,
                    parameters: t.function.parameters
                }))
            }];
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const r = await withTimeout(fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }), 30000);
        if (!r.ok) {
            const errText = await r.text().catch(() => "");
            throw new Error(`gemini ${r.status} ${errText.slice(0, 150)}`);
        }
        const j = await r.json();
        const cand = j.candidates?.[0]?.content?.parts || [];

        // Extrai text + function calls
        let content = "";
        const tool_calls = [];
        for (const p of cand) {
            if (p.text) content += p.text;
            if (p.functionCall) {
                tool_calls.push({
                    id: `gem_${tool_calls.length}_${Date.now()}`,
                    type: "function",
                    function: {
                        name: p.functionCall.name,
                        arguments: JSON.stringify(p.functionCall.args || {})
                    }
                });
            }
        }
        return {
            content: content.trim(),
            tool_calls: tool_calls.length ? tool_calls : null,
            provider: `gemini/${model}`
        };
    }
};

// ============================================
// PROVIDER 4: OPENROUTER (modelos free)
// ============================================
const OPENROUTER_FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free"
];

const OPENROUTER = {
    id: "openrouter",
    cost: "free",
    available() {
        return !!process.env.OPENROUTER_API_KEY;
    },
    async chat(messages, tools, options = {}) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const preferred = options.model || OPENROUTER_FREE_MODELS[0];
        const cascade = [preferred, ...OPENROUTER_FREE_MODELS.filter(m => m !== preferred)];

        let lastErr;
        for (const model of cascade) {
            const body = {
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 400
            };
            if (tools?.length) {
                body.tools = tools;
                body.tool_choice = options.tool_choice || "auto";
            }
            try {
                const r = await withTimeout(fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://milkypot.com",
                        "X-Title": "MilkyPot Lulu IA"
                    },
                    body: JSON.stringify(body)
                }), 30000);
                if (r.ok) {
                    const j = await r.json();
                    const choice = j.choices?.[0]?.message;
                    return {
                        content: (choice?.content || "").trim(),
                        tool_calls: choice?.tool_calls || null,
                        provider: `openrouter/${model}`
                    };
                }
                lastErr = new Error(`openrouter ${model} ${r.status}`);
                if (r.status !== 429 && r.status !== 503) throw lastErr;
                console.log(`[llm:openrouter] ${model} got ${r.status}, fallback...`);
            } catch (e) {
                lastErr = e;
                if (!String(e.message).match(/429|503|timeout/)) throw e;
            }
        }
        throw lastErr || new Error("openrouter: todos modelos esgotados");
    }
};

// ============================================
// PROVIDER 5: CEREBRAS (Llama 8b ultra-rápido free)
// ============================================
const CEREBRAS = {
    id: "cerebras",
    cost: "free",
    available() {
        return !!process.env.CEREBRAS_API_KEY;
    },
    async chat(messages, tools, options = {}) {
        const apiKey = process.env.CEREBRAS_API_KEY;
        const body = {
            model: options.model || "llama-3.3-70b",
            messages,
            temperature: options.temperature ?? 0.7,
            max_completion_tokens: options.max_tokens ?? 400
        };
        if (tools?.length) {
            body.tools = tools;
            body.tool_choice = options.tool_choice || "auto";
        }
        const r = await withTimeout(fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }), 30000);
        if (!r.ok) {
            const errText = await r.text().catch(() => "");
            throw new Error(`cerebras ${r.status} ${errText.slice(0, 150)}`);
        }
        const j = await r.json();
        const choice = j.choices?.[0]?.message;
        return {
            content: (choice?.content || "").trim(),
            tool_calls: choice?.tool_calls || null,
            provider: `cerebras/${body.model}`
        };
    }
};

// ============================================
// CASCATA ORQUESTRADA
// ============================================
const PROVIDERS = [BELINHA_LOCAL, GROQ, GEMINI, CEREBRAS, OPENROUTER];

/**
 * Tenta cada provider em ordem até um responder.
 *
 * @param {Array} messages - formato OpenAI
 * @param {Array} tools - formato OpenAI
 * @param {Object} options - {temperature, max_tokens, skipBelinhaLocal, requireTools}
 * @returns {Promise<{content, tool_calls?, provider}>}
 */
async function chat(messages, tools, options = {}) {
    const errors = [];
    for (const provider of PROVIDERS) {
        // Pula belinha-local se quem chama explicitamente disse (ex: tool calling)
        if (options.skipBelinhaLocal && provider.id === "belinha-local") continue;
        // Pula belinha-local se há tools (não suporta)
        if (tools?.length && provider.id === "belinha-local") continue;

        try {
            const avail = await provider.available();
            if (!avail) continue;
            const result = await provider.chat(messages, tools, options);
            if (result.content || result.tool_calls) {
                console.log(`[llm] ✅ ${provider.id} respondeu (${result.provider || provider.id})`);
                return result;
            }
        } catch (e) {
            const msg = `${provider.id}: ${e.message}`.slice(0, 200);
            errors.push(msg);
            console.warn(`[llm] ❌ ${msg}`);
        }
    }
    throw new Error(`Todos providers falharam:\n${errors.join("\n")}`);
}

module.exports = {
    chat,
    PROVIDERS,
    BELINHA_LOCAL,
    GROQ,
    GEMINI,
    OPENROUTER,
    CEREBRAS
};
