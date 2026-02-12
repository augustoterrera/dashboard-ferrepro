// lib/data/marketing.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CompareMode = "prev" | "yoy";
export type MetaLevel = "campaign" | "adset" | "resumen";

export type MetaThresholds = {
  cacObjetivo: number;     // default 300
  ctrMin: number;          // default 1.5
  freqMax: number;         // default 3.0
  minConversations: number;// default 5
  limit: number;           // default 50
};

export type MetaDateRange = { from: string; to: string };

export type MetaHomeSummary = {
  spend_total: number;
  impressions_total: number;
  reach_total: number;
  clicks_total: number;
  conversations_started: number;
  cac: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
};

export type MetaRecoRow = {
  id: string;
  name: string;
  spend: number;
  conversations_started: number;
  cac: number | null;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
  accion_recomendada: "ESCALAR" | "MANTENER" | "REVISAR_ARTE" | "SATURACION" | "PAUSAR";
  motivo: string | null;
};

export async function getMetaHomeSummaryMixed(range: MetaDateRange) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meta_home_summary_mixed", {
    p_from: range.from,
    p_to: range.to,
    p_conv_level: "campaign",
  });
  if (error) throw new Error(`meta_home_summary_mixed: ${error.message}`);
  return (data?.[0] ?? null) as MetaHomeSummary | null;
}

function mapRecoRow(r: any, idKey: string, nameKey: string): MetaRecoRow {
  return {
    id: String(r[idKey]),
    name: String(r[nameKey]),
    spend: Number(r.spend ?? 0),
    conversations_started: Number(r.conversations_started ?? 0),
    cac: r.cac == null ? null : Number(r.cac),
    impressions: Number(r.impressions ?? 0),
    reach: Number(r.reach ?? 0),
    clicks: Number(r.clicks ?? 0),
    ctr: r.ctr == null ? null : Number(r.ctr),
    cpc: r.cpc == null ? null : Number(r.cpc),
    cpm: r.cpm == null ? null : Number(r.cpm),
    frequency: r.frequency == null ? null : Number(r.frequency),
    accion_recomendada: r.accion_recomendada,
    motivo: r.motivo ?? null,
  };
}

export async function getMetaCampaignRankingReco(range: MetaDateRange, t: MetaThresholds) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meta_campaign_ranking_reco", {
    p_from: range.from,
    p_to: range.to,
    p_limit: t.limit,
    p_min_conversations: t.minConversations,
    p_cac_objetivo: t.cacObjetivo,
    p_ctr_min: t.ctrMin,
    p_freq_max: t.freqMax,
  });
  if (error) throw new Error(`meta_campaign_ranking_reco: ${error.message}`);
  return (data ?? []).map((r: any) => mapRecoRow(r, "campaign_id", "campaign_name"));
}

export async function getMetaAdsetRankingReco(range: MetaDateRange, t: MetaThresholds) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meta_adset_ranking_reco", {
    p_from: range.from,
    p_to: range.to,
    p_limit: t.limit,
    p_min_conversations: t.minConversations,
    p_cac_objetivo: t.cacObjetivo,
    p_ctr_min: t.ctrMin,
    p_freq_max: t.freqMax,
  });
  if (error) throw new Error(`meta_adset_ranking_reco: ${error.message}`);
  return (data ?? []).map((r: any) => mapRecoRow(r, "adset_id", "adset_name"));
}

export type MetaTimeseriesRow = {
  day: string; // ISO yyyy-mm-dd
  spend_actual: number;
  spend_compare: number;
  conv_actual: number;
  conv_compare: number;
  cac_actual: number | null;
  cac_compare: number | null;
};

export async function getMetaHomeTimeseriesMixed(range: MetaDateRange, compare: CompareMode) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meta_home_timeseries_mixed", {
    p_from: range.from,
    p_to: range.to,
    p_compare: compare,
    p_conv_level: "campaign",
  });
  if (error) throw new Error(`meta_home_timeseries_mixed: ${error.message}`);

  return (data ?? []) as MetaTimeseriesRow[];
}
