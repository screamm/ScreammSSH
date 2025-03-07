/**
 * ANSI Parser för terminalemulering
 * 
 * Denna util konverterar ANSI-escape-sekvenser till HTML med CSS-klasser
 * för att visa färger och formatering i terminalen
 */

// ANSI färg- och formatsekvenser
const ANSI_PATTERN = /\x1b\[([\d;]*)m/g;

// Färgkoder
const ANSI_COLORS = {
  0: 'reset',
  1: 'bold',
  2: 'dim',
  3: 'italic',
  4: 'underline',
  7: 'reverse',
  9: 'strikethrough',
  
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  
  40: 'bg-black',
  41: 'bg-red',
  42: 'bg-green',
  43: 'bg-yellow',
  44: 'bg-blue',
  45: 'bg-magenta',
  46: 'bg-cyan',
  47: 'bg-white',
  
  90: 'bright-black',
  91: 'bright-red',
  92: 'bright-green',
  93: 'bright-yellow',
  94: 'bright-blue',
  95: 'bright-magenta',
  96: 'bright-cyan',
  97: 'bright-white',
  
  100: 'bg-bright-black',
  101: 'bg-bright-red',
  102: 'bg-bright-green',
  103: 'bg-bright-yellow',
  104: 'bg-bright-blue',
  105: 'bg-bright-magenta',
  106: 'bg-bright-cyan',
  107: 'bg-bright-white',
};

/**
 * Analyserar en ANSI-kodad text och returnerar parsad HTML med 
 * CSS-klasser för färger och formatering.
 * 
 * @param text ANSI-kodad text att analysera
 * @returns HTML-sträng med CSS-klasser för färgformatering
 */
export function parseAnsi(text: string): string {
  if (!text) return '';
  
  // Ersätt alla HTML-specialtecken för att undvika XSS
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Spåra aktiva formatklasser
  const activeClasses: string[] = [];
  let result = '';
  let lastIndex = 0;
  
  // Hitta alla ANSI-sekvenser
  let match;
  while ((match = ANSI_PATTERN.exec(text)) !== null) {
    // Lägg till text före denna ANSI-sekvens
    result += text.substring(lastIndex, match.index);
    lastIndex = match.index + match[0].length;
    
    // Analysera parametrarna i escape-sekvensen
    const params = match[1] ? match[1].split(';').map(p => parseInt(p, 10)) : [0];
    
    // Applicera alla parametrar (kan vara flera i en sekvens)
    for (const param of params) {
      if (param === 0) {
        // Reset - stäng alla aktiva taggar
        if (activeClasses.length > 0) {
          result += '</span>'.repeat(activeClasses.length);
          activeClasses.length = 0;
        }
      } else if (param in ANSI_COLORS) {
        const className = ANSI_COLORS[param as keyof typeof ANSI_COLORS];
        
        // Lägg till en ny span med denna formatering
        result += `<span class="ansi-${className}">`;
        activeClasses.push(className);
      }
    }
  }
  
  // Lägg till resten av texten
  result += text.substring(lastIndex);
  
  // Stäng eventuella återstående taggar
  if (activeClasses.length > 0) {
    result += '</span>'.repeat(activeClasses.length);
  }
  
  // Ersätt radbrytningar med HTML-radbrytningar
  result = result.replace(/\n/g, '<br>');
  
  return result;
}

/**
 * Tar bort alla ANSI-escape-sekvenser från en textsträng
 * 
 * @param text Text med ANSI-escape-sekvenser
 * @returns Ren text utan ANSI-kodning
 */
export function stripAnsi(text: string): string {
  if (!text) return '';
  return text.replace(ANSI_PATTERN, '');
}

/**
 * Avgör om en sträng innehåller ANSI-sekvenser
 * 
 * @param text Text att kontrollera
 * @returns true om texten innehåller ANSI-sekvenser
 */
export function containsAnsi(text: string): boolean {
  if (!text) return false;
  return ANSI_PATTERN.test(text);
} 