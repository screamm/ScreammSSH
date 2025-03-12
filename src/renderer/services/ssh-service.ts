import { SFTPService } from './sftp-service';

export interface SSHConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  keepaliveInterval?: number;
  readyTimeout?: number;
}

export class SSHService {
  private id: string;
  private connected: boolean = false;
  
  constructor(id: string) {
    this.id = id;
  }
  
  async connect(config: SSHConfig): Promise<boolean> {
    try {
      if (!window.electronAPI || !window.electronAPI.connectSSH) {
        throw new Error('electronAPI.connectSSH är inte tillgänglig');
      }

      const success = await window.electronAPI.connectSSH(config);
      
      if (success) {
        this.connected = true;
        this.id = config.id;
        return true;
      } else {
        console.error(`Kunde inte ansluta till ${config.host}`);
        return false;
      }
    } catch (error) {
      console.error('SSH-anslutningsfel:', error);
      return false;
    }
  }
  
  async executeCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Inte ansluten till SSH-server');
    }
    
    try {
      if (!window.electronAPI || !window.electronAPI.executeSSHCommand) {
        throw new Error('electronAPI.executeSSHCommand är inte tillgänglig');
      }

      return await window.electronAPI.executeSSHCommand(this.id, command);
    } catch (error) {
      console.error('SSH-kommandofel:', error);
      throw error;
    }
  }
  
  async getShell(): Promise<any> {
    // Notera: Denna metod måste implementeras i renderer på ett annat sätt
    // eftersom vi inte kan returnera en stream över IPC
    throw new Error('Not implemented via IPC, use a different approach for terminal');
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        if (!window.electronAPI || !window.electronAPI.disconnectSSH) {
          throw new Error('electronAPI.disconnectSSH är inte tillgänglig');
        }

        await window.electronAPI.disconnectSSH(this.id);
      } finally {
        this.connected = false;
      }
    }
  }

  getCurrentId(): string {
    return this.id;
  }
} 