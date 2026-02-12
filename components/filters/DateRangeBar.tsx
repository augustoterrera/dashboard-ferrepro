"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Calendar as CalendarIcon, RefreshCcw, ArrowRight, ChevronRight } from "lucide-react";

// shadcn ui
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type CompareMode = "prev" | "yoy";

function iso(d: Date) { return d.toISOString().slice(0, 10); }

function parseISODate(s: string) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function prettyDate(isoStr: string) {
    const d = parseISODate(isoStr);
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
}

export function DateRangeBar(props: {
    defaultFrom: string;
    defaultTo: string;
    defaultCompare?: CompareMode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const qs = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

    const [from, setFrom] = useState(sp.get("from") ?? props.defaultFrom);
    const [to, setTo] = useState(sp.get("to") ?? props.defaultTo);
    const [compare, setCompare] = useState<CompareMode>((sp.get("compare") as CompareMode) ?? (props.defaultCompare ?? "prev"));

    const [isPending, startTransition] = useTransition();
    const [clicked, setClicked] = useState(false);


    const busy = isPending || clicked;

    useEffect(() => {
        // Cuando el router terminó de cargar, isPending vuelve a false.
        if (!isPending) setClicked(false);
    }, [isPending]);

    function push(nextFrom: string, nextTo: string, nextCompare: CompareMode) {
        const next = new URLSearchParams(qs);
        next.set("from", nextFrom);
        next.set("to", nextTo);
        next.set("compare", nextCompare);

        setClicked(true);

        // fallback: si por algún motivo no llega el "end", no queda infinito
        window.setTimeout(() => setClicked(false), 8000);

        startTransition(() => {
            router.push(`${pathname}?${next.toString()}`);
            router.refresh();
        });
    }


    const apply = () => push(from, to, compare);

    return (
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">

            {/* Quick ranges: Intermedio entre botones y texto */}
            <div className="flex items-center gap-1.5 px-3 border-r border-slate-800/50">
                {[7, 30, 90].map((d) => (
                    <button
                        key={d}
                        disabled={busy}
                        onClick={() => {
                            const toD = new Date();
                            const fromD = new Date();
                            fromD.setDate(toD.getDate() - d + 1);
                            const nF = iso(fromD); const nT = iso(toD);
                            setFrom(nF); setTo(nT);
                            push(nF, nT, compare);
                        }}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-white px-2 py-1.5 rounded-md hover:bg-slate-800 transition-all disabled:opacity-30"
                    >
                        {d}D
                    </button>
                ))}
            </div>

            {/* Rango de Fechas equilibrado */}
            <div className="flex items-center gap-2 px-2 border-r border-slate-800/50">
                <DateButton label="Desde" value={from} busy={busy} onSelect={setFrom} />
                <ChevronRight size={14} className="text-slate-700" />
                <DateButton label="Hasta" value={to} busy={busy} onSelect={setTo} />
            </div>

            {/* Selector de Comparación equilibrado */}
            <div className="flex items-center px-3 gap-3">
                <div className="relative">
                    <select
                        value={compare}
                        onChange={(e) => setCompare(e.target.value as CompareMode)}
                        disabled={busy}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-[11px] font-bold text-slate-300 outline-none hover:border-slate-600 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="prev">vs Anterior</option>
                        <option value="yoy">vs Año Pasado</option>
                    </select>
                    <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                </div>

                <button
                    onClick={apply}
                    disabled={busy}
                    className="relative flex items-center justify-center min-w-27.5 h-9 gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                    {busy ? <RefreshCcw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    <span>{busy ? "..." : "Aplicar"}</span>
                </button>
            </div>

            {/* FIX CALENDARIO: Letras claras y fondo oscuro */}
            <style jsx global>{`
  .custom-dark-calendar .rdp {
    --rdp-cell-size: 35px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #3b82f6;
    margin: 10px;
    color: #e2e8f0 !important;
  }

  .custom-dark-calendar .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important;
    color: white !important;
  }

  .custom-dark-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #1e293b !important;
    color: white !important;
  }

  .custom-dark-calendar .rdp-head_cell {
    color: #64748b !important;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .custom-dark-calendar .rdp-nav_button {
    color: #94a3b8 !important;
  }

  .custom-dark-calendar .rdp-caption_label {
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #f1f5f9 !important;
  }

  /* ✅ FIX EXTRA: fuerza texto claro en los días (algunos temas lo pisan) */
  .custom-dark-calendar .rdp-day_button {
    color: #e2e8f0 !important;
    font-weight: 800;
  }

  .custom-dark-calendar .rdp-day_outside .rdp-day_button {
    color: rgba(148, 163, 184, 0.45) !important;
  }
    /* ✅ FIX dropdown mes/año (select nativo) */
.custom-dark-calendar .rdp-dropdown,
.custom-dark-calendar .rdp-dropdown_month,
.custom-dark-calendar .rdp-dropdown_year {
  background: #0b1220 !important;            /* slate-950 */
  color: #e2e8f0 !important;                  /* slate-200 */
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  border-radius: 10px !important;
  padding: 6px 10px !important;
  font-weight: 800 !important;
  font-size: 0.75rem !important;
  outline: none !important;
}

/* opciones del select */
.custom-dark-calendar .rdp-dropdown option,
.custom-dark-calendar .rdp-dropdown_month option,
.custom-dark-calendar .rdp-dropdown_year option {
  background: #0b1220 !important;
  color: #e2e8f0 !important;
}

/* si tu DayPicker usa un select directo */
.custom-dark-calendar .rdp-caption select {
  background: #0b1220 !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  border-radius: 10px !important;
  padding: 6px 10px !important;
}

`}</style>

        </div>
    );
}

function DateButton({ label, value, busy, onSelect }: any) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    disabled={busy}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 hover:border-slate-600 transition-all group disabled:opacity-40"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 leading-none mb-0.5">{label}</span>
                        <span className="text-xs font-bold text-slate-200 tabular-nums">{prettyDate(value)}</span>
                    </div>
                    <CalendarIcon size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-auto p-3 bg-slate-950 border border-slate-800 text-slate-200 shadow-2xl dark"
            >
                <div className="custom-dark-calendar">
                    <Calendar
                        mode="single"
                        selected={parseISODate(value)}
                        onSelect={(d) => d && onSelect(iso(d))}
                        captionLayout="dropdown"
                    />
                </div>
            </PopoverContent>

        </Popover>

    );
}