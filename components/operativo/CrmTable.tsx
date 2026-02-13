'use client';

import { useTransition, useState } from 'react';
import { setContactStatus } from '@/app/dashboard/operativo/actions';
import { Copy, Check, ExternalLink, Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Row = {
  conversation_id: number;
  conversation_display_id: number | null;
  contact_name: string | null;
  phone_number: string | null;
  conversation_labels: string | null;
  llamada_por_tel: boolean;
  venta: boolean;
};

export function CrmTable({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Estado optimista para los toggles
  const [optimisticStates, setOptimisticStates] = useState<Map<string, Partial<Pick<Row, 'llamada_por_tel' | 'venta'>>>>(new Map());

  const onToggle = (row: Row, patch: Partial<Pick<Row, 'llamada_por_tel' | 'venta'>>) => {
    if (!row.phone_number) return;

    // Actualización optimista inmediata
    setOptimisticStates(prev => new Map(prev).set(row.phone_number!, patch));
    setLoadingId(row.phone_number);

    startTransition(async () => {
      try {
        await setContactStatus({
          phone_number: row.phone_number!,
          contact_name: row.contact_name ?? null,
          llamada_por_tel: patch.llamada_por_tel ?? null,
          venta: patch.venta ?? null,
          conversation_id: row.conversation_id ?? null,
          conversation_display_id: row.conversation_display_id ?? null,
        });
      } catch (error) {
        // Si falla, revertimos el estado optimista
        setOptimisticStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(row.phone_number!);
          return newMap;
        });
        console.error('Error updating contact:', error);
      } finally {
        setLoadingId(null);
        // Limpiamos el estado optimista después de que el servidor responda
        setTimeout(() => {
          setOptimisticStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(row.phone_number!);
            return newMap;
          });
        }, 300);
      }
    });
  };

  const copyPhone = async (id: number, phone?: string | null) => {
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Mapeo de estilos para etiquetas según tu requerimiento
  const getLabelStyles = (label: string) => {
    const l = label.toLowerCase().trim();
    if (l === 'compra') return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (l === 'asesoramiento') return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (l === 'sin_stock') return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-slate-800/50 border-slate-700 text-slate-500";
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">Contacto</th>
              <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">Teléfono</th>
              <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[10px]">Etiquetas</th>
              <th className="px-6 py-4 text-center font-bold uppercase tracking-widest text-[10px]">Llamada</th>
              <th className="px-6 py-4 text-center font-bold uppercase tracking-widest text-[10px]">Venta</th>
              <th className="px-4 py-4 w-16"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50 text-slate-200">
            {rows.map((r) => {
              const isUpdating = loadingId === r.phone_number && pending;

              // Aplicamos el estado optimista si existe
              const optimisticState = optimisticStates.get(r.phone_number || '');
              const displayRow = optimisticState ? { ...r, ...optimisticState } : r;

              return (
                <tr
                  key={r.conversation_id}
                  className={cn(
                    "hover:bg-blue-500/[0.02] transition-all duration-300 group",
                    isUpdating && "opacity-60"
                  )}
                >
                  {/* Nombre + Link + Loading Indicator */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        {isUpdating ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : (
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all duration-500",
                            displayRow.venta
                              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"
                              : "bg-slate-700"
                          )} />
                        )}
                      </div>

                      <Link
                        href={`https://app2.waichatt.com/app/accounts/6/conversations/${r.conversation_display_id}`}
                        target="_blank"
                        className="flex flex-col group/link"
                      >
                        <span className="font-bold text-white tracking-tight group-hover/link:text-blue-400 transition-colors flex items-center gap-1.5">
                          {r.contact_name ?? 'Sin nombre'}
                          <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </span>
                      </Link>
                    </div>
                  </td>

                  {/* Teléfono */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 text-slate-300">
                      {r.phone_number ?? '-'}
                    </span>
                  </td>

                  {/* Etiquetas con Colores Dinámicos */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {r.conversation_labels?.split(' · ').map((label, i) => (
                        <span
                          key={i}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border transition-all",
                            getLabelStyles(label)
                          )}
                        >
                          {label.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Toggle Llamada (Blue) */}
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!displayRow.llamada_por_tel}
                        disabled={isUpdating}
                        onChange={(e) => onToggle(r, { llamada_por_tel: e.target.checked })}
                      />
                      <div className={cn(
                        "w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white transition-all duration-300",
                        isUpdating && "opacity-50"
                      )} />
                    </label>
                  </td>

                  {/* Toggle Venta (Emerald) con efecto especial */}
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!displayRow.venta}
                        disabled={isUpdating}
                        onChange={(e) => onToggle(r, { venta: e.target.checked })}
                      />
                      <div className={cn(
                        "w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white transition-all duration-300",
                        displayRow.venta && "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
                        isUpdating && "opacity-50"
                      )} />
                    </label>
                  </td>

                  {/* Acción Copiar */}
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => copyPhone(r.conversation_id, r.phone_number)}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all group/btn"
                      disabled={!r.phone_number || isUpdating}
                    >
                      {copiedId === r.conversation_id ? (
                        <Check size={14} className="text-emerald-500 animate-in zoom-in" />
                      ) : (
                        <Copy size={14} className="group-hover/btn:scale-110 transition-transform" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="px-6 py-20 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-4 bg-slate-800/50 rounded-full">
              <ShoppingCart size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron registros en esta base.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Waichatt BI
        </div>
      </div>
    </div>
  );
}