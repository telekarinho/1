#!/usr/bin/env bash
# bump-cache-busters.sh — atualiza ?v=mp-vXXX em TODOS os HTML/JS
# pra a nova versão do SW. Roda automaticamente antes de bump de SW.
#
# Uso: bash scripts/bump-cache-busters.sh v234
# (assume que sw.js JÁ está atualizado pra v234)

set -e
NEW_VER="$1"
if [ -z "$NEW_VER" ]; then
    # Auto-detecta do sw.js
    NEW_VER=$(grep -oE "mp-v[0-9]+" sw.js | head -1 | sed 's/mp-//')
    if [ -z "$NEW_VER" ]; then
        echo "❌ Use: bash scripts/bump-cache-busters.sh v234"
        exit 1
    fi
fi

# Aceita v234 ou 234
NEW_VER="${NEW_VER#v}"
NEW_TAG="mp-v${NEW_VER}"

echo "🔄 Bumping cache busters → ${NEW_TAG}"

# Lista todos os HTML que tem ?v=mp-vXXX
FILES=$(grep -lE '\?v=mp-v[0-9]+' --include='*.html' -r . 2>/dev/null | grep -vE '(node_modules|\.tmp_|functions/)' || true)

if [ -z "$FILES" ]; then
    echo "Nenhum arquivo com cache buster encontrado."
    exit 0
fi

COUNT=0
for f in $FILES; do
    # macOS sed precisa de '' depois de -i; Linux/Git Bash não
    if sed --version 2>&1 | grep -q GNU; then
        sed -i -E "s/\?v=mp-v[0-9]+/?v=${NEW_TAG}/g" "$f"
    else
        sed -i '' -E "s/\?v=mp-v[0-9]+/?v=${NEW_TAG}/g" "$f"
    fi
    COUNT=$((COUNT+1))
done

echo "✅ ${COUNT} arquivos atualizados pra ${NEW_TAG}"
echo "📝 Lembre de: git add -A && git commit -m 'bump cache busters → ${NEW_TAG}'"
