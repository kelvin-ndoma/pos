// client/app/dashboard/suppliers/[id]/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

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
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
      <p className="text-xs text-slate-400 px-2 py-2">
        Loading supplier…
      </p>
    );
  }

  if (!supplier) {
    return (
      <p className="text-xs text-slate-400 px-2 py-2">
        {error || 'Supplier not found.'}
      </p>
    );
  }

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="max-w-xl space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Edit supplier
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Name</label>
            <Input
              value={supplier.name}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, name: e.target.value } : s,
                )
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Email
              </label>
              <Input
                type="email"
                value={supplier.email || ''}
                onChange={(e) =>
                  setSupplier((s) =>
                    s ? { ...s, email: e.target.value } : s,
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Phone
              </label>
              <Input
                value={supplier.phone || ''}
                onChange={(e) =>
                  setSupplier((s) =>
                    s ? { ...s, phone: e.target.value } : s,
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Address
            </label>
            <Input
              value={supplier.address || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, address: e.target.value } : s,
                )
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Contact person
            </label>
            <Input
              value={supplier.contactPerson || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, contactPerson: e.target.value } : s,
                )
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Notes
            </label>
            <Input
              value={supplier.notes || ''}
              onChange={(e) =>
                setSupplier((s) =>
                  s ? { ...s, notes: e.target.value } : s,
                )
              }
            />
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
    </div>
  );
}
