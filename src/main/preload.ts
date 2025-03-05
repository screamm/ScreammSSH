import { contextBridge, ipcRenderer } from 'electron';

// Exponera säkra IPC-kanaler till renderer-processen
contextBridge.exposeInMainWorld('electronAPI', {
  // SSH-funktioner
  sshConnect: (config: any) => ipcRenderer.invoke('ssh:connect', config),
  sshExecute: (connectionId: string, command: string) => 
    ipcRenderer.invoke('ssh:execute', { connectionId, command }),
  sshDisconnect: (connectionId: string) => 
    ipcRenderer.invoke('ssh:disconnect', { connectionId }),
  
  // SFTP-funktioner
  sftpListDirectory: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:list-directory', { connectionId, path }),
  sftpReadFile: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:read-file', { connectionId, path }),
  sftpWriteFile: (connectionId: string, path: string, content: string) => 
    ipcRenderer.invoke('sftp:write-file', { connectionId, path, content }),
  sftpDeleteFile: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:delete-file', { connectionId, path }),
  sftpCreateDirectory: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:create-directory', { connectionId, path }),
  sftpDeleteDirectory: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:delete-directory', { connectionId, path }),
  sftpRename: (connectionId: string, oldPath: string, newPath: string) => 
    ipcRenderer.invoke('sftp:rename', { connectionId, oldPath, newPath }),
  sftpUploadFile: (connectionId: string, localPath: string, remotePath: string) => 
    ipcRenderer.invoke('sftp:upload-file', { connectionId, localPath, remotePath }),
  sftpDownloadFile: (connectionId: string, remotePath: string, localPath: string) => 
    ipcRenderer.invoke('sftp:download-file', { connectionId, remotePath, localPath }),
  sftpGetStats: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:get-stats', { connectionId, path }),
  sftpExists: (connectionId: string, path: string) => 
    ipcRenderer.invoke('sftp:exists', { connectionId, path }),
    
  // Lagrings-funktioner
  getSavedConnections: () => ipcRenderer.invoke('storage:get-saved-connections'),
  saveConnection: (connection: any) => ipcRenderer.invoke('storage:save-connection', { connection }),
  deleteConnection: (id: string) => ipcRenderer.invoke('storage:delete-connection', { id }),
  
  // Tema-funktioner
  getTheme: () => ipcRenderer.invoke('storage:get-theme'),
  saveTheme: (theme: string) => ipcRenderer.invoke('storage:save-theme', { theme })
}); 