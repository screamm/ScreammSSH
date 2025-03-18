/**
 * Global polyfill för att tillhandahålla ett globalt objekt som liknar node.js global
 * i en webbläsarmiljö.
 */

// Om vi är i en webbläsarmiljö, använd window-objektet som global
if (typeof window !== 'undefined') {
  // window blir global
  window.global = window;
  
  // Exportera window som global
  module.exports = window;
} else if (typeof global !== 'undefined') {
  // I en Node.js-miljö, använd det befintliga global-objektet
  module.exports = global;
} else if (typeof self !== 'undefined') {
  // I en Web Worker-miljö, använd self
  self.global = self;
  module.exports = self;
} else {
  // Fallback till ett tomt objekt
  const emptyGlobal = {};
  emptyGlobal.global = emptyGlobal;
  module.exports = emptyGlobal;
} 