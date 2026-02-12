"use client";

import { useMemo, useState } from "react";

export function ParetoATableClient({
  rows,
  total,
}: {
  rows: any[];
  total: number;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const sku = String(r.sku ?? "").toLowerCase();
      const nombre = String(r.nombre ?? "").toLowerCase();
      return sku.includes(s) || nombre.includes(s);
    });
  }, [q, rows]);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(n ?? 0));

  const fmtPct = (x: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(Number(x ?? 0));

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-slate-400">
          Lista Pareto A (productos que componen el {Math.round(0.8 * 100)}%)
        </h3>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por SKU o nombre…"
          className="w-full sm:w-[320px] rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-500"
        />
      </div>

      <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
            <tr className="text-slate-400">
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-right">% del total</th>
              <th className="p-2 text-right">% acumulado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {filtered.map((r) => {
              const valor = Number(r.valor ?? 0);
              const pct = r.pct != null ? Number(r.pct) : total > 0 ? valor / total : 0;
              const pctAcc = r.pct_acumulado != null ? Number(r.pct_acumulado) : 0;

              return (
                <tr key={r.sku} className="hover:bg-slate-800/40">
                  <td className="p-2">
                    <div className="text-slate-200 font-medium truncate max-w-[420px]">
                      {r.nombre}
                    </div>
                    <div className="text-xs text-slate-500">
                      SKU: {r.sku} • {Number(r.unidades ?? 0).toLocaleString("es-AR")} u.
                    </div>
                  </td>

                  <td className="p-2 text-right font-mono text-slate-200">
                    {fmtMoney(valor)}
                  </td>

                  <td className="p-2 text-right text-slate-200">
                    {fmtPct(pct)}
                  </td>

                  <td className="p-2 text-right">
                    <span
                      className={`font-semibold ${
                        pctAcc <= 0.8 ? "text-emerald-400" : "text-slate-300"
                      }`}
                    >
                      {fmtPct(pctAcc)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-center text-slate-500" colSpan={4}>
                  No hay resultados para “{q}”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
