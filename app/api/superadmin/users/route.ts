import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

function isSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  return token?.role === "superadmin";
}

// GET /api/superadmin/users — listar todos los usuarios
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, id_sucursal, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /api/superadmin/users — crear usuario
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email, password, name, role, id_sucursal } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son requeridos" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "La contraseña debe tener entre 8 y 128 caracteres" }, { status: 400 });
  }

  const validRoles = ["superadmin", "admin", "branch"];
  const userRole = validRoles.includes(role) ? role : "branch";

  const supabase = await createClient();
  const passwordHash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash, name: name ?? null, role: userRole, id_sucursal: id_sucursal ?? null })
    .select("id, email, name, role, id_sucursal")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
