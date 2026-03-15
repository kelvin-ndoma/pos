// client/app/dashboard/pos/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createPosSale, PosCartItem } from '@/lib/pos';

type Product = {
  _id: string;
  name: string;
  sku?: string;
  salePrice: number; // required in POS context
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function PosPage() {
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

  useEffect(() => {
    loadProducts('');
  }, []);

  function addToCart(product: Product) {
    // salePrice is required on type, but guard anyway
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

      const paid = paidAmount === '' ? grandTotal : Number(paidAmount);

      const payload = {
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
      setSuccessRef(result.sale?.reference || result.sale?._id || null);
      setCart([]);
      setPaidAmount('');
      setReference('');
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1.5fr]">
      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">POS</h2>
          <Input
            placeholder="Search products..."
            className="h-8 w-48 text-xs"
            value={productSearch}
            onChange={(e) => {
              const v = e.target.value;
              setProductSearch(v);
              loadProducts(v);
            }}
          />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 max-h-[420px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">SKU</th>
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
                  <td className="px-3 py-1.5">{p.name}</td>
                  <td className="px-3 py-1.5">{p.sku || '—'}</td>
                  <td className="px-3 py-1.5 text-right">
                    {p.salePrice != null ? `KSh ${p.salePrice}` : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
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

      {/* Cart */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">
          Cart
        </h3>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 max-h-[260px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
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
                  <td className="px-3 py-1.5">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {item.sku && (
                        <span className="text-[10px] text-slate-500">
                          {item.sku}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right">
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
                  <td className="px-3 py-1.5 text-right">
                    {item.unitPrice}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {item.unitPrice * item.quantity}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      type="button"
                      className="text-[11px] text-rose-400 hover:text-rose-300"
                      onClick={() => removeCartItem(item.productId)}
                    >
                      Remove
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

        {/* Totals + payment */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs">
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
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>KSh {grandTotal.toFixed(2)}</span>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Paid amount (default: total)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-8 text-xs"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Reference / note
              </label>
              <Input
                className="h-8 text-xs"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}
          {successRef && (
            <p className="mt-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900 rounded-md px-2 py-1">
              Sale completed. Ref: {successRef}
            </p>
          )}

          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={saving || !cart.length}
              onClick={handleCheckout}
            >
              {saving ? 'Completing…' : 'Complete sale'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
