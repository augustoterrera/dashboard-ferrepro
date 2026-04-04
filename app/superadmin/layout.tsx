import { connection } from "next/server";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { SuperadminShell } from "@/components/layout/SuperadminShell";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getSession();

  if (!session || session.user?.role !== "superadmin") {
    redirect("/auth/login");
  }

  return (
    <SuperadminShell user={{ name: session.user?.name, email: session.user?.email }}>
      {children}
    </SuperadminShell>
  );
}
