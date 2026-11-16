// client/app/dashboard/platform/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type PlatformUserRow = {
  _id: string;
  name: string;
  email: string;
  tenantName?: string;
  tenantSlug?: string;
  platformRole?: string;
  status?: string;
  createdAt: string;
};

export default function PlatformUsersPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [items, setItems] = useState<PlatformUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/platform/users`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body.error || 'Failed to load users');
        }

        setItems(Array.isArray(body) ? body : []);
      } catch (e: any) {
        setError(e.message || 'Failed to load users');
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, isPlatformAdmin, router]);

  if (!user) {
    return (
      <div className="p-4 text-xs text-slate-400">
        Loading session…
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="p-4 text-xs text-rose-400">
        Platform access denied.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-base font-semibold">Users</h2>
        <p className="text-xs text-slate-400">
          All users across all tenants.
        </p>
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Tenant</th>
              <th className="px-3 py-2 text-left">Platform role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Loading…
                </td>
              </tr>
            )}

            {!loading && !items.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            )}

            {items.map((u) => (
              <tr key={u._id} className="border-t border-slate-800">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2 text-slate-300">{u.email}</td>
                <td className="px-3 py-2 text-slate-300">
                  {u.tenantName || '-'}
                  {u.tenantSlug ? (
                    <span className="text-slate-500"> ({u.tenantSlug})</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {u.platformRole || 'NONE'}
                </td>
                <td className="px-3 py-2">
                  {u.status === 'ACTIVE' ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-amber-400">
                      {u.status || 'Unknown'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
