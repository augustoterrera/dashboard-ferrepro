import { createClient } from "@/lib/supabase/server";
import { getMetaInsights } from "@/lib/meta/insights";


export default async function Page() {

    const meta = await getMetaInsights({
        since: "2024-01-01",
        until: "2026-01-31",
        level: "account",
        timeIncrement: "1",
        actionType: "onsite_conversion.messaging_conversation_started_7d",
    });


    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_pareto_80_productos", {
        p_from: "2025-01-01",
        p_to: "2026-01-31",
        p_empresa: 3526,
    });

    if (error) return <p> error...</p>;

    return (
        <section>
            <h1>OPERATIVO</h1>
            <h2 className="text-xl font-bold">Análisis de Pareto</h2>
            <p>Total Facturado: ${data.total.toLocaleString()}</p>

            <table className="min-w-full mt-4 border">
                <thead>
                    <tr className="bg-gray-100">
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Valor</th>
                        <th>% Acumulado</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row: any) => (
                        <tr key={row.sku} className={row.es_80 ? "bg-green-50" : ""}>
                            <td>{row.sku}</td>
                            <td>{row.nombre}</td>
                            <td>${row.valor.toFixed(2)}</td>
                            <td>{(row.pct_acumulado * 100).toFixed(2)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h1>Meta Ads - Insights</h1>

            <h2>Totales</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(meta.totals, null, 2)}
            </pre>

            <h2>Filas</h2>
            <pre style={{ whiteSpace: "pre-wrap", color: "white" }}>
                {JSON.stringify(meta.rows.slice(0, 5), null, 2)}
            </pre>
        </section>
    )
}