import React from 'react';
// NOTERA: Vi använder den äldre react-dom API:et eftersom webpack har problem med att lösa 'react-dom/client'
// Detta genererar en varning men fungerar fortfarande med React 18 i bakåtkompatibilitetsläge
import ReactDOM from 'react-dom';
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

// Använd ReactDOM.render (React 17-stil) eftersom react-dom/client inte kan lösas av webpack
// Detta kommer att visa en varning i konsolen men applikationen kommer att fungera
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  container
); 