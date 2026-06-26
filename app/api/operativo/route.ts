import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "@/lib/get-token";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `https://ggwebhookgg.waichatt.com/webhook/chatwoot-db`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error al obtener datos");
    }

    const text = await response.text();
    if (!text.trim()) return NextResponse.json([]);

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al conectar con n8n" },
      { status: 500 },
    );
  }
}
