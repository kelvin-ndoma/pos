// client/app/dashboard/inventory/[id]/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authHeaders } from '@/lib/apiClient'; // Added import

type Category = {
  _id: string;
  name: string;
};

type TaxRule = {
  _id: string;
  name: string;
  code: string;
  rate: number;
};

type Product = {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: Category | string | null;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  quantityOnHand?: number;
  isActive?: boolean;
  trackInventory?: boolean;
  taxRule?: TaxRule | string | null;
};

type UpdateProductPayload = {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  quantityOnHand: number;
  isActive: boolean;
  trackInventory: boolean;
  categoryId?: string;
  taxRule?: string;
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryId =
    typeof product?.category === 'string'
      ? product.category
      : (product?.category?._id as string | undefined) || '';

  const taxRuleId =
    typeof product?.taxRule === 'string'
      ? product.taxRule
      : (product?.taxRule?._id as string | undefined) || '';

  async function loadProduct() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${params.id}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load product');
      }

      const data = await res.json();
      setProduct(data);
    } catch (e) {
      console.error('Failed to load product', e);
      setProduct(null);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );
      if (!res.ok) return;
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  }

  async function loadTaxRules() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );
      if (!res.ok) return;
      const data: TaxRule[] = await res.json();
      setTaxRules(data);
    } catch (e) {
      console.error('Failed to load tax rules', e);
    }
  }

  useEffect(() => {
    Promise.all([loadProduct(), loadCategories(), loadTaxRules()]);
  }, [params.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setSaving(true);

    try {
      const payload: UpdateProductPayload = {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        costPrice: Number(product.costPrice ?? 0),
        salePrice: Number(product.salePrice ?? 0),
        quantityOnHand:
          typeof product.quantityOnHand === 'number'
            ? product.quantityOnHand
            : 0,
        isActive: product.isActive ?? true,
        trackInventory: product.trackInventory ?? true,
      };

      if (categoryId) {
        payload.categoryId = categoryId;
      }

      if (taxRuleId) {
        payload.taxRule = taxRuleId;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product._id}`,
        {
          method: 'PUT',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">Edit product</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
            <p className="text-sm text-slate-400">Loading product details…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">Edit product</h2>
        </div>
        <div className="bg-amber-950/20 border border-amber-900 rounded-lg p-6 text-center">
          <svg className="h-12 w-12 text-amber-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-400 mb-3">
            {error || 'Product not found.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/dashboard/inventory')}
          >
            View all products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          ←
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">
          Edit product: {product.name}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Basic Info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200">Basic Information</h3>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              required
              value={product.name}
              onChange={(e) =>
                setProduct((p) =>
                  p ? { ...p, name: e.target.value } : p,
                )
              }
              placeholder="Product name"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">SKU</label>
              <Input
                value={product.sku || ''}
                onChange={(e) =>
                  setProduct((p) =>
                    p ? { ...p, sku: e.target.value.toUpperCase() } : p,
                  )
                }
                placeholder="SKU-001"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Barcode</label>
              <Input
                value={product.barcode || ''}
                onChange={(e) =>
                  setProduct((p) =>
                    p ? { ...p, barcode: e.target.value } : p,
                  )
                }
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              value={product.description || ''}
              onChange={(e) =>
                setProduct((p) =>
                  p ? { ...p, description: e.target.value } : p,
                )
              }
              placeholder="Product description (optional)"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 min-h-[80px] placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category & Tax */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200">Classification</h3>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Category</label>
            <div className="relative">
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 appearance-none"
                value={categoryId}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          category: e.target.value || null,
                        }
                      : p,
                  )
                }
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Tax rule (VAT)</label>
            <div className="relative">
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 appearance-none"
                value={taxRuleId}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          taxRule: e.target.value || null,
                        }
                      : p,
                  )
                }
              >
                <option value="">No tax / default</option>
                {taxRules.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200">Pricing & Inventory</h3>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Cost price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={product.costPrice ?? ''}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          costPrice:
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value),
                        }
                      : p,
                  )
                }
                placeholder="0.00"
                className="font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Sale price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={product.salePrice ?? ''}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          salePrice:
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value),
                        }
                      : p,
                  )
                }
                placeholder="0.00"
                className="font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Quantity</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={product.quantityOnHand ?? ''}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? {
                          ...p,
                          quantityOnHand:
                            e.target.value === ''
                              ? undefined
                              : parseInt(e.target.value, 10),
                        }
                      : p,
                  )
                }
                placeholder="0"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.isActive ?? true}
                onChange={(e) =>
                  setProduct((p) =>
                    p ? { ...p, isActive: e.target.checked } : p,
                  )
                }
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.trackInventory ?? true}
                onChange={(e) =>
                  setProduct((p) =>
                    p
                      ? { ...p, trackInventory: e.target.checked }
                      : p,
                  )
                }
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              Track inventory
            </label>
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1 flex items-center gap-1">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </span>
            ) : (
              'Save changes'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}