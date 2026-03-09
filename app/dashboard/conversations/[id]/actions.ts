"use server"

import { createClient } from "@/lib/supabase/server"
import type { DBMessage } from "@/types/chat"

export async function getMessages(id: string): Promise<{ success: boolean; messages: DBMessage[] }> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, tool_invocations")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })

    if (error) {
        console.error("[getMessages] error:", error.message)
        return { success: false, messages: [] }
    }

    const messages: DBMessage[] = (data ?? []).map((m) => ({
        id: m.id as string,
        role: m.role as "user" | "assistant",
        content: m.content as string,
        tool_invocations: (m.tool_invocations as any) ?? null,
    }))

    return { success: true, messages }
}
