# MilkyPot Desafio — App Windows Offline

Wrapper Electron do `desafio.html` rodando 100% offline no Windows.

Mesmo comportamento do PDV e TV Indoor: o app abre em tela cheia, serve os arquivos estáticos de um servidor HTTP interno (porta efêmera `127.0.0.1:PORT`) e usa o service worker + localStorage do próprio desafio para funcionar sem internet.

## Pré-requisitos

- Node.js 18+ (https://nodejs.org)
- Windows 10/11 x64

## Desenvolvimento (rodar direto)

```bash
cd desafio-desktop
npm install
npm start
```

Abre uma janela em tela cheia com `desafio.html`. Atalhos:

- **F11** — toggle fullscreen
- **Ctrl+R** — reload
- **Ctrl+Shift+I** — DevTools (só em dev)
- **Ctrl+Q** — sair

## Build do instalador `.exe`

```bash
cd desafio-desktop
npm install
npm run dist
```

Gera em `desafio-desktop/dist/`:

- `MilkyPot Desafio Setup X.Y.Z.exe` — instalador NSIS (cria atalho no Desktop + Iniciar)
- `MilkyPot Desafio X.Y.Z.exe` — versão portable (roda sem instalar)

### Modo portable (só portable, sem instalador)

```bash
npm run dist-portable
```

## Como funciona offline

1. Ao abrir, o Electron inicia um servidor HTTP local na porta `127.0.0.1:<aleatória>`
2. Serve `desafio.html` + todos os recursos estáticos (`/js`, `/css`, `/images`) diretamente do `resources/app-root` empacotado
3. O `sw.js` do MilkyPot assume o cache offline normalmente
4. `localStorage` e `indexedDB` persistem entre reinicializações (profile do Electron)
5. Quando há internet, o desafio sincroniza com Firestore; sem internet, usa localStorage (fallback já existente em `desafio.html`)

## Arquivos incluídos no pacote

Via `extraResources.filter` no `package.json`:

- `desafio.html`, `desafio-tv.html`
- `manifest.json`, `sw.js`
- `images/**`
- `js/**`
- `css/**`

**Excluídos:** `painel/`, `admin/`, `autopilot/`, `.claude/`, `node_modules/` raiz, `.git/`.

## Trocar ícone

Colocar `build/icon.ico` (256×256 recomendado). Se não existir, o electron-builder usa o ícone padrão do Electron.

## Modo kiosk (trava a máquina)

Para loja/totem: em `main.js`, mudar:

```js
kiosk: false,
```

Para:

```js
kiosk: true,
```

Assim a janela trava em fullscreen e F11/Alt+F4 não fecham.

## Troubleshooting

- **Tela preta ao abrir:** porta do servidor local bloqueada por antivírus/firewall. Veja o log no console — se `servidor local na porta 0`, o sistema bloqueou.
- **Sem webcam:** o desafio oferece botão "Prefiro não tirar foto" em `desafio.html`. Se a máquina não tem webcam, o jogador usa esse caminho.
- **Dados não sincronizam:** normal offline. Quando a máquina volta pra internet, o desafio sincroniza em background.
