import React, { useState, useEffect, useRef } from 'react';
import { formatOutput } from '../utils/terminal-formatter';
import { HistoryIcon, FileIcon, TerminalIcon } from '../utils/icon-wrapper';
import FileExplorer from './FileExplorer';
import { Theme } from './ThemeSelector';
import '../styles/Terminal.css';

interface TerminalProps {
  sshConfig: {
    id: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    name: string;
  };
  onConnectionStatus?: (status: boolean) => void;
  theme?: Theme;
}

type Command = {
  text: string;
  timestamp: number;
};

const Terminal: React.FC<TerminalProps> = ({ sshConfig, onConnectionStatus, theme = 'default' }) => {
  const [output, setOutput] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'terminal' | 'files'>('terminal');
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Anslut till servern när komponenten monteras
  useEffect(() => {
    connectToServer();
    return () => {
      // Koppla från servern när komponenten avmonteras
      if (isConnected) {
        window.electronAPI.sshDisconnect(sshConfig.id)
          .catch(err => console.error('Kunde inte koppla från:', err));
      }
    };
  }, []);
  
  // Påverka utmatningen när temat ändras
  useEffect(() => {
    if (output && !output.includes(getWelcomeMessage())) {
      // Lägg inte till välkomstmeddelandet om vi redan har utmatning
      // men vi kan lägga till en temaändring-markör om vi vill
      setOutput(prev => prev + `\n\n--- Tema ändrat till ${theme} ---\n\n`);
    }
  }, [theme]);
  
  // Anpassa terminalens prompt-tecken baserat på tema
  const getPromptSymbol = () => {
    switch(theme) {
      case 'nostromo':
        return '█ ';
      case 'classic-green':
        return '$ ';
      case 'htop':
        return '# ';
      case 'cyan-ssh':
        return '> ';
      default:
        return '> ';
    }
  };
  
  // Anpassa välkomstmeddelande baserat på tema
  const getWelcomeMessage = () => {
    switch(theme) {
      case 'nostromo':
        return `NOSTROMO MU/TH/UR 6000\nANSLUTER TILL ${sshConfig.host.toUpperCase()}...\n`;
      case 'classic-green':
        return `AnderShell 3000 v0.1\nAnsluter till ${sshConfig.host}...\n`;
      case 'htop':
        return `Terminal v1.0 [${sshConfig.username}@${sshConfig.host}]\nAnsluter...\n`;
      case 'cyan-ssh':
        return `SSH-Klient v1.0\nAnsluter till ${sshConfig.host} som ${sshConfig.username}...\n`;
      default:
        return `Ansluter till servern...\n`;
    }
  };
  
  // Scrolla till botten när utmatning ändras
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);
  
  // Fokusera på inmatningsfältet när komponenten monteras eller vid tabbbyte
  useEffect(() => {
    if (currentTab === 'terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentTab]);
  
  // Använd lokal lagring för kommandohistorik
  useEffect(() => {
    const savedHistory = localStorage.getItem(`command_history_${sshConfig.id}`);
    if (savedHistory) {
      setCommandHistory(JSON.parse(savedHistory));
    }
  }, [sshConfig.id]);
  
  // Spara kommandohistorik i lokal lagring
  useEffect(() => {
    if (commandHistory.length > 0) {
      localStorage.setItem(`command_history_${sshConfig.id}`, JSON.stringify(commandHistory));
    }
  }, [commandHistory, sshConfig.id]);
  
  const connectToServer = async () => {
    try {
      setIsLoading(true);
      setOutput(getWelcomeMessage());
      
      const result = await window.electronAPI.sshConnect({
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        password: sshConfig.password,
        privateKey: sshConfig.privateKey
      });
      
      if (result.success) {
        setIsConnected(true);
        const connectedMessage = theme === 'nostromo' 
          ? `ANSLUTNING ETABLERAD: ${sshConfig.username.toUpperCase()}@${sshConfig.host.toUpperCase()}\n`
          : `Ansluten till ${sshConfig.host} som ${sshConfig.username}\n`;
        setOutput(prev => prev + connectedMessage);
        
        // Exekvera ett initialt kommando för att visa information om servern
        const initResult = await window.electronAPI.sshExecute(sshConfig.id, 'uname -a && echo "Nuvarande katalog: $(pwd)"');
        const formattedOutput = theme === 'nostromo' 
          ? formatOutput(initResult.stdout).toUpperCase() 
          : formatOutput(initResult.stdout);
        setOutput(prev => prev + formattedOutput);
        
        // Meddela överordnad komponent om anslutningsstatus
        if (onConnectionStatus) {
          onConnectionStatus(true);
        }
      } else {
        setOutput(prev => prev + `Anslutningsfel: ${result.error}\n`);
        if (onConnectionStatus) {
          onConnectionStatus(false);
        }
      }
    } catch (error: any) {
      setOutput(prev => prev + `Anslutningsfel: ${error.message}\n`);
      if (onConnectionStatus) {
        onConnectionStatus(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (tab: 'terminal' | 'files') => {
    setCurrentTab(tab);
  };
  
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !isConnected) return;
    
    const trimmedCommand = command.trim();
    
    // Lägg till kommandot i terminalen
    setOutput(prev => prev + `\n${getPromptSymbol()}${trimmedCommand}\n`);
    
    // Rensa inmatningen
    setCommand('');
    
    // Återställ historikindexet
    setHistoryIndex(-1);
    
    // Spara till historiken om det inte är ett duplikat av det senaste kommandot
    const newCommand = { text: trimmedCommand, timestamp: Date.now() };
    if (commandHistory.length === 0 || commandHistory[0].text !== trimmedCommand) {
      setCommandHistory(prev => [newCommand, ...prev].slice(0, 100));
    }
    
    try {
      setIsLoading(true);
      
      // Exekvera kommandot
      const result = await window.electronAPI.sshExecute(sshConfig.id, trimmedCommand);
      
      // Formatera och visa utmatningen
      if (result.stdout) {
        setOutput(prev => prev + formatOutput(result.stdout));
      }
      
      if (result.stderr) {
        setOutput(prev => prev + formatOutput(result.stderr, 'error'));
      }
      
      if (result.code !== 0) {
        setOutput(prev => prev + `\nAvslutad med felkod: ${result.code}\n`);
      }
    } catch (error: any) {
      setOutput(prev => prev + `Fel vid exekvering: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Hantera upp-/nerpil för kommandohistorik
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex].text);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setCommand('');
        return;
      }
      
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex].text);
    } else if (e.key === 'Tab') {
      // TODO: Implementera tab-komplettering
      e.preventDefault();
    } else if (e.key === 'c' && e.ctrlKey) {
      // Avbryt kommando med Ctrl+C
      setOutput(prev => prev + '\n^C\n');
      setCommand('');
    }
  };
  
  const toggleHistoryDropdown = () => {
    setShowHistoryDropdown(prev => !prev);
  };
  
  const selectFromHistory = (cmd: string) => {
    setCommand(cmd);
    setShowHistoryDropdown(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="terminal-with-tabs">
      <div className="terminal-tabs">
        <button
          className={`terminal-tab-button ${currentTab === 'terminal' ? 'active' : ''}`}
          onClick={() => handleTabChange('terminal')}
        >
          <TerminalIcon /> Terminal
        </button>
        <button
          className={`terminal-tab-button ${currentTab === 'files' ? 'active' : ''}`}
          onClick={() => handleTabChange('files')}
        >
          <FileIcon /> Filer
        </button>
      </div>
      
      {currentTab === 'terminal' ? (
        <div className="terminal-container">
          <div className="terminal-header">
            <span className="terminal-title">{sshConfig.name} - {sshConfig.username}@{sshConfig.host}:{sshConfig.port}</span>
            <div className="history-button-container">
              <button
                className="history-button"
                onClick={toggleHistoryDropdown}
                disabled={commandHistory.length === 0}
                title="Visa kommandohistorik"
              >
                <HistoryIcon />
              </button>
              
              {showHistoryDropdown && commandHistory.length > 0 && (
                <div className="history-dropdown">
                  {commandHistory.map((cmd, index) => (
                    <div
                      key={index}
                      className="history-item"
                      onClick={() => selectFromHistory(cmd.text)}
                      title={formatTimestamp(cmd.timestamp)}
                    >
                      {cmd.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="terminal-output" ref={terminalRef}>
            <pre>{output}</pre>
            {isLoading && <div className="terminal-spinner"></div>}
          </div>
          
          <form className="terminal-input-form" onSubmit={handleCommandSubmit}>
            <span className="terminal-prompt">{getPromptSymbol()}</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ange ett kommando..."
              disabled={!isConnected || isLoading}
            />
          </form>
        </div>
      ) : (
        <FileExplorer 
          connectionId={sshConfig.id} 
          theme={theme}
        />
      )}
    </div>
  );
};

export default Terminal; 