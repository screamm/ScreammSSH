/**
 * Polyfill för React DOM Client API (React 18)
 * 
 * Detta är en polyfill för createRoot och hydrateRoot funktionerna
 * som introducerades i React 18. Den gör det möjligt att använda
 * dessa funktioner även med äldre versioner av React.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Utförligare loggning för felsökning
console.log('react-dom-client.ts laddas...');
console.log('React version:', (React as any).version);
console.log('ReactDOM version:', (ReactDOM as any).version);

// Importera ReactDOM som ReactDOMClient
const ReactDOMClient = ReactDOM as any;

/**
 * Kontrollerar om ReactDOM har tillgång till createRoot (React 18 API)
 */
function hasCreateRootAPI(): boolean {
  const hasCreateRoot = ReactDOMClient && typeof ReactDOMClient.createRoot === 'function';
  console.log('Har createRoot API:', hasCreateRoot);
  return hasCreateRoot;
}

// Exportera createRoot och hydrateRoot funktioner
export function createRoot(container: Element | DocumentFragment, options?: any) {
  console.log('createRoot anropas med container:', container);
  
  try {
    // Om ReactDOM har createRoot, använd den
    if ('createRoot' in ReactDOM) {
      console.log('Använder React 18 createRoot API');
      return (ReactDOM as any).createRoot(container, options);
    }
    
    // Fallback för React 17 och tidigare
    console.log('Fallback till React 17 render metod');
    return {
      render(element: React.ReactElement) {
        ReactDOM.render(element, container, options?.onRecoverableError);
      },
      unmount() {
        ReactDOM.unmountComponentAtNode(container);
      }
    };
  } catch (error) {
    console.error('Fel vid createRoot:', error);
    throw error;
  }
}

export function hydrateRoot(
  container: Element | DocumentFragment,
  initialChildren: React.ReactNode,
  options?: any
) {
  console.log('hydrateRoot anropas med container:', container);
  
  try {
    // Om ReactDOM har hydrateRoot, använd den
    if ('hydrateRoot' in ReactDOM) {
      console.log('Använder React 18 hydrateRoot API');
      return (ReactDOM as any).hydrateRoot(container, initialChildren, options);
    }
    
    // Fallback för React 17 och tidigare
    console.log('Fallback till React 17 hydrate metod');
    // Konvertera ReactNode till ReactElement för att matcha signaturen för ReactDOM.hydrate
    ReactDOM.hydrate(initialChildren as React.ReactElement, container);
    return {
      unmount() {
        ReactDOM.unmountComponentAtNode(container);
      }
    };
  } catch (error) {
    console.error('Fel vid hydrateRoot:', error);
    throw error;
  }
} 