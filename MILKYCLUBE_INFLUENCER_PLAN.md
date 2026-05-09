# Plano Influencer MilkyPot — Síntese executável

> **Documento síntese de 3 agentes especialistas** (Growth Hacker + Instagram Strategist + UX Researcher) consolidado para implementação em produção.
> **Status:** v1.0 · **Cidade-foco inicial:** Londrina-PR · **Mascote:** Belinha · **Stack:** MilkyClube (Firestore + PWA + FCM)

---

## 1. Filosofia (lê isso antes de qualquer decisão)

**Cliente não é mídia paga barata. Cliente é cocriador.** Você dá ferramenta + reconhecimento + retorno real, ele dá autenticidade + alcance + recorrência.

**Regra de ouro econômica:** Custo total por influencer ativo/mês ≤ 25% da margem que ele gera (vendas próprias + indicações atribuídas). Se ultrapassar, ajusta tabela.

**Premissas:**
- 1 potinho = R$ 25 venda · R$ 9 COGS · R$ 16 margem bruta
- 1 MilkyCoin = R$ 0,10 (10 coins = R$ 1 desconto). **NÃO usar 1:1** com Real — vira buraco no caixa.
- Margem máxima a "queimar" por post orgânico: R$ 2,50

---

## 2. Tiers (6 níveis, downgrade após 60d sem post)

| Tier | Nome | Critério (90d rolling) | Multiplicador | Cap mensal |
|------|------|------------------------|---------------|------------|
| 0 | 🐑 Fã da Belinha (default) | Qualquer cliente MilkyClube | 1.0× | 200 coins |
| 1 | ⭐ Aspirante | 3 posts validados + 1 compra/mês | 1.2× | 500 coins |
| 2 | 🌟 Estrela | 10 posts + 50 cliques cupom OU 3 conversões + 3 compras | 1.5× | 1.500 coins |
| 3 | 🔥 Pop | 25 posts + 15 conversões + 1 viral (>5k views) | 1.8× | 3.500 coins |
| 4 | 👑 Ícone | 50 posts + 50 conversões + 2 virais + curadoria | 2.0× | 8.000 coins |
| 5 | 💫 Lenda Belinha (1-3/cidade) | Convite — top 1% performance | 2.5× | Ilimitado |

**Perks por tier (resumo):**
- **Aspirante:** kit boas-vindas (adesivo+chaveiro Belinha), cupom pessoal `BELINHA-NOME10` (10% off)
- **Estrela:** prioridade em sabor novo, nome em parede da loja, repost garantido 1×/mês
- **Pop:** combo grátis/semana, brief mensal pago R$50, camiseta exclusiva
- **Ícone:** contrato R$200/mês + produtos, sabor com seu nome 30 dias, campanha oficial
- **Lenda:** R$300/mês + festa de aniversário grátis (até 20 pessoas) + sabor permanente + estátua mini

---

## 3. Tabela de pontos (1 MilkyCoin = R$ 0,10)

| Ação | Coins base | Cap | Notas |
|------|-----------|-----|-------|
| Story com @milkypotbr + produto | 30 | 2/dia | Mín. 18h no ar, captura via mention |
| Post feed (foto) | 80 | 1/dia | Mín. 5 hashtags do brief |
| Carrossel | 120 | 1/dia | 3+ fotos |
| Reel até 30s | 200 | 1/dia | Validação manual + IA |
| Reel 30-60s narrativo | 350 | 1/dia | Pode receber +R$50 PIX em missão |
| **Bônus por views (após 48h)** | | | Re-scrape semanal |
| 100-499 views | +20 | — | |
| 500-1.999 views | +80 | — | |
| 2.000-9.999 views | +250 | — | |
| 10k-50k views | +800 (R$80) | — | Trigger pra Pop tier |
| **VIRAL 50k+** | +2.500 + brinde físico | — | Manual review obrigatório |
| **Engajamento (após 7d)** | | | |
| Cada 10 likes únicos | +5 | 50/post | |
| Cada comentário >10 chars | +3 | 30/post | |
| Share/save | +2 | 20/post | |
| **Conversão (cupom pessoal)** | | | |
| Amigo usa cupom | +50 | sem cap | Cliente ganha R$5 cashback |
| 1ª compra do amigo | +150 | sem cap | Loop viral principal |
| Amigo recorrente (3 compras/30d) | +400 | sem cap | Cron job |
| **Repost @milkypotbr** | +200 | — | Sinal de qualidade |
| **UGC em campanha paga** | +1.000 + R$50 PIX | — | Contrato simplificado |

