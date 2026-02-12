import { MetaAdsDashboard } from "@/components/meta-ads/MetaAdsDashboard";
import type { MetaDashboardData, MetaThresholdsUI } from "@/components/meta-ads/MetaAdsDashboard";
import {
  getMetaHomeTimeseriesMixed,
  getMetaAdsetRankingReco,
  getMetaCampaignRankingReco,
  getMetaHomeSummaryMixed,
  type CompareMode,
  type MetaLevel,
} from "@/lib/data/marketing";

export async function MetaAdsDashboardServer({
  range,
  level,
  compare,
  labelCompare,
  thresholds,
}: {
  range: { from: string; to: string };
  level: MetaLevel;
  compare: CompareMode;
  labelCompare: string;
  thresholds: MetaThresholdsUI;
}) {
  let data: MetaDashboardData = null;

  if (level === "resumen") {
    const summary = await getMetaHomeSummaryMixed(range);
    const ts = await getMetaHomeTimeseriesMixed(range, compare);

    data = {
      summary,
      seriesSpend: ts.map((r) => ({
        day: r.day,
        actual: Number(r.spend_actual ?? 0),
        compare: r.spend_compare == null ? null : Number(r.spend_compare),
      })),
      seriesCac: ts.map((r) => ({
        day: r.day,
        actual: r.cac_actual == null ? null : Number(r.cac_actual),
        compare: r.cac_compare == null ? null : Number(r.cac_compare),
      })),
    };
  } else if (level === "campaign") {
    data = await getMetaCampaignRankingReco(range, thresholds);
  } else {
    data = await getMetaAdsetRankingReco(range, thresholds);
  }

  return (
    <MetaAdsDashboard
      level={level}
      compare={compare}
      labelCompare={labelCompare}
      data={data}
      thresholds={thresholds}
    />
  );
}
