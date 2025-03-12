import React from 'react';
import * as ReactDOM from 'react-dom';
import './styles/app.css';
import './styles/ascii-ui.css';

console.log('index.tsx laddas...');
console.log('React version:', React.version);
console.log('ReactDOM version:', (ReactDOM as any).version);

// Simpel testkomponent
const App = () => {
  console.log('App-komponenten renderas');
  return (
    <div style={{ padding: '20px', color: 'white', fontFamily: 'monospace' }}>
      <h1>React fungerar!</h1>
      <p>Detta är en enkel testkomponent.</p>
    </div>
  );
};

// Funktion för att montera React
const mountReact = () => {
  console.log('mountReact anropas');
  try {
    const container = document.getElementById('app');
    console.log('Container element:', container);
    
    if (!container) {
      throw new Error('Kunde inte hitta "app" element i DOM');
    }
    
    console.log('Renderar React-applikation...');
    ReactDOM.render(<App />, container);
    console.log('React-applikation renderad');
    
    // Skriv ett meddelande direkt till DOM för att bekräfta
    const messageDiv = document.createElement('div');
    messageDiv.innerText = 'React har monterats!';
    messageDiv.style.color = 'lime';
    messageDiv.style.padding = '10px';
    messageDiv.style.fontFamily = 'monospace';
    document.body.appendChild(messageDiv);
  } catch (error) {
    console.error('Fel vid initialisering av applikationen:', error);
    document.body.innerHTML += `
      <div style="padding: 20px; color: #ff6b6b; font-family: sans-serif;">
        <h2>Ett fel inträffade vid laddning av applikationen</h2>
        <p style="font-family: monospace; background: #333; padding: 10px; border-radius: 4px;">
          ${error instanceof Error ? error.message : String(error)}
        </p>
        <p>Kontrollera konsolen för mer information.</p>
      </div>
    `;
  }
};

// Försök montera React på flera sätt
console.log('Försöker montera React...');

// Metod 1: Direkt montering
mountReact();

// Metod 2: Vänta på DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded triggad');
  mountReact();
});

// Metod 3: Timeout
setTimeout(mountReact, 1000);

// Metod 4: Mutation Observer för att övervaka DOM-ändringar
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      const appElement = document.getElementById('app');
      if (appElement) {
        console.log('App-element hittades via MutationObserver');
        observer.disconnect();
        mountReact();
        break;
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
}); 