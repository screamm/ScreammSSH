# ScreammSSH

En utvecklarfokuserad SSH-klient med retro-grönt gränssnitt och avancerade funktioner för olika användarroller.

![ScreammSSH Screenshot](screenshot.png)

## Funktioner

- Retro-grönt terminalutseende med ASCII-konst
- Rollbaserade layouter för olika användartyper (Backend, DevOps, SysAdmin, Frontend)
- Terminalemulering med stöd för ANSI/VT100
- Sessionshantering för SSH-anslutningar
- Filöverföring via SFTP
- Anpassningsbara teman och inställningar

## Utveckling

### Förutsättningar

- Node.js (v14 eller senare)
- npm (v6 eller senare)

### Installation

```bash
# Klona projektet
git clone https://github.com/yourusername/ScreammSSH.git
cd ScreammSSH

# Installera beroenden
npm install
```

### Starta utvecklingsmiljön

```bash
# Starta utvecklingsservern och Electron-appen
npm run dev
```

### Bygga för produktion

```bash
# Bygg för Windows
npm run make
```

## Projektstruktur

```
ScreammSSH/
├── src/
│   ├── main/           # Electron huvudprocess
│   │   ├── main.ts     # Huvudfil för Electron
│   │   └── preload.ts  # Preload-skript för säker IPC
│   └── renderer/       # Frontend-kod
│       ├── components/ # UI-komponenter
│       ├── styles/     # CSS-stilar
│       ├── utils/      # Hjälpfunktioner
│       ├── App.tsx     # Huvudkomponent
│       └── index.tsx   # Ingångspunkt för renderer
├── webpack.*.config.js # Webpack-konfiguration
└── package.json        # Projektberoenden och skript
```

## Licens

Copyright (c) 2023 ScreammSSH Team - Alla rättigheter förbehållna 