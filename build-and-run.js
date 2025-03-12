// Skript för att bygga och starta appen i produktionsläge
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🚀 Bygger och startar ScreammSSH i produktionsläge...');

// Rensa tidigare byggen
console.log('🧹 Rensar tidigare byggen...');
const webpackDir = path.join(__dirname, '.webpack');
if (fs.existsSync(webpackDir)) {
  fs.rmSync(webpackDir, { recursive: true, force: true });
}

// Använd rätt kommando beroende på operativsystem
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Skapa main-process katalogen
console.log('📁 Skapar main-katalogen...');
const mainDir = path.join(__dirname, '.webpack', 'main');
if (!fs.existsSync(mainDir)) {
  fs.mkdirSync(mainDir, { recursive: true });
}

// Skapa ett preload-skript
console.log('📝 Skapar preload.js...');
const preloadJsContent = `
// Preload-skript för att exponera API:er till renderer-processen
const { contextBridge, ipcRenderer } = require('electron');

// Logga preload-script start för debugging
console.log('Preload-skript börjar laddas...');

// Lägg till en global felhanterare i preload-skriptet
process.on('uncaughtException', (error) => {
  console.error('PRELOAD UNCAUGHT EXCEPTION:', error);
});

let settingsPath;
let fs;
let path;
let os;

try {
  // Försök ladda Node.js-moduler
  fs = require('fs');
  path = require('path');
  os = require('os');
  
  // Sökväg till inställningsfilen
  settingsPath = path.join(os.homedir(), '.screammssh-settings.json');
  console.log('Preload: Inställningssökväg initialiserad till', settingsPath);
} catch (error) {
  console.error('Preload: Fel vid laddning av Node.js-moduler:', error.message);
}

// Ladda inställningar
const loadSettings = () => {
  try {
    if (fs && path && os && fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      console.log('Preload: Inställningar laddade från disk');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Preload: Fel vid laddning av inställningar:', error);
  }
  
  console.log('Preload: Använder standardinställningar');
  return {
    theme: 'classic-green',
    language: 'sv',
    terminalSettings: {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    },
    customThemes: []
  };
};

// Spara inställningar
const saveSettings = (settings) => {
  try {
    if (fs && path && os) {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('Preload: Inställningar sparade till disk');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Preload: Fel vid sparande av inställningar:', error);
    return false;
  }
};

// Hämta aktuella inställningar
let settings;
try {
  settings = loadSettings();
  console.log('Preload: Inställningar initialiserade');
} catch (error) {
  console.error('Preload: Kunde inte initialisera inställningar:', error);
  settings = {
    theme: 'classic-green',
    language: 'sv',
    terminalSettings: {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    },
    customThemes: []
  };
}

// Exponera API:er till renderer-processen
try {
  console.log('Preload: Exponerar electronAPI till renderer-processen...');
  
  contextBridge.exposeInMainWorld('electronAPI', {
    // Tema-funktioner
    getTheme: () => {
      console.log('Preload: getTheme anropad');
      return Promise.resolve(settings.theme || 'classic-green');
    },
    saveTheme: (theme) => {
      console.log('Preload: saveTheme anropad med tema:', theme);
      settings.theme = theme;
      return Promise.resolve(saveSettings(settings));
    },
    
    // Språkfunktioner
    getLanguage: () => {
      console.log('Preload: getLanguage anropad');
      return Promise.resolve(settings.language || 'sv');
    },
    saveLanguage: (lang) => {
      console.log('Preload: saveLanguage anropad med språk:', lang);
      settings.language = lang;
      return Promise.resolve(saveSettings(settings));
    },
    
    // Terminal-inställningar
    getTerminalSettings: () => {
      console.log('Preload: getTerminalSettings anropad');
      return Promise.resolve(settings.terminalSettings || { 
        retroEffect: true, 
        cursorBlink: true, 
        fontSize: 14 
      });
    },
    saveTerminalSettings: (terminalSettings) => {
      console.log('Preload: saveTerminalSettings anropad med:', terminalSettings);
      settings.terminalSettings = terminalSettings;
      return Promise.resolve(saveSettings(settings));
    },
    
    // Anpassade teman
    getCustomThemes: () => {
      console.log('Preload: getCustomThemes anropad');
      return Promise.resolve(settings.customThemes || []);
    },
    saveCustomTheme: (name, colors) => {
      console.log('Preload: saveCustomTheme anropad för tema:', name);
      if (!settings.customThemes) settings.customThemes = [];
      
      // Kontrollera om temat redan finns
      const existingThemeIndex = settings.customThemes.findIndex(t => t.name === name);
      if (existingThemeIndex >= 0) {
        settings.customThemes[existingThemeIndex].colors = colors;
      } else {
        settings.customThemes.push({ name, colors });
      }
      
      return Promise.resolve(saveSettings(settings));
    },
    deleteCustomTheme: (name) => {
      console.log('Preload: deleteCustomTheme anropad för tema:', name);
      if (settings.customThemes) {
        settings.customThemes = settings.customThemes.filter(t => t.name !== name);
        return Promise.resolve(saveSettings(settings));
      }
      return Promise.resolve(false);
    },
    
    // DEBUG-funktion för att testa om allt fungerar
    ping: () => {
      console.log('Preload: ping anropad');
      return Promise.resolve('pong från preload');
    },
    
    // Shell-funktioner (mock för test)
    shellCreate: () => {
      console.log('Preload: shellCreate anropad');
      return Promise.resolve({ success: true, id: 'dummy-id' });
    },
    shellExecute: (id, command) => {
      console.log('Preload: shellExecute anropad med kommando:', command);
      return Promise.resolve({ success: true });
    },
    shellTerminate: (id) => {
      console.log('Preload: shellTerminate anropad för id:', id);
      return Promise.resolve({ success: true });
    },
    
    // Event-lyssnare
    onShellOutput: (callback) => {
      console.log('Preload: onShellOutput registrerad');
      const removeListener = () => {
        console.log('Preload: onShellOutput avregistrerad');
      };
      setTimeout(() => {
        callback({ output: "Mock shell output - detta är bara för test" });
      }, 1000);
      return removeListener;
    },
    onShellError: (callback) => {
      console.log('Preload: onShellError registrerad');
      const removeListener = () => {
        console.log('Preload: onShellError avregistrerad');
      };
      return removeListener;
    },
    onShellExit: (callback) => {
      console.log('Preload: onShellExit registrerad');
      const removeListener = () => {
        console.log('Preload: onShellExit avregistrerad');
      };
      return removeListener;
    },
    
    // SSH-funktioner (mock för test)
    sshConnect: (connection) => {
      console.log('Preload: sshConnect anropad för host:', connection.host);
      return Promise.resolve({ success: true, sessionId: 'dummy-ssh-id' });
    },
    sshExecute: (id, command) => {
      console.log('Preload: sshExecute anropad med kommando:', command);
      return Promise.resolve({ success: true });
    },
    sshDisconnect: (id) => {
      console.log('Preload: sshDisconnect anropad för id:', id);
      return Promise.resolve({ success: true });
    },
    onSshOutput: (callback) => {
      console.log('Preload: onSshOutput registrerad');
      const removeListener = () => {
        console.log('Preload: onSshOutput avregistrerad');
      };
      return removeListener;
    }
  });
  
  console.log('Preload: electronAPI exponerad framgångsrikt');
} catch (error) {
  console.error('Preload: Fel vid exponering av API till renderer-processen:', error);
}

console.log('Preload-skript fullständigt laddat');
`;

