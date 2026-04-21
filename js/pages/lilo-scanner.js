/* ============================================================
   MilkyPot — Lilo State Scanner
   ============================================================
   Audita o estado do painel (super_admin ou franqueado) e devolve
   um relatório estruturado que a Lilo usa pra gerar briefing proativo.

   Retorna:
     {
       scope: "franchise" | "super_admin",
       franchiseName: string,
       metrics: { vendas/hoje, ticketMedio, ... },
       alerts: [{ level, title, detail, suggestedAction }],
       opportunities: [{ title, detail, effort, impact }],
       pendencias: [...]
     }
   ============================================================ */
(function(global){
    'use strict';

    function scanFranchise(fid) {
        const now = new Date();
        const today = new Date(); today.setHours(0,0,0,0);
        const weekAgo = new Date(today.getTime() - 7*86400000);
        const twoHoursAgo = Date.now() - 2*60*60*1000;

        const franchises = DataStore.get('franchises') || [];
        const f = franchises.find(x => x.id === fid) || {};

        const orders = DataStore.getCollection('orders', fid) || [];
        const todayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt) >= today);
        const weekOrders = orders.filter(o => o.createdAt && new Date(o.createdAt) >= weekAgo);
        const revHoje = todayOrders.reduce((s,o) => s + (+o.total||0), 0);
        const revSem = weekOrders.reduce((s,o) => s + (+o.total||0), 0);
        const ticketMedio = weekOrders.length ? revSem/weekOrders.length : 0;

        // Ultima venda
        const lastOrder = orders[orders.length - 1];
        const lastOrderTs = lastOrder ? new Date(lastOrder.createdAt).getTime() : 0;
        const minutesSinceLast = lastOrder ? Math.floor((Date.now() - lastOrderTs)/60000) : null;

        // Estoque
        const inv = DataStore.getCollection('inventory', fid) || [];
        const baixos = inv.filter(i => (i.quantity||0) < (i.minStock||0));
        const criticos = inv.filter(i => (i.quantity||0) < (i.minStock||0) * 0.3);

        // Catálogo
        const cat = DataStore.get('catalog_config') || {};
        const allFlavors = Object.values(cat.sabores || {}).flatMap(g => g.items||[]);
        const sabPendentes = allFlavors.filter(i => !i.receita || !i.receita.length);
        const sabIndisp = allFlavors.filter(i => i.available === false);

        // TVs + heartbeat
        const tvs = DataStore.get('tv_devices_' + fid) || [];
        const tvsOffline = [];
        tvs.forEach(t => {
            const hb = DataStore.get('tv_heartbeat_' + fid + '_' + t.id);
            if (!hb) { tvsOffline.push({ ...t, status: 'nunca-conectou' }); return; }
            const age = (Date.now() - new Date(hb.lastSeen).getTime()) / 60000;
            if (age > 10) tvsOffline.push({ ...t, status: 'offline', ageMin: Math.round(age) });
        });
        const playlist = DataStore.get('tv_playlist_' + fid) || [];

        // Desafios
        const winners10s = DataStore.get('challenge_10s_winners_' + fid) || [];
        const winners300g = DataStore.get('challenge_300g_winners_' + fid) || [];

        // IG autopost
        const igCfg = DataStore.get('ig_autopost_' + fid) || {};
        const igHistory = DataStore.get('ig_autopost_history_' + fid) || [];
        const lastIgPost = igHistory[0]?.at ? new Date(igHistory[0].at).getTime() : 0;
        const igDaysSince = lastIgPost ? Math.round((Date.now() - lastIgPost) / 86400000) : null;

        // ========== Alertas ==========
        const alerts = [];

        if (criticos.length) {
            alerts.push({
                level: 'critical',
                title: `Estoque CRÍTICO em ${criticos.length} insumo(s)`,
                detail: criticos.map(i => `${i.name}: ${i.quantity} ${i.unit} (min ${i.minStock})`).join(' · '),
                suggestedAction: 'Comprar hoje. Risco de produto indisponível nos próximos pedidos.'
            });
        } else if (baixos.length) {
            alerts.push({
                level: 'warning',
                title: `${baixos.length} insumo(s) com estoque baixo`,
                detail: baixos.map(i => `${i.name}: ${i.quantity} ${i.unit}`).join(' · '),
                suggestedAction: 'Planejar compra nos próximos 2-3 dias.'
            });
        }

        if (tvsOffline.length) {
            alerts.push({
                level: 'warning',
                title: `${tvsOffline.length} TV(s) offline há >10 min`,
                detail: tvsOffline.map(t => `${t.name || t.id}: ${t.status}${t.ageMin ? ' ' + t.ageMin + 'min' : ''}`).join(' · '),
                suggestedAction: 'Verificar rede / reiniciar APK nas TVs.'
            });
        }

        if (!playlist.length && tvs.length > 0) {
            alerts.push({
                level: 'warning',
                title: 'Playlist de TV vazia',
                detail: 'Nenhuma mídia na playlist — TVs mostram tela em branco.',
                suggestedAction: 'Gerar slides (Gerador de Slides) ou subir vídeo (TV Indoor → adicionar mídia).'
            });
        }

        if (sabPendentes.length) {
            alerts.push({
                level: 'info',
                title: `${sabPendentes.length} sabor(es) sem receita`,
                detail: sabPendentes.map(s => s.name).slice(0,5).join(', '),
                suggestedAction: 'Cadastrar receita em Catálogo → Editar. Sem receita, não há cálculo automático de custo nem baixa de estoque.'
            });
        }

        if (minutesSinceLast !== null && minutesSinceLast > 120) {
            const hour = now.getHours();
            if (hour >= 11 && hour < 22) { // horário comercial
                alerts.push({
                    level: 'warning',
                    title: 'Nenhuma venda nas últimas 2h (horário comercial)',
                    detail: `Última venda: ${Math.round(minutesSinceLast/60)}h atrás.`,
                    suggestedAction: 'Verificar: PDV está online? Há movimento na loja? Promoção flash pode ativar.'
                });
            }
        }

        if (igDaysSince !== null && igDaysSince > 3) {
            alerts.push({
                level: 'info',
                title: `Último post IG há ${igDaysSince} dias`,
                detail: 'Algoritmo do Instagram penaliza inatividade.',
                suggestedAction: igCfg.autoEnabled ? 'Auto-post tá ON, deve postar hoje. Ou publica manual pelo painel.' : 'Ativar auto-post diário em Auto Stories IG.'
            });
        } else if (igDaysSince === null && !igCfg.apiKey) {
            alerts.push({
                level: 'info',
                title: 'Auto-post IG nunca configurado',
                detail: 'Seu Instagram não está conectado ainda.',
                suggestedAction: '20min de setup, zero custo, 3 stories/dia automáticos. Ver docs/IG_AUTOPOST_SETUP.md'
            });
        }

        // ========== Oportunidades ==========
        const opportunities = [];

        // Desafios sub-aproveitados
        if (winners10s.length === 0 && winners300g.length === 0) {
            opportunities.push({
                title: 'Nenhum ganhador registrado ainda',
                detail: 'Desafios 10s/300g não estão sendo jogados — são ouro viral desperdiçado.',
                effort: 'baixo',
                impact: 'alto',
                howto: 'Operador usa Studio dos Desafios no balcão. Basta chamar cliente com "quer tentar ganhar um potinho grátis?"'
            });
        }

        // Ticket médio vs meta
        if (ticketMedio > 0 && ticketMedio < 20) {
            opportunities.push({
                title: 'Ticket médio baixo (R$ ' + ticketMedio.toFixed(2) + ')',
                detail: 'Ancoragem de preço pode empurrar o tamanho G sem esforço.',
                effort: 'baixo',
                impact: 'médio',
                howto: 'Publicar Slide A5 (Ancoragem de Preço) com destaque no G. Projeção +R$2-4/ticket.'
            });
        }

        // Dayparting
        const tvCfg = DataStore.get('tv_config_' + fid) || {};
        if (!tvCfg.schedules || !tvCfg.schedules.length) {
            opportunities.push({
                title: 'Dayparting desligado',
                detail: 'Mesma playlist de manhã e noite = conteúdo não adapta ao cliente.',
                effort: 'médio',
                impact: 'médio',
                howto: 'Configurar schedules no tv_config: manhã/almoço/tarde/noite com playlists diferentes.'
            });
        }

        if (!tvCfg.qrUrl) {
            opportunities.push({
                title: 'QR code nas TVs desligado',
                detail: 'Cliente olha a TV mas não tem ponto de conversão pro Instagram/cardápio.',
                effort: 'baixo',
                impact: 'médio',
                howto: 'TV Indoor → QR code no canto → cola URL do Instagram ou cardápio com UTM.'
            });
        }

        if (!tvCfg.ticker && !tvCfg.newsTicker) {
            opportunities.push({
                title: 'Barra de avisos vazia',
                detail: 'Espaço premium da TV sendo subutilizado.',
                effort: 'baixo',
                impact: 'baixo',
                howto: 'Escrever 1 frase chamativa: "DESAFIO 300G — ACERTOU, LEVOU" ou "Siga @milkypot e ganhe topping".'
            });
        }

        return {
            scope: 'franchise',
            franchiseId: fid,
            franchiseName: f.name || '—',
            city: (f.territorio || {}).cidade || '',
            timestamp: now.toISOString(),
            metrics: {
                vendasHoje: todayOrders.length,
                receitaHoje: Math.round(revHoje*100)/100,
                vendasSemana: weekOrders.length,
                receitaSemana: Math.round(revSem*100)/100,
                ticketMedio: Math.round(ticketMedio*100)/100,
                minutosUltimaVenda: minutesSinceLast
            },
            alerts: alerts,
            opportunities: opportunities,
            winners: {
                '10s_ultimo': winners10s.slice(-1)[0] || null,
                '300g_ultimo': winners300g.slice(-1)[0] || null,
                '10s_total_semana': winners10s.filter(w => new Date(w.at) >= weekAgo).length,
                '300g_total_semana': winners300g.filter(w => new Date(w.at) >= weekAgo).length
            },
            tvsSummary: {
                total: tvs.length,
                offline: tvsOffline.length,
                playlistSize: playlist.length
            },
            igSummary: {
                configured: !!igCfg.apiKey,
                autoEnabled: !!igCfg.autoEnabled,
                lastPostDays: igDaysSince
            }
        };
    }

    function scanSuperAdmin() {
        const franchises = DataStore.get('franchises') || [];
        const reports = franchises.map(f => scanFranchise(f.id));
        const totalRevHoje = reports.reduce((s,r) => s + r.metrics.receitaHoje, 0);
        const totalVendasHoje = reports.reduce((s,r) => s + r.metrics.vendasHoje, 0);
        const franquiasComAlerta = reports.filter(r => r.alerts.length > 0);
        const criticas = reports.filter(r => r.alerts.some(a => a.level === 'critical'));

        return {
            scope: 'super_admin',
            timestamp: new Date().toISOString(),
            totals: {
                franquias: franchises.length,
                vendasHoje: totalVendasHoje,
                receitaHoje: Math.round(totalRevHoje*100)/100,
                franquiasCriticas: criticas.length,
                franquiasComAlerta: franquiasComAlerta.length
            },
            rankingReceita: reports
                .map(r => ({ name: r.franchiseName, vendas: r.metrics.vendasHoje, receita: r.metrics.receitaHoje }))
                .sort((a,b) => b.receita - a.receita)
                .slice(0, 10),
            franquiasCriticas: criticas.map(r => ({
                name: r.franchiseName,
                alerts: r.alerts.filter(a => a.level === 'critical').map(a => a.title)
            }))
        };
    }

    global.LiloScanner = {
        scanFranchise: scanFranchise,
        scanSuperAdmin: scanSuperAdmin,
        scan: function(session) {
            if (!session) return null;
            if (session.role === 'super_admin') return scanSuperAdmin();
            return scanFranchise(session.franchiseId);
        }
    };
})(typeof window !== 'undefined' ? window : this);
