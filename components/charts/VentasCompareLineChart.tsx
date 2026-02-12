"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type PointCompare = {
  day: string;
  ventas_actual: number;
  ventas_compare: number;
};

export function VentasCompareLineChart({
  data,
  labelActual = "Actual",
  labelCompare = "Comparación",
}: {
  data: PointCompare[];
  labelActual?: string;
  labelCompare?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-400">
        Sin datos para graficar en este rango
      </div>
    );
  }

  return (
    <div className="h-80 min-w-0 rounded-lg border border-slate-700 bg-slate-800 p-4">
      {/* Leyenda simple arriba (claridad, cero confusión) */}
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          {labelActual}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
          {labelCompare}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: "12px" }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#f1f5f9" }}
          />
          {/* Actual (azul, igual que tu chart actual) */}
          <Line
            type="monotone"
            dataKey="ventas_actual"
            name={labelActual}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          {/* Compare (gris) */}
          <Line
            type="monotone"
            dataKey="ventas_compare"
            name={labelCompare}
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
