import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son requeridos" }, { status: 400 });
  }

  const supabase = await createClient();

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash, name: name ?? null })
    .select("id, email, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
