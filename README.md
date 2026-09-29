# Job Application Tracker

Tablero tipo CRM/Kanban para seguir aplicaciones de empleo, con una API REST que recibe las ofertas capturadas por una extensión de Chrome.

```
job-tracker/
├── backend/                  Node.js + Express
│   └── src/
│       ├── server.js         App, CORS (permite chrome-extension://), manejo de errores
│       ├── routes/applications.js   GET · POST · PATCH · DELETE /api/applications
│       └── lib/
│           ├── validation.js Validación + normalización del payload
│           └── store.js      Persistencia en data/applications.json (cambiable por Supabase)
└── frontend/                 React 19 + Vite + Tailwind v4
    └── src/
        ├── App.jsx
        ├── hooks/useApplications.js   Estado + movimientos optimistas
        └── components/
            ├── Sidebar.jsx  KpiCards.jsx  KanbanBoard.jsx  JobCard.jsx
            └── NewApplicationDialog.jsx
```

## Ejecutar

```bash
cd job-tracker/backend && npm install && npm run dev      # http://localhost:4000
cd job-tracker/frontend && npm install && npm run dev     # http://localhost:5173
```

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/applications` | Lista todas |
| POST | `/api/applications` | Crea (usado por la extensión) → `201`, `400` inválido, `409` URL duplicada |
| PATCH | `/api/applications/:id` | Actualiza campos (el drag & drop envía `{ "status": "interview" }`) |
| DELETE | `/api/applications/:id` | Elimina → `204` |

### Payload del `POST`

```json
{
  "role": "Coordinador de Infraestructura TI",
  "company": "Bancolombia",
  "source": "Computrabajo",
  "url": "https://www.computrabajo.com.co/ofertas-de-trabajo/oferta-123",
  "appliedAt": "2026-09-20",
  "status": "applied",
  "location": "Medellín",
  "salary": "$12.000.000",
  "notes": "Referido por…"
}
```

- Obligatorios: `role`, `company`.
- Acepta alias: `title`/`position` → `role`, `link`/`jobUrl` → `url`, `date` → `appliedAt`.
- Si no se envía `source`, se deduce del dominio de `url` (computrabajo, elempleo, michaelpage, linkedin…; otro dominio = "Web Corporativa").
- `status` ∈ `to_apply | applied | interview | offered | rejected` (por defecto `applied`).

### Desde la extensión de Chrome

`manifest.json` (MV3):

```json
{ "host_permissions": ["http://localhost:4000/*"] }
```

```js
async function saveJob(job) {
  const res = await fetch('http://localhost:4000/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' /*, 'x-api-key': '...' */ },
    body: JSON.stringify(job),
  });
  const body = await res.json();
  if (res.status === 409) return { duplicate: true, application: body.application };
  if (!res.ok) throw new Error(body.details?.join(', ') || body.error);
  return body;
}
```

Si defines `API_KEY` en `job-tracker/backend/.env`, las escrituras exigen el header `x-api-key`.

## Cambiar a Supabase

Reemplaza `job-tracker/backend/src/lib/store.js` manteniendo las mismas funciones (`list`, `findByUrl`, `create`, `update`, `remove`) usando `@supabase/supabase-js`.
