export type ParetoRow = {
  sku: string | null;
  nombre: string | null;
  unidades: number;
  valor: number;
  pct: number;
  acumulado: number;
  pct_acumulado: number;
  es_80: boolean;
};

export type Pareto80Response = {
  range: { from: string; to: string; empresa: number | null };
  pareto: { umbral: number; only_80: boolean; limit: number };
  total: number;
  rows: ParetoRow[];
};

export type ParetoChangeRow = {
  sku: string | null;
  nombre: string | null;
  valor_actual: number;
  valor_anterior: number;
  delta_valor: number;
  unidades_actual: number;
  unidades_anterior: number;
  delta_pct_valor?: number | null; // solo en stayed
};

export type ParetoComparacionResponse = {
  range: { from: string; to: string; empresa: number | null };
  previous_range: { from: string; to: string };
  pareto: { umbral: number };
  metrics: {
    current_total: number;
    previous_total: number;
    current_a_count: number;
    previous_a_count: number;
    current_a_share: number;
    previous_a_share: number;
  };
  changes: {
    entered: ParetoChangeRow[];
    exited: ParetoChangeRow[];
    stayed: ParetoChangeRow[];
  };
};
