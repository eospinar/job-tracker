export const STATUSES = ['to_apply', 'applied', 'interview', 'offered', 'rejected'];

export const SOURCES = [
  'Computrabajo',
  'El Empleo',
  'Michael Page',
  'LinkedIn',
  'Indeed',
  'Magneto',
  'Web Corporativa',
  'Otro',
];

const MAX = { role: 200, company: 200, location: 200, salary: 100, notes: 5000 };

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

function normalizeSource(value) {
  const raw = str(value);
  if (!raw) return 'Otro';
  const match = SOURCES.find((s) => s.toLowerCase() === raw.toLowerCase().replace(/[-_]/g, ' '));
  return match || raw.slice(0, 60);
}

/** Deduce el portal a partir del dominio si la extensión no lo envía. */
function sourceFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    if (host.includes('computrabajo')) return 'Computrabajo';
    if (host.includes('elempleo')) return 'El Empleo';
    if (host.includes('michaelpage')) return 'Michael Page';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('indeed')) return 'Indeed';
    if (host.includes('magneto')) return 'Magneto';
    return 'Web Corporativa';
  } catch {
    return 'Otro';
  }
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Valida y normaliza el payload de creación.
 * Acepta alias comunes que suelen enviar los scrapers de la extensión:
 *   title/position → role, company_name → company, link/jobUrl → url, date → appliedAt
 */
export function validateCreate(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo debe ser un objeto JSON'] };
  }

  const role = str(body.role ?? body.title ?? body.position);
  const company = str(body.company ?? body.companyName ?? body.company_name);
  const url = str(body.url ?? body.link ?? body.jobUrl);
  const status = str(body.status) || 'applied';
  const appliedAt = toIsoDate(body.appliedAt ?? body.applied_at ?? body.date);

  if (!role) errors.push('"role" es obligatorio');
  if (!company) errors.push('"company" es obligatorio');
  if (url && !isHttpUrl(url)) errors.push('"url" debe ser una URL http(s) válida');
  if (!STATUSES.includes(status)) errors.push(`"status" debe ser uno de: ${STATUSES.join(', ')}`);
  if (!appliedAt) errors.push('"appliedAt" no es una fecha válida');

  const data = {
    role: role.slice(0, MAX.role),
    company: company.slice(0, MAX.company),
    source: body.source ? normalizeSource(body.source) : url ? sourceFromUrl(url) : 'Otro',
    url: url || null,
    status,
    appliedAt,
    location: str(body.location).slice(0, MAX.location) || null,
    salary: str(body.salary).slice(0, MAX.salary) || null,
    notes: str(body.notes).slice(0, MAX.notes) || null,
  };

  return errors.length ? { errors } : { data };
}

/** Valida una actualización parcial (p. ej. mover la tarjeta de columna). */
export function validateUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo debe ser un objeto JSON'] };
  }
  const errors = [];
  const data = {};

  if ('status' in body) {
    if (!STATUSES.includes(body.status)) errors.push(`"status" debe ser uno de: ${STATUSES.join(', ')}`);
    else data.status = body.status;
  }
  for (const key of ['role', 'company', 'location', 'salary', 'notes']) {
    if (key in body) data[key] = str(body[key]).slice(0, MAX[key]) || null;
  }
  if ((('role' in data) && !data.role) || (('company' in data) && !data.company)) {
    errors.push('"role" y "company" no pueden quedar vacíos');
  }
  if ('source' in body) data.source = normalizeSource(body.source);
  if ('url' in body) {
    const url = str(body.url);
    if (url && !isHttpUrl(url)) errors.push('"url" debe ser una URL http(s) válida');
    else data.url = url || null;
  }
  if ('appliedAt' in body) {
    const d = toIsoDate(body.appliedAt);
    if (!d) errors.push('"appliedAt" no es una fecha válida');
    else data.appliedAt = d;
  }

  if (!errors.length && !Object.keys(data).length) errors.push('No hay campos para actualizar');
  return errors.length ? { errors } : { data };
}
