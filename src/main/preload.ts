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
  saveCrtEffect: (value: boolean) => invokeWithErrorHandling('save-crt-effect', value),
  getCrtEffect: () => invokeWithErrorHandling('get-crt-effect'),
  
  // Terminalinställningar
  getTerminalSettings: () => invokeWithErrorHandling('get-terminal-settings'),
  saveTerminalSettings: (settings: any) => 
    invokeWithErrorHandling('save-terminal-settings', settings),
  
  // SSH-anslutningshantering
  getSavedConnections: () => invokeWithErrorHandling('get-saved-connections'),
  saveConnection: (connection: any) => 
    invokeWithErrorHandling('save-connection', connection),
  deleteConnection: (id: string) => 
    invokeWithErrorHandling('delete-connection', id),
  
  // SSH-sessionshantering
  sshConnect: (config: any) => invokeWithErrorHandling('ssh-connect', config),
  sshExecute: (id: string, command: string) => 
    invokeWithErrorHandling('ssh-execute', id, command),
  sshDisconnect: (id: string) => 
    invokeWithErrorHandling('ssh-disconnect', id),
  
  // SFTP-funktioner
  sftpListDirectory: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-list-directory', id, path),
  sftpGetFile: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-get-file', id, path),
  sftpPutFile: (id: string, path: string) => 
    invokeWithErrorHandling('sftp-put-file', id, path),
  
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
  
  onSshOutput: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ssh-output', listener);
    return () => {
      ipcRenderer.removeListener('ssh-output', listener);
    };
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('shell-output');
    ipcRenderer.removeAllListeners('shell-error');
    ipcRenderer.removeAllListeners('shell-exit');
    ipcRenderer.removeAllListeners('ssh-output');
  }
}); 