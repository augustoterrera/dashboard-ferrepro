"use client";

import React from "react";
import { Bot, User, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "ai";

export type MarkdownComponents = Record<string, any>;

export const MessageBubble = React.memo(function MessageBubble({
    message,
    markdownComponents,
    onViewDashboard,
}: {
    message: UIMessage;
    markdownComponents: MarkdownComponents;
    onViewDashboard?: (toolData: any) => void;
}) {
    // Buscar tool part con output disponible (dynamic-tool para historial, tool-* para streaming nuevo)
    const toolResultPart = message.parts?.find(
        (p) =>
            (p.type === "dynamic-tool" || (p.type as string).startsWith("tool-")) &&
            (p as any).state === "output-available" &&
            (p as any).output != null
    ) as any | undefined;

    const hasToolData = !!toolResultPart;

    // Nombre del tool: dynamic-tool tiene .toolName, tool-* tiene el nombre en el tipo
    const resolvedToolName = toolResultPart
        ? toolResultPart.type === "dynamic-tool"
            ? toolResultPart.toolName
            : toolResultPart.type.replace("tool-", "")
        : undefined;

    // Texto del mensaje desde parts
    const textPart = message.parts?.find((p) => p.type === "text") as any;
    const textContent = textPart?.text ?? "";

    return (
        <div
            className={`flex gap-2.5 ${
                message.role === "user" ? "justify-end" : "justify-start"
            }`}
        >
            {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    <Bot className="h-4 w-4 text-white" />
                </div>
            )}

            <div
                className={`flex flex-col gap-2 ${
                    message.role === "user" ? "items-end max-w-[75%]" : "items-start max-w-[88%]"
                }`}
            >
                <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-bl-sm"
                    }`}
                >
                    {textContent && (
                        message.role === "user" ? (
                            <p className="text-sm leading-relaxed">{textContent}</p>
                        ) : (
                            <ReactMarkdown components={markdownComponents}>
                                {textContent}
                            </ReactMarkdown>
                        )
                    )}
                </div>

                {hasToolData && onViewDashboard && message.role === "assistant" && resolvedToolName === "getStats" && (
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
                        onClick={() =>
                            onViewDashboard({
                                output: toolResultPart.output,
                                toolName: resolvedToolName,
                            })
                        }
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Ver en Dashboard
                    </button>
                )}
            </div>

            {message.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-slate-300" />
                </div>
            )}
        </div>
    );
});
