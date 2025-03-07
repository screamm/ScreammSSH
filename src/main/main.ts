/**
 * HUVUDFILEN FÖR ELECTRON MAIN PROCESS
 * Denna fil körs i huvudprocessen och är ansvarig för 
 * att skapa fönster och hantera IPC-kommunikation.
 */

// Webpack deklarationer
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Importera nödvändiga moduler
import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as os from 'os';
import Store from 'electron-store';
import * as SSH2 from 'ssh2';

// Extra debug-info
console.log('======================= ELECTRON APP STARTAR =======================');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('V8 version:', process.versions.v8);
console.log('OS:', process.platform, process.arch);
console.log('Process PID:', process.pid);
console.log('Webpack entry:', MAIN_WINDOW_WEBPACK_ENTRY);
console.log('Preload entry:', MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);

// Konfigurering av persistent lagring
const store = new Store({
  name: 'screamm-ssh-config',
  defaults: {
    connections: [],
    theme: 'classic-green',
    language: 'sv',
    terminalSettings: {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    }
  }
});

// Globala variabler
let mainWindow: BrowserWindow | null = null;
const shellSessions = new Map();
const sshConnections = new Map();

// Monkey-patcha IPC för debug
const originalHandle = ipcMain.handle;
(ipcMain as any).handle = function(channel: string, listener: any) {
  console.log(`⚡ REGISTRERAR IPC HANDLER: '${channel}'`);
  return originalHandle.call(ipcMain, channel, listener);
};

/**
 * Skapa huvudfönstret
 */
function createWindow() {
  console.log('🪟 SKAPAR HUVUDFÖNSTER...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Måste vara false för att tillåta shell-hantering
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    },
    backgroundColor: '#121212',
    show: false,
  });

  console.log('🔄 LADDAR RENDERER URL:', MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Visa fönstret när det är klart
  mainWindow.once('ready-to-show', () => {
    console.log('🎬 FÖNSTER REDO ATT VISAS');
    mainWindow?.show();
    
    // Öppna DevTools i utvecklingsläge
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 ÖPPNAR DEVTOOLS (DEVELOPMENT MODE)');
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    console.log('🚪 HUVUDFÖNSTER STÄNGT');
    mainWindow = null;
  });
  
  console.log('✅ HUVUDFÖNSTER SKAPAT');
}

/**
 * Registrera alla IPC handlers
 */
