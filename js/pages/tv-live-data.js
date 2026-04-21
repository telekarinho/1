/* ============================================================
   MilkyPot — TV Live Data helper
   ============================================================
   Agrega dados do PDV/Firestore em tempo real pros slides dinâmicos
   da TV Indoor. Todas as funcs retornam Promises.

   Funções principais:
     TvLiveData.potinhosHoje(fid)          → { count, lastMinute }
     TvLiveData.topSabores(fid, horas=24)  → [{ name, count, pct }, ...]
     TvLiveData.winners300g(fid, n=5)      → [{ name, time, weight }, ...]
     TvLiveData.stockBySabor(fid)          → [{ name, stockPercent }, ...]
     TvLiveData.fillTemplate(tpl, fid)     → preenche A1/A2/A3/A6 auto
   ============================================================ */
(function(global){
    'use strict';

    function today0() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function isSameDay(iso) {
        try {
            const d = new Date(iso);
            const t = today0();
            return d >= t && d < new Date(t.getTime() + 86400000);
        } catch (e) { return false; }
    }

    function parseSabores(itemName) {
        // Extrai sabores compostos do tipo "Ninho com Morango"
        // ou simples "Nutella"
        const lower = String(itemName || '').toLowerCase();
        const candidates = ['Morango', 'Ninho', 'Nutella', 'Oreo', 'Capuccino', 'Ninho com Morango', 'Ninho com morango'];
        const found = [];
        for (const sab of candidates) {
            if (lower.includes(sab.toLowerCase())) {
                if (!found.some(f => f.toLowerCase().includes(sab.toLowerCase()) || sab.toLowerCase().includes(f.toLowerCase()))) {
                    found.push(sab);
                }
            }
        }
        if (!found.length) return ['Outros'];
        return found;
    }

    // ============= Contador de Potinhos Hoje =============
    async function potinhosHoje(fid) {
        if (typeof DataStore === 'undefined') return { count: 0, lastMinute: null };
        const orders = DataStore.getCollection('orders', fid) || [];
        const hoje = orders.filter(o =>
            o && o.createdAt && isSameDay(o.createdAt) &&
            (o.status === 'confirmado' || o.status === 'entregue' || o.status === 'pago')
        );
        let count = 0;
        hoje.forEach(o => {
            (o.items || []).forEach(it => { count += Number(it.qty || 1); });
        });
        const lastMinute = hoje.length ? hoje[hoje.length - 1].createdAt : null;
        return { count, lastMinute };
    }

    // ============= Top Sabores (% do dia) =============
    async function topSabores(fid, horas = 24) {
        if (typeof DataStore === 'undefined') return [];
        const orders = DataStore.getCollection('orders', fid) || [];
        const since = Date.now() - horas * 3600 * 1000;
        const counts = {};
        let total = 0;
        orders.forEach(o => {
            if (!o || !o.createdAt) return;
            if (new Date(o.createdAt).getTime() < since) return;
            if (o.status !== 'confirmado' && o.status !== 'entregue' && o.status !== 'pago') return;
            (o.items || []).forEach(it => {
                const qty = Number(it.qty || 1);
                const sabores = parseSabores(it.name);
                sabores.forEach(sab => {
                    counts[sab] = (counts[sab] || 0) + qty;
                    total += qty;
                });
            });
        });
        if (!total) return [];
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
            .sort((a, b) => b.count - a.count);
    }

    // ============= Ganhadores Desafio 300g =============
    // Doc: datastore/challenge_300g_winners_{fid} = [{name, weight, at}, ...]
    async function winners300g(fid, n = 5) {
        if (typeof DataStore === 'undefined') return [];
        const list = DataStore.get('challenge_300g_winners_' + fid) || [];
        return (list.slice(-n).reverse()).map(w => ({
            name: w.name || 'Anônimo',
            weight: Number(w.weight || 300).toFixed(1) + 'g',
            time: w.at ? new Date(w.at).toLocaleTimeString('pt-BR').slice(0, 5) : '—'
        }));
    }

    // Registrar um ganhador (chamar do PDV ou da balança integrada)
    function addWinner300g(fid, name, weight) {
        if (typeof DataStore === 'undefined') return false;
        const key = 'challenge_300g_winners_' + fid;
        const list = DataStore.get(key) || [];
        list.push({
            name: name || 'Anônimo',
            weight: Number(weight),
            at: new Date().toISOString()
        });
        if (list.length > 100) list.splice(0, list.length - 100);
        DataStore.set(key, list);
        return true;
    }

    // ============= Dayparting (qual slot do dia?) =============
    function currentDaypart() {
        const h = new Date().getHours();
        if (h >= 8 && h < 11) return 'manha';
        if (h >= 11 && h < 14) return 'almoco';
        if (h >= 14 && h < 18) return 'tarde';
        if (h >= 18 && h < 22) return 'noite';
        return 'fechado';
    }

    // ============= Preencher template automaticamente =============
    // Recebe um objeto `data` (campos do template) e preenche com valores reais.
    async function fillTemplate(templateId, fid, currentData) {
        const out = Object.assign({}, currentData || {});
        try {
            switch (templateId) {
                case 'a1': {
                    // Escassez do Dia — precisa de stock real, que ainda é manual
                    // Por enquanto retorna sem mudança
                    break;
                }
                case 'a2': {
                    const winners = await winners300g(fid, 3);
                    if (winners.length >= 1) { out.n1 = winners[0].name; out.h1 = winners[0].time; }
                    if (winners.length >= 2) { out.n2 = winners[1].name; out.h2 = winners[1].time; }
                    if (winners.length >= 3) { out.n3 = winners[2].name; out.h3 = winners[2].time; }
                    break;
                }
                case 'a3': {
                    const top = await topSabores(fid, 24);
                    if (top[0]) { out.n1 = top[0].name; out.p1 = top[0].pct; }
                    if (top[1]) { out.n2 = top[1].name; out.p2 = top[1].pct; }
                    if (top[2]) { out.n3 = top[2].name; out.p3 = top[2].pct; }
                    if (top[3]) { out.n4 = top[3].name; out.p4 = top[3].pct; }
                    out.date = new Date().toLocaleDateString('pt-BR');
                    break;
                }
                case 'a6': {
                    const { count } = await potinhosHoje(fid);
                    if (count > 0) out.num = String(count);
                    break;
                }
            }
        } catch (e) { console.warn('fillTemplate error:', e); }
        return out;
    }

    // ============= Auto-publicar no tv_media =============
    // Sobe uma imagem base64 (PNG) como item de mídia da franquia,
    // substituindo qualquer mídia anterior do mesmo slot (slug).
    async function publishToPlaylist(fid, slug, dataUrl, duration = 10) {
        if (typeof DataStore === 'undefined') return false;
        const mediaKey = 'tv_media_' + fid;
        const playlistKey = 'tv_playlist_' + fid;

        // Busca existente pelo slug
        let media = DataStore.get(mediaKey) || [];
        let existing = media.find(m => m.slug === slug);
        if (existing) {
            existing.dataUrl = dataUrl;
            existing.updatedAt = new Date().toISOString();
        } else {
            existing = {
                id: 'slide_' + slug,
                slug: slug,
                name: slug,
                type: 'image',
                dataUrl: dataUrl,
                duration: duration,
                createdAt: new Date().toISOString()
            };
            media.push(existing);
        }
        DataStore.set(mediaKey, media);

        // Adiciona à playlist se ainda não estiver
        let playlist = DataStore.get(playlistKey) || [];
        const has = playlist.some(p => (typeof p === 'string' ? p : p.mediaId) === existing.id);
        if (!has) {
            playlist.push({ mediaId: existing.id, duration: duration });
            DataStore.set(playlistKey, playlist);
        }
        return true;
    }

    global.TvLiveData = {
        potinhosHoje,
        topSabores,
        winners300g,
        addWinner300g,
        currentDaypart,
        fillTemplate,
        publishToPlaylist
    };
})(typeof window !== 'undefined' ? window : this);
