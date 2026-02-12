"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { ParetoChartPoint } from "@/lib/pareto/toChart";

/* --- Los helpers money y pct se mantienen igual --- */

export function ParetoComboChart({
  data,
  umbralPct = 80,
  title = "Pareto (valor + % acumulado)",
}: {
  data: ParetoChartPoint[];
  umbralPct?: number;
  title?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/40 text-sm text-slate-400">
        Sin datos para graficar
      </div>
    );
  }

  return (
    /* h-full permite que si el div de afuera mide 500px, el gráfico mida 500px */
    <div className="flex h-full w-full min-w-0 flex-col rounded-xl border border-slate-700/50 bg-slate-900/20 p-5 shadow-sm">
      
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</div>
        <div className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
          Corte {umbralPct}%
        </div>
      </div>

      {/* flex-1 hace que este div ocupe todo el espacio sobrante del padre.
          ResponsiveContainer luego llena este div al 100%.
      */}
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              interval={0}
              height={70} // Aumentamos para que los nombres rotados no se salgan
              tick={(props) => {
                const { x, y, payload } = props;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={14}
                      textAnchor="end"
                      fill="#94a3b8"
                      transform="rotate(-40)"
                      className="text-[9px] font-medium"
                    >
                      {payload.value.length > 12 ? `${payload.value.substring(0, 10)}...` : payload.value}
                    </text>
                  </g>
                );
              }}
            />

            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const n = Number(v || 0);
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
                return n.toString();
              }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={10}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              cursor={{ opacity: 0.3 }}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "10px",
                fontSize: "12px"
              }}
              labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
            />

            <ReferenceLine
              yAxisId="right"
              y={umbralPct}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
            />

            <Bar
              yAxisId="left"
              dataKey="valor"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pctAcum"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 border-t border-slate-800/50 p-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-blue-500" /> Venta
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-3 bg-green-500" /> % Acumulado
        </div>
      </div>
    </div>
  );
}