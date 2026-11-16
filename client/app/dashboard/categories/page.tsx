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
import { authHeaders } from '@/lib/apiClient'; // Added import

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load categories');
      }

      const data: Category[] = await res.json();
      setItems(data);
    } catch (e) {
      console.error('Failed to load categories', e);
      setError('Failed to load categories');
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
      const slug = slugifyName(name);

      if (!slug) {
        throw new Error('Invalid category name');
      }

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
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
      setUpdatingId(id);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${id}`,
        {
          method: 'PUT',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify({ isActive: !current }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update category');
      }

      await loadCategories();
    } catch (e: any) {
      console.error('Failed to update category', e);
      setError(e.message || 'Failed to update category');
    } finally {
      setUpdatingId(null);
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
        <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
          Total: {items.length}
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
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beverages"
              className="text-sm"
            />
            {name && (
              <p className="text-[10px] text-slate-500">
                Slug: <code className="bg-slate-800 px-1 py-0.5 rounded">{slugifyName(name) || '—'}</code>
              </p>
            )}
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label
              htmlFor="isActive"
              className="block text-xs font-medium text-slate-200"
            >
              Status
            </label>
            <div className="flex h-9 items-center gap-2 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
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
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 min-h-[60px] placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1 flex items-center gap-1">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </span>
            ) : (
              'Create category'
            )}
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
              <p className="text-xs text-slate-400">Loading categories…</p>
            </div>
          </div>
        ) : (
          <Table className="text-xs">
            <Thead>
              <Tr>
                <Th className="w-1/3">Name</Th>
                <Th className="w-1/4">Slug</Th>
                <Th className="w-1/3">Description</Th>
                <Th className="w-1/6 text-right">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((c) => (
                <Tr key={c._id} className="hover:bg-slate-800/40 transition-colors">
                  <Td className="font-medium">{c.name}</Td>
                  <Td>
                    <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-[10px]">
                      {c.slug}
                    </code>
                  </Td>
                  <Td className="text-slate-300">
                    {c.description || <span className="text-slate-500">—</span>}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(c._id, c.isActive)}
                      disabled={updatingId === c._id}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors
                        ${c.isActive
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }
                        ${updatingId === c._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-60 cursor-pointer'}
                      `}
                    >
                      {updatingId === c._id ? (
                        <>
                          <span className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <span className={`w-1 h-1 rounded-full ${c.isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {c.isActive ? 'Active' : 'Inactive'}
                        </>
                      )}
                    </button>
                  </Td>
                </Tr>
              ))}

              {!items.length && (
                <Tr>
                  <Td colSpan={4} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>No categories yet.</span>
                      <span className="text-[10px] text-slate-600">
                        Create your first category using the form above.
                      </span>
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
        <div className="flex items-start gap-2 text-[10px] text-slate-500">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Categories help organize your products. Inactive categories won't appear in product dropdowns,
            but existing products will retain their category association.
          </span>
        </div>
      </div>
    </div>
  );
}