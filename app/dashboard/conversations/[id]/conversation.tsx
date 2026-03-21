"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Send, Bot, ChevronDown } from "lucide-react";
import { MessageBubble } from "@/components/chat/bubbleMessage";
import { DashboardModal } from "@/components/chat/dashboardModal";
import type { DBMessage } from "@/types/chat";
import { generateConversationTitle } from "@/app/dashboard/conversations/actions";
import { useConversationContext } from "@/context/ConversationContext";

function dbMessagesToAIMessages(dbMsgs: DBMessage[]): UIMessage[] {
    return dbMsgs.map((m) => {
        const base: UIMessage = {
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text", text: m.content }],
        };

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
    initialTitle,
}: {
    messages: DBMessage[];
    conversationId: string;
    initialMessage: string | null;
    initialTitle: string;
}) {
    const sentInitialRef = useRef(false);
    const titleGeneratedRef = useRef(false);
    const router = useRouter();

    const { setConversationsLocal } = useConversationContext();
    const [conversationTitle, setConversationTitle] = useState(initialTitle);
    const isNewConversation = initialDbMessages.length === 0;

    const [currentToolData, setCurrentToolData] = useState<any>(null);
    const [isOpenModalDashboard, setIsOpenModalDashboard] = useState(false);
    const [input, setInput] = useState("");
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const triggerTitleGeneration = useCallback((text: string) => {
        if (!isNewConversation || titleGeneratedRef.current) return;
        titleGeneratedRef.current = true;
        generateConversationTitle(conversationId, text).then(({ title }) => {
            setConversationTitle(title);
            setConversationsLocal((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, title } : c))
            );
        });
    }, [conversationId, isNewConversation, setConversationsLocal]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isAtBottomRef = useRef(true);
    const prevMessageCountRef = useRef(initialDbMessages.length);

    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({ api: `/api/chat/${conversationId}` }),
        messages: dbMessagesToAIMessages(initialDbMessages),
    });

    const isLoading = status === "streaming" || status === "submitted";

    // Detectar si estamos en fase de tool call (streaming pero sin texto aún)
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    const lastMsgText = lastAssistantMsg?.parts?.find((p: any) => p.type === "text" && p.text?.length > 0);
    const isCallingTool = status === "streaming" && !lastMsgText;
    const isSubmitted = status === "submitted";
    const showWaitingIndicator = isSubmitted || isCallingTool;

    // Status label del header
    const statusLabel = isSubmitted
        ? "Pensando..."
        : isCallingTool
        ? "Consultando datos..."
        : status === "streaming"
        ? "Escribiendo..."
        : "En línea";

    // La última mensaje en streaming (para cursor)
    const streamingMessageId = status === "streaming" ? lastAssistantMsg?.id : undefined;

    // Enviar mensaje inicial desde URL param
    useEffect(() => {
        if (initialMessage && !sentInitialRef.current) {
            sentInitialRef.current = true;
            sendMessage({ text: initialMessage });
            triggerTitleGeneration(initialMessage);
            router.replace(`/dashboard/conversations/${conversationId}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }, [input]);

    // Auto-scroll: sigue el streaming si el usuario está al fondo
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const newMessageArrived = messages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (newMessageArrived) {
            // Nuevo mensaje: siempre scrollear al fondo
            isAtBottomRef.current = true;
            setShowScrollBtn(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
        } else if (isAtBottomRef.current) {
            // Durante streaming: scroll instantáneo si ya estaba al fondo
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    // Detectar si el usuario scrolleó hacia arriba
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        isAtBottomRef.current = nearBottom;
        setShowScrollBtn(!nearBottom && messages.length > 0);
    }, [messages.length]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        isAtBottomRef.current = true;
        setShowScrollBtn(false);
    }, []);

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
                <ul className="mb-2 space-y-1 last:mb-0">{children}</ul>
            ),
            ol: ({ children }: any) => (
                <ol className="mb-2 space-y-1 last:mb-0 list-none counter-reset-[item]">{children}</ol>
            ),
            li: ({ children, ordered, index }: any) => (
                ordered ? (
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="shrink-0 mt-0.5 min-w-5 text-right font-semibold text-slate-500 text-xs leading-5">
                            {(index ?? 0) + 1}.
                        </span>
                        <span className="leading-relaxed">{children}</span>
                    </li>
                ) : (
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-blue-400/60 mt-[0.4rem] shrink-0 leading-none text-[8px]">●</span>
                        <span className="leading-relaxed">{children}</span>
                    </li>
                )
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
        if (!input.trim() || isLoading) return;
        const text = input.trim();
        triggerTitleGeneration(text);
        sendMessage({ text });
        setInput("");
        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    return (
        <>
            <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-slate-100 tracking-tight truncate">{conversationTitle}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                            <p className={`text-xs font-medium transition-colors duration-300 ${isLoading ? "text-amber-400/80" : "text-slate-500"}`}>
                                {statusLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/40 relative"
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
                            isStreaming={message.id === streamingMessageId}
                        />
                    ))}

                    {/* Indicador de espera: submitted O streaming sin texto (tool call) */}
                    {showWaitingIndicator && (
                        <div className="flex gap-3 items-end animate-in fade-in duration-200">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-slate-800 border border-slate-700/50 rounded-xl rounded-bl-sm px-4 py-3">
                                {isCallingTool ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                        <span className="text-xs text-slate-400">Consultando datos...</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-1.5 items-center h-4">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                )}
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

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                    <div className="absolute bottom-20 right-6 z-10">
                        <button
                            onClick={scrollToBottom}
                            className="h-9 w-9 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                        >
                            <ChevronDown className="h-4 w-4 text-slate-300" />
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex gap-2 items-end bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-2 focus-within:border-blue-500/50 transition-colors duration-200">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            rows={1}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none resize-none leading-relaxed py-1 max-h-40 custom-scrollbar"
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
                            className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-0.5"
                        >
                            {isLoading ? (
                                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5 text-center">
                        Enter para enviar · Shift+Enter para nueva línea
                    </p>
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
