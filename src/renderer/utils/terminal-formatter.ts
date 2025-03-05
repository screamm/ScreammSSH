/**
 * Formaterar terminalutdata med stöd för ANSI-färgkoder
 * och andra formateringskoder.
 * 
 * @param text Text att formatera
 * @param type Typ av utdata ('standard' eller 'error')
 * @returns Formaterad text med HTML-span-element för styling
 */
export const formatOutput = (text: string | undefined, type: 'standard' | 'error' = 'standard'): string => {
  if (!text) return '';
  
  let formatted = text;
  
  // Ersätt newlines med faktiska radbrytningar
  formatted = formatted.replace(/\r\n/g, '\n');
  
  // Lägg till CSS-klasser baserat på typ
  if (type === 'error') {
    formatted = `<span class="terminal-red">${formatted}</span>`;
  }
  
  // Formatera färger och stilar enligt ANSI-standarder
  // Färger
  formatted = formatted
    // Standardfärger
    .replace(/\u001b\[30m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #000;">$1</span>') // Svart
    .replace(/\u001b\[31m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-red">$1</span>') // Röd
    .replace(/\u001b\[32m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-green">$1</span>') // Grön
    .replace(/\u001b\[33m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-yellow">$1</span>') // Gul
    .replace(/\u001b\[34m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-blue">$1</span>') // Blå
    .replace(/\u001b\[35m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-magenta">$1</span>') // Magenta
    .replace(/\u001b\[36m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-cyan">$1</span>') // Cyan
    .replace(/\u001b\[37m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span class="terminal-white">$1</span>') // Vit
    
    // Ljusa färger
    .replace(/\u001b\[90m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #888;">$1</span>') // Ljusgrå
    .replace(/\u001b\[91m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #f55;">$1</span>') // Ljusröd
    .replace(/\u001b\[92m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #5f5;">$1</span>') // Ljusgrön
    .replace(/\u001b\[93m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #ff5;">$1</span>') // Ljusgul
    .replace(/\u001b\[94m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #55f;">$1</span>') // Ljusblå
    .replace(/\u001b\[95m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #f5f;">$1</span>') // Ljusmagenta
    .replace(/\u001b\[96m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #5ff;">$1</span>') // Ljuscyan
    .replace(/\u001b\[97m(.*?)(\u001b\[0m|\u001b\[39m)/g, '<span style="color: #fff;">$1</span>') // Ljusvit
    
    // Bakgrundsfärger
    .replace(/\u001b\[40m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #000;">$1</span>') // Svart
    .replace(/\u001b\[41m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #a00;">$1</span>') // Röd
    .replace(/\u001b\[42m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #0a0;">$1</span>') // Grön
    .replace(/\u001b\[43m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #a50;">$1</span>') // Gul
    .replace(/\u001b\[44m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #00a;">$1</span>') // Blå
    .replace(/\u001b\[45m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #a0a;">$1</span>') // Magenta
    .replace(/\u001b\[46m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #0aa;">$1</span>') // Cyan
    .replace(/\u001b\[47m(.*?)(\u001b\[0m|\u001b\[49m)/g, '<span style="background-color: #aaa;">$1</span>'); // Vit
    
  // Andra stilar
  formatted = formatted
    .replace(/\u001b\[1m(.*?)(\u001b\[0m|\u001b\[22m)/g, '<span class="terminal-bold">$1</span>') // Fet
    .replace(/\u001b\[3m(.*?)(\u001b\[0m|\u001b\[23m)/g, '<span style="font-style: italic;">$1</span>') // Kursiv
    .replace(/\u001b\[4m(.*?)(\u001b\[0m|\u001b\[24m)/g, '<span style="text-decoration: underline;">$1</span>') // Understruken
    .replace(/\u001b\[9m(.*?)(\u001b\[0m|\u001b\[29m)/g, '<span style="text-decoration: line-through;">$1</span>'); // Genomstruken
    
  // Rensa eventuella kvarvarande ANSI-koder
  formatted = formatted.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
  
  return formatted;
}; 