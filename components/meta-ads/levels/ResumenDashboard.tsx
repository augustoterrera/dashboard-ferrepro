"use client";

import { InfoTip } from "@/components/info-tip";
import type { CompareMode } from "@/lib/data/marketing";
import { MetaAdsCompareLineChart } from "@/components/charts/MetaAdsCompareLineChart";
import type { MetaResumenData, MetaPointCompare } from "@/components/meta-ads/MetaAdsDashboard";


function money0(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));
}
function money2(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));
}
function num0(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function num2(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(n ?? 0));
}

function pctDelta(curr: number | null, prev: number | null) {
  if (curr == null || prev == null) return null;
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}
function fmtDelta(d: number | null) {
  if (d == null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${num2(d)}%`;
}

function safeNumber(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function sumSeries(series: MetaPointCompare[], key: "actual" | "compare") {
  return series.reduce((acc, r) => acc + (r[key] ?? 0), 0);
}

function avgNonNull(series: MetaPointCompare[], key: "actual" | "compare") {
  const vals = series.map((r) => r[key]).filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function countDays(series: MetaPointCompare[], pred: (r: MetaPointCompare) => boolean) {
  return series.reduce((acc, r) => acc + (pred(r) ? 1 : 0), 0);
}

function sliceWindow<T>(arr: T[], n: number, which: "first" | "last") {
  if (arr.length <= n) return arr;
  return which === "first" ? arr.slice(0, n) : arr.slice(arr.length - n);
}

function buildInsights({
  seriesSpend,
  seriesCac,
  labelCompare,
}: {
  seriesSpend: MetaPointCompare[];
  seriesCac: MetaPointCompare[];
  labelCompare: string;
}) {
  const spendA = sumSeries(seriesSpend, "actual");
  const spendC = sumSeries(seriesSpend, "compare");

  // Para conv no tenemos serie aparte, pero CAC+Spend permite aproximar conv con spend/cac.
  // Igual, en tu summary ya lo tenés; acá solo hacemos insights sobre series.
  const cacAvgA = avgNonNull(seriesCac, "actual");
  const cacAvgC = avgNonNull(seriesCac, "compare");

  const dSpend = pctDelta(spendA, spendC || null);
  const dCac = pctDelta(cacAvgA, cacAvgC);

  const daysNoConv = countDays(seriesCac, (r) => r.actual == null && (r.actual !== 0)); // null cuando conv=0
  const daysWithSpendNoConv = countDays(seriesSpend, (r) => (r.actual ?? 0) > 0) - countDays(seriesCac, (r) => r.actual != null);

  // Tendencia: últimos 7 días vs primeros 7 (sobre spend y CAC promedio)
  const spendFirst7 = sumSeries(sliceWindow(seriesSpend, 7, "first"), "actual");
  const spendLast7 = sumSeries(sliceWindow(seriesSpend, 7, "last"), "actual");

  const cacFirst7 = avgNonNull(sliceWindow(seriesCac, 7, "first"), "actual");
  const cacLast7 = avgNonNull(sliceWindow(seriesCac, 7, "last"), "actual");

  const dSpendTrend = pctDelta(spendLast7, spendFirst7 || null);
  const dCacTrend = pctDelta(cacLast7, cacFirst7);

  // Picos de CAC: top 1 y top 3
  const cacVals = seriesCac
    .map((r) => ({ day: r.day, v: r.actual }))
    .filter((x): x is { day: string; v: number } => x.v != null && Number.isFinite(x.v));

  cacVals.sort((a, b) => b.v - a.v);
  const top1 = cacVals[0];
  const top3 = cacVals.slice(0, 3);

  const insights: { title: string; detail: string }[] = [];

  // Comparación general
  if (spendC > 0) {
    insights.push({
      title: `Comparación vs ${labelCompare}`,
      detail: `Spend ${fmtDelta(dSpend)} · CAC promedio ${fmtDelta(dCac)}.`,
    });
  } else {
    insights.push({
      title: "Comparación",
      detail: `No hay datos suficientes en ${labelCompare} para comparar este rango.`,
    });
  }

  // Tendencia
  if (spendFirst7 > 0 && spendLast7 > 0) {
    insights.push({
      title: "Tendencia",
      detail: `Últimos 7 días: spend ${fmtDelta(dSpendTrend)} vs primeros 7 · CAC ${fmtDelta(dCacTrend)}.`,
    });
  }

  // Días sin conv
  if (daysWithSpendNoConv > 0) {
    insights.push({
      title: "Días con gasto sin conversaciones",
      detail: `${num0(daysWithSpendNoConv)} día(s) con spend pero sin conversaciones (CAC no calculable). Revisar destino/WhatsApp/Messenger.`,
    });
  }

  // Picos CAC
  if (top1) {
    const avg = cacAvgA ?? null;
    const ratio = avg ? top1.v / avg : null;
    insights.push({
      title: "Picos de CAC",
      detail:
        ratio && ratio >= 2
          ? `El mayor pico fue ${money2(top1.v)} el ${top1.day} (≈${num2(ratio)}× vs promedio). Suele pasar por bajo volumen de conversaciones.`
          : `Mayor CAC diario: ${money2(top1.v)} el ${top1.day}.`,
    });
  }

  // Top3 quick
  if (top3.length >= 2) {
    insights.push({
      title: "Top 3 CAC (días)",
      detail: top3.map((x) => `${x.day}: ${money2(x.v)}`).join(" · "),
    });
  }

  return insights.slice(0, 5); // mantenelo corto
}

function StatCard({
  label,
  value,
  hint,
  sub,
}: {
  label: string;
  value: string;
  hint?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        {hint ? <InfoTip text={hint} /> : null}
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight text-white">{value}</div>
      {sub ? (
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{sub}</div>
      ) : null}
    </div>
  );
}

function DeltaBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-black tracking-tight text-slate-200">{value}</div>
    </div>
  );
}

export function ResumenDashboard({
  data,
  labelCompare,
  compare,
}: {
  data: MetaResumenData | null;
  labelCompare: string;
  compare: CompareMode;
}) {
  if (!data || !data.summary) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
        Sin datos para este rango.
      </div>
    );
  }

  const s = data.summary;
  const spend = safeNumber(s.spend_total);
  const conv = safeNumber(s.conversations_started);
  const cac = s.cac == null ? null : Number(s.cac);
  const ctr = s.ctr == null ? null : Number(s.ctr);

  // Deltas a partir de series (solo si hay compare)
  const spendA = sumSeries(data.seriesSpend, "actual");
  const spendC = sumSeries(data.seriesSpend, "compare");
  const cacAvgA = avgNonNull(data.seriesCac, "actual");
  const cacAvgC = avgNonNull(data.seriesCac, "compare");

  const dSpend = pctDelta(spendA, spendC || null);
  const dCac = pctDelta(cacAvgA, cacAvgC);

  const insights = buildInsights({
    seriesSpend: data.seriesSpend,
    seriesCac: data.seriesCac,
    labelCompare,
  });

  return (
    <div className="space-y-6">
      {/* Deltas (pequeño, pro) */}
      <section className="flex flex-wrap items-center gap-2">
        <DeltaBadge
          label={`Spend vs ${labelCompare}`}
          value={spendC > 0 ? fmtDelta(dSpend) : "— (sin compare)"}
        />
        <DeltaBadge
          label={`CAC prom vs ${labelCompare}`}
          value={cacAvgC != null ? fmtDelta(dCac) : "— (sin compare)"}
        />
        <div className="ml-auto flex items-center gap-2">
          <InfoTip text="Los deltas se calculan con el mismo rango (Actual vs Comparación). CAC prom = promedio de CAC diario (días con conv)." />
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Inversión" value={money0(spend)} hint="Total gastado en el periodo." />
        <StatCard label="Conversaciones" value={num0(conv)} hint="Conversaciones iniciadas por anuncios." sub="KPI principal" />
        <StatCard label="CAC" value={cac == null ? "—" : money2(cac)} hint="Spend / Conversaciones (del período)." />
        <StatCard label="CTR" value={ctr == null ? "—" : `${num2(ctr)}%`} hint="CTR bajo suele indicar creativo débil." />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-widest text-white">Spend diario</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Actual vs {labelCompare}
              </div>
            </div>
            <InfoTip text="Si sube el spend pero el CAC no mejora, estás escalando sin eficiencia." />
          </div>

          <MetaAdsCompareLineChart
            data={data.seriesSpend}
            labelActual="Actual"
            labelCompare={labelCompare}
            valueLabel="Spend"
            format="money0"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-widest text-white">CAC diario</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Actual vs {labelCompare}
              </div>
            </div>
            <InfoTip text="CAC estable y bajo con spend creciente = escalamiento sano. CAC subiendo = revisar campañas/adsets." />
          </div>

          <MetaAdsCompareLineChart
            data={data.seriesCac}
            labelActual="Actual"
            labelCompare={labelCompare}
            valueLabel="CAC"
            format="money2"
          />
        </div>
      </section>
    </div>
  );
}
