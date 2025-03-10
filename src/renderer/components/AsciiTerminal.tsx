import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Theme } from './ThemeSelector';
import '../styles/ascii-ui.css';

interface SSHConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  name: string;
}

interface AsciiTerminalProps {
  sshConfig: SSHConfig;
  onConnectionStatus?: (status: boolean) => void;
  onBack?: () => void;
  theme?: Theme;
  isPanelMode?: boolean;
  isActivePanel?: boolean;
}

type TerminalMessage = {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
};

type CommandHistoryItem = {
  text: string;
  timestamp: number;
};

const AsciiTerminal: React.FC<AsciiTerminalProps> = ({ 
  sshConfig, 
  onConnectionStatus,
  onBack,
  theme = 'default',
  isPanelMode = false,
  isActivePanel = true
}) => {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'files'>('terminal');
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const [retroEffect, setRetroEffect] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Skrolla till botten när nya meddelanden kommer
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Fokusera på inmatningsfältet när komponenten laddas
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Ladda terminalinställningar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getTerminalSettings();
        if (settings) {
          setRetroEffect(settings.retroEffect);
        }
      } catch (error) {
        console.error('Kunde inte ladda terminalinställningar:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Anslut till SSH vid komponentladdning
  useEffect(() => {
    connectToServer();
    return () => {
      // Koppla från när komponenten avmonteras
      if (isConnected) {
        disconnectFromServer();
      }
    };
  }, []);
  
  const addMessage = (content: string, type: TerminalMessage['type'] = 'output') => {
    const newMessage: TerminalMessage = {
      id: uuidv4(),
      type,
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  const getPromptSymbol = () => {
    if (!isConnected) {
      return '$';
    }
    
    if (sshConfig.username === 'root') {
      return '#';
    }
    
    return '$';
  };
  
  const getColorizedContent = (content: string, type: TerminalMessage['type']) => {
    // Returnera olika HTML-klasser baserat på meddelandetyp
    if (type === 'input') {
      return <span style={{ color: 'var(--ascii-bright)' }}>{content}</span>;
    } else if (type === 'system') {
      return <span style={{ color: 'var(--ascii-dim)' }}>{content}</span>;
    } else if (type === 'error') {
      return <span style={{ color: 'var(--ascii-error)' }}>{content}</span>;
    }
    
    // För standardutmatning, returnera innehållet som det är
    return content;
  };
  
  const connectToServer = async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    addMessage(`Ansluter till ${sshConfig.host}:${sshConfig.port} som ${sshConfig.username}...`, 'system');
    
    try {
      const result = await window.electronAPI.sshConnect({
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        password: sshConfig.password,
        privateKey: sshConfig.privateKey
      });
      
      if (result.success && result.sessionId) {
        setIsConnected(true);
        setIsConnecting(false);
        
        if (onConnectionStatus) {
          onConnectionStatus(true);
        }
        
        addMessage(`Ansluten till ${sshConfig.host}.`, 'system');
        
        // Kör några inledande kommandon för att visa systeminformation
        const whoamiResult = await window.electronAPI.sshExecute(result.sessionId, 'whoami');
        addMessage(`Inloggad som: ${whoamiResult.stdout?.trim() || 'okänd'}`, 'system');
        
        const hostnameResult = await window.electronAPI.sshExecute(result.sessionId, 'hostname');
        addMessage(`Värdnamn: ${hostnameResult.stdout?.trim() || 'okänd'}`, 'system');
        
        const uptimeResult = await window.electronAPI.sshExecute(result.sessionId, 'uptime');
        if (uptimeResult.success) {
          addMessage(`System uptime: ${uptimeResult.stdout?.trim() || 'okänd'}`, 'system');
        }
        
        // Spara anslutnings-ID för framtida användning
        sshConfig.id = result.sessionId;
      } else {
        setIsConnecting(false);
        addMessage(`Anslutningsfel: ${result.error || 'Okänt fel'}`, 'error');
      }
    } catch (error) {
      console.error('Anslutningsfel:', error);
      setIsConnecting(false);
      addMessage(`Anslutningsfel: ${error instanceof Error ? error.message : 'Okänt fel'}`, 'error');
    }
  };
  
  const disconnectFromServer = async () => {
    if (!isConnected) return;
    
    try {
      const result = await window.electronAPI.sshDisconnect(sshConfig.id);
      
      if (result.success) {
        setIsConnected(false);
        
        if (onConnectionStatus) {
          onConnectionStatus(false);
        }
        
        addMessage('Frånkopplad från servern.', 'system');
      } else {
        addMessage(`Kunde inte koppla från: ${result.error || 'Okänt fel'}`, 'error');
      }
    } catch (error) {
      console.error('Frånkopplingsfel:', error);
      addMessage(`Frånkopplingsfel: ${error instanceof Error ? error.message : 'Okänt fel'}`, 'error');
    }
  };
  
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Lägg till kommandot i historik
    const command = input.trim();
    addMessage(`${getPromptSymbol()} ${command}`, 'input');
    
    // Rensa inmatningsfältet
    setInput('');
    setHistoryIndex(-1);
    
    // Lägg till i kommandohistoriken
    const historyItem: CommandHistoryItem = {
      text: command,
      timestamp: Date.now()
    };
    
    setCommandHistory(prev => {
      // Ta bort eventuella dubbletter
      const filteredHistory = prev.filter(item => item.text !== command);
      return [historyItem, ...filteredHistory].slice(0, 50); // Spara max 50 kommandon
    });
    
    // Speciella kommandon
    if (command.toLowerCase() === 'clear') {
      setMessages([]);
      return;
    }
    
    if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
      await disconnectFromServer();
      if (onBack) {
        onBack();
      }
      return;
    }
    
    if (!isConnected) {
      addMessage('Inte ansluten till någon server.', 'error');
      return;
    }
    
    try {
      const result = await window.electronAPI.sshExecute(sshConfig.id, command);
      
      if (result.success) {
        if (result.stdout) {
          addMessage(result.stdout);
        }
        
        if (result.stderr) {
          addMessage(result.stderr, 'error');
        }
        
        if (result.code !== 0) {
          addMessage(`Kommandot återvände med kod: ${result.code}`, 'system');
        }
      } else {
        addMessage(`Kunde inte köra kommando: ${result.error || 'Okänt fel'}`, 'error');
      }
    } catch (error) {
      console.error('Fel vid körning av kommando:', error);
      addMessage(`Fel vid körning av kommando: ${error instanceof Error ? error.message : 'Okänt fel'}`, 'error');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Använd piltangenter för att navigera i historiken
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex >= commandHistory.length - 1 ? commandHistory.length - 1 : historyIndex + 1;
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex].text);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }
      
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex].text);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Här kan vi implementera auto-complete
    }
  };
  
  const handleTabChange = (tab: 'terminal' | 'files') => {
    setActiveTab(tab);
  };
  
  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''} ${isPanelMode ? 'panel-mode' : ''}`}>
      {isPanelMode ? (
        <div className="ascii-panel-header">
          <div className="ascii-panel-title">
            {sshConfig.name || `${sshConfig.username}@${sshConfig.host}`}
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '[ANSLUTEN]' : '[EJ ANSLUTEN]'}
            </span>
          </div>
        </div>
      ) : (
        <div className="ascii-header">
          <div className="ascii-banner">
{`
    .----.--.--.--.--.--.--.--.--.--.--.---.-.----.
    |    |  |  |     |  |  |     |     |     |    |
    |----+--+--+--+--+--+--+--+--+--+--+--+--+----|
    | Host: ${sshConfig.host.padEnd(38)} |
    | User: ${sshConfig.username.padEnd(38)} |
    |----+--+--+--+--+--+--+--+--+--+--+--+----|
    | ${(isConnected ? "CONNECTED" : "DISCONNECTED").padEnd(42)} |
    '----'--'--'--'--'--'--'--'--'---'-'----'
