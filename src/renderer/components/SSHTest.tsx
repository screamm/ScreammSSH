import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TerminalTabs, { Tab } from './TerminalTabs';
import Terminal from './Terminal';
import { SSHConnectionInfo } from '../types/index.d';

// Gränssnitt för SSH-anslutningsegenskaper
export interface SSHConnectionProps {
  id?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  savePassword: boolean;
  name?: string;
}

// Information om serverrespons
interface ServerInfo {
  osType: string;
  version: string;
  hostname: string;
  uptime: number;
}

// Vanliga portnummer för SSH
const COMMON_PORTS = [22, 2222, 8022, 8080];

const SSHTest: React.FC = () => {
  const [host, setHost] = useState<string>('');
  const [port, setPort] = useState<number>(22);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [savePassword, setSavePassword] = useState<boolean>(false);
  const [connectionName, setConnectionName] = useState<string>('');
  
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'failed'>('idle');
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [recentConnections, setRecentConnections] = useState<SSHConnectionInfo[]>([]);
  const [activeConnectionTab, setActiveConnectionTab] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  
  // Ladda sparade anslutningar från localStorage
  useEffect(() => {
    try {
      const savedConnections = localStorage.getItem('sshConnections');
      if (savedConnections) {
        const parsed = JSON.parse(savedConnections) as SSHConnectionInfo[];
        setRecentConnections(parsed);
      }
    } catch (error) {
      console.error('Fel vid hämtning av sparade anslutningar:', error);
    }
  }, []);
  
  // Spara en anslutning för framtida användning
  const saveConnection = (config: SSHConnectionInfo) => {
    try {
      // Generera ett ID om det inte finns
      if (!config.id) {
        config.id = uuidv4();
      }
      
      // Skapa ett namn om det inte finns
      if (!config.name) {
        config.name = `${config.username}@${config.host}:${config.port}`;
      }
      
      // Ta bort lösenordet om användaren inte vill spara det
      const connectionToSave = { ...config };
      if (!connectionToSave.savePassword) {
        delete connectionToSave.password;
      }
      
      // Kolla om anslutningen redan finns (baserat på ID)
      const existingIndex = recentConnections.findIndex(c => c.id === config.id);
      
      // Uppdatera eller lägg till den nya anslutningen
      if (existingIndex !== -1) {
        const updatedConnections = [...recentConnections];
        updatedConnections[existingIndex] = connectionToSave;
        setRecentConnections(updatedConnections);
        localStorage.setItem('sshConnections', JSON.stringify(updatedConnections));
      } else {
        const updatedConnections = [...recentConnections, connectionToSave];
        setRecentConnections(updatedConnections);
        localStorage.setItem('sshConnections', JSON.stringify(updatedConnections));
      }
    } catch (error) {
      console.error('Fel vid sparande av anslutning:', error);
    }
  };
  
  // Ta bort en anslutning
  const deleteConnection = (id: string) => {
    try {
      const updatedConnections = recentConnections.filter(c => c.id !== id);
      setRecentConnections(updatedConnections);
      localStorage.setItem('sshConnections', JSON.stringify(updatedConnections));
      
      // Ta bort tillhörande flik
      const updatedTabs = tabs.filter(tab => tab.sessionId !== id);
      setTabs(updatedTabs);
      
      // Om den aktiva fliken var den som togs bort, aktivera en annan flik
      if (activeConnectionTab === id) {
        const newActiveTab = updatedTabs.length > 0 ? updatedTabs[0].id : null;
        setActiveConnectionTab(newActiveTab);
      }
    } catch (error) {
      console.error('Fel vid borttagning av anslutning:', error);
    }
  };
  
  // Ladda en sparad anslutning för redigering
  const loadConnection = (connection: SSHConnectionInfo) => {
    setHost(connection.host);
    setPort(connection.port);
    setUsername(connection.username);
    setPassword(connection.password || '');
    setSavePassword(connection.savePassword);
    setConnectionName(connection.name || '');
  };
  
  // Testa SSH-anslutningen
  const testSSHConnection = async () => {
    // Validera indata
    if (!host || !username) {
      setErrorMessage('Ange värdnamn och användarnamn');
      return;
    }
    
    setConnectionStatus('connecting');
    setServerInfo(null);
    setErrorMessage('');
    
    // Skapa anslutningskonfigurationen
    const connectionConfig: SSHConnectionInfo = {
      id: uuidv4(),
      host,
      port,
      username,
      password,
      savePassword,
      name: connectionName || `${username}@${host}:${port}`
    };
    
    // Spara anslutningen för framtida användning
    saveConnection(connectionConfig);
    
    try {
      const result = await window.electronAPI.testSSHConnection(connectionConfig);
      
      if (result.success) {
        setConnectionStatus('success');
        setServerInfo(result.serverInfo);
        
        // Skapa en ny flik för anslutningen om den inte redan finns
        const existingTabIndex = tabs.findIndex(t => t.sessionId === connectionConfig.id);
        if (existingTabIndex === -1) {
          const newTab: Tab = {
            id: uuidv4(),
            title: connectionConfig.name || `${connectionConfig.username}@${connectionConfig.host}`,
            type: 'ssh',
            sessionId: connectionConfig.id,
            isActive: true
          };
          
          // Inaktivera alla andra flikar
          const updatedTabs = tabs.map(t => ({ ...t, isActive: false }));
          
          setTabs([...updatedTabs, newTab]);
          setActiveConnectionTab(connectionConfig.id);
        } else {
          // Aktivera den befintliga fliken
          const updatedTabs = tabs.map(t => ({
            ...t,
            isActive: t.sessionId === connectionConfig.id
          }));
          
          setTabs(updatedTabs);
          setActiveConnectionTab(connectionConfig.id);
        }
      } else {
        setConnectionStatus('failed');
        setErrorMessage(result.error || 'Okänt fel vid anslutning');
      }
    } catch (error: any) {
      setConnectionStatus('failed');
      setErrorMessage(error.message || 'Okänt fel vid anslutning');
      console.error('SSH-anslutningsfel:', error);
    }
  };
  
  // Hantera byte av flik
  const handleTabSelect = (tabId: string) => {
    const selectedTab = tabs.find(t => t.id === tabId);
    if (selectedTab) {
      const updatedTabs = tabs.map(t => ({
        ...t,
        isActive: t.id === tabId
      }));
      
      setTabs(updatedTabs);
      setActiveConnectionTab(selectedTab.sessionId);
      
      // Hitta och ladda anslutningsuppgifterna
      const connection = recentConnections.find(c => c.id === selectedTab.sessionId);
      if (connection) {
        loadConnection(connection);
      }
    }
  };
  
  // Hantera stängning av flik
  const handleTabClose = (tabId: string) => {
    const tabToClose = tabs.find(t => t.id === tabId);
    const updatedTabs = tabs.filter(t => t.id !== tabId);
    
    // Om det inte finns några flikar kvar, återställ aktivt val
    if (updatedTabs.length === 0) {
      setActiveConnectionTab(null);
    } 
    // Om den stängda fliken var aktiv, aktivera en annan flik
    else if (tabToClose?.isActive) {
      const newActiveTab = updatedTabs[0];
      updatedTabs[0] = { ...newActiveTab, isActive: true };
      setActiveConnectionTab(newActiveTab.sessionId);
      
      // Hitta och ladda anslutningsuppgifterna
      const connection = recentConnections.find(c => c.id === newActiveTab.sessionId);
      if (connection) {
        loadConnection(connection);
      }
    }
    
    setTabs(updatedTabs);
  };
  
  // Skapa en ny flik
  const handleCreateTab = (type: 'shell' | 'ssh') => {
    // Shell-typ stöds inte ännu
    if (type === 'shell') {
      alert('Shellstöd kommer i en framtida uppdatering');
      return;
    }
    
    // För SSH, börja med ett nytt anslutningsformulär
    setHost('');
    setPort(22);
    setUsername('');
    setPassword('');
    setSavePassword(false);
    setConnectionName('');
    setConnectionStatus('idle');
    setServerInfo(null);
    setErrorMessage('');
    setActiveConnectionTab(null);
    
    // Inaktivera alla flikar
    const updatedTabs = tabs.map(t => ({
      ...t,
      isActive: false
    }));
    
    setTabs(updatedTabs);
  };
  
  return (
    <div className="ssh-test-container" style={{
      backgroundColor: 'var(--theme-bg-color)',
      color: 'var(--theme-text-color)',
      padding: '15px',
      borderRadius: '4px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Förhindra scrollning på containernivå
      maxHeight: '100%'
    }}>
      <h2 style={{ marginBottom: '15px', color: 'var(--theme-text-color)' }}>
        SSH-anslutningar
      </h2>
      
      {/* Flikar för flera anslutningar */}
      <TerminalTabs 
        tabs={tabs}
        onSelectTab={handleTabSelect}
        onCloseTab={handleTabClose}
        onCreateTab={handleCreateTab}
        language="sv"
      />
      
      <div className="ssh-content" style={{
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '20px',
        marginTop: '15px',
        flex: 1,
        overflow: 'auto' // Låt innehållet vara scrollbart
      }}>
        {/* Anslutningsformulär */}
        <div className="ssh-form-container" style={{
          flex: '1',
          minWidth: '300px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--theme-accent-color)'
        }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--theme-text-color)' }}>
            {activeConnectionTab 
              ? 'Redigera anslutning'
              : 'Ny SSH-anslutning'}
          </h3>
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label htmlFor="connectionName" style={{ display: 'block', marginBottom: '5px' }}>
              Anslutningsnamn
            </label>
            <input
              id="connectionName"
              type="text"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              placeholder="Valfritt anslutningsnamn"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label htmlFor="host" style={{ display: 'block', marginBottom: '5px' }}>
              Värdnamn / IP-adress *
            </label>
            <input
              id="host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="t.ex. example.com eller 192.168.0.1"
              required
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label htmlFor="port" style={{ display: 'block', marginBottom: '5px' }}>
              Port
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                min="1"
                max="65535"
                style={{ width: '100px' }}
              />
              <div className="port-buttons" style={{ display: 'flex', gap: '5px' }}>
                {COMMON_PORTS.map(commonPort => (
                  <button
                    key={commonPort}
                    type="button"
                    onClick={() => setPort(commonPort)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: port === commonPort ? 'var(--theme-accent-color)' : 'transparent',
                      color: port === commonPort ? 'var(--theme-bg-color)' : 'var(--theme-text-color)',
                      border: '1px solid var(--theme-accent-color)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {commonPort}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
              Användarnamn *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="t.ex. admin"
              required
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord för SSH-anslutning"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={savePassword}
                onChange={(e) => setSavePassword(e.target.checked)}
              />
              Spara lösenord (lagras lokalt)
            </label>
          </div>
          
          <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={testSSHConnection}
              disabled={connectionStatus === 'connecting'}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--theme-accent-color)',
                color: 'var(--theme-bg-color)',
                border: 'none',
                borderRadius: '4px',
                cursor: connectionStatus === 'connecting' ? 'wait' : 'pointer',
                flex: 1
              }}
            >
              {connectionStatus === 'connecting' ? 'Ansluter...' : 'Testa anslutning'}
            </button>
            
            {activeConnectionTab && (
              <button 
                onClick={() => {
                  if (window.confirm('Är du säker på att du vill ta bort denna anslutning?')) {
                    deleteConnection(activeConnectionTab);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-text-color)',
                  border: '1px solid var(--theme-accent-color)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Ta bort
              </button>
            )}
          </div>
          
          {/* Statusmeddelande */}
          {connectionStatus === 'success' && (
            <div className="status success" style={{
              marginTop: '15px',
              padding: '8px',
              backgroundColor: 'rgba(0, 128, 0, 0.2)',
              color: '#0f0',
              borderRadius: '4px',
              border: '1px solid #0f0'
            }}>
              ✓ Anslutningen lyckades!
            </div>
          )}
          
          {connectionStatus === 'failed' && (
            <div className="status error" style={{
              marginTop: '15px',
              padding: '8px',
              backgroundColor: 'rgba(128, 0, 0, 0.2)',
              color: '#f00',
              borderRadius: '4px',
              border: '1px solid #f00'
            }}>
              ✗ Anslutningen misslyckades: {errorMessage}
            </div>
          )}
        </div>
        
        {/* Serverinformation och sparade anslutningar */}
        <div className="ssh-info-container" style={{
          flex: '1',
          minWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Serverinformation */}
          {serverInfo && (
            <div className="server-info" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid var(--theme-accent-color)'
            }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--theme-text-color)' }}>
                Serverinformation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px' }}>
                <strong>Operativsystem:</strong>
                <span>{serverInfo.osType}</span>
                
                <strong>Version:</strong>
                <span>{serverInfo.version}</span>
                
                <strong>Värdnamn:</strong>
                <span>{serverInfo.hostname}</span>
                
                <strong>Upptid:</strong>
                <span>
                  {serverInfo.uptime > 86400
                    ? `${Math.floor(serverInfo.uptime / 86400)} dagar ${Math.floor((serverInfo.uptime % 86400) / 3600)} timmar`
                    : serverInfo.uptime > 3600
                      ? `${Math.floor(serverInfo.uptime / 3600)} timmar ${Math.floor((serverInfo.uptime % 3600) / 60)} minuter`
                      : `${Math.floor(serverInfo.uptime / 60)} minuter`}
                </span>
              </div>
            </div>
          )}
          
          {/* Sparade anslutningar */}
          <div className="saved-connections" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid var(--theme-accent-color)',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--theme-text-color)' }}>
              Sparade anslutningar
            </h3>
            
            {recentConnections.length === 0 ? (
              <p>Inga sparade anslutningar</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentConnections.map(connection => (
                  <li 
                    key={connection.id} 
                    style={{
                      padding: '8px',
                      marginBottom: '8px',
                      backgroundColor: activeConnectionTab === connection.id 
                        ? 'rgba(0, 255, 0, 0.1)' 
                        : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid ' + (activeConnectionTab === connection.id 
                        ? 'var(--theme-text-color)' 
                        : 'transparent')
                    }}
                    onClick={() => {
                      loadConnection(connection);
                      
                      // Aktivera eller skapa flik för denna anslutning
                      const existingTabIndex = tabs.findIndex(t => t.sessionId === connection.id);
                      if (existingTabIndex !== -1) {
                        handleTabSelect(tabs[existingTabIndex].id);
                      } else {
                        // Skapa en ny flik för anslutningen
                        const newTab: Tab = {
                          id: uuidv4(),
                          title: connection.name || `${connection.username}@${connection.host}`,
                          type: 'ssh',
                          sessionId: connection.id,
                          isActive: true
                        };
                        
                        // Inaktivera alla andra flikar
                        const updatedTabs = tabs.map(t => ({ ...t, isActive: false }));
                        
                        setTabs([...updatedTabs, newTab]);
                        setActiveConnectionTab(connection.id);
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {connection.name || `${connection.username}@${connection.host}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--theme-accent-color)' }}>
                      {connection.username}@{connection.host}:{connection.port}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Terminal-panel som visas när en anslutning är aktiv */}
      {activeConnectionTab && (
        <div className="terminal-panel" style={{
          marginTop: '20px',
          flex: 1,
          minHeight: '300px',
          borderRadius: '4px',
          border: '1px solid var(--theme-accent-color)',
          overflow: 'hidden'
        }}>
          <Terminal 
            connection={recentConnections.find(c => c.id === activeConnectionTab)}
            autoConnect={connectionStatus === 'success'}
          />
        </div>
      )}
    </div>
  );
};

export default SSHTest; 