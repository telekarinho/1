# 🛡️ PRODUCTION GUARDRAILS — MilkyPot

> **Esta é uma DIRETIVA OBRIGATÓRIA para qualquer sessão Claude (incluindo Belinha autônoma) editando o repo MilkyPot.**
> Loja de Londrina (Muffato Quintino) ABERTA desde 25/04/2026 e processando vendas reais.
> Qualquer atualização que QUEBRE algo que estava funcionando custa dinheiro ao franqueado.

---

## 🚦 REGRA #0 — ANTI-REGRESSÃO ABSOLUTA

**O MilkyPot SÓ PROGRIDE.** Toda mudança é **ADITIVA**. **NUNCA REGRESSIVA**.

Esta regra vale em **TODAS** as superfícies do projeto, simultaneamente — online (GitHub/Vercel), offline (PWAs cacheados nas TVs/celulares), e qualquer estado intermediário:

| Superfície | Cobertura anti-regressão |
|---|---|
| **GitHub repo** (`telekarinho/1`) | Branches, tags, releases, workflows, secrets |
| **Código local** (worktrees Claude, máquina do user) | Working tree, stashes, branches em paralelo |
| **Vercel produção** | Build atual servido em `milkypot.com` |
| **GitHub Pages** | Fallback de hosting |
| **Firestore** (`milkypot-ad945`) | `datastore/*`, regras de segurança, índices |
| **Cloud Functions** (`southamerica-east1`) | Funções deployadas + suas dependências |
| **PWAs cacheados** (`sw.js`) | Service workers nas TVs, celulares de clientes, de colaboradores |
| **APK Colaborador** (`build-android-app.yml`) | TWA via `@bubblewrap/core` |
| **APK TV** (`android-tv/`) | WebView fullscreen → `tv.html` |
| **Painel admin** (`painel/*.html`) | PDV, equipe, configurações, TV-indoor, fechamento de caixa |
| **MilkyClube** (`/milkyclube/`) | Cashback + push FCM + gamificação |
| **Belinha bot** (branch `claude/belinha-melhoria-continua`) | Agente autônomo 24/7 |
| **Offline state** | Comportamento esperado sem internet ainda deve funcionar |

### O que esta regra PROÍBE

- ❌ Apagar função, componente, array ou arquivo "porque não parece estar sendo usado"
- ❌ Renomear campos do Firestore sem atualizar TODOS os consumers no mesmo PR
- ❌ "Limpar código duplicado" entre superfícies (`tv.html` web ↔ APK TV — não há duplicação real, são contratos)
- ❌ "Otimizar" reescrevendo do zero
- ❌ "Consolidar" merging features sem confirmar com user
- ❌ "Desativar temporariamente" um toggle/flag em produção
- ❌ Substituir um renderer/handler por outro mais "moderno" sem manter o antigo como fallback
- ❌ Remover suporte a um tipo de dado/slide/payload do switch
- ❌ Bumpar versão de dependency major que muda API pública
- ❌ Forçar reload do SW de um jeito que apaga dados locais (caixa aberto, fila offline, etc)
- ❌ Mexer em `permissions:` de workflow / Firestore Rules sem revisão

### O que esta regra PERMITE

- ✅ Adicionar nova função/slide/tipo/flag sem mexer no que existe
- ✅ Corrigir bug introduzido **na mesma sessão** (rollback é progresso)
- ✅ Bumpar `sw.js` cache version (parte do fluxo normal)
- ✅ Renomear código interno sem mudar contrato externo (assinaturas de função, IDs de docs Firestore, query params de URL)
- ✅ Substituir COM CONFIRMAÇÃO explícita do user + plano de revert documentado em commit
- ✅ Marcar legacy como `// DEPRECATED` mantendo o código funcional

### Como agir quando há dúvida

1. **Procure todas as referências** com Grep antes de remover qualquer coisa
2. **Assuma que é usado** se houver UMA referência que você não consegue rastrear
3. **Pergunte ao user** — é melhor parar uma sessão por 1 minuto do que quebrar produção
4. **Marque como DEPRECATED** em vez de remover. Remover fica pra major version explícita

### Regra prática: ATUALIZAR ≠ SUBSTITUIR

