import { connection } from "next/server";
import { getSession } from "@/lib/get-session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Building2, ShieldCheck, ArrowRight, Activity } from "lucide-react";

async function getOverviewStats() {
  await connection();
  const supabase = await createClient();

  const [usersRes, sucursalesRes] = await Promise.all([
    supabase.from("users").select("id, role", { count: "exact" }),
    supabase.from("sucursales").select("id, nombre, activa", { count: "exact" }),
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
    <div className={`group relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 transition-all hover:bg-slate-800/70 hover:border-slate-600 ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {href && (
          <ArrowRight size={14} className="text-slate-700 transition-all group-hover:translate-x-0.5 group-hover:text-slate-400" />
        )}
      </div>
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-600">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function SuperadminPage() {
  const session = await getSession();
  const stats = await getOverviewStats();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-7">
      {/* Header */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">{greeting}</p>
        <h1 className="text-2xl font-black tracking-tight text-white">
          {session?.user?.name ?? session?.user?.email}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
          <Activity size={13} className="text-rose-500" />
          Panel de administración del sistema
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Usuarios"
          value={stats.totalUsers}
          sub={`${stats.roleBreakdown.admin ?? 0} admin · ${stats.roleBreakdown.branch ?? 0} branch`}
          color="bg-blue-600"
          href="/superadmin/usuarios"
        />
        <StatCard
          icon={Building2}
          label="Sucursales"
          value={stats.totalSucursales}
          sub={`${stats.activeSucursales} activas`}
          color="bg-emerald-600"
          href="/superadmin/sucursales"
        />
        <StatCard
          icon={ShieldCheck}
          label="Superadmins"
          value={stats.roleBreakdown.superadmin ?? 0}
          sub="Acceso total"
          color="bg-rose-600"
        />
      </section>

      {/* Sucursales status */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Estado de sucursales</h3>
          </div>
          <Link
            href="/superadmin/sucursales"
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            Gestionar <ArrowRight size={11} />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/50">
          {stats.sucursales.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">No hay sucursales creadas aún.</p>
          ) : (
            stats.sucursales.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-[10px] font-black text-slate-500">{s.id}</span>
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
    </div>
  );
}
