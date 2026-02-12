type ParetoRow = {
  sku: string | null;
  nombre: string | null;
  valor: number;
  pct_acumulado: number; // 0..1
  es_80: boolean;
};

export type ParetoChartPoint = {
  key: string;          // sku
  label: string;        // nombre corto
  valor: number;        // $
  pctAcum: number;      // 0..100
  es80: boolean;
  pctAcumPrev?: number; // 0..100 (opcional)
};

function shortLabel(name?: string | null, sku?: string | null, max = 22) {
  const base = (name?.trim() || sku?.trim() || "-");
  return base.length > max ? base.slice(0, max - 1) + "…" : base;
}

export function buildParetoChartData(args: {
  rows: ParetoRow[];
  top?: number;
  prevRowsBySkuPctAcum?: Map<string, number>; // pct_acumulado 0..1
}) {
  const { rows, top = 15, prevRowsBySkuPctAcum } = args;

  // Orden por valor desc (por si viene distinto)
  const sorted = rows
    .slice()
    .sort((a, b) => (b.valor || 0) - (a.valor || 0))
    .slice(0, top);

  const data: ParetoChartPoint[] = sorted.map((r) => {
    const sku = r.sku ?? "";
    const prev = prevRowsBySkuPctAcum?.get(sku);
    return {
      key: sku || `${r.nombre ?? "item"}`,
      label: shortLabel(r.nombre, r.sku),
      valor: Number(r.valor || 0),
      pctAcum: Number((r.pct_acumulado || 0) * 100),
      es80: !!r.es_80,
      pctAcumPrev: prev != null ? Number(prev * 100) : undefined,
    };
  });

  return data;
}
