'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { CrmTable } from './CrmTable';
import { CRM_PAGE_SIZES } from '@/lib/data/crm-constants';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = {
  conversation_id: number;
  conversation_display_id: number | null;
  contact_name: string | null;
  phone_number: string | null;
  conversation_labels: string | null;
  llamada_por_tel: boolean;
  venta: boolean;
};

// Paginación server-side: las filas ya vienen paginadas desde la DB. Los controles solo navegan
// la URL (?page=, ?pageSize=); el server component re-consulta la página pedida.
export function PaginatedCrmTable({
  rows,
  total,
  page,
  pageSize,
}: {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const startIndex = total === 0 ? 0 : (current - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const nav = (params: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPage = (p: number) => nav({ page: String(Math.min(Math.max(1, p), totalPages)) });
  const changePageSize = (s: number) => nav({ pageSize: String(s), page: '1' });

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
    if (current < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className={cn('space-y-4 transition-opacity', isPending && 'opacity-60')}>
      <CrmTable rows={rows} />

      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-4 text-sm">
            <div className="text-slate-400 flex items-center gap-2">
              {isPending && <Loader2 size={13} className="animate-spin text-blue-500" />}
              Mostrando <span className="font-bold text-white">{startIndex + 1}</span>
              {' - '}
              <span className="font-bold text-white">{endIndex}</span>
              {' de '}
              <span className="font-bold text-white">{total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {CRM_PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={current === 1}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
                aria-label="Primera página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(current - 1)}
                disabled={current === 1}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => goToPage(p)}
                      className={cn(
                        'min-w-[40px] h-10 px-3 rounded-lg font-bold text-sm transition-all',
                        current === p
                          ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700 hover:border-slate-600'
                      )}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-2 text-slate-600 font-bold select-none">
                      {p}
                    </span>
                  )
                )}
              </div>

              <button
                onClick={() => goToPage(current + 1)}
                disabled={current === totalPages}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={current === totalPages}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
                aria-label="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
