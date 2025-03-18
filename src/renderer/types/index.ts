// Typesdefinitioner för ScreammSSH

// Theme-typer
export type Theme = 'default' | 'nostromo' | 'classic-green' | 'htop' | 'cyan-ssh' | string;

export interface ThemeColors {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  selectionBackground?: string;
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
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

// SSH-anslutningstyper
export interface SSHConnectionInfo {
  id: string;
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  name?: string;
  savePassword?: boolean;
}

// Terminal-relaterade typer
export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
}

// Lägg till övriga typesdefinitioner här vid behov 