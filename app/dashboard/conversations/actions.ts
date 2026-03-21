"use server"

import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/types/conversation";
import { randomUUID } from "crypto";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

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

export async function generateConversationTitle(
    conversationId: string,
    firstMessage: string
): Promise<{ success: boolean; title: string }> {
    try {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const { text } = await generateText({
            model: openai.chat("gpt-4o-mini"),
            system: "Generá un título ultra-corto (máximo 4 palabras) en español para esta consulta de análisis de negocio de una ferretería. Solo el título, sin comillas ni puntuación al final.",
            prompt: firstMessage,
        });
        const title = text.trim().replace(/^["']|["']$/g, "").slice(0, 60) || "Nueva conversación";
        await editConversation(conversationId, title);
        return { success: true, title };
    } catch (e) {
        console.error("[generateConversationTitle]", e);
        return { success: false, title: "Nueva conversación" };
    }
}
