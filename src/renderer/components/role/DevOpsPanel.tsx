import React, { useState, useEffect } from 'react';
import { Theme } from '../ThemeSelector';
import '../../styles/ascii-ui.css';

interface ServerInfo {
  id: string;
  name: string;
  host: string;
  status: 'online' | 'offline' | 'warning' | 'unknown';
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  uptimeHours?: number;
}

interface DevOpsPanelProps {
  theme?: Theme;
  retroEffect?: boolean;
  onOpenTerminal?: (serverId: string) => void;
}

const DevOpsPanel: React.FC<DevOpsPanelProps> = ({
  theme = 'default',
  retroEffect = true,
  onOpenTerminal
}) => {
  // Demo-data för serveröversikt
  const [servers, setServers] = useState<ServerInfo[]>([
    { 
      id: '1', 
      name: 'Web Server 01', 
      host: '192.168.1.101', 
      status: 'online',
      cpuUsage: 23,
      memoryUsage: 45,
      diskUsage: 67,
      uptimeHours: 345
    },
    { 
      id: '2', 
      name: 'Database Server', 
      host: '192.168.1.102', 
      status: 'warning',
      cpuUsage: 78,
      memoryUsage: 92,
      diskUsage: 45,
      uptimeHours: 124
    },
    { 
      id: '3', 
      name: 'Docker Host', 
      host: '192.168.1.103', 
      status: 'online',
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 38,
      uptimeHours: 720
    },
    { 
      id: '4', 
      name: 'Backup Server', 
      host: '192.168.1.104', 
      status: 'offline',
      uptimeHours: 0
    }
  ]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'containers' | 'automation'>('overview');
  
  // Status-färger baserat på värde
  const getStatusColor = (value: number): string => {
    if (value < 50) return 'var(--success-color)';
    if (value < 80) return 'var(--warning-color)';
    return 'var(--error-color)';
  };
  
  // Status-text baserat på status
  const getStatusText = (status: ServerInfo['status']): string => {
    switch (status) {
      case 'online': return 'ONLINE';
      case 'offline': return 'OFFLINE';
      case 'warning': return 'VARNING';
      default: return 'OKÄND';
    }
  };
  
  // Status-färg baserat på status
  const getStatusColorClass = (status: ServerInfo['status']): string => {
    switch (status) {
      case 'online': return 'server-status-online';
      case 'offline': return 'server-status-offline';
      case 'warning': return 'server-status-warning';
      default: return 'server-status-unknown';
    }
  };
  
  // Visa serveröversikt
  const renderServerOverview = () => {
    return (
      <div className="ascii-devops-servers">
        <h3 className="ascii-devops-title">SERVERÖVERSIKT</h3>
        
        <div className="ascii-server-grid">
          {servers.map(server => (
            <div key={server.id} className={`ascii-server-card ${getStatusColorClass(server.status)}`}>
              <div className="ascii-server-header">
                <div className="ascii-server-name">{server.name}</div>
                <div className={`ascii-server-status ${getStatusColorClass(server.status)}`}>
                  [{getStatusText(server.status)}]
                </div>
              </div>
              
              <div className="ascii-server-host">{server.host}</div>
              
              {server.status !== 'offline' && (
                <div className="ascii-server-metrics">
                  <div className="ascii-metric">
                    <div className="ascii-metric-label">CPU:</div>
                    <div 
                      className="ascii-metric-value" 
                      style={{ color: getStatusColor(server.cpuUsage || 0) }}
                    >
                      {server.cpuUsage}%
                    </div>
                    <div className="ascii-metric-bar">
                      <div 
                        className="ascii-metric-fill" 
                        style={{ 
                          width: `${server.cpuUsage}%`,
                          backgroundColor: getStatusColor(server.cpuUsage || 0)
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="ascii-metric">
                    <div className="ascii-metric-label">Minne:</div>
                    <div 
                      className="ascii-metric-value" 
                      style={{ color: getStatusColor(server.memoryUsage || 0) }}
                    >
                      {server.memoryUsage}%
                    </div>
                    <div className="ascii-metric-bar">
                      <div 
                        className="ascii-metric-fill" 
                        style={{ 
                          width: `${server.memoryUsage}%`,
                          backgroundColor: getStatusColor(server.memoryUsage || 0)
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="ascii-metric">
                    <div className="ascii-metric-label">Disk:</div>
                    <div 
                      className="ascii-metric-value" 
                      style={{ color: getStatusColor(server.diskUsage || 0) }}
                    >
                      {server.diskUsage}%
                    </div>
                    <div className="ascii-metric-bar">
                      <div 
                        className="ascii-metric-fill" 
                        style={{ 
                          width: `${server.diskUsage}%`,
                          backgroundColor: getStatusColor(server.diskUsage || 0)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="ascii-server-footer">
                <div className="ascii-server-uptime">
                  Drifttid: {server.uptimeHours} timmar
                </div>
                <button 
                  className="ascii-button secondary"
                  onClick={() => onOpenTerminal && onOpenTerminal(server.id)}
                >
                  [ ANSLUT ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Visa container-hantering (demo)
  const renderContainerManagement = () => {
    return (
      <div className="ascii-devops-containers">
        <h3 className="ascii-devops-title">CONTAINER-HANTERING</h3>
        <div className="ascii-container-notice">
          Container-hantering kommer att implementeras i nästa version.
        </div>
      </div>
    );
  };
  
  // Visa automation-verktyg (demo)
  const renderAutomationTools = () => {
    return (
      <div className="ascii-devops-automation">
        <h3 className="ascii-devops-title">AUTOMATISERINGSVERKTYG</h3>
        <div className="ascii-automation-notice">
          Automatiseringsverktyg kommer att implementeras i nästa version.
        </div>
      </div>
    );
  };
  
  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-devops-panel">
        <div className="ascii-devops-tabs">
          <div 
            className={`ascii-devops-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            [ SERVERÖVERSIKT ]
          </div>
          <div 
            className={`ascii-devops-tab ${activeTab === 'containers' ? 'active' : ''}`}
            onClick={() => setActiveTab('containers')}
          >
            [ CONTAINERS ]
          </div>
          <div 
            className={`ascii-devops-tab ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => setActiveTab('automation')}
          >
            [ AUTOMATION ]
          </div>
        </div>
        
        <div className="ascii-devops-content">
          {activeTab === 'overview' && renderServerOverview()}
          {activeTab === 'containers' && renderContainerManagement()}
          {activeTab === 'automation' && renderAutomationTools()}
        </div>
      </div>
    </div>
  );
};

export default DevOpsPanel; 