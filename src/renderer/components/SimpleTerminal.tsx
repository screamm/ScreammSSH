import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { v4 as uuidv4 } from 'uuid';
import { Theme } from '../types/index.d';

interface SimpleTerminalProps {
  height?: string;
  retroEffect?: boolean;
  initialCommand?: string;
}

// Lista över tillgängliga kommandon i terminalen
const AVAILABLE_COMMANDS: Record<string, { 
  description: string, 
  execute: (args: string[], term: Terminal) => void 
}> = {
  help: {
    description: 'Visa tillgängliga kommandon',
    execute: (args, term) => {
      term.writeln('\r\nTillgängliga kommandon:');
      Object.keys(AVAILABLE_COMMANDS).forEach(cmd => {
        term.writeln(`  ${cmd.padEnd(12)} - ${AVAILABLE_COMMANDS[cmd].description}`);
      });
      term.writeln('');
    }
  },
  clear: {
    description: 'Rensa terminalfönstret',
    execute: (args, term) => {
      term.clear();
    }
  },
  echo: {
    description: 'Eko text till terminalen',
    execute: (args, term) => {
      term.writeln('\r\n' + args.join(' '));
    }
  },
  date: {
    description: 'Visa aktuellt datum och tid',
    execute: (args, term) => {
      const now = new Date();
      term.writeln('\r\n' + now.toLocaleString());
    }
  },
  whoami: {
    description: 'Visa aktuell användare',
    execute: (args, term) => {
      term.writeln('\r\nAnvändare: admin');
    }
  },
  ssh: {
    description: 'Simulera SSH-anslutning',
    execute: (args, term) => {
      if (args.length < 1) {
        term.writeln('\r\nAnvändning: ssh [användare@]värd');
        return;
      }
      
      const target = args[0];
      term.writeln(`\r\nAnsluter till ${target}...`);
      
      let dots = 0;
      const interval = setInterval(() => {
        term.write('.');
        dots++;
        
        if (dots >= 3) {
          clearInterval(interval);
          term.writeln('\r\nAnslutning misslyckades: Simulerad anslutning');
        }
      }, 500);
    }
  },
  version: {
    description: 'Visa versionsinformation',
    execute: (args, term) => {
      term.writeln('\r\nScreammSSH Terminal v1.0.0');
      term.writeln(`Node.js ${window.electronAPI?.versions?.node || 'N/A'}`);
      term.writeln(`Electron ${window.electronAPI?.versions?.electron || 'N/A'}`);
      term.writeln(`Chromium ${window.electronAPI?.versions?.chrome || 'N/A'}`);
    }
  }
};

