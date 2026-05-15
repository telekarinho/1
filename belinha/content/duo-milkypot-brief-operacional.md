# Duo MilkyPot — Brief Operacional
## Mecânica Dia dos Namorados 12/06/2026 · Versão Padrão Implementável
_Belinha — Ciclo #224 | 2026-05-15_

> **Propósito deste arquivo:** O playbook `dia-dos-namorados-2026-playbook.md` listou 3 versões de mecânica sem decisão do operador. Com o evento a 28 dias, este documento usa o intel de concorrentes (ciclo #222) para **recomendar e detalhar a Versão A como padrão implementável agora** — sem aguardar confirmação. Se o operador quiser mudar para B ou C, a seção de troca rápida ao final tem tudo pronto.

---

## DECISÃO RECOMENDADA: VERSÃO A — "Duo MilkyPot"

**Mecânica:** Pedido com 2+ potinhos no Dia dos Namorados (12/06) = **1 topping extra gratuito** em qualquer um dos dois

**Por que Versão A vence (baseado em intel ciclo #222):**

| Critério | Versão A ✅ | Versão B | Versão C |
|---|---|---|---|
| Incentiva ticket duplo direto | ✅ Sim — o benefício só existe com 2 potinhos | ❌ Não — card em qualquer pedido | ❌ Não — dobro de carimbos não motiva compra imediata |
| Diferenciação vs. concorrentes | ✅ JohnnyJoy não tem combo/par — espaço livre | ✅ (visual, mas sem impacto de compra) | ❌ Fraco — cliente não percebe valor imediato |
| Facilidade de operação no PDV | ✅ Uma regra simples: 2+ potinhos = +1 topping | ⚠️ Exige card impresso antecipado | ✅ Simples, mas requer 2 cartões |
| Sem queima de margem | ✅ Topping extra custa ~R$0,80–R$1,50 vs. ticket ~R$45+ | ✅ Card custa ~R$0,50–1,00 | ✅ Carimbos extras têm custo diferido |
| UGC e viralização potencial | ✅ Foto de dois potinhos lado a lado = conteúdo natural | ✅✅ Card personalizado = UGC alto | ❌ Fraco |
| Implementável sem insumo extra | ✅ Toppings já existem no estoque | ❌ Exige card impresso (produção antecipada) | ✅ Cartões já existem |

**Veredito:** Versão A é a mais forte em conversão, a mais fácil de operar e a única que não exige produção antecipada de insumo. **Implementar como padrão a partir de 07/06** (quando a ativação começa).

---

## INTEL CONCORRENTES QUE SUSTENTA A DECISÃO

_(Fonte: ciclo #222 — 2026-05-14)_

### JohnnyJoy "Dois Amores" (principal concorrente nacional)
- **Produto:** Milkshake edição limitada, todo junho, R$20,90–R$24,90
- **Conceito:** "Celebrar conexões com alguém especial ou consigo mesmo"
- **Mecânica de casal/combo:** **NENHUMA encontrada** — sem promoção de par, sem incentivo para pedido duplo
- **Janela aberta para MilkyPot:** A narrativa "um potinho para cada um" com benefício tangível (topping extra) ocupa um espaço que JohnnyJoy não ocupa em junho

### JAH do Açaí (Jhoy Londrina)
- **Ação:** Lançamento sorvete de pistache 12/06, posicionamento aspiracional (parceria Caio Castro), receita 100% in-house
- **Mecânica de casal:** histórica (Caio Castro 2022), sem confirmação de mecânica de par em 2026
- **Leitura:** JAH vai ocupar o espaço premium/aspiracional → MilkyPot pode jogar na emoção e personalização sem competir por ingrediente artesanal

### MilkyMoo / TheBest (ciclos anteriores)
- Sem ação específica de Namorados documentada para 2026

---

## MECÂNICA VERSÃO A — DETALHAMENTO COMPLETO

### Regra única (comunicar à equipe até 07/06)
> "Todo pedido com 2 ou mais potinhos feito no Dia dos Namorados (12/06) ganha 1 topping extra grátis em qualquer um dos dois potinhos."

**Sem restrições de topping** (operador pode limitar a toppings de valor ≤ R$3,00 se quiser, mas não é obrigatório — a simplicidade da regra vale mais que a restrição).

---

### SINALIZAÇÃO PDV (imprimir ou escrever na lousa até 11/06)

**Opção lousa (sem impressão):**
```
🐑💕 DUO MILKYPOT
Dia dos Namorados 12/06

Peça 2 potinhos juntos
e ganhe 1 topping extra grátis
em qualquer um dos dois! 🍓🍫

Cada um do jeito que a pessoa amada mais gosta 💕
```

**Opção card pequeno (prender na embalagem delivery):**
```
🐑💕 DUO MILKYPOT
Dia dos Namorados · 12/06

Você pediu 2 potinhos = +1 topping
de presente da ovelhinha 💕

MilkyPot · Muffato Londrina
```

---

### SCRIPT VERBAL PDV / DELIVERY (para atendente decorar)

**Quando cliente chega ou pede:**
> "Hoje é Dia dos Namorados! Se você pedir dois potinhos — um pra você e um pro seu amor — a gente coloca um topping extra de graça em qualquer um dos dois. Quer aproveitar?"

**Quando cliente já pediu dois potinhos sem saber:**
> "Ótimo! Como você pediu dois potinhos, ganhou um topping extra grátis — qual você quer colocar?"

**Quando cliente pediu um só:**
> "Se quiser pedir um segundo potinho pro seu amor levar, a gente coloca um topping extra de graça nos dois. É pra data especial!"

---

### ATUALIZAÇÃO AUTOMAÇÃO WA (adicionar até 03/06)

No arquivo `whatsapp-namorados-2026.md`, a auto-resposta keyword `NAMORADOS26` **já inclui** a narrativa de dois potinhos. Adicionar a mecânica da Versão A na linha de confirmação:

**Trecho adicional (inserir após a linha "Vou te avisar na véspera..."):**
```
E tem um presentinho da ovelhinha: pedir 2 potinhos juntos no Dia dos Namorados
ganha 1 topping extra de graça em qualquer um! 🍓✨
```

---

### ATUALIZAÇÃO BROADCAST N1 — com Versão A (substituir trecho opcional)

Inserir após o bloco "🍨 Dois potinhos personalizados:" no template N1 do `whatsapp-namorados-2026.md`:

```
+ Bônus: peça 2 potinhos e ganhe 1 topping extra de graça 🍓
  (só no Dia dos Namorados, 12/06!)
```

---

## COMUNICAÇÃO INTERNA — CHECKLIST EQUIPE (para o operador repassar)

```
☐ Regra "2 potinhos = 1 topping extra grátis" explicada para toda a equipe até 11/06
☐ Nenhuma restrição: qualquer topping do cardápio (ou limite ≤ R$3 se preferir)
☐ Script verbal decorado por quem faz atendimento e delivery
☐ Lousa/card PDV preparado até manhã do dia 12/06
☐ WA Business: auto-resposta NAMORADOS26 + mensagem N1/N2 atualizadas com a mecânica
☐ Ao registrar pedido: anotar "DUO" quando forem 2+ potinhos (para contar KPI)
```

---

## SE O OPERADOR QUISER MUDAR (troca rápida)

### Trocar para Versão B — "Bilhetinho do Amor"
- Produzir até **07/06**: card impresso 10×7cm com ovelhinha, texto "Com amor, MilkyPot 🐑💕" + campo para nome do destinatário
- Colocar em todo pedido do dia 12/06 (independente de quantidade)
- Script: "Cada pedido de hoje ganha um cartãozinho personalizado da ovelhinha — quer colocar o nome de quem você está presenteando?"
- **Custo estimado:** R$0,50–R$1,00/unidade (impressão gráfica ou caseira)

### Trocar para Versão C — "Carimbos em Dobro"
- Regra: pedido com 2+ potinhos no Dia dos Namorados = 2x carimbos nos dois cartões de fidelidade
- Script: "Hoje é Dia dos Namorados — se vocês dois têm cartão fidelidade, a gente carimba dobrado nos dois!"
- **Desvantagem:** Menos impacto no ticket do dia; valor percebido baixo vs. Versão A

---

## INTEGRAÇÃO COM OUTROS ARQUIVOS

| Arquivo | O que atualizar |
|---|---|
| `dia-dos-namorados-2026-playbook.md` | Seção "Operador — decidir até 07/06": anotar que padrão é Versão A |
| `whatsapp-namorados-2026.md` | Inserir trecho da Versão A na auto-resposta NAMORADOS26 e em N1 |
| `stories-countdown-namorados-2026.md` | Já menciona "topping surpresa" — compatível com Versão A sem alteração |

---

## KPI ADICIONAL — VERSÃO A

| Métrica | Como medir | Meta |
|---|---|---|
| Pedidos "DUO" (2+ potinhos) | Anotação manual "DUO" no atendimento | ≥ 5 pedidos duplos (50% dos ≥10 pedidos temáticos) |
| Taxa de conversão do upsell verbal | Quantos clientes de 1 potinho viraram 2 | ≥ 2 conversões |
| Topping extra mais escolhido | Anotar qual foi pedido | (insight para próximos eventos) |

---

## TIMELINE CRÍTICA — VERSÃO A

| Data | Ação | Responsável |
|---|---|---|
| **até 03/06 (Ter)** | Configurar keyword `NAMORADOS26` no WA Business + inserir trecho da Versão A | Operador |
| **até 07/06 (Dom)** | Comunicar regra para equipe (verbal + lousa) | Operador |
| **11/06 (Qui) — manhã** | Preparar lousa/card PDV | Equipe |
| **12/06 (Sex) — 13h30** | Confirmar que todos na equipe sabem o script | Gerente de turno |
| **12/06 (Sex) — encerramento** | Contar pedidos DUO anotados | Operador |

---

_Belinha — Ciclo #224 | 2026-05-15_
_Baseado em intel ciclo #222 (JohnnyJoy "Dois Amores" + JAH Pistache) e análise de conversão_
