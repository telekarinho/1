# MilkyPot — AI Context File

> **Para qualquer IA/dev que pegar esse projeto:** este arquivo é seu mapa rápido. Leia em 2 minutos e você sabe onde tudo está, o que NÃO mexer, e onde os bugs costumam morar. Atualize esse arquivo a cada feature/fix grande.

---

## 🍦 O QUE É O MILKYPOT

Sistema SaaS multi-tenant pra rede de franquias de sorvete/açaí (MilkyPot). Inclui:
- **Painel admin franqueado** (PDV, equipe, ponto, folha, fiscal, marketing, IA Belinha)
- **App colaborador mobile** (PWA + TWA Android) — bate ponto, solicita atestado, vê banco
- **Belinha IA** (WhatsApp bot) — pré-vendas, atendimento, treinamento contínuo
- **TV in-store** (cardápio + sorteios + raspadinha)
- **Site público** (cardápio, fidelidade, leads de franquia)

**Stack:** HTML/CSS/JS vanilla (zero framework). Firebase Firestore. GitHub Pages (auto-deploy). Vercel (Belinha API). Service Worker pra cache + offline.

**Loja real funcionando:** `Muffato Quintino — Londrina/PR` (a partir de mai/2026).

---

## 🗺 MAPA DO REPOSITÓRIO (saber onde está tudo)

```
/                         → home + cardápio público
/painel/                  → admin franqueado (autenticado)
  ├── index.html          → dashboard
  ├── pdv.html            → PDV / caixa
  ├── pedidos.html        → pedidos delivery
  ├── equipe.html         → cadastro funcionários
  ├── ponto.html          → ponto eletrônico CLT  ⭐ crítico
  ├── folha.html          → holerite/férias/13/FGTS/eSocial  ⭐ crítico
  ├── relatorio-clt.html  → espelho mensal contador
  ├── colaboradores-hub.html → solicitações + comunicados
  ├── financeiro.html     → DRE / fluxo / despesas
  ├── fiscal.html         → NFC-e / SAT
  ├── marketing.html      → campanhas
  ├── belinha-learnings.html → treinar IA
  └── configuracoes.html  → empresa / CNPJ / fiscal
/colaborador/             → app mobile funcionário (PWA + TWA)
  └── index.html          → ÚNICA página (SPA com tabs: Hoje/Pedir/Avisos/Banco/Perfil)
/funcionario/             → versão antiga (deprecated, redireciona pra /colaborador)
/tv.html                  → TV slideshow in-store
/desafio.html             → raspadinha cliente
/api/                     → endpoints Vercel (Belinha webhook, push)
/js/core/                 → bibliotecas compartilhadas ⭐ ler abaixo
/css/                     → estilos compartilhados
/sw.js                    → service worker ⭐ versão muda a cada deploy
/manifest.json            → PWA manifest
```

### Bibliotecas `js/core/*` — leia ANTES de mexer

| Arquivo | O que faz | Quando mexer |
|---|---|---|
| **`datastore.js`** | Única fonte de verdade. Combina localStorage + Firestore sync. | Pra mudar como dados são salvos/sincronizados |
| **`utils.js`** | Helpers. **`Utils.todayKey()`, `Utils.formatTime()` SP-aware** | Sempre que precisar de data/hora |
| **`auth.js`** | Firebase Auth + sessão | Login/permissões |
| **`time-clock.js`** | Ponto CLT (NSR, hash SHA-256, computeDay, computeMonth) | Bug de ponto |
| **`overtime-bank.js`** | Banco de horas + intervalo suprimido CLT 71 §4º | Cálculo banco |
| **`clt-compliance.js`** | CCT, CLT 473, pendências admin | Bug compliance |
| **`payroll-compliance.js`** | Holerite, INSS/IRRF 2025, férias, 13º, FGTS, rescisão | Bug folha |
| **`esocial-export.js`** | XMLs S-1000/S-1005/S-2200/S-1200/S-1210/S-2299 | Mexer eSocial |
| **`face-recognition.js`** | face-api.js wrapper (graceful, nunca bloqueia) | Anti-fraude selfie |
| **`geofence.js`** | Verifica se ponto bateu na loja | Bug localização |
| **`payroll.js`** | Banco horas legacy (Payroll.listBankHoursRequests, etc) | NÃO confundir com payroll-compliance |
| **`anti-fraud.js`** | Detecções genéricas de fraude | Quando ver IP repetido / dispositivo suspeito |
| **`gamification.js`** | MilkyCoins / streak / desafio | Bug fidelidade |
| **`belinha-widget.js`** | Widget chat Belinha no site | Pop-up chat |

---

## 🔥 ARMADILHAS CONHECIDAS (LEIA OU VAI PERDER TEMPO)

### 1. ⏰ TIMEZONE — São Paulo SEMPRE

