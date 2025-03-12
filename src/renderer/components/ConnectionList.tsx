import React, { useState, useEffect } from 'react';
import { connectionManager, ConnectionGroup } from '../services/ConnectionManager';
import { SSHConnectionInfo } from '../services/SSHService';

interface ConnectionListProps {
  onSelect: (connection: SSHConnectionInfo) => void;
  selectedId?: string;
  onAddConnection: () => void;
  onEditConnection: (connection: SSHConnectionInfo) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({ 
  onSelect, 
  selectedId,
  onAddConnection,
  onEditConnection
}) => {
  const [connections, setConnections] = useState<SSHConnectionInfo[]>([]);
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [groupVisibility, setGroupVisibility] = useState<Record<string, boolean>>({});
  const [showContextMenu, setShowContextMenu] = useState<{
    x: number;
    y: number;
    connectionId: string;
  } | null>(null);

  useEffect(() => {
    // Ladda anslutningar och grupper
    loadData();

    // Lyssna på förändringar i aktiva anslutningar
    const checkActiveConnections = () => {
      setActiveConnections(connectionManager.getActiveConnections());
    };

    // Kontrollera var 5:e sekund
    const interval = setInterval(checkActiveConnections, 5000);
    checkActiveConnections(); // Kontrollera direkt

    // Lyssna på klick utanför kontextmenyn för att stänga den
    const handleClickOutside = () => {
      setShowContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const loadData = () => {
    const allConnections = connectionManager.getAllConnections();
    const allGroups = connectionManager.getAllGroups();
    
    setConnections(allConnections);
    setGroups(allGroups);
    
    // Initialisera gruppsynlighet (alla synliga från början)
    const visibility: Record<string, boolean> = {};
    allGroups.forEach(group => {
      visibility[group.id] = true;
    });
    setGroupVisibility(visibility);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredConnections = searchTerm
    ? connectionManager.searchConnections(searchTerm)
    : connections;

  const toggleGroupVisibility = (groupId: string) => {
    setGroupVisibility(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const isActive = (connectionId: string) => {
    return activeConnections.includes(connectionId);
  };

  const handleContextMenu = (e: React.MouseEvent, connection: SSHConnectionInfo) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu({
      x: e.clientX,
      y: e.clientY,
      connectionId: connection.id
    });
  };

  const handleEdit = (connection: SSHConnectionInfo) => {
    setShowContextMenu(null);
    onEditConnection(connection);
  };

  const handleDelete = async (connectionId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna anslutning?')) {
      try {
        await connectionManager.deleteConnection(connectionId);
        loadData(); // Uppdatera listan
        setShowContextMenu(null);
      } catch (error) {
        console.error('Fel vid borttagning av anslutning:', error);
        alert('Kunde inte ta bort anslutningen. Kontrollera konsolen för detaljer.');
      }
    }
  };

  const renderConnectionGroups = () => {
    // Organisera anslutningar efter grupp
    const groupedConnections: Record<string, SSHConnectionInfo[]> = {};
    const ungroupedConnections: SSHConnectionInfo[] = [];
    
    // Sortera anslutningar efter grupp
    filteredConnections.forEach(conn => {
      if (conn.group) {
        if (!groupedConnections[conn.group]) {
          groupedConnections[conn.group] = [];
        }
        groupedConnections[conn.group].push(conn);
      } else {
        ungroupedConnections.push(conn);
      }
    });

    return (
      <>
        {groups.map(group => {
          const groupConns = groupedConnections[group.id] || [];
          if (groupConns.length === 0) return null;
          
          return (
            <div key={group.id} className="connection-group">
              <div 
                className="group-header" 
                style={{ backgroundColor: group.color || '#444' }}
                onClick={() => toggleGroupVisibility(group.id)}
              >
                <span className="group-toggle">
                  {groupVisibility[group.id] ? '▼' : '►'}
                </span>
                <span className="group-name">{group.name}</span>
                <span className="group-count">{groupConns.length}</span>
              </div>
              
              {groupVisibility[group.id] && (
                <div className="group-connections">
                  {groupConns.map(conn => renderConnectionItem(conn))}
                </div>
              )}
            </div>
          );
        })}
        
        {ungroupedConnections.length > 0 && (
          <div className="connection-group">
            <div 
              className="group-header"
              onClick={() => toggleGroupVisibility('ungrouped')}
            >
              <span className="group-toggle">
                {groupVisibility['ungrouped'] ? '▼' : '►'}
              </span>
              <span className="group-name">Ogrupperade</span>
              <span className="group-count">{ungroupedConnections.length}</span>
            </div>
            
            {groupVisibility['ungrouped'] && (
              <div className="group-connections">
                {ungroupedConnections.map(conn => renderConnectionItem(conn))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const renderConnectionItem = (connection: SSHConnectionInfo) => {
    const isSelected = selectedId === connection.id;
    const active = isActive(connection.id);
    
    return (
      <div 
        key={connection.id}
        className={`connection-item ${isSelected ? 'selected' : ''} ${active ? 'active' : ''}`}
        onClick={() => onSelect(connection)}
        onContextMenu={(e) => handleContextMenu(e, connection)}
      >
        <div className="connection-color" style={{ backgroundColor: connection.color || '#777' }} />
        <div className="connection-info">
          <div className="connection-name">{connection.name}</div>
          <div className="connection-details">
            {connection.username}@{connection.host}:{connection.port}
          </div>
        </div>
        <div className="connection-status">
          {active && <span className="status-indicator connected">●</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="connection-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Sök anslutningar..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      <div className="connections-container">
        {filteredConnections.length === 0 ? (
          <div className="no-connections">
            Inga anslutningar hittades
          </div>
        ) : (
          renderConnectionGroups()
        )}
      </div>
      
      <div className="actions-container">
        <button 
          className="add-connection-btn"
          onClick={onAddConnection}
        >
          + Ny anslutning
        </button>
      </div>

      {showContextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${showContextMenu.y}px`,
            left: `${showContextMenu.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="context-menu-item"
            onClick={() => {
              const connection = connections.find(c => c.id === showContextMenu.connectionId);
              if (connection) handleEdit(connection);
            }}
          >
            Redigera
          </div>
          <div 
            className="context-menu-item delete"
            onClick={() => handleDelete(showContextMenu.connectionId)}
          >
            Ta bort
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionList; 