// app/dashboard/operativo/leads/page.tsx
import { createClient } from "@/lib/supabase/server";
import { PaginatedCrmTable } from "@/components/operativo/PaginatedCrmTable";
import { Phone } from "lucide-react";

type CrmContact = {
  phone_number: string | null;
  contact_name: string | null;
  llamada_por_tel: boolean | null;
  venta: boolean | null;
  conversation_id: number | null;
  conversation_display_id: number | null;
  conversation_labels: string | null;
};

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crm_contacts")
    .select("phone_number, contact_name, llamada_por_tel, venta, conversation_id, conversation_display_id, conversation_labels, updated_at")
    .or("venta.is.false,venta.is.null")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as CrmContact[])
    .filter((c) => c.phone_number && c.phone_number.trim().length > 0)
    .map((c, idx) => ({
      conversation_id: c.conversation_id ?? idx + 1,
      conversation_display_id: c.conversation_display_id ?? c.conversation_id ?? null,
      contact_name: c.contact_name ?? null,
      phone_number: c.phone_number,
      conversation_labels: c.conversation_labels ?? "sin_etiqueta",
      llamada_por_tel: c.llamada_por_tel ?? false,
      venta: c.venta ?? false,
    }));

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-2 pt-10 sm:pt-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
            <Phone className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase italic">
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
