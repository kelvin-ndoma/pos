// client/app/dashboard/platform/billing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function PlatformBillingPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold">Billing</h2>
        <p className="text-xs text-slate-400">
          Platform-wide billing overview (coming soon).
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300">
        <p>
          Here you will see usage per tenant, plan, and revenue metrics.
        </p>
        <p className="mt-2 text-slate-400">
          For now this is a placeholder so you can wire up navigation and
          permissions.
        </p>
      </div>
    </div>
  );
}
