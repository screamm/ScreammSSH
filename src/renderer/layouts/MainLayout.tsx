import React, { useState, useEffect } from 'react';
import ConnectionList from '../components/ConnectionList';
import Terminal from '../components/Terminal';
import ConnectionForm from '../components/ConnectionForm';
import { SSHConnectionInfo } from '../services/SSHService';
import { connectionManager } from '../services/ConnectionManager';

const MainLayout: React.FC = () => {
  const [selectedConnection, setSelectedConnection] = useState<SSHConnectionInfo | undefined>(undefined);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnectionInfo | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConnectionSelect = (connection: SSHConnectionInfo) => {
    setSelectedConnection(connection);
    
    // Om vi är på mobil, kollapsa sidomenyn automatiskt när en anslutning väljs
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const handleAddConnection = () => {
    setEditingConnection(undefined);
    setShowConnectionForm(true);
  };

  const handleEditConnection = (connection: SSHConnectionInfo) => {
    setEditingConnection(connection);
    setShowConnectionForm(true);
  };

  const handleSaveConnection = async (connection: SSHConnectionInfo) => {
    try {
      if (editingConnection) {
        // Uppdatera befintlig anslutning
        await connectionManager.updateConnection(connection);
      } else {
        // Skapa ny anslutning
        await connectionManager.createConnection(connection);
      }
      
      setShowConnectionForm(false);
      setEditingConnection(undefined);
      
      // Om det är en ny anslutning, välj den
      if (!editingConnection) {
        setSelectedConnection(connection);
      }
    } catch (error) {
      console.error('Fel vid sparande av anslutning:', error);
      alert('Kunde inte spara anslutningen. Kontrollera konsolen för detaljer.');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="main-layout">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="app-title">ScreammSSH</h1>
          <button 
            className="toggle-sidebar-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Visa sidomeny' : 'Dölj sidomeny'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <div className="sidebar-content">
          <ConnectionList 
            onSelect={handleConnectionSelect} 
            selectedId={selectedConnection?.id}
            onAddConnection={handleAddConnection}
            onEditConnection={handleEditConnection}
          />
        </div>
      </div>
      
      <div className="content-area">
        {showConnectionForm ? (
          <ConnectionForm 
            connection={editingConnection}
            onSave={handleSaveConnection}
            onCancel={() => setShowConnectionForm(false)}
          />
        ) : (
          <Terminal 
            connection={selectedConnection}
          />
        )}
      </div>
      
      {isMobile && sidebarCollapsed && (
        <button 
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          title="Visa meny"
        >
          ☰
        </button>
      )}
    </div>
  );
};

export default MainLayout; 