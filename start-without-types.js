// Skript för att bygga och starta appen utan TypeScript-typkontroll
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Visa hjälp om flaggan --help används
if (process.argv.includes('--help')) {
  console.log(`
  Användning: npm run start-no-types [options]
  
  Alternativ:
    --use-react     Använd React-appen istället för testsidan
    --no-test       Ladda index.html direkt utan testsidan
    --help          Visa denna hjälptext
  `);
  process.exit(0);
}

// Kontrollera om React-läge ska användas
const useReactApp = process.argv.includes('--use-react');
const skipTest = process.argv.includes('--no-test');

console.log(`🚀 Bygger och startar ScreammSSH utan typkontroll... ${useReactApp ? '(React-läge)' : ''}`);

// Rensa tidigare byggen
console.log('🧹 Rensar tidigare byggen...');
const webpackDir = path.join(__dirname, '.webpack');
if (fs.existsSync(webpackDir)) {
  fs.rmSync(webpackDir, { recursive: true, force: true });
}

// Använd rätt kommando beroende på operativsystem
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const electronCommand = process.platform === 'win32' ? 'electron.cmd' : 'electron';

// Sätt miljövariabel för att skippa typkontroll
process.env.ELECTRON_SKIP_TYPE_CHECK = 'true';
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.NODE_ENV = 'development';

