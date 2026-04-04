import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user?.role !== "superadmin") {
    redirect("/dashboard/finanzas");
  }

  return <>{children}</>;
}
