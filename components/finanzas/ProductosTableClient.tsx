"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

function money(n: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Number(n ?? 0));
}


export function ProductosTableClient({
    from,
    to,
    tab,
    q,
    initialPage = 1,
    initialRows = [],
    limit = 20,
}: {
    from: string;
    to: string;
    tab: "facturacion" | "unidades";
    q: string;
    initialPage?: number;
    initialRows?: any[];
    limit?: number;
}) {
    const [page, setPage] = useState(initialPage);
    const [rows, setRows] = useState<any[]>(initialRows);
    const [isPending, startTransition] = useTransition();

    const params = useMemo(
        () => ({ from, to, tab, q, limit }),
        [from, to, tab, q, limit]
    );

    useEffect(() => {
        // si cambian filtros, volver a página 1
        setPage(1);
    }, [params.from, params.to, params.tab, params.q, params.limit]);

    useEffect(() => {
        let alive = true;

        startTransition(async () => {
            const url = new URL("/api/finanzas/productos", window.location.origin);
            url.searchParams.set("from", params.from);
            url.searchParams.set("to", params.to);
            url.searchParams.set("tab", params.tab);
            url.searchParams.set("q", params.q);
            url.searchParams.set("page", String(page));
            url.searchParams.set("limit", String(params.limit));

            const res = await fetch(url.toString(), { cache: "no-store" });
            const json = await res.json();

            if (!alive) return;
            if (!res.ok) {
                console.error(json);
                setRows([]);
                return;
            }
            setRows(json.rows ?? []);
        });

        return () => {
            alive = false;
        };
    }, [page, params]);

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                    {tab === "unidades" ? "Top productos por unidades" : "Top productos por facturación"}
                </h3>
                <div className="text-xs text-slate-500">
                    Página {page} {isPending ? "• cargando..." : ""}
                </div>
            </div>

            {/* ✅ CAMBIO: wrapper relative + overlay */}
            <div className="relative">
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-200" />
                            <span className="text-sm text-slate-200">Cargando…</span>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800">
                            <tr className="text-slate-500">
                                <th className="p-2 text-left font-semibold">Producto</th>
                                <th className="p-2 text-right font-semibold">Unidades</th>
                                <th className="p-2 text-right font-semibold">
                                    {tab === "unidades" ? "Valor" : "Facturación"}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {rows.map((r: any) => (
                                <tr key={r.sku} className="hover:bg-slate-800/30">
                                    <td className="p-2">
                                        <div className="font-semibold text-slate-100">{r.nombre}</div>
                                        <div className="text-xs text-slate-500">SKU: {r.sku}</div>
                                    </td>
                                    <td className="p-2 text-right">
                                        {Number(r.unidades ?? 0).toLocaleString("es-AR")}
                                    </td>
                                    <td className="p-2 text-right font-mono text-slate-100">
                                        {money(Number(r.facturacion ?? r.valor ?? 0))}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-6 text-center text-slate-400">
                                        Sin resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <button
                    disabled={page <= 1 || isPending}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-slate-800 ${page <= 1 ? "opacity-40" : "hover:bg-slate-800/40"
                        }`}
                >
                    ← Anterior
                </button>

                <button
                    disabled={isPending}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-slate-800 hover:bg-slate-800/40"
                >
                    Siguiente →
                </button>
            </div>
        </section>

    );
}
