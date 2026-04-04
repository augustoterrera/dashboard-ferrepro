import type { NextRequest } from "next/server";

export type AppToken = {
  id: string;
  role: string;
  id_sucursal: number | null;
  email?: string | null;
  name?: string | null;
} | null;

// next-auth v4 types don't resolve with moduleResolution:bundler — use require to bypass
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const nextAuthJwt = require("next-auth/jwt") as {
  getToken: (params: { req: NextRequest }) => Promise<AppToken>;
};

export function getToken(params: { req: NextRequest }): Promise<AppToken> {
  return nextAuthJwt.getToken(params);
}
