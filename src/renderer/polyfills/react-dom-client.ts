/**
 * React DOM Client API Polyfill
 * 
 * Detta är en polyfill för React DOM Client API som används i React 18.
 * Den ger oss createRoot och hydrateRoot funktionerna och kan även fungera
 * med React 17 genom att emulera dessa funktioner med de äldre render/hydrate metoderna.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Importera ReactDOM som ReactDOMClient
const ReactDOMClient = ReactDOM as any;

/**
 * Kontrollerar om ReactDOM har tillgång till createRoot (React 18 API)
 */
function hasCreateRootAPI(): boolean {
  return ReactDOMClient && typeof ReactDOMClient.createRoot === 'function';
}

// Exportera createRoot-funktionen som antingen använder React 18 API eller emulerar det med React 17 API
export function createRoot(container: Element | DocumentFragment) {
  // Om React 18 API är tillgängligt (createRoot finns)
  if (hasCreateRootAPI()) {
    return ReactDOMClient.createRoot(container);
  }
  
  // Fallback för React 17 - emulera createRoot med render och unmountComponentAtNode
  console.log('React 18 createRoot API är inte tillgängligt, använder fallback med React 17 render');
  
  return {
    render(element: React.ReactElement) {
      ReactDOM.render(element, container);
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container);
    }
  };
}

// Exportera hydrateRoot-funktionen som antingen använder React 18 API eller emulerar det med React 17 API
export function hydrateRoot(container: Element, initialChildren: React.ReactNode) {
  // Om React 18 API är tillgängligt (hydrateRoot finns)
  if (ReactDOMClient && typeof ReactDOMClient.hydrateRoot === 'function') {
    return ReactDOMClient.hydrateRoot(container, initialChildren);
  }
  
  // Fallback för React 17 - emulera hydrateRoot med hydrate
  console.log('React 18 hydrateRoot API är inte tillgängligt, använder fallback med React 17 hydrate');
  
  ReactDOM.hydrate(initialChildren as React.ReactElement, container);
  
  return {
    render(element: React.ReactElement) {
      ReactDOM.render(element, container);
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container);
    }
  };
} 