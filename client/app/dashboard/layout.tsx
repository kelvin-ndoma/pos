// client/app/dashboard/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const isPos = pathname.startsWith('/dashboard/pos');
  const isPurchases = pathname.startsWith('/dashboard/purchases');
  const isFullWidth = isPos || isPurchases;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('accessToken');
    const user = window.localStorage.getItem('currentUser');

    if (!token || !user) {
      router.replace('/auth/login');
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 text-xs">
        Checking session…
      </main>
    );
  }

  return (
    <main className="h-screen bg-slate-950 text-slate-50 flex overflow-hidden">
      {/* Sidebar - static, no scroll */}
      <Sidebar />

      {/* Main Content Area - flex column with fixed header and scrollable content */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar - static, always visible */}
        {isFullWidth ? (
          <div className="border-b border-slate-800 flex-shrink-0">
            <TopBar
              title={isPos ? 'POS' : 'Purchases'}
              subtitle={
                isPos ? 'Point of sale.' : 'Purchase orders and receipts.'
              }
            />
          </div>
        ) : (
          <div className="px-6 border-b border-slate-800 flex-shrink-0">
            <TopBar
              title="Dashboard"
              subtitle="Overview of your inventory, sales, and reports."
            />
          </div>
        )}

        {/* Content Area - this is the only part that scrolls */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          {isFullWidth ? (
            <div className="h-full w-full">{children}</div>
          ) : (
            <div className="h-full px-6 py-6">
              <div className="mx-auto max-w-6xl space-y-6">{children}</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}