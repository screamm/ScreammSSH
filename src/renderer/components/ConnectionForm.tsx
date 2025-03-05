import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SavedConnection, storageService } from '../services/storage-service';
import SavedConnections from './SavedConnections';
import { KeyIcon, CheckIcon, PlusIcon, SaveIcon } from '../utils/icon-wrapper';

interface ConnectionFormProps {
  onConnect: (config: {
    id: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    name: string;
  }) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  
  useEffect(() => {
    // Hämta existerande grupper
    loadGroups();
  }, []);
  
  const loadGroups = async () => {
    try {
      const connections = await storageService.getSavedConnections();
      const uniqueGroups = [...new Set(connections
        .filter(conn => conn.group)
        .map(conn => conn.group as string))];
      setGroups(uniqueGroups);
    } catch (error) {
      console.error('Kunde inte hämta grupper:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'host':
        setHost(value);
        break;
      case 'port':
        setPort(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'privateKey':
        setPrivateKey(value);
        break;
      case 'name':
        setName(value);
        break;
      case 'group':
        setGroup(value);
        break;
      case 'newGroup':
        setNewGroup(value);
        break;
      default:
        break;
    }
  };
  
  const togglePrivateKey = () => {
    setUsePrivateKey(!usePrivateKey);
    if (!usePrivateKey) {
      setPassword('');
    } else {
      setPrivateKey('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validera inmatningarna
    if (!host || !username || (!password && !privateKey)) {
      alert('Vänligen fyll i alla obligatoriska fält.');
      return;
    }
    
    const config = {
      id: uuidv4(),
      host,
      port: parseInt(port, 10),
      username,
      name: name || `${username}@${host}`,
    };
    
    if (usePrivateKey && privateKey) {
      Object.assign(config, { privateKey });
    } else if (password) {
      Object.assign(config, { password });
    }
    
    onConnect(config);
  };
  
  const handleSave = async () => {
    if (!host || !username || (!password && !privateKey)) {
      alert('Vänligen fyll i alla obligatoriska fält.');
      return;
    }
    
    // Använd angivet namn eller skapa ett baserat på värd/användare
    const connectionName = name || `${username}@${host}`;
    
    try {
      const connection: SavedConnection = {
        id: uuidv4(),
        name: connectionName,
        host,
        port: parseInt(port, 10),
        username,
        usePrivateKey,
        group: showNewGroupInput ? newGroup : group
      };
      
      if (usePrivateKey && privateKey) {
        connection.privateKey = privateKey;
      } else if (password) {
        connection.password = password;
      }
      
      await storageService.saveConnection(connection);
      
      // Återställ formuläret
      setName('');
      setShowSaveForm(false);
      setShowNewGroupInput(false);
      setNewGroup('');
      
      // Uppdatera grupperna
      if (showNewGroupInput && newGroup) {
        setGroups([...groups, newGroup]);
      }
      
      // Visa bekräftelse
      alert(`Anslutning "${connectionName}" har sparats.`);
    } catch (error) {
      console.error('Kunde inte spara anslutningen:', error);
      alert('Kunde inte spara anslutningen. Försök igen senare.');
    }
  };
  
  const handleSavedConnectionSelect = (connection: SavedConnection) => {
    setHost(connection.host);
    setPort(connection.port.toString());
    setUsername(connection.username);
    setName(connection.name);
    
    if (connection.usePrivateKey) {
      setUsePrivateKey(true);
      setPrivateKey(connection.privateKey || '');
      setPassword('');
    } else {
      setUsePrivateKey(false);
      setPassword(connection.password || '');
      setPrivateKey('');
    }
    
    setGroup(connection.group || '');
  };
  
  return (
    <div className="connection-container">
      <form className="connection-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="host">Värd</label>
          <input
            type="text"
            id="host"
            name="host"
            value={host}
            onChange={handleChange}
            placeholder="t.ex. example.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="port">Port</label>
          <input
            type="number"
            id="port"
            name="port"
            value={port}
            onChange={handleChange}
            placeholder="22"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Användarnamn</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            placeholder="t.ex. admin"
            required
          />
        </div>
        
        {!usePrivateKey ? (
          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Ditt lösenord"
              required={!usePrivateKey}
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="privateKey">Privat nyckel</label>
            <textarea
              id="privateKey"
              name="privateKey"
              value={privateKey}
              onChange={handleChange as any}
              placeholder="Börja med -----BEGIN RSA PRIVATE KEY-----"
              required={usePrivateKey}
              rows={4}
              style={{ 
                resize: 'vertical', 
                minHeight: '80px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
          </div>
        )}
        
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={togglePrivateKey}
            style={{ 
              marginRight: '10px',
              backgroundColor: usePrivateKey ? 'var(--accent-color)' : 'var(--secondary-bg-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <KeyIcon /> 
            {usePrivateKey ? 'Använder nyckel' : 'Använd nyckel'}
          </button>
          
          <button 
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <CheckIcon /> Anslut
          </button>
          
          <SavedConnections onSelect={handleSavedConnectionSelect} />
          
          <button 
            type="button"
            onClick={() => setShowSaveForm(!showSaveForm)}
            style={{ 
              marginLeft: 'auto',
              backgroundColor: showSaveForm ? 'var(--primary-bg-color)' : 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <SaveIcon /> {showSaveForm ? 'Avbryt' : 'Spara'}
          </button>
        </div>
        
        {showSaveForm && (
          <div className="save-form">
            <div className="form-group">
              <label htmlFor="name">Anslutningsnamn</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder={`${username}@${host}`}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="group">Grupp</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!showNewGroupInput ? (
                  <>
                    <select
                      id="group"
                      name="group"
                      value={group}
                      onChange={handleChange}
                      style={{ flexGrow: 1 }}
                    >
                      <option value="">Ingen grupp</option>
                      {groups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewGroupInput(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <PlusIcon /> Ny
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      id="newGroup"
                      name="newGroup"
                      value={newGroup}
                      onChange={handleChange}
                      placeholder="Ange nytt gruppnamn"
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewGroupInput(false)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      Avbryt
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <SaveIcon /> Spara anslutning
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ConnectionForm; 