'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { 
  ChevronDown, 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  Megaphone, 
  Package, 
  MessageSquare, 
  ChevronRight,
  LucideIcon 
} from 'lucide-react';
import { LogoutButton } from '../logout-button';

type NavChild = {
  label: string;
  href: string;
};

type NavGroup = {
  key: string;
  label: string;
  baseHref: string;
  icon: LucideIcon; // Cambiamos iconText por el componente de Lucide
  children: NavChild[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // --- Nav structure con Iconos de Lucide ---
  const groups: NavGroup[] = useMemo(() => [
    { 
      key: 'finanzas', 
      label: 'Finanzas', 
      baseHref: '/dashboard/finanzas', 
      icon: Wallet, 
      children: [
        { label: 'Resumen', href: '/dashboard/finanzas' },
        { label: 'Ventas', href: '/dashboard/finanzas/ventas' },
        { label: 'Pagos', href: '/dashboard/finanzas/pagos' },
        { label: 'Productos', href: '/dashboard/finanzas/productos' },
        { label: 'Pareto 80/20', href: '/dashboard/finanzas/pareto' },
        { label: 'Cierre y ROI', href: '/dashboard/finanzas/cierre-roi' },
      ] 
    },
    { 
      key: 'operativo', 
      label: 'Operativo', 
      baseHref: '/dashboard/operativo', 
      icon: Settings, 
      children: [
        { label: 'Resumen', href: '/dashboard/operativo' },
        { label: 'Conversaciones', href: '/dashboard/operativo/conversaciones' },
        { label: 'SLA', href: '/dashboard/operativo/sla' },
        { label: 'Etiquetas', href: '/dashboard/operativo/etiquetas' },
      ] 
    },
    { 
      key: 'marketing', 
      label: 'Marketing', 
      baseHref: '/dashboard/marketing', 
      icon: Megaphone, 
      children: [
        { label: 'Meta Ads', href: '/dashboard/marketing/meta-ads' },
        { label: 'WhatsApp CPA', href: '/dashboard/marketing/whatsapp-cpa' },
      ] 
    },
    { 
      key: 'productos', 
      label: 'Productos', 
      baseHref: '/dashboard/productos', 
      icon: Package, 
      children: [
        { label: 'Catálogo', href: '/dashboard/productos' },
        { label: 'Stock', href: '/dashboard/productos/stock' },
      ] 
    },
    { 
      key: 'chat', 
      label: 'Chat IA', 
      baseHref: '/dashboard/conversations', 
      icon: MessageSquare, 
      children: [{ label: 'Conversaciones', href: '/dashboard/conversations' }] 
    },
  ], []);

  // --- Lógica de persistencia y auto-open (Se mantiene igual) ---
  useEffect(() => {
    const v = localStorage.getItem('sidebar_collapsed');
    if (v === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebar_open_groups');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setOpenGroups(new Set(arr.map(String)));
      }
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_open_groups', JSON.stringify(Array.from(openGroups)));
    } catch { }
  }, [openGroups]);

  useEffect(() => {
    const current = groups.find((g) => pathname.startsWith(g.baseHref));
    if (!current) return;
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.add(current.key);
      return next;
    });
  }, [pathname, groups]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="h-dvh bg-slate-950 overflow-hidden font-sans antialiased text-slate-200">
      <div className="flex h-full">
        {/* SIDEBAR */}
        <aside
          className={`h-full flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900 ${
            collapsed ? 'w-20' : 'w-72'
          }`}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/50">
            {!collapsed && (
              <div className="flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <LayoutDashboard size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className={`flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-all ${collapsed ? 'mx-auto' : ''}`}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} className="rotate-180" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {groups.map((g) => {
              const groupIsActive = pathname.startsWith(g.baseHref);
              const isOpen = openGroups.has(g.key);
              const Icon = g.icon;

              return (
                <div key={g.key} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(g.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group ${
                      groupIsActive 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                      groupIsActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}>
                      <Icon size={20} />
                    </div>

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left font-medium text-sm">{g.label}</span>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-300 opacity-40 ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </>
                    )}
                  </button>

                  {/* Children Items */}
                  {!collapsed && isOpen && (
                    <div className="ml-7 pl-4 border-l border-slate-800 space-y-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {g.children.map((c) => {
                        const active = isActivePath(pathname, c.href);
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              active
                                ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-500 rounded-l-none'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className={`flex ${collapsed ? 'justify-center' : 'justify-start'}`}>
                <LogoutButton />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 h-full bg-slate-950 overflow-hidden relative">
          <div className="h-full p-8 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}