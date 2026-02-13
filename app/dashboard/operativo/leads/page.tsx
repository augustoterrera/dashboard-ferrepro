// app/dashboard/operativo/leads/page.tsx
import { createClient } from '@/lib/supabase/server';
import { PaginatedCrmTable } from '@/components/operativo/PaginatedCrmTable';
import { Phone } from 'lucide-react';

interface ConversationItem {
  json: Conversation;
}

interface Conversation {
  conversation_id: number;
  conversation_display_id: number;
  conversation_labels: string;
  contact_name: string;
  phone_number: string;
}

function parseLabels(input?: string | null): string {
  const labels = String(input ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (labels.length ? labels : ['sin_etiqueta']).join(' · ');
}

async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`https://ggwebhookgg.waichatt.com/webhook/chatwoot-db`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Error al obtener datos');
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return (data as ConversationItem[])
      .map((item) => item?.json)
      .filter(Boolean);
  }

  return [];
}

export default async function LeadsPage() {
  const supabase = await createClient();

  // 1) Traigo conversaciones desde webhook
  const conversations = await getConversations();

  // 2) Me quedo con teléfonos válidos
  const phones = conversations
    .map((c) => c.phone_number)
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim());

  // Si no hay teléfonos, devolvemos tabla vacía
  if (phones.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white">Leads WhatsApp</h1>
          <p className="text-sm text-slate-400">Personas que se contactaron y todavía no compraron.</p>
        </header>

        <PaginatedCrmTable rows={[]} />
      </div>
    );
  }

  // 3) Busco estados guardados (venta/llamada) para esos teléfonos
  const { data: estados, error } = await supabase
    .from('crm_contacts')
    .select('phone_number, llamada_por_tel, venta, contact_name, conversation_id, conversation_display_id')
    .in('phone_number', phones);

  if (error) throw new Error(error.message);

  const map = new Map(estados?.map((e) => [e.phone_number, e]) ?? []);

  // 4) Leads = conversaciones - los que ya tienen venta=true
  const rows = conversations
    .filter((c) => c.phone_number && c.phone_number.trim().length > 0)
    .filter((c) => !map.get(c.phone_number.trim())?.venta)
    .map((c) => {
      const phone = c.phone_number.trim();
      const st = map.get(phone);

      return {
        conversation_id: c.conversation_id,
        conversation_display_id: c.conversation_display_id ?? null,
        contact_name: st?.contact_name ?? c.contact_name ?? null,
        phone_number: phone,
        conversation_labels: parseLabels(c.conversation_labels),
        llamada_por_tel: st?.llamada_por_tel ?? false,
        venta: st?.venta ?? false,
      };
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
            <Phone className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              Leads <span className="text-blue-500 not-italic">WhatsApp</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Prospectos activos que aún no han concretado una compra.
            </p>
          </div>
        </div>
      </header>

      <PaginatedCrmTable rows={rows} />
    </div>
  );
}