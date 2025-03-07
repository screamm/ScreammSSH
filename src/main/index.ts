/**
 * ABSOLUT ENKLASTE MÖJLIGA IMPLEMENTATION AV ELECTRON MAIN PROCESS
 * MED SSH OCH SFTP STÖD
 */

// Importera nödvändiga moduler
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
// Importera ssh2 på ett sätt som är kompatibelt med CommonJS och TypeScript
import * as SSH2 from 'ssh2';
const SSHClient = SSH2.Client;

// För webpack
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

console.log('======================= ELECTRON APP STARTAR =======================');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('V8 version:', process.versions.v8);
console.log('OS:', process.platform, process.arch);
console.log('Process PID:', process.pid);

// Definiera datastore
interface StoreSchema {
  connections: SSHConnection[];
  settings: {
    theme: string;
    language: string;
    recentDirectories: string[];
    crtEffect: boolean;
  };
}

interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  lastConnected?: Date;
}

const store = new Store<StoreSchema>({
  defaults: {
    connections: [],
    settings: {
      theme: 'default',
      language: 'sv',
      recentDirectories: [],
      crtEffect: false
    }
  }
});

// Globala variabler
let mainWindow: BrowserWindow | null = null;
const shellSessions = new Map();
const sshSessions = new Map();
const sftpSessions = new Map();

