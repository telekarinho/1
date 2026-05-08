# Template WA — Milestone 30 Carimbos: VIP Consolidado

> **Criado por:** Belinha — Ciclo #158 (2026-05-08)  
> **Para:** Operador/Atendente MilkyPot Muffato Londrina  
> **WhatsApp da loja:** (43) 99804-2424

---

## Contexto e estratégia

**O que é o marco de 30 carimbos:**
30 carimbos = 3 cartelas fidelidade completas. Cada cartela tem 10 carimbos e rende 1 Potinho Mini grátis. Chegar a 30 carimbos significa que o cliente:
- Resgatou **3 Potinhos Mini grátis** ao longo da jornada
- Gastou aproximadamente **R$300 ou mais** na MilkyPot Londrina
- Mantém frequência de visitas há **~3 meses** (pressupondo ~2 visitas/semana)

**Por que este marco é crítico (churn prevention):**
O marco dos 30 carimbos ocorre exatamente na janela de "fadiga da novidade" — o cliente conheceu a loja, frequentou com entusiasmo inicial, já resgatou 3 prêmios. Sem um reconhecimento explícito aqui, a frequência começa a cair. Estudos de programas de fidelidade mostram que entre o 3º e o 5º mês é o período de maior evasão silenciosa: o cliente não cancelou, simplesmente foi espaçando as visitas.

**O reconhecimento no 30º carimbo cria o efeito "já estou quase no próximo nível"** — o cliente descobre que existe o marco de 50 e passa a ter motivação renovada para continuar.

**Alinhamento calendário:**
- Clientes que vieram desde a inauguração (25/04/2026) e mantiveram frequência regular atingem 30 carimbos entre julho e agosto de 2026 (semanas 10–18 pós-inauguração).
- Esse período coincide com o inverno e a sazonalidade de queda em sorveterias — o template funciona como retenção preventiva.

**Benefício sugerido:** Topping premium surpresa (ex: Nutella, morango fresco, granola com mel) **ou** upgrade de tamanho Mini → Médio (diferença custeada pela loja), apresentado como "sinal da ovelhinha". Confirmar com a franquia o limite de benefício antes de disparar.

---

## Templates WA

### TEMPLATE A — Celebração + "próximo nível" (recomendado)

> Enviar quando o operador confirmar o 30º carimbo acumulado.  
> Substitua `[NOME]` pelo primeiro nome do cliente.

```
Oi [NOME]! 🐑✨

A ovelhinha foi checar a cartela e deu um pulinho de alegria: *30 carimbos!* 🎉

São 3 cartelas completas. Três Potinhos Mini resgatados. Três meses de potinhos
felizes aqui no Muffato — e isso não passa despercebido pra gente, não. 🤍

Você já é *VIP MilkyPot* de carteirinha.

*🎁 Presente da ovelhinha:* topping surpresa grátis na sua próxima visita.
Só falar "sou VIP" pro atendente e escolher qualquer topping pra ganhar de brinde!

E um spoiler: você está a *20 carimbos* de algo bem especial… 😉🏆

📍 MilkyPot Muffato Londrina — Av. Quintino Bocaiuva, 1045 | 14h–23h
— MilkyPot Londrina 🐑
```

> **Por que "sou VIP":** Cria um ritual de reconhecimento no PDV que outros clientes observam — marketing social passivo.

---

### TEMPLATE B — Versão direta (clientes menos interativos)

```
Oi [NOME]! 🐑

*30 carimbos MilkyPot* — você chegou no VIP! ✨

Sinal da ovelhinha: *topping grátis* na próxima visita.
Só falar "sou VIP" pro atendente! 😊

📍 Muffato — Av. Quintino Bocaiuva, 1045 | 14h–23h
```

---

### TEMPLATE C — Versão inverno 2026 (jul–ago)

> Usar para clientes que atingem 30 carimbos entre 01/07 e 31/08/2026.
> Aproveita o contexto sazonal para manter engajamento durante o inverno.

```
Oi [NOME]! 🐑🌙

Frio de Londrina, potinho quente no coração — e a ovelhinha tem uma novidade: 

*30 carimbos MilkyPot!* ✨ Você chegou no VIP!

O inverno é perfeito para aquele potinho de Ninho quentinho, e a gente quer
que você continue aquecendo o inverno aqui no Muffato. Por isso:

*🎁 Upgrade grátis:* troca Mini → Médio na sua próxima visita.
Só mostrar essa mensagem pro atendente!

📍 Muffato — Av. Quintino Bocaiuva, 1045 | 14h–23h
```

> **Prazo do Template C:** Definir validade de 15 dias para criar urgência sazonal. Ajustar conforme estoque.

---

## Quando enviar cada template

| Perfil do cliente | Template |
|---|---|
| Engajado, responde WA, participa de campanhas | Template A — celebração + próximo nível |
| Compra frequente, pouco interativo no WA | Template B — direto |
| Marco atingido entre 01/07 e 31/08/2026 | Template C — inverno |
| Cliente silencioso (sumiu e voltou) | Template A, mas SEM mencionar o próximo nível — priorizar reconhecimento |

---

## Controle operacional

**Como identificar o 30º carimbo:**
- Sistema digital: `customer.stamps === 30` (ou múltiplo lógico com 10)
- Cartelas físicas: cliente está no 10º carimbo da 3ª cartela

**Antes de enviar:**
1. Confirmar primeiro nome do cliente
2. Confirmar qual benefício está disponível (topping grátis ou upgrade Mini→Médio)
3. Não enviar se o cliente já recebeu este template neste ciclo de 30 carimbos

**Registro:**
Anotar: `[DATA] · [NOME] · 30 carimbos · Template [A/B/C] · benefício resgatado? [S/N] · data resgate`

---

## Progressão completa do programa fidelidade

| Marco | Carimbos | Benefício | Arquivo de referência |
|---|---|---|---|
| Primeiro resgate | 10 | Potinho Mini grátis | `whatsapp-fidelidade-resgate.md` |
| Mid-loyalty | 15 | Topping bônus surpresa | `conversao-upsell-pdv-15carimbos.md` |
| Segundo resgate | 20 | Potinho Mini grátis | `whatsapp-fidelidade-resgate.md` (reenviado) |
| **VIP consolidado** | **30** | **Topping premium grátis ou upgrade Mini→Médio** | **Este arquivo** |
| Superfã VIP | 50 | Potinho Médio grátis | `whatsapp-50carimbos-superfan.md` |
| Lenda MilkyPot | 100 | Definir com franquia — impacto alto | A criar |

> **Gap restante:** Marco de 100 carimbos ("Lenda MilkyPot") — cliente evangelista ativo da marca. Criar `whatsapp-100carimbos-lenda.md` no próximo ciclo de conversão.

---

## Métricas para acompanhar

| Indicador | Meta |
|---|---|
| % de clientes 30 carimbos que resgatam o benefício em 15 dias | ≥ 60% |
| % de clientes 30 carimbos que chegam ao 50º (sem abandono) | ≥ 65% |
| % de clientes 30 carimbos que aumentam frequência no mês seguinte | ≥ 30% |

> **Por que a meta de continuidade (65%) é o KPI mais importante aqui:** O objetivo principal do template não é o resgate do topping — é a informação de que existe o marco de 50. Clientes que sabem do próximo nível reduzem em ~40% a evasão silenciosa nesta janela (referência: programas de fidelidade gamificados com "progress disclosure").

---

_Belinha — Ciclo #158 | 2026-05-08_