// Skapa main.js manuellt
function createMainJS() {
  return new Promise((resolve, reject) => {
    // Skapa main-katalogen om den inte finns
    const mainDir = path.join(__dirname, '.webpack', 'main');
    if (!fs.existsSync(mainDir)) {
      fs.mkdirSync(mainDir, { recursive: true });
    }
    
    // Skapa package.json i output-katalogen
    const packageJsonContent = JSON.stringify({
      name: "screamm-ssh-client",
      version: "1.0.0",
      main: "main.js"
    }, null, 2);
    
    fs.writeFileSync(path.join(mainDir, 'package.json'), packageJsonContent);
    console.log('📝 Skapade package.json för main-processen');
    
    // Skapa en enkel main.js
    console.log('📝 Skapar main.js manuellt...');
    const mainJsContent = `
// Enkel main.js för Electron
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Hantera okontrollerade fel
process.on('uncaughtException', (error) => {
  console.error('Okontrollerat fel i main-processen:', error);
});

// Inaktivera säkerhetsvarningar under utveckling
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Kontrollera argument från process.env
const useReactApp = process.env.USE_REACT_APP === 'true';
const skipTest = process.env.SKIP_TEST === 'true';

// Håll en global referens till fönsterobjektet
let mainWindow;

function createWindow() {
  console.log('Skapar huvudfönster...');
  
  // Skapa webbläsarfönstret
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Sätt striktare CSP direkt via session API
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // unsafe-inline och unsafe-eval behövs för React
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' data:",
          "connect-src 'self'"
        ].join('; '),
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block']
      }
    });
  });

  let fileToLoad;
  
  // Välj vilken fil som ska laddas baserat på inställningarna
  if (skipTest) {
    // Ladda React-appens index.html direkt
    fileToLoad = path.join(__dirname, '..', 'renderer', 'index.html');
    console.log('Laddar React-app direkt utan testläge:', fileToLoad);
  } else if (useReactApp) {
    // Ladda vår anpassade index-react.html som innehåller en knapp för att ladda React-appen
    fileToLoad = path.join(__dirname, '..', 'renderer', 'index-react.html');
    console.log('Laddar React-testläge:', fileToLoad);
  } else {
    // Ladda test.html som vanligt
    fileToLoad = path.join(__dirname, '..', 'renderer', 'test.html');
    console.log('Laddar testsida:', fileToLoad);
  }
  
  // Kontrollera om filen finns
  if (fs.existsSync(fileToLoad)) {
    console.log('✅ ' + path.basename(fileToLoad) + ' hittades på:', fileToLoad);
    // Använd file:// protokoll för att undvika problem med relativa sökvägar
    const fileUrl = url.format({
      pathname: fileToLoad,
      protocol: 'file:',
      slashes: true
    });
    console.log('Laddar URL:', fileUrl);
    mainWindow.loadURL(fileUrl);
  } else {
    console.error('❌ Filen hittades inte:', fileToLoad);
    
    // Skapa en enkel HTML-sida
    const tempHtml = \`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>ScreammSSH - Nödfallsläge</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #222; color: #eee; }
            h1 { color: #0f0; }
            pre { background: #333; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>ScreammSSH - Nödfallsläge</h1>
          <p>Kunde inte ladda den vanliga användargränssnittet.</p>
          <p>Detta är en nödfallssida som skapats dynamiskt.</p>
          <pre>Electron-version: \${process.versions.electron}</pre>
        </body>
      </html>
    \`;
    
    const tempPath = path.join(__dirname, 'temp.html');
    fs.writeFileSync(tempPath, tempHtml);
    console.log('✅ Skapade temporär HTML-sida:', tempPath);
    const fileUrl = url.format({
      pathname: tempPath,
      protocol: 'file:',
      slashes: true
    });
    mainWindow.loadURL(fileUrl);
  }
  
  // Öppna DevTools under utveckling
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Hantera när fönstret stängs
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  console.log('Huvudfönster skapat!');
}

// Skapa fönster när Electron är redo
app.whenReady().then(() => {
  console.log('Electron är redo!');
  createWindow();
  
  // På macOS är det vanligt att återskapa ett fönster när
  // dock-ikonen klickas och inga andra fönster är öppna
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Avsluta när alla fönster är stängda, förutom på macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Grundläggande IPC-hantering
ipcMain.handle('ping', async () => {
  console.log('Ping mottagen från renderer!');
  return 'pong från main-processen';
});

// Ladda React-appen
ipcMain.handle('load-react-app', async () => {
  console.log('Begäran att ladda React-appen');
  
  // Sökväg till React-appen
  const reactAppPath = path.join(__dirname, '..', 'renderer', 'index.html');
  
  if (fs.existsSync(reactAppPath)) {
    console.log('✅ React-app hittad, laddar:', reactAppPath);
    // Ladda React-appen
    mainWindow.loadURL(url.format({
      pathname: reactAppPath,
      protocol: 'file:',
      slashes: true
    }));
    return { success: true, message: 'React-appen laddad' };
  } else {
    console.error('❌ Kunde inte hitta React-appen på:', reactAppPath);
    return { success: false, message: 'Kunde inte hitta React-appen' };
  }
});

// SSH-testfunktion
ipcMain.handle('test-ssh-connection', async (event, config) => {
  console.log('Test SSH-anslutning begärd med konfiguration:', config);
  
  // Här skulle vi ansluta till en SSH-server på riktigt 
  // men för nu simulerar vi en fördröjning och returnerar ett resultat
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% chans att lyckas
      
      if (success) {
        resolve({ 
          success: true, 
          message: 'Anslutning lyckades till ' + config.host,
          serverInfo: {
            osType: 'Linux',
            version: '5.10.0-generic',
            hostname: config.host,
            uptime: Math.floor(Math.random() * 1000000)
          }
        });
      } else {
        resolve({ 
          success: false, 
          message: 'Kunde inte ansluta till ' + config.host,
          error: 'Connection timeout'
        });
      }
    }, 1500); // Simulera nätverksfördröjning
  });
});

console.log('Main-process startad!');
`;
    
    fs.writeFileSync(path.join(mainDir, 'main.js'), mainJsContent);
    console.log('✅ main.js skapad manuellt');
    resolve();
  });
}

