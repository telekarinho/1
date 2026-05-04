# Belinha — Log de Ciclos

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
