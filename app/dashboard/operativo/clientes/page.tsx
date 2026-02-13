import { createClient } from '@/lib/supabase/server';
import { PaginatedCrmTable } from '@/components/operativo/PaginatedCrmTable';
import { ExportClientsButton } from '@/components/operativo/ExportClientsButton';
import { ShieldCheck } from 'lucide-react';

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crm_contacts')
    .select('phone_number, contact_name, llamada_por_tel, venta, conversation_id, conversation_display_id, updated_at')
    .eq('venta', true)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((c, idx) => ({
    conversation_id: c.conversation_id ?? idx + 1, // Usar conversation_id de DB o fallback
    conversation_display_id: c.conversation_display_id ?? null,
    contact_name: c.contact_name ?? null,
    phone_number: c.phone_number ?? null,
    conversation_labels: 'cliente',
    llamada_por_tel: c.llamada_por_tel ?? false,
    venta: c.venta ?? true,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <ShieldCheck className="text-emerald-500" size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                  Base de <span className="text-emerald-500 not-italic">Clientes</span>
                </h1>
                <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/30">
                  Verificados
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Contactos con historial de conversión confirmado y cierre de venta.
              </p>
            </div>
          </div>

          {/* Botón de exportar */}
          <ExportClientsButton />
        </div>
      </header>

      <PaginatedCrmTable rows={rows} />
    </div>
  );
}