import { formatNumber } from "@/lib/utils copy"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function ToolData({ output, index }: { output: any, index: number }) {

    const salesChartData = output.bestDays?.sales?.slice(0, 5).map((item: any) => ({
        fecha: new Date(item.day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        ventas: item.ventas,
        facturas: item.facturas,
    })) || []

    const paymentsChartData = output.bestDays?.payments?.slice(0, 5).map((item: any) => ({
        fecha: new Date(item.day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        pagos: item.pagos,
    })) || []

    const topProductsChartData = output.topProducts.map((item: any) => ({
        nombre: item.nombre.length > 20 ? item.nombre.substring(0, 20) + '...' : item.nombre,
        venta: parseFloat(item.ventaTotal),
        unidades: item.unidades,
    })) || []

    return (
        <div key={index} className="mt-3 space-y-4">
            {/* KPIs Cards */}
            <div className="flex gap-3">
                <div className="flex-auto bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Ventas</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${formatNumber(output.kpis.total_ventas)}
                    </p>
                </div>

                <div className="flex-auto bg-linear-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Pagos</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${formatNumber(output.kpis.total_pagos)}
                    </p>
                </div>

                <div className="flex-auto bg-linear-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Facturas</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {output.kpis.cant_facturas}
                    </p>
                </div>

                <div className="flex-auto bg-linear-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Ticket Promedio</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        ${formatNumber(output.kpis.ticket_promedio)}
                    </p>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gráfico de Ventas */}
                {salesChartData.length > 0 && (
                    <div className="bg-background/50 border rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3">📈 Top Días de Ventas</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={salesChartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip
                                    formatter={(value: any) => [`${formatNumber(value)}`, 'Ventas']}
                                    contentStyle={{ fontSize: '12px' }}
                                />
                                <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Gráfico de Pagos */}
                {paymentsChartData.length > 0 && (
                    <div className="bg-background/50 border rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3">💰 Top Días de Pagos</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={paymentsChartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip
                                    formatter={(value: any) => [`${formatNumber(value)}`, 'Pagos']}
                                    contentStyle={{ fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Top Productos */}
            {topProductsChartData.length > 0 && (
                <div className="bg-background/50 border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">🏆 Top Productos por Venta</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topProductsChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 10 }} />
                            <Tooltip
                                formatter={(value: any, name: string) => {
                                    if (name === 'venta') return [`${formatNumber(value)}`, 'Venta Total']
                                    return [value, 'Unidades']
                                }}
                                contentStyle={{ fontSize: '12px' }}
                            />
                            <Bar dataKey="venta" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Período */}
            {output.range && (
                <div className="text-xs text-muted-foreground text-center">
                    Período: {new Date(output.range.from).toLocaleDateString('es-AR')} → {new Date(output.range.to).toLocaleDateString('es-AR')}
                </div>
            )}
        </div>)
}