import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./ui/UsuariosClient";
import { Users } from "lucide-react";

async function getData() {
  const supabase = await createClient();
  const [usersRes, sucursalesRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, name, role, id_sucursal")
      .order("role", { ascending: true }),
    supabase
      .from("sucursales")
      .select("id, nombre")
      .eq("activa", true)
      .order("id", { ascending: true }),
  ]);
  return {
    users: usersRes.data ?? [],
    sucursales: sucursalesRes.data ?? [],
  };
}

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  const { users, sucursales } = await getData();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <Users size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
            Usuarios <span className="text-blue-500 text-lg not-italic">ABM</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Alta · Baja · Modificación de cuentas
          </p>
        </div>
      </header>

      <UsuariosClient
        initialUsers={users as any}
        sucursales={sucursales}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}
