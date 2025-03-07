import React from 'react';
// Använder vår polyfill för React DOM Client API
import { createRoot } from './polyfills/react-dom-client';
import App from './App';
// Importera stilarna explicit
import './styles/main.css';
import './styles/FileExplorer.css'; // Importera även FileExplorer-stilarna
// Importera xterm.css direkt i index.tsx
import 'xterm/css/xterm.css';

// Hitta container-elementet
const container = document.getElementById('app');

// Kontrollera att container faktiskt finns
if (!container) {
  throw new Error('Kunde inte hitta container-elementet med id "app"');
}

// Använd createRoot API
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// OBS: Vi kommer fortfarande att se en varning om att ReactDOM.render är föråldrad,
// men vår applikationskod använder det nya API:et, vilket gör övergången enklare i framtiden 