❌ **NUNCA:** `new Date().toISOString().slice(0,10)` → retorna data UTC
❌ **NUNCA:** `rec.timestamp.slice(11,16)` → retorna hora UTC
✅ **SEMPRE:** `Utils.todayKey()` pra data, `Utils.formatTime(timestamp)` pra hora

**Por que importa:** Funcionária bate ponto às 22h SP = 01h UTC dia seguinte. Se filtrar com data UTC, ela "desaparece" do dia errado. Bug já mordeu várias vezes (2026-05-17, 2026-05-18).

### 2. 🔄 SYNC MULTI-DEVICE — datastore.js merge

`DataStore.addToCollection()` faz pull + merge antes de salvar pra collections marcadas como **mergeable** em `datastore.js → _isMergeableListDoc()`. Se você criar uma collection nova que múltiplos devices podem escrever simultaneamente, **adicione lá** ou vai perder dados (uma escrita sobrescreve a outra).

Também adicione a `_publicSyncDocs()` se a collection deve sincronizar entre devices.

Collections já mergeable: `time_clock_records_`, `time_clock_justifications_`, `solicitacoes_`, `comunicados_`, `cct_documents_`, `holerites_`, etc. Veja lista completa em `datastore.js:489-512`.

### 3. 📦 SERVICE WORKER — bump versão TODA vez

`sw.js` linha 1-2:
```js
const CACHE_VERSION = 'mp-vNNN';
const CACHE_NAME = 'milkypot-vNNN';
```

Atualize **NNN** a cada deploy senão usuário fica com cache antigo. Versão atual: `mp-v298` (e crescendo).

Adicione novos arquivos ao `PRECACHE_URLS` (linha ~13).

### 4. 🚫 ZERO BLOQUEIOS PRO ADMIN

Decisão do produto: **NUNCA bloqueie o admin** por documento faltando (CNPJ, CCT, dados funcionário). Use `CLTCompliance.getAdminPendencies()` que registra como pendência visível em banner amarelo em `painel/ponto.html`. Tudo que falta = aviso, nunca bloqueio.

### 5. 🤖 BELINHA NUNCA REVELA SER IA

Belinha é treinada pra agir como humana (vendedora real). Nunca diga "sou IA" ou ofereça "falar com atendente". Sistema deve ser o mais humanizado possível.

### 6. 🔐 IMUTABILIDADE PONTO (Portaria 671/2021)

`time-clock.js` jamais edita registros — qualquer "ajuste" cria NOVO registro com link ao original (`r.adjustedFrom`). O original ganha flag `r.adjusted = true` e é escondido da UI mas mantido em audit. NSR sequencial sem lacuna. Hash SHA-256 imutável. Não burle.

**3 operações distintas — não confunda:**
- `recordPunch()` — funcionária bate ponto normal (timestamp = agora SP)
- `adjustRecord()` — admin ajusta hora de batida EXISTENTE (cria NOVO record + marca original `adjusted:true`)
- `addRetroactivePunch()` — admin adiciona batida que NUNCA existiu (ex: esqueceu de bater saída). Súmula 338 TST. Flag `retroativo:true`, motivo obrigatório, notifica funcionária.

### 7. 📱 CSS: `.fn-btn` tem `width:100%` default

Botões `.fn-btn` no app colaborador são fullwidth por padrão. Se você usar dentro de `display:flex/grid`, **explode pra fora da viewport mobile**.

❌ **EVITA:**
```html
<div style="display:flex">
  <button class="fn-btn">Ver</button>  <!-- estoura -->
</div>
```

✅ **FAZ ASSIM:**
```html
<div style="display:flex">
  <button class="fn-btn" style="width:auto;flex:0 0 auto">Ver</button>
</div>
```

Já tem CSS global que auto-fixa, mas é bom saber.

### 8. 🎯 FORÇAR LIMITES LEGAIS

`overtime-bank.js → getConfig()` força (mesmo se admin tentar mudar):
- `maxOvertimePerDay ≤ 2` (CLT art. 59)
- `overtimeRate ≥ 50%` (CLT art. 7 XVI)
- `overtimeRateSundayHoliday ≥ 100%` (CLT art. 7 IX)
- `bankHoursCompensationDays ≤ 180` (individual) ou `≤ 365` (coletivo)

NÃO remova essas constraints — protegem o admin de fiscalização MTE.

---

## 🗂 COLLECTIONS FIRESTORE (mapa de dados)

Multi-tenant: cada doc tem sufixo `_<franchiseId>` (ex: `time_clock_records_muffato-quintino`).

