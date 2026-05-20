/**
 * MilkyPot — /api/health (Vercel Serverless Function)
 *
 * Endpoint público de health-check usado por painel/saude.html.
 * Reporta status das integrações server-side: variáveis de ambiente
 * configuradas (não expõe valores), versão Node, uptime, latência.
 *
 * GET /api/health -> 200 JSON
 * OPTIONS /api/health -> 200 (CORS preflight)
 *
 * IMPORTANTE: Nunca retorne valores secretos. Só flags booleanas
 * de "está configurado?". O painel usa pra exibir verde/vermelho
 * em cada serviço sem expor as chaves.
 */

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ ok: false, error: 'method not allowed' });
    }

    var startedAt = Date.now();

    // Stack real (descoberta via auditoria): Belinha usa Groq (não Anthropic),
    // WhatsApp via gateway Baileys próprio em zap.milkypot.com (não WhatsApp
    // Business API oficial). Por isso checamos GROQ_API_KEY + MP_WEBHOOK_SECRET
    // (HMAC Baileys↔Vercel) + BELINHA_TUNNEL_SECRET (admin local↔Vercel registry),
    // e NÃO ANTHROPIC/WHATSAPP_TOKEN.
    var env = {
        GROQ_API_KEY:               !!process.env.GROQ_API_KEY,
        MP_WEBHOOK_SECRET:          !!process.env.MP_WEBHOOK_SECRET,
        BELINHA_TUNNEL_SECRET:      !!process.env.BELINHA_TUNNEL_SECRET,
        FIREBASE_SERVICE_ACCOUNT:   !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_SA_JSON),
        FIREBASE_PROJECT_ID:        !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_API_KEY:           !!process.env.FIREBASE_API_KEY,
        // Opcional (fallback pago se Belinha local cair):
        ANTHROPIC_API_KEY:          !!process.env.ANTHROPIC_API_KEY,
        OPENAI_API_KEY:             !!process.env.OPENAI_API_KEY
    };

    var configuredCount = Object.values(env).filter(Boolean).length;
    var totalCount = Object.keys(env).length;
    // Críticos pra Belinha WhatsApp funcionar com clientes finais:
    var allCritical = env.GROQ_API_KEY && env.MP_WEBHOOK_SECRET && env.FIREBASE_SERVICE_ACCOUNT;

    var payload = {
        ok: true,
        status: allCritical ? 'healthy' : 'degraded',
        service: 'milkypot-api',
        ts: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
        uptime: process.uptime ? Math.round(process.uptime()) : null,
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || null,
        deployedSha: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 8) || null,
        env: env,
        envConfigured: configuredCount + '/' + totalCount,
        latencyMs: Date.now() - startedAt
    };

    return res.status(200).json(payload);
};
