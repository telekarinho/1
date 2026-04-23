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

## Status

| Blocker | Prioridade | Resolvido? |
|---|---|---|
| CNPJ + Razão Social | 🔴 Crítico | ❌ Aguardando |
| DPO (encarregado LGPD) | 🔴 Crítico | ❌ Aguardando |
| Google Analytics ID | 🟡 Secundário | ❌ Aguardando |
| Domínio correto em termos.html | 🟡 Secundário | ❌ Aguardando |

---

*Criado por Belinha — Ciclo #12 — 2026-04-23*
