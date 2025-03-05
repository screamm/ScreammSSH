// En tom preload-fil för att uppfylla kraven i webpack-konfigurationen
// Här kan du i framtiden lägga till kontextbryggor om du behöver 

const { contextBridge, ipcRenderer } = require('electron');

// Exponera IPC-kommunikation till renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Anslutningshantering
  getSavedConnections: () => ipcRenderer.invoke('get-saved-connections'),
  saveConnection: (connection) => ipcRenderer.invoke('save-connection', connection),
  deleteConnection: (id) => ipcRenderer.invoke('delete-connection', id),
  
  // SSH-funktioner
  sshConnect: (id, config) => ipcRenderer.invoke('ssh-connect', id, config),
  sshExecute: (id, command) => ipcRenderer.invoke('ssh-execute', id, command),
  sshDisconnect: (id) => ipcRenderer.invoke('ssh-disconnect', id),
  
  // SFTP-funktioner
  sftpListDirectory: (id, path) => ipcRenderer.invoke('sftp-list-directory', id, path),
  sftpGetFile: (id, path) => ipcRenderer.invoke('sftp-get-file', id, path)
}); 