import React, { useState, useEffect } from 'react';
import { Theme } from './ThemeSelector';
import '../styles/ascii-ui.css';

export type UserRole = 'backend' | 'devops' | 'sysadmin' | 'frontend' | 'custom';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  currentTheme: Theme;
  retroEffect?: boolean;
  onBack?: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  onRoleSelect,
  currentTheme,
  retroEffect = true,
  onBack
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Ladda tidigare vald roll om sådan finns
  useEffect(() => {
    const loadSavedRole = async () => {
      try {
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
          setSelectedRole(savedRole as UserRole);
        }
      } catch (error) {
        console.error('Kunde inte ladda sparad användarroll:', error);
      }
    };
    
    loadSavedRole();
  }, []);
  
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };
  
  const confirmRoleSelection = () => {
    if (selectedRole) {
      // Spara vald roll
      localStorage.setItem('userRole', selectedRole);
      onRoleSelect(selectedRole);
    }
  };
  
  return (
    <div className={`ascii-content ${retroEffect ? 'ascii-crt-effect' : ''}`}>
      <div className="ascii-box double">
        <div className="ascii-box-title">VÄLJ DIN ROLL</div>
        
        <div className="ascii-role-selector">
          <div className="ascii-role-description">
            Välj den roll som bäst beskriver ditt primära användningsområde för applikationen.
            Layouten och verktygen kommer att anpassas efter dina behov, men du kan alltid
            ändra detta senare i inställningarna.
          </div>
          
          <div className="ascii-roles-grid">
            <div 
              className={`ascii-role-option ${selectedRole === 'backend' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('backend')}
            >
              <div className="ascii-role-title">Backend-utvecklare</div>
              <div className="ascii-role-features">
                <ul>
                  <li>Kodredigering direkt i SSH-klienten</li>
                  <li>Databashantering</li>
                  <li>Språkspecifika verktyg</li>
                  <li>CI/CD-integrationer</li>
                </ul>
              </div>
            </div>
            
            <div 
              className={`ascii-role-option ${selectedRole === 'devops' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('devops')}
            >
              <div className="ascii-role-title">DevOps/SRE</div>
              <div className="ascii-role-features">
                <ul>
                  <li>Hantering av flera servrar</li>
                  <li>Systemprestanda i realtid</li>
                  <li>Automatisering</li>
                  <li>Container- och infrastrukturhantering</li>
                </ul>
              </div>
            </div>
            
            <div 
              className={`ascii-role-option ${selectedRole === 'sysadmin' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('sysadmin')}
            >
              <div className="ascii-role-title">Systemadministratör</div>
              <div className="ascii-role-features">
                <ul>
                  <li>Serverövervakning och underhåll</li>
                  <li>Användarrättigheter</li>
                  <li>Jobbhantering</li>
                  <li>Systemresursvisualisering</li>
                </ul>
              </div>
            </div>
            
            <div 
              className={`ascii-role-option ${selectedRole === 'frontend' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('frontend')}
            >
              <div className="ascii-role-title">Frontend-utvecklare</div>
              <div className="ascii-role-features">
                <ul>
                  <li>Filsynkronisering</li>
                  <li>Webbserverkonfiguration</li>
                  <li>Prestandaoptimering</li>
                  <li>Statisk tillgångshantering</li>
                </ul>
              </div>
            </div>
            
            <div 
              className={`ascii-role-option ${selectedRole === 'custom' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('custom')}
            >
              <div className="ascii-role-title">Anpassad</div>
              <div className="ascii-role-features">
                <ul>
                  <li>Bygg din egen layout</li>
                  <li>Välj själv vilka verktyg som visas</li>
                  <li>Anpassa alla inställningar manuellt</li>
                  <li>För avancerade användare</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="ascii-role-actions">
            {onBack && (
              <button 
                className="ascii-button secondary"
                onClick={onBack}
              >
                [ TILLBAKA ]
              </button>
            )}
            
            <button 
              className="ascii-button primary"
              onClick={confirmRoleSelection}
              disabled={!selectedRole}
            >
              [ BEKRÄFTA ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector; 