# Auditoria Total — MilkyPot

**Data:** 2026-05-10
**Branch auditada:** `claude/fervent-jang-a9aaf0` (worktree)
**Agentes:** Security Engineer, Code Reviewer, SEO Specialist, UX Researcher, Growth Hacker, Software Architect
**Skills consultadas:** auditoria-total, agent-code-analyzer, agent-security-architect, marketing-seo-specialist, design-ux-architect, marketing-growth-hacker, engineering-backend-architect

---

## 🎯 Score Geral: **47/100**

| Área | Score | Peso | Contribuição |
|---|---:|---:|---:|
| Segurança | 28 | 30% | 8.4 |
| Arquitetura | 38 | 20% | 7.6 |
| Código | 54 | 15% | 8.1 |
| UX/UI | 68 | 15% | 10.2 |
| Growth/Conversão | 68 | 10% | 6.8 |
| SEO | 58 | 10% | 5.8 |
| **TOTAL** | | | **47/100** |

---

## Resumo Executivo

O MilkyPot é um sistema **funcional e operacionalmente engenhoso** (offline-first PDV, multi-PWA, agente AI 24/7, programmatic SEO local) mas com **lacunas materiais antes de tocar dinheiro real**: regras Firestore com writes públicos em pedidos/caixa/cashback/vouchers (vetor de fraude em D0), PIN de desconto default `1234` no PDV, zero testes automatizados num sistema que fecha caixa, triplo hosting (Vercel + Firebase Hosting + GitHub Pages) servindo o mesmo código com SW desatualizado nesta worktree (`mp-v101` vs `mp-v186+` em main). Há ainda **confusão temporal séria**: hoje é 2026-05-10 mas o plano viral aponta inauguração 25/04/2026 — ou a data foi adiada (não documentada) ou já passou (e o MEMORY está stale). Resolver isso é prioridade zero. No lado positivo: SEO técnico tem bons fundamentos, UX do operador foi pensado (banner full-width, FAB), plano viral existe e é detalhado, plano de tiers e cashback está implementado.

---

## 🚨 Top 10 Problemas Críticos (resolver AGORA)

| # | Problema | Área | Impacto | Arquivo |
|---|---|---|---|---|
| 1 | **Data da inauguração inconsistente** — hoje 10/05/2026, plano diz 25/04/2026 (passado). Countdown não comunica nada. | Growth | Bloqueia toda comunicação | `docs/plano-viral-milkyclube.md`, `cronometro-milkypot.html`, `index.html` |
| 2 | **Firestore: `scratches`, `desafio_vouchers`, `desafio_streaks` com `allow read,write: if true`** — qualquer cliente forja prêmios via DevTools | Segurança P0 | Prejuízo financeiro direto | `firestore.rules:207-263` |
| 3 | **`orders_*`, `caixa_*`, `finances_*` com write público** — manipula DRE, apaga histórico fiscal | Segurança P0 + LGPD | Quebra contabilidade + bill spike | `firestore.rules:79-107` |
| 4 | **PIN de desconto default `1234` em plain text no client** — atendente abre F12 e aplica 100% off | Segurança P0 | Fraude interna garantida | `painel/pdv.html:2746` |
| 5 | **Webhook Uber Direct sem assinatura HMAC** — qualquer um marca pedido como entregue | Segurança P0 | Fraude operacional | `functions/uber-direct.js:976-1013` |
| 6 | **SW worktree-stale (`mp-v101` vs `mp-v186+`)** — deploy desta branch regride 85 versões de cache, PWAs travam | Arquitetura P0 | Operação quebra no D0 | `sw.js:1-2` |
| 7 | **Race condition em `onOrderCreated`** — em loja c/ 2 PDVs, pedido processado 2x ou 0x | Código P0 | Duplica cashback / perde push | `functions/index.js:125` |
| 8 | **CPF cleartext em writes públicos** — risco LGPD R$50M ou 2% faturamento | Compliance | Multa material | `firestore.rules:79-107`, `js/core/loyalty.js` |
| 9 | **Zero testes automatizados num sistema que processa dinheiro** | Código P0 | Bug em `closeShift` descoberto pelo franqueado em produção | `package.json` (sem scripts.test) |
| 10 | **NAP inconsistente entre `index.html` (`+55-43-99804-2424`) e Londrina (`(43) 99999-9999` placeholder)** | SEO P0 | Local Pack não rankeia | `londrina/index.html:30`, `londrina/centro/index.html:34` + 38 ruas |

