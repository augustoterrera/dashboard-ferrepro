"use client";

import type { MetaLevel, CompareMode, MetaHomeSummary, MetaRecoRow } from "@/lib/data/marketing";
import { CampaignDashboard } from "@/components/meta-ads/levels/CampaignDashboard";
import { ResumenDashboard } from "@/components/meta-ads/levels/ResumenDashboard";
import { AdsetDashboard } from "@/components/meta-ads/levels/AdsetDashboard";

export type MetaPointCompare = {
  day: string;
  actual: number | null;
  compare: number | null;
};

export type MetaResumenData = {
  summary: MetaHomeSummary | null;
  seriesSpend: MetaPointCompare[];
  seriesCac: MetaPointCompare[];
};

export type MetaDashboardData = MetaResumenData | MetaRecoRow[] | null;

export type MetaThresholdsUI = {
  cacObjetivo: number;
  ctrMin: number;
  freqMax: number;
  minConversations: number;
  limit: number;
};

function isResumenData(v: MetaDashboardData): v is MetaResumenData {
  return !!v && !Array.isArray(v) && "summary" in v && "seriesSpend" in v && "seriesCac" in v;
}

export function MetaAdsDashboard({
  level,
  compare,
  labelCompare,
  data,
  thresholds,
}: {
  level: MetaLevel;
  compare: CompareMode;
  labelCompare: string;
  data: MetaDashboardData;
  thresholds: MetaThresholdsUI;
}) {
  if (level === "resumen") {
    return (
      <ResumenDashboard
        data={isResumenData(data) ? data : null}
        labelCompare={labelCompare}
        compare={compare}
      />
    );
  }

  const rows: MetaRecoRow[] = Array.isArray(data) ? data : [];

  if (level === "adset") {
    return <AdsetDashboard data={rows} labelCompare={labelCompare} compare={compare} thresholds={thresholds} />;
  }

  return <CampaignDashboard data={rows} labelCompare={labelCompare} compare={compare} thresholds={thresholds} />;
}
