import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VentasLineChart } from "@/components/charts/VentasLineChart";

// --- Interfaces ---
interface KPIProps {
  label: string;
  value: string;
}

// --- Componentes Atómicos ---
function KPI({ label, value }: KPIProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

// --- Página Principal ---
export default async function FinanzasPage() {
  const supabase = await createClient();

  // 1. Autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/finanzas`);

  // 2. Parámetros y Formateo

  const fechaActual = new Date().toISOString().split('T')[0];
  const fecha30DiasAntes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const from = fecha30DiasAntes;
  const to = fechaActual;

  const money = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(n ?? 0));

  // 3. Obtención de Datos
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_from: from,
    p_to: to,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-6">
        <h1 className="text-lg font-bold text-red-500">Error de conexión</h1>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-red-300/80">
          {error.message}
        </pre>
      </div>
    );
  }

  if (!data) {
    return <div className="py-10 text-center text-slate-400">No se encontraron registros para este período.</div>;
  }

  const stats = data as any;

  return (
    <main className="space-y-8 p-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Finanzas</h1>
          <p className="text-sm text-slate-400">
            Período de análisis: <span className="text-slate-200">{from}</span> al <span className="text-slate-200">{to}</span>
          </p>
        </div>
      </header>

      {/* Grid de KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Ventas" value={money(stats.kpis.total_ventas)} />
        <KPI label="Pagos" value={money(stats.kpis.total_pagos)} />
        <KPI label="Facturas" value={stats.kpis.cant_facturas.toString()} />
        <KPI label="Ticket Prom." value={money(stats.kpis.ticket_promedio)} />
        <KPI
          label="% Cobrado"
          value={
            stats.kpis.total_ventas > 0
              ? `${((stats.kpis.total_pagos / stats.kpis.total_ventas) * 100).toFixed(1)}%`
              : "0%"
          }
        />
      </section>

      {/* Grid de Contenido Principal */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de Ventas */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 shadow-xl lg:col-span-2">
          <h3 className="mb-6 text-sm font-medium text-slate-400">Ventas por día</h3>
          <div className="h-75 w-full">
            <VentasLineChart data={stats.series.ventas_por_dia} />
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 shadow-xl lg:h-100 flex flex-col">
          <h3 className="mb-4 text-sm font-medium text-slate-400">Productos más vendidos</h3>

          <div className="flex-1 overflow-y-auto pr-2">

            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800/90 backdrop-blur border-b border-slate-700">

                <tr className="border-b border-slate-700 text-slate-500">
                  <th className="p-2 text-left font-semibold">Producto</th>
                  <th className="p-2 text-right font-semibold">Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {(stats.top?.productos ?? []).map((p: any) => (
                  <tr
                    key={p.sku}
                    className="group transition-colors hover:bg-slate-700/20"
                    title={`${p.sku} • ${p.nombre}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="max-w-45 truncate font-medium text-slate-200 group-hover:text-white">
                        {p.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {Number(p.unidades ?? 0).toLocaleString("es-AR")} unidades
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-200">
                      {money(Number(p.venta_total ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}