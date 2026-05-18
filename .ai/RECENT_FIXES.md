# 🩹 Recent Fixes — Timeline e Lições

> Histórico cronológico dos bugs significativos resolvidos. **Sempre atualize aqui antes de mergear PR.**

Formato: `[data] BUG → FIX → LIÇÃO`

---

## 2026

### 2026-05-18

#### 🐛 Botão "Ver" do holerite no app colaborador estourava pra fora da tela
- **PR:** #689
- **Cause:** `.fn-btn` tem `width: 100%` por padrão no CSS. Quando colocado dentro de `<div style="display:flex">` junto com selects `flex:1`, o `width:100%` força largura cheia do container interno fazendo o botão estourar pra fora da viewport mobile.
- **Fix:**
  1. Inline override: `width:auto` + `flex:0 0 auto` no botão Ver
  2. Selects ganham `min-width:0` pra permitir shrink abaixo do conteúdo
  3. Container ganha `flex-wrap:wrap` como safety net
  4. CSS global: `.fn-btn` dentro de containers flex/grid auto-recebe `width:auto`
- **Lição:** ⚠ NUNCA misture `width:100%` com `flex:0 0 auto` num mesmo botão. CSS global do projeto deve ter regra "se .btn está dentro de flex/grid, width:auto automático". Em mobile-first, sempre testar com viewport 360-380px.
- **Arquivos:** `colaborador/index.html` (CSS + estrutura)