function registerIPCHandlers() {
  console.log('📡 REGISTRERAR IPC HANDLERS...');
  
  // Ping test
  ipcMain.handle('ping', (event) => {
    console.log('📍 PING ANROP MOTTAGET!');
    return 'pong';
  });
  
  // -------------------
  // INSTÄLLNINGS-HANDLERS
  // -------------------
  
  // Get theme
  ipcMain.handle('get-theme', (event) => {
    console.log('🎨 GET-THEME ANROP MOTTAGET');
    const theme = store.get('theme', 'classic-green');
    console.log(`  → Returnerar tema: ${theme}`);
    return theme;
  });
  
  // Save theme
  ipcMain.handle('save-theme', (event, theme) => {
    console.log(`🎨 SAVE-THEME ANROP MOTTAGET: ${theme}`);
    store.set('theme', theme);
    return { success: true };
  });
  
  // Get language
  ipcMain.handle('get-language', (event) => {
    console.log('🌐 GET-LANGUAGE ANROP MOTTAGET');
    const language = store.get('language', 'sv');
    console.log(`  → Returnerar språk: ${language}`);
    return language;
  });
  
  // Save language
  ipcMain.handle('save-language', (event, language) => {
    console.log(`🌐 SAVE-LANGUAGE ANROP MOTTAGET: ${language}`);
    store.set('language', language);
    return { success: true };
  });
  
  // Get terminal settings
  ipcMain.handle('get-terminal-settings', (event) => {
    console.log('⌨️ GET-TERMINAL-SETTINGS ANROP MOTTAGET');
    const defaultSettings = {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    };
    const settings = store.get('terminalSettings', defaultSettings);
    console.log(`  → Returnerar inställningar: ${JSON.stringify(settings)}`);
    return settings;
  });
  
  // Save terminal settings
  ipcMain.handle('save-terminal-settings', (event, settings) => {
    console.log(`⌨️ SAVE-TERMINAL-SETTINGS ANROP MOTTAGET: ${JSON.stringify(settings)}`);
    store.set('terminalSettings', settings);
    return { success: true };
  });
  
  // -------------------
  // SSH-HANTERARE
  // -------------------
  
  // SSH Connect
  ipcMain.handle('ssh:connect', async (event, args) => {
    try {
      console.log('🔗 SSH-CONNECT ANROP MOTTAGET');
      const { config } = args;
      
      if (!config || !config.host || !config.port || !config.username) {
        return { 
          success: false, 
          error: 'Ofullständig SSH-konfiguration. Host, port och username krävs.' 
        };
      }
      
      console.log(`  → Ansluter till SSH-server: ${config.host}:${config.port} som ${config.username}`);
      
      // Generera ett unikt ID för anslutningen
      const connectionId = `ssh-${Date.now()}`;
      
      // Skapa ssh-klienten
      const sshClient = new SSH2.Client();
      
      // Registrera anslutningen
      sshConnections.set(connectionId, { client: sshClient, connected: false });
      
      // Konfigurera SSH-anslutningen
      const sshConfig: SSH2.ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        // Hantera antingen lösenord eller privat nyckel
        ...(config.password ? { password: config.password } : {}),
        ...(config.privateKey ? { privateKey: config.privateKey } : {})
      };
      
      // Skapa ett promise för anslutningen
      const connectionPromise = new Promise<{ success: boolean, connectionId?: string, error?: string }>((resolve, reject) => {
        // Registrera händelsehanterare
        sshClient.on('ready', () => {
          console.log(`✅ SSH-anslutning klar: ${connectionId}`);
          sshConnections.set(connectionId, { 
            client: sshClient, 
            connected: true,
            config: config 
          });
          resolve({ success: true, connectionId });
        });
        
        sshClient.on('error', (err) => {
          console.error(`❌ SSH-anslutningsfel: ${err.message}`);
          sshConnections.delete(connectionId);
          resolve({ success: false, error: err.message });
        });
        
        // Försök ansluta till SSH-servern
        sshClient.connect(sshConfig);
      });
      
      // Vänta på resultatet och returnera
      return await connectionPromise;
    } catch (err: any) {
      console.error('❌ SSH-anslutningsfel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH Execute
  ipcMain.handle('ssh:execute', async (event, args) => {
    try {
      const { connectionId, command } = args;
      
      console.log(`🔄 SSH-EXECUTE [${connectionId.substring(0, 8)}]: ${command}`);
      
      const connection = sshConnections.get(connectionId);
      
      if (!connection || !connection.connected) {
        console.log(`❌ SSH-anslutning hittades inte: ${connectionId}`);
        return { success: false, error: 'SSH-anslutning hittades inte eller är stängd' };
      }
      
      // Skapa ett nytt SSH-kommando
      const execPromise = new Promise<{
        success: boolean;
        code?: number;
        stdout?: string;
        stderr?: string;
        error?: string;
      }>((resolve, reject) => {
        connection.client.exec(command, (err, stream) => {
          if (err) {
            console.error(`❌ SSH-exekveringsfel: ${err.message}`);
            return resolve({ success: false, error: err.message });
          }
          
          let stdout = '';
          let stderr = '';
          
          stream.on('data', (data: Buffer) => {
            stdout += data.toString('utf8');
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            stderr += data.toString('utf8');
          });
          
          stream.on('close', (code: number) => {
            console.log(`✅ SSH-kommando avslutades med kod: ${code}`);
            resolve({
              success: true,
              code,
              stdout,
              stderr
            });
          });
        });
      });
      
      return await execPromise;
    } catch (err: any) {
      console.error('❌ SSH-exekveringsfel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH Disconnect
  ipcMain.handle('ssh:disconnect', async (event, args) => {
    try {
      const { connectionId } = args;
      
      console.log(`🔌 SSH-DISCONNECT [${connectionId.substring(0, 8)}]`);
      
      const connection = sshConnections.get(connectionId);
      
      if (!connection) {
        console.log(`❌ SSH-anslutning hittades inte: ${connectionId}`);
        return { success: false, error: 'SSH-anslutning hittades inte' };
      }
      
      // Stäng anslutningen
      connection.client.end();
      sshConnections.delete(connectionId);
      
      console.log(`✅ SSH-anslutning stängd: ${connectionId}`);
      return { success: true };
    } catch (err: any) {
      console.error('❌ SSH-frånkopplingsfel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // -------------------
  // SHELL-HANDLERS
  // -------------------
  
  // Shell-create
  ipcMain.handle('shell-create', (event) => {
    try {
      console.log('🐚 SHELL-CREATE ANROP MOTTAGET!');
      
      // Generera ett unikt ID
      const sessionId = `shell-${Date.now()}`;
      
      // Hitta rätt shell för operativsystemet
      const shell = process.platform === 'win32' 
        ? process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe'
        : process.env.SHELL || '/bin/bash';
      
      console.log(`🚀 Startar shell: ${shell}, session: ${sessionId}`);
      
      // Starta shell-processen
      const shellProcess = spawn(shell, [], {
        env: process.env,
        cwd: os.homedir(),
        shell: true
      });
      
      console.log(`✅ Shell-process skapad med PID: ${shellProcess.pid}`);
      shellSessions.set(sessionId, shellProcess);
      
      // Hantera output från shell
      shellProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`📤 Shell stdout [${sessionId.substring(0, 8)}]: ${output.substring(0, 40)}${output.length > 40 ? '...' : ''}`);
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('shell-output', { id: sessionId, output });
        } else {
          console.error('❌ mainWindow eller webContents är null!');
        }
      });
      
      shellProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`⚠️ Shell stderr [${sessionId.substring(0, 8)}]: ${output.substring(0, 40)}${output.length > 40 ? '...' : ''}`);
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('shell-output', { id: sessionId, error: output });
        } else {
          console.error('❌ mainWindow eller webContents är null!');
        }
      });
      
      // Hantera fel och avslut
      shellProcess.on('error', (err: Error) => {
        console.log(`❌ Shell error [${sessionId.substring(0, 8)}]: ${err.message}`);
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('shell-error', { id: sessionId, error: err.message });
        }
      });
      
      shellProcess.on('exit', (code) => {
        console.log(`👋 Shell exited [${sessionId.substring(0, 8)}] with code: ${code}`);
        shellSessions.delete(sessionId);
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('shell-exit', { id: sessionId, code });
        }
      });
      
      return { success: true, id: sessionId };
    } catch (err: any) {
      console.error('❌❌❌ Error starting shell:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Shell-execute
  ipcMain.handle('shell-execute', (event, args) => {
    try {
      const { id, command } = args;
      console.log(`🔄 SHELL-EXECUTE [${id.substring(0, 8)}]: ${command}`);
      
      const process = shellSessions.get(id);
      
      if (!process) {
        console.log(`❌ Shell session not found: ${id}`);
        return { success: false, error: 'Shell session not found' };
      }
      
      console.log(`✅ Executing command in shell [${id.substring(0, 8)}]`);
      process.stdin.write(command + '\n');
      
      return { success: true };
    } catch (err: any) {
      console.error('❌❌❌ Error executing shell command:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Shell-terminate
  ipcMain.handle('shell-terminate', (event, args) => {
    try {
      const { id } = args;
      console.log(`🛑 SHELL-TERMINATE [${id.substring(0, 8)}]`);
      
      const process = shellSessions.get(id);
      
      if (!process) {
        console.log(`❌ Shell session not found: ${id}`);
        return { success: false, error: 'Shell session not found' };
      }
      
      process.kill();
      shellSessions.delete(id);
      console.log(`✅ Shell terminated [${id.substring(0, 8)}]`);
      
      return { success: true };
    } catch (err: any) {
      console.error('❌❌❌ Error terminating shell:', err);
      return { success: false, error: err.message };
    }
  });
  
  // -------------------
  // SAVED CONNECTIONS HANDLERS (BASIC)
  // -------------------
  
  // Get saved connections
  ipcMain.handle('get-saved-connections', (event) => {
    console.log('📁 GET-SAVED-CONNECTIONS ANROP MOTTAGET');
    const connections = store.get('connections', []);
    return connections;
  });
  
  // Save connection
  ipcMain.handle('save-connection', (event, connection) => {
    console.log(`📁 SAVE-CONNECTION ANROP MOTTAGET`);
    try {
      const connections = store.get('connections', []) as any[];
      
      // Om connection har ett id, uppdatera befintlig anslutning
      if (connection.id) {
        const index = connections.findIndex(c => c.id === connection.id);
        if (index >= 0) {
          connections[index] = connection;
        } else {
          connections.push(connection);
        }
      } else {
        // Lägg till nytt id för ny anslutning
        connection.id = `conn-${Date.now()}`;
        connections.push(connection);
      }
      
      store.set('connections', connections);
      return { success: true, connections };
    } catch (err: any) {
      console.error('Error saving connection:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Delete connection
  ipcMain.handle('delete-connection', (event, id) => {
    console.log(`📁 DELETE-CONNECTION ANROP MOTTAGET: ${id}`);
    try {
      const connections = store.get('connections', []) as any[];
      const filteredConnections = connections.filter(c => c.id !== id);
      store.set('connections', filteredConnections);
      return { success: true, connections: filteredConnections };
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      return { success: false, error: err.message };
    }
  });
  
  console.log('✅ ALLA IPC HANDLERS REGISTRERADE!');
}

// Appens startpunkt
app.whenReady().then(() => {
  console.log('🚀 APP ÄR REDO!');
  
  // Registrera IPC-handlers FÖRST
  registerIPCHandlers();
  
  // Skapa fönster EFTER hanterare är registrerade
  createWindow();
}).catch(err => {
  console.error('💥 FEL VID APPSTART:', err);
});

// Hantera app livscykel
app.on('window-all-closed', () => {
  console.log('🏁 ALLA FÖNSTER STÄNGDA');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// På macOS, återskapa fönstret när användaren klickar på dockikonen
app.on('activate', () => {
  console.log('♻️ APP ÅTERAKTIVERAD');
  if (mainWindow === null && app.isReady()) {
    createWindow();
  }
});

// Stäng alla anslutningar vid avslut
app.on('will-quit', () => {
  console.log(`🧹 Städar upp anslutningar...`);
  
  // Stäng alla shell-sessioner
  console.log(`🧹 Städar upp ${shellSessions.size} shell-sessioner...`);
  for (const [id, process] of shellSessions.entries()) {
    try {
      process.kill();
      console.log(`✅ Avslutade shell ${id.substring(0, 8)}`);
    } catch (err) {
      console.error(`❌ Misslyckades avsluta shell ${id.substring(0, 8)}:`, err);
    }
  }
  shellSessions.clear();
  
  // Stäng alla SSH-anslutningar
  console.log(`🧹 Städar upp ${sshConnections.size} SSH-anslutningar...`);
  for (const [id, connection] of sshConnections.entries()) {
    try {
      if (connection.client) {
        connection.client.end();
        console.log(`✅ Avslutade SSH-anslutning ${id.substring(0, 8)}`);
      }
    } catch (err) {
      console.error(`❌ Misslyckades avsluta SSH-anslutning ${id.substring(0, 8)}:`, err);
    }
  }
  sshConnections.clear();
  
  console.log('👋 APP AVSLUTAS');
}); 