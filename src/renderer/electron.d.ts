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
    selection?: string;
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
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => (() => void);
  
  // Test-funktioner
  ping: () => Promise<string>;
  
  // React-app
  loadReactApp: () => Promise<{ success: boolean; message: string }>;
  
  // SSH-testfunktioner
  testSSHConnection: (connectionConfig: SSHConnectionInfo) => Promise<{
    success: boolean;
    message: string;
    serverInfo?: {
      osType: string;
      version: string;
      hostname: string;
      uptime: number;
    };
    error?: string;
  }>;
  
  // Versionsinformation
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  
  // Simulerade API-funktioner
  getSavedConnections: () => Promise<SSHConnectionInfo[]>;
  getSettings: () => Promise<{
    terminal: { retroEffect: boolean; cursorBlink: boolean; fontSize: number };
    general: { language: string };
  }>;
  saveTheme: (theme: CustomTheme) => Promise<void>;
  sftpListDirectory: (connectionId: string, path: string) => Promise<SFTPFile[]>;
  getThemes: () => Promise<CustomTheme[]>;
  getTerminalSettings: () => Promise<TerminalSettings>;
  saveTerminalSettings: (settings: TerminalSettings) => Promise<void>;
  saveConnection: (connection: SSHConnectionInfo) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  connectSSH: (connectionConfig: SSHConnectionInfo) => Promise<{ success: boolean; message: string; connectionId?: string }>;
  disconnectSSH: (connectionId: string) => Promise<void>;
  executeCommand: (connectionId: string, command: string) => Promise<{ success: boolean; output: string }>;
  startShell: (connectionId: string) => Promise<boolean>;
  sendShellData: (connectionId: string, data: string) => Promise<void>;
  resizeTerminal: (connectionId: string, cols: number, rows: number) => Promise<void>;
  sftpDownloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<boolean>;
  sftpUploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<boolean>;
}

// SSH-anslutningskonfiguration
export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

// Sparad SSH-anslutningsinformation
export interface SSHConnectionInfo extends SSHConnectionConfig {
  id: string;
  name: string;
  description?: string;
  groups?: string[];
  lastUsed?: string;
  favorites?: boolean;
}

interface TerminalSettings {
  retroEffect: boolean;
  cursorBlink: boolean;
  fontSize: number;
} 