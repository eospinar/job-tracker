# Extensión de Chrome — Job Tracker

Extrae los datos de la oferta de empleo abierta y los envía con `POST` a tu Job Tracker.

| Archivo | Función |
|---|---|
| `manifest.json` | Manifest V3 · permisos `activeTab`, `scripting`, `storage` |
| `content.js` | Se inyecta al abrir el popup y devuelve los datos detectados |
| `popup.html` / `popup.js` / `popup.css` | Formulario editable + botón **Guardar en mi CRM** + configuración |

## Instalar

1. Abre `chrome://extensions` y activa **Modo de desarrollador**.
2. **Cargar extensión sin empaquetar** → selecciona esta carpeta `chrome-extension/`.
3. Fija la extensión en la barra, ábrela y en **Configuración** pega tu **API key**
   (valor de `API_KEY` en `job-tracker/backend/.env`).

La URL de la API por defecto es `https://job-tracker-swart-theta.vercel.app/api/applications`.
Para usar el backend local cámbiala a `http://localhost:4000/api/applications`
(o `http://localhost:3000/...` si tu API corre en ese puerto).

## Cómo detecta los datos

1. **JSON-LD `JobPosting`** (schema.org) — Computrabajo, El Empleo, Lever, Workday y muchas páginas de carreras.
   Tolera JSON malformado (Michael Page publica saltos de línea sin escapar).
2. **Selectores por portal**, verificados en ofertas reales (sept. 2026):

   | Portal | Rol | Empresa |
   |---|---|---|
   | Computrabajo | `h1.box_detail` | `h1 + p.fs16` ("EMPRESA - Ciudad") |
   | El Empleo | `h1`, `.js-offer-title` | `.js-company-name` |
   | Michael Page | `h1.job-apply-job-title` | `.job_advert__job-desc-company` → "Importante compañía nacional (vía Michael Page)", porque el JSON-LD pone a Michael Page como empleador |
   | Lever | `.posting-headline h2` | `og:title` ("Empresa - Rol") |
   | Greenhouse | `.job__title h1`, `h1.section-header` | `<title>` ("Job Application for Rol at Empresa") |
   | Workday | `[data-automation-id="jobPostingHeader"]` | JSON-LD sin el código de entidad ("2100 NVIDIA USA" → "NVIDIA USA") o subdominio |
   | LinkedIn | `.job-details-jobs-unified-top-card__job-title` | `.job-details-jobs-unified-top-card__company-name` (no verificado: requiere sesión) |

3. **Genérico**: `og:title`, `<h1>`, `og:site_name`, `<title>` y el dominio.

La URL se guarda sin `#hash` ni parámetros de rastreo (`utm_*`, `gclid`, `trk`…), así el backend detecta duplicados.

## Payload enviado

```json
{
  "job_title": "Analista de Infraestructura nivel III - sistemas",
  "company_name": "KFC COLOMBIA",
  "application_date": "2026-09-28",
  "source_url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-...",
  "source_platform": "Computrabajo",
  "status": "applied",
  "location": "Bogotá, D.C., Bogotá, D.C.",
  "notes": "Oferta publicada el 2026-09-28."
}
```

Header `x-api-key: <tu clave>`. Respuestas: `201` guardada · `409` ya registrada · `401` API key inválida · `400` datos inválidos.
