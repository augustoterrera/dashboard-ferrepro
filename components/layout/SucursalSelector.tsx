"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Layers } from "lucide-react";
import { setSelectedSucursal } from "@/app/actions/set-sucursal";
import { cn } from "@/lib/utils";

type Sucursal = { id: number; nombre: string };

interface Props {
  sucursales: Sucursal[];
  selectedId: number | null;
  collapsed: boolean;
}

export function SucursalSelector({ sucursales, selectedId, collapsed }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selected = sucursales.find((s) => s.id === selectedId) ?? null;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function select(id: number | null) {
    setOpen(false);
    if (id === selectedId) return;
    startTransition(async () => {
      await setSelectedSucursal(id);
      router.refresh();
    });
  }

  // --- VERSIÓN COLAPSADA ---
  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <button
          onClick={() => {}}
          title={selected ? selected.nombre : "Todas las sucursales"}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            selectedId
              ? "bg-blue-600/20 text-blue-400"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          )}
        >
          <Building2 size={16} />
          {selectedId && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
          )}
        </button>
      </div>
    );
  }

  // --- VERSIÓN EXPANDIDA ---
  return (
    <div ref={ref} className="relative px-3 py-2.5">
      {/* Label */}
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
        Sucursal activa
      </p>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "group w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left",
          "transition-all duration-150",
          open
            ? "border-blue-500/60 bg-blue-600/10 text-blue-300"
            : "border-slate-700/60 bg-slate-800/80 text-slate-200 hover:border-slate-600 hover:bg-slate-800",
          pending && "opacity-50 cursor-wait"
        )}
      >
        {/* Ícono */}
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
            selectedId ? "bg-blue-600/20 text-blue-400" : "bg-slate-700 text-slate-400"
          )}
        >
          {selectedId ? <Building2 size={12} /> : <Layers size={12} />}
        </span>

        {/* Texto */}
        <span className="flex-1 truncate text-xs font-semibold">
          {selected ? selected.nombre : "Todas las sucursales"}
        </span>

        {/* Indicador de filtro activo */}
        {selectedId && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
        )}

        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180 text-blue-400"
          )}
        />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          "absolute left-3 right-3 z-50 mt-1 overflow-hidden rounded-lg border border-slate-700/80",
          "bg-slate-900 shadow-2xl shadow-black/50",
          "transition-all duration-150 origin-top",
          open ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Opción "Todas" */}
        <button
          onClick={() => select(null)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
            selectedId === null
              ? "bg-blue-600/15 text-blue-300"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
              selectedId === null ? "bg-blue-600/30 text-blue-400" : "bg-slate-800 text-slate-500"
            )}
          >
            <Layers size={11} />
          </span>
          <span className="flex-1 text-xs font-semibold">Todas las sucursales</span>
          {selectedId === null && <Check size={12} className="text-blue-400" />}
        </button>

        {/* Divisor */}
        <div className="mx-3 border-t border-slate-800" />

        {/* Lista de sucursales */}
        <div className="py-1">
          {sucursales.map((s) => {
            const isActive = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => select(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  isActive
                    ? "bg-blue-600/15 text-blue-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    isActive ? "bg-blue-600/30 text-blue-400" : "bg-slate-800 text-slate-500"
                  )}
                >
                  <Building2 size={11} />
                </span>
                <span className="flex-1 truncate text-xs font-medium">{s.nombre}</span>
                {isActive && <Check size={12} className="shrink-0 text-blue-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
