// client/components/layout/Topbar.tsx
'use client';

type TopBarProps = {
  title: string;
  subtitle?: string;
};

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      {/* Left: title/subtitle */}
      <div className="flex flex-col px-4">
        <h1 className="text-sm font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: user / misc */}
      <div className="flex items-center gap-3 px-4 text-[11px] text-slate-400">
        <span>Signed in as</span>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] border border-slate-700">
          Owner
        </span>
      </div>
    </header>
  );
}
