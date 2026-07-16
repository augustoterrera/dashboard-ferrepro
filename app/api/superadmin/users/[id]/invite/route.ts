import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/get-token";
import { createClient } from "@/lib/supabase/server";
import { signToken } from "@/lib/auth-tokens";
import { sendInviteEmail } from "@/lib/mailer";
import { isPending } from "@/lib/users";

function isSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  return token?.role === "superadmin";
}

// POST /api/superadmin/users/[id]/invite — reenviar invitación
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!isSuperAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("email, name, password_hash")
    .eq("id", id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!isPending(user.password_hash)) {
    return NextResponse.json(
      { error: "El usuario ya activó su cuenta" },
      { status: 400 },
    );
  }

  try {
    await sendInviteEmail(user.email, signToken(user.email, "invite"), user.name);
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el mail. Revisá la configuración SMTP." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
