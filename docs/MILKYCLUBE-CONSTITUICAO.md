# 👑 Constituição do MilkyClube

> **Versão canônica.** Qualquer IA, dev ou copywriter que for tocar em superfície customer-facing da Milkypot deve ler esse arquivo ANTES de escrever uma linha. As regras abaixo não são sugestão — são contrato.

> **Última atualização:** 2026-05-19. Definida pelo fundador da Milkypot.

---

## 🧭 REGRA MÃE

> **O cliente nunca deve ver sistema.
> O cliente deve ver progresso.**

Tudo o que vier abaixo deriva dessa regra. Se uma decisão visual ou de copy contradisser a regra mãe, ela está errada — não importa quão bonita seja.

---

## 🚫 PROIBIDO na interface do cliente

| Termo / Conceito | Por quê |
|---|---|
| `cashback` | Reduz Milkypot a mecânica de desconto. Vira "caçador de cupom". |
| `ROI`, `custo`, `retorno` | Linguagem de gestão. Não é problema do cliente. |
| `recompensa em R$` (ex: "+R$ 5,00") | Quantifica em dinheiro = vira moeda paralela. Quebra branding premium. |
| `chance rara`, `chance lendária`, `chance épica` | Linguagem de cassino / aposta. Risco legal e percepção tóxica. |
| `loot`, `drop` | Gambling / gamer-jargon. Não é gourmet. |
| `cupom`, `desconto` | Milkypot **não dá desconto** — desbloqueia conquista. |
| Regra longa | Se precisa explicar em mais de 1 frase, está errado. |
| Promoção complexa | "Compre X, ganhe Y se Z, válido até W". Cliente desiste. |

---

## ✅ PERMITIDO na interface do cliente

| Termo | Quando usar |
|---|---|
| `moedas do clube`, `moedas` | Saldo de progresso. Nunca convertido em R$ pra cliente. |
| `nível` | Bronze → Silver → Gold → Lendário. Status do cliente. |
| `conquista` | O que ele desbloqueou (visita 5, streak 7 dias, 300g). |
| `benefício VIP` | O que vem com o nível (fila VIP, raspadinha premium, topping premium). |
| `recompensa surpresa` | Equivalente psicológico de "prêmio" — sem ar de cassino. |
| `desafio` | 300g, 10s, streak. Evento de skill, não de sorte. |
| `progresso` | A jornada do cliente. Visível, mensurável, celebrável. |
| `sequência`, `streak` | Hábito sendo construído. |
| `desbloquear` | Verbo central. Não "ganhar", não "receber". `Desbloquear`. |

---

## 📐 REGRA DE TELA

> Cada tela tem **no máximo**:
> - **1 título forte**
> - **1 frase de apoio**
> - **1 CTA**
> - **1 visual principal**

Se a tela precisa explicar mais que isso, a tela está errada. Quebre em mais telas, ou corte conteúdo.

**Não tem espaço pra:**
- Bullet list grande
- "Saiba mais" embaixo
- Footer com links
- "Termos e condições visíveis no rodapé"

---

## 📺 REGRA DE TV

> A pessoa precisa entender de **longe**, em **3 segundos**.

Isso significa:
- Tipografia gigante (headline ≥ 6vmin)
- 1 número ou 1 promessa por slide
- Subtext **NÃO existe** em slide de TV (mata leitura à distância)
- QR só se houver ação direta possível
- Movimento sutil (não distração)

---

## 👤 REGRA DE CLIENTE

> O cliente só precisa entender **3 coisas**:
> 1. **Tenho um nível.**
> 2. **Quanto mais volto, mais evoluo.**
> 3. **Tudo fica salvo no Milkypass.**

Qualquer mensagem que não reforce uma dessas 3 coisas é ruído.

**Teste rápido:** se você perguntasse pra um cliente novo "o que é Milkypot?" depois de 30 segundos no app, ele deve responder com uma dessas 3 frases. Se ele falar "é um app de desconto" ou "é tipo um cartão fidelidade" → falhou.

