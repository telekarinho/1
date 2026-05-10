# ADR-001: Modelo de dados Firestore (mono-bucket vs subcoleção)

**Status:** Proposed
**Data:** 2026-05-10
**Decisor:** jocimarrodrigo@gmail.com (pendente)
**Origem:** auditoria total (Software Architect agent)

## Contexto

Hoje, todos os dados operacionais ficam em uma única coleção `datastore/` com docs nomeados `orders_{fid}`, `caixa_{fid}`, `pdv_tabs_{fid}`, `finances_{fid}`. Cada doc carrega o **array inteiro** da franquia naquele dia/período (`value: JSON.stringify([...])`).

A regra Firestore (`firestore.rules:50-108`) já tem subcoleção alternativa preparada em `franchises/{fid}/orders/{orderId}`, mas o cliente não usa.

## Problema

1. **Limite hard de 1 MB por doc**. Com loja cheia (90+ pedidos/dia, cada pedido detalhado), `orders_{fid}` estoura entre 20 e 30 franquias.
2. **Sem paralelismo de write**. Dois PCs no PDV gravando o array completo sobrescrevem um ao outro — merge defensivo no `datastore.js:295-299` admite o problema.
3. **Egress alto**. Cada novo pedido força read+write do array inteiro. 100 franquias × 90 pedidos/dia × ~5 KB/doc = ~45 MB/dia só na operação de pedidos.
4. **Listener pesado**. `onSnapshot` em `datastore/orders_{fid}` sempre baixa o array inteiro. Não dá pra paginar.

## Alternativas

### A) Subcoleção `franchises/{fid}/orders/{orderId}` (recomendada)
- Cada pedido = 1 doc independente
- Listeners podem filtrar por status / data
- Custos previsíveis (write/read por doc)
- Suporta queries indexadas
- **Migration:** dump dos arrays existentes → fan-out em docs individuais (script offline)

### B) Manter `datastore/orders_{fid}` (atual)
- Sem migration risk
- Rápido pra construir, devagar pra escalar
- Custo de mudança aumenta com cada franquia nova

### C) Híbrido: array para "atualizações em vôo" + subcoleção para fechados
- Adiciona complexidade sem resolver o limite de 1 MB no array em vôo
- Não recomendado

## Decisão recomendada: **A (subcoleção)**

## Consequências

**Reversível?** Não, depois de 6 meses de dados em produção.

**Esforço:** 3-5 dias dev. Migração com janela de manutenção (loja fechada).

**Trade-off:** breakage de listeners atuais → exige refactor coordenado de `js/core/datastore.js` (esp. linhas 126-136 + listeners), painel, PDV, financeiro.

## Próxima ação

Dono confirma decisão (A/B/C). Se A, marcar issue épico no Linear/GitHub com checklist:
- [ ] Script de export do `datastore/orders_*` → subcoleção
- [ ] Adaptador em `js/core/datastore.js` que aceita ambos durante transição
- [ ] Refactor de listeners no painel
- [ ] Refactor de PDV writes
- [ ] Migration em janela de baixa demanda
- [ ] Remover legado `datastore/orders_*` após validação
