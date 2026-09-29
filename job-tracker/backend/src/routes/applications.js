import { Router } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import * as store from '../lib/store.js';
import { validateCreate, validateUpdate } from '../lib/validation.js';

const router = Router();

const sha256 = (s) => createHash('sha256').update(s).digest();

// Todas las rutas exigen el header x-api-key cuando API_KEY está definida.
// En Vercel es obligatoria: sin ella la API se niega a responder (falla cerrada).
function requireApiKey(req, res, next) {
  const key = process.env.API_KEY;
  if (!key) {
    if (process.env.VERCEL) return res.status(500).json({ error: 'API_KEY no está configurada en el servidor' });
    return next();
  }
  const sent = req.get('x-api-key') || '';
  if (timingSafeEqual(sha256(sent), sha256(key))) return next();
  res.status(401).json({ error: 'API key inválida o ausente' });
}

router.use(requireApiKey);

// GET /api/applications  → lista todas (más recientes primero)
router.get('/', async (_req, res) => {
  res.json(await store.list());
});

// POST /api/applications → recibe la oferta capturada por la extensión de Chrome
router.post('/', async (req, res) => {
  const { data, errors } = validateCreate(req.body);
  if (errors) return res.status(400).json({ error: 'Datos inválidos', details: errors });

  const { record, duplicate } = await store.create(data);
  if (duplicate) {
    return res.status(409).json({ error: 'Esta oferta ya está registrada', application: duplicate });
  }
  res.status(201).location(`/api/applications/${record.id}`).json(record);
});

// PATCH /api/applications/:id → usado por el drag & drop para cambiar el estado
router.patch('/:id', async (req, res) => {
  const { data, errors } = validateUpdate(req.body);
  if (errors) return res.status(400).json({ error: 'Datos inválidos', details: errors });

  const updated = await store.update(req.params.id, data);
  if (!updated) return res.status(404).json({ error: 'Aplicación no encontrada' });
  res.json(updated);
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  const ok = await store.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Aplicación no encontrada' });
  res.status(204).end();
});

export default router;
