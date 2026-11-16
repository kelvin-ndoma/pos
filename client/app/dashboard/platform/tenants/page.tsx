// client/app/dashboard/platform/tenants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authHeaders } from '@/lib/apiClient'; // Added import

type TenantRow = {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
  };
};

export default function PlatformTenantsPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [items, setItems] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isPlatformAdmin =
    user &&
    (user.platformRole === 'PLATFORM_OWNER' ||
      user.platformRole === 'PLATFORM_ADMIN');

  useEffect(() => {
    if (!user) return;

    if (!isPlatformAdmin) {
      router.push('/dashboard');
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/platform/tenants`,
          {
            headers: authHeaders(), // Using authHeaders instead of manual token handling
          },
        );

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body.error || 'Failed to load tenants');
        }

        setItems(Array.isArray(body) ? body : []);
      } catch (e: any) {
        setError(e.message || 'Failed to load tenants');
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, isPlatformAdmin, router]);

  async function handleToggleStatus(tenant: TenantRow) {
    try {
      setUpdatingId(tenant._id);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/platform/tenants/${tenant._id}/status`,
        {
          method: 'PATCH',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify({
            isActive: tenant.isActive === false ? true : false,
          }),
        },
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || 'Failed to update tenant');
      }

      const updated = body as TenantRow;

      setItems((prev) =>
        prev.map((t) => (t._id === tenant._id ? { ...t, ...updated } : t)),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to update tenant');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleOpenTenantDashboard(tenant: TenantRow) {
    if (typeof window !== 'undefined') {
      // store the tenant being viewed by the platform owner
      localStorage.setItem('activeTenantId', tenant._id);
      // Optional: store a flag to indicate we're in platform view mode
      localStorage.setItem('platformViewMode', 'true');
    }
    router.push('/dashboard');
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusBadge(tenant: TenantRow) {
    if (tenant.isActive === false) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/40 text-amber-400 border border-amber-900/40">
          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
          Disabled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
        Active
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-rose-950/20 border border-rose-900 rounded-lg p-6 text-center max-w-md">
          <svg className="h-12 w-12 text-rose-500/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-rose-400 font-medium mb-2">Access Denied</p>
          <p className="text-xs text-slate-400">
            You need platform administrator privileges to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tenants</h2>
          <p className="text-xs text-slate-400">
            View and manage all tenants in the platform.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
          Total: {items.length}
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Tenants table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead className="bg-slate-900/95 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Name</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Slug</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Created</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                      <p className="text-xs text-slate-400">Loading tenants…</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>No tenants found.</span>
                    </div>
                  </td>
                </tr>
              )}

              {items.map((t) => (
                <tr 
                  key={t._id} 
                  className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{t.name}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded text-[10px]">
                      {t.slug}
                    </code>
                  </td>
                  <td className="px-3 py-2.5">
                    {getStatusBadge(t)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t)}
                        disabled={updatingId === t._id}
                        className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors
                          ${t.isActive === false 
                            ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-500/10' 
                            : 'border-amber-600 text-amber-400 hover:bg-amber-500/10'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {updatingId === t._id ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {t.isActive === false ? 'Enabling...' : 'Disabling...'}
                          </span>
                        ) : (
                          t.isActive === false ? 'Enable' : 'Disable'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTenantDashboard(t)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Open dashboard
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
        <div className="flex items-start gap-2 text-[10px] text-slate-500">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Platform administrators can manage tenant status and access any tenant's dashboard. 
            When you open a tenant dashboard, the active tenant will be switched to that tenant.
          </span>
        </div>
      </div>
    </div>
  );
}