# ADR-002: Consolidação de Hosting (Vercel vs Firebase Hosting vs GitHub Pages)

**Status:** Proposed
**Data:** 2026-05-10
**Decisor:** jocimarrodrigo@gmail.com (pendente)
**Origem:** auditoria total (Software Architect agent)

## Contexto

Três alvos de hosting servem o mesmo código:

1. **Vercel** (`vercel.json`) — hospeda também as `api/` (functions Node)
2. **Firebase Hosting** (`firebase.json` bloco `hosting`) — serve toda a raiz
3. **GitHub Pages** (`.github/workflows/deploy.yml` job `deploy-pages`)

CNAME aponta para um só (Vercel). Mas Belinha pode fazer deploy via outro caminho. SW cache (`sw.js`) pode ser servido em versões diferentes dependendo do entry point.

## Problema

- **Cache stale**: PWA instalado pode ter SW antigo de origem A enquanto site novo está em origem B.
- **Custos duplicados**: pipeline GitHub Pages roda sem necessidade.
- **Conflito de rewrites**: `firebase.json` declara rewrites (`/clube`, `/f/**`) que Vercel pode ou não respeitar dependendo de qual responde.
- **Risco de deploy fantasma**: contributor pode pushar pra branch que dispara um deploy ignorado pelos demais.

## Alternativas

### A) Vercel como entry único (recomendada)
- Mantém `api/` no mesmo origin
- Remove bloco `hosting` do `firebase.json` e job `deploy-pages` do workflow
- Firebase só para `firestore:rules` + `functions`

### B) Firebase Hosting único
- Remove Vercel
- Mover `api/*` para Cloud Functions
- Custo: refactor de 8+ funções Node

### C) GitHub Pages único
- Estático puro — quebra `api/`
- Não recomendado para sistema com backend

## Decisão recomendada: **A (Vercel + Firebase só backend)**

## Consequências

**Reversível?** Sim (volta a configurar Firebase Hosting), mas resolver pré-inauguração evita gambiarra em produção.

**Esforço:** 30 min.

**Mudanças:**
1. Remover bloco `hosting: {...}` do `firebase.json`
2. Remover job `deploy-pages` de `.github/workflows/deploy.yml`
3. Confirmar que CNAME aponta para Vercel
4. Documentar em README

## Próxima ação

Dono confirma. Se A, criar PR com as 4 mudanças acima.
