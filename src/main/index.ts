// Lägg till dessa konstanter högst upp i filen
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Detta är huvudprocessen för Electron-appen
import { app, BrowserWindow, ipcMain, session } from 'electron';
import { Client } from 'ssh2';
import Store from 'electron-store';
import * as path from 'path';

// Håll en global referens till fönsterobjektet för att förhindra att det stängs automatiskt
// när JavaScript-objektet skräddas av skräpsamlaren.
let mainWindow: BrowserWindow | null = null;

// SSH-anslutningar
const sshConnections = new Map<string, Client>();

// Lagerhantering
const store = new Store({
  name: 'screamm-ssh-config',
  defaults: {
    connections: []
  }
});

// Diagnostik för systemkompatibilitet
const runSystemDiagnostics = () => {
  console.log('=== SYSTEM DIAGNOSTIK ===');
  console.log(`Node.js version: ${process.versions.node}`);
  console.log(`Electron version: ${process.versions.electron}`);
  console.log(`Chrome version: ${process.versions.chrome}`);
  console.log(`V8 version: ${process.versions.v8}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Arch: ${process.arch}`);
  console.log('=== MODULER ===');
  
  try {
    // Testa SSH2-modulen
    const SSH2 = require('ssh2');
    console.log('SSH2 modul: OK');
  } catch (error) {
    console.error('SSH2 modul: FEL', error);
  }
  
  try {
    // Testa Electron Store
    const Store = require('electron-store');
    console.log('Electron Store modul: OK');
  } catch (error) {
    console.error('Electron Store modul: FEL', error);
  }
  
  try {
    // Testa fs
    const fs = require('fs');
    console.log('FS modul: OK');
  } catch (error) {
    console.error('FS modul: FEL', error);
  }
  
  console.log('=========================');
};

const createWindow = (): void => {
  // Skapa webbläsarfönstret.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    },
    backgroundColor: '#121212', // Mörkt tema
    show: false, // Dölj fönstret tills det är redo att visas
  });

  // Konfigurera säker Content Security Policy (CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:;"
        ]
      }
    });
  });

  // och ladda appens index.html.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Öppna DevTools i utvecklingsläge
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Visa fönstret när det är klart för att undvika blinkande
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Frigör fönsterobjektet när fönstret stängs
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Denna metod kallas när Electron har avslutat initialiseringen
// och är redo att skapa webbläsarfönster.
// Vissa API:er kan endast användas efter att denna händelse inträffar.
app.whenReady().then(() => {
  runSystemDiagnostics();
  createWindow();
  
  // Öppna DevTools i utvecklingsmiljö
  if (process.env.NODE_ENV === 'development') {
    mainWindow?.webContents.openDevTools();
  }
});

// Avsluta när alla fönster är stängda.
app.on('window-all-closed', () => {
  // På macOS är det vanligt att applikationen och dess menyrad
  // förblir aktiva tills användaren avslutar uttryckligen med Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // På macOS är det vanligt att återskapa ett fönster i applikationen när
  // dock-ikonen klickas och det inte finns andra öppna fönster.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC-kommunikation
// Hantera sparade anslutningar
ipcMain.handle('get-saved-connections', () => {
  return store.get('connections');
});

ipcMain.handle('save-connection', (_, connection) => {
  const connections = store.get('connections') as any[];
  const existingIdx = connections.findIndex(c => c.id === connection.id);
  
  if (existingIdx >= 0) {
    connections[existingIdx] = connection;
  } else {
    connections.push(connection);
  }
  
  store.set('connections', connections);
  return connections;
});

ipcMain.handle('delete-connection', (_, id) => {
  const connections = store.get('connections') as any[];
  const newConnections = connections.filter(c => c.id !== id);
  store.set('connections', newConnections);
  return newConnections;
});

// SSH-funktioner
ipcMain.handle('ssh-connect', async (_, id, config) => {
  return new Promise((resolve, reject) => {
    try {
      const client = new Client();
      
      client
        .on('ready', () => {
          sshConnections.set(id, client);
          resolve({ success: true });
        })
        .on('error', (err) => {
          reject({ success: false, error: err.message });
        })
        .connect(config);
    } catch (err: any) {
      reject({ success: false, error: err.message });
    }
  });
});

ipcMain.handle('ssh-execute', async (_, id, command) => {
  return new Promise((resolve, reject) => {
    const client = sshConnections.get(id);
    
    if (!client) {
      reject({ success: false, error: 'Ingen aktiv SSH-anslutning' });
      return;
    }
    
    client.exec(command, (err, stream) => {
      if (err) {
        reject({ success: false, error: err.message });
        return;
      }
      
      let data = '';
      let errData = '';
      
      stream
        .on('data', (chunk: Buffer) => {
          data += chunk;
        })
        .on('stderr', (chunk: Buffer) => {
          errData += chunk;
        })
        .on('close', () => {
          resolve({ success: true, data, errData });
        })
        .on('error', (err: Error) => {
          reject({ success: false, error: err.message });
        });
    });
  });
});

ipcMain.handle('ssh-disconnect', (_, id) => {
  const client = sshConnections.get(id);
  
  if (client) {
    client.end();
    sshConnections.delete(id);
  }
  
  return { success: true };
});

}); 