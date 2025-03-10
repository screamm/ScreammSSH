import { ipcMain, dialog } from 'electron';
import * as SSH2 from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

// Definiera SFTP filtyp konstanter som saknas i @types/ssh2
const SFTP_S_IFMT = 0o170000;   // bitmask för filtyp
const SFTP_S_IFREG = 0o100000;  // vanlig fil
const SFTP_S_IFDIR = 0o040000;  // katalog
const SFTP_S_IFLNK = 0o120000;  // symbolisk länk

interface Connection {
  client: SSH2.Client;
  sftp: SSH2.SFTPWrapper | null;
}

// Spara aktiva anslutningar
const connections: Map<string, Connection> = new Map();

/**
 * Initiera en SFTP-anslutning för en given SSH-anslutning
 */
const initializeSftp = (connectionId: string): Promise<SSH2.SFTPWrapper> => {
  return new Promise((resolve, reject) => {
    const connection = connections.get(connectionId);
    if (!connection) {
      reject(new Error('Kunde inte hitta anslutningen'));
      return;
    }

    if (connection.sftp) {
      resolve(connection.sftp);
      return;
    }

    connection.client.sftp((err, sftp) => {
      if (err) {
        reject(new Error(`SFTP-fel: ${err.message}`));
        return;
      }

      connection.sftp = sftp;
      resolve(sftp);
    });
  });
};

/**
 * Registrera en ny SSH-anslutning
 */
export const registerConnection = (connectionId: string, client: SSH2.Client): void => {
  connections.set(connectionId, { client, sftp: null });
};

/**
 * Avregistrera en SSH-anslutning
 */
export const unregisterConnection = (connectionId: string): void => {
  const connection = connections.get(connectionId);
  if (connection?.sftp) {
    connection.sftp.end();
  }
  connections.delete(connectionId);
};

// Håll reda på om SFTP-hanterarna har registrerats
let handlersRegistered = false;

/**
 * Konfigurerar alla IPC-handlers för SFTP-operationer
 */
