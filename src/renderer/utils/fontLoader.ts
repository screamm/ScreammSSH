/**
 * Fontladdare - hjälper till att ladda och förbereda typsnitt i applikationen
 */

// Kontrollera om fonter är laddade
export const checkFontsLoaded = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Kontrollera specifikt DOS-fonten
        const fontLoaded = document.fonts.check('12px "Perfect DOS VGA"');
        console.log('Fonterna är laddade:', fontLoaded);
        
        if (!fontLoaded) {
          console.warn('DOS-fonten verkar inte vara laddad korrekt');
        }
        
        resolve(fontLoaded);
      });
    } else {
      // Äldre webbläsare utan FontFaceSet API
      // Använd timeout som fallback
      setTimeout(() => {
        console.log('Fonts API inte tillgängligt, antar att fonterna är laddade');
        resolve(true);
      }, 500);
    }
  });
};

// Skapa ett test-element för att tvinga laddning av fonten
export const preloadFonts = (): void => {
  const testElement = document.createElement('div');
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  testElement.style.fontFamily = '"Perfect DOS VGA", monospace';
  testElement.textContent = 'Testar fontladdning';
  document.body.appendChild(testElement);
  
  // Ta bort elementet efter en sekund
  setTimeout(() => {
    if (document.body.contains(testElement)) {
      document.body.removeChild(testElement);
    }
  }, 1000);
  
  // Logga info om tillgängliga fonter i utvecklingsläge
  if (process.env.NODE_ENV === 'development') {
    if (document.fonts && document.fonts.forEach) {
      console.log('Tillgängliga fonter:');
      document.fonts.forEach((font) => {
        console.log(`- ${font.family} (${font.status})`);
      });
    }
  }
};

export default {
  checkFontsLoaded,
  preloadFonts
}; 