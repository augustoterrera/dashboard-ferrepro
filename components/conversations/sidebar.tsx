"use client";

import { Plus, Trash2, Pencil, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useMemo } from "react";
import { deleteConversation as deleteConversationAction, editConversation } from "@/app/dashboard/conversations/actions";
import { EditConversationModal } from "./editConversationModal";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useConversationContext } from "@/context/ConversationContext";
import type { Conversation } from "@/types/conversation";

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const groups: { label: string; items: Conversation[] }[] = [];
  const today = conversations.filter((c) => new Date(c.updated_at) >= todayStart);
  const week = conversations.filter((c) => {
    const d = new Date(c.updated_at);
    return d >= weekStart && d < todayStart;
  });
  const older = conversations.filter((c) => new Date(c.updated_at) < weekStart);

  if (today.length) groups.push({ label: "Hoy", items: today });
  if (week.length) groups.push({ label: "Últimos 7 días", items: week });
  if (older.length) groups.push({ label: "Anteriores", items: older });
  return groups;
}

export function SidebarConversations() {
  const pathname = usePathname();
  const split = pathname.split("/");
  const currentConversationId = split[split.length - 1];

  const router = useRouter();
  const { conversationsLocal, setConversationsLocal } = useConversationContext();
  const groups = useMemo(() => groupConversations(conversationsLocal), [conversationsLocal]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingConversationTitle, setEditingConversationTitle] = useState("");

  const createNewConversation = async () => {
    router.push(`/dashboard/conversations`);
  };

  const editTitleConversation = (id: string, title: string) => {
    setEditingConversationId(id);
    setEditingConversationTitle(title);
    setIsEditModalOpen(true);
  };

  const deleteConversation = async (id: string) => {
    const data = await deleteConversationAction(id);
    if (!data.success) return toast.error("Error al eliminar conversación");

    setConversationsLocal((prev) => prev.filter((c) => c.id !== id));

    if (currentConversationId === id) router.push(`/dashboard/conversations`);
  };

  const saveConversationTitle = async (id: string, title: string) => {
    const data = await editConversation(id, title);
    if (!data.success) return toast.error("Error al actualizar el título");

    setConversationsLocal((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800 shrink-0">
        <h2 className="text-sm font-bold text-slate-300 tracking-tight uppercase mb-3">
          Conversaciones
        </h2>
        <button
          onClick={createNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Nueva Conversación
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 custom-scrollbar">
        {conversationsLocal.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-2">
            <MessageSquare className="h-8 w-8 text-slate-700" />
            <p className="text-xs text-slate-600 font-medium">Sin conversaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => {
                    const isActive = currentConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 relative cursor-pointer ${
                          isActive
                            ? "bg-blue-600/10 border-l-2 border-blue-500 rounded-l-none"
                            : "hover:bg-slate-800/60"
                        }`}
                        onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate transition-colors duration-150 ${
                            isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                          }`}>
                            {conv.title}
                          </p>
                          <p className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">
                            {getRelativeTime(conv.updated_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editTitleConversation(conv.id, conv.title);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditConversationModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        conversationId={editingConversationId}
        initialTitle={editingConversationTitle}
        onSave={saveConversationTitle}
      />
    </div>
  );
}
