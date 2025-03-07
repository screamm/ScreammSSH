import React, { useState, useEffect } from 'react';

export interface Tab {
  id: string;
  title: string;
  type: 'shell' | 'ssh';
  sessionId: string | null;
  isActive: boolean;
}

interface TerminalTabsProps {
  tabs: Tab[];
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCreateTab: (type: 'shell' | 'ssh') => void;
  language: string;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  tabs,
  onSelectTab,
  onCloseTab,
  onCreateTab,
  language
}) => {
  // Översättningar med korrekta typannoteringar
  type TranslationKey = 'newTab' | 'newShell' | 'newSSH' | 'shell' | 'ssh';
  type LanguageKey = 'sv' | 'en';
  
  const translations: Record<LanguageKey, Record<TranslationKey, string>> = {
    sv: {
      newTab: 'Ny flik',
      newShell: 'Nytt skal',
      newSSH: 'Ny SSH',
      shell: 'Skal',
      ssh: 'SSH'
    },
    en: {
      newTab: 'New tab',
      newShell: 'New shell',
      newSSH: 'New SSH',
      shell: 'Shell',
      ssh: 'SSH'
    }
  };

  const t = (key: string): string => {
    const lang = (language in translations) ? language as LanguageKey : 'sv';
    return translations[lang][key as TranslationKey] || key;
  };

  const [showMenu, setShowMenu] = useState(false);
  
  // Stäng menyn när användaren klickar utanför
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
    };
    
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu]);
  
  const handleTabClick = (id: string) => {
    onSelectTab(id);
  };
  
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCloseTab(id);
  };
  
  const handleNewTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  return (
    <div className="terminal-tabs">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`terminal-tab ${tab.isActive ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
        >
          <span className="tab-title">
            {tab.type === 'ssh' ? `${t('ssh')}: ` : `${t('shell')}: `}
            {tab.title}
          </span>
          <span 
            className="terminal-tab-close"
            onClick={(e) => handleCloseTab(tab.id, e)}
          >
            ✕
          </span>
        </div>
      ))}
      
      <div className="terminal-new-tab" onClick={handleNewTabClick}>
        + {t('newTab')}
        
        {showMenu && (
          <div className="terminal-tab-menu">
            <div 
              className="terminal-tab-menu-item"
              onClick={() => onCreateTab('shell')}
            >
              {t('newShell')}
            </div>
            <div 
              className="terminal-tab-menu-item"
              onClick={() => onCreateTab('ssh')}
            >
              {t('newSSH')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalTabs; 