// Enklare skript för att starta appen utan att bygga om allt
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Startar ScreammSSH...');

// Kontrollera om .webpack/main/main.js finns
const mainJsPath = path.join(__dirname, '.webpack/main/main.js');
if (!fs.existsSync(mainJsPath)) {
  console.error('❌ main.js saknas. Kör "npm run build-and-run" först för att bygga appen.');
  process.exit(1);
}

// Kontrollera om .webpack/renderer/renderer.js finns
const rendererJsPath = path.join(__dirname, '.webpack/renderer/renderer.js');
if (!fs.existsSync(rendererJsPath)) {
  console.error('❌ renderer.js saknas. Kör "npm run build-and-run" först för att bygga appen.');
  process.exit(1);
}

// Kontrollera om .webpack/renderer/index.html finns
const indexHtmlPath = path.join(__dirname, '.webpack/renderer/index.html');
if (!fs.existsSync(indexHtmlPath)) {
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
  
  fs.writeFileSync(indexHtmlPath, indexContent);
}

// Starta utvecklingsservern
console.log('🌐 Startar utvecklingsservern...');
const server = spawn('node', ['dev-server.js'], {
  stdio: 'inherit'
});

// Starta Electron-appen
console.log('⚡ Startar Electron-appen...');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const electron = spawn(npxCommand, ['electron', '.webpack/main/main.js'], {
  stdio: 'inherit'
});

electron.on('close', (code) => {
  console.log(`🛑 Electron-appen avslutades med kod ${code}`);
  server.kill();
  process.exit();
});

// Hantera avslut
process.on('SIGINT', () => {
  console.log('👋 Avslutar...');
  server.kill();
  process.exit();
}); 