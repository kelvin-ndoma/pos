// client/hooks/useCurrentUser.ts
'use client';

import { useEffect, useState } from 'react';

export type PlatformRole =
  | 'PLATFORM_OWNER'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'NONE';

export type TenantRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'VIEWER';

export type CurrentUser = {
  id: string;
  tenant: string;
  name: string;
  email: string;
  status: string;
  role: TenantRole;
  platformRole?: PlatformRole;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const raw = window.localStorage.getItem('currentUser');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CurrentUser;
      setUser(parsed);
    } catch {
      // If corrupt, clear it
      window.localStorage.removeItem('currentUser');
      setUser(null);
    }
  }, []);

  return user;
}
