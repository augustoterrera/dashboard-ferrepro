import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type AppSession = {
  user: {
    id: string;
    role: string;
    id_sucursal: number | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

// next-auth v4 types don't resolve with moduleResolution:bundler — use require to bypass
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { getServerSession } = require("next-auth/next") as {
  getServerSession: (...args: unknown[]) => Promise<AppSession | null>;
};

export function getSession(): Promise<AppSession | null> {
  return getServerSession(authOptions);
}
