// Lägg till dessa konstanter högst upp i filen
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import { setupSSHHandlers } from './ssh-handler';
import { setupSftpHandlers } from './sftp-handler';
import { setupStorageHandlers } from './storage-handler';

// Konfigurering av persistent lagring
const store = new Store({
  name: 'screamm-ssh-config',
  defaults: {
    connections: []
  }
});

let mainWindow: BrowserWindow | null = null;

// Konfigurera SSH-, SFTP- och Storage handlers direkt
// så att de är redo när appen startar
setupSSHHandlers();
setupSftpHandlers({ force: true });
setupStorageHandlers();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
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

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Visa fönstret när det är klart för att undvika blinkande
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 