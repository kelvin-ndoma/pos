// client/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/charts/KpiCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type DashboardSummary = {
  stockValue: number;
  todaySales: number;
  lowStockCount: number;
};

function formatCurrency(val: number) {
  if (!Number.isFinite(val)) return '0';
  return val.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>({
    stockValue: 0,
    todaySales: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  async function loadSummary() {
    setLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/summary`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load dashboard summary');
      }

      setSummary({
        stockValue: data.stockValue ?? 0,
        todaySales: data.todaySales ?? 0,
        lowStockCount: data.lowStockCount ?? 0,
      });
    } catch (e) {
      console.error('Failed to load dashboard summary', e);
      setSummary({ stockValue: 0, todaySales: 0, lowStockCount: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const stockValueLabel = loading
    ? 'Loading…'
    : `KSh ${formatCurrency(summary.stockValue)}`;
  const todaySalesLabel = loading
    ? 'Loading…'
    : `KSh ${formatCurrency(summary.todaySales)}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Stock value"
          value={stockValueLabel}
          subtitle="All locations"
        />
        <KpiCard
          title="Today’s sales"
          value={todaySalesLabel}
          subtitle="Last 24 hours"
        />
        <KpiCard
          title="Low stock items"
          value={loading ? '...' : summary.lowStockCount}
          subtitle="< reorder level"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-200 mb-2">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/dashboard/inventory/new">
              <Button size="sm">Add product</Button>
            </Link>
            <Link href="/dashboard/purchases/new">
              <Button size="sm" variant="outline">
                New purchase
              </Button>
            </Link>
            <Link href="/dashboard/suppliers/new">
              <Button size="sm" variant="outline">
                Add supplier
              </Button>
            </Link>
            <Link href="/dashboard/pos">
              <Button size="sm" variant="ghost">
                Open POS
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300">
          <p className="font-semibold mb-2">What’s next</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Import or add your products in Inventory.</li>
            <li>Create suppliers so you can record purchases.</li>
            <li>Record a test purchase and mark it as received.</li>
            <li>Create a test sale from the POS to verify the flow.</li>
            <li>Check Sales and Reports to confirm data is flowing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
