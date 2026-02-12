"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Calendar as CalendarIcon, RefreshCcw, ArrowRight, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal } from "lucide-react";


type MetaLevel = "campaign" | "adset" | "resumen";
type CompareMode = "prev" | "yoy";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function pretty(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function clampNum(v: string | null, fallback: number, min?: number, max?: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-0.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 transition-all hover:bg-slate-900 disabled:opacity-50">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <input
        disabled={disabled}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 bg-transparent text-xs font-bold text-slate-200 outline-none"
      />
    </div>
  );
}

function DatePicker({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (n: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const selected = useMemo(() => (value ? parseISO(value) : undefined), [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="flex flex-col items-start gap-0.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 transition-all hover:bg-slate-900 group disabled:opacity-50"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-500 transition-colors">
            {label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              {value ? pretty(value) : "—"}
            </span>
            <CalendarIcon size={12} className="text-slate-600" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 bg-slate-950 border border-slate-800 text-slate-200 shadow-2xl"
        align="start"
      >
        <div className="custom-dark-calendar">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(iso(d));
            }}
            captionLayout="dropdown"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}



export function MetaAdsFilterBar({
  defaultFrom,
  defaultTo,
  level,
  compare,
}: {
  defaultFrom: string;
  defaultTo: string;
  level: MetaLevel;
  compare: CompareMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState(sp.get("from") ?? defaultFrom);
  const [to, setTo] = useState(sp.get("to") ?? defaultTo);
  const [currentLevel, setCurrentLevel] = useState<MetaLevel>(level);
  const [currentCompare, setCurrentCompare] = useState<CompareMode>(compare);

  // ✅ umbrales (antes te faltaban)
  const [cac, setCac] = useState(() => clampNum(sp.get("cac"), 300, 0));
  const [ctr, setCtr] = useState(() => clampNum(sp.get("ctr"), 1.5, 0, 100));
  const [freq, setFreq] = useState(() => clampNum(sp.get("freq"), 3.0, 0));
  const [minc, setMinc] = useState(() => clampNum(sp.get("minc"), 5, 0));
  const [limit, setLimit] = useState(() => clampNum(sp.get("limit"), 50, 1, 500));

  function applyFilters(overrides?: { from?: string; to?: string; level?: MetaLevel }) {
    const finalFrom = overrides?.from ?? from;
    const finalTo = overrides?.to ?? to;

    // Validación de seguridad
    if (new Date(finalFrom) > new Date(finalTo)) {
      alert("La fecha 'Desde' no puede ser mayor a 'Hasta'");
      return;
    }
    const next = new URLSearchParams(sp.toString());

    next.set("from", overrides?.from ?? from);
    next.set("to", overrides?.to ?? to);
    next.set("level", overrides?.level ?? currentLevel);
    next.set("compare", currentCompare);

    // ✅ guardar umbrales en URL
    next.set("cac", String(cac));
    next.set("ctr", String(ctr));
    next.set("freq", String(freq));
    next.set("minc", String(minc));
    next.set("limit", String(limit));

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  const handleReset = () => {
    // Reset de umbrales
    setCac(300);
    setCtr(1.5);
    setFreq(3.0);
    setMinc(5);
    setLimit(50);

    // ✅ Reset de fechas a los valores por defecto
    setFrom(defaultFrom);
    setTo(defaultTo);

    // Empujamos una URL limpia
    startTransition(() => {
      router.push(pathname);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Tabs de nivel */}
      <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800/50">
        {(["campaign", "adset", "resumen"] as MetaLevel[]).map((l) => (
          <button
            key={l}
            disabled={isPending}
            onClick={() => {
              setCurrentLevel(l);
              applyFilters({ level: l });
            }}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${currentLevel === l
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Fechas */}
      <div className="flex items-center gap-1.5">
        <DatePicker label="Desde" value={from} onChange={setFrom} disabled={isPending} />
        <ChevronRight size={14} className="text-slate-700" />
        <DatePicker label="Hasta" value={to} onChange={setTo} disabled={isPending} />
      </div>

      {/* Umbrales (solo campaign/adset) */}
      {currentLevel !== "resumen" && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-slate-900 disabled:opacity-50"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[360px] rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white">Umbrales</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  afectan recomendaciones
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumInput label="CAC Obj" value={cac} onChange={setCac} step={1} disabled={isPending} />
              <NumInput label="CTR Min" value={ctr} onChange={setCtr} step={0.1} disabled={isPending} />
              <NumInput label="Freq Max" value={freq} onChange={setFreq} step={0.1} disabled={isPending} />
              <NumInput label="Min Conv" value={minc} onChange={setMinc} step={1} disabled={isPending} />
              <NumInput label="Limit" value={limit} onChange={setLimit} step={10} disabled={isPending} />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                disabled={isPending}
                onClick={handleReset}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-slate-900 disabled:opacity-50"
              >
                Reset
              </button>

              <button
                disabled={isPending}
                onClick={() => applyFilters()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 disabled:bg-slate-800"
              >
                Aplicar
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}


      {/* Comparación + aplicar */}
      <div className="flex items-center gap-3 ml-auto">
        <select
          value={currentCompare}
          disabled={isPending}
          onChange={(e) => setCurrentCompare(e.target.value as CompareMode)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="prev">vs Anterior</option>
          <option value="yoy">vs Año Pasado</option>
        </select>

        <button
          onClick={() => applyFilters()}
          disabled={isPending}
          className="flex items-center justify-center min-w-27.5 h-10 gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
        >
          {isPending ? <RefreshCcw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          <span>{isPending ? "Cargando" : "Aplicar"}</span>
        </button>
      </div>

      {/* estilos calendario (dejé tu bloque tal cual, podés pegarlo acá mismo) */}
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
        .custom-dark-calendar .rdp-dropdown,
        .custom-dark-calendar .rdp-dropdown_month,
        .custom-dark-calendar .rdp-dropdown_year {
          background: #0b1220 !important;
          color: #e2e8f0 !important;
          border: 1px solid rgba(148, 163, 184, 0.25) !important;
          border-radius: 10px !important;
          padding: 6px 10px !important;
          font-weight: 800 !important;
          font-size: 0.75rem !important;
          outline: none !important;
        }
        .custom-dark-calendar .rdp-dropdown option,
        .custom-dark-calendar .rdp-dropdown_month option,
        .custom-dark-calendar .rdp-dropdown_year option {
          background: #0b1220 !important;
          color: #e2e8f0 !important;
        }
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
