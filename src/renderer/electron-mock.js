/**
 * ELECTRON API MOCK
 * 
 * Denna fil används för att ersätta electron-importer i renderer-processen.
 * Detta gör att vi kan använda samma kod i både Electron-appen och under utveckling.
 */

// Kontrollera om vi kör i en Electron-miljö
const isElectron = () => {
  return window && window.process && window.process.type;
};

// Mock för ipcRenderer
const ipcRenderer = {
  invoke: (channel, ...args) => {
    console.log(`[MOCK] ipcRenderer.invoke kallas för kanal: ${channel}`, args);
    
    // Simulera några vanliga kanaler
    if (channel === 'ping') {
      return Promise.resolve('pong');
    }
    
    if (channel === 'test-channel') {
      return Promise.resolve({ success: true, message: 'Detta är en simulerad IPC-respons!' });
    }
    
    // För alla andra kanaler, returnera ett simulerat fel
    return Promise.reject(new Error(`[MOCK] Kanal '${channel}' är inte implementerad i mocken.`));
  },
  
  on: (channel, listener) => {
    console.log(`[MOCK] ipcRenderer.on lyssnar på kanal: ${channel}`);
    // Här kunde vi lägga till eventuella simulerade händelser
    return {
      channel,
      listener,
      remove: () => console.log(`[MOCK] Ta bort lyssnare för kanal: ${channel}`)
    };
  },
  
  send: (channel, ...args) => {
    console.log(`[MOCK] ipcRenderer.send kallas för kanal: ${channel}`, args);
    // Ingen respons från send
  }
};

// Mock för shell
const shell = {
  openExternal: (url) => {
    console.log(`[MOCK] shell.openExternal kallas med URL: ${url}`);
    // Öppna i en ny flik i utvecklingsmiljön
    window.open(url, '_blank');
    return Promise.resolve();
  }
};

// Mock för remote
const remote = {
  app: {
    getPath: (name) => {
      console.log(`[MOCK] remote.app.getPath kallas med: ${name}`);
      return '/mocked/path/' + name;
    },
    getVersion: () => {
      return '1.0.0-mock';
    }
  },
  dialog: {
    showOpenDialog: (options) => {
      console.log('[MOCK] remote.dialog.showOpenDialog kallas med:', options);
      return Promise.resolve({ canceled: false, filePaths: ['/mocked/path/selected-file.txt'] });
    },
    showSaveDialog: (options) => {
      console.log('[MOCK] remote.dialog.showSaveDialog kallas med:', options);
      return Promise.resolve({ canceled: false, filePath: '/mocked/path/saved-file.txt' });
    }
  }
};

/**
 * En mock av Electron-modulen för användning i renderer-processen
 * Detta låter oss utveckla och bygga med webpack utan att få fel relaterade
 * till Electron-specifika APIs som inte finns i en ren webbläsarmiljö.
 */

console.log('Laddar Electron-mock...');

// Simulera Electron-miljö för render-processen
const mock = {
  // Grundläggande fält
  ipcRenderer: {
    invoke: (channel, ...args) => {
      console.log(`Mock ipcRenderer.invoke('${channel}')`, args);
      return Promise.resolve(`Mock-svar från kanal: ${channel}`);
    },
    on: (channel, callback) => {
      console.log(`Mock ipcRenderer.on('${channel}')`);
      return () => {
        console.log(`Mock: Avregistrerar lyssnare för '${channel}'`);
      };
    },
    once: (channel, callback) => {
      console.log(`Mock ipcRenderer.once('${channel}')`);
    },
    removeListener: (channel, callback) => {
      console.log(`Mock ipcRenderer.removeListener('${channel}')`);
    }
  },
  
  // Fler mocks kan läggas till här vid behov
  clipboard: {
    writeText: (text) => {
      console.log('Mock clipboard.writeText:', text);
    },
    readText: () => {
      return 'Mock clipboard text';
    }
  },
  
  // Versioner
  process: {
    versions: {
      node: '16.0.0',
      chrome: '94.0.0',
      electron: '15.0.0'
    }
  }
};

console.log('Electron-mock laddad!');

// Exportera mockade API:er
module.exports = {
  ipcRenderer,
  shell,
  remote,
  // För att stödja detektering av Electron
  isElectron: isElectron(),
  mock
}; 