const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('raidAPI', {
  getSteamState:()=>ipcRenderer.invoke('steam:get-state'),
  createLobby:o=>ipcRenderer.invoke('steam:create-lobby',o),
  joinLobby:id=>ipcRenderer.invoke('steam:join-lobby',id),
  leaveLobby:()=>ipcRenderer.invoke('steam:leave-lobby'),
  getMembers:()=>ipcRenderer.invoke('steam:get-members'),
  inviteLobby:()=>ipcRenderer.invoke('steam:invite-lobby'),
  send:p=>ipcRenderer.invoke('steam:send',p),
  setDisplayMode:m=>ipcRenderer.invoke('window:set-display-mode',m),
  getDisplayMode:()=>ipcRenderer.invoke('window:get-display-mode'),
  onMessage:cb=>ipcRenderer.on('steam:message',(_e,p)=>cb(p))
});
