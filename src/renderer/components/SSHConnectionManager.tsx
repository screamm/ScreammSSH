import React, { useState, useEffect } from 'react';
import '../styles/ssh-manager.css';
import { v4 as uuidv4 } from 'uuid';

interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  lastConnected?: Date;
}

interface SSHConnectionManagerProps {
  onConnect: (sessionId: string) => void;
  onCancel: () => void;
  language: string;
}

const SSHConnectionManager: React.FC<SSHConnectionManagerProps> = ({ onConnect, onCancel, language = 'sv' }) => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state för ny anslutning
  const [newConnection, setNewConnection] = useState<Partial<SSHConnection>>({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: ''
  });
  
  // Hämta sparade anslutningar vid mount
  useEffect(() => {
    loadConnections();
  }, []);
  
  const loadConnections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const savedConnections = await window.electronAPI.getSavedConnections();
      setConnections(savedConnections || []);
    } catch (err) {
      console.error('Kunde inte hämta SSH-anslutningar:', err);
      setError(t('errorLoadingConnections'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnect = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      let connectionId: string;
      let connectionConfig: any;
      
      if (isCreating) {
        // Validera den nya anslutningen
        if (!newConnection.name || !newConnection.host || !newConnection.username) {
          setError(t('missingRequiredFields'));
          setIsLoading(false);
          return;
        }
        
        // Skapa ett nytt anslutningsobjekt
        const connectionToSave: SSHConnection = {
          id: uuidv4(),
          name: newConnection.name || `${newConnection.username}@${newConnection.host}`,
          host: newConnection.host || '',
          port: newConnection.port || 22,
          username: newConnection.username || '',
          password: newConnection.password,
          privateKey: newConnection.privateKey,
          lastConnected: new Date()
        };
        
        // Spara den nya anslutningen
        try {
          await window.electronAPI.saveConnection(connectionToSave);
          connectionConfig = connectionToSave;
          connectionId = connectionToSave.id;
        } catch (error) {
          console.error('Kunde inte spara anslutning:', error);
          throw new Error(t('failedToSaveConnection'));
        }
      } else {
        // Använd vald befintlig anslutning
        const connection = connections.find(c => c.id === selectedConnection);
        if (!connection) {
          throw new Error(t('connectionNotFound'));
        }
        
        connectionConfig = connection;
        connectionId = connection.id;
      }
      
      // Anslut till SSH med vår egen SSHService istället för electronAPI direkt
      const sshConfig = {
        id: connectionId,
        name: connectionConfig.name,
        host: connectionConfig.host,
        port: connectionConfig.port || 22,
        username: connectionConfig.username,
        password: connectionConfig.password,
        privateKey: connectionConfig.privateKey
      };
      
      console.log('Ansluter till SSH med:', sshConfig);
      
      // Använd vår egen SSH-service
      const connected = await window.electronAPI.connectSSH(sshConfig);
      
      if (connected) {
        console.log('SSH-anslutning lyckades, id:', connectionId);
        onConnect(connectionId);
      } else {
        throw new Error(t('sshConnectionFailed'));
      }
    } catch (err: any) {
      console.error('Anslutningsfel:', err);
      setError(err.message || t('unknownError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteConnection = async (id: string) => {
    try {
      await window.electronAPI.deleteConnection(id);
      // Antag att operationen lyckades om inget fel kastades
      setConnections(prev => prev.filter(c => c.id !== id));
      if (selectedConnection === id) {
        setSelectedConnection(null);
      }
    } catch (err: any) {
      console.error('Kunde inte ta bort anslutning:', err);
      setError(err.message || t('failedToDeleteConnection'));
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConnection(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 22 : value
    }));
  };
  
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleConnect();
  };
  
  // Enkel översättningsfunktion
  const translations: Record<string, Record<string, string>> = {
    sv: {
      title: 'SSH-anslutningar',
      newConnection: 'Skapa ny anslutning',
      connect: 'Anslut',
      cancel: 'Avbryt',
      back: 'Tillbaka',
      save: 'Spara',
      delete: 'Ta bort',
      confirmDelete: 'Är du säker på att du vill ta bort denna anslutning?',
      name: 'Namn',
      host: 'Värd',
      port: 'Port',
      username: 'Användarnamn',
      password: 'Lösenord',
      privateKey: 'Privat nyckel (sökväg)',
      noConnections: 'Inga sparade anslutningar',
      errorLoadingConnections: 'Kunde inte ladda anslutningar',
      noConnectionSelected: 'Ingen anslutning vald',
      missingRequiredFields: 'Fyll i alla obligatoriska fält: namn, värd och användarnamn',
      failedToSaveConnection: 'Kunde inte spara anslutningen',
      connectionNotFound: 'Anslutningen hittades inte',
      sshConnectionFailed: 'SSH-anslutningen misslyckades',
      failedToDeleteConnection: 'Kunde inte ta bort anslutningen',
      unknownError: 'Ett okänt fel inträffade',
      lastConnected: 'Senast ansluten: '
    },
    en: {
      title: 'SSH Connections',
      newConnection: 'Create new connection',
      connect: 'Connect',
      cancel: 'Cancel',
      back: 'Back',
      save: 'Save',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this connection?',
      name: 'Name',
      host: 'Host',
      port: 'Port',
      username: 'Username',
      password: 'Password',
      privateKey: 'Private key (path)',
      noConnections: 'No saved connections',
      errorLoadingConnections: 'Could not load connections',
      noConnectionSelected: 'No connection selected',
      missingRequiredFields: 'Fill in all required fields: name, host and username',
      failedToSaveConnection: 'Could not save the connection',
      connectionNotFound: 'Connection not found',
      sshConnectionFailed: 'SSH connection failed',
      failedToDeleteConnection: 'Could not delete the connection',
      unknownError: 'An unknown error occurred',
      lastConnected: 'Last connected: '
    }
  };
  
  const t = (key: string): string => {
    const lang = language in translations ? language : 'sv';
    return translations[lang][key] || translations['sv'][key] || key;
  };
  
  // Formatera datum
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isCreating) {
    return (
      <div className="ssh-manager-container">
        <h2>{t('newConnection')}</h2>
        
        {error && <div className="ssh-error">{error}</div>}
        
        <form onSubmit={handleSubmitForm} className="ssh-form">
          <div className="form-group">
            <label htmlFor="name">{t('name')}*</label>
            <input 
              type="text" 
              name="name" 
              id="name"
              value={newConnection.name || ''} 
              onChange={handleFormChange} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="host">{t('host')}*</label>
            <input 
              type="text" 
              name="host" 
              id="host"
              value={newConnection.host || ''} 
              onChange={handleFormChange} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="port">{t('port')}</label>
            <input 
              type="number" 
              name="port" 
              id="port"
              value={newConnection.port || 22} 
              onChange={handleFormChange} 
              min="1" 
              max="65535"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">{t('username')}*</label>
            <input 
              type="text" 
              name="username" 
              id="username"
              value={newConnection.username || ''} 
              onChange={handleFormChange} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input 
              type="password" 
              name="password" 
              id="password"
              value={newConnection.password || ''} 
              onChange={handleFormChange} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="privateKey">{t('privateKey')}</label>
            <input 
              type="text" 
              name="privateKey" 
              id="privateKey"
              value={newConnection.privateKey || ''} 
              onChange={handleFormChange} 
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              disabled={isLoading}
            >
              {t('back')}
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? '...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  return (
    <div className="ssh-manager-container">
      <h2>{t('title')}</h2>
      
      {error && <div className="ssh-error">{error}</div>}
      
      <div className="ssh-connections-list">
        {connections.length === 0 ? (
          <div className="no-connections">{t('noConnections')}</div>
        ) : (
          connections.map(connection => (
            <div 
              key={connection.id} 
              className={`connection-item ${selectedConnection === connection.id ? 'selected' : ''}`}
              onClick={() => setSelectedConnection(connection.id)}
            >
              <div className="connection-name">{connection.name}</div>
              <div className="connection-host">{connection.username}@{connection.host}:{connection.port || 22}</div>
              {connection.lastConnected && (
                <div className="connection-last-connected">
                  {t('lastConnected')} {formatDate(connection.lastConnected)}
                </div>
              )}
              <button 
                className="delete-button" 
                onClick={() => handleDeleteConnection(connection.id)}
                disabled={isLoading}
              >
                {t('delete')}
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="ssh-actions">
        <button 
          onClick={() => setIsCreating(true)} 
          disabled={isLoading}
        >
          {t('newConnection')}
        </button>
        <button 
          onClick={handleConnect} 
          disabled={isLoading || !selectedConnection}
        >
          {isLoading ? '...' : t('connect')}
        </button>
        <button 
          onClick={onCancel} 
          disabled={isLoading}
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
};

export default SSHConnectionManager; 