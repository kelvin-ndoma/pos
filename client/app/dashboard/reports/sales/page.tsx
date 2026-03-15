// client/app/dashboard/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (status && status !== 'ALL') params.set('status', status);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pos/sales?${params.toString()}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

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
    // initial load based on URL
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

  function renderStatusPill(s: PosSaleSummary['status']) {
    const base =
      'text-[10px] px-2 py-0.5 rounded border inline-flex items-center';
    if (s === 'COMPLETED') {
      return (
        <span
          className={`${base} bg-emerald-950/40 text-emerald-400 border-emerald-900/40`}
        >
          COMPLETED
        </span>
      );
    }
    if (s === 'OPEN') {
      return (
        <span
          className={`${base} bg-amber-950/40 text-amber-400 border-amber-900/40`}
        >
          OPEN
        </span>
      );
    }
    return (
      <span
        className={`${base} bg-slate-800 text-slate-300 border-slate-600`}
      >
        VOID
      </span>
    );
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="flex h-full w-full flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">
              Search (reference or ID)
            </label>
            <Input
              className="h-8 w-56 text-xs"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">
              Status
            </label>
            <select
              className="h-8 w-36 rounded-md border border-slate-700 bg-slate-900 text-xs px-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="OPEN">Open</option>
              <option value="VOID">Void</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
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

          <div className="flex flex-col gap-1">
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
              {loading ? 'Loading…' : 'Apply'}
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
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Date
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Total
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Paid
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Balance
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => handleRowClick(sale._id)}
                  >
                    <td className="px-3 py-2">
                      {sale.reference || sale._id.slice(-8)}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(
                        sale.createdAt,
                      ).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {sale.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {sale.paidAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {sale.balance.toFixed(2)}
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
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      No sales found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400">
            <span>
              Showing page {page} of {totalPages} ({total} sales)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-7 px-2 text-[11px]"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const next = page - 1;
                  setPage(next);
                  loadSales(next);
                }}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                className="h-7 px-2 text-[11px]"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadSales(next);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
