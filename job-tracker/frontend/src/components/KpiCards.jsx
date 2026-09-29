import { Briefcase, Loader, XCircle, Users } from 'lucide-react';

export default function KpiCards({ applications }) {
  const count = (...statuses) => applications.filter((a) => statuses.includes(a.status)).length;

  const kpis = [
    { label: 'Total aplicaciones', value: applications.length, icon: Briefcase, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'En proceso', value: count('applied', 'interview'), icon: Loader, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Entrevistas', value: count('interview'), icon: Users, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Rechazadas', value: count('rejected'), icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {kpis.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
