'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createPosSale, PosCartItem } from '@/lib/pos';

type Product = {
  _id: string;
  name: string;
  sku?: string;
  salePrice: number;
  // taxRule is optional; you can populate it later if you want VAT preview
  taxRule?: {
    _id: string;
    rate: number;
    name?: string;
  };
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

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

type CurrentUser = {
  _id: string;
  name?: string;
  email?: string;
};

export default function PosPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [reference, setReference] = useState('');
  const [customerId, setCustomerId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const [recentSales, setRecentSales] = useState<PosSaleSummary[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Load current user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        try {
          setCurrentUser(JSON.parse(raw));
        } catch {
          setCurrentUser(null);
        }
      }
    }
  }, []);

  async function loadProducts(searchText = '') {
    setLoadingProducts(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '50');
      if (searchText) params.set('search', searchText);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = (await res.json()) as Paginated<Product>;
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error('Failed to load products', e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadRecentSales() {
    setLoadingSales(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pos/sales?${params.toString()}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = (await res.json()) as PaginatedSales<PosSaleSummary>;
      setRecentSales(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error('Failed to load recent POS sales', e);
      setRecentSales([]);
    } finally {
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    loadProducts('');
    loadRecentSales();
  }, []);

  function addToCart(product: Product) {
    if (product.salePrice == null) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      const newItem: PosCartItem = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.salePrice,
        quantity: 1,
        // discountAmount can be added in UI later if needed
      };
      return [...prev, newItem];
    });
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeCartItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0,
      ),
    [cart],
  );

  const discountTotal = useMemo(
    () => cart.reduce((sum, i) => sum + (i.discountAmount || 0), 0),
    [cart],
  );

  // For now, frontend does not compute tax; backend does.
  const taxTotal = 0;
  const grandTotal = subtotal + taxTotal - discountTotal;

  async function handleCheckout() {
    try {
      setError(null);
      setSuccessRef(null);
      setSaving(true);

      if (!cart.length) {
        throw new Error('Cart is empty');
      }

      if (!currentUser?._id) {
        throw new Error('Current user not found; please log in again');
      }

      const paid =
        paidAmount === '' ? grandTotal : Number(paidAmount);

      const payload = {
        userId: currentUser._id,
        customerId: customerId || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount || 0,
        })),
        paidAmount: paid,
        reference: reference || undefined,
        status: 'COMPLETED' as const,
      };

      const result = await createPosSale(payload);
      const saleId = result.sale?._id as string | undefined;

      setSuccessRef(result.sale?.reference || saleId || null);
      setCart([]);
      setPaidAmount('');
      setReference('');
      await loadRecentSales();

      if (saleId) {
        router.push(`/dashboard/pos/receipt/${saleId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="flex h-full w-full gap-4">
        {/* LEFT COLUMN: Products */}
        <div className="w-2/5 flex flex-col space-y-3 min-w-0 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold tracking-tight">
              Products
            </h2>
            <Input
              placeholder="Search products..."
              className="h-8 w-44 text-xs"
              value={productSearch}
              onChange={(e) => {
                const v = e.target.value;
                setProductSearch(v);
                loadProducts(v);
              }}
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Price
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.sku || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {p.salePrice != null
                        ? `KSh ${p.salePrice}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => addToCart(p)}
                        disabled={p.salePrice == null}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                ))}
                {!products.length && !loadingProducts && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MIDDLE COLUMN: Cart + Payment */}
        <div className="w-[30%] flex flex-col space-y-3 min-w-0 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold tracking-tight flex-shrink-0">
            Cart &amp; Payment
          </h2>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 h-64 overflow-auto flex-shrink-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Item
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Price
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Total
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-slate-800/60"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.sku && (
                          <span className="text-[10px] text-slate-500">
                            {item.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-16 text-right text-[11px]"
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQuantity(
                            item.productId,
                            e.target.valueAsNumber || 1,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh {item.unitPrice}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh{' '}
                      {(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="text-[11px] text-rose-400 hover:text-rose-300"
                        onClick={() => removeCartItem(item.productId)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {!cart.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No items in cart.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-3 flex-1 overflow-auto">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>KSh {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Discounts</span>
                <span>KSh {discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax</span>
                <span>KSh {taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-800">
                <span>Total</span>
                <span className="text-emerald-400">
                  KSh {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  Paid amount
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`${grandTotal.toFixed(2)}`}
                  className="h-8 text-xs"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  Reference
                </label>
                <Input
                  placeholder="Optional"
                  className="h-8 text-xs"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            {paidAmount && Number(paidAmount) > grandTotal && (
              <div className="flex justify-between text-xs bg-emerald-950/30 border border-emerald-900/30 rounded-md px-2 py-1.5">
                <span className="text-slate-400">Change due</span>
                <span className="text-emerald-400">
                  KSh {(Number(paidAmount) - grandTotal).toFixed(2)}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
                {error}
              </p>
            )}
            {successRef && (
              <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900 rounded-md px-2 py-1">
                Sale completed. Ref: {successRef}
              </p>
            )}

            <Button
              className="w-full h-9 text-sm"
              disabled={saving || !cart.length}
              onClick={handleCheckout}
            >
              {saving ? 'Processing…' : 'Complete Sale'}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Receipt Preview + Recent Sales */}
        <div className="w-[30%] flex flex-col space-y-3 min-w-0 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold tracking-tight flex-shrink-0">
            Receipt &amp; History
          </h2>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">
                Current Receipt
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[11px] text-slate-500">
                  No items in receipt
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Add products from the left column
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-36 overflow-auto mb-3 border-b border-slate-800/60">
                  <table className="w-full text-[11px]">
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.productId}>
                          <td className="py-1 pr-2">
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              <span className="text-[9px] text-slate-500">
                                {item.sku || ''} × {item.quantity}
                              </span>
                            </div>
                          </td>
                          <td className="py-1 text-right whitespace-nowrap">
                            KSh{' '}
                            {(
                              item.unitPrice * item.quantity
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span>KSh {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discount</span>
                    <span>KSh {discountTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-1 border-t border-slate-800">
                    <span>Total</span>
                    <span className="text-emerald-400">
                      KSh {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-xs font-semibold">
                Recent Sales
              </span>
              <button
                type="button"
                className="text-[10px] text-slate-400 hover:text-slate-200"
                onClick={loadRecentSales}
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {loadingSales && (
                <div className="text-center py-4">
                  <p className="text-[11px] text-slate-500">
                    Loading…
                  </p>
                </div>
              )}

              {!loadingSales && !recentSales.length && (
                <div className="text-center py-4">
                  <p className="text-[11px] text-slate-500">
                    No recent sales
                  </p>
                </div>
              )}

              {recentSales.map((sale) => (
                <div
                  key={sale._id}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/pos/receipt/${sale._id}`,
                    )
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium truncate">
                        {sale.reference || sale._id.slice(-6)}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                            : sale.status === 'OPEN'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(
                        sale.createdAt,
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[11px] font-medium">
                      KSh {sale.grandTotal.toFixed(2)}
                    </div>
                    {sale.balance > 0 && (
                      <div className="text-[9px] text-amber-400">
                        Due: KSh {sale.balance.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
