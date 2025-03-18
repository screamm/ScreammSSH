/**
 * Global typdeklaration för hela projektet
 */

interface SSHConnectionInfo {
  id: string;
  name: string;
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  rememberPassword?: boolean;
  jumpHost?: string;
  tunnels?: Array<{
    sourcePort: number;
    destinationHost: string;
    destinationPort: number;
  }>;
}

interface SFTPFile {
  filename: string;
  longname: string;
  attrs: {
    size: number;
    mtime: number;
    atime: number;
    uid: number;
    gid: number;
    mode: number;
    permissions: number;
    isDirectory: boolean;
    isFile: boolean;
    isSymbolicLink: boolean;
  };
}

interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  theme: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
  retroEffect?: boolean;
}

interface AppSettings {
  terminal: TerminalSettings;
  general: {
    language: string;
    autoConnect: boolean;
    clearCommandHistory: boolean;
    confirmDisconnect: boolean;
  };
  ssh: {
    keepAliveInterval: number;
    reconnectAttempts: number;
    reconnectDelay: number;
    defaultPort: number;
  };
}

interface CustomTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

interface SSHEvent {
  connectionId: string;
  eventType: 'data' | 'close' | 'error';
  data?: string;
  error?: string;
}

interface ElectronAPI {
  // Grundläggande IPC
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  
  // Test och diagnostik
  ping: () => Promise<string>;
  test: () => Promise<any>;
  
  // Versioner
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  
  // SSH-anslutningshantering
  connectSSH: (config: SSHConnectionInfo) => Promise<boolean>;
  disconnectSSH: (connectionId: string) => Promise<void>;
  executeSSHCommand: (connectionId: string, command: string) => Promise<string>;
  
  // SSH Shell
  openSSHShell: (connectionId: string) => Promise<boolean>;
  writeToSSHShell: (connectionId: string, data: string) => Promise<boolean>;
  resizeSSHShell: (connectionId: string, cols: number, rows: number) => Promise<boolean>;
  closeSSHShell: (connectionId: string) => Promise<boolean>;
  onSSHEvent: (callback: (event: SSHEvent) => void) => void;
  
  // SFTP
  sftpConnect: (connectionId: string) => Promise<boolean>;
  sftpDisconnect: (connectionId: string) => Promise<void>;
  sftpListDirectory: (connectionId: string, directory: string) => Promise<SFTPFile[]>;
  sftpGetFile: (connectionId: string, remotePath: string, localPath: string) => Promise<void>;
  sftpPutFile: (connectionId: string, localPath: string, remotePath: string) => Promise<void>;
  sftpDeleteFile: (connectionId: string, path: string) => Promise<void>;
  sftpMakeDirectory: (connectionId: string, path: string) => Promise<void>;
  sftpDeleteDirectory: (connectionId: string, path: string) => Promise<void>;
  sftpRename: (connectionId: string, oldPath: string, newPath: string) => Promise<void>;
  
  // Inställningar och lagringshantering
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  getSavedConnections: () => Promise<SSHConnectionInfo[]>;
  saveConnection: (connection: SSHConnectionInfo) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  
  // Tema
  getThemes: () => Promise<CustomTheme[]>;
  getTheme: (id: string) => Promise<CustomTheme | null>;
  saveTheme: (theme: CustomTheme | string) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 