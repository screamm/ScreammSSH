import React, { useState, useEffect } from 'react';
import ThemeSelector, { Theme } from './ThemeSelector';
import '../styles/Settings.css';

// Typer för terminalinställningar
interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  enableCRTEffect: boolean;
}

interface SettingsProps {
  onThemeChange?: (theme: Theme) => void;
  initialTheme?: Theme;
}

// Inställningsalternativ
interface SettingsOptions {
  useAutoLogin: boolean;
  keepSessionHistory: boolean;
  maxSessionHistoryItems: number;
  terminalFontSize: number;
  showTerminalGrid: boolean;
  enableSounds: boolean;
  sftpKeepAliveInterval: number;
  connectionTimeout: number;
  useFallbackCiphers: boolean;
}

// Standardinställningar
const defaultSettings: SettingsOptions = {
  useAutoLogin: false,
  keepSessionHistory: true,
  maxSessionHistoryItems: 20,
  terminalFontSize: 14,
  showTerminalGrid: true,
  enableSounds: true,
  sftpKeepAliveInterval: 30,
  connectionTimeout: 10,
  useFallbackCiphers: false
};

const Settings: React.FC<SettingsProps> = ({ onThemeChange, initialTheme }) => {
  const [activeTab, setActiveTab] = useState<string>('appearance');
  const [terminalSettings, setTerminalSettings] = useState<TerminalSettings>({
    fontFamily: 'monospace',
    fontSize: 14,
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 1000,
    enableCRTEffect: true
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isAutoLogin, setIsAutoLogin] = useState<boolean>(false);
  const [savedSettings, setSavedSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<SettingsOptions>(defaultSettings);
  
  // Ladda inställningar när komponenten monteras
  useEffect(() => {
    // Simulera hämtning av inställningar från localStorage eller via API
    const loadSettings = () => {
      try {
        const savedTerminalSettings = localStorage.getItem('terminalSettings');
        if (savedTerminalSettings) {
          setTerminalSettings(JSON.parse(savedTerminalSettings));
        }
        
        const savedSound = localStorage.getItem('soundEnabled');
        if (savedSound !== null) {
          setIsSoundEnabled(savedSound === 'true');
        }
        
        const savedAutoLogin = localStorage.getItem('autoLogin');
        if (savedAutoLogin !== null) {
          setIsAutoLogin(savedAutoLogin === 'true');
        }
      } catch (error) {
        console.error('Kunde inte ladda inställningar:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Spara terminalinställningar
  const saveTerminalSettings = () => {
    try {
      localStorage.setItem('terminalSettings', JSON.stringify(terminalSettings));
      localStorage.setItem('soundEnabled', String(isSoundEnabled));
      localStorage.setItem('autoLogin', String(isAutoLogin));
      
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    } catch (error) {
      console.error('Kunde inte spara inställningar:', error);
    }
  };
  
  // Uppdatera terminalinställningar
  const updateTerminalSetting = <K extends keyof TerminalSettings>(
    key: K, 
    value: TerminalSettings[K]
  ) => {
    setTerminalSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Hantera temabyte
  const handleThemeChange = (theme: Theme) => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
    
    // Spara temat till localStorage
    try {
      localStorage.setItem('activeTheme', JSON.stringify(theme));
    } catch (error) {
      console.error('Kunde inte spara tema:', error);
    }
  };
  
  // Ladda inställningar från localStorage vid uppstart
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('screammSSH_settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Använd sparade inställningar men se till att nya inställningar 
          // från defaultSettings inkluderas
          setSettings(prevSettings => ({
            ...defaultSettings,
            ...parsedSettings
          }));
        }
      } catch (error) {
        console.error('Kunde inte ladda inställningar:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Spara inställningarna när de ändras
  useEffect(() => {
    try {
      localStorage.setItem('screammSSH_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Kunde inte spara inställningar:', error);
    }
  }, [settings]);
  
  // Uppdatera en enskild inställning
  const updateSetting = (key: keyof SettingsOptions, value: any) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
  };
  
  // Återställ till standardinställningar
  const resetSettings = () => {
    if (window.confirm('Är du säker på att du vill återställa alla inställningar?')) {
      setSettings(defaultSettings);
      localStorage.removeItem('screammSSH_settings');
    }
  };
  
  // Informera föräldrakomponenten om ändringar i CRT-effekten
  useEffect(() => {
    // Skicka en anpassad händelse när CRT-effektinställningen ändras
    const event = new CustomEvent('crt-effect-change', { 
      detail: { enabled: terminalSettings.enableCRTEffect } 
    });
    window.dispatchEvent(event);
  }, [terminalSettings.enableCRTEffect]);
  
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      color: '#e0e0e0',
      backgroundColor: '#232323',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }}>
      <h2 style={{ 
        marginTop: 0,
        borderBottom: '1px solid #444',
        paddingBottom: '10px'
      }}>
        Inställningar
      </h2>
      
      {/* Flikar */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #444',
        marginBottom: '20px'
      }}>
        <TabButton 
          isActive={activeTab === 'appearance'} 
          onClick={() => setActiveTab('appearance')}
        >
          Utseende
        </TabButton>
        <TabButton 
          isActive={activeTab === 'terminal'} 
          onClick={() => setActiveTab('terminal')}
        >
          Terminal
        </TabButton>
        <TabButton 
          isActive={activeTab === 'connection'} 
          onClick={() => setActiveTab('connection')}
        >
          Anslutning
        </TabButton>
        <TabButton 
          isActive={activeTab === 'about'} 
          onClick={() => setActiveTab('about')}
        >
          Om
        </TabButton>
      </div>
      
      {/* Utseendeinställningar */}
      {activeTab === 'appearance' && (
        <div>
          <h3 style={{ color: '#0f0', borderBottom: '1px solid #0a0', paddingBottom: '5px' }}>
            Utseendeinställningar
          </h3>
          
          <ThemeSelector 
            onChange={handleThemeChange} 
            activeTheme={initialTheme}
          />
        </div>
      )}
      
      {/* Terminalinställningar */}
      {activeTab === 'terminal' && (
        <div>
          <h3 style={{ color: '#0f0', borderBottom: '1px solid #0a0', paddingBottom: '5px' }}>
            Terminalinställningar
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Typsnitt</label>
            <select
              value={terminalSettings.fontFamily}
              onChange={(e) => updateTerminalSetting('fontFamily', e.target.value)}
              className="retro-input"
              style={{ width: '100%' }}
            >
              <option value="monospace">Monospace</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'VT323', monospace">Terminal (VT323)</option>
              <option value="'Press Start 2P', cursive">Pixel (Press Start 2P)</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Textstorlek</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="10"
                max="24"
                value={terminalSettings.fontSize}
                onChange={(e) => updateTerminalSetting('fontSize', parseInt(e.target.value))}
                style={{ flex: 1, marginRight: '10px' }}
              />
              <span>{terminalSettings.fontSize}px</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Markörtyp</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  checked={terminalSettings.cursorStyle === 'block'}
                  onChange={() => updateTerminalSetting('cursorStyle', 'block')}
                  style={{ marginRight: '5px' }}
                />
                Block
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  checked={terminalSettings.cursorStyle === 'underline'}
                  onChange={() => updateTerminalSetting('cursorStyle', 'underline')}
                  style={{ marginRight: '5px' }}
                />
                Understreck
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  checked={terminalSettings.cursorStyle === 'bar'}
                  onChange={() => updateTerminalSetting('cursorStyle', 'bar')}
                  style={{ marginRight: '5px' }}
                />
                Vertikal linje
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={terminalSettings.cursorBlink}
                onChange={(e) => updateTerminalSetting('cursorBlink', e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Blinkande markör
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Historiklängd (rader)</label>
            <input
              type="number"
              value={terminalSettings.scrollback}
              onChange={(e) => updateTerminalSetting('scrollback', parseInt(e.target.value))}
              className="retro-input"
              style={{ width: '100%' }}
              min="100"
              max="10000"
              step="100"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={terminalSettings.enableCRTEffect}
                onChange={(e) => updateTerminalSetting('enableCRTEffect', e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Aktivera CRT-effekt (gamla skärmens utseende)
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={isSoundEnabled}
                onChange={(e) => setIsSoundEnabled(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Aktivera terminaljud
            </label>
          </div>
          
          <button 
            onClick={saveTerminalSettings}
            className="retro-button"
            style={{ 
              backgroundColor: '#030',
              color: '#0f0',
              borderColor: '#0a0'
            }}
          >
            Spara Inställningar
          </button>
          
          {savedSettings && (
            <div style={{ 
              color: '#0f0', 
              marginTop: '10px',
              padding: '5px',
              backgroundColor: '#030',
              borderRadius: '3px'
            }}>
              Inställningar sparade!
            </div>
          )}
        </div>
      )}
      
      {/* Anslutningsinställningar */}
      {activeTab === 'connection' && (
        <div>
          <h3 style={{ color: '#0f0', borderBottom: '1px solid #0a0', paddingBottom: '5px' }}>
            Anslutningsinställningar
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={isAutoLogin}
                onChange={(e) => setIsAutoLogin(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Kom ihåg lösenord och automatisk inloggning
            </label>
          </div>
          
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#111', 
            border: '1px solid #333',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h4 style={{ color: '#0f0', marginTop: 0 }}>SSH-konfiguration</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Standardport</label>
              <input
                type="number"
                defaultValue={22}
                className="retro-input"
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>SSH-nyckelplats</label>
              <div style={{ display: 'flex' }}>
                <input
                  type="text"
                  defaultValue="~/.ssh/id_rsa"
                  className="retro-input"
                  style={{ flex: 1, marginRight: '5px' }}
                />
                <button className="retro-button">Bläddra</button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={saveTerminalSettings}
            className="retro-button"
            style={{ 
              backgroundColor: '#030',
              color: '#0f0',
              borderColor: '#0a0'
            }}
          >
            Spara Inställningar
          </button>
        </div>
      )}
      
      {/* Om-sidan */}
      {activeTab === 'about' && (
        <div>
          <h3 style={{ color: '#0f0', borderBottom: '1px solid #0a0', paddingBottom: '5px' }}>
            Om ScreammSSH
          </h3>
          
          <div style={{ marginBottom: '15px', lineHeight: 1.5 }}>
            <p>ScreammSSH v1.0.0</p>
            <p>En retro-inspirerad SSH-klient byggd med ElectronJS och React.</p>
            <p>© 2023 ScreammSSH Team - Alla rättigheter förbehållna</p>
          </div>
          
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#111', 
            border: '1px solid #333',
            borderRadius: '4px'
          }}>
            <h4 style={{ color: '#0f0', marginTop: 0 }}>Systeminformation</h4>
            <div>Electron: {window.electronAPI?.versions?.electron || 'N/A'}</div>
            <div>Chrome: {window.electronAPI?.versions?.chrome || 'N/A'}</div>
            <div>Node: {window.electronAPI?.versions?.node || 'N/A'}</div>
            <div>Operativsystem: {window.navigator.platform}</div>
          </div>
          
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#111', 
            border: '1px solid #333',
            borderRadius: '4px'
          }}>
            <h4 style={{ color: '#0f0', marginTop: 0 }}>Licens</h4>
            <p style={{ margin: '5px 0' }}>
              Detta program är licensierat under MIT-licensen.
            </p>
            <p style={{ margin: '5px 0' }}>
              Det är fri och öppen källkodsprogramvara som du kan modifiera och distribuera.
            </p>
          </div>
          
          <button 
            className="retro-button"
            style={{ 
              backgroundColor: '#030',
              color: '#0f0',
              borderColor: '#0a0'
            }}
            onClick={() => window.open('https://github.com/ScreammSSH', '_blank')}
          >
            GitHub Repository
          </button>
        </div>
      )}
      
      {/* Knappar längst ner */}
      <div style={{ 
        marginTop: '30px',
        borderTop: '1px solid #444',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button 
          onClick={resetSettings}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Återställ till standard
        </button>
      </div>
      
      {/* Lägg till lite stil för inställningsobjekten */}
      <style>
        {`
          .settings-group {
            margin-bottom: 25px;
          }
          
          .settings-group h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            color: #ddd;
          }
          
          input[type="checkbox"] {
            margin-right: 10px;
          }
          
          input[type="number"] {
            background-color: #333;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 5px 10px;
            color: #ddd;
            width: 70px;
            margin-left: 10px;
          }
          
          input[type="range"] {
            background-color: #333;
          }
        `}
      </style>
    </div>
  );
};

// Flikknapp-komponent
const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 15px',
      background: isActive ? '#444' : 'transparent',
      color: isActive ? '#fff' : '#aaa',
      border: 'none',
      cursor: 'pointer',
      borderBottom: isActive ? '2px solid #2c7cb0' : 'none',
      marginRight: '5px',
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
      transition: 'all 0.2s ease'
    }}
  >
    {children}
  </button>
);

// Inställningsrad-komponent
const SettingItem: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div style={{
    padding: '10px 0',
    borderBottom: '1px dashed #444'
  }}>
    {children}
  </div>
);

export default Settings; 