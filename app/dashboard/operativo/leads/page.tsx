// app/dashboard/operativo/leads/page.tsx
import { fetchCrmContacts } from "@/lib/data/crm";
import { CrmSearchBar } from "@/components/operativo/CrmSearchBar";
import { PaginatedCrmTable } from "@/components/operativo/PaginatedCrmTable";
import { Phone } from "lucide-react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const sp = await searchParams;
  const { rows: data, total, page, pageSize } = await fetchCrmContacts({
    scope: "leads",
    q: sp.q,
    page: sp.page,
    pageSize: sp.pageSize,
  });

  const rows = data.map((c, idx) => ({
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

      <CrmSearchBar />
      <PaginatedCrmTable rows={rows} total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