---

## 4. Fluxo de submissão UX (alvo: <30s)

**Princípios:**
1. Toque > Texto (1.7s atenção média)
2. Recompensa antes de pedido
3. Microcopy = mascote falando (Belinha 🐑)
4. Status sempre visível
5. 1 ação primária por tela

**Passos numerados:**

1. **(0-3s)** FAB flutuante "Postou? Ganha coins!" sempre visível
2. **(3-8s)** Tela single-screen:
   - Toggle Instagram / TikTok
   - Campo único "Cole o link do seu post"
   - Smart paste do clipboard
3. **(8-12s)** Validação client-side instantânea (regex + duplicate check + oEmbed preview)
4. **(12-18s)** Backend (Cloud Function `validateInfluencerPost`):
   - Username público bate com cadastrado?
   - Caption contém `@milkypotbr` ou `#milkypot`?
   - Vision API: produto MilkyPot detectado? (score 0-1, >0.7 auto-aprova)
5. **(18-25s)** Feedback visual:
   - Verde "Belinha aprovou — +80 coins!" (3 confettis)
   - Amarelo "Em análise — até 4h" (push depois)
   - Vermelho com motivo claro
6. **(25-30s)** CTA pós-aprovação: gera sticker pra repostar nos stories (Loop C)

**Microcopy oficial (cole direto):**

| Lugar | Texto |
|-------|-------|
| H1 hero | "Posta. Ganha. Repete." |
| Subhead | "Seu Instagram pode virar sorvete grátis." |
| CTA enroll | "Bora começar 🐑" |
| CTA submit | "Mandar 🚀" |
| Pós-envio | "Tô conferindo aqui ⏰" |
| Push aprovado | "Aprovado! +50 MilkyCoins caíram aqui 💰🐑" |
| Erro link | "Hmm, esse link tá meio estranho 🤔" |
| Empty state | "Nenhum post ainda. Que tal o primeiro? 🚀" |

**NÃO escrever:**
- "Submissão recebida com sucesso" (corporativo)
- "Aguarde a moderação" (frio)
- "Submit Post" (gringuês)

---

## 5. Hashtag oficial: `#EuSouMilkyPot`

**Por quê esta venceu:**
- Identitária (cliente se sente parte de algo)
- Curta, fácil de digitar
- Sem ambiguidade ("Milky Pot" separado seria ruim)
- Funciona pra 1 cliente ou 100k

**Hashtags secundárias do programa:**
- `#ClubeMilkyPot` — fidelidade
- `#MilkyPotMoment` — produto

**Pacote regional Londrina (sempre incluir):**
```
#londrina #londrinapr #londrinacity #sorveterialondrina #londrinafood
```

**Pacote nacional (regra 3-3-3):**
```
3 grandes (1M+):     #sorvete #foodporn #docinho
3 médias (100k-1M):  #sorveteartesanal #potinhodefelicidade #sobremesabrasileira
3 nicho (<100k):     #milkypot #potinhopersonalizado #sorvetenopote
```

**Limite:** 9-12 hashtags. Mais que isso = IG marca como spam (regra de 2024+).

---

## 6. Templates de conteúdo prontos

**5 Reels (gravavel em 30s no celular):**

1. **"Unboxing do potinho"** (10s): mão segura pote → tampa abrindo → colher cavando → primeira mordida + cara feliz
2. **"Meu nome no pote"** (8s): close na etiqueta personalizada + cara surpresa + texto "Eles colocam SEU nome 🥹"
3. **"Adivinha o sabor"** (12s): 3 potes mesa → "qual desses tu acha que é maracujá?" → revela
4. **"Rotina ft MilkyPot"** (15s): saindo trabalho → caminho loja → pegando pote → comendo. "Minha terapia depois do trampo"
5. **"Comparação"** (10s): genérico vs MilkyPot — sem falar mal de ninguém, só elevar

**3 Stories:**
1. Boomerang da colher afundando + sticker localização "MilkyPot Londrina" + arroba
2. Foto + sticker enquete "Qual sabor a próxima? 🍓 ou 🍫"
3. Vídeo curto 5s + GIF "yummy" + arroba @milkypotbr no canto

