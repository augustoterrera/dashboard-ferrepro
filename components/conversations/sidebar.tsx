"use client";

import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { deleteConversation as deleteConversationAction, editConversation } from "@/app/dashboard/conversations/actions";
import { EditConversationModal } from "./editConversationModal";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useConversationContext } from "@/context/ConversationContext";

export function SidebarConversations() {
  const pathname = usePathname();
  const split = pathname.split("/");
  const currentConversationId = split[split.length - 1];

  const router = useRouter();
  const { conversationsLocal, setConversationsLocal } = useConversationContext();

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
    <Card className="h-full flex flex-col bg-slate-800 text-amber-50">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Conversaciones</CardTitle>

        <Button onClick={createNewConversation} size="sm" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Conversación
        </Button>
      </CardHeader>

      {/* SCROLL SOLO AQUÍ */}
      <CardContent className="flex-1 min-h-0 p-2 overflow-y-auto">
        {conversationsLocal.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin conversaciones</p>
        ) : (
          <div className="space-y-1">
            {conversationsLocal.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted ${
                  currentConversationId === conv.id ? "bg-muted" : ""
                }`}
              >
                <button
                  onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                  className="flex-1 text-left text-sm"
                >
                  {conv.title}
                </button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    editTitleConversation(conv.id, conv.title);
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <EditConversationModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        conversationId={editingConversationId}
        initialTitle={editingConversationTitle}
        onSave={saveConversationTitle}
      />
    </Card>
  );
}
