import { Suspense } from "react";
import ConversationShell from "@/app/dashboard/conversations/ConversationsShell";

function ShellFallback() {
  return (
    <div className="absolute top-14 sm:top-0 inset-x-0 bottom-0 flex gap-0 sm:gap-4 p-0 sm:p-8 z-20 animate-pulse">
      <div className="w-full sm:w-64 sm:shrink-0 h-full bg-slate-900 sm:rounded-xl border-0 sm:border border-slate-800" />
      <div className="hidden sm:block flex-1 h-full bg-slate-900 rounded-xl border border-slate-800" />
    </div>
  );
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ConversationShell>{children}</ConversationShell>
    </Suspense>
  );
}
