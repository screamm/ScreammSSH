/**
 * Den här filen erbjuder en säker väg för att använda electron-API
 * i renderer-processen. Den förebygger fel som fs.existsSync is not a function.
 */

// Om window.electronAPI finns, använd det. Annars skapa ett tomt objekt.
const electronAPI = window.electronAPI || {};

// Exportera en mock av electron-modulen om vi är i renderer-processen
export const mockElectron = {
  // Om koden försöker använda 'ipcRenderer', erbjud vår säkra version
  ipcRenderer: {
    // Omdirigera alla anrop till vår säkra preload-API
    invoke: (channel: string, ...args: any[]) => {
      const safeChannel = channel.replace(':', '');
      if (electronAPI && typeof (electronAPI as any)[safeChannel] === 'function') {
        return (electronAPI as any)[safeChannel](...args);
      }
      console.warn(`Försökte anropa osäker IPC-kanal: ${channel}`);
      return Promise.reject(new Error(`Osäker IPC-kanal: ${channel}`));
    },
    on: () => {
      console.warn('ipcRenderer.on är inte tillgänglig i renderer-processen');
      return { remove: () => {} };
    },
    removeListener: () => {
      console.warn('ipcRenderer.removeListener är inte tillgänglig i renderer-processen');
    }
  },
  // Lägg till fler electron-moduler här om de behövs
};

// En hjälpfunktion som kan användas istället för direkt fs-åtkomst
export const fileExists = async (path: string, connectionId?: string): Promise<boolean> => {
  // Om vi har en connectionId, använd SFTP för att kontrollera om filen existerar
  if (connectionId && window.electronAPI?.sftpExists) {
    try {
      const response = await window.electronAPI.sftpExists(connectionId, path);
      return response.exists || false;
    } catch (error) {
      console.error('Fel vid kontroll om filen existerar:', error);
      return false;
    }
  }
  
  // Annars returnera false eftersom renderer-processen inte kan komma åt filsystemet direkt
  console.warn('fileExists anropades utan connectionId i renderer-processen');
  return false;
};

export default mockElectron; 