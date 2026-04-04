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

import type { MetaPointCompare } from "@/components/meta-ads/MetaAdsDashboard";

type FormatKind = "money0" | "money2" | "pct2" | "num0" | "num2";

function fmt(kind: FormatKind, n: number) {
  if (kind === "money0")
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n ?? 0));
  if (kind === "money2")
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(n ?? 0));
  if (kind === "pct2")
    return new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 2 }).format(Number(n ?? 0));
  if (kind === "num2")
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(n ?? 0));
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(n ?? 0));
}

export function MetaAdsCompareLineChart({
  data,
  labelActual = "Actual",
  labelCompare = "Comparación",
  valueLabel,
  format = "num0",
}: {
  data: MetaPointCompare[];
  labelActual?: string;
  labelCompare?: string;
  valueLabel?: string;
  format?: FormatKind;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-52 sm:h-72 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-400">
        Sin datos para graficar en este rango
      </div>
    );
  }

  return (
    <div className="flex h-52 sm:h-72 min-w-0 flex-col rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          {labelActual}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
          {labelCompare}
        </div>
      </div>

      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            style={{ fontSize: "10px" }}
            tickFormatter={(v: string) => {
              const parts = v.split("-");
              return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v;
            }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} width={48} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            labelStyle={{ color: "#f1f5f9" }}
            formatter={(value: any) => {
              if (value == null) return ["—", valueLabel ?? ""];
              const n = Number(value);
              return [fmt(format, n), valueLabel ?? ""];
            }}
          />

          <Line type="monotone" dataKey="actual" name={labelActual} stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="compare" name={labelCompare} stroke="#94a3b8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
