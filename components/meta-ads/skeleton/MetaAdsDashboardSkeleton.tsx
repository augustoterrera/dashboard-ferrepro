import { Skeleton } from "@/components/ui/skeleton";

export function MetaAdsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <Skeleton className="h-3 w-24 bg-slate-800/50" />
            <Skeleton className="mt-3 h-8 w-40 bg-slate-800/50" />
            <Skeleton className="mt-2 h-3 w-28 bg-slate-800/50" />
          </div>
        ))}
      </section>

      {/* Charts / tabla */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <Skeleton className="h-4 w-48 bg-slate-800/50" />
            <Skeleton className="mt-2 h-3 w-32 bg-slate-800/50" />
            <Skeleton className="mt-4 h-80 w-full bg-slate-800/30" />
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <Skeleton className="h-4 w-52 bg-slate-800/50" />
        <Skeleton className="mt-4 h-64 w-full bg-slate-800/30" />
      </div>
    </div>
  );
}
