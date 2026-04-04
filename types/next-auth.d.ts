declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    id_sucursal: number | null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      id_sucursal: number | null;
    } & DefaultSession["user"];
  }
}
