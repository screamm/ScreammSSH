import { ipcMain } from 'electron';
import * as SSH2 from 'ssh2';
import { v4 as uuidv4 } from 'uuid';
import { registerConnection, unregisterConnection, setupSftpHandlers } from './sftp-handler';

// Spåra aktiva anslutningar
const activeConnections: Map<string, SSH2.Client> = new Map();

// Ställ in SFTP-handlers
// setupSftpHandlers(); // Borttagen för att undvika dubblettinitialisering

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