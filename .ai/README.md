# 🤖 .ai/ — Contexto pra IAs e Devs

Bem-vindo. Se você é uma IA ou dev novo nesse repo, **leia esses 4 arquivos em ordem** e você sabe 95% do que precisa:

1. **[../CLAUDE.md](../CLAUDE.md)** — TLDR de 2min do sistema
2. **[SYSTEM_MAP.md](SYSTEM_MAP.md)** — Arquitetura detalhada + fluxos críticos
3. **[RECENT_FIXES.md](RECENT_FIXES.md)** — Bugs já resolvidos (não repita)
4. **[DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md)** — Comandos prontos por sintoma

Total: ~10 min de leitura → resolve qualquer issue em minutos.

## Princípios não-negociáveis

1. **Timezone SP sempre** — `Utils.todayKey()`, nunca `toISOString().slice(0,10)`
2. **Zero bloqueio admin** — pendências via `CLTCompliance.getAdminPendencies()`
3. **Imutabilidade ponto** — registros nunca editados, sempre versionados
4. **Belinha nunca revela ser IA** — persona humana sempre
5. **NSR sequencial sem lacuna** — fiscalização MTE pega isso
6. **Sync via DataStore.addToCollection** — nunca write direto sem merge
7. **Bump SW versão a cada deploy** — senão cache antigo trava

## Antes de mergear PR

- [ ] SW versão bumped (`sw.js` linha 1-2)
- [ ] Arquivos novos em `PRECACHE_URLS`
- [ ] Collections novas em `_publicSyncDocs` + `_isMergeableListDoc`
- [ ] Cache buster `?v=mp-vNNN` nos `<script src>` (se mudou JS core)
- [ ] **Atualizei [RECENT_FIXES.md](RECENT_FIXES.md)** se foi bug significativo
- [ ] Test plan no PR description

## Padrão de PR

```markdown
## Summary
- O que mudou em 1 frase
- Por que

## Test plan
- [ ] Caso 1
- [ ] Caso 2
```
