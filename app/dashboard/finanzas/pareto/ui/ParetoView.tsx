"use client";
import type {
    Pareto80Response,
    ParetoComparacionResponse,
    ParetoRow,
} from "@/types/pareto";
import { buildParetoChartData } from "@/lib/pareto/toChart";
import { ParetoComboChart } from "@/components/charts/ParetoComboChart";
import { InfoTip } from "@/components/info-tip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";

/* ---------------- helpers (Manteniendo tu lógica original) ---------------- */

function money(n: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(n || 0);
}

function pct(n: number) {
    return `${Math.round((n || 0) * 1000) / 10}%`;
}

function clamp01(x: number) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

function calcTopShare(rows: ParetoRow[], total: number, topN: number) {
    if (!total || total <= 0) return 0;
    const sum = rows
        .slice()
        .sort((a, b) => (b.valor || 0) - (a.valor || 0))
        .slice(0, topN)
        .reduce((acc, r) => acc + (r.valor || 0), 0);

    return sum / total;
}

function Card({
    title,
    value,
    hint,
    tooltip,
}: {
    title: string;
    value: string;
    hint?: string;
    tooltip?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 shadow-sm transition-all hover:bg-slate-800/60">
            <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</div>
                {tooltip && <InfoTip text={tooltip} />}
            </div>
            <div className="mt-1 text-2xl font-bold text-white">{value}</div>
            {hint ? <div className="mt-1 text-xs text-slate-500 italic">{hint}</div> : null}
        </div>
    );
}

function DeltaBadge({ value }: { value: number }) {
    const up = value > 0;
    const down = value < 0;

    const cls = up
        ? "border-green-700 bg-green-600/15 text-green-300"
        : down
            ? "border-red-700 bg-red-600/15 text-red-300"
            : "border-slate-600 bg-slate-700/20 text-slate-200";

    return (
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${cls}`}>
            {money(value)}
        </span>
    );
}

function SmallPill({
    children,
    tone = "slate",
}: {
    children: React.ReactNode;
    tone?: "green" | "red" | "slate" | "amber";
}) {
    const cls =
        tone === "green"
            ? "bg-green-600/15 text-green-300 border-green-700"
            : tone === "red"
                ? "bg-red-600/15 text-red-300 border-red-700"
                : tone === "amber"
                    ? "bg-amber-500/15 text-amber-200 border-amber-600"
                    : "bg-slate-700/20 text-slate-200 border-slate-600";

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${cls}`}>
            {children}
        </span>
    );
}

/* ---------------- UI blocks ---------------- */

