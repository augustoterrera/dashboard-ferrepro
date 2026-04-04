"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type CompareMode = "prev" | "yoy";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function clampNum(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

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

function DateButton({ label, value, onSelect }: { label: string; value: string; onSelect: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 hover:border-slate-600 transition-all group"
        >
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 leading-none mb-0.5">{label}</span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">{prettyDate(value)}</span>
          </div>
          <CalendarIcon size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3 bg-slate-950 border border-slate-800 text-slate-200 shadow-2xl dark">
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

export function ParetoFilterBar(props: {
  defaultFrom: string;
  defaultTo: string;
  defaultCompare?: CompareMode;
  defaultUmbral?: number; // 0.8
  defaultOnly80?: boolean; // true
  defaultTop?: number; // 15
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const qs = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  const initialFrom = sp.get("from") ?? props.defaultFrom;
  const initialTo = sp.get("to") ?? props.defaultTo;

  const initialCompare =
    (sp.get("compare") as CompareMode) ?? (props.defaultCompare ?? "prev");

  const initialUmbral = (() => {
    const raw = sp.get("umbral");
    const n = raw ? Number(raw) : (props.defaultUmbral ?? 0.8);
    return clampNum(Number.isFinite(n) ? n : 0.8, 0.5, 0.95);
  })();

  const initialOnly80 = (() => {
    const raw = sp.get("only80");
    if (raw === "0") return false;
    if (raw === "1") return true;
    return props.defaultOnly80 ?? true;
  })();

  const initialTop = (() => {
    const raw = sp.get("top");
    const n = raw ? parseInt(raw, 10) : (props.defaultTop ?? 15);
    const safe = Number.isFinite(n) ? n : 15;
    return clampNum(safe, 5, 50);
  })();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [compare, setCompare] = useState<CompareMode>(initialCompare);
  const [umbral, setUmbral] = useState<number>(initialUmbral);
  const [only80, setOnly80] = useState<boolean>(initialOnly80);
  const [top, setTop] = useState<number>(initialTop);

  function push(next: {
    from: string;
    to: string;
    compare: CompareMode;
    umbral: number;
    only80: boolean;
    top: number;
  }) {
    const nextQs = new URLSearchParams(qs);
    nextQs.set("from", next.from);
    nextQs.set("to", next.to);
    nextQs.set("compare", next.compare);

    nextQs.set("umbral", String(clampNum(next.umbral, 0.5, 0.95)));
    nextQs.set("only80", next.only80 ? "1" : "0");
    nextQs.set("top", String(clampNum(next.top, 5, 50)));

    router.push(`${pathname}?${nextQs.toString()}`);
    router.refresh();
  }

  function apply() {
    push({ from, to, compare, umbral, only80, top });
  }

  function setDays(days: number) {
    const toD = new Date();
    const fromD = new Date();
    fromD.setDate(toD.getDate() - days + 1);

    const nextFrom = iso(fromD);
    const nextTo = iso(toD);

    setFrom(nextFrom);
    setTo(nextTo);

    push({ from: nextFrom, to: nextTo, compare, umbral, only80, top });
  }

  const umbralPct = Math.round(umbral * 100);

  return (
    <>
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
  .custom-dark-calendar .rdp-nav_button { color: #94a3b8 !important; }
  .custom-dark-calendar .rdp-caption_label {
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #f1f5f9 !important;
  }
  .custom-dark-calendar .rdp-day_button { color: #e2e8f0 !important; font-weight: 800; }
  .custom-dark-calendar .rdp-day_outside .rdp-day_button { color: rgba(148,163,184,0.45) !important; }
  .custom-dark-calendar .rdp-dropdown,
  .custom-dark-calendar .rdp-dropdown_month,
  .custom-dark-calendar .rdp-dropdown_year {
    background: #0b1220 !important;
    color: #e2e8f0 !important;
    border: 1px solid rgba(148,163,184,0.25) !important;
    border-radius: 10px !important;
    padding: 6px 10px !important;
    font-weight: 800 !important;
    font-size: 0.75rem !important;
    outline: none !important;
  }
  .custom-dark-calendar .rdp-dropdown option,
  .custom-dark-calendar .rdp-dropdown_month option,
  .custom-dark-calendar .rdp-dropdown_year option { background: #0b1220 !important; color: #e2e8f0 !important; }
  .custom-dark-calendar .rdp-caption select {
    background: #0b1220 !important;
    color: #e2e8f0 !important;
    border: 1px solid rgba(148,163,184,0.25) !important;
    border-radius: 10px !important;
    padding: 6px 10px !important;
  }
`}</style>
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-2 shadow-2xl backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pl-4 lg:flex-nowrap">

      {/* Fila 1 mobile: quick ranges + compare selector */}
      <div className="flex items-center gap-1 sm:border-r sm:border-slate-700/50 sm:pr-4">
        <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">
          Filtros
        </span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className="rounded-md px-2.5 py-2 sm:py-1.5 text-xs font-bold text-slate-400 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
            onClick={() => setDays(d)}
            type="button"
          >
            {d}d
          </button>
        ))}

        {/* Compare — solo en mobile inline aquí */}
        <div className="relative ml-auto sm:hidden">
          <select
            value={compare}
            onChange={(e) => setCompare(e.target.value as CompareMode)}
            className="appearance-none rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-7 py-2 text-xs font-bold text-slate-300 outline-none transition-all focus:border-blue-500"
          >
            <option value="prev">vs Anterior</option>
            <option value="yoy">vs Año pasado</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fila 2 mobile / inline desktop: fechas + compare (sm+) + aplicar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <DateButton label="Desde" value={from} onSelect={setFrom} />
          <ChevronRight size={14} className="text-slate-700 shrink-0" />
          <DateButton label="Hasta" value={to} onSelect={setTo} />
        </div>

        {/* Compare — solo en sm+ */}
        <div className="relative hidden sm:block">
          <select
            value={compare}
            onChange={(e) => setCompare(e.target.value as CompareMode)}
            className="appearance-none rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-1.5 text-xs font-bold text-slate-300 outline-none transition-all focus:border-blue-500"
          >
            <option value="prev">Período anterior</option>
            <option value="yoy">Año anterior (YoY)</option>
          </select>
          <span className="absolute -top-2 left-2 bg-slate-900 px-1 text-[9px] font-black uppercase tracking-tighter text-slate-500">
            Comparar
          </span>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button
          onClick={apply}
          className="w-full sm:w-auto group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-4 sm:px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          type="button"
        >
          <span className="relative z-10">Aplicar</span>
          <svg className="relative z-10 h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
    </>
  );
}
