export const COLUMNS = [
  { id: 'to_apply', title: 'Por Aplicar', accent: 'bg-slate-400' },
  { id: 'applied', title: 'Aplicado', subtitle: 'In Progress', accent: 'bg-blue-500' },
  { id: 'interview', title: 'Entrevista', accent: 'bg-amber-500' },
  { id: 'offered', title: 'Ofertado', subtitle: 'Completed', accent: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rechazado', accent: 'bg-rose-500' },
];

// Colores de badge por portal/fuente
export const SOURCE_STYLES = {
  Computrabajo: 'bg-orange-100 text-orange-700 ring-orange-200',
  'El Empleo': 'bg-sky-100 text-sky-700 ring-sky-200',
  'Michael Page': 'bg-violet-100 text-violet-700 ring-violet-200',
  LinkedIn: 'bg-blue-100 text-blue-700 ring-blue-200',
  Indeed: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  Magneto: 'bg-pink-100 text-pink-700 ring-pink-200',
  'Web Corporativa': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};
export const DEFAULT_SOURCE_STYLE = 'bg-slate-100 text-slate-600 ring-slate-200';

export const SOURCES = [...Object.keys(SOURCE_STYLES), 'Otro'];
