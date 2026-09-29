import { useState } from 'react';
import { KeyRound } from 'lucide-react';

export default function ApiKeyPrompt({ onSubmit }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setBusy(true);
    await onSubmit(key);
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <KeyRound size={22} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Job Tracker</h1>
          <p className="text-sm text-slate-500">Ingresa tu API key para acceder a tus aplicaciones.</p>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="API key"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
