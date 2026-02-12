"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type MetaLevel = "account" | "campaign" | "adset" | "ad";

export function LevelBar({
  value,
  levels = ["account", "campaign", "adset", "ad"],
}: {
  value: MetaLevel;
  levels?: MetaLevel[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  function setLevel(nextLevel: MetaLevel) {
    const next = new URLSearchParams(qs);
    next.set("level", nextLevel);
    router.push(`${pathname}?${next.toString()}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        Nivel
      </span>
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/40 p-1">
        {levels.map((l) => {
          const active = l === value;
          return (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all " +
                (active
                  ? "bg-blue-600/20 text-white ring-1 ring-blue-500/40"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white")
              }
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