**2 Carousels:**
1. "Top 5 sabores que você precisa testar"
2. "Antes vs Depois de descobrir a MilkyPot"

**Hooks que funcionam (cole direto):**
- "Gente, descobri o melhor sorvete de Londrina e não vou mais calar"
- "Achei um lugar que personaliza seu pote com SEU NOME"
- "Londrinense que não conhece a MilkyPot tá perdendo tempo"
- "Pagaria de novo? Já paguei 4 vezes essa semana"

---

## 7. Viral loops (5 — 3 críticos)

### Loop A — Cupom Belinha Pessoal (CORE)
Todo Aspirante+ ganha cupom único `BELINHA-{NOME}10` (10% off). Quando amigo usa:
- Amigo: R$ 5 cashback automático na 1ª compra
- Influencer: 150 coins + se amigo virar recorrente, +400 coins
- MilkyPot: R$ 8,50 margem líquida vs R$ 0 sem o loop
- **K-factor target:** Estrela traz 0.4 novos clientes/semana → 50 Estrelas = 80 novos clientes/mês orgânicos

### Loop B — "Indica 3 = Upgrade Acelerado"
3 amigos completam 1ª compra com seu cupom em 14 dias = pula 1 tier instantâneo + badge "Conector Belinha"

### Loop C — "Post sobre o Post"
Após validação, app gera sticker de story personalizado: "Acabei de ganhar 258 MilkyCoins postando — entra na Belinha tu também: milkyclu.be/r/{NOME}". CTA na tela de aprovação.
- **Conversão estimada:** 8% influencers compartilham → 12% dos viewers se cadastram

### Loop D — Duo Belinha
2 amigos postam no mesmo dia se marcando = ambos ganham +50 coins extra. Estimula posts em grupo.

### Loop E — Reação em Cadeia
Comentário "quero!" no post de influencer → DM automática (template) com cupom dele.

---

## 8. Anti-fraude

| Vetor | Detecção | Punição |
|-------|----------|---------|
| Conta fake recém-criada | Idade <30d + <50 followers reais | Bloqueio tier 0 |
| Likes comprados | Razão likes/views >30% ou pico em <2h | Não conta bônus engajamento |
| Views infladas (bot) | Views/comments >500:1 | Cap em coins de view |
| Múltiplas contas mesmo CPF | Match CPF MilkyClube | Banimento + perde saldo |
| Post excluído após validação | Cron diário verifica liveness | Reverte coins + 30d cooldown |
| Cupom usado pelo próprio | CPF cupom = CPF dono | Bloqueia cashback |
| "Caption stuffing" | Vision score baixo | Rejeita |

**Regra do "ovo podre":** 3 strikes em 90 dias = banimento programa.

---

## 9. KPIs (dashboard admin)

### Métricas-mãe

| KPI | Fórmula | Target M1 | Target M3 |
|-----|---------|-----------|-----------|
| Influencers ativos | postaram últimos 30d | 30 | 150 |
| Posts validados/sem | count(validated) | 50 | 300 |
| K-factor real | novos_clientes_via_influencer / influencers_ativos | 0.3 | 0.8 |
| CAC via influencer | recompensas_pagas / novos_clientes | R$ 18 | R$ 10 |
| CAC influencer / Meta Ads | razão | 0.7 | 0.4 |
| Taxa auto-aprovação | auto_approved / total | 60% | 80% |
| LTV uplift | LTV_influencer / LTV_normal | 1.5× | 2.2× |

### Saúde econômica (alerta vermelho)
```
Margem programa = (vendas_atribuídas × margem_bruta) - custo_recompensas
Se margem < 0 por 14 dias → reduzir coins ou subir cap
```

---

## 10. Arquitetura Firestore

```
/users/{uid}
  + influencerProfile: {
      enrolled, tier, instagramHandle, tiktokHandle,
      personalCouponCode, stats, strikes, bannedUntil
    }

/influencerPosts/{postId}
  - userId, platform, postUrl, postType, thumbnailUrl, caption
  - submittedAt, status, rejectionReason, visionScore
  - missionId, metricsSnapshot, metricsHistory
  - coinsAwarded, coinsBreakdown, moderatedBy, moderatedAt, reposted

/missions/{missionId}
  - titulo, descricao, tipo, coinsBonus, duracaoDias
  - tierMinimo, hashtags, geolocal, ativa, ordem
  - inicioEm, fimEm, premioExtra, participacoes

/influencerCoupons/{couponCode}
  - ownerUid, discountPercent, usesCount, active
  - usesLog: subcollection { usedByUid, orderId, orderValue, ... }

/influencerReferrals/{referralId}
  - influencerUid, referredUid, sourceLoop
  - firstPurchaseAt, isRecurrent, coinsAwardedToInfluencer

/influencerLeaderboard/{period_YYYY_MM}
  - rankings: array ordenada (denormalizado pra performance)
```