`}
          </div>
        </div>
      )}
      
      <div className="ascii-tabs">
        <div 
          className={`ascii-tab ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => handleTabChange('terminal')}
        >
          [ TERMINAL ]
        </div>
        <div 
          className={`ascii-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => handleTabChange('files')}
        >
          [ FILER ]
        </div>
      </div>
      
      {activeTab === 'terminal' && (
        <div className="ascii-box single">
          <div className="ascii-terminal">
            {messages.map(msg => (
              <div key={msg.id}>
                {getColorizedContent(msg.content, msg.type)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleCommandSubmit} className="ascii-prompt">
            <span className="ascii-prompt-char">{getPromptSymbol()}</span>
            <input
              type="text"
              ref={inputRef}
              className="ascii-prompt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              placeholder={isConnected ? "Skriv ett kommando..." : "Inte ansluten..."}
            />
          </form>
        </div>
      )}
      
      {activeTab === 'files' && (
        <div className="ascii-box single">
          <div className="ascii-box-title">FILHANTERING</div>
          <div style={{ padding: 'var(--ascii-grid)', textAlign: 'center' }}>
            <p>SFTP-funktionalitet kommer snart...</p>
            <p>Byt till terminalen för att köra kommandon</p>
          </div>
        </div>
      )}
      
      {!isPanelMode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--ascii-grid)' }}>
          <div>
            <button 
              className="ascii-button secondary" 
              onClick={onBack}
            >
              [ TILLBAKA ]
            </button>
            
            <button 
              className="ascii-button secondary"
              onClick={() => setShowHistory(!showHistory)}
              disabled={commandHistory.length === 0}
            >
              [ HISTORIK ]
            </button>
          </div>
          
          <div>
            {isConnected ? (
              <button 
                className="ascii-button primary"
                onClick={disconnectFromServer}
              >
                [ KOPPLA FRÅN ]
              </button>
            ) : (
              <button 
                className="ascii-button primary"
                onClick={connectToServer}
                disabled={isConnecting}
              >
                {isConnecting ? '[ ANSLUTER... ]' : '[ ANSLUT ]'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {!isPanelMode && (
        <div className="ascii-statusbar">
          <div className="ascii-status-item">
            {sshConfig.host}:{sshConfig.port}
          </div>
          <div className="ascii-status-item">
            {sshConfig.username}
          </div>
          <div className="ascii-status-item">
            {isConnected ? 'ANSLUTEN' : 'EJ ANSLUTEN'}
          </div>
          <div className="ascii-status-item">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
      
      {showHistory && commandHistory.length > 0 && (
        <div className="ascii-box single" style={{ position: 'absolute', top: '350px', right: '20px', width: '300px', zIndex: 10 }}>
          <div className="ascii-box-title">KOMMANDOHISTORIK</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {commandHistory.map((cmd, index) => (
              <div 
                key={index}
                className="ascii-prompt"
                style={{ 
                  cursor: 'pointer', 
                  padding: 'calc(var(--ascii-grid) / 2)', 
                  borderBottom: '1px solid var(--ascii-dim)'
                }}
                onClick={() => {
                  setInput(cmd.text);
                  setShowHistory(false);
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <span className="ascii-prompt-char">{getPromptSymbol()}</span>
                {cmd.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsciiTerminal; 