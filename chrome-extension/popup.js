const DEFAULT_API_URL = 'https://job-tracker-swart-theta.vercel.app/api/applications';

const $ = (id) => document.getElementById(id);
const FIELDS = ['job_title', 'company_name', 'source_platform', 'application_date', 'source_url', 'status', 'location'];

let postedDate = '';

// ── Configuración (chrome.storage.local: no se sincroniza entre equipos) ──────────
async function getSettings() {
  const { apiUrl, apiKey } = await chrome.storage.local.get(['apiUrl', 'apiKey']);
  return { apiUrl: apiUrl || DEFAULT_API_URL, apiKey: apiKey || '' };
}

async function loadSettingsForm() {
  const { apiUrl, apiKey } = await getSettings();
  $('apiUrl').value = apiUrl;
  $('apiKey').value = apiKey;
  // Primera vez sin API key: abre la sección de configuración.
  if (!apiKey) $('settings').open = true;
}

$('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = $('apiUrl').value.trim();
  const apiKey = $('apiKey').value.trim();

  // Para APIs propias sin CORS hacia la extensión, pide permiso de host (requiere gesto del usuario).
  // Se llama antes de cualquier await para no perder el gesto; si ya está concedido no muestra diálogo.
  const origin = `${new URL(apiUrl).origin}/*`;
  const granted = await chrome.permissions.request({ origins: [origin] }).catch(() => false);

  await chrome.storage.local.set({ apiUrl, apiKey });
  const msg = $('settingsMsg');
  msg.hidden = false;
  msg.textContent = granted
    ? 'Configuración guardada.'
    : 'Guardada. Sin permiso para ese dominio: funcionará sólo si la API permite CORS.';
});

// ── Extracción desde la pestaña activa ──────────────────────────────────────────
async function detectJob() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('source_url').value = tab?.url?.startsWith('http') ? tab.url : '';
  $('application_date').value = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

  if (!tab?.id || !/^https?:/.test(tab.url || '')) {
    $('detected').textContent = 'Esta página no se puede analizar; completa los datos a mano.';
    return;
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    fillForm(result);
  } catch (err) {
    $('detected').textContent = 'No se pudo leer la página; completa los datos a mano.';
    console.error(err);
  }
}

function fillForm(data) {
  if (!data) return;
  for (const field of FIELDS) {
    if (data[field]) $(field).value = data[field];
  }
  postedDate = data.posted_date || '';

  $('platformBadge').textContent = data.source_platform;
  $('platformBadge').hidden = !data.source_platform;

  const found = data.job_title && data.company_name;
  $('detected').textContent = found
    ? `Datos detectados (${data.detected_with}). Revísalos antes de guardar.`
    : 'No se detectaron todos los datos; complétalos a mano.';

  if (postedDate) {
    $('posted').hidden = false;
    $('posted').textContent = `Oferta publicada el ${postedDate}.`;
  }
}

// ── Envío a la API ──────────────────────────────────────────────────────────────
function showMessage(kind, html) {
  const box = $('message');
  box.className = `message ${kind}`;
  box.innerHTML = html;
  box.hidden = false;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

$('jobForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { apiUrl, apiKey } = await getSettings();

  const payload = Object.fromEntries(FIELDS.map((f) => [f, $(f).value.trim()]));
  if (!payload.source_url) delete payload.source_url;
  if (postedDate) payload.notes = `Oferta publicada el ${postedDate}.`;

  const btn = $('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey && { 'x-api-key': apiKey }) },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    const boardUrl = new URL(apiUrl).origin;
    const boardLink = `<a href="${boardUrl}" target="_blank">Ver tablero</a>`;

    if (res.status === 201) {
      showMessage('ok', `✓ Guardada en tu CRM. ${boardLink}`);
      btn.textContent = 'Guardada';
      return; // deja el botón deshabilitado para evitar duplicados
    }
    if (res.status === 409) {
      showMessage('warn', `Esta oferta ya estaba registrada. ${boardLink}`);
    } else if (res.status === 401) {
      $('settings').open = true;
      showMessage('err', 'API key inválida o ausente. Revísala en Configuración.');
    } else {
      const detail = body.details?.join(', ') || body.error || `Error ${res.status}`;
      showMessage('err', escapeHtml(detail));
    }
  } catch (err) {
    showMessage('err', `No se pudo conectar con la API (${escapeHtml(apiUrl)}). ${escapeHtml(err.message)}`);
  }
  btn.disabled = false;
  btn.textContent = 'Guardar en mi CRM';
});

loadSettingsForm();
detectJob();
