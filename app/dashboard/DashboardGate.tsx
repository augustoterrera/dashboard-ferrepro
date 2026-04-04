import { SidebarShell } from "@/components/layout/SiderbarShell";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function DashboardGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const role = session.user?.role ?? "branch";

  // Para admin: cargar lista de sucursales activas y leer la selección actual
  let sucursales: { id: number; nombre: string }[] = [];
  let selectedSucursalId: number | null = null;

  if (role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sucursales")
      .select("id, nombre")
      .eq("activa", true)
      .order("nombre");

    sucursales = data ?? [];

    const cookieStore = await cookies();
    const val = cookieStore.get("selected_sucursal")?.value;

    if (!val) {
      // Sin cookie: default a la sucursal del usuario
      selectedSucursalId = (session.user as any)?.id_sucursal ?? null;
    } else if (val === "all") {
      selectedSucursalId = null;
    } else {
      selectedSucursalId = Number(val);
    }
  }

  return (
    <SidebarShell
      role={role}
      sucursales={sucursales}
      selectedSucursalId={selectedSucursalId}
    >
      {children}
    </SidebarShell>
  );
}
