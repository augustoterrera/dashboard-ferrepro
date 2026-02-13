'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setContactStatus(input: {
  phone_number: string;
  contact_name?: string | null;
  llamada_por_tel?: boolean | null;
  venta?: boolean | null;
  conversation_id?: number | null;
  conversation_display_id?: number | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('crm_set_contact_status', {
    p_phone: input.phone_number,
    p_name: input.contact_name ?? null,
    p_llamada: input.llamada_por_tel ?? null,
    p_venta: input.venta ?? null,
    p_conversation_id: input.conversation_id ?? null,
    p_conversation_display_id: input.conversation_display_id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/operativo/leads');
  revalidatePath('/dashboard/operativo/clientes');
}

export async function exportClientsToExcel() {
  const supabase = await createClient();

  // Traer todos los contactos con venta=true
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('phone_number, contact_name, llamada_por_tel, venta, conversation_id, conversation_display_id, created_at, updated_at')
    .eq('venta', true)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}