// Skapa preload.js manuellt
function createPreloadJs() {
  console.log('📝 Skapar preload.js manuellt...');
  
  const preloadContent = `
// Preload-skript för Electron
console.log('Preload-skript laddas...');

const { contextBridge, ipcRenderer } = require('electron');

// Exponera utvalda API:er till renderer-processen
contextBridge.exposeInMainWorld('electronAPI', {
  // Ping-funktion för att testa IPC
  ping: () => ipcRenderer.invoke('ping'),
  
  // Versionsinformation
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Simulera SSH-anslutningstest
  testSSHConnection: async (connectionConfig) => {
    console.log('Testar SSH-anslutning till:', connectionConfig.host);
    
    // Simulera en fördröjning för att efterlikna en nätverksanslutning
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulera en lyckad anslutning med 70% sannolikhet
    const success = Math.random() < 0.7;
    
    if (success) {
      // Returnera simulerad serverinformation
      return {
        success: true,
        message: 'Anslutning lyckades',
        serverInfo: {
          osType: Math.random() > 0.5 ? 'Linux' : 'FreeBSD',
          version: '5.10.0-generic',
          hostname: connectionConfig.host.split('.')[0] || 'server',
          uptime: Math.floor(Math.random() * 1000000) // Slumpmässig uptime i sekunder
        }
      };
    } else {
      // Returnera ett simulerat fel
      const errorTypes = [
        'Anslutning nekad',
        'Tidsgräns överskriden',
        'Autentiseringsfel',
        'Värd ej tillgänglig'
      ];
      const errorMessage = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      return {
        success: false,
        message: 'Anslutning misslyckades',
        error: errorMessage
      };
    }
  },
  
  // Simulera hämtning av sparade anslutningar
  getSavedConnections: async () => {
    return [
      { 
        id: 'conn1', 
        name: 'Testserver 1', 
        host: 'test1.example.com', 
        port: 22, 
        username: 'testuser',
        savePassword: false
      },
      { 
        id: 'conn2', 
        name: 'Lokal utvecklingsserver', 
        host: 'localhost', 
        port: 2222, 
        username: 'dev',
        savePassword: true
      }
    ];
  }
});

console.log('Preload-skript laddat! electronAPI är nu tillgängligt i renderer-processen.');
`;

  fs.writeFileSync(path.join(webpackDir, 'main', 'preload.js'), preloadContent);
  console.log('✅ preload.js skapad manuellt');
}

// Uppdatera package.json i rotmappen
function updateRootPackageJson() {
  return new Promise((resolve, reject) => {
    console.log('📝 Uppdaterar package.json i rotmappen...');
    
    try {
      // Läs in befintlig package.json
      const packageJsonPath = path.join(__dirname, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Uppdatera main-egenskapen
      packageJson.main = '.webpack/main/main.js';
      
      // Spara uppdaterad package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json uppdaterad med main: .webpack/main/main.js');
      resolve();
    } catch (error) {
      console.error('❌ Kunde inte uppdatera package.json:', error);
      reject(error);
    }
  });
}

// Funktion för att köra webpack-bygget med --ignore-warnings-flag
function runWebpackBuild() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Bygger renderer-processen utan typkontroll...');
    
    // Kör webpack med explicit argument att ignorera fel
    const webpackProcess = spawn(npxCommand, ['webpack', '--config', 'webpack.renderer.config.js', '--mode', 'development'], {
      stdio: 'inherit',
      env: { 
        ...process.env,
        TS_NODE_TRANSPILE_ONLY: 'true'
      }
    });
    
    webpackProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Renderer-processen byggd utan typkontroll');
        resolve();
      } else {
        console.log('⚠️ Renderer-processen byggdes med varningar/fel (kod ' + code + '), men vi fortsätter ändå');
        resolve(); // Fortsätt trots fel
      }
    });
  });
}

