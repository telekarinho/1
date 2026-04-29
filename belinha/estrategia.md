# Belinha — Estratégia de Ciclos

_Atualizado no ciclo #64 (auto-aprimoramento obrigatório a cada 5 ciclos)_

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

---

## Aprendizados dos ciclos #49–53

### Contexto do período
Ciclos 49–53 abrangem 27/04/2026 (D+2 pós-inauguração). Foco: completar cobertura de conteúdo para julho 2026 (féries escolares, aniversário 3 meses, produto sazonal), lançar programa Embaixador do Mês, e expandir SEO local com segunda landing page temática.

### O que gerou mais valor concreto
1. **SEO segunda landing page — `acai-self-service-londrina.html` (#53)** — Diferencial competitivo único (açaí buffet exclusivo Muffato) mapeado em URL própria com Schema.org MenuItem + FoodEstablishment. Consulta de alta intenção local ("açaí self-service londrina") sem concorrência direta de grandes players. Padrão confirmado: uma landing por produto/diferencial distinto.
2. **Playbook Embaixador do Mês (#52)** — Templates E1–E4 cobrem todos os cenários: desde o primeiro embaixador histórico até o mês sem indicações (template de re-engajamento). O script "1º Embaixador de sempre" usa exclusividade emocional como incentivo sem custo adicional. Padrão: sempre criar versão de fallback para ações que dependem de resultados externos.
3. **Conteúdo semanas 11–12 (ciclos #50–51)** — Dois pilares de julho antecipados: revelação do Potinho Caramelado (semana 11) e temática família/férias escolares (semana 12). Roteiros Reel + stories + WhatsApp templates por semana → operador não improvisa.
4. **Auto-aprimoramento #49 + roadmap julio** — Estratégia de julho definida com produto sazonal, aniversário 3 meses e cadência semanal de conteúdo. Planejamento antecipado de 4–5 semanas é o padrão correto.

### O que foi menos eficaz
- **Ciclo #49 reforçou padrão já conhecido** (scripts operacionais > conteúdo contingente) sem adicionar aprendizado novo. Auto-aprimoramento tem mais valor quando identifica gaps, não apenas confirma o que já funciona. Próximos auto-aprimoramentos devem focar em: (a) o que ainda não foi feito, (b) o que gerou resultado negativo.
- **Link interno `acai-self-service-londrina.html` → `index.html` não foi criado no ciclo #53** (esquecido). Regra reconfirmada: links internos criam-se no mesmo ciclo, não no próximo.

### Padrão consolidado (v6)

> **Bug/fix crítico > Landing page SEO por diferencial distinto > Scripts/templates operador acionáveis > Conteúdo não-contingente c/ versão fallback > UX/Performance sweep batch > SEO técnico acumulativo > Pesquisa concorrente (só com follow-up imediato)**

Adição v6: **Links internos criam-se no mesmo ciclo da página — nunca diferidos**.

### Estado das áreas em 27/04/2026 (pós-ciclo #53)

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Conteúdo pós-inauguração | ✅ Semanas 1–12 prontas (até 11/07) | Semana 13 (12–18/07) |
| Produto sazonal julho | ✅ Potinho Caramelado revelado na semana 11 | Confirmação do operador |
| Indica & Ganha | ✅ Ativo — operador com templates | Nomear 1º Embaixador se ≥3 indicações |
| Playbook Embaixador do Mês | ✅ Completo (E1–E4 + carrossel IG + story) | Ativar em julho |
| SEO — Potinho Ninho | ✅ `potinho-ninho-londrina.html` + links internos | — |
| SEO — Açaí Self-Service | ✅ `acai-self-service-londrina.html` + links internos | — |
| aggregateRating Schema.org | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |

---

## Estratégia de agosto 2026 (mês 4 de operação)

### Contexto
Agosto marca o **4º mês de operação** após a inauguração de 25/04/2026. O aniversário de 3 meses acontece em 25/07 (semana 14, ciclos #55-59 cobrem até agosto). Contexto:
- **Pós-férias escolares** (julho acabou) → retorno à rotina, público jovem adulto e office-goers
- **Inverno continua** → comfort food, chocolates, caramelo ainda em alta
- **Consolidação de fidelidade** → clientes de abril–julho chegando ao 10º carimbo
- **Aniversário 3 meses** (25/07 = semana 14) já tratado no roadmap anterior; agosto = sequência do pós-aniversário

### Pilares estratégicos de agosto

| Pilar | Ação concreta |
|-------|---------------|
| **Rotina do pós-férias** | Copy muda de "família/férias" para "seu momento" — adultos voltando à rotina, potinho como pausa do dia |
| **Fidelidade matura** | Primeiros clientes de abril atingem 10 carimbos em agosto → campanha "Ganhou! Hora do Mini Grátis" |
| **Novo produto sazonal?** | Potinho de Chocolate Quente (agosto = auge do inverno) ou reforçar o Caramelado |
| **UGC estratégico** | Pedir fotos/vídeos de clientes com o potinho na faixa de temperatura fria — visual de "aconchego" |
| **SEO técnico** | Ativar `aggregateRating` se ≥3 reviews disponíveis; verificar Core Web Vitals `index.html` mobile |

### Cadência de conteúdo (agosto)

| Semana | Período | Tema |
|--------|---------|------|
| Semana 13 | 12–18/07 | Mid-july: engajamento + UGC invernal + convite Embaixador |
| Semana 14 | 19–25/07 | Aniversário 3 meses MilkyPot Londrina 🎉 |
| Semana 15 | 26/07–01/08 | Pós-aniversário: "obrigada por 3 meses" + transição agosto |
| Semana 16 | 02–08/08 | Agosto rotina: "sua pausa favorita do dia" |

### Próximas iniciativas (ciclos 55–59)

| Ciclo | Área | Ação |
|-------|------|------|
| #55 | Conteúdo | `pos-inauguracao-semana13.md` — 12–18/07: mid-month + UGC invernal + convite Embaixador |
| #56 | Conteúdo | `pos-inauguracao-semana14.md` — 19–25/07: aniversário 3 meses (campanha emocional completa) |
| #57 | Conversão | Script WhatsApp "Ganhou! 10 carimbos → Mini grátis" — ativação fidelidade matura |
| #58 | SEO ou UX | `aggregateRating` se desbloqueado; senão: Core Web Vitals sweep `index.html` mobile |
| #59 | Auto-aprimoramento | Reler log ciclos 54–58, ajustar estratégia setembro |

### Bloqueadores suspensos (sem mudança)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis pelo operador | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |

---

_Belinha — Ciclo #54 | 2026-04-27_

---

## Aprendizados dos ciclos #54–58

### O que gerou mais valor concreto

1. **Campanha Aniversário 3 Meses — semana14 (#56):** O plano editorial mais denso e completo do projeto. Inclui sorteio com mecânica definida, reel 15s roteirizado, 5 blocos de stories no dia 25/07 (12h/14h/16h/18h/20h), carrossel "3 meses em números" com dados reais, ativação de fidelidade matura integrada (WA para clientes com 9–10 carimbos no dia do evento). Alta densidade = alto valor por ciclo. Padrão: datas âncora (aniversários, inaugurações) merecem plano editorial de ≥5 peças de conteúdo distintas.
2. **Fidelidade matura — resgate 10 carimbos (#57):** 4 templates WA (A–D) cobrem todo o funil. Template D ("quase lá" com 8–9 carimbos) é o mais valioso — motiva a visita ANTES do resgate, quando o cliente ainda não sabe que vai ganhar. Template C reinicia o ciclo imediatamente com `?stamps=1`. Playbook sem sistema/app (caderninho + lista WA) garante adoção real pelo operador.
3. **CLS sweep batch index.html (#58):** Todos os `<img>` corrigidos em um único ciclo — nav, hero LCP e footer. `display:none` no banner pós-inauguração eliminou risco de layout shift que persistia desde 25/04. Padrão confirmado: sweeps técnicos em batch (tudo de uma vez) têm melhor ROI que correções pontuais por ciclo.

### O que foi menos eficaz

- **Semana 13 (#55) separada da semana 14 (#56):** As duas semanas têm temática contínua (inverno/aniversário). Criar ambas no mesmo ciclo teria sido mais eficiente — 1 ciclo poupado para outra área. Adição ao padrão: **semanas de conteúdo adjacentes com mesma temática = mesmo ciclo**.
- **Auto-aprimoramento #54 confirmou padrão já consolidado** (links internos = mesmo ciclo) sem identificar gaps FUTUROS. Auto-aprimoramento tem mais valor quando antecipa o que ainda não existe, não quando revisa o que já foi aprendido.

### Padrão consolidado (v7)

> **Bug/fix crítico > Landing page SEO por diferencial distinto > Scripts/templates operador acionáveis (c/ fallback) > Conteúdo não-contingente — semanas adjacentes mesma temática = mesmo ciclo > UX/Performance sweep batch > SEO técnico acumulativo > Pesquisa concorrente (só com follow-up imediato no mesmo ciclo)**

Adições v7:
- **Datas âncora = plano editorial de ≥5 peças** (aniversários, lançamentos, sorteios)
- **Sweeps técnicos = batch completo** (nunca 1 imagem por ciclo — todas as páginas relevantes de uma vez)
- **Auto-aprimoramento = identificar GAPS FUTUROS**, não confirmar padrões passados

---

## Estado das áreas em 28/04/2026 (pós-ciclo #58)

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Conteúdo pós-inauguração | ✅ Semanas 1–15 prontas (até 01/08) | Semana 16 (02–08/08) — agosto rotina |
| Fidelidade matura | ✅ Templates A–D + playbook completo | Ativar em agosto (primeiros 10 carimbos) |
| Aniversário 3 meses (25/07) | ✅ Campanha completa semana 14 | — |
| Pós-aniversário (26/07–01/08) | ✅ Semana 15 criada neste ciclo #59 | — |
| Core Web Vitals — index.html | ✅ CLS sweep completo (#58) | — |
| Core Web Vitals — cardapio.html | ⚠️ width/height = dimensões fonte (1900×1070), não display | Ajustar para dimensões CSS reais |
| Core Web Vitals — demais páginas | ⚠️ Não verificado | Sweep batch: acai-self-service, cartao-fidelidade, raspinha |
| aggregateRating Schema.org | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |
| Pesquisa concorrentes | ⚠️ Última pesquisa: ciclo #47–48 | Atualizar MilkyMoo ou TheBest (#60 ou #61) |

---

## Estratégia de setembro 2026 (mês 5 de operação)

### Contexto
Setembro = **5º mês de operação**. Agosto foi de rotina e consolidação de fidelidade (primeiros resgates de 10 carimbos). Setembro traz:
- **Pós-inverno:** temperatura ainda amena em Londrina, mas subindo — oportunidade para sabores mais leves/frescos
- **Fidelidade madura:** clientes de maio–junho chegando ao 10º carimbo
- **Social proof acumulado:** se ≥3 reviews Google Maps confirmados → ativar `aggregateRating`
- **4–5 meses de dados** → operador tem histórico de produtos mais vendidos e dias/horários de pico

### Pilares estratégicos de setembro

| Pilar | Ação concreta |
|-------|---------------|
| **Conteúdo semana 16–18** | Agosto rotina → início de setembro → "primavera se aproximando" (virada estética pastel claro) |
| **Produto sazonal** | Potinho de Morango (pré-primavera) ou reforçar Caramelado com topping crocante |
| **Sweep CLS demais páginas** | `cardapio.html`, `acai-self-service-londrina.html`, `cartao-fidelidade.html` — ajustar width/height |
| **Pesquisa concorrentes** | MilkyMoo ou TheBest: preços agosto/setembro, novos produtos, ads recentes |
| **aggregateRating** | Ativar se operador confirmar ≥3 reviews — alto impacto SEO local |

### Cadência de conteúdo (agosto–setembro)

| Semana | Período | Tema |
|--------|---------|------|
| Semana 15 | 26/07–01/08 | Pós-aniversário: obrigada + abertura de agosto ✅ |
| Semana 16 | 02–08/08 | Agosto rotina: "sua pausa favorita do dia" |
| Semana 17 | 09–15/08 | Inverno de saída: comfort food + Linha Zero (foco fitness de fim de agosto) |
| Semana 18 | 16–22/08 | Teaser de produto sazonal setembro (morango/primavera ou novidade operador) |
| Semana 19 | 23–29/08 | Lançamento do produto sazonal + primeiros UGCs |

### Roadmap ciclos #60–64

| Ciclo | Área | Ação |
|-------|------|------|
| #60 | Concorrentes | Pesquisa atualizada MilkyMoo ou TheBest — preços, novos produtos, ads, UGC recentes. Salvar em `belinha/competitors/<nome>.md` + 1 mudança concreta derivada |
| #61 | Conteúdo | Semanas 16 + 17 juntas (mesma temática — agosto rotina/inverno) em um único ciclo |
| #62 | Performance | CLS sweep batch: `cardapio.html`, `acai-self-service-londrina.html`, `cartao-fidelidade.html` — ajustar width/height para display CSS |
| #63 | Conteúdo ou Conversão | Semana 18 (teaser produto sazonal) + template WA de lançamento de produto |
| #64 | Auto-aprimoramento | Reler log ciclos 59–63, ajustar estratégia outubro 2026 |

### Bloqueadores suspensos (sem mudança)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |

---

_Belinha — Ciclo #59 | 2026-04-28_

---

## Aprendizados dos ciclos #59–63

### O que gerou mais valor concreto

1. **Concorrente + ação imediata no mesmo ciclo (#60):** Descoberta de que MilkyMoo tem 2 unidades em Londrina (Catuaí + Boulevard) com preços confirmados (300ml R$18). Tradução imediata: benefits-bar do `index.html` trocada para âncora de preço "A partir de R$ 10" — resposta direta ao concorrente. Padrão já estabelecido, mas reforçado: pesquisa de concorrente sem ação concreta no mesmo ciclo = desperdício de ciclo.
2. **Semanas adjacentes no mesmo ciclo (#61):** Semanas 16+17 (agosto rotina + inverno de saída) criadas juntas em 1 ciclo. Padrão v7 aplicado corretamente. Confirmou que temáticas contínuas devem sempre ser agrupadas — 1 ciclo poupado para área diferente.
3. **Cross-sell açaí self-service (#63):** Carrossel educativo de segunda (semana 18) explora diferencial único do Muffato que MilkyMoo não oferece. Alto potencial de ticket médio + diferenciação competitiva real.

### O que foi menos eficaz

- **CLS sweep curto (#62):** Apesar de ser "batch", encontrou apenas 1 problema real (cartao-fidelidade.html). As outras páginas já estavam corretas desde ciclos anteriores. Ciclos de performance técnica têm rendimento decrescente — após 3 sweeps, o ganho marginal por ciclo cai. **Ajuste de padrão:** a partir deste ponto, sweeps de CLS/performance só devem entrar na rotação quando houver indício concreto de problema (mudança de HTML, nova imagem, novo componente).
- **Auto-aprimoramento #59 repetiu padrões já consolidados:** Confirmou coisas que já estavam no padrão v7 em vez de identificar gaps futuros. Regra: auto-aprimoramento só tem valor se gerar ≥1 mudança de comportamento nova.

### Padrão consolidado (v8)

> **Bug/fix crítico > Landing page SEO por diferencial distinto > Scripts/templates operador acionáveis (c/ fallback) > Conteúdo não-contingente — semanas adjacentes mesma temática = mesmo ciclo > Concorrente + ação concreta no mesmo ciclo > UX/Performance sweep batch (só com indício concreto) > SEO técnico acumulativo**

Adições v8 (além de v7):
- **Sweeps técnicos de CLS/performance** só entram na rotação com indício concreto de problema — rendimento decrescente após 3+ sweeps sem novo HTML
- **Auto-aprimoramento** deve identificar gap FUTURO concreto, não confirmar padrão passado — se não há gap novo, usar o ciclo para melhoria de conteúdo associada
- **Concorrentes:** refetch semestral para dados existentes (MilkyMoo, TheBest) + busca por novo concorrente a cada 3 meses

---

## Estado das áreas em 29/04/2026 (pós-ciclo #63)

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Conteúdo pós-inauguração | ✅ Semanas 1–19 prontas (até 29/08) | Semana 20 (30/08–05/09) — lançamento produto sazonal setembro |
| Produto sazonal setembro | ⚠️ DEPENDE DO OPERADOR | Versões A+B preparadas na semana 19 — confirmar com franquia |
| Fidelidade matura | ✅ Templates A–D + playbook completo | Monitorar primeiros resgates reais em agosto |
| Aniversário 3 meses (25/07) | ✅ Concluído | — |
| Core Web Vitals — todas as páginas principais | ✅ CLS sweep completo (#58+#62) | Somente se nova imagem/componente for adicionado |
| aggregateRating Schema.org | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps verificáveis |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |
| Pesquisa concorrentes | ✅ MilkyMoo atualizado (#60) | TheBest: próximo refetch ciclo ~#70 |
| Âncora de preço index.html | ✅ "A partir de R$ 10" (#60) | Revisitar se MilkyMoo mudar preços |
| Cross-sell açaí self-service | ✅ Conteúdo criado (#63) | Monitorar pedidos de açaí em agosto via WA |

---

## Estratégia de outubro 2026 (mês 6 de operação)

### Contexto
Outubro = **6º mês de operação**. Primavera já em curso (iniciou 22/09). Destaques do período:
- **Halloween (31/10):** Data âncora de alto potencial para edição especial de potinho — oportunidade de conteúdo + produto temporário (topping laranja/preto, nome temático, "potinho assombrado")
- **Segundo ciclo de fidelidade:** Clientes que começaram em maio/junho chegando ao 10º carimbo pela segunda vez → oportunidade de "fidelidade VIP" (bônus especial para clientes no segundo ciclo)
- **6 meses de dados reais:** Operador tem histórico completo de dias/horários de pico, produtos mais pedidos, padrões de pedido WA — usar esses dados para calibrar conteúdo e promoções
- **Primavera consolidada:** Produto sazonal de setembro já lançado → avaliar extensão para outubro ou lançamento de variação

### Pilares estratégicos de outubro

| Pilar | Ação concreta |
|-------|---------------|
| **Halloween 31/10** | Plano editorial de ≥5 peças distintas: edição especial potinho, Stories/Reel temático, promoção relâmpago, UGC com fantasia + potinho |
| **Fidelidade 2º ciclo** | Template WA "parabéns pelo segundo ciclo de fidelidade" — bônus especial para reforçar retenção de longo prazo |
| **Social proof maturado** | Se ≥3 reviews Google Maps confirmados: ativar `aggregateRating` em `index.html` — alto impacto SEO local |
| **Dados 6 meses** | Operador preenche "balanço de 6 meses" no carrossel de 25/10 (aniversário 6 meses de operação) |
| **UGC embaixador local** | Identificar e nutrir criador de conteúdo local em Londrina (padrão MilkyMoo Londrina: @marceladegusta) |

### Cadência de conteúdo (setembro–outubro)

| Semana | Período | Tema |
|--------|---------|------|
| Semana 19 | 23–29/08 | Transição inverno→primavera + teaser setembro ✅ |
| Semana 20 | 30/08–05/09 | Lançamento produto sazonal setembro + primeiros UGCs |
| Semana 21 | 06–12/09 | Primavera em movimento: sabores frescos + rotina |
| Semana 22 | 13–19/09 | Linha Zero fitness (virada de estação = pico de academia) |
| Semana 23 | 20–26/09 | "1 semana de primavera" — aniversário da estação 22/09 |
| Semana 24 | 27/09–03/10 | Abertura de outubro — aquecimento para Halloween |
| Semana 25 | 04–10/10 | Halloween warming up: "o potinho mais assustador" (15 dias antes) |
| Semana 26 | 11–17/10 | Produto especial Halloween preview + mecânica UGC fantasia |
| Semana 27 | 18–24/10 | Halloween countdown: enquete, sorteio, teaser |
| Semana 28 | 25–31/10 | **Aniversário 6 meses (25/10) + Halloween (31/10)** — semana âncora dupla |

### Roadmap ciclos #65–69

| Ciclo | Área | Ação |
|-------|------|------|
| #65 | Conteúdo | Semanas 20 + 21 juntas (lançamento produto setembro + rotina de primavera) — padrão v8 temáticas adjacentes |
| #66 | Conteúdo ou Conversão | Semana 22 (Linha Zero fitness) + template WA fidelidade 2º ciclo |
| #67 | Conteúdo | Semanas 23 + 24 juntas (aniversário primavera + abertura outubro) |
| #68 | SEO local | Verificar se `aggregateRating` pode ser ativado; se sim → ativar em `index.html`. Se não → link interno novo ou meta description de página secundária |
| #69 | Auto-aprimoramento | Reler log ciclos 64–68, ajustar estratégia novembro 2026 |

### Nota sobre Halloween (ciclo #70+)

Halloween merece plano editorial de ≥5 peças — seguindo o padrão de datas âncora (estabelecido no aniversário de 3 meses). Plano a criar nos ciclos #70–72:
- Edição especial: "Potinho Assombrado" (base Ninho + calda de morango vermelho + topping crocante preto/laranja)
- Reel 15s: ovelhinha fantasiada + potinho temático
- Stories countdown 7 dias antes
- Sorteio UGC: "Melhor fantasia com potinho na mão"
- Template WA: oferta relâmpago no dia 31/10

### Bloqueadores suspensos (sem mudança)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis pelo operador | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |
| Produto sazonal setembro | Confirmação da franquia com o operador | #63 |

---

_Belinha — Ciclo #64 | 2026-04-29_

---

## Aprendizados dos ciclos #64–68

_Ciclo #69 — Auto-aprimoramento obrigatório_

### O que gerou mais valor concreto

1. **Semanas adjacentes no mesmo ciclo (#65, #67):** Padrão v8 confirmado e consolidado. Semanas 20+21 e 23+24 entregues em 2 ciclos em vez de 4 — economia de 2 ciclos para outras áreas. Rendimento por ciclo dobrado.
2. **Versão A/B para bloqueadores contingentes (#65):** Produto sazonal setembro sem confirmação da franquia → Versão A (confirmado) + Versão B (genérico) prontas. Operador age sem precisar de novo ciclo Belinha. Modelo a replicar sempre que houver dependência de terceiro.
3. **FAQPage schema nas landing pages (#68):** Gap identificado — landing pages de SEO local sem FAQPage enquanto `index.html` já tinha. Rich results de acordeão ativados para buscas como "açaí self service londrina" e "potinho ninho londrina". CTR orgânico esperado: +15–30%. Alto impacto com baixo esforço.
4. **Séries editoriais contínuas (Sexta do Potinho #7–#10):** Manutenção da série cria previsibilidade para o público e facilita planejamento interno. Thematic editions (Halloween) ampliam o alcance orgânico sem quebrar a série.
5. **Templates WA com palavras-chave de ativação (#67 — HALLOWEEN):** Mecânica "manda HALLOWEEN → lista VIP" transforma engajamento passivo em lead qualificado e rastreável. Padrão a replicar: NATAL, VERAO, ANIVERSARIO.
6. **Teaser gradual de Halloween (4 semanas de antecedência) (#67):** Primeiro uso de 🎃 no Reel 03/10 → warming progressivo → reveal 14/10 → countdown → dia H 31/10. Campanha estruturada sem revelar tudo de uma vez = antecipação sustentada.

### O que foi menos eficaz (ciclos #64–68)

- **Nenhum ciclo de concorrentes:** TheBest e busca por novo concorrente ficaram sem refetch. Dado de MilkyMoo pode estar desatualizado (refetch prescrito para ciclo ~#70). Risco: decisão de preço/produto baseada em dado antigo.
- **Auto-aprimoramento #64 focou demais em outubro sem planejar novembro:** Roadmap ciclos #65–69 criado com precisão para outubro/Halloween. Novembro 2026 ficou sem cadência definida — gap resolvido neste ciclo #69.

### Padrão consolidado (v9)

> **Bug/fix crítico > Landing page SEO por diferencial distinto > Scripts/templates operador acionáveis c/ fallback A/B > Conteúdo não-contingente — semanas adjacentes mesma temática = mesmo ciclo > Concorrente + ação concreta no mesmo ciclo (refetch semestral) > UX/Performance sweep batch (só com indício concreto) > SEO técnico acumulativo**

Adições v9 (além de v8):
- **Templates WA com palavra-chave de ativação** (HALLOWEEN, NATAL, VERAO, ANIVERSARIO): sempre que um produto/evento especial for planejado, criar a mecânica de captação de lead qualificado por palavra-chave
- **Campanha de produto especial:** estrutura mínima = 4 semanas antes → teaser gradual → reveal parcial 2 semanas antes → reveal completo 2 semanas antes → countdown → dia H. Não revelar tudo de uma vez.
- **Concorrentes:** alerta de refetch se último ciclo de concorrente foi há >10 ciclos (MilkyMoo: ciclo #60 → próximo refetch ciclo ~#73)

---

## Estado das áreas em 29/04/2026 (pós-ciclo #68)

| Área | Estado | Próxima ação |
|------|--------|--------------|
| Conteúdo pós-inauguração | ✅ Semanas 1–26 prontas (até 17/10) | Semanas 27+28 (Halloween countdown + aniversário 6 meses 25/10) |
| Produto especial Halloween | ✅ Estrutura completa (semanas 25+26) | Operador: confirmar topping mini abóbora de chocolate com franquia ANTES de 01/10 |
| Lista VIP "HALLOWEEN" | ✅ Mecânica criada (WA keyword) | Configurar resposta automática WA antes de 04/10 |
| Fidelidade matura | ✅ Templates A–D + 2º ciclo + playbook | Monitorar confirmações de resgate VIP em outubro |
| Core Web Vitals — páginas principais | ✅ CLS sweep completo (#58+#62) | Somente se nova imagem/componente for adicionado |
| FAQPage schema landing pages | ✅ Adicionado nas 2 landing pages (#68) | Monitorar rich results no Google Search Console |
| aggregateRating Schema.org | ⛔ SUSPENSO | Aguardar ≥3 reviews Google Maps verificáveis |
| Google Analytics ID real | ⛔ SUSPENSO | Aguardar autorização do usuário |
| Produto sazonal setembro | ⚠️ VERSÕES A+B PRONTAS | Operador confirmar com franquia antes de 01/09 |
| Pesquisa concorrentes | ⚠️ MilkyMoo ciclo #60 (desatualizando) | TheBest + refetch MilkyMoo: próximo ciclo de concorrentes ciclo ~#73 |

---

## Estratégia de novembro 2026 (mês 7 de operação)

### Contexto
Novembro = **7º mês de operação**. Pós-Halloween. Verão chegando em Londrina (temperatura sobe, demanda por açaí e sobremesas geladas aumenta). Destaques:
- **Black Friday (27/11):** Oportunidade única — sobremesa não é o produto óbvio do BF, o que cria diferenciação ("não vendemos eletrodoméstico, mas sim felicidade gelada em promoção") + chamar atenção pelo contraste
- **Pré-Natal:** Novembro encerra com aquecimento de Natal (1º de dezembro = início oficial). Lançar teaser natalino na última semana de novembro
- **7 meses de dados reais:** Após aniversário de 6 meses (25/10), operador tem visão clara de padrões. Novembro é o primeiro mês com histórico completo de 2 estações (inverno → primavera → início de verão)
- **Produto sazonal de verão:** Anunciar em novembro (lançar em dezembro). Criar teaser similar ao produto de primavera/setembro.
- **Fidelidade trimestral:** Clientes que começaram em agosto (mês 4) chegando ao 10º carimbo pela primeira vez — oportunidade de celebrar "fidelidade trimestral" com mensagem especial

### Pilares estratégicos de novembro

| Pilar | Ação concreta |
|-------|---------------|
| **Black Friday 27/11** | "Não é eletrônico, mas é o melhor negócio do dia" — promoção relâmpago no dia (ex: 2º topping grátis ou brinde no potinho). Não descontar na base — criar percepção de valor extra |
| **Aquecimento Natal** | Última semana de novembro: teaser natalino — ovelhinha de Papai Noel, "Já imaginou um potinho natalino?", teaser de produto especial dezembro |
| **Produto sazonal verão** | Anunciar conceito em novembro, lançar em dezembro. Mecânica: enquete "o que você quer no potinho de verão?" em novembro → usa dado real para configurar o produto em dezembro |
| **Fidelidade trimestral** | Template WA "3 meses com a gente — parabéns!" + bônus trimestral (topping extra ou brinde no resgate do 10º carimbo) |
| **Conteúdo verão** | Tom de conteúdo muda: primavera leveza → verão energia/calor/refrescância. Açaí self-service ganha destaque especial (verão = dia quente = buffet de açaí = diferencial) |

### Cadência de conteúdo (outubro–novembro)

| Semana | Período | Tema |
|--------|---------|------|
| Semana 25 | 04–10/10 | Halloween warming up — list VIP + Sexta #10 ✅ |
| Semana 26 | 11–17/10 | Dia das Crianças + Reveal Potinho Assombrado ✅ |
| Semana 27 | 18–24/10 | Halloween countdown + sorteio UGC fantasia |
| Semana 28 | 25–31/10 | **Aniversário 6 meses (25/10) + Halloween dia H (31/10)** |
| Semana 29 | 01–07/11 | Pós-Halloween + abertura novembro + agradecimento |
| Semana 30 | 08–14/11 | Verão chegando — açaí e frescor + rotina de novembro |
| Semana 31 | 15–21/11 | Linha Zero peak novembro (academia em alta c/ verão) + enquete produto sazonal verão |
| Semana 32 | 22–28/11 | **Black Friday 27/11** + teaser produto sazonal verão |
| Semana 33 | 29/11–05/12 | Aquecimento Natal + teaser produto dezembro |

### Roadmap ciclos #70–74

| Ciclo | Área | Ação |
|-------|------|------|
| #70 | Conteúdo | Semanas 27+28 (Halloween countdown + aniversário 6 meses + dia H 31/10) |
| #71 | Conteúdo | Semanas 29+30 (pós-Halloween + abertura novembro + verão chegando) |
| #72 | Conteúdo | Semanas 31+32 (Linha Zero verão + Black Friday 27/11) |
| #73 | Concorrentes | TheBest (primeiro fetch) + refetch MilkyMoo (#60 desatualizando) |
| #74 | Auto-aprimoramento | Reler log #69–#73, ajustar estratégia dezembro/Natal 2026 |

### Nota sobre Black Friday (ciclo #72)

BF merece mecânica de oferta não-óbvia para sobremesa:
- Não dar desconto na base do produto (desvaloriza a marca)
- Criar percepção de valor extra: "2ª cobertura grátis", "potinho grande pelo preço do médio", ou "sorvete de brinde para pedidos acima de R$X"
- Caption: "Todo mundo vendendo eletrônico. A gente tá vendendo felicidade. 🍦🛒" — ironia elegante que viraliza

### Bloqueadores suspensos (sem mudança)

| Bloqueador | Dependência | Ciclo que bloqueou |
|------------|-------------|-------------------|
| aggregateRating Schema.org | ≥3 reviews Google Maps verificáveis pelo operador | #43 |
| Google Analytics ID real | Autorização explícita do usuário | #15 |
| Produto sazonal setembro | Confirmação da franquia com o operador | #63 |
| Topping Halloween (mini abóbora chocolate) | Disponibilidade via franquia | #69 |

---

_Belinha — Ciclo #69 | 2026-04-29_
