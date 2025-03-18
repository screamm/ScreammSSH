import { Client, ClientChannel } from 'ssh2';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  keepaliveInterval?: number;
  readyTimeout?: number;
}

export interface SSHConnectionInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  group?: string;
  color?: string;
  notes?: string;
  keepaliveInterval?: number;
  readyTimeout?: number;
  lastConnected?: Date;
}

export interface SSHExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface SSHConnection {
  info: SSHConnectionInfo;
  client: any; // Använder any istället för Client från ssh2 för att undvika typfel
  isConnected: boolean;
  shell?: any; // Använder any istället för ClientChannel från ssh2
}

// Definiera typer för shell-utmatning
interface ShellOutputData {
  id?: string;
  connectionId?: string;
  output?: string;
  error?: string;
  data?: string;
}

export class SSHService {
  private connections: Map<string, SSHConnection> = new Map();
  private currentConfig: SSHConnectionConfig | null = null;
  private currentId: string | null = null;
  private shellOutputListener: ((event: any, connectionId: string, data: string) => void) | null = null;
  private sshEventListener: ((event: any, connectionId: string, eventType: string, data: any) => void) | null = null;
  private listeners: Record<string, Function[]> = {};

  constructor() {
    console.log('SSHService initialiserad');
    this.setupListeners();
  }

  private setupListeners() {
    // Lyssna efter shell-utmatning
    if ('onShellOutput' in window.electronAPI) {
      (window.electronAPI as any).onShellOutput((data: ShellOutputData) => {
        // Använd id eller connectionId beroende på vad som finns
        const connectionId = data.connectionId || data.id;
        const outputData = data.data || data.output;
        
        if (connectionId && outputData) {
          console.log(`Shell-utmatning från ${connectionId}: ${outputData.length} bytes`);
          // Skicka data till rätt terminal-komponent
          this.emit('shell-data', { connectionId, data: outputData });
        }
      });
    }
    
    // Lyssna efter SSH-händelser
    if (window.electronAPI.onSSHEvent) {
      window.electronAPI.onSSHEvent((data) => {
        if (data && data.connectionId && data.eventType) {
          const connectionId = data.connectionId;
          const eventType = data.eventType;
          const eventData = data.data;
          
          console.log(`SSH-händelse från ${connectionId}: ${eventType}`);
          
          // Hantera olika typer av händelser
          switch (eventType) {
            case 'data':
              this.emit('shell-data', { connectionId, data: eventData });
              break;
            case 'stderr':
              this.emit('shell-stderr', { connectionId, data: eventData });
              break;
            case 'close':
              this.emit('shell-close', { connectionId });
              break;
            case 'error':
              this.emit('shell-error', { connectionId, error: eventData });
              break;
            default:
              console.log(`Okänd SSH-händelse: ${eventType}`);
          }
        }
      });
    }
  }

  public async connect(connectionInfo: SSHConnectionInfo): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        console.log(`Ansluter till SSH-server: ${connectionInfo.host}:${connectionInfo.port}`);
        
        // Spara konfigurationen
        this.currentConfig = {
          host: connectionInfo.host,
          port: connectionInfo.port,
          username: connectionInfo.username,
          password: connectionInfo.password,
          privateKey: connectionInfo.privateKey,
          passphrase: connectionInfo.passphrase,
          keepaliveInterval: connectionInfo.keepaliveInterval,
          readyTimeout: connectionInfo.readyTimeout
        };
        this.currentId = connectionInfo.id;
        
