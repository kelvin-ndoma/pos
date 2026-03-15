// client/app/dashboard/purchases/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Product = {
  _id: string;
  name: string;
  sku?: string;
  costPrice?: number;
};

type Supplier = {
  _id: string;
  name: string;
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PurchaseItemDraft = {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  discountAmount?: number;
};

type CreatePurchasePayload = {
  supplierId?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    discountAmount?: number;
  }[];
  reference?: string;
  status?: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
};

export default function NewPurchasePage() {
  const router = useRouter();

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Form core
  const [supplierId, setSupplierId] = useState<string>('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<
    'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  >('ORDERED');

  const [items, setItems] = useState<PurchaseItemDraft[]>([]);
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

  async function loadSuppliers(searchText = '') {
    setLoadingSuppliers(true);
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const raw = await res.json();

      // Support both array and paginated responses
      let list: Supplier[] = [];
      if (Array.isArray(raw)) {
        list = raw as Supplier[];
      } else if (raw && Array.isArray((raw as Paginated<Supplier>).data)) {
        list = (raw as Paginated<Supplier>).data;
      }

      setSuppliers(list);
    } catch (e) {
      console.error('Failed to load suppliers', e);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  }

  useEffect(() => {
    loadProducts('');
    loadSuppliers('');
  }, []);

  function addProductToItems(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      const defaultCost = product.costPrice ?? 0;

      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }

      const newItem: PurchaseItemDraft = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitCost: defaultCost,
        discountAmount: 0,
      };
      return [...prev, newItem];
    });
  }

  function updateItem(
    productId: string,
    field: 'quantity' | 'unitCost' | 'discountAmount',
    value: number,
  ) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, [field]: value } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + i.unitCost * i.quantity,
        0,
      ),
    [items],
  );

  const discountTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.discountAmount || 0),
        0,
      ),
    [items],
  );

  const taxTotal = 0;
  const grandTotal = subtotal + taxTotal - discountTotal;

  async function handleSubmit() {
    try {
      setError(null);
      setSuccessRef(null);
      setSaving(true);

      if (!items.length) {
        throw new Error('Add at least one item');
      }

      const payload: CreatePurchasePayload = {
        supplierId: supplierId || undefined,
        reference: reference || undefined,
        status,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          discountAmount: i.discountAmount || 0,
        })),
      };

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create purchase');
      }

      const data = await res.json();
      const purchaseId =
        data.purchase?._id || data._id || undefined;

      setSuccessRef(data.purchase?.reference || purchaseId || null);
      setItems([]);
      setReference('');
      setStatus('ORDERED');

      if (purchaseId) {
        router.push(`/dashboard/purchases/${purchaseId}`);
      } else {
        router.push('/dashboard/purchases');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="flex h-full w-full gap-4">
        {/* LEFT: Products */}
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
                    Cost
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
                      {p.costPrice != null
                        ? `KSh ${p.costPrice}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => addProductToItems(p)}
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

        {/* MIDDLE: Purchase items */}
        <div className="w-[35%] flex flex-col space-y-3 min-w-0 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold tracking-tight flex-shrink-0">
            Purchase Items
          </h2>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 h-72 overflow-auto flex-shrink-0">
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
                    Cost
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Disc
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Total
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
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
                          updateItem(
                            item.productId,
                            'quantity',
                            e.target.valueAsNumber || 1,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-7 w-20 text-right text-[11px]"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            'unitCost',
                            e.target.valueAsNumber || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-7 w-20 text-right text-[11px]"
                        value={item.discountAmount || 0}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            'discountAmount',
                            e.target.valueAsNumber || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      KSh{' '}
                      {(
                        item.unitCost * item.quantity -
                        (item.discountAmount || 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="text-[11px] text-rose-400 hover:text-rose-300"
                        onClick={() => removeItem(item.productId)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No items added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-2 flex-1 overflow-auto">
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
          </div>
        </div>

        {/* RIGHT: Supplier & submit */}
        <div className="w-[25%] flex flex-col space-y-3 min-w-0 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold tracking-tight flex-shrink-0">
            Supplier &amp; Details
          </h2>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Supplier
              </label>
              <select
                className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 text-xs px-2"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select supplier (optional)</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Filter suppliers
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="Search suppliers..."
                value={supplierSearch}
                onChange={(e) => {
                  const v = e.target.value;
                  setSupplierSearch(v);
                  loadSuppliers(v);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Reference
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="Invoice / PO number (optional)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Status
              </label>
              <select
                className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 text-xs px-2"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as typeof status)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="ORDERED">Ordered</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}
          {successRef && (
            <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900 rounded-md px-2 py-1">
              Purchase created. Ref: {successRef}
            </p>
          )}

          <div className="mt-auto">
            <Button
              className="w-full h-9 text-sm"
              disabled={saving || !items.length}
              onClick={handleSubmit}
            >
              {saving ? 'Saving…' : 'Create Purchase'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}