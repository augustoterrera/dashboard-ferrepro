import { createClient } from "@/lib/supabase/server";

/**
 * Resumen financiero (KPIs + series + top productos)
 */
export async function getFinanzasResumen(params: {
  from: string;
  to: string;
  empresaId?: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_from: params.from,
    p_to: params.to,
    p_empresa: params.empresaId ?? 3526,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Ventas por día con comparación contra período anterior
 */
export async function getVentasComparacion(params: {
  from: string;
  to: string;
  empresaId?: number | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_serie_ventas_diaria_comparacion",
    {
      p_from: params.from,
      p_to: params.to,
      p_empresa: params.empresaId ?? null,
    },
  );

  if (error) throw new Error(error.message);
  return data;
}

export async function getVentasYoY(params: {
  from: string;
  to: string;
  empresaId?: number | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_serie_ventas_diaria_yoy", {
    p_from: params.from,
    p_to: params.to,
    p_empresa: params.empresaId ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
}

type RangeArgs = {
  from: string;
  to: string;
  empresaId?: number | null;
};

type ProductosQueryArgs = RangeArgs & {
  q?: string | null;
  sku?: string | null;
  limit?: number;
  offset?: number;
};

function unwrapRpcError(error: any) {
  const msg = error?.message || "RPC error";
  const details = error?.details ? `\n${error.details}` : "";
  throw new Error(msg + details);
}

export async function getProductosPorFacturacion(args: ProductosQueryArgs) {
  const supabase = await createClient();

  const { from, to, empresaId = null, q = null, sku = null } = args;
  const limit = args.limit ?? 20;
  const offset = args.offset ?? 0;

  const { data, error } = await supabase.rpc("get_facturacion_por_producto", {
    p_from: from,
    p_to: to,
    p_empresa: empresaId,
    p_sku: sku,
    p_q: q,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) unwrapRpcError(error);
  return data as any; // { range, filter, rows }
}

export async function getProductosPorUnidades(args: ProductosQueryArgs) {
  const supabase = await createClient();

  const { from, to, empresaId = null, q = null, sku = null } = args;
  const limit = args.limit ?? 20;
  const offset = args.offset ?? 0;

  const { data, error } = await supabase.rpc("get_top_productos_unidades", {
    p_from: from,
    p_to: to,
    p_empresa: empresaId,
    p_sku: sku,
    p_q: q,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) unwrapRpcError(error);
  return data as any; // { range, filter, rows }
}

export async function getProductosKpis(args: {
  from: string;
  to: string;
  empresaId?: number | null;
}) {
  const supabase = await createClient();
  const { from, to, empresaId = null } = args;

  const { data, error } = await supabase.rpc("get_productos_kpis", {
    p_empresa: empresaId,  // ← PRIMERO (no uses ?? null aquí)
    p_from: from,          // ← SEGUNDO
    p_to: to,              // ← TERCERO
  });

  if (error) unwrapRpcError(error);
  return data as any;
}


export async function getPareto80(args: {
  from: string;
  to: string;
  empresaId?: number | null;
  umbral?: number;      // default 0.80
  only80?: boolean;     // default true
  limit?: number;       // default 200
}) {
  const supabase = await createClient();
  const {
    from,
    to,
    empresaId = null,
    umbral = 0.8,
    only80 = true,
    limit = 200,
  } = args;

  const { data, error } = await supabase.rpc("get_pareto_80_productos", {
    p_from: from,
    p_to: to,
    p_empresa: empresaId,
    p_umbral: umbral,
    p_only_80: only80,
    p_limit: limit,
  });

  if (error) unwrapRpcError(error);
  return data as any;
}

export async function getParetoComparacion(args: {
  from: string;
  to: string;
  empresaId?: number | null;
  umbral?: number;         // default 0.80
  limitChanges?: number;   // default 200
}) {
  const supabase = await createClient();
  const { from, to, empresaId = null, umbral = 0.8, limitChanges = 200 } = args;

  const { data, error } = await supabase.rpc("get_pareto_a_comparacion", {
    p_from: from,
    p_to: to,
    p_empresa: empresaId,
    p_umbral: umbral,
    p_limit_changes: limitChanges,
  });

  if (error) unwrapRpcError(error);
  return data as any;
}

export async function getParetoComparacionYoY(args: {
  from: string;
  to: string;
  empresaId?: number | null;
  umbral?: number;         // default 0.80
  limitChanges?: number;   // default 200
}) {
  const supabase = await createClient();
  const { from, to, empresaId = null, umbral = 0.8, limitChanges = 200 } = args;

  const { data, error } = await supabase.rpc("get_pareto_yoy_comparacion", {
    p_from: from,
    p_to: to,
    p_empresa: empresaId,
    p_umbral: umbral,
    p_limit_changes: limitChanges,
  });

  if (error) unwrapRpcError(error);
  return data as any;
}

export async function getTopMetodosPago(args: {
  from?: string | null;
  to?: string | null;
  limit?: number; // default 5
}) {
  const supabase = await createClient();
  const { from = null, to = null, limit = 5 } = args;

  const { data, error } = await supabase.rpc("get_top_metodos_pago", {
    p_from: from,
    p_to: to,
    p_limit: limit,
  });

  if (error) unwrapRpcError(error);
  return data as any;
}
