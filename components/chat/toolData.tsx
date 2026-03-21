import { formatNumber } from "@/lib/utils copy"
import {
    Bar, BarChart, CartesianGrid, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend
} from "recharts"

const TOOLTIP_STYLE = {
    fontSize: '12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#cbd5e1',
}

const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 }
const GRID_STYLE = { strokeDasharray: "3 3", stroke: '#334155', opacity: 0.6 }

// ─── getStats ───────────────────────────────────────────────────────────────

function StatsView({ output }: { output: any }) {
    const salesChartData = output.bestDays?.sales?.slice(0, 5).map((item: any) => ({
        fecha: new Date(item.day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        ventas: item.ventas,
    })) ?? []

    const paymentsChartData = output.bestDays?.payments?.slice(0, 5).map((item: any) => ({
        fecha: new Date(item.day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        pagos: item.pagos,
    })) ?? []

    const topProductsData = (output.topProducts ?? []).map((item: any) => ({
        nombre: (item.nombre ?? "").length > 22 ? (item.nombre ?? "").substring(0, 22) + '…' : (item.nombre ?? ""),
        venta: parseFloat(item.venta_total ?? item.ventaTotal ?? 0),
    }))

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Total Ventas" value={`$${formatNumber(output.kpis?.total_ventas)}`} color="blue" />
                <KpiCard label="Total Pagos" value={`$${formatNumber(output.kpis?.total_pagos)}`} color="green" />
                <KpiCard label="Facturas" value={output.kpis?.cant_facturas} color="purple" />
                <KpiCard label="Ticket Promedio" value={`$${formatNumber(output.kpis?.ticket_promedio)}`} color="orange" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salesChartData.length > 0 && (
                    <ChartBox title="📈 Top Días de Ventas">
                        <BarChart data={salesChartData}>
                            <CartesianGrid {...GRID_STYLE} />
                            <XAxis dataKey="fecha" tick={AXIS_TICK} />
                            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Ventas']} contentStyle={TOOLTIP_STYLE} />
                            <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartBox>
                )}
                {paymentsChartData.length > 0 && (
                    <ChartBox title="💰 Top Días de Pagos">
                        <LineChart data={paymentsChartData}>
                            <CartesianGrid {...GRID_STYLE} />
                            <XAxis dataKey="fecha" tick={AXIS_TICK} />
                            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Pagos']} contentStyle={TOOLTIP_STYLE} />
                            <Line type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ChartBox>
                )}
            </div>

            {topProductsData.length > 0 && (
                <ChartBox title="🏆 Top Productos por Venta" height={280}>
                    <BarChart data={topProductsData} layout="vertical">
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis type="number" tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Venta']} contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="venta" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartBox>
            )}

            <PeriodLabel range={output.range} />
        </div>
    )
}

// ─── ventasComparacion / ventasYOY ───────────────────────────────────────────

function VentasComparacionView({ output }: { output: any }) {
    const s = output.summary ?? {}
    const isYOY = output.type === "ventasYOY"
    const compareLabel = isYOY ? "Año anterior" : "Período anterior"
    const deltaPositive = (s.delta ?? 0) >= 0

    const seriesData = (output.series ?? []).map((d: any) => ({
        fecha: new Date(d.day ?? d.cur_day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        actual: d.ventas_actual,
        anterior: d.ventas_compare,
    }))

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Ventas Actual" value={`$${formatNumber(s.total_actual)}`} color="blue" />
                <KpiCard label={compareLabel} value={`$${formatNumber(s.total_compare)}`} color="slate" />
                <KpiCard
                    label="Variación"
                    value={s.delta_pct != null ? `${(s.delta_pct * 100).toFixed(1)}%` : "N/A"}
                    color={deltaPositive ? "green" : "red"}
                    sub={deltaPositive ? "▲" : "▼"}
                />
                <KpiCard label="Facturas" value={s.facturas_actual} color="purple" />
            </div>

            {seriesData.length > 0 && (
                <ChartBox title="📊 Ventas: Actual vs Anterior" height={220}>
                    <LineChart data={seriesData}>
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis dataKey="fecha" tick={AXIS_TICK} />
                        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(v: any, name: string) => [`$${formatNumber(v)}`, name === "actual" ? "Actual" : compareLabel]}
                            contentStyle={TOOLTIP_STYLE}
                        />
                        <Legend
                            formatter={(v) => (
                                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                                    {v === "actual" ? "Actual" : compareLabel}
                                </span>
                            )}
                        />
                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="anterior" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                </ChartBox>
            )}

            <PeriodLabel range={output.range} compareRange={output.compare_range} />
        </div>
    )
}

