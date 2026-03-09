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
      {/* absolute inset-0 se posiciona relativo al div .relative en SidebarShell,
          escapando el max-w-7xl sin altura definida. p-8 replica el padding del contenedor. */}
      <div className="absolute inset-0 flex gap-4 p-8 z-20">
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
