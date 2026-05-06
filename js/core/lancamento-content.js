/* ============================================
   MilkyPot - Conteúdo do Módulo de Lançamento
   ============================================
   Base de dados estática com todo conteúdo de
   lançamento da unidade Muffato (Londrina-PR).
   Usado pelo admin/lancamento.html.
   ============================================ */

const LancamentoContent = {
    // ========================================
    // INFORMAÇÕES DA MARCA E DO LANÇAMENTO
    // ========================================
    brand: {
        name: 'MilkyPot',
        tagline: 'O Potinho Mais Feliz do Mundo',
        mascote: 'Lana (ovelhinha)',
        unit: 'MilkyPot Muffato Londrina',
        address: 'Av. Quintino Bocaiuva, 1045 — dentro do Muffato, Londrina-PR',
        whatsapp: '(43) 99804-2424',
        whatsappLink: 'https://wa.me/5543998042424',
        site: 'milkypot.com',
        horario: '14h às 23h',
        launchDate: '2026-04-25',
        launchDateLabel: '25/04/2026 (sábado)',
        instagram: '@milkypotbr',
        produtos: [
            'Potinho personalizado (base Ninho / Açaí / Zero-Fit)',
            'Açaí buffet self-service',
            'Picolés artesanais',
            'Sorvetes',
            'Casquinhas',
            'Milkshakes',
            'Produtos com cacau/chocolate'
        ]
    },

    // ========================================
    // BIO E SEO INSTAGRAM
    // ========================================
    instagramSetup: {
        bio: `🐑 Potinho montado do SEU jeito
🍫 Ninho · Açaí · Milkshake · Fit
📍 Av. Quintino Bocaiuva 1045 — Muffato
⏰ 14h–23h todos os dias
👇 Cardápio e pedidos
milkypot.com`,
        displayName: 'MilkyPot 🍡 Açaí & Sobremesas Londrina',
        username: '@milkypotbr',
        destaques: [
            { emoji: '🍡', nome: 'Cardápio', cor: 'rosa' },
            { emoji: '📦', nome: 'Como Pedir', cor: 'lilás' },
            { emoji: '🐑', nome: 'Bastidores', cor: 'amarelo' },
            { emoji: '⭐', nome: 'Amamos', cor: 'menta' },
            { emoji: '🎁', nome: 'Promos', cor: 'pêssego' }
        ]
    },

    // ========================================
    // CALENDÁRIO DIÁRIO DE POSTAGEM
    // ========================================
    calendar: [
        {
            dateISO: '2026-04-20',
            dayLabel: 'D-3',
            dayName: 'Segunda-feira',
            dateLabel: '20/04',
            theme: 'SETUP + PRIMEIROS POSTS',
            mood: '🚀 Começar agora',
            items: [
                {
                    id: 'd3-1',
                    time: 'Manhã',
                    type: 'setup',
                    platforms: ['instagram'],
                    pillar: 'operacional',
                    title: '⚙️ SETUP: Bio + Nome + Destaques',
                    priority: 'high',
                    description: 'Trocar bio do @milkypotbr, alterar nome de exibição, criar 5 destaques com capas no Canva.',
                    caption: `🐑 Potinho montado do SEU jeito
🍫 Ninho · Açaí · Milkshake · Fit
📍 Av. Quintino Bocaiuva 1045 — Muffato
⏰ 14h–23h todos os dias
👇 Cardápio e pedidos
milkypot.com`,
                    hashtags: '',
                    instructions: 'Nome de exibição: "MilkyPot 🍡 Açaí & Sobremesas Londrina"\n\nDestaques a criar:\n1. 🍡 Cardápio (fundo rosa)\n2. 📦 Como Pedir (fundo lilás)\n3. 🐑 Bastidores (fundo amarelo)\n4. ⭐ Amamos (fundo menta)\n5. 🎁 Promos (fundo off-white)'
                },
                {
                    id: 'd3-2',
                    time: '12:30',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'apresentação',
                    title: '📸 Carrossel: "Conheça a MilkyPot"',
                    priority: 'high',
                    description: '6 slides apresentando os produtos da loja (potinho, buffet, picolé, sorvete, milkshake, cacau).',
                    caption: `Londrina, deixa a gente se apresentar 🐑✨

A MilkyPot chegou no Muffato da Quintino Bocaiuva com O Potinho Mais Feliz do Mundo — e muito mais que isso.

Arrasta pro lado e descobre tudo que a gente trouxe:
🍡 Potinho personalizado (Ninho · Açaí · Zero/Fit)
🍇 Açaí buffet
🍭 Picolés artesanais
🍦 Sorvetes
🧁 Milkshakes cremosos
🍫 Cacau

📅 Inauguração: QUINTA 23/04 às 14h
📍 Av. Quintino Bocaiuva, 1045 — dentro do Muffato
📲 (43) 99804-2424 · milkypot.com

Qual desses você quer provar primeiro? Comenta 👇`,
                    hashtags: '#milkypot #londrina #londrinapr #sobremesalondrina #acailondrina #sorveterialondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina #pracomerlondrina #doceriaLondrina #picolelondrina #milkshakelondrina #londrinense #potinhodesobremesa',
                    imagePrompt: 'Ver aba CARROSSÉIS → "Conheça a MilkyPot" (6 slides prontos para Whisk/Ideogram)'
                },
                {
                    id: 'd3-3',
                    time: '19:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'teaser',
                    title: '🎬 Reel: Teaser da ovelhinha chegando',
                    priority: 'high',
                    duration: '15s',
                    description: 'Reel de apresentação misteriosa da Lana chegando em Londrina.',
                    videoScript: `0-2s: Tela preta com texto "algo chegou em Londrina"
2-5s: Close da ovelhinha abrindo os olhos lentamente (zoom out)
5-10s: Ovelha "andando" por pontos de Londrina (Calçadão, Catedral) em montagem rápida
10-14s: Ovelha chega na fachada da MilkyPot no Muffato
14-17s: Corte para potinho sendo montado
Final: "23/04 · Muffato Quintino Bocaiuva"`,
                    audio: 'Trend BR de "apresentação misteriosa" / "algo chegando" (buscar em áudios em alta no Reels)',
                    caption: `Londrina, prepara o coração 🐑💗

A coisa mais fofa que já vimos tá chegando quinta (23/04) dentro do Muffato da Quintino Bocaiuva.

Salva esse post. Quem tá ansioso bate palma 👇`,
                    hashtags: '#milkypot #londrina #londrinapr #sobremesalondrina #acailondrina #curtalondrina #londrinafood #euamolondrina #londrinacity #gastronomialondrina #doceriadelondrina #muffato #novidadeslondrina #milkypotlondrina #potinhomaisfelizdomundo'
                },
                {
                    id: 'd3-4',
                    time: '20:00',
                    type: 'stories',
                    platforms: ['instagram'],
                    pillar: 'engajamento',
                    title: '📱 Stories: 15 stories de bastidor + enquete',
                    priority: 'medium',
                    description: 'Começar a povoar stories com bastidor, enquetes e countdown.',
                    instructions: `Ideias de stories (postar 15 ao longo do dia):
1. "Quem tá aqui?" — enquete sim/não
2. Foto da fachada da loja sendo preparada
3. Enquete: "Qual base você vai pedir? Ninho / Açaí / Zero-Fit"
4. Vídeo curto da equipe chegando na loja
5. Sticker countdown "3 dias"
6. Close nos toppings sendo organizados
7. Pergunta aberta: "Qual topping você NÃO PODE FICAR SEM?"
8. Repost do post carrossel do dia
9. Boomerang da ovelhinha
10. Enquete deslizante: "nível de ansiedade" (0-100)
11. Vídeo da equipe mandando beijo
12. Foto do Muffato de fora com seta "tá rolando aqui"
13. Sticker de pergunta: "Me conta: o que te faz mais feliz em sobremesa?"
14. Repost do Reel do dia
15. "Boa noite Londrina, até amanhã" com ovelhinha`
                },
                {
                    id: 'd3-5',
                    time: 'Tarde',
                    type: 'outbound',
                    platforms: ['dm'],
                    pillar: 'outbound',
                    title: '💌 Disparar 30 DMs para microinfluencers',
                    priority: 'high',
                    description: 'Script pronto para abordar 30 microinfluencers de Londrina (foodies, mães, universitários).',
                    script: `Oi [NOME], tudo bem?

Aqui é da MilkyPot, uma nova sorveteria/açaiteria que inaugura quinta (23/04) dentro do Muffato da Quintino Bocaiuva, aqui em Londrina.

Acompanho seu conteúdo e acho que a vibe combina muito com a nossa — ovelhinha mascote, potinho montado do zero, estética fofa.

Queria te mandar um kit degustação terça (21/04) pra você experimentar ANTES da abertura. Sem compromisso de post — mas se curtir de verdade, adoraria um story marcando @milkypotbr.

Também vou te incluir como VIP na inauguração (furar fila + potinho cortesia no dia).

Topa? Me passa um endereço que a ovelhinha entrega aí 🐑

[SEU NOME] — MilkyPot`,
                    instructions: 'Meta: 30 DMs → 12-15 respostas → 8-10 postam. Perfis ideais: foodies Londrina, mães blogueiras, universitários UEL/UniFil/UTFPR, casais de Londrina. Buscar em #influencerlondrina #londrinafood.'
                },
                {
                    id: 'd3-6',
                    time: 'Noite',
                    type: 'imprensa',
                    platforms: ['email'],
                    pillar: 'imprensa',
                    title: '📰 Enviar press release para 10 veículos',
                    priority: 'medium',
                    description: 'Disparar release para imprensa local.',
                    instructions: 'Ver aba IMPRENSA → Release completo + lista de 10 veículos com contatos.'
                }
            ]
        },
        {
            dateISO: '2026-04-21',
            dayLabel: 'D-2',
            dayName: 'Terça-feira',
            dateLabel: '21/04',
            theme: 'SEEDING + HYPE',
            mood: '🔥 Ativar tração',
            items: [
                {
                    id: 'd2-1',
                    time: '13:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'produto',
                    title: '🎬 Reel: ASMR de montagem do potinho',
                    priority: 'high',
                    duration: '20s',
                    videoScript: `0-2s: Hook visual — close no potinho vazio
2-5s: Scoop de açaí caindo (som ASMR)
5-8s: Leite ninho em pó (chuva branca)
8-11s: Morango picado caindo
11-14s: Calda de chocolate escorrendo
14-18s: Granulado colorido por cima
18-20s: Produto finalizado girando 360°`,
                    audio: 'ASMR natural do produto (sem música) OU trend de "oddly satisfying"',
                    caption: `AVISO: esse vídeo pode causar fome extrema 🚨🍓

É isso que te espera quando a MilkyPot abrir as portas quinta-feira (23/04) no Muffato da Quintino Bocaiuva 👀

Calda escorrendo, biscoito quebradinho, fruta fresquinha, chocolate derretendo... tudo MONTADO POR VOCÊ do jeito que sua vontade mandar 💗

Salva esse post pra lembrar quando a fome bater 📌`,
                    hashtags: '#milkypot #londrina #londrinapr #asmr #asmrfood #sobremesalondrina #acailondrina #curtalondrina #comidalondrina #londrinafood #satisfying #sobremesapersonalizada #acai #milkshake #doceriaLondrina #pracomerlondrina #londrinense #novidadeslondrina #muffato #milkypotlondrina'
                },
                {
                    id: 'd2-2',
                    time: '19:30',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'engajamento',
                    title: '📸 Carrossel: "Qual tribo MilkyPot é a sua?"',
                    priority: 'high',
                    description: '6 slides de quiz — gera comentários em massa.',
                    caption: `diz qual é, Londrina: qual tribo MilkyPot combina com VOCÊ? 🐑✨

descobre arrastando pro lado — e comenta o emoji da tua tribo pra ovelhinha descobrir quem é quem por aqui 👀💗

🥛 TIME NINHO — o romântico cafuné
🍇 TIME AÇAÍ — a energia pura
🧁 TIME MILKSHAKE — o caos divertido
🍭 TIME PICOLÉ — a vida leve
💪 TIME ZERO/FIT — o focado sem abrir mão do doce

(spoiler: aqui tu pode ser de várias no mesmo dia)

📅 QUINTA 23/04 · 14h
📍 Muffato — Av. Quintino Bocaiuva, 1045 · Londrina
📲 (43) 99804-2424 · milkypot.com

comenta sua tribo 👇`,
                    hashtags: '#milkypot #londrina #londrinapr #quiz #qualtribo #sobremesalondrina #acailondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina',
                    imagePrompt: 'Ver aba CARROSSÉIS → "Qual Tribo Você É?" (6 slides prontos)'
                },
                {
                    id: 'd2-3',
                    time: 'Manhã',
                    type: 'seeding',
                    platforms: ['físico'],
                    pillar: 'outbound',
                    title: '🎁 Entregar 25 kits de seeding para influencers',
                    priority: 'high',
                    description: 'Entrega presencial dos kits degustação. Gera UGC em stories nos próximos 2 dias.',
                    instructions: `Kit contém:
• Potinho surpresa montado (combinação assinatura da casa)
• Cupom físico personalizado com nome do influencer (20% off para audiência dele)
• Cartão manuscrito: "Oi [NOME], feito com carinho em Londrina. Espero que você se apaixone como a gente. — Equipe MilkyPot 🐑"
• Mini pelúcia da ovelhinha (item de cena)
• Convite VIP para inauguração (furar fila)

Entregar com moto própria da MilkyPot (gerar vídeo "ovelhinha entregando kits pelos influencers de Londrina").

Custo unitário: R$35-50. Total 25 kits: ~R$1.100.`
                },
                {
                    id: 'd2-4',
                    time: 'Tarde',
                    type: 'tiktok',
                    platforms: ['tiktok'],
                    pillar: 'produto',
                    title: '🎬 TikTok: POV "Você monta o potinho"',
                    priority: 'high',
                    duration: '22s',
                    videoScript: `0-2s: Hook "pov: você descobriu o lugar que monta o potinho DO TEU JEITO"
2-5s: POV entrando na loja, ovelhinha gigante ao fundo
5-10s: Escolhendo base → açaí
10-14s: Apontando toppings um por um rapidamente
14-18s: Potinho pronto, primeira colherada em POV
18-22s: "Muffato Quintino Bocaiuva" aparece na tela`,
                    audio: 'Trend atual de "POV você descobriu..." (verificar aba Trending)',
                    caption: `o problema é que dá vontade de montar TODOS 🥲 qual tu faria primeiro?`,
                    hashtags: '#pov #foodtiktok #acai #sobremesa #londrina #fy #fyp #foodbr #milkypot'
                },
                {
                    id: 'd2-5',
                    time: 'Tarde',
                    type: 'outbound',
                    platforms: ['whatsapp', 'facebook'],
                    pillar: 'outbound',
                    title: '📢 Invadir 10 grupos locais de WhatsApp/Facebook',
                    priority: 'high',
                    description: 'Presença em grupos de bairros do Gleba Palhano, UEL, condomínios, mães.',
                    script: `Galera, eu sou [NOME] e nessa quinta (23/04) vou abrir uma sorveteria/açaiteria chamada MilkyPot dentro do Muffato da Quintino Bocaiuva.

A gente trabalha com potinhos personalizados (você monta do zero: ninho, açaí, milkshake + toppings livres), açaí buffet, picolé artesanal, sorvete, casquinha e milkshake.

Vou deixar 10 cupons de TOPPING GRÁTIS pros primeiros que responderem "EU QUERO" no meu privado.

Inauguração quinta 14h. Se puderem dar uma força compartilhando, já ajuda demais 💗`,
                    instructions: 'Regra dos 4 Ps: Presença prévia (entrar 24-48h antes), Pessoalidade (1ª pessoa), Pedido de ajuda (londrinense adora ajudar), Presente (cupom antes de pedir algo). Não fazer spam do mesmo texto em vários grupos simultaneamente — dar pelo menos 2h de intervalo.'
                },
                {
                    id: 'd2-6',
                    time: '17:00',
                    type: 'ativacao',
                    platforms: ['físico'],
                    pillar: 'outbound',
                    title: '📍 Distribuir 500 cartões QR na cidade',
                    priority: 'medium',
                    description: 'Cartões A6 com QR que leva ao Instagram + cupom digital de inauguração.',
                    instructions: `Pontos estratégicos:
• Entradas/saídas do próprio Muffato (foco principal)
• Portarias da UEL (Centro e Campus)
• Academias Bio Ritmo / Smart Fit do Gleba Palhano
• Entradas Catuaí Shopping
• Boulevard Londrina
• Faculdades Unopar/Pitágoras
• Praças de alimentação

Texto do cartão:
"Scaneia, segue e ganha topping grátis na inauguração dia 23/04 no Muffato da Quintino Bocaiuva. A Lana te espera 🐑"

Custo: ~R$75 (500 cartões A6)`
                }
            ]
        },
        {
            dateISO: '2026-04-22',
            dayLabel: 'D-1',
            dayName: 'Quarta-feira',
            dateLabel: '22/04',
            theme: 'VÉSPERA — FECHAR O HYPE',
            mood: '⚡ Última chamada',
            items: [
                {
                    id: 'd1-1',
                    time: '12:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    pillar: 'countdown',
                    title: '📷 Post: "FALTA 1 DIA" com ovelhinha ansiosa',
                    priority: 'high',
                    caption: `a Lana tá assim: 🐑😰

falta 1 DIA pra gente abrir oficialmente e ela acha que não vai dormir mais 🙈

quem vai tá aqui no dia da inauguração? deixa um 🐑 nos comentários pra Lana ficar mais calma hehe

🎁 spoiler: tem SURPRESA pros primeiros 100 clientes (fica de olho nos stories)

📍 Muffato — Av. Quintino Bocaiuva, 1045
📅 AMANHÃ — 14h
🌐 milkypot.com`,
                    hashtags: '#milkypot #londrina #londrinapr #contagemregressiva #sobremesalondrina #curtalondrina #londrinafood #acailondrina #comidalondrina #inauguracao #novidadeslondrina #muffato #milkypotlondrina #potinhomaisfelizdomundo',
                    imagePrompt: 'Ovelhinha kawaii em close, expressão ansiosa/mordendo unha, olhos grandes com brilho, fundo pastel rosa, sticker "1 DIA" grande sobreposto, estilo claymation candy-land.'
                },
                {
                    id: 'd1-2',
                    time: '19:30',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'conversão',
                    title: '📸 Carrossel: "TUDO sobre a inauguração"',
                    priority: 'high',
                    description: 'Carrossel final com todas as informações práticas + urgência.',
                    caption: `É QUINTA, LONDRINA 🎉🐑

a MilkyPot finalmente abre no Muffato da Quintino Bocaiuva e a ovelhinha não tá sabendo o que fazer da ansiedade 🙈💗

arrasta pra ver TUDO:
📅 quinta 23/04 · 14h
📍 Av. Quintino Bocaiuva, 1045 — dentro do Muffato
🎁 100 primeiros ganham brinde + pulseira numerada + chance do POTE DOURADO
🍡 potinho personalizado · 🍇 açaí buffet · 🍭 picolé · 🍦 sorvete · 🧁 milkshake · 🍫 cacau
📲 (43) 99804-2424 · milkypot.com

salva esse post, ativa o sininho, chama a galera — a Lana te espera 🐑💕`,
                    hashtags: '#milkypot #londrina #londrinapr #inauguracao #sobremesalondrina #acailondrina #sorveterialondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina #pracomerlondrina #doceriaLondrina',
                    imagePrompt: 'Ver aba CARROSSÉIS → "TUDO sobre a inauguração" (6 slides prontos)'
                },
                {
                    id: 'd1-3',
                    time: '20:00',
                    type: 'live',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'hype',
                    title: '🔴 LIVE: Tour pela loja antes de abrir',
                    priority: 'medium',
                    duration: '30-40min',
                    instructions: `Roteiro da live:
1. Abertura (2-3 min): "Oi Londrina, é véspera e a Lana não tá normal"
2. Tour pela loja (10 min): fachada, balcão de toppings, parede instagramável, bancada de montagem, cozinha
3. Apresentação da equipe (5 min): cada funcionário se apresenta
4. Apresentação dos produtos (10 min): potinho, buffet, picolés, sorvetes, milkshakes
5. Q&A com comentários (10 min): responder dúvidas dos espectadores
6. Sorteio express (3 min): 3 vouchers cortesia para quem tá assistindo
7. Encerramento emocional (2 min): "amanhã é o dia"

Dica: deixar um celular fixo no tripé + 1 câmera na mão para close.`
                },
                {
                    id: 'd1-4',
                    time: 'Dia inteiro',
                    type: 'stories',
                    platforms: ['instagram'],
                    pillar: 'hype',
                    title: '📱 25-30 stories de preparação da loja',
                    priority: 'high',
                    instructions: `Stories ao longo do dia:
• Manhã: Equipe chegando, "último dia antes do grande"
• Meio-dia: Fachada sendo decorada
• Tarde: Parede instagramável sendo montada
• Tarde: Toppings chegando em quantidades
• 16h: Treinamento final da equipe
• 18h: Cupons e pulseiras sendo preparados
• 19h: Sticker countdown "menos de 24h"
• Durante a live (20h): chamar pra live
• Após live: Repost dos melhores comentários
• Noite: "Última noite antes da grande" — mensagem emocional da equipe
• 23h: "boa noite, Londrina. Amanhã nada mais será igual 🐑"`
                },
                {
                    id: 'd1-5',
                    time: 'Dia inteiro',
                    type: 'ops',
                    platforms: ['físico'],
                    pillar: 'operacional',
                    title: '✅ Checklist final de operação',
                    priority: 'high',
                    instructions: `Físico:
☐ Fachada pronta e identidade visual instalada
☐ Parede instagramável montada (neon + pelúcias + iluminação)
☐ Fantasia da ovelhinha testada
☐ 100 pulseiras numeradas impressas
☐ 10 potinhos dourados escondidos preparados
☐ Adesivos #MeuMilkyPot nas embalagens
☐ Cartões de indicação impressos
☐ Equipe treinada no script de atendimento

Digital:
☐ Bio Instagram nova publicada
☐ milkypot.com funcionando (cardápio + pedido)
☐ WhatsApp Business com mensagem automática da Lana
☐ Google Meu Negócio verificado
☐ Campanhas Meta Ads ativas
☐ Google Ads pesquisa ativo`
                }
            ]
        },
        {
            dateISO: '2026-04-23',
            dayLabel: 'DIA-D',
            dayName: 'Quinta-feira',
            dateLabel: '23/04',
            theme: '🎉 INAUGURAÇÃO OFICIAL',
            mood: '🚀 É AGORA',
            items: [
                {
                    id: 'dd-1',
                    time: '08:00-13:59',
                    type: 'stories',
                    platforms: ['instagram'],
                    pillar: 'countdown',
                    title: '📱 Stories de contagem regressiva (manhã)',
                    priority: 'high',
                    instructions: `Posts manhã:
• 08h: "Oi Londrina, é HOJE" + equipe chegando
• 09h: Equipe abrindo a loja pela primeira vez
• 10h: Primeira pessoa na fila (se houver)
• 10h30: "FALTAM 4 HORAS" com sticker countdown
• 11h: Últimos detalhes — toppings, balcão brilhando
• 12h: Fantasia da ovelhinha sendo vestida
• 13h: "FALTA 1 HORA" com ansiedade visual
• 13h30: Reel "30 MINUTOS" com countdown dramático
• 13h50: Sticker de countdown final`
                },
                {
                    id: 'dd-2',
                    time: '14:00',
                    type: 'live',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'abertura',
                    title: '🔴 LIVE DE ABERTURA — corte de fita',
                    priority: 'critical',
                    duration: '30-60min',
                    instructions: `Roteiro:
• 13:55: Iniciar live com equipe animada
• 14:00 em ponto: Corte de fita com a ovelhinha fantasiada
• 14:01: Entrada do primeiro cliente
• 14:05: Apresentação dos 100 pulseirados
• 14:15: Primeiras montagens ao vivo
• 14:30: Anunciar os 10 potinhos dourados escondidos
• Continuar por 60 min mostrando movimento`
                },
                {
                    id: 'dd-3',
                    time: '14:15',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'abertura',
                    title: '📸 Post: "ABRIU!" — 3 cards',
                    priority: 'high',
                    caption: `ABRIU. 🌈🚨🐑

a MilkyPot agora é OFICIALMENTE parte de Londrina 💗

obrigada a cada um que chegou até aqui com a gente nessa contagem regressiva — hoje é dia de sonho realizado, potinho cheio e coração transbordando ✨

VEM PRA CÁ:
📍 Av. Quintino Bocaiuva, 1045 — dentro do Muffato
🕑 14h às 23h (todos os dias)
🎁 brinde pros 100 primeiros clientes
📲 (43) 99804-2424
🌐 milkypot.com

marca a gente nos stories quando vier — a Lana quer compartilhar sua visita 🥺💗`,
                    hashtags: '#milkypot #londrina #londrinapr #inauguracao #abertura #hojetem #sobremesalondrina #curtalondrina #londrinafood #acailondrina #comidalondrina #novidadeslondrina #muffato #milkypotlondrina #potinhomaisfelizdomundo'
                },
                {
                    id: 'dd-4',
                    time: '17:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'prova social',
                    title: '🎬 Reel: "Primeiros clientes da MilkyPot"',
                    priority: 'high',
                    duration: '20s',
                    videoScript: `0-3s: Hook "os primeiros Milkypotties entraram pra história 🐑"
3-15s: Compilado de clientes (com autorização) montando, experimentando, sorrindo
15-20s: "Ainda dá tempo de vir — aberto até 23h"`,
                    caption: `OS PRIMEIROS MILKYPOTTIES ENTRARAM PRA HISTÓRIA 🐑💗

hoje foi emocionante ver Londrina chegando, montando, experimentando, sorrindo 🥺✨

obrigada de coração a cada um de vocês — vocês são a razão da Lana não conseguir parar de chorar (de felicidade) hoje 🌈

ainda dá tempo de vir hoje! tá aberto até 23h 👀`,
                    hashtags: '#milkypot #londrina #londrinapr #inauguracao #primeirosclientes #sobremesalondrina #curtalondrina #londrinafood #acailondrina #muffato #milkypotlondrina'
                },
                {
                    id: 'dd-5',
                    time: '19:00',
                    type: 'live',
                    platforms: ['instagram'],
                    pillar: 'engajamento',
                    title: '🏆 LIVE: Sorteio do Pote Vitalício',
                    priority: 'high',
                    duration: '20min',
                    instructions: 'Sortear o "Pote Vitalício" (1 potinho por semana durante 1 ano) entre quem compartilhou o post de sorteio de 3 dias atrás. Transmitir também em uma TV na loja para puxar gente que tá na fila.'
                },
                {
                    id: 'dd-6',
                    time: '22:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'encerramento',
                    title: '📸 Post encerramento — "QUE DIA" (5 cards)',
                    priority: 'high',
                    caption: `QUE DIA. 🥹🌈

Londrina, você foi ACIMA de qualquer expectativa que a gente tinha. fila, sorrisos, potinhos criativos, fotos, abraços... a Lana tá sem palavras 🐑💗

obrigada. obrigada. OBRIGADA. ✨

e pra quem não conseguiu vir hoje: amanhã a gente abre de novo, 14h às 23h, com a mesma energia 💕

📍 Av. Quintino Bocaiuva, 1045 — Muffato
📲 (43) 99804-2424
🌐 milkypot.com

marca a gente nas suas fotos de hoje — a Lana quer repostar TUDO 🥺

boa noite, Londrina 🌙`,
                    hashtags: '#milkypot #londrina #londrinapr #inauguracao #obrigado #sobremesalondrina #curtalondrina #londrinafood #acailondrina #muffato #milkypotlondrina #potinhomaisfelizdomundo'
                }
            ]
        },
        {
            dateISO: '2026-04-24',
            dayLabel: 'D+1',
            dayName: 'Sexta-feira',
            dateLabel: '24/04',
            theme: 'CONSOLIDAÇÃO + UGC',
            mood: '💪 Manter o ritmo',
            items: [
                {
                    id: 'dp1-1',
                    time: '12:30',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'prova social',
                    title: '🎬 Reel: Compilado de reações do dia anterior',
                    priority: 'high',
                    duration: '25s',
                    caption: `Londrina, vocês são demais 🥹🐑

Compilado das reações do dia 1 (com autorização) — cada sorriso valeu cada segundo de preparação 💗

Quem vem hoje? Sextou na MilkyPot tem muito sabor rolando ✨`,
                    hashtags: '#milkypot #londrina #sextou #inauguracao #sobremesalondrina #acailondrina #londrinafood #muffato #milkypotlondrina'
                },
                {
                    id: 'dp1-2',
                    time: '19:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    pillar: 'promoção',
                    title: '📷 Post: Combo CASAL 2x1 (sexta a domingo)',
                    priority: 'high',
                    caption: `SEXTOU, LONDRINA 🍓🐑

Promo de fim de semana: COMBO CASAL 2x1 — 2 potinhos médios pelo preço de 1.

✅ Válido sexta, sábado e domingo
✅ Retirada na loja ou delivery
✅ Cupom: CASAL2x1

Chama o crush, a mãe, a melhor amiga... Londrina, a Lana quer ver vocês em dupla 💗

📍 Av. Quintino Bocaiuva 1045 — Muffato
📲 (43) 99804-2424`,
                    hashtags: '#milkypot #londrina #sextou #promo #acailondrina #sobremesalondrina #muffato #milkypotlondrina'
                },
                {
                    id: 'dp1-3',
                    time: 'Dia inteiro',
                    type: 'stories',
                    platforms: ['instagram'],
                    pillar: 'ugc',
                    title: '📱 Repostar TODA marcação de cliente',
                    priority: 'critical',
                    instructions: 'Meta: repostar 100% das marcações do dia 1. Responder TODA DM. Salvar melhores stories de cliente no destaque "AMAMOS".'
                }
            ]
        },
        {
            dateISO: '2026-04-25',
            dayLabel: 'D+2',
            dayName: 'Sábado',
            dateLabel: '25/04',
            theme: 'PICO DE MOVIMENTO',
            mood: '☀️ Bombar no final de semana',
            items: [
                {
                    id: 'dp2-1',
                    time: '13:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    pillar: 'experiência',
                    title: '🎬 Reel: "POV de sábado na MilkyPot"',
                    priority: 'medium',
                    caption: `sábado de sol, família passeando no Muffato, potinho na mão, fila animada 🐑☀️

vem viver o seu POV de sábado aqui também. a Lana tá esperando 💗

📍 Muffato Quintino Bocaiuva`,
                    hashtags: '#milkypot #londrina #sabado #familia #acailondrina #muffato #milkypotlondrina'
                },
                {
                    id: 'dp2-2',
                    time: '19:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'prova social',
                    title: '📸 Carrossel: "O que Londrina achou" — 5 cards de review',
                    priority: 'high',
                    instructions: 'Pegar 5 melhores reviews/stories de cliente dos últimos 2 dias (com permissão) e montar carrossel.'
                }
            ]
        },
        {
            dateISO: '2026-04-26',
            dayLabel: 'D+3',
            dayName: 'Domingo',
            dateLabel: '26/04',
            theme: 'FECHAR SEMANA 1',
            mood: '💗 Agradecer',
            items: [
                {
                    id: 'dp3-1',
                    time: '19:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    pillar: 'agradecimento',
                    title: '📸 Carrossel: "4 dias de MilkyPot em Londrina"',
                    priority: 'high',
                    caption: `4 dias, Londrina 🥹🐑

em 4 dias vocês transformaram um sonho em memória.
centenas de potinhos. risadas. fotos. primeiras marcações. primeiras reviews. primeiras amizades no balcão.

a Lana chorou. a Lana riu. a Lana já tá planejando o mês que vem 👀

obrigada, Londrina. isso é só o começo 💗

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 14h às 23h todos os dias
📲 (43) 99804-2424 · milkypot.com`,
                    hashtags: '#milkypot #londrina #londrinapr #semana1 #obrigado #sobremesalondrina #acailondrina #muffato #milkypotlondrina #potinhomaisfelizdomundo'
                }
            ]
        },

        // ========================================
        // SEMANA 2 — 28 ABR a 3 MAI
        // ========================================
        {
            dateISO: '2026-04-28',
            dayLabel: 'S2·Ter',
            dayName: 'Terça-feira',
            dateLabel: '28/04',
            theme: 'SEMANA 2 — CONSOLIDAR PRESENÇA',
            mood: '📱 Conteúdo simples que funciona',
            items: [
                {
                    id: 's2-1',
                    time: '12:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    title: '📷 Post: Cardápio visual da semana',
                    priority: 'high',
                    description: 'Foto limpa do potinho com os toppings mais pedidos. Pergunte qual combinação o cliente quer ver.',
                    caption: `qual é o SEU potinho perfeito? 🐑✨

ninho com morango? açaí com granola? zero-fit com nutella?

comenta aqui a sua combinação dos sonhos 👇 que a gente pode fazer!

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 14h às 23h todos os dias
📲 (43) 99804-2424`,
                    hashtags: '#milkypot #londrina #potinhodesobremesa #acailondrina #sobremesalondrina #londrinapr #muffato #milkypotbr',
                    links: [
                        { label: '📸 Abrir Instagram', url: 'https://www.instagram.com/milkypotbr' },
                        { label: '🎨 Criar no Canva', url: 'https://canva.com' }
                    ]
                },
                {
                    id: 's2-2',
                    time: '18:00',
                    type: 'stories',
                    platforms: ['instagram'],
                    title: '📲 Stories: Enquete do sabor + sticker "vote"',
                    priority: 'high',
                    description: '3 stories rápidos: 1) foto do cardápio, 2) enquete "Ninho X Açaí", 3) contagem regressiva pro fim de semana.',
                    instructions: `Story 1: Foto do cardápio com texto "qual vc escolhe hoje?"
Story 2: Enquete — Ninho 🥛 VS Açaí 🍇 (usa o sticker de enquete)
Story 3: Produto do dia com localização marcada (adiciona o endereço como sticker)
Dica: responda TODOS os votos com um emoji — o algoritmo ama isso`,
                    links: [
                        { label: '📸 Abrir Stories', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-04-30',
            dayLabel: 'S2·Qui',
            dayName: 'Quinta-feira',
            dateLabel: '30/04',
            theme: '1 SEMANA COMPLETA!',
            mood: '🎉 Celebrar + agradecer',
            items: [
                {
                    id: 's2-3',
                    time: '12:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel: "1 semana de MilkyPot em Londrina"',
                    priority: 'critical',
                    duration: '20s',
                    description: 'Reel comemorativo rápido. Emoção = alcance. Grave um vídeo autêntico falando o que sentiu na primeira semana.',
                    videoScript: `0-3s: "UMA semana atrás a gente abriu as portas pela primeira vez"
3-8s: Mostrar o movimento da loja / fila / sorrisos (use fotos/vídeos que já tem)
8-15s: "Cada potinho vendido foi um 'obrigada, Londrina' na prática"
15-20s: Close da ovelhinha / logo com texto "mal posso esperar pela próxima semana 💗"
Áudio: algo emocional trending no momento (busque "música de gratidão" no TikTok)`,
                    caption: `1 semana. 🐑💗

não imaginei que ia ser assim.
londrina, vocês chegaram com tudo.

obrigada por cada potinho, cada foto, cada mensagem.
isso aqui tá só começando.

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 14h–23h todos os dias`,
                    hashtags: '#milkypot #londrina #1semana #obrigada #sobremesalondrina #acailondrina #londrinapr #muffato #milkypotbr #potinhomaisfelizdomundo',
                    links: [
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' },
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' },
                        { label: '🎵 Postar no TikTok', url: 'https://www.tiktok.com/@milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-01',
            dayLabel: 'S2·Sex',
            dayName: 'Sexta-feira · Dia do Trabalho',
            dateLabel: '01/05',
            theme: 'FERIADO — PROMO ESPECIAL',
            mood: '🎉 Feriado = movimento',
            items: [
                {
                    id: 's2-4',
                    time: '10:00',
                    type: 'estático',
                    platforms: ['instagram', 'tiktok'],
                    title: '📷 Post feriado: "Dia do Trabalhador merece potinho"',
                    priority: 'critical',
                    description: 'Feriado é pico de movimento. Post de manhã cedo capturando quem vai ao Muffato.',
                    caption: `dia do trabalhador merece um mimo 🐑🎉

você trabalhou demais essa semana. recompensa obrigatória.

🍡 potinho personalizado do SEU jeito
🍇 açaí buffet completo
🍦 sorvetes e muito mais

📍 Av. Quintino Bocaiuva 1045 — dentro do Muffato
🕑 a partir das 14h · sem fila, sem estresse`,
                    hashtags: '#diadotrabalhador #feriado #londrina #muffato #sobremesalondrina #acailondrina #milkypot #milkypotbr #londrinapr',
                    links: [
                        { label: '📸 Abrir Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },

        // ========================================
        // SEMANA 3 — 5 A 9 MAI (SEMANA ATUAL)
        // ========================================
        {
            dateISO: '2026-05-05',
            dayLabel: '🔥 HOJE',
            dayName: 'Terça-feira — Recomeço sem culpa',
            dateLabel: '05/05',
            theme: 'RETOMADA — O ALGORITMO NÃO LEMBRA DO PASSADO, VOCÊ SIM',
            mood: '💪 Bora do começo, sem culpa',
            items: [
                {
                    id: 'mai05-1',
                    time: 'AGORA · 5min',
                    type: 'stories',
                    platforms: ['instagram'],
                    title: '📲 Stories de retomada — 3 slides rápidos (5 min)',
                    priority: 'critical',
                    description: 'A forma mais rápida de reativar o perfil. Não precisa de edição. Grave com o celular agora mesmo da loja ou de casa.',
                    instructions: `FAÇA AGORA — demora 5 minutos:

Story 1 — Texto simples no fundo rosa:
"oi londrina 🐑
a gente não sumiu, a gente tava só... montando potinho ✨"

Story 2 — Foto do produto (qualquer foto que tiver):
Escreve: "cardápio completo 👇" e adiciona o link do site

Story 3 — Enquete rápida:
"qual potinho você quer ver no feed essa semana?"
Opção A: 🍫 Ninho com Nutella
Opção B: 🍇 Açaí com frutas

Dica de ouro: responda todo mundo que votar com um emoji. Isso faz o algoritmo te dar mais alcance.`,
                    links: [
                        { label: '📸 Abrir Instagram (stories)', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                },
                {
                    id: 'mai05-2',
                    time: '12:00 – 13:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    title: '📷 Post: O potinho que mais vendeu essa semana',
                    priority: 'high',
                    description: 'Foto limpa do produto mais pedido. Caption simples. Pergunta no final = engajamento. Você pode gerar a imagem no Canva ou usar foto real do produto.',
                    caption: `já sabe qual é o queridinho de londrina? 🐑👇

esse aqui saiu mais vezes essa semana do que a gente contou.

qual a combinação que você nunca enjoa?
comenta aqui embaixo 💬 (a gente lê todos)

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 14h às 23h todos os dias
📲 (43) 99804-2424 · milkypot.com`,
                    hashtags: '#milkypot #londrina #londrinapr #potinhodesobremesa #acailondrina #sobremesalondrina #muffato #milkypotbr #curtalondrina #londrinafood #sorveterialondrina',
                    imagePrompt: 'Clean overhead product shot of a customized Brazilian açaí bowl/cup with white fluffy base (Ninho), fresh strawberries, granola, and drizzle of condensed milk. Soft natural light, white marble surface, pastel pink accents, professional food photography style.',
                    links: [
                        { label: '🎨 Gerar imagem no Canva', url: 'https://canva.com' },
                        { label: '🖼️ Gerar no Whisk (IA)', url: 'https://whisk.com' },
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                },
                {
                    id: 'mai05-3',
                    time: '19:00 – 20:00',
                    type: 'outbound',
                    platforms: ['instagram', 'dm'],
                    title: '📩 Engajamento: curtir + comentar 20 posts de Londrina',
                    priority: 'high',
                    description: 'O segredo que ninguém conta: sair do perfil e interagir com o público certo faz o algoritmo te mostrar pra mais gente. Custa zero.',
                    instructions: `PASSO A PASSO (20 minutos):

1. Abre o Instagram e busca cada uma dessas hashtags:
   #londrinafood
   #londrinapr
   #muffatolondrina
   #sobremesalondrina

2. Em CADA hashtag, curta os 5 posts mais recentes

3. COMENTE algo genuíno em pelo menos 5 posts (não emoji sozinho):
   Ex: "que lindo isso! 🥰 londrina tem cada coisa boa né?"
   Ex: "adorei esse lugar! londrina arrasando 🍦"

4. Siga 3-4 perfis locais de gastronomia/lifestyle

5. Responde qualquer DM ou comentário que tiver pendente

Resultado esperado: +50-150 visualizações orgânicas nas próximas 24h`,
                    links: [
                        { label: '🔍 Buscar #londrinafood', url: 'https://www.instagram.com/explore/tags/londrinafood/' },
                        { label: '🔍 Buscar #sobremesalondrina', url: 'https://www.instagram.com/explore/tags/sobremesalondrina/' },
                        { label: '🔍 Buscar #muffatolondrina', url: 'https://www.instagram.com/explore/tags/muffatolondrina/' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-06',
            dayLabel: 'S3·Qua',
            dayName: 'Quarta-feira',
            dateLabel: '06/05',
            theme: 'CONTEÚDO DE PRODUTO + BEHIND THE SCENES',
            mood: '🎬 Mostrar como é feito',
            items: [
                {
                    id: 'mai06-1',
                    time: '12:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel: "Como montar um potinho MilkyPot" (ASMR)',
                    priority: 'critical',
                    duration: '15-20s',
                    description: 'Esse é o tipo de vídeo que mais viraliza pra sorveterias/açaí. Grave na loja, mostre o processo de montar um potinho do início ao fim. Sem falar nada — só o som e a música.',
                    videoScript: `Câmera de cima (overhead) ou lateral próxima ao balcão.
Sequência:
0-3s: Copo/potinho vazio sendo pego
3-7s: Base sendo colocada (ninho ou açaí) — devagar, câmera próxima
7-12s: Toppings um a um (morango, granola, leite condensado...)
12-17s: Potinho finalizado, close final
17-20s: Logo MilkyPot + endereço em texto

Áudio: busque "ASMR food" ou "satisfying food sounds" no TikTok/CapCut
OU use uma música lo-fi/chill trending`,
                    caption: `do zero ao perfeito em 20 segundos 🐑✨

cada potinho é feito na hora, do jeito que você pede.

📍 Av. Quintino Bocaiuva 1045 — Muffato · 14h às 23h`,
                    hashtags: '#milkypot #londrina #potinhodesobremesa #asmr #satisfying #acailondrina #muffato #milkypotbr #sobremesalondrina #londrinapr',
                    links: [
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' },
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' },
                        { label: '🎵 Postar no TikTok', url: 'https://www.tiktok.com' }
                    ]
                },
                {
                    id: 'mai06-2',
                    time: '19:00',
                    type: 'stories',
                    platforms: ['instagram'],
                    title: '📲 Stories: Bastidores do dia',
                    priority: 'high',
                    instructions: `Grave 2-3 stories curtos do dia a dia da loja:
- Preparação antes de abrir
- Equipe no balcão
- Produto sendo preparado
- Fila ou movimento (se tiver)

Adicione texto simples: "bastidores de hoje 🐑"
Marque o local: Muffato Londrina`,
                    links: [
                        { label: '📸 Abrir Stories', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-07',
            dayLabel: 'S3·Qui',
            dayName: 'Quinta-feira',
            dateLabel: '07/05',
            theme: 'PROVA SOCIAL + CLIENTE',
            mood: '💬 Voz do cliente',
            items: [
                {
                    id: 'mai07-1',
                    time: '10:00',
                    type: 'outbound',
                    platforms: ['instagram', 'dm'],
                    title: '🔍 Caçada de UGC: repostar clientes',
                    priority: 'critical',
                    description: 'Conteúdo de cliente é 10x mais confiável que conteúdo da marca. Busque posts marcando a loja e peça permissão pra repostar.',
                    instructions: `PASSO A PASSO:

1. Busca no Instagram: #milkypot #milkypotlondrina #milkypotbr
2. Também vai em: @milkypotbr → ver marcações (ícone de pessoa)
3. Para cada foto de cliente encontrada:
   - Curte o post
   - Comenta: "que lindo! 🐑💗 posso repostar nos stories?"
   - Se confirmar, reposta no stories marcando o cliente

4. Crie um Destaque "Amamos ⭐" e salve os melhores depoimentos lá

DICA: Se não tiver UGC ainda, mande DM para 5 clientes que compraram essa semana:
"Oi [nome]! Viu que saiu fotos lindas da loja? 📸 Se você vier essa semana e fizer foto, a gente reposta no stories 🐑💗"`,
                    links: [
                        { label: '🔍 Ver marcações do perfil', url: 'https://www.instagram.com/milkypotbr' },
                        { label: '🔍 Buscar #milkypotlondrina', url: 'https://www.instagram.com/explore/tags/milkypotlondrina/' }
                    ]
                },
                {
                    id: 'mai07-2',
                    time: '19:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    title: '📷 Post: "O que nossos clientes estão pedindo"',
                    priority: 'high',
                    caption: `o londrinense tem bom gosto. confirmado. 🐑✨

essa semana os mais pedidos foram:
🥇 potinho de ninho com morango
🥈 açaí com granola e banana
🥉 milkshake de chocolate

e você? qual é o SEU favorito?
comenta aqui que a gente decide o próximo especial da semana 👇`,
                    hashtags: '#milkypot #londrina #potinhodesobremesa #acailondrina #sobremesalondrina #muffato #milkypotbr #londrinapr',
                    links: [
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-08',
            dayLabel: 'S3·Sex',
            dayName: 'Sexta-feira',
            dateLabel: '08/05',
            theme: 'PROMO FIM DE SEMANA + VIRALIZAR',
            mood: '🎉 Sextou = move',
            items: [
                {
                    id: 'mai08-1',
                    time: '10:00',
                    type: 'estático',
                    platforms: ['instagram', 'tiktok'],
                    title: '📷 Post: Promoção fim de semana',
                    priority: 'critical',
                    caption: `SEXTOU, LONDRINA 🐑🎉

promoção só pro fim de semana:
🍡 2 potinhos médios = R$ [preço] (diga o valor!)
válido sábado e domingo

vem com a galera, a namorada, a família...
a Lana tá esperando ✨

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 14h às 23h`,
                    hashtags: '#sextou #milkypot #londrina #promo #acailondrina #sobremesalondrina #muffato #milkypotbr #londrinapr #londrinafood',
                    links: [
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' },
                        { label: '🎵 Postar no TikTok', url: 'https://www.tiktok.com' }
                    ]
                },
                {
                    id: 'mai08-2',
                    time: '18:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel viral: "POV: sexta no Muffato"',
                    priority: 'high',
                    duration: '15s',
                    description: 'POV (ponto de vista) é o formato que mais viraliza no momento. Simples de gravar, alta chance de alcance.',
                    videoScript: `0-2s: Texto: "POV: você lembrou que tem MilkyPot no Muffato 🐑"
2-6s: Plano da loja com movimento / vitrine
6-10s: Produto sendo montado (can reuse from Wednesday reel)
10-15s: Produto pronto + texto "te vejo aqui? 📍 Muffato Londrina"

Áudio: use trend de POV do TikTok ou algo animado/divertido`,
                    caption: `POV: sexta e você lembrou que tem MilkyPot no Muffato 🐑✨

te vejo aqui? 📍 Av. Quintino Bocaiuva 1045`,
                    hashtags: '#pov #milkypot #londrina #muffato #sextou #acailondrina #milkypotbr #londrinapr',
                    links: [
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' },
                        { label: '🎵 Trends no TikTok', url: 'https://www.tiktok.com/explore' }
                    ]
                }
            ]
        },

        // ========================================
        // SEMANA 4 — 11 A 15 MAI
        // ========================================
        {
            dateISO: '2026-05-11',
            dayLabel: 'S4·Seg',
            dayName: 'Segunda-feira',
            dateLabel: '11/05',
            theme: 'SEMANA 4 — MÊS 1 COMPLETO',
            mood: '🏆 Olhar pra trás e celebrar',
            items: [
                {
                    id: 'mai11-1',
                    time: '12:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    title: '📸 Carrossel: "Mês 1 de MilkyPot"',
                    priority: 'critical',
                    description: 'Todo mundo engaja com números e resultados. Mostre dados reais do primeiro mês (número de potinhos vendidos, clientes, reviews, etc.).',
                    caption: `1 mês. 🐑💗

a gente não imaginava que ia ser assim.
mas foi melhor.

[slide 1] o número que mais importa: você voltou
[slide 2] X potinhos servidos (coloque o número real)
[slide 3] X avaliações 5 estrelas (Google + Instagram)
[slide 4] sabores mais pedidos do mês
[slide 5] o que vem no mês 2 👀
[slide 6] obrigada, Londrina

📍 Av. Quintino Bocaiuva 1045 — Muffato`,
                    hashtags: '#milkypot #londrina #mes1 #obrigada #sobremesalondrina #acailondrina #muffato #milkypotbr #londrinapr #potinhomaisfelizdomundo',
                    links: [
                        { label: '🎨 Criar carrossel no Canva', url: 'https://canva.com' },
                        { label: '📊 Ver analytics Instagram', url: 'https://www.instagram.com/milkypotbr/insights/' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-12',
            dayLabel: 'S4·Ter',
            dayName: 'Terça-feira',
            dateLabel: '12/05',
            theme: 'DIA DAS MÃES — CONTEÚDO ESPECIAL',
            mood: '💕 Dia das Mães = pico',
            items: [
                {
                    id: 'mai12-1',
                    time: '08:00',
                    type: 'estático',
                    platforms: ['instagram', 'tiktok'],
                    title: '📷 Post: Feliz Dia das Mães + Promo especial',
                    priority: 'critical',
                    description: 'Dia das Mães é uma das datas de maior movimento no ano. Post emotivo + oferta especial.',
                    caption: `feliz dia das mães, londrina 💕🐑

hoje a sobremesa é por conta da Lana.

traga sua mãe aqui e ganhe um MIMO ESPECIAL 🎁
(pergunte no balcão!)

porque mãe merece o potinho mais feliz do mundo 🥹

📍 Av. Quintino Bocaiuva 1045 — Muffato
🕑 a partir das 14h`,
                    hashtags: '#diadasmaes #maes2026 #milkypot #londrina #sobremesalondrina #acailondrina #muffato #milkypotbr #presentedemae #londrinapr',
                    links: [
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                },
                {
                    id: 'mai12-2',
                    time: '19:00',
                    type: 'stories',
                    platforms: ['instagram'],
                    title: '📲 Stories: fotos de mães com potinhos',
                    priority: 'high',
                    instructions: `Peça para clientes tirarem foto com a mãe + potinho na loja.
Ofereça um desconto ou brinde para quem postar marcando @milkypotbr.
Reposte todas as fotos nos stories ao longo do dia.
Crie um destaque "Mães 💕" com as melhores fotos.`,
                    links: [
                        { label: '📸 Ver marcações', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-13',
            dayLabel: 'S4·Qua',
            dayName: 'Quarta-feira',
            dateLabel: '13/05',
            theme: 'TENDÊNCIA + VIRAL',
            mood: '📈 Usar trend do momento',
            items: [
                {
                    id: 'mai13-1',
                    time: '12:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel: Use trend do momento (áudio trending)',
                    priority: 'high',
                    duration: '15s',
                    description: 'Pegar uma trend do TikTok/Reels e adaptar para o produto é a forma mais rápida de viralizar. Você não precisa ser criativo — só adapte o formato.',
                    instructions: `COMO USAR UMA TREND:
1. Abra o TikTok e veja o que está viral hoje (ícone de busca → "trending")
2. Escolha uma trend que dá pra adaptar pro produto (comida, surpresa, POV, etc.)
3. Grave o mesmo esquema com o potinho/loja
4. Use o MESMO ÁUDIO da trend original (isso é o segredo do alcance)

Ideias de adaptação:
- Trend de "expectativa vs. realidade": mostra o potinho no cardápio vs. o potinho real (ainda melhor)
- Trend de "o que X quer" vs. "o que tem": público quer sorvete / MilkyPot entrega
- POV de "ser cliente da MilkyPot pela primeira vez"`,
                    links: [
                        { label: '📈 Ver trending TikTok', url: 'https://www.tiktok.com/explore' },
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' },
                        { label: '🔥 Ver trending Reels', url: 'https://www.instagram.com/reels/clips/trending/' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-14',
            dayLabel: 'S4·Qui',
            dayName: 'Quinta-feira',
            dateLabel: '14/05',
            theme: 'MILKYCLUBE + FIDELIDADE',
            mood: '💰 Cashback que viraliza',
            items: [
                {
                    id: 'mai14-1',
                    time: '12:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    title: '📸 Carrossel: Apresentar o MilkyClube',
                    priority: 'critical',
                    description: 'O programa de fidelidade é um diferencial ENORME. Use isso como conteúdo. Explique os benefícios de forma simples.',
                    caption: `enquanto você tá lendo isso, alguém tá ganhando cashback em sorvete 🐑💰

apresenta: o MILKYCLUBE.

✅ cashback de até 7% em toda compra
✅ bônus de aniversário
✅ indica amigos e ganha mais
✅ grátis pra sempre

como entrar: milkypot.com/clube (leva 10 segundos)

ou manda mensagem pra gente te cadastrar na hora 📲`,
                    hashtags: '#milkyclube #cashback #milkypot #londrina #fidelidade #sobremesalondrina #acailondrina #muffato #milkypotbr #londrinapr',
                    links: [
                        { label: '🎁 Abrir MilkyClube', url: 'https://milkypot.com/clube' },
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-15',
            dayLabel: 'S4·Sex',
            dayName: 'Sexta-feira',
            dateLabel: '15/05',
            theme: 'FIM DE SEMANA FORTE',
            mood: '🔥 Promo + engajamento máximo',
            items: [
                {
                    id: 'mai15-1',
                    time: '09:00',
                    type: 'estático',
                    platforms: ['instagram', 'tiktok'],
                    title: '📷 Promo: Desafio de marcação (viral barato)',
                    priority: 'critical',
                    description: 'Sorteios e desafios de marcação são o jeito mais barato de aumentar seguidores organicamente.',
                    caption: `SORTEIO 🐑🎁

pra ganhar 2 potinhos GRÁTIS:
✅ segue @milkypotbr
✅ curte esse post
✅ marca 2 amigos que merecem sorvete

resultado: domingo às 19h 🎉

(compartilha nos stories = participa em dobro 🍀)`,
                    hashtags: '#sorteio #milkypot #londrina #gratis #acailondrina #sobremesalondrina #muffato #milkypotbr #londrinapr #londrinafood #ganha',
                    links: [
                        { label: '📸 Postar no Instagram', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        },

        // ========================================
        // SEMANA 5 — 18 A 22 MAI
        // ========================================
        {
            dateISO: '2026-05-18',
            dayLabel: 'S5·Seg',
            dayName: 'Segunda-feira',
            dateLabel: '18/05',
            theme: 'SEMANA 5 — CONSOLIDAÇÃO DE ROTINA',
            mood: '📅 Consistência vence criatividade',
            items: [
                {
                    id: 'mai18-1',
                    time: '12:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel: "Segunda merece um mimo"',
                    priority: 'high',
                    duration: '15s',
                    caption: `segunda veio pesada, mas o potinho veio pesado também 🐑💪

de segunda a domingo, 14h às 23h.
📍 Muffato Londrina`,
                    hashtags: '#segunda #milkypot #londrina #sobremesalondrina #acailondrina #muffato #milkypotbr',
                    links: [
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-19',
            dayLabel: 'S5·Ter',
            dayName: 'Terça-feira',
            dateLabel: '19/05',
            theme: 'REVIEW GOOGLE + PROVA SOCIAL',
            mood: '⭐ Reputação é ativo',
            items: [
                {
                    id: 'mai19-1',
                    time: '12:00',
                    type: 'outbound',
                    platforms: ['instagram', 'físico'],
                    title: '⭐ Ação: pedir avaliação no Google + Instagram',
                    priority: 'high',
                    description: 'Reviews no Google aumentam descoberta local. 5 avaliações a mais pode dobrar o número de clientes novos via Google Maps.',
                    instructions: `COMO PEDIR REVIEW (prático, sem ser chato):

1. Cria um QR Code do seu perfil do Google Maps (use qr.io ou canva)
2. Coloca na mesa/balcão com um cartão: "Adorou? Faz a gente sorrir no Google 🌟"
3. No Instagram, posta um Story:
   "você avaliou a gente no Google? 🙏 link no bio — leva 30 segundos e ajuda muito"

4. Responde TODAS as avaliações que já tiver (isso melhora ranking)

Para criar o link direto do Google Meu Negócio:
- Busca "MilkyPot Muffato Londrina" no Google
- Clica em "Escrever uma avaliação"
- Copia o link e usa como QR Code`,
                    links: [
                        { label: '⭐ Abrir Google Meu Negócio', url: 'https://business.google.com' },
                        { label: '🔲 Gerar QR Code grátis', url: 'https://qr.io' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-21',
            dayLabel: 'S5·Qui',
            dayName: 'Quinta-feira',
            dateLabel: '21/05',
            theme: 'CONTEÚDO EDUCATIVO — "SABIA QUE?"',
            mood: '🧠 Educação = autoridade',
            items: [
                {
                    id: 'mai21-1',
                    time: '12:00',
                    type: 'carrossel',
                    platforms: ['instagram'],
                    title: '📸 Carrossel: "5 coisas que você não sabia do potinho"',
                    priority: 'high',
                    description: 'Conteúdo educativo gera salvamentos — que é a métrica que o algoritmo mais valoriza.',
                    caption: `você sabia que o potinho MilkyPot é feito do SEU jeito? 🐑

arrasta pra ver 5 segredos que a galera não sabe 👉

(salva esse post pra não esquecer quando vier 📌)

📍 Av. Quintino Bocaiuva 1045 — Muffato · 14h às 23h`,
                    hashtags: '#milkypot #londrina #potinhodesobremesa #dicasdesobremesa #acailondrina #sobremesalondrina #muffato #milkypotbr',
                    links: [
                        { label: '🎨 Criar no Canva', url: 'https://canva.com' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-22',
            dayLabel: 'S5·Sex',
            dayName: 'Sexta-feira',
            dateDate: '22/05',
            dateLabel: '22/05',
            theme: 'FIM DE SEMANA + INDICAÇÃO',
            mood: '👯 Indica e ganha',
            items: [
                {
                    id: 'mai22-1',
                    time: '12:00',
                    type: 'estático',
                    platforms: ['instagram'],
                    title: '📷 Post: MilkyClube — Indica e ganha',
                    priority: 'high',
                    caption: `lembrete: você pode ganhar sorvete de graça indicando amigos 🐑💰

é sério.

cada amigo que você indica pro MilkyClube:
→ você ganha G$ 100 (= R$ 1,00 de desconto)
→ ele ganha G$ 50 de boas-vindas

já indicou alguém hoje?
entra em milkypot.com/clube e pega seu link de indicação 🎁`,
                    hashtags: '#milkyclube #cashback #indica #milkypot #londrina #sobremesalondrina #muffato #milkypotbr #londrinapr',
                    links: [
                        { label: '🎁 MilkyClube — link de indicação', url: 'https://milkypot.com/clube' }
                    ]
                }
            ]
        },

        // ========================================
        // SEMANA 6 — 25 A 29 MAI (FIM DO MÊS)
        // ========================================
        {
            dateISO: '2026-05-25',
            dayLabel: 'S6·Seg',
            dayName: 'Segunda-feira',
            dateLabel: '25/05',
            theme: 'SEMANA 6 — ENCERRAR MAIO COM TUDO',
            mood: '🏁 Sprint final de maio',
            items: [
                {
                    id: 'mai25-1',
                    time: '12:00',
                    type: 'reel',
                    platforms: ['instagram', 'tiktok'],
                    title: '🎬 Reel: "Maio foi assim na MilkyPot"',
                    priority: 'high',
                    duration: '20s',
                    description: 'Recapitular o mês com compilado de fotos/vídeos do mês. Emocional + resultados.',
                    caption: `maio, obrigada 🐑💗

isso aqui é só um resuminho do mês...
mas o melhor tá chegando.

vem junto no junho? ✨

📍 Muffato Londrina · 14h–23h`,
                    hashtags: '#milkypot #londrina #maio2026 #sobremesalondrina #acailondrina #muffato #milkypotbr #londrinapr',
                    links: [
                        { label: '🎬 Editar no CapCut', url: 'https://www.capcut.com' }
                    ]
                }
            ]
        },
        {
            dateISO: '2026-05-28',
            dayLabel: 'S6·Qui',
            dayName: 'Quinta-feira',
            dateLabel: '28/05',
            theme: 'TEASER JUNHO — CRIAR ANTECIPAÇÃO',
            mood: '🔮 Hype pro próximo mês',
            items: [
                {
                    id: 'mai28-1',
                    time: '19:00',
                    type: 'stories',
                    platforms: ['instagram'],
                    title: '📲 Stories: Teaser do que vem em junho',
                    priority: 'high',
                    instructions: `Stories de antecipação funcionam muito:

Story 1: Emoji de reticências com "o que a Lana tá preparando pra junho..."
Story 2: Enquete: "Quer saber primeiro? Ativa as notificações 🔔"
Story 3: "Em breve. 🐑✨"

Objetivo: fazer o seguidor ativar as notificações do perfil = mais alcance pra todos os posts de junho`,
                    links: [
                        { label: '📸 Abrir Stories', url: 'https://www.instagram.com/milkypotbr' }
                    ]
                }
            ]
        }
    ],

    // ========================================
    // PACKS DE CARROSSÉIS (PARA WHISK/IDEOGRAM)
    // ========================================
    carousels: [
        {
            id: 'conheca',
            title: 'Conheça a MilkyPot',
            purpose: 'Apresentar o mix completo de produtos (topo de funil)',
            bestDay: 'Segunda 20/04 - 12h30',
            caption: `Londrina, deixa a gente se apresentar 🐑✨

A MilkyPot chegou no Muffato da Quintino Bocaiuva com O Potinho Mais Feliz do Mundo — e muito mais que isso.

Arrasta pro lado e descobre tudo que a gente trouxe:
🍡 Potinho personalizado (Ninho · Açaí · Zero/Fit)
🍇 Açaí buffet
🍭 Picolés artesanais
🍦 Sorvetes
🧁 Milkshakes cremosos
🍫 Cacau

📅 Inauguração: QUINTA 23/04 às 14h
📍 Av. Quintino Bocaiuva, 1045 — dentro do Muffato
📲 (43) 99804-2424 · milkypot.com

Qual desses você quer provar primeiro? Comenta 👇`,
            hashtags: '#milkypot #londrina #londrinapr #sobremesalondrina #acailondrina #sorveterialondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina #pracomerlondrina #doceriaLondrina #picolelondrina #milkshakelondrina #londrinense #potinhodesobremesa',
            slides: [
                {
                    num: 1,
                    role: 'CAPA (slide-referência)',
                    copy: 'LONDRINA, DEIXA A GENTE SE APRESENTAR 🐑',
                    prompt: `Instagram carousel cover 1080x1350 vertical 4:5. 3D claymation ultra cute kawaii aesthetic, candy land pastel world, glossy clay materials, tilt-shift miniature feel. A fluffy cloud-shaped sheep mascot (white cloud body, huge shiny black eyes with sparkle highlights, pink blush cheeks, tiny peach hooves, small curled pastel horns) is center-stage emerging from behind a soft pink curtain being pulled back, waving hello with one paw, holding a miniature dessert pot with the other. Soft confetti in pink #FFB6C6, lilac #D4B8FF, mint #B8F0D4, butter #FFE89E, peach #FFCBA4 floats around. Background: cream #FFF7EE to soft pink gradient, a few floating popsicles, ice cream cones, and sparkles as decoration. Top of image large bold rounded sans-serif text "LONDRINA, DEIXA A GENTE SE APRESENTAR" in deep raspberry pink #E63F7E with soft shadow. Bottom safe zone empty. Soft studio lighting, warm and inviting.`
                },
                {
                    num: 2,
                    role: 'Potinho personalizado',
                    copy: '1. POTINHO PERSONALIZADO · você monta do zero · 🥛 Ninho · 🍇 Açaí · 💪 Zero/Fit',
                    prompt: `Same visual DNA as slide 1 reference: 3D claymation, same pastel palette (pink #FFB6C6, lilac #D4B8FF, mint #B8F0D4, butter #FFE89E, peach #FFCBA4, cream #FFF7EE), same sheep mascot. 1080x1350 Instagram 4:5. Hero scene: a transparent clay-style dessert pot floating center, showing three colorful horizontal layers from bottom to top: white ninho cream, purple açaí, and pale green Zero/Fit. Topped with a strawberry, a cookie, and colorful sprinkles mid-fall around it. The cloud-sheep mascot is on the right holding a tiny spoon, happy expression, about to dig in. Top text large bold rounded: "1. POTINHO PERSONALIZADO" in raspberry pink #E63F7E. Below in lilac: "você monta do zero". Small icon row at bottom third: "Ninho · Açaí · Zero/Fit". Keep absolute bottom 20% text-free.`
                },
                {
                    num: 3,
                    role: 'Açaí buffet',
                    copy: '2. AÇAÍ BUFFET · liberdade total · você escolhe tudo',
                    prompt: `Same reference DNA (3D claymation, same palette, same sheep mascot, same font). 1080x1350 Instagram 4:5. Scene: a cute 3D clay-style self-service buffet counter stretching horizontally, with open containers of açaí, fresh banana slices, strawberries, blueberries, granola, crushed cookies, peanut butter, honey, condensed milk, cacao nibs — each in a small pastel ceramic bowl on a long mint-green counter. Small transparent pot with açaí being filled in the center. The sheep mascot stands at one end with a small tray, eyes sparkling with excitement. Top text: "2. AÇAÍ BUFFET" in raspberry pink #E63F7E. Middle: "liberdade total" in lilac. Small italic line: "você escolhe tudo" in mint. Keep bottom 20% text-free.`
                },
                {
                    num: 4,
                    role: 'Picolés artesanais',
                    copy: '3. PICOLÉS ARTESANAIS · sabores que abraçam',
                    prompt: `Same reference DNA. 1080x1350 Instagram 4:5. Hero scene: five adorable clay-style popsicles fanned out like a bouquet — strawberry pink, coconut cream white, mint green, chocolate brown with sprinkles, and açaí purple — each on a peach-colored wooden stick, tiny condensation droplets glistening on their surfaces. The cloud-sheep mascot peeks from behind them holding one popsicle with both paws, taking a small bite with eyes closed in bliss. Top bold rounded text: "3. PICOLÉS ARTESANAIS" in raspberry pink #E63F7E. Below: "sabores que abraçam" in lilac. Keep bottom 20% text-free.`
                },
                {
                    num: 5,
                    role: 'Sorvete, casquinha e milkshake',
                    copy: '4. SORVETE, CASQUINHA E MILKSHAKE · os clássicos do verão',
                    prompt: `Same reference DNA. 1080x1350 Instagram 4:5. Scene: three hero items arranged in a gentle triangle composition — (1) a tall pastel pink milkshake glass with whipped cream dome and a red cherry on top, striped straw, (2) a waffle cone with two scoops of ice cream (mint green + peach) with sprinkles, (3) a small plate with a glossy chocolate-cacao bar with cacao pods beside it. Soft floating sparkles and tiny cream swirls between them. The sheep mascot floats in the top-left corner holding a cacao bean, winking. Top text: "4. SORVETE, CASQUINHA E MILKSHAKE" in raspberry pink #E63F7E. Below: "os clássicos do verão" in lilac.`
                },
                {
                    num: 6,
                    role: 'CTA final',
                    copy: 'CHEGA DIA 23/04 👇 · 📍 Muffato Quintino Bocaiuva 1045 · 🕑 14h-23h · 📲 (43) 99804-2424',
                    prompt: `Same reference DNA. 1080x1350 Instagram 4:5. Hero scene: the cloud-sheep mascot center-stage, arms wide open in welcome, holding a tiny wooden signboard that says "23/04" in cute hand-painted letters. A soft glowing downward arrow made of floating sparkles points below the mascot. Pastel confetti rain (pink, lilac, mint, butter, peach) falls gently around. Warm inviting atmosphere. Top bold rounded text: "CHEGA DIA 23/04" in raspberry pink #E63F7E. Info block bottom third: "📍 Muffato — Quintino Bocaiuva, 1045" / "🕑 14h às 23h · todos os dias" / "📲 (43) 99804-2424 · milkypot.com". Keep absolute bottom 20% text-free.`
                }
            ]
        },
        {
            id: 'tribo',
            title: 'Qual Tribo MilkyPot é a sua?',
            purpose: 'Quiz de engajamento (alto volume de comentários)',
            bestDay: 'Terça 21/04 - 19h30',
            caption: `diz qual é, Londrina: qual tribo MilkyPot combina com VOCÊ? 🐑✨

descobre arrastando pro lado — e comenta o emoji da tua tribo pra ovelhinha descobrir quem é quem por aqui 👀💗

🥛 TIME NINHO — o romântico cafuné
🍇 TIME AÇAÍ — a energia pura
🧁 TIME MILKSHAKE — o caos divertido
🍭 TIME PICOLÉ — a vida leve
💪 TIME ZERO/FIT — o focado sem abrir mão do doce

(spoiler: aqui tu pode ser de várias no mesmo dia)

📅 QUINTA 23/04 · 14h
📍 Muffato — Av. Quintino Bocaiuva, 1045 · Londrina
📲 (43) 99804-2424 · milkypot.com

comenta sua tribo 👇`,
            hashtags: '#milkypot #londrina #londrinapr #quiz #qualtribo #sobremesalondrina #acailondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina #pracomerlondrina #doceriaLondrina #picolelondrina #milkshakelondrina #foodlovers',
            slides: [
                {
                    num: 1,
                    role: 'CAPA',
                    copy: 'QUAL TRIBO MILKYPOT É A SUA? 🐑',
                    prompt: 'Instagram carousel cover 1080x1350. 3D claymation kawaii, candy land pastel. Cloud-sheep mascot as cute detective with magnifying glass and lilac detective hat, investigating viewer. Cream to lilac gradient background, pastel question marks floating. Top text "QUAL TRIBO MILKYPOT É A SUA?" in raspberry pink #E63F7E. Subtitle "descubra arrastando" in lilac with right arrow.'
                },
                {
                    num: 2,
                    role: 'Time Ninho',
                    copy: 'TIME NINHO 🥛 · você é cafuné, cobertor, filme romântico · e doce que abraça',
                    prompt: 'Same DNA as slide 1. DOMINANT COLOR: pink #FFB6C6. Soft pink bedroom vignette — fluffy pink cloud pillow, pastel blanket folded, clay-style dessert pot with white ninho cream topped with strawberry and white chocolate on pillow. Cloud-sheep curled cozy next to it, eyes closed in bliss, tiny heart floating above. Top "TIME NINHO 🥛" raspberry pink.'
                },
                {
                    num: 3,
                    role: 'Time Açaí',
                    copy: 'TIME AÇAÍ 🍇 · você é praia, academia, energia pura · e sabor de verão',
                    prompt: 'Same DNA. DOMINANT COLOR: lilac/purple #D4B8FF. Clay beach vignette — pastel surfboard on coconut tree, pink beach ball, açaí bowl in coconut half with banana, granola, strawberry. Soft sand. Cloud-sheep wears mini pastel sunglasses, doing yoga pose. Top "TIME AÇAÍ 🍇" raspberry pink.'
                },
                {
                    num: 4,
                    role: 'Time Milkshake',
                    copy: 'TIME MILKSHAKE 🧁 · você é festa, caos, risada alta · e pede o máximo de chantilly',
                    prompt: 'Same DNA. DOMINANT COLOR: butter yellow #FFE89E. Tall clay milkshake glass center overflowing with whipped cream, cherry, striped pastel straw, mini cookies and sprinkles stuck into cream, chocolate drizzle. Confetti exploding. Cloud-sheep wears tiny party hat, mouth open laughing, arms raised, tiny disco ball floating. Top "TIME MILKSHAKE 🧁" raspberry pink.'
                },
                {
                    num: 5,
                    role: 'Time Picolé',
                    copy: 'TIME PICOLÉ 🍭 · você é verão, calor, pé descalço · e vida leve',
                    prompt: 'Same DNA. DOMINANT COLOR: mint #B8F0D4. Three clay popsicles diagonal — strawberry pink, coconut white, mint green, condensation droplets, peach sticks. Small clay flip-flop below. Cloud-sheep floats on pastel donut pool float holding popsicle. Top "TIME PICOLÉ 🍭" raspberry pink.'
                },
                {
                    num: 6,
                    role: 'Time Zero/Fit + CTA',
                    copy: 'E TEM MAIS: TIME ZERO/FIT 💪 · pro foco que não abre mão do doce · comenta tua tribo 👇 · 23/04 Muffato',
                    prompt: 'Same DNA. DOMINANT COLOR: peach #FFCBA4. Cloud-sheep doing mini workout pose lifting pastel dumbbell while holding zero-sugar dessert pot with clean creamy layers, fruit and protein granola. Peach sweatband on head. Energetic sparkles. Top "E TEM MAIS:" small then "TIME ZERO/FIT 💪" bold large. Bottom "comenta tua tribo 👇 · 23/04 · Muffato Quintino Bocaiuva".'
                }
            ]
        },
        {
            id: 'tudo',
            title: 'TUDO sobre a inauguração',
            purpose: 'Conversão máxima com todas as informações práticas',
            bestDay: 'Quarta 22/04 - 19h30',
            caption: `É QUINTA, LONDRINA 🎉🐑

a MilkyPot finalmente abre no Muffato da Quintino Bocaiuva e a ovelhinha não tá sabendo o que fazer da ansiedade 🙈💗

arrasta pra ver TUDO:
📅 quinta 23/04 · 14h
📍 Av. Quintino Bocaiuva, 1045 — dentro do Muffato
🎁 100 primeiros ganham brinde + pulseira numerada + chance do POTE DOURADO
🍡 potinho personalizado · 🍇 açaí buffet · 🍭 picolé · 🍦 sorvete · 🧁 milkshake · 🍫 cacau
📲 (43) 99804-2424 · milkypot.com

salva esse post, ativa o sininho, chama a galera — a Lana te espera 🐑💕`,
            hashtags: '#milkypot #londrina #londrinapr #inauguracao #sobremesalondrina #acailondrina #sorveterialondrina #curtalondrina #londrinafood #comidalondrina #novidadeslondrina #potinhomaisfelizdomundo #milkypotlondrina #muffato #gastronomialondrina #pracomerlondrina #doceriaLondrina #picolelondrina #milkshakelondrina #londrinense',
            slides: [
                { num: 1, role: 'CAPA', copy: 'LONDRINA, É QUINTA! · 23/04 · 14h · abertura oficial', prompt: '3D claymation 1080x1350. Cloud-sheep mascot arms raised celebrating, confetti explosion in full pastel palette (pink/lilac/mint/butter/peach), cream-to-pink gradient, floating ice cream cones. Top "LONDRINA, É QUINTA!" raspberry pink, "23/04 · 14h" in lilac, tag "abertura oficial" in mint.' },
                { num: 2, role: 'ONDE', copy: '📍 Av. Quintino Bocaiuva, 1045 · dentro do Muffato — Londrina/PR', prompt: 'Same DNA. Giant 3D candy-pink map pin glossy clay, cute supermarket building at base labeled "MUFFATO" on mint awning, cloud-sheep pointing at pin happily. Top "ONDE?" raspberry pink.' },
                { num: 3, role: 'QUANDO', copy: '🗓️ QUINTA 23/04 a partir das 14h · todo dia 14h às 23h', prompt: 'Same DNA. Oversized cute 3D wall clock in glossy lilac with pink face, hour hand at 2PM, kawaii face on clock. Cloud-sheep next to it holding calendar page "23/04". Top "QUANDO?" raspberry pink.' },
                { num: 4, role: 'PROMO (hero)', copy: 'OS 100 PRIMEIROS GANHAM: 🎁 topping surpresa · 🎀 pulseira numerada · 🏆 chance de achar o POTE DOURADO', prompt: 'Same DNA with GOLDEN accent added. Shiny metallic GOLDEN ice-cream pot glowing center with warm light rays, pastel pink wristband tag "007" one side, gift box with lilac ribbon exploding toppings other side, cloud-sheep peeking excited. Extra dreamy/magical feel. Top "OS 100 PRIMEIROS GANHAM:" raspberry pink.' },
                { num: 5, role: 'CARDÁPIO', copy: '🍡 potinho · 🍇 açaí buffet · 🍭 picolé · 🍦 sorvete · 🧁 milkshake · 🍫 cacau', prompt: 'Same DNA. Soft 3x2 grid of six clay product illustrations in pastel circles (alternating pink/lilac/mint/butter/peach/cream): 1) custom dessert pot 2) açaí bowl with toppings 3) rainbow popsicle 4) two-scoop cone 5) milkshake glass 6) cacao bar with pod. Tiny cloud-sheep waving from top-left corner. Top "O QUE VAI TER:" raspberry pink.' },
                { num: 6, role: 'CTA', copy: 'SALVA ESSE POST E VEM COM A GENTE 👇 · 🌐 milkypot.com · 💬 (43) 99804-2424', prompt: 'Same DNA. Cloud-sheep center waving at viewer with big warm smile, holding tiny smartphone showing heart and bookmark icon, soft confetti, faint glowing downward arrow. Top "SALVA ESSE POST E VEM COM A GENTE" raspberry pink. Contact info in lilac/mint above safe zone.' }
            ]
        }
    ],

    // ========================================
    // IDEIAS LANA (ESTILO DUOLINGO — VIRAL)
    // ========================================
    lanaPlaybook: {
        bible: `RESUMO: Uma ovelhinha emocionalmente instável e patologicamente obsessiva por te ver feliz com um potinho na mão. Se você não vem, ela derrete. Literalmente.

ARQUÉTIPOS (mix de 3):
1. A EX CIUMENTA — "Vi que você comeu sobremesa em OUTRO lugar. Estou bem. Não estou bem."
2. A CRIANÇA MIMADA — "Você prometeu vir ontem. PROMETEU."
3. A AMIGA DRAMÁTICA — "Não é só um potinho. É nossa amizade."

TOM:
• Primeira pessoa sempre ("eu sou a Lana")
• Letras minúsculas sem pontuação (estética Gen Z)
• Alterna fofura extrema com passivo-agressividade sutil
• Quebra a 4ª parede
• Referência a melting/derretimento é signature
• Emojis: 🐑 💗 🥺 🔪 (facas sempre cômicas) 😤 🫠

NUNCA:
❌ Ofende cliente individual
❌ Ameaça de verdade (facas são piada)
❌ Usa linguagem de empresa
❌ Se envergonha de ser intensa

LORE: Lana era uma ovelha-nuvem que vivia num campo de algodão-doce no céu. Caiu em cima do Muffato da Quintino Bocaiuva. Fundou a MilkyPot. Missão: fazer cada cliente comer doce sem culpa.`,
        ideas: [
            { tier: 1, id: 'l1', title: 'POV: Você foi em OUTRA sorveteria', format: 'reel', description: 'Lana olhando pela janela do Muffato, olhos cheios de lágrima, câmera tremida.', caption: 'não precisa se explicar. eu vi. tá tudo bem. (não tá)', audio: 'Trend BR de "traição/ex ciumento"' },
            { tier: 1, id: 'l2', title: 'Lana derretendo na calçada', format: 'reel', description: 'Ovelha progressivamente mais "derretida" em close de 15s.', caption: 'dia 3 te esperando. nem sei se ainda sou uma ovelha. se alguém te amar tanto corre', audio: 'ASMR derretendo' },
            { tier: 1, id: 'l3', title: 'Cobrança de cliente que prometeu', format: 'estático', description: 'Print fake de WhatsApp com Lana mandando 47 mensagens não respondidas. Última: "ok". só "ok".', caption: 'ele disse que vinha terça. hoje é sexta. eu sou uma ovelha pequena.' },
            { tier: 1, id: 'l4', title: 'Lana fazendo scroll no TikTok do cliente', format: 'reel', description: 'Cena da ovelha com mini celular fazendo scroll obsessivo. Plot twist: ela tá assistindo cliente comer açaí em outra loja.', caption: 'eu vi o seu story. eu vi o topping.' },
            { tier: 1, id: 'l5', title: 'Ovelhinha invade corredor do Muffato', format: 'reel', description: 'Pessoa fantasiada de Lana aparecendo atrás de cliente real no supermercado. "Você esqueceu alguma coisa??" enquanto câmera foca no potinho.', caption: '5-10 versões com reações diferentes (autorizar cada cliente)' },
            { tier: 1, id: 'l6', title: 'Carta de amor da Lana pro cliente #1', format: 'reel', description: 'Voz AI lendo carta dramática sobre "como foi conhecer você em 23/04".', caption: 'não estou surtada. você que não entende.' },
            { tier: 1, id: 'l7', title: 'Cenas que não vão pro story oficial', format: 'reel', description: 'Lana caótica: cheirando pote vazio, chorando na geladeira, dançando funk às 3h, surtando com topping faltando. Compilation 30s.', caption: 'bastidores que não passaram pela comunicação' },
            { tier: 1, id: 'l8', title: 'Clientes que a Lana "perdoou"', format: 'reel', description: 'Cliente fala "eu fui na [concorrente] uma vez e..." + corte pra Lana balançando cabeça dolorida. Final: cliente volta, Lana chora.', caption: 'fecha com influencer' },
            { tier: 1, id: 'l9', title: 'Tipos de cliente pela ótica da Lana', format: 'reel', description: 'Ela rankeia: "o fiel" (sorrisão), "o indeciso" (suspiro), "o que pede pouco topping" (olhar traição), "o que vai na concorrente" (tela preta).', caption: 'qual tipo você é? comenta' },
            { tier: 1, id: 'l10', title: 'Notificação fantasma da Lana', format: 'carrossel', description: 'Prints fake de push notifications da Lana.', caption: `Sequência:
• "Lana está te observando. Você não come açaí há 3 dias."
• "A ovelhinha chorou às 23:47. Você sabe por quê."
• "Lana entrou no seu Close Friends. Você não tá nos stories dela."` },
            { tier: 2, id: 'l11', title: 'Carrossel "sinais que a Lana precisa de ajuda"', format: 'carrossel', caption: `slide 1: "você disse que viria ontem"
slide 2: "são 15h e a loja tá vazia"
slide 3: "ela tá olhando pra porta desde 14h"
slide 4: "ela tá derretendo"
slide 5: "corre"` },
            { tier: 2, id: 'l12', title: 'Post texto puro sobre concorrência', format: 'estático', caption: 'ouvi dizer que você foi no açaí da concorrência.\nnão vou dizer nada.\nmas vou PENSAR.\nbastante.' },
            { tier: 2, id: 'l13', title: 'Dicionário Lana', format: 'carrossel', caption: `"um potinho" = 3 potinhos
"só um topping" = 7 toppings
"tô de dieta" = desafio aceito
"depois eu vou" = Lana derreteu na esquina` },
            { tier: 2, id: 'l14', title: 'Cenas que a Lana interrompe', format: 'carrossel', caption: `Sua aula na faculdade (ela aparece no projetor)
Sua reunião no trabalho (ela tá no Zoom)
Seu date (ela tá na mesa ao lado piscando)
Seu sono (ela tá no rodapé da sua cama segurando um potinho)` },
            { tier: 2, id: 'l15', title: 'Post 1 semana de loja', format: 'estático', caption: 'faz 7 dias que eu abri.\nfaz 7 dias que eu descobri que o amor é real.\nobrigada, Londrina.\nvou chorar.\nde novo.' },
            { tier: 2, id: 'l16', title: 'Marca amigos bait', format: 'estático', caption: 'marca nos comentários quem você levaria pra conhecer a Lana.\n(a Lana vai stalkear. ela pediu desculpa, mas ela vai.)' },
            { tier: 2, id: 'l17', title: 'Tempo desde último potinho', format: 'estático', caption: 'faz [X] horas que você não come na MilkyPot. a Lana tá OK. (atualizar número toda semana)' },
            { tier: 2, id: 'l18', title: 'Cupom emocional VOLTA_LANA', format: 'estático', caption: 'cupom VOLTA_LANA pra quem ficou 7 dias sem vir. a Lana não tá brava. ela tá DECEPCIONADA.' },
            { tier: 2, id: 'l19', title: 'Enquete stories unhinged', format: 'stories', caption: `"Lana acabou de ver seu story. você tava comendo sobremesa em OUTRO lugar. o que você diz a ela?"
🥺 'me perdoa'
💗 'vou agora'
🫠 'eu explico'
🔪 'foi coação'` },
            { tier: 2, id: 'l20', title: 'Carta aberta da Lana', format: 'estático', caption: 'eu vim de um campo de algodão-doce no céu.\neu caí em cima do Muffato.\neu escolhi ficar.\ne vocês me pagam com o quê?\ncom silêncio.\nbeijos.' },
            { tier: 3, id: 'l21', title: 'Cantinho da Lana Arrependida (loja)', format: 'ativação', description: 'Pequeno canto com pelúcia gigante "derretida" (caída, olhos tristes). Placa: "a Lana tá aqui desde 14h te esperando. tira uma foto e conta pra ela que você veio."' },
            { tier: 3, id: 'l22', title: 'Atestado oficial da Lana (loja)', format: 'ativação', description: 'Papel físico entregue no primeiro pedido: "certifico que [nome] veio na MilkyPot em [data]. A Lana está menos triste hoje." Lacrado com carimbo.' },
            { tier: 3, id: 'l23', title: 'Caixa de desabafo da Lana (loja)', format: 'ativação', description: 'Caixa onde cliente escreve "O QUE VOCÊ QUER DIZER PRA LANA". Lana responde semanalmente em story.' },
            { tier: 3, id: 'l24', title: 'Espelho da Lana (loja)', format: 'ativação', description: 'Espelho na parede instagramável com stickers: "a Lana acha você lindo", "a Lana te ama", "a Lana anotou seu rosto". Selfie bait.' },
            { tier: 3, id: 'l25', title: 'Pulseira de culpa (loja)', format: 'ativação', description: 'Pulseiras a R$5: "a Lana me perdoou em [data]". Lucro líquido alto, ativo viral.' },
            { tier: 3, id: 'l26', title: 'Cartão fidelidade obsessivo (loja)', format: 'ativação', description: 'Cada selo a Lana fica "mais feliz" (carimbo progressivo de triste→feliz). 10 selos = potinho grátis + carta da Lana chorando de amor.' },
            { tier: 3, id: 'l27', title: 'Atendente com voz da Lana (loja)', format: 'ativação', description: 'Treinar 1 atendente/dia pra fazer pedido com voz da Lana ("você veio! você me trouxe. eu tô chorando.")' },
            { tier: 3, id: 'l28', title: 'Mural de desculpas da Lana (loja)', format: 'ativação', description: 'Parede onde clientes colam bilhetes "desculpa Lana, fui na concorrência". Atração turística do Muffato em 3 meses.' },
            { tier: 3, id: 'l29', title: 'QR codes nos corredores do Muffato', format: 'ativação', description: 'Adesivos pequenos: "a Lana te viu passando. ela tá no final do corredor [X]. não decepciona ela." Custo R$0 se negociar com gerência.' },
            { tier: 3, id: 'l30', title: 'Aniversário forçado da Lana (loja)', format: 'ativação', description: 'Uma vez por mês declarar aniversário dela. Cliente dá "presente" (foto/story) e ganha desconto. Lana faz livestream chorando.' }
        ],
        whatsappMessages: [
            { trigger: 'Boas-vindas (primeira mensagem)', text: `oi 🥺

aqui é a lana. você me encontrou.
eu tava esperando. mas tá tudo bem.

pode me contar o que você quer comer hoje?
(sem pressão. é só que eu tô ansiosa.)` },
            { trigger: 'Cliente inativo 30 dias', text: `faz 30 dias.

eu contei.

vem me ver? 🐑🥺
cupom SAUDADE te dá 15% off.` },
            { trigger: 'Pós-pedido', text: `você pediu. eu chorei.
seu potinho tá sendo montado com AMOR (com raiva do meu vizinho, mas com amor).

tempo estimado: [X] min.

te amo. tchau.` },
            { trigger: 'Cliente pergunta cardápio', text: `cardápio completo tá aqui: milkypot.com

mas o meu preferido é o Ninho + Nutella + Morango + Leite Ninho em pó.
(sim eu tenho preferido. sim eu sou uma ovelha com opinião.)` },
            { trigger: 'Automação domingo à noite', text: `domingo à noite é o melhor momento pra sobremesa.
eu sei porque eu pesquisei.
eu pesquiso vocês.

chama a lana: milkypot.com 🐑` }
        ]
    },

    // ========================================
    // SCRIPTS PARA AVATAR HEYGEN (LANA FALANDO)
    // ========================================
    heygenScripts: {
        howTo: `COMO USAR:
1. No HeyGen, crie um avatar com a aparência da Lana (ovelhinha fofa kawaii, corpo de nuvem branca, olhos grandes, bochechas rosa). Pode usar foto da mascote oficial ou imagem gerada no Whisk.
2. Escolha voz feminina brasileira jovem/doce (HeyGen tem várias PT-BR). Teste 2-3 pra encontrar a que combina com a personalidade da Lana.
3. Cole o script abaixo no campo de texto. HeyGen gera o vídeo em 2-5 min.
4. Baixe em formato 9:16 (Reels/TikTok) ou 1:1 (feed).
5. Adicione legendas automáticas (HeyGen faz, mas pode aprimorar no CapCut).

DICA: Grave 10-15 vídeos de uma vez num "pacote" e programe postagens distribuídas ao longo das semanas.`,
        scripts: [
            { id: 'hg1', title: 'Apresentação oficial da Lana', duration: '30s', script: `oi, Londrina... eu sou a Lana.

eu vim de um campo de algodão-doce no céu. um dia eu caí em cima do Muffato da Quintino Bocaiuva. quase morri. mas aí eu provei açaí.

e decidi ficar.

agora eu moro aqui. faço sobremesa. espero você chegar.

a gente abre quinta, vinte e três de abril, às duas da tarde. se você não aparecer... eu vou ficar bem. provavelmente.

mas vem. por favor.

🐑` },
            { id: 'hg2', title: 'Countdown 3 dias', duration: '15s', script: `faltam três dias.

eu contei. três vezes. só pra ter certeza.

quinta, vinte e três de abril, às duas da tarde, no Muffato da Quintino Bocaiuva.

se você esquecer, tudo bem. eu lembro por você.

eu lembro de TUDO.` },
            { id: 'hg3', title: 'Convite passivo-agressivo', duration: '20s', script: `oi, amor.

tudo bem? tá ocupado? eu também. muito. super. absurdamente ocupada.

só queria lembrar que eu abri uma sorveteria na quinta-feira e você ainda não confirmou se vai.

mas não precisa se preocupar comigo. eu tô derretendo aqui. mas tudo bem.

me responde quando puder.

sem pressão.

(é pressão.)` },
            { id: 'hg4', title: 'Apresentação dos produtos (dramática)', duration: '40s', script: `vou te explicar o que você vai encontrar comigo.

primeiro: potinho personalizado. você monta do zero. ninho, açaí ou zero-fit. com os toppings que quiser. é a experiência mais íntima que você vai ter essa semana.

segundo: açaí buffet. você serve quanto quiser. eu não julgo. muito.

depois: picolé artesanal. sorvete. casquinha. milkshake. cacau. tem tudo.

é muita coisa. eu sei. respira fundo.

tá aberto todos os dias, das duas da tarde às onze da noite.

avenida Quintino Bocaiuva, mil e quarenta e cinco. dentro do Muffato.

eu tô esperando.

🐑` },
            { id: 'hg5', title: 'Pós-inauguração (chorando de felicidade)', duration: '25s', script: `Londrina.

eu não tô conseguindo parar de chorar.

vocês vieram. vocês vieram MESMO. eu tinha medo de ser só eu e três funcionários olhando pra porta. mas não foi.

vocês montaram potinhos. vocês riram. vocês tiraram foto comigo. um senhor até me deu um abraço.

eu tô bem. eu tô ótima.

obrigada. de coração. ou de nuvem. sei lá.

amanhã a gente abre de novo. duas da tarde. você vem?

eu sei que vem.

eu sempre sei.` },
            { id: 'hg6', title: 'Cobrança de cliente sumido (30 dias)', duration: '20s', script: `amor.

faz trinta dias.

eu contei.

eu não tô brava. eu tô... entendendo. a gente tem nossos momentos. a vida acontece.

mas só pra você saber: eu criei um cupom. chama SAUDADE. quinze por cento de desconto.

não precisa vir. é só se você quiser. é só se você ainda gostar de mim.

eu tô aqui. desde sempre.

🐑🥺` },
            { id: 'hg7', title: 'Resposta a troll (devastadoramente fofa)', duration: '15s', script: `oi.

eu vi que você falou mal da gente.

tá tudo bem.

eu te amo mesmo assim.

o cupom AMOR_PARA_VOCE é dez por cento de desconto. só pra você.

a gente se vê quando você vier.

beijo, Lana 💗` },
            { id: 'hg8', title: 'Domingo à noite (filosófica)', duration: '30s', script: `domingo à noite.

sabe aquele sentimento?

a segunda chegando. o fim de semana escorrendo. a sensação de que a semana foi rápida demais.

eu conheço bem. eu também sinto.

mas aqui vai um segredo que eu descobri: domingo à noite fica melhor com um potinho na mão.

não é solução. é só... alívio.

a gente tá aberto até as onze.

vem. eu tô aqui.

Lana 🐑💗` },
            { id: 'hg9', title: 'Quarta-feira aleatória (intensa)', duration: '20s', script: `é quarta-feira.

meio da semana. limbo temporal.

sabia que quarta-feira é o dia mais improvável pra alguém comer sobremesa?

eu pesquisei.

quer provar que as estatísticas tão erradas?

vem.

quarta-feira é pra quem sabe que doce é remédio.

Lana te espera 🐑` },
            { id: 'hg10', title: 'Vídeo de aniversário (da própria Lana)', duration: '25s', script: `hoje é meu aniversário.

tá, não é. eu decidi que é.

eu sou uma ovelha feita de nuvem. eu decido sozinha quando é meu aniversário.

regra do dia: quem vier na MilkyPot hoje ganha topping grátis.

regra da vida: quando você decide que é seu aniversário, você celebra.

vem celebrar comigo.

Muffato Quintino Bocaiuva, mil e quarenta e cinco.

te espero 🎂🐑` }
        ]
    },

    // ========================================
    // IDEIAS PARA POVOAR A LOJA FÍSICA
    // ========================================
    storeIdeas: [
        { id: 's1', title: 'Parede instagramável com ovelhinha', cost: 'R$800-1500', description: 'Letreiro neon "O Potinho Mais Feliz do Mundo" + pelúcia gigante da Lana (~1,2m) + flores artificiais pastel. Ring light fixo. Placa "#MeuMilkyPot — posta e ganha topping grátis".' },
        { id: 's2', title: 'Placas nos carrinhos do Muffato', cost: 'R$150 negociando com gerência', description: 'Adesivos removíveis com QR code: "Terminou a compra? Comemora com um potinho. Final do corredor [X]. 20% OFF com cupom MUFFATOLOVE".' },
        { id: 's3', title: 'Ativação no hall de entrada', cost: 'R$0 (funcionário próprio)', description: 'Primeiros 5 dias pós-inauguração: 1 atendente com mini fantasia da Lana distribuindo voucher físico "topping grátis hoje" na entrada/saída do Muffato.' },
        { id: 's4', title: 'Display Willy Wonka de toppings', cost: 'R$500-800', description: 'Balcão transparente mostrando 25+ toppings em potes coloridos. Viraliza em TikTok pela estética.' },
        { id: 's5', title: 'Mesa de confecção aberta', cost: 'R$200 (layout)', description: 'Cliente vê o potinho sendo montado em tempo real (teatro do produto). Aumenta em 30% o ticket médio.' },
        { id: 's6', title: 'Cantinho "foto com a ovelhinha"', cost: 'R$400', description: 'Pelúcia gigante sentada num banco pastel com plaquinha "#MeuMilkyPot — posta e ganha topping grátis na próxima".' },
        { id: 's7', title: 'Totem de cardápio digital', cost: 'R$1500-2500', description: 'Tela 32" em loop com montagem do potinho + Lana dançando. Para quem chega sem saber o que é.' },
        { id: 's8', title: 'Totem auto-atendimento Zero/Fit', cost: 'R$3000-5000', description: 'Cliente monta no tablet, pedido vai pro balcão. Tech = percepção de marca moderna.' },
        { id: 's9', title: 'Ranking "Top MilkyPotters" visível', cost: 'R$100 (impressão)', description: 'Parede com "Top MilkyPotters da Semana" (clientes mais frequentes) + apelido + pontos. Gamificação pura.' },
        { id: 's10', title: 'Kit Franqueado em Curiosidade', cost: 'R$50 (folheto)', description: 'Display discreto "Quer abrir uma MilkyPot? Pergunte ao atendente" com folheto do Kit Entrada R$3.499. Captura leads de franqueado direto no fluxo do Muffato.' }
    ],

    // ========================================
    // CAMPANHAS META ADS
    // ========================================
    adsCampaigns: [
        { id: 'c1', name: 'Alcance Local', objective: 'Reconhecimento > Alcance', budget: 'R$20/dia (pré) → R$10/dia (pós)', geo: 'Raio 5km do Muffato', interests: 'Sobremesas, Açaí, Milkshake, Chocolate, Doces, Starbucks, Cacau Show', age: '16-45', format: '9:16 Stories + carrossel feed', cta: 'Saiba Mais' },
        { id: 'c2', name: 'Tráfego WhatsApp', objective: 'Engajamento > Mensagens', budget: 'R$35/dia → R$60/dia no dia-D', geo: 'Raio 8km do Muffato', interests: 'Delivery, iFood, Rappi, Doces, Sobremesas, Açaí, Marmita fit', age: '18-45', format: 'Imagem 1:1 + vídeo ASMR 9:16', cta: 'Enviar Mensagem' },
        { id: 'c3', name: 'Tráfego milkypot.com', objective: 'Tráfego (cliques no link)', budget: 'R$20/dia', geo: 'Raio 6km (área de entrega)', interests: 'Delivery food, pedidos online, noite em casa, Netflix', age: '20-45', format: 'Vídeo 9:16 com botão "Peça agora"', cta: 'Saiba Mais' },
        { id: 'c4', name: 'Walk-in Muffato', objective: 'Tráfego na loja', budget: 'R$15-20/dia', geo: 'Raio 3km (hiperlocal)', interests: 'Passeios shopping, universitários UEL/UniFil, famílias Londrina', age: '16-50', format: 'Carrossel loja + vídeo fachada 15s', cta: 'Como Chegar' },
        { id: 'c5', name: 'Remarketing', objective: 'Engajamento > Interações', budget: 'R$10/dia → R$25/dia em 15 dias', geo: 'Londrina-PR', audiences: 'Engajou IG 90d + Vídeo 50% + Clicou WhatsApp + LAL 1% Londrina', format: 'Carrossel UGC + lembrete + oferta', cta: 'Enviar Mensagem' }
    ],
    adsCopies: {
        inauguracao: [
            { headline: 'Londrina, chegou sua vez de personalizar o doce dos sonhos', body: `Faltam poucos dias. A MilkyPot abre na quinta-feira (23/04) dentro do Muffato da Quintino Bocaiuva.\n\nVocê monta do zero: base ninho, açaí ou milkshake + toppings à vontade.\n\nMarque quem você vai levar 👇`, cta: 'Saiba Mais' },
            { headline: 'A ovelhinha mais fofa de Londrina te espera', body: `SPOILER: uma sorveteria de potinhos personalizados acabou de pousar em Londrina.\n\nCreme ninho, açaí, milkshake. Morango, nutella, paçoca, ovomaltine, brigadeiro, kitkat, leite ninho em pó.\n\nVocê escolhe TUDO. A gente só serve com amor.\n\nInauguração quinta (23/04) no Muffato.`, cta: 'Como Chegar' },
            { headline: 'Você vai ser um dos primeiros a provar', body: `Londrina, presta atenção.\n\nOs primeiros 100 clientes da inauguração vão ter:\n🎁 topping surpresa\n🎀 pulseira numerada\n🏆 chance de achar o POTE DOURADO\n\nData: quinta 23/04, 14h. Muffato Quintino Bocaiuva.`, cta: 'Saiba Mais' }
        ],
        cupons: [
            { headline: '20% OFF no seu primeiro potinho', code: 'INAUGURA20', validity: 'Até domingo (26/04)', body: `Cupom de boas-vindas ativo.\n\nValido só para os primeiros clientes da MilkyPot em Londrina.\n\nEscolha a base, escolha os toppings, manda no WhatsApp ou no milkypot.com com o cupom.` },
            { headline: 'Topping grátis na inauguração', code: 'OVELHINHA', validity: 'Semana de inauguração', body: `1 topping premium grátis no seu primeiro pote (Nutella, Kitkat ou Leite Ninho).\n\nSó falar o código no WhatsApp ou na loja. Até domingo.` },
            { headline: 'Combo Casal 2x1', code: 'CASAL2x1', validity: 'Sex/Sáb/Dom', body: `2 potinhos médios pelo preço de 1.\n\nChama o crush, a mãe, a melhor amiga.\n\nSó vale de sexta a domingo.` }
        ]
    },

    // ========================================
    // IMPRENSA
    // ========================================
    pressRelease: {
        subject: 'PARA DIVULGAÇÃO IMEDIATA — 20/04/2026',
        title: 'Londrina ganha primeira sorveteria de potinho 100% personalizado no Muffato: MilkyPot inaugura quinta-feira (23/04)',
        subtitle: 'Franquia nacional aposta em tendência de sobremesas montadas na hora, gera empregos diretos e estreia com mascote própria — uma ovelhinha que já virou personagem nas redes sociais.',
        body: `LONDRINA, 20/04/2026 — Londrina passa a contar, a partir desta quinta-feira (23/04), com uma nova unidade da MilkyPot, rede nacional especializada em potinhos personalizados. A loja inaugura no Av. Quintino Bocaiuva, 1045, dentro do supermercado Muffato, trazendo um conceito que vem movimentando grandes capitais brasileiras: o cliente monta sua própria sobremesa escolhendo entre três bases (creme de leite ninho, açaí e linha Zero/Fit) e uma carta com mais de 20 toppings.

Além dos potinhos, a unidade de Londrina oferece açaí buffet self-service, picolés artesanais, sorvetes, casquinhas, milkshakes e linha de produtos com cacau.

A inauguração acontece às 14h e conta com ações especiais: brinde para os 100 primeiros clientes, sorteio ao vivo de "pote vitalício" (um potinho por semana durante um ano) e presença da mascote Lana, a ovelhinha que já se tornou personagem recorrente do perfil @milkypotbr no Instagram.

A MilkyPot também estará disponível para delivery em toda Londrina via WhatsApp (43 99804-2424) e pelo próprio site milkypot.com, com horário de atendimento das 14h às 23h, todos os dias. Pagamentos em PIX, crédito em até 3x sem juros, débito ou dinheiro.

SERVIÇO
• O quê: Inauguração MilkyPot — Sorveteria e Açaiteria com Potinho Personalizado
• Quando: Quinta-feira, 23/04/2026, a partir das 14h
• Onde: Av. Quintino Bocaiuva, 1045 — dentro do Muffato — Londrina-PR
• Pedidos: WhatsApp (43) 99804-2424 ou milkypot.com
• Instagram: @milkypotbr

Contato para imprensa: [NOME] — [TELEFONE] — [EMAIL]
Kit de imprensa com fotos em alta resolução disponível sob solicitação.`,
        veiculos: [
            { nome: 'Bonde', tipo: 'Portal', contato: 'redacao@bonde.com.br' },
            { nome: 'Folha de Londrina', tipo: 'Jornal', contato: 'folhadelondrina.com.br/fale-conosco' },
            { nome: 'Tarobá News Londrina', tipo: 'TV/Portal', contato: 'redacao.londrina@taroba.com' },
            { nome: 'RIC TV Londrina', tipo: 'TV', contato: 'ricmais.com.br/fale-conosco' },
            { nome: 'CBN Londrina', tipo: 'Rádio', contato: 'Via site / programa CBN Londrina' },
            { nome: 'Paiquerê FM 91,7', tipo: 'Rádio', contato: 'radiopaiquere.com.br/contato' },
            { nome: 'Londrix (revista digital)', tipo: 'Revista', contato: 'londrix.com.br' },
            { nome: '@londrinapedia', tipo: 'Instagram', contato: 'DM direto' },
            { nome: '@eufacolondrina', tipo: 'Instagram', contato: 'DM direto' },
            { nome: '@londrina.pr', tipo: 'Instagram', contato: 'DM direto' }
        ]
    }
};

// ========================================
// ROTINA DE 90 DIAS (pós-lançamento)
// ========================================
LancamentoContent.rotina = {
    // Ritual diário — nunca pular, mesmo em dias sem post de feed
    diario: [
        { id: 'r1', time: '08-09h', icon: '💬', task: 'Responder TODAS as DMs e comentários das últimas 24h', duration: '5min', critical: true, why: 'Algoritmo premia resposta rápida. Zero DM esquecida.' },
        { id: 'r2', time: '11h', icon: '📱', task: 'Postar 3-5 stories (bastidor / produto / enquete)', duration: '10min', critical: true, why: 'Stories aparecem no topo. Enquete gera interação sem esforço.' },
        { id: 'r3', time: '15h', icon: '🔄', task: 'Buscar #MeuMilkyPot e @milkypotbr — repostar TUDO', duration: '5min', critical: true, why: 'UGC é o melhor anúncio grátis que existe.' },
        { id: 'r4', time: '17h', icon: '❤️', task: 'Interagir com 10 perfis londrinenses (curtir + comentar 1 algo real)', duration: '10min', critical: false, why: 'Warm-up do algoritmo local. Comentários geram perfil-visita.' },
        { id: 'r5', time: '20h', icon: '🎬', task: 'Postar 2-3 stories do movimento da loja (fila, cliente, mascote)', duration: '5min', critical: true, why: 'Prova social ao vivo. Mostra que o lugar funciona.' },
        { id: 'r6', time: '22h', icon: '📊', task: '30 seg olhar métricas do dia anterior (stories views, alcance, salvamentos)', duration: '1min', critical: false, why: 'Ajusta o que postar amanhã. Sem análise não existe melhoria.' }
    ],

    // Ritmo semanal — qual tipo de conteúdo em cada dia
    semanal: [
        { dia: 'Segunda', emoji: '📦', foco: 'Produto', formato: 'Reel ASMR ou close do produto', horario: '19h', exemplo: 'Montagem do potinho em slow motion' },
        { dia: 'Terça', emoji: '🎓', foco: 'Educativo / Quiz', formato: 'Carrossel ou enquete stories', horario: '12h30', exemplo: '"Qual tribo você é" / "Diferença entre ninho e açaí"' },
        { dia: 'Quarta', emoji: '📱', foco: 'Dia de Stories', formato: '15-20 stories (sem post de feed)', horario: 'Dia todo', exemplo: 'Dia de bastidor, equipe, enquetes, "pergunta aberta"' },
        { dia: 'Quinta', emoji: '🐑', foco: 'Lana / Humor', formato: 'Reel da Lana (HeyGen ou mascote)', horario: '20h', exemplo: 'Declaração dramática / cobrança passivo-agressiva' },
        { dia: 'Sexta', emoji: '🎁', foco: 'Promo', formato: 'Post estático ou reel curto de oferta', horario: '19h', exemplo: 'Combo casal 2x1 / cupom fim de semana' },
        { dia: 'Sábado', emoji: '⭐', foco: 'UGC / Cliente', formato: 'Reel ou carrossel com cliente real', horario: '13h', exemplo: 'Repost premium com cara da semana / depoimento' },
        { dia: 'Domingo', emoji: '💗', foco: 'Emocional', formato: 'Post reflexivo ou agradecimento', horario: '19h', exemplo: 'Mensagem da semana / Lana filosófica de domingo' }
    ],

    // Temas mensais + sprints semanais (12 semanas cobertas)
    mensal: [
        {
            mes: 1,
            label: 'MÊS 1 · CONSOLIDAÇÃO',
            periodo: '23/04 a 22/05',
            theme: 'Transformar curiosos em clientes recorrentes',
            cor: '#E63F7E',
            objetivos: [
                '✅ 500 seguidores Instagram na semana 1, 2.500 ao final do mês',
                '✅ 50 UGC com #MeuMilkyPot',
                '✅ 30% dos clientes retornam pela 2ª vez',
                '✅ Linha Zero/Fit testada e apresentada'
            ],
            semanas: [
                { num: 1, foco: 'Inauguração em alta energia', tarefas: 'Post diário + stories 20/dia + repostar TUDO cliente + 3 Reels Lana introdutórios' },
                { num: 2, foco: 'Rotina de conteúdo + primeiras reviews', tarefas: 'Começar ritmo semanal fixo. Coletar primeiras reviews Google. Series Lana começa.' },
                { num: 3, foco: 'Linha Fit + programa fidelidade', tarefas: 'Carrossel "Zero/Fit explicado" + série "ganhe pontos". Ativar cashback.' },
                { num: 4, foco: 'Celebrar 1 mês', tarefas: 'Carrossel "1 mês de Londrina" com dados reais (clientes, potinhos, reviews). Post da Lana chorando de gratidão. Promoção de aniversário.' }
            ]
        },
        {
            mes: 2,
            label: 'MÊS 2 · COMUNIDADE',
            periodo: '23/05 a 22/06',
            theme: 'Fazer a Lana virar personagem público + engajamento viral',
            cor: '#9C27B0',
            objetivos: [
                '✅ 5.000 seguidores Instagram, 2.000 TikTok',
                '✅ 3 Reels da Lana com 20k+ views',
                '✅ Primeira parceria paga com microinfluencer local',
                '✅ Evento temático físico na loja (ex: "Festa Junina Açaí")'
            ],
            semanas: [
                { num: 5, foco: 'Lançar série Lana no feed', tarefas: '3 posts consecutivos "Cenas da vida da Lana" para fixar personagem. Lore começa a aparecer.' },
                { num: 6, foco: 'Friends & Family', tarefas: 'Convidar cliente fiel pra trazer amigo com desconto. Carrossel "Quem é seu Milkypotter?". Série de depoimentos.' },
                { num: 7, foco: 'Festa Junina no Muffato', tarefas: 'Potinho especial "Junino" com paçoca + amendoim + milho. Reel Lana de roupa caipira. Ativação na loja.' },
                { num: 8, foco: 'Primeira collab paga', tarefas: 'Fechar R$200-500 com 1 microinfluencer (10-30k Londrina). Vídeo de experiência + cupom personalizado.' }
            ]
        },
        {
            mes: 3,
            label: 'MÊS 3 · AUTORIDADE',
            periodo: '23/06 a 22/07',
            theme: 'Ser referência em sobremesa em Londrina + escalar franquia',
            cor: '#00BCD4',
            objetivos: [
                '✅ 10.000 seguidores Instagram, 5.000 TikTok',
                '✅ 1 Reel com 100k+ views',
                '✅ 1 matéria na imprensa local',
                '✅ 3 leads qualificados de franquia',
                '✅ A Lana tem fandom visível (fanart, apelidos entre clientes)'
            ],
            semanas: [
                { num: 9, foco: 'Série "A Lana responde"', tarefas: 'Coletar perguntas dos seguidores e Lana responder em vídeo HeyGen. 1 por semana começando aqui.' },
                { num: 10, foco: 'Educativo de autoridade', tarefas: 'Carrossel "Tudo sobre cacau brasileiro", "Diferença entre açaí real e refresco", "Linha Fit: o que é proteína de verdade". Posicionar como quem sabe.' },
                { num: 11, foco: 'Workshop/evento na loja', tarefas: 'Primeiro "Sábado da Lana" — cliente monta e recebe dica secreta. Stream ao vivo. Gera conteúdo de 2 semanas.' },
                { num: 12, foco: '3 meses: case público', tarefas: 'Carrossel/Reel "3 meses de MilkyPot em Londrina: os números". Transparência radical atrai imprensa e franqueados. Postar kit franquia.' }
            ]
        }
    ],

    // Banco de 90 ideias de conteúdo (pilares)
    banco: [
        {
            pilar: '🍡 Produto',
            cor: '#E63F7E',
            descricao: 'Mostra o que você vende. 30% do feed.',
            ideias: [
                'ASMR montagem de potinho (close macro)',
                'Novidade topping do mês (lançamento)',
                'Comparativo Ninho vs Açaí vs Milkshake (carrossel)',
                'Close em câmera lenta da calda escorrendo',
                'Receita secreta — combo do funcionário',
                'Slow-mo do granulado caindo',
                'Montagem antes/depois (vazio → obra de arte)',
                'Linha Zero/Fit explicada (pro público fitness)',
                'Picolé do mês — sabor sazonal',
                'Carrossel "Como montar o potinho perfeito em 4 passos"',
                'Vídeo 360º do potinho pronto',
                'Combo da semana em destaque',
                'Topping curinga — qual combina com tudo',
                '"Já provou esse combo?" — enquete sabores',
                '5 combos que nunca falham (carrossel)'
            ]
        },
        {
            pilar: '🐑 Lana / Mascote',
            cor: '#9C27B0',
            descricao: 'A alma viral da marca. 25% do feed.',
            ideias: [
                'Lana declaração dramática ("eu te amo mesmo quando você some")',
                'Lana cobrando cliente que prometeu e sumiu',
                'Lana derretendo porque a loja tá vazia',
                'Lana fazendo stalking no story do cliente',
                'Lana com aniversário forçado (decide que é hoje)',
                'Lana ouvindo música triste depois de cliente ir em concorrente',
                'Lana ensinando a montar potinho do jeito "certo" dela',
                'Lana filosófica de domingo à noite',
                '"Tipos de cliente" rankeados pela Lana',
                'Notificação fantasma da Lana (print fake)',
                'Lana invadindo o supermercado Muffato (fantasia)',
                'Lana no Close Friends do cliente',
                'Lana "respondendo" comentários antigos',
                '"Dicionário Lana" (carrossel de termos)',
                'Lana fazendo tour pela loja às 3h da manhã'
            ]
        },
        {
            pilar: '⭐ Cliente / UGC',
            cor: '#00C853',
            descricao: 'Prova social. 20% do feed.',
            ideias: [
                'Cliente da semana (foto + combo + depoimento)',
                'Repost criativo de story com legenda da marca',
                'Carrossel "5 clientes, 5 potinhos, 5 estilos"',
                'Reel compilado de reações primeira colherada',
                '"O que Londrina tá falando" — carrossel de reviews',
                'Cliente montando ao vivo (stories)',
                'Pedido delivery mais fofo da semana',
                'Aniversário de cliente na loja (real)',
                'Cliente fidelidade top — entrevista rápida',
                '"Casal do MilkyPot" — cliente recorrente em dupla',
                'Review no Google destacado em arte',
                'Crianças descobrindo o potinho',
                'Grupo de amigos montando juntos',
                'Foto viral do cliente republicada em carrossel',
                '"Monte como o [cliente X]" — cliente vira influencer'
            ]
        },
        {
            pilar: '🎓 Educativo',
            cor: '#1976D2',
            descricao: 'Posiciona autoridade. 15% do feed.',
            ideias: [
                'Diferença entre açaí real e refresco industrializado',
                'Como montar um potinho fit sem perder o sabor',
                '"Ninho tem lactose?" — mito vs verdade',
                'Guia de toppings — combinações que funcionam',
                'Cacau brasileiro: tudo que você não sabia',
                'Potinho pós-treino — o que escolher',
                'Como o açaí é feito — da Amazônia até Londrina',
                'Comparação calórica: sobremesa MilkyPot vs sorvete tradicional',
                'O que fazer com sobra de potinho (brinde pro cachorro? não!)',
                'Lactose, glúten e alergia — o que tem na MilkyPot',
                'Temperatura ideal pra comer sobremesa',
                'Por que açaí é ácido e como equilibrar',
                'Origem de cada topping (morango Atibaia, leite ninho...)',
                '5 combos pro seu tipo de dia',
                'Como escolher o tamanho certo do seu potinho'
            ]
        },
        {
            pilar: '📍 Local / Londrina',
            cor: '#FF9800',
            descricao: 'SEO local + comunidade. 10% do feed.',
            ideias: [
                '"Coisas que só quem é de Londrina entende" (humor)',
                'Muffato Quintino — dicas pra quem nunca foi',
                'Rota dos melhores lugares fofos de Londrina',
                'Parceria com outro negócio local (cross-promo)',
                'Tempo frio em Londrina x açaí — pode?',
                'Calçadão + MilkyPot — combo perfeito',
                '"A UEL precisa de um MilkyPot no Centro" (engajamento)',
                'Dica de passeio: Muffato + Lago Igapó + MilkyPot',
                'Londrinense típico que come açaí como se fosse água',
                'Coisas que aconteceram em Londrina essa semana',
                'Time do Londrina Esporte Clube — torcida em potinho',
                'Sexta em Londrina — roteiro incluindo MilkyPot',
                'Festa Junina Paraná — pote temático',
                'Clima seco de Londrina — qual picolé escolher',
                'Feira de Londrina — ingredientes da MilkyPot'
            ]
        },
        {
            pilar: '🎬 Bastidor',
            cor: '#795548',
            descricao: 'Humaniza a marca. 10% do feed.',
            ideias: [
                'Equipe de manhã cedo preparando tudo',
                'Chegada de ingredientes frescos',
                'Funcionário aprendendo a montar (treinamento)',
                'Rotina do atendente mais querido',
                '"Um dia na cozinha da MilkyPot" vlog',
                'Processo de lavagem/higienização (mostra qualidade)',
                'Troca de topping — como ingredientes viram destaque',
                'Proprietário falando por que criou a unidade',
                'Café da manhã da equipe',
                'Reunião semanal — o que vai mudar',
                'Teste de topping novo — funcionário experimenta',
                'Embalagem sendo feita — packaging viralizável',
                'Limpeza do fim de expediente',
                'Fornecedor contando sua história',
                'Aniversário de funcionário — equipe celebra'
            ]
        }
    ]
};

// Exportar pra uso no admin
if (typeof window !== 'undefined') {
    window.LancamentoContent = LancamentoContent;
}
