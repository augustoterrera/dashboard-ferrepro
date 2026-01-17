"use server"
import { createClient } from "@/lib/supabase"
import {
    generateText,
    tool,
    type UIMessage,
    type ModelMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { systemPrompt } from "@/lib/constans";

const HISTORY_LIMIT = 30;

export async function getMessages(id: string) {
    const supabase =  createClient()

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })

    const messages = data?.map(m => ({
        id: m.id,
        role: m.role,
        parts: [
            { type: "text", text: m.content },
            m.tool_invocations?.length > 0 ? { type: "tool-result", state: "output-available", output: m.tool_invocations[0].output, tool:m.tool_invocations[0].type } : null
        ].filter(Boolean)
    }))

    return { success: error ? false : true, messages }
}



export async function chatMessage(conversationId: string, message: string) {

    if (!conversationId) {
        return { success: false, error: "No hay ID de Conversacion" }
    }

    const lastUserMessage: ModelMessage = { role: "user", content: message }

    if (!lastUserMessage) {
        return { success: false, error: "No hay mensaje de usuario" }
    }

    const supabase = createClient();
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });


    const userText = lastUserMessage.content as string;

    const { data: historyRows, error: histErr } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

    if (histErr) console.error("Error cargando historial:", histErr);

    const history: ModelMessage[] =
        historyRows
            ?.slice()
            .reverse()
            .map((m) => ({ role: m.role, content: m.content })) ?? [];

    await Promise.all([
        supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId),
        supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: userText,
            tool_invocations: null,
        }),
    ]);

    let toolData: any = null;
    let toolExecuted = false;

    try {
        const decisionResult = await generateText({
            model: openai("gpt-4o-mini"),
            timeout: 28_000,
            maxRetries: 1,
            system: systemPrompt,
            messages: [...history, lastUserMessage],
            tools: {
                getStats: tool({
                    description:
                        "Obtiene estadísticas de la empresa: KPIs, top productos y series de ventas/pagos en un rango de fechas",
                    inputSchema: z.object({
                        dateFrom: z.string().length(10),
                        dateTo: z.string().length(10),
                    }),
                    execute: async ({ dateFrom, dateTo }) => {
                        const { data, error } = await supabase.rpc("get_dashboard_stats", {
                            p_from: dateFrom,
                            p_to: dateTo,
                            p_empresa: "3526",
                        });

                        if (!data || error) {
                            console.error("Error getStats:", error);
                            return null;
                        }

                        // Top días
                        const topPayments = (data.series?.pagos_por_dia ?? [])
                            .slice()
                            .sort((a: any, b: any) => b.pagos - a.pagos)
                            .slice(0, 5);

                        const topSales = (data.series?.ventas_por_dia ?? [])
                            .slice()
                            .sort((a: any, b: any) => b.ventas - a.ventas)
                            .slice(0, 5);

                        // Compacto pero completo (misma funcionalidad)
                        toolData = {
                            kpis: {
                                ...data.kpis,
                                ticket_promedio: Number(
                                    Number(data.kpis?.ticket_promedio ?? 0).toFixed(2)
                                ),
                            },
                            range: data.range,
                            topProducts: (data.top?.productos ?? []).slice(0, 10).map((p: any) => ({
                                nombre: p.nombre,
                                unidades: p.unidades,
                                ventaTotal: Number(p.venta_total).toFixed(2),
                            })),
                            bestDays: { payments: topPayments, sales: topSales },
                        };

                        toolExecuted = true;
                        return toolData;
                    },
                }),
            },
        });

        const toolsUsed = extractToolInvocations(decisionResult, toolData);

        let finalResponse = decisionResult.text;

        if (toolExecuted && toolData) {
            const analysisInput = buildAnalysisInput(toolData);

            const analysisResult = await generateText({
                model: openai("gpt-4o-mini"),
                timeout: 28_000,
                maxRetries: 1,
                system: [
                    "TAREA:",
                    "- Vas a recibir estadísticas ya calculadas (resumen).",
                    "- Generá un análisis completo con conclusiones, insights y recomendaciones accionables.",
                    "- NO pegues datos crudos ni JSON. Usá números puntuales solo si aportan valor.",
                    "- Estructurá la respuesta con títulos cortos y bullets cuando convenga.",
                ].join("\n"),
                messages: [
                    ...history,
                    lastUserMessage,
                    {
                        role: "assistant",
                        content:
                            "Datos disponibles para análisis (resumen estructurado):\n" + analysisInput,
                    },
                    {
                        role: "user",
                        content:
                            "Analizá estos datos y devolvé conclusiones, insights y recomendaciones. No incluyas datos crudos.",
                    },
                ],
            });
            finalResponse = analysisResult.text;

            await supabase.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: finalResponse,
                tool_invocations: toolsUsed.length ? toolsUsed : null,
            });
        } else {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: finalResponse,
                tool_invocations: null,
            });
        }

        return { success: true, message: finalResponse, toolData: toolExecuted ? toolData : null }
    } catch (err) {
        console.error("Error en el chat:", err);
        return { success: false, error: "Error en el servidor" }
    }
}


