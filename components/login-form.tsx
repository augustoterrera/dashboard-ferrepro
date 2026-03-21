"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) throw new Error("Email o contraseña incorrectos");
      router.push("/dashboard/finanzas");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">
            Iniciar <span className="text-purple-500 not-italic">Sesión</span>
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Ingresá tu correo para acceder a tu cuenta
          </p>
        </div>

        <form onSubmit={handleLogin}>
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

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-widest text-slate-400"
                >
                  Contraseña
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto text-[11px] font-medium text-slate-500 underline-offset-4 hover:text-purple-400 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
