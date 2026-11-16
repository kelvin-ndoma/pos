'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  completePosSalePayment,
  voidPosSale,
  getPosSale,
  PosSaleResponse,
} from '@/lib/pos';

// Reuse types from PosSaleResponse
type Sale = PosSaleResponse['sale'];
type SaleItem = PosSaleResponse['items'][number];

// Helper function to safely get user name
function getUserName(user: string | { name?: string; email?: string; _id: string } | undefined): string {
  if (!user) return 'Unknown';
  if (typeof user === 'string') return user;
  return user.name || user.email || user._id || 'Unknown';
}

// Helper function to safely get customer name
function getCustomerName(customer: string | { name?: string; phone?: string; _id: string } | undefined): string | undefined {
  if (!customer) return undefined;
  if (typeof customer === 'string') return customer;
  return customer.name || customer.phone || customer._id;
}

// Helper function to safely get table name
function getTableName(table: string | { name: string; _id?: string } | undefined): string | undefined {
  if (!table) return undefined;
  if (typeof table === 'string') return undefined;
  return table.name;
}

export default function PosReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPosSale(params.id);
      console.log('Loaded sale data:', data);
      setSale(data.sale);
      setItems(data.items);
    } catch (e: any) {
      console.error('Error loading sale:', e);
      setError(e.message || 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      load();
    }
  }, [params.id]);

  async function handleCompletePayment() {
    if (!sale) return;

    try {
      setProcessing(true);
      setError(null);

      const response = await completePosSalePayment(
        sale._id,
        sale.grandTotal,
      );

      console.log('Payment completed response:', response);
      
      // Update state with the response
      setSale(response.sale);
      setItems(response.items);
      
    } catch (e: any) {
      console.error('Error completing payment:', e);
      setError(e.message || 'Failed to complete payment');
    } finally {
      setProcessing(false);
    }
  }

  async function handleVoidOrder() {
    if (!sale) return;

    if (
      !confirm(
        'Are you sure you want to void this order? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await voidPosSale(sale._id);

      console.log('Void response:', response);
      
      // Update state with the response
      setSale(response.sale);
      setItems(response.items);
      
    } catch (e: any) {
      console.error('Error voiding order:', e);
      setError(e.message || 'Failed to void order');
    } finally {
      setProcessing(false);
    }
  }

  function handleBack() {
    router.push('/dashboard/pos');
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
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

  function getStatusColor(status: Sale['status']): string {
    const colors = {
      COMPLETED: 'text-emerald-400 print:text-emerald-600',
      OPEN: 'text-amber-400 print:text-amber-600',
      VOID: 'text-rose-400 print:text-rose-600',
    };
    return colors[status];
  }

  function getStatusIcon(status: Sale['status']) {
    switch (status) {
      case 'COMPLETED':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'OPEN':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'VOID':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
          <p className="text-sm text-slate-400">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md text-center space-y-4">
          <svg className="h-12 w-12 text-amber-500/50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-400">{error || 'Sale not found.'}</p>
          <Button size="sm" variant="outline" onClick={handleBack}>
            Back to POS
          </Button>
        </div>
      </div>
    );
  }

  const cashierName = getUserName(sale.user);
  const customerName = getCustomerName(sale.customer);
  const tableName = getTableName(sale.table);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Header actions */}
      <div className="flex w-full max-w-md items-center justify-between print:hidden">
        <Button size="sm" variant="outline" onClick={handleBack}>
          ← Back to POS
        </Button>
        <div className="flex gap-2">
          {sale.status === 'OPEN' && (
            <>
              <Button
                size="sm"
                onClick={handleCompletePayment}
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  'Complete Payment'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVoidOrder}
                disabled={processing}
                className="text-rose-400 border-rose-800 hover:bg-rose-950/30"
              >
                Void
              </Button>
            </>
          )}
          <Button size="sm" onClick={handlePrint} className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950/80 p-5 text-xs shadow-lg print:shadow-none print:border print:border-gray-300 print:bg-white print:text-black">
        {/* Store header */}
        <div className="mb-4 text-center">
          <h1 className="text-lg font-bold tracking-tight print:text-black">
            STORE NAME
          </h1>
          <p className="text-[10px] text-slate-400 print:text-gray-600">
            123 Business Street · City, 12345
          </p>
          <p className="text-[10px] text-slate-400 print:text-gray-600">
            Tel: +254 700 000 000
          </p>
        </div>

        {/* Receipt title with status icon */}
        <div className="mb-4 text-center border-t border-b border-dashed border-slate-700 py-2 print:border-gray-400">
          <div className="flex items-center justify-center gap-2">
            {getStatusIcon(sale.status)}
            <h2 className="text-base font-semibold tracking-tight print:text-black">
              {sale.status === 'OPEN' ? 'OPEN ORDER' : 
               sale.status === 'COMPLETED' ? 'SALES RECEIPT' : 'VOIDED ORDER'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 print:text-gray-600">
            #{sale.reference || sale._id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Order type info */}
        {(sale.type || tableName || sale.covers || sale.notes) && (
          <div className="mb-4 text-[11px] bg-slate-900/60 p-2 rounded-lg print:bg-gray-100">
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-gray-600">Order Type</span>
              <span className="font-medium">{sale.type}</span>
            </div>
            {tableName && (
              <div className="flex justify-between mt-1">
                <span className="text-slate-400 print:text-gray-600">Table</span>
                <span className="font-medium">{tableName}</span>
              </div>
            )}
            {sale.covers && (
              <div className="flex justify-between mt-1">
                <span className="text-slate-400 print:text-gray-600">Covers</span>
                <span className="font-medium">{sale.covers}</span>
              </div>
            )}
            {sale.notes && (
              <div className="mt-1 text-[10px] text-slate-400 print:text-gray-600">
                <span>Notes: {sale.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="mb-4 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-gray-600">Date</span>
            <span className="font-mono">{formatDate(sale.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-gray-600">Status</span>
            <span className={`font-medium flex items-center gap-1 ${getStatusColor(sale.status)}`}>
              {getStatusIcon(sale.status)}
              {sale.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-gray-600">Cashier</span>
            <span>{cashierName}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-gray-600">Customer</span>
              <span>{customerName}</span>
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="mb-4">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-dashed border-slate-700 print:border-gray-400">
                  <th className="py-1.5 text-left font-medium">Item</th>
                  <th className="py-1.5 text-right font-medium">Qty</th>
                  <th className="py-1.5 text-right font-medium">Price</th>
                  <th className="py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b border-slate-800/40 print:border-gray-200">
                    <td className="py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.product?.name}</span>
                        {item.product?.sku && (
                          <span className="text-[9px] text-slate-500 print:text-gray-500">
                            SKU: {item.product.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 text-right font-mono">{item.quantity}</td>
                    <td className="py-1.5 text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="mb-4 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400 print:text-gray-600">Subtotal</span>
            <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-gray-600">Discount</span>
              <span className="font-mono text-amber-400 print:text-amber-600">
                -{formatCurrency(sale.discountTotal)}
              </span>
            </div>
          )}
          {sale.taxTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-gray-600">Tax</span>
              <span className="font-mono">{formatCurrency(sale.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-slate-700 pt-1.5 text-sm font-bold print:border-gray-400">
            <span>TOTAL</span>
            <span className="text-emerald-400 print:text-emerald-600 font-mono">
              {formatCurrency(sale.grandTotal)}
            </span>
          </div>
          
          {sale.status === 'OPEN' ? (
            <div className="mt-2 text-center text-amber-400 print:text-amber-600 text-[10px]">
              ⚠️ This order is not yet paid
            </div>
          ) : sale.status === 'VOID' ? (
            <div className="mt-2 text-center text-rose-400 print:text-rose-600 text-[10px]">
              ⚠️ This order has been voided
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Paid</span>
                <span className="font-mono">{formatCurrency(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Balance</span>
                <span className={`font-mono ${sale.balance > 0 ? 'text-amber-400 print:text-amber-600' : ''}`}>
                  {formatCurrency(sale.balance)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment details - only show for completed orders */}
        {sale.status === 'COMPLETED' && (
          <div className="mb-4 text-[10px] text-slate-500 print:text-gray-600">
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span>Cash</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCurrency(sale.paidAmount - sale.grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-slate-500 print:text-gray-600">
            {sale.status === 'OPEN' 
              ? 'Please present this order at the counter for payment.'
              : sale.status === 'VOID'
              ? 'This order has been voided.'
              : 'Thank you for your business!'}
          </p>
          <p className="text-[8px] text-slate-600 print:text-gray-500">
            This is a computer generated receipt. No signature required.
          </p>
          <p className="text-[8px] text-slate-600 print:text-gray-500">
            {new Date().toLocaleString('en-KE', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Print instructions (hidden when printing) */}
      <div className="w-full max-w-md text-center text-[10px] text-slate-500 print:hidden">
        <p>Use the print button above to generate a PDF receipt.</p>
      </div>
    </div>
  );
}