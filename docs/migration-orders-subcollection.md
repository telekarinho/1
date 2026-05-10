# Runbook: Migração `datastore/orders_*` → subcoleção

**Owner:** jocimarrodrigo@gmail.com
**Origem:** ADR-001
**Esforço estimado:** 1h (loja pequena) a 3h (loja com 10k+ pedidos)

## Quando rodar

Quando uma destas condições for verdade:

- Doc `datastore/orders_{fid}` se aproxima de 800 KB (consultar `firestore` console).
- Painel financeiro/PDV demora >3s pra carregar lista de pedidos.
- Loja vai expandir pra 3ª unidade (cada nova franquia multiplica risco).

## Pré-requisitos

1. Cloud Functions deployed com `migrateOrdersToSubcollection` (já está, PR atual).
2. Adapter `js/core/datastore-subcollection.js` deployed (já está).
3. Backup do Firestore feito manualmente (`gcloud firestore export gs://milkypot-backup-pre-migration`).
4. Janela de baixa demanda (segunda-feira 06h00 BRT, por exemplo).

## Roteiro

### Etapa 1 — DRY RUN (validação, 1 min)

Via shell autenticado como super_admin (mesmo user que loga no painel):

```js
// No DevTools do /painel após login:
firebase.functions().httpsCallable('migrateOrdersToSubcollection')({
  franchiseId: 'muffato-quintino',
  dryRun: true
}).then(r => console.log(r.data));
```

Resposta esperada: `{ total: N, skipped: N, migrated: 0, errors: [] }`.

Se `errors` tiver entradas — investigar antes de prosseguir.

### Etapa 2 — Ativar dual-write (5 min)

No painel admin (DevTools console):

```js
DataStore.set('feature_flags', { useSubcollectionOrders: true });
```

Ou alternativa: adicionar em `js/core/constants.js`:

```js
const MP = {
  // ...
  USE_SUBCOLLECTION_ORDERS: true,
};
```

A partir desse momento, novos pedidos são gravados em **ambos** (legado + subcoleção). Verificar no `firestore` console que `franchises/muffato-quintino/orders/` começou a ser populado.

### Etapa 3 — Migração real (1-3h)

```js
firebase.functions().httpsCallable('migrateOrdersToSubcollection')({
  franchiseId: 'muffato-quintino',
  dryRun: false
}).then(r => console.log(r.data));
```

Resposta esperada: `{ total: N, migrated: N, skipped: 0, errors: [] }`.

Se `errors` > 0 — investigar por erro. Migração é idempotente (re-rodar é seguro).

### Etapa 4 — Verificação (1 min)

```js
firebase.functions().httpsCallable('verifyOrdersMigration')({
  franchiseId: 'muffato-quintino'
}).then(r => console.log(r.data));
```

Esperado: `{ legacyCount: N, subCount: N, ok: true, delta: 0 }`.

Se `delta < 0` (subCount menor) — algo falhou. Re-rodar Etapa 3.

### Etapa 5 — Cutover (15 min)

Quando feature flag ativa e contagens batem:

1. Refactor de leituras críticas para usar `DataStoreSub.getOrdersPaginated()` ou `DataStoreSub.listenOrders()` em vez do `DataStore.get('orders_{fid}')` em:
   - `painel/pedidos.html`
   - `painel/financeiro.html`
   - `painel/pdv.html` (leitura, não write — write continua dual)
2. Deploy + verificar painel funciona normalmente
3. **Não deletar `datastore/orders_{fid}` ainda** — manter por 30 dias como rollback.

### Etapa 6 — Cleanup (após 30 dias estáveis)

1. Verificar que ninguém está mais lendo `datastore/orders_{fid}` (logs).
2. Mudar adapter para single-write (só subcoleção):
   ```js
   // js/core/datastore-subcollection.js — desabilitar legacy mirror
   MP.LEGACY_ORDERS_DISABLED = true;
   ```
3. Após 30 dias estáveis, deletar via console: `datastore/orders_{fid}`.

## Rollback (se algo quebrar)

A qualquer ponto antes da Etapa 6:

```js
DataStore.set('feature_flags', { useSubcollectionOrders: false });
```

PDV/painel voltam a ler/escrever apenas `datastore/orders_{fid}` (que continua sendo populado por dual-write).

Sem perda de dados. Janela máxima de impacto: 1 minuto entre desativar a flag e o reload do painel.

## Métricas a acompanhar (semana 1 pós-cutover)

- Tempo de carregamento do `painel/pedidos.html` (deve cair >50%).
- Custos Firestore por dia (deve cair em reads, subir levemente em writes — net positivo).
- Erros em `error_log` com fonte `subcollection-*`.
- Sentry (quando configurado) — alerta de regressão.

## Quando migrar outras coleções

Mesmo runbook serve pra:

- `datastore/caixa_*` → `franchises/{fid}/cashflow/{date}`
- `datastore/finances_*` → `franchises/{fid}/finance_events/{eventId}`
- `datastore/pdv_tabs_*` → `franchises/{fid}/open_tabs/{tabId}`

Recomenda-se migrar **uma coleção por vez**, esperar 7 dias estáveis entre cada.
