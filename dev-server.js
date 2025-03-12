// Enkel Express-server för att serva renderer-filer under utveckling
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3030;

// Aktivera CORS för utveckling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serva statiska filer från .webpack/renderer
const staticDir = path.join(__dirname, '.webpack/renderer');
console.log(`📂 Serverar statiska filer från: ${staticDir}`);

// Kontrollera att katalogen finns
const fs = require('fs');
if (!fs.existsSync(staticDir)) {
  console.error(`❌ Katalogen ${staticDir} existerar inte!`);
  fs.mkdirSync(staticDir, { recursive: true });
  console.log(`✅ Katalogen ${staticDir} har skapats.`);
}

// Lista tillgängliga filer i katalogen
try {
  const files = fs.readdirSync(staticDir);
  console.log('📄 Tillgängliga filer:');
  files.forEach(file => console.log(`  - ${file}`));
} catch (err) {
  console.error('❌ Kunde inte lista filer:', err);
}

app.use(express.static(staticDir));

// Skicka index.html för alla rutter (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`🌐 Skickar ${indexPath}`);
    res.sendFile(indexPath);
  } else {
    console.error(`❌ Filen ${indexPath} existerar inte!`);
    res.status(404).send(`
      <html>
        <head><title>ScreammSSH - Fel</title></head>
        <body>
          <h1>Fel: index.html saknas</h1>
          <p>Den begärda filen ${indexPath} kunde inte hittas.</p>
        </body>
      </html>
    `);
  }
});

// Hantera fel
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).send(`
    <html>
      <head><title>ScreammSSH - Serverfel</title></head>
      <body>
        <h1>Serverfel</h1>
        <p>Något gick fel på servern: ${err.message}</p>
      </body>
    </html>
  `);
});

// Starta servern
const server = app.listen(PORT, () => {
  console.log(`🚀 Utvecklingsserver startad på http://localhost:${PORT}`);
  console.log(`📂 Serverar filer från ${staticDir}`);
});

// Hantera avslut
process.on('SIGINT', () => {
  console.log('👋 Avslutar utvecklingsservern...');
  server.close(() => {
    console.log('Server stängd');
    process.exit(0);
  });
});

// Exportera server för att kunna stänga den från andra skript
module.exports = server; 