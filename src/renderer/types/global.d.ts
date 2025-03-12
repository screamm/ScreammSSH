interface ElectronAPI {
  // Tema-funktioner
  getTheme: () => Promise<string>;
  saveTheme: (theme: string) => Promise<boolean>;
  
  // Språk-funktioner
  getLanguage: () => Promise<string>;
  saveLanguage: (lang: string) => Promise<boolean>;
  
  // Terminal-inställningar
  getTerminalSettings: () => Promise<{
    retroEffect: boolean;
    cursorBlink: boolean;
    fontSize: number;
  }>;
  saveTerminalSettings: (settings: {
    retroEffect: boolean;
    cursorBlink: boolean;
    fontSize: number;
  }) => Promise<boolean>;
  
  // Anpassade teman
  getCustomThemes: () => Promise<any[]>;
  saveCustomTheme: (name: string, colors: any) => Promise<boolean>;
  deleteCustomTheme: (name: string) => Promise<boolean>;
  
  // Shell-funktioner
  shellCreate: () => Promise<{ success: boolean; id: string; error?: string }>;
  shellExecute: (id: string, command: string) => Promise<{ success: boolean; error?: string }>;
  shellTerminate: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Event-lyssnare
  onShellOutput: (callback: (data: { id?: string; output?: string; error?: string }) => void) => (() => void);
  onShellError: (callback: (data: { id?: string; error?: string }) => void) => (() => void);
  onShellExit: (callback: (data: { id?: string; code: number }) => void) => (() => void);
  onSshOutput: (callback: (data: { id?: string; output?: string; error?: string }) => void) => (() => void);
  
  // SSH-funktioner
  sshConnect: (connection: {
    id: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
  }) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  sshExecute: (id: string, command: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  sshDisconnect: (id: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 