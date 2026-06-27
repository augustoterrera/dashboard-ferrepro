'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

// Busca por nombre / teléfono / conversation id. Empuja el término a la URL (?q=) con debounce;
// el server component re-consulta. Resetea a la primera página en cada búsqueda nueva.
export function CrmSearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get('q') ?? '');
  const [isPending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      const v = value.trim();
      if (v) next.set('q', v);
      else next.delete('q');
      next.delete('page'); // búsqueda nueva → primera página
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Buscar por nombre, teléfono o ID...'}
        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <Loader2 size={15} className="animate-spin text-blue-500" />
        ) : value ? (
          <button
            onClick={() => setValue('')}
            aria-label="Limpiar búsqueda"
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
