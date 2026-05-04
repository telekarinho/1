# Templates WA — Milestones Fidelidade MilkyPot

> Quando usar: logo após `addPointsFromOrder()` retornar `milestoneCrossed !== null`
> ou `rewardEarned === true`. Enviar no WhatsApp do cliente individualmente (não broadcast).
> Tom: fofo, ovelhinha, celebração — não promocional.

---

## Milestone 10 pontos — "Potinho Fiel"

> Gatilho: `milestoneCrossed === 10`

**Texto:**

```
🐑✨ *Oi, [NOME]!*

A ovelhinha anotou: você já tem *10 pontos* no MilkyPot! 🎉

Cada potinho te leva mais perto da sua recompensa — continue assim!

👉 Acumule *100 pontos* e ganhe um sorvete Mini de graça 🍦

A gente te vê no próximo potinho 🤍
— MilkyPot Londrina | Muffato
```

**Variáveis:** `[NOME]` = `customer.name` (primeiro nome)
**Quando enviar:** imediatamente após a confirmação do pedido
**Canal:** WA direto (não stories, não broadcast geral)

---

## Milestone 50 pontos — "Meio Caminho!"

> Gatilho: `milestoneCrossed === 50`

**Texto:**

```
🐑🌈 *[NOME], você está na metade!*

50 pontos conquistados no MilkyPot — uau! 🎊

Faltam só *50 pontos* para você ganhar um sorvete Mini de graça 🍦✨

Dica da ovelhinha: um potinho por semana e você chega lá em menos de 2 meses 😉

Até a próxima visita!
— MilkyPot Londrina | Muffato
```

**Variáveis:** `[NOME]` = `customer.name` (primeiro nome)
**Quando enviar:** imediatamente após a confirmação do pedido
**Canal:** WA direto

---

## Milestone 100 pontos — "Recompensa Desbloqueada!" 🏆

> Gatilho: `rewardEarned === true`

**Texto:**

```
🐑🎁 *PARABÉNS, [NOME]!*

Você chegou aos *100 pontos* e desbloqueou sua recompensa:

🍦 *Sorvete Mini GRÁTIS* 🍦

É só mostrar essa mensagem na nossa loja no Shopping Muffato e resgatar! Válido na sua próxima visita.

Obrigada por fazer parte da família MilkyPot 🤍🌈
— MilkyPot Londrina | Muffato
📍 Av. Quintino Bocaiuva, 1045
```

**Variáveis:** `[NOME]` = `customer.name` (primeiro nome)
**Quando enviar:** imediatamente após a confirmação do pedido
**Atenção operacional:** o operador deve cruzar com `customer.rewards` para confirmar o reward ID antes de resgatar no PDV

---

## Guia de implementação (para o operador/desenvolvedor)

```js
// Exemplo de uso após processar pedido entregue:
const result = Loyalty.addPointsFromOrder(order, franchiseId);

if (result) {
    if (result.rewardEarned) {
        // Enviar template "100 pontos — Recompensa Desbloqueada"
        sendWhatsApp(result.customer.phone, templateReward(result.customer.name));
    } else if (result.milestoneCrossed) {
        // Enviar template do milestone atingido (10 ou 50)
        sendWhatsApp(result.customer.phone, templateMilestone(result.customer.name, result.milestoneCrossed));
    }
}
```

**Prioridade:** `rewardEarned` tem prioridade — se o cliente cruzou 50 e 100 no mesmo pedido, só envia o de recompensa.

---

_Belinha — Ciclo #111 | 2026-05-04_