| Collection | O que tem | Quem escreve |
|---|---|---|
| `public_docs/franchises` | Lista de franquias (todos veem) | Master admin |
| `public_docs/staff_<fid>` | Funcionários | Franqueado |
| `public_docs/time_clock_records_<fid>` | Batidas ponto (imutável) | Funcionário + admin |
| `public_docs/time_clock_justifications_<fid>` | Atestados, abonos | Funcionário (cria) + admin (aprova) |
| `public_docs/time_clock_audit_<fid>` | Audit log de ajustes | Admin |
| `public_docs/jornada_overrides_<fid>` | Override pontual de jornada por dia | Admin |
| `public_docs/holidays_<fid>` | Feriados customizados além dos nacionais | Admin |
| `public_docs/solicitacoes_<fid>` | Solicitações funcionário (atestado, troca, etc) | Funcionário (cria), admin (aprova) |
| `public_docs/comunicados_<fid>` | Avisos do gerente pro app | Admin |
| `public_docs/treinamentos_<fid>` | Conteúdo treinamento | Admin |
| `public_docs/cct_documents_<fid>` | Uploads CCT/aditivos | Admin |
| `public_docs/ferias_gozadas_<fid>` | Períodos de férias gozados | Admin/RH |
| `public_docs/holerites_<fid>` | Holerites gerados | Sistema (auto) |
| `public_docs/decimo_pago_<fid>` | 13º pago (1ª e 2ª) | Admin/contador |
| `public_docs/rescisoes_<fid>` | Rescisões processadas | Admin |
| `public_docs/overtime_bank_audit_<fid>` | Mudanças config banco horas | Sistema |
| `belinha_conversations` | Histórico WhatsApp Belinha | Vercel API |
| `belinha_leads` | Leads capturados Belinha | Vercel API |
| `belinha_learnings_<fid>` | Treinamento Belinha personalizado | Admin |

---

## 🤖 BELINHA (IA WhatsApp)

**Fluxo:** WhatsApp → webhook Vercel (`/api/whatsapp/webhook.js`) → classifica intent → consulta Firestore → responde via WhatsApp Business API.

**Stack adicional:**
- **Groq Whisper** pra transcrever áudios (`/api/transcribe.js`)
- **Anthropic Claude** pra resposta natural (`/api/belinha-chat.js`)
- **Knowledge base:** `painel/belinha-learnings.html` — admin treina respostas pra produtos/promos específicos

**Variáveis ambiente (Vercel):**
- `ANTHROPIC_API_KEY` — Claude
- `GROQ_API_KEY` — Whisper transcrição áudio
- `WHATSAPP_TOKEN` — Meta Business API
- `FIREBASE_SERVICE_ACCOUNT` — admin SDK (JSON)

**Treinamento contínuo:** quando Belinha responde algo, admin pode marcar "✅ correto" ou "❌ corrigir" em `painel/copilot-belinha.html`. Aprendizado vai pra `belinha_learnings_<fid>` e é injetado no prompt da próxima conversa.

---

## 🚀 DEPLOY / BUILD

**1 comando = deploy automático:**
```bash
git push origin <branch>       # roda no Vercel + faz check-manifest
gh pr create ...                # cria PR
gh pr merge <num> --squash --admin  # merge to main → GitHub Pages publica
```

**O que verificar antes de merge:**
- ✅ SW versão atualizada (`sw.js` linha 1-2)
- ✅ Arquivos novos em `PRECACHE_URLS`
- ✅ Collections novas em `datastore.js _publicSyncDocs` e `_isMergeableListDoc`
- ✅ Cache buster em `?v=mp-vNNN` nos `<script src>` (se mudou JS core)

**Após merge:**
- GitHub Pages propaga em ~30-60s
- Funcionário/admin abre app → SW v_nova baixa em background → auto-reload (sem F5)
- Service worker `activate` força reload de todas as abas (`client.navigate()` linha ~195)

**Branch principal de trabalho:** `fix/whatsapp-uid-fallback-and-additional` (worktree: `D:\EDITADOS\milkypot\.claude\worktrees\fervent-jang-a9aaf0`)

---

## 🛠 DEBUG RÁPIDO (DevTools console)

```javascript
// Quem tá logado?
Auth.getSession()

// Qual data SP agora?
Utils.todayKey()                       // "2026-05-18"
Utils.formatTime(new Date().toISOString())  // "12:38"

// Ver batidas hoje (admin)
var fid = Auth.getSession().franchiseId;
var today = Utils.todayKey();
TimeClock.getStaffRecordsByDate(fid, 'STAFF_ID', today, true)  // true = inclui histórico

// Espelho mensal de um funcionário
TimeClock.computeMonth(fid, 'STAFF_ID', 2026, 5)

// Pendências do admin
CLTCompliance.getAdminPendencies(fid)

// Saldo banco horas
OvertimeBank.computeBankBalance(fid, 'STAFF_ID', 2026, 5)

// Gerar holerite
PayrollCompliance.gerarHolerite(fid, 'STAFF_ID', 2026, 5)

// Força sync Firestore agora
DataStore._syncFromCloud()

// Ver collection inteira
DataStore.getCollection('time_clock_records', fid)
```

