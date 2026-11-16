// client/app/dashboard/tables/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient';

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';

type Table = {
  _id: string;
  name: string;
  area?: string;
  capacity?: number;
  status: TableStatus;
  currentSale?: string | null;
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function statusClasses(status: TableStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300';
    case 'OCCUPIED':
      return 'bg-amber-950/40 border-amber-900/60 text-amber-300';
    case 'RESERVED':
      return 'bg-purple-950/40 border-purple-900/60 text-purple-300';
    case 'BLOCKED':
      return 'bg-slate-900/60 border-slate-700 text-slate-300';
    default:
      return 'bg-slate-900/60 border-slate-700 text-slate-300';
  }
}

function statusIcon(status: TableStatus) {
  switch (status) {
    case 'AVAILABLE':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'OCCUPIED':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'RESERVED':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'BLOCKED':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load tables with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTables();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, areaFilter, statusFilter]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTables();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function loadTables() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '200');
      
      if (areaFilter !== 'ALL') params.set('area', areaFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tables?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load tables');
      }

      const data = (await res.json()) as Paginated<Table>;
      setTables(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      console.error('Failed to load tables', e);
      setError(e?.message || 'Failed to load tables');
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: TableStatus) {
    try {
      setSavingId(id);
      setError(null);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tables/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ status }),
        },
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update table');
      }
      
      // Update local state
      setTables((prev) =>
        prev.map((t) =>
          t._id === id
            ? {
                ...t,
                status: data.status || status,
                currentSale: data.currentSale !== undefined ? data.currentSale : t.currentSale,
              }
            : t,
        ),
      );
    } catch (e: any) {
      console.error('Failed to update table', e);
      setError(e?.message || 'Failed to update table');
    } finally {
      setSavingId(null);
    }
  }

  function handleOpenPos(table: Table) {
    // Only open POS for AVAILABLE tables
    if (table.status !== 'AVAILABLE') {
      setError(`Cannot open POS for a table with status: ${table.status}`);
      return;
    }

    const params = new URLSearchParams();
    params.set('tableId', table._id);
    params.set('tableName', table.name);
    params.set('saleType', 'DINE_IN');
    router.push(`/dashboard/pos?${params.toString()}`);
  }

  function handleViewSale(table: Table) {
    if (table.currentSale) {
      router.push(`/dashboard/pos/receipt/${table.currentSale}`);
    }
  }

  function handleReserveTable(table: Table) {
    // Can only reserve AVAILABLE tables
    if (table.status !== 'AVAILABLE') {
      setError(`Cannot reserve a table with status: ${table.status}`);
      return;
    }

    changeStatus(table._id, 'RESERVED');
  }

  function handleBlockTable(table: Table) {
    // Can block any non-occupied table
    if (table.status === 'OCCUPIED') {
      setError('Cannot block an occupied table. Complete the service first.');
      return;
    }

    changeStatus(table._id, 'BLOCKED');
  }

  function handleMakeAvailable(table: Table) {
    // Can only make available if not occupied
    if (table.status === 'OCCUPIED') {
      setError('Cannot make an occupied table available. Complete the service first.');
      return;
    }

    changeStatus(table._id, 'AVAILABLE');
  }

  function handleCompleteService(table: Table) {
    if (table.currentSale) {
      router.push(`/dashboard/pos/receipt/${table.currentSale}`);
    }
  }

  const areas = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.area) set.add(t.area);
    });
    return Array.from(set).sort();
  }, [tables]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((t) => {
      if (areaFilter !== 'ALL' && t.area !== areaFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.area || '').toLowerCase().includes(q)
      );
    });
  }, [tables, search, areaFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'AVAILABLE').length;
    const occupied = tables.filter(t => t.status === 'OCCUPIED').length;
    const reserved = tables.filter(t => t.status === 'RESERVED').length;
    const blocked = tables.filter(t => t.status === 'BLOCKED').length;
    
    return { total, available, occupied, reserved, blocked };
  }, [tables]);

  return (
    <div className="h-full w-full px-2 sm:px-4 py-4">
      <div className="flex flex-col gap-4 h-full">
        {/* Header with stats */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Floor Layout
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage tables, status, and quickly jump into POS for a table.
            </p>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-xs">
            <div className="bg-slate-900/60 rounded-lg px-2 py-1 text-center">
              <div className="text-emerald-400 font-semibold">{stats.available}</div>
              <div className="text-[8px] sm:text-[10px] text-slate-400">Available</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1 text-center">
              <div className="text-amber-400 font-semibold">{stats.occupied}</div>
              <div className="text-[8px] sm:text-[10px] text-slate-400">Occupied</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1 text-center">
              <div className="text-purple-400 font-semibold">{stats.reserved}</div>
              <div className="text-[8px] sm:text-[10px] text-slate-400">Reserved</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1 text-center">
              <div className="text-slate-400 font-semibold">{stats.blocked}</div>
              <div className="text-[8px] sm:text-[10px] text-slate-400">Blocked</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2 py-1 text-center">
              <div className="text-white font-semibold">{stats.total}</div>
              <div className="text-[8px] sm:text-[10px] text-slate-400">Total</div>
            </div>
          </div>
        </div>

        {/* Filters and actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search by table or area..."
              className="h-9 w-full text-xs sm:text-sm pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <div className="flex gap-2">
            <select
              className="h-9 rounded-md border border-slate-700 bg-slate-900/60 px-2 text-xs sm:text-sm text-slate-200"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="ALL">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-slate-700 bg-slate-900/60 px-2 text-xs sm:text-sm text-slate-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All status</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={loadTables}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </span>
              ) : (
                'Refresh'
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={() => router.push('/dashboard/tables/new')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Table
            </Button>
          </div>
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-400">Auto-refresh every 30s</span>
          </label>
        </div>

        {error && (
          <div className="text-xs sm:text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2 flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tables grid */}
        <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:p-4">
          {loading && !tables.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                <p className="text-xs sm:text-sm text-slate-400">
                  Loading tables…
                </p>
              </div>
            </div>
          ) : !filtered.length ? (
            <div className="text-center py-12">
              <p className="text-xs sm:text-sm text-slate-500">
                {search || areaFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No tables match your filters.'
                  : 'No tables configured yet.'}
              </p>
              {!search && areaFilter === 'ALL' && statusFilter === 'ALL' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/dashboard/tables/new')}
                >
                  Add your first table
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((table) => {
                const inService = !!table.currentSale;
                const isAvailable = table.status === 'AVAILABLE';
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';
                const isBlocked = table.status === 'BLOCKED';

                return (
                  <div
                    key={table._id}
                    className={`rounded-lg border p-3 sm:p-4 flex flex-col gap-2 transition-all ${
                      isAvailable
                        ? 'bg-slate-900/60 hover:border-slate-500 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer'
                        : isOccupied
                        ? 'bg-slate-900 hover:border-amber-500 cursor-pointer'
                        : 'bg-slate-900 cursor-default'
                    }`}
                    onClick={() => {
                      if (isOccupied && table.currentSale) {
                        handleViewSale(table);
                      } else if (isAvailable) {
                        handleOpenPos(table);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(table.status)}
                        <div>
                          <div className="text-sm sm:text-base font-semibold">
                            {table.name}
                          </div>
                          {table.area && (
                            <div className="text-[10px] sm:text-xs text-slate-400">
                              {table.area}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusClasses(
                          table.status,
                        )}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {table.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                      <span>
                        Capacity:{' '}
                        <span className="text-slate-200 font-medium">
                          {table.capacity || '—'}
                        </span>
                      </span>
                      {inService && (
                        <span className="text-amber-300 flex items-center gap-1">
                          <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                          In service
                        </span>
                      )}
                    </div>

                    {/* Action buttons based on status */}
                    <div className="flex flex-col gap-2 mt-1">
                      {/* Primary action button */}
                      {isOccupied && table.currentSale ? (
                        <Button
                          size="sm"
                          className="w-full h-8 text-[11px]"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSale(table);
                          }}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Order
                        </Button>
                      ) : isAvailable ? (
                        <Button
                          size="sm"
                          className="w-full h-8 text-[11px]"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPos(table);
                          }}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Open POS
                        </Button>
                      ) : isReserved ? (
                        <div className="text-[10px] text-purple-400 text-center py-1 bg-purple-950/20 rounded-md">
                          Reserved - Cannot be used
                        </div>
                      ) : isBlocked ? (
                        <div className="text-[10px] text-slate-400 text-center py-1 bg-slate-800/50 rounded-md">
                          Blocked - Out of service
                        </div>
                      ) : null}

                      {/* Status management buttons */}
                      <div className="flex gap-1">
                        {/* Make available button - for reserved/blocked tables */}
                        {(isReserved || isBlocked) && (
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-[9px]"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMakeAvailable(table);
                            }}
                            disabled={savingId === table._id}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Make Available
                          </Button>
                        )}

                        {/* Reserve button - only for available tables */}
                        {isAvailable && (
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-[9px]"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserveTable(table);
                            }}
                            disabled={savingId === table._id}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Reserve
                          </Button>
                        )}

                        {/* Block button - for available/reserved tables */}
                        {(isAvailable || isReserved) && (
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-[9px]"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockTable(table);
                            }}
                            disabled={savingId === table._id}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Block
                          </Button>
                        )}
                      </div>
                    </div>

                    {savingId === table._id && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-center">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                        Updating...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}