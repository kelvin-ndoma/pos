// client/app/dashboard/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient'; // Added import

type PosSaleSummary = {
  _id: string;
  reference?: string;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  status: 'OPEN' | 'COMPLETED' | 'VOID';
  createdAt: string;
};

type PaginatedSales<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OPEN', label: 'Open' },
  { value: 'VOID', label: 'Void' },
];

export default function SalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sales, setSales] = useState<PosSaleSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState<number>(
    Number(searchParams.get('page') || 1),
  );
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(
    searchParams.get('status') || 'ALL',
  );
  const [fromDate, setFromDate] = useState(
    searchParams.get('from') || '',
  );
  const [toDate, setToDate] = useState(searchParams.get('to') || '');

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function syncUrl(nextPage = page) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (status && status !== 'ALL') params.set('status', status);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    router.replace(`/dashboard/sales?${params.toString()}`);
  }

  async function loadSales(currentPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (status && status !== 'ALL') params.set('status', status);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales?${params.toString()}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load sales');
      }

      const data = (await res.json()) as PaginatedSales<PosSaleSummary>;
      setSales(Array.isArray(data.data) ? data.data : []);
      setPage(data.page || currentPage);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      syncUrl(data.page || currentPage);
    } catch (e) {
      console.error('Failed to load sales', e);
      setSales([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters() {
    setPage(1);
    loadSales(1);
  }

  function handleResetFilters() {
    setSearch('');
    setStatus('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
    loadSales(1);
  }

  function handleRowClick(id: string) {
    router.push(`/dashboard/pos/receipt/${id}`);
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderStatusPill(s: PosSaleSummary['status']) {
    const base =
      'text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center font-medium';
    
    const styles = {
      COMPLETED: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40',
      OPEN: 'bg-amber-950/40 text-amber-400 border-amber-900/40',
      VOID: 'bg-slate-800 text-slate-300 border-slate-600',
    };

    return (
      <span className={`${base} ${styles[s]}`}>
        {s}
      </span>
    );
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="flex h-full w-full flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">
            Sales history
          </h1>
          <Button
            className="h-8 text-xs"
            onClick={() => router.push('/dashboard/pos')}
          >
            New sale
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-[11px] text-slate-400">
              Search (reference or ID)
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-[11px] text-slate-400">
              Status
            </label>
            <div className="relative">
              <select
                className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 text-xs px-2 appearance-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-[11px] text-slate-400">
              From date
            </label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-[11px] text-slate-400">
              To date
            </label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              className="h-8 text-xs"
              disabled={loading}
              onClick={handleApplyFilters}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading…
                </span>
              ) : (
                'Apply filters'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleResetFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="overflow-auto max-h-full">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Reference</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">Paid</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(sale._id)}
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {sale.reference || sale._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(sale.paidAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span className={sale.balance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                        {formatCurrency(sale.balance)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {renderStatusPill(sale.status)}
                    </td>
                  </tr>
                ))}

                {!sales.length && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      {search || status !== 'ALL' || fromDate || toDate ? (
                        <div className="flex flex-col items-center gap-1">
                          <span>No sales found for the selected filters.</span>
                          <button
                            onClick={handleResetFilters}
                            className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        'No sales yet. Start by creating a new sale.'
                      )}
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                        <p className="text-xs text-slate-400">Loading sales…</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400">
              <span>
                Showing page {page} of {totalPages} ({total} total sales)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-7 px-2 text-[11px] min-w-[60px]"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const next = page - 1;
                    setPage(next);
                    loadSales(next);
                  }}
                >
                  ← Previous
                </Button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="h-7 px-2 text-[11px] min-w-[60px]"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    loadSales(next);
                  }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}