const preloadJsPath = path.join(mainDir, 'preload.js');
fs.writeFileSync(preloadJsPath, preloadJsContent);

// Skapa en enkel main.js-fil direkt utan webpack
console.log('📝 Skapar main.js...');
const mainJsContent = `
// Detta är en enkel bootstrapper för Electron main-processen
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');

// Aktivera utvecklingsläge för att kunna se felsökningsdetaljer
process.env.NODE_ENV = 'development';

// Skriv ut diagnostikinformation
console.log('Electron main process startar');
console.log('Arbetskatalog: ' + process.cwd());
console.log('Electron version: ' + process.versions.electron);
console.log('Node version: ' + process.versions.node);

// Håll en global referens till fönsterobjektet
let mainWindow;

// Felhantering för okontrollerade fel
process.on('uncaughtException', (error) => {
  console.error('OKONTROLLERAT FEL:', error);
});

// Felhantering för Promise-fel
process.on('unhandledRejection', (reason, promise) => {
  console.error('OHANTERAT PROMISE-FEL:', reason);
});

function createWindow() {
  console.log('Skapar huvudfönster...');
  
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Absolut sökväg till preload-skript:', preloadPath);
  
  // Kontrollera om preload-skriptet existerar
  const preloadExists = fs.existsSync(preloadPath);
  console.log('Preload-skript existerar:', preloadExists);
  
  if (!preloadExists) {
    console.error('VARNING: Preload-skriptet kunde inte hittas!');
  } else {
    // Visa content för preload-skriptet
    try {
      const preloadContent = fs.readFileSync(preloadPath, 'utf8');
      console.log('Preload-skript storlek:', preloadContent.length, 'tecken');
      console.log('Preload-skript första 100 tecken:', preloadContent.slice(0, 100).replace(/\\n/g, ' '));
    } catch (err) {
      console.error('Kunde inte läsa preload-skript:', err);
    }
  }
  
  // Skapa webbläsarfönstret
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Visa inte förrän innehållet är laddat
    webPreferences: {
      nodeIntegration: false, // Inaktiverad för säkerheten
      contextIsolation: true, // Aktiverad för säkerheten
      preload: preloadPath,
      webSecurity: false, // Inaktivera för utveckling
      allowRunningInsecureContent: true, // Tillåt för utveckling
      devTools: true, // Säkerställ att DevTools är aktiverade
      sandbox: false // Tillåt Node.js-moduler i preload-skriptet
    }
  });

  // Ladda appen från dev server
  const url = 'http://localhost:3030';
  console.log('Laddar URL: ' + url);
  
  // Lyssna på händelser för att förbättra debug-upplevelsen
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Laddning startar...');
  });
  
  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('Laddning avslutad');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Laddningsfel:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Laddning slutförd! Visar fönster...');
    mainWindow.show();
    
    // Försök skicka ett meddelande till renderer-processen
    try {
      mainWindow.webContents.executeJavaScript(\`
        console.log('Testar kommunikation från main-processen');
        if (window.electronAPI) {
          console.log('electronAPI hittad i fönstret!');
        } else {
          console.error('electronAPI saknas i fönstret!');
        }
      \`);
    } catch (err) {
      console.error('Kunde inte köra JavaScript i renderer:', err);
    }
  });
  
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['log', 'warning', 'error', 'info'];
    console.log(\`[Renderer \${levels[level]}] \${message}\`);
  });
  
  mainWindow.webContents.on('crashed', (event) => {
    console.error('Renderer-processen kraschade!');
  });
  
  mainWindow.on('unresponsive', () => {
    console.error('Fönstret slutade svara!');
  });
  
  // Ladda URL
  mainWindow.loadURL(url);

  // Öppna DevTools automatiskt
  mainWindow.webContents.openDevTools({ mode: 'bottom' });
  
  // Frigör fönsterobjektet när fönstret stängs
  mainWindow.on('closed', function () {
    console.log('Fönster stängt');
    mainWindow = null;
  });
}

// Skapa fönster när Electron är redo
app.whenReady().then(() => {
  console.log('Electron är redo');
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Avsluta appen när alla fönster är stängda
app.on('window-all-closed', function () {
  console.log('Alla fönster stängda');
  if (process.platform !== 'darwin') app.quit();
});

// IPC-händelser
ipcMain.handle('ping', () => {
  console.log('Ping mottaget från renderer-process');
  return 'pong';
});

// Logga alla IPC-anrop för felsökning
const originalHandle = ipcMain.handle;
ipcMain.handle = function(channel, listener) {
  console.log(\`Registrerar IPC-handler för kanal: \${channel}\`);
  return originalHandle.call(ipcMain, channel, async (...args) => {
    console.log(\`IPC \${channel} anropat med argument:\`, args.slice(1));
    try {
      const result = await listener(...args);
      console.log(\`IPC \${channel} returnerar:\`, result);
      return result;
    } catch (error) {
      console.error(\`IPC \${channel} error:\`, error);
      throw error;
    }
  });
};

console.log('Main process initialization klar');
`;

