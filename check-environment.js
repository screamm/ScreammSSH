// Skript för att kontrollera om alla nödvändiga verktyg finns installerade
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Kontrollerar utvecklingsmiljön...');

// Kontrollera Node.js-version
const nodeVersion = process.version;
console.log(`Node.js-version: ${nodeVersion}`);
const nodeVersionNum = Number(nodeVersion.match(/^v(\d+)/)[1]);
if (nodeVersionNum < 14) {
  console.error('❌ Node.js-version 14 eller senare krävs');
  process.exit(1);
} else {
  console.log('✅ Node.js-version OK');
}

// Kontrollera npm-version
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`npm-version: ${npmVersion}`);
  const npmVersionNum = Number(npmVersion.split('.')[0]);
  if (npmVersionNum < 6) {
    console.error('❌ npm-version 6 eller senare krävs');
    process.exit(1);
  } else {
    console.log('✅ npm-version OK');
  }
} catch (error) {
  console.error('❌ Kunde inte kontrollera npm-version');
  process.exit(1);
}

// Kontrollera om webpack är installerat
try {
  const webpackVersion = execSync('npx webpack --version').toString().trim();
  console.log(`webpack-version: ${webpackVersion}`);
  console.log('✅ webpack OK');
} catch (error) {
  console.error('❌ webpack är inte installerat');
  process.exit(1);
}

// Kontrollera om Electron är installerat
try {
  const electronVersion = execSync('npx electron --version').toString().trim();
  console.log(`Electron-version: ${electronVersion}`);
  console.log('✅ Electron OK');
} catch (error) {
  console.error('❌ Electron är inte installerat');
  process.exit(1);
}

// Kontrollera om nödvändiga filer finns
const requiredFiles = [
  'webpack.main.config.js',
  'webpack.renderer.config.js',
  'src/main/main.ts',
  'src/renderer/index.tsx'
];

for (const file of requiredFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} finns`);
  } else {
    console.error(`❌ ${file} saknas`);
    process.exit(1);
  }
}

console.log('✅ Alla kontroller godkända! Utvecklingsmiljön är redo.'); 