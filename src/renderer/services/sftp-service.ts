import { mockElectron, fileExists } from '../utils/electron-fix';

export interface FileEntry {
  filename: string;
  longname: string;
  attrs: {
    size: number;
    mtime: number;
    atime: number;
    isDirectory: boolean;
    isFile: boolean;
    isSymbolicLink: boolean;
  };
}

export class SFTPService {
  private connectionId: string;
  
  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }
  
  /**
   * Listar filer och mappar i den angivna katalogen
   */
  async listDirectory(path: string): Promise<FileEntry[]> {
    try {
      const response = await window.electronAPI.sftpListDirectory(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte lista katalog');
      }
      
      return response.files || [];
    } catch (error: any) {
      console.error('SFTP listDirectory error:', error);
      throw new Error(`Kunde inte lista katalog: ${error.message}`);
    }
  }
  
  /**
   * Hämtar innehållet i en fil
   */
  async getFileContent(path: string): Promise<string> {
    try {
      const response = await window.electronAPI.sftpReadFile(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte läsa fil');
      }
      
      return response.content || '';
    } catch (error: any) {
      console.error('SFTP getFileContent error:', error);
      throw new Error(`Kunde inte läsa fil: ${error.message}`);
    }
  }
  
  /**
   * Skriver innehåll till en fil
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      const response = await window.electronAPI.sftpWriteFile(this.connectionId, path, content);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte skriva till fil');
      }
    } catch (error: any) {
      console.error('SFTP writeFile error:', error);
      throw new Error(`Kunde inte skriva till fil: ${error.message}`);
    }
  }
  
  /**
   * Tar bort en fil
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const response = await window.electronAPI.sftpDeleteFile(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte ta bort fil');
      }
    } catch (error: any) {
      console.error('SFTP deleteFile error:', error);
      throw new Error(`Kunde inte ta bort fil: ${error.message}`);
    }
  }
  
  /**
   * Skapar en ny katalog
   */
  async createDirectory(path: string): Promise<void> {
    try {
      const response = await window.electronAPI.sftpCreateDirectory(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte skapa katalog');
      }
    } catch (error: any) {
      console.error('SFTP createDirectory error:', error);
      throw new Error(`Kunde inte skapa katalog: ${error.message}`);
    }
  }
  
  /**
   * Tar bort en katalog och dess innehåll rekursivt
   */
  async deleteDirectory(path: string): Promise<void> {
    try {
      const response = await window.electronAPI.sftpDeleteDirectory(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte ta bort katalog');
      }
    } catch (error: any) {
      console.error('SFTP deleteDirectory error:', error);
      throw new Error(`Kunde inte ta bort katalog: ${error.message}`);
    }
  }
  
  /**
   * Byter namn på en fil eller katalog
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      const response = await window.electronAPI.sftpRename(this.connectionId, oldPath, newPath);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte byta namn');
      }
    } catch (error: any) {
      console.error('SFTP rename error:', error);
      throw new Error(`Kunde inte byta namn: ${error.message}`);
    }
  }
  
  /**
   * Kopierar en fil från den lokala systemet till servern
   */
  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    try {
      // I renderer-processen måste vi använda Electron Dialog API via IPC
      // för att välja filer och sedan skicka innehållet via IPC
      // Detta är en förenklad implementation.
      const response = await window.electronAPI.sftpUploadFile(this.connectionId, localPath, remotePath);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte ladda upp fil');
      }
    } catch (error: any) {
      console.error('SFTP uploadFile error:', error);
      throw new Error(`Kunde inte ladda upp fil: ${error.message}`);
    }
  }
  
  /**
   * Kopierar en fil från servern till det lokala systemet
   */
  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    try {
      // I renderer-processen måste vi använda Electron Dialog API via IPC
      // för att välja spara-plats och sedan ta emot innehåll via IPC
      const response = await window.electronAPI.sftpDownloadFile(this.connectionId, remotePath, localPath);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte ladda ner fil');
      }
    } catch (error: any) {
      console.error('SFTP downloadFile error:', error);
      throw new Error(`Kunde inte ladda ner fil: ${error.message}`);
    }
  }
  
  /**
   * Hämtar filstatistik för en fil eller katalog
   */
  async getStats(path: string): Promise<any> {
    try {
      const response = await window.electronAPI.sftpGetStats(this.connectionId, path);
      
      if (!response.success) {
        throw new Error(response.error || 'Kunde inte hämta filstatistik');
      }
      
      return response.stats;
    } catch (error: any) {
      console.error('SFTP getStats error:', error);
      throw new Error(`Kunde inte hämta filstatistik: ${error.message}`);
    }
  }
  
  /**
   * Kontrollerar om en sökväg existerar
   */
  async exists(path: string): Promise<boolean> {
    try {
      const response = await window.electronAPI.sftpExists(this.connectionId, path);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.exists || false;
    } catch (error: any) {
      console.error('SFTP exists error:', error);
      // Om vi får ett felmeddelande när vi kontrollerar om en sökväg existerar,
      // antar vi att den inte existerar
      return false;
    }
  }
  
  /**
   * Kopplar från SFTP-anslutningen
   */
  disconnect(): void {
    // SFTP-anslutningen stängs automatiskt när SSH-anslutningen stängs
  }
} 