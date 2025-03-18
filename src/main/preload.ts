/**
 * Preload-skript för Electron
 * 
 * Detta skript körs innan renderer-processen laddas,
 * och exponerar elektronAPI till renderer på ett säkert sätt.
 */

import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

console.log('📄 Preload-skript initialiserat');

// Ladda inställningar från fil
const settingsFilePath = path.join(os.homedir(), '.screammssh-settings.json');
let settings: any = {};

try {
  if (fs.existsSync(settingsFilePath)) {
    const data = fs.readFileSync(settingsFilePath, 'utf8');
    settings = JSON.parse(data);
    console.log('📂 Inställningar laddade från:', settingsFilePath);
  } else {
    console.log('📂 Inställningsfilen hittades inte, använder standardinställningar');
    settings = {
      general: {
        language: 'sv',
        autoConnect: false,
        clearCommandHistory: true,
        confirmDisconnect: true
      },
      terminal: {
        fontSize: 14,
        fontFamily: 'Consolas, monospace',
        cursorStyle: 'block',
        cursorBlink: true,
        scrollback: 1000,
        theme: 'default',
        retroEffect: false
      },
      ssh: {
        keepAliveInterval: 30,
        reconnectAttempts: 3,
        reconnectDelay: 5000,
        defaultPort: 22
      }
    };
    
    // Spara standardinställningar
    try {
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      console.log('💾 Standardinställningar sparade till:', settingsFilePath);
    } catch (err) {
      console.error('❌ Kunde inte spara standardinställningar:', err);
    }
  }
} catch (err) {
  console.error('❌ Fel vid laddning av inställningar:', err);
  settings = {};
}

// Exponera API:er till renderer-processen
contextBridge.exposeInMainWorld('electronAPI', {
  // Grundläggande IPC
  invoke: (channel: string, ...args: any[]) => {
    console.log(`IPC.invoke anropad: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  
  // Test och diagnostik
  ping: () => ipcRenderer.invoke('ping'),
  test: () => ipcRenderer.invoke('test-channel'),
  
  // Versioner
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Fungerande stub-funktioner för att tillfälligt låta applikationen byggas
  // Dessa ska implementeras med riktig funktionalitet senare
  connectSSH: async (config: any) => {
    console.log('Stub: connectSSH anropad', config);
    return true;
  },
  
  disconnectSSH: async (connectionId: string) => {
    console.log('Stub: disconnectSSH anropad', connectionId);
  },
  
  executeSSHCommand: async (connectionId: string, command: string) => {
    console.log('Stub: executeSSHCommand anropad', connectionId, command);
    return `Simulerat kommando: ${command}`;
  },
  
  openSSHShell: async (connectionId: string) => {
    console.log('Stub: openSSHShell anropad', connectionId);
    return true;
  },
  
  writeToSSHShell: async (connectionId: string, data: string) => {
    console.log('Stub: writeToSSHShell anropad', connectionId, data);
    return true;
  },
  
  resizeSSHShell: async (connectionId: string, cols: number, rows: number) => {
    console.log('Stub: resizeSSHShell anropad', connectionId, cols, rows);
    return true;
  },
  
  closeSSHShell: async (connectionId: string) => {
    console.log('Stub: closeSSHShell anropad', connectionId);
    return true;
  },
  
  onSSHEvent: (callback: (event: any) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('ssh-event', subscription);
    
    return () => {
      ipcRenderer.removeListener('ssh-event', subscription);
    };
  },
  
  // SFTP funktioner (stub)
  sftpConnect: async (connectionId: string) => {
    console.log('Stub: sftpConnect anropad', connectionId);
    return true;
  },
  
  sftpDisconnect: async (connectionId: string) => {
    console.log('Stub: sftpDisconnect anropad', connectionId);
  },
  
  sftpListDirectory: async (connectionId: string, directory: string) => {
    console.log('Stub: sftpListDirectory anropad', connectionId, directory);
    return [
      {
        filename: 'example.txt',
        longname: '-rw-r--r--  1 user  staff  1234 Jan 1 12:00 example.txt',
        attrs: {
          size: 1234,
          mtime: Date.now() / 1000,
          atime: Date.now() / 1000,
          uid: 1000,
          gid: 1000,
          mode: 33188,
          permissions: 33188,
          isDirectory: false,
          isFile: true,
          isSymbolicLink: false
        }
      }
    ];
  },
  
  sftpGetFile: async (connectionId: string, remotePath: string, localPath: string) => {
    console.log('Stub: sftpGetFile anropad', connectionId, remotePath, localPath);
  },
  
  sftpPutFile: async (connectionId: string, localPath: string, remotePath: string) => {
    console.log('Stub: sftpPutFile anropad', connectionId, localPath, remotePath);
  },
  
  sftpDeleteFile: async (connectionId: string, path: string) => {
    console.log('Stub: sftpDeleteFile anropad', connectionId, path);
  },
  
  sftpMakeDirectory: async (connectionId: string, path: string) => {
    console.log('Stub: sftpMakeDirectory anropad', connectionId, path);
  },
  
  sftpDeleteDirectory: async (connectionId: string, path: string) => {
    console.log('Stub: sftpDeleteDirectory anropad', connectionId, path);
  },
  
  sftpRename: async (connectionId: string, oldPath: string, newPath: string) => {
    console.log('Stub: sftpRename anropad', connectionId, oldPath, newPath);
  },
  
  // Inställningar och lagringshantering
  getSettings: async () => {
    console.log('getSettings anropad');
    return settings;
  },
  
  saveSettings: async (newSettings: any) => {
    console.log('saveSettings anropad', newSettings);
    settings = newSettings;
    try {
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      console.log('📄 Inställningar sparade');
    } catch (err) {
      console.error('❌ Kunde inte spara inställningar:', err);
      throw err;
    }
  },
  
  getSavedConnections: async () => {
    console.log('getSavedConnections anropad');
    return [];
  },
  
  saveConnection: async (connection: any) => {
    console.log('saveConnection anropad', connection);
  },
  
  deleteConnection: async (id: string) => {
    console.log('deleteConnection anropad', id);
  },
  
  // Tema
  getThemes: async () => {
    console.log('getThemes anropad');
    return [
      {
        id: 'default',
        name: 'Standard',
        colors: {
          background: '#282c34',
          foreground: '#abb2bf',
          cursor: '#528bff',
          selection: 'rgba(82, 139, 255, 0.3)',
          black: '#282c34',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#abb2bf',
          brightBlack: '#5c6370',
          brightRed: '#e06c75',
          brightGreen: '#98c379',
          brightYellow: '#e5c07b',
          brightBlue: '#61afef',
          brightMagenta: '#c678dd',
          brightCyan: '#56b6c2',
          brightWhite: '#ffffff'
        }
      }
    ];
  },
  
  getTheme: async (id: string) => {
    console.log('getTheme anropad', id);
    return null;
  },
  
  saveTheme: async (theme: any) => {
    console.log('saveTheme anropad', theme);
  },
  
  deleteTheme: async (id: string) => {
    console.log('deleteTheme anropad', id);
  }
});

console.log('✅ electronAPI exponerat till renderer-processen'); 