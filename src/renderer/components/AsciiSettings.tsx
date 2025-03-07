import React, { useState, useEffect } from 'react';
import { Theme } from './ThemeSelector';
import '../styles/ascii-ui.css';

interface AsciiSettingsProps {
  onThemeChange: (theme: Theme) => void;
  onCustomThemeCreate: (themeName: string, themeColors: CustomThemeColors) => void;
  onLanguageChange: (language: string) => void;
  onRetroEffectChange: (enabled: boolean) => void;
  currentTheme: Theme;
  currentLanguage: string;
  onBack?: () => void;
}

export interface CustomThemeColors {
  bgColor: string;
  textColor: string;
  dimColor: string;
  brightColor: string;
  accentColor: string;
}

const AsciiSettings: React.FC<AsciiSettingsProps> = ({
  onThemeChange,
  onCustomThemeCreate,
  onLanguageChange,
  onRetroEffectChange,
  currentTheme,
  currentLanguage,
  onBack
}) => {
  // Tillgängliga standardteman
  const standardThemes: { id: Theme; name: string }[] = [
    { id: 'default', name: 'Standard (Mörk)' },
    { id: 'nostromo', name: 'Nostromo (Röd)' },
    { id: 'classic-green', name: 'Klassisk Terminal (Grön)' },
    { id: 'htop', name: 'Htop (Lila)' },
    { id: 'cyan-ssh', name: 'Cyan SSH' }
  ];
  
  // Tillgängliga språk
  const languages = [
    { code: 'sv', name: 'Svenska' },
    { code: 'en', name: 'English' },
    { code: 'fi', name: 'Suomi' },
    { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' }
  ];
  
  // Tillstånd för anpassat tema
  const [customThemeName, setCustomThemeName] = useState('');
  const [customTheme, setCustomTheme] = useState<CustomThemeColors>({
    bgColor: '#001100',
    textColor: '#00ff00',
    dimColor: '#007700',
    brightColor: '#33ff33',
    accentColor: '#00ff99'
  });
  const [retroEffect, setRetroEffect] = useState(true);
  const [savedCustomThemes, setSavedCustomThemes] = useState<{name: string, colors: CustomThemeColors}[]>([]);
  const [activeTab, setActiveTab] = useState<'themes' | 'custom' | 'appearance'>('themes');
  
  // Ladda inställningar och sparade anpassade teman
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Ladda terminalinställningar för att få retroEffect
        const settings = await window.electronAPI.getTerminalSettings();
        if (settings) {
          setRetroEffect(settings.retroEffect);
        }
        
        // Ladda sparade anpassade teman
        const savedThemes = localStorage.getItem('customThemes');
        if (savedThemes) {
          setSavedCustomThemes(JSON.parse(savedThemes));
        }
      } catch (error) {
        console.error('Kunde inte ladda inställningar:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleThemeChange = (themeId: Theme) => {
    onThemeChange(themeId);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(e.target.value);
  };
  
  const handleRetroEffectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setRetroEffect(isEnabled);
    onRetroEffectChange(isEnabled);
  };
  
  const handleCustomThemeChange = (field: keyof CustomThemeColors, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveCustomTheme = () => {
    if (!customThemeName.trim()) {
      alert('Vänligen ange ett namn för det anpassade temat');
      return;
    }
    
    // Spara det anpassade temat
    const newTheme = {
      name: customThemeName,
      colors: customTheme
    };
    
    // Uppdatera listan med anpassade teman
    const updatedThemes = [...savedCustomThemes, newTheme];
    setSavedCustomThemes(updatedThemes);
    
    // Spara till localStorage
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // Anropa callback för att skapa temat
    onCustomThemeCreate(customThemeName, customTheme);
    
    // Återställ formuläret
    setCustomThemeName('');
  };
  
  const applyCustomTheme = (themeData: {name: string, colors: CustomThemeColors}) => {
    onCustomThemeCreate(themeData.name, themeData.colors);
  };
  
  const deleteCustomTheme = (index: number) => {
    const updatedThemes = [...savedCustomThemes];
    updatedThemes.splice(index, 1);
    setSavedCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
  };
  
  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-banner">
{`
    .-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
    |I|N|S|T|Ä|L|L|N|I|N|G|A|R| |&| |T|E|M|A|H|A|N|T|E|R|A|R|E|
    '-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'-'
`}
      </div>
      
      <div className="ascii-tabs">
        <div 
          className={`ascii-tab ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          [ STANDARDTEMAN ]
        </div>
        <div 
          className={`ascii-tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          [ ANPASSADE TEMAN ]
        </div>
        <div 
          className={`ascii-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          [ UTSEENDE ]
        </div>
      </div>
      
      {/* Standardteman */}
      {activeTab === 'themes' && (
        <div className="ascii-box double">
          <div className="ascii-box-title">VÄLJ TEMA</div>
          
          <div className="ascii-theme-grid">
            {standardThemes.map(theme => (
              <div 
                key={theme.id}
                className={`ascii-theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div 
                  className={`ascii-theme-preview theme-${theme.id}`}
                  style={{ 
                    height: '100px',
                    padding: '10px',
                    border: currentTheme === theme.id ? '3px double var(--ascii-accent)' : '1px solid var(--ascii-dim)'
                  }}
                >
                  <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>$ echo "Hello"</div>
                  <div>Hello</div>
                  <div style={{ marginTop: '5px' }}>$ _</div>
                </div>
                <div className="ascii-theme-name">{theme.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Anpassade teman */}
      {activeTab === 'custom' && (
        <div className="ascii-box double">
          <div className="ascii-box-title">ANPASSADE TEMAN</div>
          
          <div style={{ marginBottom: '20px' }}>
            {/* Formulär för att skapa anpassat tema */}
            <div className="ascii-box single">
              <div className="ascii-box-title">SKAPA NYTT TEMA</div>
              
              <label className="ascii-label">Temanamn</label>
              <input
                type="text"
                className="ascii-input"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="t.ex. Mitt anpassade tema"
              />
              
              <div className="ascii-columns" style={{ marginTop: '15px' }}>
                <div className="ascii-column">
                  <label className="ascii-label">Bakgrundsfärg</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.bgColor}
                      onChange={(e) => handleCustomThemeChange('bgColor', e.target.value)}
                      style={{ marginRight: '10px', width: '50px', height: '30px' }}
                    />
                    <input
                      type="text"
                      className="ascii-input"
                      value={customTheme.bgColor}
                      onChange={(e) => handleCustomThemeChange('bgColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  
                  <label className="ascii-label">Textfärg</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.textColor}
                      onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                      style={{ marginRight: '10px', width: '50px', height: '30px' }}
                    />
                    <input
                      type="text"
                      className="ascii-input"
                      value={customTheme.textColor}
                      onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                
                <div className="ascii-column">
                  <label className="ascii-label">Nedtonad färg</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.dimColor}
                      onChange={(e) => handleCustomThemeChange('dimColor', e.target.value)}
                      style={{ marginRight: '10px', width: '50px', height: '30px' }}
                    />
                    <input
                      type="text"
                      className="ascii-input"
                      value={customTheme.dimColor}
                      onChange={(e) => handleCustomThemeChange('dimColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  
                  <label className="ascii-label">Ljus färg</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.brightColor}
                      onChange={(e) => handleCustomThemeChange('brightColor', e.target.value)}
                      style={{ marginRight: '10px', width: '50px', height: '30px' }}
                    />
                    <input
                      type="text"
                      className="ascii-input"
                      value={customTheme.brightColor}
                      onChange={(e) => handleCustomThemeChange('brightColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                
                <div className="ascii-column">
                  <label className="ascii-label">Accentfärg</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.accentColor}
                      onChange={(e) => handleCustomThemeChange('accentColor', e.target.value)}
                      style={{ marginRight: '10px', width: '50px', height: '30px' }}
                    />
                    <input
                      type="text"
                      className="ascii-input"
                      value={customTheme.accentColor}
                      onChange={(e) => handleCustomThemeChange('accentColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  
                  <div style={{ marginTop: '30px', textAlign: 'right' }}>
                    <button 
                      className="ascii-button primary"
                      onClick={handleSaveCustomTheme}
                    >
                      [ SPARA TEMA ]
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Förhandsgranskning */}
              <div className="ascii-box single" style={{ 
                marginTop: '20px', 
                backgroundColor: customTheme.bgColor,
                borderColor: customTheme.dimColor 
              }}>
                <div style={{ color: customTheme.brightColor, fontWeight: 'bold', marginBottom: '5px' }}>
                  Förhandsgranskning
                </div>
                <div style={{ color: customTheme.textColor }}>
                  Detta är hur ditt anpassade tema kommer att se ut.
                </div>
                <div style={{ color: customTheme.dimColor, marginTop: '5px' }}>
                  Nedtonad text ser ut så här.
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ color: customTheme.brightColor }}>$ echo </span>
                  <span style={{ color: customTheme.accentColor }}>"Hello World"</span>
                </div>
              </div>
            </div>
            
            {/* Lista med sparade anpassade teman */}
            {savedCustomThemes.length > 0 && (
              <div className="ascii-box single" style={{ marginTop: '20px' }}>
                <div className="ascii-box-title">SPARADE TEMAN</div>
                
                {savedCustomThemes.map((theme, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid var(--ascii-dim)'
                  }}>
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '20px', 
                        backgroundColor: theme.colors.bgColor,
                        border: `1px solid ${theme.colors.textColor}`,
                        marginRight: '10px'
                      }}
                    ></div>
                    <div style={{ flex: 1 }}>{theme.name}</div>
                    <button 
                      className="ascii-button secondary"
                      onClick={() => applyCustomTheme(theme)}
                      style={{ marginRight: '10px' }}
                    >
                      [ ANVÄND ]
                    </button>
                    <button 
                      className="ascii-button secondary"
                      onClick={() => deleteCustomTheme(index)}
                    >
                      [ TA BORT ]
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Utseende och språk */}
      {activeTab === 'appearance' && (
        <div className="ascii-box double">
          <div className="ascii-box-title">UTSEENDE & SPRÅK</div>
          
          <div className="ascii-columns">
            <div className="ascii-column">
              <label className="ascii-label">Språk</label>
              <select 
                className="ascii-select" 
                value={currentLanguage}
                onChange={handleLanguageChange}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              
              <div className="setting-option" style={{ marginTop: '20px' }}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={retroEffect} 
                    onChange={handleRetroEffectChange}
                  />
                  Retro CRT-skärmeffekt
                </label>
              </div>
            </div>
            
            <div className="ascii-column">
              <div className="ascii-box single">
                <div className="ascii-box-title">TIPS</div>
                <p>Anpassa ditt gränssnitt genom att välja ett standardtema eller skapa ett eget.</p>
                <p>CRT-effekten ger en äkta retrokänsla som efterliknar gamla CRT-skärmar.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          className="ascii-button primary"
          onClick={onBack}
        >
          [ TILLBAKA ]
        </button>
      </div>
    </div>
  );
};

export default AsciiSettings; 