---

## ⚡ Top 10 Quick Wins (≤4h cada, alto impacto)

| # | Melhoria | Área | Impacto | Esforço |
|---|---|---|---|---|
| 1 | Sincronizar worktree com `main` (bump SW pra v187+) antes de qualquer deploy | Arquitetura | Não regride 85 versões | 5min |
| 2 | Criar `robots.txt` + `sitemap.xml` na raiz | SEO | Indexação completa | 30min |
| 3 | Countdown gigante embed no `index.html` e `londrina/index.html` puxando data oficial de `cronometro-milkypot.html` | Growth | Comunica urgência | 1h |
| 4 | Trocar emojis 🍨 por fotos reais no `cardapio.html:182-186` (Stories Carousel está `display:none`) | UX | +30% engajamento 1s | 2h |
| 5 | Remover PIN default `1234` + bloquear deploy se não houver PIN configurado | Segurança | Fecha fraude interna | 1h |
| 6 | Sticky FAB WhatsApp `(43) 99804-2424` flutuante em todas páginas cliente | Growth | Conversão >> cardápio online | 30min |
| 7 | Adicionar `crypto.randomInt` em `api/admin-reset-password.js:64-72` (substituir `Math.random()`) | Segurança | Senhas previsíveis → criptográficas | 5min |
| 8 | Allow-list explícita no `cors.json` (remover `*`) | Segurança | Bloqueia CSRF | 15min |
| 9 | OG image dedicada `og-londrina.jpg` (1200x630, mascote + countdown + "G$20 grátis") | Growth + SEO | Share IG/WhatsApp viraliza | 2h |
| 10 | Sentry free tier substituindo `error-tracking.js` caseiro | Ops | Alerta Slack em erro novo | 1h |

---

## 📈 Top 10 Melhorias de Médio Prazo

| # | Melhoria | Área | Impacto | Esforço |
|---|---|---|---|---|
| 1 | Migrar `datastore/orders_{fid}` → subcoleção `franchises/{fid}/orders/{orderId}` | Arquitetura | Escala até 100+ franquias | 3-5 dias |
| 2 | Centralizar `Utils.todayLocal()` + `Money` (centavos inteiros) — corrige bug timezone em 20+ arquivos | Código | Zera erro de cálculo financeiro | 1 dia |
| 3 | Quebrar `painel/pdv.html` (5554 linhas) em módulos `pdv-cart`, `pdv-payment`, `pdv-tabs`, `pdv-loyalty` | Código | Habilita testes; onboard novo dev 1 sem → 2 dias | 3-5 dias |
| 4 | Mover PIN/voucher/scratch redemption pra Cloud Functions com App Check + lockout | Segurança | Fecha 5 P0s de uma vez | 2 dias |
| 5 | Schema `Menu` + `MenuItem` em `cardapio.html` com fotos/preços/calorias | SEO/AEO | Rich snippets + citações ChatGPT/Perplexity | 1 dia |
| 6 | Blog `/blog/` com 8 posts pillar/cluster ("açaí buffet Londrina", "potinho aniversário", etc.) | SEO | Autoridade tópica + tráfego orgânico | 1 semana |
| 7 | Suite Vitest cobrindo `caixa.js` + `loyalty.js` + `pdv` cart math (20 testes) | Código | Risco operacional sai do vermelho | 2 dias |
| 8 | Mascote ovelhinha (nome "Mily"?): 5 ilustrações PNG + aplicar em hero/empty-states/clube/desafio | UX/Brand | Identidade memorável + shareable | 2 dias (ilust.) |
| 9 | TikTok Pixel + Meta Pixel + UTM em todas landings | Growth | Paid não voa cego | 1 dia |
| 10 | Programmatic SEO 2.0: `/sabores/`, `/eventos/aniversario-londrina/`, `/comparativo/acai-vs-sorvete/` | SEO | Captura intent comercial fundo de funil | 1 semana |

---

## Detalhamento por Área

### 🔒 Segurança (Score: 28/100)

**Estado:** vermelho. Sistema processa dinheiro/PII com regras Firestore que admitem "segurança por obscuridade" — não funciona contra atacante com 30s no DevTools.

