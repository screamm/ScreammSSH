import { SFTPFile } from '../electron';

export class SFTPService {
  private connectionId: string;
  private isConnected: boolean = false;

  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }

  async connect(): Promise<boolean> {
    try {
      if (!window.electronAPI || !window.electronAPI.sftpConnect) {
        throw new Error('SFTP API är inte tillgänglig');
      }

      this.isConnected = await window.electronAPI.sftpConnect(this.connectionId);
      return this.isConnected;
    } catch (error: any) {
      console.error('SFTP connect error:', error);
      this.isConnected = false;
      throw new Error(`Kunde inte ansluta till SFTP: ${error.message}`);
    }
  }

  async listDirectory(path: string): Promise<SFTPFile[]> {
    try {
      if (!this.ensureConnected()) return [];

      const files = await window.electronAPI.sftpListDirectory(this.connectionId, path);
      return files || [];
    } catch (error: any) {
      console.error('SFTP listDirectory error:', error);
      throw new Error(`Kunde inte lista katalog: ${error.message}`);
    }
  }

  async getFileContent(path: string): Promise<string> {
    try {
      if (!this.ensureConnected()) return '';
      
      // Vi behöver hämta filen till lokal sökväg först
      const tempPath = await this.downloadToTemp(path);
      
      // Läs fil från disk eller använda annan metod för att få innehållet
      // Detta är en förenkling, i en riktig implementation skulle vi använda fs API
      return `Innehåll av ${path} (simulerad)`;
    } catch (error: any) {
      console.error('SFTP getFileContent error:', error);
      throw new Error(`Kunde inte läsa fil: ${error.message}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      // I en riktig implementation skulle vi skriva innehållet till en temporär fil
      // och sedan använda sftpPutFile för att ladda upp den
      // Detta är en förenkling
      console.log(`Skulle skriva innehåll till ${path}: ${content.substring(0, 20)}...`);
      
      throw new Error('Inte implementerad ännu');
    } catch (error: any) {
      console.error('SFTP writeFile error:', error);
      throw new Error(`Kunde inte skriva till fil: ${error.message}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpDeleteFile(this.connectionId, path);
    } catch (error: any) {
      console.error('SFTP deleteFile error:', error);
      throw new Error(`Kunde inte ta bort fil: ${error.message}`);
    }
  }

  async createDirectory(path: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpMakeDirectory(this.connectionId, path);
    } catch (error: any) {
      console.error('SFTP createDirectory error:', error);
      throw new Error(`Kunde inte skapa katalog: ${error.message}`);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpDeleteDirectory(this.connectionId, path);
    } catch (error: any) {
      console.error('SFTP deleteDirectory error:', error);
      throw new Error(`Kunde inte ta bort katalog: ${error.message}`);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpRename(this.connectionId, oldPath, newPath);
    } catch (error: any) {
      console.error('SFTP rename error:', error);
      throw new Error(`Kunde inte byta namn: ${error.message}`);
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpPutFile(this.connectionId, localPath, remotePath);
    } catch (error: any) {
      console.error('SFTP uploadFile error:', error);
      throw new Error(`Kunde inte ladda upp fil: ${error.message}`);
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    try {
      if (!this.ensureConnected()) return;
      
      await window.electronAPI.sftpGetFile(this.connectionId, remotePath, localPath);
    } catch (error: any) {
      console.error('SFTP downloadFile error:', error);
      throw new Error(`Kunde inte ladda ner fil: ${error.message}`);
    }
  }

  private async downloadToTemp(remotePath: string): Promise<string> {
    // I en riktig implementation skulle vi skapa en temporär fil och ladda ner till den
    // För enkelhetens skull returnerar vi bara en sträng här
    return `temp_${Date.now()}_${remotePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected && window.electronAPI && window.electronAPI.sftpDisconnect) {
        await window.electronAPI.sftpDisconnect(this.connectionId);
      }
    } finally {
      this.isConnected = false;
    }
  }

  private ensureConnected(): boolean {
    if (!this.isConnected) {
      console.warn('SFTP är inte ansluten, anslut först innan du använder SFTP-operationer');
      return false;
    }
    return true;
  }
}

export default SFTPService; 