        // Använd electronAPI för att ansluta
        if (window.electronAPI.connectSSH) {
          const success = await window.electronAPI.connectSSH(connectionInfo);
          
          if (success) {
            console.log(`SSH-anslutning lyckades till ${connectionInfo.host}`);
            
            // Sätt upp lyssnare för shell-output
            this.setupListeners();
            
            resolve(true);
          } else {
            console.error(`SSH-anslutning misslyckades till ${connectionInfo.host}`);
            reject(new Error(`Kunde inte ansluta till ${connectionInfo.host}`));
          }
        } else {
          reject(new Error('connectSSH API är inte tillgänglig'));
        }
      } catch (error) {
        console.error('SSH-anslutningsfel:', error);
        reject(error);
      }
    });
  }

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }
  
  off(event: string, listener: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }
  
  emit(event: string, data: any): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Fel i event-lyssnare för ${event}:`, error);
      }
    });
  }

  public disconnect(connectionId: string): boolean {
    try {
      if (!this.connections.has(connectionId)) {
        console.warn(`Försökte koppla från icke-existerande anslutning: ${connectionId}`);
        return false;
      }

      if (!window.electronAPI || !window.electronAPI.disconnectSSH) {
        console.error('electronAPI.disconnectSSH är inte tillgänglig');
        return false;
      }

      // Koppla från via IPC
      window.electronAPI.disconnectSSH(connectionId);
      
      // Uppdatera lokal status
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.isConnected = false;
        connection.shell = undefined;
        this.connections.set(connectionId, connection);
      }
      
      console.log(`Frånkopplad från ${connectionId}`);
      return true;
    } catch (error) {
      console.error(`Fel vid frånkoppling från ${connectionId}:`, error);
      return false;
    }
  }

  public disconnectAll(): void {
    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach(id => {
      if (this.isConnected(id)) {
        this.disconnect(id);
      }
    });
    console.log('Kopplade från alla SSH-anslutningar');
  }

  public isConnected(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    return !!connection && connection.isConnected;
  }

  public getActiveConnections(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.isConnected)
      .map(([id, _]) => id);
  }

  public async executeCommand(connectionId: string, command: string): Promise<string> {
    try {
      if (!this.isConnected(connectionId)) {
        throw new Error(`Kan inte köra kommando: inte ansluten till ${connectionId}`);
      }

      if (!window.electronAPI || !window.electronAPI.executeSSHCommand) {
        throw new Error('electronAPI.executeSSHCommand är inte tillgänglig');
      }

      console.log(`Kör kommando på ${connectionId}: ${command}`);
      const result = await window.electronAPI.executeSSHCommand(connectionId, command);
      
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      console.error(`Fel vid körning av kommando på ${connectionId}:`, error);
      throw error;
    }
  }

  public async openShell(connectionId: string): Promise<boolean> {
    try {
      if (!this.isConnected(connectionId)) {
        console.error(`Kan inte öppna shell: inte ansluten till ${connectionId}`);
        return false;
      }

      const connection = this.connections.get(connectionId);
      if (connection && connection.shell) {
        console.log(`Shell redan öppnat för ${connectionId}`);
        return true;
      }

      if (!window.electronAPI || !window.electronAPI.openSSHShell) {
        console.error('electronAPI.openSSHShell är inte tillgänglig');
        return false;
      }

      console.log(`Öppnar shell för ${connectionId}`);
      const success = await window.electronAPI.openSSHShell(connectionId);
      
      if (success && connection) {
        connection.shell = {}; // Placeholder, faktiska shell-objektet hanteras i huvudprocessen
        this.connections.set(connectionId, connection);
        console.log(`Shell öppnat för ${connectionId}`);
        return true;
      } else {
        console.error(`Kunde inte öppna shell för ${connectionId}`);
        return false;
      }
    } catch (error) {
      console.error(`Fel vid öppning av shell för ${connectionId}:`, error);
      return false;
    }
  }

  public async writeToShell(connectionId: string, data: string): Promise<boolean> {
    try {
      if (!this.isConnected(connectionId)) {
        console.error(`Kan inte skriva till shell: inte ansluten till ${connectionId}`);
        return false;
      }

      const connection = this.connections.get(connectionId);
      if (!connection || !connection.shell) {
        console.error(`Inget shell öppnat för ${connectionId}`);
        return false;
      }

      if (!window.electronAPI || !window.electronAPI.writeToSSHShell) {
        console.error('electronAPI.writeToSSHShell är inte tillgänglig');
        return false;
      }

      await window.electronAPI.writeToSSHShell(connectionId, data);
      return true;
    } catch (error) {
      console.error(`Fel vid skrivning till shell för ${connectionId}:`, error);
      return false;
    }
  }

  public async resizeShell(connectionId: string, cols: number, rows: number): Promise<boolean> {
    try {
      if (!this.isConnected(connectionId)) {
        console.error(`Kan inte ändra storlek på shell: inte ansluten till ${connectionId}`);
        return false;
      }

      const connection = this.connections.get(connectionId);
      if (!connection || !connection.shell) {
        console.error(`Inget shell öppnat för ${connectionId}`);
        return false;
      }

      if (!window.electronAPI || !window.electronAPI.resizeSSHShell) {
        console.error('electronAPI.resizeSSHShell är inte tillgänglig');
        return false;
      }

      await window.electronAPI.resizeSSHShell(connectionId, cols, rows);
      return true;
    } catch (error) {
      console.error(`Fel vid storleksändring av shell för ${connectionId}:`, error);
      return false;
    }
  }

  public closeShell(connectionId: string): boolean {
    try {
      if (!this.isConnected(connectionId)) {
        console.warn(`Kan inte stänga shell: inte ansluten till ${connectionId}`);
        return false;
      }

      const connection = this.connections.get(connectionId);
      if (!connection || !connection.shell) {
        console.warn(`Inget shell att stänga för ${connectionId}`);
        return true; // Redan stängt, så tekniskt sett lyckat
      }

      if (!window.electronAPI || !window.electronAPI.closeSSHShell) {
        console.error('electronAPI.closeSSHShell är inte tillgänglig');
        return false;
      }

      // Stäng shell via IPC
      window.electronAPI.closeSSHShell(connectionId);
      
      // Uppdatera lokal status
      connection.shell = undefined;
      this.connections.set(connectionId, connection);
      
      console.log(`Shell stängt för ${connectionId}`);
      return true;
    } catch (error) {
      console.error(`Fel vid stängning av shell för ${connectionId}:`, error);
      return false;
    }
  }
}

// Exportera en singleton-instans
export const sshService = new SSHService();
export default sshService; 