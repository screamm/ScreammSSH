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
    theme: 'default'  // Standardtema
  }
});

export const setupStorageHandlers = (): void => {
  // Hämta sparade anslutningar
  ipcMain.handle('storage:get-saved-connections', () => {
    return store.get('connections');
  });
  
  // Spara en anslutning
  ipcMain.handle('storage:save-connection', (event, args) => {
    const { connection } = args;
    
    // Hämta befintliga anslutningar
    const connections = store.get('connections') as any[];
    
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
    store.set('connections', connections);
    
    return { success: true, connections };
  });
  
  // Ta bort en anslutning
  ipcMain.handle('storage:delete-connection', (event, args) => {
    const { id } = args;
    
    // Hämta befintliga anslutningar
    const connections = store.get('connections') as any[];
    
    // Filtrera bort anslutningen med det angivna ID:t
    const updatedConnections = connections.filter(conn => conn.id !== id);
    
    // Spara de uppdaterade anslutningarna
    store.set('connections', updatedConnections);
    
    return { success: true, connections: updatedConnections };
  });
  
  // Hämta valt tema
  ipcMain.handle('storage:get-theme', () => {
    return store.get('theme');
  });
  
  // Spara valt tema
  ipcMain.handle('storage:save-theme', (event, args) => {
    const { theme } = args;
    store.set('theme', theme);
    return { success: true };
  });
}; 