// Skript för att bygga och starta appen i produktionsläge
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Bygger och startar ScreammSSH i produktionsläge...');

// Rensa tidigare byggen
console.log('🧹 Rensar tidigare byggen...');
const webpackDir = path.join(__dirname, '.webpack');
if (fs.existsSync(webpackDir)) {
  fs.rmSync(webpackDir, { recursive: true, force: true });
}

// Använd rätt kommando beroende på operativsystem
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Bygg main-processen
console.log('🔨 Bygger main-processen...');
const buildMain = spawn(npxCommand, ['webpack', '--config', 'webpack.main.config.js'], {
  stdio: 'inherit'
});

buildMain.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Fel vid byggande av main-processen');
    process.exit(code);
  }
  
  // Bygg renderer-processen
  console.log('🔨 Bygger renderer-processen...');
  const buildRenderer = spawn(npxCommand, ['webpack', '--config', 'webpack.renderer.config.js'], {
    stdio: 'inherit'
  });
  
  buildRenderer.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Fel vid byggande av renderer-processen');
      process.exit(code);
    }
    
    // Skapa index.html om den inte finns
    const rendererDir = path.join(__dirname, '.webpack', 'renderer');
    const indexPath = path.join(rendererDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.log('📝 Skapar index.html...');
      const indexContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; font-src 'self' data:; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'">
  <title>ScreammSSH Terminal</title>
</head>
<body>
  <div id="root"></div>
  <script src="./renderer.js"></script>
</body>
</html>`;
      
      fs.writeFileSync(indexPath, indexContent);
    }
    
    // Starta utvecklingsservern
    console.log('🌐 Startar utvecklingsservern...');
    const server = spawn('node', ['dev-server.js'], {
      stdio: 'inherit'
    });
    
    // Starta Electron-appen
    console.log('⚡ Startar Electron-appen...');
    const electron = spawn(npxCommand, ['electron', '.webpack/main/main.js'], {
      stdio: 'inherit'
    });
    
    electron.on('close', (code) => {
      console.log(`🛑 Electron-appen avslutades med kod ${code}`);
      server.kill();
      process.exit();
    });
  });
});

// Hantera avslut
process.on('SIGINT', () => {
  console.log('👋 Avslutar...');
  process.exit();
}); 