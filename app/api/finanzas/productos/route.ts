import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
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

  // si querés protegerlo con auth:
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rpcName = tab === "unidades" ? "get_top_productos_unidades" : "get_facturacion_por_producto";

  const { data, error } = await supabase.rpc(rpcName, {
    p_from: from,
    p_to: to,
    p_empresa: null, // o tu empresaId
    p_q: q && q.trim() ? q.trim() : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
  }

  return NextResponse.json({ rows: data?.rows ?? [], page, limit });
}
