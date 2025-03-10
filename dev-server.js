// Enkel Express-server för att serva renderer-filer under utveckling
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3030;

// Serva statiska filer från .webpack/renderer
app.use(express.static(path.join(__dirname, '.webpack/renderer')));

// Skicka index.html för alla rutter (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '.webpack/renderer/index.html'));
});

// Hantera fel
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Något gick fel på servern');
});

// Starta servern
const server = app.listen(PORT, () => {
  console.log(`🚀 Utvecklingsserver startad på http://localhost:${PORT}`);
  console.log(`📂 Serverar filer från ${path.join(__dirname, '.webpack/renderer')}`);
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