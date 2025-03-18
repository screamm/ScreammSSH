import React, { useState, useEffect } from 'react';
import { CustomTheme } from '../electron';

// Tema-gränssnitt
export interface Theme {
  id: string;
  name: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  fontFamily: string;
  selection?: string;
}

// Standardteman
export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'green',
    name: 'Grön Terminal',
    textColor: '#0f0',
    backgroundColor: '#000',
    accentColor: '#0a0',
    fontFamily: 'monospace',
    selection: '#030'
  },
  {
    id: 'amber',
    name: 'Amber Terminal',
    textColor: '#ffb000',
    backgroundColor: '#000',
    accentColor: '#b27300',
    fontFamily: 'monospace',
    selection: '#331f00'
  },
  {
    id: 'blue',
    name: 'IBM Terminal',
    textColor: '#55aaff',
    backgroundColor: '#000',
    accentColor: '#0066cc',
    fontFamily: 'monospace',
    selection: '#001a33'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    textColor: '#00ff00',
    backgroundColor: '#001100',
    accentColor: '#008800',
    fontFamily: '"Courier New", monospace',
    selection: '#002200'
  },
  {
    id: 'commodore',
    name: 'Commodore 64',
    textColor: '#a0a0ff',
    backgroundColor: '#4040aa',
    accentColor: '#8080ff',
    fontFamily: 'monospace',
    selection: '#6060cc'
  }
];

