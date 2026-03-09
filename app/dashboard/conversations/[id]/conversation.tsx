"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Send, Bot } from "lucide-react";
import { MessageBubble } from "@/components/chat/bubbleMessage";
import { DashboardModal } from "@/components/chat/dashboardModal";
import type { DBMessage } from "@/types/chat";

function dbMessagesToAIMessages(dbMsgs: DBMessage[]): UIMessage[] {
    return dbMsgs.map((m) => {
        const base: UIMessage = {
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text", text: m.content }],
        };

        // Restaurar tool results en parts para mostrar el botón "Ver en Dashboard"
        if (m.tool_invocations?.length) {
            const toolParts = m.tool_invocations.map((ti) => ({
                type: "dynamic-tool" as const,
                toolName: ti.type.replace("tool-", ""),
                toolCallId: crypto.randomUUID(),
                state: "output-available" as const,
                input: {},
                output: ti.output,
            }));
            base.parts = [...base.parts, ...toolParts];
        }

        return base;
    });
}

export default function ChatPage({
    messages: initialDbMessages,
    conversationId,
    initialMessage,
}: {
    messages: DBMessage[];
    conversationId: string;
    initialMessage: string | null;
}) {
    const sentInitialRef = useRef(false);
    const router = useRouter();

    const [currentToolData, setCurrentToolData] = useState<any>(null);
    const [isOpenModalDashboard, setIsOpenModalDashboard] = useState(false);
    const [input, setInput] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({ api: `/api/chat/${conversationId}` }),
        messages: dbMessagesToAIMessages(initialDbMessages),
    });

    const isLoading = status === "streaming" || status === "submitted";

    // Enviar mensaje inicial desde URL param y limpiar la URL para que
    // un reload no lo reenvíe.
    useEffect(() => {
        if (initialMessage && !sentInitialRef.current) {
            sentInitialRef.current = true;
            sendMessage({ text: initialMessage });
            router.replace(`/dashboard/conversations/${conversationId}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll al final — solo cuando llega un mensaje nuevo, no en cada token
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const markdownComponents = useMemo(
        () => ({
            h1: ({ children }: any) => (
                <h1 className="text-sm font-bold text-white pb-2 mb-3 border-b border-slate-700/50">
                    {children}
                </h1>
            ),
            h2: ({ children }: any) => (
                <h2 className="text-xs font-semibold text-slate-200 mt-4 mb-1.5 pt-3 border-t border-slate-700/30 first:mt-0 first:border-0 first:pt-0">
                    {children}
                </h2>
            ),
            h3: ({ children }: any) => (
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-1 first:mt-0">
                    {children}
                </h3>
            ),
            p: ({ children }: any) => (
                <p className="text-sm text-slate-300 mb-2 leading-relaxed last:mb-0">{children}</p>
            ),
            ul: ({ children }: any) => (
                <ul className="mb-2 space-y-0.5 last:mb-0">{children}</ul>
            ),
            ol: ({ children }: any) => (
                <ol className="mb-2 space-y-0.5 last:mb-0 pl-4 list-decimal text-sm text-slate-300">{children}</ol>
            ),
            li: ({ children }: any) => (
                <li className="flex items-start gap-1.5 text-sm text-slate-300">
                    <span className="text-slate-600 mt-1.5 shrink-0 leading-none">—</span>
                    <span className="leading-relaxed">{children}</span>
                </li>
            ),
            strong: ({ children }: any) => (
                <strong className="font-semibold text-white">{children}</strong>
            ),
            em: ({ children }: any) => (
                <em className="not-italic text-slate-400">{children}</em>
            ),
            code: ({ children }: any) => (
                <code className="bg-slate-950/60 border border-slate-700/40 px-1.5 py-0.5 rounded text-xs font-mono text-slate-200">
                    {children}
                </code>
            ),
            blockquote: ({ children }: any) => (
                <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-slate-400 italic">
                    {children}
                </blockquote>
            ),
            hr: () => <hr className="border-slate-700/40 my-3" />,
            table: ({ children }: any) => (
                <div className="overflow-x-auto my-3 rounded-lg border border-slate-700/50">
                    <table className="w-full text-xs border-collapse">{children}</table>
                </div>
            ),
            thead: ({ children }: any) => (
                <thead className="bg-slate-700/40">{children}</thead>
            ),
            tbody: ({ children }: any) => (
                <tbody className="divide-y divide-slate-700/30">{children}</tbody>
            ),
            tr: ({ children }: any) => (
                <tr className="hover:bg-slate-700/20 transition-colors">{children}</tr>
            ),
            th: ({ children }: any) => (
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {children}
                </th>
            ),
            td: ({ children }: any) => (
                <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{children}</td>
            ),
        }),
        []
    );

    const handleViewDashboard = useCallback((toolData: any) => {
        setCurrentToolData(toolData);
        setIsOpenModalDashboard(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput("");
    };

    return (
        <>
            <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100 tracking-tight">Ferrepro IA</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <p className="text-xs text-slate-500 font-medium">En linea</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/40"
                >
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                <Bot className="h-8 w-8 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-200 mb-1">Bienvenido a Ferrepro AI</h3>
                                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                    Podés preguntarme sobre tu rendimiento financiero y operativo.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            markdownComponents={markdownComponents}
                            onViewDashboard={handleViewDashboard}
                        />
                    ))}

                    {status === "submitted" && (
                        <div className="flex gap-3 items-end">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-slate-800 border border-slate-700/50 rounded-xl rounded-bl-sm px-4 py-3">
                                <div className="flex gap-1.5 items-center h-4">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-3 items-end">
                            <div className="h-8 w-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="bg-red-950/40 border border-red-800/40 rounded-xl rounded-bl-sm px-4 py-3 text-xs text-red-400">
                                Error al conectar con el asistente. Intentá de nuevo.
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex gap-2 items-center bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-2 focus-within:border-blue-500/50 transition-colors duration-200">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
                            placeholder="Escribí tu mensaje..."
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </form>
            </div>

            <DashboardModal
                open={isOpenModalDashboard}
                onClose={() => {
                    setIsOpenModalDashboard(false);
                    setCurrentToolData(null);
                }}
                toolData={currentToolData}
            />
        </>
    );
}
