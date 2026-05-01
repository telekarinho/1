#!/usr/bin/env bash
# MilkyPot - install-guards
# Instala git hooks locais para impedir sobrescrita acidental dos arquivos
# criticos do sistema. Roda uma vez por PC (e sempre que clonar em maquina
# nova).
#
# Uso:
#   bash scripts/install-guards.sh

set -e
cd "$(dirname "$0")/.."

HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
  # Worktree: .git e um arquivo apontando para o repo principal
  HOOKS_DIR=$(git rev-parse --git-path hooks 2>/dev/null)
fi

if [ ! -d "$HOOKS_DIR" ]; then
  echo "ERRO: nao encontrei .git/hooks (estrutura de repo nao reconhecida)."
  exit 1
fi

# ─── pre-push: roda check-manifest antes de deixar o push sair ──
cat > "$HOOKS_DIR/pre-push" <<'HOOK'
#!/usr/bin/env bash
# MilkyPot pre-push: bloqueia push se arquivos criticos faltarem.
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
if [ -f scripts/check-manifest.sh ]; then
  bash scripts/check-manifest.sh || {
    echo ""
    echo "⚠️  Para pular (apenas em emergencia autorizada):"
    echo "    git push --no-verify"
    exit 1
  }
fi
exit 0
HOOK
chmod +x "$HOOKS_DIR/pre-push"

# ─── post-merge: avisa se o merge puxou um revert perigoso ──
cat > "$HOOKS_DIR/post-merge" <<'HOOK'
#!/usr/bin/env bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
if [ -f scripts/check-manifest.sh ]; then
  bash scripts/check-manifest.sh || {
    echo ""
    echo "🚨 Este merge deixou o repo em estado INCONSISTENTE!"
    echo "   NAO FACA COMMIT/PUSH antes de restaurar os arquivos faltantes."
    exit 1
  }
fi
exit 0
HOOK
chmod +x "$HOOKS_DIR/post-merge"

echo "✅ Guardas instalados em: $HOOKS_DIR"
echo "   - pre-push  : bloqueia push que apaga arquivo critico"
echo "   - post-merge: alerta apos merge que deixe repo inconsistente"
echo ""
echo "Dica: rode 'bash scripts/check-manifest.sh' a qualquer momento para"
echo "verificar o estado atual do repo."