function ParetoTable({ rows, total }: { rows: ParetoRow[]; total: number }) {
    const [sortConfig, setSortConfig] = useState<{
        key: 'valor' | 'unidades' | 'pct' | 'pct_acumulado';
        direction: 'asc' | 'desc';
    }>({ key: 'valor', direction: 'desc' });

    const sortedRows = useMemo(() => {
        const sorted = [...rows].sort((a, b) => {
            const aVal = a[sortConfig.key] || 0;
            const bVal = b[sortConfig.key] || 0;
            return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
        });
        return sorted;
    }, [rows, sortConfig]);

    const handleSort = (key: typeof sortConfig.key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const SortIcon = ({ columnKey }: { columnKey: typeof sortConfig.key }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronsUpDown size={12} className="text-slate-600" />;
        }
        return sortConfig.direction === 'desc' 
            ? <ChevronDown size={12} className="text-blue-400" />
            : <ChevronUp size={12} className="text-blue-400" />;
    };

    return (
        <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden lg:h-125">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/20">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-bold uppercase tracking-widest text-slate-400">Ranking Pareto</div>
                    <InfoTip text="Productos ordenados por valor de venta descendente. Los productos en Clase A están resaltados en verde. Haz clic en los encabezados para ordenar." />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500/30 border-l-4 border-emerald-500 rounded-sm"></div>
                        <span className="text-xs text-slate-500">Clase A</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        {rows.length} productos
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-[#1e293b] text-slate-400">
                        <tr className="text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                            <th className="px-4 py-3 text-left w-10">#</th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center gap-1">
                                    SKU
                                    <InfoTip text="Código único del producto" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">Producto</th>
                            <th 
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                                onClick={() => handleSort('unidades')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Unidades</span>
                                    <SortIcon columnKey="unidades" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                                onClick={() => handleSort('valor')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Valor</span>
                                    <SortIcon columnKey="valor" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <span>Precio Prom.</span>
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                                onClick={() => handleSort('pct')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>% Part.</span>
                                    <SortIcon columnKey="pct" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                                onClick={() => handleSort('pct_acumulado')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>% Acum.</span>
                                    <SortIcon columnKey="pct_acumulado" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {sortedRows.map((r, idx) => {
                            const pctIndividual = total > 0 ? (r.valor || 0) / total : 0;
                            const precioPromedio = (r.unidades || 0) > 0 ? (r.valor || 0) / (r.unidades || 0) : 0;
                            
                            return (
                                <tr 
                                    key={`${r.sku ?? "null"}-${idx}`} 
                                    className={`group transition-colors text-slate-300 hover:bg-slate-700/20 ${
                                        r.es_80 ? "bg-emerald-500/3 border-l-4 border-emerald-500/30" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                        {r.sku ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div
                                            className="max-w-60 truncate font-medium group-hover:text-white cursor-help"
                                            title={r.nombre ?? "-"}
                                        >
                                            {r.nombre ?? "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                                        {new Intl.NumberFormat("es-AR").format(r.unidades || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-200 font-semibold">
                                        {money(r.valor || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">
                                        {money(precioPromedio)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        <span className={`${
                                            pctIndividual >= 0.05 ? "text-emerald-400 font-semibold" :
                                            pctIndividual >= 0.02 ? "text-slate-300" :
                                            "text-slate-500"
                                        }`}>
                                            {pct(clamp01(pctIndividual))}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-slate-400">
                                                {pct(clamp01(r.pct_acumulado || 0))}
                                            </span>
                                            {r.es_80 && r.pct_acumulado && r.pct_acumulado >= 0.79 && r.pct_acumulado <= 0.81 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" 
                                                     title="Punto de corte del 80%"></div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Resumen al pie */}
            <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/20 flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs">
                    <div>
                        <span className="text-slate-500">Total Unidades: </span>
                        <span className="font-mono font-semibold text-slate-300">
                            {new Intl.NumberFormat("es-AR").format(
                                rows.reduce((acc, r) => acc + (r.unidades || 0), 0)
                            )}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500">Total Valor: </span>
                        <span className="font-mono font-semibold text-slate-200">
                            {money(total)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChangesCard({
    title,
    tone,
    items,
    tooltip,
}: {
    title: string;
    tone: "green" | "red" | "slate";
    items: { sku: string | null; nombre: string | null; delta_valor: number }[];
    tooltip: string;
}) {
    const [open, setOpen] = useState(false);
    const top = items.slice(0, 5);
    const hasMore = items.length > 5;

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</div>
                    <InfoTip text={tooltip} />
                </div>
                <SmallPill tone={tone}>{items.length}</SmallPill>
            </div>

            <div className="space-y-3">
                {top.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">Sin cambios registrados</div>
                ) : (
                    <>
                        {top.map((it, idx) => (
                            <div key={`${it.sku ?? "null"}-${idx}`} className="flex items-center justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-medium text-slate-200 group-hover:text-white" title={it.nombre ?? ""}>{it.nombre ?? "-"}</div>
                                    <div className="truncate text-[10px] text-slate-500 font-mono">{it.sku ?? ""}</div>
                                </div>
                                <DeltaBadge value={it.delta_valor || 0} />
                            </div>
                        ))}
                    </>
                )}

                {hasMore && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="w-full pt-3 text-[10px] text-center font-bold text-blue-400 hover:text-blue-300 border-t border-slate-700/50 uppercase tracking-tighter transition-colors">
                                Ver todos los productos ({items.length})
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] bg-slate-900 border-slate-700 text-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                    {title}
                                    <SmallPill tone={tone}>{items.length}</SmallPill>
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                <div className="space-y-3">
                                    {items.map((it, idx) => (
                                        <div key={`${it.sku ?? "null"}-${idx}`} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-colors group">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-slate-200 group-hover:text-white mb-1" title={it.nombre ?? ""}>
                                                    {it.nombre ?? "-"}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">{it.sku ?? ""}</div>
                                            </div>
                                            <DeltaBadge value={it.delta_valor || 0} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

/* ---------------- main view ---------------- */

export function ParetoView({
    pareto,
    comparacionPrev,
    compareMode,
}: {
    pareto: Pareto80Response;
    comparacionPrev: ParetoComparacionResponse | null;
    compareMode: "prev" | "yoy";
}) {
    const total = pareto.total || 0;

    const aRows = useMemo(() => pareto.rows.filter((r) => r.es_80), [pareto.rows]);
    const aValor = useMemo(
        () => aRows.reduce((acc, r) => acc + (r.valor || 0), 0),
        [aRows]
    );
    const aShare = total > 0 ? aValor / total : 0;

    const top5share = useMemo(() => calcTopShare(pareto.rows, total, 5), [pareto.rows, total]);
    const top10share = useMemo(() => calcTopShare(pareto.rows, total, 10), [pareto.rows, total]);

    const chartData = useMemo(() => {
        return buildParetoChartData({
            rows: pareto.rows,
            top: 15,
        });
    }, [pareto.rows]);

    const umbralPct = Math.round((pareto.pareto.umbral || 0.8) * 100);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card
                    title="Total vendido"
                    value={money(total)}
                    hint={`${pareto.range.from} al ${pareto.range.to}`}
                    tooltip="Suma total del valor de ventas de todos los productos en el período seleccionado."
                />
                <Card
                    title="Productos Clase A"
                    value={`${aRows.length}`}
                    hint={`Umbral: ${umbralPct}%`}
                    tooltip={`Productos que representan hasta el ${umbralPct}% del total de ventas. Según el principio de Pareto, el 20% de los productos genera el 80% de las ventas.`}
                />
                <Card
                    title="Share A"
                    value={pct(aShare)}
                    hint="Participación en la venta"
                    tooltip="Porcentaje exacto del total de ventas que representan los productos de Clase A. Idealmente cercano al umbral definido."
                />
                <Card
                    title="Concentración (Top 5)"
                    value={pct(top5share)}
                    hint={`Top 10: ${pct(top10share)}`}
                    tooltip="Qué porcentaje de las ventas totales proviene de los 5 productos más vendidos. Alta concentración indica dependencia en pocos productos."
                />
            </div>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Izquierda: Chart + Table */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6 shadow-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                Pareto por producto (Valor + % acumulado)
                            </h3>
                            <InfoTip text="Gráfico combinado: las barras muestran el valor de venta por producto, la línea muestra el porcentaje acumulado. La línea roja marca el umbral del 80%." />
                        </div>
                        <div className="h-100">
                            <ParetoComboChart
                                data={chartData}
                                umbralPct={umbralPct}
                                title=""
                            />
                        </div>
                    </div>

                    <ParetoTable rows={pareto.rows} total={total} />
                </div>

                {/* Derecha: Sidebar de Cambios */}
                <div className="space-y-6">
                    {comparacionPrev ? (
                        <>
                            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 shadow-inner">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        {compareMode === "yoy" ? "vs Año anterior (YoY)" : "vs Período anterior"}
                                    </div>
                                    <InfoTip text={compareMode === "yoy" 
                                        ? "Compara el período actual con el mismo período del año anterior para detectar tendencias anuales."
                                        : "Compara con el período inmediatamente anterior de igual duración para detectar cambios recientes."
                                    } />
                                </div>

                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">
                                    Rango anterior:{" "}
                                    <span className="text-slate-300 font-mono">
                                        {comparacionPrev.previous_range.from} → {comparacionPrev.previous_range.to}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Share A Actual</div>
                                            <InfoTip text="Porcentaje de ventas de productos Clase A en el período actual." />
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {pct(comparacionPrev.metrics.current_a_share)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Share A Anterior</div>
                                            <InfoTip text="Porcentaje de ventas de productos Clase A en el período de comparación." />
                                        </div>
                                        <div className="text-lg font-bold text-slate-400">
                                            {pct(comparacionPrev.metrics.previous_a_share)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <SmallPill tone="slate">Actual: {comparacionPrev.metrics.current_a_count}</SmallPill>
                                    <SmallPill tone="slate">Anterior: {comparacionPrev.metrics.previous_a_count}</SmallPill>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ChangesCard 
                                    title="Entraron al 80%" 
                                    tone="green" 
                                    items={comparacionPrev.changes.entered}
                                    tooltip="Productos que no estaban en Clase A en el período anterior pero ahora sí. Oportunidades de crecimiento a monitorear."
                                />
                                <ChangesCard 
                                    title="Salieron del 80%" 
                                    tone="red" 
                                    items={comparacionPrev.changes.exited}
                                    tooltip="Productos que estaban en Clase A pero cayeron fuera del umbral. Requieren atención: ¿bajó la demanda o hay problemas de stock?"
                                />
                                <ChangesCard 
                                    title="Se mantuvieron" 
                                    tone="slate" 
                                    items={comparacionPrev.changes.stayed}
                                    tooltip="Productos que permanecen en Clase A en ambos períodos. El delta muestra si aumentaron o disminuyeron su valor de venta."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-slate-700 border-dashed bg-slate-800/20 p-8 text-center">
                            <div className="text-sm font-medium text-slate-400">
                                {compareMode === "yoy" ? "Comparación YoY" : "Comparación Período anterior"}
                            </div>
                            <p className="mt-2 text-xs text-slate-500 italic">
                                No hay datos de comparación para este rango.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}