interface ElectronAPI {
  // SSH-funktioner
  sshConnect: (config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
  }) => Promise<{
    success: boolean;
    connectionId?: string;
    error?: string;
  }>;
  sshExecute: (connectionId: string, command: string) => Promise<{
    success: boolean;
    code?: number;
    stdout?: string;
    stderr?: string;
    error?: string;
  }>;
  sshDisconnect: (connectionId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // SFTP-funktioner
  sftpListDirectory: (connectionId: string, path: string) => Promise<any>;
  sftpReadFile: (connectionId: string, path: string) => Promise<any>;
  sftpWriteFile: (connectionId: string, path: string, content: string) => Promise<any>;
  sftpDeleteFile: (connectionId: string, path: string) => Promise<any>;
  sftpCreateDirectory: (connectionId: string, path: string) => Promise<any>;
  sftpDeleteDirectory: (connectionId: string, path: string) => Promise<any>;
  sftpRename: (connectionId: string, oldPath: string, newPath: string) => Promise<any>;
  sftpUploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<any>;
  sftpDownloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<any>;
  sftpGetStats: (connectionId: string, path: string) => Promise<any>;
  sftpExists: (connectionId: string, path: string) => Promise<any>;
  
  // Lagrings-funktioner
  getSavedConnections: () => Promise<any[]>;
  saveConnection: (connection: any) => Promise<{ success: boolean; connections?: any[]; error?: string }>;
  deleteConnection: (id: string) => Promise<{ success: boolean; connections?: any[]; error?: string }>;
  
  // Tema-funktioner
  getTheme: () => Promise<string>;
  saveTheme: (theme: string) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI: {
    // SSH-funktioner
    sshConnect: (config: {
      host: string;
      port: number;
      username: string;
      password?: string;
      privateKey?: string;
    }) => Promise<{
      success: boolean;
      connectionId?: string;
      error?: string;
    }>;
    sshExecute: (connectionId: string, command: string) => Promise<{
      success: boolean;
      code?: number;
      stdout?: string;
      stderr?: string;
      error?: string;
    }>;
    sshDisconnect: (connectionId: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    
    // SFTP-funktioner
    sftpListDirectory: (connectionId: string, path: string) => Promise<any>;
    sftpReadFile: (connectionId: string, path: string) => Promise<any>;
    sftpWriteFile: (connectionId: string, path: string, content: string) => Promise<any>;
    sftpDeleteFile: (connectionId: string, path: string) => Promise<any>;
    sftpCreateDirectory: (connectionId: string, path: string) => Promise<any>;
    sftpDeleteDirectory: (connectionId: string, path: string) => Promise<any>;
    sftpRename: (connectionId: string, oldPath: string, newPath: string) => Promise<any>;
    sftpUploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<any>;
    sftpDownloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<any>;
    sftpGetStats: (connectionId: string, path: string) => Promise<any>;
    sftpExists: (connectionId: string, path: string) => Promise<any>;
    
    // Lagrings-funktioner
    getSavedConnections: () => Promise<any[]>;
    saveConnection: (connection: any) => Promise<{ success: boolean; connections?: any[]; error?: string }>;
    deleteConnection: (id: string) => Promise<{ success: boolean; connections?: any[]; error?: string }>;
    
    // Tema-funktioner
    getTheme: () => Promise<string>;
    saveTheme: (theme: string) => Promise<{ success: boolean; error?: string }>;
  };
} 