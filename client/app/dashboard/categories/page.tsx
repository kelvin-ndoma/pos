// client/app/dashboard/categories/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/Table';

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
};

function slugifyName(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // spaces/invalid -> dash
    .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes

  if (!base) return '';
  if (base.length >= 2) return base;
  return `${base}${base}`; // "b" -> "bb"
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) {
        console.error('Failed to load categories', await res.text());
        return;
      }

      const data: Category[] = await res.json();
      setItems(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const slug = slugifyName(name);

      const body = {
        name,
        slug,
        description: description || undefined,
        isActive,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
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
        console.error('create category error', data);
        throw new Error(data.error || 'Failed to create category');
      }

      setName('');
      setDescription('');
      setIsActive(true);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ isActive: !current }),
        },
      );

      if (!res.ok) {
        console.error('update category error', await res.text());
        return;
      }

      await loadCategories();
    } catch (e) {
      console.error('Failed to update category', e);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <p className="text-xs text-slate-400">
            Manage product categories for your inventory.
          </p>
        </div>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
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
              placeholder="Beverages"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label
              htmlFor="isActive"
              className="block text-xs font-medium text-slate-200"
            >
              Status
            </label>
            <div className="flex h-9 items-center gap-2 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
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

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create category'}
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40">
        <Table className="text-xs">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Description</Th>
              <Th className="text-right">Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((c) => (
              <Tr key={c._id}>
                <Td>{c.name}</Td>
                <Td>{c.slug}</Td>
                <Td>{c.description || '—'}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(c._id, c.isActive)}
                    className={`inline-flex items-center rounded px-2 py-1 text-[11px] ${
                      c.isActive
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </Td>
              </Tr>
            ))}

            {!items.length && !loading && (
              <Tr>
                <Td colSpan={4} className="py-6 text-center text-slate-500">
                  No categories yet. Create your first category above.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
