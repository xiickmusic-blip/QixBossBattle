const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const SteamService = require('./steam');

const localAppData =
  process.env.LOCALAPPDATA ||
  process.env.APPDATA ||
  app.getPath('temp');

const raidQixData = path.join(localAppData, 'RaidQix');
const raidQixSession = path.join(raidQixData, 'Session');
const raidQixDiskCache = path.join(raidQixSession, 'Cache');

for (const dir of [raidQixData, raidQixSession, raidQixDiskCache]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

try { app.setPath('userData', raidQixData); } catch {}
try { app.setPath('sessionData', raidQixSession); } catch {}

app.commandLine.appendSwitch('disk-cache-dir', raidQixDiskCache);
app.commandLine.appendSwitch('gpu-disk-cache-size-kb', '65536');

let mainWindow;
const steam = new SteamService();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#05070b',
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      (async () => {
        const loadOnce = src => new Promise((resolve, reject) => {
          if (document.querySelector('script[src="' + src + '"]')) return resolve();
          const s = document.createElement('script');
          s.src = src;
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
        try {
          await loadOnce('game-v128.js');
          await loadOnce('game-v129.js');
        } catch (e) {
          console.error('[PATCH LOADER]', e);
        }
      })();
    `).catch(error => console.warn('[PATCH LOADER]', error.message));
  });
}

app.whenReady().then(async () => {
  await steam.init();
  createWindow();

  try {
    require('steamworks.js').electronEnableSteamOverlay();
  } catch (error) {
    console.warn('[Steam] Overlay unavailable:', error.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => steam.dispose());
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('steam:get-state', () => steam.getState());
ipcMain.handle('steam:create-lobby', (_e, options) => steam.createLobby(options));
ipcMain.handle('steam:join-lobby', (_e, lobbyId) => steam.joinLobby(lobbyId));
ipcMain.handle('steam:leave-lobby', () => steam.leaveLobby());
ipcMain.handle('steam:get-members', () => steam.getMembers());
ipcMain.handle('steam:invite-lobby', () => steam.openInviteDialog());
ipcMain.handle('steam:send', (_e, payload) => steam.send(payload));

ipcMain.handle('window:set-display-mode', (_e, mode) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  const sizes = {
    '960x540': [960, 540],
    '1280x720': [1280, 720],
    '1600x900': [1600, 900],
    '1920x1080': [1920, 1080]
  };

  if (mode === 'fullscreen') {
    mainWindow.setFullScreen(true);
    mainWindow.setResizable(false);
    return true;
  }

  const size = sizes[mode] || sizes['1280x720'];
  mainWindow.setFullScreen(false);
  mainWindow.setResizable(false);
  mainWindow.setContentSize(size[0], size[1], false);
  mainWindow.center();
  return true;
});

ipcMain.handle('window:get-display-mode', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return '1280x720';
  if (mainWindow.isFullScreen()) return 'fullscreen';
  const [w, h] = mainWindow.getContentSize();
  return `${w}x${h}`;
});

steam.onMessage = payload => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('steam:message', payload);
  }
};
