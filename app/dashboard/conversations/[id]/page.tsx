import ChatPage from "./conversation"
import { getMessages } from "./actions"
import { redirect } from "next/navigation"

export default async function pageConversation({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ initialMessage?: string }>,
}) {
    const { id } = await params
    const { initialMessage } = await searchParams

    if (!id) return redirect('/dashboard/conversations');

    const { messages } = await getMessages(id);

    return (
        <ChatPage
            messages={messages ?? []}
            conversationId={id}
            initialMessage={initialMessage ?? null}
        />
    )
}
