import { ipcMain } from 'electron';
import * as SSH2 from 'ssh2';
import { Client, ClientChannel } from 'ssh2';
import { v4 as uuidv4 } from 'uuid';
import { registerConnection, unregisterConnection, setupSftpHandlers } from './sftp-handler';

// Map för att hålla aktiva anslutningar
const activeConnections = new Map<string, Client>();

// Ställ in SFTP-handlers
// setupSftpHandlers(); // Borttagen för att undvika dubblettinitialisering

/**
 * Ansluter till en SSH-server
 */
export const connectSSH = async (connectionId: string, config: any): Promise<{ success: boolean, error?: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const client = new SSH2.Client();
      
      // Använd explicit typning för event handlers
      (client as any).on('ready', () => {
        activeConnections.set(connectionId, client);
        // Registrera anslutningen för SFTP-användning
        registerConnection(connectionId, client);
        resolve({ success: true });
      });
      
      (client as any).on('error', (err: Error) => {
        reject({ success: false, error: err.message || 'Okänt fel' });
      });
      
      // Anslut till servern
      client.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        readyTimeout: 10000
      });
    } catch (error: any) {
      reject({ success: false, error: error.message || 'Okänt fel' });
    }
  });
};

/**
 * Kör ett kommando på en SSH-server
 */
export const executeCommand = async (
  connectionId: string, 
  command: string
): Promise<{ success: boolean, stdout?: string, stderr?: string, code?: number, error?: string }> => {
  return new Promise((resolve) => {
    const client = activeConnections.get(connectionId);
    
    if (!client) {
      return resolve({ 
        success: false, 
        error: 'Ingen aktiv anslutning med detta ID' 
      });
    }
    
    try {
      client.exec(command, (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          return resolve({ 
            success: false, 
            error: err.message || 'Fel vid körning av kommando' 
          });
        }
        
        let stdout = '';
        let stderr = '';
        
        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        stream.on('close', (code: number) => {
          resolve({
            success: true,
            stdout,
            stderr,
            code
          });
        });
      });
    } catch (error: any) {
      resolve({ 
        success: false, 
        error: error.message || 'Okänt fel vid körning av kommando' 
      });
    }
  });
};

/**
 * Kopplar från en SSH-server
 */
export const disconnectSSH = (connectionId: string): void => {
  const client = activeConnections.get(connectionId);
  if (client) {
    client.end();
    activeConnections.delete(connectionId);
  }
};

export const setupSSHHandlers = (): void => {
  // Hantera SSH-anslutningar
  ipcMain.handle('ssh:connect', async (event, args) => {
    const { host, port, username, password, privateKey } = args;
    
    return new Promise((resolve, reject) => {
      const connectionId = uuidv4();
      const client = new SSH2.Client();
      
      client.on('ready', () => {
        activeConnections.set(connectionId, client);
        // Registrera anslutningen för SFTP-användning
        registerConnection(connectionId, client);
        resolve({ success: true, connectionId });
      });
      
      client.on('error', (err) => {
        reject({ success: false, error: err.message });
      });
      
      const connectConfig: any = {
        host,
        port,
        username,
        readyTimeout: 10000 // 10 sekunder timeout
      };
      
      // Använd lösenord eller privat nyckel
      if (privateKey) {
        connectConfig.privateKey = privateKey;
      } else if (password) {
        connectConfig.password = password;
      }
      
      try {
        client.connect(connectConfig);
      } catch (err: any) {
        reject({ success: false, error: err.message });
      }
    });
  });
  
  // Utför ett SSH-kommando
  ipcMain.handle('ssh:execute', async (event, args) => {
    const { connectionId, command } = args;
    
    if (!activeConnections.has(connectionId)) {
      return { success: false, error: 'Ingen aktiv anslutning med detta ID' };
    }
    
    const client = activeConnections.get(connectionId)!;
    
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) {
          reject({ success: false, error: err.message });
          return;
        }
        
        let stdout = '';
        let stderr = '';
        
        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        stream.on('close', (code: number) => {
          resolve({
            success: true,
            code,
            stdout,
            stderr
          });
        });
      });
    });
  });
  
  // Stäng en SSH-anslutning
  ipcMain.handle('ssh:disconnect', (event, args) => {
    const { connectionId } = args;
    
    if (activeConnections.has(connectionId)) {
      const client = activeConnections.get(connectionId)!;
      client.end();
      activeConnections.delete(connectionId);
      // Avregistrera anslutningen från SFTP-hantering
      unregisterConnection(connectionId);
      return { success: true };
    }
    
    return { success: false, error: 'Ingen aktiv anslutning med detta ID' };
  });
}; 