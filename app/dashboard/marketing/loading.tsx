'use client'
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto max-w-7xl space-y-8 p-8">
        
        {/* HEADER SKELETON */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-slate-800/50" /> {/* Título */}
            <Skeleton className="h-4 w-40 bg-slate-800/50" />  {/* Subtítulo */}
          </div>
          <Skeleton className="h-3 w-32 bg-slate-800/50" />    {/* Fechas */}
        </header>

        {/* KPIs GRID SKELETON */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 space-y-3">
              <Skeleton className="h-3 w-20 bg-slate-800/50" /> {/* Label */}
              <Skeleton className="h-7 w-28 bg-slate-800/80" /> {/* Value */}
            </div>
          ))}
        </section>

        {/* DASHBOARD CONTENT SKELETON */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* GRÁFICO (2/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl lg:col-span-2">
            <Skeleton className="mb-6 h-4 w-48 bg-slate-800/50" /> {/* Título gráfico */}
            <div className="flex h-80 items-end gap-2">
              {/* Simulación de barras de gráfico para dar contexto visual */}
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="w-full bg-slate-800/30" 
                  style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
                />
              ))}
            </div>
          </div>

          {/* LISTA DE PRODUCTOS (1/3) */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl lg:h-[440px]">
            <Skeleton className="mb-6 h-4 w-32 bg-slate-800/50" /> {/* Título top */}
            
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-slate-800/60" /> {/* Nombre producto */}
                    <Skeleton className="h-3 w-20 bg-slate-800/40" /> {/* Unidades */}
                  </div>
                  <Skeleton className="h-4 w-16 bg-slate-800/60" />   {/* Precio/Recaudado */}
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  )
}