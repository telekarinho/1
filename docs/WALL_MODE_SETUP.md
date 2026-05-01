# 🎬 Wall Mode — 3 TVs sincronizadas como uma só

Faz a ovelhinha "atravessar" as 3 TVs da loja, ou dá escala épica a uma cena panorâmica. Impacto visual imediato.

---

## Como funciona

- Você grava UM vídeo 5760×1080 (ou 16:9 esticado) e corta em **3 pedaços** de 1920×1080 cada (left / center / right).
- Sobe os 3 como mídia no painel, com campo especial `wallParts`.
- Cada TV, baseada no seu `wallRole` configurado (left / center / right), escolhe automaticamente seu pedaço.
- **Sincronização** via relógio do sistema: todas as 3 TVs fazem `seekTo(now % duration)` na hora de tocar. Tolerância: ±200ms (imperceptível).

---

## Setup (uma vez por loja)

### Passo 1 — Configurar wallRole por TV

1. Abre `milkypot.com/painel/tv-indoor.html`
2. Rola até **🎬 Wall Mode**
3. Pra cada TV cadastrada, escolhe:
   - **⬅ Esquerda** — a TV mais à esquerda da parede
   - **⬛ Centro** — a TV do meio
   - **➡ Direita** — a TV da direita
   - **— Sem Wall Mode —** — TV normal

A ordem é fisicamente crescente (esquerda → direita olhando pra parede). Se só tem 2 TVs, use esquerda + direita e o vídeo precisa ser em 2 partes.

### Passo 2 — Gravar vídeo panorâmico

**Proporção recomendada:** 5760×1080 (três 16:9 lado a lado).

Ferramentas gratuitas:
- **Canva** (template "Video Ultra Wide" ou crie custom 5760×1080)
- **Figma** (crie frame 5760×1080, exporta como vídeo via plugin)
- **CapCut Pro** (workspace custom)
- **After Effects** (profissional)

Duração sugerida: 10-20 segundos (loop perfeito, frame inicial == frame final).

### Passo 3 — Cortar em 3 partes

No mesmo programa, exporte 3 vídeos:
- **left.mp4** — `0` a `1920` do eixo X, 1080 altura
- **center.mp4** — `1920` a `3840`, 1080 altura
- **right.mp4** — `3840` a `5760`, 1080 altura

Ou use ffmpeg (se você tem):
```bash
ffmpeg -i panorama.mp4 -filter:v "crop=1920:1080:0:0"    left.mp4
ffmpeg -i panorama.mp4 -filter:v "crop=1920:1080:1920:0" center.mp4
ffmpeg -i panorama.mp4 -filter:v "crop=1920:1080:3840:0" right.mp4
```

### Passo 4 — Upload dos 3 pedaços

1. No `tv-indoor.html`, sobe os 3 vídeos como mídias separadas (sugestão de nomes: `wall_left`, `wall_center`, `wall_right`).
2. Anota os IDs retornados (aparecem na biblioteca de mídias).

### Passo 5 — Criar a mídia Wall

No Firestore (ou via botão especial, se disponível):

```json
{
  "id": "m_wall_ovelhinha_atravessa",
  "type": "video",
  "name": "Ovelhinha atravessa as 3 TVs",
  "duration": 12,
  "wallParts": {
    "left":   "https://...wall_left.mp4",
    "center": "https://...wall_center.mp4",
    "right":  "https://...wall_right.mp4"
  }
}
```

Adiciona essa mídia na playlist normal (`tv_playlist_{fid}`).

### Passo 6 — Reinicia as 3 TVs

- Segura BACK no controle → volta pra seleção → entra de novo
- Ou aguarda o reload preventivo automático (60min no APK v1.2+)

---

## Boas práticas de design pra Wall Mode

- **Movimento horizontal** — dê sensação de escala (ovelhinha correndo da esquerda pra direita, vento atravessando, sol nascendo no centro)
- **Frame inicial = frame final** — pro loop ficar imperceptível
- **Elementos fortes no centro** — TV central chama mais atenção que as laterais
- **Cores ousadas** — gradientes grandes funcionam melhor que detalhes finos (TVs podem ter cores levemente diferentes)
- **Sem texto legível esticado** — texto deforma entre as 3 TVs. Prefira logos curtos ou ícones
- **Duração 12-20s** — nem muito curto (irrita) nem muito longo (cliente não presencia o loop completo)

---

## Ideias de conteúdo Wall Mode pra MilkyPot

1. **Ovelhinha corre da esquerda pra direita** pulando entre 3 potes gigantes
2. **Chuva de confete cai** com o logo MilkyPot aparecendo no centro
3. **Onda de sorvete derretendo** que atravessa as 3 telas
4. **Galáxia 3D girando** com potinhos orbitando o centro
5. **"SAUDADES? SEGUE A OVELHINHA"** — Lilo anda da esquerda pra direita, cada tela mostra ela em pose diferente
6. **Contador gigante "1000 POTINHOS" dividido nas 3 telas** (esquerda "1", centro "000", direita "POTINHOS")

---

## Troubleshooting

**TVs fora de sync (gap visível ≥500ms)**
→ As TVs não estão com hora do sistema sincronizada. Em Android TV, ative **Data/Hora automática** em Configurações. Sem isso, drift de minutos pode acontecer.

**Uma TV mostra vídeo inteiro (não o pedaço certo)**
→ `wallRole` não foi configurado pra essa TV OU `wallParts` não tem a URL pra aquele role. Confira `tv_config.wallRoles[tvId]` no Firestore.

**Vídeo não roda loop perfeito (piscada no fim)**
→ O arquivo MP4 precisa ter **frame 1 == último frame**. Edita no CapCut/FCP/Premiere pra garantir.

**Sync funciona ao iniciar mas dessincroniza com o tempo**
→ Normal em vídeos longos (>30s). O APK re-sincroniza a cada loop. Pra loops longos, considere mídia `type: "html"` em vez de vídeo (JavaScript tem controle mais fino).

---

*Última atualização: 2026-04-21*
