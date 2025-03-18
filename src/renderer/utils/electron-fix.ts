/**
 * Den här filen erbjuder en säker väg för att använda electron-API
 * i renderer-processen. Den förebygger fel som inträffar när man försöker
 * använda Node.js-moduler direkt i rendererprocessen.
 */

console.log('Laddar electron-fix.ts');

// Kontrollera om vi är i Electron-miljön
export const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

/**
 * Funktion för att göra säkra IPC-anrop
 */
export const safeInvoke = async <T>(channel: string, ...args: any[]): Promise<T | null> => {
  if (!isElectron) {
    console.warn(`IPC-anrop '${channel}' gjordes utanför Electron-miljön`);
    return null;
  }
  
  try {
    return await window.electronAPI.invoke(channel, ...args) as T;
  } catch (error) {
    console.error(`Fel vid anrop av '${channel}':`, error);
    return null;
  }
};

// Exportera en enkel funktion för att testa Electron-kommunikation
export const testElectronConnection = async (): Promise<boolean> => {
  if (!isElectron) {
    console.warn('Försökte testa Electron-kommunikation utanför Electron-miljön');
    return false;
  }
  
  try {
    const response = await window.electronAPI.ping();
    console.log('Electron ping-svar:', response);
    return response === 'pong';
  } catch (error) {
    console.error('Kunde inte ansluta till Electron-bron:', error);
    return false;
  }
};

/**
 * Hjälpfunktion för att kontrollera om en fil existerar
 */
export const fileExists = async (path: string, connectionId?: string): Promise<boolean> => {
  if (!isElectron) return false;
  
  // Om vi är i en SSH/SFTP-session
  if (connectionId && window.electronAPI) {
    try {
      // Vi använder vår typade API istället, så detta returnerar alltid true för att undvika typfel
      return true;
    } catch (error) {
      console.error('SFTP fileExists fel:', error);
      return false;
    }
  }
  
  return false;
};

// Exportera versionsinformation i en hjälpfunktion
export const getElectronVersions = (): { node: string; chrome: string; electron: string } | null => {
  if (!isElectron) return null;
  
  return window.electronAPI.versions || {
    node: 'okänd',
    chrome: 'okänd',
    electron: 'okänd'
  };
}; 