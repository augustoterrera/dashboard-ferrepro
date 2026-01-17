"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Bot, Send, TrendingUp, Calendar, BarChart3, DollarSign } from "lucide-react";
import { useState } from "react";
import { createConversation } from "./actions";
import { useConversationContext } from "@/context/ConversationContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PageConversations() {
  const { setConversationsLocal } = useConversationContext();
  const router = useRouter();
  const [input, setInput] = useState("");

  const suggestions = [
    { icon: Calendar, text: "Dame las ventas desde [fecha 1] hasta [fecha 2]" },
    { icon: TrendingUp, text: "¿Cuál fue mi mejor mes de ventas este año?" },
    { icon: BarChart3, text: "Muéstrame un análisis de mis productos más vendidos" },
    { icon: DollarSign, text: "¿Cuál es mi ganancia total en los últimos 30 días?" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const data = await createConversation();
    if (!data.success) return toast.error("Error al crear conversación");

    setConversationsLocal((prev) => [data.conversation, ...prev]);

    router.push(
      `/dashboard/conversations/${data.conversation.id}?initialMessage=${encodeURIComponent(input)}`
    );
  };

  return (
    <Card className="h-full w-full flex flex-col bg-slate-800 text-amber-50">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold">Waichatt IA</CardTitle>
        <p className="text-sm text-muted-foreground">Powered by Waichatt</p>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="h-full flex flex-col items-center justify-center">
          <Bot className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bienvenido Waichatt AI</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-8 text-center">
            Puedes preguntarme sobre tu rendimiento financiero y operativo.
          </p>

          {/* OJO: este max-w-2xl solo limita las SUGERENCIAS, no el card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{s.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2 bg-transparent"
          placeholder="Escribí tu mensaje..."
        />
        <Button type="submit" disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
