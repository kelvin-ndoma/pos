// client/app/dashboard/suppliers/[id]/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient'; // Added import

type Supplier = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
};

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();

  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSupplier() {
    if (!id) {
      setError('Missing supplier id');
      setSupplier(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers/${id}`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load supplier');
      }

      setSupplier(data as Supplier);
      setError(null);
    } catch (e: any) {
      console.error('Failed to load supplier', e);
      setError(e.message || 'Failed to load supplier');
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supplier) return;

    setError(null);
    setSaving(true);

    try {
      const body = {
        name: supplier.name,
        email: supplier.email || undefined,
        phone: supplier.phone || undefined,
        address: supplier.address || undefined,
        contactPerson: supplier.contactPerson || undefined,
        notes: supplier.notes || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers/${supplier._id}`,
        {
          method: 'PUT',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify(body),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update supplier');
      }

      router.push('/dashboard/suppliers');
    } catch (e: any) {
      setError(e.message || 'Failed to update supplier');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full w-full px-0 py-4">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-1"
            >
              ← Back
            </Button>
            <h2 className="text-lg font-semibold tracking-tight">
              Edit supplier
            </h2>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800/50 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-800/50 rounded"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-slate-800/50 rounded"></div>
                <div className="h-10 bg-slate-800/50 rounded"></div>
              </div>
              <div className="h-10 bg-slate-800/50 rounded"></div>
              <div className="h-10 bg-slate-800/50 rounded"></div>
              <div className="h-20 bg-slate-800/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="h-full w-full px-0 py-4">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-1"
            >
              ← Back
            </Button>
            <h2 className="text-lg font-semibold tracking-tight">
              Edit supplier
            </h2>
          </div>
          <div className="bg-amber-950/20 border border-amber-900 rounded-md px-3 py-4 text-center">
            <p className="text-xs text-amber-400">
              {error || 'Supplier not found.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/suppliers')}
              className="mt-3"
            >
              View all suppliers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-1"
          >
            ← Back
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">
            Edit supplier
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              value={supplier.name}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, name: e.target.value } : s,
                )
              }
              required
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Email</label>
              <Input
                type="email"
                value={supplier.email || ''}
                onChange={(e) =>
                  setSupplier((s) =>
                    s ? { ...s, email: e.target.value } : s,
                  )
                }
                placeholder="contact@acme.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Phone</label>
              <Input
                value={supplier.phone || ''}
                onChange={(e) =>
                  setSupplier((s) =>
                    s ? { ...s, phone: e.target.value } : s,
                  )
                }
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Address</label>
            <Input
              value={supplier.address || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, address: e.target.value } : s,
                )
              }
              placeholder="123 Business St, City, Country"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Contact person</label>
            <Input
              value={supplier.contactPerson || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, contactPerson: e.target.value } : s,
                )
              }
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Notes</label>
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 min-h-[80px] placeholder:text-slate-500"
              value={supplier.notes || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, notes: e.target.value } : s,
                )
              }
              placeholder="Additional notes about the supplier..."
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
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
    </div>
  );
}