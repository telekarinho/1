/* ============================================================
   MilkyPot — Setup Checklist Mestre
   ============================================================
   Catálogo central de TUDO que precisa estar configurado pra loja
   rodar 100%. Cada item tem auto-check (quando possível) + override
   manual. Usado pela Lilo AI, pela página de checklist e pelo
   dashboard (progress bar global).

   Categorias:
     operacao    — abertura, caixa, staff, fluxo
     online      — site, cardápio, WhatsApp, domínio
     fisica      — TVs, áudio, placas, balança
     marketing   — IG, TikTok, UGC, stories
     delivery    — iFood, Rappi, próprio
     fiscal      — NFC-e, SAT, MEI, notas
     desafios    — 10s, 300g, voucher, fidelidade
     automacao   — auto-post, recorrências, cron

   Status possíveis:
     done     — feito (verificado automaticamente ou override)
     pending  — falta fazer
     partial  — começou mas tem mais a fazer
     na       — não aplicável nessa franquia
   ============================================================ */
(function(global){
    'use strict';

    const ITEMS = [
        // ===================== OPERAÇÃO =====================
        {
            id: 'op_horario_funcionamento', cat: 'operacao', importance: 'critical',
            title: 'Horário de funcionamento configurado',
            detail: 'Sem isso, as TVs ficam sempre ligadas e não sabem quando fechar.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = (DataStore.get('tv_config_' + fid) || {});
                return cfg.openHour != null && cfg.closeHour != null ? 'done' : 'pending';
            }
        },
        {
            id: 'op_equipe_cadastrada', cat: 'operacao', importance: 'high',
            title: 'Equipe cadastrada (pelo menos 1 operador)',
            detail: 'Operadores precisam ter login pra acessar PDV e bater ponto.',
            help: '/painel/equipe.html',
            check: fid => {
                const staff = DataStore.get('staff_' + fid) || [];
                return staff.length > 0 ? 'done' : 'pending';
            }
        },
        {
            id: 'op_caixa_abertura', cat: 'operacao', importance: 'critical',
            title: 'Caixa aberto hoje',
            detail: 'Vendas sem caixa aberto geram alerta em auditoria.',
            help: '/painel/pdv.html',
            check: fid => {
                // Coleção real é 'caixa' com movimentos. Verifica se há abertura HOJE
                // usando todayKey local (Brasília) — toISOString puro quebra após 21h.
                try {
                    const all = DataStore.getCollection('caixa', fid) || [];
                    const now = new Date();
                    const offsetMs = now.getTimezoneOffset() * 60000;
                    const localKey = new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
                    const hoje = all.find(m => m && m.type === 'abertura' && m.dateKey === localKey);
                    return hoje ? 'done' : 'pending';
                } catch (e) { return 'pending'; }
            }
        },

        // ===================== ONLINE =====================
        {
            id: 'on_catalog_preenchido', cat: 'online', importance: 'critical',
            title: 'Catálogo com sabores ativos',
            detail: 'Sem sabor ativo, cardápio público fica vazio.',
            help: '/painel/catalogo.html',
            check: fid => {
                const cat = DataStore.get('catalog_config') || {};
                const ativos = Object.values(cat.sabores || {})
                    .flatMap(g => g.items || [])
                    .filter(i => i.available);
                return ativos.length >= 4 ? 'done' : (ativos.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'on_receita_por_sabor', cat: 'online', importance: 'high',
            title: 'Receitas cadastradas nos sabores',
            detail: 'Sem receita, não há dedução automática de estoque nem cálculo de custo real.',
            help: '/painel/catalogo.html',
            check: fid => {
                const cat = DataStore.get('catalog_config') || {};
                const all = Object.values(cat.sabores || {}).flatMap(g => g.items || []);
                const comReceita = all.filter(i => i.receita && i.receita.length);
                if (!all.length) return 'pending';
                const pct = comReceita.length / all.length;
                return pct >= 0.8 ? 'done' : (pct > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'on_inventario_seed', cat: 'online', importance: 'high',
            title: 'Inventário de insumos cadastrado',
            detail: 'Sem inventário, receitas não calculam estoque.',
            help: '/painel/produtos.html',
            check: fid => {
                const inv = DataStore.getCollection('inventory', fid) || [];
                return inv.length >= 10 ? 'done' : (inv.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'on_custos_fixos_cadastrados', cat: 'online', importance: 'high',
            title: 'Custos fixos do mês lançados',
            detail: 'Aluguel, luz, internet, folha. Sem isso, DRE distorce.',
            help: '/painel/financeiro.html',
            check: fid => {
                if (typeof Financas === 'undefined') return 'pending';
                try {
                    const pk = Financas.currentPeriodKey();
                    const dre = Financas.computeDRE(fid, pk);
                    const obrigatorios = Financas.allCategories('fixed').filter(c => c.mandatory);
                    const lancados = Financas.allCategories('fixed').filter(c => dre.fixos[c.key]);
                    if (!obrigatorios.length) return 'done';
                    const pct = lancados.length / obrigatorios.length;
                    return pct >= 0.8 ? 'done' : (pct > 0 ? 'partial' : 'pending');
                } catch(e) { return 'pending'; }
            }
        },
        {
            id: 'on_meta_mes_definida', cat: 'online', importance: 'medium',
            title: 'Meta de receita do mês definida',
            detail: 'Sem meta, Financeiro não mostra % de atingimento.',
            help: '/painel/operacional.html',
            check: fid => {
                if (typeof AdminConfig === 'undefined') return 'pending';
                try {
                    const meta = AdminConfig.getMetaProgress(fid, (typeof Financas !== 'undefined' ? Financas.currentPeriodKey() : '0'));
                    return meta && meta.valor > 0 ? 'done' : 'pending';
                } catch(e) { return 'pending'; }
            }
        },

        // ===================== FÍSICA =====================
        {
            id: 'fi_tvs_cadastradas', cat: 'fisica', importance: 'critical',
            title: 'Pelo menos 1 TV cadastrada',
            detail: 'Sem TV, não há playlist nem heartbeat.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const tvs = DataStore.get('tv_devices_' + fid) || [];
                return tvs.length >= 1 ? 'done' : 'pending';
            }
        },
        {
            id: 'fi_playlist_nao_vazia', cat: 'fisica', importance: 'critical',
            title: 'Playlist de TV com mídias',
            detail: 'TV vazia = tela preta na loja. Pior experiência possível.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const pl = DataStore.get('tv_playlist_' + fid) || [];
                return pl.length >= 3 ? 'done' : (pl.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'fi_heartbeat_ativo', cat: 'fisica', importance: 'high',
            title: 'TVs reportando status (heartbeat) há <10min',
            detail: 'TV offline = cliente não vê seu conteúdo.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const tvs = DataStore.get('tv_devices_' + fid) || [];
                if (!tvs.length) return 'na';
                const online = tvs.filter(t => {
                    const hb = DataStore.get('tv_heartbeat_' + fid + '_' + t.id);
                    if (!hb || !hb.lastSeen) return false;
                    return (Date.now() - new Date(hb.lastSeen).getTime()) < 10*60*1000;
                });
                return online.length === tvs.length ? 'done' : (online.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'fi_tv_desafio_dedicada', cat: 'fisica', importance: 'medium',
            title: 'TV dedicada ao Desafio (ao lado do caixa)',
            detail: 'APK instalado em "TV do Desafio" vira kiosk do desafio.html.',
            help: '/tv.apk',
            check: fid => {
                // heurística: se tem uma tv com nome contendo "desafio"
                const tvs = DataStore.get('tv_devices_' + fid) || [];
                const hasDesafio = tvs.some(t => /desafio|challenge/i.test(t.name || ''));
                return hasDesafio ? 'done' : 'pending';
            }
        },
        {
            id: 'fi_logo_customizada', cat: 'fisica', importance: 'low',
            title: 'Logo customizada nas TVs',
            detail: 'Logo padrão MilkyPot ou personalizada da franquia.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = DataStore.get('tv_config_' + fid) || {};
                return cfg.showLogo !== false ? 'done' : 'pending';
            }
        },

        // ===================== MARKETING =====================
        {
            id: 'mk_ig_autopost_configurado', cat: 'marketing', importance: 'high',
            title: 'Instagram conectado (auto-post stories)',
            detail: '3 stories/dia automáticos com dados reais da loja.',
            help: '/painel/tv-auto-stories.html',
            check: fid => {
                const ig = DataStore.get('ig_autopost_' + fid) || {};
                if (ig.autoEnabled && ig.apiKey && ig.igAccountId) return 'done';
                if (ig.apiKey || ig.igAccountId) return 'partial';
                return 'pending';
            }
        },
        {
            id: 'mk_ugc_pipeline', cat: 'marketing', importance: 'medium',
            title: 'UGC Live Wall ativado',
            detail: 'Fotos de clientes que marcaram @milkypot rodam na TV 3.',
            help: '/painel/tv-ugc-curadoria.html',
            check: fid => {
                const prefs = DataStore.get('ugc_prefs_' + fid) || {};
                const feed = DataStore.get('ugc_feed_' + fid) || [];
                const aprovados = feed.filter(i => i.approved);
                if (prefs.live && aprovados.length > 0) return 'done';
                if (aprovados.length > 0) return 'partial';
                return 'pending';
            }
        },
        {
            id: 'mk_qr_overlay', cat: 'marketing', importance: 'medium',
            title: 'QR code configurado nas TVs',
            detail: 'Cliente olha TV → escaneia → vai pro cardápio/Instagram.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = DataStore.get('tv_config_' + fid) || {};
                return cfg.qrUrl ? 'done' : 'pending';
            }
        },
        {
            id: 'mk_ticker_msg', cat: 'marketing', importance: 'low',
            title: 'Barra de avisos (ticker) com mensagem',
            detail: 'Texto rolante na parte inferior das TVs.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = DataStore.get('tv_config_' + fid) || {};
                return (cfg.ticker || cfg.newsTicker) ? 'done' : 'pending';
            }
        },
        {
            id: 'mk_slide_campanhas', cat: 'marketing', importance: 'high',
            title: 'Pelo menos 3 slides psicológicos na playlist',
            detail: 'Slides A1-A8 do gerador (escassez, ranking, hall, etc.)',
            help: '/painel/tv-slides-generator.html',
            check: fid => {
                const media = DataStore.get('tv_media_' + fid) || [];
                const slides = media.filter(m => String(m.id || '').startsWith('slide_') || String(m.slug || '').startsWith('mp_slide'));
                return slides.length >= 3 ? 'done' : (slides.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'mk_copilot_lilo', cat: 'marketing', importance: 'high',
            title: 'Lilo AI configurada (copiloto)',
            detail: 'IA exclusiva MilkyPot que analisa dados e sugere ações.',
            help: '/painel/copilot-lilo.html',
            check: fid => {
                const s = DataStore.get('lilo_settings') || {};
                return s.apiKey ? 'done' : 'pending';
            }
        },

        // ===================== DELIVERY =====================
        {
            id: 'dl_ifood_conectado', cat: 'delivery', importance: 'high',
            title: 'iFood conectado',
            detail: 'Pedidos do iFood entram automaticamente no PDV.',
            help: '/painel/ifood.html',
            check: fid => {
                const cfg = DataStore.get('ifood_config_' + fid) || {};
                return cfg.merchantId && cfg.accessToken ? 'done' : 'pending';
            }
        },
        {
            id: 'dl_raio_entrega', cat: 'delivery', importance: 'high',
            title: 'Raio de entrega configurado',
            detail: 'Define até onde você entrega em km.',
            help: '/painel/configuracoes.html',
            check: fid => {
                const franchises = DataStore.get('franchises') || [];
                const f = franchises.find(x => x.id === fid);
                return (f && f.territorio && f.territorio.raioEntrega) ? 'done' : 'pending';
            }
        },
        {
            id: 'dl_tempo_preparo', cat: 'delivery', importance: 'medium',
            title: 'Tempo médio de preparo informado',
            detail: 'Cliente precisa saber quantos min até o pedido ficar pronto.',
            help: '/painel/configuracoes.html',
            check: fid => {
                const cfg = DataStore.get('store_config_' + fid) || {};
                return cfg.prepTimeMinutes > 0 ? 'done' : 'pending';
            }
        },

        // ===================== FISCAL =====================
        {
            id: 'fs_cnpj_cadastrado', cat: 'fiscal', importance: 'critical',
            title: 'CNPJ da franquia cadastrado',
            detail: 'Necessário pra emissão de NFC-e.',
            help: '/painel/fiscal.html',
            check: fid => {
                const franchises = DataStore.get('franchises') || [];
                const f = franchises.find(x => x.id === fid);
                return (f && f.cnpj) ? 'done' : 'pending';
            }
        },
        {
            id: 'fs_nfce_ativo', cat: 'fiscal', importance: 'medium',
            title: 'NFC-e configurada',
            detail: 'Emissão automática de nota fiscal ao fechar venda.',
            help: '/painel/fiscal.html',
            check: fid => {
                const cfg = DataStore.get('fiscal_config_' + fid) || {};
                return (cfg.certificado && cfg.serie && cfg.ambiente) ? 'done' : 'pending';
            }
        },

        // ===================== DESAFIOS =====================
        {
            id: 'ds_desafio_ativo', cat: 'desafios', importance: 'medium',
            title: 'Desafio 10s disponível online',
            detail: 'milkypot.com/desafio.html deve estar acessível.',
            help: '/desafio.html',
            check: () => 'done' // sempre true, é público
        },
        {
            id: 'ds_voucher_config', cat: 'desafios', importance: 'medium',
            title: 'Voucher/recompensa do desafio definido',
            detail: 'O que o ganhador ganha? Desconto, potinho grátis, topping extra?',
            help: '/painel/configuracoes.html',
            check: fid => {
                const cfg = DataStore.get('desafio_config_' + fid) || DataStore.get('desafio_config') || {};
                return cfg.rewardName ? 'done' : 'pending';
            }
        },
        {
            id: 'ds_fidelidade_ativa', cat: 'desafios', importance: 'medium',
            title: 'Cartão fidelidade ativo',
            detail: 'Programa "a cada N potinhos, 1 de graça".',
            help: '/painel/fidelidade.html',
            check: fid => {
                const cfg = DataStore.get('loyalty_config_' + fid) || DataStore.get('loyalty_config') || {};
                return cfg.enabled ? 'done' : 'pending';
            }
        },

        // ===================== AUTOMAÇÃO =====================
        {
            id: 'au_recurring_costs', cat: 'automacao', importance: 'medium',
            title: 'Custos recorrentes cadastrados',
            detail: 'Aluguel/luz/internet geram automaticamente todo mês.',
            help: '/painel/financeiro.html',
            check: fid => {
                const recs = DataStore.getCollection('recurring_costs', fid) || [];
                return recs.filter(r => r.active !== false).length >= 3 ? 'done' :
                    (recs.length > 0 ? 'partial' : 'pending');
            }
        },
        {
            id: 'au_dayparting', cat: 'automacao', importance: 'low',
            title: 'Dayparting nas TVs (playlist por horário)',
            detail: 'Conteúdo manhã ≠ conteúdo noite = +5-7% off-peak.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = DataStore.get('tv_config_' + fid) || {};
                return (cfg.schedules && cfg.schedules.length > 0) ? 'done' : 'pending';
            }
        },
        {
            id: 'au_wall_mode', cat: 'automacao', importance: 'low',
            title: 'Wall Mode configurado (3 TVs sincronizadas)',
            detail: 'Ovelhinha atravessa as 3 TVs como 1 cena só.',
            help: '/painel/tv-indoor.html',
            check: fid => {
                const cfg = DataStore.get('tv_config_' + fid) || {};
                const roles = cfg.wallRoles || {};
                return Object.keys(roles).length >= 2 ? 'done' : 'pending';
            }
        }
    ];

    // ========================================================
    // API pública
    // ========================================================

    /**
     * Roda todos os checks pra uma franquia.
     * @param {string} fid
     * @returns {object} { total, done, partial, pending, na, items: [...] }
     */
    function evaluate(fid) {
        const overrides = DataStore.get('setup_overrides_' + fid) || {};
        const items = ITEMS.map(item => {
            let status;
            if (overrides[item.id]) {
                status = overrides[item.id];
            } else {
                try { status = item.check(fid); }
                catch(e) { status = 'pending'; console.warn('[Checklist]', item.id, e); }
            }
            return {
                id: item.id,
                cat: item.cat,
                importance: item.importance,
                title: item.title,
                detail: item.detail,
                help: item.help,
                status: status,
                overridden: !!overrides[item.id]
            };
        });

        const applicable = items.filter(i => i.status !== 'na');
        const done = applicable.filter(i => i.status === 'done').length;
        const partial = applicable.filter(i => i.status === 'partial').length;
        const pending = applicable.filter(i => i.status === 'pending').length;

        const byCategory = {};
        items.forEach(i => {
            if (!byCategory[i.cat]) byCategory[i.cat] = { total: 0, done: 0, partial: 0, pending: 0, items: [] };
            byCategory[i.cat].items.push(i);
            byCategory[i.cat].total++;
            if (i.status === 'done') byCategory[i.cat].done++;
            else if (i.status === 'partial') byCategory[i.cat].partial++;
            else if (i.status === 'pending') byCategory[i.cat].pending++;
        });

        return {
            total: applicable.length,
            done, partial, pending,
            pctComplete: applicable.length ? Math.round((done + partial * 0.5) / applicable.length * 100) : 0,
            items: items,
            byCategory: byCategory,
            criticalPending: items.filter(i => i.importance === 'critical' && (i.status === 'pending' || i.status === 'partial')).length
        };
    }

    /** Permite override manual. status ∈ done | pending | na */
    function setOverride(fid, itemId, status) {
        const key = 'setup_overrides_' + fid;
        const o = DataStore.get(key) || {};
        if (status) o[itemId] = status;
        else delete o[itemId];
        DataStore.set(key, o);
    }

    // Metadados pra UI
    const CATEGORIES = {
        operacao:  { label: 'Operação',    emoji: '🏪', color: '#FF4F8A' },
        online:    { label: 'Loja Online', emoji: '💻', color: '#42A5F5' },
        fisica:    { label: 'Loja Física', emoji: '📺', color: '#7E57C2' },
        marketing: { label: 'Marketing',   emoji: '📢', color: '#F59E0B' },
        delivery:  { label: 'Delivery',    emoji: '🛵', color: '#DC2626' },
        fiscal:    { label: 'Fiscal',      emoji: '🧾', color: '#6B7280' },
        desafios:  { label: 'Desafios',    emoji: '🎯', color: '#10B981' },
        automacao: { label: 'Automação',   emoji: '🤖', color: '#5856D6' }
    };

    global.SetupChecklist = {
        evaluate, setOverride, CATEGORIES, ITEMS
    };
})(typeof window !== 'undefined' ? window : this);
