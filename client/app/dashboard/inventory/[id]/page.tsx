// client/app/dashboard/inventory/[id]/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${params.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      console.error('Failed to load product', e);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
    loadProduct();
    loadCategories();
    loadTaxRules();
  }, [params.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setSaving(true);

    try {
      const token = localStorage.getItem('accessToken');

      const body: any = {
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
        body.categoryId = categoryId;
      }

      if (taxRuleId) {
        body.taxRule = taxRuleId;
      } else {
        body.taxRule = '';
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || 'Failed to update product');
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="text-xs text-slate-400">Loading…</p>;
  if (!product)
    return <p className="text-xs text-slate-400">Not found.</p>;

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">
        Edit product
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Name</label>
          <Input
            value={product.name}
            onChange={(e) =>
              setProduct((p) =>
                p ? { ...p, name: e.target.value } : p,
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">SKU</label>
            <Input
              value={product.sku || ''}
              onChange={(e) =>
                setProduct((p) =>
                  p ? { ...p, sku: e.target.value } : p,
                )
              }
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
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Category</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
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
        </div>

        {/* Tax rule selector */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">
            Tax rule (VAT)
          </label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
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
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Cost price
            </label>
            <Input
              type="number"
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
                            : e.target.valueAsNumber,
                      }
                    : p,
                )
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Sale price (VAT exclusive)
            </label>
            <Input
              type="number"
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
                            : e.target.valueAsNumber,
                      }
                    : p,
                )
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Quantity</label>
            <Input
              type="number"
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
                            : e.target.valueAsNumber,
                      }
                    : p,
                )
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">
            Description
          </label>
          <Input
            value={product.description || ''}
            onChange={(e) =>
              setProduct((p) =>
                p ? { ...p, description: e.target.value } : p,
              )
            }
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.isActive ?? true}
              onChange={(e) =>
                setProduct((p) =>
                  p ? { ...p, isActive: e.target.checked } : p,
                )
              }
            />
            Active
          </label>
          <label className="inline-flex items-center gap-2">
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
            />
            Track inventory
          </label>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? 'Saving…' : 'Save changes'}
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
