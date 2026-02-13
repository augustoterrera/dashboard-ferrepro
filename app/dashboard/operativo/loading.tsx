import { Loader2 } from 'lucide-react';

export default function LeadsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Skeleton */}
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 animate-pulse">
                        <div className="w-6 h-6 bg-slate-700/50 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-9 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
                        <div className="h-4 w-96 bg-slate-800/30 rounded animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Table Skeleton */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        {/* Header */}
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                                <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">
                                    Contacto
                                </th>
                                <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">
                                    Teléfono
                                </th>
                                <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">
                                    Etiquetas
                                </th>
                                <th className="px-6 py-4 text-center font-bold uppercase tracking-widest text-[10px]">
                                    Llamada
                                </th>
                                <th className="px-6 py-4 text-center font-bold uppercase tracking-widest text-[10px]">
                                    Venta
                                </th>
                                <th className="px-4 py-4 w-16"></th>
                            </tr>
                        </thead>

                        {/* Skeleton Rows */}
                        <tbody className="divide-y divide-slate-800/50 text-slate-200">
                            {[...Array(4)].map((_, i) => (
                                <tr key={i} className="hover:bg-blue-500/[0.02] transition-colors group">
                                    {/* Contacto */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="h-4 w-32 bg-slate-800/70 rounded animate-pulse" />
                                                <div className="h-3 w-16 bg-slate-800/50 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Teléfono */}
                                    <td className="px-6 py-4">
                                        <div className="h-6 w-36 bg-slate-800/50 rounded border border-slate-700/50 animate-pulse" />
                                    </td>

                                    {/* Etiquetas */}
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            <div className="h-5 w-20 bg-slate-800/50 rounded border border-slate-700 animate-pulse" />
                                            <div className="h-5 w-24 bg-slate-800/50 rounded border border-slate-700 animate-pulse" />
                                        </div>
                                    </td>

                                    {/* Toggle Llamada */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex">
                                            <div className="w-9 h-5 bg-slate-800 rounded-full animate-pulse" />
                                        </div>
                                    </td>

                                    {/* Toggle Venta */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex">
                                            <div className="w-9 h-5 bg-slate-800 rounded-full animate-pulse" />
                                        </div>
                                    </td>

                                    {/* Botón Copiar */}
                                    <td className="px-4 py-4 text-right">
                                        <div className="inline-flex p-2 rounded-lg border border-slate-700 bg-slate-800">
                                            <div className="w-3.5 h-3.5 bg-slate-700 rounded animate-pulse" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}