"use client";

import { Button } from "@/components/ui/button";
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
    if (!data.success || !data.conversation) return toast.error("Error al crear conversación");

    setConversationsLocal((prev) => [data.conversation!, ...prev]);

    router.push(
      `/dashboard/conversations/${data.conversation.id}?initialMessage=${encodeURIComponent(input)}`
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 shrink-0">
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

      {/* Empty state */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-slate-950/40 custom-scrollbar">
        <div className="h-full flex flex-col items-center justify-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Bot className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-200 mb-1">Bienvenido a Ferrepro AI</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Podés preguntarme sobre tu rendimiento financiero y operativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-2xl">
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="flex items-start gap-3 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-blue-500/30 transition-all duration-200 text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-700 group-hover:bg-blue-600/20 flex items-center justify-center shrink-0 transition-colors duration-200">
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed transition-colors duration-200">
                    {s.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <div className="flex gap-2 items-center bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-2 focus-within:border-blue-500/50 transition-colors duration-200">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
            placeholder="Escribí tu mensaje..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
