// client/components/pos/Cart.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export default function Cart() {
  const [items] = useState<CartItem[]>([]);

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-slate-100 mb-2">Cart</h3>
      <div className="flex-1 space-y-2 text-xs text-slate-200 overflow-auto">
        {items.length === 0 && (
          <p className="text-slate-500 text-xs">
            No items yet. Add products from the search.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md bg-slate-900/70 px-2 py-1.5"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-[11px] text-slate-400">
                {item.quantity} × KSh {item.price}
              </p>
            </div>
            <p className="text-[11px] font-semibold">
              KSh {item.quantity * item.price}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Total</span>
          <span className="font-semibold">KSh {total}</span>
        </div>
        <Button className="w-full h-8 text-xs" disabled={items.length === 0}>
          Charge customer
        </Button>
      </div>
    </div>
  );
}
