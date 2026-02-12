'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Wallet,
  Settings,
  Megaphone,
  MessageSquare,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { LogoutButton } from '../logout-button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// --- Tipos ---
type NavChild = {
  label: string;
  href: string;
  soon?: boolean;
};

type NavGroup = {
  key: string;
  label: string;
  href?: string;
  baseHref?: string;
  icon: LucideIcon;
  children: NavChild[];
};

const GROUPS: NavGroup[] = [
  {
    key: 'finanzas',
    label: 'Finanzas',
    href: '/dashboard/finanzas',
    baseHref: '/dashboard/finanzas',
    icon: Wallet,
    children: [
      { label: 'Resumen', href: '/dashboard/finanzas' },
      { label: 'Ventas', href: '/dashboard/finanzas/ventas' },
      { label: 'Productos', href: '/dashboard/finanzas/productos' },
      { label: 'Pareto 80/20', href: '/dashboard/finanzas/pareto' },
      { label: 'Cierre y ROI', href: '/dashboard/finanzas/cierre-roi', soon: true },
    ],
  },
  {
    key: 'operativo',
    label: 'Operativo',
    href: '/dashboard/operativo',
    baseHref: '/dashboard/operativo',
    icon: Settings,
    children: [
      { label: 'Resumen', href: '/dashboard/operativo' },
      { label: 'Conversaciones', href: '/dashboard/operativo/conversaciones' },
      { label: 'SLA', href: '/dashboard/operativo/sla' },
      { label: 'Etiquetas', href: '/dashboard/operativo/etiquetas' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    href: '/dashboard/marketing',
    baseHref: '/dashboard/marketing',
    icon: Megaphone,
    children: [],
  },
  // {
  //   key: 'chat',
  //   label: 'Chat IA',
  //   href: '/dashboard/conversations',
  //   baseHref: '/dashboard/conversations',
  //   icon: MessageSquare,
  //   children: [{ label: 'Conversaciones', href: '/dashboard/conversations' }],
  // },
];

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Evitar flash en hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persistencia de colapso
  useEffect(() => {
    if (!mounted) return;
    const v = localStorage.getItem('sidebar_collapsed');
    if (v === '1') setCollapsed(true);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed, mounted]);

  // Auto-abrir grupo basado en la URL (solo si no está colapsado)
  useEffect(() => {
    if (!mounted) return;
    const activeGroup = GROUPS.find(g => g.baseHref && pathname.startsWith(g.baseHref));
    if (activeGroup && !collapsed && activeGroup.children.length > 0) {
      setOpenGroups(new Set([activeGroup.key]));
    }
  }, [pathname, collapsed, mounted]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.clear();
        next.add(key);
      }
      return next;
    });
  };

  const handleGroupClick = (g: NavGroup) => {
    const hasChildren = g.children.length > 0;

    // Si está colapsado, solo expandir sidebar
    if (collapsed) {
      setCollapsed(false);
      if (hasChildren) {
        setTimeout(() => {
          setOpenGroups(new Set([g.key]));
        }, 300);
      }
      return;
    }

    // Si no tiene hijos, navegar directamente
    if (!hasChildren && g.href) {
      router.push(g.href);
      return;
    }

    // Si tiene hijos, toggle del submenu
    if (hasChildren) {
      toggleGroup(g.key);
    }
  };

  return (
    <div className="h-dvh bg-slate-950 overflow-hidden font-sans antialiased text-slate-200">
      <div className="flex h-full">
        <aside
          className={cn(
            "h-full flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900 relative",
            collapsed ? 'w-20' : 'w-72'
          )}
        >
          {/* --- HEADER --- */}
          <div className={cn(
            "flex h-20 items-center border-b border-slate-800/50 px-4 transition-all duration-300",
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            <div className={cn(
              "flex items-center gap-2 group cursor-pointer transition-all duration-300",
              collapsed ? 'px-0' : 'px-2'
            )}>
              {/* Contenedor del Logo con Efecto de Brillo (Shimmer) en Hover */}
              <div className="relative overflow-hidden rounded-lg shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo Waichatt"
                  width={55}
                  height={45}
                  className="shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
                {/* Brillo que atraviesa el logo al hacer hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {/* Glow sutil de fondo */}
                <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Texto con Gradiente Estático y Entrada Fluida */}
              {!collapsed && (
                <div className={cn(
                  "flex flex-col ml-1 overflow-hidden transition-all duration-300",
                  "opacity-100 translate-x-0",
                  collapsed && "opacity-0 -translate-x-4"
                )}>
                  <span className="text-lg font-black leading-tight tracking-tighter uppercase italic bg-gradient-to-r from-white via-blue-400 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                    Waichatt <span className="not-italic font-extrabold text-blue-500">BI</span>
                  </span>

                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500 leading-none mt-1 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                    Business Intelligence
                  </p>
                </div>
              )}
            </div>

            {/* Botón de colapso flotante */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3.5 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 shadow-xl z-50 group"
            >
              <ChevronRight
                size={14}
                className={cn("transition-transform duration-300", !collapsed && "rotate-180")}
              />
            </button>
          </div>

          {/* --- NAVEGACIÓN --- */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar">
            {GROUPS.map((g) => {
              const groupIsActive = g.baseHref && pathname.startsWith(g.baseHref);
              const isOpen = openGroups.has(g.key);
              const Icon = g.icon;
              const hasChildren = g.children.length > 0;

              return (
                <div key={g.key} className="space-y-1">
                  <button
                    onClick={() => handleGroupClick(g)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative",
                      groupIsActive ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    {/* Indicador lateral activo */}
                    {groupIsActive && (
                      <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                      groupIsActive ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800 group-hover:scale-110"
                    )}>
                      <Icon size={18} />
                    </div>

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left font-bold text-sm tracking-tight">
                          {g.label}
                        </span>
                        {hasChildren && (
                          <ChevronDown
                            size={14}
                            className={cn("transition-transform duration-300 opacity-40", isOpen && "rotate-180")}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Sub-menú con animación de altura fluida */}
                  {!collapsed && hasChildren && (
                    <div className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}>
                      <div className="overflow-hidden">
                        <div className="ml-7 pl-4 border-l border-slate-800/50 space-y-1 py-1">
                          {g.children.map((c) => {
                            const isExactlyActive = pathname === c.href;
                            if (c.soon) {
                              return (
                                <div key={c.href} className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed select-none">
                                  <span>{c.label}</span>
                                  <span className="text-[7px] bg-slate-800 px-1 py-0.5 rounded text-slate-500 border border-slate-700 font-black tracking-widest">PROX</span>
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={c.href}
                                href={c.href}
                                className={cn(
                                  "block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                                  isExactlyActive
                                    ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 rounded-l-none"
                                    : "text-slate-500 hover:text-slate-200 hover:translate-x-1 hover:bg-white/5"
                                )}
                              >
                                {c.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* --- FOOTER --- */}
          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
            <LogoutButton collapsed={collapsed} />
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 min-w-0 h-full bg-slate-950 overflow-hidden relative">
          {/* Decoración de luz ambiental en el fondo */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />

          <div className="h-full p-8 overflow-y-auto scroll-smooth relative z-10 custom-scrollbar">
            {/* Animación de entrada para el contenido de la página */}
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Estilos Globales para Animaciones Custom */}
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}