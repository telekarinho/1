# MilkyPot TV — App Android Nativo

Player de digital signage **nativo** para Android e Android TV.

## Por que existe

O player web (`tv.html`) funciona, mas em TV boxes modestas o WebView do
Chrome consome muita memória e pode travar a TV após algumas horas. Este
APK usa **ExoPlayer** (decoder nativo de vídeo do Android) — consumo
minúsculo, hardware acceleration direta, loop nativo e zero WebView.

## Como funciona

1. Primeira vez que abre: tela com **TV 1 / TV 2 / TV 3** + campo pra
   código custom (ex: `mq1`).
2. Escolhido, o app busca via Firestore REST o mapa
   `tv_shortcodes_{franquia}` pra achar o tvId correto.
3. Carrega `tv_media_{fid}` + `tv_playlist_{fid}`, pega os vídeos MP4
   e inicia loop no ExoPlayer com `REPEAT_MODE_ALL`.
4. Auto-restart preventivo a cada 60 min pra liberar qualquer memória
   eventualmente acumulada (muito mais tolerante que WebView).
5. Segurar **VOLTAR** por 2 s volta pra seleção de TV.

## Stack

- Kotlin + AndroidX
- Media3 ExoPlayer 1.4.1
- OkHttp 4 pra fetch Firestore REST
- minSdk 21 (Android 5.0+), targetSdk 34

## Build

Build automático no GitHub Actions a cada push em `android-tv/**`.
APK fica no **Releases** com tag `tv-apk-latest`.

Build local (se tiver Android SDK):

```
cd android-tv
./gradlew assembleRelease
# APK em: app/build/outputs/apk/release/app-release.apk
```

## Instalação na TV

1. Baixe o APK do Release
2. Transfira pra TV (pendrive, adb push, link direto)
3. Abra → autorize "Fontes desconhecidas" se pedir
4. Aparece no menu da TV como "MilkyPot TV"

## Sem Play Services

O app não depende de Google Play Services. Roda em TV box Android AOSP
genérico (sem loja), Android TV, Fire TV Stick (com sideload), etc.
