# Setup Sentry — 5 passos (≤10 min)

1. Acessar [sentry.io/signup](https://sentry.io/signup) — criar conta com `jocimarrodrigo@gmail.com`. Plano **Developer (free)** dá 5k erros/mês.
2. **Create Project**:
   - Platform: **JavaScript** → **Browser**
   - Project name: `milkypot-web`
   - Team: `MilkyPot` (criar)
3. Copiar a DSN (formato `https://abc@o123.ingest.us.sentry.io/456`).
4. Substituir `REPLACE_ME` em `<meta name="sentry-dsn" content="REPLACE_ME">` nestes arquivos:
   - `index.html`
   - `cardapio.html`
   - `clube.html`
   - (opcional) `painel/pdv.html`, `painel/financeiro.html`, `painel/index.html`
5. Push/deploy. Sentry começa a capturar erros automaticamente em prod.

## Verificar

Abrir o site → DevTools console → executar:
```js
throw new Error('Teste Sentry MilkyPot');
```

Erro aparece em sentry.io dashboard em ≤30s.

## Alertas

Em sentry.io → Settings → Alerts → "Issues Alerts" → criar alerta:
- **When:** A new issue is created
- **Then:** Send a notification to `jocimarrodrigo@gmail.com` (e/ou Slack se quiser depois)

## O que já está plugado (você não precisa fazer nada)

- `js/core/error-tracking.js` carrega lazy do CDN `browser.sentry-cdn.com/8.20.0`
- Captura `window.error` e `unhandledrejection`
- Anexa contexto MilkyPot: `userId`, `role`, `franchiseId`, `release=CACHE_VERSION`
- Fallback continua: Firestore `error_log` + `localStorage` queue
- Sem DSN configurado → 100% no-op (zero requests externas)
