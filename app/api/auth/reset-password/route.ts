import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth-tokens";

// Sirve tanto al reset de contraseña como al alta por invitación: en ambos
// casos el token prueba que quien lo trae controla ese email.
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y contraseña requeridos" },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "La contraseña debe tener entre 8 y 128 caracteres" },
        { status: 400 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const passwordHash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", payload.email)
      .select("id");

    if (error) {
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    // El usuario pudo ser eliminado entre la emisión del token y su uso
    if (!data?.length) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
