import { db } from "@/lib/db";

export async function getInvoices() {
    const data = await db`SELECT * FROM facturas WHERE id_factura = ${1562070}`;
    console.log("data:", data);
}
