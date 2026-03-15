'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type User = {
  _id: string;
  name?: string;
  email?: string;
};

type Customer = {
  _id: string;
  name?: string;
  phone?: string;
};

type SaleItem = {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku?: string;
  };
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  // optional: taxAmount if you want to display per-line tax later
  taxAmount?: number;
};

type Sale = {
  _id: string;
  reference?: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  status: 'OPEN' | 'COMPLETED' | 'VOID';
  createdAt: string;
  user?: User;
  customer?: Customer;
};

type SaleResponse = {
  sale: Sale;
  items: SaleItem[];
};

export default function PosReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<SaleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pos/sales/${params.id}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to load sale');
      }
      setData(body);
    } catch (e: any) {
      setError(e.message || 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  function handleBack() {
    router.push('/dashboard/pos');
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Loading receipt…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-3 text-xs text-slate-400">
        <p>{error || 'Sale not found.'}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleBack}>
            Back to POS
          </Button>
        </div>
      </div>
    );
  }

  const { sale, items } = data;
  const cashierName =
    sale.user?.name || sale.user?.email || sale.user?._id;
  const customerName =
    sale.customer?.name || sale.customer?.phone || sale.customer?._id;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header actions */}
      <div className="flex w-full max-w-md items-center justify-between print:hidden">
        <Button size="sm" variant="outline" onClick={handleBack}>
          ← Back to POS
        </Button>
        <Button size="sm" onClick={handlePrint}>
          Print / Download
        </Button>
      </div>

      {/* Receipt card */}
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-xs shadow-lg print:shadow-none print:border print:bg-white print:text-black">
        {/* Store / title */}
        <div className="mb-3 text-center">
          <h1 className="text-base font-semibold tracking-tight print:text-black">
            POS Receipt
          </h1>
          <p className="text-[11px] text-slate-400 print:text-black">
            Sale #{sale.reference || sale._id}
          </p>
        </div>

        {/* Meta */}
        <div className="mb-3 space-y-1.5 border-b border-dashed border-slate-700 pb-2 print:border-black/50">
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Date
            </span>
            <span>
              {new Date(sale.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Status
            </span>
            <span>{sale.status}</span>
          </div>
          {cashierName && (
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-black">
                Cashier
              </span>
              <span>{cashierName}</span>
            </div>
          )}
          {customerName && (
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-black">
                Customer
              </span>
              <span>{customerName}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-3 border-b border-dashed border-slate-700 pb-2 print:border-black/50">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800/60 print:border-black/40">
                <th className="py-1 text-left font-medium">Item</th>
                <th className="py-1 text-right font-medium">Qty</th>
                <th className="py-1 text-right font-medium">Price</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it._id}
                  className="border-b border-slate-900/40 print:border-black/10"
                >
                  <td className="py-1">
                    <div className="flex flex-col">
                      <span>{it.product?.name}</span>
                      {it.product?.sku && (
                        <span className="text-[10px] text-slate-500 print:text-black/70">
                          {it.product.sku}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1 text-right">{it.quantity}</td>
                  <td className="py-1 text-right">
                    {it.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {it.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Subtotal
            </span>
            <span>KSh {sale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Discounts
            </span>
            <span>KSh {sale.discountTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Tax
            </span>
            <span>KSh {sale.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1.5 text-[12px] font-semibold print:border-black/50">
            <span>Total</span>
            <span>KSh {sale.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Paid
            </span>
            <span>KSh {sale.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-black">
              Balance
            </span>
            <span>KSh {sale.balance.toFixed(2)}</span>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-500 print:text-black/60">
          Thank you for your business.
        </p>
      </div>
    </div>
  );
}
