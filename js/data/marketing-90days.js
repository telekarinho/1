/* ============================================
   MARKETING DIARIO — 90 DIAS DE EXECUCAO
   ============================================
   Estende js/data/belinha-90days.js com TUDO que um profissional
   de marketing de loja fisica focado em viralizacao precisa fazer
   todo dia. Cada dia tem 7 tracks:

   1. POST   — Conteudo viral (vem do BelinhaContent)
   2. LOJA   — Acoes na loja fisica (decoracao, equipe, vitrine)
   3. ADS    — Midia paga (Meta/TikTok/Google)
   4. PROMO  — Recompensa/promocao do dia (PDV)
   5. METRICAS — KPIs pra olhar no fim do dia
   6. TAREFAS  — Checklist operacional
   7. QUICKWIN — 1 acao de alto-impacto / baixo-esforco

   Filosofia: VIRALIZACAO -> VENDAS. Loja fisica vira "set" do
   conteudo. Cada dia tem uma intencao estrategica clara.

   Carrega APOS belinha-90days.js.
   ============================================ */

(function (global) {
    if (!global.BelinhaContent || !global.BelinhaContent.days) {
        console.error('[marketing-90days] BelinhaContent nao carregado. Inclua belinha-90days.js antes.');
        return;
    }

    const belinhaDays = global.BelinhaContent.days;

    // Foco semanal — cada semana tem uma "missao" estrategica
    const weekFocus = {
        1:  { mission: 'Recuperar momentum pos-lancamento',  pillar: 'Retencao',     metaSeguidores: 200,  metaTickets: 80, ctxAds: 'Trafego pra perfil + remarketing' },
        2:  { mission: 'Construir habito de consumo',         pillar: 'Frequencia',   metaSeguidores: 250,  metaTickets: 95, ctxAds: 'Remarketing 7d + lookalike fas' },
        3:  { mission: 'Empurrar Dia das Maes (10/05)',       pillar: 'Sazonal',      metaSeguidores: 350,  metaTickets: 130,ctxAds: 'Boost criativo de Maes + cupom' },
        4:  { mission: 'Series virais — POVs de cliente',     pillar: 'Viralizacao',  metaSeguidores: 400,  metaTickets: 110,ctxAds: 'Boost em videos com >7% save' },
        5:  { mission: 'Empurrar Namorados (12/06)',          pillar: 'Sazonal',      metaSeguidores: 500,  metaTickets: 140,ctxAds: 'Combo Casal + alvo casais' },
        6:  { mission: 'Festa Junina — sabores tematicos',    pillar: 'Sazonal',      metaSeguidores: 600,  metaTickets: 130,ctxAds: 'Sabores juninos + decoracao loja' },
        7:  { mission: 'Frias escolares — kids power',        pillar: 'Familia',      metaSeguidores: 700,  metaTickets: 140,ctxAds: 'Audiencia maes + Combo Familia' },
        8:  { mission: 'Series ASMR — som como ativo',        pillar: 'Viralizacao',  metaSeguidores: 800,  metaTickets: 110,ctxAds: 'Boost ASMR sem som — leg pesada' },
        9:  { mission: 'Influenciadores micro Londrina',      pillar: 'Outreach',     metaSeguidores: 950,  metaTickets: 120,ctxAds: 'Whitelisting micro-influencer post' },
        10: { mission: 'UGC — clientes como personagens',     pillar: 'Comunidade',   metaSeguidores: 1100, metaTickets: 130,ctxAds: 'Boost em UGC autorizado' },
        11: { mission: 'Pre Dia dos Pais',                    pillar: 'Sazonal',      metaSeguidores: 1300, metaTickets: 140,ctxAds: 'Audiencia filhos 18-35' },
        12: { mission: 'Dia dos Pais (10/08)',                pillar: 'Sazonal',      metaSeguidores: 1500, metaTickets: 160,ctxAds: 'Intensificar 3 dias pre-data' },
        13: { mission: 'Consolidacao — cards anuais',         pillar: 'Brand',        metaSeguidores: 1700, metaTickets: 130,ctxAds: 'Brand awareness + UGC compilado' }
    };

    // Banco de acoes pra LOJA FISICA — rotaciona conforme tema
    const lojaActions = {
        rotina:    { decoracao: 'Banner "novo sabor da semana" no caixa', equipe: 'Treinamento de upsell de toppings (1 a mais = +R$2)', visual: 'Foto do produto bem-iluminada perto da entrada' },
        asmr:      { decoracao: 'Vitrine impecavel — calda em fio em destaque', equipe: 'Ensaiar movimento bonito na hora de servir', visual: 'Tripe escondido pra gravar foto satisfying do dia' },
        humor:     { decoracao: 'Plaquinha humoristica no balcao ("e VOCE quem decide")', equipe: 'Encorajar conversa solta com cliente', visual: 'Balcao limpo — fundo bom pra foto' },
        promo:     { decoracao: 'Banner da promo na entrada + cartaz no PDV', equipe: 'Roteiro para anunciar promo a TODO cliente', visual: 'Combo armado em destaque na vitrine' },
        viral:     { decoracao: 'Corner "instagramavel" iluminado (luz quente)', equipe: 'Avisar atendentes que pode ter celular gravando', visual: 'Cartaz "@milkypotbr — marca a gente"' },
        wholesome: { decoracao: 'Mensagens fofas escritas a mao em cartoes nas mesas', equipe: 'Atencao redobrada com famílias', visual: 'Foto de detalhe humano (mao da crianca segurando potinho)' },
        family:    { decoracao: 'Cantinho "para criancas" — colorir + mini brinde', equipe: 'Saudar criancas pelo nome quando possivel', visual: 'Foto de irmaos/familias dividindo (com autorizacao)' },
        sazonal:   { decoracao: 'Tema da data sazonal aplicado na vitrine', equipe: 'Roteiro especifico da data', visual: 'Cartaz da data + sabor especial em destaque' },
        novidade:  { decoracao: 'Painel "NOVIDADE" piscando (ou chamativo)', equipe: 'Apresentacao do produto novo a cada cliente', visual: 'Degustacao gratis no balcao se possivel' },
        milestone: { decoracao: 'Numero do marco em destaque (1k seguidores etc)', equipe: 'Pedir agradecimento da equipe gravado', visual: 'Bolo/comemoracao pequeno na loja' },
        localcontent:{ decoracao: 'Mapa de Londrina com pinos onde clientes vieram', equipe: 'Perguntar bairro do cliente', visual: 'Foto da fachada/avenida pra contexto local' },
        tutorial:  { decoracao: 'Cartaz "como montar o potinho perfeito"', equipe: 'Atendente explica enquanto monta', visual: 'Estacao de toppings totalmente abastecida' },
        storytelling:{ decoracao: 'Quadro "historia do MilkyPot" em destaque', equipe: 'Atendente conta um trechinho da historia', visual: 'Foto antiga / making of em destaque' }
    };

    // Banco de ADS por tema
    const adsActions = {
        rotina:    { plataforma: 'Meta', objetivo: 'Trafego pro perfil', budget: 'R$ 20/dia', publico: 'Londrina 4km, 18-44',         creative: 'Reel do dia', dur: '3 dias' },
        asmr:      { plataforma: 'Meta + TikTok', objetivo: 'Visualizacoes 3s+', budget: 'R$ 30/dia', publico: 'Londrina 5km, todos',  creative: 'Video ASMR do dia (sem texto, alta retencao)', dur: '5 dias' },
        humor:     { plataforma: 'Meta', objetivo: 'Engajamento', budget: 'R$ 15/dia', publico: 'Lookalike fas + Londrina 4km',       creative: 'Reel humor do dia', dur: '3 dias' },
        promo:     { plataforma: 'Meta + Google Search', objetivo: 'Conversao (clicks site/whatsapp)', budget: 'R$ 50/dia',publico:'Londrina 4km + remarketing 30d',creative:'Carrossel da promo + cupom em destaque',dur:'Duracao da promo'},
        viral:     { plataforma: 'TikTok + Meta', objetivo: 'Visualizacoes', budget: 'R$ 35/dia', publico: 'Londrina 5km, 18-34',     creative: 'Boost so se passar 7% save rate', dur: '5 dias' },
        wholesome: { plataforma: 'Meta', objetivo: 'Engajamento', budget: 'R$ 20/dia', publico: 'Londrina + maes/pais 25-50',         creative: 'Reel wholesome do dia', dur: '4 dias' },
        family:    { plataforma: 'Meta', objetivo: 'Conversao', budget: 'R$ 30/dia', publico: 'Maes 28-45 Londrina, interesses kids', creative: 'Combo Familia + foto crianca', dur: '5 dias' },
        sazonal:   { plataforma: 'Meta + Google + TikTok', objetivo: 'Conversao', budget: 'R$ 60/dia', publico: 'Audiencia da data',   creative: 'Criativo tematico + deadline', dur: '7 dias antes ate data' },
        novidade:  { plataforma: 'Meta', objetivo: 'Trafego pro perfil', budget: 'R$ 25/dia', publico: 'Lookalike + Londrina 4km',     creative: 'Reveal do produto novo', dur: '5 dias' },
        milestone: { plataforma: 'Meta organico', objetivo: 'Engajamento', budget: 'R$ 15/dia', publico: 'Fas + lookalike',           creative: 'Card de agradecimento', dur: '2 dias' },
        localcontent:{ plataforma: 'Meta', objetivo: 'Trafego pro perfil', budget: 'R$ 20/dia', publico: 'Londrina TODA',              creative: 'Conteudo local com referencia', dur: '4 dias' },
        tutorial:  { plataforma: 'Meta + YouTube Shorts', objetivo: 'Visualizacao', budget: 'R$ 20/dia', publico: 'Londrina + interesses doces',creative: 'Tutorial completo', dur: '5 dias' },
        storytelling:{ plataforma: 'Meta', objetivo: 'Engajamento', budget: 'R$ 25/dia', publico: 'Fas + lookalike',                   creative: 'Carrossel com historia', dur: '5 dias' }
    };

    // Banco de PROMO/RECOMPENSA por tema
    const promoActions = {
        rotina:    { nome: 'Carimbo dobrado nas segundas',     cupom: '—',          como: 'PDV > MilkyPass > carimbo 2x', valido: 'So segundas' },
        asmr:      { nome: 'Topping de cortesia em videos',    cupom: 'ASMRDIA',    como: 'Cliente que filmar ganha 1 topping', valido: 'Hoje so' },
        humor:     { nome: '—',                                 cupom: '—',          como: 'Sem promo, foco e engajamento',     valido: '—' },
        promo:     { nome: 'Combo Casal sextou',               cupom: 'CASAL2X1',   como: 'PDV > Promocoes > Combo Casal',     valido: 'Sex/Sab/Dom' },
        viral:     { nome: 'Raspinha extra pra quem marcar @', cupom: 'MARCAEU',    como: 'Manualmente no PDV apos prova',     valido: 'Hoje so' },
        wholesome: { nome: 'Topping de cortesia familia',      cupom: 'FAMILIAVIP', como: 'PDV > MilkyPass > brinde',          valido: 'Hoje so' },
        family:    { nome: 'Crianca paga meia (ate 10 anos)',  cupom: 'KIDS50',     como: 'PDV > Desconto manual',             valido: '14h-18h' },
        sazonal:   { nome: 'Promo da data',                    cupom: 'Variavel',   como: 'PDV > Promocoes da data',           valido: 'Janela da data' },
        novidade:  { nome: 'Degustacao do novo gratis',        cupom: 'PROVA',      como: 'Atendente oferece a todo cliente',  valido: 'Ate acabar' },
        milestone: { nome: 'Topping gratis pra fas com >30d',  cupom: 'FAOROXO',    como: 'Verificar via @ no MilkyClube',     valido: 'Hoje so' },
        localcontent:{ nome:'10% off pra quem mora a >5km',    cupom: 'LONGE10',    como: 'PDV > Desconto + verificar CEP',    valido: 'Hoje so' },
        tutorial:  { nome: '—',                                 cupom: '—',          como: 'Foco e ensinar',                    valido: '—' },
        storytelling:{ nome:'—',                                cupom: '—',          como: 'Foco e narrar',                     valido: '—' }
    };

    // Banco de TAREFAS operacionais — sempre incluir as 4 base
    function tarefasBase(date, dow) {
        return [
            'Postar Reel + Stories ' + (dow === 'SEX' || dow === 'SAB' ? '17h-18h' : '18h-20h'),
            'Stories 19h: enquete/caixa de pergunta',
            'Responder TODOS comentarios ate 22h (algoritmo recompensa <2h)',
            'Verificar fechamento de caixa + reportar no grupo'
        ];
    }
    function tarefasExtras(theme) {
        const map = {
            promo:     ['Conferir cupom ativo no PDV antes de abrir', 'Avisar equipe roteiro da promo', 'Stories 21h: lembrete da promo'],
            viral:     ['Salvar best comments pra repostar amanha', 'Pin de comentario gracinho do publico', 'Subir clip do reel pra TikTok com legenda diferente'],
            asmr:      ['Pedir silencio na loja durante gravacao (15min)', 'Limpar cubas de toppings antes do shot', 'Subir versao sem texto pro algoritmo'],
            sazonal:   ['Conferir decoracao tematica antes de abrir', 'Stories 12h: tease da data', 'WhatsApp Status com a promo'],
            novidade:  ['Treinar equipe sobre o novo (sabor, ingredientes, preco)', 'Foto do produto novo sem cliente', 'Tag MilkyClube no novo item'],
            family:    ['Reservar mesa "kids" da promo', 'Conferir brinde de crianca em estoque', 'Cartaz infantil no balcao'],
            milestone: ['Capturar reacao da equipe ao marco', 'Postar carrossel com numeros', 'Mensagem agradecendo MilkyClube subscribers'],
            wholesome: ['Pedir 3 clientes pra deixar review Google (cupom raspinha)', 'Stories 21h com depoimento real do dia', '—'],
            tutorial:  ['Tripe + iluminacao — gravar 6 takes', 'Anotar duvidas dos clientes pra prox tutorial', '—'],
            storytelling:['Resgatar foto antiga do arquivo', 'Conferir cronologia (12 dias / 1 mes etc)', '—']
        };
        return (map[theme] || ['Revisar agenda da proxima semana', '—', '—']).filter(t => t !== '—');
    }

    // Quick Wins por tema — 1 acao de alto impacto baixo esforco
    const quickWins = {
        rotina:     'Convide 3 clientes a deixar review no Google em troca de raspinha extra',
        asmr:       'Repost o mesmo audio sem texto na descricao — TikTok prioriza video sem legenda gravada',
        humor:      'Resposta-video pra o melhor comentario do post de hoje (cresce alcance 3x)',
        promo:      'Story com sticker de countdown pro fim da promo — cria FOMO',
        viral:      'Comentario "fixado" no proprio post com pergunta pra guiar conversa',
        wholesome:  'Print do melhor comentario e poste como story — cliente viral',
        family:     'Peca foto da familia pra album do mes — autoriza repost futuro',
        sazonal:    'Cartao escrito a mao pro 1o cliente do dia da data — viraliza no IG',
        novidade:   'Live de 2min revelando o novo no perfil — push notification + algoritmo',
        milestone:  'Sorteio rapido entre seguidores que comentaram no post de marco',
        localcontent:'Marque 2 perfis grandes de Londrina (gastronomia/lifestyle) no story',
        tutorial:   'Salva como Reels + IGTV + YouTube Shorts (3 plataformas, 1 conteudo)',
        storytelling:'Reposte o storytelling em 4 partes nos stories — retencao maxima'
    };

    // Metricas a olhar — sempre as 5 base, com meta semanal
    function metricasParaDia(week) {
        const wf = weekFocus[week] || weekFocus[1];
        return [
            { kpi: 'Visualizacoes do Reel',    meta: '>1.500',     onde: 'IG Insights' },
            { kpi: 'Save rate do Reel',         meta: '>5%',        onde: 'IG Insights — gold metric' },
            { kpi: 'Novos seguidores hoje',     meta: '>' + Math.round(wf.metaSeguidores/30), onde: 'IG perfil' },
            { kpi: 'Tickets PDV',               meta: '>' + wf.metaTickets,    onde: 'PDV — fechamento caixa' },
            { kpi: 'Mencoes/marcacoes',         meta: '>3',         onde: 'IG notificacoes' }
        ];
    }

    // SEO/local — rotaciona acoes pra Google Business Profile
    const seoActions = [
        'Subir foto nova no Google Business Profile (proximo do produto do dia)',
        'Responder review novo no Google em <24h (sempre com nome do cliente)',
        'Atualizar horario de funcionamento se mudou',
        'Postar update no Google Business Profile com a promo do dia',
        'Pedir 1 review novo via QR code do recibo do PDV',
        'Atualizar foto de capa do GBP com sabor da semana',
        'Postar evento (Festa Junina, Maes) no Google Business'
    ];

    // Contexto operacional — onde estamos NO LANCAMENTO
    const LAUNCH_DATE = '2026-04-25'; // dia 0 da operacao
    function diasDeOperacao(dataIso) {
        const dt = new Date(dataIso + 'T00:00:00');
        const launch = new Date(LAUNCH_DATE + 'T00:00:00');
        return Math.floor((dt - launch) / 86400000);
    }

    // ════════════════════════════════════════════
    // MONTA O ARRAY MASTER — UMA ENTRADA POR DIA
    // ════════════════════════════════════════════
    const days = belinhaDays.map((b, i) => {
        const wf = weekFocus[b.week] || weekFocus[1];
        const theme = b.theme;
        const loja = lojaActions[theme] || lojaActions.rotina;
        const ads = adsActions[theme] || adsActions.rotina;
        const promo = promoActions[theme] || promoActions.rotina;
        const tarefas = [...tarefasBase(b.date, b.dow), ...tarefasExtras(theme)];
        const quickWin = quickWins[theme] || quickWins.rotina;
        const metricas = metricasParaDia(b.week);
        const seo = seoActions[i % seoActions.length];

        // Foco do dia (1-liner em portugues)
        const focoDoDia = (() => {
            const map = {
                rotina:'Manter ritmo + carimbar habito',
                asmr:'Conteudo sem audio falado, retencao maxima',
                humor:'Engajar — comentario vira algoritmo',
                promo:'Converter — sextou/sab/dom puxa caixa',
                viral:'Atrair publico novo — POV/trend',
                wholesome:'Construir afeto + UGC',
                family:'Trazer familias inteiras pra loja',
                sazonal:'Surfar a data — ticket sobe 30%',
                novidade:'Reveal — gerar buzz e curiosidade',
                milestone:'Comemorar — gratidao engaja muito',
                localcontent:'Aproximar de Londrina — sentimento de bairro',
                tutorial:'Educar publico — vira referencia',
                storytelling:'Gerar emocao — reposicao de marca'
            };
            return map[theme] || 'Operar bem';
        })();

        return {
            d: b.d,
            date: b.date,
            dow: b.dow,
            week: b.week,
            theme: theme,
            title: b.title,
            format: b.format,
            // Contexto operacional
            opsDay: diasDeOperacao(b.date),
            weekMission: wf.mission,
            weekPillar: wf.pillar,
            focoDoDia: focoDoDia,

            // Track 1: POST (referencia ao BelinhaContent)
            post: {
                title: b.title,
                hook: b.hook,
                prompt: b.prompt,
                script: b.script,
                caption: b.caption,
                hashtags: b.hashtags,
                music: b.music,
                cta: b.cta
            },

            // Track 2: LOJA FISICA
            loja: loja,

            // Track 3: ADS
            ads: ads,

            // Track 4: PROMO/RECOMPENSA
            promo: promo,

            // Track 5: METRICAS
            metricas: metricas,

            // Track 6: TAREFAS
            tarefas: tarefas,

            // Track 7: QUICKWIN
            quickWin: quickWin,

            // Track 8: SEO
            seo: seo
        };
    });

    global.MarketingDiario = {
        days: days,
        totalDays: days.length,
        weeks: 13,
        weekFocus: weekFocus,
        launchDate: LAUNCH_DATE,
        // Helpers expostos pra UI
        findDayByDate(iso) {
            return days.find(d => d.date === iso) || null;
        },
        findClosestDay(iso) {
            const target = new Date(iso + 'T00:00:00');
            let best = null, bestDelta = Infinity;
            for (const d of days) {
                const dt = new Date(d.date + 'T00:00:00');
                const delta = Math.abs(dt - target);
                if (delta < bestDelta) { bestDelta = delta; best = d; }
            }
            return best;
        },
        diasDeOperacao
    };

})(typeof window !== 'undefined' ? window : this);
