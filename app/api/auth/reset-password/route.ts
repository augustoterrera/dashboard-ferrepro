import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function verifyToken(token: string): string | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET no definido");

    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const hmac = decoded.slice(lastColon + 1);

    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    // Comparación en tiempo constante para prevenir timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;

    const colonIdx = payload.indexOf(":");
    const email = payload.slice(0, colonIdx);
    const expiry = Number(payload.slice(colonIdx + 1));

    if (Date.now() > expiry) return null;

    return email;
  } catch {
    return null;
  }
}

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

    const email = verifyToken(token);
    if (!email) {
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
    await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
