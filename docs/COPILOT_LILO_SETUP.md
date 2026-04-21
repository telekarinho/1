# 🐑 Lilo AI — Setup do Copiloto Executivo

Guia passo-a-passo pra ativar a Lilo AI, copiloto executivo exclusivo da MilkyPot.

**Tempo total:** 5 min
**Custo mensal estimado:** R$ 30–80 (uso operacional diário)

---

## O que é a Lilo AI

- **Copiloto executivo** que lê os dados reais da sua franquia (vendas, estoque, TVs, desafios, stories)
- **Briefing automático** toda manhã: alertas, oportunidades, ações do dia
- **Gera conteúdo**: copies pro Instagram, slides de TV, scripts TikTok, mensagens de WhatsApp
- **Aponta onde está perdendo dinheiro** com análise de margem, CMV, ticket médio
- **Funciona como mentor** — desafia, questiona, sugere ações executáveis

---

## Passo 1 — Criar conta no Anthropic Console

1. Vai em <https://console.anthropic.com/login>
2. Cria conta grátis (e-mail + senha)
3. Adiciona créditos iniciais (mínimo US$ 5 — dura ~1 mês de uso diário normal)

> ⚠️ **Importante:** o plano **Claude Pro** (chat) **NÃO** dá acesso à API. Precisa criar conta separada no Console. Se você já é Claude Pro/Max, é o mesmo e-mail, mas é uma "organização" diferente com billing próprio.

---

## Passo 2 — Gerar API Key

1. Console → **Settings → API Keys** (<https://console.anthropic.com/settings/keys>)
2. **Create Key**
3. Nome: `MilkyPot Lilo AI`
4. Copia a key (começa com `sk-ant-api03-…`)
5. **Guarda!** Ela só aparece uma vez.

---

## Passo 3 — Configurar na Lilo

1. Abre <https://milkypot.com/painel/copilot-lilo.html>
2. Clica em **⚙️ Configurar API key** (canto inferior esquerdo)
3. Cola a API key
4. Escolhe o modelo:
   - **claude-sonnet-4-5** (padrão) — melhor custo/benefício pra uso diário
   - **claude-opus-4** — 5× mais caro, só pra análises estratégicas profundas
   - **claude-haiku-4** — 5× mais barato, respostas rápidas e diretas
5. **Salvar**

A Lilo vai dizer "✅ Configuração salva. Já posso responder!" e está pronta.

---

## Passo 4 — Primeiro briefing

1. Clica em **🌅 Briefing do dia AGORA** (primeiro botão do sidebar esquerdo)
2. Ela vai:
   - Ler seu estado atual (vendas, estoque, TVs, etc.)
   - Gerar alertas prioritários
   - Sugerir 1 oportunidade do dia
   - Te perguntar se quer aplicar a ação #1

A partir do dia seguinte, o briefing roda automaticamente quando você abre a página pela primeira vez no dia.

---

## Passo 5 — Explore as 10 ações rápidas

Do lado esquerdo tem botões prontos:

- 📊 **Diagnóstico da semana** — análise executiva completa
- 🎯 **5 campanhas virais radicais** — ideias fora da caixa
- 📱 **3 copies pro Instagram** — prontos pra postar
- 📺 **Slide novo pra TV** — qual template, textos, cores
- 💰 **Onde estou perdendo dinheiro?** — análise de vazamento
- 🔥 **3 verdades duras pra mim** — mentor modo brutal
- 📈 **Relatório executivo 1 página** — pra investidor/sócio
- 🎉 **Oportunidades sazonais** — eventos próximos que você pode explorar
- 🎬 **Script TikTok 15s** — com ovelhinha Lilo
- 🧮 **Precificação ótima** — P/M/G baseado no seu CMV

---

## Custos

Custo é por **uso efetivo** (tokens enviados e recebidos).

| Modelo | Input /1M | Output /1M | Exemplo por conversa |
|---|---|---|---|
| **Haiku 4** | US$ 0,80 | US$ 4 | ~R$ 0,02 |
| **Sonnet 4.5** | US$ 3 | US$ 15 | ~R$ 0,15 |
| **Opus 4** | US$ 15 | US$ 75 | ~R$ 0,80 |

**Uso diário recomendado (Sonnet):**
- 1 briefing matinal + 3 perguntas = ~R$ 1/dia
- ~R$ 30/mês com uso regular
- ~R$ 80/mês com uso intensivo (10+ perguntas/dia)

O custo estimado aparece no badge "Custo: R$ X,XXX" no topo do chat (acumulado da sessão atual).

---

## Segurança

- **API key fica salva no seu navegador** (DataStore/localStorage), criptografada em repouso pelo próprio Chrome
- **Nenhum servidor MilkyPot armazena a key** — ela só trafega do painel → Anthropic direto
- **Nada é enviado ao Anthropic** além do que você perguntar e do contexto resumido (números agregados, não dados pessoais de clientes)
- **Pode revogar a qualquer momento** em <https://console.anthropic.com/settings/keys>

---

## FAQ

**"Quanto tempo demora uma resposta?"**
Sonnet: ~3–6 segundos pra respostas normais, ~15 segundos pra análises longas.

**"Ela alucina?"**
Pouco — o system prompt explicita "nunca invente dado. Se o contexto não tem, diga me passa o dado X". Se notar algo impreciso, pergunta "de onde tirou esse número?" e ela admite.

**"Dá pra usar no celular?"**
Sim. A página é responsiva. Abre `milkypot.com/painel/copilot-lilo.html` no Chrome do celular.

**"E se eu esquecer a key?"**
Anthropic permite criar novas. Só deletar a antiga e cadastrar outra.

**"Dá pra integrar com WhatsApp?"**
Ainda não, mas é a próxima fase. O roadmap é: Lilo manda briefing matinal automático no seu WhatsApp Business.

**"Ela pode executar ações no sistema?"**
Por enquanto, sugere em formato estruturado (bloco `action` no final da resposta). A execução automática (clique "Aplicar") está em desenvolvimento pra próxima versão.

---

## Troubleshooting

**"❌ Erro: api_key_missing"** → Cola a key em ⚙️ Configurar.

**"❌ 401 Unauthorized"** → Key inválida ou revogada. Gera nova no console.

**"❌ 529 Overloaded"** → Anthropic sobrecarregada. Tenta em 30s. Raro.

**"❌ 400 Credit balance"** → Sem créditos. Adiciona em <https://console.anthropic.com/settings/billing>.

**"Respostas muito genéricas"** → Muda pra `claude-opus-4` em ⚙️. Ou passa mais contexto no prompt ("aqui está o meu DRE: ...").

---

## Roadmap (não entregue ainda)

- [ ] Botão "Aplicar ação" em respostas estruturadas (publicar slide, pausar TV, etc.) — v2
- [ ] Lilo no WhatsApp: briefing matinal + alertas críticos
- [ ] Lilo que fala: áudio TTS pras respostas
- [ ] Lilo proativa (push): alerta em tempo real quando estoque crítico, TV offline, etc.
- [ ] Lilo super_admin multi-franquia: ranking de franquias, comparativo, benchmarks

---

*Última atualização: 2026-04-21*
