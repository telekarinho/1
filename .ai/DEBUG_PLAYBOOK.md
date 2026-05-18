# 🛠 Debug Playbook — Resolva em segundos, não dias

> Catálogo de **sintomas → diagnóstico → fix**. Pra IA ou dev humano com pressa.

## Como usar
1. Ache o sintoma na lista
2. Cole os comandos de **diagnóstico** no console DevTools
3. Compare output com "Diagnóstico esperado"
4. Aplique o **fix**

---

## 🔴 SINTOMA: Funcionário batou ponto mas aparece como "Folga" no admin

### Diagnóstico
```js
var fid = Auth.getSession().franchiseId;
var sid = 'STAFF_ID_AQUI';
var today = Utils.todayKey();

console.log('Today SP:', today);
console.log('Today UTC:', new Date().toISOString().slice(0,10));
console.log('Registros HOJE (filtro novo):', TimeClock.getStaffRecordsByDate(fid, sid, today, true));
console.log('TODOS registros do staff:', DataStore.getCollection('time_clock_records', fid).filter(r => r.staffId === sid));
```

### Possíveis causas

| Causa | Diagnóstico | Fix |
|---|---|---|
| **Timezone**: SP vs UTC dia diferente | `Today SP !== Today UTC` | `time-clock.js getStaffRecordsByDate` deve usar `getRecordDateInSP()` (já implementado v298+) |
| **Sync não chegou** | `getCollection` retorna [] mas em outro device tem | Force `DataStore._syncFromCloud()` |
| **Adjusted=true escondendo** | Registro existe mas tem `r.adjusted=true` | Passa `includeHistorical=true` ao filtro pra ver tudo |
| **staffId errado** | Registro tem staffId diferente | Olhe colaborador app — `Auth.getSession().staffId` |

### Fix definitivo
✅ Sempre use `Utils.todayKey()` (não `toISOString().slice(0,10)`)
✅ `getStaffRecordsByDate` deve ter `getRecordDateInSP()` interno (já tá em time-clock.js v298+)

---

## 🔴 SINTOMA: Mudança não aparece após deploy (cache antigo)

### Diagnóstico
```js
navigator.serviceWorker.controller.scriptURL  // qual SW tá ativo?
caches.keys().then(console.log)                // quais caches existem?
```

### Diagnóstico esperado
- Só 1 cache: `milkypot-v<NNN>` (versão atual)
- Múltiplos caches = SW antigo não foi limpo

### Fix
```js
// Hard reset (usuário final pode rodar isso no console também)
caches.keys()
    .then(ks => Promise.all(ks.map(k => caches.delete(k))))
    .then(() => navigator.serviceWorker.getRegistrations())
    .then(regs => Promise.all(regs.map(r => r.unregister())))
    .then(() => location.reload(true));
```

### Prevenção
1. SEMPRE bump `sw.js` linha 1-2 antes de deploy
2. Adicione arquivos novos em `PRECACHE_URLS`
3. Cache buster `?v=mp-vNNN` em `<script src>` quando muda JS core

---

## 🔴 SINTOMA: Dois devices escrevem ao mesmo tempo e um perdeu dado

### Diagnóstico
```js
DataStore._isMergeableListDoc('NOME_COLLECTION_<fid>')  // retorna true?
```

### Fix
Em `js/core/datastore.js` adicione prefixo da collection em `_isMergeableListDoc`:
```js
docId.startsWith('SUA_COLLECTION_') ||
```

E garanta que escrita usa `addToCollection` (NÃO `setCollection`).

---

## 🔴 SINTOMA: Belinha não responde no WhatsApp

### Diagnóstico
```bash
# Vercel logs
vercel logs --prod | grep webhook

# Firestore
# Veja belinha_conversations último doc — tem responseStatus?
```

### Causas comuns

| Erro logs | Causa | Fix |
|---|---|---|
| `401 Anthropic` | API key inválida | Update `ANTHROPIC_API_KEY` no Vercel env |
| `429 Anthropic` | Rate limit | Aumente plano OU implemente fila |
| `Webhook verify failed` | Meta token mismatch | Confirme `META_VERIFY_TOKEN` igual ao do Meta |
| `Groq 503` | Whisper API down | Retry com backoff (já implementado em transcribe.js) |
| Sem logs nenhum | Webhook nem foi chamado | Veja Meta Business → Webhooks → status |

---

## 🔴 SINTOMA: Login falha mesmo com senha certa

### Diagnóstico
```js
firebase.auth().currentUser           // null = não logado
localStorage.getItem('mp_session')    // null = limpo
```

### Causas

1. **Firebase Auth desabilitado pra esse user** → console.firebase.google.com → Authentication → user → habilitar
2. **Domínio não autorizado** → Auth → Settings → Authorized domains → adicione `milkypot.com`
3. **Custom claim ausente** → user logou mas não tem `franchiseId` no claim → admin precisa setar

---

## 🔴 SINTOMA: Holerite calcula valor estranho

