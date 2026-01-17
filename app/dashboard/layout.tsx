'use client';
import { SidebarShell } from '@/components/layout/SiderbarShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarShell>{children}</SidebarShell>
  );
}
