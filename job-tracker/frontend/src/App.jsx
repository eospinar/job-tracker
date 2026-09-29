import { useState } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import KpiCards from './components/KpiCards.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import NewApplicationDialog from './components/NewApplicationDialog.jsx';
import { useApplications } from './hooks/useApplications.js';

export default function App() {
  const [view, setView] = useState('jobs');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { applications, loading, error, setError, moveApplication, addApplication, deleteApplication } =
    useApplications();

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta aplicación?')) return;
    try {
      await deleteApplication(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const showBoard = view === 'dashboard' || view === 'jobs';

  return (
    <div className="flex h-screen">
      <Sidebar active={view} onNavigate={setView} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Mis aplicaciones</h1>
              <p className="text-sm text-slate-500">Arrastra las tarjetas para actualizar su estado</p>
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus size={18} /> Nueva aplicación
            </button>
          </header>

          {error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
              <button onClick={() => setError(null)} className="font-medium underline">Cerrar</button>
            </div>
          )}

          {showBoard ? (
            <>
              <KpiCards applications={applications} />
              {loading ? (
                <p className="py-20 text-center text-slate-400">Cargando…</p>
              ) : (
                <KanbanBoard applications={applications} onMove={moveApplication} onDelete={handleDelete} />
              )}
            </>
          ) : (
            <div className="grid h-96 place-items-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
              Sección en construcción
            </div>
          )}
        </div>
      </main>

      <NewApplicationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={addApplication} />
    </div>
  );
}
