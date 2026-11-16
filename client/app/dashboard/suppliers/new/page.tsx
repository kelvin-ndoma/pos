// client/app/dashboard/suppliers/new/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient'; // Added import

export default function NewSupplierPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        contactPerson: contactPerson || undefined,
        notes: notes || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/suppliers`,
        {
          method: 'POST',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify(body),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }

      router.push('/dashboard/suppliers');
    } catch (e: any) {
      setError(e.message || 'Failed to create supplier');
    } finally {
      setSaving(false);
    }
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
            New supplier
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@acme.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Address</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Business St, City, Country"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Contact person</label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Notes</label>
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 min-h-[80px] placeholder:text-slate-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {saving ? 'Creating…' : 'Create supplier'}
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