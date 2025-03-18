// preload.js för att köra i renderer-processen
const { contextBridge, ipcRenderer } = require('electron');

// Logga miljöinformation
console.log('Preload-skript laddas...');
console.log('Node version:', process.versions.node);
console.log('Electron version:', process.versions.electron);
console.log('Chrome version:', process.versions.chrome);
console.log('Current directory:', process.cwd());

// Bygg en säker API för att exponera till renderer-processen
const allowedChannels = [
  'ping',
  'load-react-app',
  'test-ssh-connection',
  'connect-ssh',
  'disconnect-ssh',
  'execute-ssh-command',
  'open-ssh-shell',
  'resize-terminal',
  'save-connection',
  'delete-connection',
  'get-saved-connections',
  'save-theme',
  'get-themes',
  'get-settings',
  'save-settings'
];

// Validera kanal för säkerhet
const isValidChannel = (channel) => {
  return allowedChannels.includes(channel);
};

// En central event emitter för terminal-händelser
const terminalEventListeners = {
  data: {},
  exit: {},
  error: {}
};

// Skapa en terminal-emitter som exponeras till renderer
const terminalEmitter = {
  onData: (sessionId, callback) => {
    if (!terminalEventListeners.data[sessionId]) {
      terminalEventListeners.data[sessionId] = [];
    }
    terminalEventListeners.data[sessionId].push(callback);
    
    return () => {
      if (terminalEventListeners.data[sessionId]) {
        const index = terminalEventListeners.data[sessionId].indexOf(callback);
        if (index !== -1) {
          terminalEventListeners.data[sessionId].splice(index, 1);
        }
      }
    };
  },
  
  onExit: (sessionId, callback) => {
    if (!terminalEventListeners.exit[sessionId]) {
      terminalEventListeners.exit[sessionId] = [];
    }
    terminalEventListeners.exit[sessionId].push(callback);
    
    return () => {
      if (terminalEventListeners.exit[sessionId]) {
        const index = terminalEventListeners.exit[sessionId].indexOf(callback);
        if (index !== -1) {
          terminalEventListeners.exit[sessionId].splice(index, 1);
        }
      }
    };
  },
  
  onError: (sessionId, callback) => {
    if (!terminalEventListeners.error[sessionId]) {
      terminalEventListeners.error[sessionId] = [];
    }
    terminalEventListeners.error[sessionId].push(callback);
    
    return () => {
      if (terminalEventListeners.error[sessionId]) {
        const index = terminalEventListeners.error[sessionId].indexOf(callback);
        if (index !== -1) {
          terminalEventListeners.error[sessionId].splice(index, 1);
        }
      }
    };
  },
  
  write: (sessionId, data) => {
    ipcRenderer.send('terminal-data', { sessionId, data });
  }
};

// Lyssna på terminal-händelser från main-processen
ipcRenderer.on('terminal-data', (event, { sessionId, data }) => {
  if (terminalEventListeners.data[sessionId]) {
    terminalEventListeners.data[sessionId].forEach(callback => callback(data));
  }
});

ipcRenderer.on('terminal-exit', (event, { sessionId, code, signal }) => {
  if (terminalEventListeners.exit[sessionId]) {
    terminalEventListeners.exit[sessionId].forEach(callback => callback(code, signal));
  }
});

ipcRenderer.on('terminal-error', (event, { sessionId, error }) => {
  if (terminalEventListeners.error[sessionId]) {
    terminalEventListeners.error[sessionId].forEach(callback => callback(error));
  }
});

// Exponera säkra API:er till renderer-processen
contextBridge.exposeInMainWorld('electronAPI', {
  // Grundläggande IPC
  ping: () => ipcRenderer.invoke('ping'),
  loadReactApp: () => ipcRenderer.invoke('load-react-app'),
  
  // SSH-funktioner
  testSSHConnection: (config) => ipcRenderer.invoke('test-ssh-connection', config),
  connectSSH: (config) => ipcRenderer.invoke('connect-ssh', config),
  disconnectSSH: (sessionId) => ipcRenderer.invoke('disconnect-ssh', sessionId),
  executeCommand: (sessionId, command) => ipcRenderer.invoke('execute-ssh-command', sessionId, command),
  openSSHShell: (sessionId) => ipcRenderer.invoke('open-ssh-shell', sessionId),
  resizeTerminal: (sessionId, cols, rows) => ipcRenderer.invoke('resize-terminal', sessionId, cols, rows),
  
  // Anslutningsfunktioner
  saveConnection: (connection) => ipcRenderer.invoke('save-connection', connection),
  deleteConnection: (connectionId) => ipcRenderer.invoke('delete-connection', connectionId),
  getSavedConnections: () => ipcRenderer.invoke('get-saved-connections'),
  
  // Tema-funktioner
  saveTheme: (theme) => ipcRenderer.invoke('save-theme', theme),
  getThemes: () => ipcRenderer.invoke('get-themes'),
  
  // Inställnings-funktioner
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Versionsinformation
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Exponera terminalEmitter för att hantera terminal-events
contextBridge.exposeInMainWorld('terminalEmitter', terminalEmitter);

console.log('Preload-skript laddat! electronAPI är nu tillgängligt i renderer-processen.'); 