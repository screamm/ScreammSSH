import React, { useState, useEffect } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';
import ThemeSelector, { Theme } from './components/ThemeSelector';
import './styles/main.css';

interface SSHConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  name: string;
}

interface Tab {
  id: string;
  connection: SSHConnection;
  isConnected: boolean;
}

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');
  
  // Läs in tema från localStorage vid uppstart
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') as Theme | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);
  
  const handleConnect = (config: SSHConnection) => {
    const newTab: Tab = {
      id: config.id,
      connection: config,
      isConnected: false
    };
    
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(config.id);
  };
  
  const handleConnectionStatus = (id: string, status: boolean) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === id ? { ...tab, isConnected: status } : tab
      )
    );
  };
  
  const handleTabClick = (id: string) => {
    setActiveTabId(id);
  };
  
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== id));
    
    // Om den aktiva tabben stängdes, välj en ny aktiv tabb
    if (activeTabId === id) {
      const remainingTabs = tabs.filter(tab => tab.id !== id);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  };
  
  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">ScreammSSH</h1>
        <ThemeSelector onThemeChange={handleThemeChange} />
      </header>
      
      <ConnectionForm onConnect={handleConnect} />
      
      {tabs.length > 0 && (
        <div className="terminal-header">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`terminal-tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span>
                {tab.connection.name || `${tab.connection.username}@${tab.connection.host}`}
              </span>
              <button 
                className="close-button" 
                onClick={(e) => handleCloseTab(tab.id, e)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      {activeTabId && (
        <div className="terminal-container">
          {tabs
            .filter(tab => tab.id === activeTabId)
            .map(tab => (
              <Terminal
                key={tab.id}
                sshConfig={tab.connection}
                onConnectionStatus={(status) => handleConnectionStatus(tab.id, status)}
                theme={currentTheme}
              />
            ))}
        </div>
      )}
      
      <div className="status-bar">
        <div className="status-item">
          <span className="status-indicator">Status:</span>
          {activeTabId && tabs.find(tab => tab.id === activeTabId)?.isConnected ? (
            <span className="status-connected">Ansluten</span>
          ) : (
            <span className="status-disconnected">Ej ansluten</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;