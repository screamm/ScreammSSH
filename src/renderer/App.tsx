import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Theme } from './components/ThemeSelector';
import AsciiWelcome from './components/AsciiWelcome';
import AsciiConnectionForm from './components/AsciiConnectionForm';
import AsciiTerminal from './components/AsciiTerminal';
import AsciiSettings, { CustomThemeColors } from './components/AsciiSettings';
import Settings from './components/Settings';
import './styles/main.css';
import './styles/ascii-ui.css';
import AsciiSplitTerminal from './components/AsciiSplitTerminal';
import RoleSelector, { UserRole } from './components/RoleSelector';
import DevOpsPanel from './components/role/DevOpsPanel';
import BackendPanel from './components/role/BackendPanel';
import { preloadFonts, checkFontsLoaded } from './utils/fontLoader';

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

// Applikationens tillstånd
type AppState = 'welcome' | 'connection-form' | 'terminal' | 'settings' | 'split-terminal' | 'role-selector' | 'devops-dashboard' | 'backend-dashboard';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('classic-green');  // Defaulttema ändrat till classic-green för att matcha bilden
  const [language, setLanguage] = useState<string>('sv');
  const [retroEffects, setRetroEffects] = useState<boolean>(true);
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentConnection, setCurrentConnection] = useState<SSHConnection | null>(null);
  const [previousState, setPreviousState] = useState<AppState>('welcome');
  const [customThemes, setCustomThemes] = useState<{[key: string]: CustomThemeColors}>({});
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // Ladda tema, språk, användarroll och säkerställ att fonter är laddade
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Förladda fonter för att säkerställa att de visas korrekt
        preloadFonts();
        await checkFontsLoaded();
        
        // Ladda tema
        const savedTheme = await window.electronAPI.getTheme();
        if (savedTheme) {
          setTheme(savedTheme as Theme);
          document.body.setAttribute('data-theme', savedTheme);
        } else {
          // Använd classic-green som default
          document.body.setAttribute('data-theme', 'classic-green');
        }
        
        // Ladda språk
        const savedLanguage = await window.electronAPI.getLanguage();
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
        
        // Ladda terminalinställningar
        const settings = await window.electronAPI.getTerminalSettings();
        if (settings) {
          setRetroEffects(settings.retroEffect);
        }
        
        // Ladda sparade anpassade teman
        const savedCustomThemes = localStorage.getItem('customThemes');
        if (savedCustomThemes) {
          try {
            const parsedThemes = JSON.parse(savedCustomThemes);
            const themesMap: {[key: string]: CustomThemeColors} = {};
            
            parsedThemes.forEach((theme: {name: string, colors: CustomThemeColors}) => {
              themesMap[theme.name] = theme.colors;
            });
            
            setCustomThemes(themesMap);
          } catch (error) {
            console.error('Kunde inte tolka sparade teman:', error);
          }
        }
        
        // Ladda användarroll
        const savedRole = localStorage.getItem('userRole');
        if (savedRole && (savedRole === 'backend' || savedRole === 'devops' || savedRole === 'sysadmin' || savedRole === 'frontend' || savedRole === 'custom')) {
          setUserRole(savedRole as UserRole);
        } else {
          // Om ingen roll är satt, visa rollväljaren
          setAppState('role-selector');
        }
      } catch (error) {
        console.error('Kunde inte ladda inställningar:', error);
      }
    };
    
    loadSettings();
    
    // Lägg till ASCII-stilen på body-elementet
    document.body.classList.add('ascii-ui');
    
    // Rensa upp när komponenten avmonteras
    return () => {
      document.body.classList.remove('ascii-ui');
    };
  }, []);

  // Hantera rollval
  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setAppState('welcome');
  };

  // Hantera när en anslutningsförfrågan görs
  const handleConnect = (config: SSHConnection) => {
    setCurrentConnection(config);
    
    // Spara tidigare tillstånd
    setPreviousState('connection-form');
    
    // Skapa en ny flik för anslutningen
    const tabId = config.id || uuidv4();
    const connectionWithId = {
      ...config,
      id: tabId
    };
    
    const newTab: Tab = {
      id: tabId,
      connection: connectionWithId,
      isConnected: false,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTab(tabId);
    
    // Välj rätt terminalvy baserat på användarroll
    if (userRole === 'devops' || userRole === 'sysadmin') {
      // DevOps och Sysadmin-roller föredrar split-terminal för serverhantering
      setAppState('split-terminal');
    } else {
      // Backend och Frontend-roller föredrar enkel terminal
      setAppState('terminal');
    }
  };

  // Uppdatera anslutningsstatus för en flik
  const handleConnectionStatus = (id: string, status: boolean) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === id ? { ...tab, isConnected: status } : tab
      )
    );
  };

  // Hantera temabyte
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    
    // Spara temat i lagringen
    window.electronAPI.saveTheme(newTheme);
  };
  
  // Hantera språkbyte
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Spara språket i lagringen
    window.electronAPI.saveLanguage(newLanguage);
  };
  
  // Hantera ändring av terminalinställningar
  const handleTerminalSettingsChange = (settings: { retroEffect: boolean, cursorBlink: boolean }) => {
    setRetroEffects(settings.retroEffect);
    
    // Spara terminalinställningarna i lagringen
    window.electronAPI.saveTerminalSettings({
      retroEffect: settings.retroEffect,
      cursorBlink: settings.cursorBlink,
      fontSize: 14
    });
  };
  
  // Hantera skapande av anpassat tema
  const handleCustomThemeCreate = (themeName: string, themeColors: CustomThemeColors) => {
    // Spara temat i appens tillstånd
    setCustomThemes(prev => ({
      ...prev,
      [themeName]: themeColors
    }));
    
    // Skapa CSS-variabler för det anpassade temat
    const themeStyle = document.createElement('style');
    themeStyle.textContent = `
      [data-theme="${themeName}"] {
        --ascii-bg: ${themeColors.bgColor};
        --ascii-text: ${themeColors.textColor};
        --ascii-dim: ${themeColors.dimColor};
        --ascii-bright: ${themeColors.brightColor};
        --ascii-accent: ${themeColors.accentColor};
        
        /* Grundläggande variabler som ärver från ASCII-variablerna */
        --primary-bg-color: ${themeColors.bgColor};
        --secondary-bg-color: ${adjustColor(themeColors.bgColor, 20)};
        --accent-color: ${themeColors.accentColor};
        --text-color: ${themeColors.textColor};
        --border-color: ${themeColors.dimColor};
        --hover-color: ${adjustColor(themeColors.bgColor, 30)};
        --error-color: #ff5555;
        --success-color: #55ff55;
        --warning-color: #ffff55;
        --terminal-bg: ${adjustColor(themeColors.bgColor, -10)};
        --terminal-text: ${themeColors.textColor};
      }
    `;
    
    document.head.appendChild(themeStyle);
    
    // Sätt det nya temat som aktivt
    setTheme(themeName as Theme);
    document.body.setAttribute('data-theme', themeName);
    
    // Spara temat i lagringen
    window.electronAPI.saveTheme(themeName);
  };
  
  // Hjälpfunktion för att justera en färg ljusare eller mörkare
  const adjustColor = (color: string, amount: number): string => {
    let usePound = false;
    
    if (color[0] === "#") {
      color = color.slice(1);
      usePound = true;
    }
    
    const num = parseInt(color, 16);
    
    let r = (num >> 16) + amount;
    r = Math.min(255, Math.max(0, r));
    
    let g = ((num >> 8) & 0x00FF) + amount;
    g = Math.min(255, Math.max(0, g));
    
    let b = (num & 0x0000FF) + amount;
    b = Math.min(255, Math.max(0, b));
    
    return (usePound ? "#" : "") + (g | (r << 8) | (b << 16)).toString(16).padStart(6, '0');
  };
  
  // Hantera navigering tillbaka
  const handleBack = () => {
    if (appState === 'terminal' || appState === 'split-terminal') {
      setAppState('connection-form');
    } else if (appState === 'connection-form') {
      setAppState('welcome');
    } else if (appState === 'settings') {
      setAppState(previousState);
    } else if (appState === 'role-selector') {
      setAppState('welcome');
    }
  };
  
  // Öppna inställningssidan
  const openSettings = () => {
    setPreviousState(appState);
    setAppState('settings');
  };
  
  // Öppna rollväljaren
  const openRoleSelector = () => {
    setPreviousState(appState);
    setAppState('role-selector');
  };

  // Öppna split-view terminalen
  const openSplitTerminal = () => {
    if (currentConnection) {
      setAppState('split-terminal');
    } else if (tabs.length > 0 && activeTab) {
      // Om vi har en aktiv flik men ingen currentConnection, använd den istället
      const activeConnection = tabs.find(tab => tab.id === activeTab)?.connection;
      if (activeConnection) {
        setCurrentConnection(activeConnection);
        setAppState('split-terminal');
      }
    } else {
      // Om vi inte har någon anslutning alls, gå till anslutningsformuläret
      setAppState('connection-form');
    }
  };

  // När en DevOps-användare klickar på "Containers" i menyn
  const openDevOpsDashboard = () => {
    setPreviousState(appState);
    setAppState('devops-dashboard');
  };

  // När en Backend-utvecklare klickar på "Databaser" i menyn
  const openBackendDashboard = () => {
    setPreviousState(appState);
    setAppState('backend-dashboard');
  };

  // Hitta en server baserat på ID och anslut till den
  const connectToServer = (serverId: string) => {
    // Här skulle vi normalt hämta server-informationen baserat på ID
    // För demo-syften skapar vi bara en dummy-anslutning
    const serverConfig: SSHConnection = {
      id: uuidv4(),
      name: `Server ${serverId}`,
      host: '192.168.1.10' + serverId,
      port: 22,
      username: 'admin'
    };
    
    handleConnect(serverConfig);
  };

  // Visa en rollspecifik menyknapp baserat på användarroll
  const renderRoleSpecificMenu = () => {
    if (!userRole) return null;
    
    switch (userRole) {
      case 'backend':
        return (
          <span 
            className="ascii-menu-item"
            onClick={openBackendDashboard}
          >
            [ Databaser ]
          </span>
        );
      case 'devops':
        return (
          <span 
            className="ascii-menu-item"
            onClick={openDevOpsDashboard}
          >
            [ Containers ]
          </span>
        );
      case 'sysadmin':
        return (
          <span 
            className="ascii-menu-item"
            onClick={() => alert('Övervakningsverktyg kommer i nästa version')}
          >
            [ Övervakning ]
          </span>
        );
      case 'frontend':
        return (
          <span 
            className="ascii-menu-item"
            onClick={() => alert('Filsynkroniseringsverktyg kommer i nästa version')}
          >
            [ Filsynk ]
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="app" className="ascii-ui">
      {/* ASCII-meny (alltid synlig förutom på rollväljarskärmen) */}
      {appState !== 'role-selector' && (
        <div className="ascii-menu">
          <div className="ascii-menu-left">
            <span 
              className={`ascii-menu-item ${appState === 'welcome' ? 'active' : ''}`}
              onClick={() => setAppState('welcome')}
            >
              [ Hem ]
            </span>
            <span 
              className={`ascii-menu-item ${appState === 'connection-form' ? 'active' : ''}`}
              onClick={() => setAppState('connection-form')}
            >
              [ Anslutningar ]
            </span>
            <span 
              className={`ascii-menu-item ${appState === 'split-terminal' ? 'active' : ''}`}
              onClick={openSplitTerminal}
            >
              [ Delad Terminal ]
            </span>
            {renderRoleSpecificMenu()}
          </div>
          
          <div className="ascii-menu-right">
            <span 
              className="ascii-menu-item"
              onClick={openRoleSelector}
            >
              [ Byt Roll ]
            </span>
            <span 
              className={`ascii-menu-item ${appState === 'settings' ? 'active' : ''}`}
              onClick={openSettings}
            >
              [ Inställningar ]
            </span>
          </div>
        </div>
      )}
      
      {/* Visa rätt vy baserat på applikationens tillstånd */}
      {appState === 'welcome' && (
        <AsciiWelcome 
          onConnect={() => setAppState('connection-form')} 
          currentTheme={theme}
        />
      )}
      
      {appState === 'connection-form' && (
        <AsciiConnectionForm 
          onConnect={handleConnect} 
          onBack={handleBack}
          retroEffect={retroEffects}
        />
      )}
      
      {appState === 'terminal' && currentConnection && (
        <AsciiTerminal
          sshConfig={currentConnection}
          onConnectionStatus={(status) => handleConnectionStatus(currentConnection.id, status)}
          onBack={handleBack}
          theme={theme}
        />
      )}
      
      {appState === 'settings' && (
        <AsciiSettings
          onThemeChange={handleThemeChange}
          onCustomThemeCreate={handleCustomThemeCreate}
          onLanguageChange={handleLanguageChange}
          onRetroEffectChange={(enabled) => handleTerminalSettingsChange({ retroEffect: enabled, cursorBlink: true })}
          currentTheme={theme}
          currentLanguage={language}
          onBack={handleBack}
        />
      )}
      
      {appState === 'split-terminal' && currentConnection && (
        <AsciiSplitTerminal
          initialConnections={[currentConnection]}
          onBack={handleBack}
          theme={theme}
          retroEffect={retroEffects}
          onNewConnection={() => setAppState('connection-form')}
        />
      )}
      
      {appState === 'role-selector' && (
        <RoleSelector
          onRoleSelect={handleRoleSelect}
          currentTheme={theme}
          retroEffect={retroEffects}
          onBack={userRole ? handleBack : undefined}
        />
      )}
      
      {/* Rollspecifika vyer */}
      {appState === 'devops-dashboard' && (
        <DevOpsPanel
          theme={theme}
          retroEffect={retroEffects}
          onOpenTerminal={connectToServer}
        />
      )}
      
      {appState === 'backend-dashboard' && (
        <BackendPanel
          theme={theme}
          retroEffect={retroEffects}
          onOpenTerminal={connectToServer}
        />
      )}
    </div>
  );
};

export default App;