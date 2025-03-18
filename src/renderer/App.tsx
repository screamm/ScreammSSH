import React, { useState, useEffect } from 'react';
import { Theme } from './types/index.d';
import AsciiInterface from './components/AsciiInterface';

/**
 * App-komponent för ScreammSSH
 */
const App: React.FC = () => {
  const [message, setMessage] = useState<string>('Laddar...');
  const [testResult, setTestResult] = useState<string>('');
  const [activeTheme, setActiveTheme] = useState<Theme>('default');

  // Ladda tema från localStorage vid uppstart
  useEffect(() => {
    const savedThemeId = localStorage.getItem('screammSSH_theme');
    if (savedThemeId) {
      // Detta är en förenklad implementering för att bara spara temanyckel
      setActiveTheme(savedThemeId as Theme);
      applyThemeById(savedThemeId as Theme);
    } else {
      // Använd ett standardtema om inget är sparat
      applyThemeById('default');
    }
  }, []);

  // Testa kommunikation med huvudprocessen
  useEffect(() => {
    async function testConnection() {
      try {
        if (window.electronAPI) {
          console.log('Testar kommunikation från renderer-processen...');
          const result = await window.electronAPI.ping();
          console.log('Ping-resultat:', result);
          setTestResult('✅ IPC-test lyckades!');
          setMessage('Electron API hittad!');
        } else {
          console.error('electronAPI saknas i window');
          setMessage('❌ Electron API saknas');
        }
      } catch (error) {
        console.error('Kommunikationsfel:', error);
        setTestResult(`❌ IPC-test misslyckades: ${error}`);
      }
    }
    
    testConnection();
  }, []);

  // Hämta temafärger baserat på tema-ID
  const getThemeColors = (themeId: Theme) => {
    switch(themeId) {
      case 'default':
        return {
          backgroundColor: '#000000',
          textColor: '#00ff00',
          accentColor: '#008800',
          selection: '#003300',
          fontFamily: 'monospace'
        };
      case 'nostromo':
        return {
          backgroundColor: '#0a0a0a',
          textColor: '#ff3300',
          accentColor: '#aa2200',
          selection: '#330a00',
          fontFamily: 'monospace'
        };
      case 'classic-green':
        return {
          backgroundColor: '#001100',
          textColor: '#00ff00',
          accentColor: '#00aa00',
          selection: '#003300',
          fontFamily: '"Courier New", monospace'
        };
      case 'htop':
        return {
          backgroundColor: '#000000',
          textColor: '#cc77ff',
          accentColor: '#9944cc',
          selection: '#442266',
          fontFamily: 'monospace'
        };
      case 'cyan-ssh':
        return {
          backgroundColor: '#001b29',
          textColor: '#00ccff',
          accentColor: '#0088aa',
          selection: '#002233',
          fontFamily: 'monospace'
        };
      default:
        return {
          backgroundColor: '#000000',
          textColor: '#00ff00',
          accentColor: '#008800',
          selection: '#003300',
          fontFamily: 'monospace'
        };
    }
  };

  // Tillämpa tema på body och andra element
  const applyThemeById = (themeId: Theme) => {
    const colors = getThemeColors(themeId);
    
    // Skapa globala CSS-variabler för temafärger
    document.documentElement.style.setProperty('--theme-bg-color', colors.backgroundColor);
    document.documentElement.style.setProperty('--theme-text-color', colors.textColor);
    document.documentElement.style.setProperty('--theme-accent-color', colors.accentColor);
    document.documentElement.style.setProperty('--theme-selection-color', colors.selection);
    document.documentElement.style.setProperty('--theme-font-family', colors.fontFamily);
    
    // Applicera grundläggande stilar på body
    document.body.style.backgroundColor = colors.backgroundColor;
    document.body.style.color = colors.textColor;
    document.body.style.fontFamily = colors.fontFamily;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Spara det valda temat i localStorage
    localStorage.setItem('screammSSH_theme', themeId);
    
    // Skapa en custom event för att meddela andra komponenter om temabyte
    const event = new CustomEvent('theme-changed', { detail: colors });
    window.dispatchEvent(event);
  };

  // Hantera temabyte
  const handleThemeChange = (themeId: Theme) => {
    setActiveTheme(themeId);
    applyThemeById(themeId);
  };
  
  return (
    <AsciiInterface
      onThemeChange={handleThemeChange}
      activeTheme={activeTheme}
    />
  );
};

export default App;