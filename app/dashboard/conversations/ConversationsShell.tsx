import { SidebarConversations } from "@/components/conversations/sidebar";
import { getConversations } from "./actions";
import { ConversationProvider } from "@/context/ConversationContext";
import { ConversationsMobileLayout } from "./ConversationsMobileLayout";

export default async function ConversationShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getConversations();

  return (
    <ConversationProvider initialConversations={data.conversations}>
      <ConversationsMobileLayout sidebar={<SidebarConversations />}>
        {children}
      </ConversationsMobileLayout>
    </ConversationProvider>
  );
}