interface ThemeSelectorProps {
  onChange: (theme: Theme) => void;
  activeTheme?: Theme;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onChange, activeTheme }) => {
  const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(activeTheme || themes[0]);
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: 'custom',
    name: 'Anpassad',
    textColor: '#0f0',
    backgroundColor: '#000',
    accentColor: '#0a0',
    fontFamily: 'monospace',
    selection: '#030'
  });
  const [showCustomEditor, setShowCustomEditor] = useState<boolean>(false);
  
  useEffect(() => {
    // Hämta sparade teman från localStorage
    const getSavedThemes = () => {
      try {
        const savedThemes = localStorage.getItem('customThemes');
        if (savedThemes) {
          const parsedThemes = JSON.parse(savedThemes) as Theme[];
          setThemes([...DEFAULT_THEMES, ...parsedThemes]);
        }
      } catch (error) {
        console.error('Kunde inte ladda sparade teman:', error);
      }
    };
    
    getSavedThemes();
  }, []);
  
  useEffect(() => {
    // Uppdatera valt tema om activeTheme ändras
    if (activeTheme) {
      setSelectedTheme(activeTheme);
    }
  }, [activeTheme]);
  
  const handleSelectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    onChange(theme);
  };
  
  const handleSaveCustomTheme = () => {
    const newCustomTheme = { ...customTheme, id: `custom-${Date.now()}` };
    const updatedThemes = [...themes, newCustomTheme];
    
    setThemes(updatedThemes);
    setSelectedTheme(newCustomTheme);
    onChange(newCustomTheme);
    
    // Spara till localStorage
    try {
      const customThemes = updatedThemes.filter(t => !DEFAULT_THEMES.some(dt => dt.id === t.id));
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Kunde inte spara tema:', error);
    }
    
    setShowCustomEditor(false);
  };
  
  const updateCustomTheme = (field: keyof Theme, value: string) => {
    setCustomTheme(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div style={{ 
      padding: '10px',
      backgroundColor: '#111',
      border: '1px solid #333',
      borderRadius: '4px'
    }}>
      <h3 style={{ color: selectedTheme.textColor, marginTop: 0 }}>Välj Terminal-Tema</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        {themes.map(theme => (
          <div
            key={theme.id}
            onClick={() => handleSelectTheme(theme)}
            style={{
              width: '100px',
              height: '70px',
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              border: selectedTheme.id === theme.id 
                ? `2px solid ${theme.textColor}` 
                : '2px solid #333',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: theme.fontFamily || 'monospace',
              boxShadow: selectedTheme.id === theme.id 
                ? `0 0 8px ${theme.textColor}` 
                : 'none'
            }}
          >
            <div style={{ 
              height: '20px', 
              backgroundColor: theme.accentColor, 
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}>
              [TEMA]
            </div>
            <div style={{ textAlign: 'center' }}>{theme.name}</div>
          </div>
        ))}
        
        <div
          onClick={() => setShowCustomEditor(!showCustomEditor)}
          style={{
            width: '100px',
            height: '70px',
            backgroundColor: '#222',
            color: '#ccc',
            border: '2px dashed #555',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          + Skapa nytt tema
        </div>
      </div>
      
      {showCustomEditor && (
        <div style={{ 
          backgroundColor: '#222',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <h4 style={{ color: customTheme.textColor, marginTop: 0 }}>Anpassa Tema</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Namn</label>
            <input
              type="text"
              value={customTheme.name}
              onChange={(e) => updateCustomTheme('name', e.target.value)}
              className="retro-input"
              style={{ 
                width: '100%',
                padding: '5px',
                backgroundColor: '#111',
                color: '#0f0',
                border: '1px solid #444',
                borderRadius: '3px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Textfärg</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="color"
                value={customTheme.textColor}
                onChange={(e) => updateCustomTheme('textColor', e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <input
                type="text"
                value={customTheme.textColor}
                onChange={(e) => updateCustomTheme('textColor', e.target.value)}
                className="retro-input"
                style={{ 
                  flex: 1,
                  padding: '5px',
                  backgroundColor: '#111',
                  color: '#0f0',
                  border: '1px solid #444',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Bakgrundsfärg</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="color"
                value={customTheme.backgroundColor}
                onChange={(e) => updateCustomTheme('backgroundColor', e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <input
                type="text"
                value={customTheme.backgroundColor}
                onChange={(e) => updateCustomTheme('backgroundColor', e.target.value)}
                className="retro-input"
                style={{ 
                  flex: 1,
                  padding: '5px',
                  backgroundColor: '#111',
                  color: '#0f0',
                  border: '1px solid #444',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Accentfärg</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="color"
                value={customTheme.accentColor}
                onChange={(e) => updateCustomTheme('accentColor', e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <input
                type="text"
                value={customTheme.accentColor}
                onChange={(e) => updateCustomTheme('accentColor', e.target.value)}
                className="retro-input"
                style={{ 
                  flex: 1,
                  padding: '5px',
                  backgroundColor: '#111',
                  color: '#0f0',
                  border: '1px solid #444',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#ccc', marginBottom: '3px' }}>Textstil</label>
            <select
              value={customTheme.fontFamily}
              onChange={(e) => updateCustomTheme('fontFamily', e.target.value)}
              className="retro-input"
              style={{ 
                width: '100%',
                padding: '5px',
                backgroundColor: '#111',
                color: '#0f0',
                border: '1px solid #444',
                borderRadius: '3px'
              }}
            >
              <option value="monospace">Monospace</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'VT323', monospace">Terminal (VT323)</option>
              <option value="'Press Start 2P', cursive">Pixel (Press Start 2P)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setShowCustomEditor(false)}
              className="retro-button"
              style={{ 
                backgroundColor: '#300',
                color: '#f66',
                borderColor: '#a00'
              }}
            >
              Avbryt
            </button>
            
            <button
              onClick={handleSaveCustomTheme}
              className="retro-button"
              style={{ 
                backgroundColor: '#030',
                color: '#0f0',
                borderColor: '#0a0' 
              }}
            >
              Spara Tema
            </button>
          </div>
        </div>
      )}
      
      <div style={{ 
        backgroundColor: selectedTheme.backgroundColor,
        color: selectedTheme.textColor,
        border: `1px solid ${selectedTheme.accentColor}`,
        borderRadius: '3px',
        padding: '10px',
        fontFamily: selectedTheme.fontFamily,
        marginTop: '15px'
      }}>
        <div style={{ 
          backgroundColor: selectedTheme.accentColor,
          padding: '3px 8px',
          marginBottom: '8px',
          color: selectedTheme.backgroundColor,
          borderRadius: '2px',
          fontWeight: 'bold'
        }}>
          [Förhandsgranskning]
        </div>
        <div>Välkommen till ScreammSSH!</div>
        <div>$ ls -la</div>
        <div>total 5</div>
        <div>drwxr-xr-x  2 user group  4096 Oct 10 14:30 .</div>
        <div>drwxr-xr-x 17 user group  4096 Oct 10 14:28 ..</div>
        <div>-rw-r--r--  1 user group   853 Oct 10 14:30 config.json</div>
        <div>-rw-r--r--  1 user group  2341 Oct 10 14:30 index.js</div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
          <span>$</span>
          <div style={{ 
            width: '8px', 
            height: '15px', 
            backgroundColor: selectedTheme.textColor,
            marginLeft: '5px',
            animation: 'blink 1s step-end infinite'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector; 