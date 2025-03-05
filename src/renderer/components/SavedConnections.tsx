import React, { useEffect, useState } from 'react';
import { SavedConnection, storageService } from '../services/storage-service';
import { ServerIcon, AngleDownIcon, FolderIcon, TrashIcon } from '../utils/icon-wrapper';

interface SavedConnectionsProps {
  onSelect: (connection: SavedConnection) => void;
}

const SavedConnections: React.FC<SavedConnectionsProps> = ({ onSelect }) => {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    if (isDropdownOpen) {
      loadSavedConnections();
    }
  }, [isDropdownOpen]);
  
  const loadSavedConnections = async () => {
    try {
      setLoading(true);
      const savedConnections = await storageService.getSavedConnections();
      setConnections(savedConnections);
      
      // Initiera grupper som stängda vid första laddningen
      const groupMap: {[key: string]: boolean} = {};
      savedConnections.forEach(conn => {
        if (conn.group && !groupMap.hasOwnProperty(conn.group)) {
          groupMap[conn.group] = false; // Stängd som standard
        }
      });
      setGroups(groupMap);
    } catch (error) {
      console.error('Kunde inte ladda sparade anslutningar:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await storageService.deleteConnection(id);
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.id !== id)
      );
      
      // Uppdatera grupper efter borttagning
      const remainingConnections = connections.filter(conn => conn.id !== id);
      const groupMap: {[key: string]: boolean} = {};
      remainingConnections.forEach(conn => {
        if (conn.group && !groupMap.hasOwnProperty(conn.group)) {
          groupMap[conn.group] = groups[conn.group] || false;
        }
      });
      setGroups(groupMap);
    } catch (error) {
      console.error('Kunde inte ta bort anslutning:', error);
    }
  };
  
  const handleSelect = (connection: SavedConnection) => {
    onSelect(connection);
    setIsDropdownOpen(false);
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const toggleGroup = (group: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  // Gruppera anslutningar
  const groupedConnections: { [key: string]: SavedConnection[] } = {
    'Ogrupperade': []
  };
  
  connections.forEach(connection => {
    if (connection.group) {
      if (!groupedConnections[connection.group]) {
        groupedConnections[connection.group] = [];
      }
      groupedConnections[connection.group].push(connection);
    } else {
      groupedConnections['Ogrupperade'].push(connection);
    }
  });
  
  return (
    <div className="saved-connections">
      <button className="dropdown-button" onClick={toggleDropdown}>
        <ServerIcon style={{ marginRight: '8px' }} />
        Sparade anslutningar
        <AngleDownIcon style={{ marginLeft: '8px' }} />
      </button>
      
      {isDropdownOpen && (
        <div className="connections-dropdown">
          {loading ? (
            <div className="loading-connections">Laddar...</div>
          ) : connections.length === 0 ? (
            <div className="no-connections">Inga sparade anslutningar</div>
          ) : (
            Object.entries(groupedConnections).map(([group, groupConnections]) => 
              groupConnections.length > 0 && (
                <div key={group} className="connection-group">
                  {group !== 'Ogrupperade' && (
                    <div 
                      className="group-header" 
                      onClick={(e) => toggleGroup(group, e)}
                    >
                      <FolderIcon style={{ marginRight: '8px', color: '#f8d775' }} />
                      <span>{group}</span>
                      <span className="group-toggle">
                        {groups[group] ? '▼' : '▶'}
                      </span>
                    </div>
                  )}
                  
                  {(group === 'Ogrupperade' || groups[group]) && (
                    <div className={`group-items ${group !== 'Ogrupperade' ? 'indented' : ''}`}>
                      {groupConnections.map(conn => (
                        <div 
                          key={conn.id} 
                          className="connection-item"
                          onClick={() => handleSelect(conn)}
                        >
                          <div className="connection-info">
                            <div className="connection-name">{conn.name}</div>
                            <div className="connection-details">
                              {conn.username}@{conn.host}:{conn.port}
                            </div>
                          </div>
                          <button 
                            className="delete-button"
                            onClick={(e) => handleDelete(conn.id, e)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SavedConnections; 