import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../styles/ascii-ui.css';

interface ConnectionConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  name: string;
}

interface AsciiConnectionFormProps {
  onConnect: (config: ConnectionConfig) => void;
  onBack?: () => void;
  retroEffect?: boolean;
}

const AsciiConnectionForm: React.FC<AsciiConnectionFormProps> = ({ 
  onConnect, 
  onBack,
  retroEffect = true
}) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [savedConnections, setSavedConnections] = useState<ConnectionConfig[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  
  // Ladda sparade anslutningar vid uppstart
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const connections = await window.electronAPI.getSavedConnections();
        if (connections && Array.isArray(connections)) {
          setSavedConnections(connections);
        }
      } catch (error) {
        console.error('Fel vid laddning av sparade anslutningar:', error);
      }
    };
    
    loadConnections();
  }, []);
  
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validera formulär
    if (!host || !username) {
      setError('Värd och användarnamn krävs');
      return;
    }
    
    // Kontrollera att porten är ett nummer
    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      setError('Ogiltig port');
      return;
    }
    
    // Skapa konfiguration
    const config: ConnectionConfig = {
      id: uuidv4(),
      host,
      port: portNumber,
      username,
      password: usePrivateKey ? undefined : password,
      privateKey: usePrivateKey ? privateKey : undefined,
      name: name || `${username}@${host}`
    };
    
    // Anrop till förälderns callback
    onConnect(config);
  };
  
  const handleLoadConnection = (connection: ConnectionConfig) => {
    setHost(connection.host);
    setPort(String(connection.port));
    setUsername(connection.username);
    setPassword(connection.password || '');
    setUsePrivateKey(!!connection.privateKey);
    setPrivateKey(connection.privateKey || '');
    setName(connection.name);
    setShowSaved(false);
  };
  
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!name || !host || !port || !username) {
      setError('Värd, port och användarnamn krävs');
      return;
    }
    
    try {
      const connectionToSave = {
        id: uuidv4(),
        name,
        host,
        port: Number(port),
        username,
        password: usePrivateKey ? undefined : password,
        privateKey: usePrivateKey ? privateKey : undefined,
        passphrase: undefined,
        group: undefined,
        notes: ''
      };
      
      await window.electronAPI.saveConnection(connectionToSave);
      
      // Antag att operationen lyckades om inget fel kastades
      setError('');
      
      // Informera föräldern om den sparade anslutningen
      onConnect(connectionToSave);
    } catch (error) {
      console.error('Fel vid sparande av anslutning:', error);
      setError(error instanceof Error ? error.message : 'Kunde inte spara anslutningen');
    }
  };

  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-banner">
{`
    .--.--.--.--.--.--.--.--.--.--.--.--.--.--.--.--.--.
    |S||S||H||/||S||F||T||P| |C||O||N||N||E||C||T||I||O||N|
    \`--'--'--'--'--'--'--'--'--'--'--'--'--'--'--'--'--'
`}
      </div>
      
      <div className="ascii-box double">
        <div className="ascii-box-title">ANSLUTNING</div>
        
        <form onSubmit={handleConnect}>
          <div className="ascii-columns">
            <div className="ascii-column">
              <label className="ascii-label">Värdnamn/IP</label>
              <input
                type="text"
                className="ascii-input"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="t.ex. 192.168.1.1 eller server.exempel.se"
              />
              
              <label className="ascii-label">Port</label>
              <input
                type="text"
                className="ascii-input"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="22"
              />
              
              <label className="ascii-label">Anslutningsnamn (valfritt)</label>
              <input
                type="text"
                className="ascii-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Min Hemserver"
              />
            </div>
            
            <div className="ascii-column">
              <label className="ascii-label">Användarnamn</label>
              <input
                type="text"
                className="ascii-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="t.ex. root"
              />
              
              <div className="setting-option" style={{ marginBottom: 'var(--ascii-grid)' }}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={usePrivateKey} 
                    onChange={(e) => setUsePrivateKey(e.target.checked)}
                  />
                  Använd privat nyckel
                </label>
              </div>
              
              {usePrivateKey ? (
                <>
                  <label className="ascii-label">Privat Nyckel</label>
                  <textarea
                    className="ascii-input"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Klistra in din privata SSH-nyckel här"
                    style={{ height: '120px' }}
                  />
                </>
              ) : (
                <>
                  <label className="ascii-label">Lösenord</label>
                  <input
                    type="password"
                    className="ascii-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ditt lösenord"
                  />
                </>
              )}
            </div>
          </div>
          
          {error && <div style={{ color: 'var(--ascii-error)', marginBottom: 'var(--ascii-grid)' }}>{error}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--ascii-grid)' }}>
            <div>
              <button 
                type="button" 
                className="ascii-button secondary"
                onClick={onBack}
              >
                [ TILLBAKA ]
              </button>
              
              <button 
                type="button" 
                className="ascii-button secondary"
                onClick={() => setShowSaved(!showSaved)}
              >
                [ SPARADE ANSLUTNINGAR ]
              </button>
            </div>
            
            <div>
              <button 
                type="button" 
                className="ascii-button secondary"
                onClick={handleSave}
              >
                [ SPARA ]
              </button>
              
              <button 
                type="submit" 
                className="ascii-button primary"
              >
                [ ANSLUT ]
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {showSaved && savedConnections.length > 0 && (
        <div className="ascii-box single">
          <div className="ascii-box-title">SPARADE ANSLUTNINGAR</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {savedConnections.map(conn => (
              <div 
                key={conn.id}
                className="ascii-prompt"
                style={{ 
                  cursor: 'pointer', 
                  padding: 'calc(var(--ascii-grid) / 2)', 
                  borderBottom: '1px solid var(--ascii-dim)'
                }}
                onClick={() => handleLoadConnection(conn)}
              >
                <span className="ascii-prompt-char">{'>'}</span>
                {conn.name} ({conn.username}@{conn.host}:{conn.port})
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showSaved && savedConnections.length === 0 && (
        <div className="ascii-box single">
          <div className="ascii-box-title">SPARADE ANSLUTNINGAR</div>
          <div style={{ padding: 'var(--ascii-grid)', textAlign: 'center', color: 'var(--ascii-dim)' }}>
            Inga sparade anslutningar hittades
          </div>
        </div>
      )}
      
      <div className="ascii-help-text">
        Fyll i uppgifterna ovan för att ansluta till en SSH-server
      </div>
    </div>
  );
};

export default AsciiConnectionForm; 