---

## 🩹 BUGS RESOLVIDOS RECENTES (timeline ordem reversa)

| Data | Bug | Fix | Lição |
|---|---|---|---|
| 2026-05-18 | Amanda "Folga" mesmo após ajuste | `ptLoadHoje` usava UTC + `getStaffRecordsByDate` comparava string UTC | **NUNCA `toISOString().slice(0,10)` — use `Utils.todayKey()`** |
| 2026-05-18 | Admin bloqueado por CCT faltante | Bloqueio removido — só aviso amarelo via `getAdminPendencies` | **ZERO bloqueios admin — sempre avisos** |
| 2026-05-17 | Race condition: punch de uma sobrescreve outra | `addToCollection` faz pull+merge antes de salvar | **Toda collection multi-writer precisa estar em `_isMergeableListDoc`** |
| 2026-05-17 | Funcionário batia, admin via "Folga" | Faltava `time_clock_records_` em `_publicSyncDocs` | **Toda nova collection precisa entrar no sync** |
| 2026-05-17 | Cache antigo após deploy | `client.navigate()` em activate force reload | **Bump SW versão a cada deploy** |
| 2026-05-17 | Belinha quebrava nos áudios | Groq Whisper API + `/api/transcribe` | **Use Groq pra áudio (rápido + barato)** |
| 2026-05-17 | Selfie travava se face-api falhasse | `face-recognition.js` graceful (try/catch + timeout) | **Anti-fraude NUNCA pode bloquear funcionária** |

---

## 🆘 COMO RESOLVER PROBLEMAS COMUNS EM SEGUNDOS

### "X não aparece no painel"
1. Abra DevTools → console
2. `DataStore.getCollection('NOME_COLLECTION', Auth.getSession().franchiseId)` — vê se dado existe local
3. Se sim mas não renderiza → bug na função render. Procure `ptLoad*` ou `loadX` na página
4. Se não existe → `DataStore._syncFromCloud()` força pull. Se aparecer = bug de sync (adicione em `_publicSyncDocs`)
5. Se mesmo após sync não aparece → dado nunca foi gravado. Olhe console da página que cria.

### "Ponto bate mas não conta"
1. Veja `TimeClock.getStaffRecordsByDate(fid, sid, today, true)` — registro tá lá?
2. Se sim mas `computeDay` retorna sem entrada → bug timezone. Reveja `getRecordDateInSP()` em `time-clock.js:192`
3. Se registro tem `r.adjusted=true` ou `r.cancelled=true` → tá escondido. Use `includeHistorical=true`

### "Belinha não responde"
1. Vercel logs: `vercel logs --prod`
2. Verifique `ANTHROPIC_API_KEY` + `WHATSAPP_TOKEN` em env Vercel
3. Webhook Meta: verificar que está apontando pra `https://milkypot.com/api/whatsapp/webhook`
4. `belinha_conversations` no Firestore — última msg deve ter `responseStatus`

### "Cache não atualiza após deploy"
1. SW versão foi bumpada? (sw.js linha 1)
2. `caches.keys()` no console — quantas versões? Se tem antigas, SW activate não rodou
3. Force: `caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => location.reload())`

### "Login não funciona"
1. Firebase Auth ativo? (console.firebase.google.com)
2. Domínios autorizados incluem `milkypot.com`?
3. Senha errada? `auth.js → Auth.login()` tem retry com debug log

---

## 📞 CONTATOS / RECURSOS

- **GitHub repo:** `telekarinho/1`
- **Produção:** https://milkypot.com
- **Belinha API:** https://milkypot.com/api/*
- **CCT Londrina (sorveteria):** SINDEHOTÉIS Londrina — (43) 3323-0155
- **Mediador MTE (CCTs oficiais):** https://www3.mte.gov.br/sistemas/mediador
- **Manual eSocial:** https://www.gov.br/esocial/pt-br/documentacao-tecnica

---

## 🧠 PRA QUALQUER IA QUE ESTIVER LENDO ISSO

**Você não precisa explorar o repo inteiro.** Esse arquivo + os 3 arquivos em `.ai/` te dão 95% do contexto pra resolver qualquer issue em minutos.

**Antes de fazer qualquer mudança grande:**
1. Leia esse arquivo (CLAUDE.md)
2. Leia `.ai/SYSTEM_MAP.md` (arquitetura detalhada)
3. Leia `.ai/RECENT_FIXES.md` (não repita bug já resolvido)
4. Leia `.ai/DEBUG_PLAYBOOK.md` (comandos prontos)

**Depois de fazer mudança grande:**
- Atualize esse arquivo (especialmente seção "BUGS RESOLVIDOS RECENTES")
- Bump SW versão
- Commit + PR + merge + verifique produção
