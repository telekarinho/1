/* ============================================
   MILKYINFLUENCER — Missões iniciais (seed)
   ============================================
   10 missões prontas, baseadas no plano do Growth Hacker.
   Carregadas no Firestore em /missions/{missionId} — este arquivo
   é a fonte de verdade pra seed inicial / fallback offline.
   ============================================ */
(function (global) {
    const missions = [
        {
            id: 'mission_001',
            titulo: 'Primeira Mordida',
            descricao: 'Filma só os 3 primeiros segundos da sua primeira colherada. Cara de surpresa vale ouro.',
            tipo: 'reel',
            coinsBonus: 150,
            duracaoDias: 7,
            tierMinimo: 0,
            hashtags: ['#PrimeiraMordidaMilky', '@milkypotbr'],
            ativa: true,
            ordem: 1,
            emoji: '🥄'
        },
        {
            id: 'mission_002',
            titulo: 'Belinha Reagindo',
            descricao: 'Reage como a Belinha reagiria ao seu pote. Olho arregalado, dança, qualquer coisa fofa.',
            tipo: 'story_ou_reel',
            coinsBonus: 100,
            duracaoDias: 7,
            tierMinimo: 0,
            hashtags: ['#BelinhaReage', '@milkypotbr'],
            ativa: true,
            ordem: 2,
            emoji: '🐑'
        },
        {
            id: 'mission_003',
            titulo: 'Combo Secreto',
            descricao: 'Mostra a sua combinação MilkyPot favorita (sabores + toppings) em até 15s. Inventou nome? Melhor ainda.',
            tipo: 'reel',
            coinsBonus: 250,
            duracaoDias: 10,
            tierMinimo: 1,
            hashtags: ['#ComboSecretoMilky', '@milkypotbr'],
            ativa: true,
            ordem: 3,
            emoji: '🎲',
            premioExtra: 'Combo mais votado vira item do cardápio com nome do criador por 1 mês'
        },
        {
            id: 'mission_004',
            titulo: 'POV: Saindo da MilkyPot',
            descricao: 'POV chegando, comprando e saindo feliz. Mostra a fachada da loja em algum momento.',
            tipo: 'reel',
            coinsBonus: 200,
            duracaoDias: 7,
            tierMinimo: 0,
            hashtags: ['#POVMilky', '@milkypotbr'],
            geolocal: 'Londrina',
            ativa: true,
            ordem: 4,
            emoji: '🚶'
        },
        {
            id: 'mission_005',
            titulo: 'Duelo de Sabores',
            descricao: 'Tu e um amigo provam dois sabores diferentes e reagem. Quem fez melhor cara ganha.',
            tipo: 'reel_duo',
            coinsBonus: 300,
            duracaoDias: 10,
            tierMinimo: 1,
            bonusDuo: 50,
            hashtags: ['#DueloMilky', '@milkypotbr'],
            ativa: true,
            ordem: 5,
            emoji: '⚔️'
        },
        {
            id: 'mission_006',
            titulo: 'Antes & Depois (do dia ruim)',
            descricao: 'Cara séria antes do MilkyPot, cara feliz depois. Transition simples, alto retorno emocional.',
            tipo: 'reel',
            coinsBonus: 180,
            duracaoDias: 7,
            tierMinimo: 0,
            hashtags: ['#AntesDepoisMilky', '@milkypotbr'],
            ativa: true,
            ordem: 6,
            emoji: '✨'
        },
        {
            id: 'mission_007',
            titulo: 'Receita Milky Caseira',
            descricao: 'Crie uma receita usando o pote (smoothie, sobremesa, lanche). Tutorial até 60s.',
            tipo: 'reel',
            coinsBonus: 400,
            duracaoDias: 14,
            tierMinimo: 2,
            hashtags: ['#ReceitaMilky', '@milkypotbr'],
            ativa: true,
            ordem: 7,
            emoji: '👨‍🍳',
            premioExtra: '3 melhores ganham repost + 500 coins extras'
        },
        {
            id: 'mission_008',
            titulo: 'Pet Reage à Belinha',
            descricao: 'Mostra teu pet "apresentado" ao mascote Belinha. Sem dar comida pro pet, só aproximação.',
            tipo: 'reel',
            coinsBonus: 250,
            duracaoDias: 14,
            tierMinimo: 0,
            hashtags: ['#PetMilky', '@milkypotbr'],
            ativa: true,
            ordem: 8,
            emoji: '🐶',
            obs: 'Cuidado: zero alimentação animal — disclaimer obrigatório na caption'
        },
        {
            id: 'mission_009',
            titulo: 'Londrina by MilkyPot',
            descricao: 'Mostra teu canto preferido de Londrina + um MilkyPot. Geolocaliza.',
            tipo: 'post_ou_reel',
            coinsBonus: 220,
            duracaoDias: 14,
            tierMinimo: 1,
            hashtags: ['#LondrinaMilky', '@milkypotbr'],
            geolocal: 'Londrina',
            ativa: true,
            ordem: 9,
            emoji: '📍'
        },
        {
            id: 'mission_010',
            titulo: 'MilkyChallenge: Adivinha o Sabor',
            descricao: 'Vendado, tenta adivinhar o sabor. Falhar é parte da graça.',
            tipo: 'reel',
            coinsBonus: 350,
            duracaoDias: 7,
            tierMinimo: 1,
            hashtags: ['#MilkyChallenge', '@milkypotbr'],
            ativa: true,
            ordem: 10,
            emoji: '🙈',
            premioExtra: 'Top 5 reposts garantidos'
        }
    ];

    // Tabela de tiers
    const tiers = [
        { id: 0, nome: 'Fã da Belinha', emoji: '🐑',  multiplier: 1.0,  capMonth: 200,    cor: '#94A3B8', requisito: 'Qualquer cliente do MilkyClube' },
        { id: 1, nome: 'Aspirante',      emoji: '⭐',  multiplier: 1.2,  capMonth: 500,    cor: '#42A5F5', requisito: '3 posts validados + 1 compra/mês' },
        { id: 2, nome: 'Estrela',        emoji: '🌟',  multiplier: 1.5,  capMonth: 1500,   cor: '#7c3aed', requisito: '10 posts + 50 cliques no cupom OU 3 conversões + 3 compras' },
        { id: 3, nome: 'Pop',            emoji: '🔥',  multiplier: 1.8,  capMonth: 3500,   cor: '#EC407A', requisito: '25 posts + 15 conversões + 1 viral (>5k views)' },
        { id: 4, nome: 'Ícone',          emoji: '👑',  multiplier: 2.0,  capMonth: 8000,   cor: '#FFB300', requisito: '50 posts + 50 conversões + 2 virais + curadoria do time' },
        { id: 5, nome: 'Lenda Belinha',  emoji: '💫',  multiplier: 2.5,  capMonth: null,   cor: '#FFD700', requisito: 'Convite exclusivo · top 1% performance histórica' }
    ];

    // Tabela de pontos por ação (1 MilkyCoin = R$ 0,10)
    const pointTable = [
        { acao: 'Story com @milkypotbr + produto visível',   coinsBase: 30,   capDiario: 2, ico: '📱' },
        { acao: 'Post no feed (foto)',                       coinsBase: 80,   capDiario: 1, ico: '📸' },
        { acao: 'Carrossel (3+ fotos)',                       coinsBase: 120,  capDiario: 1, ico: '🎴' },
        { acao: 'Reel até 30s',                               coinsBase: 200,  capDiario: 1, ico: '🎬' },
        { acao: 'Reel 30-60s narrativo',                      coinsBase: 350,  capDiario: 1, ico: '🎥' },
        { acao: 'Bônus 100-499 views (após 48h)',             coinsBase: 20,   capDiario: 0, ico: '👀' },
        { acao: 'Bônus 500-1.999 views',                      coinsBase: 80,   capDiario: 0, ico: '👀👀' },
        { acao: 'Bônus 2.000-9.999 views',                    coinsBase: 250,  capDiario: 0, ico: '🔥' },
        { acao: 'Bônus 10.000-49.999 views',                  coinsBase: 800,  capDiario: 0, ico: '💥' },
        { acao: 'VIRAL 50.000+ views',                        coinsBase: 2500, capDiario: 0, ico: '🚀', extra: '+ brinde físico' },
        { acao: 'Cada 10 likes únicos (cap 50/post)',         coinsBase: 5,    capDiario: 0, ico: '❤️' },
        { acao: 'Comentário genuíno (>10 chars, cap 30/post)',coinsBase: 3,    capDiario: 0, ico: '💬' },
        { acao: 'Conversão de cupom (amigo compra)',          coinsBase: 50,   capDiario: 0, ico: '💰' },
        { acao: '1ª compra do amigo (referral)',              coinsBase: 150,  capDiario: 0, ico: '🤝', extra: '+ R$ 5 cashback pro amigo' },
        { acao: 'Amigo vira recorrente (3 compras em 30d)',   coinsBase: 400,  capDiario: 0, ico: '⭐' },
        { acao: 'Repost pelo @milkypotbr',                    coinsBase: 200,  capDiario: 0, ico: '🔄' },
        { acao: 'UGC usado em campanha paga',                 coinsBase: 1000, capDiario: 0, ico: '📣', extra: '+ R$ 50 PIX' }
    ];

    global.InfluencerData = { missions, tiers, pointTable };
})(typeof window !== 'undefined' ? window : this);
