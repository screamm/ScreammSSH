// Preload-skript för kommunikation mellan Electron och renderer
// Undvik att använda __dirname direkt

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Loggning av miljöinfo för felsökning
console.log('📋 Preload-skript körs...');
console.log('- Node-version:', process.versions.node);
console.log('- Electron-version:', process.versions.electron);
console.log('- Chrome-version:', process.versions.chrome);
console.log('- Arbetsdir:', process.cwd());

// Lista över tillåtna IPC-kanaler
const validChannels = ['test-channel', 'ping'];

// Hjälpfunktion för att validera meddelandekanaler
const validateMessage = (channel) => {
  if (!validChannels.includes(channel)) {
    const error = new Error(`Otillåten IPC-kanal: ${channel}`);
    console.error(error);
    return false;
  }
  return true;
};

// Exponera säker API till renderer
console.log('🔄 Exponerar elektronAPI...');

contextBridge.exposeInMainWorld('electronAPI', {
  // Grundläggande IPC-kommunikation
  invoke: async (channel, data) => {
    if (!validateMessage(channel)) {
      throw new Error(`Otillåten IPC-kanal: ${channel}`);
    }
    
    try {
      return await ipcRenderer.invoke(channel, data);
    } catch (error) {
      console.error(`IPC-fel (${channel}):`, error);
      throw error;
    }
  },
  
  // Lyssnare för händelser från huvudprocessen
  on: (channel, callback) => {
    if (!validateMessage(channel)) {
      throw new Error(`Otillåten IPC-kanal: ${channel}`);
    }
    
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  
  // Bekväma hjälpmetoder
  ping: () => ipcRenderer.invoke('ping'),
  test: () => ipcRenderer.invoke('test-channel'),
  
  // API-version
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    currentWorkingDir: process.cwd() // Använd process.cwd() istället för __dirname
  }
});

console.log('✅ electronAPI exponerad till renderer-processen'); 