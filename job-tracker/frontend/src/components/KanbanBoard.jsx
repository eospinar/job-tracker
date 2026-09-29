import { useState } from 'react';
import { COLUMNS } from '../lib/constants.js';
import JobCard from './JobCard.jsx';

/**
 * Tablero Kanban con drag & drop nativo HTML5 (sin dependencias).
 * onMove(id, newStatus) se encarga de la actualización optimista + PATCH.
 */
export default function KanbanBoard({ applications, onMove, onDelete }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) onMove(id, status);
    handleDragEnd();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = applications.filter((a) => a.status === col.id);
        const isOver = overColumn === col.id;

        return (
          <section
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overColumn !== col.id) setOverColumn(col.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null);
            }}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
              isOver ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-200 bg-slate-100/60'
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                <h2 className="text-sm font-semibold text-slate-800">{col.title}</h2>
                {col.subtitle && <span className="text-xs text-slate-400">({col.subtitle})</span>}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-slate-200">
                {items.length}
              </span>
            </header>

            <div className="flex min-h-32 flex-1 flex-col gap-3">
              {items.map((app) => (
                <JobCard
                  key={app.id}
                  application={app}
                  isDragging={draggingId === app.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDelete={onDelete}
                />
              ))}
              {items.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Arrastra tarjetas aquí
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
