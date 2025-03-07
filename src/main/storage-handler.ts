import { ipcMain } from 'electron';
import Store from 'electron-store';

interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  usePrivateKey: boolean;
  group?: string;
}

// Konfigurering av persistent lagring
const store = new Store({
  name: 'screamm-ssh-config',
  defaults: {
    connections: [],
    theme: 'default',  // Standardtema
    language: 'sv',    // Standardspråk
    terminalSettings: {
      retroEffect: true,
      cursorBlink: true,
      fontSize: 14
    }
  }
});

// Sparade anslutningar
const CONNECTIONS_KEY = 'saved-connections';
// Tema
const THEME_KEY = 'app-theme';
// Språk
const LANGUAGE_KEY = 'app-language';
// Terminalinställningar
const TERMINAL_SETTINGS_KEY = 'terminal-settings';

// Hämta standardtema
const DEFAULT_THEME = 'default';
// Hämta standardspråk
const DEFAULT_LANGUAGE = 'sv';

export const setupStorageHandlers = (): void => {
  // Hämta sparade anslutningar
  ipcMain.handle('get-saved-connections', async () => {
    try {
      return store.get(CONNECTIONS_KEY, []);
    } catch (error) {
      console.error('Fel vid hämtning av sparade anslutningar:', error);
      return { success: false, error: 'Kunde inte hämta sparade anslutningar' };
    }
  });
  
  // Spara en anslutning
  ipcMain.handle('save-connection', async (_, connection: SavedConnection) => {
    try {
      let connections = store.get(CONNECTIONS_KEY, []) as SavedConnection[];
      
      // Kolla om anslutningen redan finns
      const existingIndex = connections.findIndex(conn => conn.id === connection.id);
      
      if (existingIndex !== -1) {
        // Uppdatera befintlig anslutning
        connections[existingIndex] = connection;
      } else {
        // Lägg till ny anslutning
        connections.push(connection);
      }
      
      // Spara anslutningarna
      store.set(CONNECTIONS_KEY, connections);
      
      return { success: true, connections };
    } catch (error) {
      console.error('Fel vid sparande av anslutning:', error);
      return { success: false, error: 'Kunde inte spara anslutningen' };
    }
  });
  
  // Ta bort en anslutning
  ipcMain.handle('delete-connection', async (_, id: string) => {
    try {
      let connections = store.get(CONNECTIONS_KEY, []) as SavedConnection[];
      
      // Filtrera bort anslutningen med det angivna ID:t
      connections = connections.filter(conn => conn.id !== id);
      
      // Spara de uppdaterade anslutningarna
      store.set(CONNECTIONS_KEY, connections);
      
      return { success: true, connections };
    } catch (error) {
      console.error('Fel vid borttagning av anslutning:', error);
      return { success: false, error: 'Kunde inte ta bort anslutningen' };
    }
  });
  
  // Hämta valt tema
  ipcMain.handle('get-theme', async () => {
    try {
      return store.get(THEME_KEY, DEFAULT_THEME);
    } catch (error) {
      console.error('Fel vid hämtning av tema:', error);
      return DEFAULT_THEME;
    }
  });
  
  // Spara valt tema
  ipcMain.handle('save-theme', async (_, theme: string) => {
    try {
      store.set(THEME_KEY, theme);
      return { success: true };
    } catch (error) {
      console.error('Fel vid sparande av tema:', error);
      return { success: false, error: 'Kunde inte spara temat' };
    }
  });

  // Hämta språk
  ipcMain.handle('get-language', async () => {
    try {
      return store.get(LANGUAGE_KEY, DEFAULT_LANGUAGE);
    } catch (error) {
      console.error('Fel vid hämtning av språk:', error);
      return DEFAULT_LANGUAGE;
    }
  });

  // Spara språk
  ipcMain.handle('save-language', async (_, language: string) => {
    try {
      store.set(LANGUAGE_KEY, language);
      return { success: true };
    } catch (error) {
      console.error('Fel vid sparande av språk:', error);
      return { success: false, error: 'Kunde inte spara språket' };
    }
  });

  // Hämta terminalinställningar
  ipcMain.handle('get-terminal-settings', async () => {
    try {
      return store.get(TERMINAL_SETTINGS_KEY, {
        retroEffect: true,
        cursorBlink: true,
        fontSize: 14
      });
    } catch (error) {
      console.error('Fel vid hämtning av terminalinställningar:', error);
      return {
        retroEffect: true,
        cursorBlink: true,
        fontSize: 14
      };
    }
  });

  // Spara terminalinställningar
  ipcMain.handle('save-terminal-settings', async (_, settings: any) => {
    try {
      store.set(TERMINAL_SETTINGS_KEY, settings);
      return { success: true };
    } catch (error) {
      console.error('Fel vid sparande av terminalinställningar:', error);
      return { success: false, error: 'Kunde inte spara terminalinställningarna' };
    }
  });
}; 