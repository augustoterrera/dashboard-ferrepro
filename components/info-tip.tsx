import { HelpCircle } from "lucide-react";

export function InfoTip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block">
      <HelpCircle 
        size={12} 
        className="text-slate-600 cursor-help transition-colors group-hover:text-slate-400" 
      />
      <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900 p-2.5 text-[10px] font-medium leading-relaxed text-slate-200 shadow-2xl ring-1 ring-slate-700 opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
}