// ─── pareto ──────────────────────────────────────────────────────────────────

function ParetoView({ output }: { output: any }) {
    const rows = (output.rows ?? []).slice(0, 15)
    const chartData = rows.map((r: any) => ({
        nombre: (r.nombre ?? "").length > 20 ? (r.nombre ?? "").substring(0, 20) + '…' : (r.nombre ?? ""),
        valor: r.valor,
        pct_acumulado: +(r.pct_acumulado * 100).toFixed(1),
    }))

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Facturación Total" value={`$${formatNumber(output.total)}`} color="blue" />
                <KpiCard label="Productos en el 80%" value={output.rows?.length ?? 0} color="purple" />
            </div>

            {chartData.length > 0 && (
                <ChartBox title="🏅 Productos Pareto 80/20" height={320}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis type="number" tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Facturación']} contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="valor" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartBox>
            )}

            <PeriodLabel range={output.range} />
        </div>
    )
}

// ─── paretoComparacion ───────────────────────────────────────────────────────

function ParetoComparacionView({ output }: { output: any }) {
    const m = output.metrics ?? {}
    const entered = output.changes?.entered ?? []
    const exited = output.changes?.exited ?? []

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Productos A (actual)" value={m.current_a_count} color="blue" />
                <KpiCard label="Productos A (anterior)" value={m.previous_a_count} color="slate" />
                <KpiCard label="Nuevos en A" value={entered.length} color="green" />
                <KpiCard label="Salieron de A" value={exited.length} color="red" />
            </div>

            {entered.length > 0 && (
                <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Entraron al Pareto A</h4>
                    <div className="space-y-1.5">
                        {entered.slice(0, 8).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs text-slate-300">
                                <span className="truncate max-w-[70%]">{p.nombre}</span>
                                <span className="font-mono text-green-400">${formatNumber(p.valor_actual)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {exited.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">❌ Salieron del Pareto A</h4>
                    <div className="space-y-1.5">
                        {exited.slice(0, 8).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs text-slate-300">
                                <span className="truncate max-w-[70%]">{p.nombre}</span>
                                <span className="font-mono text-red-400">${formatNumber(p.valor_anterior)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <PeriodLabel range={output.range} compareRange={output.previous_range} />
        </div>
    )
}

// ─── topUnidades ─────────────────────────────────────────────────────────────

function TopUnidadesView({ output }: { output: any }) {
    const rows = (output.rows ?? []).slice(0, 15)
    const chartData = rows.map((r: any) => ({
        nombre: (r.nombre ?? "").length > 22 ? (r.nombre ?? "").substring(0, 22) + '…' : (r.nombre ?? ""),
        unidades: r.unidades,
    }))

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Productos rankeados" value={output.rows?.length ?? 0} color="blue" />
            </div>

            {chartData.length > 0 && (
                <ChartBox title="📦 Top Productos por Unidades" height={300}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis type="number" tick={AXIS_TICK} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Tooltip formatter={(v: any) => [v, 'Unidades']} contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="unidades" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartBox>
            )}

            <PeriodLabel range={output.range} />
        </div>
    )
}

// ─── metodosPago ─────────────────────────────────────────────────────────────

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"]

function MetodosPagoView({ output }: { output: any }) {
    const rows = output.rows ?? []
    const total = rows.reduce((acc: number, r: any) => acc + Number(r.monto_total ?? 0), 0)
    const pieData = rows.map((r: any) => ({
        name: r.tipo_pago,
        value: +(r.pct_sobre_total ?? 0),
    }))

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <KpiCard label="Métodos detectados" value={rows.length} color="blue" />
                <KpiCard label="Monto total" value={`$${formatNumber(total)}`} color="blue" />
            </div>

            {pieData.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-slate-200 mb-4">💳 Distribución de Métodos de Pago</h4>
                    <div className="flex gap-6 items-center">
                        <div className="shrink-0" style={{ width: 180, height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={36}
                                    >
                                        {pieData.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Participación']}
                                        contentStyle={TOOLTIP_STYLE}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex-1 space-y-3 min-w-0">
                            {rows.map((r: any, i: number) => {
                                const pct = Number(r.pct_sobre_total ?? 0)
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="text-sm font-medium text-slate-200 truncate">{r.tipo_pago}</span>
                                            </div>
                                            <span className="text-sm font-bold shrink-0" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                                                {pct.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${Math.min(pct, 100)}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                                            />
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-400 pl-4">
                                            <span>{r.cantidad_usos} usos</span>
                                            <span className="font-medium text-slate-300">${formatNumber(r.monto_total)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; border: string; label: string; value: string }> = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/25",   label: "text-slate-400", value: "text-blue-400" },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/25",  label: "text-slate-400", value: "text-green-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/25", label: "text-slate-400", value: "text-purple-400" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/25", label: "text-slate-400", value: "text-orange-400" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/25",    label: "text-slate-400", value: "text-red-400" },
    slate:  { bg: "bg-slate-700/30",  border: "border-slate-600/40",  label: "text-slate-400", value: "text-slate-300" },
}

function KpiCard({ label, value, color, sub }: { label: string; value: any; color: string; sub?: string }) {
    const c = colorMap[color] ?? colorMap.blue
    return (
        <div className={`flex-auto min-w-28 ${c.bg} ${c.border} border rounded-lg p-3`}>
            <p className={`text-xs ${c.label} mb-1`}>{label}</p>
            <p className={`text-lg font-bold ${c.value}`}>
                {sub && <span className="text-sm mr-1">{sub}</span>}
                {value ?? "—"}
            </p>
        </div>
    )
}

function ChartBox({ title, children, height = 200 }: { title: string; children: React.ReactNode; height?: number }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">{title}</h4>
            <ResponsiveContainer width="100%" height={height}>
                {children as any}
            </ResponsiveContainer>
        </div>
    )
}

function PeriodLabel({ range, compareRange }: { range?: any; compareRange?: any }) {
    if (!range) return null
    return (
        <div className="text-xs text-slate-500 text-center">
            Período: {new Date(range.from).toLocaleDateString('es-AR')} → {new Date(range.to).toLocaleDateString('es-AR')}
            {compareRange && (
                <span className="ml-2 text-slate-600">
                    | Comparado con: {new Date(compareRange.from).toLocaleDateString('es-AR')} → {new Date(compareRange.to).toLocaleDateString('es-AR')}
                </span>
            )}
        </div>
    )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function ToolData({ output, toolName }: { output: any; toolName?: string; index?: number }) {
    const type = toolName ?? output?.type

    switch (type) {
        case "getStats":
            return <StatsView output={output} />
        case "ventasComparacion":
        case "ventasYOY":
            return <VentasComparacionView output={output} />
        case "pareto":
            return <ParetoView output={output} />
        case "paretoComparacion":
            return <ParetoComparacionView output={output} />
        case "topUnidades":
            return <TopUnidadesView output={output} />
        case "metodosPago":
            return <MetodosPagoView output={output} />
        default:
            if (output?.kpis) return <StatsView output={output} />
            return (
                <div className="text-sm text-slate-400 text-center py-8">
                    No hay visualización disponible para este tipo de datos.
                </div>
            )
    }
}
