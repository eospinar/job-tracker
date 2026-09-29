import { LayoutDashboard, Briefcase, CalendarDays, Settings } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Aplicaciones', icon: Briefcase },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-white py-5 lg:w-60 lg:items-stretch lg:px-4">
      <div className="mb-6 flex items-center gap-2 lg:px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 font-bold text-white">JT</div>
        <span className="hidden text-lg font-semibold text-slate-900 lg:block">Job Tracker</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