// Endast när appen är redo
app.whenReady().then(() => {
  console.log('APP ÄR REDO!');
  
  // --------------- REGISTRERA IPC HANDLERS FÖRST ---------------
  console.log('REGISTRERAR IPC HANDLERS...');
  
  // Enkel ping test
  ipcMain.handle('ping', (event) => {
    console.log('PING ANROP MOTTAGET!');
    return 'pong';
  });
  
  // Inställningshanterare
  ipcMain.handle('save-theme', (event, theme) => {
    console.log(`Sparar tema: ${theme}`);
    const settings = store.get('settings');
    store.set('settings', { ...settings, theme });
    return { success: true };
  });
  
  ipcMain.handle('get-theme', () => {
    const theme = store.get('settings.theme', 'default');
    console.log('  ⮑ Returnerar tema:', theme);
    return theme;
  });
  
  ipcMain.handle('save-language', (event, language) => {
    console.log(`Sparar språk: ${language}`);
    const settings = store.get('settings');
    store.set('settings', { ...settings, language });
    return { success: true };
  });
  
  ipcMain.handle('get-language', () => {
    const language = store.get('settings.language', 'sv');
    console.log('  ⮑ Returnerar språk:', language);
    return language;
  });
  
  ipcMain.handle('save-crt-effect', (event, value) => {
    console.log(`Sparar CRT-effekt: ${value}`);
    const settings = store.get('settings');
    store.set('settings', { ...settings, crtEffect: value });
    return { success: true };
  });
  
  ipcMain.handle('get-crt-effect', () => {
    const crtEffect = store.get('settings.crtEffect', false);
    console.log('  ⮑ Returnerar CRT-effekt:', crtEffect);
    return crtEffect;
  });
  
  // Terminal settings
  ipcMain.handle('get-terminal-settings', () => {
    console.log('GET-TERMINAL-SETTINGS ANROP MOTTAGET');
    // Returnera default-inställningar om de inte finns
    const settings = {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    };
    console.log('  ⮑ Returnerar inställningar:', settings);
    return settings;
  });
  
  ipcMain.handle('save-terminal-settings', (event, settings) => {
    console.log(`Sparar terminalinställningar:`, settings);
    return { success: true };
  });
  
  // Shell handlers
  ipcMain.handle('shell-create', (event) => {
    try {
      console.log('SHELL-CREATE ANROP MOTTAGET!');
      
      // Generera ett unikt ID
      const sessionId = `shell-${Date.now()}`;
      
      // Hitta rätt shell för operativsystemet
      const shell = process.platform === 'win32' 
        ? process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe'
        : process.env.SHELL || '/bin/bash';
      
      console.log(`Startar shell: ${shell}, session: ${sessionId}`);
      
      // Starta shell-processen
      const shellProcess = spawn(shell, [], {
        env: process.env,
        cwd: os.homedir(),
        shell: true
      });
      
      console.log(`Shell-process skapad med PID: ${shellProcess.pid}`);
      shellSessions.set(sessionId, shellProcess);
      
      // Hantera output från shell
      shellProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Shell stdout [${sessionId.slice(0, 8)}]: ${output.substring(0, 40)}...`);
        mainWindow?.webContents?.send('shell-output', { id: sessionId, output });
      });
      
      shellProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.log(`Shell stderr [${sessionId.slice(0, 8)}]: ${error.substring(0, 40)}...`);
        mainWindow?.webContents?.send('shell-output', { id: sessionId, error });
      });
      
      // Hantera fel och avslut
      shellProcess.on('error', (err: Error) => {
        console.log(`Shell error: ${err.message}`);
        mainWindow?.webContents?.send('shell-error', { id: sessionId, error: err.message });
      });
      
      shellProcess.on('exit', (code) => {
        console.log(`Shell exited with code: ${code}`);
        shellSessions.delete(sessionId);
        mainWindow?.webContents?.send('shell-exit', { id: sessionId, code });
      });
      
      return { success: true, id: sessionId };
    } catch (err: any) {
      console.error('Error starting shell:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Shell-execute
  ipcMain.handle('shell-execute', (event, args) => {
    try {
      console.log(`SHELL-EXECUTE [${args.id.slice(0, 8)}]: ${args.command}`);
      
      const { id, command } = args;
      const process = shellSessions.get(id);
      
      if (!process) {
        console.log(`Shell session not found: ${id}`);
        return { success: false, error: 'Shell session not found' };
      }
      
      console.log(`Executing command in shell [${id.slice(0, 8)}]`);
      process.stdin.write(command + '\n');
      
      return { success: true };
    } catch (err: any) {
      console.error('Error executing shell command:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Shell-terminate
  ipcMain.handle('shell-terminate', (event, args) => {
    try {
      console.log(`SHELL-TERMINATE ANROP MOTTAGET: ${JSON.stringify(args)}`);
      
      const { id } = args;
      const process = shellSessions.get(id);
      
      if (!process) {
        console.log(`Shell session not found: ${id}`);
        return { success: false, error: 'Shell session not found' };
      }
      
      process.kill();
      shellSessions.delete(id);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error terminating shell:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH connection handlers
  ipcMain.handle('get-saved-connections', (event) => {
    try {
      console.log('GET-SAVED-CONNECTIONS ANROP MOTTAGET');
      return store.get('connections');
    } catch (err: any) {
      console.error('Fel vid hämtning av SSH-anslutningar:', err);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('save-connection', (event, connection) => {
    try {
      console.log(`SAVE-CONNECTION ANROP MOTTAGET: ${connection.name}`);
      const connections = store.get('connections');
      
      // Kontrollera om anslutningen redan finns
      const existingIndex = connections.findIndex((c: SSHConnection) => c.id === connection.id);
      
      let updatedConnection = connection;
      if (existingIndex >= 0) {
        // Uppdatera befintlig anslutning
        connections[existingIndex] = connection;
      } else {
        // Lägg till ny anslutning med unikt ID
        updatedConnection.id = `conn-${Date.now()}`;
        connections.push(updatedConnection);
      }
      
      store.set('connections', connections);
      return { success: true, id: updatedConnection.id };
    } catch (err: any) {
      console.error('Fel vid sparande av SSH-anslutning:', err);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('delete-connection', (event, id) => {
    try {
      console.log(`DELETE-CONNECTION ANROP MOTTAGET: ${id}`);
      const connections = store.get('connections');
      const newConnections = connections.filter((c: SSHConnection) => c.id !== id);
      
      store.set('connections', newConnections);
      return { success: true };
    } catch (err: any) {
      console.error('Fel vid borttagning av SSH-anslutning:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH connection
  ipcMain.handle('ssh-connect', async (event, config) => {
    try {
      console.log(`SSH-CONNECT ANROP MOTTAGET:`, config);
      
      // Skapa ett unikt session-ID
      const sessionId = `ssh-${Date.now()}`;
      
      // Instansiera SSH-klienten
      const sshClient = new SSHClient();
      
      try {
        // Skapa ett promise för anslutningen
        await new Promise<void>((resolve, reject) => {
          sshClient.on('ready', () => {
            console.log('SSH anslutning klar');
            
            // Spara SSH-sessionen
            sshSessions.set(sessionId, sshClient);
            
            // Spara tidpunkt för senaste anslutning
            try {
              const connections = store.get('connections');
              const connectionIndex = connections.findIndex((c: SSHConnection) => c.id === config.id);
              
              if (connectionIndex >= 0) {
                connections[connectionIndex].lastConnected = new Date();
                store.set('connections', connections);
              }
            } catch (storeErr) {
              console.error('Kunde inte uppdatera senaste anslutning:', storeErr);
            }
            
            // Lyckad anslutning
            resolve();
          });
          
          sshClient.on('error', (err) => {
            console.error('SSH anslutningsfel:', err);
            reject(err);
          });
          
          // Anslut till SSH-servern
          sshClient.connect({
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password,
            privateKey: config.privateKey ? fs.readFileSync(config.privateKey) : undefined,
            readyTimeout: 10000
          });
        });
        
        // Om vi kommer hit är anslutningen lyckad
        return { success: true, sessionId };
      } catch (connectionErr: any) {
        console.error('SSH anslutningsfel (promise):', connectionErr);
        return { success: false, error: connectionErr.message };
      }
    } catch (err: any) {
      console.error('SSH anslutningsfel (outer):', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH command execution
  ipcMain.handle('ssh-execute', (event, id, command) => {
    try {
      console.log(`SSH-EXECUTE ANROP MOTTAGET: ${id}, ${command}`);
      
      const sshClient = sshSessions.get(id);
      
      if (!sshClient) {
        console.error('SSH-session hittades inte:', id);
        return { success: false, error: 'SSH-session hittades inte' };
      }
      
      return new Promise((resolve, reject) => {
        sshClient.exec(command, (err, stream) => {
          if (err) {
            console.error('SSH-kommandobfel:', err);
            reject({ success: false, error: err.message });
            return;
          }
          
          let output = '';
          let errorOutput = '';
          
          stream.on('data', (data: Buffer) => {
            const chunk = data.toString();
            output += chunk;
            mainWindow?.webContents?.send('ssh-output', { id, output: chunk });
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            errorOutput += chunk;
            mainWindow?.webContents?.send('ssh-output', { id, error: chunk });
          });
          
          stream.on('close', (code: number) => {
            console.log(`SSH-kommando avslutades med kod: ${code}`);
            resolve({ success: true, output, error: errorOutput, code });
          });
        });
      });
    } catch (err: any) {
      console.error('SSH kommandobfel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SSH disconnect
  ipcMain.handle('ssh-disconnect', (event, id) => {
    try {
      console.log(`SSH-DISCONNECT ANROP MOTTAGET: ${id}`);
      
      const sshClient = sshSessions.get(id);
      
      if (!sshClient) {
        console.error('SSH-session hittades inte:', id);
        return { success: false, error: 'SSH-session hittades inte' };
      }
      
      sshClient.end();
      sshSessions.delete(id);
      
      return { success: true };
    } catch (err: any) {
      console.error('SSH frånkopplingsfel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SFTP-funktioner
  ipcMain.handle('sftp-list-directory', async (event, id, remotePath) => {
    try {
      console.log(`SFTP-LIST-DIRECTORY ANROP MOTTAGET: ${id}, ${remotePath}`);
      
      const sshClient = sshSessions.get(id);
      
      if (!sshClient) {
        console.error('SSH-session hittades inte:', id);
        return { success: false, error: 'SSH-session hittades inte' };
      }
      
      return new Promise((resolve, reject) => {
        sshClient.sftp((err, sftp) => {
          if (err) {
            console.error('SFTP-fel:', err);
            reject({ success: false, error: err.message });
            return;
          }
          
          // Spara SFTP-sessionen för framtida användning
          sftpSessions.set(id, sftp);
          
          sftp.readdir(remotePath, (err, list) => {
            if (err) {
              console.error('SFTP readdir-fel:', err);
              reject({ success: false, error: err.message });
              return;
            }
            
            resolve({ 
              success: true, 
              path: remotePath, 
              files: list.map(item => ({
                name: item.filename,
                size: item.attrs.size,
                modTime: new Date(item.attrs.mtime * 1000),
                isDirectory: (item.attrs.mode & 16384) === 16384,
                permissions: item.attrs.mode,
                owner: item.attrs.uid,
                group: item.attrs.gid
              }))
            });
          });
        });
      });
    } catch (err: any) {
      console.error('SFTP list directory fel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SFTP get file
  ipcMain.handle('sftp-get-file', async (event, id, remotePath) => {
    try {
      console.log(`SFTP-GET-FILE ANROP MOTTAGET: ${id}, ${remotePath}`);
      
      const sshClient = sshSessions.get(id);
      
      if (!sshClient) {
        console.error('SSH-session hittades inte:', id);
        return { success: false, error: 'SSH-session hittades inte' };
      }
      
      // Låt användaren välja var filen ska sparas
      const saveDialogResult = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: path.basename(remotePath),
        properties: ['createDirectory', 'showOverwriteConfirmation']
      });
      
      if (saveDialogResult.canceled || !saveDialogResult.filePath) {
        return { success: false, canceled: true };
      }
      
      const localPath = saveDialogResult.filePath;
      
      return new Promise((resolve, reject) => {
        sshClient.sftp((err, sftp) => {
          if (err) {
            console.error('SFTP-fel:', err);
            reject({ success: false, error: err.message });
            return;
          }
          
          // Spara SFTP-sessionen för framtida användning
          sftpSessions.set(id, sftp);
          
          try {
            sftp.fastGet(remotePath, localPath, (err) => {
              if (err) {
                console.error('SFTP fastGet-fel:', err);
                reject({ success: false, error: err.message });
                return;
              }
              
              resolve({ 
                success: true, 
                remotePath,
                localPath
              });
            });
          } catch (fastGetErr: any) {
            console.error('SFTP fastGet exception:', fastGetErr);
            reject({ success: false, error: fastGetErr.message });
          }
        });
      });
    } catch (err: any) {
      console.error('SFTP get file fel:', err);
      return { success: false, error: err.message };
    }
  });
  
  // SFTP put file
  ipcMain.handle('sftp-put-file', async (event, id, remotePath) => {
    try {
      console.log(`SFTP-PUT-FILE ANROP MOTTAGET: ${id}, ${remotePath}`);
      
      const sshClient = sshSessions.get(id);
      
      if (!sshClient) {
        console.error('SSH-session hittades inte:', id);
        return { success: false, error: 'SSH-session hittades inte' };
      }
      
      // Låt användaren välja vilken fil som ska laddas upp
      const openDialogResult = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile']
      });
      
      if (openDialogResult.canceled || openDialogResult.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      
      const localPath = openDialogResult.filePaths[0];
      const fileName = path.basename(localPath);
      const finalRemotePath = remotePath.endsWith('/') 
        ? `${remotePath}${fileName}` 
        : remotePath;
      
      return new Promise((resolve, reject) => {
        sshClient.sftp((err, sftp) => {
          if (err) {
            console.error('SFTP-fel:', err);
            reject({ success: false, error: err.message });
            return;
          }
          
          // Spara SFTP-sessionen för framtida användning
          sftpSessions.set(id, sftp);
          
          try {
            sftp.fastPut(localPath, finalRemotePath, (err) => {
              if (err) {
                console.error('SFTP fastPut-fel:', err);
                reject({ success: false, error: err.message });
                return;
              }
              
              resolve({ 
                success: true, 
                remotePath: finalRemotePath,
                localPath
              });
            });
          } catch (fastPutErr: any) {
            console.error('SFTP fastPut exception:', fastPutErr);
            reject({ success: false, error: fastPutErr.message });
          }
        });
      });
    } catch (err: any) {
      console.error('SFTP put file fel:', err);
      return { success: false, error: err.message };
    }
  });

  console.log('ALLA IPC HANDLERS REGISTRERADE!');
  
  // --------------- SKAPA FÖNSTER EFTER IPC REGISTRATION ---------------
  console.log('SKAPAR HUVUDFÖNSTER...');
  
  // Skapa huvudfönster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      devTools: true
    }
  });
  
  // Ladda app
  console.log('LADDAR RENDERER URL:', MAIN_WINDOW_WEBPACK_ENTRY);
  console.log('PRELOAD:', MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
  // Öppna DevTools i utvecklingsläge
  if (process.env.NODE_ENV === 'development') {
    console.log('DEVELOPMENT MODE - ÖPPNAR DEVTOOLS');
    mainWindow.webContents.openDevTools();
  }
  
  // Hantera fönster stängning
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  mainWindow.once('ready-to-show', () => {
    console.log('FÖNSTER REDO ATT VISAS');
    mainWindow?.show();
  });
  
  console.log('HUVUDFÖNSTER SKAPAT');
}).catch(err => {
  console.error('FEL VID APPSTART:', err);
});

// Hantera app livscykel
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// På macOS, återskapa fönstret när användaren klickar på dockikonen
app.on('activate', () => {
  if (mainWindow === null && app.isReady()) {
    console.log('ÅTERAKTIVERAR APP - SKAPAR NYTT FÖNSTER');
    // Kod för att skapa nytt fönster här...
  }
});

// Stäng alla sessioner vid avslut
app.on('will-quit', () => {
  console.log(`Avslutar sessioner: ${shellSessions.size} shell, ${sshSessions.size} SSH`);
  
  // Avsluta shell-sessioner
  for (const [id, process] of shellSessions.entries()) {
    try {
      process.kill();
    } catch (err) {
      console.error(`Failed to kill shell ${id}:`, err);
    }
  }
  
  // Avsluta SSH-sessioner
  for (const [id, client] of sshSessions.entries()) {
    try {
      client.end();
    } catch (err) {
      console.error(`Failed to close SSH session ${id}:`, err);
    }
  }
  
  shellSessions.clear();
  sshSessions.clear();
  sftpSessions.clear();
}); 