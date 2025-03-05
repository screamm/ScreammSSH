export interface SavedConnection {
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

export const storageService = {
  async getSavedConnections(): Promise<SavedConnection[]> {
    return window.electronAPI.getSavedConnections();
  },

  async saveConnection(connection: SavedConnection): Promise<void> {
    await window.electronAPI.saveConnection(connection);
  },

  async deleteConnection(id: string): Promise<void> {
    await window.electronAPI.deleteConnection(id);
  }
}; 