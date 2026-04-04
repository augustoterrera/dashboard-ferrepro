import { getSession } from "@/lib/get-session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Building2, ShieldCheck, ArrowRight } from "lucide-react";

async function getOverviewStats() {
  const supabase = await createClient();

  const [usersRes, sucursalesRes, activeUsersRes] = await Promise.all([
    supabase.from("users").select("id, role", { count: "exact" }),
    supabase.from("sucursales").select("id, nombre, activa", { count: "exact" }),
    supabase.from("users").select("id", { count: "exact", head: true }).neq("role", "superadmin"),
  ]);

  const roleBreakdown = (usersRes.data ?? []).reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: usersRes.count ?? 0,
    totalSucursales: sucursalesRes.count ?? 0,
    activeSucursales: (sucursalesRes.data ?? []).filter(s => s.activa).length,
    roleBreakdown,
    sucursales: sucursalesRes.data ?? [],
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`group relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-sm transition-all hover:bg-slate-800/70 hover:border-slate-600 ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {href && (
          <ArrowRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-slate-400" />
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-black text-white">{value}</div>
        <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-slate-600">{sub}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function SuperAdminPage() {
  const session = await getSession();
  const stats = await getOverviewStats();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      {/* Header */}
      <header className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Super <span className="text-rose-500 text-xl not-italic">Admin</span>
          </h1>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-12">
          Panel de control del sistema · {session?.user?.name ?? session?.user?.email}
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Usuarios totales"
          value={stats.totalUsers}
          sub={`Admin: ${stats.roleBreakdown.admin ?? 0} · Branch: ${stats.roleBreakdown.branch ?? 0}`}
          color="bg-blue-600"
          href="/dashboard/superadmin/usuarios"
        />
        <StatCard
          icon={Building2}
          label="Sucursales"
          value={stats.totalSucursales}
          sub={`${stats.activeSucursales} activas`}
          color="bg-emerald-600"
          href="/dashboard/superadmin/sucursales"
        />
        <StatCard
          icon={ShieldCheck}
          label="Superadmins"
          value={stats.roleBreakdown.superadmin ?? 0}
          sub="Acceso total al sistema"
          color="bg-rose-600"
        />
      </section>

      {/* Sucursales quick view */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Estado de sucursales
          </h3>
          <Link
            href="/dashboard/superadmin/sucursales"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            Gestionar <ArrowRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {stats.sucursales.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-600">No hay sucursales creadas aún.</p>
          ) : (
            stats.sucursales.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-slate-400">
                    {s.id}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{s.nombre}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.activa ? "bg-emerald-900/40 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                  {s.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/superadmin/usuarios"
          className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-all hover:bg-slate-800/60 hover:border-slate-600 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Users size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">Gestionar Usuarios</div>
            <div className="text-xs text-slate-500">Crear, editar y eliminar usuarios del sistema</div>
          </div>
          <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/dashboard/superadmin/sucursales"
          className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-all hover:bg-slate-800/60 hover:border-slate-600 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Building2 size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">Gestionar Sucursales</div>
            <div className="text-xs text-slate-500">Alta, baja y modificación de sucursales</div>
          </div>
          <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
}
