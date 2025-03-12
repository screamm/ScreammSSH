import { SSHConnectionInfo } from './SSHService';

// Ett förenklat storage service för att hantera persistens av data
export const storageService = {
  async getSavedConnections(): Promise<SSHConnectionInfo[]> {
    return window.electronAPI.getSavedConnections();
  },

  async saveConnection(connection: SSHConnectionInfo): Promise<void> {
    return window.electronAPI.saveConnection(connection);
  },

  async deleteConnection(id: string): Promise<void> {
    return window.electronAPI.deleteConnection(id);
  }
}; 