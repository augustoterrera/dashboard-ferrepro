import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "@/lib/get-token";
import { createClient } from "@/lib/supabase/server";
import { getActiveSucursalId } from "@/lib/get-sucursal-id";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sucursalId = await getActiveSucursalId();

  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from")!;
  const to = searchParams.get("to")!;
  const tab = (searchParams.get("tab") === "unidades" ? "unidades" : "facturacion") as
    | "unidades"
    | "facturacion";
  const q = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const rpcName = tab === "unidades" ? "get_top_productos_unidades" : "get_facturacion_por_producto";

  const { data, error } = await supabase.rpc(rpcName, {
    p_from: from,
    p_to: to,
    p_empresa: null,
    p_sucursal: sucursalId,
    p_q: q && q.trim() ? q.trim() : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("[api/finanzas/productos] rpc error:", error);
    return NextResponse.json(
      { error: error.message ?? error.code ?? "rpc_error", details: error.details ?? error.hint ?? null },
      { status: 400 }
    );
  }

  return NextResponse.json({ rows: data?.rows ?? [], page, limit });
}
