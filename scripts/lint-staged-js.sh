#!/bin/sh
# Pre-commit: roda ESLint --no-undef apenas nos arquivos JS staged.
# Se ESLint não estiver instalado, skip silenciosamente (não bloqueia commit
# em devs sem setup). CI tem ESLint instalado e roda full em PR.
#
# Pra ativar local: npm i -g eslint  OU  npx eslint (com node_modules)
# Pra desabilitar: git config milkypot.skiplint true

if [ "$(git config --get milkypot.skiplint)" = "true" ]; then
    echo "lint-staged: skipped (milkypot.skiplint=true)"
    exit 0
fi

# Pega .js + inline scripts em .html staged
JS_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(js|html)$' || true)
if [ -z "$JS_FILES" ]; then
    exit 0
fi

# Tenta encontrar ESLint
ESLINT=""
if command -v eslint > /dev/null 2>&1; then
    ESLINT="eslint"
elif [ -x "./node_modules/.bin/eslint" ]; then
    ESLINT="./node_modules/.bin/eslint"
elif command -v npx > /dev/null 2>&1; then
    # npx baixa eslint se disponível
    if npx --no-install eslint --version > /dev/null 2>&1; then
        ESLINT="npx --no-install eslint"
    fi
fi

if [ -z "$ESLINT" ]; then
    echo "⚠️ lint-staged: ESLint não encontrado, pulando (instale com: npm i -g eslint)"
    exit 0
fi

# Filtra só .js (HTML inline lint precisa de plugin html — fica pra CI)
JS_ONLY=$(echo "$JS_FILES" | grep '\.js$' || true)
if [ -z "$JS_ONLY" ]; then
    exit 0
fi

echo "🔍 lint-staged: rodando ESLint em $(echo "$JS_ONLY" | wc -l | tr -d ' ') arquivo(s) JS..."
echo "$JS_ONLY" | xargs $ESLINT --no-eslintrc --config .eslintrc.json --rule '{"no-undef": "error"}' --no-error-on-unmatched-pattern
RC=$?
if [ $RC -ne 0 ]; then
    echo "❌ lint falhou — corrija os erros acima ou pule com: git commit --no-verify"
    echo "   (Para desabilitar permanentemente: git config milkypot.skiplint true)"
    exit 1
fi
echo "✅ lint ok"
exit 0
