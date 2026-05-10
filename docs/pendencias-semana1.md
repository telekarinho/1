# Pendências da Semana 1 — Auditoria Total

Itens que dependem de decisão ou ação fora do código. Cole pro responsável.

## 1. GCP Budget Alert (Firebase) — 10 min

**Por quê:** Firestore tem writes públicos (sendo gradualmente fechados). Bot/abuso pode disparar bill em horas.

**Como fazer:**
1. Abrir https://console.cloud.google.com/billing → selecionar conta de cobrança do projeto `milkypot-ad945`.
2. Menu "Budgets & alerts" → "Create budget".
3. Nome: `MilkyPot Operacional`.
4. Orçamento: **R$ 300/mês** (ajustar conforme conta).
5. Threshold alerts:
   - 50% (R$ 150) → email
   - 90% (R$ 270) → email + SMS
   - 100% (R$ 300) → email + SMS + parar conta? (NÃO marcar "disable billing automatically" pra não derrubar produção).
6. Salvar.

## 2. Sentry free tier — 30 min

**Por quê:** Substitui `js/core/error-tracking.js` caseiro (sem alerta, sem agregação). Alerta Slack/email em erro novo.

**Como fazer:**
1. https://sentry.io/signup → criar conta (free tier: 5k erros/mês, suficiente pra início).
2. Criar projeto: tipo "JavaScript" / "Browser".
3. Copiar a DSN (formato `https://abc@o123.ingest.sentry.io/456`).
4. Me passar a DSN. Eu integro em `js/core/error-tracking.js` mantendo o append no Firestore como fallback.

## 3. Branch canônica — decisão arquitetural

**Estado:** `origin/main` (GitHub) está em `sw.js mp-v186`. `origin/claude/milkypot-franchise-site-gSHDA` (branch usada como "main" interna do worktree atual) está em `mp-v101` — 85 versões atrás.

**Decidir:**
- **(A) `origin/main` é a verdade.** Esta worktree precisa ser rebased em `origin/main`. Mais correto, mas exige resolver conflitos.
- **(B) `gSHDA` é a verdade.** Force-merge `gSHDA` → `main`, aceitando perda dos commits em `main`. Investigar quem está commitando em `origin/main` (Belinha? PRs antigos?).
- **(C) Manter divergência.** Documentar qual branch faz deploy real (Vercel / Firebase Hosting) e restringir Belinha + colaboradores à branch correta.

**Recomendação:** opção (A). Branch `main` no GitHub é convenção universal; alinhar evita confusão futura.

Detalhes em [branch-divergence.md](branch-divergence.md).

## 4. CI mínimo — 1h (eu posso fazer quando autorizar)

Adicionar ao `.github/workflows/deploy.yml`:
- `npm audit --audit-level=high` (falha PR se vuln crítica em deps)
- Lint básico HTML (`htmlhint`)
- Lint JS (`eslint --no-eslintrc --rule '{"no-undef":"error"}'`)
- Verificar `CACHE_VERSION` do `sw.js` > versão anterior no main

## 5. Migração subcoleção Firestore (`orders_*`) — pós-soft-launch

**Por quê:** doc `datastore/orders_{fid}` é array gigante; estoura 1MB com loja cheia + impede paralelismo de write.

**Recomendação:** migrar pra `franchises/{fid}/orders/{orderId}` (rules já preparadas em `firestore.rules:128-148`).

**Esforço:** 3-5 dias dev. Migração com janela de manutenção.

## Owner

Para todos os itens 1-3: **jocimarrodrigo@gmail.com**

Para item 4-5: aguardar ok do dono.
