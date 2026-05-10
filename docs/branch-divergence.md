# Branch Divergence — claude/milkypot-franchise-site-gSHDA vs origin/main

**Detectado em:** 2026-05-10
**Severidade:** P0 (bloqueia deploy seguro)

## Estado

| Ref | `sw.js` CACHE_VERSION |
|---|---|
| `origin/main` (GitHub) | `mp-v186` |
| `origin/claude/milkypot-franchise-site-gSHDA` ("main" interno) | `mp-v101` |
| `claude/fervent-jang-a9aaf0` (esta worktree, baseada em gSHDA) | `mp-v102` (bumped) |

A branch interna usada como "main do desenvolvimento" (`claude/milkypot-franchise-site-gSHDA`) está **85+ versões atrás** do branch `main` do GitHub. Belinha e PRs subsequentes evoluíram em `origin/main` sem propagar de volta.

## Risco

- Qualquer merge desta worktree → `gSHDA` → `main` (GitHub) gerará conflitos massivos em `sw.js` e provavelmente em outros arquivos editados pela Belinha (paineis, HTML estático, conteúdo).
- Se o deploy real está sendo feito a partir de `origin/main`, esta worktree NÃO está alinhada com produção real — auditoria precisa ser re-rodada em `origin/main` pra refletir o sistema vivo.
- Se o deploy é a partir de `gSHDA`, há features e correções vivas em `origin/main` que estão fora de produção há semanas.

## Próximo passo recomendado

Decidir entre:

1. **`origin/main` é a verdade.** Rebase `gSHDA` em `main`, resolver conflitos, e desta worktree em `gSHDA`. Re-rodar auditoria em cima de `main`.
2. **`gSHDA` é a verdade.** Force-merge `gSHDA` → `main` (push), aceitando perda dos commits órfãos em `main`. Belinha precisa parar de empurrar em `main` se não é canônico.
3. **Manter divergência intencional.** Documentar qual branch é deploy oficial em README + restringir Belinha à branch correta.

## Achados úteis para a Belinha

A Belinha (trigger `trig_01S9KwARwzajn7h73NR4PU6p`) opera em `claude/belinha-melhoria-continua`. Esta branch também precisa entrar na decisão acima — ou ela tem auto-merge para o canônico, ou ela diverge silenciosamente.
