"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type CompareMode = "prev" | "yoy";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function clampNum(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
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
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-900/40 p-2 pl-4 shadow-2xl backdrop-blur-md">
      {/* Quick ranges */}
      <div className="flex items-center gap-1 border-r border-slate-700/50 pr-4">
        <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Filtros
        </span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className="rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-400 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
            onClick={() => setDays(d)}
            type="button"
          >
            {d}d
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Dates */}
        <div className="flex items-center gap-2">
          <div className="group relative">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-34 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute -top-2 left-2 bg-slate-900 px-1 text-[9px] font-black uppercase tracking-tighter text-slate-500">
              Desde
            </span>
          </div>

          <span className="text-slate-600">—</span>

          <div className="group relative">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-34 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute -top-2 left-2 bg-slate-900 px-1 text-[9px] font-black uppercase tracking-tighter text-slate-500">
              Hasta
            </span>
          </div>
        </div>

        {/* Compare */}
        <div className="relative group">
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

        {/* Apply */}
        <button
          onClick={apply}
          className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          type="button"
        >
          <span className="relative z-10">Aplicar</span>
          <svg
            className="relative z-10 h-3 w-3 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
