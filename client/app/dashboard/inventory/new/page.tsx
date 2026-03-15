// client/app/dashboard/inventory/new/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [quantityOnHand, setQuantityOnHand] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [taxRuleId, setTaxRuleId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories and tax rules for dropdowns
  useEffect(() => {
    async function loadInitialData() {
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

        const headers: HeadersInit = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [catRes, taxRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
            { headers },
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax-rules`,
            { headers },
          ),
        ]);

        if (catRes.ok) {
          const catData: Category[] = await catRes.json();
          setCategories(catData);
        } else {
          console.error(
            'Failed to load categories',
            await catRes.text(),
          );
        }

        if (taxRes.ok) {
          const taxData: TaxRule[] = await taxRes.json();
          setTaxRules(taxData);
        } else {
          console.error(
            'Failed to load tax rules',
            await taxRes.text(),
          );
        }
      } catch (e) {
        console.error('Failed to load initial data', e);
      }
    }

    loadInitialData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const body: any = {
        name,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
      };

      // optional fields; backend can auto-generate sku/barcode
      if (sku.trim()) body.sku = sku.trim();
      if (barcode.trim()) body.barcode = barcode.trim();
      if (categoryId) body.categoryId = categoryId;
      if (description.trim()) body.description = description.trim();
      if (quantityOnHand !== '') {
        body.quantityOnHand = Number(quantityOnHand);
      }
      body.isActive = isActive;
      body.trackInventory = trackInventory;

      // tax rule: send as taxRule (ObjectId string)
      if (taxRuleId) {
        body.taxRule = taxRuleId;
      }

      console.log('create product payload', body);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('create product error', data);
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Add product
        </h2>
        <p className="text-xs text-slate-400">
          Create a new product for your inventory.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-xs font-medium text-slate-200"
          >
            Name
          </label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coca Cola 500ml"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="sku"
              className="block text-xs font-medium text-slate-200"
            >
              SKU (optional)
            </label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Leave blank to auto-generate"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="barcode"
              className="block text-xs font-medium text-slate-200"
            >
              Barcode (optional)
            </label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Leave blank to auto-generate"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="categoryId"
            className="block text-xs font-medium text-slate-200"
          >
            Category
          </label>
          <select
            id="categoryId"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
          <label
            htmlFor="taxRule"
            className="block text-xs font-medium text-slate-200"
          >
            Tax rule
          </label>
          <select
            id="taxRule"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
            value={taxRuleId}
            onChange={(e) => setTaxRuleId(e.target.value)}
          >
            <option value="">No tax / use default</option>
            {taxRules.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.rate}%)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label
              htmlFor="costPrice"
              className="block text-xs font-medium text-slate-200"
            >
              Cost price
            </label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="80"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="salePrice"
              className="block text-xs font-medium text-slate-200"
            >
              Sale price (VAT exclusive)
            </label>
            <Input
              id="salePrice"
              type="number"
              min="0"
              step="0.01"
              required
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="120"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="quantityOnHand"
              className="block text-xs font-medium text-slate-200"
            >
              Quantity
            </label>
            <Input
              id="quantityOnHand"
              type="number"
              min="0"
              step="1"
              value={quantityOnHand}
              onChange={(e) => setQuantityOnHand(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="description"
            className="block text-xs font-medium text-slate-200"
          >
            Description
          </label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(e) => setTrackInventory(e.target.checked)}
            />
            Track inventory
          </label>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/inventory')}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
