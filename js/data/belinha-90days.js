/* ============================================
   BELINHA — 90 DIAS DE CONTEÚDO (12/05 → 09/08/2026)
   ============================================
   Cliente: já operando há 12 dias. Conteúdo de retenção, viralização,
   cobrindo datas reais brasileiras e sazonalidade.
   Cada item: { d, date, dow, week, theme, title, hook, prompt, script, caption, hashtags, music, cta, format }
   ============================================ */

(function (global) {
    // Hashtags base reutilizáveis
    const TAGS_BASE = '#milkypot #belinha #milkypotlondrina #londrina #ovelhinhabelinha #muffato #potinhomaisfelizdomundo';
    const TAGS_FOOD = '#sobremesalondrina #acailondrina #sorveterialondrina #londrinafood #curtalondrina #foodporn';
    const TAGS_VIRAL = '#fyp #viral #relatable #tiktokbrasil';
    const T = function(extra){ return TAGS_BASE + ' ' + TAGS_FOOD + ' ' + (extra||'') + ' ' + TAGS_VIRAL; };

    // Helper geração de prompt de imagem com base na Belinha
    function belinhaPromptBase() {
        return 'A fluffy white sheep mascot named "Belinha" with a small round head, pink rosy cheeks, big shiny black eyes with white highlights, pinkish snout, soft cuddly wool. Pixar-style 3D rendering, ultra cute, expressive face. ';
    }
    const PB = belinhaPromptBase();

    // Estilo final padrão
    const STYLE = ' Vertical 9:16 aspect ratio, bright pastel pink and blue lighting, MilkyPot brand colors. Highly detailed, charming, brazilian feel.';

    // CTA padrão
    const CTA_LOCAL = '\n\n📍 Av. Quintino Bocaiuva 1045 — dentro do Muffato Londrina\n🕑 14h às 23h, todos os dias';

    // ════════════════════════════════════════════
    // DIAS 1-30 (12/05 a 10/06): MÊS DA RETENÇÃO
    // ════════════════════════════════════════════
    const days = [];

    // Helpers pra criar entrada
    function make(d, date, dow, week, theme, title, format, hook, prompt, script, captionCore, musicHint, cta, extraTags) {
        days.push({
            d, date, dow, week, theme, title, format,
            hook,
            prompt: PB + prompt + STYLE,
            script,
            caption: captionCore + CTA_LOCAL,
            hashtags: T(extraTags || ''),
            music: musicHint,
            cta
        });
    }

    // ─── SEMANA 1 (12-18 maio) ───
    make(1, '2026-05-12', 'TER', 1, 'rotina', 'Belinha planeja a semana',
        'reel-15s', 'Belinha com agenda na pata planejando "qual sabor cada dia"',
        'Belinha sentada à mesa com uma agenda gigante, anotando sabores diferentes pra cada dia da semana. Rosto concentrado, óculos pequeninhos no focinho. Mesa com 7 potinhos pequenos, cada um com sabor diferente.',
        '0-3s: Belinha de óculos, agenda aberta. TEXTO "minha semana ideal:"\n3-7s: Plano fechado nos dias da semana, sabor escrito ao lado de cada um\n7-12s: SEX = "TUDO ao mesmo tempo!" — Belinha exagera\n12-15s: Texto final "qual SEU sabor de cada dia?"',
        'segunda já tô programando minha semana 🐑\n\nter ninho · qua morango · qui pavê · sex SURTO\n\nme conta: você planeja seu sorvete da semana ou vai no improviso?',
        'Trend "minha semana de" — qualquer áudio organizativo cute',
        'STORIES: enquete "Você é planejador OU surpresa?"');

    make(2, '2026-05-13', 'QUA', 1, 'asmr', 'Cremosidade do Ninho — ASMR',
        'reel-18s', 'Som puro do Ninho sendo servido. Sem fala. Texto mínimo.',
        'Overhead shot of MilkyPot Ninho ice cream being scooped into a glass cup, slow motion, the cream forms perfect curl. Beside the cup, a sleeping/blissful Belinha with rosy cheeks and tiny "Z"s above. Hyper-real food photography mixed with cute mascot.',
        '0-3s: Concha entrando no ninho cremoso\n3-8s: Curl perfeito caindo no copo\n8-13s: Toppings caindo um a um (granola, oreo, morango)\n13-18s: Calda em fio + close final + texto "salve pra amanhã 💗"',
        'sem fala. é o som que importa hoje 🎧\n\nfone obrigatório.\n\nninho cremoso é arte.',
        'Som próprio (criar áudio MilkyPot). Backup: ASMR satisfying trending',
        'Posta como áudio próprio "MilkyPot — Ninho Cremoso"');

    make(3, '2026-05-14', 'QUI', 1, 'humor', 'A briga: Ninho vs Açaí',
        'reel-12s', 'Belinha como árbitra do "campeonato" entre os dois favoritos',
        'Belinha vestida de árbitro com apito, no centro de um ringue. Ninho de um lado (em forma de personagem branco fofo) e Açaí (personagem roxo) do outro. Atmosfera de luta WWE.',
        '0-3s: TEXTO "o duelo final"\n3-7s: Ninho vs Açaí — bell sound. Belinha aponta\n7-10s: Belinha dá tapa na cara dela mesma. TEXTO "EU NÃO ESCOLHO"\n10-12s: TEXTO "vc tá no time de qual? 👇"',
        'briga eterna do brasileiro: ninho ou açaí? 🥊\n\nessa é minha COISA não decidir nunca, comenta o seu time!',
        'Áudio de WWE/Boxing trending. Ou "Eye of the Tiger" instrumental',
        'COMMENTS BAITING: pergunta direta "qual time?". Boost de engajamento.');

    make(4, '2026-05-15', 'SEX', 1, 'promo', 'Sextou — Combo casal (ressuscitado)',
        'reel-10s', 'Belinha apresenta o combo casal pra fim de semana',
        'Belinha sorrindo entre duas casquinhas (uma maior outra menor) que se "olham com amor". Fundo rosa com corações.',
        '0-3s: TEXTO "sextou? 💗"\n3-6s: Plano de duas casquinhas / dois potinhos lado a lado\n6-10s: TEXTO "combo casal R$ XX,XX — sextou, sábado, domingo. cupom: CASAL2X1"',
        'sextou e a Belinha trouxe presente 🎁\n\nCOMBO CASAL: 2 potinhos médios pelo preço de 1 (sex/sáb/dom)\ncupom: CASAL2X1\n\nchama o crush, o melhor amigo, a mãe — a regra é só ser DOIS 💗',
        'Música romântica/cute trend',
        'Cupom no PDV. Story com sticker de countdown 48h.');

    make(5, '2026-05-16', 'SAB', 1, 'viral', 'POV: Sábado de tarde no MilkyPot',
        'reel-15s', 'POV típica do sábado — funciona porque todo mundo vive isso',
        'POV first-person view do cliente entrando na MilkyPot num sábado. Movimento de câmera mostra fila pequena, atendente sorrindo, vitrine cheia de toppings. Belinha aparece no canto inferior fazendo joinha.',
        '0-2s: TEXTO "POV: sábado 16h, você lembrou que tem MilkyPot"\n2-6s: Câmera entra na loja (gravado em primeira pessoa)\n6-10s: Vitrine, toppings, atendente sorrindo\n10-15s: Potinho montado + close + texto "domingo é tarde demais ⏰"',
        'POV: você lembrou que tem MilkyPot 🐑\n\nsalva pra te lembrar amanhã.\n\nte vejo aqui? 📍',
        'Áudio "POV" trending — qualquer som lentinho de descoberta',
        'POV é formato que SEMPRE viraliza. Faz outras versões.');

    make(6, '2026-05-17', 'DOM', 1, 'family', 'Domingo de família no Muffato',
        'reel-20s', 'Mostra famílias reais da loja — wholesome',
        'Wide shot de uma família dentro do MilkyPot — pais e duas crianças sorrindo, todos com potinhos diferentes. Belinha (sticker) acena no canto. Iluminação dourada de fim de tarde.',
        '0-3s: TEXTO "domingo de família ✨"\n3-10s: Cuts de famílias REAIS na loja (pedir autorização). Belinha sticker passa em cada cut\n10-15s: Crianças rindo, pais felizes\n15-20s: TEXTO "domingo é da família. e do MilkyPot 💗"',
        'domingo de família é coisa séria.\n\nobrigada por trazer a galera de casa hoje 🥹\n\namanhã segunda mas hoje a gente curte.',
        'Som wholesome — "Coldplay Yellow" instrumental ou trend de família',
        'PEDIR AUTORIZAÇÃO antes de gravar famílias reais. Reposta clientes.');

    // ─── SEMANA 2 (19-25 maio) ───
    make(7, '2026-05-18', 'SEG', 2, 'rotina', 'Belinha de ressaca pós-domingo',
        'reel-12s', 'Comédia universal: segunda doendo',
        'Belinha deitada na cama, olheiras gigantes, segurando café. Cabelo (lã) bagunçado. Texto "segundou" em néon piscando.',
        '0-3s: Belinha bocejando enorme\n3-7s: TEXTO "domingo ontem foi DEMAIS"\n7-10s: Belinha bate cabeça na mesa. TEXTO "como sobrevivo?"\n10-12s: TEXTO final "café + sorvete. ordem: nessa."',
        'segunda chegou e eu não tô preparada 🥹\n\nfaltam 6 dias pro próximo domingo. resistir é viver.\n\n☕ vou de café da manhã com sorvete (não me julga)',
        'Áudio "monday vibes" cansado. Trend de ressaca.',
        '');

    make(8, '2026-05-19', 'TER', 2, 'novidade', 'Lançamento sabor da semana',
        'reel-15s', 'Belinha apresenta um sabor novo (rotativo)',
        'Belinha em pose de modelo apresentando um potinho com sabor especial (escolher: brigadeiro de churros, romeu e julieta, etc). Spotlight teatral.',
        '0-3s: TEXTO "ATENÇÃO TODOS"\n3-8s: Belinha tira lençol revelando o potinho. Spotlight. Música épica\n8-12s: Close no potinho. Texto: "sabor da semana"\n12-15s: TEXTO "só essa semana 🚨"',
        '🚨 SABOR DA SEMANA chegou.\n\n[NOME DO SABOR DA SEMANA] — combinação que a gente testou e deu CERTO demais.\n\nsó até domingo. depois some.\n\nvem antes de sumir 👇',
        'Música de "reveal" / drumroll — qualquer trend épica',
        'EDITAR antes de postar com o sabor real da semana.');

    make(9, '2026-05-20', 'QUA', 2, 'asmr', 'Calda de leite condensado em fio — ASMR',
        'reel-15s', 'Pure satisfaction',
        'Macro shot of a perfect ribbon of condensed milk falling onto a Ninho ice cream. Slow-motion, hypnotic spiral. Belinha (small sticker) blissed out beside.',
        '0-3s: Lata de leite condensado abrindo\n3-10s: Fio caindo em câmera lenta sobre o sorvete\n10-13s: Espiral perfeita formada\n13-15s: Texto "salva pra ver depois 💗"',
        'me passa o fone aí.\n\n🎧 leite condensado em fio é arte.\n\nbom dia.',
        'Som próprio (gravação real do leite caindo amplificado)',
        'Vira áudio favorito. Pin no perfil.');

    make(10, '2026-05-21', 'QUI', 2, 'localcontent', 'Belinha visita o Calçadão',
        'reel-18s', 'Mostra Londrina, gera identificação local',
        'Belinha andando pelo Calçadão de Londrina, parando em pontos famosos (Catedral, Calçadão, Concha Acústica). Carrega um potinho na pata.',
        '0-3s: Belinha no Calçadão. TEXTO "sou de londrina"\n3-7s: Cuts dos pontos da cidade com Belinha sticker\n7-13s: Pessoas reais reagindo (pedir autorização) — "OLHA UMA OVELHA NA RUA!"\n13-18s: Belinha entra no Muffato. TEXTO "todo caminho leva pra casa 🐑"',
        'londrina, pra mim, sempre foi de virar a esquina e achar coisa boa.\n\nhoje passei no Calçadão e voltei pro meu lugar 💗\n\nse você também é daqui, me marca seu lugar favorito.',
        'Som de Londrina / regional brasileiro. "Trem das Onze" cute',
        'Conteúdo local sempre engaja Londrina. Tag #curtalondrina obrigatória.');

    make(11, '2026-05-22', 'SEX', 2, 'promo', 'Sextou — Promo aleatória',
        'reel-10s', 'Roda da sorte do desconto',
        'Belinha girando uma roleta gigante com diferentes descontos. Roleta para no "20% off açaí".',
        '0-3s: TEXTO "sextou da Belinha"\n3-7s: Belinha gira roleta. Suspense\n7-10s: Para em "20% OFF AÇAÍ HOJE". Belinha pula',
        '🎰 sextou com SURPRESA\n\nhoje, só hoje: 20% off em qualquer açaí buffet 🍇\n\nentra antes do meio-dia que evita fila 🤝',
        'Áudio de roleta de cassino / drumroll',
        'EDITAR roleta com promoção real do dia.');

    make(12, '2026-05-23', 'SAB', 2, 'viral', 'Tipos de cliente (parte 1)',
        'reel-20s', 'Comédia observacional dos tipos de cliente',
        'Belinha caracterizada como diferentes "tipos" de cliente — o indeciso, o que sempre pede o mesmo, o que pede tudo, o tímido.',
        '0-4s: TEXTO "tipos de cliente que vejo aqui:" Belinha como narradora\n4-9s: Tipo 1 (indeciso) — Belinha franzindo testa, gira\n9-13s: Tipo 2 (que pede o de sempre) — Belinha apontando confiante\n13-17s: Tipo 3 (que pede TUDO) — Belinha com 5 potinhos\n17-20s: TEXTO "qual é o seu? 👇"',
        'já vi MUITO tipo de cliente nessa semana 🥹\n\nqual é o seu? marca o amigo que é cada tipo 👇',
        'Trend "tipos de pessoa" — Pizzaria 38, qualquer caracterização',
        'Conteúdo de personificação cresce 5x. Marca amigos.');

    make(13, '2026-05-24', 'DOM', 2, 'wholesome', 'Carta da Belinha',
        'reel-18s', 'Momento emocional de fechamento da semana',
        'Belinha sentada à mesa, escrevendo numa carta de papel. Ambiente quente, luz dourada de tarde. Lágrima feliz no canto do olho.',
        '0-3s: TEXTO "carta da Belinha"\n3-15s: Belinha escreve. Voz over: "obrigada por essa semana. cada potinho que eu vi sendo entregue, foi um sorriso que voltou pra casa..."\n15-18s: Belinha dobra a carta. TEXTO "te vejo segunda 💗"',
        'minha cartinha de domingo:\n\nobrigada. de coração.\n\ncada cliente que voltou essa semana, cada foto que vocês marcaram, cada \"achei o melhor sorvete da minha vida\" me fez derreter junto.\n\nnão posso esperar pela semana 3.\n\n— Belinha 🐑',
        'Música emocional — "Photograph" Ed Sheeran instrumental',
        'Domingo emocional retem audiência.');

    // ─── SEMANA 3 (26 maio - 1 junho) ───
    make(14, '2026-05-25', 'SEG', 3, 'humor', 'Belinha tentando fazer dieta',
        'reel-12s', 'Universal: dieta vs sorvete',
        'Belinha tentando segurar uma maçã enquanto olha para um sundae. Suor. Drama interno.',
        '0-3s: TEXTO "minha promessa de segunda"\n3-6s: Belinha mordendo maçã com dificuldade\n6-9s: Vê sundae passando. Lambe os beiços\n9-12s: TEXTO "dieta começa amanhã. amanhã dura 4 horas"',
        'meu plano fitness:\n- segunda: maçã\n- segunda 19h: sundae\n- terça: começa de novo\n\nalguém tá comigo ou só eu? 🥹',
        'Áudio de drama / luta interna',
        '');

    make(15, '2026-05-26', 'TER', 3, 'tutorial', 'Como montar o potinho perfeito',
        'reel-25s', 'Educa o cliente, gera ticket maior',
        'Tutorial em câmera lenta de combinações que funcionam. Belinha em chapéu de chef.',
        '0-3s: TEXTO "potinho que dá CERTO 100% das vezes"\n3-10s: Base ninho + morango + leite condensado\n10-17s: Açaí + granola + banana + mel\n17-22s: Pavê + nutella + paçoca\n22-25s: TEXTO "qual você tenta amanhã?"',
        '3 combinações TESTADAS:\n\n🥛 Ninho · morango · condensado\n🍇 Açaí · granola · banana · mel\n🍫 Pavê · nutella · paçoca\n\nsalva pra mostrar no balcão 💗',
        'Som de cooking show / "Chef\'s Table" theme',
        'Salvar = ouro pro algoritmo. Pede salvamento.');

    make(16, '2026-05-27', 'QUA', 3, 'asmr', 'Crocância da granola — ASMR',
        'reel-15s', 'Som específico, satisfação garantida',
        'Macro shot of golden granola being sprinkled on creamy ice cream. Slow motion, individual flakes visible. Sound focused.',
        '0-5s: Granola caindo do potinho\n5-10s: Close no impacto sobre o sorvete\n10-15s: Colher mexendo + crunch sound + texto "ouve o som 🎧"',
        'crunch crunch crunch.\n\nminha granola favorita do mundo (e olha que já provei MUITA).\n\nfone? FONE? 🎧',
        'Som próprio crunchy — gravação ampliada',
        '');

    make(17, '2026-05-28', 'QUI', 3, 'storytelling', 'Como nasceu a Belinha',
        'reel-30s', 'Origem da personagem — gera afinidade',
        'Animação simples 2D de como a Belinha "nasceu" da imaginação dos donos. Cores pastel, infantil, charmoso.',
        '0-3s: TEXTO "minha origem 🐑"\n3-12s: 2D animado — donos do MilkyPot pensando "queremos uma mascote..." \n12-22s: Diferentes esboços. Selecionam Belinha\n22-30s: Belinha aparece em vida. TEXTO "agora sou de vocês também 💗"',
        'minha história curta:\n\nos donos da MilkyPot queriam uma mascote que fosse macia, doce e meio aleatória.\n\naí me criaram. eu nasci num caderno em 2025.\n\nhoje moro com vocês 🥹',
        'Som "origem story" / Disney lullaby',
        'Salva no destaque "Belinha" do perfil.');

    make(18, '2026-05-29', 'SEX', 3, 'promo', 'Sextou — bring a friend',
        'reel-12s', 'Mecânica de indicação',
        'Belinha apontando dois potinhos: "se você trouxer um amigo novo, ele ganha 30% off". Setas, brilhos.',
        '0-3s: TEXTO "regra simples"\n3-7s: Belinha aponta uma cadeira vazia\n7-10s: Aparece amigo. Belinha aponta promo\n10-12s: TEXTO "sextou de indicação"',
        'sextou diferente:\n\n🤝 traz UM AMIGO que nunca veio aqui — ele ganha 30% off\n\nvocê só precisa explicar pra ele que existe sorvete que paga de volta (MilkyClube) 💗\n\ndomingo ele já vai voltar sozinho. promessa.',
        'Som energético / amizade',
        'Liga ao MilkyClube referral.');

    make(19, '2026-05-30', 'SAB', 3, 'viral', 'POV: amigo que sabe escolher',
        'reel-15s', 'Continua POV viral',
        'POV de cliente sendo guiado por amigo experiente que sabe TUDO do MilkyPot.',
        '0-3s: TEXTO "POV: você foi com aquele amigo que MANJA"\n3-8s: Câmera primeira pessoa, amigo pedindo com confiança "ninho com morango e nutella"\n8-12s: Atendente "boa escolha"\n12-15s: TEXTO "marque seu amigo MilkyPot"',
        'POV: você tá com aquele amigo que SABE pedir.\n\ntodo mundo tem um. marca aqui o seu 👇',
        'Áudio POV / cool friend trend',
        'Marca = engajamento. Gera comentário "@amigo isso é vc".');

    make(20, '2026-05-31', 'DOM', 3, 'wholesome', 'Recap Maio',
        'carrossel-6', 'Carrossel resumindo o mês',
        'Cada slide é um momento do mês — números reais, fotos de clientes, momentos. Wholesome.',
        'SLIDE 1: "MAIO foi assim 💗"\nSLIDE 2: "X potinhos servidos"\nSLIDE 3: "Y novos amigos do MilkyClube"\nSLIDE 4: "fotos lindas que vocês marcaram"\nSLIDE 5: "trends que você curtiu mais"\nSLIDE 6: "obrigada. junho é nosso 🐑"',
        'maio fechou. e fechou bonito 🥹\n\nobrigada por cada visita, cada raspinha raspada, cada review.\n\njunho vem com FESTA JUNINA, dia dos namorados e MUITA novidade.\n\nsalva pra rever 💗',
        'Música emocional/wholesome de fim de mês',
        'Pin esse carrossel pro mês inteiro.');

    // ─── SEMANA 4 (1-7 junho) — FESTA JUNINA START ───
    make(21, '2026-06-01', 'SEG', 4, 'sazonal', 'Junho chegou — modo arraiá ativado',
        'reel-15s', 'Início da temporada junina',
        'Belinha vestida de caipira (chapéu de palha, bochecha pintada, dente preto). Bandeirinhas no fundo.',
        '0-3s: Belinha aparece com chapéu de caipira. TEXTO "ô tio do quentão"\n3-8s: Belinha dança quadrilha. Bandeirinhas\n8-12s: TEXTO "junho na MilkyPot tem PAÇOCA, AMENDOIM, CANJICA, DOCE DE LEITE"\n12-15s: TEXTO "festa junina = mês inteiro 🎉"',
        'junho chegou e A FESTA TÁ ARMADA 🎉\n\ntoda semana eu trago um sabor novo da época: paçoca, amendoim, canjica, doce de leite, milho.\n\nme conta qual você quer ver primeiro 👇',
        'Forró/quadrilha trending. "Pula a Fogueira" remix',
        'Decoração da loja vai pedir foto. Posta isso.');

    make(22, '2026-06-02', 'TER', 4, 'novidade', 'Lançamento: Sabor Paçoca',
        'reel-12s', 'Lançamento de sabor temático',
        'Belinha apresentando o sabor paçoca — potinho coberto de paçoca esfarelada.',
        '0-3s: TEXTO "primeiro sabor de junho"\n3-7s: Reveal — potinho de paçoca\n7-10s: Close, calda + paçoca caindo\n10-12s: TEXTO "esse mês todo. depois ele vai 👋"',
        '🥜 PAÇOCA chegou pra dominar junho.\n\nbase de doce de leite + paçoca esfarelada + um toque de leite condensado.\n\né viciante. eu avisei.',
        'Forró romântico ou junino moderno',
        '');

    make(23, '2026-06-03', 'QUA', 4, 'asmr', 'Paçoca esfarelando — ASMR',
        'reel-15s', 'Som da paçoca quebrando',
        'Macro de paçoca sendo amassada com colher e caindo sobre sorvete.',
        '0-5s: Paçoca inteira sendo quebrada\n5-10s: Esfarelando devagar\n10-15s: Caindo sobre o sorvete + close',
        'crunch da paçoca >>> qualquer outro crunch.\n\nme prova o contrário 🤝',
        'Som próprio crunch paçoca',
        '');

    make(24, '2026-06-04', 'QUI', 4, 'humor', 'Belinha tentando dançar quadrilha',
        'reel-15s', 'Comédia visual',
        'Belinha tentando dançar quadrilha mas atrapalhada. Lã voando, chapéu caindo. Galinha aparece e atropela.',
        '0-3s: TEXTO "minha estreia em quadrilha"\n3-10s: Belinha tropeça. Para. Chapéu cai.\n10-12s: Galinha entra na cena correndo\n12-15s: TEXTO "ano que vem eu treino"',
        'quadrilha não é pra MIM, gente.\n\nmas sorvete de paçoca É 🥜\n\nrompi tornozelo da reputação mas tô bem.',
        'Forró clássico — "Asa Branca" / "Olha Pro Céu"',
        '');

    make(25, '2026-06-05', 'SEX', 4, 'promo', 'Sextou — combo arraiá',
        'reel-10s', 'Promo temática junina',
        'Mesa decorada estilo arraiá com 3 potinhos sabores juninos lado a lado.',
        '0-3s: TEXTO "combo arraiá"\n3-7s: 3 potinhos: paçoca + canjica + doce de leite\n7-10s: TEXTO "R$ XX. só sex/sáb/dom"',
        'arraiá em casa? a gente leva 🎉\n\ncombo: 3 sabores juninos por R$ XX (preço do mercado pula a fogueira)\n\nsex/sáb/dom — depois sumiu',
        'Forró romântico junino',
        'Editar com preço real');

    make(26, '2026-06-06', 'SAB', 4, 'viral', 'Tipos de cliente em festa junina',
        'reel-20s', 'Continuação da série de tipos',
        'Belinha caracterizada como diferentes tipos: o que só come canjica, o que pula a fogueira, o que dança.',
        '0-3s: TEXTO "tipos de cliente em junho"\n3-7s: Tipo 1 — só canjica\n7-11s: Tipo 2 — pula tudo\n11-15s: Tipo 3 — vegano de festa junina\n15-20s: TEXTO "marca o seu 👇"',
        'me ajuda a identificar quem é quem aí em casa 👇\n\neu sou claramente o tipo 1.',
        'Forró trending',
        '');

    make(27, '2026-06-07', 'DOM', 4, 'family', 'Domingo em família com canjica',
        'reel-18s', 'Wholesome + sazonal',
        'Famílias na loja comendo sundae de canjica. Atmosphere wholesome.',
        '0-5s: Plano amplo — famílias na loja\n5-12s: Cuts de avós com netos comendo\n12-18s: TEXTO "domingo de junho: família + canjica = perfeito"',
        'tem gosto de domingo de avó na minha cabeça 🥹\n\ncanjica + sorvete + alguém que você ama = receita certa de domingo.\n\nmarca quem você quer levar 💗',
        'Forró wholesome / "Asa Branca" cover',
        'Repostar fotos reais.');

    // ─── SEMANA 5 (8-14 junho) — DIA DOS NAMORADOS ───
    make(28, '2026-06-08', 'SEG', 5, 'sazonal', 'Semana dos namorados começou',
        'reel-15s', 'Lead-up pro 12/06',
        'Belinha vestida de cupido com asas pequeninhas e arco. Coração rosa flutuando.',
        '0-3s: TEXTO "essa semana é PERIGOSA"\n3-8s: Belinha como cupido. Arco apontando\n8-12s: Várias versões dela apaixonada\n12-15s: TEXTO "12/06 chegando — vem ver os combos"',
        '💘 dia dos namorados tá vindo aí\n\nessa semana eu trago combos pra casal, pro crush, pra você sozinha (porque amor próprio também conta) 🐑\n\nsegue pra ver os flerts diários',
        'Música romântica trending',
        '');

    make(29, '2026-06-09', 'TER', 5, 'novidade', 'Sabor exclusivo namorados',
        'reel-12s', 'Lançamento sabor temático',
        'Sabor "Romeu e Julieta" — goiabada + queijo. Belinha apresenta como casamento perfeito.',
        '0-3s: Belinha em smoking. TEXTO "casamento perfeito"\n3-8s: Reveal sabor — goiabada e queijo\n8-12s: TEXTO "Romeu e Julieta — só essa semana"',
        'queijo + goiabada juntos novamente. shakespeare aprovaria 💕\n\nsó até 14/06.',
        'Música romântica/clássica',
        '');

    make(30, '2026-06-10', 'QUA', 5, 'asmr', 'Goiabada caindo — ASMR',
        'reel-15s', 'ASMR temático',
        'Macro shot of goiabada syrup falling into a creamy white scoop.',
        'Som puro da calda caindo, denso e doce.',
        'goiabada com sorvete >>> qualquer combo do mundo 🍓\n\nfone aí 🎧',
        'Som próprio',
        '');

    make(31, '2026-06-11', 'QUI', 5, 'humor', 'Belinha sozinha no dia dos namorados',
        'reel-15s', 'Self-love humor',
        'Belinha jantando sozinha à luz de velas, mas com 3 potinhos de sorvete na mesa.',
        '0-3s: Belinha solo. Velas. TEXTO "meu encontro perfeito"\n3-10s: Ela conversa com os potinhos como se fossem 3 dates\n10-15s: TEXTO "dia 12 sou eu comigo. e tá ótimo 🥹"',
        'meu encontro do dia 12: eu, eu mesma e três potinhos.\n\namor próprio é a relação mais longa que vamos ter, gente. 💗\n\nme acompanha?',
        'Música romântica self-love',
        'Engaja TODO solteiro do feed.');

    make(32, '2026-06-12', 'SEX', 5, 'promo', '🌹 12/06 — Combo Crush',
        'reel-15s', 'Pico do mês',
        'Casal real (funcionários ou amigos) compartilhando sundae a dois. Coração formado pela calda.',
        '0-3s: TEXTO "12/06 — dia D"\n3-10s: Casal real com sundae a dois\n10-15s: TEXTO "combo a dois R$ XX. SÓ HOJE"',
        '💗 hoje é o dia\n\ncombo a dois: 1 sundae GIGANTE, 2 colheres, infinitos toppings.\n\nsó hoje. R$ XX.\n\nchama o crush. ou venha sozinho. todo mundo merece 🥹',
        'Música romântica que está bombando',
        'Boost pago R$ 30. É o reel do mês.');

    make(33, '2026-06-13', 'SAB', 5, 'wholesome', 'Reações reais 12/06',
        'reel-20s', 'UGC reposta + montagem',
        'Compilado de fotos/vídeos de clientes reais que postaram no 12/06.',
        '0-3s: TEXTO "vocês são incríveis"\n3-15s: Cuts de fotos de casais marcando @milkypotbr (com autorização)\n15-20s: TEXTO "obrigada. vocês fizeram o dia 💗"',
        'sábado de coração cheio.\n\nobrigada por terem escolhido a gente pro dia mais doce do ano 🥹\n\nvocês são lindos.',
        'Música wholesome',
        'Reposte com tag = ouro.');

    make(34, '2026-06-14', 'DOM', 5, 'family', 'Domingo de descanso',
        'reel-12s', 'Calmaria pós dia dos namorados',
        'Belinha relaxada na cama, no sofá, comendo sorvete em pijama de cordeirinho.',
        '0-3s: TEXTO "modo descanso"\n3-9s: Belinha em pijama, sofá, controle remoto\n9-12s: TEXTO "domingo é pra recarregar 🛋️"',
        'minha agenda domingo:\n- 14h: nada\n- 15h: nada\n- 16h: ainda nada\n- 17h: sorvete\n\nme acompanha aí no nada? 🛋️',
        'Música chill / lofi',
        '');

    // ─── SEMANAS 6-13 (15 jun - 9 ago) — geração padrão pra resto ───
    // Para economizar espaço sem perder estrutura, vou gerar resto via templates

    const restWeeks = [
        // Semana 6 (15-21 jun) — Festa junina ainda + meio do mês
        { week: 6, baseDate: '2026-06-15', focus: 'Festa Junina pico — Santo Antonio (13), São João (24), São Pedro (29)' },
        { week: 7, baseDate: '2026-06-22', focus: 'São João week + férias escolares começando' },
        { week: 8, baseDate: '2026-06-29', focus: 'Fim festa junina + julho começa + 2 meses MilkyPot' },
        { week: 9, baseDate: '2026-07-06', focus: 'Férias escolares — kids content, foco em criançada' },
        { week: 10, baseDate: '2026-07-13', focus: 'Pico férias — promos kids, family time' },
        { week: 11, baseDate: '2026-07-20', focus: 'Volta às aulas se aproxima — last week of break' },
        { week: 12, baseDate: '2026-07-27', focus: 'Volta às aulas + Dia do Amigo (20/07)' },
        { week: 13, baseDate: '2026-08-03', focus: 'Recap 90 dias + teaser próxima season + dia dos pais (10/08)' }
    ];

    // Templates por dia da semana (rotativos)
    const dowTemplates = {
        SEG: { theme: 'rotina', format: 'reel-12s', tone: 'segunda blues humor' },
        TER: { theme: 'novidade', format: 'reel-15s', tone: 'sabor da semana ou dica' },
        QUA: { theme: 'asmr', format: 'reel-15s', tone: 'satisfying som puro' },
        QUI: { theme: 'humor', format: 'reel-15s', tone: 'relatabilidade comedy' },
        SEX: { theme: 'promo', format: 'reel-12s', tone: 'sextou energia + desconto' },
        SAB: { theme: 'viral', format: 'reel-18s', tone: 'POV ou trend' },
        DOM: { theme: 'wholesome', format: 'reel-15s', tone: 'family / reflexão' }
    };

    function dayName(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        return ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][d.getDay()];
    }
    function nextDate(base, plus) {
        const d = new Date(base + 'T12:00:00');
        d.setDate(d.getDate() + plus);
        return d.toISOString().slice(0,10);
    }

    // Banco de ideias por theme (rotativo)
    const ideaBank = {
        rotina: [
            ['Belinha esquecendo de algo', 'Belinha procurando chave/celular dela. Encontra dentro de um potinho.'],
            ['Belinha dieta', 'Tentativa frustrada de regime. Sorvete sempre vence.'],
            ['Belinha meditação', 'Tenta meditar mas pensa em sorvete o tempo todo.'],
            ['Belinha treinando', 'Suposto treino na esteira que termina em pizza+sorvete.'],
            ['Belinha estudando', 'Belinha "estudando" e desenhando potinhos.']
        ],
        novidade: [
            ['Sabor da semana revelado', 'Pano sendo puxado, sabor revelado. Cores vibrantes.'],
            ['Topping novo', 'Novo topping sendo apresentado. Câmera glamour.'],
            ['Combo limitado', 'Combo de tempo limitado com timer.'],
            ['Sabor de outro país', 'Sabor exótico inspirado. Bandeira no fundo.'],
            ['Volta de clássico', 'Sabor clássico voltando. Nostalgia.']
        ],
        asmr: [
            ['Calda chocolate', 'Chocolate quente caindo'],
            ['Granola crunch', 'Granola caindo, som de crocância'],
            ['Frutas vermelhas', 'Mix de morango+amora+framboesa'],
            ['Brigadeiro', 'Bola de brigadeiro derretendo'],
            ['Leite condensado', 'Fio espiral perfeito']
        ],
        humor: [
            ['Tipos de cliente parte 2', 'Mais tipos engraçados'],
            ['Drama do brigadeiro', 'Belinha briga com o brigadeiro porque sumiu rápido'],
            ['Belinha vs balança', 'Balança quebrou'],
            ['Belinha esperando o pedido', 'Tempo passa em câmera lenta'],
            ['Belinha vs cliente que pediu sem morango', 'Suspense']
        ],
        promo: [
            ['Combo familia', 'Pra 4 pessoas — desconto'],
            ['Combo solo', 'Pra você sozinho — porque amor próprio'],
            ['Sextou raspinha extra', 'Cliente do dia ganha raspinha bonus'],
            ['Promo flash', 'Só 2h — cupom exclusivo'],
            ['Acertou e gritou', 'Acerte palpite no cardápio e ganhe']
        ],
        viral: [
            ['POV cliente novo', 'Primeira vez na loja, descobertas'],
            ['POV gerente do dia', 'Cliente vira gerente'],
            ['POV sorvete', 'Sorvete narrando própria experiência'],
            ['Tipos de cliente parte 3', 'Mais tipos'],
            ['Trend do mês adaptado', 'Adapta trend atual']
        ],
        wholesome: [
            ['Carta da Belinha', 'Reflexão semanal'],
            ['Domingo família', 'Famílias reais reposting'],
            ['História de cliente', 'História emocional UGC'],
            ['Recap semana', 'Compilado dos melhores momentos'],
            ['Mensagem motivacional', 'Belinha conselheira']
        ]
    };

    // Datas especiais com override
    const specialDates = {
        '2026-06-13': { theme: 'sazonal', title: 'Santo Antônio — Dia do Casamenteiro' },
        '2026-06-24': { theme: 'sazonal', title: 'São João — Festa Junina pico' },
        '2026-06-29': { theme: 'sazonal', title: 'São Pedro — última festa junina' },
        '2026-07-09': { theme: 'milestone', title: 'MilkyPot — 2 meses e meio operando' },
        '2026-07-20': { theme: 'sazonal', title: 'Dia do Amigo' },
        '2026-08-09': { theme: 'sazonal', title: 'Vésperas Dia dos Pais' }
    };

    // Gera dias 35-90 com rotação
    let dCounter = 35;
    let bankIdx = { rotina:0, novidade:0, asmr:0, humor:0, promo:0, viral:0, wholesome:0, sazonal:0, milestone:0, family:0 };

    for (let w = 6; w <= 13; w++) {
        const wInfo = restWeeks[w - 6];
        for (let i = 0; i < 7; i++) {
            const date = nextDate(wInfo.baseDate, i);
            const dow = dayName(date);
            const tpl = dowTemplates[dow];
            const special = specialDates[date];

            const theme = special ? special.theme : tpl.theme;
            const ideas = ideaBank[theme] || ideaBank[tpl.theme];
            const idea = ideas[(bankIdx[theme] || 0) % ideas.length];
            bankIdx[theme] = (bankIdx[theme] || 0) + 1;

            const title = special ? special.title : idea[0];
            const visual = idea[1];

            days.push({
                d: dCounter++,
                date: date,
                dow: dow,
                week: w,
                theme: theme,
                title: title,
                format: tpl.format,
                hook: visual,
                prompt: PB + visual + ' MilkyPot brand context, ice cream parlor environment, expressive Belinha.' + STYLE,
                script: '0-3s: TEXTO "' + title + '"\n3-10s: ' + visual + '\n10-' + (tpl.format.includes('15') ? '15' : tpl.format.includes('18') ? '18' : '12') + 's: TEXTO de fechamento + CTA visual.\n\nDETALHES: roteirize com base no foco da semana — ' + wInfo.focus,
                caption: title.toLowerCase() + ' ' + (theme === 'promo' ? '🎁' : theme === 'wholesome' ? '💗' : '🐑') + '\n\n[ajuste o texto pra refletir o que aconteceu na franquia hoje]\n\n' + (theme === 'sazonal' ? 'data especial — aproveita ✨' : 'que dia 👇') + CTA_LOCAL,
                hashtags: T(theme === 'sazonal' ? '#sazonal' : ''),
                music: tpl.tone + ' trending — pesquisa "' + title + '" no TikTok',
                cta: theme === 'promo' ? 'Editar com preço real do dia' : theme === 'sazonal' ? 'Ancora à data, decoração temática na loja' : ''
            });
        }
    }

    global.BelinhaContent = {
        days: days,
        totalDays: days.length,
        weeks: 13,
        firstDate: days[0] ? days[0].date : null,
        lastDate: days[days.length-1] ? days[days.length-1].date : null,
        // Metadata útil
        themes: ['rotina','novidade','asmr','humor','promo','viral','wholesome','sazonal','milestone','family','localcontent','tutorial','storytelling'],
        themeLabels: {
            rotina: '☕ Rotina', novidade: '🆕 Novidade', asmr: '🎧 ASMR',
            humor: '😂 Humor', promo: '🎁 Promo', viral: '🔥 Viral',
            wholesome: '💗 Wholesome', sazonal: '🎉 Sazonal',
            milestone: '🏆 Milestone', family: '👨‍👩‍👧 Família',
            localcontent: '📍 Local', tutorial: '🎓 Tutorial',
            storytelling: '📖 Storytelling'
        }
    };

})(typeof window !== 'undefined' ? window : this);
