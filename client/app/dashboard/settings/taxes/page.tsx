// client/app/dashboard/settings/taxes/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient'; // Added import

type TaxRule = {
  _id: string;
  name: string;
  code: string;
  type: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
  rate: number;
  isDefault: boolean;
};

type FormState = {
  id?: string;
  name: string;
  code: string;
  type: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
  rate: string;
  isDefault: boolean;
};

const TAX_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard (taxable)',
  ZERO_RATED: 'Zero-rated (0%)',
  EXEMPT: 'Exempt',
};

export default function TaxSettingsPage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    code: '',
    type: 'STANDARD',
    rate: '',
    isDefault: false,
  });

  const isEditing = !!form.id;

  async function loadRules() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || 'Failed to load tax rules');
      }

      setRules(Array.isArray(body) ? body : body.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tax rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function resetForm() {
    setForm({
      id: undefined,
      name: '',
      code: '',
      type: 'STANDARD',
      rate: '',
      isDefault: false,
    });
    setError(null);
    setSuccess(null);
  }

  function handleEdit(rule: TaxRule) {
    setForm({
      id: rule._id,
      name: rule.name,
      code: rule.code,
      type: rule.type,
      rate: String(rule.rate),
      isDefault: rule.isDefault,
    });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        rate: Number(form.rate),
        isDefault: form.isDefault,
      };

      if (!payload.name) {
        throw new Error('Name is required');
      }
      if (!payload.code) {
        throw new Error('Code is required');
      }
      if (isNaN(payload.rate) || payload.rate < 0 || payload.rate > 100) {
        throw new Error('Rate must be a number between 0 and 100');
      }

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/${form.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(), // Using authHeaders instead of manual token handling
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || 'Failed to save tax rule');
      }

      setSuccess(isEditing ? 'Tax rule updated successfully' : 'Tax rule created successfully');
      await loadRules();
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to save tax rule');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Tax rules
        </h1>
        <p className="text-xs text-slate-400">
          Manage VAT rates and codes used on your products.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold">
            {isEditing ? 'Edit tax rule' : 'New tax rule'}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-200"
            >
              Name <span className="text-rose-400">*</span>
            </label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="VAT 16%"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="code"
              className="block text-xs font-medium text-slate-200"
            >
              Code <span className="text-rose-400">*</span>
            </label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="VAT16"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label
              htmlFor="type"
              className="block text-xs font-medium text-slate-200"
            >
              Type
            </label>
            <div className="relative">
              <select
                id="type"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 appearance-none"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as FormState['type'],
                  }))
                }
              >
                <option value="STANDARD">Standard (taxable)</option>
                <option value="ZERO_RATED">Zero-rated (0%)</option>
                <option value="EXEMPT">Exempt</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="rate"
              className="block text-xs font-medium text-slate-200"
            >
              Rate (%) <span className="text-rose-400">*</span>
            </label>
            <Input
              id="rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, rate: e.target.value }))
              }
              placeholder="16"
              required
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isDefault: e.target.checked,
                  }))
                }
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              Default for new products
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900 rounded-md px-2 py-1">
            {success}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isEditing ? 'Updating…' : 'Creating…'}
              </span>
            ) : isEditing ? (
              'Update rule'
            ) : (
              'Create rule'
            )}
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Existing rules</h2>
          <span className="text-[11px] text-slate-500">
            {rules.length} rule{rules.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
              <p className="text-xs text-slate-400">Loading tax rules…</p>
            </div>
          </div>
        ) : !rules.length ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No tax rules yet. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-2 text-left font-medium">Name</th>
                  <th className="py-2 text-left font-medium">Code</th>
                  <th className="py-2 text-left font-medium">Type</th>
                  <th className="py-2 text-right font-medium">Rate %</th>
                  <th className="py-2 text-center font-medium">Default</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule._id}
                    className="border-b border-slate-900/60 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-2">{rule.name}</td>
                    <td className="py-2 font-mono text-xs">{rule.code}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium
                        ${rule.type === 'STANDARD' ? 'bg-blue-950/40 text-blue-300 border border-blue-800' : ''}
                        ${rule.type === 'ZERO_RATED' ? 'bg-green-950/40 text-green-300 border border-green-800' : ''}
                        ${rule.type === 'EXEMPT' ? 'bg-slate-800 text-slate-300 border border-slate-700' : ''}
                      `}>
                        {rule.type === 'STANDARD' ? 'Standard' : 
                         rule.type === 'ZERO_RATED' ? 'Zero-rated' : 'Exempt'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono">
                      {rule.rate.toFixed(2)}%
                    </td>
                    <td className="py-2 text-center">
                      {rule.isDefault ? (
                        <span className="text-emerald-400 text-sm">✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(rule)}
                        className="text-[11px] text-slate-400 hover:text-slate-100 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}