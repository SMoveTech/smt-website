// S-Move Technologies Ltd — corporate website
// Minimal Express static server, deployed on Railway at smt.s-move.co.uk
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sensible security headers for a static marketing site
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Health check for Railway
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Static assets (1 hour cache; HTML revalidates)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

// 404 -> friendly page (falls back to home)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`S-Move Technologies site listening on port ${PORT}`);
});
