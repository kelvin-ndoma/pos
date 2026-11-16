// client/app/dashboard/purchases/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient'; // Added import

type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

type Purchase = {
  _id: string;
  reference?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: PurchaseStatus;
  createdAt: string;
  supplier?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  user?: {
    _id: string;
    name?: string;
    email?: string;
  };
};

type PurchaseItem = {
  _id: string;
  quantity: number;
  unitCost: number;
  discountAmount: number;
  lineTotal: number;
  product?: {
    _id: string;
    name?: string;
    sku?: string;
  };
};

type PurchaseResponse = {
  purchase: Purchase;
  items: PurchaseItem[];
};

export default function PurchaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<PurchaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPurchase() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases/${params.id}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load purchase');
      }

      const body = await res.json();
      setData(body as PurchaseResponse);
    } catch (e: any) {
      console.error('Failed to load purchase', e);
      setError(e.message || 'Failed to load purchase');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function markAsReceived() {
    if (!data || data.purchase.status === 'RECEIVED') return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases/${data.purchase._id}`,
        {
          method: 'PUT',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify({ status: 'RECEIVED' }),
        },
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update purchase');
      }

      // Reload to reflect new status and updated stock
      await loadPurchase();
    } catch (e: any) {
      console.error('Failed to mark as received', e);
      setError(e.message || 'Failed to mark as received');
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    loadPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  function renderStatusPill(status: PurchaseStatus) {
    const base =
      'text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center font-medium';
    
    const styles = {
      RECEIVED: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40',
      ORDERED: 'bg-sky-950/40 text-sky-400 border-sky-900/40',
      DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
      CANCELLED: 'bg-rose-950/40 text-rose-400 border-rose-900/40',
    };

    return (
      <span className={`${base} ${styles[status]}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="h-full w-full px-0 py-4">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
              <p className="text-sm text-slate-400">Loading purchase details…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full w-full px-0 py-4">
        <div className="max-w-3xl space-y-4">
          <div className="bg-amber-950/20 border border-amber-900 rounded-lg p-6 text-center">
            <svg className="h-12 w-12 text-amber-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-400 mb-3">
              {error || 'Purchase not found.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/dashboard/purchases')}
            >
              View all purchases
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { purchase, items } = data;

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Purchase {purchase.reference || purchase._id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-xs text-slate-400">
                Created {formatDate(purchase.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusPill(purchase.status)}
            {purchase.status === 'ORDERED' && (
              <Button
                size="sm"
                disabled={updating}
                onClick={markAsReceived}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {updating ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </span>
                ) : (
                  'Mark as received'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Supplier & user cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xs font-semibold text-slate-200">Supplier</h3>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {purchase.supplier?.name || 'No supplier specified'}
              </p>
              {purchase.supplier?.email && (
                <p className="text-xs text-slate-400 mt-1">
                  {purchase.supplier.email}
                </p>
              )}
              {purchase.supplier?.phone && (
                <p className="text-xs text-slate-400">
                  {purchase.supplier.phone}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xs font-semibold text-slate-200">Created by</h3>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {purchase.user?.name || 'Unknown user'}
              </p>
              {purchase.user?.email && (
                <p className="text-xs text-slate-400 mt-1">
                  {purchase.user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-xs font-semibold text-slate-200">Items</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Product</th>
                  <th className="px-4 py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2 text-right font-medium">Unit Cost</th>
                  <th className="px-4 py-2 text-right font-medium">Discount</th>
                  <th className="px-4 py-2 text-right font-medium">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {item.product?.name || 'Unknown product'}
                        </span>
                        {item.product?.sku && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.product.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-amber-400">
                      {item.discountAmount > 0 ? formatCurrency(item.discountAmount) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No items on this purchase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono">{formatCurrency(purchase.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Discounts</span>
              <span className="font-mono text-amber-400">-{formatCurrency(purchase.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Tax</span>
              <span className="font-mono">{formatCurrency(purchase.taxTotal)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-semibold">
              <span>Total</span>
              <span className="text-emerald-400 font-mono">
                {formatCurrency(purchase.grandTotal)}
              </span>
            </div>
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

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/dashboard/purchases')}
          >
            Back to purchases
          </Button>
          {purchase.status === 'DRAFT' && (
            <Button
              size="sm"
              onClick={() => router.push(`/dashboard/purchases/${purchase._id}/edit`)}
            >
              Edit purchase
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}