const mainJsPath = path.join(mainDir, 'main.js');
fs.writeFileSync(mainJsPath, mainJsContent);

// Bygg renderer-processen
console.log('🔨 Bygger renderer-processen...');
const buildRenderer = spawn(npxCommand, ['webpack', '--config', 'webpack.renderer.config.js'], {
  stdio: 'inherit'
});

buildRenderer.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Fel vid byggande av renderer-processen');
    process.exit(code);
  }
  
  // Skapa index.html om den inte finns
  const rendererDir = path.join(__dirname, '.webpack', 'renderer');
  const indexPath = path.join(rendererDir, 'index.html');
  
  // Säkerställ att renderer-katalogen existerar
  if (!fs.existsSync(rendererDir)) {
    console.log('📁 Skapar renderer-katalogen...');
    fs.mkdirSync(rendererDir, { recursive: true });
  }
  
  if (!fs.existsSync(indexPath)) {
    console.log('📝 Skapar index.html...');
    const indexContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:*">
  <title>ScreammSSH Terminal - Debug Mode</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      background-color: #001100; /* Terminal grön bakgrund */
      color: #00ff00; /* Terminal grön text */
      font-family: 'Courier New', monospace;
      overflow: hidden;
    }
    #app {
      height: 100%;
      width: 100%;
    }
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 24px;
    }
    .error-container {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.8);
      color: #ff0000;
      padding: 10px;
      border: 1px solid #ff0000;
      max-height: 300px;
      overflow: auto;
      display: none; /* Visas vid fel */
      white-space: pre-wrap;
      font-family: monospace;
      z-index: 9999;
    }
    .debug-console {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      background-color: rgba(0,0,0,0.9);
      color: #00ff00;
      padding: 10px;
      border-top: 1px solid #00ff00;
      overflow: auto;
      font-family: monospace;
      font-size: 12px;
      z-index: 9998;
    }
    .debug-message {
      margin: 2px 0;
    }
    .ascii-logo {
      font-family: monospace;
      white-space: pre;
      color: #00ff00;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .loading-text {
      font-size: 18px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div id="error-container" class="error-container"></div>
  <div id="debug-console" class="debug-console"></div>
  
  <div id="app">
    <div class="loading">
      <div class="ascii-logo">
        <pre>
  ███████╗ ██████╗██████╗ ███████╗ █████╗ ███╗   ███╗███╗   ███╗███████╗███████╗██╗  ██╗
  ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗████╗ ████║████╗ ████║██╔════╝██╔════╝██║  ██║
  ███████╗██║     ██████╔╝█████╗  ███████║██╔████╔██║██╔████╔██║███████╗███████╗███████║
  ╚════██║██║     ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║╚════██║╚════██║██╔══██║
  ███████║╚██████╗██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████║███████║██║  ██║
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
        </pre>
      </div>
      <div class="loading-text">Laddar ScreammSSH... <span id="loading-dots"></span></div>
      <div id="loading-status" style="font-size: 14px; margin-top: 10px; color: #00aa00;"></div>
    </div>
  </div>
  
  <script src="./main.js"></script>
  <script>
    // Animera laddningspunkter
    let dots = 0;
    const loadingDotsElement = document.getElementById('loading-dots');
    setInterval(() => {
      dots = (dots + 1) % 4;
      loadingDotsElement.textContent = '.'.repeat(dots);
    }, 500);
    
    // Lägg till alla konsolloggningar i debug-konsolen
    const debugConsole = document.getElementById('debug-console');
    const errorContainer = document.getElementById('error-container');
    const loadingStatus = document.getElementById('loading-status');
    
    // Spara originalkonsolfunktioner
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    // Skapa anpassad loggning
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      
      const message = document.createElement('div');
      message.className = 'debug-message';
      message.textContent = args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }).join(' ');
      
      debugConsole.appendChild(message);
      debugConsole.scrollTop = debugConsole.scrollHeight;
      
      // Uppdatera även laddningsstatus
      loadingStatus.textContent = args.join(' ');
    };
    
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      
      const message = document.createElement('div');
      message.className = 'debug-message';
      message.style.color = '#ff0000';
      message.textContent = 'ERROR: ' + args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }).join(' ');
      
      debugConsole.appendChild(message);
      debugConsole.scrollTop = debugConsole.scrollHeight;
      
      // Visa även felcontainern
      errorContainer.style.display = 'block';
      errorContainer.textContent = 'ERROR: ' + args.join(' ');
      
      // Uppdatera även laddningsstatus
      loadingStatus.textContent = 'ERROR: ' + args.join(' ');
      loadingStatus.style.color = '#ff0000';
    };
    
    console.warn = function(...args) {
      originalConsoleWarn.apply(console, args);
      
      const message = document.createElement('div');
      message.className = 'debug-message';
      message.style.color = '#ffff00';
      message.textContent = 'WARNING: ' + args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }).join(' ');
      
      debugConsole.appendChild(message);
      debugConsole.scrollTop = debugConsole.scrollHeight;
    };
    
    console.info = function(...args) {
      originalConsoleInfo.apply(console, args);
      
      const message = document.createElement('div');
      message.className = 'debug-message';
      message.style.color = '#00ffff';
      message.textContent = 'INFO: ' + args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }).join(' ');
      
      debugConsole.appendChild(message);
      debugConsole.scrollTop = debugConsole.scrollHeight;
    };
    
    // Definiera globala variabler för att undvika fel
    window.__dirname = '/';
    window.__filename = 'index.html';
    
    // Enkel felsökningsskript
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('JavaScript Error:', message, source, lineno, colno);
      
      errorContainer.style.display = 'block';
      errorContainer.textContent = 'ERROR: ' + message + '\\n' + source + ' (' + lineno + ':' + colno + ')';
      
      if (error && error.stack) {
        errorContainer.textContent += '\\n\\nStack Trace:\\n' + error.stack;
      }
      
      return true;
    };
    
    // Rapportera när körningen har kommit igång
    window.onload = function() {
      console.log('Dokument laddat! Väntar på preload-skript och React initialiseringen...');
    };
    
    // Lägg till kommentarer i laddningsstatus
    setTimeout(() => {
      console.log('Kontrollerar preload-skript...');
      
      if (window.electronAPI) {
        console.log('electronAPI hittad! Anropar getTheme...');
        try {
          window.electronAPI.getTheme()
            .then(theme => console.log('Tema laddat:', theme))
            .catch(err => console.error('Fel vid hämtning av tema:', err));
        } catch (e) {
          console.error('Fel vid anrop av getTheme:', e);
        }
      } else {
        console.error('electronAPI saknas! Preload-skriptet har inte initialiserats korrekt.');
      }
    }, 2000);
    
    setTimeout(() => {
      console.log('Kontrollerar React-initialisering...');
      
      const appElement = document.getElementById('app');
      if (appElement && appElement.children.length > 0 && appElement.innerHTML.includes('Laddar ScreammSSH')) {
        console.warn('React-appen verkar inte ha initialiserats ännu.');
      }
    }, 5000);
  </script>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, indexContent);
  }
  
  // Starta utvecklingsservern
  console.log('🌐 Startar utvecklingsservern...');
  const server = spawn('node', ['dev-server.js'], {
    stdio: 'inherit'
  });
  
  // Starta Electron-appen
  console.log('⚡ Startar Electron-appen...');
  console.log(`📋 Kör Electron med: ${mainJsPath}`);
  
  const electron = spawn(npxCommand, ['electron', mainJsPath], {
    stdio: 'inherit'
  });
  
  electron.on('close', (code) => {
    console.log(`🛑 Electron-appen avslutades med kod ${code}`);
    server.kill();
    process.exit();
  });
});

// Hantera avslut
process.on('SIGINT', () => {
  console.log('👋 Avslutar...');
  process.exit();
});