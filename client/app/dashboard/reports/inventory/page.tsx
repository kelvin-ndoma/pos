'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${API_BASE}/api/v1/reports/inventory?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
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

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${API_BASE}/api/v1/reports/inventory/download?${params.toString()}`,
        {
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
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
      a.download = 'inventory-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download CSV');
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">
            Inventory Report
          </h1>
          <p className="text-sm text-gray-800">
            View current stock levels and download as CSV.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-md border border-gray-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-black">
              Category ID
            </label>
            <input
              type="text"
              value={filters.categoryId}
              onChange={(e) =>
                handleFilterChange('categoryId', e.target.value)
              }
              className="mt-1 w-48 rounded-md border border-gray-400 px-2 py-1 text-sm text-black"
              placeholder="Optional categoryId"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-black">
              Supplier ID
            </label>
            <input
              type="text"
              value={filters.supplierId}
              onChange={(e) =>
                handleFilterChange('supplierId', e.target.value)
              }
              className="mt-1 w-48 rounded-md border border-gray-400 px-2 py-1 text-sm text-black"
              placeholder="Optional supplierId"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-black">
            <input
              type="checkbox"
              checked={filters.lowStockOnly}
              onChange={(e) =>
                handleFilterChange('lowStockOnly', e.target.checked)
              }
            />
            Low stock only
          </label>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleResetFilters}
              className="rounded-md border border-gray-500 px-3 py-1 text-sm text-black hover:bg-gray-100"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="rounded-md bg-black px-3 py-1 text-sm text-white hover:bg-gray-900"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {loading && (
        <div className="text-sm text-gray-800">Loading...</div>
      )}
      {error && (
        <div className="text-sm text-red-700">
          Error: {error}
        </div>
      )}

      {/* Table */}
      {!loading && data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-black">
            <span>
              Records:{' '}
              <span className="font-semibold">
                {data.count}
              </span>
            </span>
            <span>
              Total Qty:{' '}
              <span className="font-semibold">
                {totals.totalQty.toLocaleString()}
              </span>
              {' · '}
              Total Stock Value:{' '}
              <span className="font-semibold">
                {totals.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-300 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-300 text-sm text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Category
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Qty On Hand
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Reorder Level
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cost Price
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Stock Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-3 py-2">
                      <span className="font-medium">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {item.sku || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {item.category?.name || '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.quantityOnHand.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.reorderLevel ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.costPrice != null
                        ? item.costPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.stockValue != null
                        ? item.stockValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}

                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-sm text-gray-800"
                    >
                      No inventory records found.
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
