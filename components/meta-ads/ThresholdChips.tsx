"use client";

import { InfoTip } from "@/components/info-tip";

export function ThresholdChips({
  cacObjetivo,
  ctrMin,
  freqMax,
  minConversations,
  limit,
}: {
  cacObjetivo: number;
  ctrMin: number;
  freqMax: number;
  minConversations: number;
  limit: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
        CAC Obj: {cacObjetivo}
      </span>
      <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
        CTR Min: {ctrMin}%
      </span>
      <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
        Freq Max: {freqMax}
      </span>
      <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
        Min Conv: {minConversations}
      </span>
      <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
        Limit: {limit}
      </span>

      <div className="ml-1">
        <InfoTip text="Estos umbrales vienen del filtro. Cambiarlos cambia las recomendaciones (ESCALAR/PAUSAR/REVISAR)." />
      </div>
    </div>
  );
}
