const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('raidAPI', {
  getSteamState: () => ipcRenderer.invoke('steam:get-state'),
  createLobby: options => ipcRenderer.invoke('steam:create-lobby', options),
  joinLobby: lobbyId => ipcRenderer.invoke('steam:join-lobby', lobbyId),
  leaveLobby: () => ipcRenderer.invoke('steam:leave-lobby'),
  getMembers: () => ipcRenderer.invoke('steam:get-members'),
  inviteLobby: () => ipcRenderer.invoke('steam:invite-lobby'),
  send: payload => ipcRenderer.invoke('steam:send', payload),
  setDisplayMode: mode => ipcRenderer.invoke('window:set-display-mode', mode),
  getDisplayMode: () => ipcRenderer.invoke('window:get-display-mode'),
  onMessage: callback => ipcRenderer.on('steam:message', (_event, payload) => callback(payload))
});
