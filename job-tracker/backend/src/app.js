import express from 'express';
import cors from 'cors';
import applicationsRouter from './routes/applications.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors((req, callback) => {
    const origin = req.get('origin');
    // Sin origin = curl/Postman; mismo host = el frontend desplegado junto a la API;
    // chrome-extension:// = la extensión que captura ofertas.
    const allowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      origin === `https://${req.get('host')}` ||
      origin.startsWith('chrome-extension://');
    if (allowed) return callback(null, { origin: true });
    callback(Object.assign(new Error(`Origen no permitido: ${origin}`), { status: 403 }));
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/applications', applicationsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador central de errores (JSON malformado, CORS, errores inesperados).
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Error interno del servidor' : err.message });
});

export default app;