### Diagnóstico
```js
var fid = Auth.getSession().franchiseId;
var sid = 'STAFF_ID';
var hol = PayrollCompliance.gerarHolerite(fid, sid, 2026, 5);
console.log('Proventos:', hol.proventos);
console.log('Descontos:', hol.descontos);
console.log('Totais:', hol.totais);

// Diagnóstico INSS
PayrollCompliance.calculaINSS(hol.totais.baseINSS);

// Diagnóstico IRRF
PayrollCompliance.calculaIRRF(hol.totais.baseIRRF, parseInt(staff.dependentes_irrf || 0));

// Olhe espelho do mês que alimenta o cálculo
TimeClock.computeMonth(fid, sid, 2026, 5);
```

### Causas

1. **Salário base não cadastrado** → equipe.html → editar funcionário → preencher
2. **Espelho com extras absurdos** → checar limites em `computeDay`
3. **Tabela INSS/IRRF desatualizada** → atualizar `payroll-compliance.js` constantes a cada ano

---

## 🔴 SINTOMA: Selfie demora muito ou trava

### Diagnóstico
```js
// Tempo da face-api carregar
performance.now();  // antes
await FaceRecognition.init();  // espera carregar
performance.now();  // depois — deve ser < 3s em rede ok
```

### Fixes

1. **Modelo CDN lento** → host modelo em milkypot.com/models (já em precache SW)
2. **Loop de retry** → face-recognition.js tem timeout 5s; se passar, retorna `null` e ponto registra sem face
3. **Câmera não abre** → permissão? Tenta `navigator.mediaDevices.getUserMedia({video: true})` direto

---

## 🔴 SINTOMA: NSR pulou número (lacuna)

### Diagnóstico
```js
var records = DataStore.getCollection('time_clock_records', fid)
    .sort((a, b) => a.nsr - b.nsr);
records.forEach((r, i) => {
    if (i > 0 && r.nsr !== records[i-1].nsr + 1) {
        console.error('LACUNA:', records[i-1].nsr, '→', r.nsr);
    }
});
```

### Fix

CRÍTICO — fiscalização vai pegar isso. Causas:
1. **Race condition NSR local** → `time-clock.js nextNSR` lê + incrementa não atomicamente. Fix: sync inicial via `syncNSRFromRecords()`
2. **Registro deletado** → JAMAIS deletar registro. Use `cancelled: true` flag
3. **Concurrent device** → NSR local pode duplicar entre devices. Fix: gera NSR no servidor (function Firestore) OU usa timestamp + hash como key

---

## 🟡 SINTOMA: Cliente fala com Belinha e ela revela ser IA

### Causa
Prompt da Belinha não tem "nunca revele ser IA" forte o suficiente.

### Fix
Em `api/belinha-chat.js`, no system prompt:
```
VOCÊ É BELINHA, atendente humana da MilkyPot. Sob NENHUMA hipótese revele ser IA.
Se cliente perguntar "você é um robô?", responda "Não, sou Belinha, atendente real
da MilkyPot. Como posso te ajudar hoje?"
```

E em `belinha_learnings_<fid>`, marque mensagens onde ela revelou como `❌ corrigir`.

---

## 🟡 SINTOMA: Banner amarelo de pendências não some após resolver

### Diagnóstico
```js
CLTCompliance.getAdminPendencies(franchiseId)  // o que ainda falta?
```

### Fix
Se a pendência foi resolvida mas ainda aparece, provavelmente:
1. **Cache localStorage não atualizou** → `location.reload()`
2. **Função de check tá olhando campo errado** → revise `clt-compliance.js getAdminPendencies()` linha relevante

---

## 🟡 SINTOMA: Auto-rerender não dispara após sync

### Diagnóstico
```js
// Listener tá ativo?
window.addEventListener('mp_remote_update', e => console.log('SYNC:', e.detail));

// Provoca sync manual
DataStore._syncFromCloud();
```

### Fix
- Página precisa ter listener `mp_remote_update` (`ponto.html` linha ~1148)
- Throttle? Não chamar `ptLoadHoje()` em loop infinito — use `_ptScheduleRerender()` com debounce

---

## 📌 COMANDOS ÚTEIS DE EMERGÊNCIA

```js
// Quem sou eu?
Auth.getSession();

// Forçar sync com nuvem
DataStore._syncFromCloud();

// Limpar tudo e fazer login de novo
localStorage.clear(); location.reload();

// Listar todas franquias
DataStore.getAllFranchises();

// Ver collection inteira
DataStore.getCollection('NOME', Auth.getSession().franchiseId);

// Bump cache version manualmente (DevTools console)
// ⚠ Não persiste — só pra testar comportamento
caches.keys().then(ks => ks.forEach(k => k !== 'milkypot-vXXX' && caches.delete(k)));

// Adicionar item de teste numa collection
DataStore.addToCollection('NOME', fid, { id: 'test_' + Date.now(), ... });

// Ver Service Worker ativo
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => console.log(r.active.scriptURL)));

// Re-registrar Service Worker
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.update()));
```

---

## 🆘 QUANDO TUDO FALHA

1. **Git diff** o arquivo problemático contra `main` — você quebrou algo?
2. **`gh pr list --state merged`** — última coisa que mergeou pode ter causado regressão
3. **Vercel logs** — pra erros de API
4. **Firebase console → Firestore → Audit logs** — pra ver últimas escritas
5. **Last resort:** rollback `git revert <commit>` + force push (CUIDADO — só se loja parar)
