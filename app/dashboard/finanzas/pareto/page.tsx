import { getPareto80, getParetoComparacion, getParetoComparacionYoY } from "@/lib/data/finanzas";
import type { Pareto80Response, ParetoComparacionResponse } from "@/types/pareto";
import { ParetoView } from "./ui/ParetoView";
import { ParetoFilterBar } from "@/components/filters/ParetoFilterBar";

function clampDate(v: string | null, fallback: string) {
  return (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : fallback;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; compare?: "prev" | "yoy" }>;
}) {
  const sp = await searchParams;

  const defaultTo = todayISO();
  const defaultFrom = daysAgoISO(29);

  const from = clampDate(sp.from ?? null, defaultFrom);
  const to = clampDate(sp.to ?? null, defaultTo);
  const compare = (sp.compare === "yoy" ? "yoy" : "prev") as "prev" | "yoy";

  // Ajustá si vos sacás empresaId desde sesión/usuario.
  const empresaId = null;

  const pareto80 = (await getPareto80({
    from,
    to,
    empresaId,
    umbral: 0.8,
    only80: false, // para poder ver A vs no-A en tabla si querés
    limit: 200,
  })) as Pareto80Response;

  const comparacion =
    compare === "prev"
      ? ((await getParetoComparacion({
        from,
        to,
        empresaId,
        umbral: 0.8,
        limitChanges: 200,
      })) as ParetoComparacionResponse)
      : ((await getParetoComparacionYoY({
        from,
        to,
        empresaId,
        umbral: 0.8,
        limitChanges: 200,
      })) as ParetoComparacionResponse);


  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      {/* HEADER CON TÍTULO Y FILTRO ALINEADOS */}
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Pareto <span className="text-emerald-500 text-xl not-italic">80/20</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Optimización de Inventario y Ventas
          </p>
        </div>

        {/* El filtro ahora solo ocupa el espacio necesario */}
        <div className="shrink-0">
          <ParetoFilterBar defaultFrom={from} defaultTo={to} />
        </div>
      </header>

      <ParetoView
        pareto={pareto80}
        comparacionPrev={comparacion}
        compareMode={compare}
      />
    </div>
  );
}
