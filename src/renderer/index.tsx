import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.css';
import './styles/ascii-ui.css';
import './styles/crt-effect.css';
import App from './App';
import './styles/index.css';
import './polyfills';

// Loggning för debugging
console.log('🚀 Renderer-process startar');
console.log('React version:', React.version);

// Kontrollera om electronAPI finns tillgängligt
if (window.electronAPI) {
  console.log('✅ electronAPI är tillgängligt i React-appen');
} else {
  console.warn('⚠️ electronAPI är INTE tillgängligt i React-appen');
}

// Skapa en wrapper-komponent som hanterar felhantering
const AppWrapper: React.FC = () => {
  // Använd React.useState för att hantera fel
  const [error, setError] = React.useState<Error | null>(null);

  // Använd React.useEffect för att sätta upp global felhantering
  React.useEffect(() => {
    // Spara den ursprungliga felhanteraren
    const originalErrorHandler = window.onerror;

    // Sätt upp en global felhanterare
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', message, error);
      setError(error || new Error(String(message)));
      
      // Anropa den ursprungliga felhanteraren om den finns
      if (typeof originalErrorHandler === 'function') {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Städa upp när komponenten avmonteras
    return () => {
      window.onerror = originalErrorHandler;
    };
  }, []);

  // Visa ett felmeddelande om något gick fel
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red', 
        background: '#222',
        fontFamily: 'monospace',
        border: '1px solid red',
        borderRadius: '5px',
        margin: '20px'
      }}>
        <h2>Ett fel inträffade</h2>
        <p>{error.message}</p>
        <details>
          <summary>Visa stackspårning</summary>
          <pre>{error.stack}</pre>
        </details>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#333',
            color: 'white',
            border: '1px solid white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Ladda om appen
        </button>
      </div>
    );
  }

  // Rendera appen normalt om inget fel inträffade
  return <App />;
};

// Hämta rot-elementet
const rootElement = document.getElementById('app');

// Kontrollera att rot-elementet finns
if (!rootElement) {
  console.error('Kunde inte hitta rot-elementet med id "app"');
  
  // Skapa ett rot-element om det inte finns
  const newRootElement = document.createElement('div');
  newRootElement.id = 'app';
  document.body.appendChild(newRootElement);
  
  console.log('Skapade ett nytt rot-element med id "app"');
  
  // Använd det nya rot-elementet
  const root = ReactDOM.createRoot(newRootElement);
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
} else {
  // Använd det befintliga rot-elementet
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
}

// Logga att React-appen har renderats
console.log('React-app har renderats'); 