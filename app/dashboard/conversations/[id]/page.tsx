import ChatPage from "./conversation"
import { getMessages } from "./actions"
import { redirect } from "next/navigation"

export default async function pageConversation({ params, }: { params: { id: string } }) {
    const { id } = await params
    if (!id) return redirect('/conversations');
    const { success, messages }: { success: boolean, messages: any } = await getMessages(id);

    if (!success) return redirect('/conversations');

    return (
        <ChatPage messages={messages ?? []} conversationId={id} />
    )
}