**P0 críticos:**
- `firestore.rules:207-215` — `desafio_vouchers` aceita `create: if isAuthenticated()` (anônimo serve) e `update: if true`. Cliente raspa, ganha, usa, depois reseta `used:false` e usa de novo.
- `firestore.rules:253-263` — `scratches/{scratchCode}` write público. Atacante forja `prize:'RSP_50_OFF', status:'pending'` e apresenta no PDV.
- `firestore.rules:79-107` — `orders_*`, `caixa_*`, `finances_*` aceitam write sem auth. Justificativa de "obscurity by franchiseId" é falsa (o doc `datastore/franchises` lista todos os IDs publicamente).
- `painel/pdv.html:2746` — PIN default `1234`, plain text no client, sem hash/bcrypt/lockout/rate-limit.
- `functions/uber-direct.js:976-1013` — webhook sem verificação HMAC.
- `firestore.rules:188-189` — usuário autenticado escreve `audit_log` em seu próprio nome (forense fica mentirosa).

**P1 altos:**
- `extensions/ifood-connector/background.js:16` — Firebase Web API key embutida; auth anônima vira escrita em qualquer doc.
- `functions/index.js:506-521` — `getFiscalConfig` retorna CSC token NFC-e e API keys em texto claro.
- `api/belinha-tunnel.js:100-103` — secret opcional, sem env quem registra é qualquer um do mundo.
- `api/copilot.js:189-225` — sem auth, sem rate-limit, sem sanitização de prompt injection, aceita key Anthropic do body (proxy de lavagem).
- `storage.rules:16-21` — qualquer franqueado escreve em `tv-media/<qualquerFranchiseId>/` até 500MB.

**LGPD:** CPF persiste em cleartext em writes públicos. Risco material de multa.

**Top 5 ações pré-25/04:**
1. Fechar writes públicos de scratches/vouchers/streaks → CF com App Check.
2. Remover PIN default `1234` + validar via CF com bcrypt + lockout.
3. Verificar `git ls-files | grep serviceAccountKey` — se commitado, rotacionar service account.
4. Assinar webhook Uber + exigir `BELINHA_TUNNEL_SECRET` + auth/rate-limit no copilot.
5. CPF nunca cleartext no Firestore — hash com pepper; cleartext só dentro de CF fiscal.

---

### 💻 Código (Score: 54/100)

**Estado:** funcional com arquitetura defensiva pensada (merge multi-PC, offline grace, audit log), mas zero testes, god files, timezone bug em 20+ arquivos.

**Críticos:**
- `functions/index.js:125` — `latestOrder = orders[orders.length - 1]` em trigger paralelo = pedido processado 2x ou 0x.
- `sw.js:1-2` — `mp-v101` (stale; main em v186+).
- Timezone bug em `admin/audit.html:388,588`, `painel/despesas.html:1395/1788/1865/1870`, `painel/financeiro.html:504-587`, `js/core/adminconfig.js:298,312`. `toISOString().slice(0,10)` puro quebra após 21h locais.
- `painel/pdv.html:2665,2677` — float arithmetic em dinheiro. Já existe `cartTotalCents()` em 5376; não é usado consistentemente.
- `painel/pdv.html:2419` — state global (`var cart=[]`, 76 atribuições `window.*`, 645 declarações no único arquivo).

**Altos:**
- `js/core/loyalty.js:55,76-79` — não-atômico (get→mutate→set sem transação) → cashback perdido/duplicado em pedidos concorrentes.
- 21 `catch(e){}` vazios no PDV, 69 em `js/core/` — esconde bug real.
- `js/core/caixa.js` (1203 linhas) — god file mistura domain + UI inline.
- `js/core/auth.js:419-426` — quick login token sem HMAC, sem revogação no logout.
- `painel/pdv.html` — 24 `addEventListener` / 0 `removeEventListener` / 23 timers (memory leak em quiosque 12h+/dia).

**Anti-patterns recorrentes:**
- `catch(e){}` silencioso (90+ ocorrências).
- HTML inline em strings JS sem escape consistente (risco XSS).
- Hardcoded emails de gerente em `cloud-functions.js:226,242`.
- `admin/lancamento.htm` (sem `l`) órfão ao lado de `lancamento.html`.

**Manutenibilidade: 4/10.** Dev novo leva ~1 semana só pra mapear PDV → DataStore → Firestore → Functions.

