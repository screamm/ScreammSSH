import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AsciiTerminal from './AsciiTerminal';
import { Theme } from './ThemeSelector';
import '../styles/ascii-ui.css';

// Typ för SSH-anslutning
interface SSHConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  name: string;
}

// Möjliga layouter för terminalpaneler
type LayoutType = 'single' | 'horizontal' | 'vertical' | 'quad';

// Terminalpanel med ID och anslutning
interface Panel {
  id: string;
  connection: SSHConnection | null;
  isConnected: boolean;
}

interface AsciiSplitTerminalProps {
  initialConnections?: SSHConnection[];
  onBack?: () => void;
  theme?: Theme;
  retroEffect?: boolean;
  onNewConnection?: () => void;
}

const AsciiSplitTerminal: React.FC<AsciiSplitTerminalProps> = ({
  initialConnections = [],
  onBack,
  theme = 'default',
  retroEffect = true,
  onNewConnection
}) => {
  // Tillstånd
  const [layout, setLayout] = useState<LayoutType>('single');
  const [activePanel, setActivePanel] = useState<string>('panel1');
  const [showConnectionPicker, setShowConnectionPicker] = useState<boolean>(false);
  const [pickingForPanelId, setPickingForPanelId] = useState<string | null>(null);
  const [savedConnections, setSavedConnections] = useState<SSHConnection[]>([]);
  
  // Skapa 4 paneler (för alla layouter)
  const [panels, setPanels] = useState<Panel[]>([
    { id: 'panel1', connection: initialConnections[0] || null, isConnected: false },
    { id: 'panel2', connection: initialConnections[1] || null, isConnected: false },
    { id: 'panel3', connection: initialConnections[2] || null, isConnected: false },
    { id: 'panel4', connection: initialConnections[3] || null, isConnected: false }
  ]);
  
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
  
  // Hantera byte av layout
  const changeLayout = (newLayout: LayoutType) => {
    setLayout(newLayout);
  };
  
  // Hantera klick på en panel (göra den aktiv)
  const handlePanelClick = (panelId: string) => {
    setActivePanel(panelId);
  };
  
  // Uppdatera anslutningsstatus för en panel
  const handleConnectionStatus = (panelId: string, status: boolean) => {
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === panelId ? { ...panel, isConnected: status } : panel
      )
    );
  };
  
  // Öppna anslutningsväljaren för en specifik panel
  const openConnectionPicker = (panelId: string) => {
    setPickingForPanelId(panelId);
    setShowConnectionPicker(true);
  };
  
  // Välj en anslutning för en panel
  const selectConnection = (connection: SSHConnection) => {
    if (pickingForPanelId) {
      setPanels(prevPanels => 
        prevPanels.map(panel => 
          panel.id === pickingForPanelId 
            ? { ...panel, connection: { ...connection, id: connection.id || uuidv4() } } 
            : panel
        )
      );
      setShowConnectionPicker(false);
      setPickingForPanelId(null);
    }
  };
  
  // Koppla från en panel
  const disconnectPanel = (panelId: string) => {
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === panelId ? { ...panel, connection: null, isConnected: false } : panel
      )
    );
  };
  
  // Rendrera paneler baserat på nuvarande layout
  const renderPanels = () => {
    switch (layout) {
      case 'single':
        return (
          <div className="ascii-terminal-single">
            {renderPanel(panels[0])}
          </div>
        );
        
      case 'horizontal':
        return (
          <div className="ascii-terminal-horizontal">
            <div className="ascii-terminal-panel top">
              {renderPanel(panels[0])}
            </div>
            <div className="ascii-terminal-divider horizontal">
              <div className="ascii-terminal-divider-line"></div>
            </div>
            <div className="ascii-terminal-panel bottom">
              {renderPanel(panels[1])}
            </div>
          </div>
        );
        
      case 'vertical':
        return (
          <div className="ascii-terminal-vertical">
            <div className="ascii-terminal-panel left">
              {renderPanel(panels[0])}
            </div>
            <div className="ascii-terminal-divider vertical">
              <div className="ascii-terminal-divider-line"></div>
            </div>
            <div className="ascii-terminal-panel right">
              {renderPanel(panels[1])}
            </div>
          </div>
        );
        
      case 'quad':
        return (
          <div className="ascii-terminal-quad">
            <div className="ascii-terminal-row">
              <div className="ascii-terminal-panel top-left">
                {renderPanel(panels[0])}
              </div>
              <div className="ascii-terminal-divider vertical">
                <div className="ascii-terminal-divider-line"></div>
              </div>
              <div className="ascii-terminal-panel top-right">
                {renderPanel(panels[1])}
              </div>
            </div>
            <div className="ascii-terminal-divider horizontal">
              <div className="ascii-terminal-divider-line"></div>
            </div>
            <div className="ascii-terminal-row">
              <div className="ascii-terminal-panel bottom-left">
                {renderPanel(panels[2])}
              </div>
              <div className="ascii-terminal-divider vertical">
                <div className="ascii-terminal-divider-line"></div>
              </div>
              <div className="ascii-terminal-panel bottom-right">
                {renderPanel(panels[3])}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Rendrera en enskild panel (antingen terminal eller "tom panel")
  const renderPanel = (panel: Panel) => {
    const isActive = activePanel === panel.id;
    
    if (panel.connection) {
      return (
        <div 
          className={`ascii-terminal-container ${isActive ? 'active' : ''}`}
          onClick={() => handlePanelClick(panel.id)}
        >
          <AsciiTerminal
            sshConfig={panel.connection}
            onConnectionStatus={(status) => handleConnectionStatus(panel.id, status)}
            theme={theme}
            isPanelMode={true}
            isActivePanel={isActive}
          />
        </div>
      );
    } else {
      return (
        <div 
          className={`ascii-terminal-empty ${isActive ? 'active' : ''}`}
          onClick={() => handlePanelClick(panel.id)}
        >
          <div className="ascii-terminal-empty-content">
            <div className="ascii-terminal-empty-message">
              [Ingen anslutning]
            </div>
            <button 
              className="ascii-button secondary"
              onClick={() => openConnectionPicker(panel.id)}
            >
              [ VÄLJ ANSLUTNING ]
            </button>
            <button 
              className="ascii-button secondary"
              onClick={onNewConnection}
            >
              [ NY ANSLUTNING ]
            </button>
          </div>
        </div>
      );
    }
  };
  
  // Anslutningsväljare
  const renderConnectionPicker = () => {
    if (!showConnectionPicker) return null;
    
    return (
      <div className="ascii-modal-overlay">
        <div className="ascii-modal">
          <div className="ascii-modal-header">
            <div className="ascii-modal-title">
              VÄLJ ANSLUTNING
            </div>
            <button 
              className="ascii-modal-close"
              onClick={() => setShowConnectionPicker(false)}
            >
              ×
            </button>
          </div>
          <div className="ascii-modal-content">
            <div className="ascii-saved-connections">
              {savedConnections.length > 0 ? (
                savedConnections.map(conn => (
                  <div 
                    key={conn.id}
                    className="ascii-saved-connection-item"
                    onClick={() => selectConnection(conn)}
                  >
                    <div className="ascii-saved-connection-name">
                      {conn.name}
                    </div>
                    <div className="ascii-saved-connection-details">
                      {conn.username}@{conn.host}:{conn.port}
                    </div>
                  </div>
                ))
              ) : (
                <div className="ascii-empty-connections">
                  Inga sparade anslutningar hittades
                </div>
              )}
            </div>
            <div className="ascii-modal-actions">
              <button 
                className="ascii-button secondary"
                onClick={() => setShowConnectionPicker(false)}
              >
                [ AVBRYT ]
              </button>
              <button 
                className="ascii-button primary"
                onClick={onNewConnection}
              >
                [ NY ANSLUTNING ]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`ascii-content panel-mode ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-panel-header">
        <div className="ascii-panel-title">
          MULTI-TERMINAL
        </div>
        <div className="ascii-terminal-toolbar">
          <div className="ascii-terminal-layout-buttons">
            <button 
              className={`ascii-button ${layout === 'single' ? 'primary' : 'secondary'}`}
              onClick={() => changeLayout('single')}
            >
              [ ENKEL ]
            </button>
            <button 
              className={`ascii-button ${layout === 'horizontal' ? 'primary' : 'secondary'}`}
              onClick={() => changeLayout('horizontal')}
            >
              [ HORISONTELL ]
            </button>
            <button 
              className={`ascii-button ${layout === 'vertical' ? 'primary' : 'secondary'}`}
              onClick={() => changeLayout('vertical')}
            >
              [ VERTIKAL ]
            </button>
            <button 
              className={`ascii-button ${layout === 'quad' ? 'primary' : 'secondary'}`}
              onClick={() => changeLayout('quad')}
            >
              [ QUAD ]
            </button>
          </div>
        </div>
      </div>
      
      <div className="ascii-terminal-panels-container">
        {renderPanels()}
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button
          className="ascii-button primary"
          onClick={onBack}
        >
          [ TILLBAKA ]
        </button>
      </div>
      
      {renderConnectionPicker()}
    </div>
  );
};

export default AsciiSplitTerminal; 