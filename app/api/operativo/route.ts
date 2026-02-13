import { NextResponse } from "next/server";

export async function GET() {
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al conectar con n8n" },
      { status: 500 },
    );
  }
}
