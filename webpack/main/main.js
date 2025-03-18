// Lägg till IPC-hanterare för SSH anslutningar
app.whenReady().then(() => {
  // ... existing code ...

  // SSH test connection
  ipcMain.handle('test-ssh-connection', async (event, connectionConfig) => {
    try {
      console.log('Testar SSH-anslutning:', connectionConfig.host);
      
      // Validera anslutningskonfigurationen
      if (!connectionConfig.host || !connectionConfig.username) {
        return { 
          success: false, 
          message: 'Värd och användarnamn krävs'
        };
      }
      
      // Skapa ett klient-objekt
      const client = new Client();
      
      // Tidsgräns för anslutning
      const connectionTimeout = setTimeout(() => {
        client.end();
        throw new Error('Anslutningen tog för lång tid');
      }, 10000);
      
      // Anslutningsdata
      const port = connectionConfig.port || 22;
      
      // Skapa anslutningsobjektet
      const connectionOptions = {
        host: connectionConfig.host,
        port: port,
        username: connectionConfig.username,
        readyTimeout: 8000,
        tryKeyboard: true
      };
      
      // Lägg till autentiseringsmetoder baserat på tillgängliga uppgifter
      if (connectionConfig.password) {
        connectionOptions.password = connectionConfig.password;
      } else if (connectionConfig.privateKey) {
        connectionOptions.privateKey = connectionConfig.privateKey;
      }
      
      // Gör anslutningsförsöket
      const serverInfo = await new Promise((resolve, reject) => {
        client.on('ready', () => {
          clearTimeout(connectionTimeout);
          
          // Hämta serverinformation
          client.exec('uname -a', (err, stream) => {
            if (err) {
              client.end();
              return reject(err);
            }
            
            let data = '';
            stream.on('data', (chunk) => {
              data += chunk.toString();
            });
            
            stream.on('end', () => {
              client.end();
              resolve({
                kernel: data.trim(),
                name: connectionConfig.host
              });
            });
            
            stream.on('error', (err) => {
              client.end();
              reject(err);
            });
          });
        });
        
        client.on('error', (err) => {
          clearTimeout(connectionTimeout);
          reject(err);
        });
        
        client.connect(connectionOptions);
      });
      
      return {
        success: true,
        message: 'Anslutningen lyckades',
        serverInfo
      };
      
    } catch (error) {
      console.error('SSH-anslutningsfel:', error.message);
      return {
        success: false,
        message: `Anslutningen misslyckades: ${error.message}`
      };
    }
  });
  
  // Connect to SSH
  ipcMain.handle('connect-ssh', async (event, config) => {
    try {
      // Skapa en ny SSH-klient
      const ssh = new Client();
      
      // Skapa ett unikt ID för anslutningen om det inte redan finns
      const connectionId = config.id || uuidv4();
      const configWithId = { ...config, id: connectionId };
      
      // Spara anslutningskonfigurationen med ID
      if (!config.id) {
        await saveConnection(configWithId);
      }
      
      // Anslut till servern
      await new Promise((resolve, reject) => {
        ssh.on('ready', () => {
          // Spara SSH-sessionen för framtida användning
          sshSessions.set(connectionId, { ssh, config: configWithId });
          resolve();
        });
        
        ssh.on('error', (err) => {
          reject(err);
        });
        
        const connectConfig = {
          host: config.host,
          port: config.port || 22,
          username: config.username,
          readyTimeout: 10000
        };
        
        // Lägg till autentiseringsuppgifter
        if (config.password) {
          connectConfig.password = config.password;
        } else if (config.privateKey) {
          connectConfig.privateKey = config.privateKey;
        }
        
        ssh.connect(connectConfig);
      });
      
      return true;
    } catch (error) {
      console.error('SSH anslutningsfel:', error.message);
      return false;
    }
  });
  
  // Disconnect SSH
  ipcMain.handle('disconnect-ssh', async (event, connectionId) => {
    try {
      const session = sshSessions.get(connectionId);
      if (session) {
        session.ssh.end();
        sshSessions.delete(connectionId);
        
        // Avsluta eventuella terminalsessioner
        const termSession = terminalSessions.get(connectionId);
        if (termSession) {
          termSession.close();
          terminalSessions.delete(connectionId);
        }
      }
      return true;
    } catch (error) {
      console.error('SSH frånkopplingsfel:', error.message);
      return false;
    }
  });
  
  // Execute SSH command
  ipcMain.handle('execute-ssh-command', async (event, connectionId, command) => {
    try {
      const session = sshSessions.get(connectionId);
      if (!session) {
        throw new Error('Ingen aktiv SSH-session hittad');
      }
      
      const result = await new Promise((resolve, reject) => {
        session.ssh.exec(command, (err, stream) => {
          if (err) return reject(err);
          
          let stdout = '';
          let stderr = '';
          
          stream.on('data', (data) => {
            stdout += data.toString();
          });
          
          stream.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          
          stream.on('close', (code) => {
            resolve({ stdout, stderr, code });
          });
          
          stream.on('error', reject);
        });
      });
      
      return result;
    } catch (error) {
      console.error('SSH-kommandofel:', error.message);
      return { 
        stdout: '', 
        stderr: error.message, 
        code: 1 
      };
    }
  });
  
  // Open SSH Shell
  ipcMain.handle('open-ssh-shell', async (event, connectionId) => {
    try {
      const session = sshSessions.get(connectionId);
      if (!session) {
        throw new Error('Ingen aktiv SSH-session hittad');
      }
      
      // Skapa en shell-session
      await new Promise((resolve, reject) => {
        session.ssh.shell((err, stream) => {
          if (err) return reject(err);
          
          // Spara terminalsessionen
          terminalSessions.set(connectionId, stream);
          
          // Vidarebefordra data från shell till renderer
          stream.on('data', (data) => {
            mainWindow.webContents.send('terminal-data', {
              sessionId: connectionId,
              data: data.toString()
            });
          });
          
          stream.stderr.on('data', (data) => {
            mainWindow.webContents.send('terminal-error', {
              sessionId: connectionId,
              error: data.toString()
            });
          });
          
          stream.on('close', (code, signal) => {
            mainWindow.webContents.send('terminal-exit', {
              sessionId: connectionId,
              code,
              signal
            });
            
            // Ta bort terminalsessionen
            terminalSessions.delete(connectionId);
          });
          
          resolve();
        });
      });
      
      return true;
    } catch (error) {
      console.error('SSH shell-fel:', error.message);
      return false;
    }
  });
  
  // Resize Terminal
  ipcMain.handle('resize-terminal', async (event, connectionId, cols, rows) => {
    try {
      const termSession = terminalSessions.get(connectionId);
      if (termSession) {
        termSession.setWindow(rows, cols, 0, 0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Terminalresizefel:', error.message);
      return false;
    }
  });
  
  // Process terminal data from renderer
  ipcMain.on('terminal-data', (event, { sessionId, data }) => {
    try {
      const termSession = terminalSessions.get(sessionId);
      if (termSession) {
        termSession.write(data);
      }
    } catch (error) {
      console.error('Terminal datafel:', error.message);
    }
  });

  // Lägg till IPC-hanterare för Settings
  ipcMain.handle('get-settings', async (event) => {
    try {
      // Kolla om inställningsfilen finns
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        return settings;
      } else {
        // Standardinställningar om filen inte finns
        const defaultSettings = {
          terminal: {
            retroEffect: true,
            fontSize: 14,
            fontFamily: 'monospace'
          },
          theme: 'default',
          language: 'sv'
        };
        
        // Spara standardinställningarna
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        
        return defaultSettings;
      }
    } catch (error) {
      console.error('Fel vid hämtning av inställningar:', error);
      return {
        terminal: {
          retroEffect: true,
          fontSize: 14,
          fontFamily: 'monospace'
        },
        theme: 'default',
        language: 'sv'
      };
    }
  });

  // Spara inställningar
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Fel vid sparande av inställningar:', error);
      return false;
    }
  });

  // ... existing code ...
}); 