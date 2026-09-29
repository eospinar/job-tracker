import { useState } from 'react';
import { X } from 'lucide-react';
import { COLUMNS, SOURCES } from '../lib/constants.js';

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { role: '', company: '', source: 'Computrabajo', url: '', appliedAt: today(), status: 'applied' };

export default function NewApplicationDialog({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(form);
      setForm({ ...EMPTY, appliedAt: today() });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nueva aplicación</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <input className={input} placeholder="Cargo / Rol *" required value={form.role} onChange={set('role')} />
        <input className={input} placeholder="Empresa *" required value={form.company} onChange={set('company')} />
        <input className={input} placeholder="Enlace a la oferta (https://…)" type="url" value={form.url} onChange={set('url')} />

        <div className="grid grid-cols-2 gap-3">
          <select className={input} value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className={input} type="date" value={form.appliedAt} onChange={set('appliedAt')} />
        </div>

        <select className={input} value={form.status} onChange={set('status')}>
          {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
