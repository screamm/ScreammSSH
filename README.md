# ScreammSSH

Ett retro-inspirerat terminalverktyg för SSH-anslutningar med ASCII-gränssnitt.

![ScreammSSH Logo](screenshot.png)

## Funktioner

- **ASCII-baserat gränssnitt** - Retro-inspirerad terminal med CRT-effekter
- **SSH-anslutning** - Anslut till servrar via SSH med enkel konfiguration
- **Terminal-emulator** - Inbyggd terminal med retro-utseende
- **Tema-väljare** - Anpassa utseendet med olika retro-teman
- **Anslutningshantering** - Spara och hantera dina SSH-anslutningar
- **CRT-effekt** - Slå på/av CRT-effekten för att simulera gamla katodstrålerör-monitorer

## Installation

```bash
# Klona projektet
git clone https://github.com/din-organisation/ScreammSSH.git
cd ScreammSSH

# Installera beroenden
npm install

# Starta applikationen
npm start
```

## Utveckling

### Körmiljö

- Node.js v16 eller senare
- Electron v35.0.0
- React

### Utveckling utan typkontroll

För snabbare utveckling kan du köra utan typkontroll:

```bash
npm run start-no-types
```

### Paket för distribution

```bash
# För Windows
npm run package-win

# För macOS
npm run package-mac

# För Linux
npm run package-linux
```

## Projektstruktur

- `/src` - Källkod
  - `/main` - Electron huvudprocess
  - `/renderer` - React-applikation (renderarprocess)
    - `/components` - React-komponenter
    - `/styles` - CSS-filer
    - `/utils` - Hjälpklasser och funktioner
  - `/preload` - Preload-skript för Electron

## Komponenter

### AsciiInterface

Huvudgränssnittet med retro-design och ASCII-art.

### SimpleTerminal

En terminal-emulator med stöd för grundläggande terminalkommandon.

### ThemeSelector

Komponent för att byta mellan olika retro-teman eller skapa egna teman.

### Settings

Inställningshantering för applikationen, inklusive CRT-effekt.

### SSHTest

Verktygsfönster för att testa SSH-anslutningar.

## CRT-effekten

CRT-effekten simulerar utseendet av gamla katodstrålerör-monitorer med:

- Scanlinjer som påminner om CRT-skärmar
- Subtil flimmereffekt för att efterlikna bildrörsflimmer
- Glödande text med fosforescerande effekt
- Lätt bildförvrängning som på gamla monitorer

Du kan aktivera/inaktivera CRT-effekten på två sätt:
- Klicka på "[ CRT: PÅ/AV ]" i toppmenyns högra sida
- Ändra inställningen i terminalinställningarna

## Licens

MIT-licens

## Erkännanden

- Utvecklat av ScreammSSH Team
- Inspirerat av gamla terminal-baserade system från 80- och 90-talet
- Använder Electron, React och TypeScript 