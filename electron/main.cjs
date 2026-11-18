const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');

app.setName('NexaDesk');
app.setAppUserModelId('id.nexadesk.app');

process.env.NODE_ENV = 'production';
const dataDir = process.env.NEXADESK_DATA_DIR || path.join(app.getPath('userData'), 'data');
process.env.NEXADESK_DATA_DIR = dataDir;

function findFreePort(start, attempts = 20) {
  return new Promise((resolve) => {
    const probe = (port, left) => {
      const server = net.createServer();
      server.once('error', () => {
        if (left > 0) probe(port + 1, left - 1);
        else resolve(0);
      });
      server.once('listening', () => server.close(() => resolve(port)));
      server.listen(port);
    };
    probe(start, attempts);
  });
}

async function waitForServer(port) {
  for (let i = 0; i < 75; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {
      /* server belum siap */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Server lokal tidak merespons.');
}

let mainWindow = null;
let serverModule = null;

async function boot() {
  const port = await findFreePort(8787);
  if (!port) throw new Error('Tidak ada port lokal yang tersedia.');
  process.env.PORT = String(port);
  process.env.HOST = '127.0.0.1';

  serverModule = await import(pathToFileURL(path.join(__dirname, '..', 'server', 'index.js')).href);
  await serverModule.startServer();
  await waitForServer(port);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 680,
    backgroundColor: '#fdf9f9',
    title: 'NexaDesk',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const base = `http://127.0.0.1:${port}`;
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(base)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(base)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  await mainWindow.loadURL(base);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    boot().catch((err) => {
      const detail = `[${new Date().toISOString()}] ${err.stack || err.message}\n`;
      console.error('[boot]', err);
      try {
        fs.appendFileSync(path.join(app.getPath('userData'), 'boot-error.log'), detail);
      } catch {
        /* abaikan */
      }
      dialog.showErrorBox('NexaDesk gagal dijalankan', err.message);
      app.quit();
    });
  });

  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    try {
      serverModule?.shutdown();
    } catch {
      /* abaikan */
    }
  });
}
