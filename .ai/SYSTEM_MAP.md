# MilkyPot — System Map (Arquitetura Detalhada)

## Visão de cima

```
┌────────────────────────────────────────────────────────────────────────┐
│  CLIENTE FINAL (consumidor)                                            │
│  └─ milkypot.com → cardápio + fidelidade + raspadinha + leads franquia │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  TV IN-STORE (raspadinha + cardápio motion)                            │
│  └─ milkypot.com/tv.html → autoplay slides                             │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL FRANQUEADO (admin logado)                                      │
│  ├─ PDV + estoque + financeiro + fiscal                                │
│  ├─ Ponto eletrônico (CLT 100%)                                        │
│  ├─ Folha (holerite, férias, 13º, FGTS, eSocial)                       │
│  ├─ Hub colaboradores (solicitações, comunicados, mural)               │
│  └─ Belinha (treinamento + analytics)                                  │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  APP COLABORADOR (mobile PWA + TWA Android)                            │
│  ├─ Bater ponto (selfie + geofence + face-api graceful)                │
│  ├─ Ver saldo banco horas + holerite                                   │
│  ├─ Solicitar atestado/ajuste/troca/abono/férias                       │
│  ├─ Ver comunicados + mural + treinamento                              │
│  └─ Gamificação (streak, MilkyCoins)                                   │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  BELINHA WHATSAPP (Vercel serverless)                                  │
│  ├─ /api/whatsapp/webhook → recebe msg do Meta                         │
│  ├─ /api/transcribe → áudio → texto (Groq Whisper)                     │
│  ├─ /api/belinha-chat → resposta (Anthropic Claude)                    │
│  └─ Treinamento contínuo via painel/belinha-learnings.html             │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  FIREBASE FIRESTORE (verdade compartilhada)                            │
│  └─ public_docs/{collection}_<franchiseId> (docs per franchise)        │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────────┐
│  GITHUB PAGES (static host) + VERCEL (serverless API)                  │
│  └─ Push to main → deploy auto                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Camadas

### 1. UI Layer (HTML/CSS/JS vanilla)

**Princípio:** zero framework. Cada `<page>.html` é autossuficiente, importa `js/core/*` que precisa.

**Convenção:**
- Função prefixada com a página: `painel/ponto.html` usa `pt*` (ptLoadHoje, ptSwitchTab)
- Modais via `<div class="modal" id="ptModalNome">` + display:none
- Botões: `class="btn-primary"` ou `btn-secondary` (definidos em `css/shared-panel.css`)
- Inputs: `class="pt-input"` (estilo consistente)

**Service Worker:**
- `sw.js` na raiz controla TUDO em milkypot.com
- `/colaborador/sw.js` controla só /colaborador (escopo separado pra PWA isolada)
- `/funcionario/sw.js` deprecated

### 2. DataStore Layer (`js/core/datastore.js`)

**Padrão:** TODA escrita/leitura passa por `DataStore`. Combina:
- `localStorage` (cache local rápido)
- Firestore (sync cross-device + persistência)
- Event bus (`mp_synced`, `mp_remote_update`) pra auto-rerender

**Métodos principais:**
```js
DataStore.get(key)                          // raw localStorage
DataStore.set(key, value)                   // localStorage + Firestore se _publicSyncDocs

DataStore.getCollection(name, franchiseId)  // ex: 'staff', 'pedidos'
DataStore.setCollection(name, fid, items)   // overwrite total
DataStore.addToCollection(name, fid, item)  // pull+merge+append (race-safe)

DataStore.getAllFranchises()                // lista global
DataStore._syncFromCloud()                  // força pull

DataStore.on('synced', cb)                  // listener pra mudança remota
```

**Collections multi-tenant:** `<collection>_<franchiseId>` ex: `time_clock_records_muffato-quintino`

**Mergeable collections** (precisam pull+merge antes de escrever — listadas em `_isMergeableListDoc`):
- `time_clock_records_`, `time_clock_justifications_`, `time_clock_audit_`
- `jornada_overrides_`, `holidays_`, `ferias_`, `trocas_turno_`
- `solicitacoes_`, `comunicados_`, `treinamentos_`
- `cct_documents_`, `ferias_gozadas_`, `holerites_`, `decimo_pago_`, `rescisoes_`

**Por que isso existe:** dois devices podem escrever ao mesmo tempo (funcionário no celular + admin no PC). Sem merge, último escreve ganha = perde dado.

### 3. Domain Layer (`js/core/*.js`)

Cada módulo é IIFE auto-executável que expõe API global em `window.XYZ`.

**Hierarquia de dependências:**

```
constants.js    ← (nada)
i18n.js         ← (nada)
utils.js        ← (nada)  ⭐ usado por TODOS

firebase-config.js ← (Firebase SDK)
datastore.js       ← utils, firebase-config
auth.js            ← datastore, firebase-config

time-clock.js          ← datastore, utils, overtime-bank (opcional)
overtime-bank.js       ← datastore
clt-compliance.js      ← datastore, overtime-bank, time-clock
payroll-compliance.js  ← datastore, time-clock
esocial-export.js      ← datastore, payroll-compliance
face-recognition.js    ← (CDN @vladmandic/face-api lazy)
geofence.js            ← (Geolocation API)
```

**Padrão IIFE:**
```js
(function () {
    'use strict';
    function privateFn() {}
    window.MyModule = {
        publicApi: privateFn
    };
})();
```

### 4. Auth Layer (`js/core/auth.js`)

Firebase Auth (email/senha) wrapping.

**Sessão:** `localStorage.getItem('mp_session')` contém:
```json
{
  "uid": "firebase_uid",
  "email": "admin@franquia.com",
  "role": "franchisee" | "master" | "staff",
  "franchiseId": "muffato-quintino",
  "staffId": null (admin) | "uuid-staff" (colaborador),
  "displayName": "Rodrigo Souza"
}
```

**Métodos:**
```js
Auth.login(email, password)
Auth.logout()
Auth.getSession()              // null se não logado
Auth.requireAuth(role)         // throw + redirect se não autorizado
```

### 5. Service Worker (`sw.js`)

**Versão:** `mp-v<NNN>` (bumpar a cada deploy)

**Estratégias:**
1. **Install:** precache `PRECACHE_URLS` (HTML, CSS, JS core, imagens) + `CDN_PRECACHE_URLS` (Firebase SDK fixed version)
2. **Activate:** limpa caches antigos + `client.navigate()` força reload de TODAS as abas (sem F5 manual)
3. **Fetch:**
   - Cache-first pra static (CSS, JS, img)
   - Network-first pra HTML (com fallback cache se offline)
   - Network-only pra Firestore APIs

**Push notifications:** VAPID key registrada em `sw.js` linha 5. Handler em `sw.js` listener `push`.

### 6. Belinha (Vercel API)

**Endpoints `api/*.js`:**
- `webhook.js` — Meta WhatsApp Business webhook (POST)
- `verify.js` — Meta webhook handshake (GET)
- `transcribe.js` — POST { audioUrl } → Groq Whisper → texto
- `belinha-chat.js` — POST { history, message } → Claude → reply
- `train-belinha.js` — POST { fid, correctness } → atualiza knowledge base
- `send-push.js` — POST { uid, title, body } → Firebase Cloud Messaging

**Environment Vars (Vercel dashboard):**
```
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
WHATSAPP_TOKEN=EAAxxxxx
WHATSAPP_PHONE_ID=12345
META_VERIFY_TOKEN=milkypot_secret_2026
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

---

## Fluxos críticos

### A. Funcionário bate ponto

```
[Celular Amanda] /colaborador/index.html
   ↓ fnBaterPonto()
1. Pega geolocation → Geofence.checkInside(lat, lng, loja.lat, loja.lng)
2. Abre camera → captureSelfie() → dataURL (após countdown 3..2..1)
3. (opcional, graceful) FaceRecognition.checkMatch(selfie, staff.referenceDescriptor)
4. TimeClock.recordPunch(fid, pin, options) → cria record com:
   - id, nsr++, timestamp (UTC ISO), staffId
   - type (entrada/almoco_saida/almoco_volta/saida) auto-inferido
   - hash SHA-256
   - selfie (dataURL), faceMatch, geolocation, deviceInfo
5. DataStore.addToCollection('time_clock_records', fid, record)
   ↓ pull+merge (race-safe)
   ↓ Firestore sync (Background)
6. [Admin PC] DataStore listener dispara 'mp_remote_update'
   ↓ ptScheduleRerender() → ptLoadHoje() (re-render automático)
7. [Admin PC] Amanda aparece no quadro "Hoje" com 12:44 + 📷 selfie + ✎ ajustar
```

### B. Admin ajusta hora errada

```
[Admin PC] painel/ponto.html
   ↓ Click no 12:44 (tdHora)
1. ptAbrirEditarPonto(recordId, currentHHMM) abre modal
2. Admin digita novo horário "12:50" + motivo
3. TimeClock.adjustRecord(recordId, novoHora, motivo, adminUid):
   - Marca original.adjusted = true (não deleta!)
   - Cria NOVO record com:
     - adjustedFrom: originalId
     - nsr++ (continua sequencial)
     - timestamp recalculado com SP date
     - audit log: { changedBy, motivo, oldHora, newHora }
4. DataStore.addToCollection sincroniza
5. Re-render: admin vê 12:50 (não 12:44)
6. Funcionária no celular vê espelho atualizado também
```

### C. Holerite mensal (final do mês)

```
[Admin PC] painel/folha.html → aba Holerite
   ↓ folhaGerarHolerite(staffId, ano, mes)
1. PayrollCompliance.gerarHolerite(fid, sid, 2026, 5):
   a. TimeClock.computeMonth(fid, sid, 2026, 5) → espelho do mês
   b. Calcula proventos:
      - Salário base proporcional (dias trabalhados / dias mês)
      - HE 50% × valor_hora × (extras min / 60)
      - Adicional noturno 20% (se aplicável)
      - DSR sobre HE/noturno (Súmula 172 TST)
      - Salário-família (se filho ≤14 + salário ≤teto)
   c. Calcula descontos:
      - DSR perdido (faltas sem justificativa)
      - Faltas sem justificativa
      - INSS escalonado (tabela 2025)
      - IRRF escalonado (tabela 2025) — usa simplificado se menor
      - VT 6% legal (se opta)
      - VR cota empregado (se acordo)
   d. Calcula FGTS depositado (informativo, 8%, empresa paga)
2. Retorna { proventos[], descontos[], totais }
3. PayrollCompliance.holeriteHTML(h, franchise) → HTML
4. window.print() → PDF via browser
```

### D. Belinha responde WhatsApp

```
[Cliente] WhatsApp → mensagem "queria saber o preço do tradicional"
   ↓ Meta envia POST → /api/whatsapp/webhook
1. webhook.js valida META_VERIFY_TOKEN
2. Salva mensagem em belinha_conversations (Firestore)
3. Se tipo = audio → /api/transcribe (Groq Whisper) → texto
4. Monta context:
   - Histórico últimas 10 msgs
   - Cardápio da franquia (DataStore.getCollection('products', fid))
   - Knowledge base treinada (belinha_learnings_<fid>)
   - Persona Belinha (nunca revelar IA, tom vendedora real, etc)
5. POST /api/belinha-chat (Anthropic Claude)
6. Resposta → POST Meta API → cliente recebe
7. Salva resposta em belinha_conversations (status: sent)
8. [Admin painel/copilot-belinha.html] vê conversa em tempo real
   - Pode "✅ resposta boa" → reforça learning
   - Pode "❌ corrigir" + texto melhor → adiciona ao learning
```

---

## Anatomia de um arquivo `painel/*.html` típico

```html
<!DOCTYPE html>
<html>
<head>
  <!-- meta + título + manifesto PWA -->
  <link rel="stylesheet" href="../css/style.css?v=mp-vNNN">
  <link rel="stylesheet" href="../css/shared-panel.css?v=mp-vNNN">
</head>
<body>
  <div class="shared-panel">
    <aside class="sidebar">...</aside>
    <main class="panel-main">
      <header>...</header>
      <div class="panel-content">
        <!-- TABS -->
        <button class="pt-tab active" onclick="ptSwitchTab('hoje', this)">Hoje</button>
        ...
        <!-- PANELS -->
        <div class="pt-panel active" id="pt-tab-hoje">
          <!-- conteúdo da tab -->
        </div>
        ...
      </div>
    </main>
  </div>

  <!-- Firebase + módulos core -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="../js/core/utils.js?v=mp-vNNN"></script>
  <script src="../js/core/datastore.js?v=mp-vNNN"></script>
  <script src="../js/core/auth.js?v=mp-vNNN"></script>
  <script src="../js/core/time-clock.js?v=mp-vNNN"></script>
  <!-- ... outros módulos da página -->

  <script>
    // Auth guard
    if (!Auth.requireAuth('franchisee')) throw new Error('Not authorized');
    var session = Auth.getSession();
    var franchiseId = session.franchiseId;

    // Funções da página (prefixo pt*)
    function ptSwitchTab(name, btn) { ... }
    function ptLoadHoje() { ... }
    // ...

    // INIT
    ptLoadHoje();
  </script>
</body>
</html>
```

---

## Padrões críticos

### Padrão A: Função compute* (read-only)

```js
function computeDay(franchiseId, staffId, dateStr) {
    // 1. Pega data sources (DataStore.getCollection)
    // 2. Filtra/agrega
    // 3. Retorna estrutura nova SEM mutar nada
    return { ... };
}
```

Stateless. Pode chamar quantas vezes quiser. Não tem side effect.

### Padrão B: Função save*/add*/update* (mutation)

