// client/app/dashboard/inventory/new/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

type CreateProductPayload = {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  quantityOnHand?: number;
  isActive: boolean;
  trackInventory: boolean;
  taxRule?: string;
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
        const [catRes, taxRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
            { headers: authHeaders() }, // Using authHeaders instead of manual token handling
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax`, // Fixed endpoint from tax-rules to tax
            { headers: authHeaders() }, // Using authHeaders instead of manual token handling
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
        setError('Failed to load categories and tax rules');
      }
    }

    loadInitialData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!name.trim()) {
        throw new Error('Product name is required');
      }

      const costPriceNum = parseFloat(costPrice);
      const salePriceNum = parseFloat(salePrice);

      if (isNaN(costPriceNum) || costPriceNum < 0) {
        throw new Error('Cost price must be a valid positive number');
      }

      if (isNaN(salePriceNum) || salePriceNum < 0) {
        throw new Error('Sale price must be a valid positive number');
      }

      const payload: CreateProductPayload = {
        name: name.trim(),
        costPrice: costPriceNum,
        salePrice: salePriceNum,
        isActive,
        trackInventory,
      };

      // optional fields
      if (sku.trim()) payload.sku = sku.trim().toUpperCase();
      if (barcode.trim()) payload.barcode = barcode.trim();
      if (categoryId) payload.categoryId = categoryId;
      if (description.trim()) payload.description = description.trim();
      if (quantityOnHand && quantityOnHand !== '') {
        const qty = parseInt(quantityOnHand, 10);
        if (!isNaN(qty) && qty >= 0) {
          payload.quantityOnHand = qty;
        }
      }

      // tax rule: send as taxRule (ObjectId string)
      if (taxRuleId) {
        payload.taxRule = taxRuleId;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`,
        {
          method: 'POST',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
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
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          ←
        </Button>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Add product
          </h2>
          <p className="text-xs text-slate-400">
            Create a new product for your inventory.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-200">Basic Information</h3>
          
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-200"
            >
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coca Cola 500ml"
              className="text-sm"
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
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Leave blank to auto-generate"
                className="font-mono text-xs"
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
                className="font-mono text-xs"
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
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 min-h-[80px] placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-200">Classification</h3>
          
          <div className="space-y-1">
            <label
              htmlFor="categoryId"
              className="block text-xs font-medium text-slate-200"
            >
              Category
            </label>
            <div className="relative">
              <select
                id="categoryId"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 appearance-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="taxRule"
              className="block text-xs font-medium text-slate-200"
            >
              Tax rule
            </label>
            <div className="relative">
              <select
                id="taxRule"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 appearance-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-200">Pricing & Inventory</h3>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                htmlFor="costPrice"
                className="block text-xs font-medium text-slate-200"
              >
                Cost price <span className="text-rose-400">*</span>
              </label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="80.00"
                className="font-mono"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="salePrice"
                className="block text-xs font-medium text-slate-200"
              >
                Sale price <span className="text-rose-400">*</span>
              </label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="120.00"
                className="font-mono"
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
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
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

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/inventory')}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </span>
            ) : (
              'Save product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}