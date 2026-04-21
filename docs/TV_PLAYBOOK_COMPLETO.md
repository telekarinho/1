# 📺 MilkyPot TV Playbook — Guia Operacional Completo

Sistema entregue em 4 fases (A–D). Este documento é a fonte única para operar e expandir as 3 TVs da loja.

---

## Índice
1. [Arquitetura em pedaços](#arquitetura)
2. [Fase A — 8 slides prontos](#fase-a)
3. [Fase B — Auto-sync com PDV](#fase-b)
4. [Fase C — Multi-tipo, dayparting, vertical, Lilo animada](#fase-c)
5. [Fase D — UGC, AR, ASMR](#fase-d)
6. [Runbook diário (20 min)](#runbook)
7. [Roadmap futuro](#roadmap)

---

## <a id="arquitetura"></a>1. Arquitetura em pedaços

```
┌─────────────────────────────────────────────────┐
│ PAINEL (HTML/JS, GitHub Pages em milkypot.com)  │
│  • tv-indoor.html           — config & dispositivos│
│  • tv-slides-generator.html — gerador 8 templates │
│  • tv-ugc-curadoria.html    — curadoria UGC       │
└─────────────┬───────────────────────────────────┘
              │ grava em
              ▼
┌─────────────────────────────────────────────────┐
│ FIRESTORE (datastore/)                          │
│  • tv_media_{fid}       — biblioteca            │
│  • tv_playlist_{fid}    — ordem                 │
│  • tv_playlist_{slot}_{fid} — dayparting        │
│  • tv_config_{fid}      — config global         │
│  • tv_shortcodes_{fid}  — tv1/tv2/tv3 → tvId    │
│  • tv_heartbeat_{fid}_{tvId} — saúde da TV      │
│  • tv_analytics_{fid}_{tvId} — contador exibições│
│  • challenge_300g_winners_{fid} — ganhadores    │
│  • ugc_feed_{fid}       — fotos aprovadas       │
└─────────────┬───────────────────────────────────┘
              │ lê (fetch REST, offline-first)
              ▼
┌─────────────────────────────────────────────────┐
│ APK NATIVO (Kotlin, ExoPlayer, WebView, ImageView)│
│  PlayerActivity (máquina de estados):           │
│    video → ExoPlayer                            │
│    image → ImageView                            │
│    html  → WebView                              │
│                                                 │
│  Overlays: clock · ticker · QR · emergency     │
│  Background: Heartbeat · AutoUpdater · Analytics│
└─────────────────────────────────────────────────┘
```

---

## <a id="fase-a"></a>2. Fase A — 8 slides psicológicos prontos

**Página:** `milkypot.com/painel/tv-slides-generator.html`

| # | Template | Gatilho | Quando usar |
|---|---|---|---|
| A1 | Escassez do Dia | FOMO / aversão à perda | Horário de pico |
| A2 | Hall da Fama 300g | Prova social hiperlocal | Todo dia, rotação constante |
| A3 | Termômetro da Cidade | Efeito manada | Após 30 pedidos (dá peso ao dado) |
| A4 | Combo da Lilo | Reduz paralisia de decisão | TV 2 balcão de pedido |
| A5 | Ancoragem de Preço | Empurra G vs P | TV 2 sempre |
| A6 | Contador Potinhos Hoje | Consenso numérico | TV 1 entrada, após 50 vendas |
| A7 | Parede dos Arrependidos | Upsell via aversão | TV 2 (cliente com 1 sabor) |
| A8 | Episódio da Lilo | Fideliza retorno | Semanal, TV 3 espera |

**Como gerar:**
1. Abre a página
2. Clica no card do template
3. Preenche os campos (aparece preview em tempo real)
4. **Baixa PNG 1920×1080** → sobe em "TV Indoor → adicionar mídia"
5. **Ou "Publicar direto na TV"** → sobe direto na playlist (precisa estar logado como franqueado)

---

## <a id="fase-b"></a>3. Fase B — Auto-sync com o PDV

Botão **⚡ Usar dados reais do PDV** no gerador preenche automaticamente os campos com valores reais do Firestore:

- **A2** — pega últimos 3 ganhadores do desafio 300g
- **A3** — calcula % sabores das últimas 24h (agrega `orders_{fid}`)
- **A6** — conta potinhos vendidos hoje (soma `qty` de items)

**Modo automático** (toggle): o slide se atualiza **e republica** na TV a cada 15 min. Cliente vê o contador subindo sem ninguém mexer.

**Pra registrar ganhadores do Desafio 300g** (chama do PDV ou balança):
```js
TvLiveData.addWinner300g(franchiseId, 'Marina', 300.1)
// depois o A2 pega automaticamente via fillTemplate
```

---

## <a id="fase-c"></a>4. Fase C — APK v1.3: multi-tipo, dayparting, vertical

### 4.1 Multi-tipo (video / image / html)

Até v1.2 só rodava `type: "video"`. A partir de v1.3 a playlist aceita:

```json
[
  { "mediaId": "m_video1", "duration": 15 },
  { "mediaId": "m_slide_promo", "duration": 8 },
  { "mediaId": "m_lilo_pesa", "duration": 12 }
]
```

Com as mídias:
```json
[
  { "id": "m_video1",      "type": "video", "url": "https://...mp4" },
  { "id": "m_slide_promo", "type": "image", "url": "https://...png" },
  { "id": "m_lilo_pesa",   "type": "html",  "url": "https://milkypot.com/slides/lilo-pesa-sabor.html" }
]
```

### 4.2 Dayparting — playlist diferente por horário

`tv_config_{fid}.schedules`:
```json
[
  { "from": "07:00", "to": "11:00", "playlistKey": "tv_playlist_manha_{fid}" },
  { "from": "11:00", "to": "14:00", "playlistKey": "tv_playlist_almoco_{fid}" },
  { "from": "14:00", "to": "18:00", "playlistKey": "tv_playlist_tarde_{fid}" },
  { "from": "18:00", "to": "22:00", "playlistKey": "tv_playlist_noite_{fid}" }
]
```

### 4.3 Orientation configurável

`tv_config_{fid}.orientation = "landscape" | "portrait" | "auto"`

Uma das 3 TVs pode ser vertical 9:16 pra exibir conteúdo TikTok sem distorcer.

### 4.4 Slides animados da Lilo

Em `milkypot.com/slides/`:

| Arquivo | O que é |
|---|---|
| `lilo-pesa-sabor.html` | Balança girando até cravar 300g (teaser do desafio) |
| `lilo-sabor-do-dia.html?c=morango` | Lilo apaixonada pelo sabor; aceita `?c=morango\|ninho\|nutella\|oreo\|capuccino` |
| `lilo-combinacao-proibida.html` | Lilo experimenta azeitona e fica verde |

Todos ~1920×1080 responsivos, CSS+SVG puro, loop perfeito. Basta cadastrar como mídia `type: html` e apontar a URL.

---

## <a id="fase-d"></a>5. Fase D — UGC, AR, ASMR

### 5.1 UGC Live Wall (`painel/tv-ugc-curadoria.html`)

Fluxo:
1. Cliente posta story marcando @milkypot
2. Franqueado salva a print no celular
3. Abre **UGC Curadoria** → arrasta fotos → digita @ do autor
4. Clica **✓ Aprovar** na foto
5. Ativa toggle **"Ativar UGC na TV 3"**
6. Fotos aprovadas entram automaticamente em `tv_media_{fid}` + playlist

**Regra de ouro:** 20 min/dia de curadoria = pipeline infinito de conteúdo. Oferece **1 topping grátis na próxima visita** pra quem posta — converte 30%+ dos clientes.

### 5.2 AR via QR — Filtro da Lilo

Não precisa implementar no APK. Fluxo:

1. Cria um filtro Instagram/Spark AR (https://sparkar.facebook.com) — modelo 2D da Lilo + logo MilkyPot
2. Publica o filtro (leva 3-5 dias de aprovação)
3. No painel TV Indoor, cadastra o **QR code** apontando pra URL do filtro (algo tipo `instagram.com/ar/xyz`)
4. Slide tem QR gigante com call "Escaneia e vira Lilo"
5. Cliente escaneia → filtro abre no Instagram → grava story → marca @milkypot
6. Foto volta pro UGC Wall (5.1) → fecha o loop

**Custo:** Zero. Spark AR é grátis.
**Tempo:** 1 semana total (1 dia de modelagem + 3-5 dias de aprovação Meta).

### 5.3 ASMR Pack — guia de gravação

**Equipamento:**
- Celular moderno (iPhone 12+ ou Android flagship)
- Microfone de lapela com cabo (BM-800, Boya BYM1 — R$ 60-120)
- Mini tripé R$ 30
- Ring light ou luz natural de janela

**10 clipes pra gravar em 2 horas:**

1. **Colher cortando sorvete** — 15s, slow motion 240fps
2. **Topping caindo em espiral** — 10s, vista de cima
3. **Pote fechando com "clique"** — 8s, close extremo
4. **Chantilly girando sobre o sorvete** — 12s, vista lateral
5. **Morango sendo cortado** — 10s, 240fps
6. **Calda derretida escorrendo** — 15s, gravity-aware
7. **Granulado caindo** — 8s, slow motion
8. **Colher entrando no sorvete duro** — 10s, áudio de "crack"
9. **Sorvete derretendo em time-lapse** — 15s, 10× speed
10. **Ovelhinha de pelúcia ao lado do pote** — 12s, foco rack

**Edição:**
- CapCut ou iMovie (grátis)
- Sem texto, sem música
- **Só áudio ambiente** (ASMR puro)
- Exportar 1920×1080 MP4 H.264
- Cada clipe vira mídia `type: video` com `duration` do próprio vídeo

**Calendário:**
- Dia 1: gravação (2-3 horas)
- Dia 2: edição (1-2 horas)
- Dia 3: upload em lotes de 2-3 ao painel
- Mês 1: repete pra ter 30 clipes (rotação semanal)

---

## <a id="runbook"></a>6. Runbook diário do franqueado (20 min)

### Manhã (9h — 5 min)
- Abre `tv-indoor.html`
- Confere 📡 **Status das TVs** — as 3 online?
- Se alguma vermelha: reinicia TV / reconecta rede

### Almoço (13h — 5 min)
- Abre `tv-slides-generator.html`
- Seleciona **A6 Contador Potinhos** → **Usar dados reais** → **Publicar na TV**
- Ou ativa **Modo automático** (faz sozinho a cada 15 min)

### Tarde (17h — 5 min)
- Abre `tv-ugc-curadoria.html`
- Sobe 3-5 prints de stories marcando @milkypot
- Aprova os melhores
- Toggle **UGC na TV 3** ligado → fotos entram na rotação

### Fim do dia (20h — 5 min)
- Abre `tv-slides-generator.html`
- **A3 Termômetro da Cidade** → **Usar dados reais** → **Publicar**
- **A2 Hall da Fama 300g** → **Usar dados reais** → **Publicar**
- Desliga PC / Vai pra casa

---

## <a id="roadmap"></a>7. Roadmap futuro (não entregue, sugestões)

### Fase E — Wall Mode sincronizado
As 3 TVs tocam a MESMA cena sincronizada por NTP (Lilo "atravessa" as 3 telas). Precisa de:
- Cálculo de offset NTP (`SystemClock.elapsedRealtime()` + sync com servidor)
- `wall_role: "left" | "center" | "right"` por TV
- Vídeo master dividido em 3 clipes com início sincronizado

Esforço: ~1 semana.

### Fase F — Câmera do Desafio 10s ao vivo
Webcam USB no balcão + overlay na TV 3 mostrando em tempo real quem tá jogando o Desafio 10 Segundos. Precisa de:
- WebRTC entre APK TV e dispositivo com câmera
- UI sobreposta ao vídeo com timer ao vivo
- Botão "GANHOU / PERDEU" no PDV que reflete na TV

Esforço: ~1 semana.

### Fase G — Ranking de sabores automatizado nos stories
Bot que posta no Instagram toda quinta o gráfico A3 Termômetro. Precisa:
- Graph API do Instagram (precisa conta Business)
- Cron job diário no Firebase Functions

Esforço: ~3 dias.

---

## Suporte & FAQ

**Q: Como adiciono uma nova TV?**
R: Em `tv-indoor.html` → seção **Minhas TVs** → **+ Adicionar TV** → gera `tvId` e `shortcode` (tv1/tv2/tv3). Abre o APK na TV → escolhe o shortcode.

**Q: TV travou, o que faço?**
R: APK v1.2+ tem auto-restart preventivo a cada 60 min. Se continuar, segura BACK no controle por 2s → volta pra seleção → escolhe de novo.

**Q: Como atualizo o APK?**
R: Automático! APK v1.2+ verifica `milkypot.com/tv.apk` a cada 6h. Ou manualmente: abre `milkypot.com/tv.apk` no browser da TV.

**Q: Quanto custa operar isso?**
R: Zero. GitHub Pages gratis + Firestore cota grátis (suporta até ~50k leituras/dia) + APK rodando em qualquer TV Android > R$ 200.

---

*Gerado por Claude com 5 agents de marketing (Ad Creative Strategist, Content Creator, Livestream Commerce Coach, Whimsy Injector, Trend Researcher) + implementação em 4 fases.*