export const setupSftpHandlers = (options?: { force?: boolean }): void => {
  // Om force är false/undefined och hanterarna redan är registrerade, avbryt
  if (handlersRegistered && !options?.force) {
    console.log('SFTP-hanterare redan registrerade. Skippar.');
    return;
  }
  
  handlersRegistered = true;
  
  // Lista innehållet i en katalog
  ipcMain.handle('sftp:list-directory', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.readdir(path, (err: Error, list: any) => {
          if (err) {
            reject({ error: `Kunde inte lista katalog: ${err.message}` });
            return;
          }
          
          // Formatera resultatet
          const files = list.map(item => ({
            filename: item.filename,
            longname: item.longname,
            attrs: {
              size: item.attrs.size,
              mtime: item.attrs.mtime,
              atime: item.attrs.atime,
              isDirectory: (item.attrs.mode & SFTP_S_IFDIR) === SFTP_S_IFDIR,
              isFile: (item.attrs.mode & SFTP_S_IFREG) === SFTP_S_IFREG,
              isSymbolicLink: (item.attrs.mode & SFTP_S_IFLNK) === SFTP_S_IFLNK
            }
          }));
          
          resolve({ files });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Läs innehållet i en fil
  ipcMain.handle('sftp:read-file', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.readFile(path, { encoding: 'utf8' }, (err: Error | undefined, data: Buffer) => {
          if (err) {
            reject({ error: `Kunde inte läsa fil: ${err.message}` });
            return;
          }
          
          const content = data.toString('utf8');
          resolve({ success: true, content });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Skriv innehåll till en fil
  ipcMain.handle('sftp:write-file', async (event, args) => {
    const { connectionId, path, content } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.writeFile(path, content, { encoding: 'utf8' }, (err: Error | undefined) => {
          if (err) {
            reject({ error: `Kunde inte skriva till fil: ${err.message}` });
            return;
          }
          
          resolve({ success: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Ta bort en fil
  ipcMain.handle('sftp:delete-file', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.unlink(path, (err: Error) => {
          if (err) {
            reject({ error: `Kunde inte ta bort fil: ${err.message}` });
            return;
          }
          
          resolve({ success: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Skapa en ny katalog
  ipcMain.handle('sftp:create-directory', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.mkdir(path, null, (err: Error | undefined) => {
          if (err) {
            reject({ error: `Kunde inte skapa katalog: ${err.message}` });
            return;
          }
          
          resolve({ success: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Ta bort en katalog
  ipcMain.handle('sftp:delete-directory', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      // Notera: Detta tar bara bort tomma kataloger
      // För rekursiv borttagning behöver vi implementera en mer komplex lösning
      return new Promise((resolve, reject) => {
        sftp.rmdir(path, (err: Error) => {
          if (err) {
            reject({ error: `Kunde inte ta bort katalog: ${err.message}` });
            return;
          }
          
          resolve({ success: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Byta namn på en fil eller katalog
  ipcMain.handle('sftp:rename', async (event, args) => {
    const { connectionId, oldPath, newPath } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err: Error) => {
          if (err) {
            reject({ error: `Kunde inte byta namn: ${err.message}` });
            return;
          }
          
          resolve({ success: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Ladda upp en fil
  ipcMain.handle('sftp:upload-file', async (event, args) => {
    const { connectionId, localPath, remotePath } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        // Kontrollera om filen existerar lokalt
        if (!fs.existsSync(localPath)) {
          reject({ error: 'Den lokala filen existerar inte' });
          return;
        }
        
        // Skapa en läsström från den lokala filen
        const readStream = fs.createReadStream(localPath);
        // Skapa en skrivström till fjärrfilen
        const writeStream = sftp.createWriteStream(remotePath);
        
        // Hantera fel
        readStream.on('error', (err: Error) => {
          reject({ error: `Läsfel: ${err.message}` });
        });
        
        writeStream.on('error', (err: Error) => {
          reject({ error: `Skrivfel: ${err.message}` });
        });
        
        // När överföringen är klar
        writeStream.on('close', () => {
          resolve({ success: true });
        });
        
        // Börja överföringen
        readStream.pipe(writeStream);
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Ladda ner en fil
  ipcMain.handle('sftp:download-file', async (event, args) => {
    const { connectionId, remotePath, localPath } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        // Skapa kataloger om de inte existerar
        const localDir = path.dirname(localPath);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        
        // Skapa en läsström från fjärrfilen
        const readStream = sftp.createReadStream(remotePath);
        // Skapa en skrivström till den lokala filen
        const writeStream = fs.createWriteStream(localPath);
        
        // Hantera fel
        readStream.on('error', (err: Error) => {
          reject({ error: `Läsfel: ${err.message}` });
        });
        
        writeStream.on('error', (err: Error) => {
          reject({ error: `Skrivfel: ${err.message}` });
        });
        
        // När överföringen är klar
        writeStream.on('close', () => {
          resolve({ success: true });
        });
        
        // Börja överföringen
        readStream.pipe(writeStream);
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Hämta filstatistik
  ipcMain.handle('sftp:get-stats', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve, reject) => {
        sftp.stat(path, (err: Error, stats: any) => {
          if (err) {
            reject({ error: `Kunde inte hämta filstatistik: ${err.message}` });
            return;
          }
          
          // Formatera statistiken
          const formattedStats = {
            size: stats.size,
            mtime: stats.mtime,
            atime: stats.atime,
            isDirectory: (stats.mode & SFTP_S_IFDIR) === SFTP_S_IFDIR,
            isFile: (stats.mode & SFTP_S_IFREG) === SFTP_S_IFREG,
            isSymbolicLink: (stats.mode & SFTP_S_IFLNK) === SFTP_S_IFLNK,
            permissions: stats.mode & 511 // 0o777
          };
          
          resolve({ success: true, stats: formattedStats });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
  
  // Kontrollera om en sökväg existerar
  ipcMain.handle('sftp:exists', async (event, args) => {
    const { connectionId, path } = args;
    
    try {
      const sftp = await initializeSftp(connectionId);
      
      return new Promise((resolve) => {
        sftp.stat(path, (err: Error, stats: any) => {
          if (err) {
            resolve({ success: true, exists: false });
            return;
          }
          
          resolve({ success: true, exists: true });
        });
      });
    } catch (error: any) {
      return { error: error.message };
    }
  });
}; 