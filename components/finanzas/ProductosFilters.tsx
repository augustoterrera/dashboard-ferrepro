"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

function buildUrl(pathname: string, params: URLSearchParams) {
  return `${pathname}?${params.toString()}`;
}

export function ProductosFilters({
  from,
  to,
  tab,
  q,
  page,
}: {
  from: string;
  to: string;
  tab: "facturacion" | "unidades";
  q: string;
  page: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localQ, setLocalQ] = useState(q);

  const params = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    p.set("from", from);
    p.set("to", to);
    p.set("tab", tab);
    p.set("page", String(page));
    p.set("q", q);
    return p;
  }, [sp, from, to, tab, page, q]);

  const go = (next: URLSearchParams) => {
    startTransition(() => {
      router.replace(buildUrl(pathname, next), { scroll: false });
    });
  };

  const setTab = (nextTab: "facturacion" | "unidades") => {
    const next = new URLSearchParams(params);
    next.set("tab", nextTab);
    next.set("page", "1");
    go(next);
  };

  const applySearch = () => {
    const next = new URLSearchParams(params);
    next.set("q", localQ.trim());
    next.set("page", "1");
    go(next);
  };

  const prev = () => {
    const next = new URLSearchParams(params);
    next.set("page", String(Math.max(1, page - 1)));
    go(next);
  };

  const next = () => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("page", String(page + 1));
    go(nextParams);
  };

  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("facturacion")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            tab === "facturacion"
              ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-600/40"
              : "bg-slate-900/40 text-slate-300 ring-1 ring-slate-800"
          }`}
        >
          Por $ (Facturación)
        </button>

        <button
          type="button"
          onClick={() => setTab("unidades")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            tab === "unidades"
              ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-600/40"
              : "bg-slate-900/40 text-slate-300 ring-1 ring-slate-800"
          }`}
        >
          Por unidades
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
          placeholder="Buscar producto..."
          className="w-full sm:w-80 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600"
        />
        <button
          type="button"
          onClick={applySearch}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Buscando..." : "Buscar"}
        </button>

        <button
          type="button"
          onClick={prev}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-slate-800 ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-800/40"
          }`}
        >
          ←
        </button>

        <button
          type="button"
          onClick={next}
          className="rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-slate-800 hover:bg-slate-800/40"
        >
          →
        </button>
      </div>
    </section>
  );
}
