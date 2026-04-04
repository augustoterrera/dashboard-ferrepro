"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Calendar as CalendarIcon, RefreshCcw, ArrowRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// ---------- Sub-components ----------

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
    <div className="flex flex-col items-start gap-0.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 transition-all hover:bg-slate-900">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
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

/** Picker unificado: un solo botón que muestra "DD/MM/AAAA → DD/MM/AAAA" */
function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  disabled,
}: {
  from: string;
  to: string;
  onFromChange: (s: string) => void;
  onToChange: (s: string) => void;
  disabled?: boolean;
}) {
  const fromDate = useMemo(() => (from ? parseISO(from) : undefined), [from]);
  const toDate = useMemo(() => (to ? parseISO(to) : undefined), [to]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="flex h-9 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 transition-all hover:bg-slate-900 disabled:opacity-50"
        >
          <CalendarIcon size={12} className="shrink-0 text-slate-600" />
          <span className="whitespace-nowrap text-xs font-bold text-slate-200">
            {from ? pretty(from) : "—"}&nbsp;→&nbsp;{to ? pretty(to) : "—"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4 bg-slate-950 border border-slate-800 text-slate-200 shadow-2xl"
        align="start"
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="custom-dark-calendar">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Desde</p>
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(d) => { if (d) onFromChange(iso(d)); }}
              captionLayout="dropdown"
            />
          </div>
          <div className="custom-dark-calendar">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Hasta</p>
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(d) => { if (d) onToChange(iso(d)); }}
              captionLayout="dropdown"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Botones de acceso rápido a rangos de fecha */
const PRESETS = [
  { label: "Hoy", days: 0 },
  { label: "7D",  days: 6 },
  { label: "30D", days: 29 },
] as const;

function getPresetRange(days: number): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  if (days === 0) return { from: to, to };
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to };
}

// ---------- Main export ----------

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

  const [cac,   setCac]   = useState(() => clampNum(sp.get("cac"),   300,  0));
  const [ctr,   setCtr]   = useState(() => clampNum(sp.get("ctr"),   1.5,  0, 100));
  const [freq,  setFreq]  = useState(() => clampNum(sp.get("freq"),  3.0,  0));
  const [minc,  setMinc]  = useState(() => clampNum(sp.get("minc"),  5,    0));
  const [limit, setLimit] = useState(() => clampNum(sp.get("limit"), 50,   1, 500));

  function applyFilters(overrides?: { from?: string; to?: string; level?: MetaLevel }) {
    const finalFrom = overrides?.from ?? from;
    const finalTo   = overrides?.to   ?? to;

    if (new Date(finalFrom) > new Date(finalTo)) {
      alert("La fecha 'Desde' no puede ser mayor a 'Hasta'");
      return;
    }

    const next = new URLSearchParams(sp.toString());
    next.set("from",    finalFrom);
    next.set("to",      finalTo);
    next.set("level",   overrides?.level ?? currentLevel);
    next.set("compare", currentCompare);
    next.set("cac",     String(cac));
    next.set("ctr",     String(ctr));
    next.set("freq",    String(freq));
    next.set("minc",    String(minc));
    next.set("limit",   String(limit));

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  function applyPreset(days: number) {
    const { from: f, to: t } = getPresetRange(days);
    setFrom(f);
    setTo(t);
    applyFilters({ from: f, to: t });
  }

  const handleReset = () => {
    setCac(300); setCtr(1.5); setFreq(3.0); setMinc(5); setLimit(50);
    setFrom(defaultFrom);
    setTo(defaultTo);
    startTransition(() => {
      router.push(pathname);
      router.refresh();
    });
  };

  // ── Shared tab buttons ──────────────────────────────────────────────────────
  const TabButtons = ({ fullWidth }: { fullWidth?: boolean }) => (
    <div
      className={`${fullWidth ? "grid grid-cols-3" : "flex"} bg-slate-950 rounded-xl p-1 border border-slate-800/50`}
    >
      {(["campaign", "adset", "resumen"] as MetaLevel[]).map((l) => (
        <button
          key={l}
          disabled={isPending}
          onClick={() => {
            setCurrentLevel(l);
            applyFilters({ level: l });
          }}
          className={`min-h-11 sm:min-h-0 py-2.5 sm:py-1.5 px-3 sm:px-4 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
            currentLevel === l
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP layout ─────────────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-col gap-2">
        {/* Tabs: nav independiente, fuera del bloque de filtros */}
        <TabButtons />

        {/* Bloque de filtros */}
        <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Date range unificado */}
          <DateRangePicker
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            disabled={isPending}
          />

          {/* Umbrales (solo campaign/adset) */}
          {currentLevel !== "resumen" && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  disabled={isPending}
                  className="flex h-9 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-slate-900 disabled:opacity-50"
                >
                  <SlidersHorizontal size={14} className="text-slate-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200 shadow-2xl"
              >
                <div className="mb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-white">Umbrales</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">afectan recomendaciones</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="CAC Obj"  value={cac}   onChange={setCac}   step={1}   disabled={isPending} />
                  <NumInput label="CTR Min"  value={ctr}   onChange={setCtr}   step={0.1} disabled={isPending} />
                  <NumInput label="Freq Max" value={freq}  onChange={setFreq}  step={0.1} disabled={isPending} />
                  <NumInput label="Min Conv" value={minc}  onChange={setMinc}  step={1}   disabled={isPending} />
                  <NumInput label="Limit"    value={limit} onChange={setLimit} step={10}  disabled={isPending} />
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    disabled={isPending}
                    onClick={handleReset}
                    className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-slate-900 disabled:opacity-50"
                  >
                    Reset
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => applyFilters()}
                    className="h-9 rounded-xl bg-blue-600 px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 disabled:bg-slate-800"
                  >
                    Aplicar
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Compare */}
          <select
            value={currentCompare}
            disabled={isPending}
            onChange={(e) => setCurrentCompare(e.target.value as CompareMode)}
            className="h-9 bg-slate-950 border border-slate-800 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-blue-500 transition-colors"
          >
            <option value="prev">vs Anterior</option>
            <option value="yoy">vs Año Pasado</option>
          </select>

          {/* Aplicar */}
          <button
            onClick={() => applyFilters()}
            disabled={isPending}
            className="h-9 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
          >
            {isPending ? <RefreshCcw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            <span>{isPending ? "Cargando" : "Aplicar"}</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE layout ──────────────────────────────────────────────────── */}
      <div className="flex sm:hidden flex-col gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        {/* 1. Navegación */}
        <TabButtons fullWidth />

        {/* 2. Presets de fecha */}
        <div className="flex gap-2">
          {PRESETS.map(({ label, days }) => (
            <button
              key={label}
              disabled={isPending}
              onClick={() => applyPreset(days)}
              className="flex-1 min-h-11 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 3. Rango de fechas */}
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          disabled={isPending}
        />

        {/* 4. Comparación */}
        <select
          value={currentCompare}
          disabled={isPending}
          onChange={(e) => setCurrentCompare(e.target.value as CompareMode)}
          className="min-h-11 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="prev">vs Anterior</option>
          <option value="yoy">vs Año Pasado</option>
        </select>

        {/* 5. Botón Aplicar (ancho completo) */}
        <button
          onClick={() => applyFilters()}
          disabled={isPending}
          className="min-h-11 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
        >
          {isPending ? <RefreshCcw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          <span>{isPending ? "Cargando" : "Aplicar"}</span>
        </button>
      </div>

      {/* ── Estilos calendario ─────────────────────────────────────────────── */}
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
    </>
  );
}
