// Constantes client-safe del CRM (sin imports de server). Se pueden usar desde client components
// sin arrastrar lib/supabase/server (next/headers).
export const CRM_PAGE_SIZES = [10, 20, 50, 100] as const;
