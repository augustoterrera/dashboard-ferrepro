'use client';

import { useState } from 'react';
import { CrmTable } from './CrmTable';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Row = {
  conversation_id: number;
  conversation_display_id: number | null;
  contact_name: string | null;
  phone_number: string | null;
  conversation_labels: string | null;
  llamada_por_tel: boolean;
  venta: boolean;
};

interface PaginatedCrmTableProps {
  rows: Row[];
  itemsPerPage?: number;
}

export function PaginatedCrmTable({ rows, itemsPerPage = 20 }: PaginatedCrmTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = rows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset a primera página
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Genera números de página inteligentes
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <CrmTable rows={currentRows} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl backdrop-blur-sm">
          {/* Info de registros + Selector de tamaño */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-slate-400">
              Mostrando{' '}
              <span className="font-bold text-white">{startIndex + 1}</span>
              {' - '}
              <span className="font-bold text-white">{Math.min(endIndex, rows.length)}</span>
              {' de '}
              <span className="font-bold text-white">{rows.length}</span>
            </div>
            
            {/* Selector de items por página */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            {/* Primera página */}
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
              aria-label="Primera página"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Página anterior */}
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => (
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => goToPage(page)}
                    className={`
                      min-w-[40px] h-10 px-3 rounded-lg font-bold text-sm transition-all
                      ${currentPage === page
                        ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="px-2 text-slate-600 font-bold select-none">
                    {page}
                  </span>
                )
              ))}
            </div>

            {/* Página siguiente */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>

            {/* Última página */}
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
              aria-label="Última página"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}