**Indexes:** `(status, submittedAt)`, `(userId, status)`, `(missionId, status)`

**Security:**
- Users só leem próprios posts
- Submissão: `request.auth.uid == userId` + rate limit 5/dia
- `coinsAwarded` só via Cloud Function (admin SDK)

---

## 11. Onboarding (3 telas, <60s)

**Triggers automáticos pra captar cliente novo:**

| Evento | Ação |
|--------|------|
| 3 compras em 30d | Push: "Tu tá indo bem na MilkyPot. Bora postar e virar influencer?" |
| Cliente já marca @milkypotbr organicamente | Belinha (admin) DM convite |
| Cliente comenta em post oficial | Reply com link convite |
| Aniversário do cadastro | "Belinha quer te dar um upgrade — entra como Aspirante" |

**Fluxo enroll (3 telas):**
1. Vídeo Belinha 15s + 3 bullets + "Bora!"
2. Conecta Instagram (OAuth ou input + verify pin) + TikTok
3. Termos LGPD + opt-in autorização imagem (separado, não obrigatório)

**Conclusão:** cupom pessoal gerado + 100 coins boas-vindas + missão #001 desbloqueada + confete

---

## 12. 10 Missões iniciais (seed Firestore)

| # | Título | Coins | Tier | Tipo |
|---|--------|-------|------|------|
| 1 | 🥄 Primeira Mordida | 150 | 0+ | Reel |
| 2 | 🐑 Belinha Reagindo | 100 | 0+ | Story/Reel |
| 3 | 🎲 Combo Secreto | 250 | 1+ | Reel · prêmio: combo no cardápio |
| 4 | 🚶 POV: Saindo da MilkyPot | 200 | 0+ | Reel · geo Londrina |
| 5 | ⚔️ Duelo de Sabores | 300 | 1+ | Reel duo +50 bonus |
| 6 | ✨ Antes & Depois (do dia ruim) | 180 | 0+ | Reel |
| 7 | 👨‍🍳 Receita Milky Caseira | 400 | 2+ | Reel · top 3 ganham repost+500 |
| 8 | 🐶 Pet Reage à Belinha | 250 | 0+ | Reel |
| 9 | 📍 Londrina by MilkyPot | 220 | 1+ | Post/Reel · geo |
| 10 | 🙈 MilkyChallenge: Adivinha o Sabor | 350 | 1+ | Reel · top 5 reposts |

Dataset completo em: `js/data/influencer-missions.js`

---

## 13. Plano de comunicação

### Semana 1 — Soft launch (30 convidados pessoais)
- **D1 segunda:** DM individual @milkypotbr para 30 clientes top + vídeo Belinha 15s
- **D3:** Push segmentado VIP MilkyClube
- **D5-7:** Coleta feedback, sprint bug-fix

