# ADR-003: Governança Belinha (autopilot agent)

**Status:** Proposed
**Data:** 2026-05-10
**Decisor:** jocimarrodrigo@gmail.com (pendente)
**Origem:** auditoria total (Software Architect agent)

## Contexto

Belinha (trigger `trig_01S9KwARwzajn7h73NR4PU6p`) roda a cada 2h em `claude/belinha-melhoria-continua`. Edita HTML/JS/docs de forma autônoma. Também existe `Belinha-Iniciar.bat` que roda em PC do dono via cloudflared tunnel.

MEMORY do dono já registra que Belinha causa **conflitos frequentes em `sw.js`** (cache version) quando trabalho paralelo acontece.

## Problema

1. **Sem mutex**: trigger remoto + bat local podem editar paralelamente.
2. **Sem protected paths**: Belinha pode editar `firestore.rules`, `functions/`, `sw.js`, `api/*` — arquivos críticos onde regressão = produção quebrada.
3. **Branch diverge silenciosamente**: `claude/belinha-melhoria-continua` evolui sem squash-merge regular pra main canônica.

## Alternativas

### A) Belinha restrita + CODEOWNERS (recomendada)
- Trigger remoto = único canal autorizado em produção
- Bat local **só em dev** (modo testes)
- CODEOWNERS exige human-approve em paths críticos
- Auto-merge nightly de `belinha-melhoria-continua` → main

### B) Manter status quo
- Aceita risco
- Não escala com mais agentes

### C) Belinha read-only
- Apenas analise/relatório, sem write
- Perde valor de automação

## Decisão recomendada: **A**

## Mudanças propostas

1. **`.github/CODEOWNERS`** novo arquivo:
   ```
   sw.js                 @telekarinho
   firestore.rules       @telekarinho
   storage.rules         @telekarinho
   functions/**          @telekarinho
   api/admin-*.js        @telekarinho
   api/copilot*.js       @telekarinho
   api/_brain.js         @telekarinho
   .github/workflows/**  @telekarinho
   ```

2. **Branch protection** em main canônica:
   - Exige review do CODEOWNER nos paths acima
   - Status checks obrigatórios passam

3. **Lock distribuído** (opcional, mas recomendado):
   - Cloud Function `acquireBelinhaLock(ttl=2h)` cria doc `belinha_lock/main` com `expiresAt`
   - Trigger remoto checa lock antes de write
   - Bat local respeita lock também

4. **Auto-merge nightly**:
   - GitHub Action que abre PR de `belinha-melhoria-continua` → main e auto-merge se checks passam
   - Belinha não trabalha sobre código stale

## Consequências

**Reversível?** Sim.

**Esforço:** 1h pra CODEOWNERS + branch protection. 2-3h se incluir lock distribuído.

**Trade-off:** Belinha precisa abrir PR em mudanças críticas → não mergeia direto. Sacrifica velocidade pra evitar regressão em produção.

## Próxima ação

Dono confirma. Se A, criar PR adicionando `.github/CODEOWNERS` + configurar branch protection no GitHub.
