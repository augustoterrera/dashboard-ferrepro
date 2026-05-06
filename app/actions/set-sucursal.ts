"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/get-session";
import { createClient } from "@/lib/supabase/server";

const SELECTED_SUCURSAL_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function setSelectedSucursal(id: number | null) {
  const session = await getSession();
  // Solo admins pueden cambiar la sucursal activa
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }

  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("Sucursal inválida");
  }

  if (id !== null) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sucursales")
      .select("id")
      .eq("id", id)
      .eq("activa", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Sucursal inválida");
  }

  const cookieStore = await cookies();

  if (id === null) {
    // "all" explícito: distingue de "no seteada" (que defaultea a la del usuario)
    cookieStore.set("selected_sucursal", "all", SELECTED_SUCURSAL_COOKIE_OPTIONS);
  } else {
    cookieStore.set("selected_sucursal", String(id), SELECTED_SUCURSAL_COOKIE_OPTIONS);
  }

  revalidatePath("/dashboard", "layout");
}
