"use client";

import { usePathname } from "next/navigation";

export function ConversationsMobileLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // /dashboard/conversations/[id] → in a conversation
  const isInConversation =
    pathname.split("/").filter(Boolean).length >= 3 &&
    pathname.split("/").at(-1) !== "conversations";

  return (
    <div className="absolute top-14 sm:top-0 inset-x-0 bottom-0 flex gap-0 sm:gap-4 p-3 sm:p-8 z-20">
      {/* Sidebar: always full-width on mobile, 256px on desktop */}
      <div className="w-full sm:w-64 sm:shrink-0 h-full">
        {sidebar}
      </div>

      {/* Chat panel
          • Mobile: fixed popup overlaying the sidebar when a conversation is open
          • Desktop: normal flex-1 panel next to the sidebar             */}
      <div
        className={
          isInConversation
            ? "fixed top-17 inset-x-3 bottom-3 z-30 sm:static sm:top-auto sm:inset-x-auto sm:bottom-auto sm:z-auto sm:flex-1 sm:min-w-0 sm:h-full"
            : "hidden sm:block sm:flex-1 sm:min-w-0 sm:h-full"
        }
      >
        {children}
      </div>
    </div>
  );
}
