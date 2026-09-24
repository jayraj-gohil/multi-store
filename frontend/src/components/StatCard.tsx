import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'violet';
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
};

/** Small metric tile used at the top of admin list pages — always backed by real, loaded data. */
export function StatCard({ label, value, sub, icon, tone = 'slate' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`flex size-7 items-center justify-center rounded-lg ${toneClasses[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
        {sub && <span className="ml-1.5 text-sm font-medium text-slate-400">{sub}</span>}
      </p>
    </div>
  );
}