**Refactors com maior ROI:**
1. `Utils.todayLocal()` + `Money` (centavos) — 1 dia resolve 30 arquivos.
2. Quebrar `pdv.html` em módulos — 3-5 dias habilita testes.
3. 20 testes Vitest pra `caixa.js` + `loyalty.js` — 2 dias tira risco financeiro do vermelho.

---

### 🔍 SEO (Score: 58/100)

**Estado:** fundamentos OK (lang pt-BR, canonical, GA4+Clarity, Schema decente em Londrina), mas **3 bloqueadores** que impedem indexação plena.

**Quebra:** Técnico 55 / On-page 65 / Schema 70 / Local 50 / Conteúdo 45 / Autoridade 40.

**Críticos:**
1. `robots.txt` ausente.
2. `sitemap.xml` ausente.
3. NAP inconsistente: `index.html:80` (`+55-43-99804-2424`) ≠ `londrina/*/index.html` (`(43) 99999-9999` placeholder).
4. `f/_template/index.html` indexável (duplicate content risk).
5. `lp/index.html:6-10` sem canonical/OG/Schema.

**Programmatic SEO de `londrina/ruas/`:**
- Pontos fortes: Schema LocalBusiness + FAQPage + Breadcrumb, canonical correto, internal linking.
- Riscos: ~40 palavras únicas por página (resto boilerplate); FAQ idêntica template; telefone fake propagado. **Helpful Content Update derruba isso.**
- Salvação: 150-250 palavras únicas por rua + 3-5 templates FAQ rotativos + Google Maps iframe + variar âncoras de internal linking.

**Estratégia local Londrina — keywords prioritárias:**
- "potinho de sorvete Londrina", "açaí buffet Londrina", "monte seu açaí Londrina"
- "sorveteria self-service Londrina centro", "sobremesa festa infantil Londrina"
- URLs a criar: `/londrina/buffet-self-service/`, `/londrina/aberto-agora/`, `/londrina/festa-infantil/`, `/londrina/inauguracao/`

**Aproveitar autoridade `telekarinho` → `milkypot.com`:**
- Backlink contextual + Schema `parentOrganization` + `sameAs` cruzado.
- Press release de inauguração no domínio Telekarinho com link follow.
- Author entity unificada (E-E-A-T).

---

### 🎨 UX/UI (Score: 68/100)

**Estado:** sólido pra entrar em produção, mas 3 frentes sangram conversão: hero genérico, chips PDV pequenos, mascote invisível na home.

**Críticos pra venda:**
- `index.html:213-222` — Hero raso, sem CTA primária forte. Falta foto real do potinho + endereço + botão "Pedir agora" 56px.
- `cardapio.html:182-186` — Stories Carousel `display:none`. Cliente abre sem visual de comida real, só emojis.
- `painel/pdv.html:632-633` — Botão "← Voltar" cinza-transparente no header é a 1ª coisa que operador clica por engano.
- `cardapio.html:222-224` — CTA "Finalizar Pedido" some quando carrinho vazio = página parece sem call-to-action.
- `painel/pdv.html:46-94` — Chips `.pdv-shortcuts .ks` fonte 12px (abaixo do mínimo PDV ≥14px).

**Altos:**
- `cardapio.html:227-403` — Checkout em 4 steps pra loja única é overkill. Combinar em 2.
- `clube.html:614-630` — Onboarding pede email + senha + nome + nasc + 2 consents. Adicionar Google Login como primeiro botão.
- `desafio.html:806-810` — Voucher obrigatório pra jogar. 90% dos visitantes IG não têm voucher → bounce. Habilitar modo Demo sempre.
- `painel/pdv.html:264-267` — `.fab-total { display: none }` em ≤480px. Operador mobile não vê total — péssimo.
- `index.html:413-436` — Social proof com emojis genéricos. Precisa de 3 fotos reais (loja + cliente + ovelhinha).

**Quick wins visuais:**
1. Foto real do potinho no hero `index.html:218`.
2. `navigator.vibrate(10)` no botão "Adicionar" mobile.
3. WhatsApp FAB float sticky.
4. Counter "X pedidos hoje" garantindo render ≤500ms.
5. Confetti no `successModal`.

**Mascote ovelhinha:** GRAVEMENTE sub-utilizada. Aparece só como emoji 🐑 em desafio/clube. NUNCA na home/cardápio. Criar 5 ilustrações (saudando, segurando potinho, comemorando, dormindo empty-state, pulando loading) e aplicar em todos os pontos. Sugestão: dar nome ("Mily").

