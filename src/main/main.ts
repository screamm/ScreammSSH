/**
 * HUVUDFILEN FÖR ELECTRON MAIN PROCESS
 * 
 * En förenklad version som fokuserar på grundfunktioner
 */

// Webpack deklarationer
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Inaktivera säkerhetsvarningar under utveckling
// OBS: Detta bör endast användas under utveckling
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Importera nödvändiga moduler
import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';

// Debug-loggar
console.log('======================= ELECTRON APP STARTAR =======================');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('OS:', process.platform, process.arch);
console.log('Webpack entry:', MAIN_WINDOW_WEBPACK_ENTRY);
console.log('Preload entry:', MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);

// Globala variabler
let mainWindow: BrowserWindow | null = null;

// Registrera IPC-hanterare
const registerIPCHandlers = () => {
  console.log('📡 Registrerar IPC-hanterare...');
  
  // Ping-test
  ipcMain.handle('ping', () => {
    console.log('📍 Ping-anrop mottaget');
    return 'pong';
  });
  
  // Test-kanal
  ipcMain.handle('test-channel', () => {
    console.log('🧪 Test-kanal anropad');
    return { success: true, message: 'Kommunikation fungerar!' };
  });
  
  console.log('✅ IPC-hanterare registrerade');
};

// Skapa huvudfönster
const createWindow = () => {
  console.log('🪟 Skapar huvudfönster...');
  
  if (MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY === undefined) {
    console.error('❌ MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY är undefined');
    app.quit();
    return;
  }
  
  if (MAIN_WINDOW_WEBPACK_ENTRY === undefined) {
    console.error('❌ MAIN_WINDOW_WEBPACK_ENTRY är undefined');
    app.quit();
    return;
  }
  
  // Kontrollera att preload-filen finns
  console.log('Absolut sökväg till preload-skript:', MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);
  
  // Skapa BrowserWindow med säkra inställningar
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'ScreammSSH',
    show: false,
    backgroundColor: '#252525',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      javascript: true,
      images: true,
      devTools: true,
      spellcheck: false,
      disableDialogs: true,
      navigateOnDragDrop: false,
      autoplayPolicy: 'user-gesture-required'
    }
  });
  
  // Visningskonfiguration
  mainWindow.once('ready-to-show', () => {
    console.log('🎬 Fönster redo att visas');
    if (mainWindow) {
      mainWindow.show();
      console.log('Laddning slutförd! Visar fönster...');
      
      // Testa kommunikation i utvecklingsläge
      if (process.env.NODE_ENV === 'development') {
        console.log('Testar kommunikation från main-processen');
        try {
          mainWindow.webContents.executeJavaScript(`
            console.warn('Testar kommunikation från main-processen');
            if (window.electronAPI) {
              console.warn('electronAPI hittad i fönstret!');
            } else {
              console.error('electronAPI saknas i fönstret!');
            }
          `).catch(e => console.error('Testskript fel:', e));
        } catch (error) {
          console.error('Fel vid exekvering av JavaScript i renderer:', error);
        }
      }
    }
  });

  // Ladda appens UI från webpack-entry
  console.log('🔄 Laddar URL:', MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
    console.log('✅ URL laddad');
  }).catch(error => {
    console.error('❌ URL laddningsfel:', error);
  });
  
  // Öppna DevTools i utvecklingsläge
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Öppnar DevTools (utvecklingsläge)');
    mainWindow.webContents.openDevTools();
  }
  
  // Loggning av händelser i fönstret
  mainWindow.webContents.on('did-start-loading', () => console.log('🔄 Laddning startar...'));
  mainWindow.webContents.on('did-finish-load', () => console.log('✅ Laddning slutförd'));
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => 
    console.error(`❌ Laddningsfel: ${code} ${desc}`));
  
  // Städa upp vid stängning
  mainWindow.on('closed', () => {
    console.log('🚪 Fönster stängt');
    mainWindow = null;
  });
  
  console.log('✅ Huvudfönster skapat');
};

// Appens livscykel
app.whenReady().then(() => {
  console.log('🚀 App redo!');
  
  // Sätt striktare CSP direkt via session API
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval'",  // unsafe-eval behövs för utveckling
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
  
  // Neka alla behörighetsförfrågningar för extra säkerhet
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log(`⚠️ Behörighetsförfrågan nekad: ${permission}`);
    callback(false);
  });
  
  // Övervaka när nya webContents skapas och säkerställ säkra inställningar
  app.on('web-contents-created', (event, contents) => {
    // Förhindra navigering till osäkra platser
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      // Tillåt bara lokala URLs eller specifika domäner
      if (parsedUrl.origin !== 'http://localhost:3030' &&
          parsedUrl.protocol !== 'file:') {
        console.warn(`⚠️ Blockerad navigering till: ${navigationUrl}`);
        event.preventDefault();
      }
    });
    
    // Säkerställ att webviews inte kan skapas med osäkra inställningar
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Se till att webPreferences inte överskriver säkerhetsinställningar
      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      webPreferences.webSecurity = true;
      webPreferences.allowRunningInsecureContent = false;
      
      // Blockera osäkra källor
      if (!params.src.startsWith('https:') && 
          !params.src.startsWith('http://localhost') &&
          !params.src.startsWith('file:')) {
        event.preventDefault();
      }
    });
  });
  
  // Registrera IPC-hanterare
  registerIPCHandlers();
  
  // Skapa appfönstret
  createWindow();
  
  // Loggning av preload-skript
  if (mainWindow) {
    const preloadPath = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
    try {
      const fs = require('fs');
      const exists = fs.existsSync(preloadPath);
      const stats = exists ? fs.statSync(preloadPath) : null;
      const size = stats ? stats.size : -1;
      const contents = exists ? fs.readFileSync(preloadPath, 'utf8') : '';
      
      console.log('Preload-skript existerar:', exists);
      console.log('Preload-skript storlek:', size, 'tecken');
      console.log('Preload-skript första 100 tecken:', contents.substring(0, 100));
    } catch (error) {
      console.error('❌ Fel vid kontroll av preload-skript:', error);
    }
  }
}).catch(error => {
  console.error('💥 Fel vid appstart:', error);
  app.quit();
});

// Hantera stängning av alla fönster
app.on('window-all-closed', () => {
  console.log('🏁 Alla fönster stängda');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Skapa nytt fönster om inget finns (MacOS-beteende)
app.on('activate', () => {
  console.log('♻️ App återaktiverad');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Städa upp innan avslut
app.on('will-quit', () => {
  console.log('👋 App avslutar...');
}); 