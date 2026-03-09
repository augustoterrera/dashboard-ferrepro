export default function ConversationLoading() {
  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-slate-800 rounded" />
          <div className="h-2.5 w-16 bg-slate-800/60 rounded" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 bg-slate-950/40">
        <div className="flex gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-800 shrink-0" />
          <div className="h-16 w-56 bg-slate-800 rounded-xl rounded-bl-sm" />
        </div>
        <div className="flex gap-2.5 justify-end">
          <div className="h-10 w-44 bg-slate-800/70 rounded-xl rounded-br-sm" />
          <div className="h-8 w-8 rounded-lg bg-slate-800 shrink-0" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-800 shrink-0" />
          <div className="h-24 w-72 bg-slate-800 rounded-xl rounded-bl-sm" />
        </div>
        <div className="flex gap-2.5 justify-end">
          <div className="h-12 w-52 bg-slate-800/70 rounded-xl rounded-br-sm" />
          <div className="h-8 w-8 rounded-lg bg-slate-800 shrink-0" />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="h-10 w-full bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
