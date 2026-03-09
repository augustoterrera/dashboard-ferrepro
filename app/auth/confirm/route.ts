import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// Este endpoint era para confirmación OTP de Supabase.
// Con next-auth (Credentials provider) ya no se usa.
export async function GET(_request: NextRequest) {
  redirect("/auth/login");
}
