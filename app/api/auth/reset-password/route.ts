import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const hmac = decoded.slice(lastColon + 1);

    const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (hmac !== expected) return null;

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

    const email = verifyToken(token);
    if (!email) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db`UPDATE users SET password_hash = ${passwordHash} WHERE email = ${email}`;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
