import { SSHConnectionInfo } from './services/SSHService';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    selectionBackground: string;
    // Terminal-färger
    black: string;
    brightBlack: string;
    red: string;
    brightRed: string;
    green: string;
    brightGreen: string;
    yellow: string;
    brightYellow: string;
    blue: string;
    brightBlue: string;
    magenta: string;
    brightMagenta: string;
    cyan: string;
    brightCyan: string;
    white: string;
    brightWhite: string;
  };
  fontFamily?: string;
  fontSize?: number;
}

export interface SFTPFile {
  filename: string;
  longname: string;
  attrs: {
    size: number;
    mtime: number;
    atime: number;
    uid: number;
    gid: number;
    mode: number;
    permissions: string;
    owner: string;
    group: string;
    type: string;
  };
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
  path: string;
}

export interface ElectronAPI {
  // System functions
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<string>;
  showItemInFolder: (path: string) => void;
  showMessageBox: (options: any) => Promise<{ response: number, checkboxChecked: boolean }>;
  platform: string;
  appVersion: string;
  
  // App settings
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  
  // Terminal settings (för bakåtkompatibilitet)
  getTerminalSettings: () => Promise<any>;
  saveTerminalSettings: (settings: any) => Promise<void>;
  saveLanguage: (language: string) => Promise<void>;
  
  // Shell functions (för bakåtkompatibilitet)
  shellCreate: () => Promise<any>;
  shellExecute: (sessionId: string, command: string) => Promise<any>;
  shellTerminate: (sessionId: string) => Promise<any>;
  onShellOutput: (callback: (data: any) => void) => () => void;
  onShellError: (callback: (data: any) => void) => () => void;
  onShellExit: (callback: (data: any) => void) => () => void;
  
  // SSH functions
  connectSSH: (config: SSHConnectionInfo) => Promise<boolean>;
  disconnectSSH: (connectionId: string) => Promise<void>;
  executeSSHCommand: (connectionId: string, command: string) => Promise<string>;
  openSSHShell: (connectionId: string) => Promise<boolean>;
  writeToSSHShell: (connectionId: string, data: string) => Promise<void>;
  resizeSSHShell: (connectionId: string, cols: number, rows: number) => Promise<void>;
  closeSSHShell: (connectionId: string) => Promise<void>;
  
  // Connection management
  getSavedConnections: () => Promise<SSHConnectionInfo[]>;
  saveConnection: (connection: SSHConnectionInfo) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  
  // Themes
  getThemes: () => Promise<CustomTheme[]>;
  saveTheme: (theme: CustomTheme) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  
  // SFTP operations
  sftpConnect: (connectionId: string) => Promise<boolean>;
  sftpDisconnect: (connectionId: string) => Promise<void>;
  sftpListDirectory: (connectionId: string, remotePath: string) => Promise<SFTPFile[]>;
  sftpGetFile: (connectionId: string, remotePath: string, localPath: string) => Promise<void>;
  sftpPutFile: (connectionId: string, localPath: string, remotePath: string) => Promise<void>;
  sftpMakeDirectory: (connectionId: string, remotePath: string) => Promise<void>;
  sftpRename: (connectionId: string, oldPath: string, newPath: string) => Promise<void>;
  sftpDeleteFile: (connectionId: string, remotePath: string) => Promise<void>;
  sftpDeleteDirectory: (connectionId: string, remotePath: string) => Promise<void>;
  
  // Event listeners
  onSSHEvent: (callback: (event: any, connectionId: string, eventType: string, data: any) => void) => () => void;
  onShellOutput: (callback: (event: any, connectionId: string, data: string) => void) => () => void;
  onSFTPProgress: (callback: (event: any, connectionId: string, operation: string, filename: string, progress: number) => void) => () => void;
  
  // Ping function for testing connectivity
  ping: () => Promise<string>;
} 