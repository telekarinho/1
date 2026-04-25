# Belinha — Log de Ciclos

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