**Acessibilidade:** Apenas 11 ocorrências `:focus/outline` em 4.974 linhas de CSS. Keyboard nav fraca.

---

### 💸 Growth/Conversão (Score: 68/100)

**Estado:** plano viral excelente no papel, mas **gargalos brutais de captura de lead pré-inauguração** e **confusão de datas**.

**3 erros que vão atrasar a meta AGORA:**
1. **Confusão temporal das datas** — plano diz 24-25/04/2026, hoje é 10/05/2026. Resolver hoje: consolidar data oficial em `docs/data-inauguracao.md`.
2. **Friction de cadastro mata o funil de paid** — CPF + magic link cross-device dropa 50%. Resolver: Google Login + CPF opcional.
3. **Nenhuma captura pré-inauguração nas landings** — `londrina/index.html` foca SEO bairros mas não captura email/WhatsApp. Deixa 1.000+ leads quentes na mesa.

**Top 5 mecânicas virais que faltam:**
1. Loop de indicação sem assimetria suficiente (Nubank/iFood são mais agressivos pro indicado).
2. #MilkyChallenge depende de criatividade alta. Backup: "30s reagindo ao saldo cair na nota" — universal.
3. Sem "cadeia" (10 amigos cadastrados → sabor secreto destrava pra loja inteira).
4. Raspinha não compartilhável (UGC desperdiçado).
5. TV indoor não fecha loop com app (cliente na TV não recebe push pra reagir).

**5 ideias loucas-mas-poderosas:**
1. "Potinho secreto de quinta" — enigma no IG, decifrar + ir ao endereço com frase secreta.
2. Ovelhinha gigante (3m) na Praça Marechal Floriano por 1 dia.
3. Take-over Calçadão — 100 stickers QR caça ao tesouro.
4. "MilkyPot vs. Sorveteria X" — challenge público de cashback (PR free).
5. "Última colher" — leilão reverso semanal de sabor exclusivo.

**Métricas a instrumentar (todas faltando):**
- CAC orgânico/paid, viral coefficient K, D1/D7/D30 retention, share rate raspinha, LTV 90d, NPS, conv. landing→enroll, push opt-in rate, % via indicação.

**Plano viral atual (`docs/plano-viral-milkyclube.md`):**
- ✅ Detalhamento por segundo dos 30 posts é cirúrgico.
- ❌ R$0 alocado em paid (orgânico-only é ingênuo pra zerar 3.500 em 30 dias).
- ❌ Não trata pré-inauguração T-30 a T-1.
- ❌ Influencer só na semana 3 (devia ser semana 1).
- ❌ Google Meu Negócio ausente.
- ❌ WhatsApp não aparece como canal primário.

---

### 🏗️ Arquitetura (Score: 38/100)

**Estado:** sólido em entrega rápida, frágil em escala, observabilidade e segurança de dados.

**P0 críticos:**
1. **Triplo deploy do mesmo código** (Vercel + Firebase Hosting + GitHub Pages). Qual responde é função de DNS. Risco real de SW servido com versão diferente por origem.
2. **Duplicação Cloud Functions ↔ Vercel Functions**: `functions/index.js` (802 linhas, 14 onCall) duplica `api/cloud-functions.js`. Duas surfaces de bug, duas auth paths.
3. **`datastore` mono-bucket** — `orders_{fid}` é doc plano com array inteiro. 30+ franquias estouram limite 1MB/doc. Migrar pra subcoleção `franchises/{fid}/orders/{orderId}`.
4. **Regras Firestore com write público em dados financeiros** — bomba de billing + fraude.

**P1 altos:**
5. SW worktree stale `mp-v101` (main em v186+).
6. SW precache `/f/ibirapuera/, /f/morumbi/...` que não existem (única loja é Londrina) — invalida install.
7. **Belinha sem mutex** — `Belinha-Iniciar.bat` local + trigger remoto rodando paralelo → conflito sw.js confirmado em MEMORY.
8. CI sem testes, sem lint, sem `npm audit`, sem secret scan.

**P2 médios:**
9. 4 PWAs no mesmo origin — Chrome só mostra install prompt do 1º manifest detectado. Cliente que entra pelo cardápio nunca recebe install do MilkyClube. Separar Clube em subdomínio.
10. Observabilidade caseira sem alertas. Erro crítico do PDV sábado 22h → descoberto segunda.

