import { Suspense } from "react";
import ConversationShell from "@/app/dashboard/conversations/ConversationsShell";

function ShellFallback() {
  return (
    <>
      <div className="w-64 shrink-0 h-full rounded-lg border p-4" />
      <div className="flex-1 h-full rounded-lg border p-4" />
    </>
  );
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ConversationShell>{children}</ConversationShell>
    </Suspense>
  );
}
