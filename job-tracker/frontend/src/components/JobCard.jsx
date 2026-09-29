import { Building2, CalendarDays, ExternalLink, Trash2 } from 'lucide-react';
import { SOURCE_STYLES, DEFAULT_SOURCE_STYLE } from '../lib/constants.js';

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function SourceBadge({ source }) {
  const style = SOURCE_STYLES[source] || DEFAULT_SOURCE_STYLE;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {source}
    </span>
  );
}

export default function JobCard({ application, onDelete, isDragging, onDragStart, onDragEnd }) {
  const { id, role, company, source, appliedAt, url } = application;

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:cursor-grabbing hover:border-indigo-200 hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-slate-900">{role}</h3>
        <button
          onClick={() => onDelete(id)}
          title="Eliminar"
          className="shrink-0 rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-600">
        <Building2 size={14} className="text-slate-400" />
        {company}
      </p>

      <SourceBadge source={source} />

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} />
          {appliedAt ? dateFmt.format(new Date(appliedAt)) : '—'}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800"
          >
            Ver oferta <ExternalLink size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