function extractToolInvocations(result: any, toolData: any) {
    // Caso A: result.response.messages[].content parts con tool-call
    const parts =
        result?.response?.messages
            ?.flatMap((msg: any) => msg.content ?? [])
            ?.filter((p: any) => p?.type === "tool-call") ?? [];

    if (parts.length) {
        return parts.map((toolCall: any) => ({
            type: `tool-${toolCall.toolName}`,
            input: toolCall.args,
            state: "output-available",
            output: toolData ?? null,
            toolCallId: toolCall.toolCallId,
        }));
    }

    // Caso B: result.toolCalls (según versión)
    const directCalls = Array.isArray(result?.toolCalls) ? result.toolCalls : [];
    return directCalls.map((c: any) => ({
        type: `tool-${c.toolName}`,
        input: c.args ?? c.input ?? null,
        state: "output-available",
        output: toolData ?? null,
        toolCallId: c.toolCallId ?? c.id ?? null,
    }));
}

function buildAnalysisInput(toolData: any) {
    const k = toolData?.kpis ?? {};
    const range = toolData?.range ?? {};
    const top = toolData?.topProducts ?? [];
    const bestSales = toolData?.bestDays?.sales ?? [];
    const bestPayments = toolData?.bestDays?.payments ?? [];

    return [
        `Rango: ${safe(range?.from)} → ${safe(range?.to)}`,
        "",
        "KPIs:",
        `- Ventas: ${safe(k?.ventas_total ?? k?.ventas ?? k?.total_ventas)}`,
        `- Pagos: ${safe(k?.pagos_total ?? k?.pagos ?? k?.total_pagos)}`,
        `- Ticket promedio: ${safe(k?.ticket_promedio)}`,
        `- Facturas: ${safe(k?.cantidad_facturas ?? k?.facturas)}`,
        `- Clientes: ${safe(k?.clientes ?? k?.cantidad_clientes)}`,
        "",
        "Top productos (máx 10):",
        ...top.map((p: any, i: number) => `- ${i + 1}. ${p.nombre} | unidades: ${p.unidades} | venta: ${p.ventaTotal}`),
        "",
        "Mejores días (ventas):",
        ...bestSales.map((d: any) => `- ${safe(d?.fecha ?? d?.dia ?? d?.date)}: ${safe(d?.ventas)}`),
        "",
        "Mejores días (pagos):",
        ...bestPayments.map((d: any) => `- ${safe(d?.fecha ?? d?.dia ?? d?.date)}: ${safe(d?.pagos)}`),
    ].join("\n");
}

function safe(v: any) {
    if (v === null || v === undefined || v === "") return "N/A";
    return String(v);
}