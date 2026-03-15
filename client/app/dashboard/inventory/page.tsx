'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/Table';

type Product = {
  _id: string;
  name: string;
  sku?: string;
  category?: { name: string };
  costPrice?: number;
  salePrice?: number;
  quantityOnHand?: number;
};

type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load(pageNum = 1, searchText = '') {
    setLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '20');
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

      const data = await res.json();
      console.log('products response', data);

      const paginated = data as Partial<Paginated<Product>>;

      setItems(Array.isArray(paginated.data) ? paginated.data : []);
      if (typeof paginated.page === 'number') {
        setPage(paginated.page);
      }
    } catch (e) {
      console.error('Failed to load products', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, '');
  }, []);

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete product');
      }

      // Optimistically remove from list
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      console.error('Failed to delete product', e);
      alert(
        e instanceof Error
          ? e.message
          : 'Failed to delete product',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Inventory
        </h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products..."
            className="h-8 w-40 text-xs"
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              load(1, v);
            }}
          />
          <Link href="/dashboard/inventory/new">
            <Button size="sm">Add product</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/40">
        <Table className="text-xs">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>SKU</Th>
              <Th>Category</Th>
              <Th className="text-right">Sale price</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(items ?? []).map((p) => (
              <Tr key={p._id} className="hover:bg-slate-800/60">
                <Td
                  onClick={() =>
                    window.location.assign(
                      `/dashboard/inventory/${p._id}`,
                    )
                  }
                  className="cursor-pointer"
                >
                  {p.name}
                </Td>
                <Td
                  onClick={() =>
                    window.location.assign(
                      `/dashboard/inventory/${p._id}`,
                    )
                  }
                  className="cursor-pointer"
                >
                  {p.sku || '—'}
                </Td>
                <Td
                  onClick={() =>
                    window.location.assign(
                      `/dashboard/inventory/${p._id}`,
                    )
                  }
                  className="cursor-pointer"
                >
                  {p.category?.name || '—'}
                </Td>
                <Td
                  className="text-right cursor-pointer"
                  onClick={() =>
                    window.location.assign(
                      `/dashboard/inventory/${p._id}`,
                    )
                  }
                >
                  {p.salePrice != null
                    ? `KSh ${p.salePrice}`
                    : '—'}
                </Td>
                <Td
                  className="text-right cursor-pointer"
                  onClick={() =>
                    window.location.assign(
                      `/dashboard/inventory/${p._id}`,
                    )
                  }
                >
                  {p.quantityOnHand != null
                    ? p.quantityOnHand
                    : 0}
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    className="text-[11px] text-rose-400 hover:text-rose-300 disabled:opacity-50"
                    onClick={() => handleDelete(p._id, p.name)}
                    disabled={deletingId === p._id}
                  >
                    {deletingId === p._id ? 'Deleting…' : 'Delete'}
                  </button>
                </Td>
              </Tr>
            ))}

            {!items?.length && !loading && (
              <Tr>
                <Td
                  colSpan={6}
                  className="py-6 text-center text-slate-500"
                >
                  No products yet. Click &quot;Add product&quot; to get
                  started.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
