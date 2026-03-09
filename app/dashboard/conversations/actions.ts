"use server"

import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/types/conversation";
import { randomUUID } from "crypto";

export async function getConversations(): Promise<{ success: boolean; conversations: Conversation[] }> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false })

    if (error) console.error("[getConversations] error:", error.message)
    return { success: !error, conversations: (data as Conversation[]) ?? [] }
}

export async function deleteConversation(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("conversations").delete().eq("id", id)
    if (error) console.error("[deleteConversation] error:", error.message)
    return { success: !error }
}

export async function createConversation(): Promise<{ success: boolean; conversation: Conversation | null }> {
    const supabase = await createClient();
    const id = randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
        .from("conversations")
        .insert({ id, title: "Nueva conversación" })

    if (error) {
        console.error("[createConversation] error:", error.message)
        return { success: false, conversation: null }
    }

    return {
        success: true,
        conversation: { id, title: "Nueva conversación", created_at: now, updated_at: now },
    }
}

export async function editConversation(id: string, title: any) {
    if (!title?.trim()) return { success: false, error: "Falta titulo" }
    const supabase = await createClient();
    const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id)
    if (error) console.error("[editConversation] error:", error.message)
    return { success: !error }
}
