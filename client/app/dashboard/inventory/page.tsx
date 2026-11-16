'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/Table';
import { authHeaders } from '@/lib/apiClient'; // Added import

type Product = {
  _id: string;
  name: string;
  sku?: string;
  category?: { name: string };
  costPrice?: number;
  salePrice?: number;
  quantityOnHand?: number;
  isActive?: boolean;
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(pageNum = 1, searchText = '') {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '20');
      if (searchText) params.set('search', searchText);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load products');
      }

      const data = await res.json();
      const paginated = data as Paginated<Product>;

      setItems(Array.isArray(paginated.data) ? paginated.data : []);
      setPage(paginated.page || pageNum);
      setTotal(paginated.total || 0);
      setTotalPages(paginated.totalPages || 1);
    } catch (e) {
      console.error('Failed to load products', e);
      setError('Failed to load products');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, '');
  }, []);

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`,
        {
          method: 'DELETE',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete product');
      }

      // Optimistically remove from list
      setItems((prev) => prev.filter((p) => p._id !== id));
      setTotal(prev => prev - 1);
    } catch (e) {
      console.error('Failed to delete product', e);
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to delete product',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleRowClick(id: string) {
    router.push(`/dashboard/inventory/${id}`);
  }

  function handlePageChange(newPage: number) {
    load(newPage, search);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    load(1, value);
  }

  function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inventory</h2>
          <p className="text-xs text-slate-400">Manage your products and stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search products..."
              className="h-8 w-48 text-xs pl-7"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <svg className="absolute left-2 top-2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link href="/dashboard/inventory/new">
            <Button size="sm" className="h-8">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add product
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Stats summary */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 uppercase">Total Products</p>
            <p className="text-lg font-semibold text-white">{total}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 uppercase">Low Stock Items</p>
            <p className="text-lg font-semibold text-amber-400">
              {items.filter(p => p.quantityOnHand !== undefined && p.quantityOnHand < 10).length}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 uppercase">Total Value</p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatCurrency(items.reduce((sum, p) => sum + (p.costPrice || 0) * (p.quantityOnHand || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
              <p className="text-sm text-slate-400">Loading products…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <Thead>
                  <Tr>
                    <Th className="w-1/4">Name</Th>
                    <Th className="w-1/6">SKU</Th>
                    <Th className="w-1/6">Category</Th>
                    <Th className="w-1/6 text-right">Sale price</Th>
                    <Th className="w-1/6 text-right">Stock</Th>
                    <Th className="w-1/6 text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((p) => {
                    const isLowStock = p.quantityOnHand !== undefined && p.quantityOnHand < 10;
                    
                    return (
                      <Tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                        <Td
                          onClick={() => handleRowClick(p._id)}
                          className="cursor-pointer font-medium"
                        >
                          {p.name}
                        </Td>
                        <Td
                          onClick={() => handleRowClick(p._id)}
                          className="cursor-pointer font-mono text-xs text-slate-400"
                        >
                          {p.sku || '—'}
                        </Td>
                        <Td
                          onClick={() => handleRowClick(p._id)}
                          className="cursor-pointer"
                        >
                          {p.category?.name || <span className="text-slate-500">—</span>}
                        </Td>
                        <Td
                          className="text-right cursor-pointer font-mono"
                          onClick={() => handleRowClick(p._id)}
                        >
                          {p.salePrice != null ? formatCurrency(p.salePrice) : '—'}
                        </Td>
                        <Td
                          className={`text-right cursor-pointer font-mono ${
                            isLowStock ? 'text-amber-400 font-medium' : ''
                          }`}
                          onClick={() => handleRowClick(p._id)}
                        >
                          <span className="flex items-center justify-end gap-1">
                            {p.quantityOnHand != null ? p.quantityOnHand : 0}
                            {isLowStock && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-amber-950/40 text-amber-400 border border-amber-900/40">
                                Low
                              </span>
                            )}
                          </span>
                        </Td>
                        <Td className="text-right">
                          <button
                            type="button"
                            className="text-[10px] text-rose-400 hover:text-rose-300 disabled:opacity-50 transition-colors px-2 py-1 rounded hover:bg-rose-950/20"
                            onClick={() => handleDelete(p._id, p.name)}
                            disabled={deletingId === p._id}
                          >
                            {deletingId === p._id ? (
                              <span className="flex items-center justify-end gap-1">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                              </span>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </Td>
                      </Tr>
                    );
                  })}

                  {!items.length && (
                    <Tr>
                      <Td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>No products found.</span>
                          {search ? (
                            <button
                              onClick={() => handleSearchChange('')}
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              Clear search
                            </button>
                          ) : (
                            <Link href="/dashboard/inventory/new">
                              <Button size="sm" variant="outline" className="mt-2">
                                Add your first product
                              </Button>
                            </Link>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400">
                <span>
                  Showing page {page} of {totalPages} ({total} total products)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-7 px-2 text-[11px] min-w-[60px]"
                    disabled={page <= 1 || loading}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    ← Prev
                  </Button>
                  <span className="px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    className="h-7 px-2 text-[11px] min-w-[60px]"
                    disabled={page >= totalPages || loading}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}