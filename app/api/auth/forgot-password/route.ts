import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Token válido por 15 minutos
const TOKEN_TTL_MS = 15 * 60 * 1000;

function signToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no definido");

  const payload = `${email}:${Date.now() + TOKEN_TTL_MS}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

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

    const token = signToken(email);
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/update-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME ?? "Soporte"}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "Restablecer contraseña",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;text-transform:uppercase;font-style:italic;color:#fff;">
            Restablecer <span style="color:#a855f7;">Contraseña</span>
          </h2>
          <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            El enlace es válido por <strong style="color:#fff;">15 minutos</strong>.
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;padding:12px 24px;background:#9333ea;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;">
            Restablecer contraseña
          </a>
          <p style="margin:24px 0 0;font-size:11px;color:#475569;">
            Si no solicitaste este cambio, podés ignorar este correo.<br/>
            El enlace expirará automáticamente.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
