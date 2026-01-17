import { createClient } from "@/lib/supabase/client";

export async function getInvoices() {
    const supabase =  await createClient()
    const {data, error} = await supabase.from("facturas").select("*").eq("id_factura", 1562070)
    console.log("data:", data, "error:", error );
}