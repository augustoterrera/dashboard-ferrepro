import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

function isSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  return token?.role === "superadmin";
}

// PATCH /api/superadmin/users/[id] — editar usuario
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, role, id_sucursal, password } = body;

  const validRoles = ["superadmin", "admin", "branch"];
  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name;
  if (role !== undefined && validRoles.includes(role)) updates.role = role;
  if (id_sucursal !== undefined) updates.id_sucursal = id_sucursal ?? null;

  if (password) {
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "La contraseña debe tener entre 8 y 128 caracteres" }, { status: 400 });
    }
    updates.password_hash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("id, email, name, role, id_sucursal")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/superadmin/users/[id] — eliminar usuario
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Proteger: no se puede eliminar al propio superadmin
  if (String(token!.id) === String(id)) {
    return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
