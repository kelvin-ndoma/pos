'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createPosSale, updatePosSale, PosCartItem } from '@/lib/pos';
import { authHeaders } from '@/lib/apiClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Product = {
  _id: string;
  name: string;
  sku?: string;
  salePrice: number;
  taxRule?: {
    _id: string;
    rate: number;
    name?: string;
  };
};

type Table = {
  _id: string;
  name: string;
  area?: string;
  capacity?: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';
  currentSale?: string | null;
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
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  table?: {
    _id: string;
    name: string;
  };
};

type PaginatedSales<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function formatCurrency(value: number): string {
  if (Number.isNaN(value)) return 'KSh 0.00';
  return `KSh ${value.toFixed(2)}`;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function PosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [reference, setReference] = useState('');
  const [customerId, setCustomerId] = useState<string>('');

  const [saleType, setSaleType] = useState<
    'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  >('TAKEAWAY');
  const [tableId, setTableId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [covers, setCovers] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const [recentSales, setRecentSales] = useState<PosSaleSummary[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [openOrders, setOpenOrders] = useState<PosSaleSummary[]>([]);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const [selectedOpenOrder, setSelectedOpenOrder] = useState<string | null>(null);

  // Load initial data from URL params
  useEffect(() => {
    const qpSaleType = searchParams.get('saleType');
    const qpTableId = searchParams.get('tableId');
    const qpTableName = searchParams.get('tableName');

    if (
      qpSaleType === 'DINE_IN' ||
      qpSaleType === 'TAKEAWAY' ||
      qpSaleType === 'DELIVERY'
    ) {
      setSaleType(qpSaleType);
    }

    if (qpTableId) {
      setTableId(qpTableId);
    }

    if (qpTableName) {
      setTableName(qpTableName);
    }
  }, [searchParams]);

  // Load products with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(productSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [productSearch]);

  async function loadProducts(searchText = '') {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '50');
      if (searchText) params.set('search', searchText);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load products');
      }

      const data = (await res.json()) as Paginated<Product>;
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error('Failed to load products', e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadTables() {
    setLoadingTables(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '200');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tables?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load tables');
      }

      const data = (await res.json()) as Paginated<Table>;
      const all = Array.isArray(data.data) ? data.data : [];
      setTables(all);
      
      // Clear selected table if it's no longer available
      const selectedTable = all.find(t => t._id === tableId);
      if (tableId && (!selectedTable || selectedTable.status !== 'AVAILABLE')) {
        setTableId('');
        setTableName('');
      }
    } catch (e) {
      console.error('Failed to load tables', e);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  }

  async function loadOpenOrders() {
    setLoadingOpenOrders(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '20');
      params.set('status', 'OPEN');
      params.set('sort', '-createdAt');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load open orders');
      }

      const data = (await res.json()) as PaginatedSales<PosSaleSummary>;
      setOpenOrders(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error('Failed to load open orders', e);
      setOpenOrders([]);
    } finally {
      setLoadingOpenOrders(false);
    }
  }

  async function loadRecentSales() {
    setLoadingSales(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10');
      params.set('sort', '-createdAt');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load recent sales');
      }

      const data = (await res.json()) as PaginatedSales<PosSaleSummary>;
      setRecentSales(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error('Failed to load recent POS sales', e);
      setRecentSales([]);
    } finally {
      setLoadingSales(false);
    }
  }

  // Initial data load
  useEffect(() => {
    loadProducts('');
    loadRecentSales();
    loadTables();
    loadOpenOrders();
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

      const rawRate = product.taxRule?.rate ?? 0;
      const taxRateDecimal = rawRate > 1 ? rawRate / 100 : rawRate;

      const newItem: PosCartItem = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.salePrice,
        quantity: 1,
        taxRate: taxRateDecimal,
      };
      return [...prev, newItem];
    });
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    
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

  function clearCart() {
    setCart([]);
    setSelectedOpenOrder(null);
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

  const taxTotal = useMemo(
    () =>
      cart.reduce((sum, i) => {
        const rate = i.taxRate ?? 0;
        const lineBase =
          i.unitPrice * i.quantity - (i.discountAmount || 0);
        return sum + lineBase * rate;
      }, 0),
    [cart],
  );

  const grandTotal = subtotal + taxTotal - discountTotal;

  async function handleCreateOpenOrder() {
    try {
      setError(null);
      setSuccessRef(null);
      setSaving(true);

      if (!cart.length) {
        throw new Error('Cart is empty');
      }

      if (!currentUser?.id) {
        throw new Error('Current user not found; please log in again');
      }

      if (saleType === 'DINE_IN' && !tableId) {
        throw new Error('Please select a table for dine-in');
      }

      // Validate table is still available
      if (saleType === 'DINE_IN' && tableId) {
        const selectedTable = tables.find(t => t._id === tableId);
        if (!selectedTable || selectedTable.status !== 'AVAILABLE') {
          throw new Error('Selected table is no longer available');
        }
      }

      const payload = {
        userId: currentUser.id,
        customerId: customerId || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount || 0,
        })),
        paidAmount: 0, // No payment for open order
        reference: reference || undefined,
        status: 'OPEN' as const, // Create as OPEN order
        type: saleType,
        tableId: saleType === 'DINE_IN' && tableId ? tableId : undefined,
        covers: saleType === 'DINE_IN' && covers ? Number(covers) : undefined,
        notes: notes || undefined,
      };

      const result = await createPosSale(payload);
      const saleId = result.sale?._id as string | undefined;

      setSuccessRef(`Open order created: ${result.sale?.reference || saleId}`);
      
      // Clear the form
      setCart([]);
      setPaidAmount('');
      setReference('');
      setNotes('');
      setCovers('');
      
      // Clear table selection for dine-in
      if (saleType === 'DINE_IN') {
        setTableId('');
        setTableName('');
      }

      // Refresh data
      await Promise.all([
        loadRecentSales(),
        loadTables(),
        loadOpenOrders()
      ]);

      if (saleId) {
        router.push(`/dashboard/pos/receipt/${saleId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create open order');
    } finally {
      setSaving(false);
    }
  }

  async function handleCompletePayment() {
    try {
      setError(null);
      setSuccessRef(null);
      setSaving(true);

      if (!selectedOpenOrder) {
        throw new Error('No open order selected');
      }

      if (!cart.length) {
        throw new Error('Cart is empty');
      }

      const paid = paidAmount === '' ? grandTotal : Number(paidAmount);

      const payload = {
        status: 'COMPLETED' as const,
        paidAmount: paid,
      };

      const result = await updatePosSale(selectedOpenOrder, payload);
      const saleId = result.sale?._id as string | undefined;

      setSuccessRef(`Payment completed: ${result.sale?.reference || saleId}`);
      
      // Clear the form
      setCart([]);
      setPaidAmount('');
      setReference('');
      setNotes('');
      setCovers('');
      setSelectedOpenOrder(null);

      // Refresh data
      await Promise.all([
        loadRecentSales(),
        loadTables(),
        loadOpenOrders()
      ]);

      if (saleId) {
        router.push(`/dashboard/pos/receipt/${saleId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete payment');
    } finally {
      setSaving(false);
    }
  }

  function handleSelectOpenOrder(order: PosSaleSummary) {
    setSelectedOpenOrder(order._id);
    // Here you would typically load the order items into the cart
    // You'll need an API endpoint to fetch order details
    loadOrderDetails(order._id);
  }

  async function loadOrderDetails(orderId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/${orderId}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load order details');
      }

      const data = await res.json();
      // Transform the items into cart items
      const cartItems: PosCartItem[] = data.items.map((item: any) => ({
        productId: item.product._id,
        name: item.product.name,
        sku: item.product.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        taxRate: item.taxRate / 100,
        discountAmount: item.discountAmount,
      }));
      
      setCart(cartItems);
      setSaleType(data.sale.type);
      if (data.sale.table) {
        setTableId(data.sale.table._id);
        setTableName(data.sale.table.name);
      }
      setCovers(data.sale.covers?.toString() || '');
      setNotes(data.sale.notes || '');
      setCustomerId(data.sale.customer?._id || '');
    } catch (e) {
      console.error('Failed to load order details', e);
    }
  }

  // Get available tables for dropdown
  const availableTables = useMemo(() => {
    return tables.filter(t => t.status === 'AVAILABLE');
  }, [tables]);

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full w-full gap-3 sm:gap-4 p-2 sm:p-4">
        {/* LEFT COLUMN: Products */}
        <div className="w-full lg:w-2/5 flex flex-col h-full min-w-0 bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
          {/* Fixed Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-slate-800 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight">
              Products
            </h2>
            <div className="relative w-full sm:w-auto">
              <Input
                placeholder="Search products..."
                className="h-9 sm:h-8 w-full sm:w-48 text-xs sm:text-sm pl-8"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto min-h-0">
            {loadingProducts && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  <p className="text-xs sm:text-sm text-slate-400">
                    Loading products…
                  </p>
                </div>
              </div>
            )}

            {!loadingProducts && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95 z-10">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium">
                        Name
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium hidden sm:table-cell">
                        SKU
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-medium">
                        Price
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p._id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                          <div className="truncate max-w-[120px] sm:max-w-none">
                            {p.name}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 font-mono text-xs text-slate-400 hidden sm:table-cell">
                          {p.sku || '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-right font-mono">
                          {p.salePrice != null
                            ? formatCurrency(p.salePrice)
                            : '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-right">
                          <Button
                            size="default"
                            variant="outline"
                            className="h-8 sm:h-7 px-3 sm:px-2 text-xs"
                            onClick={() => addToCart(p)}
                            disabled={p.salePrice == null}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!products.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-12 text-center text-slate-500"
                        >
                          {productSearch
                            ? 'No products match your search.'
                            : 'No products found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Cart + Restaurant + Payment */}
        <div className="w-full lg:w-[30%] flex flex-col h-full min-w-0 bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight">
              {selectedOpenOrder ? 'Complete Payment' : 'New Order'}
            </h2>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <>
                  <span className="text-xs sm:text-sm text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-md hover:bg-slate-800/50"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto min-h-0 p-3 sm:p-4 space-y-3">
            {/* Cart table */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 h-64 sm:h-80 overflow-auto flex-shrink-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95 z-10">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left font-medium">
                        Item
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium">
                        Qty
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium hidden sm:table-cell">
                        Price
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium">
                        Total
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-slate-800/60 hover:bg-slate-800/20"
                      >
                        <td className="px-2 sm:px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[80px] sm:max-w-none">
                              {item.name}
                            </span>
                            {item.sku && (
                              <span className="text-[8px] sm:text-[10px] text-slate-500">
                                {item.sku}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <Input
                            type="number"
                            min={1}
                            className="h-8 sm:h-7 w-16 sm:w-14 text-right text-xs sm:text-[11px] mx-auto"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(
                                item.productId,
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                          />
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right font-mono hidden sm:table-cell">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right font-mono font-medium">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <button
                            type="button"
                            className="text-xs sm:text-sm text-rose-400 hover:text-rose-300 transition-colors p-1"
                            onClick={() => removeCartItem(item.productId)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!cart.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-12 text-center text-slate-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span>No items in cart</span>
                            <span className="text-[10px] sm:text-xs text-slate-600">
                              Tap &quot;Add&quot; to start
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service type / table / covers / notes */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 sm:p-4 text-xs sm:text-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">
                    Service type
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 text-xs sm:text-sm"
                    value={saleType}
                    onChange={(e) => {
                      const newType = e.target.value as 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
                      setSaleType(newType);
                      if (newType !== 'DINE_IN') {
                        setTableId('');
                        setTableName('');
                        setCovers('');
                      }
                    }}
                    disabled={!!selectedOpenOrder}
                  >
                    <option value="TAKEAWAY">Takeaway</option>
                    <option value="DINE_IN">Dine-in</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">
                    Table
                  </label>
                  {saleType !== 'DINE_IN' ? (
                    <Input
                      placeholder="N/A"
                      className="h-9 text-xs sm:text-sm"
                      value=""
                      disabled
                    />
                  ) : (
                    <select
                      className="h-9 w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 text-xs sm:text-sm"
                      value={tableId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setTableId(selectedId);
                        const t = tables.find((tbl) => tbl._id === selectedId);
                        setTableName(t?.name || '');
                      }}
                      disabled={saleType !== 'DINE_IN' || loadingTables || !!selectedOpenOrder}
                    >
                      <option value="">
                        {loadingTables ? 'Loading tables…' : 'Select table'}
                      </option>
                      {availableTables.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                          {t.area ? ` – ${t.area}` : ''}
                          {t.capacity ? ` (${t.capacity})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">
                    Covers
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Guests"
                    className="h-9 text-xs sm:text-sm"
                    value={covers}
                    onChange={(e) => setCovers(e.target.value)}
                    disabled={saleType !== 'DINE_IN' || !!selectedOpenOrder}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">
                  Notes to kitchen
                </label>
                <textarea
                  className="w-full h-16 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs sm:text-sm resize-none"
                  placeholder="E.g. No onions, extra spicy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!!selectedOpenOrder}
                />
              </div>
            </div>

            {/* Totals, payment, and checkout */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 sm:p-4 text-xs sm:text-sm space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discounts</span>
                  <span className="font-mono text-amber-400">
                    -{formatCurrency(discountTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="font-mono text-slate-400">
                    {formatCurrency(taxTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-3 border-t border-slate-800">
                  <span>Total</span>
                  <span className="text-emerald-400 font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {selectedOpenOrder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">
                      Paid amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={formatCurrency(grandTotal)}
                      className="h-10 sm:h-9 text-sm font-mono"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">
                      Reference
                    </label>
                    <Input
                      placeholder="Optional"
                      className="h-10 sm:h-9 text-sm"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paidAmount && Number(paidAmount) > grandTotal && (
                <div className="flex justify-between text-sm bg-emerald-950/30 border border-emerald-900/30 rounded-md px-3 py-2">
                  <span className="text-slate-400">Change due</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {formatCurrency(Number(paidAmount) - grandTotal)}
                  </span>
                </div>
              )}

              {error && (
                <div className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              {successRef && (
                <div className="text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900 rounded-md px-3 py-2">
                  {successRef}
                </div>
              )}

              <div className="flex gap-2">
                {!selectedOpenOrder ? (
                  <Button
                    className="flex-1 h-11 sm:h-10 text-base"
                    disabled={saving || !cart.length}
                    onClick={handleCreateOpenOrder}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </span>
                    ) : (
                      'Create Open Order'
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 h-11 sm:h-10 text-base bg-emerald-600 hover:bg-emerald-700"
                    disabled={saving || !cart.length}
                    onClick={handleCompletePayment}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      'Complete Payment'
                    )}
                  </Button>
                )}
                {selectedOpenOrder && (
                  <Button
                    variant="outline"
                    className="h-11 sm:h-10"
                    onClick={() => {
                      setSelectedOpenOrder(null);
                      setCart([]);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Sales & Open Orders */}
        <div className="w-full lg:w-[30%] flex flex-col h-full min-w-0 space-y-3">
          {/* Open Orders Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col h-1/2 min-h-0 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight p-3 sm:p-4 border-b border-slate-800 flex-shrink-0">
              Open Orders ({openOrders.length})
            </h2>

            <div className="flex-1 overflow-auto p-3">
              <div className="space-y-2">
                {loadingOpenOrders && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      <p className="text-xs text-slate-500">Loading...</p>
                    </div>
                  </div>
                )}

                {!loadingOpenOrders && !openOrders.length && (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500">No open orders</p>
                  </div>
                )}

                {openOrders.map((order) => (
                  <div
                    key={order._id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                      selectedOpenOrder === order._id
                        ? 'bg-amber-900/30 border border-amber-700/50'
                        : 'bg-slate-800/30 hover:bg-slate-800/50'
                    }`}
                    onClick={() => handleSelectOpenOrder(order)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium truncate">
                          {order.reference || order._id.slice(-6)}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-900/30">
                          OPEN
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {order.type} {order.table ? `- Table ${order.table.name}` : ''}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs font-medium font-mono">
                        {formatCurrency(order.grandTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sales Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col h-1/2 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                Recent Sales
              </h2>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800/50 transition-colors"
                onClick={loadRecentSales}
                disabled={loadingSales}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {loadingSales ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3">
              <div className="space-y-2">
                {loadingSales && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      <p className="text-xs text-slate-500">Loading...</p>
                    </div>
                  </div>
                )}

                {!loadingSales && !recentSales.length && (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-500">No recent sales</p>
                  </div>
                )}

                {recentSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      router.push(`/dashboard/pos/receipt/${sale._id}`)
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium truncate group-hover:text-white">
                          {sale.reference || sale._id.slice(-6)}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full ${
                            sale.status === 'COMPLETED'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                              : sale.status === 'OPEN'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {formatDate(sale.createdAt)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs font-medium font-mono">
                        {formatCurrency(sale.grandTotal)}
                      </div>
                      {sale.balance > 0 && (
                        <div className="text-[9px] text-amber-400">
                          Due: {formatCurrency(sale.balance)}
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
    </div>
  );
}