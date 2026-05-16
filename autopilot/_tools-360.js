/**
 * MilkyPot Belinha — Tools 360° Executivo Completo
 * ===================================================
 *
 * Conjunto AUDITIVO de tools que estende TOOLS_IMPL do copilot-server.js
 * sem mexer nas tools existentes (REGRA #0 anti-regressão).
 *
 * Agrupado por dominio:
 *   FASE A — Diagnostico (saude do sistema)
 *   FASE B — Vendas (analise profunda em tempo real)
 *   FASE C — Marketing (TV, IG, TikTok, WhatsApp, concorrentes, tendencias)
 *   FASE D — Operacao (PDV, caixa, equipe, escalacoes)
 *
 * Uso:
 *   const tools360 = require('./_tools-360.js');
 *   Object.assign(TOOLS_IMPL, tools360.build({ db, readDS, writeDS, admin }));
 *
 * Cada tool retorna JSON serializavel pro Claude entender.
 */

"use strict";

function build({ db, readDS, writeDS, admin }) {

    // =========================================================
    // Helpers compartilhados
    // =========================================================
    function isoDateBR() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // compensa offset
        return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    }
    function isoDaysAgo(n) {
        const d = new Date(Date.now() - n * 86400000);
        return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    }
    async function readOrders(fid) {
        const data = await readDS('orders_' + fid, []);
        return Array.isArray(data) ? data : (Array.isArray(data.orders) ? data.orders : []);
    }
    function orderDateKey(o) {
        return (o.createdAt || o.created_at || o.timestamp || '').toString().slice(0, 10);
    }
    function orderHour(o) {
        const ts = o.createdAt || o.created_at || o.timestamp;
        if (!ts) return null;
        try {
            const d = new Date(ts);
            // Compensa pra horário Brasília
            const utcHour = d.getUTCHours();
            return (utcHour - 3 + 24) % 24;
        } catch (_) { return null; }
    }
    function fetchWithTimeout(url, opts = {}, ms = 5000) {
        return Promise.race([
            fetch(url, opts),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + ms + 'ms')), ms))
        ]);
    }

    // =========================================================
    // FASE A — DIAGNÓSTICO
    // =========================================================

    /**
     * Visão geral 360° de saúde do sistema:
     *   - Status do Firestore (ping)
     *   - SW cache version atual no servidor vs ultima conhecida
     *   - Releases mais recentes dos APKs (Colaborador + TV)
     *   - Quantidade de erros recentes registrados
     *   - Resumo de uptime
     */
    async function system_health() {
        const result = { checkedAt: new Date().toISOString(), checks: {} };

        // 1. Firestore ping
        try {
            const t0 = Date.now();
            await db.collection('datastore').doc('franchises').get();
            result.checks.firestore = { ok: true, latencyMs: Date.now() - t0 };
        } catch (e) {
            result.checks.firestore = { ok: false, error: e.message };
        }

        // 2. SW cache atual (lê milkypot.com/sw.js)
        try {
            const r = await fetchWithTimeout('https://milkypot.com/sw.js', {}, 4000);
            const txt = await r.text();
            const m = txt.match(/CACHE_VERSION\s*=\s*['"](mp-v\d+)['"]/);
            const m2 = txt.match(/CACHE_NAME\s*=\s*['"](milkypot-v\d+)['"]/);
            result.checks.sw = {
                ok: !!m,
                cacheVersion: m ? m[1] : null,
                cacheName: m2 ? m2[1] : null,
                consistent: m && m2 && m[1].endsWith(m2[1].split('-v')[1])
            };
        } catch (e) {
            result.checks.sw = { ok: false, error: e.message };
        }

        // 3. APK Colaborador release
        try {
            const r = await fetchWithTimeout(
                'https://api.github.com/repos/telekarinho/1/releases?per_page=10',
                { headers: { Accept: 'application/vnd.github+json' } },
                5000
            );
            const releases = await r.json();
            const colab = releases.find(rel => (rel.tag_name || '').startsWith('android-v'));
            const tv = releases.find(rel => rel.tag_name === 'tv-apk-latest');
            result.checks.apk = {
                ok: !!(colab || tv),
                colaborador: colab ? { tag: colab.tag_name, publishedAt: colab.published_at } : null,
                tv: tv ? { tag: tv.tag_name, publishedAt: tv.published_at } : null
            };
        } catch (e) {
            result.checks.apk = { ok: false, error: e.message };
        }

        // 4. Erros recentes registrados (doc opcional `system_errors`)
        try {
            const errs = await readDS('system_errors', []);
            const arr = Array.isArray(errs) ? errs : (Array.isArray(errs.errors) ? errs.errors : []);
            const last24h = arr.filter(e => {
                const t = new Date(e.timestamp || e.createdAt || 0).getTime();
                return Date.now() - t < 86400000;
            });
            result.checks.errors = {
                ok: last24h.length === 0,
                totalRecorded: arr.length,
                last24h: last24h.length,
                samples: last24h.slice(-3).map(e => ({ msg: (e.message || e.error || '').slice(0, 120), page: e.page }))
            };
        } catch (e) {
            result.checks.errors = { ok: false, error: e.message };
        }

        // Resumo executivo
        const allOk = Object.values(result.checks).every(c => c.ok);
        result.summary = allOk ? 'OK — todos os subsistemas saudáveis' : 'ATENÇÃO — alguns subsistemas com problema';
        return result;
    }

    /**
     * Versões dos APKs (Colaborador + TV) lendo direto do GitHub Releases.
     * Útil pra responder "o APK tá atualizado?"
     */
    async function check_apk_versions() {
        try {
            const r = await fetchWithTimeout(
                'https://api.github.com/repos/telekarinho/1/releases?per_page=20',
                { headers: { Accept: 'application/vnd.github+json' } },
                5000
            );
            const releases = await r.json();
            const colab = releases.find(rel => (rel.tag_name || '').startsWith('android-v'));
            const tv = releases.find(rel => rel.tag_name === 'tv-apk-latest');
            return {
                colaborador: colab ? {
                    tag: colab.tag_name,
                    publishedAt: colab.published_at,
                    apk: (colab.assets || []).find(a => a.name.endsWith('.apk'))?.browser_download_url,
                    aab: (colab.assets || []).find(a => a.name.endsWith('.aab'))?.browser_download_url
                } : null,
                tv: tv ? {
                    tag: tv.tag_name,
                    publishedAt: tv.published_at,
                    apk: (tv.assets || []).find(a => a.name === 'tv.apk')?.browser_download_url
                } : null
            };
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * Erros recentes registrados pelo sistema (PDV, painel, etc).
     * Lê do doc `system_errors` ou `errors_<fid>` se especificado.
     */
    async function recent_errors({ franchiseId, hours = 24 } = {}) {
        const docId = franchiseId ? 'errors_' + franchiseId : 'system_errors';
        const raw = await readDS(docId, []);
        const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.errors) ? raw.errors : []);
        const cutoff = Date.now() - hours * 3600 * 1000;
        const recent = arr.filter(e => new Date(e.timestamp || e.createdAt || 0).getTime() >= cutoff);
        return {
            window: hours + 'h',
            total: recent.length,
            errors: recent.slice(-30).map(e => ({
                message: (e.message || e.error || '').slice(0, 200),
                page: e.page,
                timestamp: e.timestamp || e.createdAt,
                stack: e.stack ? e.stack.slice(0, 300) : null
            }))
        };
    }

    /**
     * Status do Service Worker (cache version atual servida ao usuário).
     */
    async function sw_cache_status() {
        try {
            const r = await fetchWithTimeout('https://milkypot.com/sw.js', { cache: 'no-store' }, 4000);
            const txt = await r.text();
            const m = txt.match(/CACHE_VERSION\s*=\s*['"](mp-v\d+)['"]/);
            const m2 = txt.match(/CACHE_NAME\s*=\s*['"](milkypot-v\d+)['"]/);
            return {
                cacheVersion: m ? m[1] : null,
                cacheName: m2 ? m2[1] : null,
                consistent: !!(m && m2),
                fetchedAt: new Date().toISOString()
            };
        } catch (e) {
            return { error: e.message };
        }
    }

    // =========================================================
    // FASE B — VENDAS
    // =========================================================

    /**
     * Compara vendas: hoje vs ontem vs semana passada vs mes anterior.
     * Para uma franquia (ou todas se omitir franchiseId).
     */
    async function sales_compare({ franchiseId } = {}) {
        const fids = franchiseId ? [franchiseId] : (await (async () => {
            const data = await readDS('franchises', []);
            const list = Array.isArray(data) ? data : (data.franchises || []);
            return list.map(f => f.id).filter(Boolean);
        })());

        const today = isoDateBR();
        const yesterday = isoDaysAgo(1);
        const weekAgo = isoDaysAgo(7);
        const monthAgo = isoDaysAgo(30);

        async function bucket(orders, day) {
            const dayOrders = orders.filter(o => orderDateKey(o) === day);
            const total = dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
            return { date: day, count: dayOrders.length, revenue: Math.round(total * 100) / 100 };
        }

        const out = {};
        for (const fid of fids) {
            const orders = await readOrders(fid);
            out[fid] = {
                today: await bucket(orders, today),
                yesterday: await bucket(orders, yesterday),
                weekAgo: await bucket(orders, weekAgo),
                monthAgo: await bucket(orders, monthAgo),
                deltas: {}
            };
            const t = out[fid].today.revenue;
            const y = out[fid].yesterday.revenue;
            const w = out[fid].weekAgo.revenue;
            out[fid].deltas.vsYesterday = y > 0 ? Math.round((t - y) / y * 100) : null;
            out[fid].deltas.vsWeekAgo = w > 0 ? Math.round((t - w) / w * 100) : null;
        }
        return out;
    }

    /**
     * Top items vendidos hoje (ou em N dias).
     */
    async function top_items_today({ franchiseId, days = 1, limit = 10 } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const orders = await readOrders(franchiseId);
        const cutoff = isoDaysAgo(days - 1);
        const recent = orders.filter(o => orderDateKey(o) >= cutoff);
        const tally = {};
        for (const o of recent) {
            const items = Array.isArray(o.items) ? o.items : [];
            for (const it of items) {
                const key = it.id || it.productId || it.name || 'desconhecido';
                if (!tally[key]) tally[key] = { name: it.name || key, count: 0, revenue: 0 };
                tally[key].count += Number(it.qty || it.quantity || 1);
                tally[key].revenue += Number(it.subtotal || it.price || 0);
            }
        }
        const ranked = Object.values(tally)
            .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
            .slice(0, limit);
        return { window: days + 'd', totalOrders: recent.length, top: ranked };
    }

    /**
     * Horários de pico — histograma de pedidos por hora.
     */
    async function peak_hours({ franchiseId, days = 7 } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const orders = await readOrders(franchiseId);
        const cutoff = isoDaysAgo(days - 1);
        const recent = orders.filter(o => orderDateKey(o) >= cutoff);
        const hist = Array(24).fill(0);
        const revByHour = Array(24).fill(0);
        for (const o of recent) {
            const h = orderHour(o);
            if (h === null) continue;
            hist[h]++;
            revByHour[h] += Number(o.total || 0);
        }
        const peaks = hist
            .map((c, h) => ({ hour: h, orders: c, revenue: Math.round(revByHour[h] * 100) / 100 }))
            .filter(x => x.orders > 0)
            .sort((a, b) => b.orders - a.orders);
        return { window: days + 'd', byHour: hist, top3: peaks.slice(0, 3) };
    }

    /**
     * Ticket médio nos últimos N dias.
     */
    async function ticket_average({ franchiseId, days = 7 } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const orders = await readOrders(franchiseId);
        const cutoff = isoDaysAgo(days - 1);
        const recent = orders.filter(o => orderDateKey(o) >= cutoff);
        if (!recent.length) return { window: days + 'd', count: 0, ticket: 0 };
        const totalRev = recent.reduce((s, o) => s + (Number(o.total) || 0), 0);
        return {
            window: days + 'd',
            count: recent.length,
            totalRevenue: Math.round(totalRev * 100) / 100,
            ticket: Math.round((totalRev / recent.length) * 100) / 100
        };
    }

    /**
     * Estoque + giro: lê `inventory_<fid>` e mostra itens em baixa/alto giro.
     */
    async function inventory_status({ franchiseId } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const data = await readDS('inventory_' + franchiseId, null);
        if (!data) return { exists: false, hint: 'Nenhum inventário cadastrado pra essa franquia' };
        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        const lowStock = items.filter(i => {
            const q = Number(i.quantity || i.qty || 0);
            const min = Number(i.minQuantity || i.min || 5);
            return q <= min;
        });
        const total = items.reduce((s, i) => s + (Number(i.cost || 0) * Number(i.quantity || 0)), 0);
        return {
            itemsTotal: items.length,
            estimatedValue: Math.round(total * 100) / 100,
            lowStock: lowStock.map(i => ({ name: i.name, qty: i.quantity || i.qty, min: i.minQuantity || i.min || 5 })),
            warning: lowStock.length > 0 ? `${lowStock.length} itens em baixa precisam reposição` : 'Estoque saudável'
        };
    }

    // =========================================================
    // FASE C — MARKETING
    // =========================================================

    /**
     * Adiciona slide na biblioteca da TV + enfileira na playlist da franquia.
     * O painel admin / tv.html ja gerenciam o resto.
     */
    async function tv_slide_add({ franchiseId, slide }) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        if (!slide || !slide.type) return { error: 'slide.type obrigatório (image, video, promo, milkshake-card, etc)' };

        const mediaRaw = await readDS('tv_media_' + franchiseId, []);
        const playRaw = await readDS('tv_playlist_' + franchiseId, []);
        const media = Array.isArray(mediaRaw) ? mediaRaw : (mediaRaw.media || []);
        const playlist = Array.isArray(playRaw) ? playRaw : (playRaw.playlist || []);

        const id = slide.id || ('slide_' + Math.random().toString(36).slice(2, 12));
        const newItem = Object.assign({}, slide, { id, addedAt: new Date().toISOString(), addedBy: 'belinha' });
        media.push(newItem);
        playlist.push({ mediaId: id, duration: slide.duration || 10 });

        await writeDS('tv_media_' + franchiseId, media);
        await writeDS('tv_playlist_' + franchiseId, playlist);

        return { success: true, id, playlistSize: playlist.length, hint: 'TVs vao pegar na proxima refresh (até 30s)' };
    }

    /**
     * Enfileira post pro Instagram (auto-poster posterior pega).
     * Doc: `ig_post_queue_<franchiseId>`
     */
    async function instagram_post_queue({ franchiseId, caption, mediaUrl, hashtags, scheduledFor }) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        if (!caption) return { error: 'caption obrigatória' };
        const queue = await readDS('ig_post_queue_' + franchiseId, []);
        const arr = Array.isArray(queue) ? queue : (queue.posts || []);
        const post = {
            id: 'igpost_' + Date.now(),
            caption,
            mediaUrl: mediaUrl || null,
            hashtags: hashtags || [],
            scheduledFor: scheduledFor || new Date().toISOString(),
            status: 'queued',
            createdBy: 'belinha',
            createdAt: new Date().toISOString()
        };
        arr.push(post);
        await writeDS('ig_post_queue_' + franchiseId, arr);
        return { success: true, post, queueSize: arr.length };
    }

    /**
     * Enfileira post pro TikTok.
     */
    async function tiktok_post_queue({ franchiseId, caption, videoUrl, hashtags, scheduledFor }) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        if (!caption) return { error: 'caption obrigatória' };
        const queue = await readDS('tiktok_post_queue_' + franchiseId, []);
        const arr = Array.isArray(queue) ? queue : (queue.posts || []);
        const post = {
            id: 'ttpost_' + Date.now(),
            caption,
            videoUrl: videoUrl || null,
            hashtags: hashtags || [],
            scheduledFor: scheduledFor || new Date().toISOString(),
            status: 'queued',
            createdBy: 'belinha',
            createdAt: new Date().toISOString()
        };
        arr.push(post);
        await writeDS('tiktok_post_queue_' + franchiseId, arr);
        return { success: true, post, queueSize: arr.length };
    }

    /**
     * Enfileira broadcast WhatsApp (segmentado por tag).
     */
    async function whatsapp_broadcast_queue({ franchiseId, message, targetTag, scheduledFor }) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        if (!message) return { error: 'message obrigatória' };
        const queue = await readDS('wa_broadcast_queue_' + franchiseId, []);
        const arr = Array.isArray(queue) ? queue : (queue.broadcasts || []);
        const bc = {
            id: 'wa_' + Date.now(),
            message,
            targetTag: targetTag || 'all',
            scheduledFor: scheduledFor || new Date().toISOString(),
            status: 'queued',
            createdBy: 'belinha',
            createdAt: new Date().toISOString()
        };
        arr.push(bc);
        await writeDS('wa_broadcast_queue_' + franchiseId, arr);
        return { success: true, broadcast: bc, queueSize: arr.length };
    }

    /**
     * Scan de concorrentes (lista fixa Londrina + sugestão de monitoramento).
     */
    async function competitor_scan({ city = 'Londrina-PR' } = {}) {
        const COMPETITORS_LONDRINA = [
            { name: 'Bacio di Latte', focus: 'gelato premium', strength: 'marca italiana, preço alto', weakness: 'sem cashback, sem buffet' },
            { name: 'Sorvetes Cremosinho', focus: 'sorvete soft, açaí', strength: 'preço baixo, várias unidades', weakness: 'sem programa fidelidade, visual datado' },
            { name: 'Açaí da Joana', focus: 'açaí 100%', strength: 'consolidado, açaí puro', weakness: 'cardápio limitado' },
            { name: 'Fini Açaí', focus: 'açaí + buffet', strength: 'buffet self-service', weakness: 'sem app, sem cashback' },
            { name: 'Sorvete Marechal', focus: 'sorvete tradicional', strength: 'localizado em ponto premium', weakness: 'sem mídia digital' }
        ];
        return {
            city,
            generatedAt: new Date().toISOString(),
            competitors: COMPETITORS_LONDRINA,
            milkypotEdges: [
                'Cashback MilkyCoins (nenhum concorrente tem)',
                'TV indoor com 80+ slides do catálogo (signage profissional)',
                'PWA + APK próprio (Bacio só tem site)',
                'WhatsApp Belinha 24/7 com IA',
                'Mascote ovelhinha (lúdico, vira meme)',
                'Buffet R$5,99/100g (vs R$8-9 dos concorrentes)'
            ],
            opportunities: [
                'Comparativo de preço por 100g (mostrar que MilkyPot é mais barato)',
                'Story IG: "fui no [concorrente] e voltei pro MilkyPot porque..."',
                'Geofencing: anúncios Meta quando cliente passa perto de Bacio'
            ]
        };
    }

    /**
     * Pulse de tendências: estação, datas comemorativas próximas, eventos locais.
     */
    async function trend_pulse() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const season = (month >= 12 || month <= 2) ? 'verão' :
                       (month >= 3 && month <= 5) ? 'outono' :
                       (month >= 6 && month <= 8) ? 'inverno' : 'primavera';
        const dates = [
            { name: 'Dia das Mães', mmdd: '0512', heroSku: 'açaí 770ml + milkshake combo' },
            { name: 'Dia dos Namorados', mmdd: '0612', heroSku: 'sundae duplo coração' },
            { name: 'Dia dos Pais', mmdd: '0810', heroSku: 'milkshake monster 770ml' },
            { name: 'Dia das Crianças', mmdd: '1012', heroSku: 'kit escolar potinho 200g' },
            { name: 'Black Friday', mmdd: '1129', heroSku: 'açaí 1L com 50% off' },
            { name: 'Natal', mmdd: '1225', heroSku: 'sundae panetone' },
            { name: 'Ano Novo', mmdd: '0101', heroSku: 'milkshake espumante' },
            { name: 'Carnaval', mmdd: '0220', heroSku: 'açaí refrescante 770ml' }
        ];
        const mmdd = String(month).padStart(2, '0') + String(day).padStart(2, '0');
        const upcoming = dates
            .map(d => {
                const diff = (parseInt(d.mmdd) - parseInt(mmdd) + 365 * 4) % 365;
                return Object.assign({}, d, { daysAway: diff });
            })
            .sort((a, b) => a.daysAway - b.daysAway)
            .slice(0, 3);
        return {
            season,
            seasonAdvice: season === 'verão' ? 'PICO DE VENDA — focar em açaí 770ml e milkshakes frutados' :
                          season === 'inverno' ? 'Vendas caem — focar em milkshakes quentes, combos, fidelidade pra reter' :
                          'Vendas moderadas — focar em novidades sazonais',
            upcoming,
            advice: upcoming[0].daysAway <= 14
                ? `Faltam ${upcoming[0].daysAway} dias pra ${upcoming[0].name}. Comece campanha AGORA com ${upcoming[0].heroSku}.`
                : `Próxima grande data: ${upcoming[0].name} (${upcoming[0].daysAway} dias). Janela tranquila.`
        };
    }

    // =========================================================
    // FASE D — OPERAÇÃO
    // =========================================================

    /**
     * Status do PDV: caixa aberto/fechado, último heartbeat.
     */
    async function pdv_status({ franchiseId } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const caixaData = await readDS('caixa_' + franchiseId, null);
        const caixaArr = caixaData
            ? (Array.isArray(caixaData) ? caixaData : (Array.isArray(caixaData.caixas) ? caixaData.caixas : []))
            : [];
        const aberto = caixaArr.find(c => c.status === 'aberto' || c.status === 'open');
        const ultimoFechado = caixaArr
            .filter(c => c.status === 'fechado' || c.status === 'closed')
            .sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''))[0];
        return {
            caixaAberto: !!aberto,
            caixa: aberto ? {
                id: aberto.id,
                openedAt: aberto.openedAt || aberto.createdAt,
                openedBy: aberto.openedBy || aberto.operator,
                vendas: aberto.vendas || aberto.totalVendas
            } : null,
            ultimoFechado: ultimoFechado ? {
                date: (ultimoFechado.closedAt || '').slice(0, 10),
                vendas: ultimoFechado.vendas || ultimoFechado.totalVendas,
                operador: ultimoFechado.closedBy || ultimoFechado.operator
            } : null
        };
    }

    /**
     * Alias amigável pro pdv_status.
     */
    async function caixa_status(args) {
        return pdv_status(args);
    }

    /**
     * Equipe presente HOJE: lê staff_<fid> + punches do dia.
     */
    async function staff_present({ franchiseId } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const staff = await readDS('staff_' + franchiseId, []);
        const staffList = Array.isArray(staff) ? staff : (staff.members || []);
        const punches = await readDS('punches_' + franchiseId, []);
        const punchList = Array.isArray(punches) ? punches : (punches.entries || []);
        const today = isoDateBR();
        const todayPunches = punchList.filter(p => (p.date || (p.timestamp || '').slice(0, 10)) === today);
        const present = todayPunches
            .filter(p => p.type === 'in' || p.action === 'entrada')
            .map(p => p.staffId || p.userId);
        const presentSet = new Set(present);
        return {
            date: today,
            totalCadastrados: staffList.length,
            presentesHoje: present.length,
            ausentes: staffList.filter(s => !presentSet.has(s.id)).map(s => s.name).slice(0, 10),
            punches: todayPunches.length
        };
    }

    /**
     * Comissão acumulada hoje (PDV + lançamentos do operador).
     */
    async function commission_today({ franchiseId } = {}) {
        if (!franchiseId) return { error: 'franchiseId obrigatório' };
        const orders = await readOrders(franchiseId);
        const today = isoDateBR();
        const todayOrders = orders.filter(o => orderDateKey(o) === today);
        const byOperator = {};
        for (const o of todayOrders) {
            const op = o.operator || o.operatorId || o.createdBy || 'desconhecido';
            if (!byOperator[op]) byOperator[op] = { count: 0, revenue: 0, commission: 0 };
            byOperator[op].count++;
            byOperator[op].revenue += Number(o.total || 0);
            byOperator[op].commission += Number(o.commission || 0);
        }
        return {
            date: today,
            operators: Object.entries(byOperator).map(([op, d]) => ({
                operator: op,
                orders: d.count,
                revenue: Math.round(d.revenue * 100) / 100,
                commission: Math.round(d.commission * 100) / 100
            }))
        };
    }

    /**
     * Fila de escalações pendentes (cliente esperando humano via Belinha).
     */
    async function escalation_queue({ franchiseId } = {}) {
        // Escalações vivem em conversas WhatsApp com humanTakeover=true
        const docId = franchiseId ? 'wa_conversations_' + franchiseId : 'wa_conversations';
        const data = await readDS(docId, []);
        const convs = Array.isArray(data) ? data : (Array.isArray(data.conversations) ? data.conversations : []);
        const pending = convs.filter(c => c.humanTakeover === true && !c.resolvedAt);
        return {
            pendentes: pending.length,
            convs: pending.slice(0, 20).map(c => ({
                phone: c.phone,
                name: c.name || c.contactName,
                reason: c.escalationReason || c.reason,
                since: c.escalatedAt,
                lastMessage: (c.lastMessage || '').slice(0, 100)
            }))
        };
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        // Fase A
        system_health,
        check_apk_versions,
        recent_errors,
        sw_cache_status,
        // Fase B
        sales_compare,
        top_items_today,
        peak_hours,
        ticket_average,
        inventory_status,
        // Fase C
        tv_slide_add,
        instagram_post_queue,
        tiktok_post_queue,
        whatsapp_broadcast_queue,
        competitor_scan,
        trend_pulse,
        // Fase D
        pdv_status,
        caixa_status,
        staff_present,
        commission_today,
        escalation_queue
    };
}

module.exports = { build };