// Starta Electron-appen
function startElectronApp() {
  console.log('🚀 Startar Electron-appen...');
  
  // Visa katalogstrukturen för debugging
  console.log('📂 Katalogstruktur för .webpack:');
  function listDir(dir, indent) {
    if (!indent) indent = '';
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          console.log(indent + '📁 ' + item);
          // Rekursivt lista innehållet i undermappar
          const subItems = fs.readdirSync(itemPath);
          subItems.forEach(subItem => {
            const subItemPath = path.join(itemPath, subItem);
            const subStats = fs.statSync(subItemPath);
            if (subStats.isDirectory()) {
              console.log(indent + '  📁 ' + subItem);
            } else {
              console.log(indent + '  📄 ' + subItem + ' (' + subStats.size + ' bytes)');
            }
          });
        } else {
          console.log(indent + '📄 ' + item + ' (' + stats.size + ' bytes)');
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte lista katalogstruktur:', error);
    }
  }
  
  try {
    listDir(path.join(__dirname, '.webpack'));
  } catch (error) {
    console.error('❌ Kunde inte lista katalogstruktur:', error);
  }
  
  const electron = spawn(electronCommand, ['.'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_ENABLE_LOGGING: 'true',
      ELECTRON_ENABLE_STACK_DUMPING: 'true',
      USE_REACT_APP: useReactApp ? 'true' : 'false',
      SKIP_TEST: skipTest ? 'true' : 'false'
    }
  });
  
  electron.on('close', (code) => {
    console.log('📋 Electron-appen avslutad med kod ' + code);
  });
  
  return electron;
}

