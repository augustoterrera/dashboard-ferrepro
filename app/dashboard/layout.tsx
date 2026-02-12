import { Suspense } from "react";
import DashboardGate from "./DashboardGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner animado */}
            <div className="relative h-12 w-12">
              {/* Círculo de fondo */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-400/20"></div>
              {/* Círculo animado */}
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>

            {/* Texto con estilo */}
            <p className="text-sm font-medium tracking-wider text-slate-200 animate-pulse">
              CARGANDO DASHBOARD
            </p>
          </div>
        </div>
      }
    >
      <DashboardGate>{children}</DashboardGate>
    </Suspense>
  );
}
