// client/components/charts/KpiCard.tsx
'use client';

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
};

export function KpiCard({ title, value, subtitle, loading }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-50">
        {loading ? 'Loading…' : value}
      </p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
