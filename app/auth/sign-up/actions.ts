"use server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function register(email: string, password: string) {
  const supabase = await createClient();

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash })
    .select("id, email")
    .single();

  if (error) throw new Error(error.message);

  return data;
}
