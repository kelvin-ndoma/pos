'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authHeaders } from '@/lib/apiClient'; // Added import

type InventoryItem = {
  _id: string;
  name: string;
  sku?: string;
  category?: { _id: string; name: string };
  quantityOnHand: number;
  reorderLevel?: number | null;
  costPrice?: number | null;
  stockValue?: number | null;
};

type InventoryReportResponse = {
  count: number;
  items: InventoryItem[];
};

type FilterState = {
  categoryId: string;
  supplierId: string;
  lowStockOnly: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const InventoryReportPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    categoryId: '',
    supplierId: '',
    lowStockOnly: false,
  });

  const [data, setData] = useState<InventoryReportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.supplierId) {
        params.append('supplierId', filters.supplierId);
      }
      if (filters.lowStockOnly) {
        params.append('lowStockOnly', 'true');
      }

      const res = await fetch(
        `${API_BASE}/api/v1/reports/inventory?${params.toString()}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || 'Failed to fetch report');
      }

      const json = (await res.json()) as InventoryReportResponse;
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    if (!data) return { totalQty: 0, totalValue: 0 };

    return data.items.reduce(
      (acc, item) => {
        acc.totalQty += item.quantityOnHand || 0;
        acc.totalValue += item.stockValue || 0;
        return acc;
      },
      { totalQty: 0, totalValue: 0 },
    );
  }, [data]);

  const handleFilterChange = (
    field: keyof FilterState,
    value: string | boolean,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchReport();
  };

  const handleResetFilters = () => {
    setFilters({
      categoryId: '',
      supplierId: '',
      lowStockOnly: false,
    });
    fetchReport();
  };

  const handleDownloadCsv = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.supplierId) {
        params.append('supplierId', filters.supplierId);
      }
      if (filters.lowStockOnly) {
        params.append('lowStockOnly', 'true');
      }

      const res = await fetch(
        `${API_BASE}/api/v1/reports/inventory/download?${params.toString()}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          credentials: 'include',
        },
      );

      if (!res.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download CSV');
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null) return '-';
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Report
          </h1>
          <p className="text-sm text-gray-600">
            View current stock levels and download as CSV.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={loading || !data?.items.length}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              value={filters.categoryId}
              onChange={(e) =>
                handleFilterChange('categoryId', e.target.value)
              }
              className="mt-1 w-48 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Filter by category ID"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700">
              Supplier
            </label>
            <input
              type="text"
              value={filters.supplierId}
              onChange={(e) =>
                handleFilterChange('supplierId', e.target.value)
              }
              className="mt-1 w-48 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Filter by supplier ID"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input
              type="checkbox"
              checked={filters.lowStockOnly}
              onChange={(e) =>
                handleFilterChange('lowStockOnly', e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Low stock only
          </label>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleResetFilters}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            <span className="text-sm text-gray-600">Loading inventory data...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-900">{data.count}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium">Total Quantity</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(totals.totalQty)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-medium">Total Stock Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.totalValue)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty On Hand
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.items.map((item) => {
                  const isLowStock = item.reorderLevel != null && 
                                    item.quantityOnHand <= item.reorderLevel;
                  
                  return (
                    <tr key={item._id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {item.sku || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.category?.name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isLowStock ? 'text-amber-700 font-bold' : 'text-gray-900'}`}>
                        {formatNumber(item.quantityOnHand)}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        {item.reorderLevel != null ? formatNumber(item.reorderLevel) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900">
                        {item.costPrice != null ? formatCurrency(item.costPrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 font-medium">
                        {item.stockValue != null ? formatCurrency(item.stockValue) : '-'}
                      </td>
                    </tr>
                  );
                })}

                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span>No inventory records found.</span>
                        {(filters.categoryId || filters.supplierId || filters.lowStockOnly) && (
                          <button
                            onClick={handleResetFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReportPage;