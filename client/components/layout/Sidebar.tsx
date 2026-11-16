// client/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Icons as components for better reusability
const Icons = {
  Overview: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Inventory: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Categories: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  ),
  POS: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Kitchen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6M3 3h18v18H3V3z" />
    </svg>
  ),
  Sales: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  Purchases: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Suppliers: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Tables: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Reports: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  CollapseLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  ),
  CollapseRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
};

type NavItem = {
  href?: string;
  label: string;
  icon?: keyof typeof Icons;
  children?: { href: string; label: string; icon?: keyof typeof Icons }[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'Overview' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: 'Inventory' },
  { href: '/dashboard/categories', label: 'Categories', icon: 'Categories' },
  { href: '/dashboard/pos', label: 'POS', icon: 'POS' },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: 'Kitchen' },
  { href: '/dashboard/sales', label: 'Sales', icon: 'Sales' },
  {
    label: 'Purchases',
    icon: 'Purchases',
    children: [
      { href: '/dashboard/purchases', label: 'All purchases', icon: 'Purchases' },
      { href: '/dashboard/purchases/new', label: 'New purchase', icon: 'Purchases' },
    ],
  },
  {
    label: 'Suppliers',
    icon: 'Suppliers',
    children: [
      { href: '/dashboard/suppliers', label: 'All suppliers', icon: 'Suppliers' },
      { href: '/dashboard/suppliers/new', label: 'New supplier', icon: 'Suppliers' },
    ],
  },
  {
    label: 'Tables',
    icon: 'Tables',
    children: [
      { href: '/dashboard/tables', label: 'Floor layout', icon: 'Tables' },
      { href: '/dashboard/tables/new', label: 'Create table', icon: 'Tables' },
    ],
  },
  {
    label: 'Reports',
    icon: 'Reports',
    children: [
      { href: '/dashboard/reports/sales', label: 'Sales reports', icon: 'Reports' },
      { href: '/dashboard/reports/inventory', label: 'Inventory reports', icon: 'Reports' },
    ],
  },
  {
    label: 'Settings',
    icon: 'Settings',
    children: [
      { href: '/dashboard/settings/taxes', label: 'Tax rules', icon: 'Settings' },
      { href: '/dashboard/settings/team', label: 'Team & Roles', icon: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const platformRole = user?.platformRole ?? 'NONE';
  const isPlatformAdmin = platformRole === 'PLATFORM_OWNER' || platformRole === 'PLATFORM_ADMIN';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  useEffect(() => {
    // Auto-expand groups based on current path
    const newOpenGroups: Record<string, boolean> = {};
    
    if (pathname.startsWith('/dashboard/purchases')) newOpenGroups.Purchases = true;
    if (pathname.startsWith('/dashboard/suppliers')) newOpenGroups.Suppliers = true;
    if (pathname.startsWith('/dashboard/tables')) newOpenGroups.Tables = true;
    if (pathname.startsWith('/dashboard/reports')) newOpenGroups.Reports = true;
    if (pathname.startsWith('/dashboard/settings')) newOpenGroups.Settings = true;
    if (pathname.startsWith('/dashboard/platform')) newOpenGroups.Platform = true;
    
    setOpenGroups(prev => ({ ...prev, ...newOpenGroups }));
  }, [pathname]);

  const toggleGroup = (label: string) => {
    if (isCollapsed) {
      // When collapsed, we might want to show a tooltip or handle differently
      return;
    }
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
    router.push('/auth/login');
  }

  const isKitchenActive = pathname.startsWith('/dashboard/kitchen');

  // Tooltip for collapsed mode
  const Tooltip = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div className="relative group/tooltip">
      {children}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 border border-slate-700 shadow-xl">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <aside 
      className={[
        'flex flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-20' : 'w-64'
      ].join(' ')}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full p-1.5 border border-slate-700 shadow-lg transition-all duration-200 z-50"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <Icons.CollapseRight /> : <Icons.CollapseLeft />}
      </button>

      {/* Logo Area */}
      <div className={[
        'border-b border-slate-800/50 transition-all duration-300',
        isCollapsed ? 'px-2 py-5' : 'px-4 py-5'
      ].join(' ')}>
        <div className={[
          'flex items-center',
          isCollapsed ? 'justify-center' : 'gap-3'
        ].join(' ')}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur"></div>
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-lg font-bold shadow-lg">
              IS
            </span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap block">
                InventorySaaS
              </span>
              <span className="block text-[10px] text-emerald-400/70 whitespace-nowrap">
                Management System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon ? Icons[item.icon] : null;
            
            // Regular navigation items (no children)
            if (!item.children) {
              const active = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href || '');
              
              const isKitchen = item.label === 'Kitchen';

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={[
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                    isCollapsed ? 'justify-center' : 'gap-3',
                    active
                      ? isKitchen
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/20'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                      : isKitchen
                      ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                  ].join(' ')}
                >
                  {Icon && <Icon />}
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isKitchen && isKitchenActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              return isCollapsed ? (
                <Tooltip key={item.href} label={item.label}>
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              );
            }

            // Dropdown groups
            const isOpen = openGroups[item.label];
            const hasActiveChild = item.children?.some(child => pathname === child.href);

            const groupButton = (
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                className={[
                  'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center' : 'justify-between',
                  hasActiveChild
                    ? 'text-emerald-400 bg-slate-800/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                ].join(' ')}
              >
                <div className={isCollapsed ? '' : 'flex items-center gap-3'}>
                  {Icon && <Icon />}
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-slate-400">
                    {isOpen ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                  </span>
                )}
              </button>
            );

            return (
              <div key={item.label}>
                {isCollapsed ? (
                  <Tooltip label={item.label}>
                    {groupButton}
                  </Tooltip>
                ) : (
                  groupButton
                )}

                {!isCollapsed && isOpen && (
                  <div className="ml-4 pl-3 border-l border-slate-800/50 space-y-1 mt-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon ? Icons[child.icon] : null;
                      const active = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={[
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200',
                            active
                              ? 'bg-slate-800 text-emerald-400'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                          ].join(' ')}
                        >
                          {ChildIcon && <ChildIcon />}
                          <span>{child.label}</span>
                          {active && (
                            <span className="ml-auto w-1 h-1 rounded-full bg-emerald-400"></span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Platform Admin Section */}
          {isPlatformAdmin && (
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <button
                type="button"
                onClick={() => toggleGroup('Platform')}
                onMouseEnter={() => setHoveredItem('Platform')}
                onMouseLeave={() => setHoveredItem(null)}
                className={[
                  'flex items-center w-full rounded-lg px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-all duration-200',
                  isCollapsed ? 'justify-center' : 'justify-between',
                  pathname.startsWith('/dashboard/platform')
                    ? 'text-emerald-400 bg-slate-800/50'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                ].join(' ')}
              >
                <div className={isCollapsed ? '' : 'flex items-center gap-3'}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {!isCollapsed && <span>Platform</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-slate-500">
                    {openGroups.Platform ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                  </span>
                )}
              </button>

              {!isCollapsed && openGroups.Platform && (
                <div className="ml-4 pl-3 border-l border-slate-800/50 mt-1 space-y-1">
                  <Link
                    href="/dashboard/platform/tenants"
                    className={[
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200',
                      pathname === '/dashboard/platform/tenants'
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                    ].join(' ')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Tenants</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* User & Logout */}
      <div className="border-t border-slate-800/50 p-4">
        {user && !isCollapsed && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-slate-800/30">
            <p className="text-xs font-medium text-white truncate">{user.name || user.email}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user.role?.toLowerCase() || 'User'}</p>
          </div>
        )}
        {isCollapsed && user && (
          <Tooltip label={user.name || user.email || 'User'}>
            <div className="mb-3 flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </Tooltip>
        )}
        
        <button
          type="button"
          onClick={handleLogout}
          className={[
            'w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 group',
            isCollapsed ? 'justify-center' : 'gap-3'
          ].join(' ')}
          title={isCollapsed ? 'Logout' : ''}
        >
          <Icons.Logout />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}