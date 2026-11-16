// client/app/dashboard/platform/layout.tsx
import type { ReactNode } from 'react';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="border-b border-slate-800 pb-2">
        <h1 className="text-lg font-semibold tracking-tight">Platform</h1>
        <p className="text-xs text-slate-400">
          Platform-wide management tools.
        </p>
      </header>
      {children}
    </div>
  );
}
