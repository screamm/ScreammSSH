import React, { useEffect, useState } from 'react';

export type Theme = 'default' | 'nostromo' | 'classic-green' | 'htop' | 'cyan-ssh';

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');
  
  // Läs senast använda temat från electron-store vid uppstart
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Försök läsa från electron-store först
        const storedTheme = await window.electronAPI.getTheme() as Theme;
        
        if (storedTheme) {
          setCurrentTheme(storedTheme);
          applyTheme(storedTheme);
          if (onThemeChange) {
            onThemeChange(storedTheme);
          }
        } else {
          // Fallback till localStorage om inget finns i electron-store
          const savedTheme = localStorage.getItem('selectedTheme') as Theme | null;
          if (savedTheme) {
            setCurrentTheme(savedTheme);
            applyTheme(savedTheme);
            // Spara till electron-store för framtida användning
            await window.electronAPI.saveTheme(savedTheme);
            if (onThemeChange) {
              onThemeChange(savedTheme);
            }
          }
        }
      } catch (error) {
        console.error('Fel vid laddning av tema:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  const applyTheme = (theme: Theme) => {
    // Uppdatera data-theme attributet på root-elementet
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };
  
  const changeTheme = async (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    
    // Spara temat både i localStorage (för snabb åtkomst) och electron-store (permanent)
    localStorage.setItem('selectedTheme', theme);
    try {
      await window.electronAPI.saveTheme(theme);
    } catch (error) {
      console.error('Fel vid sparande av tema:', error);
    }
    
    // Meddela föräldrakomponenten
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };
  
  // Lista över alla teman
  const themes: { id: Theme; name: string }[] = [
    { id: 'default', name: 'Standard' },
    { id: 'nostromo', name: 'Nostromo (Röd)' },
    { id: 'classic-green', name: 'Klassisk Terminal (Grön)' },
    { id: 'htop', name: 'Htop (Lila)' },
    { id: 'cyan-ssh', name: 'Cyan SSH' }
  ];
  
  return (
    <div className="theme-selector">
      <span>Tema:</span>
      {themes.map(theme => (
        <button
          key={theme.id}
          className={`theme-button theme-button-${theme.id} ${currentTheme === theme.id ? 'active' : ''}`}
          onClick={() => changeTheme(theme.id)}
          title={theme.name}
        />
      ))}
    </div>
  );
};

export default ThemeSelector; 