import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SucursalesClient } from "./ui/SucursalesClient";
import { Building2 } from "lucide-react";

async function getSucursales() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("id, nombre, activa")
    .order("id", { ascending: true });
  if (error) console.error("getSucursales error:", error);
  return data ?? [];
}

export default async function SucursalesPage() {
  const sucursales = await getSucursales();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
            Sucursales <span className="text-emerald-500 text-lg not-italic">ABM</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Alta · Baja · Modificación de sucursales
          </p>
        </div>
      </header>

      <SucursalesClient initialSucursales={sucursales as any} />
    </div>
  );
}
