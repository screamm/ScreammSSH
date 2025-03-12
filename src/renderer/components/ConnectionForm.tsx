import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { connectionManager, ConnectionGroup } from '../services/ConnectionManager';
import { SSHConnectionInfo } from '../services/SSHService';

interface ConnectionFormProps {
  connection?: SSHConnectionInfo; // Om vi redigerar en befintlig anslutning
  onSave: (connection: SSHConnectionInfo) => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ connection, onSave, onCancel }) => {
  const [name, setName] = useState(connection?.name || '');
  const [host, setHost] = useState(connection?.host || '');
  const [port, setPort] = useState(connection?.port || 22);
  const [username, setUsername] = useState(connection?.username || '');
  const [password, setPassword] = useState(connection?.password || '');
  const [privateKey, setPrivateKey] = useState(connection?.privateKey || '');
  const [authType, setAuthType] = useState<'password' | 'privateKey'>(connection?.privateKey ? 'privateKey' : 'password');
  const [passphrase, setPassphrase] = useState(connection?.passphrase || '');
  const [selectedGroup, setSelectedGroup] = useState(connection?.group || '');
  const [color, setColor] = useState(connection?.color || '#4caf50');
  const [notes, setNotes] = useState(connection?.notes || '');
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#4caf50');

  useEffect(() => {
    // Ladda grupper
    setGroups(connectionManager.getAllGroups());
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Namn är obligatoriskt';
    }
    
    if (!host.trim()) {
      newErrors.host = 'Värd är obligatoriskt';
    }
    
    if (!port || port <= 0 || port > 65535) {
      newErrors.port = 'Port måste vara mellan 1 och 65535';
    }
    
    if (!username.trim()) {
      newErrors.username = 'Användarnamn är obligatoriskt';
    }
    
    if (authType === 'password' && !password.trim()) {
      newErrors.password = 'Lösenord är obligatoriskt';
    }
    
    if (authType === 'privateKey' && !privateKey.trim()) {
      newErrors.privateKey = 'Privat nyckel är obligatoriskt';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Skapa anslutningsobjekt
    const connectionData: SSHConnectionInfo = {
      id: connection?.id || uuidv4(),
      name,
      host,
      port,
      username,
      group: selectedGroup || undefined,
      color,
      notes: notes || undefined,
      lastConnected: connection?.lastConnected
    };
    
    // Lägg till autentiseringsuppgifter
    if (authType === 'password') {
      connectionData.password = password;
    } else {
      connectionData.privateKey = privateKey;
      if (passphrase) {
        connectionData.passphrase = passphrase;
      }
    }
    
    onSave(connectionData);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setErrors({ ...errors, newGroup: 'Gruppnamn är obligatoriskt' });
      return;
    }
    
    // Skapa ny grupp
    connectionManager.createGroup({
      name: newGroupName,
      color: newGroupColor
    }).then(newGroup => {
      // Uppdatera grupperna och välj den nya gruppen
      setGroups([...groups, newGroup]);
      setSelectedGroup(newGroup.id);
      setShowGroupForm(false);
      setNewGroupName('');
    });
  };

  return (
    <div className="connection-form-container">
      <div className="connection-form-header">
        <h2>{connection ? 'Redigera anslutning' : 'Ny anslutning'}</h2>
      </div>
      
      <form className="connection-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Namn</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="host">Värd</label>
            <input
              id="host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className={errors.host ? 'error' : ''}
            />
            {errors.host && <div className="error-message">{errors.host}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="port">Port</label>
            <input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 0)}
              className={errors.port ? 'error' : ''}
            />
            {errors.port && <div className="error-message">{errors.port}</div>}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Användarnamn</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={errors.username ? 'error' : ''}
          />
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>
        
        <div className="form-group">
          <label>Autentiseringsmetod</label>
          <div className="auth-type-selector">
            <label>
              <input
                type="radio"
                name="authType"
                value="password"
                checked={authType === 'password'}
                onChange={() => setAuthType('password')}
              />
              Lösenord
            </label>
            <label>
              <input
                type="radio"
                name="authType"
                value="privateKey"
                checked={authType === 'privateKey'}
                onChange={() => setAuthType('privateKey')}
              />
              Privat nyckel
            </label>
          </div>
        </div>
        
        {authType === 'password' ? (
          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="privateKey">Privat nyckel</label>
              <textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={5}
                className={errors.privateKey ? 'error' : ''}
              />
              {errors.privateKey && <div className="error-message">{errors.privateKey}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="passphrase">Lösenfras (om krypterad)</label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="group">Grupp</label>
          <div className="group-selector">
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">Ingen grupp</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="new-group-btn"
              onClick={() => setShowGroupForm(true)}
            >
              +
            </button>
          </div>
        </div>
        
        {showGroupForm && (
          <div className="group-form">
            <h3>Ny grupp</h3>
            <div className="form-group">
              <label htmlFor="newGroupName">Gruppnamn</label>
              <input
                id="newGroupName"
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className={errors.newGroup ? 'error' : ''}
              />
              {errors.newGroup && <div className="error-message">{errors.newGroup}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="newGroupColor">Färg</label>
              <input
                id="newGroupColor"
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
              />
            </div>
            
            <div className="group-form-actions">
              <button type="button" onClick={handleCreateGroup}>Spara grupp</button>
              <button type="button" onClick={() => setShowGroupForm(false)}>Avbryt</button>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="color">Färg</label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Anteckningar</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-btn">Spara</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Avbryt</button>
        </div>
      </form>
    </div>
  );
};

export default ConnectionForm; 