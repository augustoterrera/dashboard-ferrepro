import crypto from "crypto";

export type TokenPurpose = "reset" | "invite";

const TTL_MS: Record<TokenPurpose, number> = {
  reset: 15 * 60 * 1000,
  invite: 48 * 60 * 60 * 1000,
};

export const INVITE_TTL_LABEL = "48 horas";
export const RESET_TTL_LABEL = "15 minutos";

/** Token autocontenido `email:expiry:purpose` firmado con HMAC-SHA256. */
export function signToken(email: string, purpose: TokenPurpose): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no definido");

  const payload = `${email}:${Date.now() + TTL_MS[purpose]}:${purpose}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function verifyToken(
  token: string,
): { email: string; purpose: TokenPurpose } | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const hmacIdx = decoded.lastIndexOf(":");
    if (hmacIdx < 0) return null;

    const payload = decoded.slice(0, hmacIdx);
    const received = Buffer.from(decoded.slice(hmacIdx + 1));
    const expected = Buffer.from(
      crypto.createHmac("sha256", secret).update(payload).digest("hex"),
    );

    // timingSafeEqual tira si los buffers difieren en largo
    if (received.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(received, expected)) return null;

    // Se parsea desde la derecha: el email es el único campo que podría traer ":"
    const purposeIdx = payload.lastIndexOf(":");
    if (purposeIdx < 0) return null;
    const purpose = payload.slice(purposeIdx + 1);

    const head = payload.slice(0, purposeIdx);
    const expiryIdx = head.lastIndexOf(":");
    if (expiryIdx < 0) return null;
    const email = head.slice(0, expiryIdx);
    const expiry = Number(head.slice(expiryIdx + 1));

    if (purpose !== "reset" && purpose !== "invite") return null;
    if (!email || !Number.isFinite(expiry) || Date.now() > expiry) return null;

    return { email, purpose };
  } catch {
    return null;
  }
}