### Semana 2 — Beta público
- **D8:** Story oficial: "Quer ser influencer? 100 vagas hoje"
- **D9:** Post feed com testimonial dos 30 primeiros
- **D10:** Email base MilkyClube + push
- **D12:** 1ª "Missão da Semana" oficial (Mission #001)
- **D14:** Repost do melhor post + reconhecimento público

### Semana 4 — Lançamento massivo
- **D22:** Campanha paga Meta + TikTok R$300 budget, mirando 18-35 Londrina
- **D25:** 1ª missão âncora mensal (R$50 + 500 coins pro vencedor)
- **D28:** "Top 10 Influencers" anunciado em Stories + parede da loja
- **D30:** Análise quantitativa: KPIs vs targets M1

### Canais ongoing
- **Push FCM:** missões novas, downgrade alertas, repost notification
- **DM IG (humano + IA):** convites tier 2+, viral congratulations
- **WhatsApp Comunidade "MilkyInfluencers Londrina":** só Estrela+
- **Stories destacados @milkypotbr:** highlight "Milky Stars"

---

## 14. Roadmap de implementação (6 sprints)

| Sprint | Semana | Entregáveis |
|--------|--------|-------------|
| 1 | 1-2 | Schema Firestore + onboarding + submissão básica (manual) |
| 2 | 3-4 | Cupom pessoal + tracking conversão + dashboard admin v1 + 10 missões seed |
| 3 | 5-6 | Vision API + auto-aprovação + cron de scraping métricas |
| 4 | 7-8 | Loops virais (sticker + duo + DM reação) + tier system completo |
| 5 | 9-10 | Anti-fraude completo + leaderboard + WhatsApp comunidade |
| 6 | 11-12 | Refino com base em dados M1 + 1º contrato Ícone real |

---

## 15. Decisões confirmadas / em aberto

### ✅ Confirmadas (2026-05-09)

1. **✅ Razão coin:R$ = 10:1** (1 MilkyCoin = R$ 0,10) — toda tabela está calibrada
2. **✅ Hashtag oficial: `#EuSouMilkyPot`** — aplicada em todos os pontos
3. **✅ @milkypotbr é Business no Instagram** — habilita mention webhook (Sprint 3)
4. **✅ Soft launch ATIVADO** — página `/admin/clube-soft-launch.html` lista top 30 VIPs com DMs prontos

### ⏳ Em aberto

5. **Budget mensal de campanha paga influencer:** R$ 0 / 200 / 500?
6. **Geolocal lock:** Londrina M1-M3 ou nacional desde início?
7. **Vision API:** Google Cloud Vision (pago) vs TensorFlow.js client (free, menos preciso)
8. **Belinha agent integração:** automatizar moderação leve + DMs de convite?

---

## 17. Soft Launch VIP — Operacional (CONFIRMADO 2026-05-09)

**Objetivo:** ativar 30 melhores clientes do MilkyClube ANTES de abrir pra todos. Eles testam, dão feedback, já estão postando quando público geral chega = prova social pronta.

**Como funciona:**
1. Admin abre `/admin/clube-soft-launch.html` — lista os 30 VIPs auto-ranqueados (compras × frequência × valor gasto)
2. Cada VIP tem um DM personalizado pronto (5 templates rotativos pra não parecer spam)
3. Admin clica **"📋 Copiar DM"** → cola no Instagram → envia → marca **"✓ Enviei"**
4. Quando o cliente responder, marca **"💬 Respondeu"**. Quando postar, **"📸 Postou"**
5. KPIs no topo: 30 alvos · X enviadas · Y responderam · Z postaram

**Cadência recomendada:** 3 DMs/dia (não tudo de uma vez). 10 dias completa os 30. Espalhar dá mais qualidade na conversa e o Instagram não suspeita de spam.

**Bônus VIP:** quando cliente entra pelo link `?slvip=1`, ganha **+50 MilkyCoins extras** (total 60 vs 10 normal). Banner especial "🌟 Bem-vindo, você é um dos 30 primeiros".

**Status persistido:** `localStorage` por enquanto, depois migra pra `users/{uid}.softLaunchStatus`.

**Tracking de conversão do soft launch:**
- DMs enviadas → DMs respondidas → cadastros → primeiro post → primeiro post viral
- Métrica-mãe: **% dos 30 VIPs que postaram pelo menos 1x em 14 dias** (target: ≥50%)

---

## 16. Anti-patterns a evitar (3 críticos)

1. **Tela cheia bloqueando descoberta** — usa bottom sheet 60% altura
2. **Pedir post de verificação no signup** — auto-trust com punição assíncrona é melhor
3. **Gamificação sem moeda real** — pontos abstratos cansam, MilkyCoins precisam virar produto

---

## Próximos passos

1. ✅ Cliente aprova razão `1 coin = R$ 0,10`
2. ✅ Cliente aprova hashtag oficial `#EuSouMilkyPot`
3. ⏳ Sprint 1 dev: schema Firestore + onboarding + submissão manual
4. ⏳ Soft launch para 30 clientes top com DM individual

---

**Arquivos relacionados no repo:**
- `js/data/influencer-missions.js` — 10 missões seed + tiers + tabela de pontos
- `influencer.html` — página do cliente (signup + dashboard + submit)
- `admin/influencer-program.html` — moderação admin + leaderboard + config
- `admin/clube-central.html` — dashboard MilkyClube (módulos + economia + leads)
- `clube.html` — landing logada do MilkyClube com CTAs Pedir + Influencer
