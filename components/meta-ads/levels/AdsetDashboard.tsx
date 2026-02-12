"use client";

import { InfoTip } from "@/components/info-tip";
import { ThresholdChips } from "@/components/meta-ads/ThresholdChips";
import type { CompareMode, MetaRecoRow } from "@/lib/data/marketing";
import type { MetaThresholdsUI } from "@/components/meta-ads/MetaAdsDashboard";

type Reco = MetaRecoRow["accion_recomendada"];

function money0(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function money2(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(n ?? 0));
}
function num0(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function num2(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(n ?? 0));
}

function RecoBadge({ v }: { v: Reco }) {
  const cls =
    v === "ESCALAR"
      ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
      : v === "PAUSAR"
      ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20"
      : v === "REVISAR_ARTE"
      ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
      : v === "SATURACION"
      ? "bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-500/20"
      : "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20";

  return <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${cls}`}>{v}</span>;
}

export function AdsetDashboard({
  data,
  labelCompare,
  compare,
  thresholds,
}: {
  data: MetaRecoRow[];
  labelCompare: string;
  compare: CompareMode;
  thresholds: MetaThresholdsUI;
}) {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <ThresholdChips {...thresholds} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Sin AdSets para este rango (probá bajar “Min Conv”).
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Ranking de AdSets</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Segmentación: acá se decide escalar/pausar
              </p>
            </div>
            <InfoTip text="AdSet = audiencia. CAC alto con CTR bueno suele ser costo/audiencia, no creativo." />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/40 text-slate-400">
                <tr>
                  <th className="px-5 py-3">AdSet</th>
                  <th className="px-5 py-3 text-center">Acción</th>
                  <th className="px-5 py-3 text-right">Spend</th>
                  <th className="px-5 py-3 text-right">Conv</th>
                  <th className="px-5 py-3 text-right">CAC</th>
                  <th className="px-5 py-3 text-right">CTR</th>
                  <th className="px-5 py-3 text-right">CPM</th>
                  <th className="px-5 py-3 text-right">Freq</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="max-w-105 truncate font-black text-slate-200" title={r.name}>
                        {r.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Reach {num0(r.reach)}</span>
                        <span>·</span>
                        <span>Imp {num0(r.impressions)}</span>
                        {r.motivo ? (
                          <>
                            <span>·</span>
                            <InfoTip text={r.motivo} />
                          </>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-center">
                      <RecoBadge v={r.accion_recomendada} />
                    </td>

                    <td className="px-5 py-3 text-right font-mono text-slate-200">{money0(r.spend)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-200">{num0(r.conversations_started)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-200">{r.cac == null ? "—" : money2(r.cac)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{r.ctr == null ? "—" : `${num2(r.ctr)}%`}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{r.cpm == null ? "—" : money2(r.cpm)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{r.frequency == null ? "—" : num2(r.frequency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Tip: si CAC sube pero CTR está bien, suele ser audiencia/costo. Probá expandir o cambiar segmentación.
          </div>
        </div>
      )}
    </div>
  );
}
