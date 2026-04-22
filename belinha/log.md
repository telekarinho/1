# Belinha — Log de Ciclos

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
