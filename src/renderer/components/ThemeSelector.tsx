import React from 'react';

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
        const savedTheme = await window.electronAPI.getTheme();
        if (savedTheme) {
          setActiveTheme(savedTheme as Theme);
          
          // Applicera temat på <body> element
          document.body.setAttribute('data-theme', savedTheme);
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
    
    // Spara temat i lagringen
    try {
      await window.electronAPI.saveTheme(theme);
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