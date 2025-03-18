import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
import { SSHConnectionInfo, Theme } from '../types/index.d';
import { v4 as uuidv4 } from 'uuid';

// Deklarera interface för terminalEmitter
declare global {
  interface Window { 
    terminalEmitter: {
      onData: (sessionId: string, callback: (data: string) => void) => () => void;
      onExit: (sessionId: string, callback: (code: number, signal: string) => void) => () => void;
      onError: (sessionId: string, callback: (error: string) => void) => () => void;
      write: (sessionId: string, data: string) => void;
    };
  }
}

interface TerminalProps {
  connection?: SSHConnectionInfo;
  autoConnect?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ 
  connection,
  autoConnect = false
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<XTerm>();
  const fitAddon = useRef<FitAddon>(new FitAddon());
  const searchAddon = useRef<SearchAddon>(new SearchAddon());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Hantera temaupdateringar
  useEffect(() => {
    // Lyssna på temändringar
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const newTheme = customEvent.detail;
        
        // Skapa xterm-tema
        if (terminal.current) {
          terminal.current.options.theme = {
            background: newTheme.backgroundColor || 'var(--theme-bg-color, #000)',
            foreground: newTheme.textColor || 'var(--theme-text-color, #0f0)',
            cursor: newTheme.textColor || 'var(--theme-text-color, #0f0)',
            selectionBackground: newTheme.selection || 'var(--theme-selection-color, #333)',
          };
        }
      }
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);
  
  // Hantera storleksändringar
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current && terminal.current) {
        fitAddon.current.fit();
        
        // Meddela servern om storleksändringen
        if (isConnected && connection) {
          const { cols, rows } = terminal.current;
          window.electronAPI.resizeTerminal(connection.id, cols, rows);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isConnected, connection]);
  
  // Anslut till SSH när komponenten laddas
  useEffect(() => {
    if (autoConnect && connection && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, connection, isConnected, isConnecting]);
  
  // Städa upp vid avmontering
  useEffect(() => {
    return () => {
      disconnect();
      
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, []);
  
  // Initiera terminalen
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;
    
    // Skapa en ny terminal
    terminal.current = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'var(--theme-font-family, monospace)',
      theme: {
        background: 'var(--theme-bg-color, #000)',
        foreground: 'var(--theme-text-color, #0f0)',
        cursor: 'var(--theme-text-color, #0f0)',
        selectionBackground: 'var(--theme-selection-color, #333)',
      },
      allowTransparency: true,
    });
    
    // Lägg till tillägg
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(new WebLinksAddon());
    terminal.current.loadAddon(searchAddon.current);
    
    // Öppna terminalen
    terminal.current.open(terminalRef.current);
    
    // Justera storleken
    setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    }, 100);
    
    // Välkomstmeddelande
    terminal.current.writeln('\r\n\x1b[33mScreammSSH Terminal\x1b[0m\r\n');
    
    if (connection) {
      terminal.current.writeln(`\r\nAnvändarnamn: \x1b[36m${connection.username}\x1b[0m`);
      terminal.current.writeln(`Värd: \x1b[36m${connection.host}\x1b[0m`);
      terminal.current.writeln(`Port: \x1b[36m${connection.port || 22}\x1b[0m\r\n`);
    } else {
      terminal.current.writeln('\r\nIngen SSH-anslutning konfigurerad. Använd ANSLUTNINGAR-menyn för att konfigurera en.\r\n');
    }
    
  }, [connection]);
  
  // Anslut till SSH-servern
  const connect = async () => {
    if (!terminal.current || !connection || isConnected || isConnecting) return;
    
    setIsConnecting(true);
    
    // Skapa sessions-ID
    const newSessionId = connection.id || uuidv4();
    setSessionId(newSessionId);
    
    terminal.current.writeln(`\r\n\x1b[33mAnsluter till ${connection.host}...\x1b[0m\r\n`);
    
    try {
      // Anslut med SSH
      const connected = await window.electronAPI.connectSSH(connection);
      
      if (connected) {
        setIsConnected(true);
        terminal.current.writeln(`\r\n\x1b[32mAnsluten till ${connection.host}\x1b[0m\r\n`);
        
        // Öppna ett skal
        await window.electronAPI.openSSHShell(newSessionId);
        
        // Uppdatera terminalstorleken på servern
        if (terminal.current) {
          window.electronAPI.resizeTerminal(
            connection.id,
            terminal.current.cols,
            terminal.current.rows
          );
        }
      } else {
        terminal.current.writeln(`\r\n\x1b[31mKunde inte ansluta till ${connection.host}\x1b[0m\r\n`);
      }
    } catch (error) {
      terminal.current.writeln(`\r\n\x1b[31mAnslutningsfel: ${error}\x1b[0m\r\n`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Koppla från SSH-servern
  const disconnect = async () => {
    if (!isConnected || !connection) return;
    
    try {
      await window.electronAPI.disconnectSSH(connection.id);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[33mKopplad från ${connection.host}\x1b[0m\r\n`);
      }
    } catch (error) {
      console.error('Frånkopplingsfel:', error);
    } finally {
      setIsConnected(false);
    }
  };
  
  // Lyssna på input från terminalen
  useEffect(() => {
    if (!terminal.current || !connection || !isConnected) return;
    
    terminal.current.onData((data) => {
      if (isConnected) {
        window.terminalEmitter.write(sessionId, data);
      }
    });
    
    // Lyssna på utdata från SSH-servern
    const removeDataListener = window.terminalEmitter.onData(sessionId, (data) => {
      if (terminal.current) {
        terminal.current.write(data);
      }
    });
    
    // Lyssna på exit från SSH-servern
    const removeExitListener = window.terminalEmitter.onExit(sessionId, (exitCode, signal) => {
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[33mAnslutningen avslutades: ${signal || `Exitkod ${exitCode}`}\x1b[0m\r\n`);
      }
      setIsConnected(false);
    });
    
    // Lyssna på fel från SSH-servern
    const removeErrorListener = window.terminalEmitter.onError(sessionId, (error) => {
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31mFel: ${error}\x1b[0m\r\n`);
      }
      setIsConnected(false);
    });
    
    return () => {
      // Ta bort lyssnare
      removeDataListener();
      removeExitListener();
      removeErrorListener();
    };
  }, [isConnected, sessionId, connection]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      position: 'relative'
    }}>
      {connection && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '5px'
        }}>
          <div>
            <span style={{ fontSize: '12px' }}>
              {connection.name || connection.host} 
              {isConnected 
                ? <span style={{ color: 'var(--theme-accent-color)', marginLeft: '5px' }}>●</span>
                : <span style={{ color: '#888', marginLeft: '5px' }}>○</span>}
            </span>
          </div>
          
          <div>
            {!isConnected ? (
              <button 
                onClick={connect}
                disabled={isConnecting}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--theme-accent-color)',
                  color: 'var(--theme-text-color)',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {isConnecting ? 'Ansluter...' : 'Anslut'}
              </button>
            ) : (
              <button 
                onClick={disconnect}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--theme-accent-color)',
                  color: 'var(--theme-text-color)',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Koppla från
              </button>
            )}
          </div>
        </div>
      )}
      
      <div 
        ref={terminalRef} 
        style={{ 
          height: '100%', 
          width: '100%', 
          overflow: 'hidden',
          borderRadius: '4px',
          border: '1px solid var(--theme-accent-color)'
        }} 
      />
    </div>
  );
};

export default Terminal; 