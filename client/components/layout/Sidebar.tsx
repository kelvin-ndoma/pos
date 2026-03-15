// client/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type NavItem =
  | { href: string; label: string; children?: undefined }
  | {
      label: string;
      href?: string;
      children: { href: string; label: string }[];
    };

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/inventory', label: 'Inventory' },
  { href: '/dashboard/categories', label: 'Categories' },
  { href: '/dashboard/pos', label: 'POS' },
  { href: '/dashboard/sales', label: 'Sales' },
  {
    label: 'Purchases',
    href: '/dashboard/purchases',
    children: [
      { href: '/dashboard/purchases', label: 'All purchases' },
      { href: '/dashboard/purchases/new', label: 'New purchase' },
    ],
  },
  {
    label: 'Suppliers',
    href: '/dashboard/suppliers',
    children: [
      { href: '/dashboard/suppliers', label: 'All suppliers' },
      { href: '/dashboard/suppliers/new', label: 'New supplier' },
    ],
  },
  { href: '/dashboard/reports/sales', label: 'Sales reports' },
  { href: '/dashboard/reports/inventory', label: 'Inventory reports' },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    children: [
      { href: '/dashboard/settings/taxes', label: 'Tax rules' },
      // you can add more settings here later
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [openPurchases, setOpenPurchases] = useState(false);
  const [openSuppliers, setOpenSuppliers] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/purchases')) {
      setOpenPurchases(true);
    }
    if (pathname.startsWith('/dashboard/suppliers')) {
      setOpenSuppliers(true);
    }
    if (pathname.startsWith('/dashboard/settings')) {
      setOpenSettings(true);
    }
  }, [pathname]);

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
    router.push('/auth/login');
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg font-bold">
            IS
          </span>
          <span className="text-sm font-semibold tracking-tight">
            InventorySaaS
          </span>
        </div>
      </div>

      <nav className="mt-4 flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          if (!('children' in item) || !item.children) {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          }

          const isPurchasesGroup = item.label === 'Purchases';
          const isSuppliersGroup = item.label === 'Suppliers';
          const isSettingsGroup = item.label === 'Settings';

          const groupActive = pathname.startsWith(
            isPurchasesGroup
              ? '/dashboard/purchases'
              : isSuppliersGroup
              ? '/dashboard/suppliers'
              : '/dashboard/settings',
          );

          const open = isPurchasesGroup
            ? openPurchases
            : isSuppliersGroup
            ? openSuppliers
            : openSettings;

          const setOpen = isPurchasesGroup
            ? setOpenPurchases
            : isSuppliersGroup
            ? setOpenSuppliers
            : setOpenSettings;

          return (
            <div key={item.label} className="flex flex-col">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={[
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors w-full',
                  groupActive
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400">
                  {open ? '▾' : '▸'}
                </span>
              </button>

              {open && (
                <div className="mt-1 flex flex-col gap-1 pl-4">
                  {item.children.map((child) => {
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={[
                          'flex items-center rounded-md px-3 py-1.5 text-xs transition-colors',
                          active
                            ? 'bg-slate-800 text-emerald-300'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white',
                        ].join(' ')}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-xs text-left text-slate-400 hover:bg-slate-900 hover:text-rose-300 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
