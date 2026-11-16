// client/app/dashboard/settings/team/page.tsx
'use client';

import { useEffect, useState } from 'react';
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

type TenantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

type TenantUser = {
  _id: string;
  tenant: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  roles: TenantRole[];
};

const ALL_ROLES: TenantRole[] = [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'VIEWER',
];

const ROLE_DESCRIPTIONS: Record<TenantRole, string> = {
  OWNER: 'Full access, can manage billing and delete tenant',
  ADMIN: 'Can manage team and settings',
  MANAGER: 'Can create and edit all data',
  CASHIER: 'Can process sales and view inventory',
  VIEWER: 'Read-only access',
};

export default function TeamPage() {
  const [items, setItems] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<TenantRole>('VIEWER');
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenant-users`,
        {
          headers: authHeaders(), // Using authHeaders instead of manual token handling
        },
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || 'Failed to load team');
      }

      const list = Array.isArray(body) ? body : [];
      setItems(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load team');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleRoleChange(userId: string, value: string) {
    const role = value as TenantRole;

    setItems(prev =>
      prev.map(tu =>
        tu.user && tu.user._id === userId ? { ...tu, roles: [role] } : tu,
      ),
    );
  }

  async function handleSaveRoles(userId: string, roles: TenantRole[]) {
    try {
      setSavingUserId(userId);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenant-users`,
        {
          method: 'PUT',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify({ userId, roles }),
        },
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update roles');
      }

      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to update roles');
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleAddMember() {
    if (!newName.trim() || !newEmail.trim()) {
      setError('Name and email are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenant-users`,
        {
          method: 'POST',
          headers: authHeaders(), // Using authHeaders instead of manual token handling
          body: JSON.stringify({
            name: newName.trim(),
            email: newEmail.trim(),
            role: newRole,
          }),
        },
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to add team member');
      }

      setNewName('');
      setNewEmail('');
      setNewRole('VIEWER');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to add team member');
    } finally {
      setAdding(false);
    }
  }

  const filtered = items.filter(tu => {
    if (!tu.user) return false;
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      tu.user.name.toLowerCase().includes(f) ||
      tu.user.email.toLowerCase().includes(f)
    );
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Team & roles
          </h1>
          <p className="text-xs text-slate-400">
            Manage who can access this tenant and what they can do.
          </p>
        </div>
        <Input
          placeholder="Filter by name or email..."
          className="h-8 w-56 text-xs"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
          {error}
        </p>
      )}

      {/* Add member form */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-slate-200">
          Add team member
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            placeholder="Full name"
            className="h-8 text-xs"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Input
            placeholder="Email address"
            type="email"
            className="h-8 text-xs"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
          />
          <div className="relative">
            <select
              className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-50 appearance-none"
              value={newRole}
              onChange={e => setNewRole(e.target.value as TenantRole)}
            >
              {ALL_ROLES.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              ▼
            </div>
          </div>
          <Button
            size="sm"
            disabled={adding}
            onClick={handleAddMember}
          >
            {adding ? 'Adding…' : 'Add member'}
          </Button>
        </div>
        <p className="text-[10px] text-slate-500">
          New users will receive an email invitation to join.
        </p>
      </div>

      {/* Role legend */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Role descriptions
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map(role => (
            <div key={role} className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-slate-300 min-w-[60px]">
                {role}:
              </span>
              <span className="text-[10px] text-slate-500">
                {ROLE_DESCRIPTIONS[role]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Team table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <Table className="text-xs">
          <Thead>
            <Tr>
              <Th className="w-1/4">User</Th>
              <Th className="w-1/3">Email</Th>
              <Th className="w-1/4">Role</Th>
              <Th className="w-1/6 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading && (
              <Tr>
                <Td
                  colSpan={4}
                  className="py-8 text-center text-slate-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                    <span>Loading team members…</span>
                  </div>
                </Td>
              </Tr>
            )}

            {!loading && !filtered.length && (
              <Tr>
                <Td
                  colSpan={4}
                  className="py-8 text-center text-slate-500"
                >
                  {filter ? 'No matching team members found.' : 'No team members yet.'}
                </Td>
              </Tr>
            )}

            {filtered.map(tu => {
              if (!tu.user) {
                return null;
              }

              const currentRole: TenantRole =
                (tu.roles && tu.roles[0]) || 'VIEWER';

              return (
                <Tr key={tu._id} className="hover:bg-slate-800/40">
                  <Td className="font-medium">{tu.user.name}</Td>
                  <Td className="text-slate-300">{tu.user.email}</Td>
                  <Td>
                    <div className="relative max-w-[140px]">
                      <select
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-50 appearance-none"
                        value={currentRole}
                        onChange={e =>
                          handleRoleChange(tu.user!._id, e.target.value)
                        }
                      >
                        {ALL_ROLES.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        ▼
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingUserId === tu.user._id}
                      onClick={() =>
                        handleSaveRoles(tu.user!._id, [currentRole])
                      }
                      className="min-w-[60px]"
                    >
                      {savingUserId === tu.user._id
                        ? 'Saving…'
                        : 'Save'}
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}