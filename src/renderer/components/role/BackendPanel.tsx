import React, { useState, useEffect } from 'react';
import { Theme } from '../ThemeSelector';
import '../../styles/ascii-ui.css';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  tables?: string[];
}

interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: string;
  lastModified: string;
  size: string;
}

interface BackendPanelProps {
  theme?: Theme;
  retroEffect?: boolean;
  onOpenTerminal?: (serverId: string) => void;
}

const BackendPanel: React.FC<BackendPanelProps> = ({
  theme = 'default',
  retroEffect = true,
  onOpenTerminal
}) => {
  // Demo-data för databaser
  const [databases, setDatabases] = useState<DatabaseConnection[]>([
    { 
      id: '1', 
      name: 'User Database', 
      type: 'mysql',
      host: 'db1.example.com', 
      port: 3306,
      status: 'connected',
      tables: ['users', 'profiles', 'settings', 'logs']
    },
    { 
      id: '2', 
      name: 'Product Catalog', 
      type: 'postgresql',
      host: 'db2.example.com', 
      port: 5432,
      status: 'connected',
      tables: ['products', 'categories', 'tags', 'vendors']
    },
    { 
      id: '3', 
      name: 'Analytics DB', 
      type: 'mongodb',
      host: 'mongo.example.com', 
      port: 27017,
      status: 'disconnected'
    },
    { 
      id: '4', 
      name: 'Local Config', 
      type: 'sqlite',
      host: 'localhost', 
      port: 0,
      status: 'connected',
      tables: ['config', 'cache']
    }
  ]);
  
  // Demo-data för kodfiler
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'server.js',
      path: '/var/www/app/',
      language: 'JavaScript',
      lastModified: '2023-03-15 14:32',
      size: '4.2 KB'
    },
    {
      id: '2',
      name: 'database.php',
      path: '/var/www/app/includes/',
      language: 'PHP',
      lastModified: '2023-03-10 09:15',
      size: '2.8 KB'
    },
    {
      id: '3',
      name: 'api.py',
      path: '/var/www/app/api/',
      language: 'Python',
      lastModified: '2023-03-12 11:45',
      size: '6.5 KB'
    },
    {
      id: '4',
      name: 'schema.sql',
      path: '/var/www/app/db/',
      language: 'SQL',
      lastModified: '2023-03-01 16:20',
      size: '12.3 KB'
    }
  ]);
  
  const [activeTab, setActiveTab] = useState<'databases' | 'code' | 'api'>('databases');
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  
  // Få databastyp-ikon
  const getDatabaseIcon = (type: DatabaseConnection['type']): string => {
    switch (type) {
      case 'mysql': return '[ MySQL ]';
      case 'postgresql': return '[ PostgreSQL ]';
      case 'mongodb': return '[ MongoDB ]';
      case 'sqlite': return '[ SQLite ]';
      default: return '[ DB ]';
    }
  };
  
  // Få språk-ikon
  const getLanguageIcon = (language: string): string => {
    switch (language.toLowerCase()) {
      case 'javascript': return '[ JS ]';
      case 'php': return '[ PHP ]';
      case 'python': return '[ PY ]';
      case 'sql': return '[ SQL ]';
      default: return '[ CODE ]';
    }
  };
  
  // Visa databasfliken
  const renderDatabases = () => {
    return (
      <div className="ascii-backend-databases">
        <h3 className="ascii-backend-title">DATABASER</h3>
        
        <div className="ascii-database-grid">
          {databases.map(db => (
            <div 
              key={db.id} 
              className={`ascii-database-card ${db.status === 'connected' ? 'connected' : 'disconnected'} ${selectedDatabase === db.id ? 'selected' : ''}`}
              onClick={() => setSelectedDatabase(db.id === selectedDatabase ? null : db.id)}
            >
              <div className="ascii-database-header">
                <div className="ascii-database-name">{db.name}</div>
                <div className="ascii-database-type">{getDatabaseIcon(db.type)}</div>
              </div>
              
              <div className="ascii-database-connection">
                {db.host}:{db.port}
              </div>
              
              <div className="ascii-database-status">
                Status: {db.status === 'connected' ? 'ANSLUTEN' : 'FRÅNKOPPLAD'}
              </div>
              
              {db.status === 'connected' && db.tables && selectedDatabase === db.id && (
                <div className="ascii-database-tables">
                  <div className="ascii-database-tables-header">Tabeller:</div>
                  <div className="ascii-database-tables-list">
                    {db.tables.map(table => (
                      <div key={table} className="ascii-database-table">
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="ascii-database-actions">
                <button 
                  className="ascii-button secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Funktionen för databasåtgärder kommer i nästa version`);
                  }}
                >
                  [ FRÅGA ]
                </button>
                
                <button 
                  className="ascii-button secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTerminal && onOpenTerminal(db.id);
                  }}
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
  
  // Visa kodredigeringsfliken
  const renderCodeEditor = () => {
    return (
      <div className="ascii-backend-code">
        <h3 className="ascii-backend-title">KODFILER</h3>
        
        <div className="ascii-code-files">
          <div className="ascii-code-files-header">
            <div className="ascii-code-file-name">Filnamn</div>
            <div className="ascii-code-file-path">Sökväg</div>
            <div className="ascii-code-file-language">Typ</div>
            <div className="ascii-code-file-modified">Ändrad</div>
            <div className="ascii-code-file-size">Storlek</div>
            <div className="ascii-code-file-actions">Åtgärder</div>
          </div>
          
          {codeFiles.map(file => (
            <div key={file.id} className="ascii-code-file-row">
              <div className="ascii-code-file-name">{file.name}</div>
              <div className="ascii-code-file-path">{file.path}</div>
              <div className="ascii-code-file-language">{getLanguageIcon(file.language)}</div>
              <div className="ascii-code-file-modified">{file.lastModified}</div>
              <div className="ascii-code-file-size">{file.size}</div>
              <div className="ascii-code-file-actions">
                <button 
                  className="ascii-button mini"
                  onClick={() => alert(`Redigeringsfunktionen kommer i nästa version`)}
                >
                  [ REDIGERA ]
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="ascii-code-editor-placeholder">
          <div className="ascii-code-editor-message">
            Välj en fil att redigera eller klicka på "REDIGERA" bredvid en fil.
          </div>
        </div>
      </div>
    );
  };
  
  // Visa API-testfliken
  const renderApiTester = () => {
    return (
      <div className="ascii-backend-api">
        <h3 className="ascii-backend-title">API-TESTARE</h3>
        <div className="ascii-api-notice">
          API-testning kommer att implementeras i nästa version.
        </div>
      </div>
    );
  };
  
  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-backend-panel">
        <div className="ascii-backend-tabs">
          <div 
            className={`ascii-backend-tab ${activeTab === 'databases' ? 'active' : ''}`}
            onClick={() => setActiveTab('databases')}
          >
            [ DATABASER ]
          </div>
          <div 
            className={`ascii-backend-tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            [ KODREDIGERING ]
          </div>
          <div 
            className={`ascii-backend-tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            [ API-TESTARE ]
          </div>
        </div>
        
        <div className="ascii-backend-content">
          {activeTab === 'databases' && renderDatabases()}
          {activeTab === 'code' && renderCodeEditor()}
          {activeTab === 'api' && renderApiTester()}
        </div>
      </div>
    </div>
  );
};

export default BackendPanel; 