Adicionar funcionalidade nova é OK. Apagar o que já funcionava (mesmo "limpando código morto") é PROIBIDO sem confirmação explícita do user.

Se você está em dúvida se algo é usado: **assuma que SIM e mantenha.**

---

## 📺 TV Indoor — Sistema Crítico

A TV (`tv.html` + APK Android `android-tv/`) é o **outdoor digital da loja**. Os clientes a veem o tempo todo. Slides faltando = cardápio "quebrado" pro cliente.

### Componentes que DEVEM existir SEMPRE em `tv.html`:

1. **`MILKSHAKE_CARDS`** (array de 28 sabores 1-28) — Milkshakes + Sundaes Parte 1 + 2
2. **`ICE_PROTEIN_CARDS`** (3 sabores 29-31) — linha fitness
3. **`ALCOHOLIC_CARDS`** (4 sabores 32-35) — linha +18
4. **`marketingBuffet`** — card "Monte seu sorvete do seu jeito" R$5,99/100g
5. **`marketingPromo1`** — "ACERTOU 300g, NÃO PAGOU!"
6. **`marketingPromo2`** — "Craque do Tempo? 10.000 ms!"
7. **`marketingIceProtein`** — selo FITNESS 26g proteína
8. **`marketingAlcoholic`** — selo +18 CONTÉM ÁLCOOL
9. **`monteSeuSlides`** — 7 slides "Monte do Seu Jeito" (Açaí/Smoothie/Shake)
10. **Função `renderMilkshakeCard(m)`** que renderiza tipo `milkshake-card`
11. **Renderers de tipos**: `image`, `video`, `text`, `product`, `promo`, `combo`, `menu`, `story`, `milkshake-card`, `html`

### Os toggles do painel (`painel/tv-indoor.html`) DEVEM SEMPRE GRAVAR estes flags em `tv_config_<franchiseId>`:

```
showPromosOficiais
showTvCardsFlavors
showTvCardsPremium
showTvCardsBuffet
showTvCardsSundae
showTvCardsSundaePremium
showTvCardsIceProtein
showTvCardsAlcoholic
showTvCardsMonteSeu
```

E `tv.html` LEITURA: SEMPRE com `!== false` (default ON pra TVs sem config salvo). Se mudar o nome de um flag, **renomeie nos DOIS arquivos juntos no MESMO PR**.

### Regra do APK Android TV (`android-tv/`):

A `WebPlayerActivity.kt` carrega `https://milkypot.com/tv.html?f=...&tv=...` em WebView fullscreen. **NÃO portar marketing slides pro Kotlin.** Qualquer slide novo do catálogo: implementa SÓ no `tv.html` e aparece automaticamente no APK.

Se alguém pedir pra "otimizar" o APK trocando WebView por render nativo: **REFUSE.** A v1.x já provou que diverge e quebra.

---

## 🏷️ Sistema Catalog Integrado — NÃO É OPCIONAL

O catálogo do MilkyPot é UM SÓ usado por TRÊS frentes:

| Sistema | Lê de | Quebra se... |
|---|---|---|
| **PDV** (`painel/pdv.html`) | `catalog_v2` + `catalog_config` | Sabor desativado errado: operador não consegue lançar |
| **TV Indoor** (`tv.html`) | Hardcoded JS `MILKSHAKE_CARDS` + Firestore `tv_config_*` | Slide some: cliente vê cardápio vazio |
| **Cardápio Cliente** (`cardapio.html`) | `catalog_v2` | Cliente não vê sabor: pedido errado |

**ANTES de editar qualquer um destes, mapear dependências cruzadas.** PATCHes direto no Firestore (ex: reduzir sabores) PRESERVAR backup + ter revert script.

---

## 🔐 Sistemas Críticos em Produção

