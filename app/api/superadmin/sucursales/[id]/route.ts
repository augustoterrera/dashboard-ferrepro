import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/get-token";
import { createClient } from "@/lib/supabase/server";

function isSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  return token?.role === "superadmin";
}

// PATCH /api/superadmin/sucursales/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { nombre, activa } = await req.json();

  const updates: Record<string, unknown> = {};
  if (nombre !== undefined) updates.nombre = String(nombre).trim();
  if (activa !== undefined) updates.activa = Boolean(activa);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .update(updates)
    .eq("id", id)
    .select("id, nombre, activa")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/superadmin/sucursales/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Verificar que no haya usuarios asignados a esta sucursal
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("id_sucursal", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${count} usuario(s) asignados a esta sucursal` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("sucursales").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
