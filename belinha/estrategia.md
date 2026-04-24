# Belinha — Estratégia de Ciclos

_Atualizado no ciclo #25 (auto-aprimoramento obrigatório a cada 5 ciclos)_

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

## Próximas iniciativas sugeridas (ciclos 26–30)

- **Ciclo #26:** `aggregateRating` stub no Schema.org — preparar para primeiras avaliações Google
- **Ciclo #27:** Page de produto `/potinho-ninho-londrina.html` ou `/cardapio` SEO-first (long tail local)
- **Ciclo #28:** Pesquisa Jhoy/The Best com ação concreta — copiar ângulo de preço/produto que funciona para eles e adaptar no copy do site
- **Ciclo #29:** Revisão de performance Core Web Vitals — LCP, CLS em mobile (especialmente `cardapio.html`)
- **Ciclo #30:** Auto-aprimoramento — reler log completo ciclos 25–29, ajustar rotação

---

_Belinha — Ciclo #25 | 2026-04-24_