// Skapa test.html i .webpack/renderer
function createTestHtml() {
  return new Promise((resolve, reject) => {
    try {
      const rendererDir = path.join(__dirname, '.webpack', 'renderer');
      if (!fs.existsSync(rendererDir)) {
        fs.mkdirSync(rendererDir, { recursive: true });
      }
      
      const testHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ScreammSSH - Testläge</title>
  <style>
    body { 
      font-family: monospace; 
      padding: 20px; 
      background: #222; 
      color: #0f0; 
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    h1 { color: #0f0; }
    pre { background: #333; padding: 10px; border-radius: 5px; }
    button {
      background: #0f0;
      color: #000;
      border: none;
      padding: 10px 20px;
      margin: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-family: monospace;
      font-weight: bold;
    }
    button:hover {
      background: #0c0;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      background: #333;
      border-radius: 5px;
      min-height: 100px;
      width: 80%;
    }
    .section {
      margin: 20px 0;
      border: 1px solid #0f0;
      padding: 20px;
      border-radius: 5px;
      width: 80%;
    }
    input, select {
      background: #333;
      border: 1px solid #0f0;
      color: #0f0;
      padding: 8px;
      margin: 5px 0;
      border-radius: 3px;
      font-family: monospace;
    }
    label {
      display: inline-block;
      width: 100px;
      margin-right: 10px;
    }
    .form-row {
      margin: 10px 0;
    }
    .loading {
      color: #ff0;
    }
    .success {
      color: #0f0;
    }
    .error {
      color: #f00;
    }
  </style>
</head>
<body>
  <h1>ScreammSSH - Testläge</h1>
  <p>Detta är en enkel testsida för att verifiera att Electron fungerar korrekt.</p>
  
  <div class="section">
    <h2>Grundläggande API-tester</h2>
    <div>
      <button id="pingBtn">Testa Ping</button>
      <button id="versionBtn">Visa Versioner</button>
    </div>
    
    <div id="result">Resultat kommer att visas här...</div>
  </div>

  <div class="section">
    <h2>SSH-anslutningstest</h2>
    <div>
      <div class="form-row">
        <label for="sshHost">Host:</label>
        <input type="text" id="sshHost" value="exempel.server.com" />
      </div>
      <div class="form-row">
        <label for="sshPort">Port:</label>
        <input type="number" id="sshPort" value="22" />
      </div>
      <div class="form-row">
        <label for="sshUsername">Användarnamn:</label>
        <input type="text" id="sshUsername" value="user" />
      </div>
      <div class="form-row">
        <label for="sshPassword">Lösenord:</label>
        <input type="password" id="sshPassword" value="password" />
      </div>
      <div class="form-row">
        <button id="sshConnectBtn">Testa SSH-anslutning</button>
      </div>
    </div>
    
    <div id="sshResult">SSH-resultat visas här...</div>
  </div>
  
  <script>
    // Kontrollera om electronAPI finns tillgängligt
    document.addEventListener('DOMContentLoaded', () => {
      const resultDiv = document.getElementById('result');
      const sshResultDiv = document.getElementById('sshResult');
      
      if (window.electronAPI) {
        resultDiv.innerHTML = 'electronAPI är tillgängligt! ✅';
      } else {
        resultDiv.innerHTML = 'electronAPI är INTE tillgängligt! ❌';
      }
      
      // Lägg till händelsehanterare för knappar
      document.getElementById('pingBtn').addEventListener('click', async () => {
        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.ping();
            resultDiv.innerHTML = \`Ping-resultat: \${result}\`;
          } else {
            resultDiv.innerHTML = 'Kan inte pinga: electronAPI saknas';
          }
        } catch (error) {
          resultDiv.innerHTML = \`Fel vid ping: \${error.message}\`;
        }
      });
      
      document.getElementById('versionBtn').addEventListener('click', () => {
        try {
          if (window.electronAPI && window.electronAPI.versions) {
            resultDiv.innerHTML = \`
              <strong>Versioner:</strong><br>
              Node: \${window.electronAPI.versions.node}<br>
              Chrome: \${window.electronAPI.versions.chrome}<br>
              Electron: \${window.electronAPI.versions.electron}
            \`;
          } else {
            resultDiv.innerHTML = 'Kan inte visa versioner: electronAPI saknas';
          }
        } catch (error) {
          resultDiv.innerHTML = \`Fel vid hämtning av versioner: \${error.message}\`;
        }
      });
      
      // SSH-anslutningsknapp
      document.getElementById('sshConnectBtn').addEventListener('click', async () => {
        try {
          const host = document.getElementById('sshHost').value;
          const port = parseInt(document.getElementById('sshPort').value);
          const username = document.getElementById('sshUsername').value;
          const password = document.getElementById('sshPassword').value;
          
          if (!host || !username) {
            sshResultDiv.innerHTML = '<div class="error">Värd och användarnamn måste anges!</div>';
            return;
          }
          
          sshResultDiv.innerHTML = '<div class="loading">Ansluter till SSH-server...</div>';
          
          if (window.electronAPI) {
            const result = await window.electronAPI.testSSHConnection({
              host,
              port,
              username,
              password
            });
            
            if (result.success) {
              sshResultDiv.innerHTML = \`
                <div class="success">
                  <strong>Anslutning lyckades! ✅</strong><br>
                  Meddelande: \${result.message}<br>
                  <strong>Serverinfo:</strong><br>
                  OS: \${result.serverInfo.osType}<br>
                  Version: \${result.serverInfo.version}<br>
                  Hostname: \${result.serverInfo.hostname}<br>
                  Uptime: \${result.serverInfo.uptime} sekunder
                </div>
              \`;
            } else {
              sshResultDiv.innerHTML = \`
                <div class="error">
                  <strong>Anslutning misslyckades! ❌</strong><br>
                  Meddelande: \${result.message}<br>
                  Fel: \${result.error}
                </div>
              \`;
            }
          } else {
            sshResultDiv.innerHTML = '<div class="error">Kan inte ansluta: electronAPI saknas</div>';
          }
        } catch (error) {
          sshResultDiv.innerHTML = \`<div class="error">Fel vid SSH-anslutning: \${error.message}</div>\`;
        }
      });
    });
  </script>
</body>
</html>
      `;
      
      const testHtmlPath = path.join(rendererDir, 'test.html');
      fs.writeFileSync(testHtmlPath, testHtmlContent);
      console.log('✅ Skapade test.html i', testHtmlPath);
      resolve();
    } catch (error) {
      console.error('❌ Kunde inte skapa test.html:', error);
      reject(error);
    }
  });
}

// Skapa ett index-react.html för att starta React-appen
function createReactIndexHtml() {
  return new Promise((resolve, reject) => {
    try {
      const rendererDir = path.join(__dirname, '.webpack', 'renderer');
      if (!fs.existsSync(rendererDir)) {
        fs.mkdirSync(rendererDir, { recursive: true });
      }
      
      const reactIndexHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ScreammSSH - React Startläge</title>
  <style>
    body { 
      font-family: monospace; 
      padding: 20px; 
      background: #222; 
      color: #0f0; 
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    h1 { color: #0f0; }
    pre { background: #333; padding: 10px; border-radius: 5px; }
    button {
      background: #0f0;
      color: #000;
      border: none;
      padding: 10px 20px;
      margin: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-family: monospace;
      font-weight: bold;
      font-size: 18px;
    }
    button:hover {
      background: #0c0;
    }
    .warning {
      color: #ff0;
      max-width: 80%;
      text-align: center;
      margin-top: 20px;
    }
    .loading {
      color: #ff0;
    }
  </style>
</head>
<body>
  <h1>ScreammSSH - React Startläge</h1>
  <p>Klicka på knappen nedan för att starta React-appen</p>
  
  <button id="startReactBtn">Starta React-appen</button>
  
  <div id="status"></div>
  
  <div class="warning">
    <p><strong>OBS!</strong> Om React-appen misslyckas med att starta kan du alltid gå tillbaka till testversionen genom att starta om appen utan <code>--use-react</code>-flaggan.</p>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const statusDiv = document.getElementById('status');
      const startReactBtn = document.getElementById('startReactBtn');
      
      if (!window.electronAPI) {
        statusDiv.innerHTML = '<div class="error">electronAPI saknas! Kan inte starta React-appen.</div>';
        startReactBtn.disabled = true;
        return;
      }
      
      startReactBtn.addEventListener('click', async () => {
        statusDiv.innerHTML = '<div class="loading">Laddar React-appen...</div>';
        startReactBtn.disabled = true;
        
        try {
          const result = await window.electronAPI.invoke('load-react-app');
          
          if (!result.success) {
            statusDiv.innerHTML = \`<div class="error">Fel: \${result.message}</div>\`;
            startReactBtn.disabled = false;
          }
        } catch (error) {
          statusDiv.innerHTML = \`<div class="error">Fel: \${error.message}</div>\`;
          startReactBtn.disabled = false;
        }
      });
    });
  </script>
</body>
</html>
      `;
      
      const reactIndexHtmlPath = path.join(rendererDir, 'index-react.html');
      fs.writeFileSync(reactIndexHtmlPath, reactIndexHtmlContent);
      console.log('✅ Skapade index-react.html i', reactIndexHtmlPath);
      resolve();
    } catch (error) {
      console.error('❌ Kunde inte skapa index-react.html:', error);
      reject(error);
    }
  });
}

// Huvudfunktion
async function main() {
  try {
    // Skapa nödvändiga filer
    await createMainJS();
    await createPreloadJs();
    await updateRootPackageJson();
    await createTestHtml();
    await createReactIndexHtml();
    
    // Bygg renderer-processen
    console.log('🔨 Bygger renderer-processen utan typkontroll...');
    const rendererBuildResult = await runWebpackBuild();
    
    // Starta Electron-appen
    const electronApp = startElectronApp();
    
    // Hantera avslut
    process.on('SIGINT', () => {
      console.log('Avbryter...');
      if (electronApp && !electronApp.killed) {
        electronApp.kill();
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Ett fel inträffade:', error);
    process.exit(1);
  }
}

main();