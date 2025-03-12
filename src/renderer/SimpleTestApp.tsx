import React, { useState, useEffect } from 'react';

const SimpleTestApp: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Kontrollerar...');
  const [message, setMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [retroEffect, setRetroEffect] = useState<boolean>(true); // Aktivera CRT-effekten som standard

  // Lägg till ett loggningssystem
  const addLog = (msg: string) => {
    console.log(`SimpleTestApp: ${msg}`);
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${msg}`]);
  };

  // Kör i useEffect
  useEffect(() => {
    addLog('SimpleTestApp monterad!');
    
    // Testa om electronAPI finns
    if (window.electronAPI) {
      addLog('electronAPI är tillgänglig');
      setApiStatus('Tillgänglig');
      
      // Testa pingfunktion
      try {
        window.electronAPI.ping()
          .then((result: string) => {
            addLog(`ping-svar: ${result}`);
            setMessage(result);
          })
          .catch((err: Error) => {
            addLog(`ping-fel: ${err.message}`);
            setMessage(`Fel: ${err.message}`);
          });
        
        // Hämta terminalinställningar för att få retroEffect-värdet
        window.electronAPI.getTerminalSettings()
          .then((settings: { retroEffect: boolean }) => {
            addLog(`terminalSettings mottagen, retroEffect: ${settings.retroEffect}`);
            setRetroEffect(settings.retroEffect);
          })
          .catch((err: Error) => {
            addLog(`Kunde inte hämta terminalSettings: ${err.message}`);
          });
      } catch (err: any) {
        addLog(`Fel vid anrop av ping: ${err.message}`);
        setMessage(`Fel: ${err.message}`);
      }
    } else {
      addLog('electronAPI är INTE tillgänglig');
      setApiStatus('Saknas');
    }
  }, []);
  
  // Funktion för att växla retroEffect
  const toggleRetroEffect = () => {
    const newValue = !retroEffect;
    setRetroEffect(newValue);
    
    // Spara inställningen om API finns
    if (window.electronAPI) {
      window.electronAPI.getTerminalSettings()
        .then((settings: any) => {
          settings.retroEffect = newValue;
          return window.electronAPI.saveTerminalSettings(settings);
        })
        .then(() => {
          addLog(`Sparade retroEffect: ${newValue}`);
        })
        .catch((err: Error) => {
          addLog(`Fel vid sparande av retroEffect: ${err.message}`);
        });
    }
  };

  return (
    <div data-testid="simple-test-app" style={{
      fontFamily: 'monospace',
      padding: '20px',
      backgroundColor: '#001100',
      color: '#00ff00',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ASCII-loggan med CRT-effekt */}
      <div className={`ascii-welcome ${retroEffect ? 'ascii-crt-effect' : ''}`} style={{
        textAlign: 'center',
        marginBottom: '20px',
        ...(retroEffect ? {
          textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00',
          animation: 'flicker 0.15s infinite'
        } : {})
      }}>
        <div className="ascii-logo">
          <pre style={{ 
            color: '#00ff00', 
            margin: 0,
            ...(retroEffect ? { 
              filter: 'blur(0.5px)',
              opacity: 0.9
            } : {})
          }}>{`
  ███████╗ ██████╗██████╗ ███████╗ █████╗ ███╗   ███╗███╗   ███╗███████╗███████╗██╗  ██╗
  ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗████╗ ████║████╗ ████║██╔════╝██╔════╝██║  ██║
  ███████╗██║     ██████╔╝█████╗  ███████║██╔████╔██║██╔████╔██║███████╗███████╗███████║
  ╚════██║██║     ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║╚════██║╚════██║██╔══██║
  ███████║╚██████╗██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████║███████║██║  ██║
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
          `}</pre>
        </div>
      </div>
      
      <h1>SimpleTestApp</h1>
      <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #00ff00' }}>
        <h2>Status</h2>
        <p>ElectronAPI: {apiStatus}</p>
        <p>Testmeddelande: {message}</p>
        <p>CRT-effekt: {retroEffect ? 'PÅ' : 'AV'}</p>
        <button 
          onClick={toggleRetroEffect} 
          style={{
            background: '#001100',
            color: '#00ff00',
            border: '1px solid #00ff00',
            padding: '5px 10px',
            cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          Växla CRT-effekt
        </button>
      </div>
      
      <div style={{ 
        flex: 1, 
        margin: '10px 0', 
        padding: '10px', 
        border: '1px solid #00ff00',
        overflow: 'auto'
      }}>
        <h2>Loggar</h2>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px' }}>{log}</div>
        ))}
      </div>
      
      {/* Inlineade stilar för CRT-effekt-animation */}
      <style>{`
        @keyframes flicker {
          0% { opacity: 0.9; }
          50% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        
        .ascii-crt-effect {
          position: relative;
        }
        
        .ascii-crt-effect::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default SimpleTestApp; 