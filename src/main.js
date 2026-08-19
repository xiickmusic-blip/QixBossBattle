const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SteamService = require('./steam');

let mainWindow;
const steam = new SteamService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#05070b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  await steam.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('steam:get-state', () => steam.getState());
ipcMain.handle('steam:create-lobby', (_e, options) => steam.createLobby(options));
ipcMain.handle('steam:join-lobby', (_e, lobbyId) => steam.joinLobby(lobbyId));
ipcMain.handle('steam:leave-lobby', () => steam.leaveLobby());
ipcMain.handle('steam:get-members', () => steam.getMembers());
ipcMain.handle('steam:send', (_e, payload) => steam.send(payload));

steam.onMessage = payload => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('steam:message', payload);
  }
};
