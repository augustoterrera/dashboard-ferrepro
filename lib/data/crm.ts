import { createClient } from '@/lib/supabase/server';
import { CRM_PAGE_SIZES } from '@/lib/data/crm-constants';

// Búsqueda + paginación de crm_contacts del lado del servidor: la DB filtra y pagina, el front
// recibe solo la página visible (+ el total para los controles). Sin traer todo a memoria.

const DEFAULT_PAGE_SIZE = 20;

const COLUMNS =
  'phone_number, contact_name, llamada_por_tel, venta, conversation_id, conversation_display_id, conversation_labels, updated_at';

export type CrmRow = {
  phone_number: string | null;
  contact_name: string | null;
  llamada_por_tel: boolean | null;
  venta: boolean | null;
  conversation_id: number | null;
  conversation_display_id: number | null;
  conversation_labels: string | null;
};

// Limpia el término: saca lo que rompe la sintaxis de or() de PostgREST ( , ( ) * % ).
function sanitize(raw?: string): string {
  return (raw ?? '').replace(/[,()*%\\]/g, ' ').trim().slice(0, 60);
}

function clampPageSize(raw?: string): number {
  const n = Number(raw);
  return (CRM_PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

function parsePage(raw?: string): number {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

export async function fetchCrmContacts(args: {
  scope: 'leads' | 'clientes';
  q?: string;
  page?: string;
  pageSize?: string;
}): Promise<{ rows: CrmRow[]; total: number; page: number; pageSize: number; term: string }> {
  const supabase = await createClient();

  const term = sanitize(args.q);
  const pageSize = clampPageSize(args.pageSize);
  const page = parsePage(args.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('crm_contacts').select(COLUMNS, { count: 'exact' });

  // Lead vs cliente = el flag venta. Un contacto sin teléfono no sirve en el CRM.
  query =
    args.scope === 'clientes'
      ? query.eq('venta', true)
      : query.or('venta.is.false,venta.is.null').not('phone_number', 'is', null);

  // Búsqueda por nombre / teléfono / conversation id (los dos ids si el término es numérico).
  if (term) {
    const ors = [`contact_name.ilike.*${term}*`, `phone_number.ilike.*${term}*`];
    if (/^\d+$/.test(term)) {
      ors.push(`conversation_id.eq.${term}`, `conversation_display_id.eq.${term}`);
    }
    query = query.or(ors.join(','));
  }

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return { rows: (data ?? []) as CrmRow[], total: count ?? 0, page, pageSize, term };
}
