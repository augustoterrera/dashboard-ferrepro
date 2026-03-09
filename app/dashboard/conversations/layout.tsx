import { Suspense } from "react";
import ConversationShell from "@/app/dashboard/conversations/ConversationsShell";

function ShellFallback() {
  return (
    <div className="absolute inset-0 flex gap-4 p-8 z-20 animate-pulse">
      <div className="w-64 shrink-0 h-full bg-slate-900 rounded-xl border border-slate-800" />
      <div className="flex-1 h-full bg-slate-900 rounded-xl border border-slate-800" />
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
