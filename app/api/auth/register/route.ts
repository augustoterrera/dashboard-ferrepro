import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Solo admins y superadmins autenticados pueden crear usuarios
  const token = await getToken({ req });
  if (!token || (token.role !== "admin" && token.role !== "superadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { email, password, name, role, id_sucursal } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son requeridos" }, { status: 400 });
  }

  // Validaciones básicas
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "La contraseña debe tener entre 8 y 128 caracteres" }, { status: 400 });
  }

  // Solo un superadmin puede crear otros superadmins o admins.
  // Un admin solo puede crear usuarios branch.
  const validRoles = token.role === "superadmin" ? ["superadmin", "admin", "branch"] : ["branch"];
  const userRole = validRoles.includes(role) ? role : "branch";

  const supabase = await createClient();
  const passwordHash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      name: name ?? null,
      role: userRole,
      id_sucursal: id_sucursal ?? null,
    })
    .select("id, email, name, role, id_sucursal")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
