# MilkyPot — App Mobile Setup

Tudo que você precisa pra ter o MilkyPot instalado nativamente em Android e iOS.

---

## 🤖 Android nativo (TWA via Bubblewrap)

**Resultado:** APK assinado que abre o site `milkypot.com` em modo fullscreen, com ícone nativo, push notifications, offline. Pode ser distribuído via Play Store OU baixado direto do site.

### Como funciona (Trusted Web Activity)
- Wrapper Android oficial do Google — não é WebView, é **Chrome Custom Tabs em modo fullscreen**
- Compartilha cookies, login e service worker com o site
- Push notification funciona via FCM (já configurado no projeto)
- Verificação de domínio via `.well-known/assetlinks.json` (digital asset links)

### Pré-requisitos (faz uma vez na máquina)
```bash
# 1. Java JDK 17+
# Mac:    brew install openjdk@17
# Ubuntu: sudo apt install openjdk-17-jdk
# Win:    https://adoptium.net/

# 2. Node.js 18+
# https://nodejs.org/

# 3. Android SDK (vem com Android Studio): https://developer.android.com/studio

# 4. Bubblewrap CLI
npm install -g @bubblewrap/cli
```

### Build pra teste (debug, instala via USB)
```bash
cd twa/
./build-android.sh
# Gera ./app-release-signed.apk

# Instala no celular conectado
adb install app-release-signed.apk
```

### Build pra produção (release, assinado)
```bash
# 1. Gera keystore (PRIMEIRA VEZ APENAS — guarde com sua vida)
cd twa/
keytool -genkey -v -keystore android.keystore -alias android \
    -keyalg RSA -keysize 2048 -validity 10000

# 2. Build release
./build-android.sh release

# 3. Pega fingerprint SHA-256 da keystore
keytool -list -v -keystore android.keystore -alias android | grep SHA256

# 4. Cole o SHA-256 em ../.well-known/assetlinks.json
# (substitui REPLACE_WITH_RELEASE_KEYSTORE_SHA256)

# 5. Faz commit + deploy do site (assetlinks.json precisa estar acessível em
#    https://milkypot.com/.well-known/assetlinks.json)

# 6. Distribuição:
#    Opção A: Copia app-release-signed.apk pra ../downloads/milkypot.apk
#             — usuários baixam direto do botão em /baixar.html
#    Opção B: Sobe app-release-bundle.aab pra Play Console e publica
#             https://play.google.com/console/
```

### Atualização do site = atualização do app
Como o TWA carrega o site em runtime, **basta fazer deploy do site pra atualizar o app**. Você só precisa rebuilds o APK quando muda algo do shell nativo (versão, ícone, splash, package name).

---

## 🍎 iOS — PWA "Adicionar à Tela Inicial"

**Realidade:** Apple **não permite** baixar app nativo fora da App Store (regra do ecossistema iOS). Mas o PWA do MilkyPot já entrega 95% das features de um app nativo:

| Recurso | PWA iOS | App nativo iOS |
|---|---|---|
| Ícone na tela inicial | ✅ | ✅ |
| Fullscreen (sem barra Safari) | ✅ | ✅ |
| Push notifications | ✅ (iOS 16.4+) | ✅ |
| Offline | ✅ (via Service Worker) | ✅ |
| Câmera, microfone, GPS | ✅ | ✅ |
| Acesso a fotos, contatos | ⚠️ Limitado | ✅ |
| Background sync | ❌ | ✅ |
| Direct download do site | ✅ "Adicionar" | ❌ Bloqueado |

### Como o usuário instala (página `/baixar.html` já mostra)
1. Abre `milkypot.com` no **Safari** (precisa ser Safari, não Chrome)
2. Toca em **Compartilhar** ⬆️ (rodapé)
3. Rola e toca **"Adicionar à Tela Inicial"**
4. Confirma

### Caminho pra app nativo iOS no futuro (se quiser)
1. **Apple Developer Account:** $99/ano (mandatory)
2. **Capacitor (Ionic):** wraps o site em app nativo Swift/Obj-C, igual TWA
3. **Build via Xcode:** precisa Mac + Xcode
4. **TestFlight:** distribui beta pra até 10k testers (free dentro do Apple Dev)
5. **App Store:** review de 24-72h, então publicação. Atualizações tb passam por review.

Custo: **$99/ano** + tempo de review por update.
Estimativa de build inicial com Capacitor: 1 semana de dev.

---

## 📱 Página de download (`/baixar.html`)

Já criada. Detecta plataforma do visitante e mostra:
- **Android:** botão Play Store + APK direto + fallback PWA
- **iOS:** instruções passo-a-passo + explicação por que não tem nativo
- **Desktop:** trigger do `beforeinstallprompt` pra Chrome/Edge

URL pública: `https://milkypot.com/baixar.html`

---

## 🔐 Segurança da keystore

A keystore Android (`twa/android.keystore`) **não pode ser perdida ou comprometida**:
- Se perder: não consegue mais atualizar o app na Play Store (precisa criar novo package, perde reviews/usuários)
- Se vazar: malicioso pode publicar APK fingindo ser MilkyPot

**Recomendação:**
- `.gitignore` já bloqueia `*.keystore` (verifique)
- Backup da keystore em 1Password / cofre de equipe / Google Drive criptografado
- Anote a senha em local SEPARADO da keystore

---

## 📊 Métricas pra acompanhar pós-launch

Em cada plataforma, no GA4 / Firebase Analytics:

| Métrica | O que mede |
|---|---|
| `?source=twa` views | Quantos abrem via app Android instalado |
| `?source=ios-pwa` views | Detectar `display-mode: standalone` no iOS |
| Push permission grant rate | Quantos aceitam notificação |
| App install conversions | Funil: visit `/baixar.html` → install completo |
| 7-day retention | Quantos voltam na semana após install |

---

## 🎯 Ordem de execução sugerida

1. ✅ `/baixar.html` no ar (já está)
2. ✅ `/.well-known/assetlinks.json` no ar (já está, com placeholder)
3. ⏳ Gera keystore release
4. ⏳ Build APK release
5. ⏳ Atualiza assetlinks.json com SHA-256 real
6. ⏳ Deploy do site (pra assetlinks ficar acessível)
7. ⏳ Copia APK em `/downloads/milkypot.apk` (download direto) OU sobe pra Play Console
8. ⏳ Atualiza link da Play Store em `/baixar.html` (variável `playStoreUrl`)
9. ⏳ Anuncia em IG/Stories: "MilkyPot agora é app! 📱"

iOS PWA já está funcionando — é só direcionar o cliente pra `/baixar.html` no Safari.
