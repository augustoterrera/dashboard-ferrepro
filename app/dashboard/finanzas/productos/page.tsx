import { headers } from "next/headers";
import { DateRangeBar } from "@/components/filters/DateRangeBar";
import { getProductosPorFacturacion, getProductosPorUnidades, getProductosKpis } from "@/lib/data/finanzas";
import { ProductosFilters } from "@/components/finanzas/ProductosFilters";
import { ProductosTableClient } from "@/components/finanzas/ProductosTableClient";
import { InfoTip } from '@/components/info-tip';

// --- Componente KPI Refinado con InfoTip ---
function KPI({ 
    label, 
    value, 
    hint, 
    tooltip 
}: { 
    label: string; 
    value: string; 
    hint?: string; 
    tooltip?: string 
}) {
    return (
        <div className="rounded-xl bg-slate-800/40 p-5 border border-slate-700/50 shadow-sm transition-all hover:bg-slate-800/60">
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {label}
                </span>
                {tooltip && <InfoTip text={tooltip} />}
            </div>
            <div className="text-2xl font-semibold text-white">{value}</div>
            {hint && (
                <div className="mt-1 text-xs text-slate-500 truncate" title={hint}>
                    {hint}
                </div>
            )}
        </div>
    );
}

const pct = (x: number) => new Intl.NumberFormat("es-AR", { 
    style: "percent", 
    maximumFractionDigits: 1 
}).format(Number(x ?? 0));

function money(n: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Number(n ?? 0));
}

export default async function ProductosPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; tab?: string; q?: string; page?: string }>;
}) {
    headers(); 

    const sp = await searchParams;

    const defaultFrom = "2026-01-04";
    const defaultTo = "2026-02-03";

    const from = sp.from ?? defaultFrom;
    const to = sp.to ?? defaultTo;

    const tab = (sp.tab === "unidades" ? "unidades" : "facturacion") as "facturacion" | "unidades";

    const q = (sp.q ?? "").trim();
    const page = Math.max(1, Number(sp.page ?? 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const data =
        tab === "unidades"
            ? await getProductosPorUnidades({ from, to, empresaId: null, q: q || null, limit, offset })
            : await getProductosPorFacturacion({ from, to, empresaId: null, q: q || null, limit, offset });

    const rows = data?.rows ?? [];

    const kpisData = await getProductosKpis({ from, to, empresaId: null });

    const k = kpisData?.kpis ?? {};
    const topFact = kpisData?.top?.por_facturacion ?? null;
    const topUni = kpisData?.top?.por_unidades ?? null;

    return (
        <main className="mx-auto max-w-7xl space-y-6 p-8 text-slate-200">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                        Productos <span className="text-blue-500 text-xl not-italic">Catálogo</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Análisis de rendimiento por artículo
                    </p>
                </div>

                <div className="rounded-xl bg-slate-900/50 p-2 ring-1 ring-slate-800">
                    <DateRangeBar defaultFrom={defaultFrom} defaultTo={defaultTo} />
                </div>
            </header>

            {/* KPIs GRID CON EXPLICACIONES */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPI 
                    label="Facturación total" 
                    value={money(k.total_facturacion)} 
                    hint={topFact?.nombre ? `#1: ${topFact.nombre}` : undefined} 
                    tooltip="Ingresos totales generados por la venta de productos en el rango seleccionado."
                />
                <KPI 
                    label="Unidades totales" 
                    value={Math.round(Number(k.total_unidades ?? 0)).toLocaleString("es-AR")} 
                    hint={topUni?.nombre ? `#1: ${topUni.nombre}` : undefined} 
                    tooltip="Cantidad física total de artículos vendidos."
                />
                <KPI 
                    label="Productos distintos" 
                    value={String(k.cant_skus ?? 0)} 
                    tooltip="Cantidad de SKUs (referencias únicas) que tuvieron al menos una venta en este período."
                />
                <KPI 
                    label="Top 5 (share)" 
                    value={pct(k.top5_share)} 
                    hint="Participación de los líderes" 
                    tooltip="Indica qué porcentaje de la facturación total es explicada por los 5 productos más vendidos. Si es muy alto, tu negocio depende de pocos artículos."
                />
            </section>

            {/* Filtros y Buscador */}
            <div className="relative z-10">
                <ProductosFilters
                    from={from}
                    to={to}
                    tab={tab}
                    q={q}
                    page={page}
                />
            </div>

            {/* Tabla de resultados */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-1 shadow-xl">
                <ProductosTableClient
                    from={from}
                    to={to}
                    tab={tab}
                    q={q}
                    initialPage={page}
                    initialRows={rows}
                    limit={10}
                />
            </div>
        </main>
    );
}