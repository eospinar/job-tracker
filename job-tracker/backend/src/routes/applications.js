import { Router } from 'express';
import * as store from '../lib/store.js';
import { validateCreate, validateUpdate } from '../lib/validation.js';

const router = Router();

// Si API_KEY está definida, protege las escrituras (la extensión envía el header x-api-key).
function requireApiKey(req, res, next) {
  const key = process.env.API_KEY;
  if (!key || req.get('x-api-key') === key) return next();
  res.status(401).json({ error: 'API key inválida o ausente' });
}

// GET /api/applications  → lista todas (más recientes primero)
router.get('/', async (_req, res) => {
  res.json(await store.list());
});

// POST /api/applications → recibe la oferta capturada por la extensión de Chrome
router.post('/', requireApiKey, async (req, res) => {
  const { data, errors } = validateCreate(req.body);
  if (errors) return res.status(400).json({ error: 'Datos inválidos', details: errors });

  const existing = await store.findByUrl(data.url);
  if (existing) {
    return res.status(409).json({ error: 'Esta oferta ya está registrada', application: existing });
  }

  const created = await store.create(data);
  res.status(201).location(`/api/applications/${created.id}`).json(created);
});

// PATCH /api/applications/:id → usado por el drag & drop para cambiar el estado
router.patch('/:id', requireApiKey, async (req, res) => {
  const { data, errors } = validateUpdate(req.body);
  if (errors) return res.status(400).json({ error: 'Datos inválidos', details: errors });

  const updated = await store.update(req.params.id, data);
  if (!updated) return res.status(404).json({ error: 'Aplicación no encontrada' });
  res.json(updated);
});

// DELETE /api/applications/:id
router.delete('/:id', requireApiKey, async (req, res) => {
  const ok = await store.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Aplicación no encontrada' });
  res.status(204).end();
});

export default router;
