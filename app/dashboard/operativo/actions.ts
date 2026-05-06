'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/get-session';

const ALLOWED_OPERATIVO_ROLES = new Set(['admin', 'branch', 'superadmin']);

function assertOperativoAccess(role?: string | null) {
  if (!role || !ALLOWED_OPERATIVO_ROLES.has(role)) {
    throw new Error('No autorizado');
  }
}

function normalizePhone(phone: unknown) {
  if (typeof phone !== 'string') throw new Error('Teléfono inválido');

  const value = phone.trim();
  if (value.length < 6 || value.length > 32) throw new Error('Teléfono inválido');
  if (!/^[+\d\s().-]+$/.test(value)) throw new Error('Teléfono inválido');

  return value;
}

function optionalBoolean(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'boolean') throw new Error('Estado inválido');
  return value;
}

function optionalPositiveInteger(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('ID inválido');
  }
  return value;
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error('Texto inválido');

  const text = value.trim();
  return text.length > 0 ? text.slice(0, maxLength) : null;
}

export async function setContactStatus(input: {
  phone_number: string;
  contact_name?: string | null;
  llamada_por_tel?: boolean | null;
  venta?: boolean | null;
  conversation_id?: number | null;
  conversation_display_id?: number | null;
}) {
  const session = await getSession();
  assertOperativoAccess(session?.user?.role);

  const phone = normalizePhone(input.phone_number);
  const llamada = optionalBoolean(input.llamada_por_tel);
  const venta = optionalBoolean(input.venta);

  if (llamada === null && venta === null) {
    throw new Error('Sin cambios para guardar');
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc('crm_set_contact_status', {
    p_phone: phone,
    p_name: optionalText(input.contact_name, 120),
    p_llamada: llamada,
    p_venta: venta,
    p_conversation_id: optionalPositiveInteger(input.conversation_id),
    p_conversation_display_id: optionalPositiveInteger(input.conversation_display_id),
  });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/operativo/leads');
  revalidatePath('/dashboard/operativo/clientes');
}

export async function exportClientsToExcel() {
  const session = await getSession();
  assertOperativoAccess(session?.user?.role);

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
