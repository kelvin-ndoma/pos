// client/app/dashboard/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/Topbar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPos = pathname.startsWith('/dashboard/pos');
  const isPurchases = pathname.startsWith('/dashboard/purchases');

  const isFullWidth = isPos || isPurchases;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex">
      <Sidebar />

      <section className="flex-1 flex flex-col">
        {isFullWidth ? (
          // POS & Purchases: TopBar without extra horizontal padding
          <div className="border-b border-slate-800">
            <TopBar
              title={isPos ? 'POS' : 'Purchases'}
              subtitle={isPos ? 'Point of sale.' : 'Purchase orders and receipts.'}
            />
          </div>
        ) : (
          // Other pages: original TopBar wrapper with padding
          <div className="px-6 border-b border-slate-800">
            <TopBar
              title="Dashboard"
              subtitle="Overview of your inventory, sales, and reports."
            />
          </div>
        )}

        <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          {isFullWidth ? (
            // POS & Purchases: let the page use full width
            <div className="h-full w-full">{children}</div>
          ) : (
            // Other pages: centered max-width container
            <div className="h-full px-6 py-6">
              <div className="mx-auto max-w-6xl space-y-6">
                {children}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
