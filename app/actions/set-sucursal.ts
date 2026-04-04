"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function setSelectedSucursal(id: number | null) {
  const session = await getServerSession(authOptions);
  // Solo admins pueden cambiar la sucursal activa
  if (!session?.user || (session.user as any).role !== "admin") return;

  const cookieStore = await cookies();

  if (id === null) {
    // "all" explícito: distingue de "no seteada" (que defaultea a la del usuario)
    cookieStore.set("selected_sucursal", "all", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    });
  } else {
    cookieStore.set("selected_sucursal", String(id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: false,
      sameSite: "lax",
    });
  }

  revalidatePath("/dashboard", "layout");
}
