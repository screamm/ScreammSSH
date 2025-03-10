interface ElectronAPI {
  // SSH-funktioner
  sshConnect: (config: {
    id?: string;
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string;
  }) => Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }>;
  sshExecute: (id: string, command: string) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
    code?: number;
    stdout?: string;
    stderr?: string;
  }>;
  sshDisconnect: (id: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // SSH Lyssnare
  onSshOutput: (callback: (data: {
    id: string;
    output?: string;
    error?: string;
  }) => void) => (() => void);
  
  // SFTP-funktioner
  sftpListDirectory: (id: string, path: string) => Promise<{
    success: boolean;
    path?: string;
    files?: any[];
    error?: string;
  }>;
  
  sftpGetFile: (id: string, path: string) => Promise<{
    success: boolean;
    remotePath?: string;
    localPath?: string;
    error?: string;
  }>;
  
  sftpPutFile: (id: string, path: string) => Promise<{
    success: boolean;
    remotePath?: string;
    localPath?: string;
    error?: string;
  }>;

  // Tillagda SFTP-funktioner
  sftpReadFile: (id: string, path: string) => Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;

  sftpWriteFile: (id: string, path: string, content: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpDeleteFile: (id: string, path: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpCreateDirectory: (id: string, path: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpDeleteDirectory: (id: string, path: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpRename: (id: string, oldPath: string, newPath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpUploadFile: (id: string, localPath: string, remotePath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpDownloadFile: (id: string, remotePath: string, localPath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  sftpGetStats: (id: string, path: string) => Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }>;

  sftpExists: (id: string, path: string) => Promise<{
    success: boolean;
    exists?: boolean;
    error?: string;
  }>;
  
  // Lagrings-funktioner
  getSavedConnections: () => Promise<any[]>;
  saveConnection: (connection: any) => Promise<{ 
    success: boolean; 
    id?: string;
    connectionId?: string;
    connections?: any[];
    error?: string 
  }>;
  deleteConnection: (id: string) => Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  
  // Tema-funktioner
  getTheme: () => Promise<string>;
  saveTheme: (theme: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Språkfunktioner
  getLanguage: () => Promise<string>;
  saveLanguage: (language: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Terminalinställningar
  getTerminalSettings: () => Promise<{
    retroEffect: boolean;
    cursorBlink: boolean;
    fontSize: number;
  }>;
  saveTerminalSettings: (settings: {
    retroEffect: boolean;
    cursorBlink: boolean;
    fontSize: number;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // Shell-funktioner - för att köra lokala systemkommandon
  shellCreate: () => Promise<{ 
    success: boolean; 
    id?: string; 
    error?: string 
  }>;
  shellExecute: (id: string, command: string) => Promise<{ 
    success: boolean; 
    error?: string;
    stdout?: string;
    stderr?: string;
  }>;
  shellTerminate: (id: string) => Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  
  // Lyssnare för shell-händelser
  onShellOutput: (callback: (data: {
    id: string;
    output?: string;
    error?: string;
  }) => void) => (() => void);
  
  onShellError: (callback: (data: {
    id: string;
    error: string;
  }) => void) => (() => void);
  
  onShellExit: (callback: (data: {
    id: string;
    code: number;
  }) => void) => (() => void);

  // Simple test function to verify IPC is working
  ping: () => Promise<string>;

  // Anslutningshantering
  removeAllListeners: () => void;
}

interface Window {
  electronAPI: ElectronAPI;
} 