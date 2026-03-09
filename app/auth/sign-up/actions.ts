"use server";
import { createClient } from "@/lib/supabase/admin";

export async function register(email: string, password: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.signUp({ email, password });
  if (user.user) {
    const { error } = await supabase.auth.admin.updateUserById(user.user.id, {
      app_metadata: { punto_venta: 1 },
    });
    console.log(error);
  }
}
