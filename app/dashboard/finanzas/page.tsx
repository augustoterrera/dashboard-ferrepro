import { headers } from 'next/headers';
import { VentasLineChart } from "@/components/charts/VentasLineChart";
import { getFinanzasResumen } from "@/lib/data/finanzas";
import { InfoTip } from '@/components/info-tip';
import { getActiveSucursalId } from "@/lib/get-sucursal-id";
import { KpiCarousel } from '@/components/finanzas/KpiCarousel';

// --- Página Principal ---
export default async function FinanzasPage() {
  await headers();

  const sucursalId = await getActiveSucursalId();

  // Gestión de fechas (Últimos 30 días)
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const money = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(n ?? 0));

  let data;
  try {
    data = await getFinanzasResumen({ from, to, sucursalId });
  } catch (e: any) {
    return (
      <div className="m-8 rounded-xl border border-red-900/30 bg-red-900/10 p-6 text-red-500">
        <h2 className="font-bold">Error de sincronización</h2>
        <p className="text-sm opacity-70">{e.message}</p>
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center text-slate-500 font-medium">No se hallaron registros.</div>;
  const stats = data as any;

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">

        {/* HEADER UNIFICADO */}
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-5 pt-10 sm:pt-0 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase italic">
              Finanzas <span className="text-purple-500 text-lg sm:text-xl not-italic">Resumen</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Monitor de ingresos y efectividad de cobranza
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 lg:text-right">
            <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-1">Período Activo</div>
            <div className="text-sm font-mono text-slate-200">
              {from} <span className="text-slate-600">→</span> {to}
            </div>
          </div>
        </header>

        {/* KPIs — Carrusel en mobile, grid en desktop */}
        <KpiCarousel items={[
          {
            label: 'Ventas Totales',
            value: money(stats.kpis.total_ventas),
            tooltip: 'Suma total de todas las facturas y tickets emitidos en el período, independientemente de si fueron cobrados.',
          },
          {
            label: 'Pagos Recibidos',
            value: money(stats.kpis.total_pagos),
            tooltip: 'Efectivo real ingresado a caja o cuentas bancarias. Es el flujo de caja neto del período.',
          },
          {
            label: 'Comprobantes',
            value: stats.kpis.cant_facturas.toString(),
            subValue: 'Docs emitidos',
            tooltip: 'Cantidad total de documentos comerciales generados (Facturas A, B, C, etc).',
          },
          {
            label: 'Ticket Promedio',
            value: money(stats.kpis.ticket_promedio),
            tooltip: 'Valor medio de cada venta realizada. Se calcula como Ventas Totales dividido la cantidad de comprobantes.',
          },
          {
            label: 'Efectividad',
            value: `${(stats.kpis.total_ventas > 0 ? (stats.kpis.total_pagos / stats.kpis.total_ventas) * 100 : 0).toFixed(1)}%`,
            subValue: 'Cobranza vs Ventas',
            tooltip: 'Mide qué porcentaje de lo facturado ya fue efectivamente cobrado. Un valor bajo puede indicar problemas de morosidad.',
          },
        ]} />

        {/* DASHBOARD CONTENT */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* GRÁFICO (2/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-8 shadow-xl lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Curva de ingresos
              </h3>
              <InfoTip text="Muestra la evolución diaria de las ventas. Los picos suelen representar días de alta demanda o promociones exitosas." />
            </div>

            <div className="h-56 sm:h-80 w-full">
              <VentasLineChart data={stats.series.ventas_por_dia} />
            </div>
          </div>

          {/* LISTA DE PRODUCTOS (1/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 shadow-xl lg:h-110">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Top Productos
              </h3>
              <InfoTip text="Ranking de los productos que más dinero generaron en los últimos 30 días." />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#0f172a]">
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <th className="p-2 border-b border-slate-800">Item</th>
                    <th className="hidden sm:table-cell p-2 text-right border-b border-slate-800">Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(stats.top?.productos ?? []).map((p: any) => (
                    <tr key={p.sku} className="group transition-colors hover:bg-slate-800/30" title={`${p.nombre} (${p.sku})`}>
                      <td className="py-2.5 sm:py-4 pr-3 min-w-0 max-w-0 w-full">
                        <div className="truncate font-semibold text-slate-200 group-hover:text-white cursor-help">
                          {p.nombre}
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2">
                          <span>{Number(p.unidades ?? 0).toLocaleString("es-AR")} un.</span>
                          <span className="font-mono text-emerald-500 sm:hidden">{money(Number(p.venta_total ?? 0))}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-4 text-right font-mono text-sm font-medium text-slate-300 group-hover:text-emerald-400 whitespace-nowrap">
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
    </div>
  );
}