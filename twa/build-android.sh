#!/usr/bin/env bash
# ============================================
# MilkyPot — Build APK Android (TWA / Bubblewrap)
# ============================================
# Roda este script pra gerar o APK assinado.
# Pré-requisitos: Java JDK 17+, Node.js 18+, Bubblewrap CLI
#
# Uso:
#   ./build-android.sh           # build debug
#   ./build-android.sh release   # build release (precisa keystore)
# ============================================
set -e

cd "$(dirname "$0")"

MODE="${1:-debug}"
echo "🐑 MilkyPot — Building TWA APK ($MODE)"
echo

# Check pré-requisitos
command -v java >/dev/null 2>&1 || { echo "❌ Java não instalado. Instale JDK 17+: https://adoptium.net/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js não instalado. Instale 18+: https://nodejs.org/"; exit 1; }
command -v bubblewrap >/dev/null 2>&1 || {
    echo "📦 Instalando Bubblewrap CLI..."
    npm install -g @bubblewrap/cli
}

# Verifica se o twa-manifest.json existe
if [ ! -f "twa-manifest.json" ]; then
    echo "❌ twa-manifest.json não encontrado em $(pwd)"
    exit 1
fi

# Inicializa projeto Bubblewrap se ainda não existe (gera build.gradle, AndroidManifest etc)
if [ ! -f "build.gradle" ]; then
    echo "🔧 Inicializando projeto TWA..."
    bubblewrap init --manifest=https://milkypot.com/manifest.json
fi

# Build
if [ "$MODE" = "release" ]; then
    echo "🏗  Build RELEASE..."
    if [ ! -f "android.keystore" ]; then
        echo "❌ android.keystore não encontrado. Gere com:"
        echo "   keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000"
        echo
        echo "   IMPORTANTE: GUARDE ESTA KEYSTORE — sem ela você não consegue atualizar o app na Play Store."
        exit 1
    fi
    bubblewrap build
    echo "✅ APK release gerado: ./app-release-bundle.aab + ./app-release-signed.apk"
    echo
    echo "📤 PRÓXIMOS PASSOS:"
    echo "1. Copia ./app-release-signed.apk pra ../downloads/milkypot.apk"
    echo "   (vai aparecer no botão 'Baixar APK direto' em /baixar.html)"
    echo "2. OU sobe ./app-release-bundle.aab pra Play Console → cria release"
    echo "3. Pega o SHA-256 da keystore com:"
    echo "   keytool -list -v -keystore android.keystore -alias android | grep SHA256"
    echo "4. Cola o SHA-256 em ../.well-known/assetlinks.json"
    echo "5. Faz deploy do site (assetlinks.json precisa estar acessível em milkypot.com/.well-known/assetlinks.json)"
else
    echo "🏗  Build DEBUG..."
    bubblewrap build --skipPwaValidation
    echo "✅ APK debug gerado em ./app-release-signed.apk"
    echo
    echo "📱 Pra instalar no celular conectado via USB:"
    echo "   adb install app-release-signed.apk"
fi

echo
echo "🎉 Build completo!"
