"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Error al enviar el email");
      }
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-sm">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20 ring-1 ring-purple-500/30">
              <svg className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tight text-white">
                Revisá tu <span className="text-purple-500 not-italic">email</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Si tu cuenta existe, recibirás un enlace para restablecer tu contraseña. El enlace expira en{" "}
                <span className="font-semibold text-white">15 minutos</span>.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-purple-400"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">
                Recuperar <span className="text-purple-500 not-italic">Contraseña</span>
              </h1>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Te enviamos un enlace para restablecer tu acceso
              </p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-600 focus-visible:ring-purple-500/50"
                  />
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
                  {isLoading ? "Enviando..." : "Enviar enlace"}
                </Button>

                <div className="text-center text-[11px] font-medium text-slate-500">
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    href="/auth/login"
                    className="text-slate-400 underline-offset-4 hover:text-purple-400 hover:underline"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
