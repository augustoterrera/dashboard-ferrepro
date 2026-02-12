import { headers } from 'next/headers';
import { VentasLineChart } from "@/components/charts/VentasLineChart";
import { getFinanzasResumen } from "@/lib/data/finanzas";
import { InfoTip } from '@/components/info-tip';

// --- Componente KPI con Soporte para Tooltips ---
function KPI({
  label,
  value,
  subValue,
  tooltip
}: {
  label: string;
  value: string;
  subValue?: string;
  tooltip?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 shadow-sm transition-all hover:bg-slate-800/60">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white">{value}</span>
        {subValue && <span className="text-xs text-slate-500">{subValue}</span>}
      </div>
    </div>
  );
}

// --- Página Principal ---
export default async function FinanzasPage() {
  await headers();

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
    data = await getFinanzasResumen({ from, to });
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
      <main className="mx-auto max-w-7xl space-y-8 p-8">

        {/* HEADER UNIFICADO */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Finanzas <span className="text-purple-500 text-xl not-italic">Resumen</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Monitor de ingresos y efectividad de cobranza
            </p>
          </div>

          <div className="shrink-0 bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-right">
            <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-0.5 text-right">Período Activo</div>
            <div className="text-xs font-mono text-slate-200">
              {from} <span className="text-slate-600">→</span> {to}
            </div>
          </div>
        </header>

        {/* KPIs GRID CON TOOLTIPS EXPLICATIVOS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPI
            label="Ventas Totales"
            value={money(stats.kpis.total_ventas)}
            tooltip="Suma total de todas las facturas y tickets emitidos en el período, independientemente de si fueron cobrados."
          />
          <KPI
            label="Pagos Recibidos"
            value={money(stats.kpis.total_pagos)}
            tooltip="Efectivo real ingresado a caja o cuentas bancarias. Es el flujo de caja neto del período."
          />
          <KPI
            label="Comprobantes"
            value={stats.kpis.cant_facturas.toString()}
            subValue="Docs emitidos"
            tooltip="Cantidad total de documentos comerciales generados (Facturas A, B, C, etc)."
          />
          <KPI
            label="Ticket Promedio"
            value={money(stats.kpis.ticket_promedio)}
            tooltip="Valor medio de cada venta realizada. Se calcula como Ventas Totales dividido la cantidad de comprobantes."
          />
          <KPI
            label="Efectividad"
            value={`${(stats.kpis.total_ventas > 0 ? (stats.kpis.total_pagos / stats.kpis.total_ventas) * 100 : 0).toFixed(1)}%`}
            subValue="Cobranza vs Ventas"
            tooltip="Mide qué porcentaje de lo facturado ya fue efectivamente cobrado. Un valor bajo puede indicar problemas de morosidad."
          />
        </section>

        {/* DASHBOARD CONTENT */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* GRÁFICO (2/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl lg:col-span-2">
            {/* Contenedor Flex para alinear título e icono */}
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Curva de ingresos
              </h3>
              <InfoTip text="Muestra la evolución diaria de las ventas. Los picos suelen representar días de alta demanda o promociones exitosas." />
            </div>

            <div className="h-80 w-full">
              <VentasLineChart data={stats.series.ventas_por_dia} />
            </div>
          </div>

          {/* LISTA DE PRODUCTOS (1/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl lg:h-110">
            {/* Contenedor Flex para alinear título e icono */}
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Top Productos
              </h3>
              <InfoTip text="Ranking de los productos que más dinero generaron en los últimos 30 días." />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#0f172a] py-2">
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <th className="p-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        Item
                      </div>
                    </th>
                    <th className="p-2 text-right border-b border-slate-800">
                      <div className="flex items-center justify-end gap-1.5">
                        Recaudado
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(stats.top?.productos ?? []).map((p: any) => (
                    <tr key={p.sku} className="group transition-colors hover:bg-slate-800/30" title={`${p.nombre} (${p.sku})`}>
                      <td className="py-4 pr-4">
                        <div className="max-w-[160px] truncate font-semibold text-slate-200 group-hover:text-white cursor-help">
                          {p.nombre}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {Number(p.unidades ?? 0).toLocaleString("es-AR")} un. vendidas
                        </div>
                      </td>
                      <td className="py-4 text-right font-mono text-sm font-medium text-slate-300 group-hover:text-emerald-400">
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