---

## 💰 REGRA FINANCEIRA

> Nenhum benefício pode parecer desconto barato.
> **Todo benefício deve incentivar nova compra, retorno ou aumento de ticket.**

Critérios pra aprovar um benefício novo:
- Custa pouco? (CMV baixo)
- Aumenta ticket? (ex: topping premium grátis → cliente pega sobremesa)
- Cria retorno? (ex: sundae grátis na 1ª visita do mês → cliente volta no mês)
- Não vira moeda paralela? (não é R$ disfarçado)

**Bons exemplos:**
- 🍦 Topping premium grátis (CMV baixo, percepção alta)
- ⏱️ Fila VIP em desafio (custo zero, ego alto)
- 🛡️ Streak protegido por 1 dia (custo zero, retenção alta)
- 🎂 Benefício VIP de aniversário (1× ao ano, força visita)

**Maus exemplos:**
- "+R$ 5,00 de cashback" (R$ explícito + sem incentivo a voltar)
- "20% off" (desconto puro)
- "Cupom de R$ 10" (transacional)

---

## 🍦 REGRA DE MARCA

> **Milkypot não dá desconto.
> Milkypot desbloqueia conquistas.**

Toda copy de marca deve refletir isso. Mesmo em momento de campanha, mesmo em data sazonal.

**Errado:**
- "20% de desconto no dia das mães!"
- "Aproveite o cupom de Páscoa!"
- "Compre 2, leve 3"

**Certo:**
- "Mãe ganha topping premium liberado no perfil dela hoje."
- "Dia das mães desbloqueia nível Silver pra quem trouxer a mãe."
- "Acertou o desafio? A 3ª bola sai por nossa conta."

---

## 🧪 CHECKLIST antes de subir qualquer coisa pro cliente

Antes de aprovar um PR que toca em copy/visual customer-facing, marque:

- [ ] Nenhum termo da lista PROIBIDO aparece (busca: cashback, R\$, cupom, desconto, chance rara, loot, drop, ROI)
- [ ] A tela passa no teste do "1 título / 1 frase / 1 CTA / 1 visual"
- [ ] Se é TV: passa no teste dos 3 segundos a 3 metros de distância
- [ ] A mensagem reforça uma das 3 coisas que o cliente precisa entender
- [ ] O benefício (se houver) tem CMV baixo e incentiva retorno
- [ ] Verbo central é `desbloquear`, não `ganhar` ou `receber`

Se uma das caixinhas não pode ser marcada → o PR não sobe.

---

## 📍 Onde os limites começam: customer vs. admin

**É customer-facing (a Constituição vale 100%):**
- `desafio.html` (TV indoor)
- `clube.html` (Milkypass)
- `cardapio.html`
- `raspinha.html`
- `influencer.html`
- `regulamento-milkyclube.html`
- `index.html` (landing)
- Qualquer message do WhatsApp / Belinha pro cliente
- Notificações push
- Stories / posts de Insta da marca

**É admin-facing (termos técnicos permitidos):**
- `painel/*.html` — ROI, custo, retorno, tier, drop, chance podem aparecer aqui
- `autopilot/*` — código interno
- Documentação técnica

**Cuidado** — algumas telas do painel mostram preview do que o cliente vai ver. Esse preview tem que seguir a Constituição mesmo dentro do admin.

---

## 🔁 Quando essa Constituição muda?

Só o fundador da Milkypot pode alterar a Regra Mãe e os pilares (PROIBIDO / PERMITIDO / Regra de Cliente / Regra Financeira / Regra de Marca).

Refinamentos editoriais (exemplos, casos de uso, checklist) podem ser propostos por qualquer dev/IA via PR — mas precisam ser aprovados pelo fundador antes de mergear.

Versionamento: este arquivo segue `git log -- docs/MILKYCLUBE-CONSTITUICAO.md` como histórico oficial.
