// client/app/dashboard/tables/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient';

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';

export default function NewTablePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [status, setStatus] = useState<TableStatus>('AVAILABLE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Table name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tables`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            name: name.trim(),
            area: area.trim() || undefined,
            capacity: capacity ? Number(capacity) : undefined,
            status,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create table');
      }

      setSuccess('Table created successfully');
      setName('');
      setArea('');
      setCapacity('');
      setStatus('AVAILABLE');

      setTimeout(() => {
        router.push('/dashboard/tables');
      }, 800);
    } catch (e: any) {
      setError(e?.message || 'Failed to create table');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full w-full px-2 sm:px-4 py-4">
      <div className="max-w-xl mx-auto bg-slate-950/70 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Create table
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Add a new table to your floor layout.
          </p>
        </div>

        {error && (
          <div className="text-xs sm:text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-xs sm:text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-md px-3 py-2">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs sm:text-sm text-slate-300">
              Table name
            </label>
            <Input
              placeholder="e.g. T1, Booth 3"
              className="h-9 sm:h-10 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs sm:text-sm text-slate-300">
                Area
              </label>
              <Input
                placeholder="e.g. Main, Terrace, Bar"
                className="h-9 sm:h-10 text-sm"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs sm:text-sm text-slate-300">
                Capacity
              </label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 4"
                className="h-9 sm:h-10 text-sm"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs sm:text-sm text-slate-300">
              Status
            </label>
            <select
              className="h-9 sm:h-10 w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 text-xs sm:text-sm text-slate-200"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TableStatus)
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={() => router.push('/dashboard/tables')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Create table'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
