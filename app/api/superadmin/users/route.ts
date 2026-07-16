import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/get-token";
import { createClient } from "@/lib/supabase/server";
import { signToken } from "@/lib/auth-tokens";
import { sendInviteEmail } from "@/lib/mailer";
import { INVITED_PASSWORD_SENTINEL, toPublicUser, type UserRecord } from "@/lib/users";

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
    .select("id, email, name, role, id_sucursal, password_hash")
    .order("role", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json((data as UserRecord[]).map(toPublicUser));
}

// POST /api/superadmin/users — invitar usuario
// No se define contraseña acá: se crea la cuenta pendiente y la persona elige
// su contraseña desde el enlace que le llega por mail.
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email, name, role, id_sucursal } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "El email es requerido" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const validRoles = ["superadmin", "admin", "branch"];
  const userRole = validRoles.includes(role) ? role : "branch";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: INVITED_PASSWORD_SENTINEL,
      name: name ?? null,
      role: userRole,
      id_sucursal: id_sucursal ?? null,
    })
    .select("id, email, name, role, id_sucursal")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // El usuario ya quedó creado. Si el envío falla no lo revertimos: queda
  // pendiente y el superadmin reenvía la invitación desde la tabla.
  let emailSent = true;
  try {
    await sendInviteEmail(data.email, signToken(data.email, "invite"), data.name);
  } catch {
    emailSent = false;
  }

  return NextResponse.json({ ...data, pending: true, emailSent }, { status: 201 });
}
