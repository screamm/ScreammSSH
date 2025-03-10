import { SFTPService } from './sftp-service';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export class SSHService {
  private id: string;
  private connected: boolean = false;
  
  constructor(id: string) {
    this.id = id;
  }
  
  async connect(config: SSHConfig): Promise<void> {
    try {
      const result = await window.electronAPI.sshConnect(config);
      
      if (result.success) {
        this.connected = true;
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      this.connected = false;
      throw err;
    }
  }
  
  async executeCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Ingen aktiv SSH-anslutning');
    }
    
    try {
      const result = await window.electronAPI.sshExecute(this.id, command);
      
      if (result.success) {
        return result.stdout || result.output || '';
      } else {
        throw new Error(result.error || 'Okänt fel vid körning av kommando');
      }
    } catch (err: any) {
      throw err;
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
        await window.electronAPI.sshDisconnect(this.id);
      } finally {
        this.connected = false;
      }
    }
  }
} 