"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react"; // Importamos el icono

interface LogoutButtonProps {
  collapsed?: boolean;
}

export function LogoutButton({ collapsed }: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh(); // Refresca el estado de la sesión
    router.push("/auth/login");
  };

  return (
    <button
      onClick={logout}
      className={`
        flex items-center gap-3 w-full transition-all duration-200 group
        ${collapsed 
          ? "justify-center p-2 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500" 
          : "px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400"
        }
      `}
      title={collapsed ? "Cerrar Sesión" : ""}
    >
      <LogOut 
        size={18} 
        className={`${collapsed ? "" : "opacity-70 group-hover:opacity-100"}`} 
      />
      
      {!collapsed && (
        <span className="text-sm font-bold uppercase tracking-wider">
          Cerrar Sesión
        </span>
      )}
    </button>
  );
}