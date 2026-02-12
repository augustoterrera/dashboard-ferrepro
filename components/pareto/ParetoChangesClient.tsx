"use client";

import { useState } from "react";

function ParetoChangesTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-y-auto max-h-[420px] border border-slate-700 rounded-xl">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
          <tr className="text-slate-400">
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-right">Actual</th>
            <th className="p-2 text-right">Anterior</th>
            <th className="p-2 text-right">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => (
            <tr key={r.sku} className="hover:bg-slate-800/40">
              <td className="p-2 text-slate-200 truncate max-w-[240px]">
                {r.nombre}
              </td>
              <td className="p-2 text-right">
                {Number(r.valor_actual ?? 0).toLocaleString("es-AR")}
              </td>
              <td className="p-2 text-right text-slate-400">
                {Number(r.valor_anterior ?? 0).toLocaleString("es-AR")}
              </td>
              <td
                className={`p-2 text-right font-medium ${
                  Number(r.delta_valor ?? 0) > 0
                    ? "text-emerald-400"
                    : Number(r.delta_valor ?? 0) < 0
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {Number(r.delta_valor ?? 0).toLocaleString("es-AR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ParetoChangesClient({
  changes,
}: {
  changes: { entered: any[]; exited: any[]; stayed: any[] };
}) {
  const [tab, setTab] = useState<"entered" | "exited" | "stayed">("entered");

  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: "entered", label: "Entraron" },
    { key: "exited", label: "Salieron" },
    { key: "stayed", label: "Se mantuvieron" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              tab === t.key
                ? "bg-blue-600/20 border-blue-500 text-blue-300"
                : "bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ParetoChangesTable rows={changes[tab] ?? []} />
    </section>
  );
}
