import React, { useState, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';
import { Theme } from './ThemeSelector';
import '../styles/Settings.css';

interface SettingsProps {
  onThemeChange: (theme: Theme) => void;
  currentTheme: Theme;
  onLanguageChange?: (language: string) => void;
  currentLanguage?: string;
}

const Settings: React.FC<SettingsProps> = ({ 
  onThemeChange, 
  currentTheme, 
  onLanguageChange, 
  currentLanguage = 'sv' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [retroEffect, setRetroEffect] = useState(true);
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    // Ladda terminalinställningar vid uppstart
    const loadTerminalSettings = async () => {
      try {
        const settings = await window.electronAPI.getTerminalSettings();
        if (settings) {
          setRetroEffect(settings.retroEffect);
          setCursorBlink(settings.cursorBlink);
        }
      } catch (error) {
        console.error('Kunde inte ladda terminalinställningar:', error);
      }
    };
    
    loadTerminalSettings();
  }, []);

  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  // Tillgängliga språk
  const languages = [
    { code: 'sv', name: 'Svenska' },
    { code: 'en', name: 'English' },
    { code: 'fi', name: 'Suomi' },
    { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' }
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langCode = e.target.value;
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };

  const handleRetroEffectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setRetroEffect(value);
    saveTerminalSettings(value, cursorBlink);
  };

  const handleCursorBlinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setCursorBlink(value);
    saveTerminalSettings(retroEffect, value);
  };

  const saveTerminalSettings = async (retroEffect: boolean, cursorBlink: boolean) => {
    try {
      await window.electronAPI.saveTerminalSettings({
        retroEffect,
        cursorBlink,
        fontSize: 14
      });
    } catch (error) {
      console.error('Kunde inte spara terminalinställningar:', error);
    }
  };

  return (
    <div className="settings-container">
      <button 
        className="settings-toggle" 
        onClick={toggleSettings}
        aria-label="Inställningar"
      >
        ⚙️
      </button>
      
      {isOpen && (
        <div className={`settings-panel ${retroEffect ? 'crt-effect' : ''}`}>
          <div className="settings-header">
            <h3>Inställningar</h3>
            <button 
              className="close-button" 
              onClick={toggleSettings}
              aria-label="Stäng"
            >
              ×
            </button>
          </div>
          
          <div className="settings-content">
            <div className="settings-section">
              <div className="dos-title">
                <span className="dos-title-text">Tema</span>
              </div>
              
              <div className="theme-preview">
                <div className={`theme-preview-box theme-${currentTheme}`}>
                  <div className="theme-preview-header">C:\&gt; dir /w</div>
                  <div className="theme-preview-content">
                    <div>Volume in drive C is SYSTEM</div>
                    <div>Directory of C:\SCREAMM</div>
                    <div>&nbsp;</div>
                    <div>[ CONFIG   BAT]  [ README   TXT]  [ INSTALL  EXE]</div>
                    <div>[ TERMINAL SYS]  [ CONNECT  BAT]  [ SYSTEM   DLL]</div>
                    <div>6 File(s)   45,123 bytes</div>
                    <div>0 Dir(s)  124,237,824 bytes free</div>
                    <div>&nbsp;</div>
                    <div>C:\&gt; <span className="blink-cursor"></span></div>
                  </div>
                </div>
              </div>
              
              <ThemeSelector onThemeChange={onThemeChange} />
            </div>
            
            <div className="dos-divider"></div>
            
            <div className="settings-section">
              <div className="dos-title">
                <span className="dos-title-text">Språk</span>
              </div>
              
              <div className="dos-field">
                <span className="dos-field-title">SELECT</span>
                <select 
                  className="language-selector" 
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="dos-divider"></div>

            <div className="settings-section">
              <div className="dos-title">
                <span className="dos-title-text">Terminal</span>
              </div>
              
              <div className="setting-option">
                <label>
                  <input 
                    type="checkbox" 
                    checked={retroEffect} 
                    onChange={handleRetroEffectsChange}
                  />
                  Retro CRT-effekt
                </label>
              </div>
              
              <div className="setting-option">
                <label>
                  <input 
                    type="checkbox" 
                    checked={cursorBlink} 
                    onChange={handleCursorBlinkChange}
                  />
                  Blinkande markör
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 