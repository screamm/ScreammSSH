import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storage-service';
import { SSHConnectionInfo } from '../services/SSHService';
import { ServerIcon, AngleDownIcon, FolderIcon, TrashIcon } from '../utils/icon-wrapper';

interface SavedConnectionsProps {
  onSelect: (connection: SSHConnectionInfo) => void;
  onDelete: (id: string) => void;
}

export const SavedConnections: React.FC<SavedConnectionsProps> = ({ onSelect, onDelete }) => {
  const [connections, setConnections] = useState<SSHConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);

    try {
      const savedConnections = await storageService.getSavedConnections();
      setConnections(savedConnections);
    } catch (err: any) {
      console.error('Fel vid laddning av sparade anslutningar:', err);
      setError(err.message || 'Kunde inte ladda sparade anslutningar');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Gruppera anslutningar efter grupp
  const groupedConnections: Record<string, SSHConnectionInfo[]> = {};
  const ungroupedConnections: SSHConnectionInfo[] = [];

  connections.forEach(connection => {
    if (connection.group) {
      if (!groupedConnections[connection.group]) {
        groupedConnections[connection.group] = [];
      }
      groupedConnections[connection.group].push(connection);
    } else {
      ungroupedConnections.push(connection);
    }
  });

  if (loading) {
    return <div className="loading">Laddar sparade anslutningar...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (connections.length === 0) {
    return <div className="no-connections">Inga sparade anslutningar</div>;
  }

  return (
    <div className="saved-connections">
      {/* Visa först ogrupperade anslutningar */}
      {ungroupedConnections.length > 0 && (
        <div className="connection-group">
          <div className="group-header">
            <span>Ogrupperade</span>
          </div>
          <div className="group-connections">
            {ungroupedConnections.map(connection => (
              <div key={connection.id} className="connection-item">
                <div 
                  className="connection-name"
                  onClick={() => onSelect(connection)}
                >
                  <ServerIcon />
                  <span>{connection.name}</span>
                </div>
                <button 
                  className="delete-button"
                  onClick={() => onDelete(connection.id)}
                  title="Ta bort anslutning"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visa sedan grupperade anslutningar */}
      {Object.keys(groupedConnections).map(groupId => (
        <div key={groupId} className="connection-group">
          <div 
            className="group-header"
            onClick={() => toggleGroup(groupId)}
          >
            <FolderIcon />
            <span>{groupId}</span>
            <AngleDownIcon className={expandedGroups[groupId] ? 'expanded' : ''} />
          </div>
          {expandedGroups[groupId] && (
            <div className="group-connections">
              {groupedConnections[groupId].map(connection => (
                <div key={connection.id} className="connection-item">
                  <div 
                    className="connection-name"
                    onClick={() => onSelect(connection)}
                  >
                    <ServerIcon />
                    <span>{connection.name}</span>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => onDelete(connection.id)}
                    title="Ta bort anslutning"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 