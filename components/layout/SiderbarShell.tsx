'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LogoutButton } from '../logout-button';

type NavItem = {
  label: string;
  href: string;
  iconText: string;
};

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persistir preferencia de sidebar colapsado
  useEffect(() => {
    const v = localStorage.getItem('sidebar_collapsed');
    if (v === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const items: NavItem[] = useMemo(
    () => [
      { label: 'Finanzas', href: '/dashboard/finanzas', iconText: 'F' },
      { label: 'Operativo', href: '/dashboard/operativo', iconText: 'O' },
      { label: 'Productos', href: '/dashboard/productos', iconText: 'P' },
      { label: 'Chat IA', href: '/dashboard/conversations', iconText: 'C' },
    ],
    []
  );


  return (
    <div className="h-dvh bg-slate-900 overflow-hidden">
      <div className="flex h-full">
        {/* SIDEBAR */}
        <aside
          className={[
            'h-full border-r border-slate-700 bg-slate-800', // <-- antes: sticky top-0 h-screen
            collapsed ? 'w-16' : 'w-64',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-700 px-3 bg-slate-800">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {collapsed ? 'DB' : 'Dashboard'}
              </div>
            </div>

            <button
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
              aria-label={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
              title={collapsed ? 'Expandir' : 'Minimizar'}
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation (si querés scroll en el sidebar) */}
          <nav className="p-2 overflow-y-auto h-[calc(100%-3.5rem)]">
            <ul className="space-y-1">
              {items.map((it) => {
                const active = pathname === it.href;

                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={[
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                        active
                          ? 'bg-slate-700 font-medium text-white'
                          : 'text-slate-300 hover:bg-slate-700',
                      ].join(' ')}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-xs text-white">
                        {it.iconText}
                      </span>

                      {!collapsed && <span>{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <LogoutButton />
            </div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 h-full bg-slate-900 overflow-hidden">
          {/* este wrapper es CLAVE para que /conversations pueda usar h-full */}
          <div className="h-full min-h-0 p-6 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );

}