**Riscos de escala (quando vai quebrar):**
- 5 franquias: ainda viável.
- 15-20: writes públicos viram alvo, bill spike.
- 30+: docs `orders_{fid}` passam 1MB, PDV trava.
- 50+: cold start Cloud Functions com 14 onCall = 5-15s primeira chamada = abandono.
- 100+: agregação de logs impossível.

**3 ADRs antes de 25/04:**
- **ADR-001 Modelo Firestore.** Subcoleções (recomendado, irreversível depois de 6 meses) ou `datastore` (rápido, migra obrigatório até 10 lojas).
- **ADR-002 Hosting único.** Vercel (recomendado, já hospeda `api/`) — remover `hosting` do `firebase.json`.
- **ADR-003 Governança Belinha.** Áreas que Belinha NÃO toca sem human-approve: `sw.js`, `firestore.rules`, `functions/`, `api/*`. CODEOWNERS + branch protection.

---

## 📅 Plano de Ação — Próximos 30 Dias

### Semana 1 (10/05 → 16/05) — Pare a sangria
- **D0:** Resolver confusão de datas. Consolidar `docs/data-inauguracao.md`. Atualizar countdown em todas landings.
- **D1:** Sincronizar worktree com `main` (bump SW pra v187+). Configurar GCP Budget Alert (R$50/R$200/R$500). Verificar serviceAccountKey não está committado.
- **D2:** Remover PIN default `1234`. Validar via CF com bcrypt + lockout. Allow-list CORS.
- **D3:** Fechar writes públicos de `scratches`, `desafio_vouchers`, `desafio_streaks` → CFs com App Check. Assinar webhook Uber Direct.
- **D4:** `robots.txt` + `sitemap.xml`. Corrigir NAP em todas páginas Londrina.
- **D5:** Sentry free tier + Uptime Robot + CI ESLint + `npm audit`.

### Semana 2 (17/05 → 23/05) — Conversão pré-inauguração
- Google Login no MilkyClube (substituir/adicionar ao magic link). CPF opcional no enroll.
- Sticky FAB WhatsApp em todas páginas cliente.
- Foto real no hero + Stories Carousel ativo no cardápio.
- TikTok Pixel + Meta Pixel + UTM em todas landings.
- Countdown gigante no hero + captura WhatsApp pré-inauguração.
- 5 ilustrações da ovelhinha (Mily) + aplicar em hero/empty-states/clube.

### Semana 3 (24/05 → 30/05) — Refactor crítico + viralização
- `Utils.todayLocal()` + `Money` (centavos) — corrige 30 arquivos de uma vez.
- 20 testes Vitest pra `caixa.js` + `loyalty.js`.
- Quebrar `pdv.html` em módulos.
- "Potinho secreto" launch + ovelhinha gigante na Praça (se viável).
- Ativar paid Meta + TikTok geo-Londrina R$50-100/dia.
- OG image dedicada `og-londrina.jpg` 1200x630.

### Semana 4 (31/05 → 06/06) — Decisões arquiteturais
- ADR-001: decidir subcoleção `franchises/{fid}/orders/{orderId}` (recomendado).
- ADR-002: consolidar hosting único (Vercel).
- ADR-003: governança Belinha (CODEOWNERS).
- Blog `/blog/` com 4 posts pillar.
- Schema `Menu`/`MenuItem` em `cardapio.html`.
- Programmatic SEO 2.0: `/londrina/festa-infantil/`, `/londrina/aberto-agora/`.

---

## Itens deferidos (pós-inauguração)

- Schema `Restaurant`/`IceCreamShop` substituindo `Organization` na home.
- Subdomínio `clube.milkypot.com` (4 PWAs no mesmo origin é problema).
- Backup Firestore export diário.
- Migrar `api/cloud-functions.js` → deletar (fica em `functions/index.js`).
- Press release de inauguração no domínio Telekarinho.
- Páginas comparativo competitivo ("MilkyPot vs Oakberry Londrina").

---

## Quer que eu implemente as correções? (S/N)

Se sim, sugiro começar pela **Semana 1 — Pare a sangria**, em ordem:
1. Resolver confusão de datas (5min).
2. Sincronizar worktree + bump SW (10min).
3. GCP Budget Alert (10min).
4. Verificar serviceAccountKey (5min).
5. Remover PIN default `1234` (1h).
6. Fechar writes públicos críticos (3h).
7. `robots.txt` + `sitemap.xml` + NAP (1h).
