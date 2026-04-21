# 🐑 MilkyPot Autopilot — Servidor Local

Proxy local entre o painel web MilkyPot e o `claude` CLI.
Permite usar a Belinha AI e o CEO Mentor **usando seu plano Claude Pro/Max autenticado**, sem consumir créditos de API.

---

## Arquitetura

```
milkypot.com/painel/copilot-belinha.html
          │
          ▼  (tenta primeiro)
http://localhost:5757/copilot
          │
          ▼  (spawn)
  `claude` CLI autenticado  ←  sessão local Claude Pro/Max
          │
          ▼
     resposta markdown

Se localhost:5757 estiver OFF → cai em /api/copilot (Anthropic API, usa key/créditos).
```

---

## Como usar

### 1. Primeira instalação

```
cd autopilot
npm install
```

E na raiz do projeto: **duplo-clique em `MilkyPot Autopilot.bat`** → opção **[12] Instalar dependências**.

### 2. Login no Claude CLI (1× por PC)

```
claude login
```

Ou menu **[13] Fazer login**. Autentica o CLI com seu plano Claude Pro/Max.

### 3. Iniciar o servidor

Menu **[1] Iniciar servidor local**. A janela fica aberta, escutando em `http://localhost:5757`.

### 4. Usar no painel

Abre `milkypot.com/painel/copilot-belinha.html` → o badge no canto mostra **🟢 servidor local (R$ 0,00)** em vez de **🔵 API**.

---

## Endpoints

- `GET /health` — verifica se está rodando
- `POST /copilot` — body: `{ persona, messages, context, model }` → retorna `{ reply, usage, source:"local" }`
- `POST /briefing` — shortcut pra briefing do dia

---

## Troubleshooting

**"Access-Control-Allow-Origin"** — o servidor já libera CORS pra `milkypot.com` e `localhost:*`. Se precisar adicionar domínio, edita `server.js`.

**"`claude` CLI not found"** — instala com `npm install -g @anthropic-ai/claude-code`.

**"ECONNREFUSED :5757"** — abre o `.bat` e escolhe opção [1].

**Servidor rodando mas painel mostra 🔵 API** — recarrega o painel (Ctrl+F5). O probe cacheia por 15s.
