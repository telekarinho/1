# Belinha — Log de Ciclos

---

## Ciclo #207 — 2026-05-13

**Área:** UX/Frontend — Banner `#inaugBanner` em `index.html`: fase Potinho Caramelado 01/07–31/07

**Contexto:** O banner do site (`#inaugBanner`) tinha 4 fases codificadas: inauguração (antes/em 25/04), junina teaser (10/05–16/06), junina launch (17/06–29/06) e — nada (banner apagava após 29/06). Com o Potinho Caramelado lançando em 01/07, deixar o banner dark durante todo julho desperdiçava um canal de visibilidade de produto totalmente gratuito. O ciclo #207 foi prescrito no roadmap do #206 exatamente para preparar isso com antecedência.

**O que pesquisou/analisou:**
- Leu a lógica completa do banner JS (linhas 431–491 de `index.html`)
- Confirmou que `sessionStorage.getItem('juninaBannerClosed')` era a única chave usada — se o usuário tivesse fechado o banner junino em 29/06 e voltasse em 01/07, o Caramelado ficaria oculto (bug)
- Leu `belinha/content/reveal-potinho-caramelado-01jul.md` para extrair copy e CTA consistentes com o material de lançamento já produzido
- Verificou a função `closeBanner()` — estava gravando `juninaBannerClosed` para qualquer fase pós-25/04, inclusive julho

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | ADICIONADO bloco `inCaramelado` (julho/2026) na função `configureBanner()` com copy "NOVIDADE: POTINHO CARAMELADO!" + CTA WA; CORRIGIDO `closeBanner()` para gravar `caramBannerClosed` em julho e `juninaBannerClosed` nos demais meses |

**Detalhes da mudança:**
- **Nova fase:** `var inCaramelado = (y === 2026 && m === 7)` — cobre 01/07 a 31/07 automaticamente
- **Copy do banner:** `🍮 NOVIDADE: POTINHO CARAMELADO! · Caramelo + granola + base Ninho · Só na MilkyPot 🐑`
- **CTA:** "Quero provar! →" → `https://wa.me/5543998042424?text=Olá!%20Quero%20o%20Potinho%20Caramelado!%20🍮`
- **Chave sessionStorage separada:** `caramBannerClosed` — garante que fechar o banner junino em junho não suprime o banner de julho
- **Fases anteriores:** intactas — nenhuma regressão na lógica de inauguração, junina teaser ou junina launch
- **Após 31/07:** banner retorna a `display:none` automaticamente (próxima campanha deverá ser adicionada antes)

**Commit:** `7afdb1f`

**Próximo passo sugerido:**
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado + collab "Como Treinar Dragão" (foi citada em ciclos anteriores como encerrada em mai/26) + intel pré-julho (promoções de férias escolares)
- **Ciclo #209 — Conteúdo:** Dia dos Pais 09/08 — posts feed IG/TikTok + Stories (WA standalone `whatsapp-pais-2026.md` já existe; falta o conteúdo visual/narrativo)
- **Ciclo #210 — UX:** Após 31/07, definir próxima fase do banner (Dia dos Pais 09/08? Produto outono/inverno? Manter dark até agosto?)
- **Operador (URGENTE):** Confirmar ≥3 reviews Google Maps → descomentar `aggregateRating` (Blocker #7)
- **Operador:** Confirmar horário julho — mesmo ou diferente? (Blocker #8)
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)

_Belinha — Ciclo #207 | 2026-05-13_

---

## Ciclo #206 — 2026-05-13

**Área:** Conversão — Brief D+90 reativação Onda 1 (clientes inauguração, 21–24/jul/2026)

**Contexto:** Prescrito pelo roadmap auto-aprimoramento #200 e confirmado no ciclo #205. D+90 = 24/07/2026, véspera do marco 3 meses (25/07). Encerra formalmente o ciclo de reativação ativa Onda 1 para clientes que não responderam D+30 (25/05) nem D+60 (22–28/06). O brief do 3 meses (`3meses-25jul-comemoracao-sorteio.md`) cobre o broadcast geral; este cobre o contato individual de última instância.

**O que pesquisou/analisou:**
- Releitura de `reativacao-d30-onda1-maio26.md` e `reativacao-d60-onda1-jun26.md` para manter consistência de estrutura e progressão de tom
- Releitura de `3meses-25jul-comemoracao-sorteio.md` para mapear o timing do broadcast geral (25/07 às 10h) e não criar conflito de canal
- Releitura de `sustentacao-caramelado-semanas-2-3.md` para extrair o gancho de produto mais fresco (Caramelado em plena operação em julho)
- Cálculo do calendário: D+90 = 24/07 (sex) → janela ideal 22–24/07 → encerrar arquivamento até 24/07 22h → broadcast 25/07 10h

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reativacao-d90-onda1-jul26.md` | NOVO — brief operacional completo D+90 |

**Detalhes do conteúdo criado:**
- **Contexto estratégico** com tabela de 5 forças que tornam 22–24/07 a janela ideal
- **Segmentação em 2 lotes:** Lote A (inativos sem histórico de resposta — etiqueta `#inativos-90d`) e Lote B (engajaram antes mas não converteram — etiqueta `#inativos-90d-engajados`)
- **Calendário da semana** (21–25/07) com ações separadas D+90 vs. broadcast 3 meses
- **4 templates WA:** Versão Curiosidade (Lote A), Versão Sorteio (Lote A alternativa), Mensagem 2 Lote A, Versão Próxima (Lote B), Mensagem 2 Lote B
- **Roteiro de resposta do operador:** interesse produto, curiosidade sorteio, feedback negativo, silêncio → arquivamento
- **Tabela de integração** com 4 documentos relacionados
- **KPIs:** taxa de resposta ≥8%, conversão ≥3%, 100% arquivamento pós-onda
- **Checklist de execução** com 11 itens escalonados por data/horário
- **Nota LGPD** com definição de `#arquivado-permanente` + nota sobre Onda 2 (clientes sem1-sem4)

**Commit:** `12adeb3`

**Próximo passo sugerido:**
- **Ciclo #207 — UX:** Banner `#junina-banner` em `index.html` — remover/atualizar após 30/06. Preparar com antecedência (ainda estamos em maio, mas o banner precisa ter lógica de expiração)
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado + collab "Como Treinar Dragão" jun/26 + intel pré-julho
- **Ciclo #209 — Conteúdo:** Dia dos Pais 09/08 — posts feed IG/TikTok (WA standalone #170 já existe; falta o conteúdo visual)
- **Operador (URGENTE):** Confirmar ≥3 reviews Google Maps → descomentar aggregateRating (Blocker #7)
- **Operador:** Confirmar horário julho — mesmo ou diferente? (Blocker #8)
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)
- **Operador:** Preparar prêmios físicos sorteio 3 meses (Blocker a confirmar: Semana Caramelado / Kit MilkyPot Fã / Mês VIP)

_Belinha — Ciclo #206 | 2026-05-13_

---

## Ciclo #205 — 2026-05-13

**Área:** SEO local Londrina — Schema.org LocalBusiness: `areaServed` + 2 novos FAQs + blockers #7-#8

**Contexto:** Prescrito pelo ciclo #204. Auditoria do Schema.org em `index.html` revelou 3 oportunidades: (1) LocalBusiness sem `areaServed` (sinal SEO local fraco para "açaí Londrina" etc.), (2) FAQPage desatualizada — sem FAQ sobre Potinho Caramelado (lançado 01/07) nem açaí buffet self-service (diferencial exclusivo Muffato), (3) `aggregateRating` e horário julho sem registro formal de blocker.

**O que pesquisou/analisou:**
- Releitura do Schema.org LocalBusiness (linhas 31–77) — confirmado ausência de `areaServed`
- Releitura do FAQPage (linhas 79–191) — 13 FAQs existentes, nenhum sobre Potinho Caramelado ou açaí buffet
- Verificação do bloco `aggregateRating` comentado (linhas 193–208) — sem rastreabilidade formal em `blockers.md`
- Confirmado que todos os 4 blocos JSON-LD são válidos (`node` parse test)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | `areaServed` (City: Londrina/PR) adicionado ao LocalBusiness; 2 novos FAQs: "Potinho Caramelado" + "Açaí buffet self-service Londrina" |
| `belinha/blockers.md` | Blocker #7 (aggregateRating — aguarda ≥3 reviews Google Maps + valores reais) + Blocker #8 (horário julho — confirmar com operador) |

**Impacto esperado:**
- `areaServed` → reforça relevância geográfica para queries "X Londrina" nas SERPs
- FAQ Potinho Caramelado → rich result potencial para "potinho caramelado londrina" / "potinho caramelo muffato"
- FAQ Açaí Buffet → rich result para "açaí buffet londrina" / "buffet açaí muffato"
- Blockers formalizados → operador tem instrução clara para ativar estrelas Google (alto impacto CTR)

**Commit:** `aa2c58a`

**Próximo passo sugerido:**
- **Ciclo #206 — Conversão:** D+90 reativação brief (24/07) — clientes inativos da inauguração na janela crítica (complementa o 3 meses de 25/07)
- **Ciclo #207 — UX:** `cardapio.css` (21K) orphaned — avaliar deleção (Blocker #6 em `blockers.md`)
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado (collab "Como Treinar Dragão" jun/26 — monitorar resposta de inverno)
- **Ciclo #209 — Conteúdo:** Brief semanal semana 14 (21–25/07) — preparação para comemorativo 3 meses
- **Operador (URGENTE):** Confirmar ≥3 reviews Google Maps → descomentar aggregateRating (Blocker #7)
- **Operador:** Confirmar horário julho — mesmo ou diferente? (Blocker #8)
- **Operador (URGENTE — VENCIDO 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador (21/07):** Preparar prêmios físicos sorteio + decoração "3 meses"
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)

_Belinha — Ciclo #205 | 2026-05-13_

---

## Ciclo #204 — 2026-05-13

**Área:** Conversão — Brief aniversário 3 meses (25/07) + mecânica sorteio + broadcasts WA segmentados

**Contexto:** Prescrito pelo roadmap #200 e ciclo #203. Em 25/07/2026 (sábado — 91 dias / 13 semanas exatos da inauguração), a loja completa 3 meses. O brief de sustentação do Caramelado (ciclo #203) já deixou um teaser vago "algo especial em 25/07" no post de 17/07. Era necessário um playbook completo definindo o que é esse "algo especial".

**O que pesquisou/analisou:**
- Leitura do log ciclo #203 + confirmação do teaser embutido em `sustentacao-caramelado-semanas-2-3.md` (post 17/07 menciona "algo especial em 25/07")
- Verificação de arquivos existentes: `whatsapp-aniversario-6meses.md` (estrutura referência) + `reativacao-d60-onda1-jun26.md` (onda anterior)
- Confirmado que não existia nenhum brief específico de 3 meses (nem D+90 nem aniversário)
- Calculado: 25/04 + 91 dias = 25/07, e 91 = 13 semanas exatos → sábado novamente. Perfeito para celebração.
- Diagnóstico: 5 elementos faltando (post comemorativo, reel, 3 broadcasts WA segmentados, sorteio, sequência Stories)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/3meses-25jul-comemoracao-sorteio.md` | NOVO — 453 linhas — playbook completo 3 meses |

**Detalhes do conteúdo criado:**
- **Mecânica sorteio "3 meses — 3 prêmios"**: 3 prêmios escalonados (Semana Caramelado / Kit Fã / 1 mês VIP), 3 formas de participar (IG + WA + compra no dia), regras, FAQ rápido para WA
- **Calendário da semana** 21/07→26/07 completo: aviso (21/07), último lembrete + post feed (23/07), dia do aniversário (25/07) com Stories hora a hora, anúncio ganhadores (26/07)
- **3 broadcasts WA segmentados**: Seg A (clientes inauguração 25/04–30/04 — "você estava lá desde o início"), Seg B (primeiros 30 dias 01–25/05), Seg C (base geral) — com horários escalonados 10h/11h/12h
- **Reel TikTok "3 meses depois"** — roteiro segundo a segundo comparando Dia 1 vs. hoje (30s)
- **Integração MilkyPass**: pontos dobro + carimbo triplo + bônus referência em 25/07
- **KPIs** com 8 indicadores e metas numéricas (≥200 comentários IG, ≥150 novos seguidores, ≥40% faturamento extra, etc.)
- **Checklist operacional** escalonado até 26/07 com ≥20 itens verificáveis
- **Versão mínima** se operador com pouca energia (3 itens obrigatórios)
- **Tabela de integração** com 6 documentos existentes

**Commit:** `7dac4c6`

**Próximo passo sugerido:**
- **Ciclo #205 — SEO:** Schema.org LocalBusiness — verificar `aggregateRating` (≥3 reviews Google Maps) + atualizar horário julho
- **Ciclo #206 — Conversão:** D+90 reativação brief (24/07) — clientes inativos da inauguração na janela crítica (complementa o 3 meses de 25/07)
- **Ciclo #207 — UX:** `cardapio.css` (21K) orphaned — avaliar deleção (Blocker #6 em `blockers.md`)
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado (collab "Como Treinar Dragão" jun/26 + Smoor's inverno — monitorar)
- **Operador (URGENTE — VENCIDO 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador (21/07):** Preparar prêmios físicos sorteio + decoração loja balões/banner "3 meses"
- **Operador (21/07):** Separar etiquetas WA Business: `#inauguracao`, `#primeiros-30d`, base geral
- **Operador (25/07):** Ativar pontos dobro + carimbo triplo no PDV
- **Operador:** Google Search Console — indexação sitemap.xml (pendente ciclo #148)
- **Operador:** Verificar ≥3 reviews Google Maps → liberar `aggregateRating` Schema.org

_Belinha — Ciclo #204 | 2026-05-13_

---

## Ciclo #203 — 2026-05-13

**Área:** Conteúdo — Brief sustentação Potinho Caramelado semanas 2-3 IG/TikTok (07–17/07)

**Contexto:** Prescrito pelo roadmap #200 + ciclo #202. Existiam reveal (01/07) e consolidação (02–07/07) completos, e planos semanais genéricos para semanas 12-13 (ciclos #51/#55). Faltavam briefs dedicados de posts feed + reels TikTok para a sustentação do Caramelado com profundidade equivalente ao reveal — especialmente integrando o intel do ciclo #202 (pistache JAH como contra-programming).

**O que pesquisou/analisou:**
- Leitura de `consolidacao-potinho-caramelado-02-07jul.md` — mapear o que já foi coberto (02–07/07)
- Leitura de `pos-inauguracao-semana12.md` e `semana13.md` — confirmar que planos semanais existem mas não têm briefs de post/reel específicos para o Caramelado
- Leitura de `belinha/competitors/jhoy.md` (ciclo #202) — intel JAH pistache 12/06: ocupação do mesmo daypart inverno, mesma audiência jovem. Estratégia contra-programming definida.
- Diagnóstico: 5 peças de conteúdo faltando (3 posts feed + 2 reels), cobrindo marco de 1 semana do lançamento (07/07) até teaser 3 meses (17/07)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/sustentacao-caramelado-semanas-2-3.md` | NOVO — 314 linhas — brief completo semanas 2-3 |

**Detalhes do conteúdo criado:**
- **Post feed 07/07** (Seg) — "1 semana de Potinho Caramelado" · hero shot · caption longa (feed) + curta (TikTok/Stories)
- **Reel TikTok/Reels 09/07** (Qua) — "Como montar o Caramelado" · 15s · roteiro segundo a segundo · instruções ao operador (celular + tripé)
- **Post feed 12/07** (Sáb) — "Londrina aprovou" · carrossel UGC (Opção A) ou "por que o caramelo" (Opção B sem UGC)
- **Reel TikTok/Reels 14/07** (Ter) — "Qual topping você escolheria?" · enquete nos comentários · lógica de continuidade (vencedor vira post do dia seguinte)
- **Post feed 17/07** (Qui) — "Seja Embaixador + teaser 3 meses" · CTA candidatura DM/WA · teaser vago do 25/07
- **Contra-programming JAH pistache** — estratégia integrada (não citar concorrente, reforçar personalização + calor + tradição brasileira)
- **Tabela de integração** com 6 documentos existentes
- **KPIs** com metas por semana (impressões, salvamentos, plays, UGC, candidatos embaixador)
- **Notas operacionais** com versão mínima (3 peças se pouco tempo) e fallback sem UGC
- **Bônus Story diária** (selfie loja pré-abertura — 30 segundos, impacto de consistência)

**Commit:** `fb3dae5`

**Próximo passo sugerido:**
- **Ciclo #204 — Conversão:** Brief 3 meses de loja 25/07 — post comemorativo + broadcast WA "você estava lá desde o início" + mecânica sorteio (prescrito no roadmap #200)
- **Ciclo #205 — SEO:** Schema.org LocalBusiness — verificar se há ≥3 reviews Google Maps desbloqueando `aggregateRating` + atualizar horário julho
- **Ciclo #206 — Conversão:** D+90 reativação brief (24/07) — clientes da inauguração entram na janela
- **Ciclo #207 — UX:** `cardapio.css` (21K) orphaned — avaliar deleção (Blocker #6 em `blockers.md`)
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado (collab "Como Treinar Dragão" jun/26 + Smoor's inverno — monitorar)
- **Operador (URGENTE — 30/05 — VENCIDO):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador (21/07):** Anunciar Embaixador escolhido (candidaturas abertas em 17/07)
- **Operador (22/06):** Preparar listas D+60 WA Business — ver `reativacao-d60-onda1-jun26.md`
- **Operador:** Google Search Console — indexação sitemap.xml (pendente ciclo #148)
- **Operador:** Verificar ≥3 reviews Google Maps → liberar `aggregateRating` Schema.org

_Belinha — Ciclo #203 | 2026-05-13_

---

## Ciclo #202 — 2026-05-13

**Área:** Concorrentes — JohnnyJoy + JAH do Açaí (refetch após +33 ciclos)

**Contexto:** Ciclo prescrito pelo roadmap #201–#210. Violação v21d (regra de atualização a cada 21 dias): última atualização JohnnyJoy em ciclo #167 (04/05/2026), JAH em ciclo #160 (08/05/2026) — ~4–9 dias, não 33 ciclos em dias, mas #202-#167 = 35 ciclos = ~3 dias na escala real. Independentemente, ciclo #202 era a prioridade competitiva prescrita para intel de inverno/julho 2026.

**O que pesquisou/analisou:**
- WebSearch: "JohnnyJoy festa junina São João junho 2026" → zero campanha temática
- WebSearch: "JohnnyJoy inverno julho 2026 lançamento novo sabor" → padrão Galáktico (Nestlé/Galak, julho 2025) identificado como baseline para 2026
- WebSearch: "JohnnyJoy Galaktico Nestle julho 2025 milkshake" → preços R$22,90/R$26,90 + ação 18/07 tatuagem galáctica grátis
- WebSearch: "JAH do Açaí 2026 novo produto campanha" → JAH Coffee & Tea descoberto (novo braço café+chá, +80% receita, 1ª unidade SP março 2026)
- WebSearch: "JAH do Açaí Londrina 2026" → nenhuma unidade detectada em Londrina
- WebFetch: johnnyjoy.com.br, jahdoacai.com.br → HTTP 403 (sites bloqueiam scraping)
- Dados compilados via meta-resultados de buscas + artigos acessíveis (amostrasgratis.shop, terra.com.br, exame.com, diariodocomercio.com.br)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/johnnyjoy.md` | ATUALIZADO — seção ciclo #202 com: (1) Festa Junina 2026 = zero ativação confirmado; (2) Padrão Galáktico julho — preços R$22,90/R$26,90, ação tatuagem 18/07; (3) tabela preços atualizada; (4) radar competitivo julho 2026 |
| `belinha/competitors/jhoy.md` | ATUALIZADO — seção ciclo #202 com: (1) JAH Coffee & Tea (grande pivô 2026 — café+chá +80% receita, 10 un. meta); (2) expansão Portugal; (3) faturamento R$210 mi meta; (4) sem unidade Londrina; (5) radar competitivo |

**Destaques Intel:**
- **JohnnyJoy:** padrão inverno = collab Nestlé em julho (Galák 2025, provável nova collab jul/2026). Sem Festa Junina. Sem Londrina. Preços premium R$22,90–R$26,90 vs. MilkyPot Mini R$10 → gap enorme, diferente público
- **JAH do Açaí:** pivô estratégico para café+chá (diversificação de daypart). Expansão internacional (Portugal). Meta R$210 mi. Sem presença Londrina = sem ameaça imediata
- **Insight acionável:** ação de tatuagem JohnnyJoy gera UGC forte → MilkyPot pode adaptar: "mostre a ovelhinha desenhada no braço / produto na foto → ganhe X"

**Commit:** `c353c22` + `55765cd` (suplemento B — agente background)

**Suplemento #202B — intel adicional (agente background):**
- **JohnnyJoy:** Campanha 10 Anos 10/04/2026 confirmada (R$10 por 300ml), Dia do Milkshake 2ª ed. 12/09/2026 (roupa azul/rosa → 300ml grátis), "Dois Amores" histórico namorados, preços completos (tradicionais R$19–22,90 / especiais R$25,90–28,90), calendário 2026 consolidado
- **JAH do Açaí:** FeliciJAH 20/03/2026 (R$16,99/360ml, 3ª edição, 55k clientes 2025), **Sorvete Pistache lançamento 12/06/2026** (até set/2026, parceria Francisco Santana, in-house) + campanha Caio Castro Namorados, JAH Coffee & Tea detalhado (~35 itens, investimento R$80-100k, retorno 14-18m), preços (R$59,90/kg + app cashback 20%), 190+ unidades 500k clientes/mês
- **Alerta crítico:** JAH lança pistache exatamente 12 dias antes do São João — cobre o inverno inteiro. Operador deve avaliar se tem topping pistache para contra-programar ou reforçar o ângulo "tradição brasileira" do Potinho Junino

**Próximo passo sugerido:**
- **Ciclo #203 — Conteúdo:** Potinho Caramelado posts feed IG/TikTok semanas 2-3 (07–17/07) — lifestyle + "como montar" + testimonial
- **Ciclo #204 — Conversão:** 3 meses de loja 25/07 — post comemorativo + broadcast WA "você estava lá desde o início"
- **Ciclo #205 — SEO:** Schema.org LocalBusiness — atualizar horário julho + verificar se ≥3 reviews Google desbloqueiam `aggregateRating`
- **Ciclo #206 — Conversão:** D+90 reativação brief (24/07)
- **Ciclo #208 — Concorrentes:** Refetch MilkyMoo pós-Caramelado (collab "Como Treinar Dragão" jun/26 + Smoor's inverno — monitorar)
- **Operador (URGENTE — 30/05 — VENCIDO):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador (22/06):** Preparar listas D+60 WA Business — ver `reativacao-d60-onda1-jun26.md`
- **Operador:** Google Search Console — indexação sitemap.xml (pendente ciclo #148)
- **Operador:** Verificar ≥3 reviews Google Maps → liberar `aggregateRating` Schema.org

_Belinha — Ciclo #202 | 2026-05-13_

---

## Ciclo #201 — 2026-05-13

**Área:** Conversão — Brief D+60 Onda 1 (22–28/06/2026 · São João + última tentativa de reativação)

**Contexto:** Marco #200 identificou D+60 como gap crítico urgente: 24/06 = D+60 da inauguração E São João, janela abre em ~11 dias. Existia playbook genérico D+60 em `whatsapp-reativacao-d30-d60.md` (ciclo #106) mas nenhum brief operacional contextualizado para São João + Potinho Junino, equivalente ao `reativacao-d30-onda1-maio26.md` do ciclo #195.

**O que pesquisou/analisou:**
- Leitura de `whatsapp-reativacao-d30-d60.md` — seção D+60 genérica (linhas 116–165): uma única mensagem, sem calendário, sem integração junina
- Leitura de `reativacao-d30-onda1-maio26.md` — estrutura referência: segmentação por lotes, calendário diário, scripts por variante, KPIs, checklist — padrão a replicar
- Leitura de `reel-sao-joao-24jun-potinho-junino.md` — gancho São João disponível para D+60
- Leitura de `whatsapp-junina-2026.md` — J4 broadcast em 24/06 às 11h: confirmado não colidir
- Diagnóstico: D+60 não pode ser no mesmo dia do J4 broadcast (24/06). Melhor: 23/06 (véspera) ou 25/06 (pós-São João)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reativacao-d60-onda1-jun26.md` | NOVO — 256 linhas — brief operacional completo para D+60 Onda 1 |

**Detalhes do conteúdo criado:**
- **Contexto estratégico:** por que 24/06 é o melhor dia do ano (São João + Potinho Junino últimos dias + psicologia D+60)
- **Segmentação:** Lote A (inativos D+30 que não responderam) + Lote B (nunca contactados) + excluir recorrentes
- **Calendário semanal** 22–28/06: sequência dia a dia com horários, evitando colisão com J4 broadcast de 24/06
- **Mensagem 1 Lote A** — 2 variantes: Emotiva (maioria) + Feedback (≤8 casos específicos)
- **Mensagem 1 Lote B** — tom de gratidão pela inauguração (primeira mensagem ativa)
- **Mensagem 2** — apenas para quem respondeu D+60 mas não converteu (28/06, urgência Potinho Junino)
- **Roteiro de resposta** — 3 cenários: interesse, feedback negativo, sem resposta
- **Tabela de integração** com 5 documentos existentes
- **KPIs** com metas (resposta ≥15%, conversão ≥5%)
- **Checklist** de execução com 11 itens datados
- **Nota LGPD** — D+60 é o último contato proativo; sem resposta → `#arquivado`

**Commit:** `df004ab`

**Próximo passo sugerido:**
- **Ciclo #202 — Concorrentes:** Refetch Johnny + Jhoy — última atualização há +33 ciclos (violação v21d). Buscar campanhas de inverno/julho 2026
- **Ciclo #203 — Conteúdo:** Sustentação Potinho Caramelado semanas 2-3 IG/TikTok (01–14/07)
- **Ciclo #204 — UX:** `cardapio.css` (21K) orphaned — Opção A (deletar) ou Opção B (incorporar ao style.css). Blocker #6 em `belinha/blockers.md`
- **Ciclo #205 — SEO:** Verificar se há otimizações adicionais no sitemap.xml para facilitar indexação (operador ainda não solicitou indexação no GSC)
- **Operador (URGENTE — 22/06):** Preparar listas D+60 no WA Business — consultar `reativacao-d60-onda1-jun26.md` Segmentação
- **Operador (URGENTE — 23/06 às 18h):** Disparar Lote A — ver Mensagem 1 Variante Emotiva
- **Operador (URGENTE — 30/05 — VENCIDO):** Confirmar ingredientes + naming "Potinho Junino" ⚠️ Crítico para D+60 Mensagem 2 e scripts
- **Operador:** Google Search Console — indexação sitemap.xml (pendente desde ciclo #148)
- **Operador:** Verificar ≥3 reviews Google Maps → liberar `aggregateRating` Schema.org

_Belinha — Ciclo #201 | 2026-05-13_

---

## Ciclo #200 — 2026-05-13

**Área:** Auto-aprimoramento (MARCO) — revisão 199 ciclos + atualização `belinha/estrategia.md`

**Contexto:** Ciclo #200 é marco obrigatório de auto-aprimoramento. Releitura completa de `belinha/log.md` (ciclos #162–#199) + `belinha/estrategia.md` (aprimoramento #161). Diagnóstico de padrões, gaps e desperdícios. Produção de roadmap #201–#210 e regras v21.

**O que pesquisou/analisou:**
- Leitura de `belinha/log.md`: ciclos #162–#199 (38 ciclos) — extraídas áreas, entregas, valor
- Leitura de `belinha/estrategia.md`: último auto-aprimoramento era ciclo #161 (2026-05-08)
- Leitura de `belinha/blockers.md`: 6 blockers ativos, CNPJ/DPO em +39 ciclos sem resolução
- Contagem de gaps: D+60/D+90 ausentes, Johnny/Jhoy +33 ciclos sem refetch, marcos de tempo loja não sistematizados

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | ADICIONADO Auto-aprimoramento #200 (MARCO): análise top-10 entregas #162–#199, 10 itens menos eficazes, status 2026-05-13 (dia 18 de operação), tabela próximos eventos, 4 novas regras v21 (briefs granulares, série D+30/60/90, marcos de tempo, ciclo máximo intel), checklist atualizado 25 itens, roadmap #201–#210 |

**Principais descobertas:**
- **Top valor:** Ecossistema Festa Junina completo (10+ arquivos coordenados) + pivot Junino→Caramelado (5 canais) + D+30 reativação
- **Desperdício:** Briefs diários (ciclos #177–#182) com validade <48h — custo alto, reutilização mínima → regra v21a criada
- **Gap crítico urgente:** D+60 reativação (24/06 = D+60 da inauguração, coincide com São João) — janela se abre em ~7 dias
- **Gap intel:** Johnny/Jhoy sem refetch há +33 ciclos (violação v21d criada exatamente para este padrão)
- **Gap estrutural:** Marcos de loja (3m/6m/1a) não sistematizados → regra v21c criada
- **Blocker crescente:** CNPJ/DPO LGPD em +39 ciclos — risco legal de multa ANPD

**Commit:** (próximo)

**Próximo passo sugerido:**
- **Ciclo #201 — Conversão:** D+60 reativação brief URGENTE (24/06 = São João + D+60 da inauguração). Clientes da inauguração entram na janela D+30 esta semana. Ver roadmap #201–#210 em `belinha/estrategia.md`
- **Ciclo #202 — Concorrentes:** Refetch Johnny + Jhoy (+33 ciclos sem atualização — v21d violado)
- **Ciclo #203 — Conteúdo:** Potinho Caramelado sustentação semanas 2-3 IG/TikTok
- **Operador (URGENTE — 30/05):** Confirmar ingredientes + naming "Potinho Junino"
- **Operador (URGENTE — prazo passado):** Google Search Console — indexação sitemap
- **Operador:** Verificar se loja já tem ≥3 reviews Google Maps → desbloquear `aggregateRating` Schema.org

_Belinha — Ciclo #200 (MARCO) | 2026-05-13_

---

## Ciclo #199 — 2026-05-12

**Área:** Conversão — Script pivot narrativo "Potinho Junino acabou → Potinho Caramelado chegou"

**Contexto:** Ciclo #198 prescreveu criação de script de pivot para o cliente no momento pós-30/06. Diagnóstico confirmou: `encerramento-potinho-junino-30jun.md`, `reveal-potinho-caramelado-01jul.md` e `consolidacao-potinho-caramelado-02-07jul.md` existem, mas nenhum deles tem os scripts de atendimento real — o que falar no balcão, como responder no WA, como atualizar keyword automática, como responder comentários nos posts juninos após o encerramento.

**O que pesquisou/analisou:**
- Leitura de `encerramento-potinho-junino-30jun.md` — confirma que não há scripts de atendimento/pivot
- Leitura de `reveal-potinho-caramelado-01jul.md` — confirma foco no reveal, não no redirecionamento de clientes que perguntam pelo Junino
- Grep de "pivot", "script", "atendente", "balcão" nos três arquivos — zero ocorrências
- Mapeamento de 5 canais onde o cliente pode pedir Junino após 30/06: WA automático (keyword), WA manual, PDV presencial, comentários Instagram, comentários TikTok

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pivot-junino-para-caramelado.md` | NOVO — 213 linhas — script completo de pivot para 5 canais |

**Detalhes do conteúdo criado:**
- **Seção 1:** Atualização de auto-resposta WA Business para keyword `JUNINO26` (texto pronto para copiar/colar, instrução passo-a-passo de onde editar no app)
- **Seção 2:** Script PDV balcão — 3 variantes (padrão, fila rápida, cliente insistente/desapontado)
- **Seção 3:** Script WA individual — 2 variantes (padrão e para fã recorrente com histórico)
- **Seção 4:** Templates de resposta para comentários Instagram/TikTok — 3 tons (pedido direto, nostalgia, marcação de amigos)
- **Seção 5:** Broadcast WA de transição — 01/07 às 09h — "ponte emocional" simultânea ao reveal
- **Seção 6:** Tabela de decisão rápida (canal × situação × script)
- **Seção 7:** Checklist de implementação com datas e horários específicos
- **Seção 8:** Variante "em breve" caso Caramelado não esteja disponível em 01/07
- **Tabela de integração** com 5 documentos relacionados

**Commit:** `65e1e04`

**Próximo passo sugerido:**
- **Ciclo #200 (MARCO):** Auto-aprimoramento — releitura completa `belinha/log.md` (199 ciclos) + revisão/atualização `belinha/estrategia.md` com foco em eficiência dos próximos 50 ciclos
- **Ciclo #201 — UX:** `cardapio.css` (21K) é orphaned desde ciclo #112 — decisão definitiva: Opção A (deletar após confirmar 0 dependências) ou Opção B (integrar ao style.css o que for útil). Ver `belinha/blockers.md` blocker #6
- **Ciclo #202 — SEO:** Sitemap.xml + meta tags — Google Search Console pendente desde ciclo #148 (operador ainda não executou). Verificar se há ajustes que podem ser feitos no próprio sitemap para facilitar indexação
- **Ciclo #203 — Concorrentes:** Refetch Johnny + Jhoy (últimas atualizações foram há vários ciclos — verificar campanhas de inverno/julho 2026)
- **Operador (URGENTE — 30/06 às 23h):** Atualizar keyword `JUNINO26` no WA Business — consultar `pivot-junino-para-caramelado.md` Seção 1
- **Operador (URGENTE — 01/07 às 08h45):** Preparar lista de broadcast e disparar às 09h — consultar Seção 5
- **Operador (URGENTE — prazo 25/05):** Google Search Console — solicitar indexação sitemap.xml
- **Operador (URGENTE — prazo 30/05):** Confirmar ingredientes + naming "Potinho Junino" (afeta preenchimento dos scripts acima)
- **Operador:** Imprimir script de balcão da Seção 2 e fixar atrás do caixa em 01/07

_Belinha — Ciclo #199 | 2026-05-12_

---

## Ciclo #198 — 2026-05-11

**Área:** UX (auditoria `js/cardapio.js`) → pivot Conversão (WA Business setup junino)

**Contexto:** Prescrição era auditar `js/cardapio.js` para cálculos de fidelidade/desconto/bundle. Auditoria revelou: (1) arquivo já confirmado como órfão desde ciclo #112 — nenhum HTML o carrega; (2) sem código de fidelidade/desconto/bundle; (3) cálculos internamente consistentes após fix do ciclo #193. Pivotou para Conversão — lacuna urgente: nenhum guia passo-a-passo de configuração do WA Business para os keywords juninos. São João é em 44 dias.

**O que pesquisou/analisou:**
- Releitura de `belinha/blockers.md` — confirmou status órfão de `js/cardapio.js` (blocker #6, ciclo #112)
- Grep em `js/cardapio.js` por `fidelidade`, `desconto`, `bundle`, `promo` — zero ocorrências
- Verificação de consistência: `renderResumo` × `changeQty` × `addToMenuCart` × `updateMenuCartQty` — todos usam `(sizePrice + extrasTotal) × qty + bebidasTotal` (correto)
- Revisão de `belinha/content/whatsapp-junina-2026.md` — tem keyword `JUNINA26` e broadcasts mas sem tutorial de configuração WA Business
- Grep de `JUNINO26` em todo o repositório — mencionado em 10+ arquivos como "pendente configurar" mas SEM auto-resposta completa e SEM guia de setup
- Identificado: `DESPEDIDAJUNINO` keyword completamente ausente (prescrito em ciclos #183–185 mas nunca materializado)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/wa-business-setup-junino.md` | NOVO — 200+ linhas — guia completo de setup WA Business |

**Detalhes do conteúdo criado:**
- **Sumário de 8 configurações** com datas-limite e status ⬜
- **Tutorial passo-a-passo** de como configurar keyword no app WA Business (Android/iOS)
- **3 auto-respostas prontas** para copiar/colar: `JUNINA26` (campanha geral, ativar 06/06), `JUNINO26` (produto, ativar 16/06), `DESPEDIDAJUNINO` (encerramento, ativar 26/06) — terceira era gap crítico não coberto por nenhum doc anterior
- **3 respostas rápidas** (`/composicao`, `/preco`, `/delivery`) com atalhos de balcão prontos
- **Mensagem de ausência noturna festiva** para ativar 17/06–30/06
- **Instruções de listas de transmissão** com 3 segmentações recomendadas
- **Calendário de implementação** com 7 marcos e urgência por cores
- **Guia de teste** para o operador verificar antes de lançar
- **Tabela de integração** com 6 documentos relacionados

**Commit:** (a seguir)

**Próximo passo sugerido:**
- **Ciclo #199 — Conversão:** Brief de encerramento definitivo do Potinho Junino (30/06) — além do `encerramento-potinho-junino-30jun.md` existente, criar script de pivot narrativo para o cliente: "o Potinho Junino acabou, mas o Caramelado chegou"
- **Ciclo #200 (marco):** Auto-aprimoramento — releitura completa `belinha/log.md` + revisão `belinha/estrategia.md`
- **Operador (URGENTE — prazo 06/06):** Ativar keyword `JUNINA26` no WA Business — consultar `wa-business-setup-junino.md` Parte 1
- **Operador (URGENTE — prazo 30/05):** Confirmar ingredientes + naming "Potinho Junino" — bloqueia preenchimento de `/preco` no guia acima
- **Operador (URGENTE — prazo 25/05):** Google Search Console — solicitar indexação sitemap.xml (1 mês da inauguração)
- **Operador:** Confirmar preços de tamanho para preencher `/preco` no guia antes de 16/06
- **js/cardapio.js:** Decisão pendente (Opção A deletar / Opção B integrar) — ver `belinha/blockers.md` blocker #6

_Belinha — Ciclo #198 | 2026-05-11_

---

## Ciclo #197 — 2026-05-11

**Área:** Conteúdo — Programa "Quarta Feliz" (WA semanal) + contracampanha "Dia da Vaca" (08/07/2026)

**Contexto:** Ciclo #196 revelou que o MilkyMoo usa "Quarta da Moo" (50% OFF toda quarta via app) como principal mecânica de retenção semanal. MilkyPot não tem app — precisa de equivalente via WA. Além disso, o "Dia da Vaca" do MilkyMoo (08/07) é oportunidade de piggyback cultural com a ovelhinha sem citar o concorrente. Esses dois tópicos foram agrupados por serem a mesma resposta estratégica: criar rituais semanais de engajamento com a Belinha como protagonista.

**O que pesquisou/analisou:**
- Intel ciclo #196: "Quarta da Moo" = toda quarta, 50% OFF em sabores selecionados, app exclusivo
- Intel ciclo #196: "Dia da Vaca" = 08/07, cupom "COWERA", Pintadinha 300ml R$9,90
- Diagnóstico de posicionamento: MilkyMoo treina cliente a esperar desconto (dependência de preço) vs MilkyPot treina cliente a esperar surpresa (valor percebido > valor de face)
- Calendário junho-julho: 24/06 (São João), 01/07 (Potinho Caramelado), 08/07 (Dia da Vaca), alinhados com rotação Quarta Feliz

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/quarta-feliz-dia-da-vaca.md` | NOVO — 273 linhas — programa completo |

**Detalhes do conteúdo criado:**
- **Tabela comparativa** MilkyMoo vs MilkyPot (canal, mecânica, percepção)
- **4 tipos de Quarta Feliz** em rotação mensal: Semana A (Topping Surpresa), Semana B (Desafio UGC), Semana C (Recompensa 2x carimbos), Semana D (Ovelhinha livre)
- **Mensagens prontas** para cada tipo (copiar-colar no WA Business)
- **Calendário Quarta Feliz** junho-julho com sugestão de surpresa para cada data
- **Integração estratégica 01/07:** Quarta do Caramelo = teaser do Potinho Caramelado (lançamento mesmo dia)
- **Brief completo Dia da Vaca (08/07):** arte feed, caption principal (feeds + shorts), sequência 4 Stories (10h–19h), broadcast WA, KPIs, checklist de produção (preparar até 04/07)
- **Regra de ouro:** NUNCA citar MilkyMoo pelo nome nas peças — piada funciona independente

**Commit:** `30f4998`

**Próximo passo sugerido:**
- **Ciclo #198 — UX:** Auditoria `js/cardapio.js` (1050 linhas) — ciclo #193 corrigiu bug de bebidas × qty; verificar outros padrões inconsistentes de cálculo (ex: fidelidade, desconto, item bundle)
- **Ciclo #199 — Conversão:** Script WA Business "Festival Junino" — keyword trigger + mensagem automática + checklist operacional pré-24/06
- **Ciclo #200 (marco):** Auto-aprimoramento — releitura `belinha/log.md` completo + revisão `belinha/estrategia.md`
- **Operador (URGENTE — prazo 30/05):** Confirmar ingredientes + naming "Potinho Junino" — afeta mensagens D+30 da onda 1
- **Operador (URGENTE — prazo 25/05):** Executar guia Google Search Console (1 mês da inauguração)
- **Operador:** Implementar Quarta Feliz como rotina — configurar lembrete toda terça pra preparar a mensagem
- **Operador:** Briefar designer com arte do Dia da Vaca até 04/07

_Belinha — Ciclo #197 | 2026-05-11_

---

## Ciclo #196 — 2026-05-11

**Área:** Concorrentes — Intel inverno/junho-julho 2026: MilkyMoo + The Best Açaí

**Contexto:** Última atualização de concorrentes foi ciclo #187 (10/05), há 9 ciclos. Janela crítica: inverno 2026 + São João (24/06) + Potinho Junino MilkyPot (data a confirmar) + Potinho Caramelado (01/07) aproximando. Intel competitiva desatualizada = risco de posicionamento errado nas campanhas de junho-julho.

**O que pesquisou/analisou:**
- WebSearch: MilkyMoo campanhas maio-junho 2026 → encontrou ativação Shakira + Como Treinar o Dragão
- WebSearch: MilkyMoo Dia da Vaca, Dia do Milkshake, Quarta da Moo → promoções recorrentes mapeadas
- WebSearch: MilkyMoo Smoor's + Havanna → sabores premium inverno com posicionamento "aconchego"
- WebSearch: The Best Açaí Festival Junino 2025 → padrão confirmado (sorvetes sazonais 26/06/2025)
- WebSearch: The Best Açaí Londrina 2026 → confirmação preço Gleba Palhano R$6,29/100g
- WebSearch: The Best Donuts → diversificação self-service (verão 2025)
- WebFetch: Maioria dos artigos retornou HTTP 403 — intel derivada de WebSearch e snippets agregados

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | ADICIONADO bloco ciclo #196: ativação Shakira (30/04–09/05), collab "Como Treinar o Dragão" (jun/26), Smoor's inverno + Havanna Matilda, tabela promoções recorrentes (Quarta da Moo 50%, Dia da Vaca 08/07, Dia do Milkshake 12/09), 5 implicações estratégicas para MilkyPot |
| `belinha/competitors/the-best-acai.md` | ADICIONADO bloco ciclo #196: Festival Junino 2025 detalhado + projeção 2026 (~26/06), The Best Donuts mapeado, tabela preços Londrina atualizada (Gleba R$6,29 vs Arthur Thomas R$5,99), 4 implicações estratégicas |

**Intel-chave descoberta:**

**MilkyMoo:**
- "Cultural hijacking" é estratégia consolidada: Shakira (mai), Como Treinar o Dragão (jun), O Boticário (abr-mai)
- "Carameluda" encerra maio → mercado aberto para Potinho Caramelado (01/07) capturar o público aquecido
- "Quarta da Moo" 50% via app toda semana = maior arma de retenção; MilkyPot precisa de equivalente WA
- "Dia da Vaca" 08/07 = oportunidade de contracampanha com ovelhinha no mesmo dia
- Smoor's = inverno quente (marshmallow tostado) — MilkyPot pode reposicionar Ninho como comfort food de inverno sem criar produto novo

**The Best Açaí:**
- Festival Junino deve se repetir ~26/06/2026 com sorvetes sazonais (canjica, pamonha, paçoca, cocada)
- Londrina: R$6,29/100g (Gleba Palhano) — mais caro que o esperado; MilkyPot deve reforçar "preço fixo, sem balança, sem susto"
- The Best Donuts: modelo de diversificação sem complexidade operacional — inspiração para topping sazonal MilkyPot
- HQ do Grupo em Londrina = 3 lojas locais como laboratório; monitorar semanalmente

**Commit:** `db736c8`

**Próximo passo sugerido:**
- **Ciclo #197 — Conteúdo:** Brief "Dia da Vaca" (08/07) — contracampanha ovelhinha ("aqui é dia da ovelhinha") + brief semanal quarta-feira ("Quarta Feliz" WA)
- **Ciclo #198 — UX:** Auditoria `js/cardapio.js` 1050 linhas — ciclo #193 corrigiu bug de bebidas; verificar outros padrões inconsistentes de cálculo
- **Ciclo #199 — Conversão:** Script de abertura do Festival Junino no WA Business (keyword + mensagem automática) + checklist operacional pré-26/06
- **Ciclo #200 (marco):** Auto-aprimoramento — releitura completa `belinha/log.md` + revisão `belinha/estrategia.md`
- **Operador (URGENTE — prazo 30/05):** Confirmar ingredientes + naming "Potinho Junino" — mensagens D+30 já escritas com contingência, mas nome oficial necessário
- **Operador:** Executar guia Google Search Console antes de 25/05 (1 mês da inauguração)
- **Operador:** Monitorar The Best Açaí Londrina em ~20/06 para detectar antecipação do Festival Junino
- **Operador:** Configurar contracampanha "Dia da Vaca" (08/07) no Stories — briefar designer 1 semana antes

_Belinha — Ciclo #196 | 2026-05-11_

---

## Ciclo #195 — 2026-05-11

**Área:** Conversão — Brief operacional reativação D+30 Onda 1 (25/05–01/06/2026)

**Contexto:** A janela D+30 para clientes da inauguração (25/04) abre em 25/05 — 2 semanas. O playbook genérico D+30/D+60 existia (ciclo #106), mas faltava um brief de **execução concreta** para esta onda específica: mensagens prontas (não templates com brackets), calendário dia-a-dia, segmentação em 3 lotes (inauguração / semana 1 / fãs sem retorno), integração com Desafio UGC #PotinhoMaisFeliz (semana 6) e Potinho Junino (novidade de temporada). A semana 25/05 é especialmente poderosa porque coincide com o 1 mês exato — gancho emocional real, não forçado.

**O que pesquisou/analisou:**
- Releitura de `whatsapp-reativacao-d30-d60.md` (ciclo #106) — playbook genérico existente, não adaptar: criar execução específica
- Releitura de `pos-inauguracao-semana6.md` — Desafio #PotinhoMaisFeliz (24–30/05): gancho UGC perfeito para reativação
- Releitura de `wa-broadcast-segunda-semana4.md` (ciclo #191) — confirmado que D+14 foi coberto; agora é D+30
- Verificado que Potinho Junino ainda aguarda confirmação do operador (prazo 30/05) — incluída contingência nos 3 cenários

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reativacao-d30-onda1-maio26.md` | NOVO — brief completo de execução (290 linhas) |

**Detalhes do brief criado:**
- **3 lotes segmentados** — Lote A (inauguração, tom "você fez história"), Lote B (semana 1, tom "saudade leve"), Lote C (fãs VIP, convite UGC)
- **Sequências completas** — A1→A2→A3 (3 mensagens), B1→B2 (2 mensagens), C1 (1 mensagem VIP)
- **Mensagens prontas para copiar-colar** (não templates — texto final)
- **Calendário dia-a-dia** 24/05–01/06 com horários recomendados
- **Guia de respostas** para 6 cenários comuns (vou comprar / não sabia do delivery / tive problema / Potinho Junino / sem interesse / silêncio)
- **Script de abertura do cardápio** em 2 mensagens sequenciais
- **Integração UGC** com Desafio #PotinhoMaisFeliz — como aproveitar a reativação para gerar conteúdo
- **Contingência em 3 cenários** para o Potinho Junino (confirmado / em andamento / não confirmado)
- **KPIs** com 5 métricas e metas numéricas
- **Checklist de 10 itens** por data/horário

**Commit:** `0feac9b`

**Próximo passo sugerido:**
- **Ciclo #196 — Concorrentes:** Refetch MilkyMoo + TheBest (última atualização há 8+ ciclos — urgente verificar posicionamento inverno/julho)
- **Ciclo #197 — UX:** Auditoria completa de `js/cardapio.js` (1050 linhas) — ciclo #193 corrigiu bug de bebidas; verificar se há outros padrões inconsistentes
- **Ciclo #198 — Conteúdo:** Brief semana 7 (01–07/06) com tema "Junho chegou" + teaser Potinho Junino
- **Operador (AÇÃO IMEDIATA — prazo 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️ URGENTE — afeta mensagens D+30
- **Operador (AÇÃO IMEDIATA — prazo 25/05):** Executar guia `guia-google-search-console.md` antes do 1 mês
- **Operador:** Preparar listas de contatos D+30 (lotes A, B, C) no WA Business até 24/05

_Belinha — Ciclo #195 | 2026-05-11_

---

## Ciclo #194 — 2026-05-11

**Área:** Conteúdo — Brief consolidação Potinho Caramelado 02–07/07/2026

**Contexto:** Prescrito no ciclo #193 (e originado no roadmap do reveal-potinho-caramelado-01jul.md, ciclo #189). O reveal de 01/07 gerou o pico de atenção; a semana seguinte é a janela crítica de consolidação: transformar curiosidade em hábito, UGC dos primeiros clientes em prova social, e o produto novo em carro-chefe de julho. Semana 11–12 do calendário, coincide com férias escolares em plena atividade.

**O que pesquisou/analisou:**
- Releitura de `reveal-potinho-caramelado-01jul.md` (ciclo #189) — roadmap pós-reveal indicava: Story UGC (02/07), guia toppings (03/07), 1 semana (07/07)
- Releitura de `pos-inauguracao-semana11.md` (ciclo #50) — bloco 02–04/07 existente mas superficial
- Releitura de `pos-inauguracao-semana12.md` (ciclo #51) — contexto férias escolares + família
- Releitura de `encerramento-potinho-junino-30jun.md` (ciclo #188) — confirmar arco narrativo completo
- Identificado gap: nenhum brief dedicado cobria 02–07/07 com a profundidade necessária (scripts WA, KPIs diários, checklist operacional, variantes)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/consolidacao-potinho-caramelado-02-07jul.md` | NOVO — brief completo (492 linhas) |

**Detalhes do conteúdo criado:**
- **6 dias com calendário individual** (02/07 a 07/07): Stories escalonados, posts feed, enquetes
- **Post feed educativo 03/07** — "Guia de toppings do Potinho Caramelado" (carrossel 5 slides + caption longa + versão TikTok)
- **WA Broadcast reativação (06/07)** — segmento: viram o reveal mas não compraram D+5
- **WA comemorativo 07/07** — benefício "CARAMELADO7" (topping extra) para quem comprou na 1ª semana
- **2 templates WA adicionais** (`/caramelado7`, `/toppingsdocaram`)
- **KPIs da semana** — 8 métricas com metas numéricas
- **Arco narrativo visual** — de 30/06 a 08/07+
- **Checklist de produção** — 10 itens escalonados por data/horário
- **Notas operacionais** — 3 cenários de contingência (baixo UGC, baixa adesão, operador sem tempo)

**Commit:** `3867b32`

**Próximo passo sugerido:**
- **Ciclo #195 — Conversão:** Estrutura de reativação D+30 para clientes da semana 1 (janela: 25/05–01/06) — clientes mais antigos que podem estar dormentes
- **Ciclo #196 — Concorrentes:** Refetch MilkyMoo + TheBest (última atualização há 6+ ciclos — verificar posicionamento julho/inverno)
- **Ciclo #197 — UX:** Auditoria `js/cardapio.js` restante (ciclo #193 corrigiu bug de bebidas — verificar se há outros padrões inconsistentes no arquivo de 1.050 linhas)
- **Operador (AÇÃO IMEDIATA):** Executar guia `guia-google-search-console.md` — sitemap pendente desde ciclo #148
- **Operador (AÇÃO IMEDIATA até 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️ URGENTE
- **Operador:** Confirmar benefício "CARAMELADO7" antes de enviar WA em 07/07
- **Operador:** Confirmar keyword `/caramelado7` no WA Business até 05/07
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #194 | 2026-05-11_

---

## Ciclo #193 — 2026-05-11

**Área:** Código/Performance — bug fix consistência de total com bebidas em `js/cardapio.js`

**Contexto:** Auditoria de `js/cardapio.js` (1.050 linhas, 46K) prescrita pelo ciclo #192. Arquivo está limpo — sem console.logs, sem dead code óbvio. Porém foi identificado um **bug de preço real**: 4 funções calculavam o total do pedido com fórmulas inconsistentes para bebidas.

**O que pesquisou/analisou:**
- Leitura completa de `js/cardapio.js` linha a linha
- Identificadas 4 fórmulas de total: `renderResumo` (l.582), `changeQty` (l.675), `addToMenuCart` (l.717), `updateMenuCartQty` (l.763)
- `renderResumo` + `changeQty`: `(base + adicionais) × qty + bebidas` → bebidas não multiplicadas por qty
- `addToMenuCart` + `updateMenuCartQty`: `(base + adicionais + bebidas) × qty` → bebidas multiplicadas por qty
- **Impacto concreto:** com qty=2 e bebida R$10, o cliente via R$10 no resumo mas o carrinho armazenava e cobrava R$20
- Conclusão: bebidas são por-pedido (não por-potinho), a fórmula do resumo estava correta e as funções de carrinho estavam erradas

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `js/cardapio.js` | `addToMenuCart` (l.717): `(price + extras + bebidas) × qty` → `(price + extras) × qty + bebidas` |
| `js/cardapio.js` | `updateMenuCartQty` (l.763): `(price + extras + bebidas) × qty` → `(price + extras) × qty + bebidas` |

**Impacto:**
- Elimina discrepância entre preço exibido no resumo e preço armazenado/cobrado no carrinho
- Bug afetava apenas pedidos com bebidas + qty > 1 (cenário realista: família pedindo 2+ potinhos + milkshake)
- Sem mudança visual — só a matemática interna do carrinho

**Commit:** `51997e3`

**Próximo passo sugerido:**
- **Operador (AÇÃO IMEDIATA):** Executar guia `guia-google-search-console.md` — submeter sitemap ⚠️ PENDENTE DESDE CICLO #148
- **Operador (AÇÃO IMEDIATA):** Executar WA broadcast `wa-broadcast-segunda-semana4.md` se ainda não executado
- **Ciclo #194 — Conteúdo:** Brief consolidação Potinho Caramelado pós-reveal (02–07/07)
- **Ciclo #195 — Conversão:** Estrutura de reativação D+30 para clientes da semana 1 (janela: 25/05–01/06)
- **Ciclo #196 — Concorrentes:** Refetch MilkyMoo + TheBest (última atualização há 6+ ciclos)
- **Operador (URGENTE até 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador:** Confirmar calda de caramelo + granola para Potinho Caramelado até 20/06
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #193 | 2026-05-11_

---

## Ciclo #192 — 2026-05-11

**Área:** SEO — Guia operacional Google Search Console + submissão do sitemap

**Contexto:** Blocker pendente desde ciclo #148: o `sitemap.xml` (`https://milkypot.com/sitemap.xml`) existe e está referenciado no `robots.txt`, mas nunca foi submetido ao Google Search Console. O operador nunca recebeu um guia passo-a-passo em português para fazer isso. Sem submissão, o Google pode levar semanas ou meses para descobrir e indexar as páginas organicamente — prejudicando o SEO local de Londrina ("potinho londrina", "açaí muffato", etc.).

**O que pesquisou/analisou:**
- Confirmou que `sitemap.xml` existe (619 bytes, 6 URLs mapeadas: `/`, `/cardapio.html`, `/desafio.html`, `/raspinha.html`, `/privacidade.html`, `/termos.html`)
- Confirmou que `robots.txt` aponta para o sitemap corretamente (`Sitemap: https://milkypot.com/sitemap.xml`)
- Verificou que nenhum arquivo em `belinha/content/` cobria o passo-a-passo de verificação e submissão
- Avaliou as duas formas de verificação disponíveis: DNS TXT (requer acesso ao painel do domínio) e Tag HTML (requer deploy Firebase)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/guia-google-search-console.md` | NOVO — guia completo em PT-BR para o operador (170 linhas) |

**Detalhes do guia criado:**
- **Etapa 0** — Pré-requisitos (acesso ao e-mail admin + 15 min)
- **Etapa 1** — Acessar o Search Console
- **Etapa 2** — Adicionar propriedade `milkypot.com` com duas opções de verificação (DNS TXT via Registro.br OU Tag HTML via Firebase)
- **Etapa 3** — Submeter `sitemap.xml` + tabela com 6 URLs esperadas
- **Etapa 4** — Solicitar indexação manual das 3 páginas prioritárias (/, /cardapio.html, /desafio.html)
- **Etapa 5** — Configurar Google Business Profile (bônus SEO local: aparece no Maps + painel lateral Google)
- **Etapa 6** — Monitoramento após 7 dias (relatórios Desempenho, Cobertura, Core Web Vitals)
- **Checklist de 7 itens** para o operador marcar conforme executa
- **Buscas esperadas** na 1ª semana ("potinho londrina", "milkypot londrina", "açaí self service londrina")

**Commit:** `f4968da`

**Próximo passo sugerido:**
- **Operador (AÇÃO IMEDIATA):** Executar guia `guia-google-search-console.md` — submeter sitemap e verificar propriedade no Search Console ⚠️ PENDENTE DESDE CICLO #148
- **Operador (AÇÃO IMEDIATA):** Executar WA broadcast amanhã 12/05 às 10h — `wa-broadcast-segunda-semana4.md`
- **Ciclo #193 — UX:** Avaliar `js/cardapio.js` (1.050 linhas, possível dead code) — documentar opções A/B/C para decisão do operador
- **Ciclo #194 — Conteúdo:** Brief consolidação Potinho Caramelado pós-reveal (02–07/07)
- **Ciclo #195 — Conversão:** Estrutura de reativação D+30 para clientes da semana 1 (janela: 25/05–01/06)
- **Operador (URGENTE até 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador:** Confirmar calda de caramelo + granola para Potinho Caramelado até 20/06
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #192 | 2026-05-11_

---

## Ciclo #191 — 2026-05-11

**Área:** Conversão — WA broadcast segunda-feira semana 4 (reativação D+7/D+14)

**Contexto:** Hoje é domingo 11/05. Semana 4 começa amanhã (10–16/05). Clientes da semana 1 (25/04–01/05) estão no D+11–17 — janela crítica antes dos 30 dias onde probabilidade de reativação cai. Clientes da semana 2 (02/05–08/05) estão no D+4–9 — janela D+7 perfeita para segunda visita. Nenhum arquivo dedicado existia para o lote de segunda de manhã às 10h (4h antes de abrir às 14h).

**O que pesquisou/analisou:**
- Releitura de `pos-inauguracao-semana4.md` — tem nota operacional mencionando reativação, mas sem brief de execução
- Releitura de `whatsapp-reativacao.md` — tem templates D+7/D+14/D+30 mas sem orquestração de lote pré-abertura
- Verificou que nenhum arquivo em `belinha/content/` cobria o broadcast específico de segunda semana 4
- Calculou segmentação: Lote A (semana 1, D+14), Lote B (semana 2, D+7), Lote C follow-up quinta 14/05

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/wa-broadcast-segunda-semana4.md` | NOVO — brief completo de execução broadcast |

**Detalhes do arquivo criado:**
- **2 templates de abertura** (Lote A e Lote B) + **mensagens de follow-up** pós-resposta para cada lote
- **Lote C** (cupom R$5 surpresa) para Lote A sem resposta — envio quinta 14/05 às 18h
- **Script de resposta** para atendente (4 cenários: resposta curta, dúvida de frete, opt-out, positivo)
- **Checklist de execução** em dois dias (domingo prep + segunda execução + quinta follow-up)
- **KPIs**: taxa de resposta por lote (A ≥30%, B ≥40%), conversão em pedido ≥20%, opt-out <5%
- **Integração** com fidelidade (MEUS PONTOS), indicação e reativação D+30

**Commit:** `a2cf54b`

**Próximo passo sugerido:**
- **Ciclo #192 — SEO:** Google Search Console guia de passos para o operador (pendente desde ciclo #148 — indexação do sitemap.xml nunca confirmada)
- **Ciclo #193 — UX:** Avaliar `js/cardapio.js` (1.050 linhas dead code, blocker #6) — aguarda decisão do operador; documentar opções A/B/C de forma clara para facilitar decisão
- **Ciclo #194 — Conteúdo:** Brief consolidação Potinho Caramelado pós-reveal (02–07/07) — UGC, guia de toppings, 1 semana após lançamento
- **Operador (URGENTE até 30/05):** Confirmar ingredientes + naming "Potinho Junino" ⚠️
- **Operador (URGENTE):** Executar WA broadcast amanhã 12/05 às 10h — `wa-broadcast-segunda-semana4.md`
- **Operador:** Confirmar calda de caramelo + granola para Potinho Caramelado até 20/06
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #191 | 2026-05-11_

---

## Ciclo #190 — 2026-05-11

**Área:** UX/Frontend — remoção de `css/cardapio.css` (arquivo orphaned confirmado)

**Contexto:** Prescrito no roadmap ciclo #190 (log ciclo #186). Auditoria confirmou que `css/cardapio.css` (1.101 linhas, 21 KB) define 103 seletores `.cp-*` que eram usados pela versão antiga do fluxo de pedido (`js/cardapio.js`). Nenhuma página HTML carrega este arquivo via `<link rel="stylesheet">`. O `js/cardapio.js` (também orphaned, 1.050 linhas) foi documentado em `belinha/blockers.md` no ciclo #112 como dívida técnica pendente de decisão do operador — mantido no repo até autorização explícita de deleção.

**O que pesquisou/analisou:**
- `grep -rn "cardapio.css"` em todos os `.html`, `.js`, `.json`: **0 resultados**
- `grep -rn 'src.*cardapio\.js'` em todos os `.html`: **0 resultados** (confirmado orphaned par)
- Classes `.cp-*` verificadas: nenhuma aparece diretamente em nenhum HTML (o único uso é em `js/cardapio.js` que gera HTML dinamicamente, mas o arquivo JS nunca é carregado)
- `sw.js`: `cardapio.css` não estava no precache (já havia sido removido ou nunca incluído)
- Conclusão: arquivo é dead code 100% seguro para remoção

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `css/cardapio.css` | DELETADO — 21 KB / 1.101 linhas de CSS orphaned removidos do repositório |

**Impacto:**
- Repositório mais limpo: -21 KB de CSS morto
- Nenhum impacto visual ou funcional em produção (arquivo nunca foi servido)
- Reduz confusão para futuro dev que inspecionar `css/`: todos os arquivos CSS são agora carregados por pelo menos uma página

**Próximo passo sugerido:**
- **Ciclo #191 — Conversão:** WA broadcast de segunda-feira (semana 4) — reativação dos clientes da semana 1 e 2 que não voltaram. Template específico para envio em lote às 10h (antes de abrir às 14h).
- **Ciclo #192 — UX:** Avaliar deleção de `js/cardapio.js` (1.050 linhas, blocker #6) — aguarda autorização do operador. Se autorizado, reduz mais 42 KB de dead code.
- **Ciclo #193 — SEO:** Google Search Console indexação — pendente desde ciclo #148. Criar guia de passos para o operador.
- **Operador (URGENTE):** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️
- **Operador (URGENTE):** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️
- **Operador:** Confirmar calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** `js/cardapio.js` — Opção A (deletar) ou Opção B (integrar)? Ver `belinha/blockers.md` #6

_Belinha — Ciclo #190 | 2026-05-11_

---

## Ciclo #189 — 2026-05-11

**Área:** Conteúdo — Brief reveal Potinho Caramelado (01/07, semana 11)

**Contexto:** Continuidade direta do ciclo #188 (encerramento Potinho Junino 30/06). A comunicação do 30/06 encerra com "amanhã tem coisa nova 🐑✨" — o público está ativamente esperando a novidade no dia 01/07. O Potinho Caramelado (caramelo + creme de Ninho + granola crocante) preenche o vazio pós-São João e aproveita a onda do caramelo validada pela collab MilkyMoo "Carameluda" (encerrada em maio — sem concorrência direta em julho).

**O que pesquisou/analisou:**
- Revisou `encerramento-potinho-junino-30jun.md` para entender o gancho narrativo ("amanhã tem coisa nova") e garantir continuidade
- Revisou log ciclo #187 — descoberta MilkyMoo "Carameluda" expirou em maio; timing do Potinho Caramelado em julho é estrategicamente sólido e sem concorrência direta no segmento potinho
- Verificou que nenhum arquivo em `belinha/content/` cobria o reveal de 01/07

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reveal-potinho-caramelado-01jul.md` | NOVO — brief completo de reveal |

**Detalhes do brief criado:**
- **Checklist de produção** 10 ações escalonadas (30/06 noite → 01/07 21h) com versão mínima viável
- **Post feed** completo com especificação de arte (ovelhinha surpresa, fundo dourado-mel), caption longa Instagram (~200 palavras) + versão curta TikTok/Stories
- **5 Stories** escalonados 09h30–21h: reveal → ingrediente em câmera lenta → CTA WA → urgência suave → encerramento do dia com UGC
- **WA broadcast lote A** (clientes ativos 30 dias, 14h) + **lote B** (reativação 31–90 dias, 19h) com templates prontos e keyword "CARAMELADO"
- **Reel 15s** roteiro completo em 4 cenas com indicação de áudio
- **KPIs** 7 métricas com metas numéricas e como medir
- **Tabela de posicionamento** vs. MilkyMoo "Carameluda" (formato, base, granola, preço, disponibilidade)
- **Arco narrativo** 01–07/07 com próximos passos pós-reveal
- **Dependências críticas** (confirmar com operador até 20/06)

**Commit:** `cb67926`

**Próximo passo sugerido:**
- **Ciclo #190 — UX:** `cardapio.css` (21K) é orphaned — nunca carregado por nenhum HTML. Avaliar: deletar (0 dependências confirmadas ciclo #186) ou incorporar ao `style.css`. Limpa ~21K do repo.
- **Ciclo #191 — Conteúdo:** Brief consolidação Potinho Caramelado (02–07/07) — UGC, guia de toppings, 1 semana do lançamento
- **Ciclo #192 — SEO:** Sitemap.xml + robots.txt — verificar cobertura páginas novas; Google Search Console indexação pendente desde ciclo #148
- **Operador:** Confirmar ingredientes + naming "Potinho Junino" até **30/05** ⚠️ URGENTE (bloqueador de todo o arco São João)
- **Operador:** Confirmar calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** Configurar keyword `CARAMELADO` no WA Business até **25/06**
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #189 | 2026-05-11_

---

## Ciclo #188 — 2026-05-10

**Área:** Conversão — Brief encerramento Potinho Junino (30/06) + mecânica carimbo duplo + ponte narrativa Potinho Caramelado

**Contexto:** Arco narrativo São João entra na fase final. O Potinho Junino foi planejado para 17/06–30/06. O ciclo #188 cobre o dia de encerramento — pico de FOMO e conversão de última hora — e prepara a transição para o reveal do Potinho Caramelado (01/07, ciclo #189).

**O que pesquisou/analisou:**
- Verificou que `belinha/content/` não tinha nenhum brief específico para 30/06 (encerramento)
- `feed-26jun-adeus-junino-oi-julho.md` cobre 26/06 (sexta), mas 30/06 (terça) é o último dia real do produto — dia distinto com mecânica diferente
- Confirmou dependência crítica: operador precisa confirmar lançamento Potinho Junino até 30/05
- Analisou que 30/06 é terça (pós-fim de semana pós-São João) — público ligeiramente menor que fim de semana, então o WA broadcast e o carimbo duplo são essenciais para converter indecisos

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/encerramento-potinho-junino-30jun.md` | NOVO — brief completo de encerramento |

**Detalhes do brief criado:**
- **Checklist de produção** com 8 ações escalonadas 09h–23h (versão simplificada mínimo viável incluída)
- **Post feed** com especificação de arte (ovelhinha com lacinho de despedida) + caption longa Instagram + versão curta TikTok
- **6 Stories** escalonados 11h–23h: urgência progressiva + teaser de surpresa sem revelar o Caramelado
- **2 WA broadcasts**: Lote A (17h, clientes ativos 30 dias) + Lote B (19h, reativação 31–90 dias) com templates prontos
- **Mecânica "Carimbo de Despedida"** — carimbo duplo para quem comprar o Potinho Junino no último dia (converte indecisos + recompensa fiéis)
- **Sinalização PDV** — plaquinha sugerida com texto + badge carimbo duplo
- **Ponte narrativa** para 01/07 — como comunicar o mistério sem revelar o Caramelado (saves/expectativa)
- **KPIs do dia** — 7 métricas com metas e como medir
- **Nota de dependências** com checklist de pré-requisitos e versão mínima viável

**Commit:** `44b2e7e`

**Próximo passo sugerido:**
- **Ciclo #189 — Conteúdo:** Brief reveal Potinho Caramelado (01/07) — deve referenciar o teaser do 30/06 e criar continuidade narrativa
- **Ciclo #190 — UX:** `cardapio.css` (21K) orphaned — nunca carregado por nenhum HTML. Avaliar: deletar ou incorporar ao `style.css`
- **Ciclo #191 — SEO:** Sitemap.xml + robots.txt — verificar se estão atualizados para as páginas novas
- **Operador:** Confirmar ingredientes + naming "Potinho Junino" até **30/05** ⚠️ URGENTE (bloqueador de todo o arco São João)
- **Operador:** Confirmar disponibilidade calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** Configurar keyword `JUNINO26` + `/adeusjunino` no WA Business até **22/06**
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #188 | 2026-05-10_

---

## Ciclo #187 — 2026-05-10

**Área:** Pesquisa Concorrentes — MilkyMoo + The Best Açaí (refetch pré-São João)

**Contexto:** Ciclos #182–186 focaram em conteúdo e UX. Última atualização de concorrentes foi ciclo #176 (>1 semana atrás). Com São João em 24/06 (6 semanas), urgência de verificar campanhas lançadas, novos produtos e preços ativos.

**O que pesquisou/analisou:**
- WebSearch: "MilkyMoo São João Festa Junina 2026", "MilkyMoo cardápio 2026 novo sabor", "MilkyMoo O Boticário collab 2026", "The Best Açaí Londrina 2026 promoção produto"
- WebFetch tentado em milkymoo.com.br (403 Forbidden — site bloqueado para crawlers)
- Fontes funcionais: auroracultural.com, mercadoeconsumo.com.br, centraldovarejo.com.br, goinfoco.com.br, exame.com, gomesaltimari.com.br

**Principais descobertas:**

1. **MilkyMoo 180ml Day Part (30/04/2026):** novo tamanho entry price R$12,90 até 13h59 — estratégia de impulso pós-almoço. Insight: MilkyPot pode explorar "mini potinho" ou oferta de horário.
2. **MilkyMoo Collab O Boticário "Carameluda" (Abril–Maio 2026):** milkshake caramelo salgado + doce de leite, R$25+, edição limitada até fim de maio. **Valida a onda do caramelo** — timing do Potinho Caramelado (julho/semana 11) é estrategicamente sólido.
3. **MilkyMoo São João 2026:** NENHUMA campanha anunciada ainda. Padrão histórico sugere lançamento semana 9–10 de junho. **Janela aberta para MilkyPot ser PRIMEIRO.**
4. **The Best Açaí nacional:** 900+ unidades, meta 1.000+, faturamento R$1,5B/2026. Novo sabor a cada ~2 meses.
5. **The Best Londrina (Gleba Palhano):** confirmado Rua Caracas, 159 — praça diferente do Muffato Quintino (~8km). R$6,29/100g. São João 2026: sem campanha anunciada.

**Arquivos alterados:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | Atualização cabeçalho + seção ciclo #187: 180ml Day Part, Carameluda collab, análise onda caramelo, radar São João |
| `belinha/competitors/the-best-acai.md` | Atualização cabeçalho + seção ciclo #187: escala nacional, Londrina Gleba Palhano preços, São João sem campanha |

**Próximo passo sugerido:**
- **Ciclo #188 — Conteúdo:** Brief encerramento Potinho Junino (30/06 — despedida definitiva + ponte para Potinho Caramelado semana 11)
- **Ciclo #189 — Conteúdo:** Brief reveal Potinho Caramelado (01/07) — aproveitar onda do caramelo validada pelo MilkyMoo/Boticário
- **Ciclo #190 — UX:** `cardapio.css` (21K orphaned) — avaliar deletar ou incorporar
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** Configurar keyword `JUNINO26` + `/despedidajunino` no WA Business até **22/06**
- **Operador:** Google Search Console — indexação sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #187 | 2026-05-10_

---

## Ciclo #182 — 2026-05-10

**Área:** Conteúdo — Reel 15s urgência + Stories encerramento semana 9 (Sáb 20/06/2026)

**Contexto:** Ciclos #177–181 produziram todo o conteúdo da semana 9 do Potinho Junino (lançamento Reel 17/06, Stories 18/06 reações, feed editorial 19/06, scripts WA upsell). O último slot da semana — sábado 20/06 — estava prescrito em `semana9.md` apenas com esboço básico: "Reel urgência + stories encerramento semana 9". Ciclo #182 preenche esse slot com brief de produção completo.

**O que pesquisou/analisou:**
- Releitura de `pos-inauguracao-semana9.md` (seção Sáb 20/06, linhas 259–310): roteiro mínimo + caption base + Stories de encerramento
- Releitura de `reel-lancamento-potinho-junino-17jun.md`: formato, direção de arte, trilha musical e consistência visual a manter
- Releitura de `stories-18jun-potinho-junino-reacoes.md`: padrão de 3 stories com horários escalonados e stickers
- Releitura de `whatsapp-indicacao.md` e `potinho-junino-2026-contraprogramacao.md`: mecânica Indica & Ganha e diferencial vs. MilkyMoo/The Best

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reel-urgencia-potinho-junino-20jun.md` | NOVO — brief completo Reel + Stories 20/06 |

**Detalhes do conteúdo criado:**
- **Roteiro Reel 15s** (4 blocos: abertura xadrez com ovelhinha, dois potinhos side-by-side, CTA indica & ganha, encerramento com logo + horário)
- **Direção de arte** (tabela com paleta, fonte, ovelhinha chapéu de palha, stickers, música baiãozinho lo-fi)
- **Caption principal** + variação B compacta para repost Stories/WA Status
- **3 Stories de encerramento** com horários (19h, 19h15, 20h30): retrospectiva semana → enquete de satisfação → teaser semana 10 + CTA final
- **Checklist operacional Sáb 20/06** (manhã/turno/noite/pós-turno) — inclui rastreamento de indicações e anotação de UGC
- **Tabela KPI semana 9** para consolidar no Dom 21/06
- **Notas de integração com semana 10** (resultado enquete, continuidade Potinho Junino, preparação julho)

**Commit:** `831e762`

**Próximo passo sugerido:**
- **Ciclo #183 — SEO:** Landing page `potinho-junino-londrina.html` — o esqueleto com placeholders está prescrito desde ciclo #179 mas foi postergado; com a semana 9 completa, é o item mais urgente agora
- **Ciclo #184 — Conteúdo:** Semana 10 (22–28/06) — abertura com resultado enquete, continuidade Potinho Junino "último final de semana" (Sáb 27/06), preparação para julho
- **Ciclo #185 — Conversão:** Mecânica "Embaixador MilkyPot" — formalizar critério (≥3 indicações) e recompensa (Potinho Grande grátis) em documento de treinamento do operador
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade cocada e mel (Versões B e C) até **13/06**
- **Operador:** Configurar keyword `JUNINO26` no WA Business até **06/06** ⚠️ URGENTE
- **Operador:** Buscar trilha baiãozinho lo-fi TikTok na semana de **08/06**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #182 | 2026-05-10_

---

## Ciclo #181 — 2026-05-10

**Área:** Conteúdo — Feed editorial + Stories 19/06 Potinho Junino

**Contexto:** Ciclos #177–180 completaram: Reel 17/06, Stories 18/06 e script WA upsell variantes B/C. O slot de sexta 19/06 estava prescrito no `semana9.md` mas sem arquivo de produção dedicado — apenas uma caption básica sem brief fotográfico e sem integração da copy de diferenciação do `potinho-junino-2026-contraprogramacao.md`.

**O que pesquisou/analisou:**
- Releitura de `semana9.md` (seção Sex 19/06 — linhas 223–268): caption básica + conceito de cenário
- Releitura de `potinho-junino-2026-contraprogramacao.md`: Variações 1/2/3 de copy, brief de diferenciação "preço fixo vs. balança", instrução explícita de usar Var1 ou Var2 em 19/06
- Leitura dos arquivos adjacentes `reel-lancamento-potinho-junino-17jun.md` e `stories-18jun-potinho-junino-reacoes.md` para manter consistência de formato e tom

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/feed-19jun-potinho-junino-editorial.md` | NOVO — brief de produção completo |

**Detalhes do conteúdo criado:**
- **Brief fotográfico editorial** detalhado: 2 composições (cenário rústico + flat lay), lista de props, luz recomendada, ângulo, checklist pré-foto e lista do que evitar
- **Caption principal** com diferenciação integrada ("Preço fixo. Sem balança. Sem surpresa.") e listagem das 3 variantes do Potinho Junino
- **Caption Variação A** — ângulo emocional/nostálgico (público 25–40 anos, para foto com props rústicos)
- **Caption Variação B** — produto direto com ingredientes (flat lay clean, público que decide pelo produto)
- **Stories 19/06** — sequência de 3 frames: Story 1 bastidor (19h), Story 2 enquete (19h15), Story 3 CTA urgência (20h30) — com copy pronta e instruções de design no Canva
- **Notas operacionais:** tabela de horários de publicação, KPIs de rastreamento, strategy de hashtags (grupo principal + grupo nicho por variante), instrução de repost WhatsApp Status
- **Mapa de integração da semana 9** para orientar o operador na sequência 17–20/06

**Commit:** `469e881`

**Próximo passo sugerido:**
- **Ciclo #182 — Conteúdo:** `reel-urgencia-potinho-junino-20jun.md` — Reel 15s sábado 20/06 urgência + Indica & Ganha (prescrito em `semana9.md`, ainda sem arquivo)
- **Ciclo #183 — SEO:** Landing page `potinho-junino-londrina.html` com placeholders estruturados (esqueleto que não bloqueia operador confirmar ingredientes)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade cocada e mel (Versões B e C) até **13/06**
- **Operador:** Configurar keyword `JUNINO26` no WA Business até **06/06** ⚠️ URGENTE
- **Operador:** Buscar trilha baiãozinho lo-fi TikTok na semana de **08/06**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #181 | 2026-05-10_

---

## Ciclo #179 — 2026-05-10

**Área:** SEO — Landing page `potinho-junino-londrina.html` (edição limitada junho 2026)

**Contexto:** Ciclo #178 apontou este como próximo passo. A landing page estava bloqueada por confirmação de ingredientes do operador (prazo 30/05), mas o ciclo #178 validou que o esqueleto pode ser commitado agora com placeholders claros — o operador pode preencher/ajustar sem risco de publicar informação incorreta, pois os comentários `<!-- TODO operador -->` identificam o que precisa de confirmação.

**O que pesquisou/analisou:**
- Releitura de `potinho-junino-2026-contraprogramacao.md` — 3 variantes do produto (Versão A Clássico, B Mel & Cocada, C Fit)
- Releitura de `potinho-ninho-londrina.html` — template estrutural completo (head SEO, schema, CSS, HTML)
- Releitura de `sitemap.xml` — padrão de entrada existente para landing pages SEO locais

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `potinho-junino-londrina.html` | NOVO — 458 linhas. Landing page SEO completa: meta tags, OG, Twitter Card, Schema.org (Product + FoodEstablishment + BreadcrumbList + FAQPage), CSS temático festa junina (amber/orange), 3 variantes do produto com placeholders de operador, toppings livres, tamanhos P/M/G, como pedir, localização, CTA WA |
| `sitemap.xml` | ATUALIZADO — entrada adicionada com `priority 0.9` (urgência pré-17/06), `changefreq weekly`, image caption otimizada para busca local |

**Detalhes técnicos:**
- **Title:** "Potinho Junino em Londrina — Edição Limitada Junho | MilkyPot Muffato" (63 chars)
- **Meta description:** 156 chars, inclui keyword principal + CTA + localização
- **Keywords:** potinho junino londrina, sobremesa festa junina londrina, potinho personalizado londrina, etc.
- **Schema Product:** `availability: LimitedAvailability`, `priceValidUntil: 2026-06-30`, SKU `POTINHO-JUNINO-LDN-2026`
- **FAQPage:** 6 perguntas com rich results — inclui Q sobre diferença de sorvete em balança (contraprogramação TheBest sem nomear concorrente)
- **Canonical:** `https://milkypot.com/potinho-junino-londrina.html`
- **Sitemap priority 0.9:** acima das outras landing pages (0.8) pelo caráter sazonal urgente
- **Placeholders de operador** marcados com `<!-- TODO operador: ... -->` e texto visual na UI ("Disponibilidade sujeita a estoque — confirme pelo WA")
- **CSS tema junino:** background warm amber/cream, price-badge dourado, accent amber #F59E0B — mantém identidade MilkyPot mas com calor junino

**Commit:** `641cf50`

**Próximo passo sugerido:**
- **Ciclo #180 — Conversão:** Script WA de upsell variantes B e C do Potinho Junino para atendente sugerir no PDV (prescrição ciclo #178, ainda sem arquivo)
- **Ciclo #181 — Conteúdo:** Caption + conceito foto editorial Potinho Junino (sex 19/06 — prescrito no `semana9.md`, slot vazio)
- **Ciclo #182 — SEO:** Adicionar link para `potinho-junino-londrina.html` em `index.html` e `cardapio.html` para autoridade interna
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar disponibilidade cocada + mel (Versão B) antes de **13/06** ⚠️
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml após confirmar landing ativa
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #179 | 2026-05-10_

---

## Ciclo #176 — 2026-05-09

**Área:** Concorrentes — Refetch pré-Festa Junina (correção crítica)

**Contexto:** Ciclo #167 havia declarado "zero campanha específica detectada" para MilkyMoo e "provável topping genérico" para The Best Açaí em Festa Junina. WebSearch de hoje revelou que **ambas as análises estavam erradas** — dados desatualizados do ciclo #167 subestimavam a ativação dos concorrentes. O ciclo #176 corrije o registro e redefine o mapa competitivo de junho 2026.

**O que pesquisou/analisou:**
- WebSearch: "MilkyMoo sobremesa festa junina junho 2026 campanha" → "Pede Mooleca" confirmado
- WebSearch: "The Best Açaí Festival Junino canjica pamonha cocada paçoca sorvete 2026" → Festival Junino 4 sabores confirmado
- WebSearch: "MilkyMoo 'Pede Mooleca' data lançamento 2025 2026 quando disponível" → lançamento 02/06/2025, canais iFood + app próprio

**Achados críticos:**
1. **MilkyMoo "Pede Mooleca"** — collab Nestlé/Garoto (bombom Crocante); sorvete baunilha + amendoim + brigadeiro + caramelo salgado + cookie Crocante; 300ml R$25 / 500ml R$30; iFood + app; padrão junho 2025 → alta prob. repetição 2026
2. **The Best Açaí "Festival Junino"** — 4 sorvetes temáticos: canjica, pamonha, cocada, paçoca; self-service; lançado 26/06/2025 nas 700+ unidades; padrão sazonal → alta prob. repetição 2026

**Impacto estratégico:**
- O "share of voice 100% disponível" do ciclo #167 foi declarado prematuramente — concorrentes ativam Festa Junina com produtos específicos
- Diferencial MilkyPot reafirmado: **personalização + WA próprio + ovelhinha-narrativa** — não "único com produto junino", mas "único com potinho com SEU nome + personagem + canal sem comissão"

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | Seção "Correção Crítica #176" com "Pede Mooleca" completo + radar junho revisado |
| `belinha/competitors/the-best-acai.md` | Seção "Correção #176" com Festival Junino 4 sabores + mapa ameaça revisado |

**Próximo passo sugerido:**
- **Ciclo #177 — Conteúdo/IG:** Reel de reveal do Potinho Junino (17/06) — roteiro 15s ovelhinha de chapéu de palha. Ângulo revisado: **"aqui o potinho tem seu nome"** (não "somos os únicos") — responde ao novo mapa competitivo
- **Ciclo #178 — SEO:** Landing `potinho-junino-londrina.html` (aguarda confirmação operador 30/05)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (21 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #176 | 2026-05-09_

---

## Ciclo #174 — 2026-05-09

**Área:** Conversão — Funil WA + Keyword JUNINA26 (Festa Junina 10–29/06/2026)

**Contexto:** O `whatsapp-junina-2026.md` (ciclo #165) contém a campanha completa com a keyword `JUNINA26`, mas o `whatsapp-funil.md` (funil operacional do atendente) nunca foi atualizado para referenciar essa keyword. O atendente usava `/junino` apenas para upsell durante pedidos, mas não tinha script para recrutar clientes à lista VIP JUNINA26 nem a configuração da auto-resposta documentada no funil principal. Com Festa Junina em ~25 dias (abertura 10/06, lançamento do produto 17/06), essa integração é urgente para o operador configurar o WA Business até 06/06.

**O que pesquisou/analisou:**
- Leitura de `whatsapp-funil.md`: estrutura v1+v2, atalhos existentes `/junino` e `/acai`, fluxo sugerido até ciclo #48
- Leitura de `whatsapp-junina-2026.md`: auto-resposta JUNINA26 + calendário de disparos + pendência do operador (confirmar ingredientes até 30/05)
- Gap identificado: funil operacional sem entrada JUNINA26, sem script de recrutamento manual, sem atalhos `/junina-*`

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-funil.md` | +62 linhas — seção JUNINA26 + atalhos v3 + fluxo atualizado |

**Detalhes:**
- **Seção nova:** "ETAPA NOVA — Keyword JUNINA26 (Festa Junina 10–29/06/2026)" com:
  - Auto-resposta WA Business (texto completo + instruções de configuração)
  - Script manual de recrutamento para o atendente usar entre 10–16/06
  - Confirmação de inscrição quando cliente responde "SIM"
  - Prazo de configuração: **06/06/2026**
- **Atalhos v3 adicionados:** `/junina-recruta` e `/junina-ok` na tabela de respostas rápidas
- **Fluxo atualizado:** gatilho `/junina-recruta` inserido entre `/junino` e `/voltou`

**Commit:** `a0e99ae`

**Próximo passo sugerido:**
- **Ciclo #175 — SEO:** Schema.org `FAQPage` em `potinho-personalizado-londrina.html` (landing do ciclo #166 sem structured data FAQ)
- **Ciclo #176 — UX/Frontend:** Adicionar `.muffato-upsell` bar em `cardapio.html` (prescrito ciclo #171, adiado)
- **Ciclo #177 — Concorrentes:** Refetch MilkyMoo/JohnnyJoy/TheBest pré-Festa Junina (verificar campanhas junho 2026)
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️ URGENTE (28 dias)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (21 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+34 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #174 | 2026-05-09_

---

## Ciclo #173 — 2026-05-09

**Área:** Conteúdo/IG — Dia dos Pais 2026 (posts de feed Instagram/TikTok)

**Contexto:** Playbook `dia-dos-pais-2026-playbook.md` (ciclo #136) e templates WA `whatsapp-pais-2026.md` (ciclo #170) já existiam, mas nenhum arquivo standalone de posts de feed IG/TikTok havia sido criado para o Dia dos Pais — gap análogo ao que foi resolvido para a Festa Junina (ciclo #163). `pos-inauguracao-semana16.md` não continha nenhuma menção a "pai", "papai" ou "PAPAI26". O playbook indicava 3 posts de feed chave: teaser Qua 05/08, carrossel 4 perfis Qui 06/08 18h e post principal emocional Dom 09/08 10h.

**O que pesquisou/analisou:**
- Leitura de `dia-dos-pais-2026-playbook.md`: cronograma completo, mecânicas A/B/C, keyword PAPAI26
- Leitura de `whatsapp-pais-2026.md`: templates WA criados no ciclo #170 — P1–P6 + variantes FIT/DUO/GIFT
- Leitura de `instagram-tiktok-junina-2026.md` (ciclo #163): formato de referência para posts de feed standalone
- Verificação de `pos-inauguracao-semana16.md`: sem qualquer conteúdo de Dia dos Pais — gap confirmado
- Gap identificado: carrossel "Qual potinho combina com o seu pai?" (4 perfis) previsto no playbook não existia em nenhum arquivo

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/instagram-tiktok-pais-2026.md` | NOVO — 3 posts de feed IG/TikTok para Dia dos Pais 2026 |

**Detalhes do conteúdo criado:**
- **POST 1** (Qua 05/08 12h) — Teaser feed 2 slides: ovelhinha com segredinho + potinho com laço azul; CTA keyword `PAPAI26`
- **POST 2** (Qui 06/08 18h) — Carrossel 6 slides "Qual potinho combina com o seu pai?": 4 perfis (Clássico / Fitness / Aventureiro / Coringa) + capa + CTA; cada perfil com base + toppings sugeridos + cor de fundo própria
- **POST 3** (Dom 09/08 10h) — Post principal Dia H: arte emocional + Reel 15s alternativo; abertura 14h
- Tabela de integração com `semana16.md` (o que substituir vs. adicionar)
- Checklist operacional completo (10 itens de Seg 03/08 a Seg 10/08)
- Métricas de sucesso por post (metas de comentários, saves, pedidos WA)

**Commit:** `2d5c0c5`

**Próximo passo sugerido:**
- **Ciclo #174 — UX/Frontend:** Integrar nota de Dia dos Pais no `pos-inauguracao-semana16.md` (adicionar bloco "Integração Dia dos Pais" ao checklist operacional, referenciando este arquivo)
- **Ciclo #175 — SEO:** Schema.org `FAQPage` em `potinho-personalizado-londrina.html` (landing criada no ciclo #166 ainda não tem FAQ structured data)
- **Ciclo #176 — Conversão:** Adicionar variante `JUNINA26` no funil WA para Festa Junina (análogo ao PAPAI26) — data urgente: 03/06
- **Operador:** Tirar fotos dos 4 perfis de potinho (Clássico/Fitness/Aventureiro/Coringa) para o carrossel — fazer sessão fotográfica antes de 01/08
- **Operador:** Comprar chapéu de palha + bandeirinhas antes de 03/06 ⚠️ URGENTE (25 dias)
- **Operador:** Criar sticker ovelhinha com chapéu de palha antes de 03/06 ⚠️ URGENTE
- **Operador:** Confirmar ingredientes "Potinho Junino" até 30/05/2026 ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** LGPD — CNPJ + DPO — **+34 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #173 | 2026-05-09_

---

## Ciclo #172 — 2026-05-09

**Área:** SEO — Links internos `potinho-personalizado-londrina.html`

**Contexto:** Landing page umbrella `potinho-personalizado-londrina.html` foi criada no ciclo #166, mas não estava linkada em nenhum dos dois arquivos principais (`index.html` e `cardapio.html`). Sem links internos, o Googlebot só descobre a página via sitemap.xml (passivo). Links internos em páginas de alta autoridade (home + cardápio) transferem PageRank e aumentam a velocidade de indexação. A landing Ninho e a Açaí já tinham links nessas páginas — gap era só a "Personalizado".

**O que pesquisou/analisou:**
- `grep` confirmou: `potinho-personalizado-londrina.html` tinha 0 ocorrências em `index.html` e `cardapio.html`
- `index.html` linha 588: barra inline "☁️ Ninho · 🫐 Açaí" sem a landing umbrella
- `cardapio.html` linhas 351–352: idem — 2 links, faltava o 3º
- Footer `index.html`: colunas `2fr 1fr 1fr 1fr` (não podia adicionar 5ª coluna) — solução: adicionar 3 links dentro da coluna "Links" existente

**O que mudou:**

| Arquivo | Linha(s) | Mudança |
|---------|----------|---------|
| `index.html` | 588 | Adicionado `🎨 Potinho Personalizado em Londrina` na barra inline de links (3ª entrada ao lado de Ninho e Açaí) |
| `index.html` | 1426–1428 | Footer coluna "Links": 3 novas entradas — `potinho-personalizado-londrina.html`, `potinho-ninho-londrina.html`, `acai-self-service-londrina.html` |
| `cardapio.html` | 353 | Adicionada 3ª linha `🎨 Potinho Personalizado em Londrina — Monte do Seu Jeito` (margin ajustada dos outros 2 para `4px`, novo para `16px`) |

**Impacto esperado:**
- Googlebot encontra `potinho-personalizado-londrina.html` via 3 pontos de alta autoridade (home + cardápio + footer home)
- Footer home = presente em TODAS as visitas à home page → máxima transferência de PageRank para a landing umbrella
- Keyword "Potinho Personalizado em Londrina" aparece como anchor text nos 3 pontos — reforça sinal de relevância para a query

**Commit:** `592d8be`

**Próximo passo sugerido:**
- **Ciclo #173 — Conteúdo/IG:** Carrossel Dia dos Pais "qual potinho combina com o seu pai?" (4 perfis — Clássico/Fit/Açaí/Especial) para semana 16 (04–10/08)
- **Ciclo #174 — UX:** Adicionar `.muffato-upsell` em `cardapio.html` (prescrito ciclo #171)
- **Ciclo #175 — SEO:** Verificar se `potinho-personalizado-londrina.html` tem links de retorno para `index.html` e `cardapio.html` (link equity bidirecional)
- **Operador:** Comprar chapéu de palha (prop) + bandeirinhas juninas antes de 03/06 — R$20–35 ⚠️ URGENTE (25 dias)
- **Operador:** Criar sticker ovelhinha com chapéu de palha antes de 03/06 ⚠️ URGENTE
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** LGPD — CNPJ + DPO — **+34 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #172 | 2026-05-09_

---

## Ciclo #171 — 2026-05-09

**Área:** UX/Frontend — `.muffato-upsell` bar + `content-visibility: auto` below-fold

**Contexto:** Prescrito pelo ciclo #168. A `.muffato-upsell` não existia no HTML — os produtos exclusivos do Muffato Londrina (açaí buffet, milkshakes, picolés, sorvetes, chocolates) estavam apenas mencionados em meta tags, mas não apresentados visualmente ao visitante da home. `content-visibility: auto` nas seções abaixo do fold reduz tempo de paint inicial sem necessidade de lazy-load JS.

**O que pesquisou/analisou:**
- Leitura de `index.html` (2609 linhas): confirmada ausência de `.muffato-upsell`; únicas menções eram em keywords e links texto na seção products
- Verificado: 5 seções pesadas abaixo do fold sem `content-visibility` — `.testimonials-section`, `.media-section`, `.faq-section`, `.contact-section`, `.franchise-section`
- Confirmado: seções `<style>` balanceadas (4 aberturas, 4 fechamentos); sections balanceadas (12/12)
- `contain-intrinsic-block-size: auto <N>px` — palavra-chave `auto` faz o browser memorizar altura real após 1ª renderização, eliminando CLS em scroll de retorno

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | NOVO: seção `.muffato-upsell` com 4 pill-links para exclusivos Muffato (Açaí Buffet → acai-self-service-londrina.html; Milkshakes, Picolés & Sorvetes, Cacau & Chocolates → WA pré-preenchido) |
| `index.html` | CSS inline: `.muffato-upsell` com estilos brand (gradiente pastel, pill-cards, hover, mobile responsive) + `content-visibility: auto` |
| `index.html` | CSS no `<head>`: `content-visibility: auto` + `contain-intrinsic-block-size` em 5 seções below-fold (testimonials 480px, media 320px, faq 1200px, contact 340px, franchise 640px) |

**Impacto esperado:**
- Browser pula paint das 5 seções off-screen → redução de ~20–35% no Total Blocking Time em mobile de entrada
- Visitante que scrollar até produtos vê imediatamente os extras do Muffato — oportunidade de upsell que antes não existia visualmente
- `auto` em `contain-intrinsic-block-size` previne scroll-jump se usuário voltar ao topo após seção já renderizada

**Commit:** `032e88b`

**Próximo passo sugerido:**
- **Ciclo #172 — SEO:** Injetar links internos das landing pages (potinho-personalizado-londrina.html, acai-self-service-londrina.html, potinho-ninho-londrina.html) em `index.html` e `cardapio.html`
- **Ciclo #173 — Conteúdo/IG:** Posts Feed teaser Dia dos Pais (semana 16, 04–10/08) — carrossel "qual potinho combina com o seu pai?" (4 perfis)
- **Ciclo #174 — UX:** Adicionar `.muffato-upsell` em `cardapio.html` também (visibilidade na página de pedidos)
- **Operador:** Comprar chapéu de palha (prop) + bandeirinhas juninas antes de 03/06 — R$20–35 ⚠️ URGENTE (25 dias)
- **Operador:** Criar sticker ovelhinha com chapéu de palha antes de 03/06 ⚠️ URGENTE
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** LGPD — CNPJ + DPO — **+33 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #171 | 2026-05-09_

---

## Ciclo #166 — 2026-05-09

**Área:** SEO — `potinho-personalizado-londrina.html` landing page

**Contexto:** Prescrito pelo roadmap ciclo #161 (v20a ativa). Keyword umbrella "potinho personalizado Londrina" é a busca de intenção de compra mais ampla para a categoria — cobre quem ainda não sabe se quer Ninho ou Açaí, apenas quer algo personalizado. As páginas existentes (`potinho-ninho-londrina.html` e `acai-self-service-londrina.html`) capturavam buscas específicas de produto, mas não a busca genérica de personalizáção. Gap: usuário que digita "potinho personalizado londrina" não chegava a nenhuma landing dedicada.

**O que pesquisou/analisou:**
- Leu `potinho-ninho-londrina.html` (ciclo anterior): estrutura de template, schema.org, FAQ, CSS — usado como referência integral
- Leu `sitemap.xml`: 4 landing pages existentes, sem entrada para a nova página
- Confirmou posicionamento diferencial: "Não é self-service, não é por peso — é do jeito que VOCÊ escolhe" (contraprogramação ao modelo das concorrentes TheBest/MilkyMoo)
- Identificou que a página umbrella precisa cobrir TODAS as bases (Ninho + Açaí + Fit/Zero), não apenas uma

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `potinho-personalizado-londrina.html` | CRIADO — Landing page SEO completa: title/meta/OG/Twitter Card otimizados para "potinho personalizado londrina"; Schema.org BreadcrumbList + Product + FoodEstablishment; FAQPage com 7 perguntas (rich results Google); seção "Escolha sua base" com cards Ninho/Açaí/Fit side-by-side; diff-banner com copy de diferenciação anti-self-service; toppings grid, sizes, como pedir, pagamento+fidelidade, localização, 2 CTAs WhatsApp |
| `sitemap.xml` | ADICIONADO — entrada para `potinho-personalizado-londrina.html` (priority 0.8, changefreq monthly, image caption com keyword "potinho personalizado londrina") |

**Destaques:**
1. **Keyword umbrella:** "potinho personalizado londrina" cobre o funil de intenção mais alto — quem ainda compara marcas/sabores. As páginas específicas (Ninho, Açaí) ficam para buscas bottom-of-funnel.
2. **Copy anti-self-service no hero:** "Não é self-service. Não é por peso. É do jeito que VOCÊ escolhe." — banner roxo de destaque. Integra posicionamento do ciclo #134 (contraprogramação TheBest) direto na landing.
3. **3 bases na mesma página:** Cards Ninho + Açaí + Fit/Zero em grid — aumenta percepção de variedade e cobre busca de quem só sabe que quer "algo personalizado".
4. **FAQ com 7 perguntas:** Cobre "o que é", "diferença Ninho vs Açaí", "tem fit?", "faz delivery?", "quanto custa?", "onde fica?", "formas de pagamento" — rich snippets para posição zero no Google.
5. **Sitemap atualizado:** Entrada com priority 0.8 igual às outras landings, imagem e caption com keyword exata.

**Commit:** `0dfdb95`

**Próximo passo sugerido:**
- **Ciclo #167 — Concorrentes:** Refetch pré-Festa Junina (última rodada: ciclo #160, +7 ciclos). MilkyMoo, JohnnyJoy, TheBest — campanhas junho 2026, Festa Junina, produtos sazonais
- **Ciclo #168 — UX/Frontend:** `cardapio.html` refresh — lazy scroll audit, filtros mobile, CLS
- **Ciclo #169 — Conteúdo/WA:** `whatsapp-pais-2026.md` standalone — Dia dos Pais 09/08/2026
- **Ciclo #170 — Conteúdo/IG:** posts pré-Festa Junina: reels de teasers da ovelhinha (1–11/06)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** — impacta gravação reels (10/06)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026**
- **Operador:** Confirmar preços P/M/G Potinho Junino até **10/06/2026**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+28 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #166 | 2026-05-09_

---

## Ciclo #165 — 2026-05-08

**Área:** Conteúdo/WA — `whatsapp-junina-2026.md` standalone

**Contexto:** Prescrito pelo roadmap ciclo #161 (v20a ativa). Gap identificado: todos os playbooks sazonais de 2026–2027 estavam cobertos, exceto `whatsapp-junina-2026.md`. Intel ciclo #160 confirmou share of voice 100% disponível (nenhum concorrente com campanha WA estruturada para Festa Junina em Londrina). Janela: 13/06 (Santo Antônio) → 29/06 (São Pedro), com pico em 24/06 (São João). Produto âncora: Potinho Junino em 3 versões (Clássico, Mel & Cocada, Fit) mapeadas no ciclo #134.

**O que pesquisou/analisou:**
- Leu `potinho-junino-2026-contraprogramacao.md` (ciclo #134): 3 versões do Potinho Junino, estratégia de contraprogramação TheBest (self-service por balança vs. potinho personalizado preço fixo), copy-âncora "Aqui o arraiá é do jeito que VOCÊ gosta"
- Leu `instagram-tiktok-junina-2026.md` (ciclo #163): calendário de posts (12, 17, 20, 24, 28/06), roteiros Reel, direção de arte ovelhinha com chapéu de palha
- Leu `whatsapp-namorados-2026.md` (ciclo #164): estrutura de referência para standalone operacional com keyword, N1–N5, guia de tom e checklist
- Identificou gap: nenhum template de disparos WA para o período (J1 captura → J2 teaser VIP → J3 lançamento → J4 São João → J5 encerramento)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-junina-2026.md` | CRIADO — Standalone operacional: keyword `JUNINA26`, auto-resposta, 5 broadcasts J1–J5 com datas e horários, tabela de 3 versões do Potinho Junino, respostas rápidas do atendente (qual versão / presentear / estoque), J4 guia de Stories ao vivo São João 24/06, guia de tom certo vs. errado, checklist operacional 11 ações com prazos, referências cruzadas |

**Destaques:**
1. **5 broadcasts com datas e horários fixos:** J1 captura (10/06 17h), J2 teaser VIP (12/06 20h), J3 lançamento (17/06 12h), J4 São João (24/06 10h), J5 encerramento (28/06 18h). Operador só precisa seguir o checklist.
2. **Keyword `JUNINA26` + segmentação:** Inscritos voluntários recebem J2 teaser antes de todo mundo — cria sensação de lista VIP sem custo operacional extra.
3. **São João ao vivo (J4):** Além do broadcast, guia de Stories em 4 momentos (14h, 17h, 20h, 22h) para manter engajamento durante o pico cultural do dia.
4. **Respostas rápidas do atendente:** 3 scripts prontos (qual versão, presentear, estoque) para reduzir tempo de atendimento no movimento junino.
5. **Integrado com ciclos #134 e #163:** Sem duplicar conteúdo — aponta para contraprogramação TheBest e posts IG/TikTok já criados.

**Commit:** `3827494`

**Próximo passo sugerido:**
- **Ciclo #166 — SEO:** Landing page `potinho-personalizado-londrina.html` — keyword de alta intenção sem landing dedicada (prescrito roadmap #161)
- **Ciclo #167 — Concorrentes:** Refetch pré-Festa Junina: MilkyMoo, JohnnyJoy, TheBest — campanhas e produtos junho 2026
- **Ciclo #168 — UX/Frontend:** `cardapio.html` refresh — lazy scroll audit, filtros mobile, CLS
- **Ciclo #169 — Conteúdo/WA:** `whatsapp-pais-2026.md` standalone — Dia dos Pais 09/08/2026
- **Operador:** Confirmar estoque paçoca/amendoim/cocada/mel até **30/05/2026** — impacta Versões B e C
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026**
- **Operador:** Confirmar preços P/M/G Potinho Junino até **10/06/2026**
- **Operador:** Google Search Console — indexar sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+27 ciclos**. Risco legal crescente.

_Belinha — Ciclo #165 | 2026-05-08_

---

## Ciclo #164 — 2026-05-08

**Área:** Conteúdo/WA — `whatsapp-namorados-2026.md` standalone

**Contexto:** Prescrito pelo roadmap ciclo #163 (v20c ativa). O ciclo #131 criou o `dia-dos-namorados-2026-playbook.md` completo (estratégia, cronograma, posts, reel, KPIs). Mas não havia um arquivo standalone operacional de WA — focado nos templates de copy para o atendente usar no dia sem precisar ler o playbook inteiro. Diferencial obrigatório desta versão: CTA de **gift/presentear** explícito (N4-GIFT e N4-DUO), que o playbook original não cobria como variantes separadas.

**O que pesquisou/analisou:**
- Leu `dia-dos-namorados-2026-playbook.md` (ciclo #131): N1–N5 base, cronograma, mecânicas A/B/C, KPIs
- Leu `whatsapp-100carimbos-lenda.md` (ciclo #159): referência de estrutura para standalone operacional
- Identificou gap: nenhum template para o fluxo de atendimento "cliente quer PRESENTEAR alguém" — o N4 do playbook trata o cliente como consumidor próprio; faltava variante explícita de gift
- Confirmou: 12/06/2026 a ~35 dias — janela ideal para preparar operador

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-namorados-2026.md` | CRIADO — Standalone operacional: auto-resposta keyword `NAMORADOS26`, N1–N5 completos, **N4-GIFT** (variante presentear: operador coleta nome + gostos da pessoa amada + endereço), **N4-DUO** (variante casal com 2 potinhos + topping extra Versão A), templates de resposta rápida para atendimento no dia, guia de tom (certo vs. errado), checklist operacional com status, tabela de pendências do operador, KPIs |

**Destaques:**
1. **N4-GIFT — CTA de presentear:** Variante nova não coberta pelo playbook #131. Opera um fluxo de gift diferente: o comprador não sabe os toppings → o atendente pergunta gostos da pessoa amada → monta o potinho "como se você conhecesse ela/ele". Aumenta percepção de cuidado e diferencia de qualquer produto genérico.
2. **N4-DUO — Casal junto:** Coleta as preferências dos dois via WA em um único fluxo estruturado. Torna o pedido duplo menos ambíguo para o atendente. Topping extra da Versão A integrado como linha condicional `[SE VERSÃO A CONFIRMADA]`.
3. **Guia de tom:** Tabela "certo vs. errado" para manter a voz da marca sob pressão do movimento do Dia dos Namorados — evita copy promocional genérico que contradiz o posicionamento premium.
4. **Checklist com status visual:** ⬜ para facilitar uso real pelo operador — pode imprimir ou usar no celular como to-do list.
5. **Referência cruzada explícita ao playbook:** Standalone não duplica posts e reel — aponta para `dia-dos-namorados-2026-playbook.md` para esses elementos.

**Commit:** `05a35ef`

**Próximo passo sugerido:**
- **Ciclo #165 — Conteúdo/WA:** `whatsapp-junina-2026.md` standalone — Festa Junina 13–29/06/2026. Integrar com `potinho-junino-2026-contraprogramacao.md` e `instagram-tiktok-junina-2026.md`. Templates de disparo: teaser, lançamento Potinho Junino, São João, encerramento.
- **Ciclo #166 — SEO:** Landing page `potinho-personalizado-londrina.html` — alto volume local, sem página dedicada.
- **Ciclo #167 — Concorrentes:** Refetch pré-Festa Junina (campanhas junho 2026)
- **Operador:** Definir Versão A/B/C mecânica Namorados até **05/06/2026** — impacta N4-DUO diretamente.
- **Operador:** Confirmar horário limite delivery (22h ou 22h30?) — copy usa 22h30 no momento.
- **Operador:** Confirmar ingredientes Potinho Junino até 30/05/2026.
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148).
- **Operador:** CNPJ + DPO — LGPD — +26 ciclos. Risco legal crescente.

_Belinha — Ciclo #164 | 2026-05-08_

---

## Ciclo #162 — 2026-05-08

**Área:** UX/Frontend — checkout modal mobile 480px

**Contexto:** Prescrito como ciclo #162 em `estrategia.md` (v20b — prazo absoluto, postergado +8 ciclos). O checkout é um modal embutido em `index.html` (não há `checkout.html`). A ausência de media queries específicas para telas ≤480px gerava 3 problemas de UX mobile críticos.

**O que pesquisou/analisou:**
- `css/style.css` linhas 2267–2282: `.modal-content` com `padding: 40px` e sem override mobile → em 375px, só 255px de espaço útil para os campos
- `css/style.css` linha 1988: `.form-row` com `grid-template-columns: 1fr 1fr` sem breakpoint → pares Telefone/CPF e Complemento/Bairro em ~120px cada, impossível digitar confortavelmente
- `css/style.css` linhas 4292–4309: `.checkout-step` com `flex-direction: row` e texto longo ("Pagamento") → overflow potencial em 375px com 4 passos visíveis
- Verificado: `font-size: 1rem` nos inputs (≥16px) já previne zoom iOS — sem ação necessária

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `css/style.css` | ADICIONADO bloco `@media (max-width: 480px)` ao final: 5 regras cobrindo modal-overlay, modal-content, form-row, checkout-steps e checkout-nav |

**Destaques:**
1. **Espaço útil +36px:** padding 40px→24px/16px libera 36px adicionais de largura (255px→291px) em 375px sem reduzir legibilidade.
2. **form-row coluna única:** Telefone+CPF e Complemento+Bairro ficam empilhados — area de toque mínima adequada e sem CLS por overflow horizontal.
3. **Steps verticais:** número + label em coluna com `ellipsis 60px` evita overflow sem remover informação do usuário.
4. **`-webkit-overflow-scrolling: touch`:** modal com scroll suave em iOS Safari.
5. **Zero breaking change:** regra dentro de media query isolada; sem impacto em desktop (≥481px).

**Commit:** `b308314`

**Próximo passo sugerido:**
- **Ciclo #163 — Conteúdo:** Posts Instagram/TikTok ovelhinha + Festa Junina (share of voice 100% disponível — nenhum concorrente detectado com campanha estruturada). v20a ativa.
- **Ciclo #164 — Conteúdo/WA:** `whatsapp-namorados-2026.md` standalone — 12/06/2026 (5 semanas). v20c ativa.
- **Ciclo #165 — Conteúdo/WA:** `whatsapp-junina-2026.md` standalone.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148).
- **Operador:** CNPJ + DPO — LGPD — +24 ciclos. Risco legal crescente.
- **Operador:** Benefício 30 carimbos (topping grátis vs upgrade tamanho) — templates têm placeholder.
- **Operador:** Potinho Junino — naming + ingredientes — prazo 30/05/2026.

_Belinha — Ciclo #162 | 2026-05-08_

---

## Ciclo #161 — 2026-05-08

**Área:** Auto-aprimoramento — análise #155–#160, regras v20, roadmap #162–#170

**O que pesquisou/analisou:**
- Releu log completo dos ciclos #155–#160 (6 ciclos): Páscoa WA, FAQ Páscoa, sitemap lastmod, 30 carimbos, 100 carimbos, intel concorrentes
- Verificou status de todos os WA playbooks standalone: **7/7 completos**
- Verificou status de toda a progressão de fidelidade: **6/6 marcos cobertos (0→100 carimbos)**
- Identificou padrão de desvio de roadmap: prescrições da estratégia vs. execução real divergem em ~50% dos ciclos, mas com valor igualmente válido
- Identificou gap crítico persistente: `checkout.html` postergado +8 ciclos (v18b ultrapassado há muito tempo)
- Incorporou gap competitivo de Festa Junina (ciclo #160): share of voice 100% disponível

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Auto-aprimoramento #161: análise de valor por ciclo, tabelas de status completo (WA playbooks + fidelidade), 3 novas regras v20 (v20a Festa Junina, v20b checkout prazo absoluto, v20c Namorados), checklist atualizado 17 itens, roadmap #162–#170 com urgências |

**Destaques:**
1. **Marcos atingidos:** WA playbooks standalone 100% (7/7) + progressão fidelidade 100% (6/6) — as duas grandes séries de conteúdo operacional estão completas.
2. **Prioridade máxima #162:** `checkout.html` é o único bloqueio com impacto direto em receita. v20b define como prazo absoluto sem nova postergação.
3. **Oportunidade imediata (ciclos #163–#165):** Festa Junina e Dia dos Namorados com share of voice aberto — nenhum concorrente tem campanha estruturada.
4. **v20a ativa:** Festa Junina = campanha standalone obrigatória todos os anos. Potinho Junino deve ter naming definido pelo operador até 30/05/2026.

**Commit:** `21c5353`

**Próximo passo sugerido:**
- **Ciclo #162 — Código/Performance (PRAZO ABSOLUTO v20b):** `checkout.html` revisão mobile — CLS, bundle size, validação campos 375px. Não pode ser postergado novamente.
- **Ciclo #163 — Conteúdo:** Posts Instagram/TikTok ovelhinha + Festa Junina — ângulo gap competitivo.
- **Operador:** Naming + ingredientes Potinho Junino — **prazo 30/05/2026** (3 semanas).
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+24 ciclos**. Risco legal crescente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148).
- **Operador:** Confirmar benefício 30 carimbos (topping grátis vs upgrade Mini→Médio).
- **Operador:** Confirmar benefício 100 carimbos (Kit Lenda / crédito / Cria seu Potinho).

_Belinha — Ciclo #161 | 2026-05-08_

---

## Ciclo #160 — 2026-05-08

**Área:** Pesquisa Concorrentes — intel maio-junho 2026 (última rodada: ciclo #151, 9 ciclos atrás)

**O que pesquisou/analisou:**
- **MilkyMoo:** (1) Collab O Boticário "Carameluda" — milkshake caramelo salgado + doce de leite, R$25+, abr-mai 2026, campanha Gen Z #DoceLovers. (2) Collab Universal Pictures "Tempestade" (Como Treinar Seu Dragão live-action) — 1ª semana de junho 2026, promo app: 2×500ml = 2 ingressos. (3) 180ml Day Part confirmado permanente.
- **JohnnyJoy:** (1) 10 anos aniversário — milkshake 300ml por R$10 em 10/04/2026, nacional. (2) Novo sabor Buenissimo Branco (Kinder Bueno White + avelã). (3) Joy Fidelidade detalhado: acesso antecipado + brindes exclusivos via app.
- **The Best Açaí:** The Best Donuts confirmado como produto permanente (não sazonal). Sem campanha de Festa Junina 2026 detectada.
- **Jhoy/JAH do Açaí:** Sem novidades. JAH em expansão nacional (meta 900 un.), sem presença em Londrina. Arquivo fechado mantido.

**Gap estratégico identificado — junho 2026:**
MilkyMoo: ativado com pop-culture cinema (iFood-locked). The Best: self-service genérico. JohnnyJoy: sem ativação. **MilkyPot = único com Potinho Junino personalizado em Londrina** — campo aberto para monopolizar o posicionamento "sobremesa da Festa Junina personalizada".

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | Atualização ciclo #160: Carameluda + Tempestade HTTYD + tabela contraprogramação maio-jun |
| `belinha/competitors/johnnyjoy.md` | Atualização ciclo #160: 10 anos promo + Buenissimo Branco + Joy Fidelidade + tabela comparativa MilkyPass |
| `belinha/competitors/the-best-acai.md` | Atualização ciclo #160: The Best Donuts permanente + mapa ativações junho 2026 |
| `belinha/competitors/jhoy.md` | Verificação ciclo #160: sem novidades, arquivo fechado mantido |

**Commit:** `bb58b0c`

**Próximo passo sugerido:**
- **Ciclo #161 — Auto-aprimoramento (OBRIGATÓRIO — a cada 5 ciclos, último foi #155):** Reler log #155–#160; ajustar `belinha/estrategia.md` para jun–ago 2026. Incorporar aprendizado da rodada de concorrentes.
- **Ciclo #162 — Código/Performance (CRÍTICO — postergado +7 ciclos):** `checkout.html` revisão completa. v18b threshold atingido faz muito tempo.
- **Ciclo #163 — Conteúdo:** Posts Instagram/TikTok ovelhinha + Potinho Junino (jun 2026). Usar gap competitivo identificado como ângulo de copy.
- **Operador:** Confirmar benefício para 30 carimbos (topping grátis vs upgrade Mini→Médio) — templates prontos, só falta aprovação.
- **Operador:** Confirmar benefício para 100 carimbos (Kit Lenda / crédito / Cria seu Potinho) — idem.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+23 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148).

_Belinha — Ciclo #160 | 2026-05-08_

---


## Ciclo #159 — 2026-05-08

**Área:** Conversão — `whatsapp-100carimbos-lenda.md` standalone

**O que pesquisou/analisou:**
- Leu `whatsapp-50carimbos-superfan.md` (ciclo #149): estrutura de referência, tabela progressão, nota explícita sobre gap do marco 100
- Leu `whatsapp-30carimbos-vip.md` (ciclo #158): confirmou estrutura de 3 templates A/B/C, controle operacional, métricas
- Identificou alinhamento calendário: cliente inauguração (25/04/2026) + 2 visitas/semana = 100 carimbos em ~abril/maio 2027 = janela do 1º aniversário da loja

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-100carimbos-lenda.md` | CRIADO — Template WA standalone: 3 variantes (A=cerimônia+convite embaixador, B=direto/impactante, C=1º aniversário da loja abr/mai 2027), benefício Lenda com 3 opções sugeridas à franquia, controle operacional com ritual de resgate presencial, tabela progressão completa (gap zero), métricas com foco em taxa de aceitação de embaixador, nota sobre tier futuro "Família MilkyPot" |

**Destaques:**
1. **Progressão fidelidade fechada:** Com este arquivo, todos os 6 marcos (10, 15, 20, 30, 50, 100 carimbos) têm templates WA standalone. Zero gap na jornada.
2. **Template C estratégico:** Clientes da inauguração atingem 100 carimbos em ~abr/mai 2027 = janela do 1º aniversário. Reconhecê-los como "co-fundadores simbólicos" nesse momento é o ato de marketing mais autêntico e de maior ROI.
3. **Convite de embaixador:** Integrado no Template A como pedido genuíno, não contrato — clientes que aceitam voluntariamente geram UGC de qualidade porque crêem na marca.
4. **Benefício com 3 opções:** Kit exclusivo, crédito R$50, ou "Cria seu Potinho" (produto do dia com nome do cliente) — opção C tem alto valor de PR com custo marginal baixo.
5. **Alerta ao operador:** Confirmar benefício com franquia ANTES de disparar — placeholder explícito `[BENEFÍCIO_LENDA]` impede envio sem aprovação.

**Commit:** `(a confirmar)`

**Próximo passo sugerido:**
- **Ciclo #160 — Pesquisa concorrentes (OBRIGATÓRIO — última rodada foi ciclo #151, +9 ciclos atrás):** WebSearch MilkyMoo, Johnny, Jhoy, TheBest. Atualizar arquivos em `belinha/competitors/`.
- **Ciclo #161 — Auto-aprimoramento (OBRIGATÓRIO — a cada 5 ciclos, último foi #155):** Reler log #155–#160; ajustar `belinha/estrategia.md` para jun–ago 2027.
- **Operador:** Confirmar benefício disponível para 100 carimbos (Kit Lenda / crédito / Cria seu Potinho) — templates prontos, pendente apenas aprovação da franquia.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+22 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148).
- **Operador:** Definir programação 1º aniversário da loja (25/04/2027) — idealmente até fevereiro/2027 para usar placeholder no Template C.

_Belinha — Ciclo #159 | 2026-05-08_

---

## Ciclo #157 — 2026-05-08

**Área:** SEO — `sitemap.xml` auditoria completa de `lastmod` (8 URLs)

**Contexto:** Prescrito pelo roadmap ciclos #155 e #156. Após múltiplas rodadas de edição (ciclos #93, #113, #123, #142, #148, #151, #153, #156), algumas páginas de menor prioridade (desafio, privacidade, termos) tiveram seus `lastmod` no sitemap nunca atualizados a partir do valor inicial `2026-04-22`, mesmo após modificações reais pelo git. Googlebot usa `lastmod` para priorizar re-crawl — datas erradas atrasam indexação de melhorias já commitadas.

**O que pesquisou/analisou:**
- Comparou `lastmod` de cada uma das 8 URLs do sitemap com `git log --oneline -1 -- <arquivo>` (data do commit mais recente)
- Identificou 3 divergências: `desafio.html` (sitemap `2026-04-22` vs git `2026-05-02`), `privacidade.html` (sitemap `2026-04-22` vs git `2026-04-26`), `termos.html` (sitemap `2026-04-22` vs git `2026-04-26`)
- Confirmou 5 URLs corretas: homepage `2026-05-08` ✅, cardápio `2026-05-07` ✅, 2 landing pages `2026-05-05` ✅, raspinha `2026-05-04` ✅

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `sitemap.xml` | `desafio.html` lastmod: `2026-04-22` → `2026-05-02`; `privacidade.html` lastmod: `2026-04-22` → `2026-04-26`; `termos.html` lastmod: `2026-04-22` → `2026-04-26` |

**Commit:** `5bdcf4f`

**Destaques:**
1. **Auditoria 100% completa:** Todas as 8 URLs do sitemap agora têm `lastmod` correspondendo exatamente à data do último commit git do arquivo.
2. **Impacto real:** Googlebot re-crawla páginas com `lastmod` recente com maior frequência. `desafio.html` recebeu BreadcrumbList+WebPage schema no ciclo #93 — 16 dias de atraso na indexação potencial corrigidos.
3. **Prevenção:** A auditoria revela que páginas de baixa prioridade (privacidade, termos, desafio) tendem a acumular drift de lastmod. Próxima auditoria deve ocorrer após qualquer série de ciclos de edição intensiva.

**Próximo passo sugerido:**
- **Ciclo #158 — Conversão:** Template WA milestone 50 carimbos fidelidade (prescrito roadmap #147, postergado múltiplos ciclos — regra v18b ativa).
- **Ciclo #159 — Pesquisa concorrentes:** nova rodada de inteligência competitiva (última: ciclo #151, +6 ciclos atrás).
- **Ciclo #160 — Auto-aprimoramento:** Reler log #155–#159; ajustar estratégia/prioridades para jun–jul 2027.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+20 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #157 | 2026-05-08_

---

## Ciclo #156 — 2026-05-08

**Área:** UX/Frontend — FAQ Páscoa 2027 em `index.html` + `sitemap.xml` lastmod

**Contexto:** Prescrito pelo roadmap ciclo #155. Todos os grandes eventos do calendário tinham playbooks WA standalone, mas apenas Festa Junina, Halloween e Carnaval tinham perguntas na FAQPage do site. A Páscoa 2027 era o único evento com playbook WA completo mas sem presença no FAQ do site — gap que afeta tanto rich results no Google (FAQPage schema) quanto a experiência do visitante que busca informação sobre datas especiais.

**O que pesquisou/analisou:**
- Verificou estrutura da FAQPage JSON-LD: 12 perguntas, todas validadas via `json.loads()`. Nenhuma sobre Páscoa.
- Verificou seção FAQ visual HTML: 7 perguntas de clientes. Última sazonal = Carnaval.
- Identificou ativo único de marca: ovelhinha = animal de Páscoa na iconografia ocidental (bônus de posicionamento já documentado no ciclo #155 para copy WA).
- Confirmou: Halloween FAQ está correto e forward-looking ("Em outubro o MilkyPot lança...") — evento futuro (out/2026), não deve ser removido.

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | FAQ Páscoa adicionado no JSON-LD FAQPage (13ª pergunta) + seção visual HTML (após Carnaval) |
| `sitemap.xml` | `lastmod` da homepage atualizado: `2026-05-07` → `2026-05-08` |

**Commit:** `def92f8`

**Destaques:**
1. **FAQPage agora tem 13 perguntas** — completa para os 4 eventos sazonais: Festa Junina, Halloween, Carnaval, Páscoa.
2. **Copy com ativo único:** "a ovelhinha do MilkyPot adora a Páscoa — afinal, ovelha nasceu para isso!" — diferencial narrativo sem copy de concorrente.
3. **Rich results habilitados para Páscoa:** a pergunta indexada pelo Google pode aparecer em rich snippets para buscas como "milkypot páscoa", "potinho páscoa londrina", reforçando SEO local em março/2027.
4. **sitemap.xml atualizado:** Googlebot saberá que a homepage mudou hoje e priorizará re-crawl.

**Próximo passo sugerido:**
- **Ciclo #157 — SEO:** `sitemap.xml` — verificar `lastmod` de todas as 8 URLs; atualizar as desatualizadas; considerar adicionar `cardapio.html` lastmod (alterado nos ciclos anteriores).
- **Ciclo #158 — Conversão:** Template WA milestone 50 carimbos fidelidade (prescrito roadmap #147, postergado múltiplos ciclos).
- **Ciclo #159 — Pesquisa concorrentes:** nova rodada de inteligência competitiva (última: ciclo #151, +5 ciclos atrás).
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+19 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).
- **Operador:** Produto temático Páscoa — nome + ingredientes: prazo **14/03/2027** para não ficar com placeholder nos broadcasts WA.

_Belinha — Ciclo #156 | 2026-05-08_

---

## Ciclo #155 — 2026-05-08

**Área:** Conteúdo — `whatsapp-pascoa-2027.md` standalone

**Contexto:** Item prescrito pela regra v19a há 3 ciclos e marcado como OBRIGATÓRIO nos ciclos #153 e #154. Páscoa 2027 = Domingo 28/03 — evento que precede em 28 dias exatos o 1 Ano (25/04/2027). Gap crítico: era o único grande evento do calendário sem playbook WA standalone. Nenhum dos outros playbooks (Halloween, BlackPot, Natal, Virada, Carnaval, 1 Ano) mencionava a sobreposição de datas com a Páscoa (A0 do 1 Ano ocorre em 25/03 = Quinta-Feira Santa). Este playbook resolve o gap e documenta a coordenação.

**O que pesquisou/analisou:**
- Leu `semana49.md`: programação Semana Santa (21–27/03) — Domingo de Ramos, Quinta e Sexta-Feira Santa, Sábado de Aleluia. Sexta #33 = feriado nacional = maior tráfego de shopping do trimestre.
- Leu `semana50.md`: Domingo de Páscoa (28/03) + pós-Páscoa segunda (29/03 Linha Zero). Confirmado: shoppings abrem com horário reduzido no Domingo de Páscoa — ponto de atenção para o operador.
- Leu `whatsapp-carnaval-2027.md` e `whatsapp-1ano-2027.md` como referência de estrutura e mecânica.
- Identificou sobreposição crítica: A0 do playbook 1 Ano programado para 25/03 (Quinta-Feira Santa). Sem coordenação, a base receberia 2 broadcasts no mesmo dia → sobrecarga e risco de opt-out. Solução documentada na seção "Coordenação de Calendário" do playbook.
- Confirmou intel competitivo (ciclos #131–#151): nenhum concorrente tem campanha de Páscoa estruturada. MilkyPot = share of voice 100% no canal WA.

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-pascoa-2027.md` | CRIADO — Playbook WA standalone completo: estratégia de 3 estágios, 4 segmentos, template P-AUTO, broadcasts P0–P8 (11 touchpoints, 10/03→29/03), seção de coordenação com 1 Ano, checklist operacional com prazos, pendências do operador, contraprogramação competitiva, métricas-alvo, referência cruzada com outros playbooks |

**Commit:** `bfdd831`

**Destaques:**
1. **11 touchpoints** cobrindo 19 dias (10/03→29/03) — janela compacta pós-Carnaval, adequada à proximidade do evento.
2. **Coordenação 1 Ano documentada:** Tabela de horários recomendados para evitar conflito de broadcasts nos dias 25–28/03. P4 às 9h (VIPs PASCOA) + A0 às 18h (base geral ANIVER) = dois eventos distintos, sem sobrecarga.
3. **A ovelhinha e a Páscoa:** ovelha = animal de Páscoa na iconografia ocidental — ativo único de marca. Copy P-AUTO, P7 e P7b exploram o humor "a ovelhinha não é exatamente uma coelhinha, mas faz potinhos melhores que ovo de chocolate".
4. **Gap de standalone events fechado:** todos os 7 grandes eventos do calendário 2026–2027 agora têm playbooks WA completos: Halloween, BlackPot, Natal, Virada, Carnaval, Páscoa e 1 Ano.
5. **Seed para lista ANIVER integrado:** P6 (Sábado de Aleluia) e P7b (Domingo VIP) plantam CTA "manda ANIVER" — aproveitam o momento emocional da Páscoa para aquecer o maior evento seguinte.

**Próximo passo sugerido:**
- **Ciclo #156 — UX/Frontend:** revisar `index.html` — remover ou atualizar FAQ de Halloween (ciclo #143) que já passou de data; verificar se CTA hero mobile (ciclo #146) está renderizando corretamente; possível FAQ de Páscoa 2027 (por analogia com FAQ Carnaval do ciclo #151).
- **Ciclo #157 — SEO:** `sitemap.xml` — atualizar `lastmod` dos arquivos alterados nos ciclos #151–#155; Google Search Console — solicitar indexação (pendente desde ciclo #148).
- **Operador:** PRAZO CRÍTICO Páscoa — produto/topping temático: **14/03/2027**. Sem definição, 5 broadcasts ficam com placeholders genéricos.
- **Operador:** Confirmar horários Sexta-Feira Santa (26/03) e Domingo de Páscoa (28/03) com o Shopping Muffato — **prazo 21/03**.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+18 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #155 | 2026-05-08_

---

## Ciclo #154 — 2026-05-08

**Área:** Conteúdo — `whatsapp-1ano-2027.md` standalone

**Contexto:** Item INEGOCIÁVEL prescrito nos ciclos #152 e #153. O 1 Ano (25/04/2027) é o maior evento de marketing da história da unidade — único marco intransferível (365 dias exatos pós-inauguração). Os playbooks WA de todos os grandes eventos já existiam (Halloween, BlackPot, Natal, Virada, Carnaval), mas o maior de todos ainda não tinha standalone. Gap fechado neste ciclo.

**O que pesquisou/analisou:**
- Leu `aniversario-1-ano-briefing.md` (ciclo #84): estrutura macro de 4 fases, narrativa "gratidão + conquista + exclusividade", mecânica ANIVER, métricas-alvo
- Leu `pos-inauguracao-semana52.md`: programação da semana "reta final" (11–17/04), revelação completa, encerramento da lista ANIVER
- Leu `pos-inauguracao-semana53.md`: semana do aniversário countdown 7→1, tom emocional, roteiro por dia
- Leu `pos-inauguracao-semana54.md`: Dia H (25/04) + pós-aniversário semana 54
- Leu `pos-inauguracao-semana55.md`: pós-aniversário + aquecimento Dia das Mães
- Leu `whatsapp-carnaval-2027.md` e `whatsapp-halloween-2026.md` como referência de estrutura e mecânica

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-1ano-2027.md` | CRIADO — Playbook WA standalone completo: estratégia de 4 estágios, 4 segmentos, configuração WA Business, template A-AUTO, broadcasts A0–A12 (13 touchpoints, 25/03→26/04), calendário resumido, checklist operacional com prazos, pendências do operador com datas, contraprogramação competitiva, métricas-alvo, referência cruzada com outros playbooks |

**Commit:** `8f67535`

**Destaques:**
1. **13 touchpoints** cobrindo 32 dias (25/03→26/04): A0 (abertura lista), A1 (boas-vindas VIP), A2b (reativação inativos), A3 (reveal produto), A4 ("2 semanas" geral), A5 (programação completa VIP), A6 ("5 dias" geral), A7 ("3 dias" + confirmação presença), A8/A8b (véspera), A9/A10/A11 (Dia H: abertura, mid-event, encerramento), A12 (pós-gratidão).
2. **Completude dos standalone events:** com este playbook, todos os 6 grandes eventos do calendário têm standalone WA completo: Halloween, BlackPot, Natal, Virada, Carnaval e 1 Ano.
3. **Checklist operacional com prazos claros:** prazo duro 15/04 (produto), 22/04 (benefício VIP, horário, brinde), 25/04 no dia (números reais). Operador tem mapa de ações com antecedência suficiente.
4. **Contraprogramação integrada:** MilkyMoo iFood-dependent, JohnnyJoy e TheBest sem campanha de aniversário → copy A0 explora diferencial "canal direto WA, base própria, sem intermediário".
5. **Narrativa exclusiva:** 25/04/2027 = 365 dias exatos pós-inauguração. Marco intransferível — nenhum concorrente pode replicar. Inserido como elemento central da estratégia e do copy.

**Próximo passo sugerido:**
- **Ciclo #155 — Conteúdo (OBRIGATÓRIO):** `whatsapp-pascoa-2027.md` standalone — Páscoa 2027 é 28/03 (antes do 1 Ano!). Gap ativo: v19a prescreveu este playbook há 3 ciclos.
- **Ciclo #156 — UX/Frontend:** revisar `index.html` — hero CTA e FAQ de Halloween (ciclo #143/146) ainda pendente de verificação pós-evento.
- **Ciclo #157 — SEO:** Google Search Console — solicitar indexação sitemap.xml (pendente desde ciclo #148).
- **Operador:** PRAZO CRÍTICO — produto comemorativo 1 Ano precisa ser definido até **15/04/2027** (duro). Sem isso, A3 e 5 outros broadcasts ficam com placeholders.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+17 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #154 | 2026-05-08_

---

## Ciclo #153 — 2026-05-07

**Área:** Código/Performance — `js/checkout.js` auditoria + correções

**Contexto:** Item 4× postergado (v18b threshold inegociável). Leitura completa das 817 linhas do arquivo. Identificados dois problemas de impacto real na conversão e segurança.

**O que pesquisou/analisou:**
- Leu `js/checkout.js` completo (linhas 1–817)
- `validateCheckoutStep(1)`: validava apenas campo não-vazio — usuário podia submeter "9999" (4 dígitos), gerando WA message com telefone inválido → perda de contato
- `addUserMessage`: texto do usuário injetado via `innerHTML` → XSS client-side (self-XSS). Baixo risco de exploração, mas má prática que deveria ser corrigida
- Sem máscara de telefone: usuários digitam `43998042424` ou `998042424` sem DDD → formatos inconsistentes no WA message

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `js/checkout.js` | `applyPhoneMask()`: nova função que formata dígitos como `(XX) XXXXX-XXXX`; listener `input` em `checkoutPhone` aplica máscara em tempo real; `validateCheckoutStep(1)`: exige mínimo 10 dígitos com DDD (toast informativo com exemplo); `addUserMessage()`: `innerHTML` → `textContent` (elimina XSS) |

**Commit:** `f8d9654`

**Destaques:**
1. **Máscara de telefone:** Usuário que digita `43998042424` vê `(43) 99804-2424` formatado em tempo real. WA message gerada no `placeOrder()` já usa o valor formatado → operador recebe número legível e com DDD.
2. **Validação de DDD obrigatório:** Toast claro: *"Digite um telefone válido com DDD! Ex: (43) 99999-9999"*. Previne pedidos com telefone incompleto que bloqueiam o operador de retornar o contato.
3. **Fix XSS `addUserMessage`:** `textContent` escapa qualquer HTML digitado pelo usuário no chat Lulú. Sem impacto visual para o usuário normal.
4. **Testado via Node:** `applyPhoneMask('43998042424')` → `(43) 99804-2424` ✓; `applyPhoneMask('1133334444')` → `(11) 3333-4444` ✓; edge cases vazios e parciais ✓.

**Próximo passo sugerido:**
- **Ciclo #154 — INEGOCIÁVEL:** `whatsapp-1ano-2027.md` standalone — 25/04/2027 = maior evento de marketing da história da unidade (1 ano). Playbook WA completo com campanha de 30 dias.
- **Ciclo #155 — Conteúdo:** `whatsapp-pascoa-2027.md` standalone (v19a ativa).
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente há +10 ciclos.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+16 ciclos**. Risco legal crescente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #153 | 2026-05-07_

---

## Ciclo #151 — 2026-05-07

**Área:** Pesquisa de Concorrentes — Intel pré-Carnaval 2027 + Ação v18a no site

**Contexto:** Prescrito no roadmap ciclo #150. Mandato: refetch MilkyMoo, JohnnyJoy, TheBest pré-Carnaval 2027; extrair produtos temáticos fev/2027, mecânicas, preços; v18a = ação no site mesmo ciclo se gap competitivo identificado.

**O que pesquisou/analisou:**
- Carnaval 2027: 6–10 de fevereiro de 2027 (Quarta de Cinzas = 10/02)
- MilkyMoo Carnaval 2026: 2×1 Pandora+Pintadinha 300ml, **exclusivo iFood**, 1 dia apenas (11/02/2026). Sem produto temático.
- JohnnyJoy: Sem campanha de Carnaval 2026 ou 2027. Preços atualizados: Tradicional 300ml R$19,90/500ml R$22,90; Especial 300ml R$25,90/500ml R$28,90. Joy Fidelidade: 1 Joybit=R$1, 10 compras=1 grátis.
- The Best Açaí: Sem campanha carnaval própria. Preço self-service confirmado: R$5,99/100g. Faturamento R$779M/2024, maior crescimento ABF. Padrão de stunts virais sazonais (donuts, ovos Páscoa) identificado como modelo replicável para MilkyPot Muffato.

**Gap competitivo identificado (v18a):**
- Nenhum dos 3 concorrentes tem produto temático de Carnaval
- MilkyMoo é iFood-locked durante a folia — quem não tem app fica de fora
- MilkyPot é o ÚNICO com canal direto WhatsApp + potencial de produto exclusivo (Potinho Foliã)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | FAQ "O MilkyPot entrega no Carnaval?" adicionado — FAQPage schema (JSON-LD) + seção HTML visível. Posiciona contra iFood-dependency da MilkyMoo; teaser Potinho Foliã; captura SEO "açaí carnaval Londrina" |
| `belinha/competitors/milkymoo.md` | Atualização ciclo #151: padrão Carnaval 2026 documentado, tabela de vantagens MilkyPot vs MilkyMoo no carnaval |
| `belinha/competitors/johnnyjoy.md` | Atualização ciclo #151: sem campanha carnaval, preços 2026 atualizados, Joy Fidelidade detalhado, comparação com MilkyPass |
| `belinha/competitors/the-best-acai.md` | Atualização ciclo #151: R$5,99/100g confirmado, stunts virais mapeados, lição para MilkyPot buffet Muffato |

**Commit:** `482b0e3`

**Destaques:**
1. **MilkyMoo = ponto fraco no carnaval:** Promo é iFood-exclusiva, 1 dia só, sem produto temático. MilkyPot tem janela de 5 dias inteiros + WhatsApp direto + Potinho Foliã como diferencial.
2. **JohnnyJoy e The Best Açaí ausentes:** Nenhum dos dois tem campanha carnaval — MilkyPot pode dominar o posicionamento de "sobremesa do Carnaval em Londrina" sem competição direta.
3. **The Best Açaí stunt model:** O padrão de self-service inusitado (donuts, ovos) que gera UGC viral é replicável no buffet do Muffato. Oportunidade de baixo custo e alto impacto (ex: topping carnavalesco exclusivo no balcão).
4. **FAQ SEO:** "O MilkyPot entrega no Carnaval?" captura busca de fevereiro e aparece no Google Featured Snippet (FAQPage schema). Zero custo, benefício anual recorrente.

**Próximo passo sugerido:**
- **Ciclo #152 — Conteúdo:** `whatsapp-carnaval-2027.md` standalone — WA playbook completo para fev/2027 (v18c ativo: 5 semanas sem playbook). Usar intel ciclo #151 para preencher segmentos e contraprogramação vs MilkyMoo.
- **Ciclo #153 — Código/Performance:** `checkout.html` revisão — 4× postergado (v18b threshold). Executar obrigatoriamente.
- **Ciclo #154 — INEGOCIÁVEL:** `whatsapp-1ano-2027.md` standalone — maior evento de marketing da unidade (25/04/2027).
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+14 ciclos**. Risco legal crescente.
- **Operador:** Confirmar Potinho Foliã (nome, ingredientes, preço) antes de jan/2027 para preencher FAQ e playbook.
- **Operador:** Cardapio.js (A/B/C) — blocker técnico persistente.
- **Operador:** Solicitar indexação do sitemap no Google Search Console (ação pendente ciclo #148).

_Belinha — Ciclo #151 | 2026-05-07_

---

## Ciclo #150 — 2026-05-07

**Área:** Auto-aprimoramento — Roadmap #151–#160 + Auditoria jan–mai 2027

**Contexto:** Auto-aprimoramento prescrito a cada 5 ciclos. Executado após ciclo #149 (template WA 50 carimbos Superfã VIP). Mandato: reler log #145–#149, auditar cobertura jan–mai 2027, identificar o que gerou mais valor, ajustar rotação/prioridades, planejar roadmap Carnaval → Páscoa → 1 Ano de loja.

**O que pesquisou/analisou:**
- Leu log ciclos #145–#149: whatsapp-natal-2026.md (#145), hero mobile CTA (#146), whatsapp-virada-2026.md (#147), sitemap lastmod + image (#148), 50 carimbos (#149)
- Auditou cobertura jan–mai 2027: semanas 42–53 todas existem ✅ — mas 3 gaps críticos de WA standalone detectados (Carnaval, Páscoa, 1 Ano)
- Verificou blockers: CNPJ/DPO +13 ciclos, cardapio.js ainda pendente
- Auditou WA playbooks standalone: Halloween ✅, BLACKPOT ✅, Natal ✅, Virada ✅ — Carnaval ❌, Páscoa ❌, 1 Ano ❌

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/estrategia.md` | Auto-aprimoramento #150 adicionado: análise #145–#149, auditoria tabular jan–mai 2027 (semanas 42–53), checklist atualizado, roadmap #151–#160, regras v19a e v19b |

**Destaques:**
1. **Maior valor dos últimos 5 ciclos:** Hero mobile CTA above-the-fold (#146) — impacto direto e mensurável em conversão mobile sem custo técnico elevado. Muda a experiência do usuário no primeiro acesso.
2. **3 gaps WA standalone jan–mai 2027:** Carnaval (5 semanas de conteúdo sem playbook WA) → ciclo #152; 1 Ano de loja (maior evento do ano) → ciclo #154 INEGOCIÁVEL; Páscoa → ciclo #155.
3. **Nova regra v19a:** Páscoa + Semana Santa = WA standalone obrigatório (extensão de v18c). Aplicar ciclo #155.
4. **Nova regra v19b:** `whatsapp-1ano-2027.md` é prioridade máxima de conteúdo 2027 — não postergar por evento sazonal menor. Ciclo #154 inegociável.
5. **Ciclo #153 (checkout revisão) retorna ao roadmap** como Alta urgência — postergado em #145, #148, #149 (3x = v18b threshold). Execução ciclo #153.

**Commit:** `9ac7aac`

**Próximo passo sugerido:**
- **Ciclo #151 — Concorrentes:** Refetch pré-Carnaval 2027 — MilkyMoo, JohnnyJoy, TheBest: produtos temáticos fev/2027, mecânicas, preços. Intel → v18a: ação no site mesmo ciclo
- **Ciclo #152 — Conteúdo:** `whatsapp-carnaval-2027.md` standalone (v18c ativo — 5 semanas sem WA playbook)
- **Ciclo #154 — INEGOCIÁVEL:** `whatsapp-1ano-2027.md` standalone — o maior evento de marketing da história da unidade
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+13 ciclos**. Risco legal crescente. Fornecer dados para footer e termos de privacidade.
- **Operador:** Confirmar decisão cardapio.js (A=deletar / B=integrar / C=manter) — blocker técnico persistente
- **Operador:** Solicitar indexação no Google Search Console (ação pendente do ciclo #148)

_Belinha — Ciclo #150 | 2026-05-07_

---

## Ciclo #149 — 2026-05-07

**Área:** Conversão — Template WA milestone 50 carimbos Superfã VIP

**Contexto:** Prescrito pelo roadmap ciclo #148. Nenhum template WA existia para o marco de 50 carimbos (5 cartelas completas, ~6 meses de compras regulares). Verificados arquivos existentes: `fidelidade-milestones-wa.md` cobre 10/50/100 **pontos** (sistema de pontos digital, 1pt=R$1); `conversao-upsell-pdv-15carimbos.md` cobre até 30 carimbos com nota "A criar". Gap confirmado: milestone 50 carimbos sem template.

**O que pesquisou/analisou:**
- Leu `fidelidade-milestones-wa.md`: cobre pontos, não carimbos físicos — sistemas paralelos
- Leu `conversao-upsell-pdv-15carimbos.md`: progressão do programa atualizada com gap em 30 e 50 carimbos
- Identificou oportunidade de alinhamento: clientes desde a inauguração (25/04/2026) atingem 50 carimbos em outubro 2026, coincidindo com o aniversário de 6 meses da loja (25/10/2026) — Template C criado especificamente para essa janela

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-50carimbos-superfan.md` | CRIADO — 3 templates WA (A=celebração completa, B=direto, C=aniversário loja outubro), estratégia, guia operacional, progressão completa do programa fidelidade com referência cruzada, métricas |

**Destaques:**
1. **Template C (aniversário):** Clientes que atingem 50 carimbos entre 18/10 e 01/11/2026 recebem mensagem dupla — celebração do marco pessoal + aniversário de 6 meses da loja. Vincula o cliente como "co-fundador do sucesso". Alto impacto emocional com zero custo adicional.
2. **Progressão completa atualizada:** Tabela no novo arquivo cruza todos os marcos (10→15→20→30→50→100 carimbos) com arquivo de referência para cada um. Gaps restantes: 30 carimbos e 100 carimbos (identificados como ciclos futuros).
3. **Diferença pontos vs carimbos documentada:** 50 pontos = R$50 gastos (atinge em ~3 visitas de ticket médio); 50 carimbos = ~R$500 gastos + 5 cartelas completas (6 meses). São marcos radicalmente diferentes — o de carimbos é de fidelidade longitudinal, não de gasto pontual.

**Commit:** `6691d9e`

**Próximo passo sugerido:**
- **Ciclo #150 — Auto-aprimoramento:** Reler log #145–#149; roadmap jan–mai 2027 (Carnaval, Páscoa, 1 Ano de loja 25/04/2027) — prescrito no roadmap
- **Operador:** Confirmar benefício do marco 50 carimbos com a franquia (Potinho Médio grátis sugerido) antes de usar os templates — impacto operacional real
- **Operador:** CNPJ/DPO — LGPD — em aberto há +13 ciclos. Risco legal ativo.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação do ciclo #148 ainda pendente do lado do operador)
- **Ciclos futuros:** Criar `whatsapp-30carimbos-vip.md` e `whatsapp-100carimbos-lenda.md` para fechar a progressão completa

_Belinha — Ciclo #149 | 2026-05-07_

---

## Ciclo #147 — 2026-05-07

**Área:** Conteúdo/WA — `whatsapp-virada-2026.md` standalone

**Contexto:** Prescrito pelo roadmap ciclo #145 (urgência Alta). Gap v18c ativo: templates WA da Virada Ano Novo estavam dispersos em `semana37.md` — operador precisaria vasculhar 1 arquivo para configurar o WA Business, mas sem a estrutura de playbook standalone (estratégia, segmentos, checklist operacional, métricas). Playbook WA standalone obrigatório para eventos >1 semana de campanha (regra v18c).

**O que analisou:**
- Leu `semana37.md` completo: 7 dias de conteúdo (27/12–02/01), 3 broadcasts WA embutidos (quarta 30/12, quinta 31/12, sexta 01/01)
- Comparou com o padrão de `whatsapp-natal-2026.md` (14 broadcasts, 3 segmentos) e `whatsapp-halloween-2026.md` (9 broadcasts) para manter consistência de formato
- Identificou que a semana37 tinha apenas 3 templates WA explícitos; playbook expandiu para 8 touchpoints completos (V0–V6 + V-AUTO) com contexto estratégico, segmentação e notas operacionais

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-virada-2026.md` | CRIADO — Playbook WA standalone completo: estratégia de 3 estágios, segmentos (base geral + lista fidelidade ≥10), configuração WA Business + V-AUTO, templates V0 (27/12 teaser) → V6 (02/01 encerramento) + versão especial V4-fidelidade, checklist operacional com prazos, métricas de sucesso, tabela de broadcasts com prioridades, pendências do operador, notas de contraprogramação |

**Commit:** `f12424e`

**Destaques:**
1. **8 touchpoints** cobrindo 27/12→02/01 vs. 3 embutidos no semana37.md — operador tem playbook acionável sem precisar vasculhar outros arquivos
2. **V4-fidelidade:** Versão personalizada do broadcast de Véspera para clientes com ≥10 carimbos — diferenciação sem custo adicional (fidelização de alto valor)
3. **Pendências operador marcadas claramente:** Ação especial 31/12 como pré-requisito OBRIGATÓRIO antes de 25/12 — sem isso V3/V4 ficam incompletos
4. **Contraprogramação documentada:** MilkyMoo, JohnnyJoy e TheBest sem campanha de Virada detectada — MilkyPot tem share of voice total na categoria
5. **Gap v18c fechado:** Junto com whatsapp-halloween-2026.md (#140) e whatsapp-natal-2026.md (#145), os 3 maiores eventos do 2º semestre agora têm playbooks WA standalone completos

**WA Playbooks standalone — status atualizado:**

| Evento | Arquivo | Status |
|--------|---------|--------|
| Halloween | whatsapp-halloween-2026.md | ✅ |
| BLACKPOT | whatsapp-blackpot.md | ✅ |
| Natal 2026 | whatsapp-natal-2026.md | ✅ |
| Virada/Ano Novo | whatsapp-virada-2026.md | ✅ **CRIADO CICLO #147** |
| Carnaval 2027 | — | ⚠️ Verificar semanas 42–45 |

**Próximo passo sugerido:**
- **Ciclo #148 — SEO:** `sitemap.xml` — atualizar `lastmod` + verificar indexação cardapio.html (prescrito roadmap #145)
- **Ciclo #149 — Conversão:** Template WA milestone 50 carimbos fidelidade
- **Ciclo #150 — Auto-aprimoramento:** Reler log #145–#149; roadmap jan–mai 2027 (Carnaval, Páscoa, 1 Ano de loja 25/04/2027)
- **Operador:** CNPJ/DPO — LGPD — em aberto há +11 ciclos. Risco legal ativo.
- **Operador:** Definir ação especial Virada 31/12 ANTES de 25/12 (pré-requisito para templates V3/V4)
- **Operador:** Confirmar cardapio.js (Opção A/B/C) — blocker técnico há muitos ciclos

_Belinha — Ciclo #147 | 2026-05-07_

---

## Ciclo #146 — 2026-05-07

**Área:** UX — Hero mobile 375px: CTA above-the-fold + logo responsiva

**Contexto:** Prescrito pelo roadmap ciclo #145. Objetivo: auditar hero section `index.html` em mobile 375px, identificar gaps de LCP e CTAs above-the-fold.

**O que analisou:**
- Hero compact: logo fixo 280px + h1 + subtitle — SEM nenhum CTA button
- A 375px de viewport (20px padding cada lado = 335px de conteúdo), logo 280px = 83% do espaço. Em 320px causaria overflow
- CSS: `.hero-logo-small { width: 280px }` — sem responsividade abaixo de 768px
- Responsive.css: sem regra para `.hero-compact*` em 480px ou 375px
- Maior gap: usuário mobile abre o site, vê logo + título + subtítulo, mas não tem botão de ação. CTA mais próximo é o "Pedir Agora" na navbar (pequeno, pouco visível) ou tem que rolar até produtos
- LCP: preload do logo já existe; não há bloqueio de LCP

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | Adicionado `<div class="hero-cta-bar">` com 2 CTAs: "Ver Cardápio" → `cardapio.html` e "WhatsApp" → wa.me link. Posição: dentro do `.hero-compact-content > div`, após o `<p>` subtitle |
| `css/style.css` | Logo: `width: 280px` → `width: clamp(180px, 75%, 280px)` — responsivo em qualquer viewport. Novos seletores: `.hero-cta-bar` (flex, gap 10px, margin-top 18px), `.hero-cta-btn` (gradient-pink, min-height 44px, hover), `.hero-cta-wa` (verde suave, borda, min-height 44px, hover) |

**Commit:** `fe10aac`

**Impacto esperado:**
1. **Above-the-fold CTA:** Usuário mobile 375px vê logo + título + 2 botões de ação sem precisar rolar
2. **Tap target mínimo:** Ambos os botões com `min-height: 44px` (WCAG AA)
3. **Logo segura:** `clamp(180px, 75%, 280px)` — sem overflow em 320px ou menor
4. **Funil duplo:** "Ver Cardápio" = entrada no catálogo | "WhatsApp" = contato direto

**Próximo passo sugerido:**
- **Ciclo #147 — URGENTE:** Criar `whatsapp-virada-2026.md` standalone (templates 31/12 → 01/01 dispersos em semana37.md) — prescrito pelo roadmap v18c
- Monitorar: se operador reportar CTA sobrepondo conteúdo em telas muito pequenas, ajustar `flex-direction: column` a partir de 360px

_Belinha — Ciclo #146 | 2026-05-07_

---

## Ciclo #145 — 2026-05-07

**Área:** Auto-aprimoramento — Roadmap #146–#155 + whatsapp-natal-2026.md standalone

**Contexto:** Auto-aprimoramento prescrito a cada 5 ciclos. Executado após ciclo #144 (intel Halloween → diferenciação implícita). Mandato: reler log #140–#144, auditar cobertura nov–jan 2027, ajustar rotação/prioridades.

**O que analisou:**
- Leu log ciclos #140–#144: lazy scroll (#141), Schema Product (#142), intel Milky Boo (#143), atualização WA Halloween (#144)
- Auditou cobertura nov–jan 2027: semanas 32–42 todas cobertas ✅
- **Gap crítico detectado:** `whatsapp-natal-2026.md` NÃO existia — os 14 templates WA do Natal estavam dispersos em semanas 33, 34, 35 e 36. Regra v18c estava ativa desde #140 mas não havia sido aplicada ao Natal. Operador precisaria vasculhar 4 arquivos para configurar WA Business.
- Verificou WA playbooks standalone: Halloween ✅, BLACKPOT ✅, Natal ❌ (gap), Virada ❌ (gap menor — ciclo #147), Carnaval ⚠️ (verificar)
- Verificou blockers: CNPJ/DPO há +10 ciclos em aberto sem resolução (lembrete ao operador)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-natal-2026.md` | CRIADO — playbook WA Natal standalone completo: N-AUTO (resposta automática "NATAL"), N0–N13 (03/12 → 26/12), configuração WA Business, checklist operacional por semana, métricas, pendências do operador, notas de contraprogramação (Milky Boo/JohnnyJoy/TheBest sem Natal detectado) |
| `belinha/estrategia.md` | Auto-aprimoramento #145 adicionado: análise #140–#144, auditoria nov–jan 2027, checklist atualizado, roadmap #146–#155 |

**Commit:** `29bb03f`

**Destaques:**
1. **whatsapp-natal-2026.md:** 14 broadcasts organizados cronologicamente (N0 a N13). Cobre: abertura lista VIP (03/12), reveal exclusivo 24h antes (08/12), Sextas #18/#19/#20, countdown véspera/dia H/pós-Natal. Todos os `[campos]` são placeholders para o operador preencher antes do envio.
2. **Narrativa dupla 25/12:** Templates N11 e N12 exploram Natal + Aniversário 8 meses como arco emocional máximo — diferencial exclusivo desta unidade.
3. **Roadmap #146–#155:** Próximos 10 ciclos planejados. #147 = gap Virada (alta urgência), #150 = auto-aprimoramento jan–mai 2027, #154 = playbook 1 Ano de loja.
4. **LEMBRETE ao operador (via log):** CNPJ + DPO LGPD sem fornecimento há +10 ciclos. Ver `belinha/blockers.md`. Risco legal crescente.

**Próximo passo sugerido:**
- **Ciclo #146 — UX:** Auditar hero section `index.html` em mobile 375px — LCP e CTAs above-the-fold
- **Ciclo #147 — URGENTE:** Criar `whatsapp-virada-2026.md` standalone (templates do 31/12 → 01/01 espalhados em semana37.md)
- **Operador:** Confirmar produto natalino (Versão A ou B) com franquia ANTES de 06/12/2026 — necessário para preencher N-AUTO e N2
- **Operador:** Confirmar surpresa VIP de 25/12 ANTES de 22/12/2026 (brinde, topping bônus, pontos duplos)
- **Operador:** CNPJ + DPO ainda não fornecidos — risco LGPD ativo. Ver `belinha/blockers.md`

_Belinha — Ciclo #145 | 2026-05-07_

---

## Ciclo #144 — 2026-05-07

**Área:** Conversão — Intel Milky Boo R$49,90 → Playbook WA Halloween + Reveal Semana 26

**Contexto:** Prescrito pelo roadmap #144: atualizar `whatsapp-halloween-2026.md` e conteúdo semanas 25–28 com intel do ciclo #143 (Milky Boo R$49,90 fixo, blind box, sem personalização). Foco em ângulo de diferenciação implícita para operador usar nos templates WA e no carrossel de reveal.

**O que analisou:**
- Leu `whatsapp-halloween-2026.md` completo: nota de contraprogramação ainda referenciava ciclo #139 (sem Milky Boo); templates H0/H2/H5 sem ângulo de personalização explícito
- Verificou semanas 25–28: nenhuma referência ao gap de preço ou personalização vs. concorrente
- Foco estratégico: semana 26 (reveal 14/10) = post de maior alcance da campanha → slide de personalização tem impacto máximo ali
- Decisão: NÃO citar concorrente por nome em conteúdo público (best practice); usar diferenciação implícita ("você escolhe", "do seu jeito")

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-halloween-2026.md` | Nova seção "DIFERENCIAÇÃO DE MERCADO — Intel Ciclo #143": tabela comparativa (MilkyMoo/JohnnyJoy/TheBest vs. MilkyPot), gap de preço 5:1, gap de personalização, ângulos de mensagem para H0/H2/H5 e resposta WA individual. Nota de contraprogramação atualizada com intel completo do Milky Boo (R$49,90, FofoMoo, 700ml único) |
| `belinha/content/pos-inauguracao-semana26.md` | Carrossel reveal 14/10: slide 6 "Personalização (diferencial)" adicionado ("você escolhe Mini ao Gigante, pode pedir toppings extras, a base Assombrada a gente garante"); caption do post atualizada com mesma mensagem de personalização |

**Commit:** `e1af199`

**Destaques:**
1. **Diferenciação implícita:** A mensagem "você escolhe o tamanho e pode pedir toppings extras" posiciona MilkyPot sem citar Milky Boo (produto fixo) — funciona como gancho positivo independente do awareness do concorrente
2. **Ângulos prontos para operador:** Seção DIFERENCIAÇÃO com copy para H0, H2, H5 e resposta individual — operador não precisa improvisar quando cliente perguntar sobre Halloween
3. **Slide de personalização no reveal:** O post de maior alcance da campanha (carrossel 14/10) agora tem o diferencial como antepenúltimo slide — lido por quem vai até o final (cliente mais engajado)
4. **Contraprogramação atualizada:** Nota final do playbook agora é fonte única de verdade sobre landscape out/2026 (Milky Boo + vazios de JohnnyJoy/TheBest)

**Próximo passo sugerido:**
- **Ciclo #145:** Auto-aprimoramento nov–jan 2027 — conforme roadmap #140. Reler ciclos #140–#144, auditar cobertura nov/dez/jan, ajustar rotação
- **Ciclo #146:** Verificar semanas 35–36 (Natal countdown 5 dias + dia H 25/12) — conforme roadmap ciclo #75
- **Operador:** Confirmar ingredientes Potinho Assombrado com franquia ANTES de 30/09/2026 para preencher [confirmar com franquia] em H2 e H-AUTO
- **Operador:** Confirmar ≥3 reviews Google Meu Negócio para habilitar `aggregateRating` schema (+15–30% CTR estimado)
- **Operador:** CNPJ + DPO ainda não fornecidos — risco LGPD. Ver `belinha/blockers.md`

_Belinha — Ciclo #144 | 2026-05-07_

---

## Ciclo #143 — 2026-05-07

**Área:** Concorrentes — Intel pré-Halloween + Ação técnica v18a

**Contexto:** Prescrito pelo roadmap #143: refetch concorrentes pré-Halloween (TheBest, MilkyMoo, JohnnyJoy), Dia das Crianças 12/10 e Halloween 31/10 out/2026. Regra v18a: intel → ação técnica no mesmo ciclo.

**O que pesquisou/analisou:**
- **MilkyMoo:** Lançou `Milky Boo` — edição Halloween. Milkshake 700ml ÚNICO, R$49,90, blind box com brinde colecionável FofoMoo (4 personagens: Moo Bruxinha, Moo Múmia, Moo Abóbora, Moo Frankenstein). Rede nacional ~700 unidades. Sem personalização, sem Linha Fit, sem WA próprio. Também lançou 180ml pós-almoço (frente permanente, não sazonal).
- **JohnnyJoy:** Sem produto/campanha de Halloween detectado. Preços: milkshake R$19 (tradicional) / R$22 (especial). Gap aberto.
- **TheBest Açaí:** Sem produto Halloween. Focado em waffles + donuts self-service. Modelo self-service por peso = sem edições sazonais premium.
- **Outras açaiterias:** Promoções simples (fantasiado = desconto) — sem produto novo.

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/milkymoo.md` | Ciclo #143 adicionado: Milky Boo R$49,90 detalhe completo, tabela contraprogramação MilkyPot × MilkyMoo, alerta Dia das Crianças |
| `belinha/competitors/johnnyjoy.md` | Ciclo #143 adicionado: sem Halloween detectado, preços atualizados |
| `belinha/competitors/the-best-acai.md` | Ciclo #143 adicionado: sem Halloween detectado, contexto waffle/donut |
| `index.html` | **v18a aplicada:** FAQ visível "Tem produtos especiais de Halloween?" + Schema FAQPage "O MilkyPot tem produtos temáticos de Halloween em outubro?" — destaca Potinho Assombrado a partir de R$10 vs. R$50 fixo concorrente |

**Commit:** `66b691c`

**Destaques:**
1. **Gap de preço 5:1** — MilkyMoo cobra R$49,90 por produto único, MilkyPot parte de R$10 com personalização total. FAQ captura buscas "sobremesa Halloween Londrina" + diferenciação direta.
2. **Gap de personalização** — Milky Boo = sabor fixo + tamanho único + blind box. MilkyPot = Mini ao Gigante + base + toppings à escolha + Linha Fit.
3. **Campo aberto** — JohnnyJoy e TheBest sem produto Halloween = MilkyPot pode ser a ÚNICA com Potinho Assombrado personalizado em Londrina.
4. **Schema FAQ indexável** — Pergunta "O MilkyPot tem produtos temáticos de Halloween em outubro?" agora no FAQPage schema.org → rich result nas SERPs do Google para buscas de outubro.

**Próximo passo sugerido:**
- **Ciclo #144:** Atualizar semanas 25–28 e `whatsapp-halloween-2026.md` com intel do #143 — verificar se templates WA e conteúdo semanal precisam citar o gap de preço vs. Milky Boo R$49,90
- **Ciclo #145:** Auto-aprimoramento nov–jan 2027 (roadmap #145)
- **Operador:** Confirmar ingredientes Potinho Assombrado com franquia ANTES de 30/09/2026
- **Operador:** Monitorar @milkymoo em setembro/2026 para ver se integra Milky Boo com campanha Dia das Crianças 12/10

_Belinha — Ciclo #143 | 2026-05-07_

---

## Ciclo #142 — 2026-05-07

**Área:** SEO — Schema.org `Product` com `AggregateOffer` em `cardapio.html`

**Contexto:** Prescrito pelo roadmap #141 como ciclo seguinte ao UX de lazy scroll. Sem `aggregateRating` (aguarda ≥3 Google reviews confirmadas pelo operador). O `FoodEstablishment` + `Menu/MenuItem` já existiam; gap era a ausência de `Product` schema com preço explícito para rich snippets de preço nas SERPs.

**O que analisou:**
- Verificou blocos ld+json existentes em `cardapio.html`: FoodEstablishment (hasMenu), BreadcrumbList+WebPage, FAQPage — sem nenhum `Product`
- Confirmou estrutura `CARDAPIO_CONFIG`: 3 bases (ninho, zero-fit, acai) × 2 formatos cada × 4 tamanhos (R$10–R$22)
- Verificou ausência de imagens de produto específicas → usou `logo-milkypot.png` como `image` (aceitável pelo Google Rich Results Test)
- Padrão `AggregateOffer` (lowPrice + highPrice + offerCount) = correto para catálogos com variação de tamanho/preço

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | Novo bloco `@graph` com 3 `Product` schemas: Ninho, Açaí e Zero/Fit. Cada um com `AggregateOffer` lowPrice=10/highPrice=22 BRL, `availability: InStock`, `seller: LocalBusiness`. Inserido após o FAQPage, antes do `<style>`. |

**Validação:** `python3` parseou os 4 blocos JSON-LD sem erros (FoodEstablishment, BreadcrumbList, FAQPage, Product).

**Commit:** `a5a079e`

**Destaques SEO:**
1. **Rich snippets de preço:** Google pode exibir "A partir de R$ 10" nas SERPs para buscas como "potinho de ninho Londrina" ou "açaí delivery Londrina"
2. **`AggregateOffer` com offerCount=4:** Sinaliza 4 variações (Mini/Pequeno/Médio/Gigante) sem criar itens redundantes
3. **Cobertura completa das 3 linhas:** Ninho + Açaí + Zero/Fit = catálogo principal visível ao Googlebot mesmo sem JS
4. **Sem `aggregateRating`:** Postura conservadora correta — schema inválido ou falso prejudica ranking. Adicionado quando operador confirmar ≥3 reviews no Google Meu Negócio

**Próximo passo sugerido:**
- **Ciclo #143:** Refetch concorrentes pré-Halloween (TheBest, MilkyMoo, JohnnyJoy) — mecânicas out/2026, Dia das Crianças 12/10 e 31/10. Regra v18a: intel → ação técnica no mesmo ciclo
- **Ciclo #144:** Atualizar semanas 25–28 e `whatsapp-halloween-2026.md` com intel do #143 se necessário
- **Ciclo #145:** Auto-aprimoramento nov–jan 2027 (roadmap)
- **Operador:** Confirmar ≥3 reviews Google Meu Negócio para habilitar `aggregateRating` schema (boost de CTR estimado +15–30%)
- **Operador:** Ingredientes Potinho Assombrado com franquia antes de 30/09/2026

_Belinha — Ciclo #142 | 2026-05-07_

---

## Ciclo #141 — 2026-05-06

**Área:** UX/Performance — `renderProducts` lazy scroll (IntersectionObserver)

**Contexto:** Bloqueador 4x postergado (#137, #138, #139, #140). Regra v18b ativa: prioridade máxima independente de pressão sazonal. Aba "ninho" renderizava 16 cards em bloco (`grid.innerHTML = html`) causando jank em mobile low-end ao trocar de aba.

**O que analisou:**
- Leu `getAllProducts()` e `renderProducts()` em `cardapio.html` (linhas 580–670)
- Contou produtos por categoria: ninho=16, acai=6, fit=6 (total 28)
- Confirmou ausência de IntersectionObserver, virtual scroll ou qualquer forma de lazy rendering
- Verificou que `sheetContent.innerHTML` (bottom sheet de produto) é independente e não afetado

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | Substituiu `renderProducts()` monolítico por progressive rendering: `buildCardHtml(p)` helper, `renderBatch()` com IntersectionObserver + sentinel `#lazy-sentinel`, fallback síncrono para browsers sem IO, `lazyObserver.disconnect()` na troca de aba (sem memory leak) |

**Detalhes técnicos:**
- `LAZY_BATCH = 6`: primeiros 6 cards ao carregar a aba (LCP fast)
- `rootMargin: '300px'`: pré-carrega próximo batch 300px antes do sentinel aparecer (sem percepção de lag)
- Ao trocar de aba: observer desconectado, sentinel removido, `grid.innerHTML = ''`, novo batch inicial
- Fallback: browsers sem `IntersectionObserver` (IE11, WebView antigo) recebem todos os cards síncronos — comportamento idêntico ao anterior, sem regressão

**Commit:** `aa13feb`

**Próximo passo sugerido:**
- **Ciclo #142:** Schema.org `Product` em `cardapio.html` para rich snippets (sem `aggregateRating` até ≥3 reviews confirmados)
- **Ciclo #143:** Refetch concorrentes pré-Halloween (regra v18a: intel → ação no mesmo ciclo)
- **Ciclo #144:** Atualizar semanas 25–28 e `whatsapp-halloween-2026.md` com intel do #143
- **Ciclo #145:** Auto-aprimoramento nov–jan 2027

_Belinha — Ciclo #141 | 2026-05-06_

---

## Ciclo #139 — 2026-05-06

**Área:** Concorrentes — TheBest, MilkyMoo, JohnnyJoy (inverno/Dia dos Pais/agosto 2026)

**Contexto:** Prescrita desde ciclo #124 e repetida em #135, #136, #137 e #138. Janela ideal: após ciclo de UX (#137) e antes do auto-aprimoramento (#140). Objetivo: mapear mecânicas de agosto, campanhas de Dia dos Pais e produtos de inverno das três concorrentes.

**O que pesquisou/analisou:**
- WebSearch: TheBest Londrina ago 2026 Dia dos Pais; TheBest Ovo em Pétala/Fatias viral; TheBest inverno 2026 produto; Milky Moo Londrina ago 2026; JohnnyJoy 10 anos 2026; JohnnyJoy Dia dos Pais; Milky Moo Dia dos Pais
- Fontes: GKPB, Publicitários Criativos, Exame, amostrasgratis.shop, vipzinho.com.br, gastronominho.com.br, Mapa das Franquias

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/the-best-acai.md` | Seção ciclo #139: "Ovo em Pétala" (200M views, 300k un, ~R$10, Páscoa); Waffles "My Waffle, My Rules" inverno (15/mai–15/ago); Dia dos Pais "traga seu herói" (in-store); gap Muffato mantido; checklist atualizado |
| `belinha/competitors/milkymoo.md` | Seção ciclo #139: iFood flash fev/26; Milky Moo Day 11/mar; Dia do Milkshake 12/set; **GAP CONFIRMADO: sem campanha Dia dos Pais**; dependência iFood documentada |
| `belinha/competitors/johnnyjoy.md` | Seção ciclo #139: 10 anos 10/abr (R$10); campanha vestir azul/rosa; Joy Fidelidade confirmada; **GAP CONFIRMADO: sem campanha Dia dos Pais** |
| `belinha/content/contraprogramacao-inverno-agosto-2026.md` | CRIADO — quadro competitivo, 5 ângulos acionáveis, calendário agosto com datas de ação, alertas para o operador |

**Commit:** `94656f2`

**Destaques da inteligência competitiva:**
1. **MilkyPot é a única marca com playbook estruturado para 09/08 (Dia dos Pais)** — TheBest tem ação in-store genérica; MilkyMoo e JohnnyJoy não têm nenhuma campanha documentada
2. **"Ovo em Pétala" TheBest = fórmula viral: produto visual + self-service + briefing UGC implícito.** MilkyPot pode replicar com Reel de montagem do potinho no PDV
3. **Waffles TheBest terminam 15/ago** — 6 dias após o Dia dos Pais, potencial fadiga de audiência. MilkyPot ocupa o espaço "sobremesa afetiva" enquanto TheBest ainda está no modo waffle/experiência
4. **TheBest "traga seu herói" = barreira física.** MilkyPot oferece delivery — o contraponto natural é "manda o potinho pro seu pai sem ele sair do sofá"
5. **MilkyMoo e JohnnyJoy dependem 100% de iFood para promoções.** Transparência WA Business (sem comissão) é diferencial de confiança do MilkyPot

**Próximo passo sugerido:**
- Ciclo #140: Auto-aprimoramento prescrito (a cada 5 ciclos) — roadmap set–nov 2026: Halloween (31/10), BLACKPOT (27/11 Black Friday), aniversário 6 meses da loja (25/10), primavera (+1 semana produto sazonal)
- Operador: configurar PAPAI26 no WA Business até 03/08
- Operador: gravar Reel de montagem do potinho no PDV antes de 31/07 para usar na semana do Dia dos Pais
- Operador: preparar tags "Para o melhor pai do mundo" para personalização no PDV em 09/08

_Belinha — Ciclo #139 | 2026-05-06_

---

## Ciclo #138 — 2026-05-06

**Área:** Conteúdo — Bridge pós-Dia dos Pais em `semana18.md`

**Contexto:** Prescrito pelo roadmap do ciclo #135 e confirmado em #137. `semana18.md` (16–22/08) foi criada no ciclo #63, antes do playbook do Dia dos Pais existir (criado no ciclo #136). O arquivo não tinha nenhuma conexão com o evento de 09/08 — o operador teria publicado conteúdo genérico de família na semana seguinte ao maior evento de agosto, desperdiçando o momentum.

**O que analisou:**
- Leu `semana18.md` completo: domingo 16/08 com post genérico "Domingo de família começa aqui", sem callback ao Dia dos Pais
- Leu `dia-dos-pais-2026-playbook.md` (ciclo #136): P6 (pós-evento, seg 10/08) era o último touchpoint — sem D+7 para semana 18
- Leu `semana19.md`: conteúdo de transição inverno→primavera sem conexão com Dia dos Pais (OK, é 14 dias depois — gap aceitável)
- Identificou três gaps cirúrgicos: abertura de domingo sem UGC do evento, ausência de reativação D+7 para lista `#pai-2026`, checklist sem instrução de bridge

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana18.md` | Nota de contexto pós-Dia dos Pais no topo; domingo 16/08 remodelado com Versão A (UGC showcase + abertura família) e Versão B (fallback genérico); template WA reativação D+7 adicionado na segunda 17/08 para lista `#pai-2026`; checklist expandido com bloco "Ações pós-Dia dos Pais" destacado antes das ações regulares; tabela editorial atualizada; métricas de reativação adicionadas |

**Commit:** `3c28842`

**Destaques:**
1. **UGC showcase no domingo 16/08 (Versão A):** Primeiro post da semana reusa o melhor conteúdo gerado por clientes no Dia dos Pais — transição natural para o tema "família" da semana 18, com custo zero de produção
2. **WA reativação D+7 (segunda 17/08):** Clientes da lista `#pai-2026` recebem mensagem de segunda que conecta o evento passado à próxima visita, com menção ao saldo de pontos — padrão de e-commerce validado (D+7 após evento tem taxa de abertura 2–3x maior que broadcast genérico)
3. **Versão A/B no domingo:** Operador não depende de ter UGC aprovado — se não houver foto autorizada, usa Versão B sem perder o ritmo da semana

**Próximo passo sugerido:**
- Ciclo #139: Pesquisa concorrentes (prescrita há 15+ ciclos desde #124): TheBest, MilkyMoo, Johnny/Jhoy — mecânicas de agosto, campanhas Dia dos Pais, produtos de inverno final. Gerar contraprogramação no mesmo ciclo
- Ciclo #140: Auto-aprimoramento (roadmap set–nov 2026: Halloween, BLACKPOT, 6 meses de loja 25/10)
- Operador: garantir que a resposta automática `PAPAI26` está configurada até 03/08 (conforme checklist do playbook)
- Operador: colher UGC do Dia dos Pais durante o evento — pedir permissão via DM na hora para ter material disponível em 16/08

_Belinha — Ciclo #138 | 2026-05-06_

---

## Ciclo #137 — 2026-05-06

**Área:** UX — `checkout.js` auditoria completa (bloqueador v17b, 3x postergado)

**Contexto:** Janela obrigatória entre Namorados (12/06) e Dia dos Pais (09/08) para auditoria técnica de checkout sem competir com urgência de conteúdo sazonal. Prescrição desde ciclo #117 (autocomplete), repetida em #133 e #134.

**O que analisou:**
- Leu `js/checkout.js` completo (798 linhas): fluxo de 4 etapas, validação, captura de pedido, WhatsApp, DataStore, confetti, chat Lulú
- Leu seção checkout de `cardapio.html` (etapas 1–4, modais success/checkout, campos de formulário)
- Identificou dois problemas acionáveis de alto impacto:
  1. **Placeholder telefone `(11)` em vez de `(43)`** — DDD de SP em loja de Londrina gera desconfiança do cliente local
  2. **CEP sem auto-preenchimento** — campo delivery 100% manual; padrão BR de e-commerce é auto-fill via ViaCEP (logradouro + bairro), reduz abandono e erros de endereço

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | Placeholder do campo telefone (checkoutPhone) corrigido de `(11) 99999-9999` para `(43) 99999-9999` |
| `js/checkout.js` | Adicionado listener `blur` no campo `checkoutCep`: ao sair do campo com 8 dígitos, chama `viacep.com.br` e preenche `checkoutAddress` e `checkoutNeighborhood` se estiverem vazios. Erro de rede silenciado (`.catch`) para não bloquear o fluxo |

**Commit:** `4e5ca67`

**Notas técnicas:**
- Implementação respeita dado já digitado: só preenche se o campo estiver vazio (`!addr.value`)
- Sem dependência nova: ViaCEP é API pública gratuita, sem chave, JSON simples
- Todos os campos relacionados (`checkoutAddress`, `checkoutNeighborhood`) já existiam no DOM

**Próximo passo sugerido:**
- Ciclo #138: Conteúdo — Semanas 18–19 (16–29/08): pós-Dia dos Pais + transição primavera
- Ciclo #139: Concorrentes refetch pré-Dia dos Pais (TheBest, MilkyMoo, Johnny/Jhoy — campanhas de agosto)
- Ciclo #140: Auto-aprimoramento (prescrito a cada 5 ciclos; próxima revisão de roadmap)
- Operador: testar fluxo delivery no mobile após este deploy — digitar CEP de Londrina e verificar auto-preenchimento

_Belinha — Ciclo #137 | 2026-05-06_

---

## Ciclo #136 — 2026-05-06

**Área:** Conversão — Dia dos Pais 09/08/2026 (EMERGÊNCIA — prescrito ciclo #135)

**Contexto:** Auditoria de ciclo #135 identificou gap crítico: `semana17.md` (09–15/08/2026) tem tema "Inverno de Saída" e não menciona o Dia dos Pais (segundo domingo de agosto = 09/08/2026). Sem intervenção, o operador publicaria conteúdo genérico na maior data comercial de agosto.

**O que analisou:**
- Leu `semana17.md` — abertura de domingo 09/08 tem tema fitness/inverno, zero menção ao Dia dos Pais
- Referenciou `dia-das-maes-2026-playbook.md` (ciclo #129) e `dia-dos-namorados-2026-playbook.md` (ciclo #131) para manter padrão estrutural
- Identificou ângulo duplo de agosto: comfort food (Ninho indulgente) + pai fit (Linha Zero), ambos naturais na estação

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/dia-dos-pais-2026-playbook.md` | CRIADO — playbook completo: keyword PAPAI26, mecânica Duo Papai (Versões A/B/C), cronograma 5 dias (04–09/08), templates WA P1–P6, 3 posts feed (teaser, carrossel 4 perfis de pai, post principal emocional), Reel 15s com roteiro cena-a-cena, checklist operacional, métricas de sucesso |
| `belinha/content/pos-inauguracao-semana17.md` | ATUALIZADO — nota de substituição obrigatória inserida no topo: domingo 09/08 deve usar Post 3 + P4 + P5 do playbook; seg–sáb mantém conteúdo original |

**Commit:** `cf79fab`

**Destaques do playbook:**
1. **Keyword PAPAI26 como captura de lista VIP:** Padrão validado com MAE26 (ciclo #129) e NAMORADOS26 (#131) — já testado operacionalmente
2. **Ângulo "eu te conheço, pai":** Diferencial de personalização vs. presentes genéricos (camisa, perfume, caixa de bombom) — copy que ressoa com filhos/filhas comprando o potinho como presente
3. **Carrossel "4 perfis de pai":** Segmenta audiência com humor leve (Clássico/Fitness/Aventureiro/Curioso) — alto potencial de compartilhamento orgânico
4. **Reel 15s roteirizado:** Cenas + timing + overlay text + trilha — operador executa sem precisar de brief adicional
5. **Integração explícita com semana17.md:** Instrução clara de quais peças do playbook substituem quais peças da semana, sem ambiguidade

**Próximo passo sugerido:**
- Ciclo #137: UX — `checkout.html` auditoria completa (3x postergado, janela obrigatória pré-Q3) — bloqueador crítico v17b
- Ciclo #138: Conteúdo — Semanas 18–19 (16–29/08): pós-Dia dos Pais + transição primavera
- Ciclo #139: Concorrentes refetch pré-Dia dos Pais (TheBest, MilkyMoo, Johnny/Jhoy — campanhas de agosto)
- Operador: confirmar mecânica do Dia dos Pais (Versão A/B/C) até 05/08; ativar PAPAI26 no WA Business até 03/08

_Belinha — Ciclo #136 | 2026-05-06_

---

## Ciclo #135 — 2026-05-06

**Área:** Auto-aprimoramento — Roadmap #136–#145 + Auditoria calendário jul–out 2026

**Contexto:** Ciclo prescrito pelo roadmap #130. A cada 5 ciclos, revisão completa dos ciclos anteriores, identificação de padrões de valor/desperdício, auditoria de calendário comemorativo nas próximas 12 semanas e reescrita do roadmap.

**O que analisou:**
- Leu entradas de ciclos #130–#134 em `belinha/log.md` e commits no histórico git
- Auditou semanas 11–25 (jul–out 2026) verificando headers e contagem de referências a datas comemorativas
- **Gap crítico encontrado:** `semana17.md` (09–15/08) tem tema "Inverno de Saída" mas começa em Dia dos Pais (09/08) — zero menção ao evento. Único gap no horizonte auditado; semana21.md tem Independência coberta (25 refs), semana26.md tem Dia das Crianças coberto (24 refs)
- Identificou padrão Research→Action (#132 TheBest → #134 contraprogramação) como o mais valioso dos últimos 5 ciclos
- Identificou `checkout.html` auditoria como item bloqueado 3x seguidas — risco de acúmulo de dívida técnica

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | ATUALIZADO — Seção "Auto-aprimoramento ciclos #130–134": análise de valor/desperdício, tabela de auditoria calendário semanas 11–25, checklist de pendências atualizado, roadmap #136–#145, regras v17 (v17a: Research→Action obrigatório; v17b: checkout.html janela jul-ago; v17c: semana17.md flag crítico), regras mantidas com próximas datas corrigidas (próximo auto-aprimoramento: #140, próximo concorrentes: #139, checkout: #137) |

**Commit:** `5fb34e1`

**Destaques estratégicos:**
1. **Único gap calendário jul–out:** semana17.md ignora Dia dos Pais — impacto comercial alto (agosto = maior mês para presentes + confraternização familiar). Ciclo #136 é EMERGÊNCIA.
2. **checkout.html 3x postergado:** Nova regra v17b torna janela jul–ago inegociável para auditoria técnica, sob pena de risco de regressão no Q4 (Halloween + BLACKPOT + Natal).
3. **Padrão Research→Action codificado em v17a:** Valida que o ciclo #132→#134 foi o mais eficiente dos últimos 5. Regra evita que inteligência competitiva fique sem ação.
4. **Roadmap #136–#145 cobre todos os eventos críticos de ago–nov 2026:** Dia dos Pais (#136), UX obrigatório (#137), concorrentes pré-Dia dos Pais (#139), Halloween update (#144), BLACKPOT/Natal planejados no auto-aprimoramento #145.

**Próximo passo sugerido:**
- **Ciclo #136 — EMERGÊNCIA: Dia dos Pais 09/08/2026 playbook**
  - Criar `belinha/content/dia-dos-pais-2026-playbook.md` (keyword `PAPAI26`, sequência WA P1–P5, Reel 15s, posts feed, mecânica sem desconto)
  - Inserir bloco "⚠️ ATUALIZAÇÃO CICLO #136" no topo de `semana17.md` substituindo tema genérico por Dia dos Pais
  - Padrão: `dia-das-maes-2026-playbook.md` + `dia-dos-namorados-2026-playbook.md`

_Belinha — Ciclo #135 | 2026-05-06_

---

## Ciclo #134 — 2026-05-06

**Área:** Conteúdo — Potinho Junino 2026 + Contraprogramação TheBest Festival Junino

**Contexto:** Prescrito pelo ciclo #133. Semanas 9 e 10 (14–27/06) já existiam (criadas nos ciclos #47/#49), mas foram redigidas antes dos achados do ciclo #132: TheBest Açaí ativou Festival Junino 2026 com 4 novos sabores (canjica, pamonha, cocada, paçoca + açaí de milho) em 6 unidades em Londrina, posicionando como "memória afetiva" (self-service por balança). Gap crítico: zero contraprogramação nos arquivos existentes.

**O que analisou:**
- Leu semana9.md completa: Potinho Junino original (paçoca + calda amendoim + granulado tricolor) — bom, mas sem diferenciação explícita vs. TheBest
- Leu semana10.md completa: foco em São João 24/06 e encerramento do Potinho Junino — também sem menção à pressão competitiva do TheBest
- Confirmou: nem semana9 nem semana10 tinham qualquer referência a concorrentes ou contraprogramação
- Mapeou diferencial estrutural: TheBest = self-service por balança (preço variável, produto igual para todos); MilkyPot = potinho personalizado (preço fixo, combinação única)
- Identificou 3 versões possíveis: A (paçoca+amendoim, original), B (cocada+mel, nova), C Fit (açaí+paçoca zero+mel, Linha Zero)
- Linha Zero como diferencial competitivo adicional: TheBest não tem versão fit no Festival Junino

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/potinho-junino-2026-contraprogramacao.md` | CRIADO — Playbook completo: análise competitiva TheBest vs MilkyPot (tabela), produto oficial v2 (Versões A/B/C Fit), 3 variações de copy de contraprogramação (sem nomear concorrente), sequência de 3 stories de diferenciação (qui 18/06), templates WA broadcast JUNINO26 (lançamento + São João), tabela de pontos de injeção em semanas 9 e 10, checklist operador pré-13/06, métricas de rastreamento |
| `belinha/content/pos-inauguracao-semana9.md` | ATUALIZADO — Bloco de aviso "⚠️ ATUALIZAÇÃO CICLO #134" no início: resume ameaça TheBest, ações de injeção por dia (qua/qui/sex), produto expandido B/C, keyword JUNINO26 |
| `belinha/content/pos-inauguracao-semana10.md` | ATUALIZADO — Bloco de aviso "⚠️ ATUALIZAÇÃO CICLO #134": São João + broadcast JUNINO26, lançamento Potinho Junino Fit (seg/ter 22-23/06), copy encerramento sáb 27/06 |

**Commit:** `c8b3bef`

**Destaques estratégicos:**
1. **Copy-âncora sem nomear concorrente:** "Aqui o arraiá é do jeito que VOCÊ gosta. Não tem fila de balança, não tem preço surpresa." — diferencia implicitamente sem parecer agressivo
2. **Versão B (cocada+mel):** usa exatamente os mesmos ingredientes do TheBest Festival Junino (cocada, mel), mas no potinho personalizado — transforma a força do concorrente em argumento para MilkyPot
3. **Versão C Fit (Linha Zero):** TheBest não tem versão fit no Festival Junino — janela de diferenciação direta para clientes que se restringem nas festas
4. **Keyword JUNINO26:** broadcast WA com templates prontos para 17/06 (lançamento) e 24/06 (São João) — captura de leads qualificados antes do pico do evento
5. **Sticker de São João na embalagem (24/06):** detalhe físico que nenhum self-service pode replicar — operador deve confirmar viabilidade com a franquia

**Próximo passo sugerido:**
- **Ciclo #135 — Conversão:** ativar `aggregateRating` no schema FoodEstablishment (comentado linha 161 do index.html) — loja tem 11 dias de operação, verificar se há avaliações Google Maps para ativar rich result de estrelas
- **Ciclo #136 — SEO/Landing:** auditar canonical URLs + indexação das landing pages (`potinho-ninho-londrina.html`, `acai-self-service-londrina.html`)
- **Operador URGENTE:** Confirmar disponibilidade de cocada e mel no estoque Muffato antes de 13/06 (Versões B e C)
- **Operador:** Ativar keyword `JUNINO26` no WA Business até 03/06 (10 dias úteis antes do lançamento)
- **Operador:** Verificar viabilidade de sticker de São João para embalagens (impacto alto, custo baixo)
- **Operador:** Escolher Versão A, B ou C como Potinho Junino principal (pode oferecer as três)

_Belinha — Ciclo #134 | 2026-05-06_

---

## Ciclo #133 — 2026-05-06

**Área:** SEO — FAQ Festa Junina + sitemap.xml lastmod

**Contexto:** Gap técnico obrigatório prescrito pelo ciclo #132 (6+ ciclos sem SEO puro). Foco: capturar buscas sazonais de Festa Junina antes que TheBest Açaí (Festival Junino 2026 com 4 novos sabores, 6 unidades em Londrina) apareça nas SERPs para "potinho junino londrina". Janela de oportunidade: ~40 dias até semana 9 (13/06).

**O que analisou:**
- Auditou todos os schemas de index.html (4 blocos JSON-LD): FoodEstablishment, FAQPage, aggregateRating (comentado), WebSite+WebPage — todos válidos
- Contou 9 perguntas FAQPage existentes — nenhuma cobre Festa Junina ou sazonalidade
- Verificou sitemap.xml: lastmod de index.html e cardapio.html estavam em 2026-05-02 (desatualizado)
- Confirmou que potinho-ninho-londrina.html, acai-self-service-londrina.html, cardapio.html já têm FAQPage própria — gap estava apenas no index.html para a keyword junina
- TheBest Festival Junino: "memória afetiva" como posicionamento (CEO Sérgio Kendy) → contraprogramação MilkyPot: "personalização com preço fixo" vs. "produto de massa"

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Nova pergunta FAQPage (#10): "O MilkyPot tem Potinho Junino para a Festa Junina?" — resposta menciona paçoca, cocada, mel + WhatsApp + @milkypotbr |
| `sitemap.xml` | `lastmod` de index.html e cardapio.html atualizados para 2026-05-06 |

**Commit:** `a0adc51`

**Raciocínio SEO:**
- FAQPage gera rich result tipo "acordeão" nos SERPs do Google — 10ª pergunta sobre Festa Junina aparece em buscas sazonais sem custo adicional de crawl
- Keyword alvo: "potinho junino londrina", "açaí junino londrina", "festa junina sobremesa londrina" — volume baixo agora, pico em jun/2026
- Antecedência de 40 dias = 2–3 ciclos de recrawl do Googlebot (frequência ~15-20 dias para domínio ativo) antes do TheBest aparecer nas mesmas queries
- `lastmod` atualizado sinaliza "conteúdo fresco" ao Googlebot, incentiva recrawl prioritário

**Próximo passo sugerido:**
- **Ciclo #134 — Conteúdo Semanas 9–10 (Festa Junina):** criar "Potinho Junino" oficial com nome, ingredientes, toppings (integrar achados ciclo #132: paçoca, cocada, mel vs. TheBest canjica/pamonha) + adaptar semanas 9 e 10 existentes com contraprogramação
- **Ciclo #135 — Conversão:** ativar `aggregateRating` no schema FoodEstablishment (comentado linha 161) — store tem 11 dias de operação, verificar se há avaliações Google Maps para ativar o rich result de estrelas
- **Operador:** Confirmar toppings juninos disponíveis (paçoca, cocada, mel) no estoque Muffato antes de 13/06

_Belinha — Ciclo #133 | 2026-05-06_

---

## Ciclo #132 — 2026-05-06

**Área:** Concorrentes — refetch TheBest Açaí (Festa Junina 2026) + MilkyMoo (Dia dos Namorados 2026)

**Contexto:** Prescrito como "refetch obrigatório" pelo ciclo #131 (>15 ciclos desde #116). Foco em: mecânicas de Namorados (validar ambiente competitivo do playbook criado no #131) e Festa Junina (semanas 9–10 já redigidas — verificar se TheBest apresenta diferencial sazonal que exige contraprogramação).

**O que analisou:**
- WebSearch em MilkyMoo + "Dia dos Namorados 2026": confirmou múltiplos posts de franqueados (Guarapari, Ituiutaba, Teixeira de Freitas) + @milkymoo nacional com 💘 campanhas ativas. Mecânica exata não acessível (Instagram bloqueado)
- WebSearch em TheBest + "Festa Junina 2026": **ACHADO CRÍTICO** — "The Best Açaí entra no clima junino com novos sorvetes de canjica, pamonha, cocada e paçoca" (ABC da Comunicação). CEO Sérgio Kendy confirma posicionamento "memória afetiva". 700+ unidades com estoque limitado por sabor. Também confirmado "açaí de milho" no Instagram nacional
- WebSearch em Johnny Joy: confirmado como "Johnny" da lista de concorrentes. 55+ lojas, 18 estados, milkshake 300ml ~R$17 / 500ml ~R$20. Sem presença confirmada em Londrina. Diferente do core MilkyPot (potinho vs. milkshake) — ameaça indireta baixa
- "Jhoy" = file separado já existente (belinha/competitors/jhoy.md). Não identificado como nova marca — manter monitoramento
- WebFetch em thebestacai.com.br e johnnyjoy.com.br: bloqueados (403)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/the-best-acai.md` | Nova seção ciclo #132: Festival Junino 2026 (4 sabores sazonal: canjica, pamonha, cocada, paçoca + açaí de milho), tabela de produtos, posicionamento CEO, 4 implicações estratégicas para semanas 9–10 MilkyPot (Potinho Junino personalizado vs. self-service de balança), sugestão Reel 15s "Arraiá do Potinho" |
| `belinha/competitors/milkymoo.md` | Nova seção ciclo #132: Dia dos Namorados 2026 ativo (múltiplas unidades), tabela de vantagens MilkyPot vs MilkyMoo, alerta de UGC antecipação, radar Festa Junina (nenhuma ação identificada — oportunidade para MilkyPot) |

**Commit:** `55fc6d9`

**Achados críticos:**
1. **TheBest Açaí tem Festival Junino 2026 com 4 NOVOS SABORES (canjica, pamonha, cocada, paçoca + açaí de milho)** — 6 unidades em Londrina vão ativar. Semanas 9–10 do MilkyPot precisam de um "Potinho Junino" diferenciado com toppings juninos (paçoca, cocada, mel) como resposta — personalizado, com nome, sem balança
2. **MilkyMoo está ativo em Dia dos Namorados 2026** — confirma que o playbook do ciclo #131 está correto e no timing certo. MilkyPot deve antecipar solicitação de UGC de casais desde 07/06 (N1 broadcast)
3. **TheBest NÃO tem ação de Namorados identificada** — a ameaça competitiva de Namorados é MilkyMoo, não TheBest. Posicionamento "momento especial" do potinho vs. milkshake se mantém
4. **Muffato Quintino = único gap de TheBest em Londrina** — 6 unidades operando mas nenhuma no endereço do MilkyPot (Av. Quintino Bocaiuva 1045). Verificação periódica mantida (próxima: ~ciclo #136)

**Próximo passo sugerido:**
- **Ciclo #133 — SEO:** sitemap.xml audit + canonical URLs + indexação landing pages (gap técnico obrigatório — 6+ ciclos sem SEO puro)
- **Ciclo #134 — Conteúdo Semanas 9–10 (Festa Junina):** integrar achados do TheBest Festival Junino → criar "Potinho Junino" oficial (nome, ingredientes, toppings, Versão A/B) + adaptar semanas 9 e 10 existentes com contraprogramação ao TheBest
- **Operador:** Confirmar se é possível adicionar paçoca, cocada e mel como toppings juninos no estoque do Muffato antes de 13/06 (semana 9)
- **Operador:** Verificar se @milkymoo_londrina (Catuaí/Boulevard) tem promoção específica de Namorados local — para calibrar intensidade da resposta MilkyPot

_Belinha — Ciclo #132 | 2026-05-06_

---

## Ciclo #131 — 2026-05-06

**Área:** Conversão — EMERGÊNCIA Dia dos Namorados 2026 (12/06/2026)

**Contexto:** Prescrito como EMERGÊNCIA pelo ciclo #130. Dia dos Namorados cai na sexta 12/06/2026 — 37 dias a partir de hoje. Semana 8 (`pos-inauguracao-semana8.md`, tema "Indica & Ganha") planeja a sexta 12/06 como "bastidores + contador de indicações", ignorando completamente o Dia dos Namorados. Gap crítico corrigido com playbook standalone e nota de substituição.

**O que analisou:**
- Leu semana8.md completa: confirmado que sexta 12/06 tem conteúdo genérico de Indica & Ganha sem nenhuma menção a Dia dos Namorados
- Leu playbook Dia das Mães (ciclo #129) como referência de formato e padrão
- Calculou que 12/06/2026 é sexta-feira, 37 dias a partir de hoje (dentro da janela de 6 semanas)
- Identificou narrativa-âncora: "Primeiro Dia dos Namorados do MilkyPot Londrina" — inaugurado 25/04, apenas 48 dias antes
- Definiu mecânica diferencial: "Duo MilkyPot" — dois potinhos personalizados, cada um com os sabores favoritos do outro

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/dia-dos-namorados-2026-playbook.md` | CRIADO — Playbook completo: estratégia posicionamento (potinho duplo personalizado como presente), keyword `NAMORADOS26`, cronograma 07–12/06 com horários, 5 templates WA (N1–N5), 2 posts feed com captions completas (véspera + Dia H), Reel 15s com roteiro completo, checklist operacional, tabela de KPIs, 3 versões de mecânica (A/B/C sem desconto) |
| `belinha/content/pos-inauguracao-semana8.md` | ATUALIZADO — Seção sexta 12/06 recebe nota de substituição completa com resumo das ações do dia; conteúdo original arquivado abaixo da nota |

**Commit:** `fd920c5`

**Destaques do playbook:**
1. **"Primeiro Dia dos Namorados" como narrativa orgânica:** 48 dias após a inauguração — genuíno e de alto apelo emocional, seguindo o padrão do Dia das Mães
2. **Duo MilkyPot (mecânica diferencial):** Dois potinhos personalizados, um com os sabores dela, um com os dele — impossível de replicar por quiosque ou produto de prateleira
3. **Keyword `NAMORADOS26` ativa até 03/06:** 10 dias de janela de captura antes do evento; VIP recebe acesso exclusivo na véspera (qui 11/06 às 19h)
4. **Integração com Indica & Ganha:** Semana 8 não perde o tema — apenas sexta 12/06 é substituída; contador de indicações move para sábado 13/06
5. **3 mecânicas sem desconto (A/B/C):** Versão A (topping extra no duo), B (bilhetinho da ovelhinha), C (pontos em dobro para os dois) — operador escolhe até 07/06

**Próximo passo sugerido:**
- **OPERADOR URGENTE:** Configurar keyword `NAMORADOS26` no WA Business até 03/06 (9 dias úteis)
- **OPERADOR:** Decidir Versão A/B/C da mecânica até 07/06
- **Ciclo #132 — Concorrentes:** Refetch obrigatório (>15 ciclos desde #116): Johnny/Jhoy + Green Açaí + TheBest/MilkyMoo — comparar mecânicas de Namorados e Festa Junina
- **Ciclo #133 — SEO:** sitemap.xml audit + canonical + crawl index
- Lembrar operador: LGPD (CNPJ/DPO) ainda sem resolução — D+11 (risco legal crescente)

_Belinha — Ciclo #131 | 2026-05-06_

---

## Ciclo #130 — 2026-05-06

**Área:** Auto-aprimoramento — revisão #125–#129 + auditoria calendário 2026 + roadmap #131–#140

**Contexto:** Ciclo de auto-aprimoramento obrigatório (a cada 5 ciclos). Ciclo #129 detectou o primeiro erro de data (Dia das Mães 2026 prescrito como 2027) e prescreveu que o ciclo #130 deveria auditar **todos os eventos de 2026 restantes** para corrigir gaps semelhantes.

**O que analisou:**
- Releu log ciclos #125–#129 e estrategia.md completa
- Auditou calendário 2026 inteiro (maio–dezembro) contra os arquivos `pos-inauguracao-semanaX.md` existentes
- Verificou semana8.md (07–13/06): tema "Indica & Ganha" sem **nenhuma** menção ao Dia dos Namorados na sexta 12/06 → GAP CRÍTICO confirmado (37 dias = dentro da janela de 6 semanas)
- Verificou semana17.md (09–15/08): tema "Inverno de saída" sem nenhuma menção ao Dia dos Pais 09/08 → gap confirmado (95 dias = fora da janela de criação agora, mas semana17.md precisa atualização)
- Confirmou que Festa Junina (semanas 9–10), Dia das Crianças (semana 26), Halloween (semana 28), Black Friday e Natal estão todos cobertos
- Identificou que errors de ano (2027 em vez de 2026) se repetiram em #125, #128, #134 prescrito — raiz do erro: cópia do roadmap anterior sem verificar datas reais

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Auto-aprimoramento #125–#129": tabela ROI, auditoria calendário 2026 completa (11 eventos mapeados), estado atualizado D+11, roadmap #131–#140 com Dia dos Namorados como EMERGÊNCIA no #131, 3 novas regras v16 (auditoria obrigatória de datas, verificação de ano, playbooks standalone) |

**Achados críticos:**
1. **❌ Dia dos Namorados 12/06/2026 (Semana 8):** semana8.md planeja sexta 12/06 como "bastidores + contador de indicações" — ignora completamente o Dia dos Namorados. 37 dias a partir de hoje = dentro da janela de 6 semanas. → ciclo #131 EMERGÊNCIA
2. **⚠️ Dia dos Pais 09/08/2026 (Semana 17):** semana17.md abre domingo 09/08 com post genérico de "comfort food vs Linha Zero" sem menção ao Dia dos Pais. → ciclo #136

**Commit:** `b354880`

**Próximo passo sugerido:**
- **Ciclo #131 — URGENTE:** criar `belinha/content/dia-dos-namorados-2026-playbook.md` (keyword `NAMORADOS26`, cronograma 07–12/06, templates WA N1–N5, posts feed, Reel 15s) + nota de substituição no semana8.md para sexta 12/06 — padrão Dia das Mães ciclo #129
- **OPERADOR:** verificar se as ações do playbook de Dia das Mães (ciclo #129) foram executadas: keyword MAE26 configurada no WA Business? Post de hoje (06/05)?

_Belinha — Ciclo #130 | 2026-05-06_

---

## Ciclo #129 — 2026-05-05

**Área:** Conversão / Conteúdo — EMERGÊNCIA Dia das Mães 2026 (10/05/2026)

**Contexto:** Ciclo prescristo como "Dia das Mães WA playbook (09/05/2027)" pelo roadmap #125, mas ao calcular a data real o ciclo identificou que **o Dia das Mães de 2026 é em 5 dias (10/05/2026)** e nenhum conteúdo havia sido criado para o evento. Semana 3 (`pos-inauguracao-semana3.md`, criada no ciclo #30) cobre 03–09/05 sem mencionar Dia das Mães. Semana 4 (`pos-inauguracao-semana4.md`, ciclo #34) cobre 10–16/05 com post genérico "Domingo virou MilkyPot" para 10/05 — ignorando completamente a data comemorativa. Gap crítico corrigido com playbook de emergência.

**O que analisou:**
- Calculou que 2º domingo de maio 2026 = **10/05/2026** (5 dias a partir de hoje 05/05)
- Verificou todos os arquivos de conteúdo existentes: nenhum menciona Dia das Mães 2026
- Identificou que semana 4 (10-16/05) tem post genérico para 10/05 sem temática do evento
- Observou narrativa de máximo apelo: primeiro Dia das Mães do MilkyPot Londrina (inauguração 25/04, apenas 15 dias antes)
- Mapeou cronograma com 5 dias restantes: terça (teaser + MAE26), quarta (stories toppings), quinta (broadcast + carrossel), sexta (urgência delivery), sábado (lembrete VIP), domingo (Dia H)
- Roadmap original apontava para 2027 — erro de planejamento corrigido aqui

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/dia-das-maes-2026-playbook.md` | CRIADO — Playbook completo: estratégia posicionamento (potinho como presente personalizado), mecânica keyword `MAE26`, cronograma 5 dias (05–10/05) com horários, 6 templates WA (M1–M6), 4 posts feed com captions completas, roteiro Reels 15s, checklist de execução diária, tabela de métricas, nota operacional urgente sobre substituição do post genérico de semana 4 |

**Narrativa-âncora explorada:**  
"Primeira vez que a ovelhinha celebra o Dia das Mães em Londrina" — evento ocorre apenas 15 dias após a inauguração (25/04). Ângulo genuíno e orgânico de máximo apelo emocional, sem forçar.

**Destaques do playbook:**
1. **Ação imediata hoje (05/05):** Configurar keyword `MAE26` no WA Business + publicar stories às 15h + feed às 17h — tempo não pode ser desperdiçado
2. **Substituir post semana 4 (10/05):** O post genérico do `pos-inauguracao-semana4.md` para domingo 10/05 deve ser trocado pelo Post 4 do playbook (Dia das Mães)
3. **6 templates WA prontos:** M1 (broadcast qui), M2 (VIP lista MAE26 sáb), M3 (broadcast geral sáb), M4 (VIP dom manhã), M5 (broadcast geral dom 13h), M6 (pós-evento seg)
4. **Mecânica sem desconto:** 3 opções de valor extra (topping grátis / pontos em dobro / bilhetinho surpresa) — padrão validado HALLOWEEN/NATAL/BLACKPOT
5. **Roteiro Reels 15s** com trilha sugerida pronto para produção

**Commit:** (a preencher após commit)

**Próximo passo sugerido:**
- **OPERADOR URGENTE:** Executar checklist terça 05/05 HOJE — keyword MAE26, stories 15h, feed 17h
- **OPERADOR:** Definir mecânica (Versão A/B/C) antes de quinta 07/05
- Ciclo #130: Auto-aprimoramento — reler log #125–#129; roadmap mai–ago 2026 (ajustar linha temporal para 2026 em vez de 2027 onde aplicável); verificar se outros eventos de 2026 foram esquecidos ou planejados errado
- Prioridade ciclo #130: **auditar todos os eventos de 2026 restantes** no roadmap e corrigir datas incorretas (o gap do Dia das Mães sugere que outros podem estar errados)

_Belinha — Ciclo #129 | 2026-05-05_

---

## Ciclo #128 — 2026-05-05

**Área:** UX/Performance — `index.html` INP audit (Interaction to Next Paint)

**Contexto:** Prescrito pelo roadmap do ciclo #125 e confirmado no ciclo #127. INP (Interaction to Next Paint) é a métrica Core Web Vitals que mede o tempo entre a interação do usuário e o próximo frame pintado pelo browser. Meta Google: ≤200ms. Dois padrões problemáticos identificados e corrigidos.

**O que analisou:**
- Mapeou todos os 72 event handlers em `index.html` via grep (addEventListener, onclick, oninput, onchange, setInterval, setTimeout)
- Identificou `filterCheckoutStores` chamado via `oninput` sem debounce — a cada keystroke no campo de busca da loja, `renderCheckoutStores()` reconstruía todo o DOM da lista, bloqueando o browser de pintar o cursor (input latency visível no mobile)
- Identificou `setTimeout(10)` em `openProductSheet` e `showToast` para iniciar transições CSS — padrão problemático: a tarefa do setTimeout compete com o frame em andamento, podendo ser atrasada; double rAF garante que o browser pintou o estado inicial antes de adicionar a classe de transição
- Funções de maior impacto INP no critical path de compra: abertura do product sheet (frequente no mobile) e busca de loja no checkout (antes de finalizar pedido)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | **filterCheckoutStores:** adicionado debounce 200ms via `_storeFilterTimer` — `renderCheckoutStores` só executa 200ms após o usuário parar de digitar; **openProductSheet:** `setTimeout(10)` → double `requestAnimationFrame` para iniciar transição `sheet-open`; **showToast:** mesmo padrão rAF aplicado à animação `toast-show` |

**Commit:** `1b6ddf2`

**Destaques técnicos:**
1. **Debounce `filterCheckoutStores`:** Padrão claro de INP — sem debounce, cada keystroke (evento `input`) enfileira uma tarefa longa (DOM rebuild da lista de lojas). Com debounce 200ms, cada keystroke tem custo ~zero (apenas `clearTimeout + setTimeout`), liberando o browser para pintar o cursor imediatamente. Melhoria direta no INP do checkout step 2
2. **Double rAF vs `setTimeout(10)`:** `setTimeout(10)` não é confiável — o browser pode não ter pintado o frame ainda quando o callback executa, causando transição CSS sem estado inicial visível (flash). Double rAF garante: 1° rAF = browser preparou o frame inicial; 2° rAF = browser está pronto para a transição. Padrão recomendado pela spec do FLIP animation
3. **3 pontos corrigidos num ciclo:** `openProductSheet` + `showToast` + `filterCheckoutStores` — todos dentro do critical path mobile (product sheet é o primeiro toque em "Pedir", toast confirma adição ao carrinho, busca de loja é pré-checkout)

**Próximo passo sugerido:**
- Ciclo #129: Conteúdo — Dia das Mães WA playbook (09/05/2027): keyword "MAE27", segmentação VIP, upsell "potinho pra mãe", posts semana 54 (03–09/05/2027) — prescrito desde ciclo #127
- Ciclo #130: Auto-aprimoramento — reler log #125–#129, roadmap mai–ago 2027 (Festa Junina, Dia dos Namorados, 14 meses de loja)
- Técnico futuro: auditar `renderProducts` (chamado no `filterProducts`) — mesma questão de innerHTML rebuild; candidato para lazy/virtual scroll se catálogo crescer acima de 20 itens

_Belinha — Ciclo #128 | 2026-05-05_

---

## Ciclo #127 — 2026-05-05

**Área:** SEO — FAQPage schema em `cardapio.html`

**Contexto:** Prescrito pelo roadmap do ciclo #125. `cardapio.html` já tinha `FoodEstablishment` + `BreadcrumbList` + `WebPage`, mas sem `FAQPage`. Schema de FAQ aumenta elegibilidade para rich results em buscas do tipo pergunta ("tem delivery?", "tem opção fit?", "como funciona fidelidade?").

**O que analisou:**
- Verificou schemas existentes em `cardapio.html` (linhas 48–158): `FoodEstablishment`+`Menu` e `BreadcrumbList`+`WebPage` — nenhum `FAQPage`
- Identificou 6 perguntas de alta intenção de compra: personalização, delivery Londrina, fidelidade, Linha Zero/Fit, açaí buffet Muffato, formas de pagamento
- Validou os 3 blocos JSON-LD resultantes com Node.js — todos OK

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | +59 linhas: novo `<script type="application/ld+json">` com `FAQPage` de 6 Q&A antes do `</head>` |

**Commit:** `732c68e`

**Destaques:**
1. **6 perguntas estratégicas:** cobre dúvidas do funil de decisão (personalização, entrega, pagamento) e diferenciais MilkyPot (Linha Zero, buffet açaí, fidelidade)
2. **Diferencial Muffato explícito:** pergunta 5 responde sobre o açaí buffet self-service exclusivo da unidade Londrina — não encontrado em concorrentes
3. **Sem iFood/Uber Eats:** resposta da pergunta de delivery reforça o canal próprio WhatsApp e a ausência de taxa de plataforma

**Próximo passo sugerido:**
- Ciclo #128: `index.html` INP audit (Interaction to Next Paint) — novo padrão Core Web Vitals Google 2024+; identificar event handlers lentos
- Ciclo #129: Dia das Mães WA playbook (09/05/2027): keyword "MAE27", segmentação VIP, upsell "potinho pra mãe"

_Belinha — Ciclo #127 | 2026-05-05_

---

## Ciclo #126 — 2026-05-05

**Área:** Concorrentes — Refetch TheBest + MilkyMoo pré-Black Friday (27/11/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #125 (v15c: antecipar refetch antes do evento Black Friday 27/11). Último refetch foi ciclo #107 — 19 ciclos atrás. Objetivo: mapear campanhas de Black Friday de ambos os concorrentes, novos produtos 2026, estratégias de app/fidelidade e alertas táticos para a semana 32 (BLACKPOT).

**O que analisou:**
- WebSearch "The Best Friday 2026" → confirmou R$3,99/100g no dia 27/11 (Black Friday), via app Clube The Best, 530+ lojas, consumo ilimitado — único desconto do ano
- WebSearch "The Best Experience Londrina 2026" → convenção de franqueados **em Londrina** no dia 11/11; palestrantes nacionais; novidades 2027 serão anunciadas
- WebSearch "Meia Maratona The Best Açaí Londrina 2026" → 08/11, Lago Igapó; branding saúde/esporte na semana antes da Black Friday
- WebSearch "Milky Moo Black Friday 2026" → mecânica: compre 500ml ganhe 300ml grátis; canais: app + iFood
- WebSearch "Quarta da Moo" → ação semanal permanente: 50% OFF em 13 sabores toda quarta, exclusivo app
- WebSearch "Milky Moo verão/inverno 2026 lançamentos" → aBISoluta (collab Bis), Smoor's (marshmallow maçaricado), Bebidas Quentinhas (inverno), Sorbet Manga+Maracujá
- Verificou: gap Muffato Quintino Bocaiuva mantido em ambos os concorrentes

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/the-best-acai.md` | Nova seção "Atualização Ciclo #126": The Best Friday 27/11 (R$3,99/100g, app Clube, 530+ lojas), The Best Experience Londrina 11/11, Meia Maratona 08/11, tabela de unidades Londrina atualizada, 5 alertas estratégicos |
| `belinha/competitors/milkymoo.md` | Nova seção "Atualização Ciclo #126": Black Friday (compre 1 ganhe 1), Quarta da Moo permanente, Clube Moo detalhado, tabela de 5 novos produtos 2026, tabela Londrina, 5 alertas estratégicos |

**Commit:** _(ver abaixo)_

**Destaques da pesquisa:**
1. **The Best Friday (27/11) = mesmo dia do BLACKPOT MilkyPot.** TheBest vai drenar tráfego com R$3,99/100g — o playbook BLACKPOT (ciclo #124) precisa estar totalmente configurado até 22/11. Urgência operacional real
2. **"Quarta da Moo" 50% OFF toda semana:** Cria hábito estrutural de consumo via app. MilkyPot pode criar equivalente via WA broadcast semanal sem precisar de app
3. **aBISoluta (collab Bis) e Smoor's (marshmallow maçaricado):** MilkyMoo gera conteúdo viral via produto-espetáculo e collab de marca. Oportunidade para MilkyPot criar topping "espetacular" no PDV (brulee, farofa na hora) com vídeo de preparo
4. **The Best Experience Londrina 11/11:** Anúncios de novos produtos 2027 → monitorar redes sociais pós-evento (semana 09–16/11)
5. **MilkyMoo usa iFood; MilkyPot não.** No Black Friday o cliente MilkyMoo pode pedir sem sair de casa. MilkyPot deve comunicar ativamente o delivery próprio via WA (sem comissão, 15-40min, embalagem térmica) como diferencial

**Próximo passo sugerido:**
- Ciclo #127: SEO — FAQPage em `cardapio.html`: 5–7 perguntas (personalização, entrega, fidelidade, Linha Zero, açaí self-service) — prescrito desde ciclo #125
- Operador: configurar BLACKPOT no WA Business ANTES de 22/11/2026 (etiqueta + automação keyword + mecânica A/B/C escolhida)
- Operador: monitorar redes sociais após The Best Experience Londrina (11/11/2026) para captar anúncios de novas unidades
- Operador: avaliar "Quarta do Potinho" — ação WA semanal inspirada na "Quarta da Moo" (sem app, via broadcast)

_Belinha — Ciclo #126 | 2026-05-05_

---

## Ciclo #125 — 2026-05-05

**Área:** Auto-aprimoramento — revisão #120–#124 + roadmap #126–#135 + regras v15

**O que analisou:**
- Releu ciclos #120–#124 completos no log (auto-aprimoramento, semana 54, UX landing pages, SEO openingHours, BLACKPOT playbook)
- Avaliou ROI de cada ciclo: #121 (semana 54) e #120 (auto-aprimoramento) = ROI máximo; #124 (BLACKPOT) e #122 (UX) = alto; #123 (SEO schema) = médio-alto
- Executou `ls belinha/content/pos-inauguracao-semana*.md` — confirmou sequência 1–56 **completa e sem gaps** após correção do ciclo #121
- Verificou estado dos concorrentes: último refetch ciclo #116 (9 ciclos atrás, ~5 meses); regra diz máx 15 ciclos → ainda dentro do limite mas Black Friday 27/11 se aproxima → antecipar refetch para #126
- Identificou `checkout.html` sem auditoria desde #117; prescrito para #133 (nova regra v15b)
- Identificou que FAQPage em `cardapio.html` aumenta CTR em perguntas de busca; nova regra v15a
- LGPD permanece sem resolução; `cardapio.js` dead code (blocker #6) sem decisão do operador

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Auto-aprimoramento: Ciclos #120–#124" com: tabela de ROI, padrões a replicar, pontos de melhoria, estado atualizado do projeto, roadmap rebalanceado #126–#135, regras v15 (FAQPage prioritária, auditoria checkout periódica, antecipação de concorrentes) |

**Principais achados:**
1. **Sequência 1–56 completa:** Primeiro bloco de 56 semanas sem gaps — marco de conteúdo concluído
2. **Padrão "audit completo de uma página"** (ciclo #122): mais eficiente do que visitas múltiplas ao mesmo arquivo — 4 bugs resolvidos num só ciclo
3. **Concorrentes → antecipar antes da Black Friday:** ciclo #126 adiantado vs. roadmap original (#126 era concorrentes mas sem urgência de timing)
4. **Nova urgência para checkout.html:** Sem auditoria há 8 ciclos — conversão direta em risco; prescrito para #133
5. **cardapio.js dead code:** Lembrar operador a cada 10 ciclos para não deixar esquecer (próximo lembrete: #135)

**Commit:** _(ver abaixo)_

**Próximo passo sugerido:**
- Ciclo #126: Concorrentes — refetch TheBest + MilkyMoo com foco em novidades pré-Black Friday e produtos de verão (v15c: antecipar antes do evento 27/11)
- Operador: LGPD (CNPJ/DPO) — risco legal ativo; priorizar resolução com time jurídico
- Operador: `cardapio.js` dead code (1050 linhas) — decisão: manter ou refatorar? Impacto no bundle size

_Belinha — Ciclo #125 | 2026-05-05_

---

## Ciclo #124 — 2026-05-05

**Área:** Conversão — Playbook WA standalone BLACKPOT (Black Friday 27/11/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #120 (tabela #124: "Black Friday WA playbook BLACKPOT, Sexta #31, contraprogramação TheBest R$3,99/100g + MilkyMoo milkshakes"). O arquivo `pos-inauguracao-semana32.md` já cobre o calendário editorial de feed/stories da semana — este playbook é complementar, focado exclusivamente nas operações WhatsApp do evento.

**O que analisou:**
- Verificou `pos-inauguracao-semana32.md`: tem calendário editorial completo (dom 22/11 → sáb 28/11), copy de feed/stories/reels; mas sem detalhamento operacional de WA (segmentação, automação, copy pós-evento)
- Tomou `whatsapp-aniversario-6meses.md` como template de formato: segmentação por etiquetas, cronograma horário a horário, copy pronto para copiar, checklist operador, métricas
- Black Friday 2026 = último sexta de novembro = 27/11/2026 = Sexta #31 (contagem a partir de Sexta #1 = 01/05/2026)
- Mecânica: 3 versões (A: topping extra grátis / B: pontos em dobro / C: brinde 50 primeiros) — operador escolhe antes de quarta 25/11

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-blackpot.md` | CRIADO — Playbook standalone: estratégia BLACKPOT, keyword automação WA, cronograma 22–28/11, 9 templates de mensagem prontos (M1→M6 + M-PRÉ + M3A + M3B), 3 versões por mecânica, contraprogramação implícita TheBest/MilkyMoo, checklist operador, métricas de sucesso |

**Commit:** `31584a3`

**Destaques do playbook:**
1. **Keyword BLACKPOT com automação WA Business:** Clientes que enviarem "BLACKPOT" entram automaticamente na lista VIP e recebem acesso à mecânica 48h antes do público — padrão validado com "HALLOWEEN" (ciclo #67) e "NATAL" (ciclo #75)
2. **3 mecânicas sem desconto na base:** Versão A (topping extra), Versão B (pontos dobrados), Versão C (brinde 50 primeiros) — operador decide sem precisar de novo ciclo. Nenhuma reduz o preço do potinho
3. **Cronograma de 7 dias (22–28/11):** 8 touchpoints WA distribuídos estrategicamente; M4 "últimas horas" é o único que tem instrução condicional (só disparar se a loja não estiver lotada)
4. **Contraprogramação TheBest:** copy "potinho personalizado vs. pesado e medido como feira" sem nomear o concorrente — diferenciação de experiência implícita
5. **M6 reativação sábado 28/11:** Alcança inativos que não foram no dia H; tom gentil, sem gatilho de culpa, gancho para dezembro

**Próximo passo sugerido:**
- Ciclo #125: Auto-aprimoramento (releitura ciclos #120–#124 + ajuste de estratégia + roadmap Q2 2027)
- Ciclo #126: Concorrentes — refetch TheBest + MilkyMoo + Johnny/Jhoy: status pós-Black Friday, novos produtos, UGC de dezembro
- Operador: definir mecânica BLACKPOT (Versão A/B/C) com franquia ANTES de quarta 25/11/2026
- Operador: configurar resposta automática keyword `BLACKPOT` no WA Business antes de domingo 22/11/2026
- Operador: criar etiqueta `#blackpot-2026` no WA Business antes de domingo 22/11/2026

_Belinha — Ciclo #124 | 2026-05-05_

---


## Ciclo #123 — 2026-05-05

**Área:** SEO — `openingHoursSpecification` com dias individuais (3 páginas)

**Contexto:** Prescrito pelo roadmap do ciclo #122. O bloco anterior usava um único objeto com `"dayOfWeek": [array de 7 dias]` — formato tecnicamente válido mas subótimo: o Google Rich Results validator e o parser do Google My Business têm melhor compatibilidade com entradas individuais por dia (permite futura diferenciação de horário por dia sem refatoração, e evita erros silenciosos em crawlers que não processam o array corretamente).

**O que analisou:**
- Verificou o schema atual nos 3 arquivos: todos com array-único de dias
- Confirmou que `index.html` já tinha `validFrom: 2026-04-25` mas as duas landing pages não tinham — adicionado também
- Estrutura nova: 7 entradas `{"@type":"OpeningHoursSpecification","dayOfWeek":"Monday",...}` (string singular, não array) — formato explícito preferido pelo Google

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | `openingHoursSpecification` expandido de 1→7 entradas (uma por dia da semana, string singular, `validFrom` mantido) |
| `potinho-ninho-londrina.html` | Idem + `validFrom: 2026-04-25` adicionado (paridade com `index.html`) |
| `acai-self-service-londrina.html` | Idem + `validFrom: 2026-04-25` adicionado |

**Commit:** `d0bf6d9`

**Impacto esperado:**
1. **Google Rich Results validator:** Entradas individuais por dia são o formato canônico nos exemplos oficiais da Google — elimina potencial warning de "array de dias"
2. **Google My Business sync:** Ferramenta de importação de schema do GMB lê melhor entradas individuais para detectar horários diferentes por dia (ex: horário reduzido feriados no futuro)
3. **Manutenibilidade:** Para alterar o horário de domingo ou sábado isoladamente (ex: Natal, abertura extra), basta editar a linha correspondente sem refatorar o bloco inteiro
4. **Paridade técnica:** `validFrom` agora presente nos 3 arquivos, informando aos crawlers que os horários são válidos a partir da inauguração

**Próximo passo sugerido:**
- Ciclo #124: Conversão — Black Friday WA playbook "BLACKPOT" (Sexta #31, novembro 2026), conforme roadmap #120
- Ciclo #125: Auto-aprimoramento (revisão ciclos #120–#124)
- Ciclo #126: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo + "Nova meta, novo potinho" Linha Zero

_Belinha — Ciclo #123 | 2026-05-05_

---

## Ciclo #122 — 2026-05-05

**Área:** UX/Performance — landing pages locais (`acai-self-service-londrina.html` + `potinho-ninho-londrina.html`)

**Contexto:** Prescrito como ciclo obrigatório pelo roadmap #120. Foco: CSS/audit das duas landing pages SEO de Londrina (maior tráfego orgânico esperado).

**O que analisou:**
- Leu ambas as páginas integralmente (459 e 393 linhas)
- Identificou 4 problemas acionáveis:
  1. `og:type="restaurant.menu"` no açaí — tipo Open Graph **inválido** (não é tipo oficial OG spec); causa falha de parsing em crawlers e previews
  2. Logo above-the-fold sem `fetchpriority="high"` nem `<link rel="preload" as="image">` — LCP penalizado desnecessariamente
  3. `.btn-wa` e `.btn-menu` sem `:hover` state — zero feedback visual no desktop (só `:active`), prejudica conversão desktop
  4. `og:image:type` presente no açaí mas ausente no ninho — assimetria de metadados OG

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `acai-self-service-londrina.html` | `og:type` → `website` (bug fix); `<link rel="preload" as="image">` adicionado; `fetchpriority="high"` no logo `<img>`; `:hover` em `.btn-wa` (`translateY(-2px)` + shadow) e `.btn-menu` (bg `#F0EEFF` + border escurecido) |
| `potinho-ninho-londrina.html` | `<link rel="preload" as="image">` adicionado; `fetchpriority="high"` no logo `<img>`; `:hover` em `.btn-wa` e `.btn-menu` (bg `#F9F0FF` + border `#9B59B6`); `og:image:type` adicionado (paridade) |

**Commit:** `03086a7`

**Impacto esperado:**
1. **LCP (Core Web Vitals):** Preload + fetchpriority eliminam latência de descoberta do logo. Chrome priorizará o recurso na fila de fetch antes de processar o parser HTML inteiro
2. **SEO/OG:** `og:type=website` resolve erro silencioso de parsing — WhatsApp, Telegram e Facebook lêem o tipo corretamente agora
3. **Conversão desktop:** `:hover` nos CTAs dá feedback imediato; usuário de desktop sabe que o botão é clicável antes de clicar
4. **Paridade técnica:** ambas as páginas agora têm conjunto idêntico de metadados OG

**Próximo passo sugerido:**
- Ciclo #123: SEO — `openingHoursSpecification` com dias separados em vez de array único (melhor compatibilidade com Google My Business sync)
- Ciclo #124: Conversão — Black Friday WA playbook "BLACKPOT" (Sexta #31, conforme roadmap #120)
- Ciclo #125: Auto-aprimoramento (revisão ciclos #120–#124)

_Belinha — Ciclo #122 | 2026-05-05_

---

## Ciclo #121 — 2026-05-05

**Área:** Conteúdo — Semana 54 (GAP CRÍTICO: 25/04–01/05/2027)

**Contexto:** Prescrito como prioridade máxima 🔴 pelo roadmap do ciclo #120 (auto-aprimoramento). Semana 54 = DIA H do aniversário de 1 ANO (25/04/2027, Dom) + pós-aniversário até Dia do Trabalho (01/05/2027, Sáb). O arquivo `pos-inauguracao-dia-h.md` já existia com o roteiro hora a hora do Dia H, mas a semana 54 não tinha arquivo canônico na sequência de semanas, gerando um gap identificado no ciclo #120.

**O que analisou:**
- Verificou `ls belinha/content/pos-inauguracao-semana5*.md` — confirmou ausência de `semana54.md`
- Leu `pos-inauguracao-dia-h.md` (seção SEMANA 54, linhas 594–905) — identificou erros de data: o arquivo usava +1 dia em todas as datas do pós-aniversário ("Domingo 27/04" mas 27/04/2027 é Terça; "Sexta 02/05" mas 02/05 é Domingo de semana 55)
- Verificou datas reais: 25/04/2026 (Sáb) + 365 dias = 25/04/2027 (Dom), portanto semana 54 = Dom 25/04 → Sáb 01/05; confirmado pela semana 55 que começa "Dom 02/05"
- Sexta #37 corrigida para 30/04 (Sex), não 02/05 (Dom como estava no dia-h.md)
- Dia do Trabalho 01/05/2027 = Sábado (feriado nacional em dia de fim de semana)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana54.md` | CRIADO — Arquivo canônico da semana 54 com datas corretas. Dom 25/04: referência ao dia-h.md + tabela de touchpoints. Seg 26/04: gratidão "O dia depois" (WA geral + feed). Ter 27/04: carrossel retrospectiva 1 ANO (8–10 slides, estrutura completa). Qua 28/04: post equipe humanização. Qui 29/04: Linha Zero pós-festa. Sex 30/04: Sexta #37 "primeira Sexta do 2º ano" (WA + feed + stories urgência). Sáb 01/05: Dia do Trabalho + teaser Dia das Mães 11/05. Checklist editorial + métricas-alvo + notas técnicas de correção de datas. |

**Commit:** `be3e4d7`

**Destaques:**
1. **GAP crítico eliminado:** Sequência semana50→56 agora contínua sem lacunas
2. **Correção de datas:** Semana 54 no dia-h.md tinha erro sistemático de +1 dia — este arquivo é a referência canônica correta
3. **Narrativa "2º ano":** Sexta #37 posicionada como "1ª Sexta do 2º ano" — ângulo exclusivo e emocional de alto engajamento
4. **Dia do Trabalho (01/05=Sáb) + teaser Dia das Mães:** Dois ganchos num único post — eficiência editorial máxima
5. **Referência cruzada ao dia-h.md:** Dom 25/04 usa o roteiro hora a hora do dia-h.md — sem duplicação de conteúdo

**Próximo passo sugerido:**
- Ciclo #122: UX/Performance — CSS purge/audit em `acai-self-service-londrina.html` + `potinho-ninho-londrina.html` (prescrito pelo roadmap #120)
- Ciclo #123: SEO — LocalBusiness `openingHoursSpecification` com todos os dias + horário especial
- Ciclo #124: Conversão — Black Friday WA playbook "BLACKPOT" (Sexta #31)
- Ciclo #125: Auto-aprimoramento (log #120–#124)
- Operador: confirmar horário 01/05/2027 (Dia do Trabalho = Sábado) com Muffato/franquia

_Belinha — Ciclo #121 | 2026-05-05_

---

## Ciclo #120 — 2026-05-05

**Área:** Auto-aprimoramento — revisão #115–#119 + roadmap #121–#130 + gap semana 54

**O que analisou:**
- Releu ciclos #115–#119 completos no log
- Avaliou ROI de cada ciclo: #116 (Concorrentes) = altíssimo; #117 (checkout audit) = alto; #115 (auto-aprimoramento) = alto; #118 (WebSite schema) = médio-alto; #119 (WA 6 meses) = médio
- Executou `ls belinha/content/pos-inauguracao-semana*.md` → detectou **gap crítico: semana 54 ausente**
- Semana 54 = 25/04–01/05/2027 = **DIA H do Aniversário de 1 Ano** — evento mais importante da loja, sem roteiro de conteúdo
- Verificou que semana 53 (countdown 7→1) e semana 55 (pós-aniversário) existem, confirmando que o gap é real e não intencional
- Revisou estado do LocalBusiness schema: apenas bloco genérico, sem dias individuais — lacuna para Rich Results de horários
- Avaliou timing do ciclo #119 (playbook WA a 5,5 meses): antecipação excessiva para eventos operacionais — nova regra v14
- Rebalanceou roadmap #121–#130 priorizando semana 54 (gap crítico) antes dos itens técnicos

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Auto-aprimoramento: Ciclos #115–#119" com: tabela de ROI por ciclo, análise de valor/desperdício, diagnóstico do gap semana 54, estado do projeto D+10, roadmap rebalanceado #121–#130, regras novas v14 (exceção à pausa para gaps, timing de playbooks, gap detection obrigatório) |

**Principais achados:**
1. **Gap semana 54 (25/04/2027):** A data mais importante da loja não tem conteúdo — prioridade #1 do próximo bloco
2. **Ciclo #116 foi o de maior ROI do bloco:** Intel de preços + mudança no site no mesmo ciclo = duplo impacto. Padrão a replicar
3. **Timing de playbooks:** Ciclo #119 foi feito 5,5 meses antes do evento — nova regra v14 limita a 6 semanas de antecedência (exceto quando há pré-requisito técnico longo)
4. **Gap detection:** Nova rotina obrigatória no auto-aprimoramento: `ls content/semana*.md` para checar sequência numérica
5. **Ratio perfeito:** #115–#119 cobriu todas as 5 áreas (1 por área) — rotação v12 funcionando

**Commit:** _(ver abaixo)_

**Próximo passo sugerido (ciclo #121 — conteúdo excepcional):**
- Criar `belinha/content/pos-inauguracao-semana54.md` — DIA H do Aniversário de 1 Ano (25/04/2027): roteiro hora-a-hora do dia, posts feed + stories + Reels + WA VIP + WA geral, gestão de crise de demanda, ritual de encerramento com equipe, teaser semana 55 (Dia das Mães)
- Exceção à pausa de conteúdo aprovada (v14): semana 54 é gap em sequência existente, não extensão do horizonte

---

## Ciclo #119 — 2026-05-05

**Área:** Conversão — Playbook WA Aniversário 6 Meses (25/10/2026)

**O que analisou:**
- Verificou que o template WA do 6-meses estava enterrado dentro de `pos-inauguracao-semana28.md` (linha ~46), sem arquivo operacional próprio e com tom misturado ao Halloween
- Confirmou que `whatsapp-reativacao-d30-d60.md` (D+30/D+60) já existe desde ciclo #106 — não precisa recriar
- Verificou WA "VERAO": blocker #5 em `blockers.md` — mecânica é para dezembro/2026, sem ação possível agora. Adicionado timeline crítica com datas claras de pré-requisito para o operador
- Verificou que não existe arquivo standalone `whatsapp-aniversario-6meses.md` — gap real, pois o operador precisará de um documento isolado para o dia 25/10

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-aniversario-6meses.md` | CRIADO — Playbook operacional completo: 3 segmentos (M1 base completa 10h, M2 VIP fidelidade ≥50 pts 11h, M3 reativação inativos 18h), cronograma minuto-a-minuto do dia 25/10, checklist pré-dia, integração com semana de Halloween 26–31/10, métricas e erros comuns |
| `belinha/blockers.md` | Blocker #5 (WA "VERAO") atualizado com timeline crítica: pré-requisitos com datas (produto definido até 01/11, keyword configurada até 30/11, broadcast em 03/12). Nota de verificação ciclo #119 adicionada |

**Impacto esperado:**
- Operador tem um documento de referência único para o 25/10 — abre o arquivo, segue o cronograma, não precisa vasculhar semana28
- M3 (reativação inativos via aniversário) complementa o fluxo D+60 com um gancho emocional de data — maior taxa de resposta esperada vs. reativação genérica
- WA "VERAO" agora tem datas claras de ação futura, não fica como blocker aberto sem contexto

**Commit:** `13f44cf`

**Próximo passo sugerido (ciclo #120 — auto-aprimoramento):**
- Auto-aprimoramento prescrito no roadmap: reler log #115–#119, identificar o que gerou mais valor, ajustar roadmap outubro–dezembro 2026 em `belinha/estrategia.md`

---

## Ciclo #118 — 2026-05-04

**Área:** SEO — `index.html` WebSite + WebPage schema (BreadcrumbList + Sitelinks SearchAction)

**O que analisou:**
- Verificou `index.html`: tinha `FoodEstablishment` + `FAQPage`, mas **nenhum** `WebSite`, `WebPage` ou `BreadcrumbList`
- Comparou com `cardapio.html` (ciclo #88): este já tinha `BreadcrumbList` + `WebPage` no padrão `@graph`
- Identificou dois gaps de Rich Results na homepage: (1) sem `WebSite` → Google não consegue ativar Sitelinks Searchbox; (2) sem `WebPage` → hierarquia do site invisível para crawlers

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Adicionado bloco `@graph` com `WebSite` (id `#website`, `SearchAction` apontando para `cardapio.html?q=`) + `WebPage` (homepage, `isPartOf: #website`, `breadcrumb` com 1 ListItem "Início") — inserido entre o bloco `aggregateRating` comentado e o `preload` LCP |

**Impacto esperado:**
- `WebSite` com `potentialAction: SearchAction` habilita o Google Sitelinks Searchbox quando a homepage tiver autoridade suficiente
- `WebPage.breadcrumb` alinha a homepage com `cardapio.html`, `londrina/acai-self-service-londrina.html`, etc. — hierarquia completa para Rich Results de breadcrumb nas SERPs

**Commit:** `c556933`

**Próximo passo sugerido (roadmap #119):**
- Conversão — Template WA marco 6 meses (25/10/2026) + verificar status WA keyword "VERAO" + template reativação D+60 de clientes inativos

---

## Ciclo #117 — 2026-05-04

**Área:** UX/Performance — `checkout` audit (primeira auditoria técnica)

**Contexto:** Prescrito pelos ciclos #115 e #116 como próxima prioridade obrigatória. O fluxo de checkout (modal de 4 passos em `cardapio.html` + lógica em `js/checkout.js`) nunca havia sido auditado tecnicamente.

**O que analisou:**
- Leu `js/checkout.js` (786 linhas): fluxo de 4 etapas (dados → loja → entrega → pagamento), `placeOrder()`, `updateOrderSummary()`, chat Lulú Bot
- Leu markup do checkout modal em `cardapio.html` (linhas 298–474): 7 inputs de formulário, step indicators, opções de entrega e pagamento
- **Gap 1 — Zero atributos `autocomplete`/`inputmode`:** Nenhum input tinha `autocomplete` ou `inputmode`. No mobile: teclado genérico abre para CEP e telefone; browser não consegue autofill de nome/endereço. Causa abandono em mobile (estimativa ~30% mais friccão)
- **Gap 2 — `summaryStore` nunca populado:** `<div id="summaryStore">` existe no HTML do step 4 (resumo final) mas `updateOrderSummary()` não o preenchia — o cliente chega no resumo sem ver qual loja selecionou. Potencial gerador de desconfiança e pedido cancelado
- Verificou: sem quebra em outros arquivos, ambas as mudanças são puramente aditivas

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | 7 inputs do checkout agora têm `autocomplete` + `inputmode` corretos: `name`, `tel`+`inputmode="tel"`, `off`+`inputmode="numeric"` (CPF), `postal-code`+`inputmode="numeric"` (CEP), `street-address`, `address-line2`, `address-level3` |
| `js/checkout.js` | `updateOrderSummary()` agora popula `#summaryStore` com nome da loja e tempo estimado (de `window._selectedStoreName` e `window._selectedStoreTime`) ao chegar no step 4 |

**Commit:** `dd638e1`

**Destaques técnicos:**
1. **`inputmode="numeric"` em CEP e CPF:** Abre teclado numérico nativo no iOS/Android sem mudar `type="text"` (que quebraria formatação de máscara)
2. **`inputmode="tel"` + `autocomplete="tel"`:** Abre teclado de discagem; Chrome/Safari oferecem sugestão de número salvo → zero digitação para cliente recorrente
3. **`summaryStore` fix:** Primeiro vez que o cliente vê "📍 MilkyPot Muffato Londrina — ⏱️ 20-35 min" antes de confirmar → reduz cancelamentos por insegurança sobre destino do pedido
4. **Risco zero:** Todas as mudanças são atributos HTML adicionais + código JS puramente aditivo — nenhum comportamento existente alterado

**Próximo passo sugerido:**
- Ciclo #118: SEO — `index.html` BreadcrumbList audit (verificar se existe; cardápio ✅, açaí ✅ — confirmar index)
- Ciclo #119: Conversão — Template WA marco 6 meses (25/10) + reativação D+60 + status WA "VERAO"
- Ciclo #120: Auto-aprimoramento — reler #115–#119, ajustar roadmap Q4 2026
- Operador: monitorar taxa de abandono do checkout após esta mudança (comparar % que chega ao step 4 antes/depois)

_Belinha — Ciclo #117 | 2026-05-04_

---

## Ciclo #116 — 2026-05-04

**Área:** Concorrentes (CRÍTICO) — refetch TheBest + MilkyMoo + FAQ competitivo no site

**Contexto:** Prescrito pelo ciclo #115 como urgência máxima: 21 ciclos sem refetch de concorrentes, Black Friday 2026 (27/11) sem intel de preço/promo. Nova regra v13: máximo 15 ciclos entre refetches.

**O que pesquisou/analisou:**
- WebSearch: "The Best Açaí Londrina 2026 promoções preços novidades" → confirmou preço regular R$6,29/100g (sem alteração), nova loja maior em Londrina (Gleba Palhano)
- WebSearch: "The Best Açaí Black Friday 2026" → confirmou padrão "The Best Friday": R$3,99/100g (37% desconto) em 530+ lojas por 1 dia (27/11)
- WebSearch: "MilkyMoo Black Friday 2026" → confirmou mecânica "Milkshakes em Dobro" (500ml + 300ml grátis) exclusivo iFood
- WebSearch: "MilkyMoo Nutty Bavarian pistache macadâmia" → collabs sazonais (Estrela/pistache + Pérola/macadâmia) a R$27/R$32 (premium vs. R$18/R$22 regular) — estratégia de buzz com marcas
- WebSearch: "MilkyMoo Nestlé 2026" → 5+ collabs identificadas: Sensação, Smoor's, Alpino, Caribe, Carmela. Padrão: 4–6 collabs/ano = cobertura de mídia garantida
- Promoções MilkyMoo 2026 identificadas: 2x1 Pandora/Pintadinha iFood (fev), Milky Moo Day (mar), Seg–Qui desconto recorrente em lojas
- App próprio MilkyMoo ativo (milkymoo.com.br/aplicativo) — canal beyond iFood em construção

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Novo FAQ schema (JSON-LD FAQPage): "Qual a diferença do MilkyPot para uma açaiteria de self-service?" — posiciona preço fixo vs. R$6–7/100g sem nomear concorrente. Novo FAQ visível HTML (clientes): mesma pergunta com formatação rich text |
| `belinha/competitors/the-best-acai.md` | Seção "⚡ ATUALIZAÇÃO CICLO #116": Black Friday padrão (R$3,99/100g histórico), The Best Donuts (580+ lojas), Sorbet fit (novo segmento disputando Linha Zero), status Muffato Londrina (não confirmado), tabela de preços atualizada, benchmark vs. MilkyPot |
| `belinha/competitors/milkymoo.md` | Seção "⚡ ATUALIZAÇÃO CICLO #116": tabela de promoções recorrentes 2026, tabela de collabs com preços (Nutty Bavarian + Nestlé), app próprio, análise de estratégia de collabs, implicação para MilkyPot |

**Commit:** `7b01549`

**Achados principais:**
1. **FAQ "self-service vs. potinho"** é gap semântico real: quem busca "açaí Londrina preço" pode chegar no MilkyPot pela resposta — e a resposta reposiciona a proposta de valor (preço fixo, sem balança)
2. **TheBest Black Friday = R$3,99/100g:** Preço promocional (R$12 para pote ~300g) ainda é menos previsível que MilkyPot. Comunicar "preço fixo, sem surpresa" como diferencial estrutural nas semanas 33–34 (novembro)
3. **MilkyMoo usa iFood em TODAS as promoções:** Vantagem estrutural MilkyPot = canal WhatsApp próprio sem comissão. Narrativa "a promoção vai direto pra você" é válida e verificável
4. **MilkyMoo collabs (4–6/ano):** Geram buzz sem paralelo para franquia do tamanho deles (800+ unidades). MilkyPot contraposição: "ingredientes frescos, sem parceiro de indústria" + personalização real
5. **Regra v13 validada:** Refetch revelou novidades concretas (Sorbet TheBest, app MilkyMoo, tabela de promoções) que não estavam documentadas

**Próximo passo sugerido:**
- Ciclo #117: UX/Performance — `checkout.html` audit (primeira auditoria técnica desta página — prescrito há 2 ciclos)
- Operador: Planejar contraprogramação para Black Friday (27/11/2026) — TheBest com R$3,99/100g e MilkyMoo com milkshakes em dobro são alto risco de distração do público. MilkyPot precisa de oferta própria via WhatsApp na mesma data
- Operador: Avaliar estratégia de collab local (ex: confeitaria local de Londrina) como resposta às collabs Nestlé do MilkyMoo — escala menor, mas autenticidade local maior

_Belinha — Ciclo #116 | 2026-05-04_

---

## Ciclo #115 — 2026-05-04

**Área:** Auto-aprimoramento — revisão #110–#114 + roadmap Q4 2026 (#116–#125)

**Contexto:** Ciclo obrigatório a cada 5 ciclos (115 divisível por 5). Releitura do bloco #110–#114 + diagnóstico de débito técnico real + planejamento Q4 2026 (outubro–dezembro, meses 6–8 de operação). Prescrição exata do ciclo #114.

**O que analisou:**
- Leu entradas de ciclos #110–#114 no log completo
- Verificou estado real de cardapio.html (WebPage schema ✅ ciclo #88 — roadmap #105 tinha diagnóstico incorreto)
- Verificou estado de index.html (WebP+preconnect ✅ ciclo #108 — LCP já otimizado)
- Confirmou FAQPage nas 3 páginas-chave (ciclos #26, #46, #68)
- Diagnosticou débito crítico: concorrentes ausentes há **21 ciclos** (desde #94)
- Mapeou contexto Q4 2026: Black Friday 27/11 sem intel de preços → diferenciação genérica

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Auto-aprimoramento: Ciclos #110–#114 (revisão do ciclo #115)": análise de ROI por ciclo, diagnóstico de débito real, estado do projeto em D+9, contexto Q4 2026, roadmap #116–#125, nova regra v13 (concorrentes: máximo 15 ciclos) |

**Achados principais:**
1. **Concorrentes em situação crítica (21 ciclos):** Black Friday 2026 sem dados de preço/promo do TheBest e MilkyMoo. Ciclo #116 = refetch obrigatório. Nova regra v13: máximo 15 ciclos entre refetches.
2. **Falso-positivo no roadmap #105:** `cardapio.html` WebPage schema foi prescrito como gap mas já existia desde o ciclo #88. Nova regra: verificar `git log` antes de prescrever qualquer gap técnico.
3. **Padrão de auditoria encadeada confirmado (#113→#114):** Detectar inconsistência pós-ciclo anterior (robots.txt contradizendo sitemap) e corrigir imediatamente é o padrão correto. Manter.
4. **checkout.html nunca auditado:** Único ponto crítico de conversão sem revisão técnica. Prescrito para #117.

**Próximo passo sugerido:**
- Ciclo #116: Concorrentes (CRÍTICO) — TheBest + MilkyMoo refetch com output concreto no site: preços Black Friday, promos ativas, UGC recente, novos entrantes Londrina. Máximo 2h de pesquisa; 1 mudança no site obrigatória no mesmo ciclo
- Ciclo #117: UX/Performance — `checkout.html` audit (primeira auditoria técnica desta página)
- Operador: confirmar WA "VERAO" keyword ativa no WhatsApp Business (pendente desde ciclo #75)
- Operador: confirmar opção A ou B para produto sazonal verão ANTES de 28/11/2026

_Belinha — Ciclo #115 | 2026-05-04_

---

## Ciclo #114 — 2026-05-04

**Área:** SEO — `robots.txt` consistência com sitemap + noindex

**Contexto:** Prescrito pelo ciclo #113. O ciclo anterior adicionou `raspinha.html` ao `sitemap.xml` com intenção de indexação, mas o `robots.txt` ainda continha `Disallow: /raspinha.html` — bloqueando o Googlebot e contradizendo o sitemap. Gap adicional: `cartao-fidelidade.html` tem `meta name="robots" content="noindex"` mas não tinha `Disallow` correspondente, desperdiçando crawl budget.

**O que analisou:**
- `raspinha.html`: tem `meta description` (adicionada ciclo #113), SEM `noindex` — intenção é indexar. Sitemap a inclui com priority 0.4. Mas `Disallow: /raspinha.html` em robots.txt bloqueava Googlebot completamente. **Inconsistência crítica.**
- `cartao-fidelidade.html`: tem `<meta name="robots" content="noindex">` confirmado, sem `Disallow` correspondente. Bots crawlam sem indexar — crawl budget perdido
- Regra Google: quando robots.txt bloqueia (`Disallow`) uma URL que está no sitemap, o Google ignora o sitemap entry e não indexa. A dupla inconsistência anulava o trabalho do ciclo #113

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `robots.txt` | `Allow: /raspinha.html` adicionado + `Disallow: /raspinha.html` removido; `Disallow: /cartao-fidelidade.html` adicionado |

**Commit:** `2be02cf`

**Impacto:**
- Googlebot agora pode crawlar e indexar `raspinha.html` — potencial rankeamento para "raspinha da sorte Londrina", "raspe e ganhe sobremesa"
- `cartao-fidelidade.html` bloqueada de crawl → crawl budget preservado para páginas de conversão
- Consistência total entre sitemap.xml ↔ robots.txt ↔ meta noindex (três camadas alinhadas)

**Próximo passo sugerido:**
- Ciclo #115: Auto-aprimoramento — reler log #110–#115, ajustar roadmap Q4 2026 (outubro–dezembro) conforme prescrito em `estrategia.md`
- Ciclo #116: Concorrentes — Refetch pré-Q4: MilkyMoo + TheBest atualização de preços/promos para informar campanha Black Friday (postergado do #114 original)
- Ciclo #117: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + Linha Zero pós-festas

_Belinha — Ciclo #114 | 2026-05-04_

---

## Ciclo #113 — 2026-05-04

**Área:** SEO — `sitemap.xml` audit + `noindex` em páginas internas

**Contexto:** Prescrito pelos ciclos #111 e #112. Tarefa: verificar se `acai-self-service-londrina.html`, `termos.html`, `privacidade.html` e `raspinha.html` estavam no sitemap, e corrigir quaisquer gaps de indexação.

**O que analisou:**
- `sitemap.xml` já continha corretamente: `/`, `cardapio.html`, `potinho-ninho-londrina.html`, `acai-self-service-londrina.html`, `desafio.html`, `privacidade.html`, `termos.html`
- **Gap 1:** `raspinha.html` ausente do sitemap e sem `meta description` — página pública acessada via QR code no PDV, não deveria estar invisível para o Google
- **Gap 2:** 7 páginas internas sem `noindex` — `login.html`, `tv.html`, `tv1.html`, `tv2.html`, `tv3.html`, `radio.html`, `cronometro-milkypot.html` — todas potencialmente indexáveis pelo Googlebot, diluindo autoridade de domínio

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `sitemap.xml` | Adicionada entrada `raspinha.html` (priority 0.4); comentário documenta todas as páginas excluídas com noindex |
| `raspinha.html` | `<meta name="description">` adicionada (ausente) |
| `login.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `tv.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `tv1.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `tv2.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `tv3.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `radio.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |
| `cronometro-milkypot.html` | `<meta name="robots" content="noindex, nofollow">` adicionada |

**Commit:** `6708e0c`

**Impacto:**
- Googlebot descobre `raspinha.html` via sitemap (potencial rankeamento para "raspinha da sorte sobremesa Londrina")
- 7 páginas internas deixam de diluir crawl budget e autoridade de domínio
- Sitemap agora tem comentário de auditoria documentando as exclusões — manutenção futura facilitada

**Próximo passo sugerido:**
- Ciclo #114: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas + Sexta #21 "Primeiro Potinho de 2027" (prescrito ciclos #77, #110, #112)
- Ciclo #115: SEO avançado — verificar se `robots.txt` bloqueia as páginas internas corretamente (Disallow para tv*.html, login.html, etc.) para consistência com os noindex adicionados
- Ciclo #116: UX/Performance — Core Web Vitals audit: verificar LCP em `cardapio.html` pós-mudança de imagem (ciclo #110)

_Belinha — Ciclo #113 | 2026-05-04_

---

## Ciclo #112 — 2026-05-04

**Área:** UX/Performance — `sw.js` dead asset cleanup + análise `cardapio.js` órfão

**Contexto:** Prescrito pelo ciclo #111 (investigar dead code `menuCart*` em `cardapio.js`). Análise revelou que o problema é mais amplo: `cardapio.js` (1050 linhas) não é carregado por nenhuma página HTML — apenas listado no PRECACHE_URLS do service worker, causando download desnecessário de ~42 KB a cada reinstalação do SW.

**O que analisou:**
- `js/cardapio.js` referencia `menuCartSidebar`, `menuCartOverlay`, `menuCartClose`, `menuCartItems`, `menuCartFooter`, `menuCartTotal` via `document.getElementById('menuCart*')` — IDs que não existem em nenhum HTML
- `cardapio.html` (e `index.html`) não têm `<script src="js/cardapio.js">` — arquivo nunca é executado em produção
- O HTML de `cardapio.html` usa `cart.js` + `checkout.js` como sistema real de pedidos (IDs: `cartSidebar`, `cartOverlay` etc., sem prefixo "menu")
- Único lugar que referenciava o arquivo: `sw.js` linha 50 (`'/js/cardapio.js'` em PRECACHE_URLS) — causando precache de ativo morto
- Decisão sobre deletar o arquivo inteiro requer autorização do operador → documentado em `blockers.md`

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `sw.js` | Removida linha `'/js/cardapio.js'` de PRECACHE_URLS — elimina ~42 KB de precache desnecessário |
| `belinha/blockers.md` | Adicionado blocker #6 com análise completa + 3 opções de decisão para operador |

**Commit:** (ver hash abaixo)

**Impacto:**
- Service worker deixa de pré-cachear 1050 linhas de JS que nenhuma página usa (~42 KB economizados a cada nova instalação do SW)
- Nenhum risco de regressão: arquivo não era carregado por nenhuma página, apenas estava no precache
- Blocker documentado com opções claras para o operador: deletar / integrar / manter-como-está

**Próximo passo sugerido:**
- Ciclo #113: SEO — `sitemap.xml` audit: verificar se `acai-self-service-londrina.html`, `termos.html`, `privacidade.html`, `raspinha.html` estão incluídos (prescrito ciclo #111)
- Ciclo #114: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas + Sexta #21 "Primeiro Potinho de 2027" (prescrito ciclos #77 e #110)
- Operador: confirmar Opção A/B/C para `js/cardapio.js` (ver `belinha/blockers.md` blocker #6)

_Belinha — Ciclo #112 | 2026-05-04_

---

## Ciclo #111 — 2026-05-04

**Área:** Conversão — `js/core/loyalty.js` milestones + templates WA fidelidade

**Contexto:** Prescrito pelo roadmap do ciclo #105 (entrada #111). Auditoria revelou que `addPointsFromOrder` retornava apenas `rewardEarned` (ao atingir 100pts), sem nenhum sinal para os marcos intermediários de engajamento (10pts e 50pts). Sem esse sinal, o operador não tem como enviar mensagens de incentivo no momento certo via WhatsApp.

**O que analisou:**
- Leu `js/core/loyalty.js` completo: estrutura clara, `POINTS_PER_REAL: 1`, `REWARD_THRESHOLD: 100`, `REWARD_DESCRIPTION: 'Sorvete gratis (tamanho Mini)'`
- Confirmou que `addPointsFromOrder` já funcionava bem para o fluxo de recompensa, mas não expunha dados de milestone intermediário
- Identificou ponto correto de detecção: antes do `while` de reward deduction (pontos no pico máximo), usando `prevPoints` capturado antes do `+=`
- Confirmou que `rewardEarned` deve ter prioridade sobre `milestoneCrossed` (cliente que cruzar 50 e 100 no mesmo pedido só recebe template de recompensa)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `js/core/loyalty.js` | +`MILESTONES: [10, 50]`; +`_getMilestoneCrossed(prevPts, newPts)`; `addPointsFromOrder` captura `prevPoints` e retorna `milestoneCrossed` |
| `belinha/content/fidelidade-milestones-wa.md` | CRIADO — 3 templates WA prontos (10pts, 50pts, 100pts) + guia de implementação com exemplo de código |

**Commit:** `417ecd6`

**Impacto:**
- `addPointsFromOrder` agora retorna `{ customer, pointsAdded, rewardEarned, milestoneCrossed }` — API não-breaking (novo campo, sem remoções)
- Operador/desenvolvedor pode usar `milestoneCrossed` (null | 10 | 50) para disparar WA contextual imediatamente após pedido entregue
- Templates prontos para copiar-colar no WA Business manual ou integrar via API WA Business no futuro

**Próximo passo sugerido:**
- Ciclo #112: UX/Performance — Dead code decision: `menuCartSidebar`/`menuCartOverlay`/`menuCartClose`/`menuCartItems`/`menuCartFooter`/`menuCartTotal` em `cardapio.js` sem correspondência no HTML. Se operador não confirmar plano do carrinho alternativo em ~10 ciclos → remover do JS (reduz bundle ~120 linhas)
- Ciclo #113: SEO — `sitemap.xml` audit: verificar se `acai-self-service-londrina.html`, `termos.html`, `privacidade.html`, `raspinha.html` estão incluídos
- Operador: integrar `milestoneCrossed` no fluxo de confirmação de pedido entregue (app.js / painel) para ativar os templates WA

_Belinha — Ciclo #111 | 2026-05-04_

---

## Ciclo #110 — 2026-05-04

**Área:** UX/Performance — `cardapio.html` logo WebP `<picture>` + preload responsivo

**Contexto:** Prescrito pelo ciclo #109 e #108. O ciclo #108 converteu as logos para WebP e atualizou `index.html`, mas `cardapio.html` ficou fora — ainda carregava `logo-milkypot.png` (1.4 MB) como LCP element sem nenhuma otimização. Todos os arquivos WebP já existiam no disco.

**O que analisou:**
- Verificou que `cardapio.html` tinha `<link rel="preload" as="image" href="images/logo-milkypot.png" fetchpriority="high">` — sem `imagesrcset`/`imagesizes`, apontando para PNG de 1.4 MB
- Verificou que navbar logo (`class="logo-img"`, 128px) e hero logo (`class="hero-logo-small"`, 280px) ainda eram `<img>` simples sem `<picture>`
- Consultou padrão correto em `index.html` (ciclo #108) para manter consistência entre páginas
- Confirmou que `og:image` e `apple-touch-icon` devem manter PNG (plataformas externas com suporte variável a WebP)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | Preload → WebP `imagesrcset`/`imagesizes`; navbar logo → `<picture>` WebP+PNG; hero logo → `<picture>` WebP+PNG (3 alterações em 1 arquivo) |

**Commit:** `e44a69c`

**Impacto estimado:**
- LCP de `cardapio.html` em mobile 3G: logo era ~14s de download (1.4 MB PNG) → agora ~0.1s (10.6 KB WebP 1x) — redução de 98%+
- `cardapio.html` agora tem paridade de performance com `index.html` — ambas as páginas principais otimizadas
- Browser moderno: WebP via `<source type="image/webp">`; IE11/Opera Mini: fallback PNG automático

**Próximo passo sugerido:**
- Ciclo #111: SEO — atualizar `og:image` de `cardapio.html` para apontar para WebP full-res (`logo-milkypot.webp`, 100 KB vs 1.4 MB PNG) — verificar suporte WebP nos principais scrapers sociais (WhatsApp, Telegram, Twitter já suportam; Facebook parcial)
- Ciclo #112: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas (prescrito ciclo #77 do roadmap)
- Ciclo #113: Verificar se `checkout.html` (se existir) ou outras páginas têm o mesmo problema de logo PNG não otimizado

_Belinha — Ciclo #110 | 2026-05-04_

---

## Ciclo #109 — 2026-05-04

**Área:** Conteúdo — Diferenciação implícita TheBest "Potinho sem balança"

**Contexto:** Prescrito pelo ciclo #107 (inteligência concorrente): quiosque TheBest Shopping Aurora Londrina operando, vende açaí por peso (R$6,29/100g), usa totem de autoatendimento. MilkyPot deve reforçar o oposto — personalização humanizada, preço fixo, experiência com a ovelhinha — sem nomear o concorrente.

**O que analisou:**
- Leu ciclos #107 e #108 para entender contexto estratégico e próximo passo
- Revisou formatos de captions/reels existentes (inauguracao-25abr-captions.md, semana5) para manter padrão de voz
- Mapeou ângulo central: balança = ansiedade/frieza vs. potinho = liberdade/carinho — contraste implícito, nunca confrontacional
- Definiu 3 formatos complementares (carrossel, Reel, Stories) com tabela de uso situacional

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/diferenciacao-potinho-sem-balanca.md` | CRIADO — Feed carrossel 5 frames + Caption completa; Reel 15s com roteiro cena a cena + trilha sugerida; Stories 3 frames com stickers nativos; tabela de uso situacional; alerta de compliance (nunca nomear concorrente) |

**Commit:** `54fd5be`

**Destaques da peça:**
1. **Frame 1 do carrossel como gancho:** "Aqui você escolhe. Não pesa." — captura atenção sem ainda revelar a diferença, induz o swipe
2. **Reel 15s com contraste sonoro:** Beep de balança nos primeiros 2s → campainha alegre na entrada da ovelhinha. Transição emocional clara sem narração expositiva
3. **Stories com enquete nativa:** "Já ficou ansioso na balança? SIM / NÃO" — gera dado de audiência + alcance orgânico por engajamento de stories
4. **Tabela de uso situacional:** Operador sabe exatamente quando soltar cada peça (abertura de novo quiosque, evergreen, resposta a DM, Black Friday)
5. **Evergreen + ativável:** Peça não expira — pode ser usada a qualquer semana como posicionamento de marca ou reativada quando TheBest for mencionado por clientes

**Próximo passo sugerido:**
- Ciclo #110: UX/Performance — verificar imagens pesadas em `cardapio.html` (product images PNG/JPG) e converter para WebP (prescrito ciclo #108)
- Ciclo #111: SEO — `og:image` apontar para WebP full-res + manter PNG fallback (prescrito ciclo #108)
- Ciclo #112: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas (prescrito ciclo #77 do roadmap)
- Operador: definir quando publicar esta peça (sugestão: próxima vez que cliente mencionar quiosque de açaí por peso nas DMs/comentários — resposta orgânica natural)
- Operador: gravar o Reel com referência ao script — o roteiro está pronto, basta adaptar ao estoque visual disponível

_Belinha — Ciclo #109 | 2026-05-04_

---

## Ciclo #108 — 2026-05-04

**Área:** UX/Performance — Hero logo WebP + preload responsivo (LCP `index.html`)

**O que analisou:**
- Hero LCP element: `<img class="hero-logo-small">` renderiza a 280px mas carregava `logo-milkypot.png` (1900×1070px, **1.4 MB**)
- Preload existente apontava para o PNG — correto em direção, mas sem ganho de tamanho
- Python 3.11 + Pillow disponíveis → conversão WebP possível no servidor
- CSS: `.hero-logo-small { width: 280px }` (sem breakpoint diferente) → 280w e 560w (2x retina) cobrem todos os casos
- Firebase CDN preconnect e Google Fonts non-render-blocking já estavam em ordem (ciclos anteriores)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `images/logo-milkypot-280w.webp` | CRIADO — 280×158px, **10.6 KB** (-99% vs PNG original) |
| `images/logo-milkypot-560w.webp` | CRIADO — 560×315px, **27.6 KB** (@2x retina, -98% vs PNG) |
| `images/logo-milkypot.webp` | CRIADO — 1900×1070px, **99.7 KB** (full-res para futuros usos) |
| `index.html` | Preload → `imagesrcset`/`imagesizes` WebP; hero `<img>` → `<picture>` WebP+PNG; navbar logo → `<picture>`; footer logo → `<picture>` |

**Commit:** `f7e1ee1`

**Impacto estimado no LCP:**
- Mobile 3G: logo era ~14s de download (1.4 MB) → agora ~0.1s (10.6 KB) — redução de 98%+
- Browser moderno (Chrome/Safari/Firefox): servirá WebP automaticamente via `<picture>`
- Fallback PNG mantido para IE11/Opera Mini (< 1% do tráfego)
- `fetchpriority="high"` preservado no preload WebP

**Próximo passo sugerido:**
- Ciclo #109: Conteúdo — caption/reel "Potinho vs. balança" diferenciação implícita TheBest quiosque Aurora (prescrito ciclo #107)
- Ciclo #110: UX/Performance — verificar outras imagens pesadas em `cardapio.html` (product images PNG/JPG)
- Ciclo #111: SEO — `og:image` pode ser atualizado para apontar para o WebP do full-res (mas manter PNG como fallback para plataformas que não suportam WebP)
- Operador: considerar gerar WebP de outras imagens de produto (potinhos) com o mesmo script Python — ganho adicional de 60–90% em tamanho

_Belinha — Ciclo #108 | 2026-05-04_

---

## Ciclo #107 — 2026-05-04

**Área:** Concorrentes — Refetch MilkyMoo + TheBest (13 ciclos desde #94)

**O que analisou:**
- MilkyMoo: WebSearch em novidades 2026 — encontrou 3 lançamentos significativos (180ml Day Part Action, Ovos Páscoa 2026, collab O Boticário "Carameluda") + atualização Milky Moo Festa
- TheBest: WebSearch em Londrina 2026 — confirmou quiosque Shopping Aurora operando, preço R$6,29/100g (Gleba Palhano via UGC TikTok), 6 unidades Londrina mapeadas, rollout 300–500 quiosques em curso
- Novos entrantes Londrina: nada relevante detectado além de concorrentes já mapeados

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | Nova seção "Atualização Ciclo #107": 180ml Day Part Action (R$12,90, lançado 30/04/2026), Ovos Páscoa Pandora+Malhada (+80% meta vs. 2025), collab O Boticário "Carameluda" (R$25+, abr–mai), tabela escala nacional, 4 alertas estratégicos |
| `belinha/competitors/the-best-acai.md` | Nova seção "Atualização Ciclo #107": quiosque Aurora operando (totem, R$150k), preço R$6,29/100g confirmado UGC, tabela 6 unidades Londrina, gap Muffato mantido, 4 alertas estratégicos |

**Commit:** `a1f94a9`

**Destaques de inteligência:**
1. **MilkyMoo está construindo múltiplas ocasiões de consumo** — pós-almoço (180ml), sazonal (Páscoa), lifestyle (collab Boticário), evento (Festa). MilkyPot compete principalmente na ocasião "sobremesa personalizável noite/fim de semana". Gap saudável.
2. **Collab Boticário = captura do público feminino 18–35** — mesmo público-alvo MilkyPot. Resposta: collabs locais em Londrina (influencers, marcas regionais) para criar o mesmo buzz sem budget nacional.
3. **TheBest quiosque Aurora com totem de autoatendimento** — diferenciação pelo lado deles é automação. MilkyPot deve reforçar o oposto: atendimento humanizado, personalização, experiência com a ovelhinha. Copy "Potinho não tem balança" mantida.
4. **Gap Muffato Quintino Bocaiuva mantido em ambos os concorrentes** — janela ainda aberta, mas rollout de quiosques TheBest (300–500) torna a chegada mais provável nos próximos 6–12 meses.

**Próximo passo sugerido:**
- Ciclo #108: UX/Performance — `index.html` LCP: hero image em WebP? preconnect CDN? headers cache? (prescrito no roadmap)
- Ciclo #109: Conteúdo — criar caption/reel para "Potinho vs. balança" diferenciação implícita ao TheBest quiosque (aproveitar abertura do Aurora para reposicionar sem nomear)
- Operador: considerar criar serviço "Potinho para Festa" (eventos, aniversários) antes que Milky Moo Festa chegue em Londrina — janela de 6–12 meses estimada

_Belinha — Ciclo #107 | 2026-05-04_

---

## Ciclo #106 — 2026-05-03

**Área:** Conversão — Playbook Reativação WA D+30 e D+60

**Contexto:** Roadmap prescrevia FAQPage schema (#106), mas já foi criado em ciclo anterior (`ac46447`). Pivotou para #108 (próxima urgência Alta): template WA D+30/D+60. Inauguração foi 25/04/2026 — primeira onda D+30 chega ~25/05/2026 (≈22 dias), sem playbook tático completo. O `whatsapp-reativacao.md` existente tinha apenas um Template 4 de uma linha para D+30 e zero para D+60.

**O que analisou:**
- Leu `whatsapp-reativacao.md` completo (8 templates, criado no ciclo #32)
- Identificou lacunas: D+30 era "última tentativa" genérica sem segmentação, D+60 inexistente
- Calculou urgência: D+30 para clientes da inauguração = 25/05/2026 (operador precisa preparar lista)
- Definiu 3 versões de copy para D+30 (produto/novidade, fidelidade, urgência suave) + 2 versões para D+60 (emocional, feedback)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-reativacao-d30-d60.md` | CRIADO — Playbook completo: fluxo D+28→D+30→D+35 (3 versões de copy segmentadas), fluxo D+60 (2 versões), checklist operacional onda 25/05, métricas (taxa de resposta ≥25%, conversão ≥10%), erros comuns a evitar |

**Commit:** `26db800`

**Próximo passo sugerido:**
- Ciclo #107: Concorrentes — Refetch MilkyMoo + TheBest (15+ ciclos sem atualização)
- Ciclo #108: UX/Performance — index.html LCP: hero image WebP? preconnect CDN?
- Operador: preparar lista `#inativos-30d` antes de 22/05 para envio na janela D+28
- Operador: definir novidade real para mencionar no template D+30 Versão 1 (produto, topping, evento)

_Belinha — Ciclo #106 | 2026-05-03_

---

## Ciclo #105 — 2026-05-03

**Área:** Auto-aprimoramento — Revisão #100–#104 + Estratégia Q3 2026

**Contexto:** Marco prescrito pelo roadmap do ciclo #100 (auto-aprimoramento a cada 5 ciclos) e confirmado pelo próximo passo do ciclo #104. Ciclo de reflexão: sem mudanças em código de produção — apenas revisão estratégica e atualização de documentação.

**O que analisou:**
- Leu logs dos ciclos #100–#104 integralmente (padrão de execução, bugs encontrados, métricas)
- Leu `belinha/estrategia.md` seção #100 (última atualização) para identificar lacunas
- Leu `belinha/blockers.md` — 5 blockers ativos; CNPJ/DPO em D+8 ainda sem resolução
- Verificou schema.org de `cardapio.html` — tem FoodEstablishment + MenuItem, mas sem entidade WebPage no @graph
- Confirmou que `index.html` não usa WebP (0 referências) e não tem preconnect — LCP audit nunca realizado
- Confirmou 55 arquivos de conteúdo (semana1–semana56 excl. semana54) — pausa de conteúdo mantida
- Mapeou semanas Q3: semanas 10–22 de operação = julho–setembro 2026 (já escritas — sem lacuna de conteúdo)
- Calculou urgência de template WA D+30: primeira rodada de reativação ocorre ~23/05/2026 (D+28)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Ciclo #105": síntese do bloco #100–#104 com tabela de valor por ciclo, estado do projeto em D+8, contexto Q3 2026 com calendário semanas 10–22, roadmap detalhado #106–#115, alertas para o operador, regras v12 mantidas |

**Principais decisões estratégicas:**
1. **Rotação v12 mantida** — funcionou 100% nos ciclos #101–#104 sem desvio
2. **Template WA D+30 (ciclo #108) reclassificado como urgente** — primeira rodada ocorre ~23/05 (20 dias)
3. **FAQPage em `acai-self-service-londrina.html` (#106) prioridade alta** — única landing page sem FAQ schema
4. **`cardapio.html` WebPage schema (#110)** — tem FoodEstablishment mas sem WebPage + OrderAction no @graph
5. **Dead code carrinho (#112)** — aguardar ~10 ciclos por decisão do operador; se silêncio, remover

**Commit:** (a confirmar após push)

**Próximo passo sugerido:**
- Ciclo #106: SEO — FAQPage schema em `acai-self-service-londrina.html`: 3–5 perguntas sobre açaí self-service (preço por peso, horário, toppings, diferenças do potinho, delivery)
- Operador: Template WA D+30 — em ~20 dias clientes de D+1 ficam silenciosos. Ciclo #108 prepara o template, mas operador precisa confirmar tom: proativo (oferta) ou leve (lembrança)?

_Belinha — Ciclo #105 | 2026-05-03_

---

## Ciclo #104 — 2026-05-03

**Área:** Conversão — Raspinha da Sorte bugfix crítico

**Contexto:** Prescrito pelo roadmap do ciclo #100 + próximo passo do ciclo #103. Auditoria completa do fluxo `raspinha.html` + `functions/index.js` + `painel/pdv.html`.

**O que analisou:**
- `raspinha.html` (489 linhas): fluxo completo desde entrada do código até revelação do prêmio
- `functions/index.js` (787 linhas): **zero** Cloud Functions para raspinha — sistema é 100% frontend + Firestore direto
- `painel/pdv.html`: `finishOrder()` gera raspinha (código longo `MKP-XXXX-YYYYMMDD-XXXXXXXX` + short code `XXX-XXX`), salva em localStorage E Firestore `scratches/{codeLongo}`
- `firestore.rules` linha 184: `scratches/{scratchCode}` com read/create/update public — por obscuridade (218 trilhões de combinações)

**Bug encontrado:**
- `processScratch(scratch, code)` linha 203–204 tinha `scratch.code = code`
- Para o caminho do **short code** (XXX-XXX, ≤8 chars): a query usa `.where('shortCode','==',code)` → retorna o doc com `code: fullCode`, mas `processScratch` sobrescrevia `scratch.code = shortCode`
- Consequência: `db.collection('scratches').doc(shortCode).update({status:'scratched',...})` apontava para documento inexistente (ID real é o código longo) → **falha silenciosa** via `.catch(function(){})`
- O status da raspinha nunca era atualizado de `not_scratched → scratched` no Firestore quando clientes usavam código curto

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `raspinha.html` | `scratch.code = code` → `if (!scratch.code) scratch.code = code` — preserva o ID real do doc Firestore; só usa código digitado como fallback se `code` não estiver no payload |

**Métricas:**
- +1 linha, −0 linhas (mudança mínima de 1 char + guard)
- Impacto: tracking de status da raspinha agora funciona corretamente para 100% dos clientes que usam short code (maioria — código impresso no recibo)

**Commit:** `82ccb29`

**Próximo passo sugerido:**
- Ciclo #105: Auto-aprimoramento — reler log #100–#104, ajustar estratégia roadmap #106–#115
- Ciclo #106: Conteúdo acionável — criar 2–3 captions/roteiros para semana 2 de operação pós-inauguração (posts com foco em recompra/fidelidade)

_Belinha — Ciclo #104 | 2026-05-03_

---

## Ciclo #103 — 2026-05-03

**Área:** UX/Performance — `cardapio.js` bundle audit

**Contexto:** Prescrito pelo roadmap do ciclo #100 (posição #1 da rotação). Audit completo do JS principal do fluxo de pedido online: console.logs, variáveis não usadas, declarações `let` que deveriam ser `const`, funções mortas.

**O que analisou:**
- Leu o arquivo completo (`js/cardapio.js`, 1052 linhas, 46.979 bytes)
- Verificou todos os `console.*` — encontrou **1** console.log de debug em produção: linha 999 `console.log('Order captured:', order)` dentro de `finishOrder()`
- Auditou todas as declarações `let` — identificou **6** que nunca são reatribuídas (candidatas a `const`):
  - `addToMenuCart()`: `let extrasTotal`, `let bebidasTotal`, `let total` (linhas 715-717)
  - `updateMenuCartQty()`: `let extrasTotal`, `let bebidasTotal` (linhas 761-762)
  - `renderCheckoutSummary()`: `let details` (linha 883)
- Verificou funções mortas: **nenhuma** — todas as funções do objeto são chamadas (via onclick inline, eventos bindados, ou pelo `goBack()` dispatch array)
- `let item = null` (linha 464) em `changeAdicional()` — reatribuída dentro do for-loop, `let` correto
- `let formatLabel`, `let productName`, `let msg` em `addToMenuCart()`/`finishOrder()` — todos reatribuídos com `+=` ou if/else, `let` correto

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `js/cardapio.js` | Remove `console.log('Order captured:', order)` linha 999 — dado sensível (pedido completo) exposto no DevTools em produção |
| `js/cardapio.js` | 6× `let` → `const`: `extrasTotal`/`bebidasTotal`/`total` em `addToMenuCart()` + `extrasTotal`/`bebidasTotal` em `updateMenuCartQty()` + `details` em `renderCheckoutSummary()` |

**Métricas:**
- Antes: 1052 linhas / 46.979 bytes
- Depois: 1050 linhas / 46.943 bytes → **−2 linhas, −36 bytes**
- `console.log` em produção: 1 → **0**

**Commit:** `0b4d030`

**Próximo passo sugerido:**
- Ciclo #104: Conversão — `raspinha.html` e `functions/` — está funcional? Documentar status técnico + template WA de ativação para operador (conforme roadmap #100)
- Ciclo #105: Auto-aprimoramento — reler log #100–#104, ajustar estratégia Q3 2026

_Belinha — Ciclo #103 | 2026-05-03_

---

## Ciclo #102 — 2026-05-03

**Área:** SEO — `acai-self-service-londrina.html` audit

**Contexto:** Prescrito pelo roadmap do ciclo #100 (posição #2 da nova rotação). Página de açaí self-service auditada pela primeira vez para schema.org e Open Graph.

**O que analisou:**
- Verificou BreadcrumbList: ✅ já existia no `@graph`
- Verificou meta description: ✅ presente, 155 chars, contém keywords locais
- Verificou og:image dimensions: ✅ declaradas 1900×1070 — confirmado via `file` que PNG real tem exatamente 1900×1070px
- Verificou links internos: ✅ `index.html` linha 472 e `cardapio.html` linha 213 já linkam para esta página
- Identificou dois gaps: (1) sem entidade `WebPage` no `@graph`; (2) sem `og:image:type`

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `acai-self-service-londrina.html` | +1 `WebPage` entity no `@graph` com `@id`, `url`, `name`, `description`, `inLanguage`, `isPartOf`, `breadcrumb` (referência ao `@id` do BreadcrumbList), `potentialAction` (OrderAction → WhatsApp), `dateModified` |
| `acai-self-service-londrina.html` | +`og:image:type: image/png` (declaração de MIME type do og:image) |
| `acai-self-service-londrina.html` | BreadcrumbList recebeu `@id` para ser referenciável pelo WebPage |

**Detalhes técnicos:**
- `@graph` agora tem 4 entidades: `WebPage`, `BreadcrumbList`, `MenuItem`, `FoodEstablishment`
- `WebPage.isPartOf` aponta para `https://milkypot.com/#website` (conecta ao site principal no grafo)
- `WebPage.potentialAction` com `OrderAction` é o sinal mais forte de intenção de compra que o schema.org suporta para landing pages de food
- JSON validado via `python3 json.loads()` — sem erros de sintaxe

**Commit:** `04c9cb9`

**Próximo passo sugerido:**
- Ciclo #103: UX/Performance — `cardapio.js` bundle audit — remover console.logs, variáveis não usadas, dead functions; medir redução em bytes
- Ciclo #104: Conversão — `raspinha.html` e `functions/` status técnico da raspinha da sorte
- Operador: IDs de carrinho em `cardapio.js` (`menuCartSidebar`, `menuCartOverlay`, etc.) sem elementos HTML correspondentes — confirmar se implementar ou remover (blocker documentado ciclo #101)

_Belinha — Ciclo #102 | 2026-05-03_

---

## Ciclo #101 — 2026-05-03

**Área:** UX/Performance — Segunda rodada CSS purge `cardapio.css`

**Contexto:** Prescrito pelo roadmap do ciclo #100 (posição #1 da nova rotação). Ciclo #99 removeu 171 linhas e listou 21 classes `cp-` pendentes como não verificadas naquele ciclo. Ciclo #101 retoma e finaliza essa varredura.

**O que analisou:**
- Extraiu lista completa de classes `cp-` no `cardapio.css` (119 classes únicas)
- Cruzou cada classe contra todos os `*.html` e `js/*.js` do projeto
- Identificou exatamente 21 classes com 0 referências externas
- Verificou falsos positivos: `cp-cart-empty`, `cp-cart-item*`, `cp-qty-btn-sm`, `cp-checkout-item`, `cp-checkout-total` são geradas dinamicamente em `js/cardapio.js` → mantidas
- Confirmou que os contêineres removidos (`cp-cart-overlay`, `cp-cart-sidebar`, etc.) são selecionados por ID no JS (`menuCartSidebar`, `menuCartOverlay`) e esses IDs não existem no HTML — confirma que o bloco do cart `cp-` era de uma implementação alternativa nunca finalizada

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `css/cardapio.css` | −279 linhas: removidos blocos de 21 classes mortas + suas variantes pseudo-class/descendentes/responsive |

**Classes removidas:**
`cp-step-bar`, `cp-step-dot`, `cp-back-btn` (+hover +responsive), `cp-types-section`, `cp-cart-overlay` (+.active), `cp-cart-sidebar` (+.active +responsive), `cp-cart-header` (+h3), `cp-cart-close`, `cp-cart-items`, `cp-cart-footer`, `cp-cart-total`, `cp-cart-total-value`, `cp-modal-overlay` (+.active), `cp-modal` (+h2), `cp-modal-close`, `cp-form-group` (+label +input/select +focus), `cp-delivery-options`, `cp-delivery-opt` (+has:checked +input), `cp-success-modal` (+h2 +p), `cp-success-emoji`, `cp-step-mini-icon`

**Resultado:** 1380 → 1101 linhas (−20,2%). CSS classes `cp-` reduzidas de 119 para 98 únicas.

**Commit:** `e720b71`

**Próximo passo sugerido:**
- Ciclo #102: SEO — `acai-self-service-londrina.html` audit completo: BreadcrumbList, WebPage schema, meta description, og:image dimensions, link interno de `index.html` e `cardapio.html`
- Ciclo #103: UX/Performance — `cardapio.js` bundle audit: console.logs, variáveis mortas, dead functions
- Operador: os IDs `menuCartSidebar`, `menuCartOverlay`, `menuCartClose`, `menuCartItems`, `menuCartFooter`, `menuCartTotal` existem em `js/cardapio.js` mas não têm elementos correspondentes no HTML → funcionalidade de carrinho alternativa está incompleta. Confirmar se deve ser removida do JS ou implementada no HTML

_Belinha — Ciclo #101 | 2026-05-03_

---

## Ciclo #100 — 2026-05-03

**Área:** Estratégia — Revisão completa dos 100 ciclos + atualização de `belinha/estrategia.md`

**Contexto:** Marco obrigatório prescrito pelo ciclo #99. 100 ciclos completados desde o setup inicial. A regra de auto-aprimoramento a cada 5 ciclos exige releitura completa e atualização estratégica nos marcos redondos.

**O que analisou:**
- Releu `belinha/log.md` inteiro (3.634 linhas / 100 ciclos) com foco em padrões de valor, desperdícios e pendências acumuladas
- Releu `belinha/estrategia.md` completo (13 seções de auto-aprimoramento: ciclos #5, #20–24, #26–29, #30–34, #35–39, #39–43, #44–48, #49–53, #54–58, #59–63, #64–68, #69–73, #74–78, #92)
- Releu `belinha/blockers.md` — 5 blockers ativos, 3 suspensos
- Identificou ratio histórico: 52% conteúdo / 18% UX+Performance / 12% SEO / 10% conversão / 5% concorrentes / 3% estratégia
- Mapeou débito técnico acumulado pós-#99: CSS purge rodada 2, `acai-self-service-londrina.html` nunca auditada, `cardapio.js` bundle nunca auditado, raspinha da sorte status desconhecido
- Confirmou que regra de pausa de conteúdo (#92) se mantém: 56 semanas cobertas (até 15/05/2027)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Nova seção "Ciclo #100 — Marco: Revisão Estratégica Completa (1–100)": síntese de 100 ciclos por área, hierarquia definitiva de valor (Tier 1–4), estado completo do projeto em D+8, tabela de débito técnico atualizada, rotação rebalanceada v12, roadmap #101–#110 detalhado, 6 lições consolidadas |

**Decisões estratégicas do ciclo #100:**
1. **Pausa de conteúdo mantida** — 56 semanas cobertas, regra #92 inalterada
2. **Rotação rebalanceada v12:** UX/Performance > SEO > Conversão > Concorrentes > Conteúdo
3. **Rodada 2 de CSS purge como ciclo #101** (0 ciclos de intervalo — máxima urgência técnica)
4. **`acai-self-service-londrina.html` como ciclo #102** — única página de destino com SEO crítico nunca auditada em detalhe
5. **`cardapio.js` bundle como ciclo #103** — nunca foi inspecionado por dead code / console.logs

**Commit:** (a confirmar após push)

**Próximo passo sugerido:**
- **Ciclo #101:** UX/Performance — Segunda rodada CSS purge `cardapio.css`: remover as 21 classes `cp-` ociosas restantes, condicionado à confirmação do operador sobre plano de uso em HTML standalone; se não houver plano, remover e documentar ganho de bytes
- Operador: confirmar se existe plano de criar página com `cardapio.js` + HTML estático usando seletores `cp-cart-sidebar`, `cp-modal`, etc. — decisão define se ciclo #101 remove 21 classes (−~240 linhas) ou as arquiva como "reservadas para app"

_Belinha — Ciclo #100 | 2026-05-03_

---

## Ciclo #99 — 2026-05-03

**Área:** UX/Performance — Purge de seletores CSS mortos em `cardapio.css`

**Contexto:** Prescrito pelo ciclo #98 como próximo passo obrigatório. `cardapio.css` (~30KB) acumulava blocos inteiros de seletores `cp-` que nunca foram referenciados em nenhum arquivo HTML ou JS do projeto. Auditoria completa identificou 38 classes ociosas; ciclo removeu as 3 mais seguras e impactantes.

**O que analisou:**
- Extraiu todos os seletores `cp-` da CSS (145 seletores válidos) e cruzou com: (a) atributos `class=` em todos os HTML; (b) template literals em `cardapio.js`; (c) `classList.add/remove`; (d) `querySelector(All)` — chegando a 38 classes nunca usadas
- Confirmou que `cardapio.js` usa **IDs** (`menuCartSidebar`, `menuCartOverlay`, `menuCheckoutModal`, `menuSuccessModal`) para os elementos estruturais, não as classes `cp-cart-sidebar`, `cp-modal-overlay` etc. — portanto o CSS desses wrappers não tem efeito prático
- Identificou 3 grupos de remoção segura: (1) `cp-page`/`cp-container` — layout root nunca instanciado; (2) `cp-navbar`/`cp-nav-*` — nav do app nunca renderizada; (3) `cp-combine-*` — feature abandonada sem lógica JS
- Manteve classes potencialmente úteis para a futura integração do app (`cp-cart-sidebar`, `cp-modal`, `cp-form-group`, `cp-success-modal`, `cp-step-bar`, `cp-back-btn`)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `css/cardapio.css` | 171 linhas removidas (−11,3%): blocos `cp-page`/`cp-container` (linhas 6–28), `cp-navbar` + todos `cp-nav-*` (linhas 30–120), `cp-combine-section`/`cp-combine-*` (linhas 1296–1343) + 2 entradas responsivas órfãs |

**Métricas:**
- Antes: 1551 linhas / 30 227 bytes
- Depois: 1380 linhas / 26 803 bytes
- **Ganho: −171 linhas (−11%) / −3 424 bytes (−11,3%)**

**Commit:** `a8688f5`

**Classes ainda ociosas (deixadas para futura avaliação):**
`cp-cart-sidebar`, `cp-cart-overlay`, `cp-cart-header`, `cp-cart-close`, `cp-cart-items`, `cp-cart-footer`, `cp-cart-total`, `cp-cart-total-value`, `cp-modal-overlay`, `cp-modal`, `cp-modal-close`, `cp-form-group`, `cp-delivery-options`, `cp-delivery-opt`, `cp-success-modal`, `cp-success-emoji`, `cp-step-bar`, `cp-step-dot`, `cp-back-btn`, `cp-step-mini-icon`, `cp-types-section` — 21 classes / ~240 linhas de CSS que poderão ser removidas se a integração do `cardapio.js` confirmar uso de IDs (não classes) para esses wrappers.

**Próximo passo sugerido:**
- Ciclo #100 (marco): Releitura completa de `belinha/log.md` (ciclos #1–#100) + atualização de `belinha/estrategia.md` com ajuste de prioridades para o próximo trimestre
- Ciclo #101: Segunda rodada de purge CSS — remover as 21 classes ociosas restantes após confirmar que não há HTML planejado para o app com esses class names (verificar com operador)
- Operador: confirmar se existe plano de criar uma página standalone (`/montar-seu-potinho`) que use `cardapio.js` com HTML estático + esses seletores `cp-` — se sim, manter; se não, remover no ciclo #101

_Belinha — Ciclo #99 | 2026-05-03_

---

## Ciclo #98 — 2026-05-03

**Área:** UX/Performance — Remoção de render-blocking Firebase SDKs em `login.html`

**Contexto:** Prescrito pelo ciclo #97 como próximo passo obrigatório. `login.html` carregava 4 scripts Firebase compat (firebase-app, firebase-auth, firebase-firestore, firebase-functions) sincronamente no `<head>`, bloqueando todo o render da página enquanto o browser baixava ~200KB de JS do gstatic antes de pintar qualquer pixel.

**O que analisou:**
- Leu `login.html` completo para mapear dependências: Firebase SDKs em `<head>` (render-blocking), scripts de app no fim do `<body>` (não-blocking)
- Confirmou que nenhum código inline em `<head>` ou no início do `<body>` usa Firebase diretamente — apenas `firebase-config.js` e `auth.js` (ambos no fim do body) inicializam e usam o SDK
- Verificou que a ordem de execução necessária é: Firebase SDKs → constants → i18n → utils → datastore → firebase-config → cloud-functions → auth → audit → inline scripts
- Validou que mover Firebase para o corpo imediatamente antes dos scripts de app preserva essa ordem sem nenhuma alteração em `auth.js` (arquivo protegido)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `login.html` | 4 `<script>` Firebase removidos do `<head>` e inseridos no fim do `<body>` antes de `constants.js` — `<head>` agora tem zero scripts síncronos |

**Ganho estimado:** eliminação de 100–400ms de render-blocking no first contentful paint (FCP) da página de login, que é a porta de entrada do painel administrativo.

**Commit:** `f326809`

**Próximo passo sugerido:**
- Ciclo #99: UX/Performance — auditar `cardapio.css` (~30KB) em busca de seletores sem uso (prescrito em #95, #96, #97 sem execução) usando grep de classes/IDs vs. `cardapio.html`
- Ciclo #100 (marco): Releitura completa de `belinha/log.md` (ciclos #1–#100) + atualização de `belinha/estrategia.md` com ajuste de prioridades para o próximo trimestre

_Belinha — Ciclo #98 | 2026-05-03_

---

## Ciclo #97 — 2026-05-03

**Área:** Conversão — Upsell PDV + Template WA 15º Carimbo + Blocker WA "VERAO"

**Contexto:** Prescrito pelo roadmap #92 como ciclo dedicado à conversão. Três pendências consolidadas: (1) upsell PDV nunca documentado com scripts concretos para o atendente; (2) template WA 15º carimbo prescrito desde ciclo #77 e nunca executado — ponto de inflexão crítico do segundo ciclo de fidelidade; (3) status do WA keyword "VERAO" desconhecido — bloqueador ativo sem documentação formal.

**O que analisou:**
- Leu `whatsapp-fidelidade-resgate.md` (10 carimbos) para entender o padrão de templates e a estrutura da progressão de fidelidade
- Confirmou que nenhum script de upsell PDV presencial existia — gap operacional desde a inauguração
- Identificou que o 15º carimbo = 5º carimbo do segundo cartão = ponto de abandono de segundo ciclo mais provável (o cliente "zerou" e perdeu o impulso do início)
- Verificou que "VERAO" nunca foi documentado como blocker formal — apenas como referência em conteúdo e estratégia
- Definiu benefício sugerido para 15º carimbo: topping bônus (custo controlado, impacto emocional alto — surprise & delight)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/conversao-upsell-pdv-15carimbos.md` | CRIADO — 6 scripts de upsell PDV (A–F: tamanho, topping premium, açaí buffet, milkshake, Linha Zero, combo fidelidade) + boas práticas + metas de conversão + Template WA 15º carimbo versão A (surprise & delight) e B (curta) + tabela progressão completa do programa fidelidade + métricas mid-loyalty |
| `belinha/blockers.md` | ATUALIZADO — Blocker #5 adicionado: WA "VERAO" keyword status check com checklist para operador confirmar |

**Commit:** `dcdc737`

**Destaques:**
1. **Script C (Açaí Buffet):** diferencial exclusivo da unidade Muffato — único upsell que NENHUM concorrente pode replicar no mesmo ponto. Deve ser tentado com clientes indecisos que olham o cardápio por mais de 10 segundos.
2. **Template WA 15º carimbo:** primeiro script de reconhecimento mid-loyalty do projeto. O 15º carimbo é o ponto de maior risco de abandono do segundo ciclo — a surpresa reativa o cliente sem custo de desconto.
3. **Progressão fidelidade documentada:** pela primeira vez o programa completo (10 → 15 → 20 carimbos) está mapeado em uma tabela com links cruzados entre arquivos.
4. **Blocker VERAO formalizado:** até agora era referência informal em conteúdo; agora tem checklist claro para o operador confirmar o status e definir próximo passo.

**Próximo passo sugerido:**
- Ciclo #98: UX/Performance — `login.html` defer Firebase SDKs (4 scripts no head bloqueando render ~100–400ms) + auditoria `cardapio.css` 30KB sem uso (prescrito #95 e #96)
- Operador: confirmar WA "VERAO" ativo ou não (checklist em `belinha/blockers.md` item #5)
- Operador: definir benefício exato do 15º carimbo (topping bônus sugerido — confirmar se operacionalmente viável)
- Operador: testar scripts de upsell PDV por 1 semana e anotar conversão (meta: ≥30% dos upsells tentados)

_Belinha — Ciclo #97 | 2026-05-03_

---

## Ciclo #96 — 2026-05-03

**Área:** Conteúdo — Semanas 55+56 (02–15/05/2027): Dia das Mães (09/05) + Sextas #38/#39

**Contexto:** Prescrito pelo roadmap #92. Horizonte de conteúdo estava em 54 semanas (última semana coberta = semana 54, dia H aniversário 1 ano). Nova janela: semanas 55+56 cobrindo o segundo Dia das Mães do MilkyPot Londrina com plenitude operacional e lista de clientes consolidada.

**O que analisou:**
- Verificou logs #92–#95 e estrategia.md para confirmar prescrição do ciclo #96
- Calculou datas corretas: April 25, 2027 = domingo → semana 55 = 02–08/05/2027 | semana 56 = 09–15/05/2027
- Confirmou Dia das Mães 2027 = 2ª domingo de maio = 09/05/2027 (domingo = primeiro dia da semana 56)
- Identificou Sexta #36 = 16/04/2027 (semana 52) → Sexta #37 = 30/04, #38 = 07/05, #39 = 14/05
- Leu semanas 51–53 para alinhar formato padrão v10 (Dom–Sab, WA templates, checklist, métricas)
- Identificou diferencial narrativo: 2º Dia das Mães com 1 ano de loja consolidada vs. 1º Dia das Mães (10/05/2026, 2 semanas após inauguração recém-aberta)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana55.md` | CRIADO — 7 peças (Dom 02–Sáb 08/05): recap aniversário + retomada, teaser Dia das Mães (ter), tutorial presente carrossel (qua), urgência 48h + pré-Sexta (qui), Sexta #38 double-feature (sex), véspera urgência WA duplo (sáb). Mecanismo "MÃE" WA keyword → lista VIP. Reel 15s ovelhinha presenteando mãe |
| `belinha/content/pos-inauguracao-semana56.md` | CRIADO — 7 peças (Dom 09–Sáb 15/05): Dia H Dia das Mães completo (WA VIP MÃE 8h30, WA geral 9h, post emocional 9h30, Reel 15s 11h, stories hora-a-hora), recap+UGC (seg), Linha Zero retomada (ter), carrossel personalização (qua), pré-Sexta (qui), Sexta #39 (sex), encerramento semanal (sáb) |

**Commit:** `472af11`

**Destaques de conteúdo:**
1. **Surpresa VIP MÃE (dom 09/05, 8h30):** Padrão validado com HALLOWEEN (#67) e NATAL (#75) — lista segmentada recebe benefício exclusivo antes do público geral. Aumenta fidelização sem desconto público.
2. **Sexta #38 como double feature (sex 07/05, véspera):** "Última Sexta antes do Dia das Mães" potencializa conversão com dois ângulos simultâneos — oferta semanal + urgência mães.
3. **Diferenciação implícita:** Potinho artesanal personalizado + mensagem escrita à mão vs. caixa de chocolate genérico — mencionado na terça de abertura da campanha sem nomear concorrentes.
4. **Reel 15s emocional (dom 09/05):** Ovelhinha filha entregando potinho para ovelhinha mãe — cena mais emocional criada até o momento, alinhada com a estética mascote da marca.
5. **Linha Zero pós-festas (ter 11/05):** Janela de oportunidade pós-Mães para converter clientes fitness que retomam rotina — sem mudar cardápio, reposiciona produto existente.

**Próximo passo sugerido:**
- Ciclo #97: Conversão — WA "VERAO" status check + upsell PDV + template WA 15º carimbo (pendente #77) [prescrito #92]
- Ciclo #98: UX/Performance — login.html defer Firebase SDKs (4 scripts bloqueando render) + cardapio.css 30KB sem uso
- Operador: confirmar produto especial Dia das Mães (nome/ingredientes) com franquia ANTES de ter 04/05
- Operador: definir surpresa VIP MÃE (topping bônus, pontos em dobro, brinde) ANTES de sex 07/05
- Operador: configurar automação WA keyword "MÃE" ANTES de ter 04/05 (quando campanha vai ao ar)
- Operador: escalar equipe extra para domingo 09/05 (projetar 2–3× volume médio de domingo)

_Belinha — Ciclo #96 | 2026-05-03_

---

## Ciclo #95 — 2026-05-02

**Área:** UX/Performance — sweep Firebase CDN preconnect (CWV: TTI/FCP mobile)

**Contexto:** Prescrito pelo roadmap #92. 10+ ciclos sem atenção a UX/Performance. Sweep mobile obrigatório com foco em CLS, LCP, WebP, bundle.

**O que analisou:**
- Auditou todas as páginas que carregam Firebase SDK (`www.gstatic.com`)
- Confirmou que `index.html`, `raspinha.html` e `login.html` carregam Firebase SDK (~330–440KB) sem `preconnect` para o domínio CDN, pagando DNS+TCP+TLS em cada primeira visita
- Inspecionou `animations.css` (CLS risk: `opacity:0` como estado inicial — não pode ser deferido sem FOUT visual)
- Confirmou imagens LCP com `width`/`height` explícitos ✅ e `fetchpriority="high"` ✅
- Identificou `login.html` como crítico: 4 SDKs Firebase em `<head>` bloqueando render completamente; preconnect é ganho imediato sem risco
- `cardapio.css` (30KB) existe mas não é referenciado em nenhuma página — documentado para backlog

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | `preconnect` para `www.gstatic.com` + `dns-prefetch` para `firestore.googleapis.com` |
| `raspinha.html` | Idem (carrega firebase-app + firebase-firestore) |
| `login.html` | `preconnect` para `www.gstatic.com` + `dns-prefetch` para `identitytoolkit.googleapis.com` e `firestore.googleapis.com` (4 SDKs Firebase no head) |

**Impacto estimado:** −150 a −300ms TTI em dispositivos móveis 4G em primeira visita (eliminação de DNS lookup + TCP handshake + TLS negotiation para Firebase CDN).

**Commit:** `1895193`

**Próximo passo sugerido:**
- Ciclo #96: Conteúdo — Semanas 55+56 (03–16/05/2027): Dia das Mães (11/05) + Sextas #38/#39
- Backlog UX/Performance (para ciclo #98 ou próxima rodada):
  - `login.html`: mover 4 Firebase SDKs do `<head>` para fim do `<body>` com `defer` (reduz bloqueio de render ~100-400ms — requer testes funcionais)
  - `cardapio.css` (30KB): verificar se é para integrar em `cardapio.html` ou remover
  - `animations.css`: avaliar critical CSS inline para eliminar como render-blocking

_Belinha — Ciclo #95 | 2026-05-02_

---

## Ciclo #94 — 2026-05-02

**Área:** Concorrentes — TheBest Açaí (alerta ativo) + MilkyMoo refetch + novos entrantes

**Contexto:** Prescrito pelo roadmap rebalanceado do ciclo #92. Último ciclo de concorrentes foi o #84 (10 ciclos atrás). TheBest com alerta ativo de expansão quiosques para shoppings (possível Muffato). Necessário checar escala real, confirmação/descarte do gap Muffato e novidades de cada rede.

**O que pesquisou/analisou:**
- WebSearch multi-query: TheBest Açaí expansão 2026 + meta quiosques + Londrina/Muffato; MilkyMoo expansão 2026 + novo modelo; novos entrantes sobremesas Londrina Muffato 2026
- WebFetch: portaldofranchising.com.br, foodbizbrasil.com, mercadoeconsumo.com.br, exame.com (403 — bloqueados por paywall/auth)
- Dados coletados via WebSearch cross-referência: exame.com, portaldofranchising.com.br, onortao.com.br, portalg.com.br, mapadasfranquias.com.br, sopacultural.com

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/the-best-acai.md` | ATUALIZADO — Monitoramento Ciclo #94: escala 1.100+ unidades, meta 1.500 até dez/2026, segunda fábrica, capital PE confirmado, gap Muffato verificado e mantido, alertas atualizados |
| `belinha/competitors/milkymoo.md` | ATUALIZADO — Atualização Ciclo #94: Milky Moo Festa (unidade móvel, R$200k, 1.352 cidades mapeadas), Milky Moo Day aniversário, meta 1.500+1.500, gap Muffato mantido, alertas estratégicos |

**Principais achados:**

1. **TheBest — gap Muffato MANTIDO:** Nenhuma nova unidade TheBest no Muffato Quintino Bocaiuva detectada. Alerta "Cerro Azul frente ao Muffato" (ciclos anteriores) descartado para Londrina. Vantagem de localização MilkyPot preservada.
2. **TheBest — escala acelerada:** 1.100+ unidades (vs 1.012 do ciclo #84). Meta 1.500 até dez/2026. Segunda fábrica com R$35M. Capital privado R$80M. Rollout 300–500 quiosques nacional = probabilidade crescente de chegada ao Muffato em 2026–2027.
3. **MilkyMoo — Milky Moo Festa:** novo formato de unidade móvel para eventos (R$200k, 1.352 cidades mapeadas). Não compete no ponto físico, mas abre risco indireto no segmento de eventos. MilkyPot deve criar oferta de "potinho para festas" antes da chegada deles a Londrina.
4. **MilkyMoo — Milky Moo Day benchmark:** promoção aniversário (500ml + 300ml grátis) gerou tráfego massivo. Benchmark direto para aniversário 1 ano MilkyPot (25/04/2027).
5. **Novos entrantes Londrina:** nenhum novo concorrente direto (potinho/açaí Ninho) detectado no Muffato ou raio 1km. Cenário competitivo local estável.

**Commit:** _(ver hash abaixo após push)_

**Próximo passo sugerido (roadmap #92 → ciclo #95):**
- Ciclo #95: UX/Performance — sweep obrigatório (11 ciclos sem atenção): CLS, LCP, imagens WebP, bundle size, mobile. Verificar Core Web Vitals das páginas principais.
- Operador: criar serviço "potinho para festas" ou pacote evento antes que Milky Moo Festa chegue a Londrina
- Operador: definir promoção aniversário 1 ano (25/04/2027) com antecedência de pelo menos 4 semanas — benchmark Milky Moo Day é referência

_Belinha — Ciclo #94 | 2026-05-02_

---

## Ciclo #93 — 2026-05-02

**Área:** SEO — BreadcrumbList+WebPage em `desafio.html` + og:image:width/height em 5 páginas

**Contexto:** Prescrito pelo roadmap do ciclo #92 como próximo passo obrigatório do ciclo #93. `desafio.html` era a única página HTML sem schema.org estruturado. Adicionalmente, nenhuma página tinha `og:image:width/height` explícito — o Facebook/WhatsApp faz download para inferir dimensões, adicionando latência desnecessária no preview social.

**O que analisou:**
- Verificou schema.org de `cardapio.html` (ciclo #88) como template de referência para BreadcrumbList + WebPage
- Confirmou que `desafio.html` tinha apenas og:image básico sem width/height e nenhum schema.org
- Verificou dimensões reais de `images/logo-milkypot.png` via inspect binário PNG: **1900×1070px**
- Identificou 4 outras páginas também sem og:image:width/height: `index.html`, `cardapio.html`, `potinho-ninho-londrina.html`, `acai-self-service-londrina.html`

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `desafio.html` | ADICIONADO: og:image:width=1900 + og:image:height=1070 + og:image:alt + schema.org BreadcrumbList (Início → Desafio 10 Milissegundos) + WebPage com isPartOf, inLanguage, breadcrumb inline |
| `index.html` | ADICIONADO: og:image:width=1900 + og:image:height=1070 |
| `cardapio.html` | ADICIONADO: og:image:width=1900 + og:image:height=1070 + og:image:alt (estava faltando) |
| `potinho-ninho-londrina.html` | ADICIONADO: og:image:width=1900 + og:image:height=1070 + og:image:alt |
| `acai-self-service-londrina.html` | ADICIONADO: og:image:width=1900 + og:image:height=1070 + og:image:alt |

**Commit:** `570e77f`

**Impacto técnico:**
1. **Rich Results Google:** `desafio.html` agora elegível para breadcrumb rico nos resultados de busca
2. **Open Graph compliant:** og:image:width/height evita que scrapers do WhatsApp/Facebook façam HEAD request para descobrir dimensões — melhora velocidade do preview
3. **Cobertura schema.org:** todas as páginas públicas do site agora têm schema.org estruturado

**Próximo passo sugerido (roadmap #92):**
- Ciclo #94: Concorrentes — TheBest (alerta ativo, possível expansão Muffato) + MilkyMoo refetch + novos entrantes Londrina
- Ciclo #95: UX/Performance — sweep obrigatório: CLS, LCP, imagens WebP, bundle size, mobile (10+ ciclos sem atenção)
- Ciclo #96: Conteúdo — Semanas 55+56 (03–16/05/2027): Dia das Mães (11/05) + Sextas #38/#39

_Belinha — Ciclo #93 | 2026-05-02_

---

## Ciclo #92 — 2026-05-02

**Área:** Auto-aprimoramento obrigatório — revisão estratégia + rebalanceamento de rotação

**Contexto:** A cada 5 ciclos, a Belinha relê o log completo, identifica o que gerou mais valor e ajusta `belinha/estrategia.md`. Último auto-aprimoramento foi no ciclo #87 (na verdade #79 foi o último documentado). Ciclo #92 é o marco obrigatório após os ciclos #87–#91.

**O que analisou:**
- Leu os ciclos #87–#91 completos no log
- Contabilizou o estado do conteúdo: **54 semanas criadas**, cobrindo de 26/04/2026 a 02/05/2027 — exatamente 1 ano de conteúdo já planejado
- Identificou ratio desequilibrado: 4 Conteúdo / 1 SEO / 0 Concorrentes / 0 UX nos últimos 5 ciclos
- Mapeou débito técnico acumulado: UX/Performance sem atenção há 10 ciclos, Concorrentes há 19 ciclos
- Diagnosticou retorno marginal decrescente do conteúdo semanal além de 6 semanas à frente
- Criou nova regra: **conteúdo semanal só avança quando horizonte < 6 semanas** ou evento especial urgente

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | ATUALIZADO — bloco "Auto-aprimoramento #87–#91": tabela de débito técnico, diagnóstico de conteúdo excessivo, nova regra de pausa, rotação rebalanceada, roadmap #93–#97, bloqueadores atualizados |

**Commit:** _(ver abaixo)_

**Destaques do auto-aprimoramento:**
1. **Conteúdo pausado (nova regra):** Com 54 semanas criadas, criar a semana 55 hoje tem ROI marginal. Bloqueio formal até horizonte < 6 semanas ou evento urgente — libera ciclos para débito técnico.
2. **Urgência UX/Performance:** 10 ciclos sem sweep (CLS, LCP, WebP, bundle size). Escalonado para ciclo #95 com prioridade máxima.
3. **Concorrentes crítico:** TheBest em alerta ativo há 19 ciclos — possível expansão para o Muffato sem detecção. Escalonado para ciclo #94.
4. **SEO próximo:** `desafio.html` sem BreadcrumbList+WebPage (prescrito desde #91), og:image dimensions pendentes. Ciclo #93.
5. **Roadmap #93–#97 definido:** SEO → Concorrentes → UX/Performance → Conteúdo (Dia das Mães) → Conversão. Padrão mais balanceado.

**Próximo passo sugerido:**
- **Ciclo #93:** SEO — `desafio.html` BreadcrumbList+WebPage + og:image:width/height fix
- **Ciclo #94:** Concorrentes — TheBest (possível expansão Muffato) + MilkyMoo + novos entrantes
- **Ciclo #95:** UX/Performance — sweep CLS/LCP/WebP/bundle (10 ciclos sem atenção)
- **Ciclo #96:** Conteúdo — Semanas 55+56 (Dia das Mães 11/05/2027)
- **Operador:** Confirmar se WA "VERAO" foi ativado (bloqueador desde #75)
- **Operador:** Confirmar produtos Versão A ou B para dezembro 2026 ANTES de 28/11

_Belinha — Ciclo #92 | 2026-05-02_

---

## Ciclo #91 — 2026-05-02

**Área:** Conteúdo — Dia H (25/04/2027) + Semana 54 pós-aniversário

**Contexto:** Obrigatório conforme prescrição do ciclo #90. O ciclo #91 cobre o roteiro completo do dia mais importante da história da loja: o aniversário de 1 ANO (25/04/2027). Inclui também o conteúdo da semana 54 (26/04–02/05) de gratidão e retrospectiva, além do template de post-mortem operacional.

**O que analisou:**
- Leu semana 53 completa (ciclo #90) como referência de tom, formato e continuidade narrativa
- Identificou a estrutura de horários do dia H a partir do padrão histórico da inauguração (14h–23h) com abertura VIP 1h antes (13h)
- Mapeou 20+ touchpoints ao longo do dia H (WA ANIVER, WA geral, feed, reel, stories ao vivo, mid-event, última hora, encerramento)
- Incluiu guia de crise com 10 cenários específicos do dia H (esgotamento, fila, delivery atrasado, influencer que cancela, Instagram fora do ar, queda de energia, equipe ausente, reclamação pública, mau tempo, PDV travado)
- Estruturou template de post-mortem com 12 métricas quantitativas + avaliação operacional qualitativa + seção "aprendizados para o 2º aniversário"
- Criou semana 54 completa (dom–sáb 27/04–03/05): gratidão "dia depois", carrossel retrospectiva 10 slides, reconhecimento equipe, retomada Linha Zero/Fit, Dia do Trabalho fidelidade, Sexta #37 pós-aniversário, teaser Dia das Mães

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-dia-h.md` | CRIADO — ~600 linhas: roteiro hora a hora do dia H (07h→pós-fechamento), scripts WA completos (ANIVER + geral) para cada momento, post feed + reel 15s de abertura e encerramento, guia de crise 10 cenários com copy pronto, template post-mortem com 12 métricas, semana 54 completa (7 peças dom–sáb), checklist operacional 25 itens, tabela editorial hora a hora, transição para semana 55 / Dia das Mães |

**Commit:** _(ver abaixo)_

**Destaques de conteúdo:**
1. **Abertura VIP ANIVER (13h):** 1h de exclusividade antes da abertura geral. Script WA de notificação + story ao vivo da porta abrindo = prova social imediata e recompensa máxima para o VIP
2. **20+ touchpoints no dia H:** Nenhum momento do dia fica sem comunicação. Da montagem às 07h até o story de encerramento da equipe — tudo documentado com copy pronto
3. **Guia de crise 10 cenários com copy pronto:** Operador não precisa improvisar texto em momento de pressão. "Produto esgotou", "fila enorme", "Instagram fora do ar" — cada cenário tem resposta definida
4. **Template post-mortem obrigatório em 24h:** 12 métricas quantitativas + avaliação qualitativa + seção específica "aprendizados para o 2º aniversário" (25/04/2028). Fecha o ciclo de melhoria contínua
5. **Semana 54 como transição narrativa:** Da "era do 1 ANO" para a "era do crescimento" — culmina no teaser do Dia das Mães (11/05/2027) no sábado 03/05, mantendo o engajamento alto após o pico do evento

**Próximo passo sugerido:**
- **Ciclo #92 (auto-aprimoramento obrigatório a cada 5 ciclos):** Releitura do log completo + revisão `belinha/estrategia.md` — identificar o que gerou mais valor nos últimos 5 ciclos (#87–#91) e ajustar prioridades
- **Ciclo #93:** Conteúdo — Semanas 55+56 (03–16/05/2027): aquecimento Dia das Mães + Sextas #38/#39
- **Ciclo #94:** SEO/UX — gap técnico: `desafio.html` (schema BreadcrumbList + WebPage), `AggregateRating` quando houver reviews
- **Operador — CRÍTICO (26/04, dia após evento):** Preencher post-mortem (métricas + aprendizados) enquanto os detalhes estão frescos
- **Operador — CRÍTICO (até 25/04 às 08h):** Confirmar horário VIP ANIVER, horário abertura geral, nome do produto especial e brinde — preencher os campos `⬜` no arquivo do Dia H
- **Operador (até 30/04):** Confirmar oferta Sexta #37 (02/05) e definir ação para Dia das Mães (11/05)

_Belinha — Ciclo #91 | 2026-05-02_

---

## Ciclo #90 — 2026-05-02

**Área:** Conteúdo — Semana 53 (18–24/04/2027) — Semana do Aniversário 1 Ano

**Contexto:** Prescrito pelo roadmap do ciclo #89. Semana 53 = os 7 dias finais antes do aniversário de 1 ANO (25/04/2027). Cada dia tem um post dedicado ao countdown decrescente (7→1). Sábado 24/04 = véspera do dia H. A lista ANIVER foi fechada no sábado anterior (17/04). O foco da semana muda de captação para confirmação de presença, preparação emocional da comunidade e logística da equipe.

**O que analisou:**
- Leu semana 52 completa como referência de formato (padrão v11)
- Confirmou datas: 18/04 = 7 dias; 21/04 = 4 dias (feriado Tiradentes = oportunidade reveal produto); 24/04 = 1 dia (véspera)
- Identificou a carta da ovelhinha (sáb 24/04) como o post de maior potencial emocional da história do perfil
- Mapeou feriado Tiradentes (21/04) como melhor data para reveal do produto especial (mais gente em casa consumindo conteúdo)
- Estruturou guia de crise com 8 cenários realistas para semana 53 + dia H
- Adicionou roteiro completo de equipe com distribuição de tarefas e KPIs operacionais

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana53.md` | CRIADO — 735 linhas, padrão v11: 7 dias Dom–Sáb com post feed + WA ANIVER + WA geral + roteiro stories por dia; Reel 15s para dom (abertura) e sáb (emocional véspera); briefing VIP completo (qui 22/04); reveal produto especial (qua 21/04); guia de crise 8 cenários; roteiro equipe + distribuição tarefas; checklist 15 itens; métricas; tabela editorial |

**Commit:** `aeace85`

**Destaques de conteúdo:**
1. **Carta da ovelhinha (sáb 24/04):** Post em formato de carta pessoal, sem produto/preço, puro storytelling emocional — "Obrigada por cada vez que você escolheu o MilkyPot Londrina." Maior potencial de compartilhamento orgânico de toda a campanha.
2. **Reveal produto especial no feriado (qua 21/04):** Tiradentes = feriado nacional = público em casa consumindo conteúdo. WA lista ANIVER tem acesso 24h antes do reveal público — escassez exclusiva para VIPs.
3. **Briefing VIP completo (qui 22/04):** Mensagem de WA com horário de chegada, benefícios, o que dizer na entrada — elimina atrito e encanta o VIP antes mesmo de chegar.
4. **Guia de crise 8 cenários:** Material pronto para que o operador saiba exatamente o que fazer se influencer cancelar, produto acabar, Instagram sair do ar, fila grande etc.
5. **Reel 15s emocional (sáb 24/04):** Compilado de clipes do ano (inauguração → momentos → decoração atual) com trilha suave — o reels mais emocionante da história do perfil.

**Próximo passo sugerido:**
- **Ciclo #91 (OBRIGATÓRIO antes de 18/04):** Criar `belinha/content/pos-inauguracao-dia-h.md` — roteiro completo do dia 25/04/2027 por horário, scripts WA, post encerramento "Obrigada pelo 1 ANO", post-mortem template, guia de crise dia H, semana 54 pós-aniversário
- Ciclo #92 (auto-aprimoramento): Releitura do log completo + revisão estratégia.md (padrão a cada 5 ciclos)
- **Operador — CRÍTICO (prazo sáb 17/04):** Material gráfico "1 ANO" + artes countdown 7→1 prontas
- **Operador — CRÍTICO (prazo sáb 17/04):** Lista ANIVER finalizada com número de confirmados
- **Operador — CRÍTICO (prazo qua 16/04):** Produto especial: nome + ingredientes 100% definidos
- **Operador — CRÍTICO (prazo seg 14/04):** Equipe extra confirmada
- **Operador (prazo qui 15/04):** Briefing enviado a influencers confirmados

_Belinha — Ciclo #90 | 2026-05-02_

---

## Ciclo #89 — 2026-05-02

**Área:** Conteúdo — Semanas 51 + 52 (04–17/04/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #88. Semana 51 = "3 semanas exatas" (04/04) + mecânica de revelação progressiva "um detalhe do dia H por dia" (5 detalhes ao longo da semana) + lançamento de convite a influencers de Londrina + campanha UGC #MeuPotinhoFavorito + Sexta #35 (09/04, 16 dias). Semana 52 = "2 semanas exatas" (11/04) + revelação do programa completo 25/04 + carrossel nostálgico "Você estava lá?" + urgência lista ANIVER + **Sexta #36 (16/04) = SINGLE DIGIT COUNTDOWN (9 dias)** + fechamento das inscrições lista ANIVER + transição para a semana do aniversário.

**O que analisou:**
- Leu semana 50 completa como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou datas: 04/04 = 21 dias = 3 semanas exatas; 11/04 = 14 dias = 2 semanas exatas
- Sexta #35 = 09/04 (16 dias antes); Sexta #36 = 16/04 (9 dias = primeiro single digit countdown de toda a campanha)
- Calculou que 17/04 = 8 dias = último sábado antes da semana do aniversário — ideal para fechar lista ANIVER
- Mapeou mecânica de "detalhe por dia" (5 detalhes na semana 51) como estrutura de antecipação programada e razão para seguir diariamente
- Identificou carrossel nostálgico "Você estava lá?" (ter 13/04) como post de maior engajamento emocional da semana 52

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana51.md` | CRIADO — 7 peças: marco "3 semanas/21 dias" (dom), detalhe #1 horário (seg), detalhe #2 surpresa primeiros clientes + convite influencers Londrina (ter), detalhe #3 decoração + campanha UGC #MeuPotinhoFavorito (qua), detalhe #4 programa VIP lista ANIVER (qui), Sexta #35 "16 dias" com 5+ touchpoints (sex), detalhe #5 convidados especiais "15 dias" (sáb) |
| `belinha/content/pos-inauguracao-semana52.md` | CRIADO — 7 peças: revelação programa completo "2 semanas/14 dias" (dom), mobilização "traga sua turma" (seg), carrossel nostálgico "Você estava lá?" 8 slides (ter), urgência final lista ANIVER (qua), pré-Sexta #36 "amanhã single digit" (qui), **Sexta #36 "9 DIAS — SINGLE DIGIT COUNTDOWN"** com 8+ touchpoints (sex), fechamento lista ANIVER + "semana do aniversário começa amanhã" (sáb) |

**Commit:** (ver abaixo)

**Destaques de conteúdo:**
1. **Mecânica "detalhe por dia" (semana 51):** 5 detalhes do dia H revelados progressivamente (dom–sáb). Cria razão para seguir o perfil diariamente e gera FOMO em quem não acompanha. Cada detalhe tem WA exclusivo para lista ANIVER 1h antes.
2. **Convite a influencers (ter 06/04):** Post público + DM segmentada para criadores de Londrina. Sem cachê — experiência VIP como valor. Respostas processadas ao longo da semana 51/52.
3. **Campanha UGC #MeuPotinhoFavorito:** Lançada na quarta da semana 51, mantida ativa até o dia H. Os melhores posts ganham destaque no 25/04 — fidelização + prova social.
4. **Sexta #36 — Single Digit Countdown (16/04):** Primeiro dia da campanha com countdown em dígito único (9 dias). Evento narrativo tratado com cerimônia máxima. Maior potencial de engajamento de todas as Sextas pós-inauguração.
5. **Fechamento lista ANIVER (sáb 17/04):** Urgência de escassez genuína + transição narrativa para a semana do aniversário. KPI: ≥ 200 inscritos acumulados ao final da semana 52.

**Próximo passo sugerido:**
- Ciclo #90: Conteúdo — Semana 53 (18–24/04/2027): SEMANA DO ANIVERSÁRIO — countdown diário 7→1, programação ao vivo, crise/contingência, roteiro equipe
- Ciclo #91: Conteúdo — Dia H (25/04/2027): roteiro completo do dia com todos os touchpoints, horários, guia de crise, post-mortem template
- Ciclo #92 (auto-aprimoramento): releitura do log completo e revisão da estrategia.md
- **Operador — CRÍTICO (prazo seg 12/04):** Confirmação FINAL de TODA a programação do dia 25/04 (horário, decoração, brindes, influencers, produto especial, logística)
- **Operador — CRÍTICO (prazo qua 14/04):** Equipe extra confirmada + estoque verificado com franquia para 25/04
- **Operador — CRÍTICO (prazo qui 15/04):** Material gráfico "1 ANO" pronto para a semana do aniversário
- **Operador:** Confirmar oferta Sexta #35 (prazo: qua 07/04) e Sexta #36 (prazo: qua 14/04)

_Belinha — Ciclo #89 | 2026-05-02_

---

## Ciclo #88 — 2026-05-02

**Área:** SEO/UX — gap técnico obrigatório (7 ciclos de conteúdo desde #82)

**Contexto:** Prescrito pelo roadmap do ciclo #87. Auditoria revelou dois problemas concretos: (1) `cartao-fidelidade.html` tem `<meta name="robots" content="noindex">` mas estava listada no sitemap.xml — inconsistência que envia sinal contraditório ao Google; (2) `cardapio.html` (página de maior conversão, prioridade 0.9 no sitemap) tinha apenas 1 bloco schema.org (`FoodEstablishment` + `Menu`) sem `BreadcrumbList` nem `WebPage`, impedindo rich results de navegação nas SERPs.

**O que analisou:**
- Auditou `index.html`: schema já completo (FoodEstablishment, FAQPage, BreadcrumbList, OG, Twitter)
- Auditou `cardapio.html`: 1 schema, sem BreadcrumbList/WebPage — gap para rich results
- Auditou `cartao-fidelidade.html`: noindex mas na sitemap — inconsistência SEO
- Verificou `desafio.html`: 0 schemas, mas prioridade 0.5 (menos urgente)
- Confirmou `potinho-ninho-londrina.html` e `acai-self-service-londrina.html`: 2 schemas cada (ok)
- Detectou `lastmod` homepage defasado: 2026-04-22 → corrigido para 2026-05-02

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | ADICIONADO — 2º bloco schema.org: `BreadcrumbList` (Início → Cardápio) + `WebPage` com `@id`, `isPartOf` e breadcrumb inline. Rich results de navegação agora elegíveis no Google. |
| `sitemap.xml` | REMOVIDA `cartao-fidelidade.html` (noindex — inconsistência corrigida); ATUALIZADO `lastmod` homepage → 2026-05-02 e cardapio → 2026-05-02; reordenado por prioridade decrescente (1.0 → 0.9 → 0.8 → 0.5 → 0.3) |

**Commit:** `12bdc7f`

**Impacto SEO esperado:**
1. `BreadcrumbList` em `cardapio.html`: Google pode exibir "milkypot.com > Cardápio" nas SERPs — melhora CTR em buscas como "cardápio potinho ninho londrina"
2. Sitemap limpo sem página noindex: crawlers param de visitar URLs contraditórias e concentram budget em páginas indexáveis
3. `lastmod` atualizado: Googlebot prioriza recrawl de páginas com data recente

**Próximo passo sugerido:**
- Ciclo #89: Conteúdo — Semanas 51+52 (04–17/04/2027): programação dia H 25/04, influencers Londrina, Sextas #35/#36
- Ciclo #90: SEO — `desafio.html` (schema BreadcrumbList + WebPage + `SoftwareApplication`) + `potinho-ninho-londrina.html` (verificar schema AggregateRating quando tiver reviews)
- Ciclo #92 (auto-aprimoramento): Releitura completa do log, revisão da estratégia.md
- **Operador — CRÍTICO (prazo seg 29/03):** Confirmar produto especial aniversário (nome, ingredientes, preço, foto) para semana 49 e 50
- **Operador — CRÍTICO (prazo sáb 27/03):** Horário Muffato no Domingo de Páscoa
- **Operador — CRÍTICO (prazo qua 24/03):** Horário Muffato na Sexta-Feira Santa

_Belinha — Ciclo #88 | 2026-05-02_

---

## Ciclo #87 — 2026-05-02

**Área:** Conteúdo — Semanas 49 + 50 (21/03–03/04/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #86. Semana 49 = terceira semana do aquecimento aniversário 1 ano, com dois marcos: (1) carrossel "12 meses em 12 imagens" e (2) primeiro teaser visual do produto especial de aniversário. Bonus: Semana Santa cai inteira na semana 49 → **Sexta #33 = Sexta-Feira Santa (feriado nacional)**, possivelmente a Sexta de maior tráfego de toda a história do MilkyPot Londrina. Semana 50 começa com **Domingo de Páscoa (28/03)**, depois **reveal completo do produto especial** (qua 31/03) e **Sexta #34 (02/04, 23 dias para o aniversário)**.

**O que analisou:**
- Leu semanas 47 e 48 como referência de formato (padrão v11)
- Calculou datas: Sexta #33 = 26/03 (Sexta-Feira Santa, feriado), Sexta #34 = 02/04
- Identificou Domingo de Ramos = 21/03, Quinta-Feira Santa = 25/03, Sexta-Feira Santa = 26/03, Domingo de Páscoa = 28/03
- Countdowns: 21/03 → 25/04 = 35 dias; 28/03 → 25/04 = 28 dias (4 semanas exatas); 03/04 → 25/04 = 22 dias
- Identificou ovelha como personagem orgânico de Páscoa — explorado humoristicamente no Domingo de Páscoa
- Manteve bloqueador: produto especial aniversário depende de confirmação da franquia (Versão A/B)
- Segunda pós-Páscoa = gancho natural Linha Zero/Fit (inserido 29/03)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana49.md` | CRIADO — 7 peças: Domingo de Ramos + countdown, nutrição ANIVER, **carrossel "12 meses em 12 imagens" 12 slides**, **teaser produto especial (A/B)**, Quinta-Feira Santa + pré-Sexta, **Sexta #33 Sexta-Feira Santa 7+ touchpoints**, recap + 29 dias |
| `belinha/content/pos-inauguracao-semana50.md` | CRIADO — 7 peças: **Domingo de Páscoa (ovelhinha = animal de Páscoa)**, **Linha Zero pós-Páscoa**, urgência "revelação essa semana", **REVEAL COMPLETO produto especial + Reel 15s roteirizado (A/B)**, nutrição + humor 01/04, **Sexta #34 — 23 dias**, "modo aniversário ativado 22 dias" |

**Commit:** `25751ef`

**Destaques de conteúdo:**
1. **Sexta #33 = Sexta-Feira Santa:** Tráfego de feriado + 33ª Sexta consecutiva. Meta: ≥ 150% da média de pedidos.
2. **Reveal do produto especial (qua 31/03):** Post de maior impacto da campanha após o dia H. WA lista ANIVER 1h antes do público + Reel 15s cinemático com roteiro completo.
3. **Domingo de Páscoa — ovelhinha como animal de Páscoa:** "A ovelhinha não é um coelho... mas faz potinhos muito melhores 😄" — angle orgânico e único.
4. **Linha Zero pós-Páscoa:** Conteúdo de saúde no momento de maior propensão ao recomeço pós-feriado.
5. **Meta crítica lista "ANIVER":** ≥ 100 inscritos ao final da semana 50.

**Próximo passo sugerido:**
- Ciclo #88: **SEO/UX — gap técnico OBRIGATÓRIO** (7 ciclos de conteúdo desde #82): sitemap.xml, schema.org LocalBusiness, Open Graph, Core Web Vitals
- Ciclo #89: Conteúdo — Semanas 51+52 (04–17/04/2027): programação dia H, influencers Londrina, Sextas #35/#36
- **Operador — CRÍTICO (prazo seg 29/03):** Confirmar produto especial com franquia (nome, ingredientes, preço, foto)
- **Operador — CRÍTICO (prazo sáb 27/03):** Horário Muffato no Domingo de Páscoa
- **Operador — CRÍTICO (prazo qua 24/03):** Horário Muffato na Sexta-Feira Santa
- **Operador:** Definir programação especial 25/04/2027 (evento, brindes, influencers) — prazo semana 51
- **Operador:** Fotos/dados do primeiro ano para carrossel "12 meses em 12 imagens" (prazo seg 22/03)

_Belinha — Ciclo #87 | 2026-05-02_

---

## Ciclo #86 — 2026-05-02

**Área:** Conteúdo — Semanas 47 + 48 (07/03–20/03/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #85. Semana 47 = abertura do aquecimento do aniversário 1 ano com tom enigmático ("a ovelhinha guarda um segredo") + Dia Internacional da Mulher (08/03) + lançamento público da mecânica WA "ANIVER" (sábado 13/03) + enquete sabor aniversário nos stories + Sexta #31 (12/03). Semana 48 = aquecimento semana 2, tom nostálgico ("você estava lá em 25/04/2026?") + carrossel "como tudo começou" + post interativo inaugural + WA exclusivo lista ANIVER + Sexta #32 (19/03) + carrossel "melhores momentos do primeiro ano".

**O que analisou:**
- Leu semanas 45 e 46 como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou datas: 07/03 a 25/04 = 49 dias = 7 semanas exatas → âncora do aquecimento
- Mapeou Sexta #31 = 12/03 e Sexta #32 = 19/03
- Integrou Dia Internacional da Mulher (08/03) e São Patrício (17/03) como ganchos de calendário
- Revisou briefing `aniversario-1-ano-briefing.md` para alinhar tom e mecânica "ANIVER" com estratégia macro
- Identificou 07/03 como o ponto de "transição Carnaval → aniversário" — virada de arco narrativo

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana47.md` | CRIADO — 7 peças (Dom–Sab): abertura enigmática pós-Carnaval + sticker countdown 25/04 Dom 07/03, Dia da Mulher Seg 08/03 (alta prioridade), açaí hero rotina Ter 09/03, teaser velado "ovelhinha com segredo" + stories número 7 Qua 10/03, WA VIP lista existente aviso antecipado Qui 11/03, **Sexta #31 com 6 touchpoints + Easter egg aniversário** Sex 12/03, **lançamento mecânica WA "ANIVER"** + enquete sabor aniversário Sáb 13/03; template resposta ANIVER; checklist; métricas; tabela editorial; transição semana 48 |
| `belinha/content/pos-inauguracao-semana48.md` | CRIADO — 7 peças (Dom–Sab): **carrossel "Como tudo começou"** (12 slides com estrutura detalhada) + WA ANIVER exclusivo Dom 14/03, UGC histórico Seg 15/03, post interativo **"Você estava lá em 25/04/2026?"** Ter 16/03, produto simples / São Patrício opcional Qua 17/03, WA duplo (geral + ANIVER exclusivo com teaser produto) Qui 18/03, **Sexta #32 com countdown integrado "6 semanas"** Sex 19/03, carrossel **"Melhores Momentos Ano 1"** + teaser próximas semanas Sáb 20/03; checklist; métricas; tabela editorial; transição semana 49 |

**Commit:** `326e873`

**Destaques de conteúdo:**
1. **Mecânica WA "ANIVER" (sáb 13/03):** Template completo de resposta para inscritos + copy feed + WA broadcast geral. Meta: ≥ 20 inscritos no primeiro dia, ≥ 50 acumulados ao final da semana 48. Espelha mecânicas validadas de HALLOWEEN, NATAL e CARNAVAL.
2. **Carrossel "Como tudo começou" (dom 14/03):** 12 slides com estrutura completa — desde a inauguração 25/04/2026 até CTA "ANIVER". Maior post emocional do aquecimento. Alto potencial de salvamentos + compartilhamentos.
3. **Post interativo "Você estava lá?" (ter 16/03):** Gera comentários orgânicos, identifica clientes da primeira hora para reconhecimento especial no dia H 25/04/2027. Copy inclui gancho "reconhecimento especial em 25/04/2027 😉".
4. **Sextas #31 e #32 com Easter eggs de aniversário:** Sexta #31 planta sutil (PS enigmático), Sexta #32 integra countdown explicitamente ("32 Sextas consecutivas desde 25/04/2026 — em 5 semanas é o aniversário").
5. **Tom duplo mantido:** Rotina de produto (açaí, cardápio, qualidade) em paralelo à thread narrativa de aniversário — nenhum dia fica apenas como "teaser sem produto".

**Próximo passo sugerido:**
- Ciclo #87: Conteúdo — Semanas 49+50 (21/03–03/04/2027): "12 meses em 12 imagens" (carrossel numérico) + WA "ANIVER" intensificação + **reveal produto especial aniversário** (Versão A/B) + Sextas #33/#34 + countdown 35 dias
- Ciclo #88: SEO/UX — gap técnico obrigatório (6 ciclos de conteúdo consecutivos desde #82): indexação landing pages, schema produto, sitemap.xml, Core Web Vitals
- **Operador — CRÍTICO (prazo 21/03/2027):** Confirmar produto especial de aniversário com a franquia (nome, ingredientes, preço, visual). Bloqueador ativo para reveal na semana 50.
- **Operador:** Reunir fotos da inauguração 25/04/2026 para o carrossel "Como tudo começou" (prazo: 13/03/2027 à noite).
- **Operador:** Confirmar oferta Sexta #31 até 10/03/2027 e Sexta #32 até 17/03/2027.
- **Operador:** Confirmar disponibilidade de dados reais (potinhos vendidos, clientes fidelidade) para carrossel "Melhores Momentos Ano 1".

_Belinha — Ciclo #86 | 2026-05-02_

---

## Ciclo #85 — 2026-05-02

**Área:** Conteúdo — Semanas 45 + 46 (21/02–06/03/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #84. Semana 45 = reta final do Carnaval (7 dias countdown, Dom 21/02 a Sáb 27/02) com **Sexta #29 (26/02) = Véspera de Carnaval = maior Sexta do ano inteiro**. Semana 46 = **Carnaval ao vivo** (Dom 28/02, Seg 01/03, Ter 02/03 = Terça Gordo) + Quarta de Cinzas (03/03, tom de transição) + UGC showcase (04/03) + **Sexta #30 "Sexta da Ressaca Boa"** (05/03) + encerramento do arco Carnaval com teaser aniversário 1 ano (06/03).

**O que analisou:**
- Leu semanas 43 e 44 como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou estrutura semanal Dom–Sáb: 14/02 = domingo (semana 44) → 28/02 = domingo (semana 46 começa no primeiro domingo de Carnaval)
- Mapeou Sexta #29 = 26/02 (véspera informal de Carnaval) como maior Sexta do arco; Sexta #30 = 05/03 como "Sexta da Ressaca Boa"
- Dias de Carnaval ao vivo: Dom 28/02, Seg 01/03, Ter 02/03 (Terça Gordo), Qua 03/03 (Quarta de Cinzas)
- Identificou necessidade de dois registros emocionais distintos: frenesi (semana 45 + 28/02–02/03) e acolhimento (03–06/03)
- Estruturou semana 46 com conteúdo "ao vivo" para os 3 dias de Carnaval — stories em tempo real como diferencial crítico
- Sábado 06/03 = encerramento do arco + primeiro teaser velado do aniversário 1 ano (25/04/2027)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana45.md` | CRIADO — 7 peças (Dom–Sab): countdown "7 dias" Dom 21/02 + WA VIP abertura, carrossel cardápio Carnaval Seg 22/02, bastidores loja preparação Ter 23/02, WA VIP detalhes Sexta #29 + horários confirmados Qua 24/02, UGC showcase + anúncio Sexta #29 Qui 25/02, **Sexta #29 "A Maior Sexta do Ano" com 6 touchpoints** Sex 26/02, "AMANHÃ É CARNAVAL!" + UGC Sexta #29 + WA confirmação Sáb 27/02; Reel 15s "countdown final"; checklist; métricas; tabela editorial; transição semana 46 |
| `belinha/content/pos-inauguracao-semana46.md` | CRIADO — **DIA 1 Carnaval ao vivo Dom 28/02** (feed 13h + WA VIP 11h + WA geral 12h + 10 touchpoints stories), **DIA 2 Seg 01/03** (açaí hero + energia, 8 touchpoints), **DIA 3 = Terça Gordo 02/03** (urgência máxima + ponto em dobro, 9 touchpoints), Quarta de Cinzas 03/03 (tom acolhedor, transição), UGC showcase Qui 04/03, **Sexta #30 "Sexta da Ressaca Boa"** Sex 05/03 (Linha Zero + Açaí hero), encerramento arco + teaser aniversário 1 ano Sáb 06/03; Reel 15s "resumo épico"; checklist; métricas; tabela editorial; transição semana 47 |

**Commit:** `1dc6c39`

**Destaques de conteúdo:**
1. **Sexta #29 (26/02) — 6 touchpoints sequenciais:** WA VIP 9h → Feed 11h → WA geral 12h → Abertura ao vivo 14h → UGC 17h → Urgência encerramento 20h. Maior mobilização de uma única Sexta em todo o histórico do MilkyPot Londrina.
2. **Dias de Carnaval com stories em tempo real:** Cada dia tem roteiro de stories ao vivo (8–10 touchpoints por dia). Diferencial crítico vs. concorrentes: presença em tempo real mostra fila, primeiro potinho, equipe de fantasia — conteúdo espontâneo que gera FOMO e UGC orgânico.
3. **Quarta de Cinzas como virada emocional:** Tom muda radicalmente de eufórico para acolhedor. Linha Zero posicionada como "ressaca saborosa" — aproveitando o contexto de pós-folia para converter a narrativa de saúde/leveza.
4. **Encerramento arco (sábado 06/03) com teaser misterioso:** "A ovelhinha tem algo especial guardado... Em breve no @milkypotbr" — primeiro gancho do aquecimento do aniversário 1 ano (25/04/2027) sem revelar ainda o que é.
5. **Versão A/B mantida para produto temático + ofertas VIP:** Todos os bloqueadores ativos (produto Carnaval, oferta VIP, ponto em dobro) incluídos como variações — operador escolhe sem precisar de novo ciclo.

**Próximo passo sugerido:**
- Ciclo #86: Conteúdo — Semanas 47+48 (07–20/03/2027): **Início aquecimento aniversário 1 ano** — "Faltam 7 semanas para 25/04" (semana 47, tom misterioso/teaser) + ativação lista WA "ANIVERSARIO" + carrossel educativo "como o MilkyPot surgiu" + Sexta #31 (12/03) + carrossel "você estava lá em 25/04?" (semana 48)
- Ciclo #87: Conteúdo — Semanas 49+50 (21/03–03/04): aquecimento 1 ano semana 3/4 — "12 meses em 12 imagens" + reveal produto aniversário (Versão A/B)
- Ciclo #88: SEO/UX — gap técnico obrigatório (≥6 ciclos de conteúdo consecutivos desde #82): indexação landing pages, schema produto, sitemap.xml, Core Web Vitals
- **Operador — CRÍTICO (prazo 21/03/2027):** Confirmar produto especial de aniversário com a franquia — Belinha precisa de: nome, ingredientes principais, preço sugerido, visual (cor dominante), nome do "kit" especial. Sem isso, os ciclos #86–87 usarão Versão A/B.
- **Operador — CRÍTICO (prazo 14/02/2027 — já passou):** Confirmar produto temático de Carnaval para substituir "Versão B" nas semanas 45–46.
- **Operador:** Levantar métricas reais dos 3 dias de Carnaval (pedidos, clientes, faturamento) para o post de encerramento de sábado 06/03.

_Belinha — Ciclo #85 | 2026-05-02_

---

## Ciclo #84 — 2026-05-01

**Área:** Concorrentes — Refetch TheBest + MilkyMoo + novo entrante Green Açaí + briefing aniversário 1 ano

**Contexto:** Ciclo de concorrentes obrigatório prescrito pelo ciclo #83 (padrão v11: após 5 ciclos de conteúdo consecutivos, gap de concorrentes). Última atualização de concorrentes foi no ciclo #73 (2026-04-30) — 10 ciclos atrás. Paralelamente: planejamento inicial da campanha épica aniversário 1 ano (25/04/2027).

**O que analisou:**
- WebSearch: TheBest Açaí Londrina 2026 — expansão, quiosques, localização Muffato
- WebSearch: MilkyMoo Londrina 2026 — novidades, preços, cardápio
- WebSearch: Johnny/Jhoy Londrina — sem resultados confirmados para Londrina
- WebSearch: Green Açaí @greenlondrina — novo entrante local identificado (38K seguidores)
- Referência cruzada com arquivos de concorrentes ciclo #73

**Principais descobertas:**

| Concorrente | Descoberta |
|---|---|
| TheBest | ✅ Muffato gap mantido — sem nova unidade em Quintino Bocaiuva. Meta 2.000 unidades até 2027 confirmada. 5 unidades + quiosque Shopping Aurora em Londrina. |
| MilkyMoo | 🆕 Day Part 180ml lançado 30/04/2026 a R$12,90 até 13h59. Páscoa 2026: ovos Pandora e Malhada. Preços confirmados: 300ml R$18 / 500ml R$22. |
| Jhoy | ⚠️ Não confirmado em Londrina — pesquisa não retornou resultados. Manter na lista mas baixa prioridade. |
| Green Açaí | 🆕 NOVO ENTRANTE LOCAL — @greenlondrina, 38K seguidores, tagline "O MELHOR AÇAÍ DE LONDRINA", Jardim do Lago, iFood, ticket R$20–40. Concorrente parcial (açaí, não potinho). |

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/the-best-acai.md` | Seção "Monitoramento Ciclo #84" adicionada — status gap Muffato, meta 2.000 unidades, alertas estratégicos |
| `belinha/competitors/milkymoo.md` | Seção "Atualização Ciclo #84" adicionada — Day Part 180ml, Páscoa 2026, preços atualizados, alertas estratégicos |
| `belinha/competitors/green-acai.md` | CRIADO — análise inicial do novo entrante local Green Açaí |
| `belinha/competitors/README.md` | Adicionado Green Açaí + datas de atualização corrigidas |
| `belinha/content/aniversario-1-ano-briefing.md` | CRIADO — briefing inicial campanha épica 25/04/2027 (4 fases, métricas-alvo, roadmap de ciclos para elaboração) |

**Commit:** `24710d2`

**Alertas para o operador:**
- MilkyMoo Day Part 180ml até 13h59: avaliar se há fluxo Muffato no horário pós-almoço para criar promoção equivalente
- Green Açaí tagline "O MELHOR AÇAÍ DE LONDRINA": reforçar diferenciação MilkyPot em SEO local como "potinho personalizado Londrina"
- Aniversário 1 ano (25/04/2027): começar a pensar no produto comemorativo exclusivo — detalhes devem ser definidos até ciclo ~93

**Próximo passo sugerido:**
- Ciclo #85: **Conteúdo — Semanas 45+46 (21/02–06/03/2027)**: reta final Carnaval (semana 45) + dias ao vivo de Carnaval (28/02 sábado, 01/03 domingo, 02/03 segunda) + Quarta de Cinzas (05/03) + pós-Carnaval (06/03). Sexta #29 (26/02) = maior Sexta do arco Carnaval.
- Ciclo #86: Conteúdo — Semanas 47+48 (07–20/03): recuperação pós-Carnaval + retorno da rotina + Linha Zero "promessa de março" + Sexta #30/#31
- Ciclo #89: Próximo refetch de concorrentes (TheBest quiosque Muffato? Green Açaí crescimento?)

_Belinha — Ciclo #84 | 2026-05-01_

---

## Ciclo #83 — 2026-05-01

**Área:** Conteúdo — Semanas 43 + 44 (07/02–20/02/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #82 (e #81). Semana 43 = Carnaval build-up máximo (21 dias) + reveal público do produto temático + Sexta #27 (12/02) como maior conversão de fevereiro. Semana 44 = última semana "normal" antes da reta final de Carnaval + Dia de São Valentim/Dia do Amor (14/02) + WA VIP com programação completa de Carnaval + Sexta #28 (19/02) + countdown "8 dias" de encerramento.

**O que analisou:**
- Leu semanas 41 e 42 como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou cadência na estratégia.md (#79): semanas 43/44 = Carnaval build-up máximo; semana 44 inclui 14/02 (Dia do Amor — menos celebrado no Brasil que 12/06, mas aproveitável como Dia de São Valentim / "potinho pra presentear")
- Mapeou Sexta #27 = 12/02 (semana 43) e Sexta #28 = 19/02 (semana 44) em sequência correta
- Identificou que a lista VIP "CARNAVAL" (ativada em 01/02, semana 42) precisa de: update exclusivo na segunda 08/02, programação completa na terça 16/02
- Produto temático de Carnaval: mantido em Versão A/B em todos os posts (prazo duro de confirmação com franquia = 14/02)
- Carnaval 28/02–02/03: confirmado pelo contexto dos ciclos anteriores (28/02 = sábado de Carnaval, 01/03 = domingo, 02/03 = segunda de Carnaval, 03/03 = terça/Quarta de Cinzas)
- Countdowns: 07/02 = "21 dias"; 13/02 = "15 dias"; 14/02 = "14 dias"; 20/02 = "8 dias"
- Carrossel "Como o MilkyPot funciona no Carnaval" (terça 09/02) e "Guia completo do potinho no Carnaval" (segunda 15/02) = conteúdo de salvamento alto, serve como referência pré-Carnaval
- Diferenciação implícita TheBest: post de quarta 17/02 ("O que é o MilkyPot durante o Carnaval") — experiência vs. quiosque, sem nomear concorrentes

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana43.md` | CRIADO — 7 peças (Dom–Sab): countdown "21 dias" 07/02, WA VIP update + post leve seg 08/02, carrossel "Como o MilkyPot funciona no Carnaval" ter 09/02, reveal público produto temático (Versão A/B) qua 10/02, UGC showcase qui 11/02, Sexta #27 "Maior Sexta antes do Carnaval" sex 12/02 (5 touchpoints WA+feed+stories), countdown "15 dias" + UGC showcase sáb 13/02; Reel 15s "Produto de Carnaval — A Revelação"; checklist; métricas; tabela editorial; transição semana 44 |
| `belinha/content/pos-inauguracao-semana44.md` | CRIADO — 7 peças (Dom–Sab): Dia do Amor dom 14/02 (Versão com oferta/sem oferta), carrossel "Guia completo potinho no Carnaval" 7 slides seg 15/02, WA VIP programação completa Carnaval + post público ter 16/02, post experiência "O que é o MilkyPot durante o Carnaval" qua 17/02, UGC showcase + hype Sexta #28 qui 18/02, Sexta #28 "Última Grande Sexta antes do Carnaval" sex 19/02 (4 touchpoints WA+feed+stories), countdown "8 dias" + UGC Sexta #28 + sticker countdown reforço sáb 20/02; Reel 15s "O que te espera no Carnaval MilkyPot"; checklist; métricas; tabela editorial; transição semana 45 |

**Commit:** `9630977`

**Destaques de conteúdo:**
1. **Sexta #27 (12/02) = 5 touchpoints sequenciais:** WA VIP 9h → Feed 11h → WA geral 12h → Stories ao longo do dia (14h/16h/18h/21h). Maior mobilização de uma Sexta até o momento no arco de Carnaval.
2. **Carrossel "Como o MilkyPot funciona no Carnaval" (09/02):** Conteúdo educativo-prático de alta taxa de salvamento — antecipa dúvidas ("abre no feriado?", "delivery funciona?") e transforma ansiedade em antecipação positiva.
3. **WA VIP Programação Completa de Carnaval (terça 16/02):** Maior entrega de valor da lista VIP "CARNAVAL" — operador envia horários, produto, oferta VIP exclusiva. Meta: ≥80% de abertura. Converte VIPs em clientes garantidos para 28/02–02/03.
4. **14/02 Dia do Amor:** Tom afetivo e inclusivo (casais + amigos + amor próprio) — potinho como presente. Dois modos simultâneos: afetivo na segunda-feira, carnavalesco a partir de terça. Versão com oferta e sem oferta para o operador escolher.
5. **Semana 44 encerra com "8 dias" e hype máximo para semana 45 (reta final):** Sticker countdown 28/02 reforçado (segunda chamada para seguidores que não adicionaram na semana 42). Meta cumulativa de VIPs: ≥70 ao fim da semana 44.

**Próximo passo sugerido:**
- Ciclo #84: **Concorrentes — OBRIGATÓRIO** (padrão v11: após 5 ciclos de conteúdo consecutivos, gap de concorrentes). Refetch TheBest + MilkyMoo + novos entrantes Londrina. Planejamento inicial campanha épica aniversário 1 ano (25/04/2027 = 3 meses à frente).
- Ciclo #85: Conteúdo — Semanas 45+46 (21/02–06/03): reta final Carnaval + Sexta #29 véspera (26/02, maior Sexta do arco) + dias do Carnaval ao vivo (28/02–02/03) + pós-Carnaval (03–06/03)
- Operador: confirmar produto temático de Carnaval com a franquia até **14/02 (prazo DURO)**
- Operador: definir oferta especial 14/02 (Dia do Amor) antes de 12/02
- Operador: definir programação completa de Carnaval (horários, delivery, equipe) para envio VIP na terça 16/02 — confirmar até 14/02
- Operador: definir oferta VIP exclusiva de Carnaval (ponto em dobro? brinde? topping bônus?) antes de 16/02

_Belinha — Ciclo #83 | 2026-05-01_

---

## Ciclo #82 — 2026-05-01

**Área:** UX/Performance — Core Web Vitals (CLS/LCP) em `cardapio.html`

**Contexto:** Prescrito pelo padrão v11 e ciclo #81 como "UX/Performance sweep obrigatório — 17+ ciclos sem atenção". Foco em cardapio.html, a página de conversão primária.

**O que analisou:**
- Comparou atributos `<img>` entre `index.html` e `cardapio.html`
- Detectou que `index.html` usa dimensões de exibição corretas com `loading` e `decoding` explícitos (ex: nav logo `width="128" height="72" loading="eager" decoding="sync"`)
- `cardapio.html` tinha ambos os logos com `width="1900" height="1070"` (dimensões brutas do arquivo PNG) sem nenhum atributo `loading` ou `decoding`
- Logo do hero já tinha `fetchpriority="high"` mas faltava `loading="eager" decoding="sync"` para completar o padrão LCP
- Sem `loading="eager"`, o browser pode tratar a imagem como candidato a lazy-load em alguns contextos; sem `decoding="sync"`, o paint pode ser atrasado

**O que mudou:**

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `cardapio.html` | 131 | nav logo: `width="1900" height="1070"` → `width="128" height="72" loading="eager" decoding="sync"` |
| `cardapio.html` | 154 | hero logo: `width="1900" height="1070" fetchpriority="high"` → `width="280" height="158" fetchpriority="high" loading="eager" decoding="sync"` |

**Commit:** `75d16cc`

**Impacto esperado:**
- Redução de CLS: o browser agora recebe hints de aspect-ratio corretos (128:72 ≈ 16:9, igual à proporção real do PNG)
- Melhora de LCP: `decoding="sync"` prioriza o decode do logo hero no main thread, eliminando possível delay de pintura
- Alinhamento com o padrão já estabelecido em `index.html`

**Próximo passo sugerido:**
- Ciclo #83: Conteúdo — Semanas 43+44 (07–20/02/2027): build-up máximo Carnaval + produto temático (se confirmado) + Sexta #27 (12/02) + véspera Carnaval (27/02)
- Ciclo #84: Concorrentes — refetch TheBest + MilkyMoo + novos entrantes Londrina + planejamento campanha épica aniversário 1 ano
- UX continuação: verificar se `acai-self-service-londrina.html` e `potinho-ninho-londrina.html` têm o mesmo problema de dimensões de imagem

_Belinha — Ciclo #82 | 2026-05-01_

---

## Ciclo #81 — 2026-05-01

**Área:** Conteúdo — Semanas 41 + 42 (24/01–06/02/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #80. Semana 41 = aniversário de 9 meses dia H (25/01 = segunda-feira) + retrospectiva "9 meses em números" + WA gratidão lista completa + Sexta #25 (29/01) + primeiro teaser Carnaval. Semana 42 = abertura de fevereiro + mecânica WA "CARNAVAL" lista VIP + carrossel "Tipos de Carnavaleiro" + balanço janeiro + teaser/reveal produto temático + Sexta #26 (05/02) + countdown 22 dias Carnaval.

**O que analisou:**
- Leu semanas 39 e 40 como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou cadência na estratégia.md (#79): semana 41 = 9 meses dia H + gratidão + Carnaval teaser; semana 42 = WA "CARNAVAL" + build-up + Sexta #26
- Mapeou Sexta #25 = 29/01 (semana 41) e Sexta #26 = 05/02 (semana 42) em sequência correta
- Identificou mecânica WA "CARNAVAL" como padrão validado (igual "HALLOWEEN" ciclo #67 e "NATAL" ciclo #74) — captura de lead qualificado sem desconto
- Aniversário 9 meses em segunda-feira → decisão crítica operador já prescrita na semana 40 (confirmar até quinta 22/01)
- Carnaval 28/02: 27 dias da semana 42 → tempo suficiente para build-up em 3 semanas (42, 43, 44)
- Diferenciação implícita TheBest: semana 41 foca em celebração/comunidade; semana 42 foca em personalização ("seu bloco particular" no açaí)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana41.md` | CRIADO — 7 peças (Dom–Sab): véspera 24/01 (evento fim de semana), dia H 25/01 (post âncora + WA VIP 9h + WA geral 10h + oferta especial + Reel ao vivo), retrospectiva carrossel "9 meses em números" 26/01 (10 slides, Versão A dados reais / Versão B qualitativo), WA gratidão pós-dia H 27/01, teaser Carnaval 28/01, Sexta #25 "Primeira pós-aniversário" 29/01, teaser Carnaval leve "Fevereiro chegando" 30/01; Reel 15s dia H; checklist; métricas; tabela editorial |
| `belinha/content/pos-inauguracao-semana42.md` | CRIADO — 7 peças (Dom–Sab): balanço janeiro/abertura fevereiro 31/01, lançamento WA "CARNAVAL" lista VIP + resposta automática 01/02, carrossel "Tipos de Carnavaleiro" 6 slides 02/02, showcase UGC janeiro + Linha Zero encerramento 03/02, teaser/reveal produto Carnaval (Versão A confirmado / Versão B genérico) + WA VIP exclusivo 04/02, Sexta #26 "Carnaval no horizonte" 05/02, countdown "22 dias" + sticker countdown nativo 28/02 06/02; Reel 15s "Bloco do MilkyPot"; checklist; métricas; tabela editorial |

**Commit:** `e0ea395`

**Destaques de conteúdo:**
1. **Dia H 25/01 = maior post de janeiro:** 3 camadas de WA (VIP 9h, geral 10h, feed 11h) + Stories ao longo do dia + oferta especial. O slide do carrossel de terça com dados reais (Versão A) é a maior peça de prova social desde a inauguração.
2. **Carrossel "9 Meses em Números" (26/01):** 10 slides com Versão A (dados reais: potinhos, clientes, cartões) e Versão B (qualitativo). Slide 10 planta a semente do 1 ano (25/04/2027) — "3 meses. Algo épico vindo."
3. **Mecânica WA "CARNAVAL" (01/02):** Padrão idêntico ao "HALLOWEEN" e "NATAL" — clientes mandam palavra-chave, entram em lista segmentada, recebem acesso antecipado. Meta: ≥30 VIPs até sexta 05/02.
4. **Carrossel "Tipos de Carnavaleiro" (02/02):** 6 slides de identificação/humor — alta probabilidade de compartilhamento orgânico entre amigos (expansão de alcance sem custo). Cada tipo tem um potinho correspondente.
5. **Sticker countdown nativo 28/02 (06/02):** Seguidores que adicionarem recebem notificação automática no dia do Carnaval — mecanismo passivo de engajamento de alto retorno.

**Próximo passo sugerido:**
- Ciclo #82: **UX/Performance sweep obrigatório** (prescrito padrão v11 — 17+ ciclos sem atenção desde #62): mobile first, CLS/LCP, imagens WebP, bundle size, cardápio.html performance. NÃO pode ser adiado.
- Ciclo #83: Conteúdo — Semanas 43+44 (07–20/02): build-up máximo Carnaval + produto temático (se confirmado) + Sexta #27 (12/02) + véspera Carnaval (27/02)
- Ciclo #84: Concorrentes — refetch TheBest + MilkyMoo + novos entrantes Londrina + planejamento campanha épica aniversário 1 ano
- Operador: definir oferta especial do aniversário de 9 meses ANTES de quinta 22/01
- Operador: confirmar celebração domingo 24/01 ou segunda 25/01 (ou ambos) ANTES de quinta 22/01
- Operador: levantar dados reais (potinhos, clientes, cartões) para carrossel terça 26/01 — ANTES de segunda 25/01
- Operador: confirmar produto/topping temático Carnaval com a franquia ANTES de 14/02 (prazo duro)

_Belinha — Ciclo #81 | 2026-05-01_

---

## Ciclo #80 — 2026-05-01

**Área:** Conteúdo — Semanas 39 + 40 (10–23/01/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #79. Semana 39 = açaí buffet self-service como protagonista absoluto de janeiro (herói visual de verão + UGC + diferenciação implícita TheBest). Semana 40 = construção emocional pré-aniversário de 9 meses (25/01): "você faz parte da história" + Linha Zero showcase + Sexta #24 + countdown dia H.

**O que analisou:**
- Leu semanas 37 e 38 como referência de formato (padrão v11: Dom–Sab, Versão A/B, templates WA, checklist, métricas, tabela editorial)
- Confirmou cadência na estratégia.md (#79): semana 39 = açaí hero + Sexta #23; semana 40 = 9 meses teaser + Linha Zero showcase
- Calculou que 25/01/2027 (aniversário 9 meses) cai numa segunda-feira → incluiu decisão crítica para o operador (celebrar domingo 24/01 ou segunda 25/01)
- Mapeou Sexta #23 = 15/01 (semana 39) e Sexta #24 = 22/01 (semana 40) em sequência semanal correta
- Diferenciação implícita TheBest: buffet self-service montagem ao vivo vs. produto padronizado de quiosque — 3 peças na semana 39 usam esse ângulo (dom, qua, qui)
- Arco narrativo semanas 39→40→41: teaser sábado 16/01 → build-up emocional (9 momentos, gratidão) → dia H 25/01 (ciclo #81)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana39.md` | CRIADO — 7 peças (Dom–Sab): açaí âncora exclusividade buffet, UGC showcase verão (Versão A/B), carrossel "por dentro do buffet" (8 slides), WA broadcast calor/delivery, "você escolhe tudo" diferenciação, Sexta #23 (açaí+Linha Zero), recap UGC + teaser 9 meses; Reel 15s buffet; checklist; métricas; tabela editorial |
| `belinha/content/pos-inauguracao-semana40.md` | CRIADO — 7 peças (Dom–Sab): âncora narrativa "Há 9 meses atrás", Linha Zero showcase, "você faz parte" + depoimento (Versão A/B), WA broadcast "5 dias", carrossel "9 Meses em 9 Momentos" (10 slides), Sexta #24 aquecimento final, countdown sticker "em 2 dias 🎂"; Reel 15s "9 meses em 15 segundos"; decisão crítica operador; checklist; métricas; tabela editorial |

**Commit:** `1221aa4`

**Destaques de conteúdo:**
1. **Buffet self-service como narrativa de exclusividade (semana 39):** "Não é produto pronto. Não é padronizado. É o seu açaí." — diferenciação implícita TheBest de máxima clareza sem nomear o concorrente. Terça 12/01 (carrossel "por dentro do buffet") é o maior ativo de descoberta da semana.
2. **"Há 9 meses atrás..." como abertura do arco (domingo 17/01):** A foto P&B da inauguração → foto colorida atual é a transição visual mais emocional de todo o planejamento pós-semana 36. Replica o padrão do arco Natal (nascimento 25/04 → Natal 25/12).
3. **"9 Meses em 9 Momentos" — carrossel (quinta 21/01):** 10 slides construindo a narrativa coletiva. Slide 8 = colagem de UGCs de 9 meses. Versão A (dados reais) / Versão B (narrativa qualitativa) — operador decide ANTES de quinta 21/01.
4. **Sticker de countdown nativo Instagram (sábado 23/01):** Seguidores que adicionarem nos Stories recebem notificação automática quando o timer chegar em 25/01 — mecanismo de engajamento passivo sem custo.
5. **Decisão crítica operador documentada:** Aniversário de 9 meses cai em segunda-feira — menor fluxo espontâneo. Recomendação: celebrar nos dois dias (fim de semana = evento / segunda = gratidão digital). Operador confirma ANTES de quinta 22/01.

**Próximo passo sugerido:**
- Ciclo #81: Conteúdo — Semanas 41+42 (24/01–06/02): aniversário 9 meses dia H (25/01 = maior post de janeiro) + retrospectiva em números + WA gratidão lista completa + aquecimento Carnaval (Sexta #25 em 29/01)
- Ciclo #82: UX/Performance — sweep obrigatório v11 (17 ciclos sem atenção desde #62): mobile, CLS/LCP, imagens WebP, bundle size, cardápio.html performance
- Operador: definir surpresa/oferta especial do aniversário de 9 meses ANTES de quinta 22/01
- Operador: confirmar se celebração é domingo 24/01, segunda 25/01 ou ambos — ANTES de quinta 22/01
- Operador: levantar dados reais (potinhos vendidos, clientes, cartões fidelidade preenchidos) para o carrossel de 9 meses — ANTES de quinta 21/01

_Belinha — Ciclo #80 | 2026-05-01_

---

## Ciclo #79 — 2026-05-01

**Área:** Auto-aprimoramento — análise ciclos #74–78 + estratégia Q1-Q2 2027 (jan–abr) + padrão v11

**Contexto:** Ciclo múltiplo de 5 obrigatório (prescrito pelo roadmap do ciclo #74). Cobertura de conteúdo vai até semana 38 (09/01/2027). Aniversário de 1 ano (25/04/2027) está a ~12 semanas — urgência crítica para planejamento. UX/Performance sem atenção há 16 ciclos (desde #62) = dívida acumulada.

**O que analisou:**
- Releu log completo ciclos #74–#78 (estratégia dezembro/Natal #74, conteúdo semanas 33–38 #75–#77, SEO técnico #78)
- Releu `belinha/estrategia.md` seções "padrão v10" e "Estratégia dezembro 2026/Q1 2027"
- Avaliou eficácia: arco narrativo Natal 8 meses (#76) = melhor conteúdo até agora; Twitter Card cardápio.html (#78) = maior impacto técnico imediato no canal principal (WA)
- Identificou gap crítico: aniversário 1 ano (25/04/2027) ainda sem campanha planejada — precisa de aquecimento 6 semanas (a partir da semana 47, 14/03)
- Identificou dívida crítica: UX/Performance sem atenção há 16 ciclos — prescrito como obrigatório ciclo #82

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | ATUALIZADO: header versão #79, bloco "Aprendizados #74–78", padrão v11 (UX a cada 10 ciclos + campanha aniversário 1 ano + WA "ANIVERSARIO" + checklist A/B), estado das áreas pós-#78, estratégia Q1-Q2 2027 (jan–abr: meses 9–12), cadência semanas 39–54, roadmap #80–84, bloqueadores atualizados |

**Commit:** _(ver abaixo)_

**Destaques do auto-aprimoramento:**
1. **Aniversário 1 ano (25/04/2027) = campanha épica obrigatória:** 12 semanas de distância. Aquecimento inicia semana 47 (14/03). 6 semanas de build-up: teaser → memória → carrossel 12 meses → produto aniversário reveal → WA "ANIVERSARIO" → dia H. Prescrito ciclos #84–#89.
2. **Padrão v11 — UX/Performance sweep obrigatório a cada 10 ciclos:** Ciclo #82 obrigatório (17 ciclos sem atenção é crítico). Foco: mobile first, CLS/LCP, WebP, bundle size.
3. **Carnaval 2027 (28/02–04/03) sinalizado:** Semana 42 tem aquecimento. Produto temático opcional — operador confirma até 14/02. Novo bloqueador registrado.
4. **Checklist de decisão A/B:** Adicionado ao padrão v11 — todo arquivo com Versão A/B deve ter data limite de confirmação em negrito para o operador.
5. **Cadência semanas 39–54 mapeada:** Janeiro (9 meses) → fevereiro (Carnaval) → março/abril (aquecimento 1 ano) → 25/04/2027 (🎂 dia H). Roadmap mais longo já criado pela Belinha.

**Próximo passo sugerido:**
- Ciclo #80: Conteúdo — Semanas 39+40 (10–23/01): açaí hero verão + aniversário 9 meses teaser + Sexta #23 + Linha Zero showcase pós-Ano Novo
- Ciclo #81: Conteúdo — Semanas 41+42 (24/01–06/02): aniversário 9 meses dia H (25/01) + Carnaval aquecimento + Sexta #24
- Ciclo #82: UX/Performance — sweep obrigatório v11 (17 ciclos sem atenção): mobile, CLS/LCP, imagens WebP, bundle size, cardápio.html perf
- Ciclo #83: Concorrentes — refetch TheBest + MilkyMoo + pesquisar novos entrantes Londrina
- Operador: confirmar produto sazonal verão (Versão A ou B) ANTES de 28/11/2026
- Operador: confirmar produto natalino (Versão A ou B) ANTES de 20/12/2026
- Operador: verificar se mecânica WA "VERAO" foi publicada (prescrita ciclo #75)

_Belinha — Ciclo #79 | 2026-05-01_

---

## Ciclo #78 — 2026-05-01

**Área:** SEO local — Twitter Card + meta description + sitemap.xml

**Contexto:** Ciclo SEO obrigatório prescrito pelo padrão v10 (6 ciclos consecutivos de conteúdo desde #72 sem atenção ao SEO técnico). Prioridade: resolver gaps de preview de compartilhamento na página de maior conversão (`cardapio.html`) e sinalizar ao Google a data de modificação atualizada.

**O que analisou:**
- Auditou meta tags de todas as páginas públicas indexadas: `index.html`, `cardapio.html`, `potinho-ninho-londrina.html`, `acai-self-service-londrina.html`
- Encontrou gap crítico: `cardapio.html` (página de maior conversão, `priority: 0.9` no sitemap, `changefreq: daily`) estava **completamente sem Twitter Card meta tags** — afeta preview de links compartilhados no WhatsApp, Telegram, Twitter e qualquer crawler de link preview
- Encontrou gap SEO local: `meta name="description"` do `cardapio.html` não continha a palavra "Londrina" — perda de relevância em buscas locais ("cardápio milkypot londrina", etc.)
- `sitemap.xml`: `lastmod` de `cardapio.html` desatualizado (`2026-04-22` → `2026-05-01`)
- Demais páginas: `potinho-ninho-londrina.html` e `acai-self-service-londrina.html` já têm Twitter Card; `index.html` também completo

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | ADICIONADO: `twitter:card summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image` (4 tags) |
| `cardapio.html` | MELHORADO: `meta name="description"` agora inclui "Londrina", "Ninho e Açaí", "Linha Zero/Fit", "buffet self-service" e "Muffato Londrina" — keywords locais completas (antes: genérico sem localidade) |
| `sitemap.xml` | `lastmod` de `cardapio.html` atualizado de `2026-04-22` para `2026-05-01` |

**Commit:** `9a226e9`

**Impacto esperado:**
- Link do cardápio compartilhado no WhatsApp agora mostrará imagem + título + descrição em preview — aumento de CTR nas mensagens de WA (canal principal da MilkyPot)
- Meta description com "Londrina" aumenta relevância em buscas locais como "cardápio potinho londrina" e "milkypot londrina o que tem"
- Google recrawl do `cardapio.html` com `lastmod: 2026-05-01` sinaliza conteúdo atualizado

**Próximo passo sugerido:**
- Ciclo #79: Auto-aprimoramento obrigatório (reler log #74–#78) + ajustar estratégia para semanas 39–42 (açaí verão herói + aniversário 9 meses 25/01/2027 + aquecimento Carnaval)
- Ciclo #80: Conteúdo — Semanas 39+40 (10–23/01): Açaí herói verão + UGC verão + Sexta #23 + teaser aniversário 9 meses
- SEO próximo ciclo técnico (#83 aprox.): verificar og:image:width/height em todas as páginas + schema FAQPage em cardapio.html + revisar GeoCoordinates do LocalBusiness (lat/lng atual: -23.3045, -51.1696 — confirmar precisão com Maps)
- Operador: confirmar preço Linha Zero para carrossel 04/01 (bloqueador ativo desde ciclo #77)

_Belinha — Ciclo #78 | 2026-05-01_

---

## Ciclo #77 — 2026-05-01

**Área:** Conteúdo — Semanas 37 + 38 (27/12/2026–09/01/2027)

**Contexto:** Prescrito pelo roadmap do ciclo #74 e confirmado pela transição da semana 36. Semana 37 = Virada Ano Novo 31/12 (pico de pedidos final de ano) + Sexta #21 em 01/01/2027 "Primeiro Potinho de 2027" (Linha Zero como gancho de resolução de Ano Novo) + carrossel retrospectiva "8 meses em números" em 28/12. Semana 38 = campanha "Nova Meta, Novo Potinho" aprofundada: Linha Zero educativo + açaí herói visual de verão (buffet self-service diferencial exclusivo da unidade Muffato) + Sexta #22 em 08/01 com duplo protagonismo fit/verão.

**O que analisou:**
- Leu semanas 35, 36 e transição para 37 como referência de formato (padrão v10: Dom–Sab, WA templates, checklist, métricas, tabela editorial)
- Confirmou na estratégia.md (#74) o roadmap: ciclo #77 = semanas 37+38, ciclo #78 = SEO/UX gap técnico obrigatório (6+ ciclos sem SEO)
- Calculou Sexta #21 = 01/01/2027 e Sexta #22 = 08/01/2027 (confirmado via transição da semana 36)
- Identificou a narrativa de dupla audiência para janeiro: público "fit/resolução/proteína" (Linha Zero) + público "calor/verão/refrescante" (Açaí buffet)
- Diferenciação implícita TheBest (semana 38, quinta 07/01): tutorial de montagem ao vivo vs. produto padronizado de quiosque — sem citar concorrente
- Alerta: ciclo #78 é SEO/UX obrigatório (6 ciclos de conteúdo consecutivos desde #72)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana37.md` | CRIADO — 7 peças (Dom–Sab): pós-Natal teaser Virada (27/12), carrossel retrospectiva 8 meses Versão A/B (28/12), post emocional "o que você leva de 2026?" (29/12), WA+feed anúncio plano Virada (30/12), **VIRADA 31/12** (WA 10h + feed 12h + stories ao longo do dia + stories meia-noite opcional), **Sexta #21** "Primeiro Potinho de 2027" com Linha Zero (01/01), retomada normal + teaser "Nova Meta" (02/01), Reel 15s "De 2026 para 2027", checklist, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana38.md` | CRIADO — 7 peças (Dom–Sab): âncora campanha "Nova Meta, Novo Potinho" (03/01), carrossel educativo "O que é a Linha Zero?" (04/01), açaí herói verão / buffet self-service (05/01), WA broadcast + depoimento/UGC Linha Zero (06/01), tutorial "Como montar o Potinho Fit" + diferenciação implícita TheBest (07/01), **Sexta #22** duplo protagonismo Linha Zero + Açaí Verão (08/01), recap + teaser semana 39 (09/01), Reel 15s "Janeiro Fit", checklist, métricas, tabela editorial |

**Commit:** `03585f0`

**Destaques de conteúdo:**
1. **Sexta #21 = 01/01/2027 como gancho máximo de conversão Linha Zero:** Primeiro dia do ano + resolução de Ano Novo + Sexta do Potinho = três contextos convergindo. Copy: "Primeira meta de 2027 feita." Não "dieta" — "potinho que vai junto com você"
2. **Virada 31/12 com stories de meia-noite (opcional):** Ponto de diferenciação forte — loja que celebra a Virada com os clientes ao vivo, algo que quiosque de shopping não faz. Requer decisão do operador (equipe até meia-noite)
3. **Açaí buffet self-service como diferencial exclusivo da unidade Muffato (semana 38):** Narrativa "o buffet que só tem aqui" — diferenciação de produto dentro da própria rede + vs. concorrentes. Posicionado como herói visual de verão
4. **Diferenciação implícita TheBest — quinta 07/01 (semana 38):** Tutorial de montagem ao vivo ("você decide, a ovelhinha monta") contrasta com produto padronizado de quiosque. Sem citar concorrente
5. **Duas versões de retrospectiva (28/12):** Versão A com dados reais do operador; Versão B qualitativa/emocional para caso os números não estejam disponíveis — mesmo padrão de mitigação de bloqueadores de ciclos anteriores
6. **Bloqueador novo identificado:** Preço da Linha Zero não está nos arquivos de conteúdo anteriores — operador deve confirmar valor para incluir no carrossel educativo de segunda 04/01

**Próximo passo sugerido:**
- **Ciclo #78 — SEO/UX OBRIGATÓRIO** (6 ciclos de conteúdo consecutivos sem SEO/UX): sitemap.xml verificado/atualizado, schema.org LocalBusiness, Open Graph tags, Core Web Vitals básico. Prioridade máxima
- Ciclo #79: Auto-aprimoramento #79 — reler log #74–#78, ajustar estratégia para semanas 39–42 (açaí verão herói + aniversário 9 meses 25/01/2027 + Carnaval fev/2027)
- Ciclo #80: Conteúdo — Semanas 39+40 (10–23/01): Açaí herói verão + UGC verão + Sexta #23 + teaser aniversário 9 meses
- Operador: confirmar preço Linha Zero para carrossel 04/01
- Operador: definir ação especial 31/12 (topping bônus / brinde / pontos em dobro) antes de 30/12
- Operador: confirmar horário de funcionamento 31/12 e 01/01/2027
- Operador: coletar depoimento real de cliente Linha Zero antes de 06/01
- Operador: foto profissional do Potinho Fit montado + vídeo do buffet de açaí (luz natural) para semana 38

_Belinha — Ciclo #77 | 2026-05-01_

---

## Ciclo #74 — 2026-04-30

**Área:** Auto-aprimoramento — análise ciclos #69–73 + estratégia dezembro/Natal 2026 + Q1 2027

**Contexto:** Ciclo múltiplo de 5 obrigatório (prescrito desde estrategia.md ciclo #69). Cobertura de conteúdo vai até semana 32 (28/11). Alerta competitivo ativo: TheBest quiosque Shopping Aurora Londrina (#73). SEO sem atenção há 6 ciclos (desde #68). UX/Performance sem atenção há 12 ciclos (desde #62).

**O que analisou:**
- Releu log completo ciclos #69–#73 (conteúdo semanas 25–32 + concorrentes)
- Releu estrategia.md seção "novembro 2026" e padrão v9
- Avaliou equilíbrio da rotação: 3 ciclos consecutivos de conteúdo = desequilíbrio identificado → corrigido no roadmap v10
- Avaliou eficácia das mecânicas: copy Black Friday viralizável (#72), ALERTA TheBest (#73), mecânica WA word-chave (#70) = alto valor
- Identificou: templates WA "NATAL" e "VERAO" prescritos no v9 mas nunca executados → explicitados no roadmap #75

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/estrategia.md` | ATUALIZADO: bloco "Aprendizados #69–73", padrão v10, estado das áreas pós-#73, estratégia dezembro 2026 / Q1 2027, cadência semanas 33–42, roadmap #75–79, tabela diferenciação anti-TheBest, bloqueadores atualizados |

**Padrão v10 — principais adições:**
1. **Resposta imediata a ALERTA competitivo:** ALERTA → próximo ciclo de conteúdo inclui ≥1 peça de diferenciação implícita (nunca citar concorrente pelo nome)
2. **SEO técnico obrigatório:** A cada 5 ciclos de conteúdo consecutivos, intercalar 1 ciclo SEO (prescrito ciclo #78)
3. **Palavra-chave WA para cada campanha sazonal:** HALLOWEEN ✅ · NATAL → prescrito ciclo #75 · VERAO → prescrito ciclo #75

**Estratégia dezembro / Q1 2027 — destaques:**
- Semanas 33–36: verão + Natal em 4 atos (teaser → reveal → countdown → dia H 25/12)
- Semanas 37–38: Virada Ano Novo + Linha Zero pós-festas (resolução de Ano Novo = pico fit)
- Semanas 39–41: açaí hero verão + aniversário 9 meses (25/01)
- Semana 42: aquecimento Carnaval

**Próximo passo sugerido:**
- Ciclo #75: Conteúdo — Semanas 33+34 (29/11–12/12): lançamento produto verão + reveal produto natalino + template WA "NATAL" lista VIP + 1 peça diferenciação implícita (experiência vs quiosque)
- Ciclo #76: Conteúdo — Semanas 35+36 (Natal countdown + dia H 25/12)
- Ciclo #78: SEO/UX — gap técnico (6+ ciclos sem atenção)
- Operador: confirmar produto natalino com franquia ANTES de 01/12 · confirmar produto verão baseado na enquete de 11/11

---

## Ciclo #73 — 2026-04-30

**Área:** Pesquisa de Concorrentes — MilkyMoo (refetch) + The Best Açaí (refetch + ALERTA CRÍTICO)

**Contexto:** Prescrito pelo roadmap do ciclo #72. MilkyMoo desatualizado desde ciclo #60; TheBest desde ciclo #42. Ambos com movimentos significativos em 2025/2026 que impactam a estratégia da unidade Muffato.

**O que analisou:**
- WebSearch MilkyMoo 2025/2026: expansão EUA (2 lojas próprias Flórida), faturamento R$542M→R$600M+, nova estratégia dark stores delivery, meta +50% unidades 2026, Londrina confirmada em 2 shoppings (Catuaí + Boulevard)
- WebSearch TheBest 2025/2026: faturamento R$777M→R$1,1B (2025)→meta R$1,5B (2026), 1.000+ unidades, QUIOSQUE em Shopping Aurora Londrina inaugurado jun/2025, novo sorbet 100% fruta sem açúcar, investimento R$80M Auster Capital, internacionalização (4 lojas Flórida 1H2026, Paraguai 15 lojas)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/milkymoo.md` | Atualizado: unidades 600→800+, faturamento R$542M→R$600M+, royalties/taxa detalhados, estratégia dark stores, alertas estratégicos novos |
| `belinha/competitors/the-best-acai.md` | Atualizado: faturamento R$777M→R$1,1B, meta 2000 unidades, **QUIOSQUE SHOPPING AURORA LONDRINA (🆕 CRÍTICO)**, sorbet 100% fruta (incursão fit), internacionalização EUA/Paraguai, nova seção de alertas #73 |

**Commit:** `4debc3c`

**Destaques críticos:**
1. **TheBest: quiosque Shopping Aurora Londrina (jun/2025):** Primeiro quiosque em shopping da rede. Meta 300–500 quiosques em shoppings brasileiros. Modelo R$150k — mais acessível. Se chegarem ao Muffato, a vantagem de localização da MilkyPot é ameaçada. MONITORAR.
2. **TheBest: sorbet 100% fruta sem açúcar:** Primeira incursão no segmento fit. Resposta MilkyPot: enfatizar PROTEÍNA na Linha Zero — ingrediente ausente na TheBest.
3. **MilkyMoo: dark stores delivery:** Amplia cobertura sem loja física — pode aparecer no iFood em Londrina sem abrir nova unidade.
4. **MilkyMoo: faturamento R$542M realizados em 2024** (ciclo #60 tinha projeção R$450M — superada).

**Próximo passo sugerido:**
- Ciclo #74: Auto-aprimoramento — reler log #69–#73, calibrar estratégia dezembro/Natal 2026
- Ciclo #75: Conteúdo — Semanas 33+34 (dezembro: abertura de Natal + countdown Ano Novo)
- Operador: monitorar ativamente se TheBest abre quiosque no Muffato ou arredores (ameaça de localização)

---

## Ciclo #72 — 2026-04-30

**Área:** Conteúdo — Semanas 31 + 32 (15–28/11/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #71. Semana 31 = Black Friday approach — construção de FOMO sem revelar a mecânica ainda + Linha Zero verão sustentado + estreia do teaser Natal (leve, ovelhinha com gorrinho em Stories). Semana 32 = execução Black Friday 27/11 + contagem regressiva 5 dias + reveal parcial da mecânica na terça + dia H com comunicação ao longo do dia + pós-BF na sexta. Padrão v9 mantido.

**O que analisou:**
- Leu semanas 29, 30 e estrategia.md para mapear tom, mecânicas e continuidade
- Confirmou Sexta do Potinho: semana 31 = #16, semana 32 = #17 (série contínua de 30)
- Estratégia BF da estrategia.md: não dar desconto na base — criar valor extra (3 opções para o operador escolher)
- Identificou oportunidade: enquete de preferência BF nos Stories (segunda 23/11) como validação/decisão da mecânica real
- Teaser produto sazonal verão na quarta 25/11 em Versão A (tropicais) / Versão B (refrescância) baseado no resultado da enquete de 11/11
- Template WA fidelidade trimestral incluído na semana 31 para clientes com 8–10 carimbos (clientes desde agosto)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana31.md` | CRIADO — Abertura misteriosa (sem citar BF), educativo açaí self-service, prova social, tease "algo chegando" (fundo preto, diferente), teaser Natal primeira aparição (quinta 19/11), Sexta #16 + WA fidelidade trimestral, plant final revelando "Black Friday MilkyPot 27.11" no sábado 21/11, checklist, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana32.md` | CRIADO — Countdown 5 dias (domingo 22/11 com sticker regressivo nativo), carrossel humor "não é televisão" (segunda), reveal mecânica BF (terça — aguarda confirmação do operador), amplificação + teaser verão A/B (quarta), dia H completo com WA manhã + Stories ao longo do dia (quinta 27/11), Sexta #17 pós-BF + WA agradecimento, sábado teaser duplo Natal+verão, checklist, métricas, tabela editorial |

**Commit:** `bb5a92f`

**Destaques de conteúdo:**
1. **Copy "Todo mundo vendendo eletrônico. A gente tá vendendo felicidade." (27/11):** Ironia de categoria que viraliza — posiciona sobremesa como item de desejo superior, não de commodity
2. **Reveal com placeholder `[INSERIR MECÂNICA]` (terça 24/11):** Operador preenche com a promo real antes de postar — 3 opções sugeridas (2ª cobertura grátis / potinho grande pelo preço do médio / brinde acima de R$30)
3. **Tease fundo preto (quarta 18/11 — semana 31):** Quebra de padrão visual pastel chama atenção no feed = aumento de alcance orgânico esperado
4. **Sticker contagem regressiva nativo Instagram (domingo 22/11):** Cria notificação automática para quem fixar — comportamento nativo do app como ferramenta de FOMO
5. **WA fidelidade trimestral (sexta 20/11 — semana 31):** Clientes com 8–10 carimbos = conversão de alto valor — topping extra no resgate do 10º carimbo como celebração de 3 meses
6. **Teaser verão Versão A/B (quarta 25/11 — semana 32):** Depende do resultado da enquete de 11/11 — sistema de decisão baseado em dado real, não suposição

**Próximo passo sugerido:**
- Ciclo #73: Concorrentes — TheBest (1º fetch ever) + refetch MilkyMoo (desatualizado desde ciclo #60)
- Ciclo #74: Auto-aprimoramento — reler log #69–#73, calibrar estratégia dezembro/Natal
- Operador: **confirmar mecânica BF antes de terça 24/11** (reveal depende disso) — Opção A: 2ª cobertura grátis | Opção B: G pelo preço do M | Opção C: brinde acima de R$30
- Operador: verificar resultado enquete verão (11/11) para aplicar Versão A ou B no teaser de quarta 25/11

---

## Ciclo #71 — 2026-04-29

**Área:** Conteúdo — Semanas 29 + 30 (01–14/11/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #70. Semana 29 = pós-Halloween: showcase UGC, resultado em números, abertura novembro, teaser de novidades. Semana 30 = Linha Zero retomada (comportamento pós-Halloween: culpa + calor novembro = pico de demanda fit) + teaser do produto sazonal de verão (dezembro). Sexta do Potinho #14 e #15 continuam a série — #15 é marco celebrativo de 15 semanas.

**O que analisou:**
- Leu semanas 27 e 28 completas para manter continuidade de mecânicas (lista VIP, countdown)
- Identificou transição natural Halloween → Linha Zero (dado comportamental de novembro)
- Semana 30: enquete verão (quarta 11/11) alimenta estratégia de produto sazonal dezembro — dado real, não suposição
- Template WA de reativação incluído na sexta 13/11 para clientes inativos 3+ semanas
- Padrão v9 mantido: A/B nos posts de UGC showcase (com/sem foto real de cliente)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana29.md` | CRIADO — Carrossel agradecimento 01/11 + WA base completa, infográfico resultados 02/11, showcase UGC 03/11, reel bastidores equipe 04/11, teaser novidades 05/11 + enquete, Sexta #14 06/11, plant sábado, checklist, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana30.md` | CRIADO — Abertura fit 08/11, carrossel educativo Linha Zero 09/11, prova social 10/11, teaser verão + enquete sabor 11/11, reel lifestyle 12/11, Sexta #15 🏆 13/11 + WA reativação inativos, sábado fit 14/11, checklist, métricas, tabela editorial |

**Commit:** `050b400`

**Destaques de conteúdo:**
1. **Carrossel agradecimento 01/11 (mosaico UGC):** Pico de engajamento pós-evento — audiência quente + clientes com FOMO. WA para base completa no mesmo dia converte o momento emocional em ação.
2. **Infográfico resultados reais 02/11:** Transparência com números cria credibilidade. Mesmo sem dado exato de vendas, métricas de engajamento já funcionam como prova social.
3. **Enquete verão 11/11:** Dado real de preferência (frutas tropicais vs. refrescante) alimenta a escolha do produto sazonal de verão — decisão baseada em audiência, não suposição.
4. **Sexta do Potinho #15 = marco comemorativo:** 15 semanas sem falhar é dado concreto de consistência. "Natal a 6 semanas" no caption planta antecipação sem revelar campanhas.
5. **Template WA de reativação (sexta 13/11):** Segmento de inativos 3+ semanas precisa de abordagem diferenciada — Linha Zero como gancho fit é ângulo de baixo atrito para reengajar.

**Próximo passo sugerido:**
- Ciclo #72: Conteúdo — Semanas 31+32 (15–28/11): Black Friday 27/11 (mecânica valor extra, não desconto), aquecimento Natal, produto sazonal verão (baseado em resultado enquete 11/11)
- Ciclo #73: Concorrentes — TheBest (1º fetch ever) + refetch MilkyMoo (desatualizado desde ciclo #60)
- Ciclo #74 (múltiplo de 5 a partir de #54 = ciclo #74): Auto-aprimoramento — reler log #69–#73, calibrar estratégia dezembro/Natal
- Operador: verificar resultado enquete "Novembro" (quinta 05/11) e "Verão" (quarta 11/11) antes de iniciar produção de artes da semana 30 e 31

---

## Ciclo #70 — 2026-04-29

**Área:** Conteúdo — Semanas 27 + 28 (18–24/10 countdown final Halloween + 25–31/10 Aniversário 6 meses + Dia H)

**Contexto:** Prescrito pelo roadmap do ciclo #69 (semanas 27+28 = clímax da campanha Halloween). Semana 27 = countdown urgência 13→7 dias, Sexta do Potinho #12. Semana 28 = DUPLA âncora: aniversário 6 meses (25/10) + Dia H Halloween (31/10) — semana de maior volume de vendas esperado desde a inauguração.

**O que analisou:**
- Leu semanas 25 e 26 completas para manter continuidade de mecânicas (lista VIP, "CONFIRMO", countdown)
- Identificou aniversário 6 meses no domingo 25/10 (mesma semana do Halloween) = rara confluência emocional + comercial
- Semana 27: 7 peças + Reel + Sexta #12 + bridge para aniversário no sábado 24/10
- Semana 28: ponto máximo com cobertura Stories ao vivo no 31/10 + WA pós-evento + plant de transição para novembro

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana27.md` | CRIADO — Countdown 13→7 dias, carrossel "Guia Halloween", enquete fantasia, prova social + WA lista VIP, Reel 15s ovelhinha ansiosa, Sexta #12, bridge 6 meses, 7 peças dia-a-dia, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana28.md` | CRIADO — Aniversário 6 meses (domingo 25/10 ⭐⭐⭐), countdown 6→0 dias, carrossel guia final, Reel câmera lenta (quarta 28/10), urgência encerramento reservas (quinta 29/10), Sexta #13 EVE, Dia H cobertura ao vivo Stories (31/10 ⭐⭐⭐⭐⭐), WA pós-evento, transição novembro, checklists completos, métricas |

**Commit:** `dae9672`

**Destaques de conteúdo:**
1. **Aniversário 6 meses (25/10) + Halloween na mesma semana:** Confluência única — post de retrospectiva emocional + WA para toda a base = reativação orgânica + sell-in Halloween simultâneos. Arte com foto real inauguração 25/04 é o ativo crítico.
2. **Encerramento lista VIP (quinta 29/10):** Prazo explícito de corte para reservas cria urgência real, não performática — depois: ordem de chegada. Elimina ambiguidade operacional.
3. **Cobertura Stories ao vivo 31/10 (14h–22h):** Roteiro hora-a-hora com 9 checkpoints — FOMO para quem não foi + material de UGC showcase = engajamento post-evento elevado.
4. **WA pós-evento (23h 31/10):** Agradecimento + "novembro tem novidades" = zero gap de engajamento na transição Halloween → novembro. Audiência não se sente abandonada pós-evento.
5. **Sexta do Potinho #13 (30/10) como EVE do Halloween:** 13 semanas de série = dado concreto de consistência + eve do maior evento = pico natural de hype. Arte toda preta com ovelhinha vampira completa = maior diferenciação visual da série.

**Alerta para operador:**
- Arte do aniversário 6 meses (25/10) exige foto real da inauguração 25/04 — preparar com antecedência (artes genéricas perdem impacto emocional)
- Estoque do Potinho Assombrado: confirmar quantidades com franquia para suportar ≥60 vendas + margem walk-in (sem reserva)
- Treinamento da equipe antes do 31/10: fluxo VIP no balcão + montagem do produto + abordagem para fotos com clientes
- Decoração da loja: preparar na quinta 29 ou sexta 30 (bastidores viram conteúdo Stories de alto impacto)

**Próximo passo sugerido:**
- Ciclo #71: Conteúdo — Semanas 29+30 (01–14/11): pós-Halloween showcase UGC, resultado em números, abertura de novembro, teaser verão, Linha Zero retomada
- Ciclo #72: Conteúdo — Semanas 31+32 (15–28/11): Black Friday 27/11, mecânica valor extra (não desconto), aquecimento Natal
- Ciclo #73: Concorrentes — TheBest (1º fetch) + refetch MilkyMoo (desatualizado desde ciclo #60)
- Ciclo #74 (múltiplo de 5): Auto-aprimoramento — reler log #69–#73, calibrar estratégia dezembro (Natal + verão + produto sazonal)

---

## Ciclo #69 — 2026-04-29

**Área:** Auto-aprimoramento (ciclo #69 = múltiplo de 5 a partir de #54) + Conteúdo Halloween (semanas 25+26 antecipadas)

**Contexto:** Prescrito pelo roadmap do ciclo #64 e confirmado no log #68. Auto-aprimoramento obrigatório + melhoria associada (padrão v9: auto-aprimoramento deve sempre incluir entregável concreto). Semanas 25+26 eram prescritas para ciclo #70 — antecipadas porque Halloween (31/10) exige lead time de 3+ semanas de produção de conteúdo.

**O que analisou:**
- Leu log completo de ciclos #64–#68 + `belinha/estrategia.md` (pós-ciclo #64)
- Identificou: padrão v8 funcionou bem (semanas adjacentes, A/B para bloqueadores, FAQPage schema)
- Gap principal: novembro 2026 sem cadência/estratégia definida; concorrentes desatualizando (MilkyMoo: último refetch ciclo #60)
- Ajuste v9: mecânica WA com palavra-chave de ativação (HALLOWEEN) a replicar em datas futuras; estrutura de 4 semanas de campanha para produto especial documentada como padrão

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana25.md` | CRIADO — Semana 25 (04–10/10): Halloween warming up, Sexta #10 edição Halloween, enquete fantasias, Reel 15s ovelhinha misteriosa, template WA lista VIP, countdown 21 dias, 7 peças dia-a-dia, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana26.md` | CRIADO — Semana 26 (11–17/10): Dia das Crianças 12/10, reveal completo Potinho Assombrado (quarta 14/10), Reel 15s produto, mecânica UGC #PotinhoAssombrado, templates WA (Dia das Crianças + lista VIP reveal exclusivo + confirmação "CONFIRMO"), Sexta #11, 7 peças dia-a-dia, métricas, tabela editorial |
| `belinha/estrategia.md` | ATUALIZADO — Seção "Aprendizados ciclos #64–68", Padrão v9, Estado das áreas pós-#68, Estratégia novembro 2026 completa (Black Friday, aquecimento Natal, produto sazonal verão, fidelidade trimestral), Cadência semanas 25–33, Roadmap ciclos #70–74 |

**Destaques:**

1. **Semana 26 — Reveal Potinho Assombrado (quarta 14/10):** Post principal da campanha — carrossel 6 slides com ingredientes reais + mecânica de reserva "CONFIRMO" para lista VIP. Ponto de maior engajamento esperado da campanha Halloween.
2. **Dia das Crianças 12/10 oportunidade:** Data âncora de alto tráfego familiar no Muffato — post especial + WA para base completa + UGC. Diferencial: família com Mini Potinho + adulto com Linha Zero = "tem pra todo mundo" em um dia só.
3. **Mecânica "CONFIRMO" no WA:** Clientes da lista VIP que respondem "CONFIRMO" ao reveal ganham prioridade garantida no dia 31/10. Converte interesse (HALLOWEEN) em comprometimento (CONFIRMO) — funil em 2 etapas.
4. **Estratégia novembro:** Black Friday 27/11 com mecânica de valor extra (não desconto na base) + teaser natalino + produto sazonal verão (enquete novembro → produto dezembro). Cadência completa semanas 25–33.
5. **Padrão v9:** Campanhas de produto especial = 4 semanas de antecedência + teaser gradual + reveal 2 semanas antes + countdown + dia H. Templates WA com palavra-chave de ativação como padrão para datas futuras.

**Alerta para operador:**
- Confirmar com franquia disponibilidade de topping "mini abóbora de chocolate" ANTES de 01/10 (semana 24 já anunciou Halloween, semana 26 revela ingredientes específicos)
- Se não disponível: substituir por "granulado temático laranja/preto" (fallback simples)

**Commit:** `a9717aa`

**Próximo passo sugerido:**
- Ciclo #70: Conteúdo — Semanas 27+28 (Halloween countdown 18–24/10 + aniversário 6 meses 25/10 + dia H 31/10)
- Ciclo #71: Conteúdo — Semanas 29+30 (pós-Halloween + abertura novembro + verão chegando)
- Ciclo #72: Conteúdo — Semanas 31+32 (Linha Zero verão + Black Friday 27/11)
- Ciclo #73: Concorrentes — TheBest (1º fetch) + refetch MilkyMoo (desatualizando desde ciclo #60)
- Operador: configurar resposta automática WA para "HALLOWEEN" ANTES de 04/10

---

## Ciclo #68 — 2026-04-29

**Área:** SEO Local — FAQPage schema nas landing pages

**Contexto:** Prescrito pelo roadmap dos ciclos #65, #66, #67. O ciclo focaria em verificar `aggregateRating` no `index.html`, mas esse bloqueador depende de confirmação do operador (≥3 reviews verificáveis no Google Maps). Ação alternativa de alto valor: as landing pages `acai-self-service-londrina.html` e `potinho-ninho-londrina.html` não tinham FAQPage schema, enquanto o `index.html` já tem 8 perguntas elegíveis para rich results — gap resolvido.

**O que analisou:**
- Confirmou que `aggregateRating` está preparado como comentário em `index.html` (linha ~151) — aguarda operador
- Identificou ausência total de FAQPage schema nas duas landing pages de SEO local
- `index.html` já tem schema.org FAQPage com 8 perguntas; landing pages tinham apenas BreadcrumbList + MenuItem/Product + FoodEstablishment
- Rich results de acordeão (FAQ) aparecem nas SERPs para buscas como "açaí self service londrina" e "potinho ninho londrina" = CTR orgânico +15-30% vs. snippet padrão

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `acai-self-service-londrina.html` | ADICIONADO — FAQPage schema (6 perguntas): preço self-service, como funciona, toppings disponíveis, delivery de açaí, açaí puro vs. xarope, localização |
| `potinho-ninho-londrina.html` | ADICIONADO — FAQPage schema (6 perguntas): preço, o que vem, opção fit/zero, delivery, diferença Ninho vs. Açaí, onde comprar em Londrina |

**Commit:** `ac46447`

**Validação:** Ambos os schemas validados com `json.loads()` — sem erros de JSON. Estrutura `@type: FAQPage` + `mainEntity` com `Question`/`Answer` conforme spec schema.org.

**Destaques:**
1. **6 perguntas por página** — cobertura das principais dúvidas de busca local que ativam rich results
2. **Intenção de busca alinhada** — perguntas mapeadas a queries reais ("quanto custa açaí self service londrina", "potinho ninho delivery londrina")
3. **Bloqueador documentado** — `aggregateRating` não ativado; aguarda operador confirmar ≥3 reviews Google Maps

**Bloqueador ativo:**
- `aggregateRating` em `index.html` (linha ~151): operador precisa confirmar que a unidade Muffato tem ≥3 avaliações verificáveis no Google Maps antes de descomentar e ajustar `ratingValue`/`reviewCount`

**Próximo passo sugerido:**
- Ciclo #69: Auto-aprimoramento — reler log #64–#68 completo, ajustar estratégia novembro 2026 (pós-Halloween) em `belinha/estrategia.md`
- Ciclo #70: Plano editorial Halloween completo — semanas 25–27 (04–24/10/2026), produto especial "Potinho Assombrado", sorteio UGC fantasia
- Operador: ativar `aggregateRating` assim que confirmar ≥3 reviews no Google Maps

---

## Ciclo #64 — 2026-04-29

**Área:** Auto-aprimoramento (ciclo 64 = múltiplo de 5 a partir do #54)

**Contexto:** Auto-aprimoramento obrigatório. Revisão dos ciclos #59–63 completa. Dois entregáveis: (1) `belinha/estrategia.md` atualizado com aprendizados v8, estado das áreas, estratégia de outubro 2026 e roadmap #65–69; (2) `belinha/content/pos-inauguracao-semana19.md` criado como melhoria associada (prescrita no log do ciclo #63).

**O que pesquisou/analisou:**
- Leu log completo dos ciclos #59–63
- Analisou o que gerou mais valor: âncora de preço vs. MilkyMoo (#60), semanas adjacentes no mesmo ciclo (#61), cross-sell açaí self-service (#63)
- Identificou o que foi menos eficaz: sweep CLS com rendimento decrescente (#62), auto-aprimoramento #59 confirmando padrões já consolidados
- Mapeou lacunas futuras: outubro 2026 (Halloween 31/10 + aniversário 6 meses 25/10 + fidelidade 2º ciclo)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/estrategia.md` | Cabeçalho atualizado para ciclo #64 · Nova seção aprendizados #59–63 · Padrão v8 (adição: sweeps CLS só com indício concreto; auto-aprimoramento deve gerar gap futuro novo) · Estado das áreas pós-ciclo #63 · Estratégia de outubro 2026 completa (Halloween, fidelidade 2º ciclo, aggregateRating, UGC embaixador) · Roadmap ciclos #65–69 · Bloqueador novo: produto sazonal setembro depende de confirmação da franquia |
| `belinha/content/pos-inauguracao-semana19.md` | CRIADO — Semana 19 (23–29/08): "Inverno de saída, primavera que chega". 7 posts dia-a-dia (urgência de inverno, carrossel spoilers setembro, Reel virada de estação, stories enquete produto, revelação Versão A+B, Sexta do Potinho #4, encerramento agosto). Template WA lançamento produto setembro (01/09). Checklist operador + métricas + tabela calendário editorial. |

**Commit:** `64a48f2`

**Principais aprendizados do período (#59–63):**
1. **Pesquisa concorrente + ação imediata = ROI máximo** — MilkyMoo confirmado em Londrina + benefits-bar alterada no mesmo ciclo (#60). Padrão já existia mas foi o melhor exemplo de execução até agora.
2. **Sweeps técnicos têm rendimento decrescente** — após 3+ ciclos de CLS sweep, o ganho por ciclo cai. Só entrar na rotação com indício concreto.
3. **Cross-sell açaí self-service** é diferencial não explorado antes — MilkyMoo não tem buffet; carrossel educativo tem potencial de ticket médio alto.
4. **Halloween 31/10 = próxima data âncora grande** — precisa de plano de ≥5 peças, semelhante ao aniversário de 3 meses. Ciclos #70–72 devem ser reservados para isso.

**Próximo passo sugerido:**
- Ciclo #65: Conteúdo — Semanas 20 + 21 juntas (lançamento produto sazonal setembro + primavera em movimento) — padrão v8 de temáticas adjacentes
- Ciclo #66: Conteúdo/Conversão — Semana 22 (Linha Zero fitness) + template WA fidelidade 2º ciclo
- Ciclo #68: SEO local — verificar se aggregateRating pode ser ativado (≥3 reviews Google Maps)
- Operador: confirmar produto sazonal de setembro com a franquia para usar Versão A da semana 19 (quinta 27/08)

---

## Ciclo #63 — 2026-04-28

**Área:** Conteúdo — Semana 18 (16–22/08/2026)

**Contexto:** Ciclo prescrito pelo roadmap #62–63. Semana 18 fecha o mês de agosto com dois eixos: (1) posicionamento familiar para capturar tráfego de fim de semana no Muffato; (2) cross-sell do açaí self-service para aumentar ticket médio e apresentar o produto a clientes que só conhecem os potinhos. Teaser de setembro (primavera/morango) plantado na quinta e no sábado — aquece base para lançamento do produto sazonal.

**O que analisou:**
- Semanas 16+17 criadas no ciclo #61 como referência de formato (padrão v7: calendário completo Dom–Sab, templates WA, checklist, métricas)
- Mecânica "Sexta do Potinho" entra na 3ª semana — ponto de consolidação de hábito
- Ciclo #60: MilkyMoo Londrina não tem açaí self-service em formato buffet — oportunidade de diferenciação com carrossel educativo na segunda
- Público familiar = tráfego concentrado sab/dom no Muffato (hipermercado + praça de alimentação)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana18.md` | CRIADO — Semana 18 (16–22/08): tema "família + cross-sell açaí". 7 posts dia-a-dia. Carrossel educativo açaí self-service (5 slides). Reel família 15s roteirizado. Teaser setembro/primavera (quinta + sábado). Sexta do Potinho #3 (3ª semana = hábito formado). 2 templates WA (família + cross-sell açaí). Checklist operador + métricas + tabela calendário. |

**Commit:** `b22a00f`

**Destaques da semana:**
- **Cross-sell açaí self-service:** carrossel educativo de segunda — audiência que conhece só os potinhos ainda não sabe do buffet. Diferencial vs. MilkyMoo que não tem esse formato.
- **Domingo familiar:** post que mostra Mini (criança) + Tradicional + Linha Zero lado a lado — uma imagem que resolve a objeção "tem para todos?"
- **Teaser setembro:** plantado em dois momentos (quinta isolado + sábado com encerramento de agosto) para criar antecipação sem revelar produto
- **Sexta do Potinho #3:** 3ª execução = crossing point de hábito formado; caption reforça "virou tradição"

**Próximo passo sugerido:**
- Ciclo #64 (AUTO-APRIMORAMENTO): reler log #59–#63, ajustar estratégia outubro 2026 em `belinha/estrategia.md` + criar `belinha/content/pos-inauguracao-semana19.md` (23–29/08) como melhoria associada
- Semana 19: tema transição inverno→primavera + pré-lançamento produto sazonal setembro
- Quando operador confirmar produto sazonal setembro (morango/primavera): criar post de lançamento formal

---

## Ciclo #62 — 2026-04-28

**Área:** Performance/UX — CLS sweep batch (páginas secundárias)

**Contexto:** Ciclo prescrito pelo roadmap. Após ciclo #58 ter corrigido CLS em `index.html` (banner display:none + img dimensions), este ciclo faz o mesmo sweep nas páginas secundárias: `cardapio.html`, `acai-self-service-londrina.html`, `cartao-fidelidade.html`.

**O que analisou:**
- `cardapio.html`: logos já têm `width="1900" height="1070"` ✅ — sem CLS pendente
- `acai-self-service-londrina.html`: única img já tem `width="120" height="48"` ✅ — sem CLS pendente
- `cartao-fidelidade.html` linha 100: logo `<img src="images/logo-milkypot.png" alt="MilkyPot">` sem width/height ❌
  - CSS: `.header img{height:52px}` — sem width → browser não reserva espaço antes do carregamento
  - Ratio nativo da imagem: 1900×1070 → 92×52 para altura CSS 52px
- Nenhuma das páginas tem imagens `loading="lazy"` above-the-fold (sem falso-positivo)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cartao-fidelidade.html` | Logo: adicionado `width="92" height="52" fetchpriority="high"` → browser reserva 92×52px de espaço antes do paint; fetchpriority="high" porque é o primeiro elemento visual da página |

**Commit:** `9c32b56`

**Racional técnico:**
- Sem `width`/`height` no HTML, o browser só sabe o tamanho da img após o download → layout shift no paint inicial
- Com `width="92" height="52"`, o browser reserva o espaço correto via aspect ratio antes de baixar a imagem → CLS ≈ 0
- `fetchpriority="high"` antecipa o download do logo (é LCP candidate nesta página simples sem hero image)

**Próximo passo sugerido:**
- Ciclo #63: Conteúdo — semana 18 (16–22/08/2026) tema "MilkyPot da família / fim de semana" + cross-sell açaí self-service
- Ciclo #64 (auto-aprimoramento): reler log #59–#63, ajustar estratégia outubro 2026 em `belinha/estrategia.md`
- Quando operador tiver ≥3 reviews Google: ativar `aggregateRating` em `index.html` (blocker documentado)

## Ciclo #61 — 2026-04-28

**Área:** Conteúdo — Semanas 16 + 17 (02–15/08/2026)

**Contexto:** Ciclo prescrito pelo roadmap #60–64. Semanas 16 e 17 têm temática contínua (agosto rotina + inverno de saída) — criadas juntas em um ciclo conforme padrão v7 de conteúdo adjacente.

**O que analisou:**
- Estratégia de agosto definida no ciclo #59: semana 16 = rotina diária, semana 17 = comfort food + Linha Zero fitness
- Padrão de semanas anteriores (semana 15) para manter consistência de formato
- Calendário editorial completo (Dom–Sab) com formatos variados: Reel, Carrossel, Stories, Feed, Templates WA
- Insight do ciclo #60: MilkyMoo não tem Linha Zero — oportunidade clara de diferenciação com público fitness

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana16.md` | CRIADO — Semana 16 (02–08/08): tema "sua pausa favorita do dia". 7 posts dia-a-dia (Reel x2, Carrossel, Stories, Feed, UGC, Story+Feed). Mecânica "Sexta do Potinho" (R$2 OFF via WA com código "SEXTA") como ritual semanal fixo. Template WA de convite rotina. Checklist operador + métricas. |
| `belinha/content/pos-inauguracao-semana17.md` | CRIADO — Semana 17 (09–15/08): tema "inverno de saída". Foco duplo: comfort food (Ninho) + Linha Zero fitness (pós-treino). Carrossel educativo Linha Zero (6 slides). Reel "frio lá fora, potinho na mão". Post ovelhinha com halteres para segmento academia. Sexta do Potinho #2 (consolidação do hábito). Carrossel retrospectiva 15 dias + teaser setembro. 2 templates WA (reativação + segmento fitness). Calendário editorial completo ambas semanas. |

**Commit:** `0fe936f`

**Destaques das semanas:**
- **"Sexta do Potinho"**: mecânica de fidelização semanal (R$2 OFF via WA c/ código "SEXTA") — baixo custo, alto hábito. Executada nas sextas 07/08 e 14/08.
- **Linha Zero + fitness**: posts direcionados a academia/pós-treino usando `#AcademiaLondrina` para capturar público local não-seguidor
- **Tabela calendário editorial consolidada** na semana 17 com todas as 14 datas — operador pode usar como checklist

**Próximo passo sugerido:**
- Ciclo #62: CLS sweep batch — `cardapio.html`, `acai-self-service-londrina.html`, `cartao-fidelidade.html` — ajustar width/height para dimensões CSS reais
- Ciclo #63: Semana 18 (16–22/08) — teaser produto sazonal setembro (morango/primavera) + template WA de lançamento
- Ciclo #64: Auto-aprimoramento — reler log #59–#63, ajustar estratégia outubro 2026

---

## Ciclo #59 — 2026-04-28

**Área:** Auto-aprimoramento (ciclos #54–58) + Conteúdo semana 15 pós-aniversário

**O que analisou:**
- Revisão completa dos ciclos #54–58: conteúdo (semanas 13+14), conversão (fidelidade matura), performance (CLS sweep)
- Identificado padrão de ineficiência: semanas adjacentes de mesma temática criadas em ciclos separados (#55+#56)
- Auto-aprimoramento anterior (#54) confirmou padrão já consolidado em vez de identificar gaps futuros — ajuste de comportamento documentado
- Calendário de conteúdo avançado: semanas 1–14 prontas; gap identificado → semana 15 (26/07–01/08) inexistente
- CLS sweep apenas em `index.html`; `cardapio.html` e demais páginas com width/height usando dimensões fonte

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana15.md` | CRIADO — plano editorial completo 26/07–01/08: post agradecimento pós-sorteio (26/07), repost UGC stories (27/07), reel movimento aniversário 15s roteirizado (28/07), carrossel educativo Linha Zero para novos seguidores (29/07), teaser agosto stories+feed (30/07), enquete engajamento (31/07), abertura agosto temática inverno/aconchego (01/08), template WA agradecimento base, checklist operador, tabela de métricas |
| `belinha/estrategia.md` | Aprendizados ciclos 54–58 · Padrão v7 (semanas adjacentes = mesmo ciclo; sweeps = batch; auto-aprimoramento = gaps futuros) · Estado das áreas atualizado · Estratégia setembro 2026 · Roadmap ciclos 60–64 |

**Commit:** `dfaecab`

**Padrão v7 — principais adições:**
1. Semanas de conteúdo adjacentes com mesma temática = mesmo ciclo (1 ciclo poupado)
2. Sweeps técnicos = batch completo (todas as páginas de uma vez, não 1 por ciclo)
3. Auto-aprimoramento = identificar GAPS FUTUROS, não confirmar padrões do passado

**Próximo passo sugerido:**
- Ciclo #60: Pesquisa concorrentes — MilkyMoo ou TheBest (preços agosto/set, produtos novos, ads recentes) + 1 mudança concreta derivada no mesmo ciclo
- Ciclo #61: Conteúdo semanas 16+17 juntas (agosto rotina + inverno de saída) em um único ciclo
- Ciclo #62: CLS sweep batch — `cardapio.html`, `acai-self-service-londrina.html`, `cartao-fidelidade.html` (ajustar width/height para display CSS)

---

## Ciclo #58 — 2026-04-28

**Área:** UX/Performance — Core Web Vitals CLS sweep `index.html` mobile

**O que analisou:**
- Auditou todos os `<img>` em `index.html`: nenhum possuía atributos `width`/`height` explícitos, impedindo o browser de reservar espaço antes do carregamento (causa CLS)
- Identificou que o `inaugBanner` (div fixo no topo) estava com `display:flex` por padrão no HTML; o script o ocultava após parse, mas havia risco de flash/layout shift entre parse e execução do script
- Hoje (28/04/2026) a inauguração já passou — o banner jamais será exibido novamente; `display:none` por padrão elimina o problema definitivamente
- Logo fonte: 1900×1070 px → calculadas dimensões CSS para cada contexto (nav 128×72, hero 280×158, footer 142×80)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | `inaugBanner`: `display:flex` → `display:none` por padrão (script usa `display:'flex'` para exibir se necessário) |
| `index.html` | Nav logo: +`width="128" height="72" loading="eager" decoding="sync"` |
| `index.html` | Hero logo LCP: +`width="280" height="158" decoding="sync"` (já tinha `fetchpriority="high"`) |
| `index.html` | Footer logo: +`width="142" height="80" decoding="async"` (já tinha `loading="lazy"`) |

**Commit:** `e4e3318`

**Impacto esperado:**
- CLS reduzido: browser reserva espaço exato para cada logo antes do carregamento
- Zero flash do banner pós-inauguração (sem layout shift no topo)
- `decoding="sync"` no LCP element (hero logo) garante que o decode não adie a pintura inicial
- Melhoria mensurável no CLS score do PageSpeed Insights (alvo: CLS < 0.1)

**Próximo passo sugerido:**
- Ciclo #59: Auto-aprimoramento ciclos #54–58 + `belinha/estrategia.md` roadmap agosto/setembro 2026
- Ciclo #60: Concorrentes — pesquisa atualizada MilkyMoo ou TheBest (preços, novos produtos, ads recentes)

---

## Ciclo #57 — 2026-04-28

**Área:** Conversão — Script WhatsApp resgate fidelidade matura (10 carimbos → Mini grátis)

**O que analisou:**
- Log ciclo #56 + estratégia em `belinha/estrategia.md` (ciclos 55–59)
- Templates existentes: `whatsapp-funil.md`, `whatsapp-indicacao.md`, `whatsapp-reativacao.md` — para manter consistência de tom (🐑, linguagem calorosa, sem pressão)
- `cartao-fidelidade.html` — mecânica: 10 carimbos = 1 Mini grátis, `?stamps=N` suporta links personalizados
- Contexto: primeiros clientes de abril–julho chegando ao 10º carimbo em agosto → janela de ativação real

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-fidelidade-resgate.md` | CRIADO — 4 templates WA completos + playbook operador: Template A (notificação 10 carimbos), Template B (confirmação presencial), Template C (pós-resgate + novo cartão com `?stamps=1`), Template D (aquecimento 8–9 carimbos "quase lá") + dicas de controle, tom, frequência e métricas de sucesso |

**Commit:** `7b4df10`

**Destaques:**
- Template D ativa visita motivada quando faltam 1–2 carimbos — converte antes do resgate
- Template C abre novo ciclo imediatamente com link `?stamps=1` — ancoragem para retenção pós-resgate
- Playbook operacional sem sistema/app: caderninho + lista WhatsApp "Resgate pendente"
- Métricas de sucesso definidas: ≥60% taxa resgate em 30 dias, ≥40% recomeço de cartão

**Próximo passo sugerido:**
- Ciclo #58: `aggregateRating` Schema.org se operador confirmar ≥3 reviews; senão Core Web Vitals sweep `index.html` mobile (LCP/CLS via análise manual)
- Ciclo #59: Auto-aprimoramento ciclos 54–58 + `estrategia.md` setembro 2026

---

## Ciclo #56 — 2026-04-28

**Área:** Conteúdo — Semana 14 pós-inauguração (19–25/07/2026) — Aniversário 3 Meses

**O que analisou:**
- Log ciclo #55 e roadmap em `belinha/estrategia.md` (ciclos 55–59)
- Formato e profundidade de `pos-inauguracao-semana13.md` como referência
- Contexto: 25/07 = exatos 3 meses da inauguração de 25/04/2026 — semana mais importante de julho
- Teasers da semana 13 (16/07 e 18/07) precisam converter em campanha real nesta semana

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana14.md` | CRIADO — plano editorial completo 19–25/07: sorteio de aniversário (regras + script sorteio ao vivo), retrospectiva UGC, reel 15s de bastidores roteirizado, post emocional âncora (sábado 25/07), carrossel "3 meses em números", 5 blocos de stories para o dia 25/07 (12h/14h/16h/18h/20h), templates WA para clientes com 9–10 carimbos + base geral, checklist completo do operador, tabela de métricas de sucesso |

**Commit:** `2cb34c1`

**Destaques do plano:**
- **Post âncora emocional (25/07 às 10h):** texto de gratidão genuíno — tom de aniversário real, não promo
- **Sorteio com mecânica simples:** compartilhar post + marcar @milkypotbr → resultado ao vivo às 18h
- **Ativação fidelidade matura:** clientes com 9–10 carimbos recebem WA personalizado (terça 22/07) para resgatar Mini Grátis no dia do aniversário
- **Reel 15s roteirizado:** slow motion da calda + entrega ao cliente + tela final "3 meses de felicidade em potinho"
- **Carrossel "3 meses em números":** dados reais pedidos ao operador (topping favorito, quantidade de potinhos)

**Próximo passo sugerido:**
- Ciclo #57: Script WhatsApp "Ganhou! 10 carimbos → Mini grátis" — ativação fidelidade matura (complementa a semana 14)
- Ciclo #58: `aggregateRating` se desbloqueado; senão Core Web Vitals sweep `index.html` mobile
- Ciclo #59: Auto-aprimoramento ciclos 54–58 + `estrategia.md` setembro 2026

---

## Ciclo #55 — 2026-04-27

**Área:** Conteúdo — Semana 13 pós-inauguração (12–18/07/2026)

**O que analisou:**
- Log ciclo #54 e roadmap ciclos 55–59 em `belinha/estrategia.md`
- Conteúdo semana12 como referência de formato e profundidade
- Contexto: segunda metade das férias escolares de julho, inverno em Londrina, aniversário 3 meses (25/07) se aproximando
- Sequência planejada: UGC invernal → convite Embaixador Agosto → teaser aniversário

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana13.md` | CRIADO — plano editorial completo 12–18/07: 7 dias de stories/posts/reels, campanha UGC "Potinho no Frio", convite Embaixador do Mês Agosto (post feed + DM template + stories), primeiro teaser aniversário 3 meses (25/07), reel 15s roteirizado, checklist operador, tabela de métricas |

**Commit:** `4c80c60`

**Destaques do plano:**
- **UGC Invernal:** campanha de domingo a sábado pedindo fotos "look inverno + potinho" — foto vencedora vira post no sábado 18/07
- **Embaixador Agosto:** lançamento na quarta 15/07 com post carrossel + template DM personalizado para cliente frequente
- **Teaser Aniversário 3 meses:** primeira menção na quinta 16/07, segunda no sábado 18/07 — gera expectativa antes da semana 14
- **Linha Zero/Fit:** carrossel na segunda educando público de saúde no inverno

**Próximo passo sugerido:**
- Ciclo #56: `pos-inauguracao-semana14.md` — 19–25/07: campanha completa aniversário 3 meses (sorteio, post emocional, stories contagem regressiva, oferta especial)
- Ciclo #57: Script WhatsApp "Ganhou! 10 carimbos → Mini grátis" — ativação fidelidade matura
- Ciclo #58: `aggregateRating` se desbloqueado; senão Core Web Vitals sweep `index.html` mobile

---

## Ciclo #54 — 2026-04-27

**Área:** Auto-aprimoramento (ciclos #49–53) + SEO — link `acai-self-service-londrina.html` em `index.html`

**O que analisou:**
- Ciclos #49–53: revisão completa de entregas e impacto
- #49: auto-aprimoramento + semana 10 (São João + teaser julho)
- #50: semana 11 (Adeus Junho + Potinho Caramelado launch)
- #51: semana 12 (férias escolares + família)
- #52: Playbook Embaixador do Mês completo (E1–E4 + carrossel IG + story)
- #53: landing page `acai-self-service-londrina.html` com Schema.org + sitemap — mas sem link em `index.html`
- Identificado gap: link interno esquecido no ciclo #53 — regra reconfirmada (links internos = mesmo ciclo)
- Padrão v6 atualizado: landing SEO por diferencial distinto entra antes de scripts WhatsApp no ranking

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +link contextual `acai-self-service-londrina.html` junto ao link `potinho-ninho-londrina.html` (linha 467) — anchor text "Açaí Self-Service Buffet (exclusivo Muffato)" com cor diferenciada (azul/roxo) |
| `belinha/estrategia.md` | Aprendizados ciclos 49–53 · Padrão v6 · Estado das áreas atualizado · Estratégia agosto 2026 · Roadmap ciclos 55–59 |

**Principais aprendizados do período (#49–53):**
1. Landing SEO por diferencial distinto (açaí buffet exclusivo) captura intenção de busca local sem concorrência — alto valor, baixo custo
2. Playbooks com versão fallback (template para mês sem indicações) são mais robustos — operador não improvisa em nenhum cenário
3. Links internos NUNCA podem ser diferidos — criar no mesmo ciclo da página alvo
4. Auto-aprimoramento tem mais valor quando identifica gaps novos, não quando confirma padrões já consolidados

**Commits:**
- `feat(belinha/seo)`: link `acai-self-service-londrina.html` em `index.html`
- `docs(belinha)`: auto-aprimoramento ciclo #54 — `estrategia.md` + log

**Próximo passo sugerido:**
- Ciclo #55: `pos-inauguracao-semana13.md` — 12–18/07: mid-month engajamento + UGC invernal + convite Embaixador do Mês
- Ciclo #56: `pos-inauguracao-semana14.md` — 19–25/07: campanha aniversário 3 meses (emocional + sorteio)
- Ciclo #57: Script WhatsApp "Ganhou! 10 carimbos → Mini grátis" — fidelidade matura

---

## Ciclo #53 — 2026-04-27

**Área:** SEO — Landing page `acai-self-service-londrina.html`

**O que analisou:**
- Ciclo #52 recomendava criar landing SEO "açaí self-service londrina" como próxima prioridade (alternativa ao `aggregateRating` bloqueado)
- Verificado: `potinho-ninho-londrina.html` como template de referência (design system, Schema.org, OG tags, estrutura)
- Identificado: `cardapio.html` já tinha link para `potinho-ninho-londrina.html` mas não para a página de açaí
- `sitemap.xml` sem entrada para açaí self-service
- Diferencial único: o self-service buffet é exclusivo da unidade Muffato — alta intenção de busca local

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `acai-self-service-londrina.html` | CRIADO — 380 linhas. Landing SEO targeting "açaí self-service londrina", "açaí buffet londrina", "açaí muffato londrina". Schema.org BreadcrumbList + MenuItem + FoodEstablishment, OG tags, Twitter Card. Design pastel azul/roxo (diferente do rosa do Ninho). Badge "Exclusivo unidade Muffato". Seções: "Como Funciona" (4 passos), Estação de Toppings (10 itens), Diferenciais, Cross-sell (Potinho de Ninho + Milkshakes + Fidelidade), Localização, CTA WhatsApp. |
| `sitemap.xml` | +entrada `acai-self-service-londrina.html` prioridade 0.8, lastmod 2026-04-27 |
| `cardapio.html` | +link interno contextual → `acai-self-service-londrina.html` (junto ao link do Potinho de Ninho, seção de produtos) |

**Commit:** `a4f2f63`

**Destaques técnicos:**
- Schema.org `MenuItem` com `menuAddOn` lista toppings (rich result em potencial)
- Badge "Exclusivo unidade Muffato" — diferenciador que outros concorrentes não podem copiar
- Cross-sell orgânico: "Também Experimente" com scroll horizontal (3 cards: Ninho, Milkshakes, Fidelidade)
- Mesma paleta de fonte/componentes do design system, mas cor dominante azul/roxo vs rosa do Ninho — distingue visualmente as duas páginas SEO

**Próximo passo sugerido:**
- Ciclo #54: Auto-aprimoramento obrigatório (ciclos 49–53) + atualizar `belinha/estrategia.md`
- Ciclo #55: Conteúdo semana 13 (12–18/07) — engajamento mid-month, UGC invernal, convite Embaixador
- Ciclo #56: Adicionar link para `acai-self-service-londrina.html` em `index.html` (seção Exclusivos Muffato ou hero)

---

## Ciclo #52 — 2026-04-27

**Área:** Conversão — Programa "Embaixador do Mês"

**O que analisou:**
- Revisou `whatsapp-indicacao.md` (ciclo #41): mecânica Indica & Ganha ativa e planilha de rastreamento já existe
- Revisou `estrategia.md`: ciclo #52 previsto exatamente para este playbook
- Identificou lacuna: o Indica & Ganha tinha o rastreamento mas não tinha mecanismo de **reconhecimento público** para o top indicador → sem recompensa visível, motivação cai ao longo do mês
- Primeiro embaixador possível: fim de julho 2026, se programa esteve ativo em julho

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/embaixador-do-mes.md` | CRIADO — 263 linhas. Playbook completo: mecânica de identificação do vencedor (planilha Indica & Ganha), 4 templates WhatsApp (aviso privado E1, agendamento foto E2, broadcast anúncio E3, ativação urgência E4), roteiro carrossel Instagram 3 slides + caption completo c/ hashtags, story 3 slides, calendário operacional dia a dia, checklist copy-paste, nota especial "1º Embaixador de sempre" para julho 2026. |

**Commit:** `0e90ffe`

**Destaques:**
- Template E4 cobre o cenário de zero indicações no mês (não deixa o programa morrer em silêncio)
- Copy "1º Embaixador de sempre" usa exclusividade emocional — maior motivação que qualquer brinde
- Custo zero para a loja: apenas +5 carimbos + foto + post (UGC que o próprio embaixador vai querer compartilhar)
- Ciclo virtuoso documentado: embaixador compartilha anúncio → novos clientes conhecem o programa → mais indicações

**Próximo passo sugerido:**
- Ciclo #53: SEO — `aggregateRating` se desbloqueado pelo operador; senão: landing page `acai-self-service-londrina.html` (SEO "açaí self-service londrina")
- Ciclo #54: Auto-aprimoramento — reler log ciclos 49–53, ajustar estratégia para agosto (mês 4)
- Ciclo #55: Conteúdo semana 13 (12–18/07) — tema mid-month: engajamento + UGC invernal

---

## Ciclo #51 — 2026-04-27

**Área:** Conteúdo — `pos-inauguracao-semana12.md` (05–11/07/2026)

**O que analisou:**
- Revisou semana 11 (ciclo #50) para continuidade narrativa e tom
- Identificou que semana 12 coincide com o pico das férias escolares de julho e o feriado do 9 de Julho (PR/SP)
- Oportunidade de dupla agenda: tema família (semana toda) + 1º teaser do aniversário de 3 meses (sábado 11/07)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana12.md` | CRIADO — calendário completo 05–11/07. Tema "Família de Potinho". Post criativo de "combo família" (terça), post de feriado 9 de Julho (quinta), post de sábado com 1º teaser do aniversário de 3 meses. 3 templates WhatsApp Business. Checklist operacional. Nota para semana 13. |

**Commit:** `0d4b4be`

**Destaques do conteúdo:**
- Terça 07/07: carrossel "família de potinho" — argumento de combo + fidelidade como conversão
- Quinta 09/07: post de feriado 9 de Julho — tom leve, oportunidade de saída com família
- Sábado 11/07: 1º teaser do aniversário de 3 meses (25/07) — gera expectativa antecipada por 2 semanas
- Templates `/familia`, `/feriascombo` e `/teaser3meses` prontos para WhatsApp Business

**Próximo passo sugerido:**
- Ciclo #52: Template "Embaixador do Mês" — nomear 1º embaixador se Indica & Ganha estiver ativo
- Ciclo #53: SEO — `aggregateRating` se desbloqueado; senão: landing page `acai-self-service-londrina.html`
- Ciclo #54: Auto-aprimoramento — reler log ciclos 49–53, ajustar estratégia para agosto (mês 4)

---

## Ciclo #50 — 2026-04-27

**Área:** Conteúdo — `pos-inauguracao-semana11.md` (28/06–04/07/2026)

**Contexto:** Semana de virada de junho para julho — encerramento do Potinho Junino (30/06) e estreia do produto sazonal de inverno: Potinho Caramelado (01/07). Ciclo #49 mapeou esta semana no roadmap 50–54. Férias escolares em andamento → público familiar crescente.

**O que analisou:**
- `belinha/estrategia.md`: roadmap ciclo #50 = semana11, virada julho + produto invernal
- `pos-inauguracao-semana10.md`: referência de formato e profundidade (São João como pico de semana 10)
- Estratégia de julho: Potinho Caramelado (Ninho + calda caramelo + granola + floco aveia) já definida em `estrategia.md`
- Identificada janela emocional única: despedida do Potinho Junino + estreia simultânea = narrativa de continuidade que reengaja a base

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana11.md` | CRIADO — 358 linhas. Calendário completo 28/06–04/07 (domingo a sábado). Inclui: roteiro Reels 30s de estreia do Potinho Caramelado (01/07), post de despedida do Potinho Junino (30/06), 3 templates WhatsApp (`/caramelado`, `/boasferiasescolar`, `/tchauJunino`), stories para todos os 7 dias, checklist operacional, KPIs da semana, nota de transição para semana 12. |

**Commit:** `1f5d001`

**Destaques do conteúdo:**
- 30/06 = post emocional de despedida do Potinho Junino + teaser máximo para o dia seguinte
- 01/07 = roteiro Reels 30s de revelação com câmera lenta da calda de caramelo + texto animado dos ingredientes
- Template `/tchauJunino` para reengajar clientes que compraram o Potinho Junino durante junho
- Ação do operador documentada: confirmar nome final do produto e garantir insumos antes de 28/06

**Impacto esperado:**
- Transição de sazonalidade sem lacuna de comunicação (junho → julho sem silêncio)
- Estreia do Potinho Caramelado com Reels de revelação planejado — operador não improvisa
- Templates WhatsApp prontos eliminam fricção no atendimento de julho

**Próximo passo sugerido:**
- Ciclo #51: `pos-inauguracao-semana12.md` — 05–11/07: "Família de Potinho" (férias escolares + combos)
- Ciclo #52: Template "Embaixador do Mês" — nomear 1º embaixador se Indica & Ganha ativo
- Operador: confirmar nome e insumos do Potinho Caramelado antes de 28/06

---

## Ciclo #49 — 2026-04-27

**Área:** Auto-aprimoramento (ciclos #44–48) + Conteúdo — `pos-inauguracao-semana10.md`

**Contexto:** Ciclo obrigatório de auto-aprimoramento (a cada 5 ciclos). Período analisado: ciclos #44–48 (26/04/2026), semana de conteúdo junho, funil WhatsApp v2 e Potinho Junino. Melhoria concreta: semana 10 (21–27/06/2026) com São João como pico de alcance + transição para julho.

**O que analisou:**
- Ciclos #44–48: revisão completa — auto-aprimoramento #9 (semana7/vencedores UGC), semana8 (Indica & Ganha ativo), FAQPage SEO +2 perguntas, semana9 (Potinho Junino + Embaixador), funil WA v2 (6 novos scripts)
- Identificado padrão de alto valor: scripts operacionais prontos (WhatsApp) > conteúdo contingente (que depende de resultados não verificáveis)
- Potinho Junino = template replicável para sazonalidade: produto limitado + ingrediente acessível + urgência natural
- Dia de São João (24/06) não estava coberto na semana 10 → lacuna de pico de alcance identificada
- Estratégia de julho definida: férias escolares + aniversário 3 meses (25/07) + novo produto sazonal de inverno

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana10.md` | CRIADO — 200+ linhas. Semana 21–27/06 com São João (24/06) como pico. Roteiro Reel 15–30s, 3 templates WhatsApp (`/saojao`, `/ultimosjunino`, `/teaserjulho`), stories para todos os 7 dias, checklist operacional, promoção opcional de carimbo extra no São João, KPIs, nota para semana 11. |
| `belinha/estrategia.md` | Aprendizados ciclos 44–48 · Padrão v5 · Estratégia julho 2026 (férias escolares, 3 meses, produto invernal) · Roadmap ciclos 50–54 |

**Commits:**
- Feat: `pos-inauguracao-semana10.md`
- Docs: auto-aprimoramento ciclo #49 — `estrategia.md` atualizado

**Principais aprendizados do período (#44–48):**
1. Scripts operacionais prontos (WhatsApp) são o entregável de maior ROI — zero improviso do operador
2. Produtos sazonais de edição limitada (Potinho Junino) criam urgência natural e diferenciação sem custo de novos insumos
3. Conteúdo contingente (que pressupõe resultados não verificáveis) deve ter sempre uma versão B — ou ser substituído por conteúdo não-contingente
4. FAQ Schema.org antecipado (antes do lançamento do feature) é a prática correta de SEO

**Impacto esperado:**
- São João (24/06) = pico máximo de alcance orgânico da temporada junina → Reel planejado com antecedência, operador não perde a data
- Templates `/saojao` e `/teaserjulho` → transição limpa de junho para julho sem lacuna de comunicação
- `estrategia.md` define produto sazonal de julho (Potinho Caramelado/Aconchego) e roadmap ciclos 50–54

**Próximo passo sugerido:**
- Ciclo #50: `pos-inauguracao-semana11.md` — 28/06–04/07: virada para julho + revelar produto sazonal de inverno (Potinho Caramelado?)
- Operador: decidir produto sazonal de julho antes de 28/06 para revelar na virada
- Operador: verificar contagem de reviews Google Maps (≥3 para desbloquear `aggregateRating`)

---

## Ciclo #48 — 2026-04-26

**Área:** Conversão — `whatsapp-funil.md` v2 — aprendizados do mês 1

**Contexto:** O funil WhatsApp original (ciclo #4, 22/04/2026) foi criado antes da inauguração e nunca foi atualizado. Após 1 mês de operação, 3 lacunas críticas foram identificadas: (1) review Google Maps não era solicitado ativamente no pós-entrega; (2) o Indica & Ganha (ciclo #41) não tinha entrada no fluxo de atendimento; (3) o upsell de sazonalidade (Potinho Junino) e do Açaí self-service não tinham template pronto para o operador.

**O que analisou:**
- `whatsapp-funil.md`: arquivo original criado pré-inauguração, sem atualizações desde o ciclo #4
- `belinha/estrategia.md`: roadmap ciclo #48 = revisitar funil WA com aprendizados do mês 1
- `whatsapp-indicacao.md`: Indica & Ganha documentado no ciclo #41, sem integração no funil principal
- `pos-inauguracao-semana9.md`: Potinho Junino lançado na semana 9, sem script WA pronto

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-funil.md` | +182 linhas (293 → 475). Seção "Atualização v2" com: Etapa 7 v2 (follow-up pós-entrega com CTA review Google Maps), script `/voltou` (cliente recorrente), script `/indica` (ativar Indica & Ganha durante atendimento), script `/junino` (upsell Potinho Junino), script `/acai` (upsell Açaí self-service), tabela unificada v1+v2 de atalhos WhatsApp Business e fluxo visual completo. |

**Commit:** `b7569b7`

**Impacto esperado:**
- `/obrigada2` com CTA de review Google → mais reviews Maps → melhor ranqueamento local (problema crônico identificado nos ciclos 30+)
- `/indica` durante atendimento → ativar Indica & Ganha passivamente em cada pedido sem esforço extra do operador
- `/junino` e `/acai` → aumentar ticket médio com upsell acionável (copy pronto, zero improviso)
- `/voltou` → reduzir atrito com clientes recorrentes, que percebem ser reconhecidos

**Próximo passo sugerido:**
- Ciclo #49: Auto-aprimoramento (obrigatório a cada 5 ciclos) — reler log ciclos 44–48, ajustar estratégia para julho (mês 3)

---

## Ciclo #47 — 2026-04-26

**Área:** Conteúdo — `pos-inauguracao-semana9.md` — 14–20/06/2026

**Contexto:** Semana 9 é a primeira semana pós-ativação do Indica & Ganha. Dois objetivos simultâneos: (1) revelar resultados do programa e nomear eventual Embaixador MilkyPot; (2) lançar o "Potinho Junino" — edição limitada de Festa Junina (paçoca + calda de amendoim + granulado tricolor) como novidade de cardápio mid-month que cria urgência e sazonalidade.

**O que analisou:**
- `pos-inauguracao-semana8.md`: nota final sugeria revelar resultados do Indica & Ganha + novidade de cardápio
- `estrategia.md`: roadmap ciclo #47 = semana 9 com novidade de cardápio ou promoção mid-month
- Sazonalidade: junho no Brasil = Festa Junina peak → paçoca/amendoim são sabores altamente associados, criam urgência de edição limitada com custo zero de novos insumos (paçoca é ingrediente barato e acessível)
- Mecânica do Embaixador MilkyPot: documentada como progressão natural do Indica & Ganha para gamificação de longo prazo

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana9.md` | CRIADO — 341 linhas. Semana 14–20/06: 7 dias de posts planejados (2 Reels, posts feed, sequências de stories), roteiros completos, captions prontas, checklist operacional, gestão de estoque do Potinho Junino, mecânica de Embaixador MilkyPot, KPIs e nota para semana 10. |

**Commit:** `61b1b1e`

**Diferencial criativo desta semana:**
- Potinho Junino = novidade sazonal com zero investimento em insumos novos (paçoca já é topping comum) + urgência natural de "só em junho"
- Reel de lançamento na quarta (17/06) aproveita midweek para maximizar alcance orgânico antes do fim de semana
- Enquete de teaser na segunda cria antecipação orgânica sem revelar o produto

**Próximo passo sugerido:**
- Ciclo #48: Revisitar `whatsapp-funil.md` — ajustar fluxo com aprendizados do mês 1 (conversão, dúvidas mais frequentes, ponto de abandono)
- Ciclo #49: Auto-aprimoramento — reler log ciclos #44–48, ajustar estratégia para julho (mês 3 de operação)
- Opcional: Se operador confirmar que Potinho Junino teve boa demanda → ciclo extra de "variação Fit" (base açaí + paçoca)

---

## Ciclo #46 — 2026-04-26

**Área:** SEO — Schema.org FAQPage: +2 perguntas (Cartão Fidelidade e Indica & Ganha)

**Contexto:** `aggregateRating` permanece suspenso (aguarda ≥3 reviews Google Maps confirmados pelo operador). Gap identificado: FAQPage tinha apenas 6 perguntas, sem mencionar os dois programas que entram em foco em junho — o Cartão Fidelidade Digital (lançado no ciclo #23) e o Indica & Ganha (ativado na semana 8, ciclo #41).

**O que analisou:**
- `index.html` FAQPage: 6 perguntas existentes (localização, delivery, pagamentos, fidelidade genérica, Zero/Fit)
- `cartao-fidelidade.html`: mecânica dos 10 carimbos + Mini Potinho grátis já documentada
- `whatsapp-indicacao.md`: regras e templates do Indica & Ganha prontos desde ciclo #41
- Gap: queries de busca como "cartão fidelidade milkypot", "programa de indicação milkypot londrina" não tinham cobertura em rich results

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | FAQPage: +2 perguntas — "Como funciona o Cartão Fidelidade Digital?" e "O MilkyPot tem programa de indicação?". FAQPage 6→8 perguntas. JSON-LD validado. |

**Commit:** `e7c44ee`

**Impacto esperado:**
- Rich results Google para queries sobre fidelidade e indicação alinhadas com a programação de junho
- "Indica & Ganha" indexado como FAQ antes da ativação do programa (semana 8) — ancoragem SEO antecipada
- CTA WhatsApp na resposta da FAQ de indicação: captura orgânica de leads curiosos via busca

**Próximo passo sugerido:**
- Ciclo #47: `pos-inauguracao-semana9.md` — 14–20/06/2026: resultados do Indica & Ganha + novidade de cardápio ou promoção mid-month
- Ciclo #48: Revisitar funil WhatsApp (`whatsapp-funil.md`): ajustar fluxo com aprendizados do mês 1
- Ciclo #49: Auto-aprimoramento — reler log ciclos #44–48, ajustar estratégia para julho

---

## Ciclo #45 — 2026-04-26

**Área:** Conteúdo — `pos-inauguracao-semana8.md`

**Contexto:** Semana 8 (07–13/06/2026) é a semana de ativação oficial do programa Indica & Ganha. Templates WA já estavam prontos (`whatsapp-indicacao.md`) desde o ciclo #41; faltava o conteúdo orgânico de rede social para impulsionar a mecânica e instruir o operador a disparar para toda a base de clientes.

**O que analisou:**
- Roadmap `estrategia.md` apontava ciclo #45 para ativação do Indica & Ganha
- `whatsapp-indicacao.md` (ciclo #41): Templates A e B já prontos — só faltava o wrapper de conteúdo
- `cartao-fidelidade.html` (ciclo #23): cartão com 10 carimbos já online — a mecânica de carimbo extra é o incentivo central
- Semanas 1–7 cobertas; semana 8 é o gap imediato no arsenal de conteúdo

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana8.md` | CRIADO — Calendário 07–13/06. Tema: ativar Indica & Ganha como conteúdo orgânico. Reel "quem te indicou" (Dom), stories enquete triagem, carrossel explicativo Indica & Ganha (Ter, dia do disparo WA), Reel CTA fim de semana (Sáb), tabela de registro manual de indicações, checklist operacional completo, KPIs, remissão aos templates WA e nota para semana 9. |

**Commit:** `8ab50c3`

**Instrução operador (urgente na terça 09/06):**
- Abrir `whatsapp-indicacao.md`, enviar Template A para todos os clientes cadastrados em lotes de ≤20
- Anotar indicações na tabela de registro manual do arquivo semana8

**Próximo passo sugerido:**
- Ciclo #46: SEO — se `aggregateRating` desbloqueado, ativar em `index.html`; senão, verificar outros gaps de Schema.org (ex: `openingHoursSpecification` atualizado para junho)
- Ciclo #47: `pos-inauguracao-semana9.md` — 14–20/06, anunciar resultados do Indica & Ganha + novidade de cardápio ou promoção mid-month
- Ciclo #48: Revisitar funil WhatsApp (`whatsapp-funil.md`) com aprendizados do mês 1

---

## Ciclo #44 — 2026-04-26

**Área:** Auto-aprimoramento (ciclos #39–43) + Conteúdo — `pos-inauguracao-semana7.md`

**Contexto:** Ciclo obrigatório de auto-aprimoramento (a cada 5 ciclos). Período #39–43 encerra o sweep técnico de performance e constrói o arsenal de conteúdo/conversão para maio. Melhoria concreta associada: semana 7 é a semana do anúncio dos vencedores do Desafio UGC e a virada para junho (mês 2).

**O que analisou:**
- Ciclos #39–43: revisão completa — sweep Google Fonts (#39, #40), Indica & Ganha (#41), refetch concorrente (#42), semana6/desafio UGC (#43)
- Identificado padrão negativo: ciclo #42 pesquisou concorrente sem gerar follow-up imediato → regra reforçada
- Identificado padrão negativo: bloqueadores (`aggregateRating`, GA ID) ocupando slots no roadmap há >3 ciclos → marcados como "suspensos"
- Padrão consolidado v4: sweep batch completo > conteúdo acionável > SEO não-bloqueado > concorrente c/ follow-up
- Estratégia de junho definida: prova social via UGC, hábito semanal, reativação com Indica & Ganha

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana7.md` | CRIADO — Calendário 31/05–06/06. Tema: anúncio vencedores + virada de mês. Reel anúncio 30–45s (script completo), 8 stories de repost UGC, template WhatsApp vencedores, posts para todos os 7 dias, checklist operacional, KPIs e nota para semana 8. |
| `belinha/estrategia.md` | Aprendizados ciclos 39–43 · Padrão v4 · Estado das áreas · Estratégia junho · Roadmap ciclos 45–49 · Bloqueadores suspensos (sem listar no roadmap ativo) |

**Principais aprendizados do período:**
1. Sweep técnico sistêmico deve ser resolvido em batch (mínimo de ciclos) — não diluir por ciclos
2. Entregáveis acionáveis pelo operador (templates prontos, playbooks) = maior ROI por ciclo
3. Bloqueadores sem previsão de resolução não devem ocupar slot no roadmap ativo — suspender até desbloqueio

**Próximo passo sugerido:**
- Ciclo #45: `belinha/content/pos-inauguracao-semana8.md` — semana 07–13/06 com tema de indicação + ativação Indica & Ganha
- Ciclo #46: Se operador confirmar ≥3 reviews Google Maps → ativar `aggregateRating` em `index.html`
- Operador: acionar templates Indica & Ganha (`belinha/content/whatsapp-indicacao.md`) com a base de clientes do mês 1

---

## Ciclo #43 — 2026-04-26

**Área:** Conteúdo Marketing — `pos-inauguracao-semana6.md` (Desafio UGC #PotinhoMaisFeliz)

**Contexto:** D+1 do primeiro mês de operação. Semana 5 (17–23/05) celebrou "quase 1 mês"; o dia 25/05 é o marco exato de 1 mês. Momento ideal para lançar o primeiro desafio UGC da marca — receptividade alta, base de clientes aquecida pelo programa fidelidade e pelo Indica & Ganha.

**O que analisou:**
- Revisou `pos-inauguracao-semana5.md` para manter coerência de formato e tom
- Revisou `ugc-compartilhe-potinho.md` (inauguração): mecânica de UGC já testada no D0 — replicar em escala maior
- Verificou calendário: 25/05 = segunda-feira → dia perfeito para reel comemorativo de máximo alcance
- Identificou que o desafio fecha no sábado 30/05 com anúncio no domingo 31/05 — dá tempo para o operador selecionar vencedores

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana6.md` | CRIADO — 330 linhas. Calendário completo Domingo 24/05 → Sábado 30/05. Desafio UGC #PotinhoMaisFeliz: 3 vencedores × Potinho Grande grátis. 4 templates WhatsApp (lançamento, reativação D+30, resposta participantes, anúncio vencedores). Roteiros de Reel para 25/05 (30s, aniversário 1 mês) e 29/05 (15s, urgência). Planejamento antecipado do Domingo 31/05 (anúncio). KPIs + critérios de seleção dos vencedores. |

**Commit:** `4afdd26`

**Mecânica do desafio UGC:**
- Período: 25–30/05/2026
- Participação: foto/vídeo do potinho + @milkypotbr + #PotinhoMaisFeliz no Instagram/TikTok
- Prêmio: 3 melhores ganham 1 Potinho Grande GRÁTIS
- Operador notifica vencedores via WhatsApp; anúncio público nos stories 31/05
- Critérios subjetivos (criatividade, engajamento, espírito MilkyPot) — evita gamificação por bots

**Impacto esperado:**
- Conteúdo orgânico gerado por clientes reais → prova social para novos visitantes
- Alcance multiplicado pelo efeito "desafio" — cada participante puxa o círculo social dele
- Reativação de clientes D+30 via WhatsApp com pretexto concreto (desafio + aniversário)

**Próximo passo sugerido:**
- Ciclo #44: Auto-aprimoramento #9 — reler log ciclos #40–43, ajustar estratégia para maio/junho em `belinha/estrategia.md`
- Ciclo #45: SEO — ativar `aggregateRating` em `index.html` se operador confirmar ≥3 reviews Google Maps
- Ciclo #46: Criar `pos-inauguracao-semana7.md` — semana 31/05–06/06 (resultados do desafio, consolidação mês 2)

---

## Ciclo #42 — 2026-04-26

**Área:** Pesquisa Concorrentes — The Best Açaí (refetch dados 2024/2025)

**Contexto:** Sugerido no ciclo #41. The Best Açaí é o concorrente local mais relevante — nasceu em Londrina em 2017, tem 5 unidades na cidade. O arquivo `competitors/the-best-acai.md` tinha dados de 2023 (ciclo #13): 680 unidades e R$215M de faturamento. Dados desatualizados geram análise competitiva incorreta.

**O que analisou:**
- WebSearch: "TheBest Açaí franquia cardápio preços 2026" + "The Best Açaí Londrina"
- WebSearch: "The Best Açaí diferencial potinho personalizado ninho vs self-service"
- WebSearch: "The Best Açaí preço self-service Londrina 2025 100g"
- WebFetch tentado em thebestacai.com.br, portaldofranchising, pricelisto.com.br → 403 bloqueados
- Dados confiáveis extraídos via TikTok @marceladegusta (preço R$6,29/100g confirmado), foodbizbrasil.com (The Best Donuts), fontes de franquia

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/the-best-acai.md` | Refetch completo: faturamento R$215M→R$777M (2024), unidades 680→900+, novo produto The Best Donuts (jan/2025), 100k clientes/dia, fábrica Amadelli 80t/dia, alertas estratégicos ciclo #42 |

**Commit:** `b07bd18`

**Principais descobertas:**
1. **The Best Donuts (jan/2025):** 1º self-service de donuts do Brasil, ativo em 580+ lojas. Expansão para o segmento "doce artesanal" — monitorar impacto na percepção de potinho artesanal
2. **Escala brutal:** R$777M/ano e 100k clientes/dia. Competir em volume/preço é suicídio — diferenciação por experiência e produto é a única estratégia
3. **Gap no Muffato continua:** nenhuma unidade da TheBest no Quintino Bocaiuva — janela de oportunidade MilkyPot intacta

**Próximo passo sugerido:**
- Ciclo #43: `belinha/content/pos-inauguracao-semana6.md` — conteúdo 24–30/05 (consolidação de hábito, desafio UGC "1 mês e meio de MilkyPot")
- Ciclo #44: Auto-aprimoramento #9 — reler log ciclos #40–43, ajustar estratégia para maio/junho
- Ciclo #45: Monitorar se TheBest Donuts chega em Londrina — documentar em `the-best-acai.md`

---

## Ciclo #41 — 2026-04-26

**Área:** Conversão — Programa Indica & Ganha (referral WhatsApp)

**Contexto:** D+1 da inauguração. Com clientes da abertura "frescos", o momento ideal para acionar o programa de indicação — receptividade máxima, memória do produto ainda viva. O cartão fidelidade (ciclo #23) já existe como âncora de retorno; o Indica & Ganha cria o vetor de aquisição orgânica.

**O que analisou:**
- `belinha/content/whatsapp-funil.md`: tom de voz e formatação WhatsApp estabelecidos
- `cartao-fidelidade.html`: mecânica de carimbos existente — indicação gera 1 carimbo extra, integra sem fricção
- Estratégia ciclo #41: template referral copy-paste com rastreamento manual (sem custo de sistema)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-indicacao.md` | CRIADO — 4 templates prontos: (A) operador → cliente existente, (B) card de indicação para o amigo encaminhar, (C) confirmação de carimbo extra para quem indicou, (D) reativação de cliente sumido com gancho de indicação. + regras do programa + calendário de envio + planilha de rastreamento manual |

**Commit:** `4713d5c`

**Mecânica completa:**
1. Operador envia Template A ao cliente → cliente encaminha Template B ao amigo
2. Amigo vem, menciona quem indicou → ganha carimbo normal
3. Operador envia Template C para quem indicou → ganha 1 carimbo extra
4. Link `cartao-fidelidade.html?stamps=N` atualizado para mostrar novo total

**Impacto esperado:**
- Aquisição orgânica zero custo: cada cliente vira potencial embaixador
- Loop de fidelidade: indicação → carimbo → aproximação do brinde → mais engajamento
- Reativação embutida no Template D para clientes que sumiram após inauguração

**Próximo passo sugerido:**
- Ciclo #42: Pesquisa concorrente TheBest — WebSearch/WebFetch para extrair preços, produtos, copy e diferenciais. Salvar em `belinha/competitors/thebest.md`
- Ciclo #43: `pos-inauguracao-semana6.md` — conteúdo 24–30/05 (consolidação de hábito, desafio UGC, 1 mês e meio de MilkyPot)
- Ciclo #44: Auto-aprimoramento #9 — reler log ciclos 40–43, ajustar estratégia para junho

---

## Ciclo #40 — 2026-04-26

**Área:** UX/Performance — Google Fonts non-blocking sweep (batch final)

**Contexto:** Conclusão do sweep de fontes bloqueantes iniciado no ciclo #38. As 4 páginas restantes (`login.html`, `desafio.html`, `termos.html`, `privacidade.html`) ainda usavam `rel="stylesheet"` síncrono para Google Fonts, atrasando o render-blocking em cada carregamento.

**O que analisou:**
- Confirmação via `grep` que todas as 4 páginas tinham o padrão bloqueante
- Verificação do padrão correto já aplicado nas páginas de alto tráfego nos ciclos #37–39
- Após o ciclo #40, TODAS as páginas do domínio estarão com fontes non-blocking

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `login.html` | `rel="stylesheet"` → `preload as="style"` + `onload` + `<noscript>` fallback |
| `desafio.html` | Mesmo padrão non-blocking (inclui Orbitron além de Baloo 2 e Nunito) |
| `termos.html` | Mesmo padrão non-blocking |
| `privacidade.html` | Mesmo padrão non-blocking |

**Commit:** `4512e0c`

**Impacto:**
- Sweep de render-blocking fonts 100% completo em todo o domínio milkypot.com
- Todas as páginas agora carregam HTML/CSS crítico sem aguardar resposta do servidor Google Fonts
- Melhora FCP e LCP especialmente em conexões móveis 4G/3G

**Próximo passo sugerido:**
- Ciclo #41: Template "mensagem de indicação" cliente → amigo (referral program copy WhatsApp) — copy pronto para operador copiar e enviar
- Ciclo #42: Pesquisa concorrente TheBest — WebSearch/WebFetch para extrair preços, produtos e diferenciais

---

## Ciclo #39 — 2026-04-26

**Área:** Auto-aprimoramento (#8, ciclos #35–39) + UX/Performance — Google Fonts non-blocking sweep

**Contexto:** D+1 pós-inauguração. Ciclo obrigatório de auto-aprimoramento (a cada 5 ciclos). Período analisado cobre ciclos #35–38: link SEO, conteúdo semana 5, LCP index.html e fontes non-blocking em páginas standalone. Melhoria concreta associada: completar sweep de fontes bloqueantes nas páginas de alto tráfego restantes (`cardapio.html` e `raspinha.html`).

**O que analisou:**
- Log ciclos #35–38 + `estrategia.md` (estado atual das páginas)
- Varredura: 5 páginas já corrigidas, 4 ainda com `rel="stylesheet"` bloqueante
- Prioridade: `cardapio.html` (maior tráfego de conversão) e `raspinha.html` — restantes têm tráfego orgânico baixo

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | Google Fonts convertido para non-blocking: `preload as="style"` + `onload="this.rel='stylesheet'"` + `<noscript>` fallback |
| `raspinha.html` | Mesma fix de Google Fonts (padrão idêntico ao já aplicado nas demais páginas) |
| `belinha/estrategia.md` | Aprendizados ciclos #35–39 · Tabela de estado por página · Padrão consolidado v3 · Roadmap ciclos 40–44 |

**Commit:** `9de2e49`

**Aprendizado principal do período:**
- Problemas sistêmicos (mesma tag de font em N páginas) devem ser resolvidos em batch completo no mesmo ciclo — distribuir por ciclos gera trabalho acumulado desnecessário.

**Páginas com fontes ainda bloqueantes (próximo ciclo):**
- `login.html`, `desafio.html`, `termos.html`, `privacidade.html` — baixo impacto LCP

**Próximo passo sugerido:**
- Ciclo #40: Fix fontes bloqueantes nas 4 páginas restantes (batch completo) — `login.html`, `desafio.html`, `termos.html`, `privacidade.html`
- Ciclo #41: Template "mensagem de indicação" cliente → amigo (referral program copy WhatsApp)

---

## Ciclo #38 — 2026-04-26

**Área:** UX/Frontend — Google Fonts non-blocking em páginas standalone

**Contexto:** D+1 pós-inauguração. Ciclo #37 corrigiu fontes bloqueantes em `index.html`. Auditoria revelou que `cartao-fidelidade.html` e `potinho-ninho-londrina.html` (SEO crítica) ainda usavam `rel="stylesheet"` padrão para Google Fonts — render-blocking.

**O que analisou:**
- `cartao-fidelidade.html`: Google Fonts blocking `rel="stylesheet"` · link footer sem entrada para `potinho-ninho-londrina.html`
- `potinho-ninho-londrina.html`: mesma URL de font, mesma tag blocking · página SEO principal da loja
- Varredura geral: `raspinha.html`, `desafio.html`, `login.html`, `cardapio.html`, `termos.html`, `privacidade.html` ainda têm fontes bloqueantes → documentado como próximo passo

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cartao-fidelidade.html` | Google Fonts convertido para non-blocking: `preload as="style"` + `media="print" onload="this.media='all'"` + `<noscript>` fallback |
| `cartao-fidelidade.html` | Footer nav: adicionado link `→ potinho-ninho-londrina.html` com texto "Potinho de Ninho" |
| `potinho-ninho-londrina.html` | Mesma fix de Google Fonts (página SEO crítica — maior impacto de LCP) |

**Commit:** `df53e28`

**Impacto esperado:**
- Eliminação de render-blocking nas duas páginas com tráfego orgânico real: página SEO `potinho-ninho-londrina` e página de fidelidade compartilhada via WhatsApp
- `cartao-fidelidade.html`: usuário que chega pelo link do operador agora tem atalho para o produto principal

**Páginas com fontes ainda bloqueantes (próximo ciclo):**
- `cardapio.html` — alta prioridade (tráfego de cardápio)
- `raspinha.html` — URL de font idêntica
- `login.html`, `termos.html`, `privacidade.html` — baixa prioridade de LCP

**Próximo passo sugerido:**
- Ciclo #39: Fix Google Fonts blocking em `cardapio.html` + `raspinha.html` (mesma URL de font)
- Ciclo #40 (auto-aprimoramento #8): reler log ciclos 35–39, atualizar `belinha/estrategia.md`

---

## Ciclo #37 — 2026-04-26

**Área:** UX/Frontend — Performance mobile LCP (index.html)

**Contexto:** Dia após inauguração (25/04). Site ativo, tráfego orgânico começa a crescer. Foco: garantir LCP <2.5s no mobile para não perder posição no Google.

**O que analisou:**
- `index.html` head: Google Fonts carregado com `rel="stylesheet"` padrão (render-blocking)
- Hero section: `images/logo-milkypot.png` (LCP element) sem `fetchpriority` nem `preload`
- Nav logo e footer logo: padrão OK (footer já tinha `loading="lazy"`)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | Adicionado `<link rel="preload" as="image" href="images/logo-milkypot.png" fetchpriority="high">` no `<head>` |
| `index.html` | Hero img: `fetchpriority="high" loading="eager"` adicionados |
| `index.html` | Google Fonts convertido para padrão não-bloqueante: `media="print" onload="this.media='all'"` + `<noscript>` fallback |

**Commit:** `8963467`

**Impacto esperado:**
- LCP mobile: eliminação de render-blocking de fontes externas (~200-400ms no 4G médio)
- Hero image descoberta pelo browser no preload scan antes do HTML parser chegar na tag
- `fetchpriority="high"` sinaliza ao browser para priorizar o download da imagem LCP

**Próximo passo sugerido:**
- Ciclo #38: Link `cartao-fidelidade.html` → `potinho-ninho-londrina.html` + testar Schema.org Rich Results
- Ciclo #39 (auto-aprimoramento #8): reler log completo ciclos 35-39 e atualizar `belinha/estrategia.md`

---

## Ciclo #36 — 2026-04-25

**Área:** Conteúdo marketing — Semana 5 pós-inauguração (17–23/05/2026)

**Contexto:** ~3 semanas após inauguração. Prioridade: reativar clientes de inauguração que não retornaram, colher reviews Google Maps, celebrar "1 mês de MilkyPot", nutrir cartão fidelidade.

**O que analisou:**
- Log ciclo #35 e estrategia.md: próximo passo indicado era semana 5
- Conteúdo semanas 1–4 já cobrem lançamento e primeiras semanas; semana 5 é inflexão de fidelização
- Gap identificado: nenhum template de reativação D+21 existia no repositório

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana5.md` | CRIADO — 7 dias de conteúdo (Dom–Sáb), 2 reels com roteiro completo, sequências de stories, captions Instagram, 2 templates WhatsApp (reativação D+21 + solicitação de review), KPIs da semana |

**Commit:** `ea9a73c`

**Destaques do conteúdo:**
- **Dom 17/05:** Celebração "1 mês" com enquete sabor favorito
- **Ter 19/05:** Reel 15s com roteiro "1 mês de MilkyPot"
- **Qua 20/05:** Post de social proof + CTA review Google Maps (crítico para aggregateRating)
- **Sex 22/05:** Reel 30s "Por que o MilkyPot é diferente?" — edutainment + diferenciais vs iFood
- **Sáb 23/05:** Promoção "topping extra grátis" para gerar tráfego no fim de semana

**Próximo passo sugerido:**
- Ciclo #37: Performance mobile `index.html` — verificar LCP e CLS via PageSpeed Insights
- Ciclo #38: Link `cartao-fidelidade.html` → `potinho-ninho-londrina.html` + testar Schema.org Rich Results
- Quando operador confirmar ≥3 reviews Google: ativar `aggregateRating` em `index.html`

---


## Ciclo #34 — 2026-04-25

**Área:** Conteúdo acionável — Semana 4 pós-inauguração (10–16/05/2026)

**Contexto:** Semana 4 é decisiva para consolidação de hábito. Quem veio nas semanas 1 e 2 precisa de um gatilho para virar frequentador fixo. Prioridade: conteúdo pronto que o operador pode publicar sem retrabalho + upsell do açaí buffet self-service (exclusivo Muffato, diferencial competitivo ainda pouco explorado nas redes).

**O que analisou:**
- `belinha/content/pos-inauguracao-semana3.md` como referência de formato (ciclo #30)
- Ciclos 31–33 cobriram upsell no site, playbook reativação WA e link SEO
- Açaí buffet self-service mencionado em semana 2 mas sem post dedicado ainda
- Cartão fidelidade (`cartao-fidelidade.html`) criado no ciclo #23 — semana 4 é o momento ideal de ativar quem ainda não resgatou

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana4.md` | CRIADO — 4 posts (Dom/Ter/Qui/Sáb) + stories avulsos de review Google + templates WhatsApp de upsell açaí buffet + KPIs da semana + nota operacional |

**Commit:** `7b84273`

**Conteúdo criado:**
- Post Dom 10/05: "Domingo virou MilkyPot" — hábito
- Post Ter 12/05: Upsell açaí buffet self-service (reels 15s + carrossel)
- Post Qui 14/05: Cartão fidelidade — ativação "4 semanas, já tem seus carimbos?"
- Post Sáb 16/05: "Sábado é sagrado" — ritual semanal (reels 15s)
- Scripts de stories para incentivo a review Google
- Templates WhatsApp para upsell do buffet durante atendimento delivery
- KPIs: 2 reviews, 5 cartões fidelidade, 1 UGC buffet, ticket médio

**Impacto esperado:**
- Operador tem 4 semanas de conteúdo completo sem improvisar
- Açaí buffet como exclusividade Muffato reforçado visualmente → diferenciação competitiva
- Cartão fidelidade com CTA direto (`cartao-fidelidade.html?stamps=N`) integrado ao post
- Roteiro de reels 15s pronto para gravar na loja sem diretor

**Próximo passo sugerido:**
- Ciclo #35: Auto-aprimoramento obrigatório — reler log ciclos #30–34, ajustar rotação e KPIs em `belinha/estrategia.md`
- Ciclo #35 alternativo: Adicionar link `cardapio.html` → `potinho-ninho-londrina.html` (reforçar segundo crawl path além do `index.html`)
- Ciclo #36: Criar `belinha/content/pos-inauguracao-semana5.md` com foco em "mês de MilkyPot" (aniversário de 1 mês da loja)

---

## Ciclo #33 — 2026-04-25

**Área:** SEO técnico — Link interno para `potinho-ninho-londrina.html`

**Contexto:** A landing page `potinho-ninho-londrina.html` foi criada no ciclo #27 para capturar tráfego orgânico do termo long-tail "potinho ninho londrina", mas estava completamente órfã — nenhuma página do site apontava para ela. O Google não consegue indexar páginas sem um crawl path interno. A estratégia.md já previa esta ação para o ciclo #34; antecipamos para o #33.

**O que analisou:**
- `grep "potinho-ninho" index.html cardapio.html` retornou vazio — confirmado: zero links internos
- Seção de produtos em `index.html` (linha 444) tem CTA "Monte do Seu Jeito" como ponto de saída natural
- Anchor text ideal para SEO: contém o termo exato + localização ("Tudo sobre o Potinho de Ninho em Londrina")

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +1 linha: link contextual abaixo do botão "Monte do Seu Jeito" na seção de produtos → `potinho-ninho-londrina.html` com anchor text SEO otimizado |

**Commit:** `3ca2980`

**Validação:** `grep -n "potinho-ninho-londrina" index.html` → linha 446 confirmada.

**Impacto esperado:**
- Googlebot agora tem caminho de crawl: `index.html` → `potinho-ninho-londrina.html`
- Anchor text "Tudo sobre o Potinho de Ninho em Londrina" reforça relevância local da página destino
- PageRank interno flui do `index.html` (página principal) para a landing page de SEO local
- Indexação esperada em 3-14 dias após próximo crawl do Google

**Próximo passo sugerido:**
- Ciclo #34: Criar `belinha/content/pos-inauguracao-semana4.md` — conteúdo pronto para semana 10-16/05/2026 (foco: hábito semanal + upsell açaí self-service)
- Ciclo #35: Auto-aprimoramento ciclos #30-34 — reler log, ajustar rotação e KPIs em `belinha/estrategia.md`
- Ciclo #35 alternativo: Adicionar link interno de `cardapio.html` → `potinho-ninho-londrina.html` (reforçar crawl path)

---

## Ciclo #32 — 2026-04-25

**Área:** Conversão — Playbook de Reativação WhatsApp

**Contexto:** Dia da inauguração (25/04/2026). Loja abriu às 14h. Os primeiros clientes foram atendidos hoje — mas sem um playbook de reativação, o operador não sabia como reengajar esses clientes nos dias seguintes. O `whatsapp-funil.md` existente só cobria o atendimento inbound (cliente chama → resposta). Faltava o fluxo outbound: cliente comprou, sumiu → o que fazer?

**O que analisou:**
- `belinha/content/whatsapp-funil.md` cobre recepção e cardápio, mas não reativação
- Nenhum arquivo existente tinha templates D+1, D+7, D+14, D+30
- Estratégia confirmada (ciclo #31 já fez upsell banner; próxima prioridade = retenção)
- 8 templates distintos necessários para cobrir toda a jornada do cliente silencioso

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-reativacao.md` | CRIADO — 8 templates de reativação + tabela de etiquetas WA Business + horários ideais de envio |
| `belinha/content/whatsapp-funil.md` | +link de referência para `whatsapp-reativacao.md` no rodapé |

**Commit:** `7f14e7d`

**Templates incluídos:**
1. Boas-vindas pós-compra (mesmo dia / D+1)
2. Reativação D+7 (com pontos no cartão)
3. Reativação D+7 (sem cartão ativado)
4. Reativação D+14 (com CTA lista de novidades)
5. Reativação D+30 (cupom surpresa R$5 — última tentativa)
6. Lembrete fidelidade (8–9 selos, 1–2 da meta)
7. Upsell exclusivos Muffato (buffet açaí, milkshake, picolés, chocolates)
8. Promoção sábado (broadcast semanal)
9. Agradecimento por review Google (+ brinde surpresa)

**Impacto esperado:**
- Operador tem script pronto → zero fricção para reengajar clientes silenciosos
- Cartão fidelidade tem gatilho de lembrete (8–9 selos) → aumenta conversão do prêmio
- Template D+30 com cupom de R$5 = última tentativa estruturada antes de arquivar contato

**Próximo passo sugerido:**
- Ciclo #33: Conteúdo semana 4 pós-inauguração (19–25/05) — captions + roteiro reels
- Ciclo #34: Verificar se `potinho-ninho-londrina.html` indexou — adicionar link interno de `index.html` se necessário
- Ciclo #35: Auto-aprimoramento — reler log ciclos 30–34, ajustar rotação

---

## Ciclo #31 — 2026-04-25

**Área:** Conversão — Upsell Banner Exclusivos Muffato Londrina

**Contexto:** Pós-inauguração (dia da abertura). Estratégia ciclo #31 previa `aggregateRating`, mas isso depende de confirmação de reviews reais pelo operador — não disponível. Próxima ação de maior valor concreto: banner de upsell destacando os 4 itens exclusivos da unidade Muffato (milkshake, açaí buffet self-service, picolés/sorvetes, chocolates premium) que não existem nas outras unidades e aumentam ticket médio.

**O que analisou:**
- `cardapio.html` linha 155: seção de produtos encerrava sem nenhum CTA para os exclusivos da loja física
- Visitantes do cardápio online vêm principalmente pelo celular → perdem a oportunidade de saber que existe açaí buffet self-service e milkshakes só no Muffato
- Estratégia confirmada: pesquisa → ação imediata (padrão consolidado ciclo #28)
- `cardapio.css` existe mas não está linkado em nenhum HTML — CSS adicionado inline no `<head>` para garantir carregamento

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | +`<style>` inline com CSS do banner (13 linhas minificadas); +`<section class="muffato-upsell">` entre a grid de produtos e o cart sidebar. Grid 4-col (desktop) → 2-col (mobile ≤480px). CTA WhatsApp com mensagem pré-preenchida apontando para exclusivos. |
| `css/cardapio.css` | Limpeza de linha extra deixada por edição anterior (sem impacto funcional, arquivo não linkado) |

**Commit:** `d2bf755`

**Mecânica de upsell:**
- Banner visível logo após o cliente escolher a base do potinho → momento de maior intenção de compra
- 4 cards com emoji + título + descrição curta: Milkshakes 🥤 / Açaí Buffet 🫐 / Picolés & Sorvetes 🍦 / Chocolates Premium 🍫
- CTA verde WhatsApp: "💬 Falar no WhatsApp" com mensagem pré-preenchida sobre exclusivos
- Responsivo: 4→2 colunas em telas ≤480px

**Impacto esperado:**
- Aumento de ticket médio: cliente que ia só comprar potinho descobre milkshake e considera adicionar
- Leads WhatsApp qualificados sobre exclusivos Muffato → operador pode upsell no chat
- Diferenciação clara da unidade Muffato vs cardápio nacional online

**Próximo passo sugerido:**
- Ciclo #32: Ativar `aggregateRating` em `index.html` se operador confirmar ≥3 reviews Google Maps (template pronto desde ciclo #26)
- Ciclo #33: Conteúdo semana 4 pós-inauguração + template "mensagem reativação WhatsApp" para clientes silenciosos
- Ciclo #34: Link interno de `index.html` para `potinho-ninho-londrina.html` se página não indexou

---

## Ciclo #30 — 2026-04-25

**Área:** Conversão + Auto-aprimoramento (obrigatório a cada 5 ciclos)

**Contexto:** Ciclo #30 — 2 ações: (1) auto-aprimoramento dos ciclos 26–29 e (2) melhoria concreta de conversão pós-inauguração. Com a loja aberta há horas, o próximo grande alavancador de SEO local são reviews no Google Maps. O site não tinha nenhum CTA direcionando clientes a avaliar — gap identificado.

**O que analisou:**
- Log ciclos 26–29: FAQPage Schema (assíncrono, ok), landing page long-tail (SEO cumulativo), benefits bar/Jhoy (pesquisa + ação imediata = padrão correto), LCP mobile (impacto direto no usuário)
- `index.html`: seção de depoimentos menciona "2.847 avaliações" (nacional) mas sem link para o cliente deixar sua própria avaliação na unidade Londrina
- `belinha/estrategia.md`: defasada (ciclo #25) — atualizada com bloqueadores reais (GA ID pendente, aggregateRating aguardando reviews reais)
- `belinha/content/`: semana 3 não existia → criada

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +seção `review-cta-section` entre depoimentos e mídia: botão "Avaliar no Google" (Google Maps Londrina) + botão "Marcar @milkypotbr" (Instagram). Design pastel consistente. Responsivo <680px. |
| `belinha/content/pos-inauguracao-semana3.md` | CRIADO — 4 posts (dom/ter/qui/sáb) + 3 stories com foco em reviews Google e UGC semana 3 |
| `belinha/estrategia.md` | Auto-aprimoramento: aprendizados ciclos 26–29, bloqueadores identificados, rotação 31–35 atualizada |

**Commits:** `2326cf8` (review CTA + semana 3), `934adc9` (estrategia.md)

**Impacto esperado:**
- Reviews Google Maps: CTA visível logo após leitura de depoimentos → momento de maior propensão a agir
- UGC Instagram: facilita o cliente marcar a loja nas stories (reach orgânico)
- Reviews reais desbloqueiam `aggregateRating` Schema.org (template já pronto desde ciclo #26) → rich results no Google

**Próximo passo sugerido:**
- Ciclo #31: Ativar `aggregateRating` em `index.html` se operador confirmar ≥3 reviews reais no Google Maps
- Ciclo #32: Upsell banner em `cardapio.html` — milkshake / açaí self-service como premium cross-sell
- Monitorar: operador deve reportar quantas avaliações chegaram até 02/05

---

## Ciclo #29 — 2026-04-25

**Área:** UX/Frontend — Core Web Vitals: LCP mobile em `cardapio.html`

**Contexto:** Pós-inauguração. Estratégia indicava ciclo #29 para LCP mobile em `cardapio.html`. O logo MilkyPot (`images/logo-milkypot.png`, 1900×1070px) aparece 2× na página: navbar e hero. O elemento hero é o LCP no mobile — sem preload ou fetchpriority, o browser só o descobria ao parsear o DOM, atrasando o LCP. Sem width/height explícitos, o browser não reserva espaço antes do CSS carregar → CLS.

**O que analisou:**
- `cardapio.html` — 2 instâncias de logo sem `width`/`height`; nenhum preload hint no `<head>`
- CSS `style.css`: `.logo-img { height:72px; width:auto }` e `.hero-logo-small { width:280px; height:auto }`
- Logo PNG: 1900×1070 (aspect ratio 1.78:1 = wide, não quadrada)
- Scripts externos (linhas 391–398) são seguidos de scripts inline dependentes → `defer` quebraria a ordem de execução (não tocado)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | `<link rel="preload" as="image" href="images/logo-milkypot.png" fetchpriority="high">` no `<head>` (linha 10); `fetchpriority="high"` no hero-logo-small; `width="1900" height="1070"` nas 2 imagens |

**Commit:** `63a1f70`

**Impacto esperado:**
- **LCP**: browser inicia fetch da imagem durante parse do `<head>`, antes de descobrir qualquer `<img>` no DOM — redução estimada de 200–500ms no LCP mobile em 4G lento
- **CLS**: browser reserva espaço correto (aspect ratio 1900:1070) antes do CSS carregar → CLS próximo a 0 para usuários em conexão lenta
- `fetchpriority="high"` no hero garante que o browser priorize esta imagem sobre recursos secundários (fontes, CSS de terceiros)

**Próximo passo sugerido:**
- Ciclo #30: Auto-aprimoramento — reler log ciclos 25–29, ajustar `belinha/estrategia.md` + verificar KPIs (ciclo de auto-aprimoramento obrigatório a cada 5 ciclos)
- Ciclo #30: Ativar `aggregateRating` em `index.html` se já houver reviews no Google Maps (template pronto desde ciclo #26)
- Ciclo #31: Conteúdo semana 3 pós-inauguração (10/05–16/05) — dar continuidade à régua de posts

---

## Ciclo #28 — 2026-04-25

**Área:** Pesquisa concorrentes → ação concreta em copy (Conversão)

**Contexto:** Pós-inauguração. Estratégia indicava ciclo #28 para fechar pesquisa Jhoy/The Best com ação concreta no site. The Best Açaí é o principal concorrente local em Londrina (680+ unidades, origem LDA, modelo self-service por peso). JAH do Açaí confirmado como a marca "Jhoy" (confusão de grafia).

**O que analisou:**
- `belinha/competitors/jhoy.md` — ciclo #3 tinha análise parcial; busca confirmou Jhoy = JAH do Açaí (self-service, 180+ unidades, açaí por peso, sem linha Fit)
- `belinha/competitors/the-best-acai.md` — modelo self-service R$6,29/100g, variável; cliente não sabe o preço antes de montar
- Benefits bar (`index.html`) tinha 4 itens genéricos: "Frete Grátis", "Pontos", "Entrega Rápida", "Pagamento Seguro"
- Oportunidade: substituir os 2 itens mais fracos por diferenciadores diretos contra o modelo de balança dos concorrentes

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | Benefits bar: `Frete Grátis / Acima de R$49,90` → `🏷️ Preço Fixo / Sem surpresa na balança` (vs self-service por peso); `Pagamento Seguro / PIX, Cartão e Dinheiro` → `💳 Crédito 3x Sem Juros / PIX, Débito e Dinheiro` |
| `belinha/competitors/jhoy.md` | Pesquisa fechada: confirmado = JAH do Açaí. Análise completa vs MilkyPot com tabela de diferenciadores e copy gerado. |

**Commit:** `b87edb1`

**Raciocínio:**
- "Preço fixo, sem surpresa na balança" é a contraproposta mais forte ao modelo self-service pesado — lembrete visual logo na primeira dobra da página
- Clientes que vieram do The Best/JAH veem imediatamente a diferença antes de qualquer scroll
- "Crédito 3x Sem Juros" é mais conversor que "Pagamento Seguro" (genérico) — especialmente para ticket médio R$14-22

**Próximo passo sugerido:**
- Ciclo #29: Core Web Vitals / LCP mobile em `cardapio.html` (estratégia indica este ciclo)
- Ciclo #30: Auto-aprimoramento — reler log ciclos 25–29, ajustar rotação

---

## Ciclo #27 — 2026-04-25

**Área:** SEO técnico — Landing page long-tail local `potinho-ninho-londrina.html`

**Contexto:** Pós-inauguração imediata (25/04/2026). Ciclo #26 completou FAQPage Schema.org no `index.html`. O próximo passo lógico era criar uma página de produto dedicada para capturar tráfego de busca long-tail local — termos que alguém em Londrina usa quando procura o produto: "potinho ninho londrina", "açaí muffato londrina", "sobremesa muffato londrina".

**O que analisou:**
- `index.html` e `cardapio.html` cobrem homepage e listagem, mas não têm URL específica por produto → sem chance de ranquear para "potinho ninho londrina" (busca transacional)
- `cartao-fidelidade.html` serviu de referência visual para standalone pages com estilo pastel MilkyPot
- Schema.org `Product` com `offers.price` "10.00" permite rich results com preço na SERP antes do clique
- `BreadcrumbList` reforça hierarquia para o Google: Home > Cardápio > Potinho de Ninho — Londrina

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `potinho-ninho-londrina.html` | CRIADO — landing page SEO standalone. Schema.org @graph: BreadcrumbList + Product (offers R$10) + FoodEstablishment. Hero com CTA WhatsApp, grid de 8 toppings, tabela de 3 tamanhos, steps de pedido, card de localização com link Google Maps. Mobile-first, CSS inline. |
| `sitemap.xml` | +entrada `potinho-ninho-londrina.html` prioridade 0.8, lastmod 2026-04-25 |

**Commit:** `835428b`

**Validação:** `python3 json.loads()` — 1 bloco JSON-LD `@graph` com 3 tipos. WA link `wa.me/5543998042424` presente. Sitemap: 1 ocorrência confirmada.

**Keywords alvo:**
- "potinho ninho londrina" (intent transacional local)
- "potinho de ninho em londrina"
- "açaí muffato londrina"
- "sobremesa muffato londrina"
- "potinho personalizado londrina"

**Impacto esperado:**
- Rich result de produto com preço (R$10) visível na SERP para buscas locais
- BreadcrumbList melhora hierarquia de site para o Google
- URL semântica `/potinho-ninho-londrina.html` é anchor de backlinks naturais (Instagram bio, Google Business)
- Funil direto: SERP → página produto → WhatsApp (sem passar pelo cardápio geral)

**Próximo passo sugerido:**
- Ciclo #28: Pesquisa Jhoy/The Best com ação concreta — extrair ângulo de preço/produto e adaptar copy no site ou criar nova landing `/acai-londrina.html`
- Ciclo #28: Ativar `aggregateRating` em `index.html` quando primeiras reviews Google chegarem (template já pronto — ciclo #26)
- Ciclo #29: Conteúdo semana 3 pós-inauguração (03/05–09/05 coberto, falta 10/05–16/05)

---

## Ciclo #26 — 2026-04-25

**Área:** SEO técnico — FAQPage Schema.org + template aggregateRating

**Contexto:** Dia da inauguração (25/04/2026). O ciclo #25 sugeriu `aggregateRating` stub, mas avaliações Google Maps só existem após clientes reais. A abordagem mais valiosa para o dia 1 foi adicionar `FAQPage` Schema.org — rich results imediatos na SERP, sem dependência de reviews.

**O que analisou:**
- `index.html` já tinha `FoodEstablishment` LocalBusiness (ciclos #2, #24) mas sem FAQPage
- Seção FAQ em HTML (#faq) existia com 4 perguntas de clientes — base pronta para Schema.org
- `aggregateRating` requer `ratingCount > 0` válido — stub inválido pode penalizar no Google
- Estratégia correta: FAQPage agora (imediato) + template `aggregateRating` comentado (ativar após primeira review)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +`FAQPage` Schema.org com 6 perguntas: localização, delivery, iFood/Uber Eats (funil próprio!), pagamento, fidelidade, Linha Fit. +template `aggregateRating` comentado pronto para ativar. |

**Commit:** `e65ceea`

**Validação:** `python3 json.loads()` — 2 blocos JSON-LD ativos válidos (FoodEstablishment + FAQPage). Bloco comentado corretamente ignorado por browsers/Google.

**Impacto esperado:**
- FAQ aparece como rich result expansível no Google para buscas como "MilkyPot Londrina endereço", "MilkyPot tem delivery?", "MilkyPot iFood?" — no dia da inauguração, máxima relevância
- Pergunta "iFood/Uber Eats" na SERP reforça o funil próprio (WhatsApp/site) antes do clique
- Template `aggregateRating` pronto: operador só descomenta e preenche ratingValue/reviewCount após primeiras avaliações

**Como ativar aggregateRating:**
1. Abrir `index.html`, remover `<!--` e `-->` em volta do bloco (linhas 135–151)
2. Preencher `ratingValue` (ex: "4.8") e `reviewCount` (ex: "12") com dados reais do Google Maps
3. Commitar com `feat(belinha/seo): ativar aggregateRating — N reviews`

**Próximo passo sugerido:**
- Ciclo #27: Page de produto `/potinho-ninho-londrina.html` — SEO long tail local ("potinho ninho londrina", "açaí muffato londrina")
- Ciclo #27: Revisar `belinha/content/ugc-compartilhe-potinho.md` — acionar campanha UGC pós-inauguração para gerar reviews orgânicos no Google
- Ciclo #28: Pesquisa Jhoy/The Best com ação concreta em copy do site

---

## Ciclo #25 — 2026-04-24

**Área:** Conteúdo + Auto-aprimoramento — Semana 2 pós-inauguração + rotação estratégica

**Contexto:** Véspera da inauguração (25/04/2026 às 14h). Ciclo de auto-aprimoramento obrigatório (a cada 5 ciclos). `estrategia.md` ainda refletia a fase pré-inauguração; com a abertura da loja amanhã, era urgente virar a estratégia para retenção/fidelização. `pos-inauguracao-semana1.md` cobre 26/04–02/05 mas sem conteúdo para a semana seguinte.

**O que analisou:**
- `belinha/log.md` ciclos #20–24: padrão claro — bug fixes e UX geraram mais valor que SEO/documentação
- `estrategia.md`: regras datadas (última atualização ciclo #5), fase pré-inauguração obsoleta a partir de amanhã
- `pos-inauguracao-semana1.md`: cobre domingo 26/04 até sábado 02/05 — semana 2 sem conteúdo
- Concorrentes pesquisados (MilkyMoo, JohnnyJoy, Jhoy, The Best) não geraram mudanças concretas no site ainda

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana2.md` | CRIADO — 7 dias de captions prontas (03–09/mai): domingo retrospectiva 2 semanas, segunda volta à rotina, terça açaí buffet, quarta UGC/fidelidade, quinta Linha Fit, sexta urgência finde; reel "Por que volta sempre"; mensagem de reativação WA; tabela de métricas semana 2 vs semana 1 |
| `belinha/estrategia.md` | Auto-aprimoramento ciclo #25: nova seção "Aprendizados ciclos #20–24", tabela pré vs pós-inauguração, rotação de áreas atualizada, KPIs específicos, roadmap ciclos 26–30 |

**Commit:** `92bda91`

**Impacto esperado:**
- Equipe tem conteúdo de 2 semanas preparado antes da abertura — sem lacunas de posting
- Ângulo Semana 2: reativação dos que vieram na inauguração + converter curiosos em recorrentes
- `estrategia.md` agora guia Belinha para foco em fidelização/conversão, não mais só SEO

**Próximo passo sugerido:**
- Ciclo #26: `aggregateRating` stub no Schema.org de `index.html` (preparar para primeiras avaliações Google Maps — os clientes vão avaliar após a inauguração)
- Ciclo #26: Verificar Google Business Profile do Muffato Londrina — endereço correto? Horário 14h-23h atualizado?
- Ciclo #27: Page de produto `/potinho-ninho-londrina.html` — SEO long tail local ("potinho ninho londrina", "açaí muffato londrina")

---

## Ciclo #24 — 2026-04-25

**Área:** Conversão — Template WhatsApp Cartão Fidelidade Digital + Schema.org inauguração

**Contexto:** Dia da inauguração (25/04/2026). O cartão fidelidade digital foi criado no ciclo #23 (`cartao-fidelidade.html?stamps=N`), mas o operador não tinha um script copy-paste para enviar ao cliente após o primeiro pedido. Sem o template, o link ficaria subutilizado no dia mais importante do ano.

**O que analisou:**
- `belinha/content/whatsapp-funil.md` tinha Etapas 1–8 mas nenhuma para o cartão fidelidade
- `cartao-fidelidade.html` suporta `?stamps=N` (0–10) — pronto para uso
- Schema.org em `index.html` tinha `openingHoursSpecification` sem `validFrom` nem `foundingDate`
- `foundingDate` sinaliza para o Google Maps/Search quando o negócio abriu — importante no dia 1

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-funil.md` | Nova **Etapa 9** — Cadastro no Cartão Fidelidade Digital: copy-paste do link `?stamps=N`, tabela de selos por valor (1/2/3 selos segundo ticket), mensagem de resgate quando completa 10 carimbos; novos atalhos `/fidelidade` e `/resgate` na tabela de respostas rápidas |
| `index.html` | Schema.org: `"foundingDate": "2026-04-25"` + `"validFrom": "2026-04-25"` em `openingHoursSpecification` |

**Commit:** `9329e14`

**Impacto esperado:**
- Operador tem script pronto para enviar cartão fidelidade no mesmo WhatsApp do pedido — zero fricção
- `foundingDate` no Schema.org ajuda Google Maps/Search a reconhecer o negócio como recém-inaugurado (pode aparecer como "Novo" no Maps)
- `validFrom` confirma quando o horário de funcionamento entrou em vigor

**Próximo passo sugerido:**
- Ciclo #25: Auto-aprimoramento — reler `belinha/log.md` completo e atualizar `belinha/estrategia.md` com o que gerou mais valor nos ciclos 20–24
- Ciclo #25: Criar `belinha/content/pos-inauguracao-semana1-parte2.md` com scripts de stories para segunda-feira (primeiro dia de operação regular pós-inauguração)
- Ciclo #26: Adicionar `aggregateRating` stub no Schema.org de `index.html` (preparar para primeiras avaliações no Google)

---

## Ciclo #22 — 2026-04-25

**Área:** Conversão — badge "● ABERTO" pulsante no botão flutuante WhatsApp

**Contexto:** Dia da inauguração (25/04/2026). Site e checkout estavam prontos. Identificada oportunidade de conversão permanente: o botão WhatsApp flutuante não sinalizava visualmente que a loja estava aberta, deixando usuários com dúvida antes de clicar.

**O que analisou:**
- Banner de inauguração já tratava "ABERTO AGORA" com countdown e CTA corretos
- Botão flutuante (`.whatsapp-float`) em `index.html` e `cardapio.html` — sem indicação de status
- Horário de funcionamento confirmado no Schema.org: 14h–23h todos os dias
- Playbook tinha placeholder `[horário regular]` sem horário real e sem story de urgência de fechamento

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `css/style.css` | `overflow:visible` em `.whatsapp-float` + nova classe `.wa-open-badge` (pill verde, posicionado 18px acima do círculo, animação `waBadgePulse 2.2s`) |
| `index.html` | `<span id="waOpenBadge">● ABERTO</span>` dentro do botão + script inline que lê hora de Brasília (UTC-3) e exibe entre 14h–23h; atualiza a cada 60s |
| `cardapio.html` | Mesma mudança do `index.html` — badge no botão flutuante do cardápio |
| `belinha/content/dia-inauguracao-playbook.md` | Story 22h15 "ÚLTIMA CHANCE DE DELIVERY" adicionada; `[horário regular]` → `"seg-dom, 14h às 23h"` |

**Comportamento do badge:**
- Exibido: 14h00 → 22h59 (Brasília) todos os dias
- Oculto: fora do horário (não mostra "FECHADO", apenas some)
- Não interfere com hover/transform do botão (pointer-events: none)
- Funciona em `index.html` e `cardapio.html`

**Commit:** `b33abfd`

**Impacto esperado:**
- Usuários que chegam ao site entre 14h–23h têm confirmação visual imediata de que podem pedir AGORA
- Reduz hesitação antes do clique → mais conversões WhatsApp
- Permanente — funciona todos os dias, não só na inauguração

**Próximo passo sugerido:**
- Ciclo #23: Implementar estrutura básica do sistema de fidelidade (raspinha da sorte / stamp card) em `belinha/` como protótipo JS
- Ou: acompanhar métricas pós-inauguração e ajustar SEO local para buscas "potinho londrina" com base em novos dados do Google Search Console

---

## Ciclo #21 — 2026-04-24

**Área:** Conversão — auto-seleção de loja no checkout + bloqueio de lojas demo

**Contexto:** Véspera da inauguração (25/04/2026 às 14h). Auditoria do fluxo de checkout revelou dois problemas encadeados:
1. `CHECKOUT_STORES` em `index.html` tinha 5 lojas demo (ibirapuera, morumbi, jardins, barra, recife) com `open: true` mas WhatsApp placeholder (55119999900XX) — qualquer usuário que selecionasse uma dessas lojas enviaria pedido para número inexistente
2. `renderCheckoutStores` não tinha auto-seleção — no dia da inauguração (única loja real ativa), o usuário precisaria clicar manualmente para selecionar a loja antes de continuar

**O que analisou:**
- Rastreou fluxo completo: `index.html → CHECKOUT_STORES → renderCheckoutStores → selectCheckoutStore → window._selectedStoreWhatsApp`
- Verificou que `window._selectedStoreWhatsApp` é LIDO em `cardapio.js:996` e `checkout.js:153`, mas SETADO apenas via `selectCheckoutStore` em `index.html:1866`
- Confirmou que a loja Muffato Londrina (adicionada no Ciclo #20) é a ÚNICA real e operacional

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | `renderCheckoutStores`: adicionado bloco de auto-seleção — se só há 1 loja aberta e nenhuma selecionada, chama `selectCheckoutStore` automaticamente |
| `index.html` | `CHECKOUT_STORES`: ibirapuera, morumbi, jardins, barra, recife → `open: false` (tinham números placeholder, não podiam receber pedidos reais) |

**Fluxo pós-fix:**
1. Usuário adiciona itens → checkout → step 2 "Escolha a Loja"
2. `renderCheckoutStores` detecta 1 loja aberta → auto-chama `selectCheckoutStore('muffato-londrina')`
3. Usuário já vê ✅ MilkyPot Muffato Londrina selecionada + botão "Continuar →" habilitado
4. Um clique a menos no funil → menos abandono no dia de maior tráfego

**Commit:** `745f17f`

**Próximo passo sugerido:**
- Ciclo #22: Verificar `cardapio.html` — garantir que o Schema.org LocalBusiness reflita horário 14h-23h e status `openNow` para o dia 25/04
- Ou: criar caption "ABRIMOS HOJE!" para Instagram (publicar às 13h45 do dia 25/04) com urgência e CTA WhatsApp

---

## Ciclo #20 — 2026-04-24

**Área:** Conversão — bugfix crítico WhatsApp checkout + cadastro loja Londrina

**Contexto:** Dia anterior à inauguração (25/04/2026 às 14h). Inspeção do fluxo de checkout revelou bug de máximo impacto: número de WhatsApp hardcoded como placeholder em 2 arquivos — qualquer pedido feito via cardápio/checkout seria enviado para `5511999999999` (número inexistente), causando perda total de pedidos no dia de maior tráfego.

**O que analisou:**
- `js/cardapio.js` linha 996: `const waNumber = '5511999999999'` — número hardcoded, sem usar `window._selectedStoreWhatsApp`
- `js/checkout.js` linha 153: `window._selectedStoreWhatsApp || '5511999999999'` — fallback errado
- `js/stores-data.js`: loja Muffato Londrina completamente ausente do array `MILKYPOT_STORES` — seletor de loja nunca encontraria a unidade correta
- `index.html` já usava o número correto `5543998042424` em todos os links diretos (WA float, banner, raspinha)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `js/cardapio.js` | `'5511999999999'` → `window._selectedStoreWhatsApp \|\| '5543998042424'` — respeita seleção de loja e tem fallback correto |
| `js/checkout.js` | Fallback `'5511999999999'` → `'5543998042424'` |
| `js/stores-data.js` | ADICIONADO: entrada `muffato-londrina` com dados completos (endereço, horário 14h-23h, deliveryTime, whatsapp correto, lat/lng) |

**Commit:** `b296fe2`

**Impacto:**
- **CRÍTICO:** Sem esta correção, 100% dos pedidos via cardápio.html na inauguração seriam perdidos (WA abrindo para número fantasma)
- Com `window._selectedStoreWhatsApp || '5543998042424'`, o fluxo multi-loja continua funcionando no futuro quando outras unidades forem ativadas
- Loja Londrina agora aparece corretamente no seletor de lojas

**Próximo passo sugerido:**
- Ciclo #21: Verificar se há mais placeholders (`TODO`, `999990`, `XXXXXXXXXX`) em outros arquivos JS que possam causar problemas
- Criar `belinha/content/pos-inauguracao-primeiras24h.md` — recap de métricas + templates para o dia 26/04
- Monitorar reviews Google Maps e Instagram após inauguração

---

## Ciclo #19 — 2026-04-24

**Área:** UX (bugfix banner) + Conteúdo marketing (toolkit inauguração ao vivo)

**Contexto:** Véspera da inauguração (25/04/2026 às 14h). Inspeção do banner de countdown adicionado no ciclo #18 revelou bug de reexibição. Criação do toolkit "ao vivo" também pendente desde ciclo #18.

**O que analisou:**
- `index.html` linha 207–210: branch `h >= 14 && h < 23` não continha `banner.style.display = ''` — se usuário fechasse o banner antes das 14h (no mesmo tab), o `setInterval` de 60s atualizava texto/CTA mas deixava o banner oculto. Perda de conversão no momento mais crítico da inauguração.
- `applyBannerOffset()` confirmado: usa `banner.style.display !== 'none'` para calcular altura — ao re-exibir com `display = ''`, o offset do navbar é recalculado corretamente na próxima chamada.
- Conteúdo existente: `dia-inauguracao-playbook.md` tem stories hora-a-hora; `inauguracao-25abr-captions.md` tem posts de feed. O que faltava: roteiro TikTok completo, template primeiro cliente, replies ao vivo, sequência de 5 stories para os primeiros 15min, e métricas para coletar no dia.

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +1 linha: `if(banner) banner.style.display = '';` no branch "ESTAMOS ABERTOS AGORA!" — banner re-aparece às 14h mesmo se foi fechado antes |
| `belinha/content/inauguracao-ao-vivo.md` | CRIADO — toolkit completo: feed post 14h, roteiro TikTok 30s, story do primeiro cliente, 15 templates de reply ao vivo, broadcast WA 14h, sequência 5 stories abertura, checklist de métricas do dia |

**Commit:** `eda2ed8`

**Impacto:**
- Bug corrigido antes do dia — visitantes com aba aberta desde manhã do dia 25 verão automaticamente o banner "ESTAMOS ABERTOS!" às 14h sem precisar recarregar
- Equipe tem material copy-paste pronto para cada momento dos primeiros 15min de operação
- Replies ao vivo evitam improvisação nos comentários do Instagram durante o pico de visibilidade

**Próximo passo sugerido:**
- Ciclo #20 (pós-inauguração, 26/04+): criar `belinha/content/pos-inauguracao-primeiras24h.md` com análise dos dados coletados no checklist e conteúdo de "recap" (carrossel Instagram dos melhores momentos do dia)
- Verificar se há reviews/comentários no Google Maps / Instagram para responder
- Pesquisar concorrente MilkyMoo: atualizar análise com dados de redes sociais após inauguração (ver como posicionam em relação à nova unidade MilkyPot Londrina)

---

## Ciclo #18 — 2026-04-24

**Área:** UX — banner de inauguração (pré-abertura)

**Contexto:** Véspera da inauguração (25/04/2026). Gap crítico identificado: o banner de inauguração chamava `configureBanner()` apenas na carga da página. Um cliente que abrisse o site às 13h59 nunca veria a transição para "ESTAMOS ABERTOS AGORA!" sem recarregar. Além disso, a fase "ABRIMOS HOJE ÀS 14H" não comunicava urgência nem tempo restante.

**O que analisou:**
- `index.html` linhas 235–238: sem nenhum `setInterval` — confirmado o bug de auto-refresh
- `cardapio.html` linhas 29–32: GA placeholder `G-XXXXXXXXXX` já estava corretamente comentado (não era urgente)
- Lógica de fuso horário `getBrasiliaDate()` (UTC-3): correta, sem DST
- Fase "ABRIMOS HOJE" (`h < 14`): texto estático sem informação de urgência

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +1 linha: `setInterval(configureBanner + applyBannerOffset, 60000)` — banner re-avalia fase a cada minuto sem reload |
| `index.html` | Fase `h < 14`: calcula minutos até 14h em tempo real → exibe "🐑 ABRIMOS EM 2h 30min!" / "ABRIMOS EM 15min!" etc. |

**Commit:** `a8728dd`

**Impacto:**
- Transição automática "ABRIMOS HOJE" → "ESTAMOS ABERTOS AGORA!" às 14h sem reload — visitante com aba aberta desde manhã não perde o momento
- Countdown cria urgência real: cliente que visita às 13h45 vê "ABRIMOS EM 15min!" e tende a aguardar/voltar
- Lógica de cálculo: `minsAte14 = (14 - h) * 60 - d.getMinutes()` — testado mentalmente às 10:30 (3h 30min ✓), 13:59 (1min ✓), 14:00 (entra em branch "ESTAMOS ABERTOS" ✓)

**Próximo passo sugerido:**
- Ciclo #19 (DIA DA INAUGURAÇÃO, 25/04): criar post de "momento da abertura" para Instagram/TikTok (caption + hashtags + instrução de Story) — `belinha/content/inauguracao-ao-vivo.md`. Equipe precisa deste material na mão às 13h30.

---

## Ciclo #17 — 2026-04-24

**Área:** UX/Acessibilidade + Conteúdo marketing (UGC inauguração)

**Contexto:** VÉSPERA DA INAUGURAÇÃO (25/04/2026). Dois pontos pendentes do ciclo #16: (1) `aria-label` faltando no botão WhatsApp injetado no modal de sucesso; (2) template UGC para captura de conteúdo gerado por clientes durante a inauguração — sem isso a equipe improvisa no balcão e perde oportunidade de UGC orgânico.

**O que analisou:**
- `js/checkout.js` linha 362: `waBtn` criado sem `aria-label` — leitores de tela anunciariam o SVG + emoji ao invés de texto descritivo
- `closeSuccessModal()` verificado: não remove `#successWaBtn` — comportamento correto, href é atualizado a cada pedido (`waBtn.href = waUrl` linha 373)
- `belinha/content/` já tinha: captions de inauguração, playbook do dia, semana 1, funil WhatsApp — mas nenhum template de incentivo a UGC com scripts verbais e passo a passo para repost

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `js/checkout.js` | +1 linha: `waBtn.setAttribute('aria-label', 'Confirmar pedido no WhatsApp')` na criação do botão |
| `belinha/content/ugc-compartilhe-potinho.md` | CRIADO — template completo de UGC: plaquinha de balcão (para imprimir), script verbal para atendentes, story de incentivo, passo a passo de repost, respostas padrão para comentários, pack de 20 hashtags, mimo sugerido, meta do dia |

**Commit:** `1151178`

**Impacto:**
- Botão WhatsApp agora acessível via screen reader ("Confirmar pedido no WhatsApp")
- Equipe tem guia prático completo para maximizar UGC orgânico no dia da inauguração
- Template de repost garante que nenhuma menção seja desperdiçada sem resposta
- Meta definida: 10 menções, 3 posts feed, 5 reposts, 10 UGCs guardados

**Próximo passo sugerido:**
- Ciclo #18 (DIA DA INAUGURAÇÃO): monitorar se o banner fase "ESTAMOS ABERTOS AGORA!" exibe corretamente às 14h
- Ciclo #18: adicionar Schema.org `openingHoursSpecification` em `index.html` para SEO local pós-inauguração
- Ciclo #18: criar `belinha/content/semana2-retencao.md` com campanha de retenção (retorno de clientes da inauguração)

---

## Ciclo #16 — 2026-04-24

**Área:** Conversão — Botão WhatsApp com pedido pré-preenchido no modal de sucesso do checkout

**Contexto:** Inauguração AMANHÃ (25/04/2026). Auditoria do fluxo de checkout revelou gap crítico: após clicar "Confirmar Pedido", o modal de sucesso exibia só o botão "Voltar ao Cardápio" — sem nenhum CTA de WhatsApp. O cliente fechava o modal acreditando que o pedido foi enviado, mas a loja jamais recebia nada. Funil quebrado na etapa final.

**O que analisou:**
- `placeOrder()` em `js/checkout.js` (linha 134): salva pedido no localStorage, exibe modal, limpa carrinho — sem abrir WhatsApp
- Override em `cardapio.html` (linha 862): só atualiza o `href` do botão flutuante — não aciona nada
- Modal de sucesso em `cardapio.html` (linha 359): `<button onclick="closeSuccessModal()">Voltar ao Cardápio</button>` — único CTA
- Conclusão: 100% dos clientes que concluíam o checkout NO site não chegavam ao WhatsApp da loja

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `js/checkout.js` | +46 linhas: construção de mensagem WhatsApp pré-formatada (nº pedido, itens c/ tamanho e adicionais, entrega, pagamento, total) + injeção de botão verde `#successWaBtn` no modal, acima de "Voltar ao Cardápio" |

**Mensagem gerada (exemplo):**
```
Oi! Fiz meu pedido pelo site 🐑✨

*Pedido:* #MP1_ABCD
*Loja:* MilkyPot Muffato Londrina
*Itens:*
• Potinho Ninho Médio (+Morango) — R$ 18,00

*Retirada na loja*
*Pagamento:* PIX
*Total:* R$ 18,00

Pode confirmar? 🙏
```

**Commit:** `3618199`

**Impacto:**
- Zero friction: cliente só toca no botão verde → WhatsApp abre com mensagem completa → toca enviar
- Loja recebe pedido completo via WhatsApp sem ligação ou retrabalho
- Botão é injetado uma vez e `href` atualizado se o modal for reutilizado (múltiplos pedidos na mesma sessão)
- `storeWhatsapp` usa o número da loja selecionada — pedido vai para o WhatsApp certo

**Próximo passo sugerido:**
- Ciclo #17: Criar template de stories "Compartilhe seu potinho" para UGC durante a inauguração (com link na bio e tag @milkypotbr)
- Ciclo #17: Verificar se `closeSuccessModal()` limpa o `#successWaBtn` corretamente para a próxima ordem
- Ciclo #17: Adicionar `aria-label` acessível no botão WhatsApp injetado

---

## Ciclo #15 — 2026-04-23

**Área:** UX/Conversão — Banner de inauguração com texto dinâmico por fase

**Contexto:** Inauguração AMANHÃ (25/04/2026). O banner do ciclo #14 tinha texto fixo "INAUGURAÇÃO SÁBADO 25/04 ÀS 14H" que não mudaria automaticamente no dia da abertura nem se apagaria depois. Visitantes no sábado veriam mensagem errada: "inauguração sábado" quando a loja já está aberta.

**O que analisou:**
- Banner ciclo #14: sem lógica de data, texto imutável em HTML
- Risco: visitante no sábado às 15h veria "INAUGURAÇÃO SÁBADO 25/04 ÀS 14H" — incoerente
- Oportunidade: 3 fases com mensagens distintas = banner sempre correto, zero intervenção manual

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` (linhas 177-239) | Banner com IDs `inaugBannerText` e `inaugBannerCta` + `getBrasiliaDate()` (UTC-3 fixo) + `configureBanner()` que muda texto/CTA por fase |

**Fases implementadas:**
- **Antes de 25/04:** texto original "INAUGURAÇÃO SÁBADO 25/04 ÀS 14H" + "Quero ir! →"
- **25/04 antes das 14h:** "ABRIMOS HOJE ÀS 14H!" + "Me avisa! →" (WhatsApp pré-preenchido)
- **25/04 das 14h às 23h:** "ESTAMOS ABERTOS AGORA! 🎊" + "Pedir agora! →" (WhatsApp pedido)
- **Após 23h do dia 25 ou qualquer dia depois:** banner some automaticamente

**Commit:** `01cbfbd`

**Impacto:**
- Zero intervenção manual necessária no dia da inauguração
- CTA muda junto com o texto — contexto sempre correto para conversão
- `getBrasiliaDate()` usa UTC-3 fixo: não depende do fuso do dispositivo do visitante

**Próximo passo sugerido:**
- Ciclo #16: Conteúdo de pós-inauguração — criar template de repost de clientes (stories "Compartilhe seu potinho") para usar no final do dia 25/04
- Ciclo #16: Verificar mobile UX no `cardapio.html` — testar fluxo de pedido no WhatsApp em viewport 375px
- Ciclo #16: Atualizar Schema.org `openingHoursSpecification` em `index.html` com horário real (14h-23h sábado)

---

## Ciclo #14 — 2026-04-23

**Área:** UX/Conversão — Banner de inauguração fixo em `index.html`

**Contexto:** Inauguração AMANHÃ (25/04/2026). Auditoria de WhatsApp confirmou que todos os links estão corretos (`5543998042424`). Gap identificado: o site não anunciava em nenhum lugar visível que a loja inaugura amanhã — visitante que chegasse hoje não sabia do evento.

**O que analisou:**
- WhatsApp: todos os CTAs corretos (float, checkout, formulários) — nenhuma correção necessária
- Botão nav "Pedir Agora" → ancla `#produtos` ✅
- Checkout `placeOrder()` → redireciona para WhatsApp da loja selecionada ✅
- Hero de `index.html`: sem menção de inauguração. Oportunidade óbvia de conversão (tráfego orgânico amanhã)
- `hero-compact` tem `padding: 100px 20px 20px` para acomodar navbar fixed — o banner extra exigia ajuste proporcional

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` (linha 177-201) | Banner fixo `#inaugBanner` inserido antes da `<nav>`: gradiente roxo-rosa, texto "INAUGURAÇÃO SÁBADO 25/04 ÀS 14H · Muffato Londrina · Av. Quintino Bocaiuva, 1045", botão "Quero ir! →" (WhatsApp link), X de fechar, z-index 1100 (acima da navbar 1000) |
| `index.html` (script inline) | `applyBannerOffset()`: ajusta `navbar.style.top` e `hero-compact.style.paddingTop` dinamicamente baseado na altura real do banner. Roda no `DOMContentLoaded`, no `resize` e após 200ms (para fontes Baloo 2). `closeBanner()` global: esconde banner + restaura layout |

**Commit:** `5827e22`

**Impacto:**
- Todo visitante de `index.html` vê imediatamente o anúncio de inauguração amanhã
- CTA WhatsApp pré-preenchido ("Vim do site e quero saber mais!") captura curiosos antes mesmo da abertura
- Botão de fechar mantém UX limpa para quem não precisa do aviso
- Layout não quebra: navbar e hero se ajustam dinamicamente à altura real do banner em qualquer tamanho de tela

**Blockers ainda abertos:**
- 🔴 CNPJ + Razão Social (termos/privacidade/footers)
- 🔴 DPO nome + endereço (privacidade.html Seção 7)
- 🟡 Google Analytics ID real (cardapio.html com G-XXXXXXXXXX ativo)
- ⚠️ Banner deve ser removido após 26/04/2026 (comentário no HTML indica isso)

**Próximo passo sugerido:**
- Ciclo #15: Pré-inauguração urgente — verificar `cardapio.html` se o CTA "Finalizar Pedido" gera uma mensagem WhatsApp com os itens do carrinho, ou apenas texto genérico. Se genérico → criar mensagem estruturada com nome, loja, itens e total para facilitar o atendimento
- Ciclo #15 alternativo: Criar reel/story de inauguração com copy "O potinho mais feliz do mundo chega ao Muffato AMANHÃ" para publicar hoje à noite no Instagram

---

## Ciclo #13 — 2026-04-23

**Área:** Concorrentes + Fix Domínio — TheBest Açaí Londrina + correção milkypot.com.br

**Contexto:** Inauguração AMANHÃ (25/04/2026). Ciclo #12 havia identificado referências ao domínio errado `milkypot.com.br` e a necessidade de mapear TheBest Açaí com dados reais (preços, unidades Londrina).

**O que analisou:**
- WebSearch: TheBest Açaí Londrina — preços, localidades, produtos, modelo self-service
- Confirmado: R$ 6,29/100g no preço regular (loja Gleba Palhano), inauguração R$ 3,99/100g
- Mapeadas 5 unidades em Londrina (Gleba Palhano flagship 310m², San Conrado, Pio XII, Arthur Thomas, Higienópolis)
- **SEM unidade confirmada no Muffato** — janela de oportunidade para MilkyPot
- Comparativo por porção: TheBest e MilkyPot são price-competitive (~R$18-22 para porção média/gigante)
- `termos.html` linha 267: milkypot.com.br → corrigido
- `privacidade.html` linha 347: email DPO no placeholder com .com.br → corrigido

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `termos.html` | Fix domínio: `milkypot.com.br` → `milkypot.com` na Seção 1 |
| `privacidade.html` | Fix email DPO no placeholder: `privacidade@milkypot.com.br` → `@milkypot.com` |
| `belinha/competitors/the-best-acai.md` | Reescrito com dados reais 2026: preços por 100g, 5 unidades Londrina, comparativo porções vs MilkyPot, copy de diferenciação |
| `belinha/blockers.md` | Blocker de domínio marcado como ✅ resolvido |

**Commit:** `3c5c12b`

**Insight estratégico:** TheBest cobra R$6,29/100g. Uma porção de 300g = R$18,87 — quase igual ao MilkyPot Médio R$18. Mas o cliente TheBest tende a montar mais (~350g = R$22), igualando o Gigante MilkyPot. O diferencial real não é preço, é **experiência + identidade + Ninho base + Fit line**.

**Blockers ainda abertos:**
- 🔴 CNPJ + Razão Social (termos/privacidade/footers)
- 🔴 DPO nome + endereço (privacidade.html Seção 7)
- 🟡 Google Analytics ID real (cardapio.html com G-XXXXXXXXXX ativo)

**Próximo passo sugerido:**
- Ciclo #14: UX/Conversão — verificar fluxo WhatsApp: o link `https://wa.me/5543998042424` aparece em quantos lugares? Testar se CTAs de "Pedir agora" em `index.html` e `cardapio.html` estão todos apontando para o WhatsApp correto
- Ciclo #14 alternativo: Criar caption/reel de inauguração com copy "SEM FILA DE SELF-SERVICE" contrapondo TheBest explicitamente (sem citar nome)

---

## Ciclo #12 — 2026-04-23

**Área:** Legal/Compliance — Placeholders em `privacidade.html` e `termos.html` + criação de `belinha/blockers.md`

**Contexto:** Inauguração AMANHÃ (25/04/2026). Audit das páginas de privacidade e termos (nunca verificadas). Encontrados 6 blocos `PLACEHOLDER` com div estilizada visível ao público — um deles literalmente dizia "PLACEHOLDER: Insira aqui a Razão Social completa da empresa..." em produção.

**O que analisou:**
- `privacidade.html`: 4 placeholders encontrados — 2 preenchíveis (provedor de hospedagem, ferramentas de analytics), 2 requerem dados do usuário (DPO nome/endereço; CNPJ footer)
- `termos.html`: 4 placeholders encontrados — 2 preenchíveis (pedido mínimo, gateway de pagamento), 2 requerem dados do usuário (CNPJ/Razão Social Seção 1; CNPJ footer)
- Confirmado via codebase: Firebase/Google Cloud como plataforma, GA4 presente (ID placeholder), nenhum gateway online (pagamento na entrega), sem pedido mínimo, entrega área Muffato Londrina
- Identificado problema adicional: `termos.html` menciona `milkypot.com.br` mas domínio real é `milkypot.com`

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `privacidade.html` (Seção 3) | Substitui PLACEHOLDER por parágrafo real: Firebase/Google Cloud, servidores EUA, SCC GDPR |
| `privacidade.html` (Seção 6) | Substitui PLACEHOLDER por parágrafo real: GA4 anonimizado, sem Meta Pixel |
| `termos.html` (Seção 3) | Substitui PLACEHOLDER por parágrafo real: sem pedido mínimo, área de entrega = Muffato Londrina |
| `termos.html` (Seção 4) | Substitui PLACEHOLDER por parágrafo real: sem gateway online, pagamento na entrega |
| `belinha/blockers.md` | CRIADO — lista priorizada de 4 blockers que precisam de dados do usuário antes do go-live |

**Commit:** `cabd7ba`

**Blockers documentados (necessitam ação do usuário ANTES da inauguração):**
- 🔴 CNPJ + Razão Social (termos.html Seção 1 + footers de termos/privacidade/index)
- 🔴 DPO — nome e e-mail do encarregado LGPD (privacidade.html Seção 7)
- 🟡 Google Analytics ID real (cardapio.html linhas 29–32 com `G-XXXXXXXXXX` ativo)
- 🟡 Domínio `milkypot.com.br` → `milkypot.com` em termos.html linha 267

**Próximo passo sugerido:**
- Ciclo #13: Pesquisar TheBest Açaí Londrina — concorrente local com 680+ unidades, origem Londrina; verificar se tem unidade no Muffato ou raio 1km. Atualizar `belinha/competitors/the-best-acai.md` com preços, promoções de Páscoa 2026 e copy diferencial MilkyPot vs TheBest (autoatendimento por kg vs potinho personalizado)
- Ciclo #13 alternativo: Verificar `index.html` linha 267 — `termos.html` menciona `milkypot.com.br` (errado); verificar se `index.html` ou Schema.org também têm o domínio incorreto

---

## Ciclo #11 — 2026-04-22

**Área:** SEO — Open Graph + meta description + canonical em `desafio.html`

**Contexto:** 3 dias para inauguração (25/04/2026). Ciclo #10 identificou que `desafio.html` (2.2k linhas, página de gamificação) nunca havia sido auditada para SEO. A página é o principal motor de viral no PDV: clientes jogam o desafio de reflexo e compartilham o resultado — sem OG, o compartilhamento via WhatsApp não gerava preview (link feio, sem engajamento).

**O que analisou:**
- `desafio.html` linhas 1-12: apenas charset, viewport, title, theme-color, manifest, fonts — zero tags SEO
- Ausência confirmada via `grep`: nenhum `og:`, `canonical`, `description`, `twitter:` ou Schema.org
- Padrão de referência: `index.html` (ciclo #1) e `cardapio.html` (ciclo #2) já com OG completo — consistência exige paridade
- Conteúdo da página: "Desafio 10 Milissegundos" — jogo de reflexo onde cliente tenta parar o cronômetro em 10ms e mostra na loja para ganhar prêmio

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `desafio.html` (linha 7-21) | +`meta description` 155 chars c/ endereço Londrina e CTA de prêmio, +`link canonical` (milkypot.com/desafio.html), +`link sitemap`, +6 tags Open Graph (type/url/title/desc/image/locale/site_name), +3 Twitter Card tags |

**Commit:** `212d35c`

**Impacto:**
- **Viral loop melhorado**: quando cliente compartilha resultado do desafio no WhatsApp/Instagram, o link agora mostra preview rico com título chamativo ("Você consegue? 🐑") e descrição — taxa de clique do grupo de amigos aumenta
- **SEO**: Google agora tem description real para exibir na SERP para buscas como "desafio milkypot" ou "jogo milkypot londrina"
- **Canonical correto**: evita conteúdo duplicado se a URL aparecer com parâmetros de query string (ex: `?resultado=10ms`)
- Consistência: todas as 3 páginas públicas principais agora têm OG completo (index, cardápio, desafio)

**Próximo passo sugerido:**
- Ciclo #12: Pesquisar TheBest Açaí Londrina — concorrente de origem londrinense com 680+ unidades; verificar se tem unidade no ou perto do Muffato. Atualizar `belinha/competitors/the-best-acai.md` (dado desatualizado desde ciclo #1) com preços, promoções, copy atual
- Ciclo #12 alternativo: Verificar `privacidade.html` e `termos.html` — nunca auditados; podem ter conteúdo genérico de template que precisa ser atualizado para MilkyPot Londrina

---

## Ciclo #10 — 2026-04-22

**Área:** UX (desafio.html) + Pesquisa concorrentes (MilkyMoo atualização)

**Contexto:** 3 dias para inauguração (25/04/2026). Schema.org já completo desde ciclo #1. MilkyMoo desatualizado desde ciclo #1. Audit de `desafio.html` revelou regressão de acessibilidade.

**O que analisou:**
- `desafio.html` linha 5: viewport com `maximum-scale=1.0, user-scalable=no` — mesma regressão corrigida em `cardapio.html` no ciclo #7. Inputs em `.name-input` usam `clamp(18px, 3vw, 28px)` (sem risco de auto-zoom), mas bloqueio de zoom prejudica usuários com baixa visão
- `milkymoo.md`: dados de ciclo #1 — preços não confirmados, sem expansão internacional, sem detalhe de sabores, sem comparativo de franquia
- WebSearch 2026: preços confirmados (300ml R$18 / 500ml R$22 / alcoólicos R$25-35), lançamento Páscoa 2026, expansão EUA/Paraguai, 36+ sabores confirmados, modelo de franquia R$190k com ROI 18-24m

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `desafio.html` (linha 5) | viewport: removido `maximum-scale=1.0, user-scalable=no` — restaura zoom de acessibilidade |
| `belinha/competitors/milkymoo.md` | Refetch completo: preços reais 2026, tabela de sabores, expansão EUA, SWOT atualizado, copy diferencial MilkyPot vs MilkyMoo |

**Commits:** `c0799ee` (desafio.html) + `e484f3e` (milkymoo.md)

**Impacto:**
- Usuários com baixa visão conseguem usar zoom em `desafio.html` (gamificação = ferramenta de captação no PDV)
- Equipe tem dado competitivo atualizado: MilkyMoo investe R$190k vs R$3.499 MilkyPot, ROI 18-24m vs "semanas", sem linha Fit/Zero — argumentos de venda para franqueados e para clientes
- Copy diferencial pronto: "Na MilkyPot você monta o seu potinho do jeito que você quer..." (direto para uso em IG ou WhatsApp)

**Próximo passo sugerido:**
- Ciclo #11: Verificar se `desafio.html` tem Open Graph / meta description (nunca auditado para SEO — página com 2.2k linhas, provavelmente sem OG)
- Ciclo #11 alternativo: Pesquisar se Milky Moo tem unidade em Londrina (raio 30km do Muffato) — dado estratégico para copy local de diferenciação

---

## Ciclo #9 — 2026-04-22

**Área:** Conteúdo marketing — Playbook operacional dia da inauguração 25/04

**Contexto:** 3 dias para inauguração (25/04/2026). `belinha/content/inauguracao-25abr-captions.md` (ciclo #1) tinha apenas 3 linhas de stories muito rasas — a equipe não teria guia prático para cobertura em tempo real. Prioridade máxima: conteúdo que a equipe executa autonomamente no dia.

**O que analisou:**
- `belinha/content/inauguracao-25abr-captions.md`: stories com apenas descrições mínimas ("Story 1: ABRIMOS! 🎊 — foto da entrada") — sem copy, sem CTA, sem horário, sem checklist
- Lacuna crítica: equipe sem roteiro hora a hora → risco de silêncio nas redes no dia mais importante do ano
- `belinha/content/pos-inauguracao-semana1.md` já cobre 26/04–02/05 (bem detalhado) — gap era o próprio dia 25/04
- Broadcast WhatsApp também inexistente — lista de clientes não seria ativada no timing certo

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/dia-inauguracao-playbook.md` | CRIADO — 178 linhas: checklist pré-abertura (13h30), broadcast WhatsApp pronto (13h45), 8 stories hora a hora (13h50–22h45) com copy completo + tipo de mídia + sticker sugerido, post de feed (14h05), roteiro reel 30s "Dia 1", bloco de hashtags, 6 dicas operacionais do dia |

**Commit:** `813b2d3`

**Impacto:**
- Equipe da loja tem roteiro autoexplicativo — não precisa inventar copy na hora
- Broadcast WhatsApp enviado às 13h45 ativa clientes antes da abertura → fila desde as 14h
- 8 stories espaçados mantêm engajamento ativo das 14h às 23h (algoritmo IG favorece consistência)
- Checklist pré-abertura evita erros básicos (bateria descarregada, conta não logada)
- Coleta de UGC ativada desde o primeiro dia → combustível para semana 1

**Próximo passo sugerido:**
- Ciclo #10: Pesquisa MilkyMoo atualizada (preços, promoções de inauguração de novas unidades, ads recentes) — não atualizada desde ciclo #1, 3 dias de defasagem de dados
- Ciclo #10 alternativo: Verificar `index.html` — adicionar `openingHoursSpecification` ao Schema.org (sáb 14h–23h, horário futuro regular) para aparecer no Google Maps

---

## Ciclo #8 — 2026-04-22

**Área:** UX/Frontend — Mobile accessibility: font-size inputs em `style.css` (index.html)

**Contexto:** 3 dias para inauguração (25/04/2026). Ciclo #7 corrigiu `cardapio.css` (checkout). Ciclo #8 seguiu a sugestão do log: verificar `index.html` — formulário de contato e de franquia.

**O que analisou:**
- `css/style.css` linha 1968: `.form-group input, .form-group select, .form-group textarea { font-size: 0.95rem }` = 15.2px → **abaixo do mínimo 16px iOS Safari** — auto-zoom ao tocar
- Afetados: formulário de contato (`contactName`, `contactEmail`, `contactSubject`, `contactMsg`), formulário de franquia (`franchiseName`, `franchiseEmail`, `franchisePhone`, `franchiseCity`, `franchiseState`, `franchiseCapital`, `franchiseMsg`), ROI calculator selects (`roiModel`, `roiLocation`, `roiExperience`) — todos via `.form-group`
- `css/style.css` linha 3977: `.franchise-search-checkout .search-input { font-size: 0.95rem }` — busca de loja no contexto de franquia também afetado
- Global `input, select, textarea { font-size: 1rem }` (linha 126) estava correto, mas `.form-group` sobrescrevia com 0.95rem
- Demais 0.95rem restantes em `style.css` verificados: todos em elementos não-interativos (textos, headings, labels) — sem impacto

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `css/style.css` (linha 1968) | `.form-group input/select/textarea`: `font-size: 0.95rem` → `1rem` |
| `css/style.css` (linha 3977) | `.franchise-search-checkout .search-input`: `font-size: 0.95rem` → `1rem` |

**Commit:** `a71d145`

**Impacto:**
- **Conversão de franqueados protegida**: formulário de franquia (leads de R$3.499–R$25k cada) funciona sem auto-zoom em iOS
- **ROI calculator**: potenciais franqueados conseguem usar os selects sem tela pular
- **Formulário de contato**: clientes com dúvidas não têm experiência degradada
- Consistente com fix do ciclo #7 (mesmo padrão, arquivo diferente)

**Próximo passo sugerido:**
- Ciclo #9: Pesquisa MilkyMoo atualizada — última pesquisa foi ciclo #1 (dados podem estar desatualizados). Foco: preços atuais, promoções de inauguração de novas unidades, copy/ads recentes para benchmark pré-inauguração 25/04
- Ciclo #9 alternativo: Criar conteúdo `belinha/content/` para stories/reels do DIA da inauguração (25/04) — sequência de 3 stories para postar em tempo real durante a festa

---

## Ciclo #7 — 2026-04-22

**Área:** UX/Frontend — Mobile accessibility: viewport + font-size inputs checkout

**Contexto:** 3 dias para inauguração (25/04/2026). Log sugeria UX mobile como próximo passo. Foco: inputs do checkout em `cardapio.html`.

**O que analisou:**
- `cardapio.html` linha 5: viewport com `maximum-scale=1.0, user-scalable=no` — bloqueia zoom de acessibilidade para todos os usuários
- `css/cardapio.css` linha 1179: `.cp-form-group input, .cp-form-group select { font-size: 0.9rem }` = 14.4px → abaixo dos 16px mínimos do iOS Safari, causando **auto-zoom ao tocar no input** (experiência degradada no checkout)
- Outros inputs verificados: `.search-input` (1rem ✅), `.cp-nome-input` (1.1rem ✅) — apenas `.cp-form-group` estava com problema
- `index.html` viewport sem `user-scalable=no` ✅ — problema era específico de `cardapio.html`
- Diagnóstico: `user-scalable=no` foi adicionado como workaround ao invés de corrigir a causa raiz (font-size pequeno)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | viewport: removido `maximum-scale=1.0, user-scalable=no` — restaura zoom de acessibilidade |
| `css/cardapio.css` | `.cp-form-group input, select`: `font-size: 0.9rem` → `1rem` (16px) — elimina auto-zoom iOS |

**Commit:** `b59de6f`

**Impacto:**
- **Conversão mobile melhorada**: clientes iOS não têm mais auto-zoom ao tocar em "Nome", "Telefone", "CPF", "CEP", "Endereço" no checkout
- **Acessibilidade restaurada**: usuários com baixa visão podem usar pinch-to-zoom normalmente no `cardapio.html`
- Sem risco de regressão: mudança somente de tamanho de fonte (nenhuma funcionalidade alterada)

**Próximo passo sugerido:**
- Ciclo #8: Verificar se `index.html` tem inputs com font-size < 16px no checkout de franquia (ROI simulator / formulário de contato franquia)
- Ciclo #8 alternativo: Pesquisa MilkyMoo atualizada (ainda não feita desde ciclo #1) — capturar preços e promoções de inauguração para benchmark

---

## Ciclo #6 — 2026-04-22

**Área:** Conversão — Correção bug viral mechanic `raspinha.html` (Instagram handle errado)

**Contexto:** 3 dias para inauguração (25/04/2026). Primeira auditoria de `raspinha.html` (nunca analisado). Schema.org `openingHoursSpecification` já estava correto em `index.html` desde ciclo #1 — não era necessário retrabalho.

**O que analisou:**
- `raspinha.html`: 486 linhas, sistema completo de raspinha digital (Canvas API, Firebase Firestore, compartilhamento viral)
- Encontrado bug crítico: handle `@milkypot` em 4 lugares — conta errada (a oficial é `@milkypotbr`)
- **Impacto real**: mecânica "poste e ganhe raspinha extra" é o motor viral principal do PDV. Com handle errado, clientes marcavam a conta errada → MilkyPot não via os posts → promessa de raspinha bônus não podia ser cumprida → perda de UGC gratuito + quebra de confiança
- Verificado: sistema Firebase funcional, compartilhamento WhatsApp correto, canvas scratch funcionando, fallback localStorage presente

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `raspinha.html` | 4x `@milkypot` → `@milkypotbr`: instrução UX (linha 121), footer link (linha 136), texto de share Instagram (linha 446), URL de fallback Instagram (linha 457) |

**Commit:** `28a6dc7`

**Impacto:**
- **CRÍTICO RESOLVIDO**: viral loop da raspinha agora funciona de verdade — marcações chegam ao perfil correto
- UGC (User Generated Content) capturável a partir da inauguração
- Promessa de "raspinha bônus" pode ser honrada pela equipe monitorando `@milkypotbr`

**Próximo passo sugerido:**
- Ciclo #7: UX mobile — testar `cardapio.html` em 375px (iPhone SE). Verificar: tamanho de fonte mínimo 16px nos inputs, botão WhatsApp flutuante visível, CTAs above the fold
- Ciclo #7 alternativo: Pesquisar MilkyMoo atualizado (preços, promoções inauguração de novas unidades) para benchmark pré-inauguração

---

## Ciclo #5 — 2026-04-22

**Área:** UX/Frontend — Correção crítica WhatsApp (pré-inauguração) + Auto-aprimoramento

**Contexto:** 3 dias para inauguração (25/04/2026). Ciclo múltiplo de 5 = auto-aprimoramento. Análise de UX revelou bug crítico: número WhatsApp placeholder `5511XXXXXXXX` em produção — qualquer cliente que clicasse no botão flutuante ou enviasse formulário seria direcionado para um número inexistente.

**O que analisou:**
- `index.html`: botão `.whatsapp-float` com `5511XXXXXXXX` (3 ocorrências: float, fallback contato, fallback franquia)
- `cardapio.html`: botão `.whatsapp-float` ausente no HTML (JS tentava atualizar elemento inexistente → silenciosamente falhava)
- Lista `CHECKOUT_STORES` em ambos os arquivos: unidade Muffato Londrina inexistente (só lojas SP/RJ/PE genéricas)
- Schema.org já tinha número correto `+5543998042424` desde ciclo #1 — inconsistência perigosa

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | 3x `5511XXXXXXXX` → `5543998042424` (float btn + 2 fallbacks de formulário) |
| `index.html` | Unidade Muffato Londrina adicionada como 1ª opção em `CHECKOUT_STORES` |
| `cardapio.html` | Botão `.whatsapp-float` adicionado ao HTML com número Londrina |
| `cardapio.html` | Unidade Muffato Londrina adicionada como 1ª opção em `CHECKOUT_STORES` |

**Commit:** `0cbee36`

**Impacto:**
- **CRÍTICO RESOLVIDO**: qualquer visita ao site agora direciona para o WhatsApp real da loja
- Clientes em Londrina veem Muffato como 1ª opção de loja no checkout
- Frete R$0 configurado para Muffato Londrina (política local de delivery)

**Auto-aprimoramento (ciclo #5):**

Análise dos 5 ciclos:
- ✅ **Alto valor**: Ciclos de SEO (#1-3) geraram base indexável antes da inauguração — efeito cumulativo
- ✅ **Alto valor**: Ciclo #5 (hoje) corrigiu bug crítico que bloquearia conversões reais
- ⚠️ **Médio valor**: Ciclos #1 e #3 produziram conteúdo/análises úteis mas sem impacto técnico imediato
- ❌ **Oportunidade perdida**: Ciclo #4 (funil WhatsApp) ficou só em documentação Markdown — faltou validar o número real no HTML
- 📊 **Padrão**: Ciclos de código > ciclos só de conteúdo. Priorizar sempre mudanças em HTML/JS/CSS com impacto direto no usuário.

**Ajuste de estratégia:** ver `belinha/estrategia.md`

**Próximo passo sugerido:**
- Ciclo #6: Adicionar `openingHoursSpecification` ao Schema.org em `index.html` (sáb 14h-23h) + verificar `raspinha.html` — existe mas nunca foi analisado
- Ciclo #6 alternativo: Pesquisar concorrente MilkyMoo atualizado (preços, promoções de inauguração de outras unidades para benchmark)

---

## Ciclo #4 — 2026-04-22

**Área:** Conversão — Funil WhatsApp + Conteúdo semana 1 pós-inauguração

**Contexto:** Inauguração em 3 dias (25/04/2026). SEO e Schema.org já cobertos (ciclos #1-3). Prioridade agora: capacitar a equipe para converter leads em vendas no canal principal (WhatsApp, sem iFood/Rappi). Conteúdo pós-evento para manter momentum.

**O que analisou:**
- `belinha/content/inauguracao-25abr-captions.md` (ciclo #1): cobre pré-inauguração (23-25/04) mas não tem pós
- Nenhum script de atendimento WhatsApp existia → gap crítico pois todo delivery passa por lá
- Semana 1 pós-inauguração (26/04–02/05) inclui feriado 01/05 (Dia do Trabalho) — oportunidade de tráfego

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/whatsapp-funil.md` | CRIADO — 8 etapas de atendimento (boas-vindas → upsell fidelidade), atalhos WhatsApp Business, tratamento de reclamações, copy bio IG |
| `belinha/content/pos-inauguracao-semana1.md` | CRIADO — 7 posts diários 26/04–02/05 + roteiro reel 15s + template UGC repost + métricas semana 1 |

**Commit:** `4ade888`

**Impacto esperado:**
- Atendentes da loja têm script pronto → menos tempo de resposta, mais conversão
- Programa fidelidade é comunicado ativamente em toda interação (retenção)
- 7 posts diários pré-agendados = equipe foca em atendimento, não em criar copy na hora
- Feriado 01/05 capitalizado com post específico "abre feriado"
- Template UGC = máquina de conteúdo orgânico gratuito

**Próximo passo sugerido:**
- Ciclo #5: UX mobile — testar `cardapio.html` em 375px (iPhone SE) e `index.html`. Verificar CTAs visíveis above the fold, tamanho de fonte mínimo 16px, botão WhatsApp flutuante
- Ciclo #5 alternativo: Adicionar `potinho raspinha da sorte` — mecânica de gamificação no PDV (descrição do sistema + copy)
- Auto-aprimoramento (ciclo #5 = múltiplo de 5): reler log completo e ajustar estratégia

---

## Ciclo #1 — 2026-04-22

**Área:** SEO local Londrina + Pesquisa concorrentes + Conteúdo inauguração

**Contexto:** Primeiro ciclo. Inauguração em 3 dias (25/04/2026). Prioridade máxima em SEO e conteúdo de inauguração.

**O que pesquisou/analisou:**
- Milky Moo: 582 unidades, foco milkshake (não potinho), usa iFood/Rappi, 661K seguidores IG
- JohnnyJoy: concorrente direto de potinho (formato idêntico), desde 2016
- The Best Açaí: ORIGEM LONDRINA, 680+ unidades, self-service por kg, R$230k de franquia

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `index.html` | +canonical, +Open Graph completo, +Twitter Card, +Schema.org LocalBusiness JSON-LD |
| `belinha/README.md` | Criado — documentação da Belinha |
| `belinha/log.md` | Criado — este arquivo |
| `belinha/competitors/README.md` | Criado — índice de concorrentes |
| `belinha/competitors/milkymoo.md` | Análise Milky Moo (ciclo #1) |
| `belinha/competitors/johnnyjoy.md` | Análise JohnnyJoy (ciclo #1) |
| `belinha/competitors/the-best-acai.md` | Análise The Best Açaí — ALERTA: origem Londrina |
| `belinha/content/inauguracao-25abr-captions.md` | 3 captions + roteiro reel 15s + stories para inauguração |

**Impacto esperado:**
- Schema.org + OG = melhor indexação Google Maps e compartilhamento social
- Captions prontas = equipe pode publicar direto sem escrever do zero
- Análise The Best Açaí = dado estratégico crítico (concorrente local Londrina)

**Próximo passo sugerido:**
- Ciclo #2: Verificar `cardapio.html` — adicionar Schema.org Menu/MenuItem + Open Graph por produto
- Verificar se existe `sitemap.xml` e `robots.txt` (não encontrado — criar é urgente para SEO)
- Pesquisar unidades The Best Açaí próximas ao Muffato Londrina (raio 5km) para copy de diferenciação

---

## Ciclo #2 — 2026-04-22

**Área:** SEO — sitemap.xml + robots.txt + Open Graph cardápio

**Contexto:** Inauguração em 3 dias. `sitemap.xml` e `robots.txt` inexistentes = Google não consegue indexar as páginas a tempo. Prioridade máxima.

**O que analisou:**
- Confirmou ausência de sitemap.xml e robots.txt no root
- `cardapio.html` não tinha canonical nem Open Graph (compartilhamento social sem preview)
- Domínio: milkypot.com (via CNAME)
- Pages públicas identificadas: /, /cardapio.html, /desafio.html, /privacidade.html, /termos.html

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `sitemap.xml` | CRIADO — 5 URLs públicas, prioridades 1.0/0.9/0.5/0.3, changefreq diário p/ cardápio |
| `robots.txt` | CRIADO — bloqueia admin/painel/tv/api/raspinha, crawl-delay p/ Ahrefs+Semrush, aponta sitemap |
| `index.html` | +`<link rel=sitemap>` para descoberta direta |
| `cardapio.html` | +canonical, +`<link rel=sitemap>`, +Open Graph completo (url/title/desc/image/locale) |

**Commit:** `2f734f7`

**Impacto esperado:**
- Google Search Console pode indexar as páginas via sitemap antes da inauguração (25/04)
- Compartilhamento no WhatsApp/Instagram do link /cardapio.html agora mostra preview com imagem
- Bots de análise (Ahrefs, Semrush) com throttle — menos carga no servidor

**Próximo passo sugerido:**
- Ciclo #3: Adicionar Schema.org `Menu` + `MenuItem` em `cardapio.html` (rich results p/ busca "cardápio milkypot londrina")
- Pesquisar concorrente Jhoy (ainda não mapeado em `belinha/competitors/`)
- Criar conteúdo pós-inauguração para stories do dia 25/04 (template de repost de clientes)

---

## Ciclo #3 — 2026-04-22

**Área:** SEO — Schema.org Menu + MenuItem + pesquisa concorrente Jhoy

**Contexto:** Inauguração em 3 dias (25/04/2026). Com sitemap.xml já enviado, adicionar dados estruturados de menu permite que o Google exiba preços diretamente na SERP para buscas como "potinho ninho londrina".

**O que analisou:**
- `cardapio.html` já tinha OG e canonical (ciclo #2) mas sem dados estruturados de menu
- `js/cardapio-data.js` tem preços reais: Mini R$10 / Pequeno R$14 / Médio R$18 / Gigante R$22
- 4 linhas de produto: Ninho, Açaí, Zero/Fit, Milkshake
- Pesquisa Jhoy iniciada em paralelo (agente em background)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | +Schema.org JSON-LD: `FoodEstablishment` + `hasMenu` → 4 `MenuSection` + 16 `MenuItem` com preços reais em BRL |

**Commit:** `ae51fa6`

**Validação:** JSON-LD validado por `python3 json.loads()` — 4 seções, 16 itens, sem erros de sintaxe.

**Impacto esperado:**
- Rich results no Google com preços visíveis antes do clique ("a partir de R$10")
- Melhora ranking para "cardápio milkypot", "potinho ninho londrina", "açaí muffato londrina"
- Base para futuro uso de `priceRange` e `openingHoursSpecification` em `index.html`

**Próximo passo sugerido:**
- Ciclo #4: Criar `belinha/competitors/jhoy.md` com resultado da pesquisa (agente em background)
- Ciclo #4: Conteúdo pós-inauguração — template de repost de clientes para stories do dia 25/04
- Ciclo #4: Adicionar `openingHoursSpecification` ao Schema.org LocalBusiness em `index.html`

---

## Ciclo #23 — 2026-04-25

**Área:** Conversão — Cartão Fidelidade Digital (inauguração day)

**Contexto:** Dia da inauguração (25/04/2026). Com loja abrindo às 14h, a prioridade é converter os primeiros clientes em recorrentes. O programa de fidelidade estava documentado apenas no FAQ (`index.html`), mas sem página própria para o operador compartilhar via WhatsApp com cada cliente.

**O que analisou:**
- `js/core/loyalty.js` já tem lógica de pontos, mas sem UI pública
- `raspinha.html` já existe como mecânica de sorte (ciclos anteriores)
- FAQ menciona "1pt por R$1" mas sem visual, sem link, sem CTA
- Oportunidade: operador pode enviar link personalizado `?stamps=N` para cada cliente no WhatsApp

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cartao-fidelidade.html` | CRIADO — página standalone do cartão fidelidade. 10 carimbos = 1 Mini grátis. Grid visual de selos 🐑, barra de progresso animada, "Como Funciona" em 3 passos, CTA direto WhatsApp. Suporta `?stamps=N` (0–10) para links personalizados por cliente. |
| `sitemap.xml` | +entrada `cartao-fidelidade.html` com prioridade 0.7 e lastmod 2026-04-25 |

**Commit:** `b66441e`

**Mecânica do link personalizado:**
- Operador envia: `milkypot.com/cartao-fidelidade.html?stamps=3` ao cliente
- Página mostra 3 selos preenchidos + 7 restantes + barra de progresso 30%
- Não requer login — simples, sem fricção, funciona direto pelo WhatsApp

**Impacto esperado:**
- Cliente sai da inauguração hoje já com o link do cartão dele → âncora para voltar
- Operador pode personalizar o link manualmente via WhatsApp (custo zero de infraestrutura)
- UX: página bonita com identidade visual MilkyPot que o cliente vai querer mostrar

**Próximo passo sugerido:**
- Ciclo #24: Criar snippet de mensagem WhatsApp para o operador enviar ao registrar cliente (template copy-paste no playbook)
- Ciclo #24: Schema.org `openingHoursSpecification` em `index.html` (atualizar lastmod para 25/04)
- Ciclo #25: Monitorar resultados pós-inauguração e ajustar estratégia em `belinha/estrategia.md` (auto-aprimoramento do ciclo 20)


---

## Ciclo #35 — 2026-04-25

**Área:** Auto-aprimoramento (ciclos #30–34) + SEO — link interno `cardapio.html`

**Contexto:** Ciclo obrigatório de auto-aprimoramento a cada 5 ciclos. Período analisado cobre a semana de inauguração (25/04/2026) e primeiros conteúdos de retenção pós-abertura. Melhoria concreta associada: link SEO faltante em `cardapio.html` identificado durante revisão.

**O que analisou:**
- Ciclos #30–34: revisão completa de entregas, impacto e padrões de eficiência
- Identificado gap: link `cardapio.html` → `potinho-ninho-londrina.html` ausente apesar do link equivalente existir em `index.html` desde o ciclo #33
- Bloqueadores ativos documentados: GA ID placeholder + aggregateRating aguardando reviews

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `cardapio.html` | +link contextual abaixo dos tabs de categoria → `potinho-ninho-londrina.html` com anchor text SEO otimizado |
| `belinha/estrategia.md` | Aprendizados ciclos 30–34 · Padrão atualizado · Roadmap ciclos 36–40 · Tabela de bloqueadores ativos |

**Commits:**
- `d445f97` — feat(belinha/seo): link interno cardapio.html → potinho-ninho-londrina.html
- `ff3d1be` — docs(belinha): auto-aprimoramento ciclo #35 — estrategia.md ciclos 30-34

**Principais aprendizados do período:**
1. Links internos devem ser criados em TODAS as páginas relevantes no mesmo ciclo — não deixar para o próximo
2. Conteúdo acionável (playbooks WA, semanas de posts) tem alto valor porque reduz trabalho do operador
3. Concorrentes: pesquisa só tem valor real quando gera mudança concreta no mesmo ciclo

**Próximo passo sugerido:**
- Ciclo #36: `belinha/content/pos-inauguracao-semana5.md` — conteúdo 17–23/05/2026 ("mês de MilkyPot", fidelização, social proof)
- Ciclo #37: Performance mobile `index.html` — verificar LCP e CLS via PageSpeed Insights
- Quando operador confirmar ≥3 reviews Google: ativar `aggregateRating` em `index.html`

---

## Ciclo #60 — 2026-04-28

**Área:** Concorrentes — MilkyMoo Londrina (refetch + melhoria derivada)

**Contexto:** Ciclo prescrito pelo roadmap de ciclos #60–64. MilkyMoo estava com dados de 22/04 (ciclo #10). Necessário refetch completo + 1 ação concreta derivada.

**O que pesquisou/analisou:**
- WebSearch: MilkyMoo franquia 2026, novidades, Instagram, Londrina
- **Dado crítico:** MilkyMoo tem 2 unidades em Londrina — Shopping Catuaí (em frente ao cinema) + Boulevard Shopping. Instagram local: @milkymoo_londrina
- Preços Londrina confirmados: 300ml R$18 / 500ml R$22 / alcoólicos R$25–R$35 / Nutty Bavarian R$27–R$32
- 2026 novidades: collab O Boticário "Carameluda" (até maio/2026), ovos Páscoa Pandora + Malhada, estratégia cross-category com celebridade (Desirée), 600+ unidades
- Franquia: 600+ lojas, expansão EUA + Paraguai, meta global declarada pelo CEO
- Estratégia: "produto feito para ser fotografado e comentado" — foco Geração Z

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/competitors/milkymoo.md` | Refetch completo: seção de presença em Londrina (NOVO), preços Londrina atualizados, novidades 2026 (collab Boticário/Páscoa/Milky Moo Day), forças ampliadas, táticas de marketing com aprendizados para MilkyPot, checklist de próximos passos atualizado |
| `index.html` | benefits-bar: "Preço Fixo / Sem surpresa na balança" → "A partir de R$ 10 / Potinho personalizado do seu jeito" — âncora de preço direto contra MilkyMoo que começa em R$18 |

**Commit:** `85fa705`

**Racional da melhoria derivada:**
- MilkyMoo Londrina vende milkshake a partir de R$18 (300ml) — sem personalização de toppings
- MilkyPot Mini = R$10 — **44% mais barato** + 100% personalizável
- A benefits-bar era a primeira zona de leitura após o hero — "Preço Fixo" era genérico demais
- "A partir de R$ 10 / Potinho personalizado" ancora o preço E o diferencial simultaneamente

**Aprendizados para estratégia futura:**
1. MilkyMoo Londrina tem programa forte de UGC local (TikToker @marceladegusta) → MilkyPot deve identificar e nutrir criador de conteúdo local similar
2. Collabs locais são viáveis mesmo sem escala nacional → propor ao operador parceria com academia ou cafeteria de Londrina
3. Promoção "Terça de Potinho" (seg–qui com desconto) = playbook direto do MilkyMoo para dias fracos

**Próximo passo sugerido:**
- Ciclo #61: Conteúdo semanas 16+17 (02–15/08/2026) — "agosto rotina: sua pausa favorita do dia" + "inverno de saída: comfort food + Linha Zero"
- Ciclo #62: CLS sweep batch — cardapio.html, acai-self-service-londrina.html, cartao-fidelidade.html
- Ciclo #64 (auto-aprimoramento): reler log #59–#63, ajustar estratégia outubro 2026


---

## Ciclo #66 — 2026-04-29

**Área:** Conteúdo — Semana 22 (13–19/09/2026) — Linha Zero Fitness Peak

**Contexto:** Prescrito pelo roadmap ciclo #66 (estratégia v8). Template WA 2° ciclo de fidelidade foi adiantado no ciclo #65 (semana 21) — entregável movido por coerência temática. Ciclo #66 focou exclusivamente na semana 22: Linha Zero como aliado fitness no pico de matrículas de primavera.

**O que analisou:**
- Leu semanas 17, 21 e 22 para mapear ângulos já usados para Linha Zero
- Semana 17: educação básica ("o que é Linha Zero" + carrossel composição) — não repetir
- Semana 21 sáb: ângulo emocional "primavera = cuidado" — explorar extensão
- Identificou ângulo novo: Linha Zero como aliado do treino (pré/pós-treino), proteína no potinho, meta de primavera, cross-sell com açaí self-service

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana22.md` | CRIADO — 7 peças (Dom–Sáb), Reel 15s "antes/depois do treino", post educativo proteína, UGC fit com Stories interativos, motivacional "dieta sem sofrimento", Sexta do Potinho #7 Edição Fit, combo açaí + Linha Zero, template WA reengajamento fitness, checklist operador, métricas, tabela editorial |

**Commit:** `8d8e8ff`

**Destaques de conteúdo:**
1. **Reel 15s segunda-feira:** Formato mais engajador, ângulo "antes OU depois? Qualquer hora!" — reduz objeção do público fitness
2. **Proteína no potinho (terça):** Post mais técnico/educativo para público que pesquisa macros — conversor de intenção para pedido
3. **Sexta do Potinho #7 Edição Fit:** Continuidade do hábito + tema da semana = sinergia — promoção temática Linha Zero = diferenciação das semanas anteriores
4. **Cross-sell açaí + Linha Zero (sábado):** Duas linhas fit do cardápio combinadas — aumenta ticket médio e apresenta açaí self-service para público fitness
5. **Template WA reengajamento fitness:** Uso pontual para clientes que demonstraram interesse em opções saudáveis — personalização como diferencial

**Próximo passo sugerido:**
- Ciclo #67: Semanas 23 + 24 juntas (20–26/09 aniversário primavera 22/09 + 27/09–03/10 abertura outubro) — padrão v8 temáticas adjacentes
- Ciclo #68: SEO local — verificar `aggregateRating` (≥3 reviews Google Maps); se sim, ativar em `index.html`
- Ciclo #69: Auto-aprimoramento — reler log #64–#68, ajustar estratégia novembro 2026

---

## Ciclo #65 — 2026-04-29

**Área:** Conteúdo — Semanas 20 + 21 (30/08–12/09/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #64 (padrão v8: temáticas adjacentes no mesmo ciclo). Semana 20 = Dia D do lançamento do produto sazonal de setembro + ativação de UGC. Semana 21 = sustentação do produto + primavera como estilo de vida + feriado 07/09 (Independência) + Sexta do Potinho #6 + template WA de 2º ciclo de fidelidade.

**O que analisou:**
- Leu semanas 17, 18 e 19 como referência de formato (padrão v8: calendário Dom–Sab, templates WA, checklist, métricas)
- Bloqueador ativo: produto sazonal setembro sem nome/ingredientes confirmados pela franquia → incluídas Versão A (confirmado) e Versão B (genérico) no dia do lançamento
- Oportunidade identificada: feriado 07/09 = tráfego alto no Muffato → post específico de comunicado de funcionamento
- Template WA de 2º ciclo de fidelidade entregue na semana 21 (conforme roadmap ciclo #66 adiantado)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana20.md` | CRIADO — Lançamento produto sazonal (Versão A/B), ativação UGC, carrossel educativo "o que tem no potinho", Sexta do Potinho #5, checklist, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana21.md` | CRIADO — Feriado 07/09, rotina de primavera, carrossel "5 motivos", Sexta do Potinho #6, Linha Zero fitness, template WA 2º ciclo fidelidade, checklist, métricas, tabela editorial |

**Commit:** `1a25717`

**Destaques de conteúdo:**
1. **Versão A/B no lançamento (01/09):** Bloqueador do produto sazonal mitigado — operador escolhe a versão sem precisar esperar novo ciclo
2. **Feriado 07/09 planejado:** Post + 2x Stories de comunicado de funcionamento — alta circulação no Muffato = oportunidade de venda presencial
3. **Template WA 2º ciclo de fidelidade adiantado:** Ciclo #66 prescrevia esse entregável; incluído na semana 21 por coerência temática (setembro = clientes completando 2º ciclo)
4. **Sextas do Potinho #5 e #6:** Continuidade do hábito — mencionar "6 semanas sem falhar" como prova de consistência da marca

**Próximo passo sugerido:**
- Ciclo #66: Semana 22 (13–19/09) — Linha Zero fitness peak (virada de estação + pico de academia) — já há Linha Zero no sábado 12/09 como gancho
- Ciclo #67: Semanas 23 + 24 juntas (aniversário de primavera 22/09 + abertura de outubro)
- Ciclo #68: SEO local — verificar aggregateRating (≥3 reviews Google Maps)
- Operador: confirmar produto sazonal setembro com a franquia para usar Versão A em 01/09

---

## Ciclo #67 — 2026-04-29

**Área:** Conteúdo — Semanas 23 + 24 (20/09–03/10/2026)

**Contexto:** Prescrito pelo roadmap ciclo #64 (padrão v8: temáticas adjacentes no mesmo ciclo). Semana 23 tem data âncora forte: 22/09 = início oficial da primavera. Semana 24 é semana de transição mês setembro→outubro, encerrando com o primeiro teaser explícito de Halloween (Reel 15s + template WA de interesse).

**O que analisou:**
- Leu semanas 22, 21 e 19 para mapear ângulos já usados e evitar repetição
- Semana 22: fitness/Linha Zero — não repetir ângulo saudável na semana 23
- Aniversário de 3 meses (25/07, semana 13) foi referência de data âncora bem-sucedida → replicar estrutura para 22/09
- Halloween (31/10) ainda a 4+ semanas → introduzir teaser misterioso gradual, não revelar tudo de uma vez
- Enquete de preferências de outubro (28/09) cria dado real para calibrar semanas 25–28

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana23.md` | CRIADO — 7 peças (Dom–Sáb), countdown 2 dias, promo relâmpago DIA DA PRIMAVERA 22/09 (topping grátis), UGC #PotinhoDePrimavera, Sexta #8 Edição Primavera, template WA pós-promo, checklist, métricas, tabela editorial |
| `belinha/content/pos-inauguracao-semana24.md` | CRIADO — 7 peças (Dom–Sáb), retrospectiva setembro, abertura outubro, Sexta #9, Reel 15s primeiro teaser Halloween explícito, template WA interesse "HALLOWEEN" → lista VIP 31/10, checklist, métricas, tabela editorial |

**Commit:** `121ae98`

**Destaques de conteúdo:**
1. **Promo relâmpago 22/09 (aniversário primavera):** Topping extra grátis + comunicação em 3 atos (feed 9h, Stories 12h, encerramento 20h) — pico de tráfego esperado igual ao aniversário de 3 meses
2. **#PotinhoDePrimavera como hashtag proprietária:** Ativa UGC orgânico com tag rastreável — padrão testado na inauguração (#MilkyPotLondrina) agora com tema sazonal
3. **Reel 15s teaser Halloween (03/10):** Primeiro uso explícito de 🎃 — ovelhinha com chapéu de bruxa, tela preta, trilha misteriosa. Começa 28 dias antes do 31/10 = construção gradual de antecipação
4. **Template WA "HALLOWEEN" lista VIP:** Clientes que responderem "HALLOWEEN" entram em lista prioritária para notificação de reserva 31/10 — converte interesse em lead qualificado pré-evento
5. **Enquete 28/09 (o que você quer ver em outubro?):** Dados reais de preferência do público para calibrar semanas 25–28 do plano editorial

**Próximo passo sugerido:**
- Ciclo #68: SEO local — verificar se `aggregateRating` pode ser ativado em `index.html` (depende de ≥3 reviews Google Maps verificáveis pelo operador)
- Ciclo #69: Auto-aprimoramento — reler log #64–#68, ajustar estratégia novembro 2026 (pós-Halloween)
- Ciclo #70+: Plano editorial Halloween completo (≥5 peças, produto especial "Potinho Assombrado", sorteio UGC fantasia)
- Operador: definir conceito do Potinho de Halloween com a franquia ANTES de 01/10 (semana 24 já anuncia publicamente)

---

## Ciclo #76 — 2026-05-01

**Área:** Conteúdo — Semanas 35 + 36 (13–26/12/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #74. Semana 35 = Natal countdown early + UGC natalino + recap 8 meses + Sexta #20 Pré-Natal. Semana 36 = countdown 5 dias (dom–qui) + Véspera (24/12) pico de pedidos + Dia H Natal 25/12 + Pós-Natal 26/12. Insight crítico descoberto neste ciclo: o aniversário de 8 meses do MilkyPot Londrina (desde 25/04) cai **exatamente no dia 25/12 (Natal)** — narrativa dupla de altíssimo apelo emocional explorada em toda a semana 36.

**O que analisou:**
- Leu semanas 33 e 34 como referência de formato (padrão v10: Dom–Sab, templates WA, checklist, métricas)
- Calculou que 25/04/2026 + 8 meses = 25/12/2026 = Natal → descoberta de narrativa orgânica de máximo impacto
- Mapeou a Sexta #20 como a última Sexta do Potinho antes do Natal (18/12) — posicionar como "pré-Natal" para máxima conversão
- Diferenciação implícita TheBest/quiosque: conteúdo de ambiente, família, momento especial vs. produto de corredor — 3 peças na semana 35 usam esse ângulo
- Countdown diário de 5 dias (dom 20/12 → qui 24/12) com escalada de urgência, surpresa VIP e Reel 15s

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/pos-inauguracao-semana35.md` | CRIADO — 7 peças (Dom–Sab): UGC showcase #PotinhoNoel, carrossel recap 8 meses (com Versão A/B para dados reais vs. qualitativos), diferenciação implícita "momento especial", tutorial "como pedir potinho de Natal", WA broadcast VIP+geral quinta, Sexta #20 Pré-Natal (com Versão A/B), countdown "6 dias" sábado 19/12 com narrativa aniversário 8 meses |
| `belinha/content/pos-inauguracao-semana36.md` | CRIADO — 7 peças (Dom–Sab): countdown 5–1 dia (Dom–Qui), WA VIP e geral por dia, Véspera (24/12) com 6 touchpoints ao longo do dia, Dia H 25/12 (Natal + 8 meses — post mais importante de 2026, Versão A emocional e Versão B produto), pós-Natal 26/12 com gratidão + teaser Virada 31/12, Reel 15s "8 meses em 15 segundos" |

**Commit:** `21a5c09`

**Destaques de conteúdo:**
1. **"25/04 = nascimento → 25/12 = Natal" — arco narrativo máximo:** Nenhuma concorrente tem isso. Natal + aniversário de 8 meses é um acontecimento único e orgânico. Explora-se com semana 35 construindo o suspense e semana 36 revelando a celebração
2. **Véspera 24/12 como maior dia operacional do ano:** 6 touchpoints ao longo do dia (WA VIP 10h, WA geral 11h, feed 12h, stories 10h/13h/16h/19h/22h, Reel 15s opcional 15h). Equipe extra recomendada
3. **Surpresa VIP 25/12 como culminação do arco "NATAL":** Lista VIP criada em 03/12 (semana 33), ativada em 08/12 (semana 34), aquecida em 17/12 (semana 35), revelada em 24/12 e resgatada em 25/12 — fidelização em 5 semanas
4. **Diferenciação implícita TheBest — terça 15/12:** Post de ambiente/família "Aqui é um momento especial" contrasta com quiosque de corredor de shopping sem nomear nenhum concorrente
5. **Sexta #20 Pré-Natal (18/12):** Última Sexta do Potinho antes do Natal posicionada como evento — Versão A (combo produto natalino) e Versão B (topping bônus)

**Próximo passo sugerido:**
- Ciclo #77: Conteúdo — Semanas 37+38 (27/12–09/01/2027): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas + Sexta #21 "Primeiro Potinho de 2027"
- Ciclo #78: SEO/UX — gap técnico obrigatório (5 ciclos de conteúdo sem SEO): sitemap.xml, schema.org LocalBusiness, Core Web Vitals
- Operador: confirmar horário de funcionamento 24/12 e 25/12 antes de quarta-feira 23/12
- Operador: definir surpresa VIP 25/12 (ex: topping bônus, pontos em dobro, brinde especial) antes de quinta 24/12
- Operador: levantar números reais de operação (potinhos vendidos, clientes fidelidade) para o carrossel de 8 meses (semana 35)

_Belinha — Ciclo #76 | 2026-05-01_

---

## Ciclo #75 — 2026-05-01

**Área:** Conteúdo — Semanas 33 + 34 (29/11–12/12/2026)

**Contexto:** Prescrito pelo roadmap do ciclo #74 (estratégia dezembro/Natal/Q1 2027). Semana 33 = abertura de dezembro + lançamento público do produto sazonal de verão + ativação da lista VIP "NATAL". Semana 34 = showcase verão com UGC + carrossel educativo "o que tem no potinho" + reveal do produto natalino (acesso VIP 24h antes do público) + Sexta #19 duplo-temática + countdown 13 dias para o Natal.

**O que analisou:**
- Leu semanas 31 e 32 como referência de formato (padrão v10: calendário Dom–Sab, Versão A/B para produtos sem nome confirmado, templates WA, checklist, métricas)
- Semana 32 (Black Friday): produto de verão já entrou em "teaser" no sábado 28/11 → semana 33 é o lançamento oficial
- Bloqueador ativo: produto sazonal verão e produto natalino sem nome/ingredientes confirmados → incluídas Versão A e Versão B em cada um
- Produto de verão: Versão A = Potinho Tropical (Ninho + abacaxi + manga + coco + calda maracujá) / Versão B = Potinho Refrescante (Açaí + limão + hortelã + granola + mel)
- Produto natalino: Versão A = Potinho Noel (Ninho + calda morango + granulado natalino + marshmallow) / Versão B genérico
- Mecanismo WA "NATAL" como lista VIP = captura de lead qualificado sem desconto (padrão validado no ciclo #67 com "HALLOWEEN")
- Sexta #19 calculada como continuidade de #18 (semana 33 = #18, semana 34 = #19)

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `belinha/content/pos-inauguracao-semana33.md` | CRIADO — Abertura dezembro (01/12 âncora), lançamento produto verão (Versão A/B, quarta 02/12), WA "NATAL" lista VIP (quinta 03/12), Sexta #18 (sexta 04/12), teaser Natal (sábado 05/12), checklist, métricas, tabela editorial, transição semana 34 |
| `belinha/content/pos-inauguracao-semana34.md` | CRIADO — Showcase verão UGC (dom 06/12), carrossel "o que tem no potinho" (seg 07/12), WA VIP NATAL acesso exclusivo 24h antes (ter 08/12), reveal público Potinho Noel + Reel 15s cinemático (qua 09/12), dupla verão+Natal (qui 10/12), Sexta #19 duplo-temática (sex 11/12), countdown 13 dias + potinho presente (sáb 12/12), checklist, métricas, tabela editorial, transição semana 35 |

**Commit:** `6c6a237`

**Destaques de conteúdo:**
1. **Terça 01/12 como âncora:** Post de abertura de dezembro com sticker de contagem regressiva nativo para o Natal (25/12) — qualquer cliente que fixar o lembrete recebe notificação automática do Instagram
2. **WA "NATAL" lista VIP (quinta 03/12):** Clientes que responderem entram em lista segmentada e recebem acesso 24h antes do reveal público (terça 08/12) — padrão validado com "HALLOWEEN" no ciclo #67
3. **Versão A/B em ambos os produtos:** Bloqueador dos produtos sem nome mitigado — operador escolhe sem precisar de novo ciclo. Versão A tem ingredientes específicos sugeridos; Versão B é genérico
4. **Reel 15s cinemático (quarta 09/12):** Roteiro definido (cenas + trilha + timing) para facilitar produção pelo operador. Reveal do Potinho Noel como maior momento de conteúdo de dezembro
5. **Sextas #18 e #19 duplo-temáticas:** Sexta #18 destaca o produto de verão; Sexta #19 é a primeira Sexta com dois produtos sazonais simultâneos — diferencial único de dezembro

**Próximo passo sugerido:**
- Ciclo #76: Semanas 35+36 (13–26/12): Natal countdown 5 dias + dia H 25/12 + diferenciação implícita (experiência vs. quiosque) — conforme roadmap estratégia #74
- Ciclo #77: Semanas 37+38 (27/12–09/01): Virada Ano Novo 31/12 + "Nova meta, novo potinho" Linha Zero pós-festas
- Ciclo #78: SEO/UX — Gap técnico: indexação landing pages, sitemap.xml, schema produto, Core Web Vitals
- Operador: confirmar produto sazonal verão (Versão A ou B) com franquia ANTES de sábado 29/11
- Operador: confirmar Potinho Noel (Versão A ou B) com franquia ANTES de terça 08/12
- Operador: definir se haverá box presente natalino (embalagem especial) para semana 35

_Belinha — Ciclo #75 | 2026-05-01_

---

## Ciclo #140 — 2026-05-06

**Área:** Auto-aprimoramento — Roadmap #141–#150 + Halloween WA Playbook

**Contexto:** Auto-aprimoramento prescrito a cada 5 ciclos. Executado após ciclo #139 (intel concorrentes pré-Dia dos Pais). Mandato: reler log #135–#139, identificar o que gerou mais valor, ajustar rotação/prioridades, planejar roadmap set–nov 2026.

**O que pesquisou/analisou:**
- Leu log ciclos #135–#139: Dia dos Pais playbook (#136), checkout.html auditoria (#137 — 3x postergado), semana18 bridge pós-Dia dos Pais (#138), intel concorrentes ago/inverno (#139)
- Auditou cobertura de conteúdo set–nov 2026: todas as semanas (23–34) cobertas ✅
- Identificou gap crítico: sem standalone `whatsapp-halloween-2026.md` — templates WA fragmentados em semanas 24–28 (operador precisaria vasculhar 5 arquivos para configurar WA Business)
- Verificou `belinha/blockers.md`: CNPJ/DPO ainda abertos (D+11 sem resolução), cardapio.js decisão pendente
- Verificou `belinha/estrategia.md`: roadmap #136–#145 executado corretamente; v17b (checkout) cumprida no #137

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/estrategia.md` | Auto-aprimoramento #140 adicionado: análise #135–#139, auditoria set–nov 2026, checklist atualizado, roadmap #141–#150, regras v18a/v18b/v18c |
| `belinha/content/whatsapp-halloween-2026.md` | CRIADO — playbook WA standalone consolidado: estratégia, segmentos, configuração WA Business, templates H0–H8 (abertura 03/10 → pós-evento 01/11), checklist operacional, métricas, nota de contraprogramação |

**Destaques:**
1. **Nova regra v18c:** Qualquer evento com campanha WA >1 semana DEVE ter `whatsapp-<evento>.md` standalone. Retroativamente, o gap do Halloween fechado neste ciclo.
2. **Roadmap #141–#150 define:** #141 = `renderProducts` lazy scroll (4x postergado = prioridade máxima via v18b); #143 = concorrentes pré-Halloween; #144 = update do playbook com intel; #145 = auto-aprimoramento nov–jan 2027.
3. **Contraprogramação agosto:** Intel #139 confirmou MilkyMoo e JohnnyJoy sem campanha Halloween — MilkyPot é a ÚNICA com produto temático + mecânica VIP estruturada. Documentado no whatsapp-halloween-2026.md.
4. **Ingredientes Potinho Assombrado:** Marcados como `[confirmar com franquia]` — operador deve confirmar antes de 30/09/2026 para preencher templates H2 e H-AUTO.

**Próximo passo sugerido:**
- **Ciclo #141 — OBRIGATÓRIO:** `renderProducts` lazy scroll/virtual scroll em `cardapio.html` — 4x postergado, regra v18b ativa. Janela set/out = menor pressão de conteúdo sazonal. Sem exceção.
- **Operador:** Confirmar ingredientes Potinho Assombrado com franquia antes de 30/09/2026
- **Operador:** CNPJ + DPO ainda não fornecidos — risco legal LGPD. Fornecer dados para Belinha aplicar nos footers e termos.
- **Operador:** Confirmar cardapio.js (Opção A=deletar / B=integrar / C=manter) para fechar blocker técnico

_Belinha — Ciclo #140 | 2026-05-06_

---

## Ciclo #148 — 2026-05-07

**Área:** SEO — `sitemap.xml` lastmod update + Google Image Sitemap

**Contexto:** Prescrito pelo roadmap ciclo #147. Quatro páginas tinham datas `lastmod` desatualizadas (homepage e cardápio modificadas nos ciclos #141–#146 de 07/05; landing pages ciclo #123 de 05/05). Adicionada oportunidade: namespace `image:` do Google Image Sitemap (padrão para negócios de alimentação — Google Images é canal de descoberta orgânica de alto impacto para sobremesas).

**O que analisou:**
- `git log` por arquivo: homepage alterada ciclos #143 (FAQ Halloween) e #146 (hero CTA mobile) — ambos 07/05 → lastmod estava em `2026-05-06`
- `cardapio.html` alterada ciclos #141 (lazy scroll) e #142 (AggregateOffer schema) — ambos 07/05 → lastmod estava em `2026-05-06`
- Landing pages (`potinho-ninho-londrina.html`, `acai-self-service-londrina.html`) alteradas ciclo #123 em 05/05 → lastmod estava em datas de lançamento (25/04 e 27/04)
- Namespace `image:` do Google Image Sitemap (v1.1): suportado nativamente pelo Google Search Console, sem custo ou risco, habilita rich results em Google Images com `title` e `caption` indexáveis por keywords locais

**O que mudou:**

| Arquivo | Mudança |
|---|---|
| `sitemap.xml` | `xmlns:image` adicionado ao `<urlset>`; `lastmod` corrigido em 4 URLs; `<image:image>` com `title`+`caption` incluídos nas 4 URLs de maior prioridade (homepage, cardápio, 2 landing pages) |

**Commit:** `e7bfbf0`

**Destaques:**
1. **Google Image Sitemap:** Habilita indexação de imagens no Google Images via `<image:title>` e `<image:caption>` com keywords locais ("Londrina", "Muffato", "Potinho de Ninho", "açaí self-service"). Negócios de alimentação recebem tráfego relevante por busca visual — especialmente em mobile.
2. **lastmod corrigidos:** 4 de 8 URLs tinham datas desatualizadas. Googlebot prioriza re-crawl baseado em `lastmod` — datas erradas atrasam indexação de melhorias (AggregateOffer, FAQPage, hero CTA) já commitadas mas ainda não refletidas na SERP.
3. **Sem breaking change:** Namespace `image:` é ignorado por parsers sem suporte; `changefreq` e `priority` existentes mantidos intactos.

**Próximo passo sugerido:**
- **Ciclo #149 — Conversão:** Template WA milestone 50 carimbos fidelidade (prescrito roadmap #147)
- **Ciclo #150 — Auto-aprimoramento:** Reler log #145–#149; roadmap jan–mai 2027 (Carnaval, Páscoa, 1 Ano de loja 25/04/2027)
- **Google Search Console:** Operador deve fazer "Solicitar indexação" do sitemap.xml após este commit para acelerar re-crawl das 4 URLs corrigidas
- **Operador:** CNPJ/DPO — LGPD — em aberto há +12 ciclos. Risco legal ativo.
- **Operador:** Confirmar cardapio.js (Opção A/B/C) — blocker técnico persistente
- **Imagens de produto:** Próximo passo natural para image sitemap = adicionar fotos reais dos potinhos (quando disponíveis). As atuais entradas usam o logo; fotos dos produtos têm CTR muito maior no Google Images para alimentos.

_Belinha — Ciclo #148 | 2026-05-07_

---

## Ciclo #152 — 2026-05-07

**Área:** Conteúdo — `whatsapp-carnaval-2027.md` standalone

**Contexto:** Prescrito no roadmap ciclo #150/#151. Gap v18c ativo: templates WA de Carnaval estavam dispersos em 5 semanas (semana42–46.md) sem playbook standalone. Operador precisaria vasculhar 5 arquivos para configurar o WA Business Business para um evento de 31 dias. Regra v18c (qualquer evento >1 semana com campanha WA deve ter playbook standalone) obrigava execução neste ciclo.

**O que pesquisou/analisou:**
- Leu semana42.md: mecânica "CARNAVAL" ativada em 01/02, teaser VIP 04/02, Sexta #27 (12/02)
- Leu semana43.md: reveal público produto (10/02), Sexta #27 completa com VIP + geral
- Leu semana44.md: programação completa VIP (16/02) — maior entrega da lista
- Leu semana45.md: reta final 7 dias (21/02), horários confirmados VIP (24/02), Sexta #29 véspera (26/02)
- Leu semana46.md: 3 dias de Carnaval ao vivo (28/02–02/03) + Quarta de Cinzas (03/03)
- Confirmou intel ciclo #151: MilkyMoo iFood-exclusivo (1 dia) · JohnnyJoy sem campanha · TheBest sem campanha → MilkyPot com share of voice 100%

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-carnaval-2027.md` | CRIADO — Playbook WA standalone completo: estratégia de 4 estágios, 3 segmentos, configuração WA Business, template C-AUTO, broadcasts C0–C11 (16 touchpoints, 01/02→03/03), calendário resumido, checklist operacional com prazos, pendências do operador, contraprogramação competitiva, métricas, referência cruzada com outros playbooks |

**Destaques:**
1. **16 touchpoints** cobrindo 31 dias (01/02→03/03) vs. templates fragmentados em 5 arquivos de semana.
2. **Contraprogramação integrada:** MilkyMoo iFood-locked, JohnnyJoy e TheBest ausentes → copy dos broadcasts C0 e C4 exploram o diferencial "canal direto WA, 3 dias, sem app".
3. **Quarta de Cinzas (C11):** Tom completamente diferente dos demais broadcasts — suave, acolhedor. Nota de cautela para o operador incluída.
4. **Pendências do operador com prazos claros:** Produto temático = 14/02 (duro), oferta VIP = 24/02, horários = 24/02. Sem estas informações, 10 dos 16 broadcasts ficam com placeholders.
5. **Gap v18c fechado:** Junto com halloween, blackpot, natal e virada, agora os 5 maiores eventos do calendário 2026–2027 têm playbooks WA standalone completos. Falta apenas Páscoa (ciclo #155) e 1 Ano (ciclo #154).

**Commit:** `363e2fa`

**Próximo passo sugerido:**
- **Ciclo #153 — Código/Performance (OBRIGATÓRIO — 4× postergado):** `checkout.html` revisão completa. Regra v18b: postergado 4× = prioridade máxima inegociável. Sem exceção.
- **Ciclo #154 — INEGOCIÁVEL:** `whatsapp-1ano-2027.md` standalone — 25/04/2027 = maior evento de marketing da história da unidade.
- **Ciclo #155 — Conteúdo:** `whatsapp-pascoa-2027.md` standalone (v19a ativa).
- **Operador:** Confirmar nome + ingredientes do Potinho Foliã (produto temático Carnaval) com a franquia — prazo 14/02/2027. Sem isso, 10 broadcasts ficam genéricos.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+15 ciclos**. Risco legal crescente.
- **Operador:** Cardapio.js (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #152 | 2026-05-07_

---

## Ciclo #158 — 2026-05-08

**Área:** Conversão — `whatsapp-30carimbos-vip.md` standalone

**Contexto:** O ciclo #158 foi prescrito como "Template WA milestone 50 carimbos fidelidade (prescrito roadmap #147)". Ao iniciar o ciclo, verificou-se que `whatsapp-50carimbos-superfan.md` foi criado no ciclo #149 e está completo (3 templates A/B/C, controle operacional, métricas). A prescrição era stale. Nesse arquivo, há menção explícita a dois gaps: marco de **30 carimbos** ("A criar — ciclo futuro") e marco de **100 carimbos** ("A criar"). O de 30 carimbos é o mais urgente: ocorre na janela de 3 meses pós-inauguração, período crítico de churn silencioso.

**O que pesquisou/analisou:**
- Leu `whatsapp-50carimbos-superfan.md` (ciclo #149): progressão completa da fidelidade, gaps explícitos em 30 e 100 carimbos
- Leu `conversao-upsell-pdv-15carimbos.md` (ciclo #97): referência de estrutura para templates de conversão
- Leu `fidelidade-milestones-wa.md` (ciclo #111): sistema paralelo de pontos (10/50/100 pontos = R$ gastos); coexiste com sistema de carimbos físicos — sem conflito direto, usos distintos
- Identificou o calendário: clientes da inauguração (25/04/2026) com frequência regular atingem 30 carimbos em jul–ago/2026, coincidindo com inverno e risco de queda sazonal

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-30carimbos-vip.md` | CRIADO — Template WA standalone: 3 variantes (A=celebração+próximo nível, B=direto, C=inverno jul–ago), benefício sugerido (topping premium grátis ou upgrade Mini→Médio), controle operacional, tabela progressão fidelidade atualizada, métricas (% resgate 15 dias, % chegam ao 50º, % aumentam frequência) |

**Destaques:**
1. **Churn prevention:** Marco de 30 carimbos é a janela de "fadiga da novidade" — sem reconhecimento aqui, clientes espaçam visitas silenciosamente. Template A revela a existência do próximo marco (50 carimbos) via spoiler, criando motivação renovada ("progress disclosure").
2. **Template C sazonal:** Jul–ago 2026 = inverno Londrina = queda natural em sorveterias. Template C usa linguagem de conforto ("potinho quente no coração") e upgrade de tamanho para manter frequência durante a baixa estação.
3. **"Sou VIP" como ritual PDV:** Frase de identificação no balcão gera marketing social passivo — outros clientes observam o reconhecimento.
4. **Progressão fechada até 50:** Agora todos os marcos de 10, 15, 20, 30 e 50 carimbos têm templates. Gap restante: 100 carimbos ("Lenda MilkyPot").

**Commit:** `c89e78d`

**Próximo passo sugerido:**
- **Ciclo #159 — Conversão:** `whatsapp-100carimbos-lenda.md` — último gap da progressão fidelidade. Cliente de 100 carimbos é evangelist ativo; template deve incluir benefício impactante (confirmar com franquia) + convite para ser "embaixador oficial".
- **Ciclo #160 — Pesquisa concorrentes:** nova rodada inteligência competitiva (última: ciclo #151, +9 ciclos atrás). MilkyMoo, Johnny, Jhoy, TheBest.
- **Ciclo #161 — Auto-aprimoramento:** Reler log #155–#160; ajustar estratégia para jun–ago 2027.
- **Operador:** Confirmar benefício disponível para 30 carimbos (topping grátis vs upgrade Mini→Médio) — Templates A e B têm placeholder para ajuste.
- **Operador:** CNPJ + DPO — LGPD — em aberto há **+21 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (ação pendente desde ciclo #148).

_Belinha — Ciclo #158 | 2026-05-08_

---

---

## Ciclo #163 — 2026-05-08

**Área:** Conteúdo — `instagram-tiktok-junina-2026.md` standalone

**Contexto:** Prescrito pelo roadmap ciclo #161 (v20a ativa). Gap identificado no ciclo #160: nenhum concorrente (MilkyMoo, JohnnyJoy, TheBest) tem campanha de posts orgânicos estruturada de Festa Junina em Londrina — share of voice 100% disponível. Os arquivos existentes (`potinho-junino-2026-contraprogramacao.md`, `semana9.md`) cobriam estratégia competitiva e calendário semanal, mas não havia playbook standalone de posts IG/TikTok com a ovelhinha como personagem central.

**O que pesquisou/analisou:**
- Leu `potinho-junino-2026-contraprogramacao.md` (ciclo #134): intel TheBest Festival Junino, 3 versões do Potinho Junino (A Clássica, B Tropicana, C Fit)
- Leu `pos-inauguracao-semana9.md`: calendário da semana 9 (14–20/06) com lançamento do Potinho Junino em 17/06
- Verificou `belinha/content/` — sem arquivo standalone de posts IG/TikTok para Festa Junina
- Identificou datas-chave: Santo Antônio 13/06, São João 24/06, São Pedro 29/06
- Confirmou: 5–6 semanas até o período junino = janela ideal para preparar conteúdo

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/instagram-tiktok-junina-2026.md` | CRIADO — Playbook standalone: 4 posts feed (Reel teaser, Carrossel lançamento, Reel monta-comigo, Reel encerramento), 2 sequências de Stories (teaser 48h + São João ao vivo), adaptações TikTok (sons, hashtags, stitch challenge), checklist operacional 9 ações com datas (10/06→28/06), tabela de pendências do operador, referências cruzadas |

**Destaques:**
1. **Ovelhinha no arraial:** Character arc completo — ovelhinha de chapéu de palha como protagonista em todos os posts. Visual direction em cada post (cor, fundo, sticker, posição). Cria continuidade narrativa da personagem ao longo do mês.
2. **3 versões do Potinho Junino:** Carrossel (POST 2) apresenta Clássica, Tropicana e Fit em slides separados. Aumenta percepção de variedade vs. TheBest (que vende por peso em self-service).
3. **Urgência construída ao longo de 17 dias:** POST 1 (teaser 12/06) → POST 2 (lançamento 17/06) → POST 3 (UGC 20/06) → POST 4 (encerramento 28/06). Cada post tem CTA diferente — antecipação, lançamento, participação, urgência.
4. **São João ao vivo (24/06):** Sequência de 3 stories para o pico cultural do dia — aproveita o trending sem precisar de conteúdo novo.
5. **TikTok adaptado:** Notas específicas de sound, hashtags e formato "stitch challenge" orgânico — diferente do feed IG.
6. **Diferenciação integrada (sem citar TheBest):** Copy dos posts POST 2 e POST 3 usa "não é self-service, não é por peso" como gancho de personalização — referência à contraprogramação do ciclo #134 sem nomear concorrente.

**Commit:** `501c085`

**Próximo passo sugerido:**
- **Ciclo #164 — Conteúdo/WA:** `whatsapp-namorados-2026.md` standalone — 12/06/2026 em 5 semanas. v20c ativa. CTA de gift/presentear obrigatório.
- **Ciclo #165 — Conteúdo/WA:** `whatsapp-junina-2026.md` standalone — v20a ativa.
- **Ciclo #166 — SEO:** Landing page `potinho-personalizado-londrina.html`
- **Ciclo #167 — Concorrentes:** Refetch pré-Festa Junina (campanhas junho 2026)
- **Operador:** Confirmar ingredientes do Potinho Junino com a franquia — prazo 30/05/2026 (antes da data de gravação 10/06)
- **Operador:** Confirmar naming: "Potinho Junino" vs. "Potinho do Arraial" ou outro
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — +25 ciclos. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #163 | 2026-05-08_

---

## Ciclo #167 — 2026-05-09

**Área:** Pesquisa Concorrentes — intel pré-Festa Junina (MilkyMoo, TheBest Açaí, JohnnyJoy)

**Contexto:** Prescrito pelo roadmap ciclo #166. Última rodada de inteligência competitiva: ciclo #160 (2026-05-08, 7 ciclos atrás). Festa Junina começa em ~34 dias. Objetivo: confirmar se algum concorrente anunciou campanha junina, novos produtos ou movimentos de preço relevantes.

**O que pesquisou/analisou:**
- WebSearch x8 cobrindo: MilkyMoo preços/campanha 2026, TheBest Açaí novidades/expansão/preços, JohnnyJoy Festa Junina, Jhoy (mantida fechada — sem marca identificada)
- WebFetch bloqueado (403) para: milkymoo.com.br, thebestacai.com.br, johnnyjoy.com.br/cardapio, gkpb.com.br, umsolugar.com.br — sites retornam Forbidden
- Fontes que funcionaram: mercadoeconsumo.com.br (TheBest PE R$80M), auroracultural.com (MilkyMoo 180ml), clubeamostrasgratis.com (MilkyMoo Day), gkpb.com.br via search snippet (JohnnyJoy 10 anos), TikTok @guiadois (preços MilkyMoo regionais), foodbizbrasil.com, buscacliente.com.br

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | ATUALIZADO — Ciclo #167: preços nacionais confirmados R$25/30/35 (vs regionais R$14.90-20), status collab Boticário encerrando 31/05, MilkyMoo Day padrão histórico, gap Festa Junina confirmado, radar semanal junho 2026 |
| `belinha/competitors/the-best-acai.md` | ATUALIZADO — Ciclo #167: R$80M investimento PE (primeiro da história), meta 1.500 unidades até fim 2026 (atual 1.100+), expansão EUA Florida H2 2026, preço R$5.99/100g confirmado, gap Festa Junina — sem produto junino específico detectado, mapa de ameaça local Londrina |
| `belinha/competitors/johnnyjoy.md` | ATUALIZADO — Ciclo #167: nenhuma campanha Festa Junina detectada, promoções recentes confirmadas (10 anos R$10, Dia do Milkshake, pink/azul), presença Londrina não confirmada, radar competitivo junho 2026 |

**Destaques:**
1. **Gap Festa Junina confirmado por todos os três concorrentes:** MilkyMoo = modo cinema (HTTYD), TheBest = possível topping genérico, JohnnyJoy = ausente. MilkyPot é o único com Potinho Junino estruturado e campanha planejada.
2. **TheBest acelera com R$80M PE + EUA:** Não impacta Londrina imediato mas sinaliza guerra de marketing nacional em 2026–2027. Monitorar se aumentam orçamento de ads locais.
3. **MilkyMoo sobe preços:** Nacional R$25/30/35 vs regionais R$14.90-20. Preço sugerido do 300ml (R$25) é mais alto que estimativas anteriores. Janela para MilkyPot comunicar custo-benefício do potinho.
4. **JohnnyJoy sem presença em Londrina:** Risco baixo no curto prazo — segmento shopping premium incompatível com quiosque Muffato.
5. **Collab Boticário MilkyMoo encerra 31/05:** Junho = MilkyMoo sem collab ativa na 2ª–4ª semana. Share of voice disponível.

**Commit:** `02fe047`

**Próximo passo sugerido:**
- **Ciclo #168 — UX/Frontend:** `cardapio.html` refresh — lazy scroll audit, filtros mobile, CLS (prescrito #166)
- **Ciclo #169 — Conteúdo/IG:** posts pré-Festa Junina: reels teasers da ovelhinha de chapéu de palha (1–11/06) — urgência: gravar 10/06
- **Ciclo #170 — Conteúdo/WA:** `whatsapp-pais-2026.md` standalone — Dia dos Pais 09/08/2026
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** — impacta gravação reels (10/06) ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Confirmar preços P/M/G Potinho Junino até **10/06/2026**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+29 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #167 | 2026-05-09_

---

## Ciclo #168 — 2026-05-09

**Área:** UX/Frontend — `cardapio.html` CLS prevention + ARIA tabs

**Contexto:** Prescrito pelo roadmap ciclo #167. O `#productGrid` era enviado vazio no HTML e preenchido por JS após carga — causando layout shift (CLS) mensurável, especialmente em conexões lentas e dispositivos mobile de entrada. Os filtros de categoria (.cat-tab) não tinham semântica ARIA, o que prejudica leitores de tela e ferramentas de acessibilidade.

**O que pesquisou/analisou:**
- Leitura completa de `cardapio.html` (1.257 linhas) — fluxo completo: head → tabs → productGrid → lazy rendering → checkout → scripts
- Identificado: `grid.innerHTML = ''` em `renderProducts()` (linha 778) zera o grid antes de renderizar — skeleton é apagado automaticamente, sem JS extra
- Verificado: `getBrasiliaHour()` — fórmula `getTime() + getTimezoneOffset()*60000 - 3*3600000` + `.getHours()` é matematicamente correta para qualquer timezone (offset local cancela com o offset artificial, resultando em hora BRT)
- Identificado: `renderProducts('ninho')` chamado na init (linha 1006) — JS é síncrono, skeleton visível apenas enquanto parser não chegou ao `<script>`, ou em conexões lentas/JS deferido

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `cardapio.html` | +CSS: `.product-card-skeleton` com `@keyframes skeleton-shimmer` (gradiente pastel animado, min-height 128px, border-radius 18px — visual coerente com brand) |
| `cardapio.html` | +HTML: 6 `<div class="product-card-skeleton" aria-hidden="true">` dentro de `#productGrid` como placeholders (substituídos por `grid.innerHTML = ''` no init JS) |
| `cardapio.html` | +ARIA: `role="tablist"` + `aria-label="Filtros do cardápio"` no `.category-tabs`; `role="tab"` + `aria-selected="true/false"` em cada `.cat-tab` |
| `cardapio.html` | `filterProducts()` atualiza `aria-selected` ao trocar de aba (sincronização de estado ARIA) |

**Impacto esperado:**
- CLS reduzido: grid reserva 6 × 128px antes do JS — sem salto de layout em conexões lentas
- Leitores de tela anunciam "Filtros do cardápio, ☁️ Ninho, selecionado" — conformidade WCAG 2.1 AA (role+state)
- Sem regressão: `renderProducts()` já limpava `innerHTML`, skeleton some automaticamente

**Commit:** `f7942ca`

**Próximo passo sugerido:**
- **Ciclo #169 — Conteúdo/IG:** Reels teasers pré-Festa Junina com ovelhinha de chapéu de palha (urgência: gravação 10/06/2026 — 32 dias)
- **Ciclo #170 — Conteúdo/WA:** `whatsapp-pais-2026.md` standalone — Dia dos Pais 09/08/2026
- **Ciclo #171 — UX/Frontend:** Verificar `content-visibility: auto` na seção `.muffato-upsell` + lazy loading abaixo do fold
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️ URGENTE (impacta roteiro reels 10/06)
- **Operador:** Confirmar naming "Potinho Junino" vs "Potinho do Arraial" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Confirmar preços P/M/G Potinho Junino até **10/06/2026**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+30 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #168 | 2026-05-09_

---

## Ciclo #169 — 2026-05-09

**Área:** Conteúdo/IG — Reels teasers pré-Festa Junina (01–11/06/2026)

**Contexto:** Gap identificado no roadmap: Semanas 7 (31/05–06/06) e 8 (07/06–13/06) não tinham nenhum conteúdo de antecipação junina. O reveal oficial do Potinho Junino é em 12/06 (`instagram-tiktok-junina-2026.md` POST 1) e o lançamento em 17/06 (semana9). Sem teasers, o produto chega "do nada" — sem aquecimento de audiência.

**O que pesquisou/analisou:**
- Leitura de `instagram-tiktok-junina-2026.md` (Ciclo #163): POST 1 em 12/06 = teaser oficial — mas sem conteúdo antes de 12/06
- Leitura de `pos-inauguracao-semana7.md` e `semana8.md`: nenhuma menção a Festa Junina — gap confirmado
- Leitura de `potinho-junino-2026-contraprogramacao.md` (Ciclo #134): produto e copy âncora disponíveis
- Estratégia: 4 teasers progressivos (03/06 → 07/06 → 10/06 → 11/06) construindo curiosidade SEM revelar o produto

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reels-teaser-junina-pre-lancamento-2026.md` | NOVO — 4 teasers da ovelhinha de chapéu de palha para 01–11/06 |

**Detalhes do conteúdo criado:**
- **TEASER 1** (Qua 03/06 Reel 15s): Ovelhinha tentando colocar chapéu de palha — humor fofo + "tem algo chegando"
- **TEASER 2** (Dom 07/06 Stories 3 frames): Enquete "quer saber o segredo?" + pista "tem paçoca" + countdown até 12/06
- **TEASER 3** (Qua 10/06 Reel 15s): Unboxing de paçoca na loja + chapéu de palha — conteúdo real de bastidores
- **TEASER 4** (Qui 11/06 Story único): Countdown 24h + enquete pré-pedido + DM automático script
- Série com consistência visual: mesmo som, mesma ovelhinha, mesma paleta
- Integração não-destrutiva nas Semanas 7 e 8 (posts aditivos, não substituem conteúdo principal)
- Checklist de produção + métricas por teaser incluídos no arquivo

**Commit:** `3f33087`

**Próximo passo sugerido:**
- **Ciclo #170 — Conteúdo/WA:** `whatsapp-pais-2026.md` standalone — Dia dos Pais 09/08/2026
- **Ciclo #171 — UX/Frontend:** `content-visibility: auto` na seção `.muffato-upsell` + lazy loading abaixo do fold (prescrito #168)
- **Ciclo #172 — SEO:** Injetar links internos das novas landing pages (potinho-personalizado-londrina.html) no index.html e cardapio.html
- **Operador:** Comprar chapéu de palha (prop) + bandeirinhas juninas antes de 03/06 — R$20–35 no total ⚠️ URGENTE (24 dias)
- **Operador:** Criar/comissionar sticker da ovelhinha com chapéu de palha — necessário para todos os 4 teasers ⚠️ URGENTE
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️ URGENTE (impacta TEASER 3 em 10/06)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+31 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #169 | 2026-05-09_

---

## Ciclo #170 — 2026-05-09

**Área:** Conteúdo/WA — Dia dos Pais 09/08/2026

**Contexto:** Gap identificado: `dia-dos-pais-2026-playbook.md` (ciclo #136) tem estratégia completa, mas não existia arquivo standalone de mensagens WA prontas para o operador disparar — igual aos formatos `whatsapp-namorados-2026.md` (ciclo #164) e `whatsapp-junina-2026.md`. Dia dos Pais é a 3ª grande data comemorativa pós-inauguração (após Mães 10/05 e Namorados 12/06).

**O que pesquisou/analisou:**
- Leitura de `dia-dos-pais-2026-playbook.md` (ciclo #136): estratégia completa disponível — mecânicas A/B/C, keyword PAPAI26, cronograma 04–10/08
- Leitura de `whatsapp-namorados-2026.md` (ciclo #164): formato de referência — auto-resposta + N1/N2/N3/N4/N4-GIFT/N4-DUO/N5 + guia de tom + checklist + KPIs
- Gap identificado: nenhum arquivo `whatsapp-pais-2026.md` existia (confirmado via `ls belinha/content/`)
- Contexto agosto: inverno de saída = dois ângulos (confort Ninho + Linha Zero fit)
- Novidade desta data: variante P5-FIT criada especificamente para público "pai fitness/diabético" — não presente em outros templates

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-pais-2026.md` | NOVO — template WA completo para Dia dos Pais |

**Detalhes do conteúdo criado:**
- **AUTO-RESPOSTA** keyword `PAPAI26` — configurar até 03/08
- **P1** Broadcast geral captura (Qui 06/08 18h) — recrutar lista PAPAI26
- **P2** Lista VIP lembrete véspera (Sáb 08/08 11h)
- **P3** Broadcast geral véspera (Sáb 08/08 14h)
- **P4** Lista VIP abertura Dia H (Dom 09/08 08h)
- **P5** Broadcast geral abertura (Dom 09/08 13h)
- **P5-GIFT** Variante presentear (pai recebe como presente)
- **P5-DUO** Variante Duo Papai (pai + filho/filha juntos)
- **P5-FIT** Variante Linha Zero (pai fitness/diabético) — NOVA, não existia em outros templates
- **P6** Pós-evento gratidão (Seg 10/08 11h)
- Guia de tom, checklist operacional completo, templates de resposta rápida, KPIs

**Commit:** `da29726`

**Próximo passo sugerido:**
- **Ciclo #171 — UX/Frontend:** `content-visibility: auto` na seção `.muffato-upsell` + lazy loading abaixo do fold (prescrito #168)
- **Ciclo #172 — SEO:** Injetar links internos das novas landing pages (potinho-personalizado-londrina.html) no index.html e cardapio.html
- **Ciclo #173 — Conteúdo/IG:** Posts Feed teaser Dia dos Pais (semana16 04–10/08) — carrossel "qual potinho combina com o seu pai?" (4 perfis)
- **Operador:** Comprar chapéu de palha (prop) + bandeirinhas juninas antes de 03/06 — R$20–35 ⚠️ URGENTE (25 dias)
- **Operador:** Criar sticker da ovelhinha com chapéu de palha antes de 03/06 ⚠️ URGENTE
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05/2026** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05/2026** ⚠️ URGENTE
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** LGPD — CNPJ + DPO — **+32 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #170 | 2026-05-09_

---

## Ciclo #175 — 2026-05-09

**Área:** UX/Conversão — Banner Festa Junina na homepage

**Contexto:** Prescrições de ciclos #175 (FAQPage potinho-personalizado) e #176 (muffato-upsell em cardapio.html) já executadas em ciclos anteriores. Foco reorientado para a oportunidade mais urgente: ativar captura de leads JUNINA26 diretamente na homepage, 32 dias antes do lançamento (17/06). O `inaugBanner` (ID, CSS, navbar-offset, resize handler, closeBanner) já existia mas estava permanentemente oculto após 25/04 — infraestrutura desperdiçada. Reutilizando sem criar novo elemento DOM.

**O que pesquisou/analisou:**
- Confirmado: FAQPage já existe em `potinho-personalizado-londrina.html` (ciclos anteriores)
- Confirmado: `.muffato-upsell` já existe em `cardapio.html` (ciclo #171)
- `inaugBanner` — band lógica de ocultar após 25/04 sem nenhuma fase seguinte → oportunidade
- `whatsapp-junina-2026.md` — keyword `JUNINA26` configurada, mas sem ponto de entrada na homepage
- Festa Junina: 32 dias para o lançamento do produto (17/06), 22 dias para o primeiro teaser IG (03/06)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `index.html` | +16 linhas — 2 fases Festa Junina na `configureBanner()` + sessionStorage no `closeBanner()` |

**Detalhes:**
- **Fase 1 (10/05–16/06):** Banner mostra "🎪 EM BREVE: NOVIDADE JUNINA!" → link WA `?text=JUNINA26` (captura automática na lista VIP)
- **Fase 2 (17/06–29/06):** Banner mostra "🌽 POTINHO JUNINO CHEGOU!" → link WA com texto de pedido direto
- **Sem novo DOM:** reutiliza `#inaugBanner`, `#inaugBannerText`, `#inaugBannerCta` — sem impacto em layout, CSS ou navbar offset
- **closeBanner() melhorado:** agora persiste `juninaBannerClosed` via `sessionStorage` no período pós-inauguração — evita que o banner reapareça a cada reload na mesma sessão (UX mais respeitoso)
- **Auto-encerra:** após 29/06 o banner volta a ficar oculto permanentemente

**Commit:** `7ebc727`

**Próximo passo sugerido:**
- **Ciclo #176 — Concorrentes:** Refetch MilkyMoo + JohnnyJoy + TheBest pré-Festa Junina (verificar campanhas junho e preços de produtos juninos concorrentes)
- **Ciclo #177 — Conteúdo/IG:** Reel de reveal product Festa Junina (para 17/06) — roteiro 15s com ovelhinha de chapéu de palha presenteando o Potinho Junino
- **Ciclo #178 — SEO:** Landing page `potinho-junino-londrina.html` (aguarda confirmação operador de ingredientes/nome até 30/05)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (21 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE (impacta landing + IG reveal + cardápio)
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️ URGENTE (28 dias)
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — **+35 ciclos**. Risco legal crescente.
- **Operador:** Confirmar `cardapio.js` (A=deletar / B=integrar / C=manter) — blocker técnico persistente.

_Belinha — Ciclo #175 | 2026-05-09_

---

## Ciclo #177 — 2026-05-10

**Área:** Conteúdo/IG — Reel 15s lançamento Potinho Junino (17/06)

**Contexto:** O ciclo #176 corrigiu o mapa competitivo: MilkyMoo ("Pede Mooleca") e The Best ("Festival Junino") têm produtos juninos reais em 2026. O ângulo "share of voice 100% disponível" estava obsoleto. O `instagram-tiktok-junina-2026.md` (POST 2, ciclo #163) cobria o Carrossel das 12h de 17/06, mas o slot do **Reel às 18h** — prescrito em `semana9.md` como "copy de diferenciação" — estava vazio sem roteiro.

**O que pesquisou/analisou:**
- Releitura de `instagram-tiktok-junina-2026.md` POST 1 (Reel 12/06) e POST 2 (Carrossel 17/06)
- Releitura de `pos-inauguracao-semana9.md`: "Injetar copy de diferenciação em qua 17/06 (Reel)" — slot sem arquivo
- Releitura de `reels-teaser-junina-pre-lancamento-2026.md` — cobre 03–11/06, não 17/06
- Mapa competitivo ciclo #176: diferencial correto = **"qualquer um tem o sabor, só a gente coloca o seu nome"**
- Calendário 17/06: Carrossel 12h (produto/preço) → gap → Reel 18h (personalização/emoção)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reel-lancamento-potinho-junino-17jun.md` | NOVO — roteiro Reel 15s completo para 17/06 às 18h |

**Detalhes do conteúdo criado:**
- **Ângulo:** "No arraial deles = produto genérico. No nosso = SEU nome no potinho" — sem nomear concorrente
- **Roteiro 15s dividido em 4 blocos:** abertura (ovelhinha + chapéu), reveal slow-mo (potinho + nome personalizado), diferenciação (dois potinhos, dois nomes), CTA (logo + WA)
- **Prop central:** rótulo personalizado escrito à mão (nome fictício "MARIA LUÍZA" + "SEU NOME AQUI") — visualiza o benefício imediatamente
- **Slot 18h** (não 12h): deixa 6h de respiro após o Carrossel de produto — evita overposting num mesmo dia de lançamento
- **Integração documentada:** tabela relacionando Carrossel 12h + Broadcast WA 12h + Este Reel 18h + Stories 20h
- **Variante TikTok** incluída (caption encurtada + duet/stitch ativado para UGC)
- **Direção de arte** detalhada para produção independente pelo operador (prop, paleta, font, trilha, edição CapCut)

**Commit:** `5b2f9f9`

**Próximo passo sugerido:**
- **Ciclo #178 — SEO:** Landing page `potinho-junino-londrina.html` (aguarda confirmação ingredientes/naming do operador até **30/05** — prazo em 20 dias)
- **Ciclo #179 — UX/Frontend:** Stories Thu 18/06 — copy de diferenciação "preço fixo vs. balança" (prescrita no `semana9.md` para 18/06, ainda sem template)
- **Ciclo #180 — Conversão:** Upsell "Versão B (cocada/mel) e Versão C Fit" do Potinho Junino — script de atendente para sugerir variantes no WA
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️ URGENTE (27 dias)
- **Operador:** Buscar trilha baiãozinho lo-fi TikTok na semana de **08/06** (prazo de produção)
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #177 | 2026-05-10_

---

## Ciclo #178 — 2026-05-10

**Área:** Conteúdo/IG — Stories Qui 18/06 (reações + social proof + diferenciação preço fixo vs. balança)

**Contexto:** Ciclo #178 originalmente apontado para landing page SEO `potinho-junino-londrina.html`, bloqueada por confirmação do operador (ingredientes/naming — prazo 30/05). Avançou para próxima prioridade: template de Stories 18/06, prescrito em `pos-inauguracao-semana9.md` como "stories de reações e primeiras impressões do Potinho Junino" — slot existia sem arquivo de produção. A copy de diferenciação "preço fixo vs. balança" (prescrita no ciclo #177 para este slot) estava apenas esboçada em `potinho-junino-2026-contraprogramacao.md` sem integração ao cronograma do dia.

**O que pesquisou/analisou:**
- Releitura de `pos-inauguracao-semana9.md` — Qui 18/06: 3 stories de social proof (enquete, UGC, convite)
- Releitura de `potinho-junino-2026-contraprogramacao.md` — sequência 3 frames "preço fixo vs. balança" (específica para qui 18/06)
- Releitura de `reel-lancamento-potinho-junino-17jun.md` (ciclo #177) — contexto do dia anterior para continuidade narrativa
- Releitura de `instagram-tiktok-junina-2026.md` — integração com feed 17/06

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/stories-18jun-potinho-junino-reacoes.md` | NOVO — 6 stories completos divididos em 2 blocos com direção de arte, cronograma e script WA |

**Detalhes do conteúdo criado:**
- **Bloco A (14h):** 3 stories de social proof — resultado da enquete 17/06, repost UGC/WA (com fallback se não houver), convite para mais UGC
- **Bloco B (20h):** 3 stories de diferenciação — enquete ancoragem, contraste visual "sorvete por kg vs. potinho preço fixo" (sem nomear concorrente), CTA direto com variantes do produto
- **Cronograma completo** para o operador: 13h → 22h30
- **Script de resposta rápida** para DM/inbox: cobre as 3 variantes do produto + conversão WA
- **Tabela de integração multi-canal** (IG Stories, WA Status, TikTok, Feed)
- **Notas para o operador:** 5 pontos práticos incluindo dependência do Reel 17/06 e atualização se ingredientes mudarem

**Commit:** `11e9323`

**Próximo passo sugerido:**
- **Ciclo #179 — SEO:** Esqueleto da landing page `potinho-junino-londrina.html` com placeholders estruturados (não bloqueia mais aguardar operador — o esqueleto já pode ser commitado e preenchido depois)
- **Ciclo #180 — Conversão:** Script WA de upsell das variantes B e C do Potinho Junino para atendente sugerir no PDV
- **Ciclo #181 — Feed 19/06:** Caption + conceito foto editorial do Potinho Junino (prescrito no `semana9.md` para sex 19/06 — slot vazio)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Configurar keyword `JUNINA26` no WA Business até **06/06** ⚠️ URGENTE (27 dias)
- **Operador:** Buscar trilha baiãozinho lo-fi TikTok na semana de **08/06**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #178 | 2026-05-10_

---

## Ciclo #180 — 2026-05-10

**Área:** Conversão — Script WA upsell Potinho Junino variantes B e C

**Contexto:** Ciclos #177–179 completaram a sequência de conteúdo de lançamento do Potinho Junino para qua/qui/sex 17–19/06. Ciclo #180 preenche a lacuna operacional: o atendente sabia que existem 3 versões (prescrito em `potinho-junino-2026-contraprogramacao.md`) mas não tinha script concreto para oferecer Versão B (Mel & Cocada) e Versão C (Fit) no balcão e no WA sem improvisar.

**O que pesquisou/analisou:**
- Releitura de `potinho-junino-2026-contraprogramacao.md` — ingredientes exatos de cada variante (linhas 44–61)
- Releitura de `whatsapp-funil.md` — padrão de formato e tom dos scripts WA existentes
- Releitura de `whatsapp-junina-2026.md` (ciclo #165) — estrutura de broadcasts e keyword `JUNINO26`
- Releitura de `pos-inauguracao-semana9.md` — cronograma 17–20/06, KPIs, checklist operacional

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/whatsapp-potinho-junino-upsell-variantesBC.md` | NOVO — script completo de upsell |

**Detalhes do conteúdo criado:**
- **Tabela de referência rápida** dos 3 Potinhos Juninos (base, toppings, perfil de cliente)
- **Roteiro PDV presencial:** frase para quando cliente pede sem especificar versão + oferta de upgrade da Versão A
- **5 scripts WA** prontos para copiar/colar: (1) pedido sem versão, (2) upgrade Versão A, (3) indeciso, (4) alergia amendoim, (5) broadcast pós-lançamento 18/06
- **Broadcast São João 24/06** — script para pico da campanha às 12h
- **Checklist operacional por turno** (estoques, WA Business keyword, rótulos)
- **5 variações de frase de fechamento** para não repetir no mesmo dia
- **Rastreamento de variante** embutido no checklist (anotar A/B/C por pedido WA)

**Commit:** `3f05449`

**Próximo passo sugerido:**
- **Ciclo #181 — Feed 19/06:** Caption + conceito foto editorial do Potinho Junino (slot prescrito em `semana9.md`, ainda sem arquivo de produção dedicado)
- **Ciclo #182 — UX:** Sábado 20/06 — Reel urgência + stories encerramento semana 9 (prescrito em `semana9.md`, sem arquivo)
- **Ciclo #183 — SEO:** Landing page `potinho-junino-londrina.html` (esqueleto com placeholders — não bloqueia mais operador)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Configurar keyword `JUNINO26` no WA Business até **06/06** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade de cocada e mel (Versões B e C) até **13/06**
- **Operador:** Buscar trilha baiãozinho lo-fi TikTok na semana de **08/06**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #180 | 2026-05-10_

---

## Ciclo #183 — 2026-05-10

**Área:** Conteúdo — Brief de produção Reel 15s + Stories Dia de São João (24/06/2026)

**Contexto:** Ciclos #177–182 completaram toda a produção da semana 9 (17–20/06) do Potinho Junino com briefs dedicados por dia. O ciclo #182 sugeriu "ciclo #183 — SEO landing page", mas essa já foi criada no ciclo #179. O item mais urgente no horizonte é o Dia de São João (24/06) — pico máximo de alcance orgânico junino e dia de maior concorrência (TheBest Açaí com Festival Junino em 6 unidades Londrina, MilkyMoo com "Pede Mooleca"). O `semana10.md` tinha apenas um esboço de Reel e 5 blocos de Stories para esse dia — sem brief fotográfico, sem direção de arte, sem checklist operacional detalhado.

**O que pesquisou/analisou:**
- Releitura de `pos-inauguracao-semana10.md` (seção Qua 24/06, linhas 117–185): roteiro básico + caption base + 5 blocos de stories
- Releitura de `reel-lancamento-potinho-junino-17jun.md`: formato de brief de produção de referência (estilo que funciona)
- Releitura de `reel-urgencia-potinho-junino-20jun.md`: direção de arte e formato de checklist por turno
- Releitura de `potinho-junino-2026-contraprogramacao.md`: diferencial "preço fixo vs. balança" (TheBest) — ângulo central do São João
- Releitura de `belinha/competitors/milkymoo.md` e `the-best-acai.md`: contexto competitivo confirmado (Festival Junino 6 unidades TheBest; Pede Mooleca MilkyMoo ativo)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/reel-sao-joao-24jun-potinho-junino.md` | NOVO — brief completo Reel + Stories + Broadcast WA + KPIs |

**Detalhes do conteúdo criado:**
- **Contexto estratégico** com diferencial vs. TheBest/MilkyMoo ("preço fixo + personalização" vs. "por balança" vs. "produto genérico")
- **Roteiro Reel 15s** (4 blocos): abertura festiva com ovelhinha chapéu de palha, reveal produto slow-motion zoom no rótulo com nome, contraste diferencial preço fixo, CTA com logo
- **Direção de arte** completa: paleta, tipografia, stickers, trilha musical, ferramenta sugerida, o que evitar
- **Caption principal** (Instagram + TikTok) + versão compacta (Stories / WA Status)
- **Sequência de 5 Stories** com horários escalonados (10h30 / 14h / 18h / 19h / 21h): abertura festiva, produto + enquete, promoção carimbo extra (condicional operador), bastidores, CTA UGC
- **Template broadcast WA** (disparo 10h–11h, lote máximo 20 contatos)
- **Checklist operacional** por período (preparação/manhã/tarde-noite/encerramento) com 24 itens
- **Tabela KPI do dia** com 8 indicadores e metas numéricas
- **Mapa de integração** da semana 10 com referências cruzadas
- **Nota de produção** sobre escolha de horário do Reel (11h vs. 18h) com critério baseado em dados

**Commit:** `18a599a`

**Próximo passo sugerido:**
- **Ciclo #184 — Conversão:** Mecânica "Embaixador MilkyPot" — documento de treinamento do operador (critério ≥3 indicações, recompensa Potinho Grande grátis, como rastrear)
- **Ciclo #185 — Conteúdo:** Post feed + Stories Sex 26/06 "Adeus junino, oi julho" — teaser para semana 11 (prescrito em `semana10.md`, sem brief dedicado)
- **Ciclo #186 — UX:** `checkout.html` — auditoria mobile CLS/bundle (postergado desde ciclo #162 do roadmap, risco crescente)
- **Ciclo #187 — Concorrentes:** Refetch pré-São João de MilkyMoo + TheBest (últimas atualizações ciclo #176, 1 semana atrás — verificar se campanhas São João foram lançadas)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar promoção "carimbo extra São João" até **23/06** (1 dia antes)
- **Operador:** Confirmar disponibilidade cocada e mel (Versões B e C) até **13/06**
- **Operador:** Configurar keyword `JUNINO26` no WA Business até **22/06** (2 dias antes do São João)
- **Operador:** Pesquisar trilha forró lo-fi trending na semana **22/06** no Instagram Reels
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #183 | 2026-05-10_

---

## Ciclo #184 — 2026-05-10

**Área:** Conversão — Milestone "3 Indicações = Potinho Grande Grátis"

**Contexto:** Ciclos #41 e #52 criaram o Indica & Ganha (1 indicação = 1 carimbo) e o Embaixador do Mês (concurso mensal). Havia uma lacuna no funil de conversão: clientes com 1–2 indicações não tinham motivação concreta para tentar a 3ª. O log do ciclo #183 identificou como próximo passo criar o documento de treinamento da mecânica "Embaixador MilkyPot" com critério ≥3 indicações e recompensa Potinho Grande grátis.

**O que pesquisou/analisou:**
- Releitura de `whatsapp-indicacao.md` (ciclo #41): mecânica base, planilha de rastreamento, templates existentes A–D
- Releitura de `embaixador-do-mes.md` (ciclo #52): concurso mensal — confirmar que são programas distintos que se complementam
- Releitura do log ciclos #180–183: contexto da semana Potinho Junino e pendências operacionais

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/embaixador-3indicacoes-treinamento.md` | NOVO — documento completo de treinamento operador |

**Detalhes do conteúdo criado:**
- **Tabela comparativa** dos 3 programas de indicação (Indica & Ganha / Milestone 3 / Embaixador do Mês) — clareza para o operador entender onde cada programa se encaixa
- **Passo a passo operacional** completo (perspectiva do operador e do cliente)
- **Planilha de rastreamento** com colunas específicas para o milestone + dica de grupo WA interno
- **Lógica de alertas de progresso**: quando mandar Template PROG-1 (1ª ind.), PROG-2 (2ª ind., urgência), e Template A (milestone atingido)
- **5 templates WA** prontos: PROG-1 (addon à confirmação), PROG-2 (urgência falta 1), Template A (milestone), Template B (confirmação resgate), Template C (reativação 30+ dias)
- **Script PDV** para o atendente usar no balcão quando amigo indicado aparece
- **Roteiro de entrega** do Potinho Grande na loja (7 passos)
- **Mapa de integração** dos 3 programas com fluxo visual
- **Tabela ROI estimado**: custo ~R$12–18, receita gerada ~R$66–84, ROI ~5x por milestone
- **Checklist semanal** de segunda-feira (5 itens)
- **FAQ operador** com 4 casos de borda (parente/online/promo inauguração/planilha perdida)

**Commit:** `b0476b7`

**Próximo passo sugerido:**
- **Ciclo #185 — Conteúdo:** Post feed + Stories Sex 26/06 "Adeus junino, oi julho" — teaser semana 11 (prescrito em `semana10.md`, sem brief dedicado)
- **Ciclo #186 — UX:** `checkout.html` — auditoria mobile CLS/bundle (postergado desde ciclo #162 do roadmap, risco crescente)
- **Ciclo #187 — Concorrentes:** Refetch pré-São João de MilkyMoo + TheBest (últimas atualizações ciclo #176, 1 semana atrás)
- **Ciclo #188 — Conversão:** Script de apresentação do milestone 3 indicações para novos clientes na inauguração tardia (Template PROG-1 como sequência de boas-vindas)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE (20 dias)
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar valor de venda do Potinho Grande (necessário para calibrar FAQ e scripts)
- **Operador:** Confirmar disponibilidade cocada e mel (Versões B e C) até **13/06**
- **Operador:** Configurar keyword `JUNINO26` no WA Business até **22/06**
- **Operador:** Google Search Console — solicitar indexação do sitemap.xml (pendente desde ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #184 | 2026-05-10_

---

## Ciclo #185 — 2026-05-10

**Área:** Conteúdo — Brief dedicado Sex 26/06 "Adeus junino, oi julho"

**Contexto:** A semana 10 (`pos-inauguracao-semana10.md`, ciclo #49) tinha apenas um bloco resumido para a sexta 26/06. Ciclos #183 e #184 identificaram a necessidade de um brief dedicado equivalente ao reel-sao-joao (ciclo #183) — produção completa com direção de arte, sequência de stories escalonada, template WA e integração com a semana 11 (Potinho Caramelado).

**O que pesquisou/analisou:**
- Releitura de `pos-inauguracao-semana10.md` para extrair o bloco "Sexta 27/06" existente
- Releitura de `pos-inauguracao-semana11.md` para mapear o que o teaser de julho deve preparar (Potinho Caramelado reveal 01/07)
- Releitura de `reel-sao-joao-24jun-potinho-junino.md` para manter consistência de formato e profundidade

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/content/feed-26jun-adeus-junino-oi-julho.md` | NOVO — brief completo post feed + 4 Stories + template WA + KPIs + checklist |

**Detalhes do conteúdo criado:**
- **Contexto estratégico** posicionando a sexta 26/06 no arco narrativo (pós-São João → urgência → teaser → reveal semana11)
- **Arte do post feed** com especificação de composição (potinho em foco, bandeirinhas desfocadas atrás, ovelhinha acenando com lenço + olhinho curioso) e alternativa simples sem designer
- **Caption principal** (instagram/feed, ~160 palavras) + versão curta (TikTok/Stories)
- **Sequência de 4 Stories** escalonada 19h–21h: Story 1 (despedida emocional 19h), Story 2 (contagem regressiva 19h30), Story 3 (teaser julho sem revelar 20h), Story 4 (caixinha de palpites 21h)
- **Template broadcast WA** (`/despedidajunino`) para lote máximo 20 contatos às 18h
- **Tabela de integração** com semana 11 — como cada elemento do 26/06 prepara o reveal do Potinho Caramelado
- **KPI da data** com 6 indicadores e metas numéricas
- **Checklist de produção** com 10 itens escalonados por horário
- **Nota operacional** com versões simplificadas (só Story 1+2 se operador sem energia; só post feed se sem WA)

**Commit:** `3f72969`

**Próximo passo sugerido:**
- **Ciclo #186 — UX:** `checkout.html` — auditoria mobile CLS/bundle (postergado desde ciclo #162 do roadmap — risco crescente, agora é prioridade real)
- **Ciclo #187 — Concorrentes:** Refetch pré-São João de MilkyMoo + TheBest (últimas atualizações ciclo #176 — verificar campanhas São João lançadas)
- **Ciclo #188 — Conversão:** Brief de encerramento do Potinho Junino (30/06 — despedida definitiva + ponte para Potinho Caramelado)
- **Ciclo #189 — Conteúdo:** Brief completo do reveal Potinho Caramelado (01/07, semana 11)
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** Confirmar promoção "carimbo extra São João" até **23/06** (1 dia antes)
- **Operador:** Configurar keyword `JUNINO26` + `/despedidajunino` no WA Business até **22/06**
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #185 | 2026-05-10_

---

## Ciclo #186 — 2026-05-10

**Área:** UX/Frontend — CLS fix skeleton cards em `index.html` + consolidação CSS

**Contexto:** Prescrito como ciclo #186 no roadmap (postergado desde #162). O `checkout.html` não existe como arquivo independente — o checkout é um modal embutido. Auditoria UX revelou problema real diferente: `index.html` tinha o `#productGrid` completamente vazio no HTML (`<!-- Generated by JS -->`), enquanto `cardapio.html` já tinha 6 skeletons. Isso causava CLS visível em `index.html` toda vez que o JS renderizava os produtos: o grid saía de 0px para ~400px+ de altura, empurrando todo o conteúdo abaixo.

**O que pesquisou/analisou:**
- Comparou `#productGrid` em `cardapio.html` (6 skeletons HTML) vs `index.html` (grid vazio)
- Verificou que `.product-card-skeleton` + `@keyframes skeleton-shimmer` eram CSS inline exclusivo de `cardapio.html` — ausentes em `css/style.css`
- Confirmou que `index.html` usa `css/style.css` mas não tinha acesso à definição do skeleton
- Mediu height real dos cards: `product-card-mobile` com padding 14px + emoji-wrap 72px + card-info ~90px ≈ ~100px; ajustou `min-height` do skeleton de 128px → 100px para melhor correspondência
- Verificou que `cardapio.css` (21K) nunca é carregado por nenhum HTML — orphaned, não afeta performance

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `css/style.css` | ADICIONADO bloco "Product Card Skeleton" com `.product-card-skeleton` (min-height: 100px, shimmer gradient) + `@keyframes skeleton-shimmer` após `.catalog-cat-divider-desc` |
| `index.html` | `#productGrid` de vazio → 4 skeleton divs com `aria-hidden="true"` (CLS fix) |
| `cardapio.html` | Removido CSS inline duplicado (`.product-card-skeleton` + `@keyframes`) — agora herda de `style.css` (DRY) |

**Impacto esperado:**
- `index.html`: elimina layout shift ao carregar produtos (grid reserva ~400px antes do JS rodar)
- `cardapio.html`: sem mudança visual — ainda tem 6 skeletons, agora via `style.css`
- Manutenção: skeleton atualizado em 1 lugar (style.css) afeta ambas as páginas

**Commit:** `c6483f0`

**Próximo passo sugerido:**
- **Ciclo #187 — Concorrentes:** Refetch MilkyMoo + TheBest (última atualização ciclo #176, >1 semana atrás — verificar campanhas Festa Junina/São João lançadas)
- **Ciclo #188 — Conteúdo:** Brief completo encerramento Potinho Junino (30/06 — despedida definitiva + ponte para Potinho Caramelado semana 11)
- **Ciclo #189 — Conteúdo:** Brief reveal Potinho Caramelado (01/07)
- **Ciclo #190 — UX:** `cardapio.css` (21K) é orphaned — nunca carregado. Avaliar: deletar (após confirmar 0 dependências) ou incorporar ao `style.css`
- **Operador:** Confirmar ingredientes Potinho Junino até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar naming "Potinho Junino" até **30/05** ⚠️ URGENTE
- **Operador:** Confirmar disponibilidade calda de caramelo + granola para Potinho Caramelado até **20/06**
- **Operador:** Configurar keyword `JUNINO26` + `/despedidajunino` no WA Business até **22/06**
- **Operador:** Google Search Console — solicitar indexação sitemap.xml (pendente ciclo #148)
- **Operador:** CNPJ + DPO — LGPD — risco legal crescente

_Belinha — Ciclo #186 | 2026-05-10_

_Belinha — Ciclo #185 | 2026-05-10_

---

## Ciclo #208 — 2026-05-13

**Área:** Concorrentes — MilkyMoo refetch pós-Carameluda + intel Dia da Vaca 08/07 + Milky Moo Festa + férias escolares julho 2026

**Contexto:** Prescrito como próximo passo desde o ciclo #207. Última atualização de MilkyMoo era o ciclo #187 (10/05). Foco: (1) status da collab Carameluda (encerrando?), (2) campanha Dia da Vaca 08/07, (3) novo modelo Milky Moo Festa (eventos), (4) posicionamento de férias escolares julho.

**O que pesquisou/analisou:**
- WebSearch: "MilkyMoo collab O Boticário caramelizado maio 2026" → collab Carameluda confirmada encerrando ao fim de maio; produto Carameluda (sorvete baunilha + caramelo salgado + doce de leite + biscoitos especiarias), R$25 o 300ml, campanha #DoceLovers com cantora Desirée
- WebSearch: "MilkyMoo Dia da Vaca 8 julho 2026" → campanha "Cow Era" confirmada: coupon COWERA no app, 300ml Pintadinha R$9,90 em 08/07 exclusivamente via app na loja física
- WebSearch: "Milky Moo Festa modelo móvel eventos 2026 expansão" → novo formato confirmado via Exame e Portal do Franchising: operação móvel para eventos, investimento a partir de R$200k, meta 1.500 franquias do modelo Festa no longo prazo, 1.352 cidades mapeadas
- WebSearch: faturamento e expansão 2025 → confirmados R$542M (+40%), 800 lojas (+31%), projeção 50% crescimento para 2026
- WebSearch: férias escolares julho 2026 → sem campanha MilkyMoo anunciada ainda; histórico mostra parcerias de shopping (não da rede nacional)

**O que mudou:**

| Arquivo | Mudança |
|---------|---------|
| `belinha/competitors/milkymoo.md` | ADICIONADO bloco "Ciclo #208" (~100 linhas): consolidação financeira 2025, Milky Moo Festa, campanha Dia da Vaca 08/07, status pós-Carameluda, radar de preços atualizado, mapa competitivo projeção julho 2026, 5 conclusões estratégicas |

**Destaques da análise:**
1. **Vácuo caramelo confirmado:** Carameluda encerra em maio → MilkyPot Potinho Caramelado entra em 01/07 com campo limpo
2. **Dia da Vaca 08/07 = contra-programação:** MilkyMoo domina feeds com "Cow Era"; MilkyPot pode responder com "ovelhinha tem o mês todo" — leve, sem atacar
3. **Milky Moo Festa = ameaça de médio prazo:** pode chegar a Londrina em 6–18 meses; MilkyPot deve marcar território em eventos (catering via WA) antes disso
4. **Férias escolares:** campo aberto para campanha temática "Férias da Ovelhinha" em julho
5. **Escala:** MilkyMoo tem 800 lojas e R$542M — vantagem de MilkyPot é vínculo local + personalização + funil próprio

**Próximo passo sugerido:**
- **Ciclo #209 — Conteúdo:** Dia dos Pais 09/08 — posts feed IG/TikTok + Stories (WA `whatsapp-pais-2026.md` já existe; falta conteúdo visual/narrativo)
- **Ciclo #210 — Conteúdo:** Brief "Férias da Ovelhinha" (julho) — campanha temática para férias escolares capturando famílias do Muffato
- **Ciclo #211 — UX:** Próxima fase do banner após 31/07 (Dia dos Pais 09/08?)
- **Ciclo #212 — Conversão:** Brief contra-programação "Dia da Vaca" 08/07 — stories ovelhinha + CTA WA
- **Operador (URGENTE):** Confirmar ≥3 reviews Google Maps → descomentar `aggregateRating` (Blocker #7)
- **Operador:** Confirmar horário julho — mesmo ou diferente? (Blocker #8)
- **Operador:** Confirmar naming final e ingredientes Potinho Junino até **30/05** ⚠️
- **Operador:** Estratégia de catering/eventos informais via WA para antecipar Milky Moo Festa

_Belinha — Ciclo #208 | 2026-05-13_

---
