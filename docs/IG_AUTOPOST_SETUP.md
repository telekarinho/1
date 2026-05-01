# 📱 Auto-Post Stories Instagram — Setup

Guia passo-a-passo pra conectar o painel MilkyPot com o Instagram da sua loja.

**Tempo total:** 20-30 min (1× por loja)
**Custo:** zero
**Validade do token:** 60 dias (precisa renovar)

---

## Pré-requisitos

1. Instagram da loja configurado como **Business/Professional**
2. Facebook Page vinculada à Instagram Business
3. Conta de desenvolvedor Meta (grátis)

---

## Passo 1 — Instagram Business

1. No app Instagram da loja → **Configurações e privacidade** → **Conta** → **Mudar pra conta profissional**
2. Escolhe categoria "**Alimentos e Bebidas**" ou "**Restaurante/Café**"
3. **Vincula uma Página do Facebook** (se não tiver, cria uma "MilkyPot — [cidade]")

---

## Passo 2 — Cria um App Meta pra Developers

1. Vai em <https://developers.facebook.com/apps/>
2. **Criar App** → tipo **"Negócios"** → nome "MilkyPot Auto Stories"
3. No dashboard do app, adiciona produtos:
   - **Instagram Graph API**
   - **Login do Facebook**
4. No menu **Configurações → Básico**, anota o **App ID** e **App Secret**

---

## Passo 3 — Gera o User Access Token (SHORT-lived, 1h)

1. Vai em <https://developers.facebook.com/tools/explorer/>
2. No dropdown de apps → escolhe "MilkyPot Auto Stories"
3. Clica **"Generate Access Token"**
4. Autoriza os escopos (permissions):
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
5. Copia o **Access Token** curto

---

## Passo 4 — Troca por LONG-lived (60 dias)

Cola a URL abaixo no navegador, substituindo `{APP_ID}`, `{APP_SECRET}` e `{SHORT_TOKEN}`:

```
https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
```

Retorno:
```json
{ "access_token": "EAAJ...long...", "token_type": "bearer", "expires_in": 5184000 }
```

**Guarda o `access_token` — é o que vai no painel.**

---

## Passo 5 — Descobre o IG Business Account ID

Cola a URL (com o long-lived token):

```
https://graph.facebook.com/v19.0/me/accounts?access_token={LONG_TOKEN}
```

Pega o ID da Page:
```json
{ "data": [ { "id": "PAGE_ID", "name": "MilkyPot Londrina" } ] }
```

Agora descobre o IG Business Account ID:

```
https://graph.facebook.com/v19.0/{PAGE_ID}?fields=instagram_business_account&access_token={LONG_TOKEN}
```

Retorno:
```json
{ "id": "PAGE_ID", "instagram_business_account": { "id": "17841405309211844" } }
```

**O `17841405309211844` é o IG Business Account ID.**

---

## Passo 6 — Salva no painel MilkyPot

1. Abre `milkypot.com/painel/tv-auto-stories.html`
2. Preenche:
   - **IG Business Account ID:** `17841405309211844`
   - **Long-Lived Access Token:** `EAAJ...long...`
3. Clica **💾 Salvar credenciais**
4. Clica **🧪 Testar conexão** — deve retornar `✅ Conectado como @milkypot`
5. Ativa o toggle **⏰ Agendamento diário** e define o horário (padrão 20:00 BRT)

---

## Passo 7 — Ativa o cron no Vercel (auto-post sem painel aberto)

> Este passo é **opcional**. Se não fizer, o auto-post só roda **enquanto o painel está aberto em alguma aba**. Com o cron, roda todo dia no horário mesmo com a loja fechada.

1. Login no Vercel (já conectado ao repo `telekarinho/1`)
2. **Settings → Environment Variables**:
   - `CRON_SECRET` = uma string aleatória (ex: `openssl rand -hex 32`)
3. O `vercel.json` já tem o cron configurado em `/api/cron-ig-stories` rodando 23h UTC (20h BRT) todo dia
4. Após o próximo deploy, o cron entra em ação automaticamente

---

## Passo 8 — Preview e teste manual

No painel:
1. **🔄 Atualizar preview** — gera os 3 stories com dados reais do dia
2. **📤 Postar agora (teste)** — posta manualmente pra ver se funciona
3. Confere no Instagram se os 3 stories apareceram

Primeiro teste em **horário de movimento** (tarde/noite) pra ter dados reais (contador > 0, sabores, ganhadores).

---

## Renovação do Token (todo mês)

O Long-Lived Token tem **60 dias**. Antes de expirar:

1. Refresh via URL (troca por novo long-lived):
```
https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN_ATUAL}
```

2. No painel, substitui o token antigo pelo novo e salva.

💡 **Dica:** cria lembrete mensal no calendário da loja: "Renovar token IG MilkyPot".

---

## FAQ / Troubleshooting

**"Invalid OAuth access token"**
→ Token expirou ou escopo errado. Gera novo seguindo Passos 3-4.

**"The user is not an admin of the Instagram Business account"**
→ A Page do Facebook não está vinculada ao IG Business. Refaz Passo 1.

**"(#10) Application does not have permission for this action"**
→ App Meta não pediu permissão `instagram_content_publish`. Refaz Passo 3.

**"Story não aparece no IG mesmo com ok=true"**
→ Image URL precisa ser **HTTPS pública** e acessível pela Meta. Placeholder `via.placeholder` funciona pra teste; em produção, você vai querer implementar o endpoint `/api/render-story` que gera a imagem real via Puppeteer (TODO — v2 desta feature).

**Quantos posts dá pra fazer por dia?**
→ Instagram API limita **25 posts/24h** por conta. 3 stories/dia = margem gigante.

---

## Limitações conhecidas (v1 desta feature)

1. **URL de imagem pública necessária** — o endpoint atual usa placeholder (`via.placeholder`). Em produção, faça upload em Firebase Storage ou implemente `/api/render-story` com Puppeteer pra gerar a imagem em tempo real.
2. **Sem suporte a vídeo** — só imagem. Meta exige processo diferente pra video stories.
3. **Sem mention stickers** — @ de clientes não aparecem clicáveis (limitação da API em stories sem upgrade).
4. **1 conta por franquia** — se tiver múltiplas franquias, cada uma precisa de seu token.

---

*Última atualização: 2026-04-21*
