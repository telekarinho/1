# MilkyPot Funcionário — App Android Nativo

App Android nativo para o portal do funcionário, gerado via TWA (Trusted Web Activity) — APK real instalável em qualquer Android, distribuível via APK direto ou Play Store.

## 🚀 Como gerar o APK

### Opção 1: GitHub Actions (recomendado, sem instalar nada)

1. Acesse: https://github.com/telekarinho/1/actions
2. Clique em **"Build Android APK (TWA Funcionário)"** na lista de workflows
3. Botão **"Run workflow"** → preencha versão (ex: `1.0.0`) e build number (ex: `1`)
4. Aguarde ~3-5 minutos
5. APK e AAB ficam disponíveis em **Releases** do GitHub
6. Download direto: `https://github.com/telekarinho/1/releases/latest`

### Opção 2: Local com Bubblewrap CLI

Pré-requisitos: Node.js 18+, Java 17, Android SDK.

```bash
npm install -g @bubblewrap/cli
cd milkypot
bubblewrap init --manifest=https://milkypot.com/funcionario/manifest.json
bubblewrap build
```

APK gerado: `app-release-signed.apk`
AAB (Play Store): `app-release-bundle.aab`

## 📲 Como o funcionário instala

### Distribuição via APK direto (sem Play Store)

1. Funcionário acessa link do APK no celular
2. Configurações Android → Segurança → "Permitir apps de fontes desconhecidas" (apenas pro Chrome)
3. Toca o APK baixado → "Instalar"
4. Pronto — ícone do MilkyPot aparece na home

### Distribuição via Play Store

1. Conta de desenvolvedor Play Store ($25 único)
2. Upload do `.aab` em https://play.google.com/console
3. Preencher metadados (descrição, screenshots, política de privacidade)
4. Categoria: Negócios
5. Após review (1-3 dias), app fica disponível pra instalação direta

## 🔐 Setup de Digital Asset Links (importante)

Para o app abrir como standalone (sem barra do navegador), precisa do **assetlinks.json**:

1. Após gerar o APK, rode:
   ```bash
   keytool -list -v -keystore android.keystore -alias android
   ```
2. Copie o **SHA256 fingerprint**
3. Edite `.well-known/assetlinks.json` no repositório:
   ```json
   "sha256_cert_fingerprints": ["XX:XX:XX:..."]
   ```
4. Faça commit + push → assetlinks.json fica disponível em `https://milkypot.com/.well-known/assetlinks.json`
5. App passa a abrir 100% standalone (sem barra Chrome)

## 🔑 Sobre a chave de assinatura

A chave de assinatura (`android.keystore`) é **CRÍTICA** — perdeu, perdeu o app na Play Store (não pode publicar updates).

**O workflow gera automaticamente uma chave** se não houver no Secrets do GitHub. Pra produção:

1. No GitHub: Settings → Secrets and variables → Actions
2. Adicione secrets:
   - `ANDROID_KEYSTORE_BASE64` — keystore em base64 (`base64 android.keystore`)
   - `KEYSTORE_PASSWORD` — senha do keystore
   - `KEY_PASSWORD` — senha da chave
3. **Faça backup do keystore!** Salve em local seguro fora do repositório.

## 🔔 Push notifications

Já configurado via FCM (Firebase Cloud Messaging). O Cloud Function `cron_remindPunch` roda a cada 5 minutos e envia push 10min antes de cada horário da escala do funcionário.

**Pra ativar:**
1. Deploy da Cloud Function: `firebase deploy --only functions:cron_remindPunch`
2. Funcionário no portal → Dados → "Ativar lembretes" → autoriza
3. Token FCM salvo em `fcm_subscriptions/{franchiseId}`
4. Cron envia push automaticamente

## ✅ Funcionalidades do app

- Login com CPF + PIN
- Bater ponto com:
  - Geolocalização GPS (obrigatória)
  - **Geofence** — bloqueia se >150m da loja (configurável)
  - **Selfie automática** (anti-fraude)
- Espelho mensal completo (4 marcações por dia)
- **Holerite simplificado** (proventos, descontos, INSS, IRRF, líquido)
- **Banco de horas** — solicitar compensação/folga
- **Benefícios** — histórico de sorvetes/lanches recebidos
- Push notifications automáticas
- Funciona offline (Service Worker)

## 🏢 Para a Play Store

### Requisitos obrigatórios

- ✅ App rodando em https://milkypot.com/funcionario/ (já feito)
- ✅ HTTPS (já feito)
- ✅ Manifest.json com ícones 192x192 + 512x512 (já feito)
- ⚠️ **Política de Privacidade** — link público obrigatório
- ⚠️ **Screenshots do app** (mínimo 2, máximo 8)
- ⚠️ **Ícone alta resolução** 512x512 PNG transparente
- ⚠️ **Banner promocional** 1024x500 (opcional mas recomendado)

### Política de Privacidade — template básico

```
MilkyPot Funcionário coleta os seguintes dados:
- CPF, PIS, nome, função, salário (gestão de RH)
- Localização (geolocalização) — apenas no momento de bater ponto
- Foto (selfie) — apenas no momento de bater ponto, anti-fraude
- Token FCM — para enviar lembretes

Os dados são armazenados em servidores Firebase (Google Cloud) e
utilizados exclusivamente para gestão de jornada conforme CLT e
Portaria MTE 671/2021. Dados não são compartilhados com terceiros.

Contato: contato@milkypot.com
```

Hospede esse texto em `https://milkypot.com/privacidade-funcionario.html` e
informe o link na Play Store.

### Categorias e classificação

- **Categoria:** Negócios
- **Classificação:** Livre (todos)
- **Idioma:** Português (Brasil)
- **País:** Brasil

## 🆘 Troubleshooting

**App abre com barra do Chrome (não standalone)** → assetlinks.json não está validado. Verifique SHA256 e que `https://milkypot.com/.well-known/assetlinks.json` está acessível.

**Push não chega** → funcionário precisa ter aberto o app pelo menos 1x e dado permissão. Verifique `fcm_subscriptions/{franchiseId}` no Firestore.

**Geofence bloqueia ponto** → loja sem coordenadas. Cadastre `latitude`/`longitude` no documento da franquia.

**Build APK falha no GitHub Actions** → veja logs. Geralmente é problema de Java SDK ou keystore. Use a opção local com Bubblewrap se precisar debugar.
