import { contextBridge, ipcRenderer } from 'electron';

// Wrapper för att lägga till bättre felhantering för IPC-anrop
const invokeWithErrorHandling = async (channel: string, ...args: any[]) => {
  try {
    console.log(`Invoke: ${channel}`, args);
    const result = await ipcRenderer.invoke(channel, args.length === 1 ? args[0] : args);
    return result;
  } catch (error) {
    console.error(`Error invoking ${channel}:`, error);
    return { success: false, error: (error as Error).message || 'Unknown error in IPC call' };
  }
};

console.log('Preload-skript startar...');

// Exponera säkra IPC-kanaler till renderer-processen
contextBridge.exposeInMainWorld('electronAPI', {
  // Grundläggande shell-funktioner
  shellCreate: () => invokeWithErrorHandling('shell-create'),
  shellExecute: (id: string, command: string) => 
    invokeWithErrorHandling('shell-execute', { id, command }),
  shellTerminate: (id: string) => 
    invokeWithErrorHandling('shell-terminate', { id }),
  
  // Ping-funktion för testning av IPC
  ping: () => invokeWithErrorHandling('ping'),
  
  // Settings/inställningar
  saveTheme: (theme: string) => invokeWithErrorHandling('save-theme', theme),
  getTheme: () => invokeWithErrorHandling('get-theme'),
  saveLanguage: (language: string) => invokeWithErrorHandling('save-language', language),
  getLanguage: () => invokeWithErrorHandling('get-language'),
  
  // Terminalinställningar
  getTerminalSettings: () => invokeWithErrorHandling('get-terminal-settings'),
  saveTerminalSettings: (settings: any) => 
    invokeWithErrorHandling('save-terminal-settings', settings),
  
  // Anpassade teman
  getCustomThemes: () => invokeWithErrorHandling('get-custom-themes'),
  saveCustomTheme: (theme: any) => invokeWithErrorHandling('save-custom-theme', theme),
  deleteCustomTheme: (name: string) => invokeWithErrorHandling('delete-custom-theme', name),
  
  // Anslutningshantering
  getStoredConnections: () => invokeWithErrorHandling('get-stored-connections'),
  saveConnections: (connections: any[]) => 
    invokeWithErrorHandling('save-connections', connections),
  sshSaveConnection: (connection: any) => 
    invokeWithErrorHandling('ssh-save-connection', connection),
  
  // Grupphantering
  getConnectionGroups: () => invokeWithErrorHandling('get-connection-groups'),
  saveConnectionGroups: (groups: any[]) => 
    invokeWithErrorHandling('save-connection-groups', groups),
  
  // SSH-operationer
  sshConnect: (config: any) => invokeWithErrorHandling('ssh-connect', config),
  sshExecute: (id: string, command: string) => 
    invokeWithErrorHandling('ssh-execute', id, command),
  sshOpenShell: (id: string) => invokeWithErrorHandling('ssh-open-shell', id),
  sshWriteToShell: (id: string, data: string) => 
    invokeWithErrorHandling('ssh-write-to-shell', id, data),
  sshResizeShell: (id: string, rows: number, cols: number) => 
    invokeWithErrorHandling('ssh-resize-shell', id, rows, cols),
  sshDisconnect: (id: string) => invokeWithErrorHandling('ssh-disconnect', id),
  sshDisconnectAll: () => invokeWithErrorHandling('ssh-disconnect-all'),
  
  // SFTP-funktioner
  sftpListDirectory: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-list-directory', id, path),
  sftpGetFile: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-get-file', id, path),
  sftpPutFile: (id: string, localPath: string, remotePath: string) => 
    invokeWithErrorHandling('sftp-put-file', id, localPath, remotePath),
  sftpDeleteFile: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-delete-file', id, path),
  sftpCreateDirectory: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-create-directory', id, path),
  
  // Lyssnare för asynkrona händelser
  onShellOutput: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('shell-output', listener);
    return () => {
      ipcRenderer.removeListener('shell-output', listener);
    };
  },
  
  onShellError: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('shell-error', listener);
    return () => {
      ipcRenderer.removeListener('shell-error', listener);
    };
  },
  
  onShellExit: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('shell-exit', listener);
    return () => {
      ipcRenderer.removeListener('shell-exit', listener);
    };
  },
  
  onSshData: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-data', listener);
    return () => {
      ipcRenderer.removeListener('ssh-data', listener);
    };
  },
  
  onSshError: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-error', listener);
    return () => {
      ipcRenderer.removeListener('ssh-error', listener);
    };
  },
  
  onSshClose: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-close', listener);
    return () => {
      ipcRenderer.removeListener('ssh-close', listener);
    };
  },
  
  onSshShellData: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-shell-data', listener);
    return () => {
      ipcRenderer.removeListener('ssh-shell-data', listener);
    };
  },
  
  onSshShellError: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-shell-error', listener);
    return () => {
      ipcRenderer.removeListener('ssh-shell-error', listener);
    };
  },
  
  onSshShellClose: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-shell-close', listener);
    return () => {
      ipcRenderer.removeListener('ssh-shell-close', listener);
    };
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('shell-output');
    ipcRenderer.removeAllListeners('shell-error');
    ipcRenderer.removeAllListeners('shell-exit');
    ipcRenderer.removeAllListeners('ssh-data');
    ipcRenderer.removeAllListeners('ssh-error');
    ipcRenderer.removeAllListeners('ssh-close');
    ipcRenderer.removeAllListeners('ssh-shell-data');
    ipcRenderer.removeAllListeners('ssh-shell-error');
    ipcRenderer.removeAllListeners('ssh-shell-close');
  }
});

console.log('Preload-skript fullständigt laddat'); 