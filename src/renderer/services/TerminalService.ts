import { Terminal } from 'xterm';
import { sshService } from './SSHService';

export interface TerminalOptions {
  rows?: number;
  cols?: number;
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'underline' | 'bar';
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
    selection?: string;
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
  };
}

export class TerminalService {
  private terminals: Map<string, Terminal> = new Map();
  private defaultOptions: TerminalOptions = {
    rows: 24,
    cols: 80,
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 1.2,
    theme: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      selection: 'rgba(248,248,242,0.3)',
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#bfbfbf',
      brightBlack: '#4d4d4d',
      brightRed: '#ff6e67',
      brightGreen: '#5af78e',
      brightYellow: '#f4f99d',
      brightBlue: '#caa9fa',
      brightMagenta: '#ff92d0',
      brightCyan: '#9aedfe',
      brightWhite: '#e6e6e6'
    }
  };

  constructor() {
    console.log('TerminalService initialiserad');
    this.listenToSSHEvents();
  }

  private listenToSSHEvents() {
    sshService.on('shell-data', ({ connectionId, data }: { connectionId: string, data: string }) => {
      const terminal = this.terminals.get(connectionId);
      if (terminal) {
        terminal.write(data);
      }
    });

    sshService.on('shell-stderr', ({ connectionId, data }: { connectionId: string, data: string }) => {
      const terminal = this.terminals.get(connectionId);
      if (terminal) {
        terminal.write(data);
      }
    });

    sshService.on('shell-close', ({ connectionId }: { connectionId: string }) => {
      console.log(`Shell stängd för anslutning ${connectionId}, uppdaterar terminal UI`);
      // Här kan vi lägga till logik för att meddela UI att shell är stängd
    });
  }

  public createTerminal(
    connectionId: string, 
    containerElement: HTMLElement, 
    options?: TerminalOptions
  ): Terminal {
    if (this.terminals.has(connectionId)) {
      console.warn(`Terminal för anslutning ${connectionId} finns redan, återställer`);
      this.destroyTerminal(connectionId);
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const terminal = new Terminal(mergedOptions);
    
    terminal.onData((data) => {
      if (window.electronAPI.writeToSSHShell) {
        window.electronAPI.writeToSSHShell(connectionId, data)
          .catch(err => {
            console.error(`Fel vid skrivning till SSH-shell: ${err}`);
            terminal.write(`\r\n\x1b[31mFel vid skrivning till servern: ${err}\x1b[0m\r\n`);
          });
      } else {
        console.warn('writeToSSHShell API är inte tillgänglig');
        terminal.write('\r\n\x1b[31mAPI för att skriva till shell är inte tillgänglig.\x1b[0m\r\n');
      }
    });

    terminal.onResize(({ cols, rows }) => {
      if (window.electronAPI.resizeSSHShell) {
        window.electronAPI.resizeSSHShell(connectionId, cols, rows)
          .catch(err => console.error(`Fel vid storleksändring av SSH-shell: ${err}`));
      }
    });

    // Öppna terminalen i det angivna container-elementet
    terminal.open(containerElement);
    this.terminals.set(connectionId, terminal);

    // Justera terminalstorleken vid skapande
    this.fitTerminal(connectionId);

    console.log(`Terminal skapad för anslutning ${connectionId}`);
    return terminal;
  }

  public fitTerminal(connectionId: string): void {
    const terminal = this.terminals.get(connectionId);
    if (terminal) {
      // Enkel uppskattning av terminalstorlek baserat på förälderelement
      // Notera: För en bättre automatisk anpassning skulle man behöva använda xterm-addon-fit
      const parentElement = terminal.element?.parentElement;
      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement);
        const padding = parseInt(computedStyle.getPropertyValue('padding'), 10) || 0;
        
        const availableWidth = parentElement.clientWidth - padding * 2;
        const availableHeight = parentElement.clientHeight - padding * 2;
        
        const charWidth = 9; // Uppskattad bredd för en char i px
        const charHeight = 17; // Uppskattad höjd för en rad i px
        
        const cols = Math.floor(availableWidth / charWidth);
        const rows = Math.floor(availableHeight / charHeight);
        
        if (cols > 0 && rows > 0) {
          terminal.resize(cols, rows);
          
          if (window.electronAPI.resizeSSHShell) {
            window.electronAPI.resizeSSHShell(connectionId, cols, rows)
              .catch(err => console.error(`Fel vid storleksändring av SSH-shell: ${err}`));
          }
          
          console.log(`Terminal anpassad till ${cols}x${rows} för anslutning ${connectionId}`);
        }
      }
    }
  }

  public writeToTerminal(connectionId: string, data: string): void {
    const terminal = this.terminals.get(connectionId);
    if (terminal) {
      terminal.write(data);
    } else {
      console.warn(`Ingen terminal hittades för anslutning ${connectionId}`);
    }
  }

  public clearTerminal(connectionId: string): void {
    const terminal = this.terminals.get(connectionId);
    if (terminal) {
      terminal.clear();
    } else {
      console.warn(`Ingen terminal hittades för anslutning ${connectionId}`);
    }
  }

  public destroyTerminal(connectionId: string): void {
    const terminal = this.terminals.get(connectionId);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(connectionId);
      console.log(`Terminal förstörd för anslutning ${connectionId}`);
    }
  }

  public destroyAllTerminals(): void {
    this.terminals.forEach((terminal, id) => {
      terminal.dispose();
      console.log(`Terminal förstörd för anslutning ${id}`);
    });
    this.terminals.clear();
  }

  public setTerminalTheme(theme: TerminalOptions['theme']): void {
    if (theme) {
      this.defaultOptions.theme = { ...this.defaultOptions.theme, ...theme };
      
      // Uppdatera tema för alla befintliga terminaler
      this.terminals.forEach(terminal => {
        terminal.options.theme = this.defaultOptions.theme;
      });
    }
  }

  public getDefaultOptions(): TerminalOptions {
    return { ...this.defaultOptions };
  }

  public updateDefaultOptions(options: TerminalOptions): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Exportera en singleton-instans
export const terminalService = new TerminalService();
export default terminalService; 