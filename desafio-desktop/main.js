/* ============================================================
   MilkyPot Desafio — App Windows Offline (Electron Wrapper)
   ============================================================
   - Abre desafio.html em tela cheia, sem bordas, kiosk-like
   - Servidor HTTP interno serve a raiz do projeto (preserva URLs absolutas /js/... /images/...)
   - Funciona 100% offline: service worker ja cuidava disso, aqui so reforcamos
   - Atalhos:
       F11 → toggle fullscreen
       Ctrl+Q → sair
       Ctrl+R → reload
       Ctrl+Shift+I → DevTools (so em dev)
   ============================================================ */
'use strict';

const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Em dev, a raiz do projeto fica 1 nivel acima. Em prod (empacotado), fica em resources/app-root.
const APP_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'app-root')
  : path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf'
};

let serverPort = 0;
let mainWindow = null;

// Servidor HTTP local (porta efemera aleatoria)
function startLocalServer(rootDir){
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURIComponent(url.parse(req.url).pathname || '/');
        if (reqPath === '/') reqPath = '/desafio.html';
        // Anti path traversal
        const safePath = path.normalize(path.join(rootDir, reqPath));
        if (!safePath.startsWith(rootDir)) {
          res.writeHead(403); res.end('Forbidden'); return;
        }
        fs.stat(safePath, (err, stat) => {
          if (err || !stat.isFile()) {
            res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
            res.end('Not found: '+reqPath);
            return;
          }
          const ext = path.extname(safePath).toLowerCase();
          const mime = MIME[ext] || 'application/octet-stream';
          res.writeHead(200, {
            'Content-Type': mime,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
          });
          fs.createReadStream(safePath).pipe(res);
        });
      } catch (e) {
        res.writeHead(500); res.end('Internal error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      resolve(serverPort);
    });
  });
}

function createWindow(port){
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: false, // false por padrao — dev pode sair. Mude pra true em producao se quiser travar.
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#0B0A10',
    title: 'MilkyPot Desafio',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Permite getUserMedia (webcam/microfone pro desafio)
      // e localStorage persistente
      backgroundThrottling: false
    }
  });

  // Tira menu padrao
  Menu.setApplicationMenu(null);

  const targetUrl = `http://127.0.0.1:${port}/desafio.html?kiosk=1`;
  console.log('[MilkyPot Desktop] Abrindo:', targetUrl);
  win.loadURL(targetUrl);

  win.once('ready-to-show', () => win.show());

  win.on('closed', () => { mainWindow = null; });

  // Bloqueia abertura de novas janelas (seguranca)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  return win;
}

function registerShortcuts(win){
  globalShortcut.register('F11', () => {
    if (!win.isDestroyed()) win.setFullScreen(!win.isFullScreen());
  });
  globalShortcut.register('CommandOrControl+Q', () => { app.quit(); });
  globalShortcut.register('CommandOrControl+R', () => {
    if (!win.isDestroyed()) win.reload();
  });
  if (!app.isPackaged) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (!win.isDestroyed()) win.webContents.toggleDevTools();
    });
  }
}

// Permite getUserMedia pro desafio (webcam/microfone, mesmo em file://)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () => {
  try {
    const port = await startLocalServer(APP_ROOT);
    console.log('[MilkyPot Desktop] Servidor local na porta', port);
    mainWindow = createWindow(port);
    registerShortcuts(mainWindow);
  } catch (err) {
    console.error('[MilkyPot Desktop] Erro ao iniciar:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => { app.quit(); });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });
