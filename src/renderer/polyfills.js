/**
 * Polyfills för att lösa problem med Node.js-variabler i webbläsarmiljön
 */

console.log('Laddar polyfills för renderer-processen...');

// Polyfills för att säkerställa att __dirname, __filename, process och global är tillgängliga i renderer-processen
console.log('NodeGlobalsPlugin: Globala variabler injicerade');

// Definiera globala variabler som normalt finns i Node.js men inte i webbläsaren
if (typeof window !== 'undefined') {
  // Använd en säkrare metod för att definiera globala variabler
  // Undvik att använda eval() direkt
  
  // Definiera __dirname
  Object.defineProperty(window, '__dirname', {
    value: '/',
    writable: false
  });
  
  // Definiera __filename
  Object.defineProperty(window, '__filename', {
    value: '/index.html',
    writable: false
  });
  
  // Definiera process om det inte redan finns
  if (!window.process) {
    Object.defineProperty(window, 'process', {
      value: {
        env: {
          NODE_ENV: 'development'
        },
        // Lägg till andra process-egenskaper efter behov
        browser: true,
        versions: window.electronAPI ? window.electronAPI.versions : {}
      },
      writable: false
    });
  }
  
  // Definiera global som window
  if (!window.global) {
    Object.defineProperty(window, 'global', {
      value: window,
      writable: false
    });
  }
}

// Buffer polyfill om det behövs
if (typeof window.Buffer === 'undefined') {
  window.Buffer = {
    isBuffer: () => false,
    from: (data) => data
  };
}

// Säkerställ att dessa globaler är tillgängliga
window.setImmediate = window.setImmediate || setTimeout;

console.log('Polyfills laddade: __dirname, __filename, process och global är nu tillgängliga i renderer-processen');

console.log('✅ Polyfills laddade för webbläsarmiljön');

// Exportera en dummy-funktion för att undvika webpack-varningar
export default function setupPolyfills() {
  console.log('Polyfills laddade');
  return true;
} 