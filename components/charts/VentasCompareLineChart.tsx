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

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
};

const formatXAxis = (day: string) => {
  const parts = day.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return day;
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
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-400">
        Sin datos para graficar en este rango
      </div>
    );
  }

  return (
    <div className="h-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: "10px" }} tickFormatter={formatXAxis} />
          <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} tickFormatter={formatYAxis} width={48} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#f1f5f9" }}
            formatter={(value: number, name: string) => [formatYAxis(value), name]}
            labelFormatter={formatXAxis}
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
