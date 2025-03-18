import React, { useState, useEffect } from 'react';
import SimpleTerminal from './SimpleTerminal';
import SSHTest from './SSHTest';
import { Theme } from '../types/index.d';
import AsciiSettings from './AsciiSettings';

interface AsciiInterfaceProps {
  onThemeChange?: (theme: Theme) => void;
  activeTheme?: Theme | null;
}

const AsciiInterface: React.FC<AsciiInterfaceProps> = ({ 
  onThemeChange,
  activeTheme
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('HEM');
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSSHTest, setShowSSHTest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [enableCRTEffect, setEnableCRTEffect] = useState<boolean>(true);
  
  // Sektioner i menyraden
  const sections = [
    { id: 'HEM', name: 'HEM' },
    { id: 'ANSLUTNINGAR', name: 'ANSLUTNINGAR' },
    { id: 'DELAD_TERMINAL', name: 'DELAD TERMINAL' },
    { id: 'DATABASER', name: 'DATABASER' }
  ];
  
  // ASCII-logotyp för ScreammSSH
  const asciiLogo = `
    ███████╗ ██████╗██████╗ ███████╗ █████╗ ███╗   ███╗███╗   ███╗███████╗███████╗██╗  ██╗
    ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗████╗ ████║████╗ ████║██╔════╝██╔════╝██║  ██║
    ███████╗██║     ██████╔╝█████╗  ███████║██╔████╔██║██╔████╔██║███████╗███████╗███████║
    ╚════██║██║     ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║╚════██║╚════██║██╔══██║
    ███████║╚██████╗██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████║███████║██║  ██║
    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
  `;
  
  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    
    // Återställ tillstånd vid byte av sektion
    setShowTerminal(false);
    setShowSettings(false);
    setShowSSHTest(false);
    
    // Visa SSH-test när man går till anslutningar
    if (sectionId === 'ANSLUTNINGAR') {
      setShowSSHTest(true);
    } else if (sectionId === 'HEM') {
      setShowTerminal(true);
    }
  };
  
  // Simulera laddningstid för att visa CRT-effekten
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Hämta CRT-effektinställning från localStorage
  useEffect(() => {
    try {
      const savedTerminalSettings = localStorage.getItem('terminalSettings');
      if (savedTerminalSettings) {
        const settings = JSON.parse(savedTerminalSettings);
        if (settings.enableCRTEffect !== undefined) {
          setEnableCRTEffect(settings.enableCRTEffect);
        }
      }
    } catch (error) {
      console.error('Kunde inte ladda CRT-effektinställning:', error);
    }
    
    // Lyssna på ändringar i CRT-effekten
    const handleCRTEffectChange = (event: CustomEvent) => {
      const { enabled } = event.detail;
      setEnableCRTEffect(enabled);
    };
    
    window.addEventListener('crt-effect-change', handleCRTEffectChange as EventListener);
    
    return () => {
      window.removeEventListener('crt-effect-change', handleCRTEffectChange as EventListener);
    };
  }, []);
  
  // Miljöinformation från window.electronAPI
  const environmentInfo = {
    node: window.electronAPI?.versions?.node || 'N/A',
    chrome: window.electronAPI?.versions?.chrome || 'N/A',
    electron: window.electronAPI?.versions?.electron || 'N/A',
    screenSize: `${window.innerWidth}x${window.innerHeight}`
  };
  
  // Snabbknapp för att slå av/på CRT-effekten
  const toggleCRTEffect = () => {
    const newValue = !enableCRTEffect;
    setEnableCRTEffect(newValue);
    
    // Uppdatera i localStorage
    try {
      const savedTerminalSettings = localStorage.getItem('terminalSettings');
      if (savedTerminalSettings) {
        const settings = JSON.parse(savedTerminalSettings);
        settings.enableCRTEffect = newValue;
        localStorage.setItem('terminalSettings', JSON.stringify(settings));
      } else {
        localStorage.setItem('terminalSettings', JSON.stringify({ enableCRTEffect: newValue }));
      }
    } catch (error) {
      console.error('Kunde inte spara CRT-effektinställning:', error);
    }
    
    // Skicka en händelse för att meddela andra komponenter
    const event = new CustomEvent('crt-effect-change', { detail: { enabled: newValue } });
    window.dispatchEvent(event);
  };
  
  const menuItemStyle = (isActive: boolean) => ({
    background: 'transparent',
    color: isActive ? 'var(--theme-text-color)' : 'var(--theme-accent-color)',
    border: 'none',
    margin: '0 8px',
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: 'var(--theme-font-family)',
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: isActive && enableCRTEffect ? '0 0 5px var(--theme-text-color)' : 'none'
  });
  
  if (isLoading) {
    return (
      <div className={enableCRTEffect ? "crt-effect" : ""} style={{ 
        backgroundColor: 'var(--theme-bg-color)',
        color: 'var(--theme-text-color)', 
        fontFamily: 'var(--theme-font-family)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="retro-loader">
          <span></span>
        </div>
        <div style={{ marginTop: '20px' }}>
          Laddar ScreammSSH Terminal...
        </div>
      </div>
    );
  }
  
  return (
    <div className={enableCRTEffect ? "crt-effect" : ""} style={{ 
      backgroundColor: 'var(--theme-bg-color)',
      color: 'var(--theme-text-color)', 
      fontFamily: 'var(--theme-font-family)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Förhindra scrollning på övergripande nivå
    }}>
      {enableCRTEffect && <div className="crt-distortion"></div>}
      
      {/* Huvudmeny-navbaren */}
      <div className="menu-bar" style={{
        display: 'flex',
        borderBottom: '1px solid var(--theme-accent-color)',
        padding: '4px 0',
        backgroundColor: 'var(--theme-bg-color)'
      }}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => handleSectionChange(section.id)}
            className={selectedSection === section.id ? "menu-item active" : "menu-item"}
            style={menuItemStyle(selectedSection === section.id)}
          >
            [ {section.name} ]
          </button>
        ))}
        
        <div style={{ flexGrow: 1 }}></div>
        
        <button
          onClick={toggleCRTEffect}
          className="menu-item"
          style={menuItemStyle(enableCRTEffect)}
        >
          [ CRT: {enableCRTEffect ? 'PÅ' : 'AV'} ]
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={showSettings ? "menu-item active" : "menu-item"}
          style={menuItemStyle(showSettings)}
        >
          [ INSTÄLLNINGAR ]
        </button>
      </div>
      
      {/* ASCII-logotyp */}
      <div className={`ascii-art ${enableCRTEffect ? 'glow-text' : ''}`} style={{ 
        textAlign: 'center', 
        margin: '20px 0', 
        lineHeight: 1.2,
        color: 'var(--theme-text-color)',
        textShadow: enableCRTEffect ? '0 0 5px var(--theme-text-color)' : 'none'
      }}>
        <pre style={{ margin: 0, fontSize: showTerminal ? '12px' : '16px' }}>
          {asciiLogo}
        </pre>
      </div>
      
      {/* Välkomstmeddelande */}
      {!showTerminal && !showSSHTest && !showSettings && (
        <div style={{ 
          textAlign: 'center', 
          margin: '10px 0', 
          color: 'var(--theme-text-color)',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}>
          <p>Välkommen till ScreammSSH Terminal</p>
          <div className="retro-tooltip" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            display: 'inline-block', 
            padding: '10px 20px', 
            margin: '20px 0',
            borderRadius: '4px',
            border: '1px solid var(--theme-accent-color)'
          }}>
            <p>Välj <strong>ANSLUTNINGAR</strong> i menyn för att testa SSH-anslutningar</p>
          </div>
          
          {/* Miljöinfo */}
          <div style={{ marginTop: '30px', fontSize: '12px', color: 'var(--theme-accent-color)' }}>
            <p>System Information:</p>
            <div style={{ 
              display: 'inline-block', 
              textAlign: 'left', 
              backgroundColor: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              <p>Node: {environmentInfo.node}</p>
              <p>Chrome: {environmentInfo.chrome}</p>
              <p>Electron: {environmentInfo.electron}</p>
              <p>Skärmstorlek: {environmentInfo.screenSize}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Terminal-container */}
      {showTerminal && (
        <div className="terminal-panel" style={{ flex: 1, padding: '0 20px 20px 20px', overflow: 'hidden' }}>
          <SimpleTerminal />
        </div>
      )}
      
      {/* SSH-test */}
      {showSSHTest && (
        <div className="ssh-test-panel" style={{ 
          flex: 1, 
          padding: '0 20px 20px 20px', 
          overflow: 'auto', // Viktigt: Använd auto för korrekt scrollning
          display: 'flex',
          flexDirection: 'column'
        }}>
          <SSHTest />
        </div>
      )}
      
      {/* Inställningar */}
      {showSettings && (
        <div className="settings-panel" style={{ 
          flex: 1, 
          padding: '0 20px 20px 20px', 
          overflow: 'auto' // Viktigt: Använd auto för korrekt scrollning
        }}>
          <AsciiSettings 
            onThemeChange={onThemeChange} 
            activeTheme={activeTheme} 
            enableCRTEffect={enableCRTEffect}
            onCRTToggle={toggleCRTEffect}
          />
        </div>
      )}
      
      {/* Footer */}
      <div style={{ 
        borderTop: '1px solid var(--theme-accent-color)', 
        padding: '8px', 
        fontSize: '12px', 
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <span>ScreammSSH Terminal v1.0 | Copyright © 2023 | </span>
        <button
          onClick={() => window.open('https://github.com/yourusername/ScreammSSH', '_blank')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--theme-accent-color)',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '0',
            margin: '0',
            fontSize: '12px'
          }}
        >
          GitHub
        </button>
      </div>
    </div>
  );
};

export default AsciiInterface; 