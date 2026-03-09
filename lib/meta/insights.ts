type ActionItem = { action_type: string; value: string };

export type MetaInsightsRow = {
  date_start?: string;
  date_stop?: string;
  spend?: string;
  actions?: ActionItem[];
  cost_per_action_type?: ActionItem[];
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
};

export type MetaInsightsResult = {
  range: { since: string; until: string };
  level: "account" | "campaign" | "adset" | "ad";
  action_type_used: string;
  totals: {
    spend: number;
    conversations: number;
    cost_per_conversation: number | null;
  };
  rows: Array<{
    date_start?: string;
    date_stop?: string;
    spend: number;
    conversations: number;
    cost_per_conversation: number | null;
    action_type_used: string;
    campaign_id?: string;
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
  }>;
};

function pickActionValue(list: ActionItem[] | undefined, actionType: string) {
  if (!Array.isArray(list)) return null;
  const item = list.find((x) => x.action_type === actionType);
  if (!item) return null;
  const n = Number(item.value);
  return Number.isFinite(n) ? n : null;
}

export type GetMetaInsightsArgs = {
  since: string; // "YYYY-MM-DD"
  until: string; // "YYYY-MM-DD"
  level?: "account" | "campaign" | "adset" | "ad";
  timeIncrement?: string; // "1" si querés por día, si no undefined
  actionType?: string; // si querés forzar cuál es “consulta”
};

const DEFAULT_CONV_ACTION_TYPE =
  "onsite_conversion.messaging_conversation_started_7d";

export async function getMetaInsights(
  args: GetMetaInsightsArgs,
): Promise<MetaInsightsResult> {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || "v24.0";

  if (!adAccountId || !accessToken) {
    throw new Error("Missing META_AD_ACCOUNT_ID or META_ACCESS_TOKEN");
  }

  const level = args.level ?? "account";
  const convActionType = args.actionType ?? DEFAULT_CONV_ACTION_TYPE;

  const insightsUrl = new URL(
    `https://graph.facebook.com/${apiVersion}/act_${adAccountId}/insights`,
  );

  insightsUrl.searchParams.set("access_token", accessToken);
  insightsUrl.searchParams.set("level", level);

  insightsUrl.searchParams.set(
    "fields",
    [
      "spend",
      "actions",
      "cost_per_action_type",
      "date_start",
      "date_stop",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
    ].join(","),
  );

  insightsUrl.searchParams.set(
    "time_range",
    JSON.stringify({ since: args.since, until: args.until }),
  );

  if (args.timeIncrement) {
    insightsUrl.searchParams.set("time_increment", args.timeIncrement);
  }

  const r = await fetch(insightsUrl.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const json = await r.json();

  if (!r.ok) {
    const msg =
      json?.error?.message || json?.message || `Meta API error (${r.status})`;
    throw new Error(msg);
  }

  // DEBUG: ver qué trae Meta
  console.log("META RAW:", JSON.stringify(json, null, 2));

  const rows: MetaInsightsRow[] = Array.isArray(json?.data) ? json.data : [];

  let totalSpend = 0;
  let totalConversations = 0;

  const normalized = rows.map((row) => {
    const spend = Number(row.spend ?? 0) || 0;

    const convCount = pickActionValue(row.actions, convActionType) ?? 0;

    const cpaFromApi = pickActionValue(
      row.cost_per_action_type,
      convActionType,
    );

    const cpaComputed = convCount > 0 ? spend / convCount : null;

    totalSpend += spend;
    totalConversations += convCount;

    return {
      date_start: row.date_start,
      date_stop: row.date_stop,
      spend,
      conversations: convCount,
      cost_per_conversation: cpaFromApi ?? cpaComputed,
      action_type_used: convActionType,
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      adset_id: row.adset_id,
      adset_name: row.adset_name,
      ad_id: row.ad_id,
      ad_name: row.ad_name,
    };
  });

  const totalCpa =
    totalConversations > 0 ? totalSpend / totalConversations : null;

  return {
    range: { since: args.since, until: args.until },
    level,
    action_type_used: convActionType,
    totals: {
      spend: totalSpend,
      conversations: totalConversations,
      cost_per_conversation: totalCpa,
    },
    rows: normalized,
  };
}
