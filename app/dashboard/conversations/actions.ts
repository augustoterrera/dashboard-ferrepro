"use server"

import { createClient } from "@/lib/supabase";
import { Conversation } from "@/types/conversation";


export async function getConversations() {
    const supabase = createClient();

    const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false })

    return { success: error ? false : true, conversations: conversations ?? [] }
}

export async function deleteConversation(id: string) {
    const supabase = createClient();

    const { error } = await supabase.from("conversations").delete().eq("id", id)

    return { success: error ? false : true }
}

export async function createConversation() {
    const supabase = createClient();

    const { data: conversation, error } = await supabase
        .from("conversations")
        .insert({
            title: "Nueva conversación",
        })
        .select('*')
        .single()


    return { success: error ? false : true, conversation: conversation }
}

export async function editConversation(id: string, title: any) {
    const supabase = createClient();

    if (!title?.trim()) return { success: false, error: "Falta titulo" }

    const { error } = await supabase
        .from("conversations")
        .update({
            title
        })
        .eq("id", id)
    return { success: error ? false : true }
}