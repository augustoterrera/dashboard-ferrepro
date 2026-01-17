"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot } from "lucide-react";
import { MessageBubble } from "@/components/chat/bubbleMessage";
import type { ChatMsg } from "@/types/chat";
import { isNearBottom } from "@/lib/utils copy";
import { chatMessage } from "./actions";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardModal } from "@/components/chat/dashboardModal";

export default function ChatPage({ messages, conversationId }: { messages: ChatMsg[], conversationId: string }) {
    const searchParams = useSearchParams();
    const initialMessage = searchParams.get("initialMessage");

    const [input, setInput] = useState("");
    const [dbMessages, setDbMessages] = useState<ChatMsg[]>(messages);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showLoadingMessage, setShowLoadingMessage] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const hasProcessedInitialRef = useRef(false);

    const [currentToolData, setCurrentToolData] = useState(null)
    const [isOpenModalDashboard, setIsOpenModalDashboard] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const loadingMessages = [
        "Generando respuesta...",
        "Analizando datos...",
        "Generando gráficos...",
        "Procesando información...",
    ];

    const markdownComponents = useMemo(
        () => ({
            h1: ({ children }: any) => (
                <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
            ),
            h2: ({ children }: any) => (
                <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h2>
            ),
            h3: ({ children }: any) => (
                <h3 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
            ),
            p: ({ children }: any) => <p className="mb-2 leading-relaxed">{children}</p>,
            ul: ({ children }: any) => (
                <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }: any) => (
                <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }: any) => <li className="ml-2">{children}</li>,
            strong: ({ children }: any) => (
                <strong className="font-semibold text-foreground">{children}</strong>
            ),
            code: ({ children }: any) => (
                <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                </code>
            ),
            blockquote: ({ children }: any) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                    {children}
                </blockquote>
            ),
        }),
        []
    );

    useEffect(() => {
        if (initialMessage && !hasProcessedInitialRef.current && !isGenerating && dbMessages.length === 0) {
            hasProcessedInitialRef.current = true;
            processMessage(initialMessage);
        }
    }, [initialMessage]);

    useEffect(() => {
        let showTimer: NodeJS.Timeout;
        let rotateTimer: NodeJS.Timeout;

        if (isGenerating) {
            showTimer = setTimeout(() => {
                setShowLoadingMessage(true);
            }, 5000);

            rotateTimer = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
            }, 3000);
        } else {
            setShowLoadingMessage(false);
            setLoadingMessageIndex(0);
        }

        return () => {
            clearTimeout(showTimer);
            clearInterval(rotateTimer);
        };
    }, [isGenerating]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    }, [dbMessages.length, isGenerating]);

    const processMessage = async (messageText: string) => {
        if (!messageText.trim() || isGenerating) return;

        setIsGenerating(true);

        const optimisticUser: ChatMsg = {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text: messageText }],
        };
        setDbMessages((prev) => [...prev, optimisticUser]);

        try {
            const response = await chatMessage(conversationId, messageText);

            if (!response.success) return toast.error(response.error);

            setDbMessages((prev) => {
                const assistantMsg: ChatMsg = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    parts: [
                        { type: "text", text: response.message ?? "" },
                        ...(response.toolData
                            ? [
                                {
                                    type: "tool-result" as const,
                                    state: "output-available" as const,
                                    output: response.toolData,
                                },
                            ]
                            : []),
                    ],
                };

                return [...prev, assistantMsg];
            });
        } catch (error: any) {
            toast.error("Error en el servidor");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userInput = input;
        setInput("");
        await processMessage(userInput);
    };

    const handleViewDashboard = (toolData: any) => {
        setCurrentToolData(toolData);
        setIsOpenModalDashboard(true);
    };

    return (
        <>
            <Card className="h-full flex flex-col bg-slate-800 rounded-lg border-amber-50 text-amber-50 ">
                <CardHeader className="border-b">
                    <CardTitle className="text-2xl font-bold">Waichatt IA</CardTitle>
                    <p className="text-sm text-muted-foreground">Powered by Waichatt</p>
                </CardHeader>
                <CardContent
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 p-4"
                >
                    {dbMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Bienvenido Waichatt AI
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Puedes preguntarme sobre tu rendimiento financiero y operativo.
                            </p>
                        </div>
                    )}

                    {dbMessages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            markdownComponents={markdownComponents}
                            onViewDashboard={handleViewDashboard}
                        />
                    ))}

                    {isGenerating && showLoadingMessage && (
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="bg-muted rounded-lg px-4 py-2">
                                <p className="text-sm text-muted-foreground animate-pulse">
                                    {loadingMessages[loadingMessageIndex]}
                                </p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </CardContent>
                <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 border rounded px-3 py-2"
                        placeholder="Escribí tu mensaje..."
                        disabled={isGenerating}
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isGenerating}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </Card>
            <DashboardModal
                open={isOpenModalDashboard}
                onClose={() => { setIsOpenModalDashboard(false); setCurrentToolData(null) }}
                toolData={currentToolData}
            />
        </>
    );
}