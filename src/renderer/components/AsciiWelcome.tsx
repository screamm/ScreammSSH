import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Theme } from './ThemeSelector';
import '../styles/ascii-ui.css';
import '../styles/ascii-terminal.css';
import { parseAnsi, stripAnsi, containsAnsi } from '../utils/ansiParser';
import SSHConnectionManager from './SSHConnectionManager';
import { CustomTheme } from '../electron';

interface AsciiWelcomeProps {
  onConnect: () => void;
  currentTheme: Theme;
  language?: string;
}

// Språkstöd
const translations = {
  sv: {
    welcome: 'Välkommen till ScreammSSH Terminal',
    description: 'Detta är en modern SSH/SFTP-klient med retrokänsla',
    information: 'INFORMATION',
    commands: 'KOMMANDON',
    availableCommands: 'Tillgängliga kommandon:',
    connect: 'Anslut till en server',
    settings: 'Ändra inställningar',
    clear: 'Rensa skärmen',
    exit: 'Avsluta programmet',
    help: 'Visa denna hjälptext',
    crt: 'Slå på/av CRT-effekten',
    language: 'Byt språk (sv/en/es)',
    newConnection: '[ NY ANSLUTNING ]',
    helpText: "Tryck 'help' för lista på kommandon eller klicka på knappen för att starta.",
    copyright: 'Copyright (c) 2023 ScreammSSH Team - All graphics are created using ASCII characters',
    connecting: 'Ansluter...',
    exiting: 'Avslutar...',
    commandNotFound: "Kommandot '{command}' hittades inte. Skriv 'help' för att se tillgängliga kommandon.",
    crtEnabled: 'CRT-effekt aktiverad',
    crtDisabled: 'CRT-effekt avstängd',
    languageChanged: 'Språk ändrat till: {language}',
    openingSettings: 'Öppnar inställningar...',
    startingShell: 'Startar shell...',
    shellStarted: 'Shell har startats. Du kan nu köra systemkommandon.',
    shellError: 'Fel vid start av shell: {error}',
    shellDisconnected: 'Shell avslutades med kod {code}'
  },
  en: {
    welcome: 'Welcome to ScreammSSH Terminal',
    description: 'This is a modern SSH/SFTP client with retro feel',
    information: 'INFORMATION',
    commands: 'COMMANDS',
    availableCommands: 'Available commands:',
    connect: 'Connect to a server',
    settings: 'Change settings',
    clear: 'Clear screen',
    exit: 'Exit the program',
    help: 'Show this help text',
    crt: 'Toggle CRT effect',
    language: 'Change language (sv/en/es)',
    newConnection: '[ NEW CONNECTION ]',
    helpText: "Type 'help' for a list of commands or click the button to start.",
    copyright: 'Copyright (c) 2023 ScreammSSH Team - All graphics are created using ASCII characters',
    connecting: 'Connecting...',
    exiting: 'Exiting...',
    commandNotFound: "Command '{command}' not found. Type 'help' to see available commands.",
    crtEnabled: 'CRT effect enabled',
    crtDisabled: 'CRT effect disabled',
    languageChanged: 'Language changed to: {language}',
    openingSettings: 'Opening settings...',
    startingShell: 'Starting shell...',
    shellStarted: 'Shell started. You can now run system commands.',
    shellError: 'Error starting shell: {error}',
    shellDisconnected: 'Shell exited with code {code}'
  },
  es: {
    welcome: 'Bienvenido a ScreammSSH Terminal',
    description: 'Este es un cliente SSH/SFTP moderno con sensación retro',
    information: 'INFORMACIÓN',
    commands: 'COMANDOS',
    availableCommands: 'Comandos disponibles:',
    connect: 'Conectar a un servidor',
    settings: 'Cambiar configuración',
    clear: 'Limpiar pantalla',
    exit: 'Salir del programa',
    help: 'Mostrar este texto de ayuda',
    crt: 'Activar/desactivar efecto CRT',
    language: 'Cambiar idioma (sv/en/es)',
    newConnection: '[ NUEVA CONEXIÓN ]',
    helpText: "Escribe 'help' para ver la lista de comandos o haz clic en el botón para comenzar.",
    copyright: 'Copyright (c) 2023 ScreammSSH Team - Todos los gráficos están creados usando caracteres ASCII',
    connecting: 'Conectando...',
    exiting: 'Saliendo...',
    commandNotFound: "Comando '{command}' no encontrado. Escribe 'help' para ver los comandos disponibles.",
    crtEnabled: 'Efecto CRT activado',
    crtDisabled: 'Efecto CRT desactivado',
    languageChanged: 'Idioma cambiado a: {language}',
    openingSettings: 'Abriendo configuración...',
    startingShell: 'Iniciando shell...',
    shellStarted: 'Shell iniciado. Ahora puedes ejecutar comandos del sistema.',
    shellError: 'Error al iniciar shell: {error}',
    shellDisconnected: 'Shell terminó con código {code}'
  }
};

