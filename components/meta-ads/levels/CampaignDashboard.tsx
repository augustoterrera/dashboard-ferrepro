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

  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {v}
    </span>
  );
}

function StatCard({ label, value, hint, sub }: { label: string; value: string; hint?: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        {hint ? <InfoTip text={hint} /> : null}
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight text-white">{value}</div>
      {sub ? <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{sub}</div> : null}
    </div>
  );
}

export function CampaignDashboard({
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
      {/* Umbrales visibles */}
      <ThresholdChips {...thresholds} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Sin campañas para este rango (probá bajar “Min Conv”).
        </div>
      ) : (
        <>
          {/* Cards */}
          {(() => {
            const spend = rows.reduce((a, r) => a + (r.spend ?? 0), 0);
            const conv = rows.reduce((a, r) => a + (r.conversations_started ?? 0), 0);
            const cacTotal = conv > 0 ? spend / conv : null;

            const counts = rows.reduce((acc, r) => {
              const k = r.accion_recomendada;
              acc[k] = (acc[k] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Spend (tabla)" value={money0(spend)} hint="Suma del spend de filas listadas (filtradas por Min Conv)." />
                <StatCard label="Conversaciones" value={num0(conv)} hint="Conversaciones iniciadas en campañas listadas." sub="KPI principal" />
                <StatCard label="CAC promedio" value={cacTotal == null ? "—" : money2(cacTotal)} hint="Spend total / Conversaciones (solo filas incluidas)." />
                <StatCard
                  label="Acciones"
                  value={`${counts.ESCALAR ?? 0} escalar · ${counts.PAUSAR ?? 0} pausar`}
                  hint="Resumen de recomendaciones automáticas."
                />
              </section>
            );
          })()}

          {/* Tabla */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Ranking de campañas</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Ordenado por CAC ascendente (más eficiente arriba)
                </p>
              </div>
              <InfoTip text="Campaña = estrategia general. Para decisiones de segmentación real, mirá AdSets." />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/40 text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Campaña</th>
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
                          <span>Imp {num0(r.impressions)}</span>
                          <span>·</span>
                          <span>Clicks {num0(r.clicks)}</span>
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
              Tip: si muchas campañas están en “REVISAR_ARTE”, rotá creativos o subí el CTR Min.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
