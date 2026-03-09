import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// Token válido por 15 minutos
const TOKEN_TTL_MS = 15 * 60 * 1000;

function signToken(email: string): string {
  const payload = `${email}:${Date.now() + TOKEN_TTL_MS}`;
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Verificar que el usuario exista
    const users = await db`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (!users[0]) {
      // Respuesta genérica para no revelar si el email existe
      return NextResponse.json({ ok: true });
    }

    const token = signToken(email);
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/update-password?token=${token}`;

    // TODO: integrar servicio de email (nodemailer, Resend, etc.)
    // Por ahora se imprime en consola para desarrollo
    console.log(`[reset-password] URL para ${email}: ${resetUrl}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
