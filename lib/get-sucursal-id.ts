import { cookies } from "next/headers";
import { getSession } from "@/lib/get-session";

/**
 * Devuelve el id de sucursal activo según el rol del usuario:
 * - branch: siempre su id_sucursal fijo del token
 * - admin:  lo que tenga guardado en la cookie 'selected_sucursal'
 *           (null = ver todas las sucursales)
 * - cualquier otro: null
 */
export async function getActiveSucursalId(): Promise<number | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const { role, id_sucursal } = session.user as {
    role?: string;
    id_sucursal?: number | null;
  };

  if (role === "branch") {
    return id_sucursal ?? null;
  }

  if (role === "admin") {
    const cookieStore = await cookies();
    const val = cookieStore.get("selected_sucursal")?.value;

    // Sin cookie: usar la sucursal asignada al usuario como default
    if (!val) return id_sucursal ?? null;

    // Cookie explícita "all": ver todas las sucursales
    if (val === "all") return null;

    return Number(val);
  }

  return null;
}