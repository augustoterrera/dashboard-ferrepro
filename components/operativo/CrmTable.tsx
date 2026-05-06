'use client';

import { useEffect, useTransition, useState } from 'react';
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

type StatusToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  tone: 'blue' | 'emerald';
  onChange: (checked: boolean) => void;
};

function StatusToggle({ checked, disabled, label, tone, onChange }: StatusToggleProps) {
  return (
    <label
      className={cn(
        "group/toggle relative inline-flex h-6 w-11 shrink-0 items-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full border transition-all duration-200",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-950",
          disabled && "opacity-50",
          checked
            ? tone === 'blue'
              ? "border-blue-500/70 bg-blue-600"
              : "border-emerald-500/70 bg-emerald-600"
            : "border-slate-700 bg-slate-800 group-hover/toggle:bg-slate-700"
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative ml-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-5",
          disabled && "opacity-80"
        )}
      />
    </label>
  );
}

export function CrmTable({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Estado optimista para los toggles
  const [optimisticStates, setOptimisticStates] = useState<Map<string, Partial<Pick<Row, 'llamada_por_tel' | 'venta'>>>>(new Map());

  useEffect(() => {
    setOptimisticStates(prev => {
      if (prev.size === 0) return prev;

      const next = new Map(prev);

      for (const row of rows) {
        if (!row.phone_number) continue;

        const optimisticState = next.get(row.phone_number);
        if (!optimisticState) continue;

        const serverMatchesOptimistic = (
          (optimisticState.llamada_por_tel === undefined || optimisticState.llamada_por_tel === row.llamada_por_tel) &&
          (optimisticState.venta === undefined || optimisticState.venta === row.venta)
        );

        if (serverMatchesOptimistic) {
          next.delete(row.phone_number);
        }
      }

      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  const onToggle = (row: Row, patch: Partial<Pick<Row, 'llamada_por_tel' | 'venta'>>) => {
    if (!row.phone_number) return;

    // Actualización optimista inmediata
    setOptimisticStates(prev => {
      const next = new Map(prev);
      next.set(row.phone_number!, { ...next.get(row.phone_number!), ...patch });
      return next;
    });
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

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="px-6 py-20 text-center flex flex-col items-center justify-center gap-2">
          <div className="p-4 bg-slate-800/50 rounded-full">
            <ShoppingCart size={32} className="text-slate-600" />
          </div>
          <p className="text-slate-500 font-medium">No se encontraron registros en esta base.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── CARD VIEW — mobile only ── */}
      <div className="sm:hidden divide-y divide-slate-800/60">
        {rows.map((r) => {
          const isUpdating = loadingId === r.phone_number && pending;
          const optimisticState = optimisticStates.get(r.phone_number || '');
          const displayRow = optimisticState ? { ...r, ...optimisticState } : r;

          return (
            <div
              key={r.conversation_id}
              className={cn("px-4 py-4 transition-all duration-300", isUpdating && "opacity-60")}
            >
              {/* Top row: dot + name + copy */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isUpdating ? (
                    <Loader2 size={14} className="shrink-0 animate-spin text-blue-500" />
                  ) : (
                    <div className={cn(
                      "w-2 h-2 shrink-0 rounded-full transition-all duration-500",
                      displayRow.venta
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"
                        : "bg-slate-700"
                    )} />
                  )}
                  <Link
                    href={`https://app2.waichatt.com/app/accounts/6/conversations/${r.conversation_display_id}`}
                    target="_blank"
                    className="font-bold text-white text-sm leading-snug truncate flex items-center gap-1"
                  >
                    {r.contact_name ?? 'Sin nombre'}
                    <ExternalLink size={10} className="shrink-0 text-slate-500" />
                  </Link>
                </div>
                <button
                  onClick={() => copyPhone(r.conversation_id, r.phone_number)}
                  disabled={!r.phone_number || isUpdating}
                  className="shrink-0 p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
                >
                  {copiedId === r.conversation_id ? (
                    <Check size={13} className="text-emerald-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>

              {/* Phone */}
              <div className="mt-2 font-mono text-xs bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 text-slate-300 inline-block">
                {r.phone_number ?? '-'}
              </div>

              {/* Labels */}
              {r.conversation_labels && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.conversation_labels.split(' · ').map((label, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border",
                        getLabelStyles(label)
                      )}
                    >
                      {label.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Toggles */}
              <div className="mt-3 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Llamada</span>
                  <StatusToggle
                    checked={!!displayRow.llamada_por_tel}
                    disabled={isUpdating}
                    label="Marcar llamada"
                    tone="blue"
                    onChange={(checked) => onToggle(r, { llamada_por_tel: checked })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Venta</span>
                  <StatusToggle
                    checked={!!displayRow.venta}
                    disabled={isUpdating}
                    label="Marcar venta"
                    tone="emerald"
                    onChange={(checked) => onToggle(r, { venta: checked })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TABLE VIEW — sm+ only ── */}
      <div className="hidden sm:block overflow-x-auto">
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
              const optimisticState = optimisticStates.get(r.phone_number || '');
              const displayRow = optimisticState ? { ...r, ...optimisticState } : r;

              return (
                <tr
                  key={r.conversation_id}
                  className={cn(
                    "hover:bg-blue-500/2 transition-all duration-300 group",
                    isUpdating && "opacity-60"
                  )}
                >
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

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 text-slate-300">
                      {r.phone_number ?? '-'}
                    </span>
                  </td>

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

                  <td className="px-6 py-4 text-center">
                    <StatusToggle
                      checked={!!displayRow.llamada_por_tel}
                      disabled={isUpdating}
                      label="Marcar llamada"
                      tone="blue"
                      onChange={(checked) => onToggle(r, { llamada_por_tel: checked })}
                    />
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StatusToggle
                      checked={!!displayRow.venta}
                      disabled={isUpdating}
                      label="Marcar venta"
                      tone="emerald"
                      onChange={(checked) => onToggle(r, { venta: checked })}
                    />
                  </td>

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
