import React from 'react';
import { CustomTheme } from '../electron';

export type Theme = 'default' | 'nostromo' | 'classic-green' | 'htop' | 'cyan-ssh';

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChange }) => {
  const [activeTheme, setActiveTheme] = React.useState<Theme>('default');

  React.useEffect(() => {
    // Läs in tema från localStorage vid uppstart
    const loadTheme = async () => {
      try {
        const savedThemes = await window.electronAPI.getThemes();
        if (savedThemes && savedThemes.length > 0) {
          // Använd det första temat eller leta efter ett standardtema
          const defaultTheme = savedThemes.find(t => t.id === 'default');
          if (defaultTheme) {
            setActiveTheme(defaultTheme.id as Theme);
            
            // Applicera temat på <body> element
            document.body.setAttribute('data-theme', defaultTheme.id);
          }
        }
      } catch (error) {
        console.error('Kunde inte ladda tema:', error);
      }
    };
    
    loadTheme();
  }, []);

  const applyTheme = (theme: Theme) => {
    setActiveTheme(theme);
    
    // Applicera tema på body-elementet
    document.body.setAttribute('data-theme', theme);
    
    // Anropa callback om det finns
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const changeTheme = async (theme: Theme) => {
    applyTheme(theme);
    
    // Skapa ett CustomTheme-objekt
    const customTheme: CustomTheme = {
      id: theme,
      name: theme,
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#4d4d4d',
        black: '#000000',
        brightBlack: '#666666',
        red: '#cc0000',
        brightRed: '#ff0000',
        green: '#00cc00',
        brightGreen: '#00ff00',
        yellow: '#cccc00',
        brightYellow: '#ffff00',
        blue: '#0000cc',
        brightBlue: '#0000ff',
        magenta: '#cc00cc',
        brightMagenta: '#ff00ff',
        cyan: '#00cccc',
        brightCyan: '#00ffff',
        white: '#cccccc',
        brightWhite: '#ffffff'
      }
    };
    
    // Spara temat i lagringen
    try {
      await window.electronAPI.saveTheme(customTheme);
    } catch (error) {
      console.error('Kunde inte spara tema:', error);
    }
  };

  return (
    <div className="theme-buttons">
      <button 
        onClick={() => changeTheme('default')}
        className={`theme-button ${activeTheme === 'default' ? 'active' : ''}`}
        aria-label="Standard tema"
      >
        Standard
      </button>
      
      <button 
        onClick={() => changeTheme('nostromo')}
        className={`theme-button ${activeTheme === 'nostromo' ? 'active' : ''}`}
        aria-label="Nostromo tema (röd)"
      >
        Nostromo
      </button>
      
      <button 
        onClick={() => changeTheme('classic-green')}
        className={`theme-button ${activeTheme === 'classic-green' ? 'active' : ''}`}
        aria-label="Klassisk grön terminal"
      >
        Terminal
      </button>
      
      <button 
        onClick={() => changeTheme('htop')}
        className={`theme-button ${activeTheme === 'htop' ? 'active' : ''}`}
        aria-label="Htop tema (lila)"
      >
        Htop
      </button>
      
      <button 
        onClick={() => changeTheme('cyan-ssh')}
        className={`theme-button ${activeTheme === 'cyan-ssh' ? 'active' : ''}`}
        aria-label="Cyan SSH tema"
      >
        Cyan SSH
      </button>
    </div>
  );
};

export default ThemeSelector; 