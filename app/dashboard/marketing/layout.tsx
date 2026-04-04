import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard/finanzas");
  }

  return <>{children}</>;
}