// Hjälpfunktion för att få plattformsspecifika kommandon
const getOsCommands = () => {
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  
  return {
    // Grundläggande kommandon
    listFiles: isWindows ? 'dir' : 'ls -la',
    showCurrentDir: isWindows ? 'cd' : 'pwd',
    clearScreen: isWindows ? 'cls' : 'clear',
    changeDir: isWindows ? 'cd' : 'cd',
    makeDir: isWindows ? 'mkdir' : 'mkdir',
    removeDir: isWindows ? 'rmdir' : 'rmdir',
    removeFile: isWindows ? 'del' : 'rm',
    copyFile: isWindows ? 'copy' : 'cp',
    moveFile: isWindows ? 'move' : 'mv',
    findFile: isWindows ? 'where' : 'which',
    findInFiles: isWindows ? 'findstr' : 'grep',
    processInfo: isWindows ? 'tasklist' : 'ps aux',
    killProcess: isWindows ? 'taskkill /PID' : 'kill',
    
    // Systeminformation
    systemInfo: isWindows 
      ? [
          'echo "** System Information **"',
          'echo Current system: Windows && ver',
          'echo Current user: %USERNAME%',
          'echo Computer name: %COMPUTERNAME%',
          'echo Current directory: && cd',
          'systeminfo | findstr /B /C:"OS" /C:"System Type" /C:"Total Physical Memory"'
        ]
      : isMac
        ? [
            'echo "** System Information **"',
            'echo "Current system:" && sw_vers',
            'echo "Current user: $USER"',
            'echo "Computer name: $(hostname)"',
            'echo "Current directory:" && pwd',
            'sysctl -n hw.model && system_profiler SPHardwareDataType | grep Memory'
          ]
        : [
            'echo "** System Information **"',
            'echo "Current system:" && uname -a',
            'echo "Current user: $USER"',
            'echo "Computer name: $(hostname)"',
            'echo "Current directory:" && pwd',
            'cat /etc/os-release 2>/dev/null || lsb_release -a 2>/dev/null'
          ],
        
    // Nätverksinformation
    networkInfo: isWindows
      ? [
          'echo "** Network Information **"',
          'ipconfig | findstr IPv4',
          'echo "Host name: %COMPUTERNAME%"',
          'echo "Network connections:"',
          'netstat -an | findstr ESTABLISHED | findstr TCP'
        ]
      : [
          'echo "** Network Information **"',
          'ifconfig 2>/dev/null || ip addr',
          'echo "Host name: $(hostname)"',
          'echo "Network connections:"',
          'netstat -an 2>/dev/null | grep ESTABLISHED | grep tcp || ss -t'
        ],
    
    // Disk information
    diskInfo: isWindows
      ? [
          'echo "** Disk Information **"',
          'wmic logicaldisk get caption,description,freespace,size',
          'echo "Current disk usage:"',
          'dir /-C'
        ]
      : [
          'echo "** Disk Information **"',
          'df -h',
          'echo "Current disk usage:"',
          'du -sh .'
        ],
        
    // Formatterade outputs
    successMsg: (msg: string) => isWindows
      ? `echo [SUCCESS] ${msg}`
      : `echo -e "\\033[0;32m[SUCCESS]\\033[0m ${msg}"`,
      
    errorMsg: (msg: string) => isWindows
      ? `echo [ERROR] ${msg}`
      : `echo -e "\\033[0;31m[ERROR]\\033[0m ${msg}"`,
      
    infoMsg: (msg: string) => isWindows
      ? `echo [INFO] ${msg}`
      : `echo -e "\\033[0;34m[INFO]\\033[0m ${msg}"`,
    
    warningMsg: (msg: string) => isWindows
      ? `echo [WARNING] ${msg}`
      : `echo -e "\\033[0;33m[WARNING]\\033[0m ${msg}"`,
    
    // Mappkontroll
    checkDirExists: (dir: string) => isWindows
      ? `if exist "${dir}\\*" (echo true) else (echo false)`
      : `if [ -d "${dir}" ]; then echo true; else echo false; fi`,
    
    checkFileExists: (file: string) => isWindows
      ? `if exist "${file}" (echo true) else (echo false)`
      : `if [ -f "${file}" ]; then echo true; else echo false; fi`,

    helpCommands: isWindows
      ? [
          'echo "Tillgängliga kommandon:"',
          'echo "  dir              - Lista filer"',
          'echo "  cd [dir]         - Visa/byt katalog"',
          'echo "  cls              - Rensa skärmen"',
          'echo "  mkdir [dir]      - Skapa katalog"',
          'echo "  rmdir [dir]      - Ta bort katalog"',
          'echo "  del [file]       - Ta bort fil"',
          'echo "  copy [src] [dst] - Kopiera fil"',
          'echo "  move [src] [dst] - Flytta fil"',
          'echo "  tasklist         - Visa processer"',
          'echo "  netstat -an      - Visa nätverksanslutningar"',
          'echo "  ipconfig         - Visa nätverksinformation"',
          'echo "  systeminfo       - Visa systeminformation"'
        ]
      : [
          'echo "Tillgängliga kommandon:"',
          'echo "  ls               - Lista filer"',
          'echo "  pwd              - Visa aktuell katalog"',
          'echo "  cd [dir]         - Byt katalog"',
          'echo "  clear            - Rensa skärmen"',
          'echo "  mkdir [dir]      - Skapa katalog"',
          'echo "  rmdir [dir]      - Ta bort katalog"',
          'echo "  rm [file]        - Ta bort fil"',
          'echo "  cp [src] [dst]   - Kopiera fil"',
          'echo "  mv [src] [dst]   - Flytta fil"',
          'echo "  ps aux           - Visa processer"',
          'echo "  netstat -an      - Visa nätverksanslutningar"',
          'echo "  ifconfig/ip addr - Visa nätverksinformation"',
          'echo "  uname -a         - Visa systeminformation"'
        ]
  };
};

