"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

const COPY = {
  reset: {
    heading: "Nueva",
    highlight: "Contraseña",
    subtitle: "Ingresá tu nueva contraseña para recuperar el acceso",
    passwordLabel: "Nueva contraseña",
    submit: "Guardar contraseña",
    submitting: "Guardando...",
  },
  invite: {
    heading: "Creá tu",
    highlight: "Contraseña",
    subtitle: "Elegí una contraseña para activar tu cuenta",
    passwordLabel: "Contraseña",
    submit: "Activar mi cuenta",
    submitting: "Activando...",
  },
} as const;

export function UpdatePasswordForm({
  className,
  variant = "reset",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { variant?: keyof typeof COPY }) {
  const copy = COPY[variant];
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!token) throw new Error("Token inválido o expirado");
      if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
      if (password !== confirm) throw new Error("Las contraseñas no coinciden");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Error al actualizar la contraseña");
      }

      router.push("/auth/login");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Débil", "Media", "Fuerte"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"][strength];
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">
            {copy.heading} <span className="text-purple-500 not-italic">{copy.highlight}</span>
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {copy.subtitle}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword}>
          <div className="flex flex-col gap-5">

            {/* Nueva contraseña */}
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {copy.passwordLabel}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-700/50 bg-slate-900/50 pr-10 text-white placeholder:text-slate-600 focus-visible:ring-purple-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= strength ? strengthColor : "bg-slate-700",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="grid gap-2">
              <Label htmlFor="confirm" className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Repetir contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repetí tu nueva contraseña"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={cn(
                    "border-slate-700/50 bg-slate-900/50 pr-10 text-white placeholder:text-slate-600 focus-visible:ring-purple-500/50",
                    passwordsMatch && "border-green-600/50 focus-visible:ring-green-500/50",
                    passwordsMismatch && "border-red-700/50 focus-visible:ring-red-500/50",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {passwordsMatch && (
                <p className="text-[11px] font-medium text-green-500">Las contraseñas coinciden</p>
              )}
              {passwordsMismatch && (
                <p className="text-[11px] font-medium text-red-400">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 font-bold uppercase tracking-widest text-white hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? copy.submitting : copy.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
