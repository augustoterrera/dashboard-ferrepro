"use server";

import { SidebarConversations } from "@/components/conversations/sidebar";
import { getConversations } from "./actions";
import { ConversationProvider } from "@/context/ConversationContext";

export default async function ConversationShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getConversations();

  return (
    <ConversationProvider initialConversations={data.conversations}>
      <div className="flex h-full w-full gap-4">
        <div className="w-64 shrink-0 h-full">
          <SidebarConversations />
        </div>

        <div className="flex-1 min-w-0 h-full">
          {children}
        </div>
      </div>
    </ConversationProvider>
  );
}