const SimpleTerminal: React.FC<SimpleTerminalProps> = ({ 
  height = '400px', 
  retroEffect = true,
  initialCommand
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const prompt = useRef<string>('screammSSH $ ');
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const currentInput = useRef<string>('');
  const terminalId = useRef<string>(uuidv4());
  
  // Lyssna på temat för terminalen
  const [theme, setTheme] = useState({
    background: 'var(--theme-bg-color, #000)',
    foreground: 'var(--theme-text-color, #0f0)',
    cursor: 'var(--theme-text-color, #0f0)',
    selection: 'var(--theme-selection-color, #333)',
  });
  
  useEffect(() => {
    // Lyssna på temabyte
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail;
      if (newTheme) {
        setTheme({
          background: newTheme.backgroundColor || 'var(--theme-bg-color, #000)',
          foreground: newTheme.textColor || 'var(--theme-text-color, #0f0)',
          cursor: newTheme.textColor || 'var(--theme-text-color, #0f0)',
          selection: newTheme.selection || 'var(--theme-selection-color, #333)',
        });
        
        // Updatera terminalen om den redan är skapad
        if (terminal.current) {
          terminal.current.options.theme = {
            background: newTheme.backgroundColor || 'var(--theme-bg-color, #000)',
            foreground: newTheme.textColor || 'var(--theme-text-color, #0f0)',
            cursor: newTheme.textColor || 'var(--theme-text-color, #0f0)',
            selectionBackground: newTheme.selection || 'var(--theme-selection-color, #333)',
          };
          
          // Uppdatera om terminalelementet finns
          if (terminalRef.current) {
            // Uppdatera CSS-variablerna för XTerm-elementet
            const xtermElement = terminalRef.current.querySelector('.xterm');
            if (xtermElement) {
              xtermElement.setAttribute('style', `
                --xterm-text-color: ${newTheme.textColor || 'var(--theme-text-color, #0f0)'};
                --xterm-bg-color: ${newTheme.backgroundColor || 'var(--theme-bg-color, #000)'};
                --xterm-selection-color: ${newTheme.selection || 'var(--theme-selection-color, #333)'};
              `);
            }
          }
        }
      }
    };
    
    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, []);
  
  // Testa ett kommando och ge resultatet
  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim();
    
    if (!trimmedCommand) {
      terminal.current?.writeln('\r\n');
      terminal.current?.write(prompt.current);
      return;
    }
    
    // Lägg till kommandot i historiken
    commandHistory.current.push(trimmedCommand);
    historyIndex.current = commandHistory.current.length;
    
    // Dela upp kommandot i delar
    const parts = trimmedCommand.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Utför kommandot om det finns
    if (cmd in AVAILABLE_COMMANDS) {
      try {
        AVAILABLE_COMMANDS[cmd].execute(args, terminal.current!);
      } catch (error) {
        terminal.current?.writeln(`\r\nFel vid exekvering av kommando: ${error}`);
      }
    } else {
      terminal.current?.writeln(`\r\nOkänt kommando: ${cmd}. Testa 'help' för att se tillgängliga kommandon.`);
    }
    
    terminal.current?.writeln('\r\n');
    terminal.current?.write(prompt.current);
  };
  
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // Skapa en ny terminal
    terminal.current = new Terminal({
      cursorBlink: true,
      scrollback: 1000,
      cols: 80,
      rows: 24,
      fontFamily: 'var(--theme-font-family, monospace)',
      fontSize: 14,
      theme: {
        background: theme.background,
        foreground: theme.foreground,
        cursor: theme.cursor,
        selectionBackground: theme.selection,
      }
    });
    
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon);
    
    // Öppna terminalen på elementet
    terminal.current.open(terminalRef.current);
    
    // Anpassa terminalstorleken
    setTimeout(() => {
      fitAddon.current?.fit();
    }, 100);
    
    // Välkomstmeddelande
    terminal.current.writeln('ScreammSSH Terminal v1.0.0');
    terminal.current.writeln('Terminal-ID: ' + terminalId.current);
    terminal.current.writeln('Skriv "help" för att se tillgängliga kommandon');
    terminal.current.writeln('-'.repeat(60));
    terminal.current.writeln('');
    terminal.current.write(prompt.current);
    
    // Handle terminal input
    let currentLine = '';
    let cursorPosition = 0;
    
    terminal.current.onData(data => {
      const ord = data.charCodeAt(0);
      
      // Hantera speciella tangenttryckningar
      if (ord === 13) { // Enter
        executeCommand(currentLine);
        currentLine = '';
        cursorPosition = 0;
      } else if (ord === 127 || ord === 8) { // Backspace / Delete
        if (cursorPosition > 0) {
          currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition);
          cursorPosition--;
          
          // Uppdatera terminaldisplayen
          terminal.current?.write('\x1b[D \x1b[D'); // Flytta vänster, radera tecken, flytta vänster igen
        }
      } else if (ord === 27) { // ESC
        // ESC-sekvenser (t.ex. arrow keys)
        if (data.length === 3 && data[1] === '[') {
          if (data[2] === 'A') { // Up arrow
            if (historyIndex.current > 0) {
              historyIndex.current--;
              // Spara det aktuella värdet om vi precis börjar bläddra i historiken
              if (historyIndex.current === commandHistory.current.length - 1) {
                currentInput.current = currentLine;
              }
              
              // Rensa aktuell rad
              terminal.current?.write('\x1b[2K\r');
              terminal.current?.write(prompt.current);
              
              // Visa kommando från historiken
              currentLine = commandHistory.current[historyIndex.current];
              cursorPosition = currentLine.length;
              terminal.current?.write(currentLine);
            }
          } else if (data[2] === 'B') { // Down arrow
            if (historyIndex.current < commandHistory.current.length) {
              historyIndex.current++;
              
              // Rensa aktuell rad
              terminal.current?.write('\x1b[2K\r');
              terminal.current?.write(prompt.current);
              
              // Visa nästa kommando i historiken eller återställ till tomt
              if (historyIndex.current === commandHistory.current.length) {
                currentLine = currentInput.current;
              } else {
                currentLine = commandHistory.current[historyIndex.current];
              }
              
              cursorPosition = currentLine.length;
              terminal.current?.write(currentLine);
            }
          } else if (data[2] === 'C') { // Right arrow
            if (cursorPosition < currentLine.length) {
              cursorPosition++;
              terminal.current?.write('\x1b[C'); // Flytta höger
            }
          } else if (data[2] === 'D') { // Left arrow
            if (cursorPosition > 0) {
              cursorPosition--;
              terminal.current?.write('\x1b[D'); // Flytta vänster
            }
          }
        }
      } else {
        // Vanlig teckeninmatning
        if (data >= ' ' && data <= '~') {
          // Infoga tecknet på aktuell cursorPosition
          currentLine = currentLine.slice(0, cursorPosition) + data + currentLine.slice(cursorPosition);
          cursorPosition++;
          
          // Uppdatera terminaldisplayen
          terminal.current?.write(data);
          
          // Om vi inte är i slutet av raden, skriv om resten av raden
          if (cursorPosition < currentLine.length) {
            terminal.current?.write(currentLine.slice(cursorPosition));
            terminal.current?.write('\x1b[' + (currentLine.length - cursorPosition) + 'D'); // Flytta tillbaka markören
          }
        }
      }
    });
    
    // Hantera storlek
    const handleResize = () => {
      fitAddon.current?.fit();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Om ett initialkommando har skickats, utför det
    if (initialCommand) {
      setTimeout(() => {
        terminal.current?.writeln('\r\n' + initialCommand);
        executeCommand(initialCommand);
      }, 500);
    }
    
    // Rensa upp vid avmontering
    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.current?.dispose();
    };
  }, [initialCommand]);
  
  return (
    <div className={`simple-terminal-container ${retroEffect ? 'crt-effect' : ''}`} style={{
      width: '100%',
      height: height ? `${height}px` : '100%',
      backgroundColor: 'var(--theme-bg-color, #000)',
      border: '1px solid var(--theme-accent-color, #0f0)',
      borderRadius: '4px',
      overflow: 'hidden', // Viktig för att behålla terminalns funktionalitet
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="terminal-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid var(--theme-accent-color, #0f0)',
      }}>
        <div className="terminal-title" style={{ fontSize: '12px' }}>
          Terminal: {terminalId.current.substring(0, 8)}
        </div>
        <div className="terminal-buttons">
          <button 
            onClick={() => terminal.current?.clear()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--theme-text-color, #0f0)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '0 4px'
            }}
          >
            Rensa
          </button>
        </div>
      </div>
      
      <div className="terminal-content" ref={terminalRef} style={{
        flex: 1,
        padding: '4px',
        overflow: 'hidden' // Det är viktigt att sätta overflow:hidden bara på innehållet, inte på hela terminalen
      }} />
    </div>
  );
};

export default SimpleTerminal; 