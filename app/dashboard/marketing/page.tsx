import { MetaAdsFilterBar } from "@/components/filters/MetaAdsFilterBar";
import {
  type CompareMode,
  type MetaLevel,
} from "@/lib/data/marketing";
import { Suspense } from "react";
import { MetaAdsDashboardServer } from "@/components/meta-ads/MetaAdsDashboardServer";
import { MetaAdsDashboardSkeleton } from "@/components/meta-ads/skeleton/MetaAdsDashboardSkeleton";


function clampDate(v: string | null, fallback: string) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fallback;
}
function clampNum(v: string | null, fallback: number, min?: number, max?: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function labelCompare(compare: CompareMode) {
  return compare === "yoy" ? "Año pasado" : "Anterior";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    level?: MetaLevel;
    compare?: CompareMode;
    cac?: string;
    ctr?: string;
    freq?: string;
    minc?: string;
    limit?: string;
  }>;
}) {
  const sp = await searchParams;

  const defaultTo = todayISO();
  const defaultFrom = daysAgoISO(29);

  const from = clampDate(sp.from ?? null, defaultFrom);
  const to = clampDate(sp.to ?? null, defaultTo);

  const level = (sp.level === "campaign" || sp.level === "adset" || sp.level === "resumen" ? sp.level : "resumen") as MetaLevel;
  const compare = (sp.compare === "yoy" ? "yoy" : "prev") as CompareMode;

  const thresholds = {
    cacObjetivo: clampNum(sp.cac ?? null, 300, 0),
    ctrMin: clampNum(sp.ctr ?? null, 1.5, 0, 100),
    freqMax: clampNum(sp.freq ?? null, 3.0, 0),
    minConversations: clampNum(sp.minc ?? null, 5, 0),
    limit: clampNum(sp.limit ?? null, 50, 1, 500),
  };

  const range = { from, to };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Meta Ads <span className="text-blue-500 text-xl not-italic">Dashboard</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Decisiones por conversaciones iniciadas</p>
        </div>

        <div className="shrink-0">
          <MetaAdsFilterBar defaultFrom={defaultFrom} defaultTo={defaultTo} level={level} compare={compare} />
        </div>
      </header>

      <Suspense
        key={`${level}-${compare}-${from}-${to}-${thresholds.cacObjetivo}-${thresholds.ctrMin}-${thresholds.freqMax}-${thresholds.minConversations}-${thresholds.limit}`}
        fallback={<MetaAdsDashboardSkeleton />}
      >
        <MetaAdsDashboardServer
          range={range}
          level={level}
          compare={compare}
          labelCompare={labelCompare(compare)}
          thresholds={thresholds}
        />
      </Suspense>

    </div>
  );
}
