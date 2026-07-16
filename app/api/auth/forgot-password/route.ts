import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Verificar que el usuario exista
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (!users?.[0]) {
      // Respuesta genérica para no revelar si el email existe
      return NextResponse.json({ ok: true });
    }

    await sendPasswordResetEmail(email, signToken(email, "reset"));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
