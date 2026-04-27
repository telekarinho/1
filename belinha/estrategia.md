# Belinha — Estratégia de Ciclos

_Atualizado no ciclo #35 (auto-aprimoramento obrigatório a cada 5 ciclos)_

---

## Aprendizados dos ciclos #1–5

### O que gerou mais valor concreto
1. **Correções de bug em HTML/JS** (ciclo #5) — impacto imediato e direto para usuário final
2. **SEO técnico** (ciclos #1-3) — sitemap, Schema.org, OG: efeito cumulativo e indexável
3. **Conteúdo pronto para publicar** (ciclo #1) — captions prontas que a equipe usa sem retrabalho

### O que foi menos eficaz
- **Documentação Markdown só** (ciclos #3 parcial, #4) — funil WhatsApp ficou em doc mas não validou o número no HTML → bug crítico passou despercebido
- **Pesquisa de concorrentes sem follow-up** — análise de MilkyMoo/JohnnyJoy ficou em arquivos raramente consultados

---

## Aprendizados dos ciclos #20–24

### O que gerou mais valor concreto
1. **Bugfix crítico WhatsApp (ciclo #20)** — número placeholder `5511999999999` detectado e corrigido em `cardapio.js`, `checkout.js` e `stores-data.js`. Sem este fix, **100% dos pedidos na inauguração seriam perdidos**. Maior ROI de qualquer ciclo.
2. **Auto-seleção de loja no checkout (ciclo #21)** — 1 clique a menos no funil. Pequena mudança, alto impacto de conversão especialmente com 1 loja ativa.
3. **Badge "● ABERTO" pulsante (ciclo #22)** — sinal visual permanente durante horário de funcionamento. Reduz hesitação antes do clique no WhatsApp.
4. **Cartão Fidelidade Digital (ciclo #23)** — `cartao-fidelidade.html?stamps=N` — link personalizado por cliente, zero infra adicional. Bom mecanismo de retenção de custo zero.
5. **Template WhatsApp fidelidade + Schema foundingDate (ciclo #24)** — operador tem script copy-paste para o dia mais importante.

### O que foi menos eficaz
- Ciclos #3–4 (pre-inauguração): muito foco em Schema.org e sitemap que levam semanas para indexar — pouco impacto visível antes da inauguração
- Pesquisa concorrentes `jhoy.md` e `the-best-acai.md` ficaram prontas mas não geraram nenhuma mudança concreta no site até agora

### Padrão que funciona
> **Bug/fix em HTML/JS > UX conversão > conteúdo acionável > SEO técnico > pesquisa concorrentes**

---

## Fase atual: PÓS-INAUGURAÇÃO (a partir de 26/04/2026)

A inauguração aconteceu (25/04/2026). O foco muda:

| Antes (pré-inauguração) | Agora (pós-inauguração) |
|---|---|
| Dados corretos de contato | Taxa de retorno de clientes |
| UX mobile sem bugs | Programa fidelidade funcionando |
| SEO local para ser encontrado | Avaliações Google Maps / Instagram UGC |
| Conteúdo de inauguração | Conteúdo de rotina semanal |
| Checkout funcional | Upsell e ticket médio |

---

## Regras de priorização ATUALIZADAS (pós-inauguração)

1. **Verificar dados críticos** — telefone, WhatsApp, endereço — a cada ciclo (permanente)
2. **Conversão e fidelização primeiro** — fidelidade, upsell, reativação de clientes
3. **Conteúdo acionável** — posts/stories prontos que a equipe pode postar sem retrabalho
4. **SEO progressivo** — `aggregateRating` (quando tiver reviews), novos Schema.org, pages de produto
5. **Pesquisa concorrentes** — apenas se gerar mudança concreta no site ou copy

---

## Rotação de áreas ATUALIZADA

| Prioridade | Área | Critério / Exemplo |
|---|---|---|
| 1 | **Conversão** | fidelidade, cartão, upsell, reativação WA |
| 2 | **Conteúdo acionável** | posts semana 2/3/4, scripts de atendimento |
| 3 | **UX/Frontend** | mobile, performance, novos fluxos |
| 4 | **SEO técnico** | aggregateRating, FAQ schema, novas páginas |
| 5 | **Pesquisa concorrentes** | só se gerar ação no site |

---

## KPIs para medir valor dos ciclos (pós-inauguração)

| KPI | Onde medir |
|---|---|
| Cliques no botão WhatsApp | Google Analytics / Firebase Events |
| Taxa WA → pedido realizado | Controle manual do operador |
| Posição "potinho ninho londrina" | Google Search Console |
| Cartões fidelidade emitidos | Registro manual do operador |
| Avaliações Google Maps | Google Business Profile |
| Taxa de retorno de clientes | Comparar semana 1 vs semana 2 WA |

---

---

## Aprendizados dos ciclos #26–29

### O que gerou mais valor concreto
1. **Landing page SEO local `potinho-ninho-londrina.html` (ciclo #27)** — página dedicada ao termo long-tail captura tráfego orgânico sem concorrer com `index.html`; impacto SEO cumulativo de longo prazo.
2. **Benefits bar com copy anti-self-service + pesquisa Jhoy (ciclo #28)** — análise de concorrente resultou em mudança concreta no site (benefits bar), não apenas em doc. Padrão correto: pesquisa → ação imediata.
3. **LCP mobile `cardapio.html` (ciclo #29)** — preload + fetchpriority + dimensões explícitas: melhoria técnica que afeta diretamente usuários em conexões lentas (maioria mobile).
4. **FAQPage Schema.org + template aggregateRating (ciclo #26)** — baixo custo, pronto para ativar quando reviews chegarem; boa preparação de infraestrutura SEO.

### O que foi menos eficaz
- **Ciclo #26 (FAQPage)**: Schema.org é assíncrono — efeito real só aparece semanas após indexação. Correto fazer, mas não conta como "impacto rápido".
- **Pesquisa Jhoy**: chegou tarde (ciclo #28). Próximas pesquisas de concorrentes devem ser sempre vinculadas a uma mudança concreta planejada antecipadamente.

### Padrão consolidado
> **Bug/fix crítico > Conversão direta > UX/Performance > Conteúdo acionável > SEO técnico > Pesquisa concorrente (só com follow-up imediato)**

---

## Novo contexto: Semana 2 pós-inauguração (a partir de 02/05/2026)

| Prioridade | Área | Ação |
|---|---|---|
| 1 | **Reviews Google Maps** | CTA visual no site (feito ciclo #30) + stories incentivo semana 3 (feito ciclo #30) |
| 2 | **Retenção** | Cartão fidelidade sendo usado? Operador enviando links? Monitorar. |
| 3 | **aggregateRating** | Ativar Schema.org quando tiver ≥5 reviews reais no Google |
| 4 | **Conteúdo recorrente** | Semana 4, 5 — criar templates que reduzam trabalho operador |
| 5 | **Ticket médio / Upsell** | Banner de milkshake/açaí self-service no cardapio.html |

---

## Bloqueadores identificados
- `aggregateRating` só pode ser ativado com reviews reais verificáveis → **dependente da operação** (não do código)
- Google Analytics ID ainda é `G-XXXXXXXXXX` → impede medição de KPIs → **necessita autorização usuário** para substituir pelo ID real

---

## Próximas iniciativas sugeridas (ciclos 31–35)

- **Ciclo #31:** Ativar `aggregateRating` em `index.html` se operador confirmar ≥3 reviews Google (monitorar)
- **Ciclo #32:** Upsell banner em `cardapio.html` — milkshake / açaí self-service Muffato como topping premium
- **Ciclo #33:** Conteúdo semana 4 pós-inauguração + template "mensagem reativação WhatsApp" para clientes silenciosos
- **Ciclo #34:** Verificar se `potinho-ninho-londrina.html` indexou — adicionar link interno de `index.html` se não aparecer
- **Ciclo #35:** Auto-aprimoramento — reler log ciclos 30–34, ajustar rotação e KPIs ✅ (feito)

---

_Belinha — Ciclo #30 | 2026-04-25_

---

## Aprendizados dos ciclos #30–34

### Contexto do período
Semana de inauguração (25/04/2026) + primeiros dias de operação. Foco: converter clientes da inauguração em recorrentes.

### O que gerou mais valor concreto
1. **Google Review CTA em `index.html` + semana 3 content (ciclo #30)** — dupla impacto: reviews melhoram posição no Maps E credibilidade na SERP. Template de stories incentivando review entregue ao operador.
2. **Playbook de reativação WhatsApp 8 templates D+1→D+30 (ciclo #32)** — ativo de alto valor a custo zero: operador tem script pronto para reengajar clientes silenciosos sem improvisar.
3. **Link interno `index.html` → `potinho-ninho-londrina.html` (ciclo #33)** — crawl path estabelecido para página órfã; impacto SEO cumulativo e de longo prazo. Padrão: sempre verificar se nova página tem link interno antes de considerá-la "entregue".
4. **Semana 4 content completo (ciclo #34)** — 4 posts + scripts de stories + templates WA + KPIs: operador tem material para semana 10–16/05 sem precisar improvisar.

### O que foi menos eficaz
- **Upsell banner `cardapio.html` (ciclo #31)** — banner CSS sem acompanhar mudança de copy na seção de hero; impacto visual bom mas pequeno pois usuário já está na tela de produto.
- **Ciclo #35 (este ciclo)** — link em `cardapio.html` → `potinho-ninho-londrina.html` deveria ter sido feito no ciclo #33 junto com o link do `index.html`. Aprendizado: links internos devem ser adicionados em TODAS as páginas relevantes no mesmo ciclo, não na próxima iteração.

### Padrão atualizado (prioridade de ciclo)

> **Bug/fix crítico > Conversão direta > UX/Performance mobile > Conteúdo acionável + templates operador > SEO técnico (links internos, schema) > Pesquisa concorrente (só com follow-up imediato)**

### Fase atual: pós-inauguração (semanas 1–4)

Inauguração ocorreu em 25/04/2026. Agora o foco muda:

| Área | Estado | Próxima ação |
|------|--------|-------------|
| Conteúdo semanas 1–4 | ✅ Completo | Criar semana 5 (17–23/05) |
| Cartão fidelidade | ✅ Página criada | Operador usando? Monitorar via WA |
| aggregateRating | ⏳ Aguarda reviews reais | Ativar quando ≥3 reviews Google verificáveis |
| Google Analytics | ⚠️ ID placeholder | Requer autorização usuário para substituir G-XXXXXXXXXX |
| Concorrentes | ✅ 4 mapeados | Revisão trimestral ou quando lançarem promoção |
| link cardapio → ninho-londrina | ✅ Feito (ciclo #35) | — |

### Próximas iniciativas sugeridas (ciclos 36–40)

| Ciclo | Área | Ação |
|-------|------|------|
| #36 | Conteúdo | `pos-inauguracao-semana5.md` — semana 17–23/05: fidelização, "mês de MilkyPot" |
| #37 | UX/Performance | Verificar LCP e CLS em `index.html` mobile (PageSpeed Insights) |
| #38 | SEO | Adicionar `potinho-ninho-londrina.html` no link de `cartao-fidelidade.html` + testar markup Schema.org com Rich Results Test |
| #39 | Conversão | Template "mensagem de indicação": cliente envia amigo → recebe 1 carimbo extra |
| #40 | Auto-aprimoramento | Reler log ciclos 35–39, revisar KPIs, ajustar rotação |

### Bloqueadores ativos

| Bloqueador | Dependência | Impacto |
|------------|-------------|---------|
| Google Analytics ID real | Autorização usuário | Sem medição de KPIs digitais |
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis | Sem rich snippet de estrelas na SERP |
| Operador enviando cartão fidelidade? | Feedback do operador | Desconhecemos adoção real |

---

_Belinha — Ciclo #35 | 2026-04-25_

---

## Aprendizados dos ciclos #35–39

### Contexto do período
D+0 a D+1 pós-inauguração (25–26/04/2026). Ciclos focados em performance frontend após a loja abrir com tráfego real.

### O que gerou mais valor concreto
1. **Google Fonts non-blocking sweep ciclos #37–#39** — eliminação de render-blocking em 5 páginas (`index.html`, `cartao-fidelidade.html`, `potinho-ninho-londrina.html`, `cardapio.html`, `raspinha.html`). LCP mobile melhora diretamente a posição no Google (Core Web Vitals). Impacto: usuários com 4G lento chegam ao conteúdo ~200–400ms mais rápido.
2. **Hero image preload + fetchpriority `index.html` (ciclo #37)** — sinalizador explícito de prioridade para o elemento LCP principal. Sem custo de infra.
3. **Conteúdo semana 5 `pos-inauguracao-semana5.md` (ciclo #36)** — semana de "1 mês de MilkyPot" com templates de reativação D+21, script de solicitação de review e KPIs. Operador tem material pronto até 23/05.

### O que foi menos eficaz
- **Ciclo #38 planejado como SEO** → acabou sendo UX/performance. A estratégia previu incorretamente a ordem de urgência — fontes bloqueantes em páginas SEO críticas eram mais urgentes do que um novo link de rodapé.
- **Sweep incompleto por ciclo**: ciclo #37 corrigiu `index.html`, ciclo #38 corrigiu mais 2 páginas, ciclo #39 mais 2. Padrão a evitar: quando um problema sistêmico é identificado (ex: fonte bloqueante em N páginas), resolver TODAS no mesmo ciclo com iteração em batch.

### Padrão consolidado (v3)

> **Bug/fix crítico > Conversão direta > UX/Performance sweep (TODAS as páginas afetadas no mesmo ciclo) > Conteúdo acionável > SEO técnico > Pesquisa concorrente (só com follow-up imediato)**

### Estado atual das páginas (26/04/2026)

| Página | Google Fonts non-blocking | Obs |
|--------|--------------------------|-----|
| `index.html` | ✅ ciclo #37 | + hero preload |
| `cartao-fidelidade.html` | ✅ ciclo #38 | |
| `potinho-ninho-londrina.html` | ✅ ciclo #38 | página SEO crítica |
| `cardapio.html` | ✅ ciclo #39 | |
| `raspinha.html` | ✅ ciclo #39 | |
| `login.html` | ⏳ pendente | baixo tráfego orgânico |
| `desafio.html` | ⏳ pendente | baixo tráfego orgânico |
| `termos.html` | ⏳ pendente | baixo impacto LCP |
| `privacidade.html` | ⏳ pendente | baixo impacto LCP |

### Próximas iniciativas sugeridas (ciclos 40–44)

| Ciclo | Área | Ação |
|-------|------|------|
| #40 | UX/Performance | Fix fontes bloqueantes em páginas restantes: `login.html`, `desafio.html`, `termos.html`, `privacidade.html` |
| #41 | Conversão | Template "mensagem de indicação": cliente envia amigo → recebe 1 carimbo extra (copy WhatsApp + regras) |
| #42 | Conteúdo | `pos-inauguracao-semana6.md` — semana 24–30/05: consolidação de hábito, desafio UGC, engajamento |
| #43 | SEO | Ativar `aggregateRating` em `index.html` se operador confirmar ≥3 reviews Google Maps |
| #44 | Auto-aprimoramento | Reler log ciclos 39–43, ajustar estratégia para junho (mês 2) |

### Bloqueadores ativos (sem mudança)

| Bloqueador | Dependência | Impacto |
|------------|-------------|---------|
| Google Analytics ID real | Autorização usuário | Sem medição de KPIs digitais |
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis | Sem rich snippet de estrelas na SERP |
| Adoção do cartão fidelidade | Feedback do operador | Desconhecemos uso real |

---

_Belinha — Ciclo #39 | 2026-04-26_

---

## Aprendizados dos ciclos #39–43

### Contexto do período
Ciclos 39–43 abrangem 26/04/2026 (D+1 pós-inauguração). Foco predominante: finalizar sweep técnico de performance + construir arsenal de conversão e conteúdo para o mês de maio.

### O que gerou mais valor concreto
1. **Sweep Google Fonts non-blocking 100% (#40)** — Domínio inteiro livre de render-blocking fonts após 4 ciclos consecutivos (37→38→39→40). Impacto direto no LCP mobile de todas as páginas, especialmente `login.html` e `desafio.html` que antes bloqueavam o render inteiro. Lição: problema sistêmico identificado → resolver TODAS as instâncias no menor número de ciclos possível (idealmente 1).
2. **Indica & Ganha (#41)** — 4 templates WhatsApp prontos + regras + rastreamento manual. Operador tem material completo para ativar sem precisar criar copy do zero. Padrão de sucesso: entregável acionável imediatamente pelo operador, sem dependência técnica.
3. **Desafio UGC #PotinhoMaisFeliz (#43)** — Conteúdo de 330 linhas para a semana do 1º mês: 7 dias de posts planejados, roteiros de Reel, 4 templates WhatsApp, KPIs e critérios de seleção. Aproveita momento emocional de marco para gerar prova social orgânica. A mecânica do desafio é simples e replicável.

### O que foi menos eficaz
- **Ciclo #42 — refetch The Best Açaí**: pesquisa de concorrente sem follow-up concreto no mesmo ciclo. Valor marginal. Regra reforçada: pesquisar concorrente **apenas** quando vai gerar mudança de copy, preço ou feature no mesmo ciclo.
- **Ciclo #43 desviou do planejado (SEO)**: o roadmap previa ativação do `aggregateRating`, mas o bloqueador ativo (≥3 reviews confirmados pelo operador) impedia a execução. Desvio foi correto — mas sinaliza que bloqueadores não resolvidos ocupam slots no roadmap. Ação: quando um bloqueador dura >3 ciclos, marcar como "suspenso" e não listar mais no roadmap ativo.

### Padrão consolidado (v4)

> **Bug/fix crítico > Conversão direta > UX/Performance sweep batch (TODAS as instâncias no mesmo ciclo) > Conteúdo acionável (playbooks com templates prontos) > SEO técnico (não bloqueado) > Concorrente (só com follow-up imediato)**

### Estado das áreas em 26/04/2026

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Google Fonts non-blocking | ✅ 100% completo | — |
| Conteúdo pós-inauguração | ✅ Semanas 1–7 prontas (até 06/06) | Semana 8 (07–13/06) |
| Programa Fidelidade `cartao-fidelidade.html` | ✅ Online + links personalizados | Confirmar adoção c/ operador |
| Indica & Ganha (templates WA) | ✅ Pronto para ativar | Operador acionar |
| Desafio UGC #PotinhoMaisFeliz | ✅ Planejado 25–30/05 | Anunciar vencedores 31/05 |
| aggregateRating SEO | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps confirmados pelo operador |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |

### Estratégia para junho 2026 (mês 2 de operação)

**Pilares:**
1. **Prova social** — Repostar UGC dos vencedores do desafio; solicitar mais reviews Google
2. **Hábito semanal** — Manter cadência de 1 post feed + 3 stories/semana no mínimo
3. **Reativação** — Ativar template Indica & Ganha para base de clientes do mês 1
4. **SEO** — Quando `aggregateRating` desbloqueado, ativar imediatamente

**Tom de junho:** Celebração consolidada → "vocês nos escolheram, a gente está aqui pra ficar". Menos energy de lançamento, mais de marca estabelecida local.

### Próximas iniciativas (ciclos 45–49)

| Ciclo | Área | Ação |
|-------|------|------|
| #45 | Conteúdo | `pos-inauguracao-semana8.md` — semana 07–13/06: indicação como tema + ativar Indica & Ganha |
| #46 | SEO | Se `aggregateRating` desbloqueado: ativar em `index.html` + verificar Rich Results Test |
| #47 | Conteúdo | `pos-inauguracao-semana9.md` — semana 14–20/06: novidade de cardápio ou promoção mid-month |
| #48 | Conversão | Revisitar funil WhatsApp (`whatsapp-funil.md`): ajustar fluxo com aprendizados do mês 1 |
| #49 | Auto-aprimoramento | Reler log ciclos 44–48, ajustar estratégia para julho (mês 3) |

### Bloqueadores suspensos (não listar no roadmap ativo até desbloqueados)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis pelo operador | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |

---

_Belinha — Ciclo #44 | 2026-04-26_

---

## Aprendizados dos ciclos #44–48

### Contexto do período
Ciclos 44–48 abrangem 26/04/2026 (D+1 pós-inauguração). Foco: construir arsenal de conteúdo para junho (mês 2) e atualizar infraestrutura operacional WhatsApp com aprendizados do mês 1.

### O que gerou mais valor concreto
1. **Funil WhatsApp v2 (#48)** — Revisão completa do funil com 6 novos scripts prontos: `/obrigada2` com CTA review Google, `/voltou` (recorrente), `/indica`, `/junino`, `/acai`. Scripts acionáveis imediatamente pelo operador sem improviso. Maior ROI do período por cobrir lacunas críticas identificadas no mês 1.
2. **Potinho Junino via semana9 (#47)** — Produto sazonal de Festa Junina com ingredientes acessíveis (paçoca). Template perfeito: edição limitada, zero custo de novos insumos, urgência natural. A mecânica de sazonalidade é replicável para qualquer data comemorativa (Dia das Mães, Dia dos Namorados, Natal, etc.).
3. **FAQPage +2 perguntas SEO (#46)** — Adicionar perguntas de fidelidade e indicação antes da ativação do programa cria cobertura SEO antecipada. Boa prática: adicionar FAQ para features antes do lançamento, não depois.
4. **Semana8 Indica & Ganha (#45)** — Conteúdo + instrução operacional claros no mesmo arquivo: "na terça 09/06, dispare o Template A para até 20 clientes". Reduz margem de erro do operador vs. documentação genérica.

### O que foi menos eficaz
- **Ciclo #44 (semana7 — anúncio de vencedores do desafio UGC)**: conteúdo contingente — assume que houve participantes no desafio. Padrão a evitar: criar conteúdo que depende de resultados que o bot não consegue verificar. Preferir conteúdo não-contingente ou criar versão A (com vencedores) + versão B (sem vencedores).
- **Ciclo #46 (FAQPage)**: impacto SEO real leva semanas após indexação. Continuar fazendo (baixo custo, bom efeito cumulativo), mas não contar como "impacto rápido" do ciclo.

### Padrão consolidado (v5)

> **Bug/fix crítico > Scripts/templates operador acionáveis > Conteúdo não-contingente > UX/Performance sweep batch > SEO técnico acumulativo > Pesquisa concorrente (só com follow-up imediato)**

### Estado das áreas em 27/04/2026

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Conteúdo pós-inauguração | ✅ Semanas 1–10 prontas (até 27/06) | Semana 11 (28/06–04/07) |
| Potinho Junino | ✅ Ativo até 30/06 | Decidir continuidade em julho |
| Indica & Ganha | ✅ Ativo — operador com templates | Nomear Embaixador se ≥3 indicações confirmadas |
| Funil WhatsApp | ✅ v2 com 6 novos scripts | — |
| aggregateRating SEO | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |
| Contagem de reviews Google Maps | ⚠️ Desconhecida | Verificar Google Business Profile |

---

## Estratégia de julho 2026 (mês 3 de operação)

### Contexto
Julho marca o **3º mês de operação** e coincide com:
- **Férias escolares** (julho inteiro) → público familiar, crianças, saídas de fim de tarde
- **Aniversário de 3 meses** em **25/07** → grande momento de comunicação emocional
- **Pós-Festa Junina** → transição de sabores; fim do Potinho Junino (30/06)
- **Inverno** → chocolates quentes, caramelo, comfort food são tendência de venda

### Pilares estratégicos de julho

| Pilar | Ação concreta |
|-------|---------------|
| **Sazonalidade de inverno** | Novo produto de julho: Potinho Caramelado ou versão chocolate quente? Ingredientes de baixo custo + alta percepção de valor invernal |
| **Família + férias escolares** | Combo "família" (2+ potinhos), call-to-action para saída de tarde com criança |
| **Aniversário 3 meses (25/07)** | Campanha emocional "3 meses com vocês 🐑" — UGC, sorteio, carta da ovelhinha |
| **Embaixador MilkyPot** | Se Indica & Ganha gerou indicações, nomear 1º Embaixador do Mês em julho |
| **SEO** | Ativar `aggregateRating` assim que operador confirmar ≥3 reviews; SEO de "açaí self-service londrina" |

### Cadência de conteúdo (julho)

| Semana | Período | Tema |
|--------|---------|------|
| Semana 11 | 28/06–04/07 | Virada para julho: revelar novidade + despedida do Potinho Junino |
| Semana 12 | 05–11/07 | Férias escolares: "família de potinho" |
| Semana 13 | 12–18/07 | Mid-month: engajamento + UGC invernal |
| Semana 14 | 19–25/07 | Aniversário 3 meses MilkyPot Londrina 🎉 |

### Produto sazonal de julho

**Candidato principal:** Potinho Caramelado (Caramel Edition)
- Base: Ninho cremoso
- Toppings: calda de caramelo, granola crocante, floco de aveia
- Posicionamento: "conforto de inverno no potinho"
- Custo de insumos: baixo (calda de caramelo barata, granola disponível)
- Nome alternativo: "Potinho Quentinho" ou "Potinho Aconchego"

> Decisão final é do operador. O ponto crítico é ter o produto pronto para revelar na semana 11 (virada de julho).

### Próximas iniciativas (ciclos 50–54)

| Ciclo | Área | Ação |
|-------|------|------|
| #50 | Conteúdo | `pos-inauguracao-semana11.md` — 28/06–04/07: virada para julho + revelar produto sazonal de inverno |
| #51 | Conteúdo | `pos-inauguracao-semana12.md` — 05–11/07: férias escolares, público família |
| #52 | Conversão | Template "Embaixador do Mês" — nomear 1º embaixador se Indica & Ganha ativo |
| #53 | SEO | Ativar `aggregateRating` se desbloqueado; senão: nova landing page `acai-self-service-londrina.html` |
| #54 | Auto-aprimoramento | Reler log ciclos 49–53, ajustar estratégia para agosto (mês 4) |

### Bloqueadores suspensos (sem mudança)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis pelo operador | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |

---

_Belinha — Ciclo #49 | 2026-04-27_
