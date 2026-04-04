import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Typed wrapper around getServerSession.
 * next-auth v4 doesn't properly infer the augmented Session type
 * when calling getServerSession(authOptions) directly.
 */
export function getSession(): Promise<Session | null> {
  return getServerSession(authOptions) as Promise<Session | null>;
}
