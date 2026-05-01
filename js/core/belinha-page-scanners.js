/* ============================================================
   MilkyPot — Belinha Page Scanners
   ============================================================
   Cada tela do sistema tem um scanner que roda quando o usuário entra
   na página. Detecta o que está faltando, o que precisa de ação, e
   gera 1 "pulse" proativo da Belinha — sem esperar o usuário perguntar.

   Uso:
     BelinhaScanners.scanCurrent(session) → {
       alerts: [{level, title, detail, action}],
       priority: 'critical' | 'high' | 'medium' | 'low' | 'none',
       insight: "texto pra Belinha dizer proativamente",
       kpis: [{label, value, target, color}]
     }
   ============================================================ */
(function(global){
    'use strict';

    // ===== Helpers =====
    function DS() { return global.DataStore; }
    function today0() { const d = new Date(); d.setHours(0,0,0,0); return d; }
    function isToday(iso) {
        try { return new Date(iso) >= today0(); } catch(e) { return false; }
    }
    function brl(v) { return 'R$ ' + Number(v||0).toFixed(2).replace('.',','); }

    // ================================================================
    // Scanners por tela
    // ================================================================
    const SCANNERS = {};

    // ---------- FINANCEIRO ----------
    SCANNERS['financeiro'] = function(fid) {
        const alerts = []; const kpis = [];
        try {
            const pk = (typeof Financas !== 'undefined') ? Financas.currentPeriodKey() : (new Date()).toISOString().slice(0,7);
            let dre = null;
            if (typeof Financas !== 'undefined') { try { dre = Financas.computeDRE(fid, pk); } catch(e){} }
            if (dre) {
                // Custos obrigatórios faltando
                const obrig = Financas.allCategories('fixed').filter(c => c.mandatory);
                const faltando = obrig.filter(c => !(dre.fixos && dre.fixos[c.key]));
                if (faltando.length) {
                    alerts.push({
                        level: 'critical',
                        title: faltando.length + ' custos fixos obrigatórios sem lançamento',
                        detail: faltando.map(f => f.label).join(', '),
                        action: 'Clica em "+ Adicionar" no card de custos fixos. Sem esses dados, a saúde da franquia mente.'
                    });
                }
                // Meta — comparação PROPORCIONAL ao dia do mês (realizado vs esperado até hoje)
                if (dre.meta && dre.meta.valor > 0) {
                    const pct = Math.round((dre.meta.realizado / dre.meta.valor) * 100);
                    const now = new Date();
                    const diaAtual = now.getDate();
                    const diasMes = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
                    const pctEsperado = Math.round((diaAtual / diasMes) * 100);
                    const gap = pctEsperado - pct;           // atraso em pontos percentuais
                    const diasRestantes = diasMes - diaAtual;
                    const faltaReais = dre.meta.valor - dre.meta.realizado;

                    kpis.push({
                        label: 'Meta do mês',
                        value: pct + '% / ' + pctEsperado + '% esperado',
                        target: '100% dia ' + diasMes,
                        color: gap <= 5 ? 'green' : gap <= 15 ? 'amber' : 'red'
                    });

                    if (gap >= 15) {
                        alerts.push({
                            level: diasRestantes <= 10 ? 'critical' : 'high',
                            title: 'Meta ATRASADA: ' + pct + '% realizado vs ' + pctEsperado + '% esperado',
                            detail: 'Gap de ' + gap + ' pts. Faltam ' + diasRestantes + ' dias e R$ ' + faltaReais.toFixed(0) + ' em receita.',
                            action: diasRestantes <= 10
                                ? 'Ativa slides A1 (Escassez) e A5 (Ancoragem) nas TVs + combo relâmpago 48h + boost iFood.'
                                : 'Intensifica conteúdo Instagram, promo da semana, push fidelidade. Meta diária: R$ ' + Math.ceil(faltaReais / Math.max(diasRestantes,1))
                        });
                    } else if (gap >= 8) {
                        alerts.push({
                            level: 'medium',
                            title: 'Meta levemente atrasada (' + gap + ' pts)',
                            detail: pct + '% realizado vs ' + pctEsperado + '% esperado. Faltam ' + diasRestantes + ' dia(s).',
                            action: 'Fecha R$ ' + Math.ceil(faltaReais / Math.max(diasRestantes,1)) + '/dia pra bater. Reforça combos + upsell.'
                        });
                    }
                } else {
                    alerts.push({
                        level: 'medium',
                        title: 'Meta do mês não definida',
                        detail: 'Sem meta, não dá pra medir se você tá bem ou mal.',
                        action: 'Define em Operacional → Meta do mês. Sugestão: R$ 35-45k pra loja nova em Londrina.'
                    });
                }
                if (dre.receitaLiquida > 0 && dre.totalFixed > 0) {
                    const cmvPct = Math.round((dre.totalVariable || 0) / dre.receitaLiquida * 100);
                    kpis.push({ label: 'CMV', value: cmvPct + '%', target: '28-32%', color: cmvPct <= 32 ? 'green' : cmvPct <= 38 ? 'amber' : 'red' });
                    if (cmvPct > 38) {
                        alerts.push({
                            level: 'high',
                            title: 'CMV em ' + cmvPct + '% (benchmark MilkyPot: 28-32%)',
                            detail: 'Cada 1% de CMV a mais come lucro. Em R$45k, 5% extra = R$2.250/mês.',
                            action: 'Auditar: quebra/derretimento (3-6%), porção de scoop, embalagens caras, açaí premium sobrando.'
                        });
                    }
                }
            }
        } catch(e) { console.warn('scanner financeiro', e); }
        return { alerts, kpis };
    };

    // ---------- CATÁLOGO ----------
    SCANNERS['catalogo'] = function(fid) {
        const alerts = []; const kpis = [];
        const cat = DS().get('catalog_config') || {};
        const all = Object.values(cat.sabores || {}).flatMap(g => g.items || []);
        const ativos = all.filter(i => i.available !== false);
        const semReceita = all.filter(i => !i.receita || !i.receita.length);
        const semDesc = all.filter(i => !i.desc || i.desc.length < 10);
        const semFoto = all.filter(i => !i.emoji && !i.image);

        kpis.push({ label: 'Sabores ativos', value: ativos.length, target: '6+', color: ativos.length >= 6 ? 'green' : 'amber' });

        if (ativos.length < 4) {
            alerts.push({
                level: 'critical',
                title: 'Só ' + ativos.length + ' sabor(es) ativo(s)',
                detail: 'Cardápio raso — cliente escolhe menos, ticket cai.',
                action: 'Ativa ao menos 6-8 sabores. Benchmark Milky Moo: 30+ sabores com nomes temáticos.'
            });
        }
        if (semReceita.length) {
            alerts.push({
                level: 'high',
                title: semReceita.length + ' sabor(es) sem receita cadastrada',
                detail: semReceita.slice(0,5).map(s => s.name).join(', '),
                action: 'Sem receita não há dedução de estoque nem cálculo de custo automático. Abre "Editar" no card e preenche.'
            });
        }
        if (semDesc.length >= 3) {
            alerts.push({
                level: 'medium',
                title: semDesc.length + ' sabor(es) sem descrição curta',
                detail: 'Descrição vende o sabor. Um "cremoso com raspas de Oreo" converte mais que só "Oreo".',
                action: 'Gera texto descrevendo cada sabor — posso escrever pra você se pedir.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- PDV ----------
    SCANNERS['pdv'] = function(fid) {
        const alerts = []; const kpis = [];
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const todayOrders = orders.filter(o => o.createdAt && isToday(o.createdAt) && ['confirmado','entregue','pago'].includes(o.status));
        const receitaHoje = todayOrders.reduce((s,o) => s + (+o.total||0), 0);

        kpis.push({ label: 'Pedidos hoje', value: todayOrders.length, target: '60+ (lucro a partir 90)', color: todayOrders.length >= 60 ? 'green' : 'amber' });
        kpis.push({ label: 'Receita hoje', value: brl(receitaHoje), target: brl(1500), color: receitaHoje >= 1500 ? 'green' : 'amber' });

        // Meta do dia = meta_mes / 30
        try {
            if (typeof Financas !== 'undefined' && typeof AdminConfig !== 'undefined') {
                const progress = AdminConfig.getMetaProgress(fid, Financas.currentPeriodKey());
                if (progress && progress.valor > 0) {
                    const metaDia = progress.valor / 30;
                    const falta = Math.max(0, metaDia - receitaHoje);
                    const pct = Math.round((receitaHoje / metaDia) * 100);
                    kpis.push({ label: 'Meta dia', value: pct + '%', target: '100%', color: pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red' });
                    const hora = new Date().getHours();
                    if (hora >= 15 && pct < 50) {
                        alerts.push({
                            level: 'high',
                            title: 'Faltando ' + brl(falta) + ' pra bater meta do dia',
                            detail: 'Só ' + pct + '% da meta às ' + hora + 'h. Ação agressiva nas próximas 3h.',
                            action: 'Ativa Desafio 300g no balcão, ancoragem de preço na TV 2, ofereça combo aos clientes de fila.'
                        });
                    }
                }
            }
        } catch(e){}

        // Última venda
        if (todayOrders.length) {
            const lastTs = new Date(todayOrders[todayOrders.length-1].createdAt).getTime();
            const min = Math.floor((Date.now() - lastTs) / 60000);
            const hour = new Date().getHours();
            if (min > 45 && hour >= 14 && hour < 22) {
                alerts.push({
                    level: 'medium',
                    title: 'Sem venda há ' + min + ' minutos (horário comercial)',
                    detail: 'Loja em movimento baixo. Checa se PDV tá online e cliente tá chegando.',
                    action: 'Posta um reels do balcão pra puxar cliente ou avisa staff pra ativar WhatsApp de fidelidade.'
                });
            }
        }
        return { alerts, kpis };
    };

    // ---------- TV INDOOR ----------
    SCANNERS['tv-indoor'] = function(fid) {
        const alerts = []; const kpis = [];
        const cfg = DS().get('tv_config_' + fid) || {};
        const playlist = DS().get('tv_playlist_' + fid) || [];
        const tvs = DS().get('tv_devices_' + fid) || [];

        kpis.push({ label: 'TVs cadastradas', value: tvs.length, target: '3', color: tvs.length >= 3 ? 'green' : 'amber' });
        kpis.push({ label: 'Itens na playlist', value: playlist.length, target: '6+', color: playlist.length >= 6 ? 'green' : 'amber' });

        if (!playlist.length) {
            alerts.push({
                level: 'critical',
                title: 'Playlist vazia — TVs ficam em tela preta',
                detail: 'Pior experiência possível na loja.',
                action: 'Vai no Gerador de Slides, cria 3-5 templates (A1 Escassez + A2 Hall + A6 Contador) e publica.'
            });
        } else if (playlist.length < 4) {
            alerts.push({
                level: 'medium',
                title: 'Playlist com só ' + playlist.length + ' item(ns)',
                detail: 'Cliente vê o mesmo conteúdo repetir em 30s — satura rápido.',
                action: 'Adiciona 3-5 slides da biblioteca + 1 vídeo ASMR slow-mo pra ter variação.'
            });
        }
        if (!cfg.qrUrl) {
            alerts.push({
                level: 'medium',
                title: 'QR code nas TVs desligado',
                detail: 'Cliente vê a TV mas não tem ponto de conversão pro Instagram/cardápio.',
                action: 'Em Configuração da Tela → QR code → cola https://milkypot.com/cardapio.html?utm_source=tv'
            });
        }
        if (!cfg.ticker && !cfg.newsTicker) {
            alerts.push({
                level: 'low',
                title: 'Barra de avisos vazia',
                detail: 'Espaço premium subutilizado.',
                action: 'Sugestão: "ACERTOU 300g NA BALANÇA? POTINHO É POR NOSSA CONTA 🎯"'
            });
        }
        // Schedule
        if (!cfg.schedules || !cfg.schedules.length) {
            alerts.push({
                level: 'low',
                title: 'Dayparting desligado',
                detail: 'Mesma playlist manhã e noite = conteúdo não adapta.',
                action: 'Liga dayparting: manhã (café), tarde (família), noite (casais, açaí).'
            });
        }
        return { alerts, kpis };
    };

    // ---------- GERADOR DE SLIDES ----------
    SCANNERS['tv-slides-generator'] = function(fid) {
        const alerts = []; const kpis = [];
        const media = DS().get('tv_media_' + fid) || [];
        const slidesBelinha = media.filter(m => String(m.id||'').startsWith('slide_') || String(m.slug||'').startsWith('mp_slide'));
        kpis.push({ label: 'Slides A1-A8 publicados', value: slidesBelinha.length, target: '5+', color: slidesBelinha.length >= 5 ? 'green' : 'amber' });
        if (slidesBelinha.length < 3) {
            alerts.push({
                level: 'high',
                title: 'Só ' + slidesBelinha.length + ' slide(s) psicológico(s) na playlist',
                detail: 'Cada template ativa um gatilho diferente (escassez, ancoragem, prova social).',
                action: 'Clica A1 Escassez → "Usar dados reais" → "Publicar na TV". Repete pra A2, A3, A6. Leva 5 min.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- UGC ----------
    SCANNERS['tv-ugc-curadoria'] = function(fid) {
        const alerts = []; const kpis = [];
        const feed = DS().get('ugc_feed_' + fid) || [];
        const aprovados = feed.filter(i => i.approved);
        const pending = feed.filter(i => !i.approved);
        const prefs = DS().get('ugc_prefs_' + fid) || {};
        kpis.push({ label: 'UGC aprovado no ar', value: aprovados.length, target: '5+', color: aprovados.length >= 5 ? 'green' : 'amber' });
        if (pending.length) {
            alerts.push({
                level: 'medium',
                title: pending.length + ' foto(s) pendente(s) de aprovação',
                detail: 'Fotos de clientes que você ainda não revisou.',
                action: 'Aprova as boas em 20 min — elas entram automáticas na TV 3.'
            });
        }
        if (aprovados.length > 0 && !prefs.live) {
            alerts.push({
                level: 'low',
                title: 'Fotos aprovadas mas toggle UGC desligado',
                detail: 'As fotos não estão rodando na TV.',
                action: 'Liga o toggle "Ativar UGC na TV 3" no topo da página.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- MARKETING / AUTO STORIES IG ----------
    SCANNERS['tv-auto-stories'] = function(fid) {
        const alerts = []; const kpis = [];
        const cfg = DS().get('ig_autopost_' + fid) || {};
        const history = DS().get('ig_autopost_history_' + fid) || [];
        if (!cfg.igAccountId || !cfg.igToken) {
            alerts.push({
                level: 'high',
                title: 'Instagram não conectado',
                detail: 'Meta API token não configurado — zero auto-post.',
                action: 'Segue docs/IG_AUTOPOST_SETUP.md: 5 passos de 20 min pra conectar e começar a postar 3 stories/dia.'
            });
        } else if (!cfg.autoEnabled) {
            alerts.push({
                level: 'medium',
                title: 'Conectado mas auto-post desligado',
                detail: 'Token salvo mas toggle de agendamento off.',
                action: 'Liga "Ativar auto-post diário" e define horário (sugestão 20h BRT).'
            });
        }
        if (history.length) {
            const last = history[0];
            const days = last.at ? Math.round((Date.now() - new Date(last.at).getTime()) / 86400000) : null;
            kpis.push({ label: 'Último post', value: days + ' dia(s)', target: '1', color: days <= 2 ? 'green' : 'red' });
        }
        return { alerts, kpis };
    };

    SCANNERS['marketing'] = function(fid) {
        return SCANNERS['tv-auto-stories'](fid);
    };

    // ---------- PEDIDOS ----------
    SCANNERS['pedidos'] = function(fid) {
        const alerts = []; const kpis = [];
        const orders = DS().getCollection ? DS().getCollection('orders', fid) || [] : [];
        const abertos = orders.filter(o => o.status === 'preparando' || o.status === 'em_rota');
        const atrasados = abertos.filter(o => {
            if (!o.createdAt) return false;
            const min = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
            return min > 30;
        });
        kpis.push({ label: 'Pedidos em aberto', value: abertos.length, target: '< 10', color: abertos.length < 10 ? 'green' : 'red' });
        if (atrasados.length) {
            alerts.push({
                level: 'high',
                title: atrasados.length + ' pedido(s) atrasado(s) >30min',
                detail: 'Cliente pode já estar reclamando no app.',
                action: 'Contata entregador ou envia cortesia pra não virar review negativa.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- DESAFIOS ----------
    SCANNERS['desafios'] = function(fid) { return SCANNERS['challenge-studio'](fid); };
    SCANNERS['challenge-studio'] = function(fid) {
        const alerts = []; const kpis = [];
        const w10 = DS().get('challenge_10s_winners_' + fid) || [];
        const w300 = DS().get('challenge_300g_winners_' + fid) || [];
        const w10Today = w10.filter(w => isToday(w.at));
        const w300Today = w300.filter(w => isToday(w.at));
        kpis.push({ label: '10s ganhadores hoje', value: w10Today.length, target: '3+', color: w10Today.length >= 3 ? 'green' : 'amber' });
        kpis.push({ label: '300g ganhadores hoje', value: w300Today.length, target: '2+', color: w300Today.length >= 2 ? 'green' : 'amber' });
        if (w10Today.length === 0 && w300Today.length === 0) {
            alerts.push({
                level: 'medium',
                title: 'Nenhum desafio jogado hoje',
                detail: 'Os desafios são seu motor viral — ouro desperdiçado.',
                action: 'Staff precisa ATIVAR: "quer tentar ganhar um potinho grátis?" a cada pedido. Start no Studio dos Desafios.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- EQUIPE ----------
    SCANNERS['equipe'] = function(fid) {
        const alerts = []; const kpis = [];
        const staff = DS().get('staff_' + fid) || [];
        kpis.push({ label: 'Staff cadastrado', value: staff.length, target: '2+', color: staff.length >= 2 ? 'green' : 'red' });
        if (!staff.length) {
            alerts.push({
                level: 'high',
                title: 'Nenhum membro da equipe cadastrado',
                detail: 'Sem staff, PDV fica sem rastreio de comissão por operador.',
                action: 'Cadastra ao menos você + 1 atendente.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- FIDELIDADE ----------
    SCANNERS['fidelidade'] = function(fid) {
        const alerts = []; const kpis = [];
        const cfg = DS().get('loyalty_config_' + fid) || DS().get('loyalty_config') || {};
        if (!cfg.enabled) {
            alerts.push({
                level: 'medium',
                title: 'Programa de fidelidade desligado',
                detail: 'Sem cartão de pontos = zero incentivo pra cliente voltar na 2ª semana.',
                action: 'Ativa "Clube Belinha": a cada 8 potinhos, 1 grátis. Referência: Milky Moo tem programa similar e fez muita diferença.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- iFOOD ----------
    SCANNERS['ifood'] = function(fid) {
        const alerts = []; const kpis = [];
        const cfg = DS().get('ifood_config_' + fid) || {};
        if (!cfg.merchantId || !cfg.accessToken) {
            alerts.push({
                level: 'medium',
                title: 'iFood não conectado',
                detail: 'Pedidos do iFood não entram automaticamente no seu PDV.',
                action: 'Pega merchant ID e access token em parceiros.ifood.com.br → Integrações.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- FISCAL ----------
    SCANNERS['fiscal'] = function(fid) {
        const alerts = []; const kpis = [];
        const franchises = DS().get('franchises') || [];
        const f = franchises.find(x => x.id === fid) || {};
        if (!f.cnpj) {
            alerts.push({
                level: 'critical',
                title: 'CNPJ não cadastrado',
                detail: 'Sem CNPJ não há emissão de NFC-e — ilegal pra venda fiscal.',
                action: 'Cadastra na aba "Dados da empresa" antes de qualquer venda oficial.'
            });
        }
        const cfg = DS().get('fiscal_config_' + fid) || {};
        if (!cfg.certificado) {
            alerts.push({
                level: 'medium',
                title: 'Certificado A1 não cadastrado',
                detail: 'Sem certificado, NFC-e não emite.',
                action: 'Upload do .pfx na página Fiscal.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- CADASTRO AVANÇADO V2 ----------
    SCANNERS['produtos'] = function(fid) {
        const alerts = []; const kpis = [];
        if (typeof global.CatalogV2 === 'undefined' || typeof global.CostCalculator === 'undefined') {
            return { alerts, kpis };
        }
        const prods = global.CatalogV2.listProdutos(fid);
        const cats = global.CatalogV2.listCategorias(fid);
        const tops = global.CatalogV2.listToppings(fid);

        kpis.push({ label: 'Produtos', value: prods.length, target: '10+', color: prods.length >= 10 ? 'green' : 'amber' });
        kpis.push({ label: 'Categorias', value: cats.length, target: '6+', color: cats.length >= 6 ? 'green' : 'amber' });
        kpis.push({ label: 'Toppings', value: tops.length, target: '8+', color: tops.length >= 8 ? 'green' : 'amber' });

        if (!prods.length) {
            alerts.push({
                level: 'critical',
                title: 'Catálogo vazio',
                detail: 'Sem produtos cadastrados, PDV, financeiro e TVs não têm o que exibir.',
                action: 'Clica em "🪄 Seed inicial" pra carregar 12 produtos-exemplo MilkyPot em 1 segundo.'
            });
            return { alerts, kpis };
        }

        // Produtos SEM CUSTO
        const semCusto = prods.filter(p => global.CostCalculator.computeCustoTotal(p) <= 0);
        if (semCusto.length) {
            alerts.push({
                level: 'critical',
                title: semCusto.length + ' produto(s) SEM custo cadastrado',
                detail: semCusto.slice(0,4).map(p => p.name).join(', '),
                action: 'Sem custo, preço sugerido é 0 e margem é mentirosa. Abre o produto → Custos → preenche insumos + embalagem.'
            });
        }

        // Produtos em PREJUÍZO no iFood
        let prejIfood = 0; let prejLoja = 0;
        const detalhes = [];
        prods.forEach(p => {
            const total = global.CostCalculator.computeCustoTotal(p);
            if (total <= 0) return;
            const vI = global.CostCalculator.validatePrice(total, p.precos?.ifood?.real, 'ifood');
            const vL = global.CostCalculator.validatePrice(total, p.precos?.loja?.real, 'loja');
            if (vI.status === 'prejuizo') { prejIfood++; detalhes.push(p.name + ' (iFood)'); }
            if (vL.status === 'prejuizo') { prejLoja++; detalhes.push(p.name + ' (Loja)'); }
        });
        if (prejIfood + prejLoja > 0) {
            alerts.push({
                level: 'critical',
                title: (prejIfood + prejLoja) + ' produto(s) em PREJUÍZO',
                detail: detalhes.slice(0,4).join(', '),
                action: 'Vai na aba "Análise de Margem" e corrige — clica "Usar" no preço sugerido de cada canal vermelho.'
            });
        }

        // Sem foto/emoji
        const semFoto = prods.filter(p => !p.midia?.emoji && !(p.midia?.fotos||[]).length && !p.midia?.video);
        if (semFoto.length >= Math.max(3, prods.length * 0.3)) {
            alerts.push({
                level: 'high',
                title: semFoto.length + ' produto(s) sem foto/emoji',
                detail: 'Cardápio sem visual vende 40% menos no delivery (benchmark iFood).',
                action: 'Adiciona emoji (🍨, 🥤, 🍇) no mínimo. Ou upload de foto em cada produto.'
            });
        }

        // Sem descrição
        const semDesc = prods.filter(p => !p.desc || p.desc.length < 15);
        if (semDesc.length >= Math.max(3, prods.length * 0.3)) {
            alerts.push({
                level: 'medium',
                title: semDesc.length + ' produto(s) sem descrição',
                detail: '"Cremoso com raspas de Oreo" converte mais que só "Oreo".',
                action: 'Posso escrever descrições de todos em 30 segundos — me pede.'
            });
        }

        // Sem preço em canal
        const canaisFaltando = prods.filter(p => {
            const v = p.precos || {};
            return !v.loja?.real || !v.delivery?.real || !v.ifood?.real;
        });
        if (canaisFaltando.length) {
            alerts.push({
                level: 'high',
                title: canaisFaltando.length + ' produto(s) sem preço em algum canal',
                detail: 'Vai estourar no PDV/delivery quando cliente tentar comprar.',
                action: 'Abre o produto → Preços → clica "Usar" no sugerido de cada canal.'
            });
        }

        // CMV médio (agregado)
        let totalCusto = 0, totalReceita = 0;
        prods.forEach(p => {
            const c = global.CostCalculator.computeCustoTotal(p);
            const preco = p.precos?.loja?.real || p.precos?.loja?.recomendado || 0;
            if (c > 0 && preco > 0) {
                totalCusto += c;
                totalReceita += preco;
            }
        });
        if (totalReceita > 0) {
            const cmv = Math.round((totalCusto / totalReceita) * 100);
            kpis.push({ label: 'CMV médio catálogo', value: cmv + '%', target: '28-32%', color: cmv <= 32 ? 'green' : cmv <= 38 ? 'amber' : 'red' });
            if (cmv > 38) {
                alerts.push({
                    level: 'high',
                    title: 'CMV médio em ' + cmv + '% (benchmark MilkyPot: 28-32%)',
                    detail: 'Você tá operando com margem apertada. Em R$45k/mês, cada 1% extra = R$450 de lucro perdido.',
                    action: 'Revisa custos: embalagem barata, porção scoop, negocie insumo, suba preço dos produtos com margem abaixo de 60%.'
                });
            }
        }

        // Kits vazios onde deveria ter
        const picoles = prods.filter(p => p.categoriaId === 'cat_picole' && (!p.kits || !p.kits.length));
        if (picoles.length) {
            alerts.push({
                level: 'low',
                title: picoles.length + ' picolé(s) sem kits cadastrados',
                detail: 'Cliente quer comprar 3, 10 ou 20 picolés com desconto.',
                action: 'Abre o picolé → Kits → + Adicionar kit (1un, 3un, 10un, 20un).'
            });
        }

        return { alerts, kpis };
    };

    // ---------- ESCANEAR NOTA ----------
    SCANNERS['escanear-nota'] = function(fid) {
        const alerts = []; const kpis = [];
        const compras = DS().getCollection ? DS().getCollection('compras', fid) || [] : [];
        const ultima = compras[compras.length - 1];
        if (ultima) {
            const days = Math.round((Date.now() - new Date(ultima.date).getTime()) / 86400000);
            kpis.push({ label: 'Última compra', value: days + 'd', target: '< 7d', color: days <= 7 ? 'green' : 'amber' });
        } else {
            kpis.push({ label: 'Compras registradas', value: '0', target: '1+', color: 'red' });
            alerts.push({
                level: 'medium',
                title: 'Nenhuma compra registrada via scanner',
                detail: 'Scanner economiza 20min/compra vs lançamento manual.',
                action: 'Tira foto da próxima nota no celular — IA extrai tudo em 8 segundos.'
            });
        }
        return { alerts, kpis };
    };

    // ---------- DEFAULT (outras páginas) ----------
    SCANNERS['default'] = function(fid) {
        return { alerts: [], kpis: [] };
    };

    // ================================================================
    // API pública
    // ================================================================
    function scanCurrent(session) {
        const fid = session && session.franchiseId;
        if (!fid || !DS()) return { alerts: [], kpis: [], priority: 'none' };

        // Descobre qual scanner usar
        const path = location.pathname;
        let scanner = SCANNERS['default'];
        let pageKey = 'default';
        for (const key in SCANNERS) {
            if (path.includes('/' + key + '.html')) { scanner = SCANNERS[key]; pageKey = key; break; }
        }

        let result = { alerts: [], kpis: [] };
        try { result = scanner(fid) || result; } catch(e) { console.warn('[BelinhaScanners]', pageKey, e); }

        // Define prioridade geral
        const levels = result.alerts.map(a => a.level);
        const priority =
            levels.includes('critical') ? 'critical' :
            levels.includes('high') ? 'high' :
            levels.includes('medium') ? 'medium' :
            levels.includes('low') ? 'low' : 'none';

        // Gera o insight (texto que a Belinha vai dizer proativamente)
        result.priority = priority;
        result.pageKey = pageKey;
        result.insight = buildInsight(result, pageKey);
        return result;
    }

    function buildInsight(scan, pageKey) {
        if (!scan.alerts.length) {
            return '🐑 Olhei essa tela agora e tá tudo em ordem. Se quiser, posso sugerir melhorias específicas dessa área — só me chamar.';
        }
        const icon = { critical:'🚨', high:'⚠️', medium:'💡', low:'👋' }[scan.priority] || '👋';
        const top = scan.alerts[0];
        let t = `${icon} **${top.title}**\n\n${top.detail}\n\n**O que fazer:** ${top.action}`;
        if (scan.alerts.length > 1) {
            t += `\n\n_Também vi ${scan.alerts.length - 1} outro(s) ponto(s) nessa tela — pergunta "mostra os outros alertas" se quiser._`;
        }
        return t;
    }

    global.BelinhaScanners = { scanCurrent, SCANNERS };
})(typeof window !== 'undefined' ? window : this);