const AsciiWelcome: React.FC<AsciiWelcomeProps> = ({ onConnect, currentTheme, language = 'sv' }) => {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [command, setCommand] = useState<string>('');
  const [showCursor, setShowCursor] = useState<boolean>(true);
  const [retroEffect, setRetroEffect] = useState<boolean>(true);
  const [currentLanguage, setCurrentLanguage] = useState<string>(language);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [shellActive, setShellActive] = useState<boolean>(false);
  const [shellSessionId, setShellSessionId] = useState<string | null>(null);
  const [shellStatus, setShellStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [showSshManager, setShowSshManager] = useState(false);
  const [activeSSHSession, setActiveSSHSession] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(currentTheme);
  
  // För att undvika race conditions vid autostart
  const shellStartDelay = 1000 + Math.random() * 500;
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const promptText = shellActive ? '>' : '$';
  
  // Översättningsfunktion
  const t = (key: string, replacements?: Record<string, string>) => {
    // Välj översättningsblock baserat på språk
    const translationBlock = translations[currentLanguage as keyof typeof translations] || translations.sv;
    
    // Hämta texten med fallback till svenska
    let text = (translationBlock as any)[key] || (translations.sv as any)[key] || `[${key}]`;
    
    // Ersätt platshållare om det finns
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(`{${placeholder}}`, value);
      });
    }
    
    return text;
  };
  
  // Definiera updateHelpText 
  const updateHelpText = () => {
    const commands = getOsCommands();
    setTerminalOutput(prev => [
      ...prev,
      t('availableCommands'),
      '',
      `connect  - ${t('connect')}`,
      `settings - ${t('settings')}`,
      `${commands.clearScreen}    - ${t('clear')}`,
      `exit     - ${t('exit')}`,
      `help     - ${t('help')}`,
      `crt      - ${t('crt')}`,
      `language - ${t('language')}`,
      `shell    - ${t('startingShell')}`,
      `network  - ${t('network')}`,
      ''
    ]);
  };

  // Funktion för att hantera shell-fel och återanslutning
  const handleShellError = (error: Error) => {
    console.error('Shell error:', error);
    setShellStatus('error');
    setErrorMessage(error.message);
    
    // Logga felet i terminal
    setTerminalOutput(prev => [
      ...prev,
      `${t('shellError', { error: error.message })}`,
      t('tryingToReconnect'),
      ''
    ]);
    
    // Öka antalet återanslutningsförsök
    setConnectionAttempts(prev => prev + 1);
    
    // Rensa shell-session
    setShellActive(false);
    setShellSessionId(null);
    
    // Försök återansluta om vi inte försökt för många gånger
    if (connectionAttempts < 3) {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, t('reconnecting')]);
        autoStartShell();
      }, 2000);
    } else {
      setTerminalOutput(prev => [
        ...prev, 
        t('reconnectFailed'),
        t('manualRestart')
      ]);
    }
  };
  
  // Funktion för att starta shell-sessionen
  const autoStartShell = async () => {
    try {
      // Om vi redan har en aktiv session, avsluta istället
      if (shellActive && shellSessionId) {
        setTerminalOutput(prev => [...prev, t('shellAlreadyActive'), '']);
        return;
      }
      
      // Uppdatera status
      setShellStatus('connecting');
      setErrorMessage(null);
      
      // Testa först IPC med en enkel ping-pong för att se om kommunikationen fungerar
      try {
        console.log("Testar IPC-kommunikation...");
        setTerminalOutput(prev => [...prev, t('testingIpc')]);
        
        const pingResult = await window.electronAPI.ping();
        console.log("Ping-resultat:", pingResult);
        setTerminalOutput(prev => [...prev, `${t('ipcTestOk')}: ${pingResult}`, '']);
      } catch (error) {
        console.error("IPC ping misslyckades:", error);
        setTerminalOutput(prev => [
          ...prev, 
          t('ipcError'),
          `${t('technicalError')}: ${(error as Error).message}`,
          t('shellError'),
          '-----------------------------------------------',
          t('continueAnyway'),
          ''
        ]);
        // Vi fortsätter ändå och försöker skapa shell-sessionen
      }
      
      console.log("Försöker skapa shell-session...");
      setTerminalOutput(prev => [...prev, t('creatingShell')]);
      
      // Försök skapa shell-sessionen
      try {
        const result = await window.electronAPI.shellCreate();
        console.log("Shell create resultat:", result);
        
        if (result && result.success && result.id) {
          setShellSessionId(result.id);
          setShellActive(true);
          setShellStatus('connected');
          setConnectionAttempts(0); // Återställ anslutningsförsök vid framgång
          setTerminalOutput(prev => [...prev, t('shellStarted'), '']);
          
          // Hämta OS-specifika kommandon
          const commands = getOsCommands();
          
          // Vänta lite innan vi kör initialiseringskommandon
          setTimeout(async () => {
            try {
              if (result.id) {
                // Visa systeminfo med plattformsspecifika kommandon
                for (const cmd of commands.systemInfo) {
                  await window.electronAPI.shellExecute(result.id, cmd);
                  // Lägg in liten paus för att inte överlasta shell
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Visa en tom rad i slutet
                await window.electronAPI.shellExecute(result.id, 'echo ""');
                
                // Visa en välkomsthälsning
                await window.electronAPI.shellExecute(result.id, commands.successMsg(t('shellReady')));
              }
            } catch (error) {
              console.error('Fel vid initialisering av shell:', error);
              setTerminalOutput(prev => [...prev, `${t('initError')}: ${(error as Error).message}`, '']);
            }
          }, 500);
        } else {
          const errorMsg = result?.error || t('unknownError');
          console.error('Shell-creation misslyckades:', errorMsg);
          setShellStatus('error');
          setErrorMessage(errorMsg);
          setTerminalOutput(prev => [
            ...prev, 
            t('shellCreationError'), 
            errorMsg,
            '',
            t('tryDevTools'),
            ''
          ]);
        }
      } catch (error) {
        console.error('Fel vid shellCreate:', error);
        setShellStatus('error');
        setErrorMessage((error as Error).message);
        setTerminalOutput(prev => [
          ...prev, 
          t('shellCreationError'), 
          (error as Error).message,
          '',
          t('tryDevTools'),
          ''
        ]);
        
        // Försök återansluta automatiskt
        handleShellError(error as Error);
      }
    } catch (error) {
      console.error('Fel vid autostart av shell:', error);
      setShellStatus('error');
      setErrorMessage((error as Error).message);
      setTerminalOutput(prev => [...prev, `${t('shellAutoStartError')}: ${(error as Error).message}`, '']);
      
      // Försök återansluta automatiskt
      handleShellError(error as Error);
    }
  };
  
  // Shell-statusindikator
  const getShellStatusIndicator = () => {
    switch(shellStatus) {
      case 'connected':
        return <span className="status-connected">{t('connected')}</span>;
      case 'connecting':
        return <span className="status-connecting">{t('connecting')}...</span>;
      case 'error':
        return <span className="status-error" title={errorMessage || ''}>{t('error')}</span>;
      default:
        return <span className="status-idle">{t('idle')}</span>;
    }
  };
  
  useEffect(() => {
    // Ladda terminalinställningar
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getSettings();
        if (settings && settings.terminal) {
          setRetroEffect(settings.terminal.retroEffect);
          // Tillämpa effekten på dokumentet vid inladdning
          document.documentElement.setAttribute('data-crt-effect', settings.terminal.retroEffect ? 'on' : 'off');
        }
      } catch (error) {
        console.error('Kunde inte ladda terminalinställningar:', error);
      }
    };
    
    loadSettings();
    
    // Fokusera på terminalen när komponenten monteras
    document.addEventListener('keydown', handleKeyDown);
    
    // Aktivera blinkande cursor
    const cursorInterval = setInterval(() => {
      setShowCursor(prevShowCursor => !prevShowCursor);
    }, 600);
    
    // Starta shell automatiskt vid appstart, men bara om ingen shell redan körs
    // Lägg till en random fördröjning för att undvika race conditions vid hot-reload
    const autoStartTimer = setTimeout(() => {
      // Kolla om shell är aktivt innan vi startar en ny
      if (!shellActive && !shellSessionId) {
        autoStartShell();
      }
    }, shellStartDelay);
    
    // Sätt upp lyssnare för shell-output
    const removeShellOutputListener = window.electronAPI.onShellOutput((data) => {
      console.log("Shell output:", data);  // Felsökningslogg
      
      if (data.output) {
        // Dela upp output på radbrytningar och lägg till varje rad
        const lines = data.output.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          setTerminalOutput(prev => [...prev, ...lines]);
        }
      }
      
      if (data.error) {
        // Dela upp error på radbrytningar och lägg till varje rad (i rött senare)
        const lines = data.error.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          setTerminalOutput(prev => [...prev, ...lines]);
        }
      }
    });
    
    // Sätt upp lyssnare för shell-error
    const removeShellErrorListener = window.electronAPI.onShellError((data) => {
      setTerminalOutput(prev => [...prev, t('shellError', { error: data.error })]);
    });
    
    // Sätt upp lyssnare för shell-exit
    const removeShellExitListener = window.electronAPI.onShellExit((data) => {
      setTerminalOutput(prev => [...prev, t('shellDisconnected', { code: data.code.toString() })]);
      setShellActive(false);
      setShellSessionId(null);
    });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(cursorInterval);
      clearTimeout(autoStartTimer); // Glöm inte stoppa timern
      
      // Ta bort lyssnare
      if (removeShellOutputListener) removeShellOutputListener();
      if (removeShellErrorListener) removeShellErrorListener();
      if (removeShellExitListener) removeShellExitListener();
      
      // Avsluta shell om det finns
      if (shellSessionId) {
        window.electronAPI.shellTerminate(shellSessionId)
          .catch(error => console.error('Kunde inte avsluta shell:', error));
      }
    };
  }, []);
  
  // Uppdatera terminaloutput när språket ändras
  useEffect(() => {
    // Behåll alla terminalrader efter språkändring men uppdatera välkomstmeddelandet om shell ännu inte är aktivt
    if (!shellActive) {
      const commands = getOsCommands();
      setTerminalOutput([
        t('welcome'),
        t('startingShell'),
        '',
        t('availableCommands'),
        `- ${commands.listFiles} (${t('listFiles')})`,
        '- cd (byta katalog)',
        `- ${commands.showCurrentDir} (${t('showCurrentDir')})`,
        '- exit (stänga shell-sessionen)',
        `- ${commands.clearScreen} (${t('clearScreen')})`,
        '- network (visa nätverksinformation)',
        '- help (visa hjälp)',
        ''
      ]);
    }
  }, [currentLanguage, shellActive]);
  
  // Scrolla terminalen till botten när output ändras
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLDocument> | any) => {
    // Förhindra standardfunktioner för vissa tangenter
    if (['ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
    
    // Hantera specialtangenter
    switch (e.key) {
      case 'Enter':
        executeCommand();
        break;
      case 'Backspace':
        setCommand(prev => prev.slice(0, -1));
        break;
      case 'Escape':
        setCommand('');
        break;
      case 'ArrowUp':
        navigateHistory(-1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        navigateHistory(1);
        e.preventDefault();
        break;
      case 'Tab':
        // Implementera auto-complete senare
        e.preventDefault();
        break;
      default:
        // Lägg till tecknet till command om det är ett enskilt tecken
        if (e.key.length === 1) {
          setCommand(prev => prev + e.key);
        }
    }
  };
  
  const navigateHistory = (direction: number) => {
    const newIndex = historyIndex + direction;
    
    if (newIndex >= -1 && newIndex < commandHistory.length) {
      setHistoryIndex(newIndex);
      
      if (newIndex === -1) {
        setCommand('');
      } else {
        setCommand(commandHistory[newIndex]);
      }
    }
  };
  
  const toggleCRTEffect = (newValue: boolean) => {
    setRetroEffect(newValue);
    
    // Spara inställningen
    try {
      window.electronAPI.saveTerminalSettings({
        retroEffect: newValue,
        cursorBlink: true,
        fontSize: 14
      });
      
      // Ge visuell feedback om ändringen
      setTerminalOutput(prev => [
        ...prev, 
        newValue ? t('crtEnabled') : t('crtDisabled'),
        ''
      ]);
      
      // Tillämpa effekten på dokumentet
      document.documentElement.setAttribute('data-crt-effect', newValue ? 'on' : 'off');
      
    } catch (error) {
      console.error('Kunde inte spara CRT-inställning:', error);
    }
  };
  
  const changeLanguage = (lang: string) => {
    if (['sv', 'en', 'es'].includes(lang)) {
      setCurrentLanguage(lang);
      
      // Spara språkinställning
      try {
        window.electronAPI.saveLanguage(lang);
        return true;
      } catch (error) {
        console.error('Kunde inte spara språkinställning:', error);
      }
    }
    return false;
  };
  
  // Funktion för att rendera terminalrader med ANSI-stöd
  const renderTerminalLine = (line: string, index: number) => {
    if (containsAnsi(line)) {
      return <div key={index} dangerouslySetInnerHTML={{ __html: parseAnsi(line) }} />;
    }
    return <div key={index}>{line}</div>;
  };

  // Hantera SSH-session
  const handleSSHConnect = (sessionId: string) => {
    setActiveSSHSession(sessionId);
    setShowSshManager(false);
    setTerminalOutput(prev => [...prev, t('sshConnected')]);
    
    // Lyssna på SSH-output
    window.electronAPI.onShellOutput((data) => {
      if (data.id === sessionId) {
        if (data.output) {
          setTerminalOutput(prev => [...prev, data.output]);
        }
        if (data.error) {
          setTerminalOutput(prev => [...prev, data.error]);
        }
      }
    });
  };
  
  // SSH-kommandon
  const executeSSHCommand = async (sessionId: string, command: string): Promise<boolean> => {
    if (!sessionId) {
      console.error('Inget aktivt SSH-session-ID');
      return false;
    }
    
    try {
      const result = await window.electronAPI.executeSSHCommand(sessionId, command);
      return !!result;
    } catch (error) {
      console.error('SSH command error:', error);
      return false;
    }
  };
  
  // Uppdatera executeCommand för att hantera SSH-kommandon
  const executeCommand = async () => {
    if (!command.trim()) return;
    
    // Lägg till kommandot i historiken
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(commandHistory.length + 1);
    
    // Rensa nuvarande kommando och visa det i terminalen
    setTerminalOutput(prev => [...prev, `${promptText} ${command}`]);
    setCommand('');
    
    // Konvertera kommandot till lowercase för enklare jämförelse
    const lowerCommand = command.toLowerCase().trim();
    const commandParts = lowerCommand.split(' ');
    const baseCommand = commandParts[0];
    
    // Om vi har en aktiv SSH-session
    if (activeSSHSession) {
      // Lägg till kommandot i historiken och terminalen
      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(commandHistory.length + 1);
      setTerminalOutput(prev => [...prev, `ssh> ${command}`]);
      setCommand('');
      
      // Hantera exit command för SSH speciellt
      if (lowerCommand === 'exit' || lowerCommand === 'quit' || lowerCommand === 'disconnect') {
        try {
          await window.electronAPI.disconnectSSH(activeSSHSession);
          setActiveSSHSession(null);
          setTerminalOutput(prev => [...prev, t('sshDisconnected')]);
        } catch (error) {
          console.error('SSH disconnect error:', error);
          setTerminalOutput(prev => [...prev, `${t('sshDisconnectError')}: ${(error as Error).message}`]);
        }
        return;
      }
      
      // Exekvera SSH-kommandot
      await executeSSHCommand(activeSSHSession, command);
      return;
    }
    
    // Hämta OS-specifika kommandon
    const commands = getOsCommands();
    
    // Hantera SSH-relaterade kommandon
    if (baseCommand === 'ssh') {
      if (commandParts.length === 1) {
        // Visa SSH-hanteraren om ssh anges utan paramterar
        setShowSshManager(true);
        return;
      }
      
      // Kommandot hanteras i switch-satsen under
    }
    
    // Om shell är aktivt, skicka kommandot till shell-sessionen
    if (shellActive && shellSessionId) {
      try {
        console.log(`Skickar kommando till shell: ${command}`);
        
        // Hantera specialkommandon
        switch (baseCommand) {
          case 'exit':
          case 'quit':
            setTerminalOutput(prev => [...prev, t('terminatingShell')]);
            await window.electronAPI.shellTerminate(shellSessionId);
            setShellActive(false);
            setShellSessionId(null);
            setShellStatus('idle');
            setTerminalOutput(prev => [...prev, t('shellTerminated'), '']);
            return;
            
          case 'clear':
          case 'cls':
            setTerminalOutput([]);
            await window.electronAPI.shellExecute(shellSessionId, commands.clearScreen);
            return;
            
          case 'help':
          case '?':
            setTerminalOutput(prev => [...prev, t('helpTitle')]);
            for (const helpLine of commands.helpCommands) {
              await window.electronAPI.shellExecute(shellSessionId, helpLine);
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            return;
            
          case 'restart':
          case 'respawn':
            setTerminalOutput(prev => [...prev, t('restartingShell')]);
            // Avsluta nuvarande session och starta en ny
            try {
              await window.electronAPI.shellTerminate(shellSessionId);
            } catch (error) {
              console.error('Fel vid avslut av shell för omstart:', error);
            }
            setShellActive(false);
            setShellSessionId(null);
            await autoStartShell();
            return;
            
          case 'system':
          case 'sysinfo':
            setTerminalOutput(prev => [...prev, t('systemInfo')]);
            for (const cmd of commands.systemInfo) {
              await window.electronAPI.shellExecute(shellSessionId, cmd);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
            
          case 'network':
          case 'net':
          case 'ifconfig':
          case 'ipconfig':
            setTerminalOutput(prev => [...prev, t('networkInfo')]);
            for (const cmd of commands.networkInfo) {
              await window.electronAPI.shellExecute(shellSessionId, cmd);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
            
          case 'disk':
          case 'storage':
          case 'df':
            setTerminalOutput(prev => [...prev, t('diskInfo')]);
            for (const cmd of commands.diskInfo) {
              await window.electronAPI.shellExecute(shellSessionId, cmd);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
            
          case 'theme':
            if (commandParts.length > 1) {
              const themeArg = commandParts[1];
              if (['light', 'dark', 'matrix', 'blue'].includes(themeArg)) {
                setTerminalOutput(prev => [...prev, t('changingTheme', { theme: themeArg })]);
                setTheme(themeArg as Theme);
                try {
                  // Skapa ett CustomTheme-objekt
                  const customTheme: CustomTheme = {
                    id: themeArg,
                    name: themeArg,
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
                  await window.electronAPI.saveTheme(customTheme);
                } catch (error) {
                  console.error('Kunde inte spara tema:', error);
                }
                return;
              }
            }
            setTerminalOutput(prev => [...prev, t('availableThemes')]);
            await window.electronAPI.shellExecute(shellSessionId, 'echo "  light, dark, matrix, blue"');
            return;
            
          case 'language':
          case 'lang':
            if (commandParts.length > 1) {
              const langArg = commandParts[1];
              if (['sv', 'en', 'es'].includes(langArg)) {
                setTerminalOutput(prev => [...prev, t('changingLanguage', { language: langArg })]);
                if (changeLanguage(langArg)) {
                  return;
                }
              }
            }
            setTerminalOutput(prev => [...prev, t('availableLanguages')]);
            await window.electronAPI.shellExecute(shellSessionId, 'echo "  sv, en, es"');
            return;
            
          case 'crt':
          case 'effect':
            if (commandParts.length > 1) {
              const value = commandParts[1];
              if (['on', 'off', 'toggle'].includes(value)) {
                const newValue = value === 'toggle' 
                  ? !(document.documentElement.getAttribute('data-crt-effect') === 'on')
                  : value === 'on';
                toggleCRTEffect(newValue);
                return;
              }
            }
            setTerminalOutput(prev => [...prev, t('crtEffectUsage')]);
            return;
            
          case 'ssh':
            if (commandParts.length >= 3) {
              // Format: ssh username@host password
              const sshTarget = commandParts[1];
              if (sshTarget.includes('@')) {
                const [username, host] = sshTarget.split('@');
                setTerminalOutput(prev => [...prev, t('connectingSSH', { host })]);
                
                try {
                  const success = await window.electronAPI.connectSSH({
                    id: 'temp',
                    name: `${username}@${host}`,
                    host,
                    username,
                    port: parseInt(commandParts[2]) || 22,
                    password: commandParts[3]
                  });
                  
                  if (success) {
                    setActiveSSHSession('temp');
                    setTerminalOutput(prev => [...prev, t('sshConnected', { host })]);
                    
                    // Lyssna på SSH-output
                    window.electronAPI.onShellOutput((data) => {
                      if (data.id === 'temp') {
                        if (data.output) {
                          setTerminalOutput(prev => [...prev, data.output]);
                        }
                        if (data.error) {
                          setTerminalOutput(prev => [...prev, data.error]);
                        }
                      }
                    });
                  } else {
                    setTerminalOutput(prev => [...prev, t('sshConnectionFailed')]);
                  }
                } catch (error) {
                  console.error('SSH connection error:', error);
                  setTerminalOutput(prev => [...prev, `${t('sshConnectionError')}: ${(error as Error).message}`]);
                }
                return;
              }
            } else if (commandParts.length === 1) {
              // Visa SSH-hanteraren om ssh anges utan paramterar
              setShowSshManager(true);
              return;
            }
            setTerminalOutput(prev => [...prev, t('sshUsage')]);
            return;
            
          // OS-specifika kommandoöversättningar
          case 'ls':
            if (process.platform === 'win32') {
              await window.electronAPI.shellExecute(shellSessionId, commands.listFiles);
              return;
            }
            break;
            
          case 'dir':
            if (process.platform !== 'win32') {
              await window.electronAPI.shellExecute(shellSessionId, commands.listFiles);
              return;
            }
            break;
            
          case 'pwd':
            if (process.platform === 'win32') {
              await window.electronAPI.shellExecute(shellSessionId, commands.showCurrentDir);
              return;
            }
            break;
            
          default:
            break;
        }
        
        // För alla andra kommandon, skicka direkt till shell
        await window.electronAPI.shellExecute(shellSessionId, command);
      } catch (error: any) {
        console.error('Fel vid kommandokörning:', error);
        handleShellError(error);
      }
    } else {
      // Om shell inte är aktivt, försök starta det
      if (['shell', 'terminal', 'prompt', 'cmd', 'start'].includes(lowerCommand)) {
        autoStartShell();
      } else {
        setTerminalOutput(prev => [...prev, t('noActiveShell')]);
        setTerminalOutput(prev => [...prev, t('typeShellToStart')]);
      }
    }
  };

  return (
    <div className={`ascii-welcome ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-logo">
        {/* Extremt simpel pixelstil som matchar skärmdumpen */}
        <pre>{`
  ███████╗ ██████╗██████╗ ███████╗ █████╗ ███╗   ███╗███╗   ███╗███████╗███████╗██╗  ██╗
  ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗████╗ ████║████╗ ████║██╔════╝██╔════╝██║  ██║
  ███████╗██║     ██████╔╝█████╗  ███████║██╔████╔██║██╔████╔██║███████╗███████╗███████║
  ╚════██║██║     ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║╚════██║╚════██║██╔══██║
  ███████║╚██████╗██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████║███████║██║  ██║
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
        `}</pre>
      </div>
      
      <div className="ascii-welcome-text">{t('welcome')}</div>
      
      <div className={`ascii-terminal ${retroEffect ? 'crt-effect' : ''}`} ref={terminalRef}>
        {terminalOutput.map((line, index) => {
          // Identifiera speciella meddelanden och färgkoda dem
          let className = "terminal-line";
          
          if (line.includes('ERROR') || line.includes('FEL') || line.includes('error') || line.includes('fel')) {
            className += " error";
          } else if (line.includes('WARNING') || line.includes('VARNING') || line.includes('warning') || line.includes('varning')) {
            className += " warning";
          } else if (line.includes('SUCCESS') || line.includes('LYCKADES') || line.includes('success') || line.includes('lyckades')) {
            className += " success";
          } else if (line.startsWith('$') || line.startsWith('>') || line.includes('SYSTEM') || line.includes('System')) {
            className += " system";
          }
          
          return <div key={index} className={className}>{line}</div>;
        })}
        
        <div className="ascii-prompt">
          <span className="ascii-prompt-char">{promptText}</span> {command}
          {showCursor && <span className="ascii-cursor"></span>}
        </div>
        
        {/* Visa historikindikator om vi navigerar i historiken */}
        {historyIndex >= 0 && (
          <div className="history-indicator">
            {`${historyIndex + 1}/${commandHistory.length}`}
          </div>
        )}
      </div>
      
      <button 
        className="ascii-button primary"
        onClick={onConnect}
        aria-label={t('newConnection')}
      >
        [ {t('newConnection')} ]
      </button>
      
      <div className="ascii-help-text">
        {t('press')} <kbd>ENTER</kbd> {t('execute')} | <kbd>ESC</kbd> {t('clear')} | <kbd>↑</kbd><kbd>↓</kbd> {t('history')}
      </div>
      
      <div className="ascii-version">
        {t('version')} v1.0.0 | {t('copyright')}
      </div>
      
      <div className="ascii-status">
        {getShellStatusIndicator()}
      </div>
      
      {showSshManager ? (
        <SSHConnectionManager
          onConnect={handleSSHConnect}
          onCancel={() => setShowSshManager(false)}
          language={currentLanguage}
        />
      ) : (
        <>
          <div className="terminal-header">
            <div className="terminal-title">
              {activeSSHSession 
                ? `SSH Session ${currentLanguage === 'sv' ? 'Aktiv' : 'Active'}`
                : shellActive 
                  ? `Shell ${currentLanguage === 'sv' ? 'Aktiv' : 'Active'}`
                  : `ScreammSSH ${currentLanguage === 'sv' ? 'Terminal' : 'Terminal'}`}
            </div>
            <div className="terminal-controls">
              {getShellStatusIndicator()}
            </div>
          </div>
          
          <div className="terminal-container" ref={terminalRef}>
            <div className="terminal-output">
              {terminalOutput.map((line, index) => renderTerminalLine(line, index))}
            </div>
            <div className="terminal-input-container">
              <span className="prompt-text">
                {activeSSHSession ? 'ssh> ' : promptText}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="terminal-input"
                autoFocus
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AsciiWelcome;