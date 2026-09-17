import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './backend/src/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, serve compiled static Vite frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('ResQAI Emergency Command Center is starting...');
    }
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ResQAI Engine] Emergency Operations Command Center online on port ${PORT}`);
});
