// client/app/dashboard/suppliers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function loadSuppliers() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load suppliers');
      }

      setSuppliers(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load suppliers', e);
      setSuppliers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(suppliers);
    } else {
      setFiltered(
        suppliers.filter((s) =>
          [s.name, s.email, s.phone, s.contactPerson] // Added contactPerson to search
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q)),
        ),
      );
    }
  }, [search, suppliers]);

  return (
    <div className="h-full w-full px-0 py-4">
      <div className="flex h-full w-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Suppliers
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <Input
              className="h-8 w-56 text-xs"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              className="h-8 text-xs"
              onClick={() => router.push('/dashboard/suppliers/new')}
            >
              New supplier
            </Button>
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="max-h-full overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Contact Person / Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Phone
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/suppliers/${s._id}`)
                    }
                  >
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2">
                      {s.contactPerson && (
                        <div className="text-slate-300">{s.contactPerson}</div>
                      )}
                      {s.email && (
                        <div className="text-xs text-slate-400">{s.email}</div>
                      )}
                      {!s.contactPerson && !s.email && '—'}
                    </td>
                    <td className="px-3 py-2">{s.phone || '—'}</td>
                    <td className="px-3 py-2">
                      {s.address?.slice(0, 40) || '—'}
                      {s.address && s.address.length > 40 && '…'}
                    </td>
                  </tr>
                ))}

                {!filtered.length && !loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="px-3 py-2">
              <p className="text-[11px] text-slate-400 animate-pulse">
                Loading suppliers…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}