/**
 * Extractor de ofertas de empleo. El popup lo inyecta en la pestaña activa con
 * chrome.scripting.executeScript y recibe como resultado el objeto que devuelve esta IIFE.
 *
 * Orden de prioridad para cada campo:
 *   1. Datos estructurados schema.org JobPosting (JSON-LD): Computrabajo, El Empleo, Lever, Workday…
 *   2. Selectores específicos del portal.
 *   3. Genérico: meta tags Open Graph, <h1> y <title>.
 */
(() => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  const decodeEntities = (s) => {
    const el = document.createElement('textarea');
    el.innerHTML = s || '';
    return clean(el.value);
  };

  const text = (...selectors) => {
    for (const sel of selectors) {
      const value = clean(document.querySelector(sel)?.textContent);
      if (value) return value;
    }
    return '';
  };

  const meta = (name) =>
    clean(document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content);

  const pad = (n) => String(n).padStart(2, '0');

  // Fecha local (no UTC) para que en Colombia no salte al día siguiente en la noche.
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Acepta "2026-9-26", "2026-09-26T10:00:00Z", etc.
  const toIsoDate = (value) => {
    const m = String(value || '').match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : '';
  };

  // ── 1. JSON-LD ────────────────────────────────────────────────────────────
  function findJobPosting() {
    const nodes = [];
    const collect = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(collect);
      nodes.push(node);
      if (node['@graph']) collect(node['@graph']);
    };

    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        // Algunos portales (p. ej. Michael Page) publican JSON con saltos de línea sin escapar.
        collect(JSON.parse(script.textContent.replace(/[\u0000-\u001F]+/g, ' ')));
      } catch {
        /* bloque JSON-LD inválido: se ignora */
      }
    }
    return nodes.find((n) => [].concat(n['@type']).includes('JobPosting')) || null;
  }

  // ── 2. Portales ───────────────────────────────────────────────────────────
  const PLATFORMS = [
    { name: 'Computrabajo', match: /(^|\.)computrabajo\./ },
    { name: 'El Empleo', match: /(^|\.)elempleo\.com$/ },
    { name: 'Michael Page', match: /(^|\.)michaelpage\./ },
    { name: 'LinkedIn', match: /(^|\.)linkedin\.com$/ },
    { name: 'Indeed', match: /(^|\.)indeed\./ },
    { name: 'Magneto', match: /(^|\.)magneto365\.com$/ },
    { name: 'Lever', match: /(^|\.)lever\.co$/ },
    { name: 'Greenhouse', match: /(^|\.)greenhouse\.io$/ },
    { name: 'Workday', match: /(^|\.)(myworkdayjobs|workday)\.com$/ },
  ];

  /**
   * title()/company(): se usan si el JSON-LD no trae el dato.
   * companyOverride(): reemplaza incluso al JSON-LD (cuando éste trae un dato engañoso).
   */
  const EXTRACTORS = {
    Computrabajo: {
      title: () => text('h1.box_detail', 'h1'),
      // <p class="fs16">EMPRESA - Ciudad, Departamento</p> justo debajo del título
      company: () => text('h1 + p.fs16').split(' - ')[0],
    },
    'El Empleo': {
      title: () => text('h1', '.js-offer-title'),
      company: () => text('.js-company-name'),
    },
    'Michael Page': {
      title: () => text('h1.job-apply-job-title', 'h1'),
      // El JSON-LD pone "Michael Page" como empleador; el cliente real es confidencial
      // y sólo se describe (p. ej. "Importante compañía nacional.").
      companyOverride: () => {
        const desc = text('.job_advert__job-desc-company').replace(/\.$/, '');
        return desc && desc.length <= 80 ? `${desc} (vía Michael Page)` : 'Confidencial (vía Michael Page)';
      },
    },
    LinkedIn: {
      title: () =>
        text('.job-details-jobs-unified-top-card__job-title', '.top-card-layout__title', 'h1'),
      company: () =>
        text(
          '.job-details-jobs-unified-top-card__company-name',
          '.topcard__org-name-link',
          '.top-card-layout__second-subline a',
        ),
    },
    Lever: {
      title: () => text('.posting-headline h2'),
      // <title>Empresa - Rol</title>
      company: () =>
        meta('og:title').split(' - ')[0] ||
        clean(document.querySelector('.main-header-logo img')?.alt).replace(/\s+logo$/i, ''),
    },
    Greenhouse: {
      title: () => text('.job__title h1', 'h1.app-title', 'h1.section-header', 'h1'),
      // <title>Job Application for Rol at Empresa</title>
      company: () =>
        document.title.match(/^Job Application for .+\bat\s+(.+)$/)?.[1]?.trim() ||
        text('.company-name').replace(/^at\s+/i, '') ||
        clean(document.querySelector('img[alt$="Logo" i]')?.alt).replace(/\s+logo$/i, ''),
    },
    Workday: {
      title: () => text('[data-automation-id="jobPostingHeader"]', 'h2', 'h1'),
      // Sin JSON-LD, el subdominio suele ser la empresa (nvidia.wd5.myworkdayjobs.com)
      company: () => {
        const sub = location.hostname.split('.')[0];
        return sub.charAt(0).toUpperCase() + sub.slice(1);
      },
    },
  };

  // ── 3. Genérico ───────────────────────────────────────────────────────────
  // "Rol | Portal" / "Rol - Portal" → "Rol"
  const stripSiteSuffix = (s) => clean(s).replace(/\s+[|–—]\s+[^|–—]+$/, '');

  function genericCompany() {
    const siteName = meta('og:site_name');
    if (siteName) return siteName;
    const parts = location.hostname.replace(/^(www|jobs|careers|empleos|trabajos?)\./, '').split('.');
    const base = parts[0] || '';
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  function cleanUrl() {
    const url = new URL(location.href);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|gclid|fbclid|trk|refId|trackingId)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  }

  // ── Ensamblado ────────────────────────────────────────────────────────────
  const platform = PLATFORMS.find((p) => p.match.test(location.hostname))?.name || 'Web Corporativa';
  const site = EXTRACTORS[platform] || {};
  const ld = findJobPosting();

  const ldCompany = decodeEntities(
    typeof ld?.hiringOrganization === 'string' ? ld.hiringOrganization : ld?.hiringOrganization?.name,
  ).replace(/^\d+\s+/, ''); // Workday antepone el código de entidad legal: "2100 NVIDIA USA"

  const job_title =
    decodeEntities(ld?.title) ||
    site.title?.() ||
    stripSiteSuffix(meta('og:title')) ||
    text('h1') ||
    stripSiteSuffix(document.title);

  const company_name = site.companyOverride?.() || ldCompany || site.company?.() || genericCompany();

  const address = [].concat(ld?.jobLocation || [])[0]?.address;
  const location_ = clean(
    [address?.addressLocality, address?.addressRegion].filter(Boolean).join(', '),
  );

  return {
    job_title: clean(job_title),
    company_name: clean(company_name),
    application_date: today(),
    posted_date: toIsoDate(ld?.datePosted),
    source_url: cleanUrl(),
    source_platform: platform,
    location: location_,
    detected_with: ld ? 'JSON-LD' : EXTRACTORS[platform] ? 'selectores' : 'meta tags',
  };
})();
