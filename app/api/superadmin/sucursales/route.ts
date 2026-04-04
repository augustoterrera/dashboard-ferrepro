import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase/server";

function isSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  return token?.role === "superadmin";
}

// GET /api/superadmin/sucursales — listar todas
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("id, nombre, activa, created_at")
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /api/superadmin/sucursales — crear sucursal
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { nombre, activa } = await req.json();

  if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .insert({ nombre: nombre.trim(), activa: activa ?? true })
    .select("id, nombre, activa")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
