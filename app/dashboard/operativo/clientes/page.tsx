import { fetchCrmContacts } from '@/lib/data/crm';
import { CrmSearchBar } from '@/components/operativo/CrmSearchBar';
import { PaginatedCrmTable } from '@/components/operativo/PaginatedCrmTable';
import { ExportClientsButton } from '@/components/operativo/ExportClientsButton';
import { ShieldCheck } from 'lucide-react';

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const sp = await searchParams;
  const { rows: data, total, page, pageSize } = await fetchCrmContacts({
    scope: 'clientes',
    q: sp.q,
    page: sp.page,
    pageSize: sp.pageSize,
  });

  const rows = data.map((c, idx) => ({
    conversation_id: c.conversation_id ?? idx + 1, // Usar conversation_id de DB o fallback
    conversation_display_id: c.conversation_display_id ?? c.conversation_id ?? null,
    contact_name: c.contact_name ?? null,
    phone_number: c.phone_number ?? null,
    conversation_labels: 'cliente',
    llamada_por_tel: c.llamada_por_tel ?? false,
    venta: c.venta ?? true,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-3 pt-10 sm:pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <ShieldCheck className="text-emerald-500" size={22} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase italic leading-tight">
                Base de <span className="text-emerald-500 not-italic">Clientes</span>
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/30">
                  Verificados
                </span>
              </div>
            </div>
          </div>
          {/* Botón de exportar — top-right en todas las resoluciones */}
          <div className="shrink-0">
            <ExportClientsButton />
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Contactos con historial de conversión confirmado y cierre de venta.
        </p>
      </header>

      <CrmSearchBar placeholder="Buscar cliente por nombre, teléfono o ID..." />
      <PaginatedCrmTable rows={rows} total={total} page={page} pageSize={pageSize} />
    </div>
  );
}