```js
function addJustification(franchiseId, staffId, justData) {
    // 1. Valida (lança erro se inválido)
    // 2. Cria objeto com id + timestamp + audit fields
    // 3. DataStore.addToCollection() — NUNCA direct DataStore.set
    // 4. Audit log se relevante
    // 5. Retorna { success, id } ou { success: false, error }
}
```

### Padrão C: UI render

```js
function ptRenderTable(items) {
    var html = items.map(function(item) {
        return '<tr><td>' + escapeHtml(item.name) + '</td>...</tr>';
    }).join('');
    document.getElementById('myTable').innerHTML = '<tbody>' + html + '</tbody>';
}
```

**SEMPRE** `escapeHtml(x)` (= `Utils.escapeHtml`) em strings que podem ter `<`, `>`, `&`. Senão = XSS.

### Padrão D: Modal

```js
function ptAbrirModal(data) {
    document.getElementById('myModal').style.display = 'flex';
    // popular campos
}
function ptFecharModal() {
    document.getElementById('myModal').style.display = 'none';
}
```

HTML:
```html
<div class="modal" id="myModal" style="display:none">
  <div class="modal-content">...</div>
</div>
```

---

## Onde os bugs nascem (top 5)

1. **Timezone (~40% dos bugs):** sempre que vir `new Date()` num código, suspeite
2. **Cache SW antigo (~20%):** "deu deploy e não atualizou" — bumpar versão
3. **Sync collection nova não configurada (~15%):** adicione em `_publicSyncDocs` + `_isMergeableListDoc`
4. **Mudança em time-clock.js sem entender NSR (~10%):** NSR é sagrado, não pode ter lacuna
5. **XSS por falta de escapeHtml (~5%):** especialmente em campos de texto livre

---

## Quem é quem (papéis no sistema)

- **Master admin (1 pessoa):** veja `painel/master/*` — cria franquias, gerencia plano
- **Franqueado (1 por loja):** veja `painel/*` — todas as ferramentas operacionais
- **Staff (atendente, sorveteiro):** veja `colaborador/*` — bate ponto, vê banco, solicita
- **Cliente final:** veja `/` raiz — cardápio, fidelidade, pedido

Autenticação Firebase por email. Role/franchiseId definido em custom claims ou em doc `users/<uid>`.
