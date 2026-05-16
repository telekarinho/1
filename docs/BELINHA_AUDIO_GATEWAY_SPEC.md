# Belinha — Recebimento de Áudios (gateway side)

## Objetivo
Belinha agora **transcreve áudios** dos clientes via Groq Whisper. Para isso o gateway Baileys (`zap.milkypot.com`) precisa enviar o buffer do áudio junto com o webhook POST.

## O que mudou no webhook (já deployado)

`api/whatsapp-webhook.js` agora aceita campos opcionais no body:

```json
{
  "phone": "5543999991234",
  "name": "Maria",
  "text": "[audio]",                      // pode ser placeholder ou ausente
  "audioBase64": "T2dnUwACAAAAAAAA...",   // <-- NOVO: buffer do áudio em base64
  "audioMimeType": "audio/ogg; codecs=opus", // <-- NOVO: opcional, default ogg
  "messageId": "...",
  "accountId": "matriz"
}
```

OU alternativamente:
```json
{
  "phone": "...",
  "audioUrl": "https://firebasestorage.../audio.ogg"
}
```

Se `audioBase64` ou `audioUrl` presente, webhook:
1. Baixa/decodifica o buffer
2. Transcreve via Groq Whisper (`whisper-large-v3-turbo`, `language=pt`)
3. Usa a transcrição como `text` e segue fluxo normal (fast-reply → IA)
4. Salva no painel como `🎤 [áudio transcrito]: ...transcrição...`

## O que precisa mudar no gateway Baileys

No handler de mensagens do `zap.milkypot.com` (Node.js, provavelmente `index.js` ou `bot.js`):

```javascript
import { downloadMediaMessage } from "@whiskeysockets/baileys";

sock.ev.on("messages.upsert", async ({ messages }) => {
  for (const msg of messages) {
    if (msg.key.fromMe) continue;

    const phone = msg.key.remoteJid.replace("@s.whatsapp.net", "");
    const name = msg.pushName;
    const accountId = "matriz"; // ou o accountId da sessão

    // Detecta tipo de mensagem
    const messageType = Object.keys(msg.message || {})[0];
    let payload = { phone, name, accountId, messageId: msg.key.id };

    if (messageType === "audioMessage" || messageType === "voiceMessage") {
      // 🎤 NOVO: baixa o buffer e envia em base64 pro webhook transcrever
      try {
        const buffer = await downloadMediaMessage(msg, "buffer", {});
        payload.text = "[audio]"; // placeholder pra UI/logs
        payload.audioBase64 = buffer.toString("base64");
        payload.audioMimeType = msg.message.audioMessage?.mimetype || "audio/ogg; codecs=opus";
      } catch (e) {
        console.error("[gateway] audio download failed:", e.message);
        payload.text = "[audio: falha ao baixar]";
      }
    } else if (messageType === "conversation" || messageType === "extendedTextMessage") {
      payload.text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    } else {
      // sticker / image / video / etc — mandar marker que o webhook responde com canned reply
      const markers = {
        stickerMessage: "[sticker]",
        imageMessage: "[image]",
        videoMessage: "[video]",
        locationMessage: "[location]",
        documentMessage: "[document]",
        contactMessage: "[contact]",
        reactionMessage: "[reaction]"
      };
      payload.text = markers[messageType] || "[mensagem não suportada]";
    }

    // Posta no webhook com HMAC (já implementado)
    await postToWebhook(payload);
  }
});
```

## Limites

- **Tamanho do áudio**: Webhook rejeita > 25MB (limite Groq Whisper). WhatsApp voice notes ~1-2MB, ok.
- **Latência adicional**: ~500ms-2s pra transcrição (Whisper turbo é ~100x realtime).
- **Custo**: Groq Whisper free tier hoje, depois $0.04/hora de áudio.
- **Idioma**: Configurado pra `pt` (português). Se receber outro idioma, transcreve mesmo assim.

## Como testar

```bash
# Pega um arquivo .ogg de teste e converte pra base64
B64=$(base64 -w 0 audio-teste.ogg)

# POST direto pro webhook (precisa do MP_WEBHOOK_SECRET pra HMAC)
curl -X POST https://milkypot.vercel.app/api/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -H "x-mp-signature: sha256=<hmac do body>" \
  -d "{\"phone\":\"5543999999998\",\"name\":\"Teste\",\"audioBase64\":\"$B64\",\"accountId\":\"matriz\"}"
```

Resposta esperada:
```json
{ "reply": "...resposta da Belinha à transcrição...", "source": "fast_reply ou groq_ia" }
```

## Status

- [x] Webhook deployado em Vercel (PR #636+)
- [ ] Gateway `zap.milkypot.com` atualizado com `downloadMediaMessage` + `audioBase64`
- [ ] Teste E2E: cliente real manda áudio → Belinha responde

Enquanto o gateway não enviar `audioBase64`, áudios continuam caindo no fallback "[audio]" → resposta canned "tô surda agora, manda por escrito".
