import { formatNumber } from "@/lib/utils copy"
import {
    Bar, BarChart, CartesianGrid, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend
} from "recharts"

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
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Ventas']} contentStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartBox>
                )}
                {paymentsChartData.length > 0 && (
                    <ChartBox title="💰 Top Días de Pagos">
                        <LineChart data={paymentsChartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Pagos']} contentStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ChartBox>
                )}
            </div>

            {topProductsData.length > 0 && (
                <ChartBox title="🏆 Top Productos por Venta" height={280}>
                    <BarChart data={topProductsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Venta']} contentStyle={{ fontSize: '12px' }} />
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
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(v: any, name: string) => [`$${formatNumber(v)}`, name === "actual" ? "Actual" : compareLabel]}
                            contentStyle={{ fontSize: '12px' }}
                        />
                        <Legend formatter={(v) => v === "actual" ? "Actual" : compareLabel} />
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
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(v: any) => [`$${formatNumber(v)}`, 'Facturación']} contentStyle={{ fontSize: '12px' }} />
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✅ Entraron al Pareto A</h4>
                    <div className="space-y-1">
                        {entered.slice(0, 8).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs text-green-700">
                                <span className="truncate max-w-[70%]">{p.nombre}</span>
                                <span className="font-mono">${formatNumber(p.valor_actual)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {exited.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">❌ Salieron del Pareto A</h4>
                    <div className="space-y-1">
                        {exited.slice(0, 8).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs text-red-700">
                                <span className="truncate max-w-[70%]">{p.nombre}</span>
                                <span className="font-mono">${formatNumber(p.valor_anterior)}</span>
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
            <KpiCard label="Productos rankeados" value={output.rows?.length ?? 0} color="blue" />

            {chartData.length > 0 && (
                <ChartBox title="📦 Top Productos por Unidades" height={300}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="nombre" type="category" width={160} tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(v: any) => [v, 'Unidades']} contentStyle={{ fontSize: '12px' }} />
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
    const pieData = rows.map((r: any) => ({
        name: r.tipo_pago,
        value: +(r.pct_sobre_total ?? 0),
        monto: r.monto_total,
        usos: r.cantidad_usos,
    }))

    return (
        <div className="space-y-4">
            <KpiCard label="Métodos detectados" value={rows.length} color="blue" />

            {pieData.length > 0 && (
                <div className="bg-background/50 border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">💳 Distribución de Métodos de Pago</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <ResponsiveContainer width={220} height={220}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${value.toFixed(0)}%`} labelLine={false}>
                                    {pieData.map((_: any, i: number) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [`${v}%`, 'Participación']} contentStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {rows.map((r: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="flex-1 truncate">{r.tipo_pago}</span>
                                    <span className="text-muted-foreground text-xs">{r.cantidad_usos} usos</span>
                                    <span className="font-mono text-xs font-semibold">${formatNumber(r.monto_total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600",
    green: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-600",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600",
    orange: "from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-600",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-600",
    slate: "from-slate-500/10 to-slate-600/5 border-slate-500/20 text-slate-600",
}

function KpiCard({ label, value, color, sub }: { label: string; value: any; color: string; sub?: string }) {
    const c = colorMap[color] ?? colorMap.blue
    return (
        <div className={`flex-auto min-w-25 bg-linear-to-br ${c} border rounded-lg p-3`}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-lg font-bold ${c.split(' ').at(-1)}`}>
                {sub && <span className="text-sm mr-1">{sub}</span>}
                {value ?? "—"}
            </p>
        </div>
    )
}

function ChartBox({ title, children, height = 200 }: { title: string; children: React.ReactNode; height?: number }) {
    return (
        <div className="bg-background/50 border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3">{title}</h4>
            <ResponsiveContainer width="100%" height={height}>
                {children as any}
            </ResponsiveContainer>
        </div>
    )
}

function PeriodLabel({ range, compareRange }: { range?: any; compareRange?: any }) {
    if (!range) return null
    return (
        <div className="text-xs text-muted-foreground text-center">
            Período: {new Date(range.from).toLocaleDateString('es-AR')} → {new Date(range.to).toLocaleDateString('es-AR')}
            {compareRange && (
                <span className="ml-2 text-slate-400">
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
            // Fallback: intentar StatsView si tiene kpis
            if (output?.kpis) return <StatsView output={output} />
            return (
                <div className="text-sm text-muted-foreground text-center py-8">
                    No hay visualización disponible para este tipo de datos.
                </div>
            )
    }
}
