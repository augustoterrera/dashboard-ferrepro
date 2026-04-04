'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, Building2, LucideIcon } from 'lucide-react';
import { LogoutButton } from '../logout-button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/superadmin', icon: LayoutDashboard, exact: true },
  { label: 'Usuarios', href: '/superadmin/usuarios', icon: Users },
  { label: 'Sucursales', href: '/superadmin/sucursales', icon: Building2 },
];

type Props = {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null };
};

export function SuperadminShell({ children, user }: Props) {
  const pathname = usePathname();

  return (
    <div className="h-dvh bg-slate-950 overflow-hidden font-sans antialiased text-slate-200">
      <div className="flex h-full">
        <aside className="h-full w-64 flex flex-col border-r border-slate-800 bg-slate-900">
          {/* Header */}
          <div className="flex h-20 items-center gap-3 border-b border-slate-800/50 px-5">
            <div className="relative overflow-hidden rounded-lg shrink-0">
              <Image src="/logo.png" alt="Logo Waichatt" width={42} height={35} className="shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black leading-tight tracking-tighter uppercase italic bg-gradient-to-r from-white via-rose-400 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                Waichatt <span className="not-italic font-extrabold text-rose-500">Admin</span>
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={9} className="text-rose-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 leading-none whitespace-nowrap">
                  Panel Superadmin
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group relative",
                    isActive
                      ? "bg-rose-600/10 text-rose-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-rose-500 rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                      : "bg-slate-800 group-hover:scale-110"
                  )}>
                    <Icon size={17} />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + Logout */}
          <div className="border-t border-slate-800/50 bg-slate-900/50">
            {user && (
              <div className="px-4 pt-3 pb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600/20 text-rose-400 text-xs font-black">
                  {(user.name ?? user.email ?? 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  {user.name && (
                    <p className="text-xs font-bold text-slate-300 truncate leading-tight">{user.name}</p>
                  )}
                  <p className="text-[10px] text-slate-600 truncate leading-tight">{user.email}</p>
                </div>
              </div>
            )}
            <div className="p-3 pt-1">
              <LogoutButton collapsed={false} />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 h-full bg-slate-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
          <div className="h-full p-8 overflow-y-auto scroll-smooth relative z-10 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}
