import React, { useEffect, useRef, useState } from 'react';
import { terminalService } from '../services/TerminalService';
import { SSHConnectionInfo } from '../services/SSHService';
import { connectionManager } from '../services/ConnectionManager';
import 'xterm/css/xterm.css';

interface TerminalProps {
  connection?: SSHConnectionInfo;
  autoConnect?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ connection, autoConnect = false }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // När komponenten monteras, lyssna på förändringar i storlek
    const handleResize = () => {
      if (connectionIdRef.current) {
        terminalService.fitTerminal(connectionIdRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    // Städa upp när komponenten avmonteras
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (connectionIdRef.current) {
        // Rensa terminalen (men koppla inte från)
        terminalService.destroyTerminal(connectionIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // När anslutningen ändras, återställ terminalen och anslut om autoConnect är true
    resetTerminal();
    
    if (connection && autoConnect) {
      connectToSSH();
    }
  }, [connection, autoConnect]);

  const resetTerminal = () => {
    // Rensa eventuell befintlig terminal
    if (connectionIdRef.current) {
      terminalService.destroyTerminal(connectionIdRef.current);
      connectionIdRef.current = null;
    }
    
    setIsConnected(false);
    setIsLoading(false);
    setError(null);
    
    if (connection && terminalRef.current) {
      // Initalisera en ny terminal för den valda anslutningen
      connectionIdRef.current = connection.id;
      terminalService.createTerminal(connection.id, terminalRef.current);
      
      // Visa välkomstmeddelande
      terminalService.writeToTerminal(
        connection.id,
        `\r\n\x1b[1;34m=== ScreammSSH Terminal ===\x1b[0m\r\n` +
        `\r\nAnslutning: \x1b[1;32m${connection.name}\x1b[0m\r\n` +
        `Host: \x1b[1;33m${connection.username}@${connection.host}:${connection.port}\x1b[0m\r\n\r\n` +
        `Klicka på "Anslut" för att upprätta en SSH-anslutning eller skriv kommando nedan.\r\n\r\n`
      );
    }
  };

  const connectToSSH = async () => {
    if (!connection) {
      setError('Ingen anslutning vald');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Visa anslutningsmeddelande i terminalen
      if (connectionIdRef.current) {
        terminalService.writeToTerminal(
          connectionIdRef.current,
          `\r\n\x1b[33mAnsluter till ${connection.host}...\x1b[0m\r\n`
        );
      }
      
      // Anslut med SSH
      const connected = await connectionManager.connect(connection.id);
      
      if (connected) {
        setIsConnected(true);
        
        // Öppna ett shell i den anslutna sessionen
        const shellOpened = await connectionManager.openShell(connection.id);
        
        if (!shellOpened) {
          throw new Error('Kunde inte öppna shell');
        }
        
        // Justera terminalstorleken efter anslutning
        if (connectionIdRef.current) {
          terminalService.fitTerminal(connectionIdRef.current);
        }
      } else {
        throw new Error('Anslutning misslyckades');
      }
    } catch (err) {
      setError(err.message || 'Anslutning misslyckades');
      
      if (connectionIdRef.current) {
        terminalService.writeToTerminal(
          connectionIdRef.current,
          `\r\n\x1b[31mFel: ${err.message || 'Anslutning misslyckades'}\x1b[0m\r\n`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectFromSSH = () => {
    if (!connection) return;
    
    if (connectionManager.isConnected(connection.id)) {
      connectionManager.disconnect(connection.id);
      
      if (connectionIdRef.current) {
        terminalService.writeToTerminal(
          connectionIdRef.current,
          `\r\n\x1b[33mFrånkopplad från ${connection.host}\x1b[0m\r\n`
        );
      }
      
      setIsConnected(false);
    }
  };

  const clearTerminal = () => {
    if (connectionIdRef.current) {
      terminalService.clearTerminal(connectionIdRef.current);
    }
  };

  return (
    <div className="terminal-container">
      {!connection ? (
        <div className="terminal-placeholder">
          <div className="placeholder-content">
            <h3>Ingen anslutning vald</h3>
            <p>Välj en anslutning från listan för att börja</p>
          </div>
        </div>
      ) : (
        <>
          <div className="terminal-header">
            <div className="terminal-title">
              <span className="connection-name">{connection.name}</span>
              <span className="connection-host">{connection.username}@{connection.host}:{connection.port}</span>
            </div>
            <div className="terminal-actions">
              {!isConnected ? (
                <button 
                  className="connect-btn"
                  onClick={connectToSSH}
                  disabled={isLoading}
                >
                  {isLoading ? 'Ansluter...' : 'Anslut'}
                </button>
              ) : (
                <button 
                  className="disconnect-btn"
                  onClick={disconnectFromSSH}
                >
                  Koppla från
                </button>
              )}
              <button 
                className="clear-btn"
                onClick={clearTerminal}
              >
                Rensa
              </button>
            </div>
          </div>
          
          {error && (
            <div className="terminal-error">
              {error}
            </div>
          )}
          
          <div className="terminal-xterm" ref={terminalRef} />
        </>
      )}
    </div>
  );
};

export default Terminal; 