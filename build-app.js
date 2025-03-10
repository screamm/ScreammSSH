// Skript för att bygga appen och ignorera TypeScript-fel
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Bygger ScreammSSH...');

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
const buildMain = spawn(npxCommand, ['webpack', '--config', 'webpack.main.config.js', '--mode', 'development', '--no-stats'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true' // Ignorera TypeScript-fel
  }
});

buildMain.on('close', (code) => {
  if (code !== 0) {
    console.warn('⚠️ Varning: Main-processen byggdes med fel, men vi fortsätter ändå.');
  }
  
  // Bygg renderer-processen
  console.log('🔨 Bygger renderer-processen...');
  const buildRenderer = spawn(npxCommand, ['webpack', '--config', 'webpack.renderer.config.js', '--mode', 'development', '--no-stats'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TS_NODE_TRANSPILE_ONLY: 'true' // Ignorera TypeScript-fel
    }
  });
  
  buildRenderer.on('close', (code) => {
    if (code !== 0) {
      console.warn('⚠️ Varning: Renderer-processen byggdes med fel, men vi fortsätter ändå.');
    }
    
    // Skapa index.html om den inte finns
    const rendererDir = path.join(__dirname, '.webpack', 'renderer');
    if (!fs.existsSync(rendererDir)) {
      fs.mkdirSync(rendererDir, { recursive: true });
    }
    
    const indexPath = path.join(rendererDir, 'index.html');
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
    
    console.log('✅ Bygget är klart!');
  });
}); 