| Sistema | Local | Cuidado |
|---|---|---|
| **PDV + Caixa** | `painel/pdv.html`, `painel/index.html` | Comissões com limite por franquia; excedente = venda não lançada |
| **Portal Colaborador** | `/colaborador/` (NÃO `/funcionario/`) | Login via Cloud Function `funcionarioLogin` (Rules bloqueiam `staff_*`) |
| **Fechamento de Caixa Email** | `functions/index.js _buildClosingHtml` | Mobile-first 5 blocos; excedente entra no faturamento |
| **Cloud Functions** | `southamerica-east1` | Notificações push por status do pedido |
| **APK Colaborador** | `.github/workflows/build-android-app.yml` | TWA via `@bubblewrap/core` API (NÃO CLI) |
| **APK TV** | `.github/workflows/android-tv-apk.yml` + `android-tv/` | WebView fullscreen → `tv.html` |
| **MilkyClube** | `/milkyclube/` | Contrato técnico em `.claude/MILKYCLUBE_CONTRACT.md` |
| **Belinha Bot** | `claude/belinha-melhoria-continua` branch | Roda autônoma 24/7; conflitos em `sw.js` esperados |

---

## ⚠️ Pegadinhas Decoradas (já paguei o pato)

### 1. Auth global, não window.Auth
```js
// ✅ if (typeof Auth !== 'undefined')
// ❌ if (window.Auth)  ← sempre undefined
```

### 2. Timezone Brasília
```js
// ✅ compensar getTimezoneOffset antes de toISOString
// ❌ new Date().toISOString().slice(0,10)  ← muda o dia após 21h
```

### 3. UX do operador PDV
- Banner full-width topo > tooltip
- Auto-modal pra ações obrigatórias
- Operador não usa F12

### 4. Cache do Service Worker
- Versão atual em `sw.js` linhas 1-2 (atualmente v263+)
- BUMPAR a cada deploy que mude HTML/JS sensível
- Belinha pode ter bumpado em paralelo → resolver mantendo a maior +1

### 5. Bubblewrap CLI é inutilizável em CI
- Workflow do APK colaborador usa `@bubblewrap/core` API direto
- NÃO trocar pelo CLI (é interativo, falha silenciosamente)

---

## 📋 Checklist OBRIGATÓRIO antes de qualquer PR

- [ ] `git fetch origin main` + comparar com local (REGRA #1 do MEMORY)
- [ ] Entender o sistema completo antes de editar (REGRA #2 do MEMORY)
- [ ] Se mexer em `tv.html`: confirmar que `MILKSHAKE_CARDS`, `ICE_PROTEIN_CARDS`, `ALCOHOLIC_CARDS`, `monteSeuSlides`, `renderMilkshakeCard`, e os 11+ tipos de slide continuam presentes
- [ ] Se mexer em `painel/tv-indoor.html` configs: confirmar que os flags batem 1:1 com o que `tv.html` lê
- [ ] Se mexer em `catalog_v2` ou `catalog_config` no Firestore: backup + revert script preparado
- [ ] Se mexer em `android-tv/`: NÃO portar lógica do tv.html pra Kotlin
- [ ] Bumpar `sw.js` CACHE_VERSION + CACHE_NAME
- [ ] Testar em browser real antes de PR-mergear (Chrome MCP idealmente)
- [ ] PR description explicita o que **NÃO foi tocado** pra deixar claro o scope

---

## 🚨 Sinais de Alerta que devem PARAR a sessão

Se você está prestes a:

1. **Apagar uma função/array porque "não parece estar sendo usado"** → PARE. Procure por todas as referências com Grep antes.
2. **"Limpar código duplicado" entre `tv.html` web e APK Android** → PARE. APK usa WebView na tv.html; não há duplicação real.
3. **Remover um tipo de slide do switch/render** → PARE. Cada tipo (`milkshake-card`, `promo`, `story`, etc) é um conjunto de assets que algum sistema produz.
4. **Mudar nome de campo do Firestore** → PARE. Tem PDV, TV, cardápio, painel admin e Cloud Functions consumindo. Renomear é PR separado mapeando TODOS os consumers.
5. **"Otimizar" o APK trocando WebView por render nativo** → PARE. Já tentaram, divergiu, quebrou produção.

---

**Última atualização**: 2026-05-16 (sessão APK TV WebView refactor)
**Bug que motivou esse doc**: APK Android TV silenciosamente pulava todos os slides do catálogo (`milkshake-card`, `promo`, `story`, etc) porque o switch nativo só renderizava `image`/`video`/`html`. Slides marketing apareciam só na URL web, não no APK. Solução: WebPlayerActivity carrega tv.html via WebView — paridade total.
