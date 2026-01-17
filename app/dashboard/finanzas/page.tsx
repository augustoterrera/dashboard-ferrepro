import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VentasLineChart } from "@/components/charts/VentasLineChart";

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/finanzas`);

  const sp = await searchParams;
  const from = sp.from ?? "2025-10-01";
  const to = sp.to ?? "2025-10-31";

  const money = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(n ?? 0));

  let stats: any = null;

  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_from: from,
    p_to: to,
  });

  if (error) {
    return (
      <div>
        <h1 className="text-red-600 font-semibold">Error</h1>
        <pre className="text-sm text-red-200 whitespace-pre-wrap">
          {error.message}
        </pre>
      </div>
    );
  }

  stats = data as any;
  if (!data) return <div className="text-slate-200">Sin datos</div>;
  

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Finanzas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Rango: {from} → {to}
          </p>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KPI label="Ventas" value={money(stats.kpis.total_ventas)} />
        <KPI label="Pagos" value={money(stats.kpis.total_pagos)} />
        <KPI label="Facturas" value={stats.kpis.cant_facturas.toString()} />
        <KPI label="Ticket promedio" value={money(stats.kpis.ticket_promedio)} />
      </section>

      <section className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg">
        <div className="mb-3 text-sm text-slate-400">Ventas por día</div>
        <VentasLineChart data={stats.series.ventas_por_dia} />
      </section>
    </>
  );
}
