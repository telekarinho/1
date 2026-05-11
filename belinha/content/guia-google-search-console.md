# Guia: Google Search Console — MilkyPot Londrina
**Ciclo #192 | Criado por Belinha | 2026-05-11**

> **Por que isso importa:** Sem verificação no Google Search Console, o Google não sabe que o site existe de forma oficial. Submeter o sitemap faz o Google indexar todas as páginas até **10× mais rápido** e você passa a ver quais buscas levam clientes até o MilkyPot ("potinho londrina", "açaí muffato", etc.).

---

## ETAPA 0 — Pré-requisitos (2 min)

Você precisará de:
- ✅ Acesso ao e-mail que administra o site MilkyPot (Firebase/Google)
- ✅ Celular com internet
- ✅ 15 minutos sem interrupção

---

## ETAPA 1 — Acessar o Google Search Console

1. Abra o navegador e acesse: **https://search.google.com/search-console**
2. Clique em **"Iniciar agora"** (ou **"Start now"**)
3. Faça login com a conta Google que administra o site MilkyPot

> Se aparecer uma lista de propriedades, procure `milkypot.com`. Se já aparecer lá, pule para a **Etapa 3**.

---

## ETAPA 2 — Adicionar o site (só na 1ª vez)

Você verá dois tipos de propriedade:

| Tipo | Quando usar |
|------|-------------|
| **Domínio** (recomendado) | Cobre www + http + https + subdomínios |
| **Prefixo de URL** | Só cobre a URL exata digitada |

### Escolha: **Domínio**

1. No campo **"Domínio"**, digite: `milkypot.com`
2. Clique **"Continuar"**
3. O Google vai pedir verificação via **registro DNS TXT**

### Verificação DNS TXT (via Registro.br ou provedor de domínio)

1. Copie o código TXT que o Google mostrar (parece: `google-site-verification=xxxxxxxxxxxxxx`)
2. Acesse o painel onde você registrou o domínio `milkypot.com`
   - Se for **Registro.br**: https://registro.br → Login → Meus Domínios → milkypot.com → Editar Zona DNS
   - Se for **GoDaddy/Hostinger/outro**: acesse o painel desse provedor
3. Adicione um novo registro:
   - **Tipo:** `TXT`
   - **Nome/Host:** `@` (ou deixe em branco)
   - **Valor:** cole o código do Google
   - **TTL:** 3600 (ou "Automático")
4. Salve o registro
5. Volte ao Google Search Console e clique **"Verificar"**

> ⏱️ Pode demorar de 5 minutos a 24h para o DNS propagar. Se não verificar na hora, tente novamente em 1h.

**Alternativa mais rápida (se tiver acesso ao Firebase Hosting):**
1. No Google Search Console, escolha **"Prefixo de URL"**
2. Digite: `https://milkypot.com`
3. Escolha verificação por **"Tag HTML"**
4. Copie a meta tag fornecida: `<meta name="google-site-verification" content="..." />`
5. Cole no `<head>` do `index.html` antes de publicar
6. Faça deploy no Firebase e clique "Verificar"

---

## ETAPA 3 — Submeter o Sitemap

Após verificação:

1. No menu lateral esquerdo, clique em **"Sitemaps"** (ícone de mapa/diagrama)
2. No campo **"Adicionar um novo sitemap"**, digite:
   ```
   sitemap.xml
   ```
   *(o campo já mostra `https://milkypot.com/` — só adicione `sitemap.xml`)*
3. Clique **"Enviar"**
4. Aguarde — o status deve mudar para **"Sucesso"** com o número de URLs encontradas

### URLs esperadas no sitemap atual:

| Página | Prioridade |
|--------|-----------|
| `milkypot.com/` | 1.0 |
| `milkypot.com/cardapio.html` | 0.9 |
| `milkypot.com/desafio.html` | 0.7 |
| `milkypot.com/raspinha.html` | 0.6 |
| `milkypot.com/privacidade.html` | 0.3 |
| `milkypot.com/termos.html` | 0.3 |

Se aparecer **6 URLs indexadas** = sucesso. ✅

---

## ETAPA 4 — Solicitar indexação manual (acelera o processo)

Para cada página importante, solicite indexação manual:

1. No menu lateral, clique **"Inspeção de URL"**
2. Digite: `https://milkypot.com/` → pressione Enter
3. Clique **"Solicitar indexação"**
4. Aguarde confirmação (geralmente instantânea, indexação leva 1–7 dias)
5. Repita para:
   - `https://milkypot.com/cardapio.html`
   - `https://milkypot.com/desafio.html`

> **Limite:** O Google permite ~10 solicitações manuais por dia — use nas 3 páginas acima primeiro.

---

## ETAPA 5 — Configurar Google Business Profile (bônus — SEO local)

Se ainda não configurado, o **Google Meu Negócio** é o que faz o MilkyPot aparecer no Google Maps e no painel lateral quando alguém busca "potinho londrina".

1. Acesse: **https://business.google.com**
2. Clique **"Gerenciar agora"**
3. Pesquise "MilkyPot" — se aparecer, clique em **"Reivindicar esta empresa"**
4. Se não aparecer, clique **"Adicionar sua empresa"**
5. Preencha:
   - **Nome:** MilkyPot Muffato Londrina
   - **Categoria:** Sorveteria / Loja de Sobremesas
   - **Endereço:** Av. Quintino Bocaiuva, 1045 — Londrina, PR
   - **Telefone:** (43) 99804-2424
   - **Site:** https://milkypot.com
   - **Horário:** Seg-Dom 14h–23h
6. Verificação por carta (código chega em 5–14 dias) ou por vídeo/ligação

---

## ETAPA 6 — Monitoramento (após 7 dias)

Volte ao Search Console e verifique:

| Relatório | O que observar |
|-----------|---------------|
| **Desempenho** | Cliques, impressões, CTR, posição média |
| **Cobertura** | Páginas indexadas vs. erros |
| **Melhorias** | Core Web Vitals, dados estruturados |
| **Sitemaps** | Confirmar que o sitemap foi processado |

**Buscas que devem aparecer (1ª semana):**
- "potinho londrina"
- "milkypot londrina"
- "sobremesas muffato londrina"
- "açaí self service londrina"

---

## Checklist de Execução

```
[ ] Acesso ao e-mail admin do site confirmado
[ ] Entrei em https://search.google.com/search-console
[ ] Propriedade milkypot.com adicionada e verificada
[ ] Sitemap submetido: status "Sucesso" com 6 URLs
[ ] Indexação manual solicitada: /, /cardapio.html, /desafio.html
[ ] Google Meu Negócio: verificado e completo
[ ] Agendei revisão no Search Console para daqui 7 dias
```

---

## Suporte

Se travar em qualquer etapa, envie print para a equipe MilkyPot via WhatsApp **(43) 99804-2424** descrevendo onde parou.

---

*Criado por Belinha — assistente MilkyPot | Ciclo #192*
