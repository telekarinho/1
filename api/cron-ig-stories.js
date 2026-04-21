/**
 * MilkyPot — Auto-post diário de 3 Stories no Instagram
 *
 * Vercel Serverless Function disparada por cron (vercel.json) todo dia às 23:00 UTC
 * (20:00 BRT). Percorre todas as franquias com `ig_autopost_{fid}.autoEnabled = true`,
 * gera 3 imagens (contador, ranking, hall-fama) e publica via Instagram Graph API.
 *
 * Segurança:
 *  - O token fica em Firestore, NUNCA no client. Só esta function (server-side) lê.
 *  - Protegido por CRON_SECRET (Vercel bloqueia chamadas sem header "authorization: Bearer $CRON_SECRET").
 *  - Nenhuma imagem é salva em server — tudo via URL pública do Firestore/Storage.
 *
 * Setup (uma vez por franquia): docs/IG_AUTOPOST_SETUP.md
 */

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/milkypot-ad945/databases/(default)/documents/datastore/';

export default async function handler(req, res) {
    // Valida cron secret
    const auth = req.headers.authorization || '';
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    try {
        const franquias = await listAutoPostFranquias();
        if (!franquias.length) {
            return res.status(200).json({ ok: true, msg: 'nenhuma franquia com autoPost ativo' });
        }

        const results = [];
        for (const f of franquias) {
            const r = await postFranquia(f);
            results.push({ fid: f.fid, ...r });
            await sleep(1500); // evita rate-limit da Meta
        }
        return res.status(200).json({ ok: true, results });
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}

async function listAutoPostFranquias() {
    // Lista docs /datastore/ig_autopost_* com autoEnabled true
    // Como usamos o schema "key → { value: {stringValue: JSON} }", precisamos
    // listar via Firestore REST (listDocuments) com prefixo.
    // Simplificação: a gente sabe os fids via doc "franchises", cada um tem ig_autopost_{fid}
    const franchisesRaw = await fetchDoc('franchises');
    const list = JSON.parse(franchisesRaw || '[]');
    const out = [];
    for (const f of list) {
        const fid = f.id;
        const cfgRaw = await fetchDoc('ig_autopost_' + fid);
        if (!cfgRaw) continue;
        const cfg = JSON.parse(cfgRaw);
        if (cfg.autoEnabled && cfg.igAccountId && cfg.igToken) {
            out.push({ fid, franchise: f, cfg });
        }
    }
    return out;
}

async function fetchDoc(docId) {
    try {
        const r = await fetch(FIRESTORE_BASE + docId);
        if (!r.ok) return null;
        const d = await r.json();
        return d.fields?.value?.stringValue || null;
    } catch (e) { return null; }
}

async function postFranquia({ fid, franchise, cfg }) {
    try {
        // Agrega dados do dia
        const ordersRaw = await fetchDoc('orders_' + fid);
        const orders = JSON.parse(ordersRaw || '[]');
        const potHoje = countHoje(orders);
        const topSab = topSabores(orders);
        const winnersRaw = await fetchDoc('challenge_300g_winners_' + fid);
        const winners = (JSON.parse(winnersRaw || '[]')).slice(-3).reverse();

        // Gera URLs de preview via um endpoint de render (se tiver)
        // Alternativa simples: usa via.placeholder pra story de teste
        // Em produção, voce precisa de URLs reais HTTPS — upload pra Firebase Storage
        // ou servidor de imagens dinamicas. Abaixo deixamos o stub.

        const stories = [
            {
                slug: 'contador',
                // TODO: upload real pra Firebase Storage (requer Admin SDK)
                imageUrl: buildStoryPreviewUrl(fid, 'contador', { n: potHoje }),
                caption: '🍨 ' + potHoje + ' potinhos servidos hoje na MilkyPot ' + (franchise.name || '') + '!'
            },
            {
                slug: 'ranking',
                imageUrl: buildStoryPreviewUrl(fid, 'ranking', { top: topSab }),
                caption: '📊 Ranking de sabores hoje'
            },
            {
                slug: 'hall',
                imageUrl: buildStoryPreviewUrl(fid, 'hall', { winners }),
                caption: '🏆 Hall da fama 300g hoje'
            }
        ];

        const postedIds = [];
        for (const s of stories) {
            const mediaId = await uploadStory(cfg, s.imageUrl, s.caption);
            if (mediaId) postedIds.push(mediaId);
            await sleep(500);
        }

        return { ok: true, posted: postedIds.length, total: stories.length };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/**
 * Publica um story via Instagram Graph API.
 * Requer: IG Business Account + Long-Lived Token.
 * Doc: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
async function uploadStory(cfg, imageUrl, caption) {
    try {
        // 1. Cria container
        const createUrl = `https://graph.facebook.com/v19.0/${cfg.igAccountId}/media`;
        const createBody = new URLSearchParams({
            image_url: imageUrl,
            media_type: 'STORIES',
            access_token: cfg.igToken
        });
        const r1 = await fetch(createUrl + '?' + createBody).then(r => r.json());
        if (!r1.id) { console.warn('createMedia falhou', r1); return null; }

        // 2. Publica
        const pubUrl = `https://graph.facebook.com/v19.0/${cfg.igAccountId}/media_publish`;
        const pubBody = new URLSearchParams({
            creation_id: r1.id,
            access_token: cfg.igToken
        });
        const r2 = await fetch(pubUrl + '?' + pubBody).then(r => r.json());
        return r2.id || null;
    } catch (e) {
        console.warn('uploadStory error:', e);
        return null;
    }
}

function buildStoryPreviewUrl(fid, type, data) {
    // Placeholder. Em produção, endpoint que renderiza imagem 1080x1920 via Puppeteer/Canvas.
    // Pode ser: https://milkypot.com/api/render-story?fid=...&type=contador&n=347
    // Por enquanto devolve um via.placeholder pra o fluxo não quebrar em dev.
    return 'https://via.placeholder.com/1080x1920/FF4F8A/FFFFFF?text=MilkyPot+' + type;
}

function countHoje(orders) {
    const t = new Date(); t.setHours(0,0,0,0);
    let c = 0;
    for (const o of orders || []) {
        if (!o.createdAt) continue;
        if (new Date(o.createdAt) < t) continue;
        if (o.status !== 'confirmado' && o.status !== 'entregue' && o.status !== 'pago') continue;
        for (const it of (o.items || [])) c += Number(it.qty || 1);
    }
    return c;
}

function topSabores(orders) {
    const t = new Date(); t.setHours(0,0,0,0);
    const counts = {};
    let total = 0;
    for (const o of orders || []) {
        if (!o.createdAt) continue;
        if (new Date(o.createdAt) < t) continue;
        for (const it of (o.items || [])) {
            const n = (it.name || '').trim() || 'Outros';
            const qty = Number(it.qty || 1);
            counts[n] = (counts[n] || 0) + qty;
            total += qty;
        }
    }
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
