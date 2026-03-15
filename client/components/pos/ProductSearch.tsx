// client/components/pos/ProductSearch.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';

type ProductSearchProps = {
  products?: { _id: string; name: string; sku?: string; price?: number }[];
};

export default function ProductSearch({ products = [] }: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">
          Products
        </h3>
        <Input
          placeholder="Search by name or SKU"
          className="h-8 text-xs max-w-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-80 overflow-auto space-y-1 text-xs">
        {filtered.map((p) => (
          <button
            key={p._id}
            type="button"
            className="w-full text-left rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1.5 hover:border-emerald-500 hover:bg-slate-900 transition-colors"
            // onClick={() => addToCart(p)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">{p.name}</span>
              <span className="text-[11px] text-slate-400">
                {p.sku || '—'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {p.price != null ? `KSh ${p.price}` : 'No price'}
            </p>
          </button>
        ))}
        {!filtered.length && (
          <p className="text-slate-500 text-[11px]">
            No products match &quot;{query}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
