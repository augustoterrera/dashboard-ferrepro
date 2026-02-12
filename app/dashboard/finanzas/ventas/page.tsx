import { headers } from "next/headers";
import { DateRangeBar } from "@/components/filters/DateRangeBar";
import { VentasCompareLineChart } from "@/components/charts/VentasCompareLineChart";
import { getVentasComparacion, getVentasYoY, getTopMetodosPago } from "@/lib/data/finanzas";
import { InfoTip } from '@/components/info-tip';
import { MetodosPagoDialog } from "@/components/finanzas/MetodosDePagoDialog";

// --- Componente KPI Refinado con InfoTip ---
function KPI({
    label,
    value,
    trend,
    tooltip,
    isPercentageTrend = false
}: {
    label: string;
    value: string;
    trend?: number | null;
    tooltip?: string;
    isPercentageTrend?: boolean;
}) {
    const isPositive = trend && trend > 0;
    const isNegative = trend && trend < 0;

    const trendValue = trend !== undefined && trend !== null
        ? `${isPositive ? "↑" : isNegative ? "↓" : ""} ${Math.abs(trend * 100).toFixed(1)}%`
        : null;

    return (
        <div className="flex flex-col gap-1 rounded-xl bg-slate-800/40 p-5 border border-slate-700/50 shadow-sm transition-all hover:border-slate-600">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {label}
                </span>
                {tooltip && <InfoTip text={tooltip} />}
            </div>

            <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-semibold ${isPercentageTrend ? (isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-white') : 'text-white'}`}>
                    {isPercentageTrend ? trendValue : value}
                </span>

                {isPercentageTrend ? (
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                        {value}
                    </span>
                ) : (
                    trendValue && (
                        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-500'}`}>
                            {trendValue}
                        </span>
                    )
                )}
            </div>
        </div>
    );
}

export default async function VentasPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; compare?: string }>;
}) {
    headers();
    const sp = await searchParams;

    const defaultFrom = "2026-01-04";
    const defaultTo = "2026-02-03";
    const from = sp.from ?? defaultFrom;
    const to = sp.to ?? defaultTo;

    const compare = (sp.compare === "yoy" ? "yoy" : "prev") as "prev" | "yoy";
    const labelCompare = compare === "yoy" ? "Año anterior" : "Período anterior";

    const money = (n: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n ?? 0));

    let data: any;
    try {
        data = compare === "yoy"
            ? await getVentasYoY({ from, to, empresaId: null })
            : await getVentasComparacion({ from, to, empresaId: null });
    } catch (e: any) {
        return <div className="p-10 text-red-500">Error: {e.message}</div>;
    }

    const { summary = {}, series = [] } = data;
    const chartData = series.map((x: any) => ({
        day: x.day,
        ventas_actual: Number(x.ventas_actual ?? 0),
        ventas_compare: Number(x.ventas_compare ?? 0),
    }));
    let metodosPago: any;
    try {
        metodosPago = await getTopMetodosPago({ from, to, limit: 5 });
        console.log("metodosPago", metodosPago?.slice?.(0, 3), "len", metodosPago?.length);
    } catch (e: any) {
        metodosPago = []; 
        console.log("[getTopMetodosPago ERROR]", e);
    }


    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <main className="mx-auto max-w-7xl space-y-10 p-8">

                {/* SECCIÓN 1: ENCABEZADO Y FILTROS */}
                <section className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        {/* Título principal con badge de color e InfoTip */}
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                                Ventas <span className="text-emerald-500 text-xl not-italic ml-1">Comparativa</span>
                            </h1>
                            <InfoTip text="En esta sección podés comparar el rendimiento comercial de tu negocio entre dos períodos de tiempo para detectar crecimiento o caídas estacionales." />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Análisis comparativo de rendimiento mensual y anual
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-900/50 p-2 ring-1 ring-slate-800">
                        <DateRangeBar defaultFrom={defaultFrom} defaultTo={defaultTo} defaultCompare={compare} />
                    </div>
                </section>

                {/* SECCIÓN 2: KPIs CON TOOLTIPS */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KPI
                        label="Período Actual"
                        value={money(summary.total_actual)}
                        tooltip="Total facturado en el rango de fechas seleccionado arriba."
                    />
                    <KPI
                        label={labelCompare}
                        value={money(summary.total_compare)}
                        tooltip={`Total facturado en el mismo rango de días del ${labelCompare.toLowerCase()}.`}
                    />
                    <KPI
                        label="Variación"
                        value={summary.delta_pct > 0 ? "Crecimiento" : "Baja"}
                        trend={summary.delta_pct}
                        isPercentageTrend={true}
                        tooltip="Diferencia porcentual entre el período actual y el comparativo. Indica si el negocio está expandiéndose o contrayéndose."
                    />
                    <KPI
                        label="Volumen"
                        value={String(summary.facturas_actual ?? 0)}
                        tooltip="Cantidad total de tickets o facturas emitidas en el período actual."
                    />
                </section>
                <MetodosPagoDialog
                    data={metodosPago}
                    from={from}
                    to={to}
                    limit={10}
                />


                {/* SECCIÓN 3: GRÁFICO CON INFOTIP EN TÍTULO */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl">
                    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white">Tendencia de Ventas</h3>
                                <InfoTip text="Este gráfico superpone el rendimiento diario actual contra el período anterior para identificar en qué momentos del mes hubo desviaciones." />
                            </div>
                            <p className="text-sm text-slate-500">Comparativa diaria: Actual vs {labelCompare}</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span>Actual</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <div className="h-2 w-2 rounded-full bg-slate-600"></div>
                                <span>{labelCompare}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <VentasCompareLineChart
                            data={chartData}
                            labelActual="Actual"
                            labelCompare={labelCompare}
                        />
                    </div>

                    {compare === "yoy" && data?.has_compare_data === false && (
                        <div className="mt-6 rounded-lg border border-amber-900/30 bg-amber-900/10 p-4 text-sm text-amber-300/80">
                            <span className="font-bold text-amber-400">Aviso:</span> No hay datos suficientes para comparar contra el año anterior en este rango. Necesitás historial del mismo período del año pasado.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}