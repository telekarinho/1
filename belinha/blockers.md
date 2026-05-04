# Belinha — Blockers (aguardando autorização do usuário)

Itens que **não podem ser preenchidos automaticamente** — exigem dados reais do franqueado/empresa. Preencher antes da inauguração (25/04/2026).

---

## 🔴 CRÍTICO — antes de ir ao ar

### 1. CNPJ + Razão Social (termos.html + privacidade.html + footer)

**Onde aparece:**
- `termos.html` linha 272–274: placeholder explícito na Seção 1 (Aceitação dos Termos)
- `termos.html` linha 394 (footer): comentário `<!-- CNPJ: configurar antes de publicar -->`
- `privacidade.html` linha 376 (footer): comentário `<!-- CNPJ: configurar antes de publicar -->`
- `index.html` linha 922 (footer): comentário `<!-- CNPJ: configurar antes de publicar -->`

**O que fornecer:**
```
Razão Social: ______________________________________________
CNPJ: ____ . ____ . ____ / ____ - __
Endereço da sede: _________________________________________ SP, Brasil
```

**Como aplicar após receber:**
- `termos.html` Seção 1: substituir o `<div class="placeholder-box">` pelo parágrafo com razão social + CNPJ
- Todos os footers: substituir o comentário por `CNPJ: XX.XXX.XXX/XXXX-XX`

---

### 2. DPO — Encarregado de Dados Pessoais (privacidade.html)

**Onde aparece:**
- `privacidade.html` linhas 347–354: Seção 7 — dados do DPO

**Exigência legal:** Art. 41 da LGPD — empresa que trata dados de clientes deve indicar DPO publicamente.

**O que fornecer:**
```
Nome do DPO: _______________________________________________
E-mail do DPO: privacidade@milkypot.com (confirmar se este é o correto)
Endereço da sede (já usado acima): _________________________
```

**Alternativa:** Caso a empresa não tenha DPO formal designado, substituir a seção por uma nota de contato via `contato@milkypot.com` (menos compliant com LGPD, mas aceitável para MPE em fase inicial).

---

### 3. Google Analytics ID real (cardapio.html + index.html)

**Onde aparece:**
- `cardapio.html` linhas 29–32: `G-XXXXXXXXXX` (placeholder)
- `index.html` linhas 169–170: comentado (GA desabilitado)

**O que fornecer:**
```
Google Analytics 4 Property ID: G-__________
```

**Obs:** `cardapio.html` já tem o script GA ativo com ID placeholder. Até receber o ID real, o script dispara requisições para um ID inválido. Duas opções:
- Fornecer o ID real → substituir `G-XXXXXXXXXX`
- Desabilitar temporariamente até ter o ID → comentar as linhas 29–32 de `cardapio.html`

---

## 🟡 SECUNDÁRIO — pode aguardar pós-inauguração

### 4. Termos de uso: Seção 1 — domínio correto

**Onde aparece:**
- `termos.html` linha 267: usa `milkypot.com.br` mas o domínio real é `milkypot.com`

**Ação:** Confirmar domínio oficial e corrigir a menção (1 linha).

---

---

## 🟡 OPERACIONAL — confirmação do operador (pós-inauguração)

### 5. WA "VERAO" — keyword foi publicada?

**Contexto:** A mecânica de lista VIP via keyword "VERAO" foi planejada na semana 33 (01/12/2026) e prescrita nos ciclos #74–#75. O cliente deveria enviar a palavra "VERAO" para o WhatsApp da loja para entrar na lista VIP do produto sazonal de verão.

**Bloqueador:** A Belinha não consegue verificar o WhatsApp Business — não há acesso ao painel de automações.

**O que o operador precisa confirmar:**
- [ ] A keyword "VERAO" foi configurada como resposta automática no WA Business?
- [ ] A lista VIP "VERAO" foi criada e tem membros?
- [ ] O produto sazonal de verão (Versão A ou B) foi lançado em 02/12/2026 conforme semana 33?
- [ ] Quantos clientes entraram na lista VIP "VERAO" até agora?

**Ação após confirmação:** Se a mecânica está ativa e funcionando → fechar este blocker. Se não foi publicada → avaliar se ainda faz sentido ativar (produto verão ainda em cardápio?) ou arquivar como aprendizado para próxima campanha sazonal.

**Impacto estratégico:** Lista VIP "VERAO" é input para o conteúdo de semana 55+ (pode incluir broadcast de encerramento da temporada verão + transição para campanha outono/inverno).

---

## Status

| Blocker | Prioridade | Resolvido? |
|---|---|---|
| CNPJ + Razão Social | 🔴 Crítico | ❌ Aguardando |
| DPO (encarregado LGPD) | 🔴 Crítico | ❌ Aguardando |
| Google Analytics ID | 🟡 Secundário | ❌ Aguardando |
| Domínio correto (termos.html + privacidade.html) | 🟡 Secundário | ✅ Resolvido (Ciclo #13) |
| WA "VERAO" keyword ativa? | 🟡 Operacional | ❓ Confirmar com operador |
| `js/cardapio.js` dead code — remover arquivo? | 🟡 Técnico | ❓ Confirmar com operador |

---

## 🟡 TÉCNICO — decisão de código (pós-inauguração)

### 6. `js/cardapio.js` — arquivo órfão (1050 linhas) aguarda decisão

**Descoberta (Ciclo #112):**
- `js/cardapio.js` é um app de pedido multi-step completo (`CardapioApp`, fluxo: base → formato → tamanho → sabor → adicionais → bebidas → resumo)
- **Nenhuma página HTML carrega este arquivo** (`index.html` e `cardapio.html` não têm `<script src="js/cardapio.js">`)
- `cardapio.html` usa `cart.js` + `checkout.js` como sistema real de pedidos
- O arquivo referencia IDs `menuCart*` (ex: `menuCartSidebar`) que não existem no HTML (HTML usa `cartSidebar` etc.)
- Estava apenas em `sw.js` PRECACHE_URLS — **removido no ciclo #112** (evita ~42 KB de precache desnecessário)

**Hipótese:** `cardapio.js` é uma versão alternativa/WIP do fluxo de pedido que nunca chegou a ser integrada ao HTML. Pode ter sido substituída por `checkout.js` (786 linhas) sem remoção do arquivo.

**Decisão necessária (operador/dev):**
- **Opção A — Deletar `js/cardapio.js`:** Se o arquivo foi definitivamente abandonado, remove 1050 linhas mortas do repositório e simplifica a base de código. Belinha pode executar após autorização explícita.
- **Opção B — Integrar `js/cardapio.js` ao `cardapio.html`:** Se existe plano de usar o `CardapioApp` como fluxo principal de pedido (substituindo ou complementando `checkout.js`), o operador/dev precisa alinhar IDs HTML (`menuCart*`) e adicionar `<script src="js/cardapio.js">` ao `cardapio.html`.
- **Opção C — Manter como está:** Arquivo versionado no repo mas sem efeito em produção (após remoção do sw.js).

**Impacto da inação:** Nenhum impacto em produção (arquivo já removido do precache). Apenas dívida técnica no repositório.

---

*Criado por Belinha — Ciclo #12 — 2026-04-23*
*Atualizado — Ciclo #112 — 2026-05-04*
