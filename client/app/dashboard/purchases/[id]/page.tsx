// client/app/dashboard/purchases/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases/${params.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to load purchase');
      }

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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases/${data.purchase._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

  function renderStatusPill(status: PurchaseStatus) {
    const base =
      'text-[10px] px-2 py-0.5 rounded border inline-flex items-center';
    if (status === 'RECEIVED') {
      return (
        <span
          className={`${base} bg-emerald-950/40 text-emerald-400 border-emerald-900/40`}
        >
          RECEIVED
        </span>
      );
    }
    if (status === 'ORDERED') {
      return (
        <span
          className={`${base} bg-sky-950/40 text-sky-400 border-sky-900/40`}
        >
          ORDERED
        </span>
      );
    }
    if (status === 'DRAFT') {
      return (
        <span
          className={`${base} bg-slate-900 text-slate-300 border-slate-700`}
        >
          DRAFT
        </span>
      );
    }
    return (
      <span
        className={`${base} bg-rose-950/40 text-rose-400 border-rose-900/40`}
      >
        CANCELLED
      </span>
    );
  }

  if (loading) {
    return (
      <p className="text-xs text-slate-400 px-2 py-2">
        Loading purchase…
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-xs text-slate-400 px-2 py-2">
        Purchase not found.
      </p>
    );
  }

  const { purchase, items } = data;

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Purchase {purchase.reference || purchase._id.slice(-8)}
            </h2>
            <p className="text-xs text-slate-400">
              Created{' '}
              {new Date(purchase.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusPill(purchase.status)}
            <Button
              size="sm"
              variant="outline"
              disabled={
                purchase.status === 'RECEIVED' || purchase.status === 'CANCELLED' || updating
              }
              onClick={markAsReceived}
            >
              {updating
                ? 'Updating…'
                : purchase.status === 'RECEIVED'
                ? 'Already received'
                : 'Mark as received'}
            </Button>
          </div>
        </div>

        {/* Supplier & user */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Supplier
            </h3>
            <p className="text-[11px] text-slate-300">
              {purchase.supplier?.name || '—'}
            </p>
            {purchase.supplier?.email && (
              <p className="text-[11px] text-slate-400">
                {purchase.supplier.email}
              </p>
            )}
            {purchase.supplier?.phone && (
              <p className="text-[11px] text-slate-400">
                {purchase.supplier.phone}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Created by
            </h3>
            <p className="text-[11px] text-slate-300">
              {purchase.user?.name || '—'}
            </p>
            {purchase.user?.email && (
              <p className="text-[11px] text-slate-400">
                {purchase.user.email}
              </p>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Product
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Cost
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Discount
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-800/60"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>
                          {item.product?.name || 'Unknown product'}
                        </span>
                        {item.product?.sku && (
                          <span className="text-[10px] text-slate-500">
                            {item.product.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {item.discountAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-slate-500"
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
        <div className="max-w-sm ml-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span>KSh {purchase.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Discounts</span>
            <span>KSh {purchase.discountTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tax</span>
            <span>KSh {purchase.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-semibold">
            <span>Total</span>
            <span className="text-emerald-400">
              KSh {purchase.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/dashboard/purchases')}
          >
            Back to purchases
          </Button>
        </div>
      </div>
    </div>
  );
}
