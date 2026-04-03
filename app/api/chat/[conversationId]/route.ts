import { streamText, tool, convertToModelMessages, zodSchema, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@/lib/supabase/server";
import { getSystemPrompt } from "@/lib/constans";

const EMPRESA_ID = 3526;

export async function POST(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const { conversationId } = await params;
    console.log("[chat/route] POST conversationId:", conversationId);
    const { messages } = await req.json();

    const session = await getServerSession(authOptions);
    const sucursalId = session?.user?.role === "admin" ? null : (session?.user?.id_sucursal ?? null);

    const supabase = await createClient();
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // Guardar mensaje del usuario en DB
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
        const userContent =
            lastUserMsg.parts?.find((p: any) => p.type === "text")?.text ??
            (typeof lastUserMsg.content === "string" ? lastUserMsg.content : "");

        await Promise.all([
            supabase.from("messages").insert({
                conversation_id: conversationId,
                role: "user",
                content: userContent,
                tool_invocations: null,
            }),
            supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId),
        ]);
    }

    // Convert UIMessage[] → ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages, { ignoreIncompleteToolCalls: true });
    console.log("[chat] modelMessages count:", modelMessages.length, "last role:", modelMessages.at(-1)?.role);

    const result = streamText({
        model: openai.chat("gpt-4o-mini"),
        system: getSystemPrompt(),
        messages: modelMessages,
        stopWhen: stepCountIs(3),
        tools: {
            getStats: tool({
                description:
                    "KPIs generales (ventas, pagos, facturas, ticket promedio), top productos y mejores días del período. Usar para preguntas generales sobre facturación o rendimiento.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_dashboard_stats", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return {
                            type: "getStats",
                            kpis: data.kpis,
                            range: data.range,
                            topProducts: (data.top?.productos ?? []).slice(0, 10),
                            bestDays: {
                                sales: [...(data.series?.ventas_por_dia ?? [])]
                                    .sort((a: any, b: any) => b.ventas - a.ventas)
                                    .slice(0, 5),
                                payments: [...(data.series?.pagos_por_dia ?? [])]
                                    .sort((a: any, b: any) => b.pagos - a.pagos)
                                    .slice(0, 5),
                            },
                        };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getVentasComparacion: tool({
                description:
                    "Compara ventas del período actual vs el período anterior de igual duración. Usar para 'cómo me fue vs antes', 'comparar períodos', 'evolución reciente'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_serie_ventas_diaria_comparacion", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "ventasComparacion", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getVentasYOY: tool({
                description:
                    "Compara ventas del período actual vs el mismo período del año anterior (YoY). Usar para 'vs el año pasado', 'mismo mes año anterior', 'comparación anual'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_serie_ventas_diaria_yoy", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "ventasYOY", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getPareto: tool({
                description:
                    "Análisis Pareto 80/20: qué productos generan el 80% de la facturación. Usar para 'productos estrella', 'regla 80/20', 'productos más importantes por facturación'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_pareto_80_productos", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                            p_umbral: 0.8,
                            p_only_80: true,
                            p_limit: 100,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "pareto", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getParetoComparacion: tool({
                description:
                    "Compara el Pareto 80/20 entre el período actual y el anterior: qué productos entraron, salieron o se mantuvieron. Usar para 'cambios en productos clave', 'qué productos perdieron importancia'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_pareto_a_comparacion", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                            p_umbral: 0.8,
                            p_limit_changes: 200,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "paretoComparacion", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getTopProductosUnidades: tool({
                description:
                    "Top productos por unidades vendidas (cantidad física). Usar para 'más vendidos en cantidad', 'qué se vende más', 'volumen de ventas por producto'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    limit: z.number().optional().describe("Cantidad de productos a retornar (default 20)"),
                })),
                execute: async ({ dateFrom, dateTo, limit = 20 }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_top_productos_unidades", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                            p_q: null,
                            p_sku: null,
                            p_limit: limit,
                            p_offset: 0,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "topUnidades", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getMetodosPago: tool({
                description:
                    "Top métodos de pago utilizados: efectivo, tarjeta, transferencia, etc. Usar para 'cómo pagan los clientes', 'medios de pago', 'métodos de cobro'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_top_metodos_pago", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_limit: 10,
                            p_sucursal: sucursalId,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "metodosPago", rows: data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            buscarProducto: tool({
                description:
                    "Facturación de un producto específico buscado por nombre o SKU. Usar para '¿cuánto vendí de X producto?', 'mostrame tornillos', 'búsqueda de producto concreto'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    query: z.string().optional().describe("Nombre o parte del nombre del producto a buscar"),
                    sku: z.string().optional().describe("SKU exacto del producto"),
                    limit: z.number().optional().describe("Cantidad de resultados (default 20)"),
                })),
                execute: async ({ dateFrom, dateTo, query, sku, limit = 20 }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_facturacion_por_producto", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                            p_sku: sku ?? null,
                            p_q: query ?? null,
                            p_limit: limit,
                            p_offset: 0,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese producto.";
                        return { type: "buscarProducto", ...data };
                    } catch { return "No se pudieron obtener los datos para ese producto."; }
                },
            }),

            getTopUnidadesComparacion: tool({
                description:
                    "Compara unidades vendidas por producto entre el período actual y el anterior. Usar para 'qué productos vendí más/menos en cantidad', 'variación de volumen', 'cambios en lo que más se mueve'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    limit: z.number().optional().describe("Cantidad de productos a retornar (default 30)"),
                })),
                execute: async ({ dateFrom, dateTo, limit = 30 }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_top_unidades_comparacion", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_limit: limit,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "topUnidadesComparacion", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getParetoYOY: tool({
                description:
                    "Compara el Pareto 80/20 entre el período actual y el mismo período del año anterior. Usar para 'qué productos cambiaron de importancia vs el año pasado', 'análisis anual del mix de productos'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_pareto_yoy_comparacion", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: EMPRESA_ID,
                            p_sucursal: sucursalId,
                            p_umbral: 0.8,
                            p_limit_changes: 200,
                        });
                        if (error || !data) return "No se pudieron obtener los datos para ese período.";
                        return { type: "paretoYOY", ...data };
                    } catch { return "No se pudieron obtener los datos para ese período."; }
                },
            }),

            getVentasCliente: tool({
                description:
                    "Top clientes por facturación en un período. Usar para 'mejores clientes', 'quién compró más', 'ranking de clientes', 'concentración de ventas por cliente'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    limit: z.number().optional().describe("Cantidad de clientes a retornar (default 20)"),
                })),
                execute: async ({ dateFrom, dateTo, limit = 20 }) => {
                    const { data, error } = await supabase.rpc("get_ventas_por_cliente", {
                        p_from: dateFrom,
                        p_to: dateTo,
                        p_empresa: EMPRESA_ID,
                        p_limit: limit,
                    });
                    if (error) { console.error("[getVentasCliente]", error); return `Error: ${error.message}`; }
                    if (!data) return "Sin datos para ese período.";
                    return { type: "ventasCliente", ...data };
                },
            }),

            getMargenResumen: tool({
                description:
                    "Resumen de márgenes por período: margen promedio, productos con mejor y peor margen. Usar para '¿cuál es mi margen?', 'rentabilidad', 'margen promedio', 'qué producto tiene mejor margen'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    limit: z.number().optional().describe("Cantidad de productos a retornar en el ranking (default 10)"),
                })),
                execute: async ({ dateFrom, dateTo, limit = 10 }) => {
                    const { data, error } = await supabase.rpc("get_margen_resumen", {
                        p_from: dateFrom,
                        p_to: dateTo,
                        p_empresa: EMPRESA_ID,
                        p_limit: limit,
                    });
                    if (error) { console.error("[getMargenResumen]", error); return `Error: ${error.message}`; }
                    if (!data) return "Sin datos para ese período.";
                    return { type: "margenResumen", ...data };
                },
            }),

            getVentasHoraDia: tool({
                description:
                    "Distribución de ventas por hora del día. Usar para '¿a qué hora se vende más?', 'horarios pico', 'cuándo hay más actividad', 'franjas horarias'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    const { data, error } = await supabase.rpc("get_ventas_hora_dia", {
                        p_from: dateFrom,
                        p_to: dateTo,
                        p_empresa: EMPRESA_ID,
                    });
                    if (error) { console.error("[getVentasHoraDia]", error); return `Error: ${error.message}`; }
                    if (!data) return "Sin datos para ese período.";
                    return { type: "ventasHoraDia", rows: data };
                },
            }),

            getProductosKpis: tool({
                description:
                    "KPIs de productos: total de SKUs activos, productos nuevos, productos sin movimiento. Usar para 'cuántos productos tengo activos', 'SKUs nuevos', 'productos sin ventas', 'diversidad del catálogo'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("get_productos_kpis", {
                            p_empresa: EMPRESA_ID,
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_sucursal: sucursalId,
                        });
                        if (error) { console.error("[getProductosKpis]", error); return `Error: ${error.message}`; }
                        if (!data) return "Sin datos para ese período.";
                        return { type: "productosKpis", ...data };
                    } catch { return "No se pudieron obtener los KPIs de productos."; }
                },
            }),

            getMetaResumen: tool({
                description:
                    "Resumen general de campañas de Meta Ads (Facebook/Instagram): gasto total, impresiones, alcance, clicks, conversaciones iniciadas, CAC, CTR, CPC, CPM. Usar para '¿cómo van las campañas?', 'gasto en publicidad', 'resultados de Meta', 'rendimiento de ads'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                })),
                execute: async ({ dateFrom, dateTo }) => {
                    try {
                        const { data, error } = await supabase.rpc("meta_home_summary_mixed", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_conv_level: "campaign",
                        });
                        if (error) { console.error("[getMetaResumen]", error); return `Error: ${error.message}`; }
                        if (!data) return "Sin datos de Meta Ads para ese período.";
                        return { type: "metaResumen", ...(data?.[0] ?? {}) };
                    } catch { return "No se pudieron obtener los datos de Meta Ads."; }
                },
            }),

            getMetaCampanias: tool({
                description:
                    "Ranking y recomendaciones de campañas de Meta Ads: qué campañas escalar, mantener, revisar o pausar. Usar para '¿qué campañas están funcionando bien?', 'recomendaciones de campañas', 'qué pausar en Meta', 'optimización de campañas'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    cacObjetivo: z.number().optional().describe("CAC objetivo en pesos (default 300)"),
                })),
                execute: async ({ dateFrom, dateTo, cacObjetivo = 300 }) => {
                    try {
                        const { data, error } = await supabase.rpc("meta_campaign_ranking_reco", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_limit: 50,
                            p_min_conversations: 5,
                            p_cac_objetivo: cacObjetivo,
                            p_ctr_min: 1.5,
                            p_freq_max: 3.0,
                        });
                        if (error) { console.error("[getMetaCampanias]", error); return `Error: ${error.message}`; }
                        if (!data) return "Sin datos de campañas para ese período.";
                        return { type: "metaCampanias", rows: data };
                    } catch { return "No se pudieron obtener los datos de campañas de Meta."; }
                },
            }),

            getMetaAdsets: tool({
                description:
                    "Ranking y recomendaciones de conjuntos de anuncios (ad sets) de Meta Ads. Usar para 'conjuntos de anuncios', 'ad sets de Meta', 'detalle de grupos de anuncios', 'qué ad set optimizar'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    cacObjetivo: z.number().optional().describe("CAC objetivo en pesos (default 300)"),
                })),
                execute: async ({ dateFrom, dateTo, cacObjetivo = 300 }) => {
                    try {
                        const { data, error } = await supabase.rpc("meta_adset_ranking_reco", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_limit: 50,
                            p_min_conversations: 5,
                            p_cac_objetivo: cacObjetivo,
                            p_ctr_min: 1.5,
                            p_freq_max: 3.0,
                        });
                        if (error) { console.error("[getMetaAdsets]", error); return `Error: ${error.message}`; }
                        if (!data) return "Sin datos de ad sets para ese período.";
                        return { type: "metaAdsets", rows: data };
                    } catch { return "No se pudieron obtener los datos de ad sets de Meta."; }
                },
            }),

            getMetaTimeseries: tool({
                description:
                    "Serie temporal de Meta Ads: evolución diaria de gasto, conversaciones y CAC comparando vs período anterior o año anterior. Usar para 'evolución de campañas en el tiempo', 'tendencia de Meta Ads', 'gasto diario en publicidad', 'comparar rendimiento de ads vs antes'.",
                inputSchema: zodSchema(z.object({
                    dateFrom: z.string().describe("Fecha inicio YYYY-MM-DD"),
                    dateTo: z.string().describe("Fecha fin YYYY-MM-DD"),
                    compare: z.enum(["prev", "yoy"]).optional().describe("Modo de comparación: 'prev' = período anterior, 'yoy' = mismo período año anterior (default: 'prev')"),
                })),
                execute: async ({ dateFrom, dateTo, compare = "prev" }) => {
                    try {
                        const { data, error } = await supabase.rpc("meta_home_timeseries_mixed", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_compare: compare,
                            p_conv_level: "campaign",
                        });
                        if (error) { console.error("[getMetaTimeseries]", error); return `Error: ${error.message}`; }
                        if (!data) return "Sin datos de serie temporal de Meta para ese período.";
                        return { type: "metaTimeseries", compare, rows: data };
                    } catch { return "No se pudieron obtener la serie temporal de Meta Ads."; }
                },
            }),
        },

        onFinish: async ({ text, steps }) => {
            const toolInvocations = steps
                .flatMap((s) => s.toolResults ?? [])
                .map((tr) => ({
                    type: `tool-${tr.toolName}`,
                    output: tr.output,
                }));

            await supabase.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: text,
                tool_invocations: toolInvocations.length ? toolInvocations : null,
            });
        },
    });

    return result.toUIMessageStreamResponse();
}