#### 🐛 Race condition: Amanda apagou registro do teste V2
- **PR:** #687
- **Cause:** Fix V1 (PR #666) fazia `setCollection` (write local+cloud) ANTES do merge async. Janela de race: cloud era sobrescrito com dados parciais antes do merge corrigir. Quando o `.get()` do merge rodava, ele lia o lixo que tinha acabado de escrever.
- **Fix V2:**
  - `addToCollection` agora: write LOCAL → fetch cloud (sem ter sobrescrito ainda) → merge cloud+local → write merged pro cloud
  - Cloud NUNCA é sobrescrito com dados parciais
  - Mantém atomicidade local-first pra UX feedback
  - Catch offline: fallback `_writeToCloud(col)` na queue
- **Lição:** ⚠ Pra merge atômico em sistema distribuído sem transação real, a ordem TEM que ser: read remoto → merge → write único. Nunca write-then-merge — sempre tem race window.
- **Arquivos:** `js/core/datastore.js`

#### 🐛 Amanda mostrava "Folga" mesmo após admin ajustar ponto
- **PR:** #684
- **Cause:** Bug timezone em 2 lugares:
  1. `ptLoadHoje` usava `new Date().toISOString().slice(0, 10)` → retorna data UTC
  2. `getStaffRecordsByDate` filtrava com `r.timestamp.startsWith(dateStr)` que compara string UTC
- **Fix:**
  - `time-clock.js getStaffRecordsByDate` agora converte `r.timestamp` para data SP via `Intl.DateTimeFormat('en-CA', timeZone: 'America/Sao_Paulo')` ANTES de comparar
  - `ptLoadHoje` agora usa `Utils.todayKey()` (que retorna SP)
- **Lição:** ⚠ NUNCA `toISOString().slice(0,10)` em lugar nenhum. SEMPRE `Utils.todayKey()` pra data, `Utils.formatTime()` pra hora. Bug afeta usuários que batem perto da meia-noite SP.
- **Arquivos:** `js/core/time-clock.js`, `painel/ponto.html`, `sw.js`

#### 🐛 Admin era bloqueado por CCT não cadastrado
- **PR:** #680
- **Cause:** `ptSalvarConfigCLT` chamava `alert('🚨 BLOQUEADO')` + `return` se admin tentasse ativar `banco_horas` sem CCT
- **Fix:** Removido bloqueio. Sistema apenas mostra aviso e registra pendência em `getAdminPendencies()`. Banner amarelo no topo da `ponto.html`.
- **Lição:** ⚠ NUNCA bloqueie admin por documento faltante. Use sistema de pendências (`clt-compliance.js getAdminPendencies`). Admin sabe o que tá fazendo — sistema deve só avisar.
- **Arquivos:** `painel/ponto.html`, `js/core/clt-compliance.js`

### 2026-05-17

#### 🐛 Race condition: punch de funcionária sobrescrevia outra
- **PR:** #666
- **Cause:** `DataStore.addToCollection` salvava sem fazer pull primeiro. Se dois devices escreviam em ~mesmo tempo, último ganhava e dado do outro sumia.
- **Fix:** `addToCollection` agora faz `_syncOneDoc()` (pull do Firestore) + merge por id + salva. Aplicado pra collections listadas em `_isMergeableListDoc`.
- **Lição:** Toda collection multi-writer precisa estar em `_isMergeableListDoc`. Sempre use `addToCollection` (não `setCollection`).
- **Arquivos:** `js/core/datastore.js`

#### 🐛 Funcionária bateu ponto no celular mas não apareceu no painel
- **PR:** #666
- **Cause:** Collection `time_clock_records_` não estava em `_publicSyncDocs` então não sincronizava entre devices.
- **Fix:** Adicionado `time_clock_records_`, `time_clock_justifications_`, `time_clock_audit_`, `jornada_overrides_`, `holidays_`, `ferias_`, `solicitacoes_`, `comunicados_`, `treinamentos_` ao sync.
- **Lição:** Toda collection nova deve entrar em `_publicSyncDocs` (e em `_isMergeableListDoc` se multi-writer).
- **Arquivos:** `js/core/datastore.js`

#### 🐛 Service Worker mostrava cache antigo após deploy
- **PR:** #666
- **Cause:** `activate` event não forçava reload dos clients. Usuário ficava preso no cache antigo até F5 manual.
- **Fix:** Em `sw.js activate`, depois de limpar cache antigo, faz `client.navigate(client.url)` pra cada aba aberta. Auto-reload sem F5.
- **Lição:** Após bump SW versão, browsers auto-recarregam todas as abas abertas. Mas isso requer que `clients.matchAll({ includeUncontrolled: true })` funcione. Cuidado com logo de OAuth (skip via pathname check).
- **Arquivos:** `sw.js`

#### 🐛 Belinha quebrava com mensagens de áudio do WhatsApp
- **Cause:** Meta WhatsApp envia áudio como URL temporário (.ogg). Belinha não tinha transcrição.
- **Fix:** Endpoint `/api/transcribe.js` → baixa áudio → envia pra Groq Whisper → retorna texto. Webhook integra: se `type === 'audio'`, chama transcribe antes de processar.
- **Lição:** Áudio é 60% das interações WhatsApp BR. Groq é 10x mais barato que OpenAI Whisper e tão rápido quanto.
- **Arquivos:** `api/transcribe.js`, `api/whatsapp/webhook.js`

#### 🐛 Selfie travava o ponto se face-api falhasse
- **PR:** #670
- **Cause:** `face-recognition.js init()` sem timeout. Se CDN do modelo demorasse, função nunca resolvia.
- **Fix:** Wrapper com timeout 5s. Se falhar, retorna `null` (não bloqueia). Ponto registra sem score de face-match. Auditor admin vê alerta na selfie.
- **Lição:** Anti-fraude NUNCA pode travar a funcionária. Graceful degradation always. Se sistema biometria falha, funcionária bate ponto e admin audita depois.
- **Arquivos:** `js/core/face-recognition.js`, `colaborador/index.html`

#### 🐛 Horário mostrava em UTC (17:20 ao invés de 14:20 SP)
- **Cause:** Multiple files using `rec.timestamp.slice(11,16)` que extrai UTC.
- **Fix:** Substituído por `Utils.formatTime(rec.timestamp)` que usa `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'`.
- **Lição:** ⚠ `Intl.DateTimeFormat` é a única forma 100% correta de converter UTC pra SP no browser. Cuidado com horário de verão (já não existe no Brasil mas...).
- **Arquivos:** 11 arquivos afetados (busca: `\.slice\(11,16\)`)

#### 🟣 Feature: HR Hub completo (colaboradores-hub.html)
- **PR:** #667
- **What:** Admin tem painel central pra aprovar atestados, ajustes, trocas, abonos, férias. Cada aprovação executa ação real (ex: atestado → `TimeClock.addJustification`).
- **Files:** `painel/colaboradores-hub.html`

#### 🟣 Feature: CLT 100% compliance (folha completa)
- **PRs:** #678, #680
- **What:**
  - DSR automático (Lei 605/49)
  - Folga compensatória pendente (CLT 67)
  - Intervalo suprimido (CLT 71 §4º)
  - Upload CCT/aditivos
  - Catálogo CLT 473 (16 tipos faltas justificadas)
  - Holerite, férias, 13º, FGTS, rescisão
  - eSocial XML S-1000/1005/2200/1200/1210/2299
  - Pendências admin (não-bloqueante)
- **Files:** `js/core/clt-compliance.js`, `js/core/payroll-compliance.js`, `js/core/esocial-export.js`, `painel/folha.html`, `painel/relatorio-clt.html`

---

## Padrões de bug recorrentes (top 5)

### 1. Timezone (~40%)
**Sintoma:** "Funcionário não aparece", "Horário errado em 3h", "Pra um dia, pro outro mostra"
**Como evitar:**
- `Utils.todayKey()` em vez de `toISOString().slice(0,10)`
- `Utils.formatTime(ts)` em vez de `ts.slice(11,16)`
- Filtros de data sempre convertendo UTC → SP antes de comparar

### 2. Cache SW antigo (~20%)
**Sintoma:** "Deu deploy e não atualizou"
**Como evitar:**
- Bump `CACHE_VERSION` em `sw.js` SEMPRE
- Cache buster `?v=mp-vNNN` em script tags se mudou JS core
- Hard reset disponível em DEBUG_PLAYBOOK

### 3. Sync collection não configurada (~15%)
**Sintoma:** "Funcionou no PC mas não no celular" / "Salvou mas sumiu"
**Como evitar:**
- Toda collection nova → adicionar em `_publicSyncDocs` (datastore.js)
- Se multi-writer → também `_isMergeableListDoc`

### 4. NSR (~10%)
**Sintoma:** "Lacuna no número de registro"
**Como evitar:**
- JAMAIS deletar registro (use `cancelled: true`)
- `syncNSRFromRecords()` no init pra alinhar local com remoto
- NSR é por franchise (não global)

### 5. XSS / falta de escapeHtml (~5%)
**Sintoma:** "Layout quebrou quando funcionária digitou X" / "Aparece HTML cru"
**Como evitar:**
- `Utils.escapeHtml(x)` em TODO texto user-generated
- Especialmente em justificativas, motivos, descrições

---

## Próximos itens a melhorar (backlog técnico)

### Alta prioridade
- [ ] Tabela INSS/IRRF 2026 (atualizar quando Portaria sair)
- [ ] Holerite PDF nativo (não só print) — usar pdf-lib ou similar
- [ ] eSocial XML signing client-side (Web Crypto API + cert A1/A3)
- [ ] Onboarding wizard primeiro funcionário (reduzir fricção)

### Média prioridade
- [ ] Modo offline ponto (queue + sync quando voltar net)
- [ ] Notificações push (admin recebe novos pontos)
- [ ] Belinha multi-idioma (espanhol pra clientes turistas)
- [ ] Auditoria de IPs suspeitos (mesmo IP batendo de funcionário diferente)

### Baixa prioridade
- [ ] Migrar para Tailwind (atualmente vanilla CSS custom)
- [ ] Migrar para módulos ES6 (atualmente IIFE globals)
- [ ] Storybook pra componentes UI

---

## 📌 Como adicionar nova entrada aqui

Quando você (IA ou humano) resolver um bug significativo:

```markdown
### YYYY-MM-DD

#### 🐛 Título curto do bug
- **PR:** #NNN
- **Cause:** explicação técnica concisa
- **Fix:** o que foi mudado
- **Lição:** o que NÃO repetir
- **Arquivos:** lista
```

Padrão de emoji:
- 🐛 bug fix
- 🟣 nova feature
- ✅ chore / refactor não-visível
- 🚨 security
- ⚡ performance
